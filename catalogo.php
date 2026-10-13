<?php
declare(strict_types=1);
$catalog = require __DIR__ . '/world-catalog.php';
$stations = array_values(array_filter($catalog['bodies'], static fn(array $body): bool => isset($body['design'])));
$h = static fn($value): string => htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');

?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Catálogo do setor | NAVE</title>
  <style>
    :root{color-scheme:dark;--bg:#040b14;--panel:#091724;--panel2:#0c2030;--line:#244857;--cyan:#75e7ed;--muted:#88aab5;--gold:#f1c777;--green:#73e4c2}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 52% 0,#102a3a 0,transparent 48%),var(--bg);color:#e5f4f6;font:14px 'Segoe UI',Arial,sans-serif}button,a{font:inherit}a{color:inherit;text-decoration:none}
    .top{position:sticky;top:0;z-index:5;min-height:76px;padding:12px clamp(14px,3vw,38px);display:flex;align-items:center;gap:24px;border-bottom:1px solid var(--line);background:#06111dee;backdrop-filter:blur(16px)}.brand{font:700 15px 'Courier New',monospace;letter-spacing:.22em;white-space:nowrap}.brand b{color:var(--cyan)}.nav{display:flex;align-items:center;gap:6px;flex:1}.nav button,.nav a{padding:10px 13px;border:1px solid transparent;border-radius:3px;background:transparent;color:#9bbbc5;font:9px 'Courier New',monospace;letter-spacing:.08em;cursor:pointer;white-space:nowrap}.nav button:hover,.nav a:hover,.nav [aria-selected="true"]{border-color:#386a78;background:#102b38;color:#dffcff}.nav .avatar-link{margin-left:auto;border-color:#916f3e;color:#ffe1a2}.nav .game-link{border-color:#347887;color:#b9f4f0}
    main{max-width:1400px;margin:auto;padding:clamp(18px,3vw,38px)}.heading{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:22px}.eyebrow{color:#75bdc9;font:9px 'Courier New',monospace;letter-spacing:.18em;text-transform:uppercase}.heading h1{margin:6px 0;font-size:clamp(27px,4vw,42px);font-weight:500;letter-spacing:.02em}.heading p{margin:0;color:var(--muted);font-size:13px}.count{padding:10px 13px;border:1px solid var(--line);color:#99c7cf;font:9px 'Courier New',monospace;white-space:nowrap}
    .toolbar{display:flex;gap:10px;align-items:center;margin-bottom:15px}.search{width:min(420px,100%);padding:12px 14px;border:1px solid #315967;border-radius:3px;outline:0;background:#06131f;color:#effbfc}.search:focus{border-color:var(--cyan);box-shadow:0 0 18px #51dce522}.hint{color:#7598a4;font:8px 'Courier New',monospace;letter-spacing:.08em}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.card{position:relative;min-width:0;overflow:hidden;padding:15px;border:1px solid var(--line);border-radius:5px;background:linear-gradient(145deg,#0d2231,#08141f 70%);box-shadow:0 8px 24px #0003;transition:transform .18s,border-color .18s}.card:hover{transform:translateY(-3px);border-color:#5aabb7}.card h2{margin:7px 0 3px;font-size:17px;font-weight:600}.card p{margin:0;color:#91afb8;font-size:12px;line-height:1.5}.tag{color:#69d8df;font:8px 'Courier New',monospace;letter-spacing:.14em}.station-art{height:164px;display:grid;place-items:center;position:relative;overflow:hidden;margin:-15px -15px 13px;background:radial-gradient(ellipse at 50% 62%,color-mix(in srgb,var(--accent) 23%,transparent),transparent 57%),linear-gradient(160deg,#10283a,#07121f)}.station-art:before,.station-art:after{content:none}.station-model-canvas{position:relative;z-index:1;display:block;width:100%;height:100%}.station-design{position:absolute;right:10px;top:9px;color:#8baab3;font:8px 'Courier New',monospace}.station-core{display:none}.coords{display:flex;gap:15px;margin-top:13px;padding-top:10px;border-top:1px solid #23404c;color:#769aa5;font:8px 'Courier New',monospace}.coords b{color:#cce6e9;font-weight:400}.open-map{display:inline-block;margin-top:12px;padding:8px 10px;border:1px solid #397785;color:#b7eff0;font:8px 'Courier New',monospace;letter-spacing:.08em}.open-map:hover{background:#153745}
    .station-art:before{content:'';position:absolute;display:block;z-index:0;left:-74px;bottom:-235px;width:330px;height:330px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#c7f7ff 0,#52b9ef 18%,#1264aa 52%,#041b43 78%);box-shadow:inset -22px 16px 45px #041126,0 0 48px #168be866;opacity:.5}.station-art:after{content:'';position:absolute;inset:0;z-index:0;display:block;background-image:radial-gradient(1px 1px at 13% 21%,#e8fbff 99%,transparent),radial-gradient(1px 1px at 24% 73%,#e8fbff 99%,transparent),radial-gradient(1px 1px at 53% 19%,#e8fbff 99%,transparent),radial-gradient(1px 1px at 72% 34%,#e8fbff 99%,transparent),radial-gradient(1px 1px at 89% 77%,#e8fbff 99%,transparent),radial-gradient(1px 1px at 61% 86%,#e8fbff 99%,transparent);opacity:.8;pointer-events:none}.station-model-canvas{z-index:1;filter:drop-shadow(0 8px 10px #000b)}
    .crew-card{display:grid;grid-template-columns:68px 1fr;align-items:center;gap:11px;min-height:112px}.portrait{position:relative;display:block;width:66px;height:82px;overflow:hidden;border:1px solid #3c6978;border-radius:4px;background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--trim) 23%,#14283a),#07121d 72%)}.portrait:before{content:'';position:absolute;top:13px;left:21px;width:24px;height:27px;border-radius:45% 45% 40% 40%;background:var(--skin);box-shadow:0 -7px 0 3px var(--hair)}.portrait:after{content:'';position:absolute;left:10px;right:10px;bottom:-14px;height:55px;border:2px solid color-mix(in srgb,var(--trim) 65%,#7595a2);border-radius:18px 18px 0 0;background:linear-gradient(100deg,var(--secondary),var(--body))}.portrait i{position:absolute;z-index:2;left:28px;top:53px;width:10px;height:12px;background:var(--trim);clip-path:polygon(0 0,100% 0,60% 100%,40% 100%)}.crew-card h2{margin:0 0 5px;font-size:15px}.crew-card p{font-size:10px}.crew-role{margin-top:8px;color:#75c8d0;font:7px 'Courier New',monospace;letter-spacing:.1em}
    .ship-card{padding:12px}.ship-art-wrap{height:120px;margin:-12px -12px 11px;overflow:hidden;border-bottom:1px solid #234450;background:radial-gradient(ellipse at 50% 85%,#2b99ad30,transparent 68%),#07131f}.ship-art{display:block;width:100%;height:100%;filter:drop-shadow(0 7px 10px #0008)}.ship-meta{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.chip{padding:5px 7px;border:1px solid #244856;color:#a5c5cc;font:7px 'Courier New',monospace}.price{margin-left:auto;color:var(--gold);font:9px 'Courier New',monospace}.ship-card p{min-height:36px}.empty{padding:30px;border:1px dashed var(--line);color:var(--muted);text-align:center}.screen[hidden]{display:none!important}
    @media(max-width:1050px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.top{align-items:flex-start;flex-direction:column;gap:9px}.nav{width:100%;overflow:auto}.nav .avatar-link{margin-left:0}.nav button,.nav a{padding:9px 10px}.heading{align-items:flex-start;flex-direction:column}.count{white-space:normal}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){main{padding:17px 12px}.grid{grid-template-columns:1fr}.crew-card{grid-template-columns:74px 1fr}.station-art{height:115px}.toolbar{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
<header class="top">
  <a class="brand" href="index.php">N<b>A</b>VE <span style="color:#7197a4;font-size:9px;letter-spacing:.12em">/ CENTRAL DO SETOR</span></a>
  <nav class="nav" role="tablist" aria-label="Telas do catálogo">
    <button type="button" role="tab" id="tab-stations" aria-controls="stations" aria-selected="true" data-screen="stations">ESTAÇÕES <span><?= count($stations) ?></span></button>
    <button type="button" role="tab" id="tab-crew" aria-controls="crew" aria-selected="false" data-screen="crew">PERSONAGENS</button>
    <button type="button" role="tab" id="tab-ships" aria-controls="ships" aria-selected="false" data-screen="ships">NAVES</button>
    <a class="avatar-link" href="avatar.php">ESCOLHER AVATAR</a>
    <a class="game-link" href="index.php">VOLTAR AO JOGO</a>
  </nav>
</header>
<main>
  <section class="screen" id="stations" role="tabpanel" aria-labelledby="tab-stations">
    <div class="heading"><div><div class="eyebrow">Rede de navegação / setor conhecido</div><h1>Estações espaciais</h1><p>Consulte as estações cadastradas e abra sua posição no mapa estelar.</p></div><div class="count"><?= count($stations) ?> ESTAÇÕES MAPEADAS</div></div>
    <div class="toolbar"><input class="search" type="search" placeholder="Buscar estação" aria-label="Buscar estação" data-search="stations"><span class="hint">CLIQUE EM “ABRIR NO MAPA” PARA LOCALIZAR</span></div>
    <div class="grid" id="stationGrid">
      <?php foreach ($stations as $station): ?>
        <article class="card station-card" data-filter-card="stations" data-search-text="<?= $h($station['name']) ?>">
          <div class="station-art" style="--accent:<?= $h($station['color'] ?? '#75e7ed') ?>"><span class="station-design">MODELO <?= (int)$station['design'] + 1 ?></span><canvas class="station-model-canvas" data-design="<?= (int)$station['design'] ?>" data-color="<?= $h($station['color'] ?? '#75e7ed') ?>" aria-label="Modelo 3D de <?= $h($station['name']) ?>"></canvas></div>
          <span class="tag">ESTAÇÃO / <?= strtoupper($h($station['id'])) ?></span><h2><?= $h($station['name']) ?></h2>
          <div class="coords"><span>X <b><?= number_format((float)$station['x'], 0, ',', '.') ?></b></span><span>Z <b><?= number_format((float)$station['z'], 0, ',', '.') ?></b></span></div>
          <a class="open-map" href="mapa.php?target=<?= rawurlencode((string)$station['id']) ?>">ABRIR NO MAPA →</a>
        </article>
      <?php endforeach; ?>
    </div>
  </section>
  <section class="screen" id="crew" role="tabpanel" aria-labelledby="tab-crew" hidden>
    <div class="heading"><div><div class="eyebrow">Banco de tripulantes / avatares disponíveis</div><h1>Personagens</h1><p>Conheça os avatares que podem representar sua tripulação no setor.</p></div><a class="open-map" href="avatar.php">PERSONALIZAR MEU AVATAR →</a></div>
    <div class="toolbar"><input class="search" type="search" placeholder="Buscar personagem ou função" aria-label="Buscar personagem" data-search="crew"><span class="hint">10 IDENTIDADES DE TRIPULAÇÃO</span></div>
    <div class="grid" id="crewGrid"></div>
  </section>
  <section class="screen" id="ships" role="tabpanel" aria-labelledby="tab-ships" hidden>
    <div class="heading"><div><div class="eyebrow">Registro de projeto / frota civil e tática</div><h1>Naves</h1><p>Compare os modelos, as funções e a capacidade de cada nave.</p></div><div class="count" id="shipCount">PROJETOS REGISTRADOS</div></div>
    <div class="toolbar"><input class="search" type="search" placeholder="Buscar nave ou classe" aria-label="Buscar nave" data-search="ships"><span class="hint">CAPACIDADE · COMBUSTÍVEL · CASCO</span></div>
    <div class="grid" id="shipGrid"></div>
  </section>
</main>
<script src="station-model-renderer.js?v=20261012-stations24"></script><script src="ship-catalog.js"></script>
<script src="crew-avatar-models.js?v=20261011-catalog1"></script>
<script>
(()=>{
  const tabs=[...document.querySelectorAll('[role="tab"][data-screen]')],screens=[...document.querySelectorAll('.screen')];
  function renderStationModels(){document.querySelectorAll('.station-model-canvas').forEach(canvas=>{const box=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);if(box.width<1||box.height<1)return;canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,box.width,box.height);window.stationModelRenderer.draw(ctx,{design:Number(canvas.dataset.design),color:canvas.dataset.color},{width:box.width,height:box.height},{yaw:.45,pitch:.12})})}
  renderStationModels();window.addEventListener('resize',renderStationModels);
  function showScreen(id){tabs.forEach(tab=>{const active=tab.dataset.screen===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});screens.forEach(screen=>screen.hidden=screen.id!==id);history.replaceState(null,'','#'+id)}
  tabs.forEach(tab=>tab.addEventListener('click',()=>showScreen(tab.dataset.screen)));
  const crewLabels={captain:['Capitão','Comando da estação','Masculino'],pilot:['Piloto','Navegação de voo','Feminino'],engineer:['Engenheiro','Sistemas e reparos','Masculino'],medic:['Médica','Saúde da tripulação','Feminino'],security:['Segurança','Proteção e vigilância','Masculino'],navigator:['Navegadora','Mapas e trajetórias','Feminino'],scientist:['Cientista','Pesquisa orbital','Masculino'],comms:['Comunicações','Operação de sinais','Feminino'],mechanic:['Mecânico','Manutenção pesada','Alienígena'],cadet:['Cadete','Treinamento espacial','Jovem']};
  const crew=window.crewAvatarCatalog||[];document.querySelector('#crewGrid').innerHTML=crew.map(person=>{const [name,role,type]=crewLabels[person.id]||[person.name,person.role,person.type];return `<article class="card crew-card" data-filter-card="crew" data-search-text="${name} ${role}"><span class="portrait" style="--body:${person.body};--secondary:${person.secondary};--skin:${person.skin};--hair:${person.hair};--trim:${person.trim}"><i></i></span><div><span class="tag">${String(person.id).toUpperCase()}</span><h2>${name}</h2><p>${role}</p><div class="crew-role">${type.toUpperCase()} / TRIPULAÇÃO</div></div></article>`}).join('');
  const ships=window.shipCatalog||{};document.querySelector('#shipCount').textContent=Object.keys(ships).length+' MODELOS';document.querySelector('#shipGrid').innerHTML=Object.entries(ships).map(([id,ship])=>`<article class="card ship-card" data-filter-card="ships" data-search-text="${ship.name} ${ship.role}"><div class="ship-art-wrap">${window.shipArt(id)}</div><span class="tag">${String(id).toUpperCase()} / ${ship.tag}</span><h2>${ship.name}</h2><p>${ship.summary}</p><div class="ship-meta"><span class="chip">CARGA ${Number(ship.cargo).toLocaleString('pt-BR')} KG</span><span class="chip">TANQUE ${Number(ship.fuel).toLocaleString('pt-BR')} U</span><span class="chip">CASCO ${Number(ship.hull)} HP</span><span class="price">${ship.price?Number(ship.price).toLocaleString('pt-BR')+' CR':'INICIAL'}</span></div></article>`).join('');
  document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('input',()=>{const query=input.value.trim().toLocaleLowerCase('pt-BR');document.querySelectorAll(`[data-filter-card="${input.dataset.search}"]`).forEach(card=>card.hidden=!card.dataset.searchText.toLocaleLowerCase('pt-BR').includes(query))}));
  const hash=location.hash.slice(1);showScreen(['stations','crew','ships'].includes(hash)?hash:'stations');window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(['stations','crew','ships'].includes(next))showScreen(next)});
})();
</script>
</body>
</html>
