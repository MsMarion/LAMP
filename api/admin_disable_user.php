<?php

require 'helpers.php';

requireMethod('PUT');
requireAdmin();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$userId = $input['user_id'] ?? null;
$isDisabled = $input['is_disabled'] ?? null;

if ($userId === null || $isDisabled === null) {
    sendJson(['error' => 'user_id and is_disabled are required'], 400);
}

sendJson([
    'message' => 'disable user endpoint ready',
    'database' => 'not connected yet'
], 501);