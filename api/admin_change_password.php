<?php

require_once __DIR__ . '/helpers.php';

requireMethod('PUT');
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

$userId = filter_var(
    $input['user_id'] ?? null,
    FILTER_VALIDATE_INT
);

$newPassword = $input['new_password'] ?? '';

if (!$userId || $userId < 1) {
    sendJson([
        'success' => false,
        'error' => 'Valid user_id is required'
    ], 400);
}

if ($newPassword === '') {
    sendJson([
        'success' => false,
        'error' => 'New password is required'
    ], 400);
}

if (strlen($newPassword) < 8) {
    sendJson([
        'success' => false,
        'error' => 'Password must be at least 8 characters'
    ], 400);
}

try {
    $check = $pdo->prepare(
        "SELECT
            id,
            username
         FROM users
         WHERE id = ?
         LIMIT 1"
    );

    $check->execute([$userId]);

    $targetUser = $check->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser) {
        sendJson([
            'success' => false,
            'error' => 'User not found'
        ], 404);
    }

    $passwordHash = password_hash(
        $newPassword,
        PASSWORD_DEFAULT
    );

    $stmt = $pdo->prepare(
        "UPDATE users
         SET
            password_hash = ?,
            must_change_password = 0
         WHERE id = ?"
    );

    $stmt->execute([
        $passwordHash,
        $userId
    ]);

    sendJson([
        'success' => true,
        'message' => 'Password changed successfully',
        'user' => [
            'id' => (int)$targetUser['id'],
            'username' => $targetUser['username']
        ]
    ]);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' => 'Unable to change password'
    ], 500);
}