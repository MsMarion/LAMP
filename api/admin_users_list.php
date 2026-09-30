<?php

require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAdmin();

$q = trim($_GET['q'] ?? '');

try {
    if ($q === '') {
        $stmt = $pdo->prepare(
            "SELECT
                u.id,
                u.username,
                u.full_name,
                u.email,
                u.role,
                u.is_disabled,
                u.created_at,
                COUNT(c.id) AS contact_count
             FROM users u
             LEFT JOIN contacts c
                ON c.user_id = u.id
             GROUP BY
                u.id,
                u.username,
                u.full_name,
                u.email,
                u.role,
                u.is_disabled,
                u.created_at
             ORDER BY u.username ASC
             LIMIT 100"
        );

        $stmt->execute();

    } else {
        $search = '%' . $q . '%';

        $stmt = $pdo->prepare(
            "SELECT
                u.id,
                u.username,
                u.full_name,
                u.email,
                u.role,
                u.is_disabled,
                u.created_at,
                COUNT(c.id) AS contact_count
             FROM users u
             LEFT JOIN contacts c
                ON c.user_id = u.id
             WHERE
                u.username LIKE ?
                OR u.full_name LIKE ?
                OR u.email LIKE ?
                OR u.role LIKE ?
             GROUP BY
                u.id,
                u.username,
                u.full_name,
                u.email,
                u.role,
                u.is_disabled,
                u.created_at
             ORDER BY u.username ASC
             LIMIT 100"
        );

        $stmt->execute([
            $search,
            $search,
            $search,
            $search
        ]);
    }

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($users as &$user) {
        $user['id'] = (int)$user['id'];
        $user['is_disabled'] = (bool)$user['is_disabled'];
        $user['contact_count'] = (int)$user['contact_count'];
    }

    sendJson([
        'success' => true,
        'query' => $q,
        'users' => $users
    ]);

} catch (PDOException $e) {
    sendJson([
        'success' => false,
        'error' => 'Unable to retrieve users'
    ], 500);
}