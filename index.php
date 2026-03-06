<?php

$distIndex = __DIR__ . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'index.html';

if (!is_file($distIndex)) {
    http_response_code(503);
    header('Content-Type: text/html; charset=UTF-8');
    ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Build Required</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f4f7fb;
      color: #1f2937;
    }
    main {
      width: min(640px, calc(100% - 2rem));
      background: #ffffff;
      border: 1px solid #dbe3ef;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }
    code {
      background: #eef2ff;
      border-radius: 6px;
      padding: 0.15rem 0.35rem;
    }
  </style>
</head>
<body>
  <main>
    <h1>Frontend build missing</h1>
    <p>The Apache entry is working, but the compiled frontend was not found at <code>dist/index.html</code>.</p>
    <p>Run <code>npm install</code> once, then <code>npm run build</code> from <code>C:\xampp\htdocs\carrothost</code>.</p>
  </main>
</body>
</html>
    <?php
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
readfile($distIndex);
