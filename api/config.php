<?php
// DB connection + JSON header.
//
// Settings come from, in order:
//   1. Environment variables (docker-compose.yml sets these for local development).
//   2. A .env file one folder ABOVE the web root, e.g. /var/www/.env when the site
//      lives in /var/www/html, so Apache can never serve it. Override the path with
//      DB_ENV_FILE. See .env.example for the keys and docs/deploy.md for setup.

function loadEnvFile($path)
{
    $values = [];

    if (!is_readable($path)) {
        return $values;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);

        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }

        list($key, $value) = array_map('trim', explode('=', $line, 2));

        // Strip matching surrounding quotes: DB_PASSWORD="p@ss!"
        if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && substr($value, -1) === $value[0]) {
            $value = substr($value, 1, -1);
        }

        $values[$key] = $value;
    }

    return $values;
}

$envFile = loadEnvFile(getenv('DB_ENV_FILE') ?: dirname(__DIR__, 2) . '/.env');

function setting($key, $envFile, $default = null)
{
    $value = getenv($key);

    if ($value !== false && $value !== '') {
        return $value;
    }

    return $envFile[$key] ?? $default;
}

$host    = setting('DB_HOST', $envFile, 'localhost');
$port    = setting('DB_PORT', $envFile, '3306');
$db      = setting('DB_NAME', $envFile, 'lamp_project');
$user    = setting('DB_USER', $envFile, 'lampuser');
$pass    = setting('DB_PASSWORD', $envFile);
$charset = setting('DB_CHARSET', $envFile, 'utf8mb4');

if ($pass === null) {
    error_log('Database password is not configured (see .env.example and docs/deploy.md).');
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Server is not configured']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$db;charset=$charset",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    // Log the real reason on the server; never send it to the browser.
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

header('Content-Type: application/json');
