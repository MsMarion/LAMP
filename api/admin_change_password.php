<?php

require 'helpers.php';

requireMethod('PUT');
requireAdmin();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$userId = $input['user_id'] ?? null;
$newPassword = $input['new_password'] ?? '';

if (!$userId || $newPassword === '') {
    sendJson(['error' => 'user_id and new_password are required'], 400);
}

sendJson([
    'message' => 'password change endpoint ready',
    'database' => 'not connected yet'
], 501);