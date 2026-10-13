<?php
declare(strict_types=1);

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();
require_once __DIR__ . '/database/connection.php';

if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
$mode = ($_GET['mode'] ?? 'login') === 'register' ? 'register' : 'login';
$error = '';
$success = '';
$starterShips = [
    'explorer' => ['name' => 'Astra Explorer', 'cargo' => 2000, 'fuel' => 1000, 'hull' => 120],
    'prospector' => ['name' => 'Mantis Prospector', 'cargo' => 3200, 'fuel' => 850, 'hull' => 125],
    'scout' => ['name' => 'Kite Scout', 'cargo' => 1500, 'fuel' => 1500, 'hull' => 100],
];

if (isset($_GET['logout']) && !empty($_SESSION['user_id'])) {
    try {
        $pdo = db();
        $pdo->prepare('UPDATE ships SET is_active=0 WHERE user_id=?')->execute([(int)$_SESSION['user_id']]);
        $pdo->prepare('UPDATE users SET last_seen_at=NULL WHERE id=?')->execute([(int)$_SESSION['user_id']]);
    } catch (Throwable $ignored) {
        // Encerra a sessão mesmo se o MySQL estiver temporariamente indisponível.
    }
    $_SESSION = [];
    session_destroy();
    header('Location: login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mode = ($_POST['mode'] ?? '') === 'register' ? 'register' : 'login';
    if (!hash_equals($_SESSION['csrf_token'], (string)($_POST['csrf_token'] ?? ''))) {
        $error = 'A sessão do formulário expirou. Atualize a página e tente novamente.';
    } else {
        $username = trim((string)($_POST['username'] ?? ''));
        $password = (string)($_POST['password'] ?? '');
        try {
            $pdo = db();
            if ($mode === 'register') {
                $email = strtolower(trim((string)($_POST['email'] ?? '')));
                $starterModel = (string)($_POST['ship_model'] ?? '');
                if (!preg_match('/^[A-Za-z0-9_.-]{3,40}$/', $username)) {
                    $error = 'Use um nome de piloto com 3 a 40 caracteres: letras, números, ponto, traço ou sublinhado.';
                } elseif (!isset($starterShips[$starterModel])) {
                    $error = 'Escolha uma das três naves iniciais disponíveis.';
                } elseif (strlen($password) < 3) {
                    $error = 'A senha precisa ter pelo menos 3 caracteres.';
                } elseif ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $error = 'Digite um e-mail válido ou deixe o campo vazio.';
                } else {
                    $pdo->beginTransaction();
                    $insertUser = $pdo->prepare('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)');
                    $insertUser->execute([$username, $email !== '' ? $email : null, password_hash($password, PASSWORD_DEFAULT)]);
                    $newUserId = (int)$pdo->lastInsertId();
                    $spawnX = random_int(-2500, 2500);
                    $spawnZ = random_int(-2500, 2500);
                    $starter = $starterShips[$starterModel];
                    $pdo->prepare('INSERT INTO ships (user_id,ship_name,ship_class,cargo_capacity_kg,fuel_capacity_units,pos_x,pos_z,hull_hp,fuel_units,is_active) VALUES (?,?,?,?,?,?,?,?,?,1)')
                        ->execute([$newUserId, $starter['name'] . ' · ' . $username, $starterModel, $starter['cargo'], $starter['fuel'], $spawnX, $spawnZ, $starter['hull'], $starter['fuel']]);
                    $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$newUserId]);
                    $pdo->commit();
                    session_regenerate_id(true);
                    $_SESSION['user_id'] = $newUserId;
                    $_SESSION['username'] = $username;
                    header('Location: index.php');
                    exit;
                }
            } else {
                $query = $pdo->prepare('SELECT id,username,password_hash,is_active FROM users WHERE username=? LIMIT 1');
                $query->execute([$username]);
                $user = $query->fetch();
                if (!$user || !password_verify($password, $user['password_hash']) || !(int)$user['is_active']) {
                    $error = 'Nome de piloto ou senha incorretos.';
                } else {
                    $userId = (int)$user['id'];
                    $pdo->beginTransaction();
                    $shipQuery = $pdo->prepare('SELECT id FROM ships WHERE user_id=? ORDER BY is_active DESC,id ASC LIMIT 1');
                    $shipQuery->execute([$userId]);
                    $shipId = (int)$shipQuery->fetchColumn();
                    if (!$shipId) {
                        $pdo->prepare('INSERT INTO ships (user_id,ship_name,pos_x,pos_z,is_active) VALUES (?,?,?,?,1)')
                            ->execute([$userId, 'Nave de ' . $user['username'], random_int(-2500,2500), random_int(-2500,2500)]);
                    } else {
                        $pdo->prepare('UPDATE ships SET is_active=1 WHERE id=?')->execute([$shipId]);
                    }
                    $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
                    $pdo->commit();
                    session_regenerate_id(true);
                    $_SESSION['user_id'] = $userId;
                    $_SESSION['username'] = $user['username'];
                    header('Location: index.php');
                    exit;
                }
            }
        } catch (PDOException $exception) {
            if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
            if ($exception->getCode() === '23000') {
                $error = 'Esse nome de piloto ou e-mail já está cadastrado.';
            } else {
                error_log('Login do jogo: ' . $exception->getMessage());
                $error = 'Não foi possível acessar o banco. Importe database/schema.sql no phpMyAdmin.';
            }
        } catch (Throwable $exception) {
            if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
            error_log('Login do jogo: ' . $exception->getMessage());
            $error = 'Não foi possível concluir o acesso à conta.';
        }
    }
}

function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Acesso de piloto · NAVE</title>
  <script src="ship-catalog.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:22px;background:radial-gradient(ellipse at 78% 28%,rgba(15,92,116,.25),transparent 38%),radial-gradient(ellipse at 10% 90%,rgba(36,61,111,.22),transparent 34%),#020711;color:#e8f7fa;font-family:'Barlow Condensed',sans-serif}.login-shell{width:min(440px,100%);padding:34px;background:linear-gradient(145deg,rgba(9,27,40,.97),rgba(4,14,24,.97));border:1px solid rgba(111,211,224,.3);box-shadow:0 30px 100px rgba(0,0,0,.4)}.brand{font-weight:700;font-size:17px;letter-spacing:.28em}.brand span{color:#71e7f3}.eyebrow{margin-top:32px;color:#78afbd;font:9px 'Space Mono';letter-spacing:.2em}.title{margin:7px 0 5px;font-size:34px;font-weight:600}.intro{margin:0 0 25px;color:#9ab5bd;font-size:15px}.tabs{display:flex;gap:18px;margin-bottom:20px;border-bottom:1px solid rgba(117,193,207,.17)}.tabs a{padding:0 0 10px;color:#7797a2;text-decoration:none;font:9px 'Space Mono';letter-spacing:.12em}.tabs a.active{color:#87edf1;border-bottom:1px solid #71e7f3}.field{display:block;margin:14px 0}.field span{display:block;margin-bottom:6px;color:#9bbac2;font:9px 'Space Mono';letter-spacing:.1em}.field input{width:100%;padding:12px 13px;outline:0;background:#06131e;border:1px solid rgba(115,187,200,.25);color:#eaf8fb;font:14px 'Barlow Condensed',sans-serif}.field input:focus{border-color:#71e7f3}.submit{width:100%;margin-top:7px;padding:13px;border:1px solid rgba(110,224,230,.62);background:linear-gradient(100deg,rgba(36,123,140,.4),rgba(22,57,83,.58));color:#c9ffff;font:10px 'Space Mono';letter-spacing:.1em;cursor:pointer}.submit:hover{background:rgba(46,144,158,.45)}.message{margin:0 0 16px;padding:11px 12px;border:1px solid rgba(247,152,120,.34);background:rgba(110,38,34,.16);color:#ffc3a5;font-size:14px}.note{margin:19px 0 0;color:#65848f;font:8px 'Space Mono';line-height:1.8}.back{display:inline-block;margin-top:19px;color:#82b5c0;text-decoration:none;font:9px 'Space Mono'}
  </style>
  <style>
    .login-shell.register-shell{width:min(980px,100%);padding:clamp(20px,4vw,38px)}
    .register-form{display:grid;grid-template-columns:minmax(250px,.72fr) minmax(0,1.6fr);gap:0 30px;align-items:start}
    .register-fields{grid-column:1;grid-row:1 / span 2}.ship-picker{grid-column:2;grid-row:1 / span 2;min-width:0;margin:0;padding:0;border:0}
    .ship-picker legend{margin:0 0 5px;color:#a8dce2;font:10px 'Space Mono';letter-spacing:.14em}.ship-picker-copy{margin:0 0 12px;color:#789da9;font-size:14px}
    .ship-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .ship-choice{position:relative;min-width:0;overflow:hidden;padding:9px;text-align:left;color:#e7f8f8;background:linear-gradient(145deg,#0c2637,#07121e);border:1px solid rgba(130,193,205,.2);cursor:pointer;transition:.2s}
    .ship-choice:hover{transform:translateY(-3px);border-color:var(--ship-accent);box-shadow:0 9px 28px color-mix(in srgb,var(--ship-accent) 20%,transparent)}
    .ship-choice.selected{border-color:var(--ship-accent);box-shadow:inset 0 0 0 1px var(--ship-accent),0 0 28px color-mix(in srgb,var(--ship-accent) 18%,transparent)}
    .ship-choice-art{display:grid;place-items:center;height:117px;margin:-2px -3px 7px;background:radial-gradient(ellipse at 50% 78%,color-mix(in srgb,var(--ship-accent) 18%,transparent),transparent 65%),linear-gradient(180deg,#071321,#0a1b2a)}
    .ship-art{display:block;width:100%;height:100%;filter:drop-shadow(0 5px 11px #020711)}
    .ship-choice-tag{display:block;color:var(--ship-accent);font:6px 'Space Mono';letter-spacing:.1em}.ship-choice-title{display:block;margin-top:4px;font:11px 'Space Mono';line-height:1.3}.ship-choice-desc{display:block;min-height:34px;margin-top:5px;color:#86aab4;font-size:12px;line-height:1.3}
    .ship-choice-specs{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}.ship-choice-specs i{padding:4px 5px;border:1px solid #6ca2ad36;color:#b7dadd;font:6px 'Space Mono';font-style:normal}
    .ship-choice-check{position:absolute;right:9px;top:9px;width:19px;height:19px;display:grid;place-items:center;border:1px solid var(--ship-accent);border-radius:50%;color:#041016;background:var(--ship-accent);font:11px 'Space Mono';opacity:0;transform:scale(.7);transition:.2s}.ship-choice.selected .ship-choice-check{opacity:1;transform:scale(1)}
    .starter-pledge{grid-column:2;margin:12px 0 0;padding:9px 11px;border-left:2px solid #68dcca;background:#0b282d;color:#a8d9d4;font:7px 'Space Mono';line-height:1.6}
    .register-submit{grid-column:1;grid-row:3}.register-note{grid-column:2;grid-row:3}
    @media(max-width:760px){.register-form{grid-template-columns:1fr}.register-fields,.ship-picker,.starter-pledge,.register-submit,.register-note{grid-column:1;grid-row:auto}.ship-choice-grid{grid-template-columns:1fr}.ship-choice{display:grid;grid-template-columns:112px 1fr;grid-template-rows:auto auto 1fr;column-gap:11px}.ship-choice-art{grid-column:1;grid-row:1 / span 4;height:90px;margin:0}.ship-choice-tag,.ship-choice-title,.ship-choice-desc,.ship-choice-specs{grid-column:2}.ship-choice-desc{min-height:auto}.register-submit{margin-top:14px}.register-note{margin-top:12px}}
  </style>
</head>
<body>
  <main class="login-shell <?= $mode === 'register' ? 'register-shell' : '' ?>">
    <div class="brand">N<span>A</span>VE <span style="color:#7399a8;font-size:9px;letter-spacing:.15em">DEEP SPACE / 01</span></div>
    <div class="eyebrow">IDENTIFICAÇÃO DE TRIPULAÇÃO</div>
    <h1 class="title"><?= $mode === 'register' ? 'Criar conta de piloto' : 'Acessar o multiplayer' ?></h1>
    <p class="intro"><?= $mode === 'register' ? 'Escolha sua nave de partida. Novos cascos estarão à venda no estáleiro conforme você avança pelo setor.' : 'Entre no setor e encontre outras naves online.' ?></p>
    <nav class="tabs"><a class="<?= $mode === 'login' ? 'active' : '' ?>" href="login.php">ENTRAR</a><a class="<?= $mode === 'register' ? 'active' : '' ?>" href="login.php?mode=register">CRIAR CONTA</a></nav>
    <?php if ($error !== ''): ?><p class="message" role="alert"><?= h($error) ?></p><?php endif; ?>
    <form method="post" action="login.php<?= $mode === 'register' ? '?mode=register' : '' ?>" autocomplete="on" class="<?= $mode === 'register' ? 'register-form' : '' ?>">
      <input type="hidden" name="mode" value="<?= h($mode) ?>"><input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_token']) ?>">
      <div class="register-fields"><label class="field"><span>NOME DE PILOTO</span><input name="username" required minlength="3" maxlength="40" pattern="[A-Za-z0-9_.-]{3,40}" autocomplete="username" value="<?= h((string)($_POST['username'] ?? '')) ?>"></label>
      <?php if ($mode === 'register'): ?><label class="field"><span>E-MAIL · OPCIONAL</span><input type="email" name="email" maxlength="190" autocomplete="email" value="<?= h((string)($_POST['email'] ?? '')) ?>"></label><?php endif; ?>
      <label class="field"><span>SENHA</span><input type="password" name="password" required minlength="3" autocomplete="<?= $mode === 'register' ? 'new-password' : 'current-password' ?>"></label></div>
      <?php if ($mode === 'register'): $selectedStarter = isset($starterShips[(string)($_POST['ship_model'] ?? '')]) ? (string)$_POST['ship_model'] : 'explorer'; ?>
      <input type="hidden" name="ship_model" id="shipModel" value="<?= h($selectedStarter) ?>">
      <fieldset class="ship-picker"><legend>ESCOLHA SUA NAVE INICIAL / UMA DE TRÊS</legend><p class="ship-picker-copy">Cada casco tem um perfil diferente. Escolha com qual estilo quer começar.</p><div class="ship-choice-grid" id="starterShipChoices">
        <?php foreach (['explorer','prospector','scout'] as $model): ?><button type="button" class="ship-choice<?= $selectedStarter === $model ? ' selected' : '' ?>" data-model="<?= h($model) ?>" aria-pressed="<?= $selectedStarter === $model ? 'true' : 'false' ?>"><span class="ship-choice-art"></span><span class="ship-choice-tag"></span><strong class="ship-choice-title"></strong><span class="ship-choice-desc"></span><span class="ship-choice-specs"></span><span class="ship-choice-check">✓</span></button><?php endforeach; ?>
      </div></fieldset><p class="starter-pledge">TRÊS NAVES DISPONÍVEIS AGORA · ATLAS E VIPER SERÃO DESBLOQUEADAS NO ESTALEIRO COM OS CRÉDITOS OBTIDOS NAS SUAS ROTAS E MINERAÇÃO.</p>
      <?php endif; ?>
      <button class="submit <?= $mode === 'register' ? 'register-submit' : '' ?>" type="submit"><?= $mode === 'register' ? 'CRIAR CONTA E LANÇAR NAVE' : 'ENTRAR NO SETOR' ?> →</button>
    </form>
    <p class="note <?= $mode === 'register' ? 'register-note' : '' ?>">Cada conta possui uma nave e posição próprias. Enquanto você estiver conectado, outras pessoas no multiplayer poderão ver sua nave.</p>
    <a class="back" href="index.php">← VOLTAR AO JOGO</a>
  </main>
  <?php if ($mode === 'register'): ?><script>
  (()=>{const catalog=window.shipCatalog,grid=document.querySelector('#starterShipChoices'),field=document.querySelector('#shipModel');if(!catalog||!grid||!field)return;for(const card of grid.querySelectorAll('[data-model]')){const model=card.dataset.model,spec=catalog[model];if(!spec)continue;card.style.setProperty('--ship-accent',spec.accent);card.querySelector('.ship-choice-art').innerHTML=window.shipArt(model);card.querySelector('.ship-choice-tag').textContent=spec.tag;card.querySelector('.ship-choice-title').textContent=spec.name;card.querySelector('.ship-choice-desc').textContent=spec.summary;card.querySelector('.ship-choice-specs').innerHTML=`<i>${spec.cargo.toLocaleString('pt-BR')} KG CARGA</i><i>${spec.fuel.toLocaleString('pt-BR')} U COMBUSTÍVEL</i><i>CASCO ${spec.hull}</i>`}grid.addEventListener('click',event=>{const card=event.target.closest('[data-model]');if(!card)return;field.value=card.dataset.model;grid.querySelectorAll('[data-model]').forEach(item=>{const chosen=item===card;item.classList.toggle('selected',chosen);item.setAttribute('aria-pressed',String(chosen))})})})();
  </script><?php endif; ?>
</body>
</html>
