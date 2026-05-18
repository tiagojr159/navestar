<?php

$config = require __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/GameData.php';
require_once __DIR__ . '/app/Auth.php';
require_once __DIR__ . '/app/ShipPreview.php';

$assetPath = rtrim($config['app']['asset_path'], '/');
$ships = navestar_ship_classes();
$hangarShips = navestar_hangar_ships($ships);
$weapons = navestar_weapons();
$user = navestar_require_login();
$selectionSaved = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ship_class_id'])) {
    $selectionSaved = navestar_update_active_ship((int) $user['id'], (int) $_POST['ship_class_id']);
    $user = navestar_find_user_by_id((int) $user['id']) ?? $user;
}

$activeShip = navestar_active_ship($user, $ships);
$prizes = navestar_prizes();
$friends = navestar_friends();
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Perfil | <?= htmlspecialchars($config['app']['name'], ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= $assetPath ?>/assets/css/app.css">
</head>
<body class="page-body">
    <main class="page-shell">
        <header class="page-header page-header--profile">
            <div class="page-header__content">
                <div class="page-kicker">Painel de comando</div>
                <h1 class="page-title page-title--profile">Perfil do usuario</h1>
                <p class="page-lead">Tudo o que voce precisa para entrar no universo, acompanhar sua nave e revisar sua atividade em um unico painel.</p>
            </div>
            <nav class="page-nav page-nav--profile" aria-label="Navegacao">
                <a href="index.php">Jogo</a>
                <a href="naves.php">Naves</a>
                <a href="amigos.php">Amigos</a>
                <a href="login.php?logout=1">Sair</a>
            </nav>
        </header>

        <section class="profile-hero">
            <div class="profile-hero__main">
                <div class="profile-hero__eyebrow">Piloto ativo</div>
                <h2 class="profile-hero__title"><?= htmlspecialchars($user['username'], ENT_QUOTES, 'UTF-8') ?></h2>
                <p class="profile-hero__text">Seu hangar esta pronto. Entre no jogo com a nave ativa e continue sua rota pelo sistema solar.</p>
                <a class="hero-action" href="index.php">Entrar no jogo</a>
            </div>
            <div class="profile-hero__stats">
                <div class="hero-stat">
                    <span class="hero-stat__label">Patente</span>
                    <strong class="hero-stat__value"><?= htmlspecialchars($user['rank'], ENT_QUOTES, 'UTF-8') ?></strong>
                </div>
                <div class="hero-stat">
                    <span class="hero-stat__label">XP</span>
                    <strong class="hero-stat__value"><?= (int) $user['xp'] ?></strong>
                </div>
                <div class="hero-stat">
                    <span class="hero-stat__label">Nave ativa</span>
                    <strong class="hero-stat__value"><?= htmlspecialchars($activeShip['name'], ENT_QUOTES, 'UTF-8') ?></strong>
                </div>
            </div>
        </section>

        <div class="page-grid page-grid--profile">
            <section class="page-card page-card--profile">
                <div class="section-heading">
                    <span class="section-heading__kicker">Identidade</span>
                    <h2>Informacoes</h2>
                </div>
                <ul class="stat-list stat-list--profile">
                    <li><span>Usuario</span><b><?= htmlspecialchars($user['username'], ENT_QUOTES, 'UTF-8') ?></b></li>
                    <li><span>E-mail</span><b><?= htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8') ?></b></li>
                    <li><span>Patente</span><b><?= htmlspecialchars($user['rank'], ENT_QUOTES, 'UTF-8') ?></b></li>
                    <li><span>XP</span><b><?= (int) $user['xp'] ?></b></li>
                    <li><span>Nave ativa</span><b><?= htmlspecialchars($activeShip['name'], ENT_QUOTES, 'UTF-8') ?></b></li>
                </ul>
            </section>

            <section class="page-card page-card--profile">
                <div class="section-heading">
                    <span class="section-heading__kicker">Hangar</span>
                    <h2>Nave atual</h2>
                </div>
                <ul class="stat-list stat-list--profile">
                    <li><span>Energia</span><b><?= (int) $activeShip['energy'] ?></b></li>
                    <li><span>Municao</span><b><?= (int) $activeShip['ammo'] ?></b></li>
                    <li><span>Escudo</span><b><?= (int) $activeShip['shield'] ?></b></li>
                    <li><span>Velocidade</span><b><?= (int) $activeShip['speed'] ?></b></li>
                    <li><span>Armas</span><b><?= htmlspecialchars(navestar_weapon_names($activeShip, $weapons), ENT_QUOTES, 'UTF-8') ?></b></li>
                </ul>
            </section>
        </div>

        <section class="page-card page-card--profile" id="hangar">
            <div class="section-heading">
                <div>
                    <span class="section-heading__kicker">Escolha de nave</span>
                    <h2>Hangar disponivel</h2>
                </div>
                <a class="form-button" href="hangar.php?ship=<?= (int) $activeShip['id'] ?>">Ver showroom</a>
            </div>
            <?php if ($selectionSaved): ?>
                <div class="form-message form-message--success">Nave ativa atualizada no perfil.</div>
            <?php endif; ?>
            <form method="post" action="perfil.php" class="ship-selector">
                <?php foreach ($hangarShips as $ship): ?>
                    <label class="ship-card<?= (int) $ship['id'] === (int) $activeShip['id'] ? ' is-active' : '' ?>">
                        <input class="ship-card__input" type="radio" name="ship_class_id" value="<?= (int) $ship['id'] ?>"<?= (int) $ship['id'] === (int) $activeShip['id'] ? ' checked' : '' ?>>
                        <?= navestar_render_ship_preview($ship) ?>
                        <div class="ship-card__body">
                            <strong class="ship-card__title"><?= htmlspecialchars($ship['name'], ENT_QUOTES, 'UTF-8') ?></strong>
                            <span class="ship-card__meta">ENE <?= (int) $ship['energy'] ?> | MUN <?= (int) $ship['ammo'] ?></span>
                            <span class="ship-card__meta">VEL <?= (int) $ship['speed'] ?> | ESC <?= (int) $ship['shield'] ?></span>
                        </div>
                    </label>
                <?php endforeach; ?>
                <button class="form-button form-button--primary" type="submit">Usar nave selecionada</button>
            </form>
        </section>

        <section class="page-card page-card--profile">
            <div class="section-heading">
                <span class="section-heading__kicker">Progresso</span>
                <h2>Premios conquistados</h2>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Premio</th>
                        <th>Descricao</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($prizes as $prize): ?>
                        <tr>
                            <td><?= htmlspecialchars($prize['name'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($prize['description'], ENT_QUOTES, 'UTF-8') ?></td>
                            <td><?= htmlspecialchars($prize['earned_at'], ENT_QUOTES, 'UTF-8') ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>

        <section class="page-card page-card--profile">
            <div class="section-heading">
                <span class="section-heading__kicker">Contato</span>
                <h2>Amigos visiveis no universo</h2>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Status</th>
                        <th>Nave</th>
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
    <script src="<?= $assetPath ?>/assets/js/profile-ship-preview.js"></script>
</body>
</html>
