# CI/CD and deployment

```
Every push / pull request             Push to main (after the tests pass)
┌──────────── test ────────────┐      ┌──────────────── deploy ───────────────┐
│ php -l on every PHP file     │ ───▶ │ rsync the app to the droplet over SSH │
│ docker compose up (seeded)   │      │ (skips everything in .deployignore)   │
│ Bruno API tests (bruno/)     │      │ smoke-test the live site              │
└──────────────────────────────┘      └───────────────────────────────────────┘
```

The workflow is `.github/workflows/ci-cd.yml`. Tests run on every branch right away.
Deploys stay off until the setup below is finished and `DEPLOY_ENABLED` is set.

The pipeline never runs `sql/schema.sql` (it starts with `DROP TABLE`). Apply schema
changes to the live database by hand.

## Run the tests locally

```bash
cp .env.example .env        # first time only (or if a pull deleted your .env); set DB_PASSWORD
docker compose up -d
cd bruno
npx @usebruno/cli run --env local --disable-cookies
```

`docker compose down -v` wipes the local database back to the seed data. Every request, its
expected response and the full API reference are in `docs/api-testing.md`.

For the live Bruno demo, open the `bruno/` folder in the Bruno app, pick the
`production` environment, enter `seedPassword`, and run requests 02 to 04.

## One-time droplet setup

Run these on the droplet unless a step says otherwise. Replace the placeholders.

### 1. Back up the web root

`rsync --delete` makes the web root match the repo, so the deploy path must hold only
this app.

```bash
sudo tar czf ~/www-backup-$(date +%F).tgz -C /var/www html
```

### 2. Put `.env` one folder above the web root

`api/config.php` reads its database settings from `/var/www/.env`, one folder above the
web root `/var/www/html`, so Apache can never serve it. Move the existing `.env` there
(don't delete it). This must happen **before** the droplet pulls this version of the
repo, because git deletes a file it stops tracking. Moving it can't affect the running
site, since the current code doesn't read it:

```bash
sudo cp /var/www/html/.env ~/env-before-move.bak
sudo mv /var/www/html/.env /var/www/.env
sudo chown root:www-data /var/www/.env
sudo chmod 640 /var/www/.env
sudo nano /var/www/.env
```

The file still holds the old Colors App tutorial settings (`ColorsAppDB`, `ColorsAppUser`,
and a `DB_BANE` typo). While it's open, update it to this app's values, the ones typed
into the old `api/config.php`. `.env.example` shows the keys:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lamp_project
DB_USER=lampuser
DB_PASSWORD="current-password"
DB_CHARSET=utf8mb4
```

Put quotes around a password that contains spaces or `#`. Now deploy the new code.

We kept the existing database password. It appears in older commits of this repo, but
MySQL only accepts connections from the droplet itself, so it can't be used from outside.
Check that MySQL only listens locally. The address should be `127.0.0.1`:

```bash
sudo ss -tlnp | grep 3306
```

If you ever want to change the password, change it in MySQL and `/var/www/.env` together:

```bash
sudo mysql -e "ALTER USER 'lampuser'@'localhost' IDENTIFIED BY 'NEW-STRONG-PASSWORD';"
sudo nano /var/www/.env
```

### 3. Block hidden and setup files, and move the SQL files out

`apache/lamp-security.conf` blocks hidden files (`.env`, `.git`) and project files such
as `.sql` and `.md`. The Docker image already uses it; install the same file on the
droplet. The SQL files list the seed passwords, so move them out of the web root too:

```bash
sudo curl -fsSL https://raw.githubusercontent.com/MsMarion/LAMP/main/apache/lamp-security.conf -o /etc/apache2/conf-available/zz-lamp-security.conf
sudo a2enconf zz-lamp-security && sudo systemctl reload apache2
mkdir -p ~/lamp-setup && sudo mv /var/www/html/sql /var/www/html/api/schema.sql ~/lamp-setup/
curl -I https://lamp.finnick.party/.env
```

The last command should now report `403` or `404`.

### 4. Create a deploy user that can only copy files

The deploy user is not in the `www-data` group, so it can't read `/var/www/.env`. Its key
is locked to `rrsync -wo`: it can write into `/var/www/html` and nothing else (no shell, no
downloads, no `..` paths, no tunnels). Apache reads the files as "other" (644 / 755), and
PHP can no longer change its own code.

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo chown -R deploy:deploy /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} +
sudo find /var/www/html -type f -exec chmod 644 {} +

sudo install -d -m 700 /root/lamp-deploy-key
sudo ssh-keygen -t ed25519 -N "" -C "github-actions-deploy" -f /root/lamp-deploy-key/id_ed25519
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "command=\"/usr/bin/rrsync -wo /var/www/html\",restrict $(sudo cat /root/lamp-deploy-key/id_ed25519.pub)" \
  | sudo tee /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
awk '{print "165.227.80.56,lamp.finnick.party", $1, $2}' /etc/ssh/ssh_host_*_key.pub \
  | sudo tee /root/lamp-deploy-key/known_hosts
```

### 5. Add the GitHub secrets and variables

`rrsync` treats the deploy path as relative to `/var/www/html`, so `DEPLOY_PATH` is `.`.
From your own computer (it copies the key straight from the droplet to GitHub):

```bash
gh secret set DEPLOY_HOST --body "165.227.80.56"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_PATH --body "."
ssh LAMP-Droplet-26 "cat /root/lamp-deploy-key/known_hosts" | gh secret set DEPLOY_KNOWN_HOSTS
ssh LAMP-Droplet-26 "cat /root/lamp-deploy-key/id_ed25519" | gh secret set DEPLOY_SSH_KEY
gh variable set SITE_URL --body "https://lamp.finnick.party"
gh variable set DEPLOY_ENABLED --body "true"
```

To undo a bad deploy, revert the commit on `main`; the revert deploys like any other push.
To turn deploys off, set `DEPLOY_ENABLED` to `false`.

### 6. Protect main

**Settings → Branches → Add branch protection rule** for `main`: require a pull request
and require the status check **Lint and API tests** to pass before merging.
