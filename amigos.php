<?php

$config = require __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/GameData.php';

$assetPath = rtrim($config['app']['asset_path'], '/');
$friends = navestar_friends();
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Amigos | <?= htmlspecialchars($config['app']['name'], ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= $assetPath ?>/assets/css/app.css">
</head>
<body class="page-body">
    <main class="page-shell">
        <header class="page-header">
            <h1 class="page-title">Amigos</h1>
            <nav class="page-nav" aria-label="Navegacao">
                <a href="index.php">Jogo</a>
                <a href="cadastro.php">Cadastro</a>
                <a href="perfil.php">Perfil</a>
                <a href="naves.php">Naves</a>
            </nav>
        </header>

        <div class="page-grid">
            <section class="page-card">
                <h2>Adicionar amigo</h2>
                <form class="form-grid" method="post" action="#">
                    <label>
                        Nome do usuario
                        <input type="text" name="friend_username" placeholder="Digite o nome do piloto" required>
                    </label>
                    <button class="form-button" type="submit">Enviar convite</button>
                </form>
            </section>

            <section class="page-card">
                <h2>Como aparece no jogo</h2>
                <ul class="stat-list">
                    <li><span>Nome</span><b>acima da nave</b></li>
                    <li><span>Status</span><b>online / offline</b></li>
                    <li><span>Combate</span><b>tiros podem atingir outra nave</b></li>
                    <li><span>Movimento</span><b>acoes interpoladas reduzem lag</b></li>
                </ul>
            </section>
        </div>

        <section class="page-card">
            <h2>Tabela de amigos</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Status</th>
                        <th>Nave atual</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($friends as $friend): ?>
                        <tr>
                            <td><?= htmlspecialchars($friend['username'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($friend['status'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($friend['ship'], ENT_QUOTES, 'UTF-8') ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>
    </main>
</body>
</html>
