<?php
require 'config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'username and password are required']);
    exit;
}

$stmt = $pdo->prepare(
    "SELECT id, username, full_name, password_hash, role, is_disabled
     FROM users
     WHERE username = ?
     LIMIT 1"
);
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'invalid credentials']);
    exit;
}

if ((int)$user['is_disabled'] === 1) {
    http_response_code(403);
    echo json_encode(['error' => 'account disabled — contact an administrator']);
    exit;
}

$_SESSION['user_id']  = (int)$user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['role']     = $user['role'];

echo json_encode([
    'success' => true,
    'user_id'   => (int)$user['id'],
    'username'  => $user['username'],
    'full_name' => $user['full_name'],
    'role'      => $user['role'],
]);