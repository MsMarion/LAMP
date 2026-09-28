<?php

require_once __DIR__ . '/helpers.php';

requireMethod('GET');

$user = requireLogin();

sendJson([
    'success' => true,
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'full_name' => $user['full_name'],
        'role' => $user['role']
    ]
]);