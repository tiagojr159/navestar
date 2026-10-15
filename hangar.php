<?php
declare(strict_types=1);
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();
if (empty($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$userId = (int) $_SESSION['user_id'];
$username = (string) ($_SESSION['username'] ?? 'PILOTO');
$csrf = (string) ($_SESSION['csrf_token'] ?? '');
$shipClass = 'explorer';
$shipName = '';
$shipClasses = ['explorer','prospector','scout','freighter','attack'];
try {
    require_once __DIR__ . '/database/connection.php';
    $stmt = db()->prepare('SELECT ship_class,ship_name FROM ships WHERE user_id=? AND is_active=1 ORDER BY id LIMIT 1');
    $stmt->execute([$userId]);
    $currentShip = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $current = (string) ($currentShip['ship_class'] ?? 'explorer');
    $shipName = (string) ($currentShip['ship_name'] ?? '');
    if (in_array($current, $shipClasses, true)) $shipClass = $current;
} catch (Throwable $ignored) {
    // The selector remains usable if the ship state cannot be read; activate reports the database error.
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
 <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
 <title>Hangar de naves · NAVE STAR</title>
 <link rel="stylesheet" href="assets/hangar3d/estilos.css?v=1">
 <style>
  .top-actions{gap:10px}.top-actions .back-game{color:#a5eaf0;text-decoration:none;font:9px 'Space Mono';padding:9px 12px;border:1px solid #315c6a;border-radius:5px;background:#081925}.hangar-layout{grid-template-columns:minmax(245px,.82fr) minmax(370px,1.6fr) minmax(245px,.82fr)}.fleet-panel,.spec-panel{min-height:0}.fleet-panel{max-height:calc(100dvh - 140px);overflow:hidden}.ship-list{max-height:calc(100dvh - 320px);overflow:auto}.stage{min-height:min(690px,calc(100dvh - 140px))}.stage canvas{touch-action:none}.identity .ship-emblem{display:grid;place-items:center}.spec-section-title.ship-params-title{margin-top:18px}.pilot-strip{position:absolute;left:20px;bottom:18px;color:#7e9eaa;font:8px 'Space Mono';letter-spacing:.08em}.ship-choice{width:100%;margin-top:16px;padding:13px 15px;border:1px solid #5bced1;border-radius:6px;background:linear-gradient(135deg,#14505a,#0a2634);color:#e5ffff;font:10px 'Space Mono';letter-spacing:.08em;cursor:pointer;box-shadow:0 0 20px #36cfd022}.ship-choice:hover{filter:brightness(1.2)}.ship-choice:disabled{opacity:.55;cursor:wait}.hangar-notice{position:fixed;z-index:30;left:50%;bottom:20px;transform:translateX(-50%);max-width:calc(100vw - 30px);padding:12px 18px;border:1px solid #66d4c1;border-radius:6px;background:#061824;color:#d8fffa;font:11px 'Space Mono';box-shadow:0 8px 30px #000b}.stage-head{padding-right:14px}.stage-bottom{padding-bottom:70px}@media(max-width:1050px){.hangar-layout{grid-template-columns:minmax(220px,.7fr) minmax(320px,1.3fr)}.spec-panel{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;column-gap:22px}.spec-spacer{display:none}.ship-list{max-height:40vh}}@media(max-width:700px){.hangar-layout{display:flex;flex-direction:column}.fleet-panel{max-height:none;order:2}.ship-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));max-height:260px}.stage{order:1;min-height:500px}.spec-panel{order:3;display:block}.stage-bottom{align-items:end;padding-bottom:65px}.stage-controls{flex-wrap:wrap}.topbar{flex-wrap:wrap}.top-actions{margin-left:auto}.pilot-strip{display:none}}
 </style>
</head>
<body>
 <div class="site-shell">
  <header class="topbar">
   <div class="brand-wrap"><div class="brand-mark" aria-hidden="true"><span>✦</span></div><div><div class="brand">NAVE<span>STAR</span><small>3D</small></div><div class="brand-under">HANGAR DE FROTA</div></div></div>
   <div class="breadcrumbs"><span>PORTO AURORA</span><span class="sep">/</span><b>ESCOLHER NAVE</b></div>
   <div class="top-actions"><span class="live-dot"></span><span class="online">PILOTO <?= htmlspecialchars(mb_strtoupper($username, 'UTF-8'), ENT_QUOTES, 'UTF-8') ?></span><a class="back-game" href="index.php">VOLTAR AO JOGO</a></div>
  </header>
  <div class="hangar-layout">
   <aside class="fleet-panel panel">
    <div class="panel-heading"><div><div class="eyebrow">FROTA ESTELAR // CATÁLOGO</div><h2>Escolha sua nave</h2><p>Inspecione os dez modelos antes de selecionar.</p></div><span class="count-square">10</span></div>
    <div class="fleet-filter"><span class="filter-light"></span><span>MODELOS DISPONÍVEIS</span><span class="filter-count">10/10</span></div>
    <nav id="ship-list" class="ship-list" aria-label="Catálogo de naves"></nav>
    <div class="panel-bottom"><span class="bottom-cross">✦</span><div><b>HANGAR A-07</b><span>Escolha um modelo da frota</span></div></div>
   </aside>
   <main id="ship-stage" class="stage panel" data-type="PADRÃO">
    <div class="stage-stars" aria-hidden="true"></div><div class="stage-glow" aria-hidden="true"></div>
    <div class="stage-head"><div class="stage-kicker"><span class="small-diamond"></span> VISUALIZADOR TRIDIMENSIONAL <span class="kicker-divider">/</span> WEBGL 2.0</div><span class="stage-tech"><span class="activity-led"></span> TEMPO REAL</span></div>
    <div class="stage-corners corner-lt"></div><div class="stage-corners corner-rt"></div><div class="stage-corners corner-lb"></div><div class="stage-corners corner-rb"></div><div class="ring-guide guide-one"></div><div class="ring-guide guide-two"></div><div class="center-line horizontal"></div><div class="center-line vertical"></div>
    <div class="stage-model-index">NS–<span id="ship-number">01</span><span class="model-index-small">HOLOGRAMA / UNIDADE</span></div>
    <canvas id="ship-canvas" tabindex="0" aria-label="Modelo 3D da nave. Arraste para girar e use a roda para aproximar"></canvas><div id="render-error" class="render-error" hidden></div>
    <div class="float-coordinates"><span>ESCALA LIVRE</span><span class="coords-value">X / Y / Z</span><span>● GIRO EM 360°</span></div>
    <div class="stage-bottom"><div class="stage-description"><span class="desc-live"><span class="desc-pulse"></span> MODELO 3D ATIVO</span><h1 id="detail-title">Nave Padrão Alpha</h1><p id="detail-subtitle">Exploradora multipropósito</p></div><div class="orbit-hint"><span class="mouse-icon" aria-hidden="true"></span><span>ARRASTE PARA GIRAR<br><small>SCROLL PARA ZOOM</small></span></div></div>
    <div class="stage-controls"><button id="btn-prev" aria-label="Nave anterior">‹</button><button id="btn-front">Frente</button><button id="btn-side">Lateral</button><button id="btn-top">Superior</button><button id="btn-reset">↺ Reset</button><span class="ctrl-divider"></span><button id="btn-zoom-out" aria-label="Afastar">−</button><button id="btn-zoom-in" aria-label="Aproximar">+</button><button id="btn-next" aria-label="Próxima nave">›</button></div>
   </main>
   <aside class="spec-panel panel">
    <div class="spec-top"><span class="eyebrow">REGISTRO DA AERONAVE</span><span class="spec-serial">ID <span id="spec-number">NS–0001</span></span></div>
    <div class="identity"><div class="ship-emblem">✦</div><div class="identity-label">CLASSE / CATEGORIA</div><div id="detail-type" class="type-name">PADRÃO</div><div class="identity-rule"></div><div class="spec-large-title">Ficha técnica</div><p id="detail-role">Patrulha e exploração.</p></div>
    <div class="spec-section-title">CARACTERÍSTICAS DA NAVE <span>01—03</span></div>
    <div class="measure"><div class="measure-label"><span>VELOCIDADE</span><b id="value-speed">79 / 100</b></div><div class="measure-track"><span id="bar-speed"></span></div></div><div class="measure"><div class="measure-label"><span>BLINDAGEM</span><b id="value-armor">65 / 100</b></div><div class="measure-track"><span id="bar-armor"></span></div></div><div class="measure"><div class="measure-label"><span>CAPACIDADE DE CARGA</span><b id="value-cargo">42 / 100</b></div><div class="measure-track"><span id="bar-cargo"></span></div></div>
    <div class="spec-section-title ship-params-title">DADOS OPERACIONAIS <span>04—07</span></div><dl class="detail-grid"><div><dt>TRIPULAÇÃO</dt><dd id="spec-crew">2–6</dd></div><div><dt>PORTE</dt><dd id="spec-size">Média</dd></div><div><dt>AUTONOMIA</dt><dd id="spec-range">LONGO</dd></div><div><dt>CLASSIFICAÇÃO</dt><dd id="spec-class">PADRÃO</dd></div></dl>
    <div class="spec-section-title ship-equipment-title">RECURSOS ESPECIAIS</div><div id="feature-tags" class="feature-tags"></div><div class="spec-spacer"></div>
    <button id="btn-spin" class="spin-control" aria-pressed="true"><span class="spin-symbol">⟳</span><span class="spin-label">Giro automático: ON</span><span class="toggle-track"><span></span></span></button>
    <button class="ship-choice" id="select-ship">SELECIONAR ESTA NAVE</button>
   </aside>
  </div>
  <footer class="page-footer"><span>© NAVESTAR — FROTA ESTELAR 3D</span><span>10 NAVES / WEBGL NATIVO</span><span>HANGAR A-07 • PORTO AURORA</span></footer>
 </div>
 <div id="hangar-notice" class="hangar-notice" role="status" aria-live="polite" hidden></div>
  <script src="assets/hangar3d/naves3d.js?v=2"></script>
 <script>
 (()=>{const current=<?= json_encode($shipClass) ?>,currentShipName=<?= json_encode($shipName, JSON_UNESCAPED_UNICODE) ?>,csrf=<?= json_encode($csrf) ?>,notice=document.querySelector('#hangar-notice'),button=document.querySelector('#select-ship');let currentModel=0;let timer;
  function message(text){notice.textContent=text;notice.hidden=false;clearTimeout(timer);timer=setTimeout(()=>notice.hidden=true,5000)}
  function selectShip(index){currentModel=index;window.NaveStarHangar?.openShip(index)}
  window.addEventListener('load',()=>{let savedModel=window.NaveStarShipNames?.findIndex(name=>currentShipName.startsWith(name))??-1,initial=savedModel>=0?savedModel:(window.NaveStarShipModels?.[current]??0);selectShip(initial)});  button.addEventListener('click',async()=>{const model=window.NaveStarShipModels?.[currentModel];if(!model){message('Não foi possível identificar esta nave.');return}button.disabled=true;button.textContent='ATUALIZANDO HANGAR…';try{const response=await fetch('hangar-activate.php',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({model,visualModel:currentModel,visualName:window.NaveStarShipNames?.[currentModel]}),credentials:'same-origin'});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'Não foi possível selecionar a nave.');button.textContent='NAVE SELECIONADA';message(data.message||'Nave selecionada. Voltando ao jogo…');setTimeout(()=>location.href='index.php',800)}catch(error){message(error.message);button.disabled=false;button.textContent='SELECIONAR ESTA NAVE'}});
 })();
 </script>
</body>
</html>
