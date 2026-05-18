<?php

$config = require __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/GameData.php';
require_once __DIR__ . '/app/Auth.php';

$assetPath = rtrim($config['app']['asset_path'], '/');
$ships = navestar_ship_classes();
$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $result = navestar_register_user(
        trim((string) ($_POST['username'] ?? '')),
        trim((string) ($_POST['email'] ?? '')),
        (string) ($_POST['password'] ?? ''),
        (int) ($_POST['ship_class_id'] ?? 1),
    );

    if ($result['ok'] ?? false) {
        header('Location: perfil.php');
        exit;
    }

    $errorMessage = (string) ($result['error'] ?? 'Nao foi possivel criar o usuario.');
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cadastro | <?= htmlspecialchars($config['app']['name'], ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= $assetPath ?>/assets/css/app.css">
</head>
<body class="page-body">
    <main class="page-shell">
        <header class="page-header">
            <h1 class="page-title">Cadastro de usuario</h1>
            <nav class="page-nav" aria-label="Navegacao">
                <a href="login.php">Login</a>
                <a href="naves.php">Naves</a>
                <a href="amigos.php">Amigos</a>
            </nav>
        </header>

        <section class="page-card">
            <h2>Novo piloto</h2>
            <?php if ($errorMessage !== ''): ?>
                <div class="form-message form-message--error"><?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') ?></div>
            <?php endif; ?>
            <form class="form-grid" method="post" action="cadastro.php">
                <label>
                    Nome de usuario
                    <input type="text" name="username" placeholder="Seu nome no universo" required>
                </label>
                <label>
                    E-mail
                    <input type="email" name="email" placeholder="piloto@exemplo.com" required>
                </label>
                <label>
                    Senha
                    <input type="password" name="password" required>
                </label>
                <label>
                    Nave inicial
                    <select name="ship_class_id">
                        <?php foreach ($ships as $ship): ?>
                            <option value="<?= (int) $ship['id'] ?>"><?= htmlspecialchars($ship['name'], ENT_QUOTES, 'UTF-8') ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <button class="form-button" type="submit">Criar usuario</button>
            </form>
            <p class="page-note">Se ja tiver conta, entre por `login.php`.</p>
        </section>
    </main>
</body>
</html>
