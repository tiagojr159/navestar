<?php

$config = require __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/Auth.php';

$assetPath = rtrim($config['app']['asset_path'], '/');
$errorMessage = '';

if (isset($_GET['logout']) && $_GET['logout'] === '1') {
    navestar_logout();
}

if (navestar_logged_user()) {
    header('Location: perfil.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = trim((string) ($_POST['login'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if (navestar_login($login, $password)) {
        header('Location: perfil.php');
        exit;
    }

    $errorMessage = 'Login ou senha invalidos.';
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login | <?= htmlspecialchars($config['app']['name'], ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= $assetPath ?>/assets/css/app.css">
</head>
<body class="page-body">
    <main class="page-shell page-shell--narrow">
        <section class="page-card page-card--hero">
            <h1 class="page-title">Entrar no universo</h1>
            <p class="page-note">Entre com `Comandante` e senha `123456`, ou use uma conta criada no cadastro.</p>
            <?php if ($errorMessage !== ''): ?>
                <div class="form-message form-message--error"><?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') ?></div>
            <?php endif; ?>
            <form class="form-grid" method="post" action="login.php">
                <label>
                    Usuario ou e-mail
                    <input type="text" name="login" placeholder="Comandante" required>
                </label>
                <label>
                    Senha
                    <input type="password" name="password" required>
                </label>
                <button class="form-button form-button--primary" type="submit">Entrar</button>
            </form>
            <div class="page-nav page-nav--center">
                <a href="cadastro.php">Criar conta</a>
                <a href="naves.php">Ver naves</a>
            </div>
        </section>
    </main>
</body>
</html>
