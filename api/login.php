<?php
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$identifier = trim($input['username'] ?? $input['email'] ?? '');
$password   = $input['password'] ?? '';

if ($identifier === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'username/email and password are required']);
    exit;
}

$stmt = $pdo->prepare(
    "SELECT id, username, email, password_hash
     FROM users
     WHERE username = ? OR email = ?
     LIMIT 1"
);
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'invalid credentials']);
    exit;
}

echo json_encode([
    'success' => true,
    'user_id' => (int)$user['id'],
    'username' => $user['username'],
    'email' => $user['email'],
]);
