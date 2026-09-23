<?php

require 'helpers.php';

requireMethod('DELETE');
requireLogin();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$id = $input['id'] ?? null;

if (!$id) {
    sendJson(['error' => 'contact id is required'], 400);
}

sendJson([
    'message' => 'contact delete endpoint ready',
    'database' => 'not connected yet'
], 501);