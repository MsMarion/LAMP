<?php

require_once __DIR__ . '/helpers.php';

requireMethod('POST');

$user = requireLogin();
$userId = (int)$user['id'];

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    sendJson([
        'success' => false,
        'error' => 'Invalid JSON'
    ], 400);
}

$name = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$address = trim($input['address'] ?? '');
$notes = trim($input['notes'] ?? '');

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
    $stmt = $pdo->prepare(
        "INSERT INTO contacts
            (user_id, name, phone, email, address, notes)
         VALUES
            (?, ?, ?, ?, ?, ?)"
    );

    $stmt->execute([
        $userId,
        $name,
        $phone !== '' ? $phone : null,
        $email !== '' ? $email : null,
        $address !== '' ? $address : null,
        $notes !== '' ? $notes : null
    ]);

    sendJson([
        'success' => true,
        'message' => 'Contact created successfully',
        'contact' => [
            'id' => (int)$pdo->lastInsertId(),
            'name' => $name,
            'phone' => $phone,
            'email' => $email,
            'address' => $address,
            'notes' => $notes
        ]
    ], 201);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' => 'Unable to create contact'
    ], 500);
}