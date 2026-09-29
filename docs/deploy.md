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
docker compose up -d
cd bruno
npx @usebruno/cli run --env local
```

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

### 2. Move `.env` out of the web root

`api/config.php` reads its database settings from `.env` one folder above the web root
(`/var/www/.env` when the site lives in `/var/www/html`), so Apache can never serve it.
The code running on the droplet today doesn't read `.env` at all, so moving it changes
nothing on the live site.

```bash
sudo mv /var/www/html/.env /var/www/.env
sudo sed -i 's/^DB_BANE=/DB_NAME=/' /var/www/.env
sudo chown root:www-data /var/www/.env
sudo chmod 640 /var/www/.env
sudo nano /var/www/.env
```

The `sed` line fixes the old `DB_BANE` typo. In the editor, check each value against what
the site uses today (the values typed into the old `api/config.php`). `.env.example`
lists the keys. On the droplet `DB_HOST` is usually `localhost` and `DB_PORT` is `3306`;
`3307` is only the Docker port on our laptops. Put quotes around a password that
contains spaces or `#`.

Then deploy the new code. The old password was public, so change it and update `.env`
right away:

```bash
sudo mysql -e "SELECT user, host FROM mysql.user WHERE user = 'lampuser';"
sudo mysql -e "ALTER USER 'lampuser'@'localhost' IDENTIFIED BY 'NEW-STRONG-PASSWORD';"
sudo nano /var/www/.env
```

Use the host the first command printed if it isn't `localhost`. Finally, check that MySQL
only listens locally. The address should be `127.0.0.1`:

```bash
sudo ss -tlnp | grep 3306
```

### 3. Block hidden files and move setup files out of the web root

Even with `.env` moved, block every dotfile in Apache as a second layer. This also covers
`.git/` if the web root was ever a `git clone`. The SQL files list the seed passwords, so
move them out of the web root too:

```bash
echo '<FilesMatch "^\.">
    Require all denied
</FilesMatch>
<DirectoryMatch "/\.">
    Require all denied
</DirectoryMatch>' | sudo tee /etc/apache2/conf-available/deny-dotfiles.conf
sudo a2enconf deny-dotfiles && sudo systemctl reload apache2
mkdir -p ~/lamp-setup && sudo mv /var/www/html/sql /var/www/html/api/schema.sql ~/lamp-setup/
curl -I https://lamp.finnick.party/.env
```

The last command should now report `403` or `404`.

### 4. Create a deploy user

```bash
sudo apt install -y rsync
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG www-data deploy
sudo chown -R deploy:www-data /var/www/html
sudo chmod -R g+rX /var/www/html
```

On **your own computer** (not the droplet), make a key that only GitHub will use:

```bash
ssh-keygen -t ed25519 -f lamp_deploy_key -N "" -C "github-actions-deploy"
ssh-keyscan -H lamp.finnick.party > lamp_known_hosts
```

Back on the droplet, authorize the public key (`lamp_deploy_key.pub`):

```bash
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "PASTE-THE-PUBLIC-KEY-LINE" | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 5. Add the GitHub secrets and variables

Repo **Settings → Secrets and variables → Actions**, or from the folder with the key files:

```bash
gh secret set DEPLOY_HOST --body "lamp.finnick.party"
gh secret set DEPLOY_USER --body "deploy"
gh secret set DEPLOY_PATH --body "/var/www/html"
gh secret set DEPLOY_SSH_KEY < lamp_deploy_key
gh secret set DEPLOY_KNOWN_HOSTS < lamp_known_hosts
gh variable set SITE_URL --body "https://lamp.finnick.party"
gh variable set DEPLOY_ENABLED --body "true"
```

Then delete `lamp_deploy_key` from your computer. GitHub keeps the only copy it needs.

### 6. Protect main

**Settings → Branches → Add branch protection rule** for `main`: require a pull request
and require the status check **Lint and API tests** to pass before merging.
