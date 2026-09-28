<?php

header('Content-Type: application/json');

require_once 'config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);

    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON'
    ]);

    exit;
}

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => 'Username and password are required'
    ]);

    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT
            id,
            username,
            full_name,
            password_hash,
            role,
            is_disabled
         FROM users
         WHERE username = ?
         LIMIT 1"
    );

    $stmt->execute([$username]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'error' => 'Invalid username or password'
        ]);

        exit;
    }

    if ((int)$user['is_disabled'] === 1) {
        http_response_code(403);

        echo json_encode([
            'success' => false,
            'error' => 'Account disabled. Contact an administrator.'
        ]);

        exit;
    }

    session_regenerate_id(true);

    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];

    echo json_encode([
        'success' => true,
        'user_id' => (int)$user['id'],
        'username' => $user['username'],
        'full_name' => $user['full_name'],
        'role' => $user['role']
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => 'Login failed'
    ]);
}