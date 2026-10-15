<!doctype html>
<html lang="pt-BR">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <meta name="color-scheme" content="dark">
 <meta name="theme-color" content="#06111f">
 <title>NaveStar — Hangar 3D | Frota Estelar</title>
 <link rel="stylesheet" href="estilos.css">
</head>
<body>
 <div class="site-shell">
  <header class="topbar">
   <div class="brand-wrap"><div class="brand-mark" aria-hidden="true"><span>✦</span></div><div><div class="brand">NAVE<span>STAR</span><small>3D</small></div><div class="brand-under">SIMULADOR DE FROTA ESPACIAL</div></div></div>
   <div class="breadcrumbs"><span>ESTAÇÃO CENTRAL</span><span class="sep">/</span><b>HANGAR DE NAVES</b></div>
   <div class="top-actions"><span class="live-dot"></span><span class="online">SISTEMAS OPERACIONAIS</span><span class="ship-count">10 <small>NAVES</small></span></div>
  </header>
  <div class="hangar-layout">
   <aside class="fleet-panel panel">
    <div class="panel-heading"><div><div class="eyebrow">FROTA ESTELAR // CATÁLOGO</div><h2>Escolha sua nave</h2><p>Dez modelos tridimensionais disponíveis.</p></div><span class="count-square">10</span></div>
    <div class="fleet-filter"><span class="filter-light"></span><span>MODELOS DISPONÍVEIS</span><span class="filter-count">10/10</span></div>
    <nav id="ship-list" class="ship-list" aria-label="Catálogo de naves"></nav>
    <div class="panel-bottom"><span class="bottom-cross">✦</span><div><b>HANGAR A-07</b><span>Selecione uma nave para inspecionar</span></div></div>
   </aside>
   <main id="ship-stage" class="stage panel" data-type="PADRÃO">
    <div class="stage-stars" aria-hidden="true"></div><div class="stage-glow" aria-hidden="true"></div>
    <div class="stage-head"><div class="stage-kicker"><span class="small-diamond"></span> VISUALIZADOR TRIDIMENSIONAL <span class="kicker-divider">/</span> WEBGL 2.0</div><span class="stage-tech"><span class="activity-led"></span> TEMPO REAL</span></div>
    <div class="stage-corners corner-lt"></div><div class="stage-corners corner-rt"></div><div class="stage-corners corner-lb"></div><div class="stage-corners corner-rb"></div>
    <div class="ring-guide guide-one"></div><div class="ring-guide guide-two"></div><div class="center-line horizontal"></div><div class="center-line vertical"></div>
    <div class="stage-model-index">NS–<span id="ship-number">01</span><span class="model-index-small">HOLOGRAMA / UNIDADE</span></div>
    <canvas id="ship-canvas" tabindex="0" aria-label="Visualização 3D: arraste para girar, role para aproximar, clique duas vezes para redefinir"></canvas>
    <div id="render-error" class="render-error" hidden></div>
    <div class="float-coordinates"><span>ESCALA LIVRE</span><span class="coords-value">X / Y / Z</span><span>● GIRO EM 360°</span></div>
    <div class="stage-bottom">
     <div class="stage-description"><span class="desc-live"><span class="desc-pulse"></span> MODELO 3D ATIVO</span><h1 id="detail-title">Nave Padrão Alpha</h1><p id="detail-subtitle">Exploradora multipropósito</p></div>
     <div class="orbit-hint"><span class="mouse-icon" aria-hidden="true"></span><span>ARRASTE PARA GIRAR<br><small>SCROLL PARA ZOOM</small></span></div>
    </div>
    <div class="stage-controls"><button id="btn-prev" aria-label="Nave anterior" title="Nave anterior">‹</button><button id="btn-front">Frente</button><button id="btn-side">Lateral</button><button id="btn-top">Superior</button><button id="btn-reset">↺ Reset</button><span class="ctrl-divider"></span><button id="btn-zoom-out" title="Afastar" aria-label="Afastar">−</button><button id="btn-zoom-in" title="Aproximar" aria-label="Aproximar">+</button><button id="btn-next" aria-label="Próxima nave" title="Próxima nave">›</button></div>
   </main>
   <aside class="spec-panel panel">
    <div class="spec-top"><span class="eyebrow">REGISTRO DA AERONAVE</span><span class="spec-serial">ID <span id="spec-number">NS–0001</span></span></div>
    <div class="identity"><div class="ship-emblem">✦</div><div class="identity-label">CLASSE / CATEGORIA</div><div id="detail-type" class="type-name">PADRÃO</div><div class="identity-rule"></div><div class="spec-large-title">Ficha técnica</div><p id="detail-role">Patrulha e exploração.</p></div>
    <div class="spec-section-title">CARACTERÍSTICAS DA NAVE <span>01—03</span></div>
    <div class="measure"><div class="measure-label"><span>VELOCIDADE</span><b id="value-speed">79 / 100</b></div><div class="measure-track"><span id="bar-speed"></span></div></div>
    <div class="measure"><div class="measure-label"><span>BLINDAGEM</span><b id="value-armor">65 / 100</b></div><div class="measure-track"><span id="bar-armor"></span></div></div>
    <div class="measure"><div class="measure-label"><span>CAPACIDADE DE CARGA</span><b id="value-cargo">42 / 100</b></div><div class="measure-track"><span id="bar-cargo"></span></div></div>
    <div class="spec-section-title ship-params-title">DADOS OPERACIONAIS <span>04—07</span></div>
    <dl class="detail-grid"><div><dt>TRIPULAÇÃO</dt><dd id="spec-crew">2–6</dd></div><div><dt>PORTE</dt><dd id="spec-size">Média</dd></div><div><dt>AUTONOMIA</dt><dd id="spec-range">LONGO</dd></div><div><dt>CLASSIFICAÇÃO</dt><dd id="spec-class">PADRÃO</dd></div></dl>
    <div class="spec-section-title ship-equipment-title">RECURSOS ESPECIAIS</div><div id="feature-tags" class="feature-tags"></div>
    <div class="spec-spacer"></div>
    <button id="btn-spin" class="spin-control" aria-pressed="true"><span class="spin-symbol">⟳</span><span class="spin-label">Giro automático: ON</span><span class="toggle-track"><span></span></span></button>
    <div class="foot-disclaimer">MODELOS 3D PROCEDURAIS <span>◆</span> NAVE STAR ENGINE</div>
   </aside>
  </div>
  <footer class="page-footer"><span>© NAVESTAR — FROTA ESTELAR 3D</span><span>10 NAVES / 6 CATEGORIAS / WEBGL NATIVO</span><span>ESTAÇÃO A-07 • GALÁXIA CENTRAL</span></footer>
  <span class="sr-only" role="status" aria-live="polite" id="live-ship"></span>
 </div>
 <script src="naves3d.js" defer></script>
</body>
</html>
