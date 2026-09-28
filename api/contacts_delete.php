<?php

require_once __DIR__ . '/helpers.php';

requireMethod('DELETE');

$user = requireLogin();
$userId = (int)$user['id'];

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    sendJson([
        'success' => false,
        'error' => 'Invalid JSON'
    ], 400);
}

$id = filter_var(
    $input['id'] ?? null,
    FILTER_VALIDATE_INT
);

if (!$id || $id < 1) {
    sendJson([
        'success' => false,
        'error' => 'Valid contact ID is required'
    ], 400);
}

try {
    /*
     * Ownership is enforced directly in the DELETE statement.
     */
    $stmt = $pdo->prepare(
        "DELETE FROM contacts
         WHERE id = ?
         AND user_id = ?"
    );

    $stmt->execute([
        $id,
        $userId
    ]);

    if ($stmt->rowCount() === 0) {
        sendJson([
            'success' => false,
            'error' => 'Contact not found'
        ], 404);
    }

    sendJson([
        'success' => true,
        'message' => 'Contact deleted successfully'
    ]);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' => 'Unable to delete contact'
    ], 500);
}