<?php

$config = require __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/GameData.php';

$assetPath = rtrim($config['app']['asset_path'], '/');
$ships = navestar_ship_classes();
$weapons = navestar_weapons();
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Naves | <?= htmlspecialchars($config['app']['name'], ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= $assetPath ?>/assets/css/app.css">
</head>
<body class="page-body">
    <main class="page-shell">
        <header class="page-header">
            <h1 class="page-title">Naves do jogo</h1>
            <nav class="page-nav" aria-label="Navegacao">
                <a href="index.php">Jogo</a>
                <a href="cadastro.php">Cadastro</a>
                <a href="perfil.php">Perfil</a>
                <a href="amigos.php">Amigos</a>
            </nav>
        </header>

        <section class="page-card">
            <h2>Tabela de naves</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nave</th>
                        <th>Energia</th>
                        <th>Municao</th>
                        <th>Velocidade</th>
                        <th>Escudo</th>
                        <th>Armas</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($ships as $ship): ?>
                        <tr>
                            <td><?= htmlspecialchars($ship['name'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= (int) $ship['energy'] ?></td>
                            <td><?= (int) $ship['ammo'] ?></td>
                            <td><?= (int) $ship['speed'] ?></td>
                            <td><?= (int) $ship['shield'] ?></td>
                            <td><?= htmlspecialchars(navestar_weapon_names($ship, $weapons), ENT_QUOTES, 'UTF-8') ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>

        <section class="page-card">
            <h2>Tabela de armas</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Arma</th>
                        <th>Tipo</th>
                        <th>Dano</th>
                        <th>Recarga</th>
                        <th>Custo</th>
                        <th>Alcance</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($weapons as $weapon): ?>
                        <tr>
                            <td><?= htmlspecialchars($weapon['name'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($weapon['type'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= (int) $weapon['damage'] ?></td>
                            <td><?= htmlspecialchars((string) $weapon['cooldown'], ENT_QUOTES, 'UTF-8') ?>s</td>
                            <td><?= (int) $weapon['ammo_cost'] ?></td>
                            <td><?= (int) $weapon['range'] ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>
    </main>
</body>
</html>
