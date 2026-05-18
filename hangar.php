<?php

$config = require __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/GameData.php';
require_once __DIR__ . '/app/Auth.php';
require_once __DIR__ . '/app/ShipPreview.php';

$assetPath = rtrim($config['app']['asset_path'], '/');
$user = navestar_require_login();
$allShips = navestar_ship_classes();
$ships = navestar_hangar_ships($allShips);
$weapons = navestar_weapons();
$userActiveShip = navestar_active_ship($user, $allShips);
$activeShip = navestar_is_procedural_ship($userActiveShip) ? $userActiveShip : ($ships[0] ?? $userActiveShip);
$selectedShipId = isset($_GET['ship']) ? (int) $_GET['ship'] : (int) $activeShip['id'];
$showcaseShip = $activeShip;

foreach ($ships as $ship) {
    if ((int) $ship['id'] === $selectedShipId) {
        $showcaseShip = $ship;
        break;
    }
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hangar | <?= htmlspecialchars($config['app']['name'], ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= $assetPath ?>/assets/css/app.css">
</head>
<body class="page-body">
    <main class="page-shell page-shell--hangar">
        <header class="page-header page-header--profile">
            <div class="page-header__content">
                <div class="page-kicker">Showroom</div>
                <h1 class="page-title page-title--profile">Hangar de naves</h1>
                <p class="page-lead">Uma sala de exibicao para olhar cada nave com calma, comparar silhueta, armamento e perfil de voo sem a interface do jogo disputando atencao.</p>
            </div>
            <nav class="page-nav page-nav--profile" aria-label="Navegacao">
                <a href="perfil.php">Perfil</a>
                <a href="index.php">Jogo</a>
                <a href="naves.php">Naves</a>
            </nav>
        </header>

        <section class="ship-showcase">
            <div class="ship-showcase__copy">
                <span class="section-heading__kicker">Nave em destaque</span>
                <h2 class="ship-showcase__title"><?= htmlspecialchars($showcaseShip['name'], ENT_QUOTES, 'UTF-8') ?></h2>
                <p class="ship-showcase__text">Modelo escolhido para observacao. Mova o cursor sobre a nave para girar a exibicao e ver melhor a silhueta.</p>
                <div class="ship-showcase__stats">
                    <div class="ship-showcase__stat">
                        <span>Energia</span>
                        <strong><?= (int) $showcaseShip['energy'] ?></strong>
                    </div>
                    <div class="ship-showcase__stat">
                        <span>Municao</span>
                        <strong><?= (int) $showcaseShip['ammo'] ?></strong>
                    </div>
                    <div class="ship-showcase__stat">
                        <span>Velocidade</span>
                        <strong><?= (int) $showcaseShip['speed'] ?></strong>
                    </div>
                    <div class="ship-showcase__stat">
                        <span>Escudo</span>
                        <strong><?= (int) $showcaseShip['shield'] ?></strong>
                    </div>
                </div>
                <div class="ship-showcase__actions">
                    <a class="hero-action" href="perfil.php">Voltar ao perfil</a>
                    <a class="form-button" href="perfil.php#hangar">Ativar outra nave</a>
                </div>
            </div>
            <div class="ship-showcase__visual">
                <div class="ship-showcase__frame">
                    <?= navestar_render_ship_preview($showcaseShip, 'ship-showcase__preview ship-card__image--model', 'css-ship-preview css-ship-preview--showcase') ?>
                </div>
                <div class="ship-showcase__weapons">
                    <span>Armas equipadas</span>
                    <strong><?= htmlspecialchars(navestar_weapon_names($showcaseShip, $weapons), ENT_QUOTES, 'UTF-8') ?></strong>
                </div>
            </div>
        </section>

        <section class="page-card page-card--profile">
            <div class="section-heading">
                <div>
                    <span class="section-heading__kicker">Colecao</span>
                    <h2>Todas as naves do hangar</h2>
                </div>
            </div>
            <div class="ship-gallery">
                <?php foreach ($ships as $ship): ?>
                    <a class="ship-card ship-card--hangar<?= (int) $ship['id'] === (int) $showcaseShip['id'] ? ' is-active' : '' ?>" href="hangar.php?ship=<?= (int) $ship['id'] ?>">
                        <?= navestar_render_ship_preview($ship) ?>
                        <div class="ship-card__body">
                            <strong class="ship-card__title"><?= htmlspecialchars($ship['name'], ENT_QUOTES, 'UTF-8') ?></strong>
                            <span class="ship-card__meta">ENE <?= (int) $ship['energy'] ?> | MUN <?= (int) $ship['ammo'] ?></span>
                            <span class="ship-card__meta">VEL <?= (int) $ship['speed'] ?> | ESC <?= (int) $ship['shield'] ?></span>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>
    </main>
    <script src="<?= $assetPath ?>/assets/js/profile-ship-preview.js"></script>
</body>
</html>
