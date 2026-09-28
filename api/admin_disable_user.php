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

$isDisabled = $input['is_disabled'] ?? null;

if (!$userId || $userId < 1) {
    sendJson([
        'success' => false,
        'error' => 'Valid user_id is required'
    ], 400);
}

if (
    $isDisabled !== true &&
    $isDisabled !== false &&
    $isDisabled !== 1 &&
    $isDisabled !== 0 &&
    $isDisabled !== "1" &&
    $isDisabled !== "0"
) {
    sendJson([
        'success' => false,
        'error' => 'is_disabled must be true or false'
    ], 400);
}

$disabledValue =
    filter_var(
        $isDisabled,
        FILTER_VALIDATE_BOOLEAN
    ) ? 1 : 0;

try {
    $check = $pdo->prepare(
        "SELECT
            id,
            username,
            role,
            is_disabled
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

    $stmt = $pdo->prepare(
        "UPDATE users
         SET is_disabled = ?
         WHERE id = ?"
    );

    $stmt->execute([
        $disabledValue,
        $userId
    ]);

    sendJson([
        'success' => true,
        'message' => $disabledValue
            ? 'User disabled successfully'
            : 'User enabled successfully',
        'user' => [
            'id' => (int)$targetUser['id'],
            'username' => $targetUser['username'],
            'role' => $targetUser['role'],
            'is_disabled' => (bool)$disabledValue
        ]
    ]);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' => 'Unable to update user status'
    ], 500);
}