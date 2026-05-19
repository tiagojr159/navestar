<?php

$config = require __DIR__ . '/app/bootstrap.php';
require_once __DIR__ . '/app/GameData.php';
require_once __DIR__ . '/app/Auth.php';

$assetPath = rtrim($config['app']['asset_path'], '/');
$ships = navestar_ship_classes();
$weapons = navestar_weapons();
$user = navestar_require_login();
$activeShip = navestar_active_ship($user, $ships);
$friends = navestar_friends();
$prizes = navestar_prizes();
$lastPresence = navestar_last_position_for_user((int) $user['id']);
$lastPosition = [
    'x' => (float) ($lastPresence['position']['x'] ?? 18000),
    'y' => (float) ($lastPresence['position']['y'] ?? 900),
    'z' => (float) ($lastPresence['position']['z'] ?? -92000),
    'rx' => (float) ($lastPresence['rotation']['x'] ?? 0),
    'ry' => (float) ($lastPresence['rotation']['y'] ?? 0),
    'rz' => (float) ($lastPresence['rotation']['z'] ?? 0),
];
$activeShipFrames = $activeShip['frames'] ?? [];
$activeShipModel = $activeShip['model'] ?? '';
$activeShipAsset = $activeShip['asset'] ?? '';
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($config['app']['name'], ENT_QUOTES, 'UTF-8') ?> | Universo 3D</title>
    <link rel="stylesheet" href="<?= $assetPath ?>/assets/css/app.css">
    <script type="importmap">
        {
            "imports": {
                "three": "./<?= $assetPath ?>/vendor/three.module.js"
            }
        }
    </script>
</head>
<body>
    <main class="experience" data-app-root>
        <canvas class="experience__canvas" data-scene-canvas data-start-state="<?= htmlspecialchars(json_encode($lastPosition), ENT_QUOTES, 'UTF-8') ?>" data-ship-frames="<?= htmlspecialchars(json_encode($activeShipFrames), ENT_QUOTES, 'UTF-8') ?>" data-ship-model="<?= htmlspecialchars($activeShipModel, ENT_QUOTES, 'UTF-8') ?>" data-ship-asset="<?= htmlspecialchars($activeShipAsset, ENT_QUOTES, 'UTF-8') ?>"></canvas>

        <section class="hud" aria-label="Controles do universo">
            <div class="hud__brand">
                <span class="hud__dot" aria-hidden="true"></span>
                <span>Universo 3D</span>
            </div>

            <div class="hud__actions">
                <a class="icon-button" href="cadastro.php" title="Cadastro de usuario">
                    <span aria-hidden="true">U</span>
                    <span class="sr-only">Cadastro de usuario</span>
                </a>
                <a class="icon-button" href="perfil.php" title="Perfil do usuario">
                    <span aria-hidden="true">P</span>
                    <span class="sr-only">Perfil do usuario</span>
                </a>
                <button class="icon-button" type="button" data-lock-control title="Entrar na navegacao">
                    <span aria-hidden="true">+</span>
                    <span class="sr-only">Entrar na navegacao</span>
                </button>
                <button class="icon-button" type="button" data-reset-control title="Voltar para o ponto inicial">
                    <span aria-hidden="true">&#8634;</span>
                    <span class="sr-only">Voltar para o ponto inicial</span>
                </button>
            </div>
        </section>

        <div class="crosshair" aria-hidden="true"></div>

        <div class="proximity" data-proximity hidden>
            <div class="proximity__name" data-proximity-name>--</div>
            <div class="proximity__dist" data-proximity-dist>--</div>
        </div>

        <section class="cockpit" aria-label="Painel da nave">
            <div class="cockpit__frame" aria-hidden="true"></div>
            <canvas class="cockpit__guide" data-hud-guide aria-hidden="true"></canvas>

            <div class="cockpit__left">
                <div class="cockpit__module cockpit__module--map">
                    <canvas width="260" height="190" class="cockpit__map" data-hud-map></canvas>
                </div>
                <div class="cockpit__module cockpit__module--readout">
                    <div class="readout">
                        <div class="readout__label">VEL</div>
                        <div class="readout__value" data-hud-speed>0</div>
                    </div>
                    <div class="readout">
                        <div class="readout__label">POS</div>
                        <div class="readout__value" data-hud-pos>0,0,0</div>
                    </div>
                </div>
            </div>

            <div class="cockpit__right">
                <div class="cockpit__module cockpit__module--status">
                    <div class="status-row">
                        <div class="status-row__label">LIM</div>
                        <div class="status-row__value" data-hud-limit>300000</div>
                    </div>
                    <div class="status-row">
                        <div class="status-row__label">ALVO</div>
                        <div class="status-row__value" data-hud-target>--</div>
                    </div>
                    <div class="status-row">
                        <div class="status-row__label">ENE</div>
                        <div class="status-row__value"><?= (int) $activeShip['energy'] ?></div>
                    </div>
                    <div class="status-row">
                        <div class="status-row__label">MUN</div>
                        <div class="status-row__value"><?= (int) $activeShip['ammo'] ?></div>
                    </div>
                    <div class="status-row">
                        <div class="status-row__label">ARMA</div>
                        <div class="status-row__value"><?= htmlspecialchars(navestar_weapon_names($activeShip, $weapons), ENT_QUOTES, 'UTF-8') ?></div>
                    </div>
                </div>
                <div class="cockpit__module cockpit__module--instructions">
                    <div class="instructions__title">NAVEGACAO</div>
                    <div class="instructions__grid">
                        <span>W/S</span><b>avancar / recuar</b>
                        <span>A/D</span><b>girar nave</b>
                        <span>Mouse</span><b>mirar</b>
                        <span>Shift</span><b>turbo</b>
                        <span>E/Enter/Click</span><b>atirar laser</b>
                        <span>Amigos</span><b>botao abre lista</b>
                    </div>
                </div>
                <div class="cockpit__module cockpit__module--quick">
                    <button class="quick-button" type="button" data-info-open="friends">Amigos</button>
                    <button class="quick-button" type="button" data-info-open="ships">Naves</button>
                    <button class="quick-button" type="button" data-info-open="profile">Perfil</button>
                </div>
                <div class="cockpit__module cockpit__module--action">
                    <button class="cockpit__action-button" type="button" data-celestial-open>
                        <span>Corpos celestes</span>
                    </button>
                    <button class="cockpit__action-button cockpit__action-button--secondary" type="button" data-dock-control>
                        <span>Acoplar</span>
                    </button>
                </div>
            </div>
        </section>

        <section class="celestial" data-celestial hidden aria-label="Corpos celestes">
            <div class="celestial__panel" role="dialog" aria-modal="true">
                <header class="celestial__header">
                    <div class="celestial__title">Corpos celestes</div>
                    <button class="icon-button celestial__close" type="button" data-celestial-close title="Fechar">
                        <span aria-hidden="true">x</span>
                        <span class="sr-only">Fechar</span>
                    </button>
                </header>

                <div class="celestial__tabs" role="tablist" aria-label="Abas">
                    <button class="celestial__tab is-active" type="button" role="tab" aria-selected="true" data-celestial-tab="planets">Planetas</button>
                    <button class="celestial__tab" type="button" role="tab" aria-selected="false" data-celestial-tab="moons">Luas</button>
                </div>

                <div class="celestial__lists">
                    <div class="celestial__list is-active" role="tabpanel" data-celestial-panel="planets"></div>
                    <div class="celestial__list" role="tabpanel" data-celestial-panel="moons"></div>
                </div>
            </div>
        </section>

        <section class="info-drawer" data-info-drawer hidden aria-label="Informacoes do piloto">
            <div class="info-drawer__panel">
                <header class="info-drawer__header">
                    <div class="info-drawer__title" data-info-title>Informacoes</div>
                    <button class="icon-button info-drawer__close" type="button" data-info-close title="Fechar">
                        <span aria-hidden="true">x</span>
                        <span class="sr-only">Fechar</span>
                    </button>
                </header>

                <div class="info-drawer__content" data-info-content="friends" hidden>
                    <?php foreach ($friends as $friend): ?>
                        <div class="info-row">
                            <span><?= htmlspecialchars($friend['username'], ENT_QUOTES, 'UTF-8') ?></span>
                            <b><?= htmlspecialchars($friend['status'] . ' - ' . $friend['ship'], ENT_QUOTES, 'UTF-8') ?></b>
                        </div>
                    <?php endforeach; ?>
                    <a class="panel-link" href="amigos.php">Gerenciar amigos</a>
                </div>

                <div class="info-drawer__content" data-info-content="ships" hidden>
                    <?php foreach ($ships as $ship): ?>
                        <div class="info-row">
                            <span><?= htmlspecialchars($ship['name'], ENT_QUOTES, 'UTF-8') ?></span>
                            <b>ENE <?= (int) $ship['energy'] ?> / MUN <?= (int) $ship['ammo'] ?></b>
                        </div>
                    <?php endforeach; ?>
                    <a class="panel-link" href="naves.php">Ver tabela de naves</a>
                </div>

                <div class="info-drawer__content" data-info-content="profile" hidden>
                    <div class="info-row">
                        <span><?= htmlspecialchars($user['username'], ENT_QUOTES, 'UTF-8') ?></span>
                        <b><?= htmlspecialchars($user['rank'], ENT_QUOTES, 'UTF-8') ?></b>
                    </div>
                    <div class="info-row">
                        <span>Nave ativa</span>
                        <b><?= htmlspecialchars($activeShip['name'], ENT_QUOTES, 'UTF-8') ?></b>
                    </div>
                    <?php foreach ($prizes as $prize): ?>
                        <div class="info-row">
                            <span><?= htmlspecialchars($prize['name'], ENT_QUOTES, 'UTF-8') ?></span>
                            <b><?= htmlspecialchars($prize['earned_at'], ENT_QUOTES, 'UTF-8') ?></b>
                        </div>
                    <?php endforeach; ?>
                    <a class="panel-link" href="perfil.php">Abrir perfil completo</a>
                </div>
            </div>
        </section>
    </main>

    <script type="module" src="<?= $assetPath ?>/assets/js/main.js"></script>
</body>
</html>
