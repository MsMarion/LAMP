<?php
// DB connection + JSON header.
//
// Credentials never live in this repo. They come from, in order:
//   1. Environment variables DB_HOST / DB_NAME / DB_USER / DB_PASS
//      (docker-compose.yml sets these for local development).
//   2. An INI file outside the web root, /etc/lamp-app/db.ini by default
//      (override the path with DB_CONFIG). See docs/deploy.md.

$config = [
    'host' => getenv('DB_HOST'),
    'name' => getenv('DB_NAME'),
    'user' => getenv('DB_USER'),
    'pass' => getenv('DB_PASS'),
];

if ($config['pass'] === false) {
    $iniPath = getenv('DB_CONFIG') ?: '/etc/lamp-app/db.ini';
    $ini = is_readable($iniPath) ? parse_ini_file($iniPath) : false;

    if ($ini !== false) {
        $config['host'] = $ini['DB_HOST'] ?? $config['host'];
        $config['name'] = $ini['DB_NAME'] ?? $config['name'];
        $config['user'] = $ini['DB_USER'] ?? $config['user'];
        $config['pass'] = $ini['DB_PASS'] ?? false;
    }
}

if ($config['pass'] === false) {
    error_log('Database credentials are not configured (see docs/deploy.md).');
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Server is not configured']);
    exit;
}

$host = $config['host'] ?: 'localhost';
$db   = $config['name'] ?: 'lamp_project';
$user = $config['user'] ?: 'lampuser';
$pass = $config['pass'];

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
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
