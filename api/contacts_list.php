<?php

require_once __DIR__ . '/helpers.php';

requireMethod('GET');

$user = requireLogin();
$userId = (int)$user['id'];

$q = trim($_GET['q'] ?? '');

if ($q === '') {
    sendJson([
        'success' => true,
        'query' => '',
        'contacts' => []
    ]);
}

$search = '%' . $q . '%';

try {
    $stmt = $pdo->prepare(
        "SELECT
            id,
            name,
            phone,
            email,
            address,
            notes,
            created_at,
            updated_at
         FROM contacts
         WHERE user_id = ?
         AND (
            name LIKE ?
            OR phone LIKE ?
            OR email LIKE ?
            OR address LIKE ?
            OR notes LIKE ?
         )
         ORDER BY name ASC
         LIMIT 50"
    );

    $stmt->execute([
        $userId,
        $search,
        $search,
        $search,
        $search,
        $search
    ]);

    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($contacts as &$contact) {
        $contact['id'] = (int)$contact['id'];
    }

    sendJson([
        'success' => true,
        'query' => $q,
        'contacts' => $contacts
    ]);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' => 'Unable to search contacts'
    ], 500);
}