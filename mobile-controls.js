(() => {
  const style = document.createElement('style');
  style.textContent = `
    .mobile-cockpit{display:none}
    @media(max-width:767px){
      html,body{width:100%;height:100%;height:100dvh;overflow:hidden;overscroll-behavior:none}
      #space{height:100dvh;inset:0;touch-action:none}
      .grain,.reticle,.labels{pointer-events:none}
      .top,.leftpanel,.bottomleft,.bottomright,.help,.control-sidebar,#leftControlDock{display:none!important}
      .mobile-cockpit{position:fixed;inset:0;z-index:35;display:block;height:100dvh;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);pointer-events:none;font-family:'Space Mono',monospace;color:#e9fbff;touch-action:none;user-select:none;-webkit-user-select:none}
      .mc-hud{position:absolute;top:calc(env(safe-area-inset-top) + 8px);left:50%;transform:translateX(-50%);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;width:min(360px,calc(100vw - 112px));padding:6px;border:1px solid #55d8eb55;border-radius:13px;background:linear-gradient(135deg,#061521df,#071b28c9);box-shadow:0 0 20px #20cde41c;backdrop-filter:blur(10px)}
      .mc-stat{min-width:0;text-align:center}.mc-stat b{display:block;font-size:11px;line-height:1.2;font-weight:500;color:#dcfaff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mc-stat small{display:block;margin-top:3px;font-size:7px;letter-spacing:.1em;color:#71b9c8}.mc-integrity{grid-column:span 2}.mc-target{grid-column:span 3;text-align:left;padding-left:4px}.mc-target b{font-size:9px}.mc-target small{text-align:left}.mc-target .mc-loc{display:block;margin-top:2px;font-size:6px;color:#6699a7}.mc-bar{height:2px;margin-top:4px;background:#123340}.mc-bar i{display:block;width:100%;height:100%;background:#57dfe8;box-shadow:0 0 7px #57dfe8}
      .mc-menu-toggle{position:absolute;top:calc(env(safe-area-inset-top) + 8px);left:calc(env(safe-area-inset-left) + 8px);z-index:4;width:44px;height:44px;border:1px solid #68e7efaa;border-radius:13px;background:linear-gradient(145deg,#0b3040f2,#061622f2);color:#bdfcff;font:24px 'Space Mono';box-shadow:0 0 18px #26cde433;pointer-events:auto;touch-action:manipulation}.mc-menu-toggle:active,.mc-menu-toggle[aria-expanded="true"]{background:#0c5363;color:#fff;box-shadow:0 0 16px #26cde477}.mc-menu{position:absolute;top:calc(env(safe-area-inset-top) + 60px);left:calc(env(safe-area-inset-left) + 8px);z-index:4;display:none;grid-template-columns:repeat(4,42px);gap:7px;padding:8px;border:1px solid #54c9dc70;border-radius:14px;background:#04121eeF;box-shadow:0 8px 24px #0009;backdrop-filter:blur(12px);pointer-events:auto}.mc-menu.open{display:grid}.mc-menu .mc-icon{width:42px;height:42px;border:1px solid #54c9dc70;border-radius:11px;background:#061b29;color:#9af4ff;font-size:19px;touch-action:manipulation}.mc-menu .mc-icon:active,.mc-menu .mc-icon.active{background:#0c5363;color:#fff;border-color:#7af6ff;box-shadow:0 0 14px #26cde477}.mc-menu .mc-icon small{display:none}
      .mc-joystick{position:absolute;left:calc(env(safe-area-inset-left) + 18px);bottom:calc(env(safe-area-inset-bottom) + 20px);width:142px;height:142px;border:1px solid #5cd7e55e;border-radius:50%;background:radial-gradient(circle,#1a60715c,#061724b8 68%);box-shadow:inset 0 0 28px #41d0e91c,0 6px 24px #0008;pointer-events:auto;touch-action:none}
      .mc-joystick:before,.mc-joystick:after{content:'';position:absolute;background:#67cbd633}.mc-joystick:before{width:1px;height:100%;left:50%}.mc-joystick:after{height:1px;width:100%;top:50%}
      .mc-stick{position:absolute;left:50%;top:50%;width:54px;height:54px;transform:translate(-50%,-50%);border:1px solid #7ce7f4;border-radius:50%;background:radial-gradient(circle at 35% 30%,#3191a4,#0a3041 78%);box-shadow:0 0 18px #37d5eb55;pointer-events:none}
      .mc-actions{position:absolute;right:calc(env(safe-area-inset-right) + 16px);bottom:calc(env(safe-area-inset-bottom) + 20px);display:grid;grid-template-columns:58px 58px;grid-template-rows:58px 48px;gap:8px;align-items:center;pointer-events:auto}
      .mc-action{border:1px solid #5cd5e577;border-radius:18px;background:linear-gradient(145deg,#0b3040e8,#061622ed);color:#bffaff;font:8px 'Space Mono';letter-spacing:.06em;box-shadow:0 4px 18px #0008;touch-action:none}.mc-action:active,.mc-action.pressed{transform:scale(.95);background:#126175;color:white;box-shadow:0 0 18px #3be4ee66}.mc-fire{grid-column:2;grid-row:1;width:66px;height:66px;margin-left:-4px;border-radius:50%;border-color:#ff6f7180;color:#ffaaaa;background:radial-gradient(circle,#6e242a,#1e101b)}.mc-fire:active,.mc-fire.pressed{background:#a8343b}.mc-boost{grid-column:1;grid-row:1;width:56px;height:56px;border-color:#ffb34f70;color:#ffd58d}.mc-brake{grid-column:1;grid-row:2}.mc-thrust{grid-column:2;grid-row:2}
      .mc-pop{position:absolute;z-index:2;display:none;left:auto;right:calc(env(safe-area-inset-right) + 10px);top:calc(env(safe-area-inset-top) + 60px);width:min(255px,calc(100vw - 82px));max-height:min(43dvh,calc(100dvh - 220px));overflow:auto;padding:11px;border:1px solid #59d8e67a;border-radius:14px;background:#04121eeF;box-shadow:0 10px 35px #000a,0 0 20px #1dbbce20;backdrop-filter:blur(14px);pointer-events:auto;overscroll-behavior:contain}.mc-pop.open{display:block}.mc-pop h3{margin:0 0 8px;font:9px 'Space Mono';letter-spacing:.14em;color:#7feaf1}.mc-pop .mapbox,.mc-pop .navbox,.mc-pop .route-panel,.mc-pop .cargo-bay{display:block!important;position:static!important;inset:auto!important;width:100%!important;min-width:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:8px!important;overflow:visible!important;box-sizing:border-box;background:#071b28!important;border:1px solid #3e9ba633!important;box-shadow:none!important}
      .mc-pop .map{height:110px}.mc-pop .maphead{font-size:8px}.mc-pop .navbox{max-height:32dvh!important;overflow:auto!important}.mc-pop .route-content{display:block!important}.mc-pop .route-content select,.mc-pop .route-content button{width:100%;margin-top:7px;padding:9px}.mc-pop .cargo-bay{max-height:35dvh!important;overflow:auto!important}.mc-pop .route-head{font-size:8px}.mc-pop .route-toggle,.mc-pop .cargo-fold{display:none!important}
      .mc-pop .mapbox .eyebrow,.mc-pop .mapbox .maphead span{font-size:7px}.mc-pop .targetbox{margin:0}.mc-context{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom) + 178px);transform:translateX(-50%);display:none;gap:6px;pointer-events:auto}.mc-context.visible{display:flex}.mc-context button{padding:8px 10px;border:1px solid #64d8df88;border-radius:10px;background:#06202cdb;color:#b9f9ef;font:7px 'Space Mono';touch-action:manipulation}.mc-context button:disabled{opacity:.35}
      .station-overlay.open{inset:auto 0 0!important;height:min(72dvh,650px)!important;padding:0!important;display:block!important;background:#020912eF!important;backdrop-filter:blur(12px)!important;z-index:80!important}.station-shell{width:100%!important;height:100%!important;max-height:100%!important;border-radius:18px 18px 0 0!important;border-bottom:0!important;overflow:hidden}.station-top{height:46px!important;padding:0 12px!important}.station-layout{height:calc(100% - 46px);overflow:auto!important}.station-market{padding:10px!important}.station-market .shipyard{margin:8px 0;padding:8px}.station-market .armory-grid{grid-template-columns:1fr 1fr!important;gap:6px}.station-market .shop-item{min-height:160px!important;padding:9px!important}.station-market .shop-item p{display:none}.station-market .resource-wallet{grid-template-columns:repeat(2,1fr)!important;margin:8px 0}.station-market .market-heading h1{font-size:17px!important}.station-market .market-heading p,.station-market .market-live{display:none}
      #friendsPanel.open{position:fixed!important;inset:auto 0 0!important;width:100%!important;max-width:none!important;height:min(70dvh,620px)!important;border-radius:18px 18px 0 0!important;z-index:80!important;overflow:auto!important}
    }
  `;
  document.head.appendChild(style);

  const ui = document.createElement('div');
  ui.className = 'mobile-cockpit';
  ui.innerHTML = `
    <div class="mc-hud" aria-label="Estado da nave">
      <div class="mc-stat mc-integrity"><b id="mcHull">100%</b><small>INTEGRIDADE</small><div class="mc-bar"><i id="mcHullBar"></i></div></div>
      <div class="mc-stat"><b id="mcFuel">—</b><small>COMBUSTÍVEL</small></div>
      <div class="mc-stat"><b id="mcSpeed">0</b><small>KM/S</small></div>
      <div class="mc-stat"><b id="mcCredits">—</b><small>CRÉDITOS</small></div>
      <div class="mc-stat mc-target"><b id="mcTarget">ALVO</b><small id="mcDistance">— KM</small><small class="mc-loc" id="mcLocation">SETOR —</small></div>
    </div>
    <button class="mc-menu-toggle" id="mcMenuToggle" type="button" aria-label="Abrir menu de sistemas" aria-expanded="false">☰</button>
    <nav class="mc-menu" id="mcMenu" aria-label="Abas da nave">
      <button class="mc-icon" data-panel="map" aria-label="Mapa" title="Mapa">⌖<small>MAPA</small></button>
      <button class="mc-icon" data-panel="route" aria-label="Navegação" title="Navegação">➤<small>ROTA</small></button>
      <button class="mc-icon" data-panel="cargo" aria-label="Inventário e carga" title="Inventário">▤<small>CARGA</small></button>
      <button class="mc-icon" data-panel="weapons" aria-label="Armas" title="Armas">✦<small>ARMAS</small></button>
      <button class="mc-icon" data-action="friends" aria-label="Amigos" title="Amigos">♧<small>AMIGOS</small></button>
      <button class="mc-icon" data-action="market" aria-label="Mercado" title="Mercado">◇<small>MERCADO</small></button>
      <button class="mc-icon" data-action="hangar" aria-label="Hangar" title="Hangar">▱<small>HANGAR</small></button>
      <button class="mc-icon" data-action="station" aria-label="Estação" title="Estação">⌂<small>ESTAÇÃO</small></button>
    </nav>
    <div class="mc-pop" id="mcPop" aria-live="polite"></div>
    <div class="mc-context" id="mcContext">
      <button data-click="#orbit">◉ ÓRBITA</button><button data-click="#dockButton">⚓ ACOPLAR</button><button data-click="#stationMarketButton">◇ MERCADO</button><button data-click="#stationAttackButton">✦ ATACAR ESTAÇÃO</button>
    </div>
    <div class="mc-joystick" id="mcJoystick" aria-label="Joystick de direção"><div class="mc-stick"></div></div>
    <div class="mc-actions" aria-label="Pilotagem">
      <button class="mc-action mc-boost" data-hold="w" aria-label="Aceleração contínua">▲<br>IMPULSO</button>
      <button class="mc-action mc-fire" id="mcFire" aria-label="Disparar">✦<br>FOGO</button>
      <button class="mc-action mc-brake" data-hold="s" aria-label="Frear">▼<br>FREIO</button>
      <button class="mc-action mc-thrust" data-action="autopilot" aria-label="Iniciar ou interromper a rota">➤<br>ROTA</button>
    </div>`;
  document.body.appendChild(ui);

  const media = matchMedia('(max-width:767px)');
  const menu = ui.querySelector('#mcMenu');
  const menuToggle = ui.querySelector('#mcMenuToggle');
  function setMenuOpen(open) {
    menu.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu de sistemas' : 'Abrir menu de sistemas');
    menuToggle.textContent = open ? '×' : '☰';
  }
  menuToggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
  menu.addEventListener('click', event => { if (event.target.closest('.mc-icon')) setMenuOpen(false); });
  const pop = ui.querySelector('#mcPop');
  const panelSlots = {};
  const panelSources = {
    map: ['.mapbox'], route: ['#routePanel'], cargo: ['#cargoBay'], weapons: ['.navbox']
  };
  function setMobileEnabled() {
    ui.style.display = media.matches ? 'block' : 'none';
    const hidden = !media.matches || document.querySelector('#stationScreen.open, .crew-interior.open, .passenger-cabin.open');
    if (hidden) closePop();
    ui.querySelectorAll('.mc-action,[data-hold]').forEach(button => { if (hidden) releaseButton(button); });
  }
  function releaseButton(button) {
    for (const id of [...heldPointers.keys()]) if (heldPointers.get(id) === button) heldPointers.delete(id);
    button.classList.remove('pressed');
    syncKeys();
  }
  function dispatchKey(key, type) {
    const arrow = key.startsWith('Arrow');
    const letter = key.length === 1;
    window.dispatchEvent(new KeyboardEvent(type, {key: arrow ? key : key.toLowerCase(), code: arrow ? key : `Key${key.toUpperCase()}`, bubbles:true, cancelable:true}));
  }
  const heldPointers = new Map();
  function syncKeys() {
    const keys = new Set();
    heldPointers.forEach(button => { if (button.dataset.hold) keys.add(button.dataset.hold); });
    const joy = ui.querySelector('#mcJoystick');
    if (joy.dataset.pointer) {
      const x = Number(joy.dataset.x || 0), y = Number(joy.dataset.y || 0);
      if (x < -.24) keys.add('a'); if (x > .24) keys.add('d');
      if (y < -.24) keys.add('w'); if (y > .24) keys.add('s');
    }
    const prior = new Set((ui.dataset.keys || '').split('|').filter(Boolean));
    prior.forEach(key => { if (!keys.has(key)) dispatchKey(key, 'keyup'); });
    keys.forEach(key => { if (!prior.has(key)) dispatchKey(key, 'keydown'); });
    ui.dataset.keys = [...keys].join('|');
  }
  ui.querySelectorAll('[data-hold]').forEach(button => {
    button.addEventListener('pointerdown', event => { event.preventDefault(); heldPointers.set(event.pointerId, button); button.classList.add('pressed'); button.setPointerCapture(event.pointerId); syncKeys(); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => button.addEventListener(type, event => { heldPointers.delete(event.pointerId); button.classList.remove('pressed'); syncKeys(); }));
  });
  const joystick = ui.querySelector('#mcJoystick'), stick = joystick.querySelector('.mc-stick');
  function moveStick(event) {
    const rect = joystick.getBoundingClientRect(), radius = rect.width * .34;
    const dx = event.clientX - (rect.left + rect.width/2), dy = event.clientY - (rect.top + rect.height/2), len = Math.hypot(dx,dy), scale = len > radius ? radius/len : 1;
    const x = dx*scale, y = dy*scale;
    stick.style.left = `calc(50% + ${x}px)`; stick.style.top = `calc(50% + ${y}px)`;
    joystick.dataset.x = String(x/radius); joystick.dataset.y = String(y/radius); syncKeys();
  }
  joystick.addEventListener('pointerdown', event => { event.preventDefault(); joystick.dataset.pointer = String(event.pointerId); joystick.setPointerCapture(event.pointerId); moveStick(event); });
  joystick.addEventListener('pointermove', event => { if (joystick.dataset.pointer === String(event.pointerId)) { event.preventDefault(); moveStick(event); } });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => joystick.addEventListener(type, event => { if (joystick.dataset.pointer !== String(event.pointerId)) return; delete joystick.dataset.pointer; delete joystick.dataset.x; delete joystick.dataset.y; stick.style.left='50%';stick.style.top='50%';syncKeys(); }));

  function closePop() {
    pop.classList.remove('open');
    Object.entries(panelSlots).forEach(([selector, marker]) => {
      const source = document.querySelector(selector);
      if (source && marker.parentNode) marker.parentNode.insertBefore(source, marker.nextSibling);
    });
    pop.replaceChildren(); ui.querySelectorAll('[data-panel]').forEach(button => button.classList.remove('active'));
  }
  function showPanel(name) {
    if (pop.classList.contains('open') && pop.dataset.panel === name) { closePop(); return; }
    closePop(); pop.dataset.panel = name;
    const title = document.createElement('h3'); title.textContent = ({map:'MAPA TÁTICO',route:'NAVEGAÇÃO',cargo:'INVENTÁRIO / CARGA',weapons:'SISTEMAS'})[name] || name.toUpperCase(); pop.appendChild(title);
    (panelSources[name] || []).forEach(selector => {
      const source = document.querySelector(selector); if (!source) return;
      if (!panelSlots[selector]) { const marker = document.createComment(`mobile-panel:${selector}`); source.parentNode.insertBefore(marker, source); panelSlots[selector] = marker; }
      pop.appendChild(source);
    });
    if (name === 'weapons') {
      const rows = ['#weaponReadout','#ammoReadout','#hullReadout','#fuelReadout','#energyReadout','#combatStatus'];
      rows.forEach(selector => { const source=document.querySelector(selector); if(source){const row=document.createElement('div');row.className='row';row.innerHTML=`<span>${selector.slice(1).replace('Readout','').replace('Status','').toUpperCase()}</span><span>${source.textContent}</span>`;pop.appendChild(row);} });
      const scan=document.querySelector('#scan'); if(scan){const button=document.createElement('button');button.className='ctrl';button.textContent='VARREDURA';button.addEventListener('click',()=>scan.click());pop.appendChild(button);}
    }
    pop.classList.add('open'); ui.querySelector(`[data-panel="${name}"]`)?.classList.add('active');
  }
  ui.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panel)));
  ui.querySelector('#mcFire').addEventListener('pointerdown', event => {event.preventDefault();event.currentTarget.classList.add('pressed'); document.querySelector('#fireWeapon')?.click();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => ui.querySelector('#mcFire').addEventListener(type,event=>event.currentTarget.classList.remove('pressed')));
  ui.querySelectorAll('[data-click]').forEach(button => button.addEventListener('click', () => document.querySelector(button.dataset.click)?.click()));
  ui.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action=button.dataset.action;
    if(action==='autopilot'){ document.querySelector('#routeGo')?.click(); return; }
    if(action==='friends'){ document.querySelector('#friendsToggle')?.click(); return; }
    const stationOpen=document.querySelector('#stationScreen')?.classList.contains('open');
    if(action==='market'){ if(stationOpen){document.querySelector('#stationMarketButton')?.click();return;}document.querySelector('#stationAccess button:nth-child(2),#stationMarketButton')?.click();return; }
    if(action==='hangar'){ if(stationOpen){document.querySelector('[data-station-tab="shipyard"],#shipyardTab')?.click();return;} document.querySelector('#stationMarketButton')?.click();return; }
    if(action==='station'){ document.querySelector('#dockButton')?.click(); }
  }));

  function updateHud() {
    if (!media.matches) return;
    const value = selector => document.querySelector(selector)?.textContent?.trim() || '—';
    const hull=value('#hullReadout'), fuel=value('#fuelReadout'), speed=value('#speed'), target=value('#targetname'), distance=value('#targetdist');
    ui.querySelector('#mcHull').textContent=hull; ui.querySelector('#mcFuel').textContent=fuel.split('/')[0].trim(); ui.querySelector('#mcSpeed').textContent=speed; ui.querySelector('#mcTarget').textContent=target; ui.querySelector('#mcDistance').textContent=distance.toUpperCase(); ui.querySelector('#mcLocation').textContent=value('#coordz').toUpperCase();
    const pct=Math.max(0,Math.min(100,parseFloat(hull)||0));ui.querySelector('#mcHullBar').style.width=pct+'%';ui.querySelector('#mcHullBar').style.background=pct<35?'#ff737b':'#57dfe8';
    const credits=value('#bayCredits');ui.querySelector('#mcCredits').textContent=credits.replace(/\s*CR/i,'');
    const stationButton=document.querySelector('#stationMarketButton'),dockButton=document.querySelector('#dockButton'),attack=document.querySelector('#stationAttackButton');
    const orbit=document.querySelector('#orbit');
    ui.querySelector('#mcContext').classList.toggle('visible',!!(stationButton&&!stationButton.disabled||dockButton&&!dockButton.disabled||attack&&!attack.disabled||orbit&&!orbit.disabled));
    ui.querySelectorAll('#mcContext [data-click="#orbit"]').forEach(b=>b.disabled=!orbit||orbit.disabled);
    ui.querySelectorAll('#mcContext [data-click="#stationMarketButton"]').forEach(b=>b.disabled=!stationButton||stationButton.disabled);
    ui.querySelectorAll('#mcContext [data-click="#dockButton"]').forEach(b=>b.disabled=!dockButton||dockButton.disabled);
    ui.querySelectorAll('#mcContext [data-click="#stationAttackButton"]').forEach(b=>b.disabled=!attack||attack.disabled);
  }
  const timer=setInterval(() => { setMobileEnabled(); updateHud(); },500); updateHud();
  media.addEventListener?.('change',setMobileEnabled);
  addEventListener('resize',updateHud); addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  setMobileEnabled();
})();
