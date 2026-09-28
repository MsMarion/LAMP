<?php

require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAdmin();

$q = trim($_GET['q'] ?? '');

try {
    if ($q === '') {
        $stmt = $pdo->prepare(
            "SELECT
                c.id,
                c.user_id,
                u.username,
                u.full_name AS owner_name,
                c.name,
                c.phone,
                c.email,
                c.address,
                c.notes,
                c.created_at,
                c.updated_at
             FROM contacts c
             INNER JOIN users u
                ON u.id = c.user_id
             ORDER BY
                u.username ASC,
                c.name ASC
             LIMIT 100"
        );

        $stmt->execute();

    } else {
        $search = '%' . $q . '%';

        $stmt = $pdo->prepare(
            "SELECT
                c.id,
                c.user_id,
                u.username,
                u.full_name AS owner_name,
                c.name,
                c.phone,
                c.email,
                c.address,
                c.notes,
                c.created_at,
                c.updated_at
             FROM contacts c
             INNER JOIN users u
                ON u.id = c.user_id
             WHERE
                c.name LIKE ?
                OR c.phone LIKE ?
                OR c.email LIKE ?
                OR c.address LIKE ?
                OR c.notes LIKE ?
                OR u.username LIKE ?
                OR u.full_name LIKE ?
             ORDER BY
                u.username ASC,
                c.name ASC
             LIMIT 100"
        );

        $stmt->execute([
            $search,
            $search,
            $search,
            $search,
            $search,
            $search,
            $search
        ]);
    }

    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($contacts as &$contact) {
        $contact['id'] =
            (int)$contact['id'];

        $contact['user_id'] =
            (int)$contact['user_id'];
    }

    sendJson([
        'success' => true,
        'query' => $q,
        'contacts' => $contacts
    ]);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' =>
            'Unable to retrieve contacts'
    ], 500);
}