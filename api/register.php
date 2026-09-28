<?php

header('Content-Type: application/json');

require_once 'config.php';

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
$fullName = trim($input['full_name'] ?? '');

if ($username === '' || $password === '' || $fullName === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Username, password, and full name are required'
    ]);
    exit;
}

if (strlen($username) < 3 || strlen($username) > 50) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Username must be between 3 and 50 characters'
    ]);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Password must be at least 8 characters'
    ]);
    exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO users
            (username, full_name, password_hash, role, is_disabled)
         VALUES
            (?, ?, ?, 'user', 0)"
    );

    $stmt->execute([
        $username,
        $fullName,
        $passwordHash
    ]);

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'user_id' => (int)$pdo->lastInsertId(),
        'username' => $username,
        'full_name' => $fullName,
        'role' => 'user'
    ]);

} catch (PDOException $e) {

    if (isset($e->errorInfo[1]) && (int)$e->errorInfo[1] === 1062) {
        http_response_code(409);

        echo json_encode([
            'success' => false,
            'error' => 'Username already exists'
        ]);

        exit;
    }

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => 'Registration failed'
    ]);
}