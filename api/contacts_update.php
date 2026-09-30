<?php

require_once __DIR__ . '/helpers.php';

requireMethod('PUT');

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

$name = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$address = trim($input['address'] ?? '');
$notes = trim($input['notes'] ?? '');

if (!$id || $id < 1) {
    sendJson([
        'success' => false,
        'error' => 'Valid contact ID is required'
    ], 400);
}

if ($name === '') {
    sendJson([
        'success' => false,
        'error' => 'Contact name is required'
    ], 400);
}

if (strlen($name) > 100) {
    sendJson([
        'success' => false,
        'error' => 'Contact name must be 100 characters or fewer'
    ], 400);
}

if (strlen($phone) > 30) {
    sendJson([
        'success' => false,
        'error' => 'Phone number must be 30 characters or fewer'
    ], 400);
}

if (strlen($email) > 255) {
    sendJson([
        'success' => false,
        'error' => 'Email must be 255 characters or fewer'
    ], 400);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson([
        'success' => false,
        'error' => 'Invalid email address'
    ], 400);
}

if (strlen($address) > 255) {
    sendJson([
        'success' => false,
        'error' => 'Address must be 255 characters or fewer'
    ], 400);
}

try {
    /*
     * The user_id condition is critical.
     *
     * Even if a user discovers another contact's ID,
     * they cannot modify it.
     */
    $stmt = $pdo->prepare(
        "UPDATE contacts
         SET
            name = ?,
            phone = ?,
            email = ?,
            address = ?,
            notes = ?
         WHERE id = ?
         AND user_id = ?"
    );

    $stmt->execute([
        $name,
        $phone !== '' ? $phone : null,
        $email !== '' ? $email : null,
        $address !== '' ? $address : null,
        $notes !== '' ? $notes : null,
        $id,
        $userId
    ]);

    /*
     * rowCount() can be zero when the submitted values are
     * identical to the existing values, so check ownership
     * separately before deciding the contact does not exist.
     */
    $check = $pdo->prepare(
        "SELECT id
         FROM contacts
         WHERE id = ?
         AND user_id = ?
         LIMIT 1"
    );

    $check->execute([
        $id,
        $userId
    ]);

    if (!$check->fetch()) {
        sendJson([
            'success' => false,
            'error' => 'Contact not found'
        ], 404);
    }

    sendJson([
        'success' => true,
        'message' => 'Contact updated successfully',
        'contact' => [
            'id' => (int)$id,
            'name' => $name,
            'phone' => $phone,
            'email' => $email,
            'address' => $address,
            'notes' => $notes
        ]
    ]);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' => 'Unable to update contact'
    ], 500);
}