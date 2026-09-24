<?php

require 'helpers.php';

requireMethod('GET');
requireAdmin();

$q = trim($_GET['q'] ?? '');

sendJson([
    'message' => 'admin user search endpoint ready',
    'query' => $q,
    'database' => 'not connected yet'
], 501);