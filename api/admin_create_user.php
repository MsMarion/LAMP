<?php

require_once __DIR__ . '/helpers.php';

requireMethod('POST');
requireAdmin();

$input = json_decode(
    file_get_contents('php://input'),
    true
);

if (!is_array($input)) {
    sendJson([
        'success' => false,
        'error' => 'Invalid JSON'
    ], 400);
}

$username = trim($input['username'] ?? '');
$fullName = trim($input['full_name'] ?? '');
$password = $input['password'] ?? '';
$role = trim($input['role'] ?? '');

if (
    $username === '' ||
    $fullName === '' ||
    $password === '' ||
    $role === ''
) {
    sendJson([
        'success' => false,
        'error' =>
            'username, full_name, password, and role are required'
    ], 400);
}

if (
    strlen($username) < 3 ||
    strlen($username) > 50
) {
    sendJson([
        'success' => false,
        'error' =>
            'Username must be between 3 and 50 characters'
    ], 400);
}

if (strlen($fullName) > 100) {
    sendJson([
        'success' => false,
        'error' =>
            'Full name must be 100 characters or fewer'
    ], 400);
}

if (strlen($password) < 8) {
    sendJson([
        'success' => false,
        'error' =>
            'Password must be at least 8 characters'
    ], 400);
}

if (!in_array($role, ['admin', 'user'], true)) {
    sendJson([
        'success' => false,
        'error' =>
            'Role must be admin or user'
    ], 400);
}

$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO users
            (
                username,
                full_name,
                password_hash,
                role,
                is_disabled,
                must_change_password
            )
         VALUES
            (?, ?, ?, ?, 0, 0)"
    );

    $stmt->execute([
        $username,
        $fullName,
        $passwordHash,
        $role
    ]);

    sendJson([
        'success' => true,
        'message' => 'User created successfully',
        'user' => [
            'id' => (int)$pdo->lastInsertId(),
            'username' => $username,
            'full_name' => $fullName,
            'role' => $role,
            'is_disabled' => false
        ]
    ], 201);

} catch (PDOException $e) {
    if (
        isset($e->errorInfo[1]) &&
        (int)$e->errorInfo[1] === 1062
    ) {
        sendJson([
            'success' => false,
            'error' => 'Username already exists'
        ], 409);
    }

    sendJson([
        'success' => false,
        'error' => 'Unable to create user'
    ], 500);
}