(async () => {
  const dock = document.querySelector('#controlSidebar');
  if (!dock) return;
  const sections = [];
  function closeButton(owner,title){const button=document.createElement('button');button.type='button';button.className='dock-tab-close';button.textContent='×';button.title='Fechar '+title.toLowerCase();button.setAttribute('aria-label','Fechar '+title.toLowerCase());button.addEventListener('click',event=>{event.stopPropagation();owner.hidden=true});return button}
  function panel(title, key, node) {
    if (!node) return null;
    const section = document.createElement('section');
    const initiallyCollapsed = true;
    section.className = 'dock-section collapsed';
    section.dataset.section = key;
    const head = document.createElement('header');
    head.className = 'dock-section-head';
    const label = document.createElement('span');
    label.textContent = title;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'dock-section-toggle';
    toggle.textContent = initiallyCollapsed ? '+' : '\u2212';
    toggle.setAttribute('aria-label', (initiallyCollapsed ? 'Expandir ' : 'Minimizar ') + title.toLowerCase());
    toggle.setAttribute('aria-expanded', String(!initiallyCollapsed));
    const body = document.createElement('div');
    body.className = 'dock-section-body';
    body.append(node);
    head.append(label, toggle, closeButton(section,title));
    section.append(head, body);
    toggle.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      try { localStorage.setItem('navestar-panel-' + key + '-collapsed', String(collapsed)); } catch (_) {}
      toggle.textContent = collapsed ? '+' : '\u2212';
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', (collapsed ? 'Expandir ' : 'Minimizar ') + title.toLowerCase());
    });
    sections.push(section);
    return section;
  }

  const route = dock.querySelector('#routePanel');
  const cargo = dock.querySelector('#cargoBay');
  let friendsOnlineCollapsed = true;
  const friendsOnlineSection = document.createElement('section');
  friendsOnlineSection.className = 'dock-section friends-online-section' + (friendsOnlineCollapsed ? ' collapsed' : '');
  friendsOnlineSection.dataset.section = 'friends-online';
  const friendsOnlineHead = document.createElement('header');
  friendsOnlineHead.className = 'dock-section-head';
  const friendsOnlineLabel = document.createElement('span');
  friendsOnlineLabel.textContent = 'AMIGOS ONLINE';
  const friendsOnlineCount = document.createElement('small');
  friendsOnlineCount.className = 'friends-online-count';
  friendsOnlineCount.textContent = '0';
  const friendsOnlineToggle = document.createElement('button');
  friendsOnlineToggle.type = 'button';
  friendsOnlineToggle.className = 'dock-section-toggle';
  friendsOnlineToggle.textContent = friendsOnlineCollapsed ? '+' : '\u2212';
  friendsOnlineToggle.setAttribute('aria-label', (friendsOnlineCollapsed ? 'Expandir' : 'Minimizar') + ' amigos online');
  friendsOnlineToggle.setAttribute('aria-expanded', String(!friendsOnlineCollapsed));
  const friendsOnlineBody = document.createElement('div');
  friendsOnlineBody.className = 'dock-section-body friends-online-list';
  const friendsOnlineEmpty = document.createElement('div');
  friendsOnlineEmpty.className = 'friends-online-empty';
  friendsOnlineEmpty.textContent = 'Nenhum amigo online.';
  friendsOnlineBody.append(friendsOnlineEmpty);
  friendsOnlineHead.append(friendsOnlineLabel, friendsOnlineCount, friendsOnlineToggle, closeButton(friendsOnlineSection,'amigos online'));
  friendsOnlineSection.append(friendsOnlineHead, friendsOnlineBody);
  friendsOnlineToggle.addEventListener('click', () => {
    const collapsed = friendsOnlineSection.classList.toggle('collapsed');
    friendsOnlineCollapsed = collapsed;
    try { localStorage.setItem('navestar-friends-online-collapsed', String(collapsed)); } catch (_) {}
    friendsOnlineToggle.textContent = collapsed ? '+' : '\u2212';
    friendsOnlineToggle.setAttribute('aria-expanded', String(!collapsed));
    friendsOnlineToggle.setAttribute('aria-label', (collapsed ? 'Expandir' : 'Minimizar') + ' amigos online');
  });
  window.renderSidebarFriends = friends => {
    const online = (Array.isArray(friends) ? friends : []).filter(friend => Number(friend.online) === 1 || friend.online === true);
    friendsOnlineCount.textContent = String(online.length);
    friendsOnlineBody.replaceChildren();
    if (!online.length) {
      const empty = document.createElement('div');
      empty.className = 'friends-online-empty';
      empty.textContent = 'Nenhum amigo online.';
      friendsOnlineBody.append(empty);
      return;
    }
    online.forEach(friend => {
      const row = document.createElement('div');
      row.className = 'friends-online-row';
      const profile = document.createElement('button');
      profile.type = 'button';
      profile.className = 'friends-online-profile';
      profile.dataset.sidebarProfileId = String(Number(friend.id));
      const dot = document.createElement('i');
      dot.className = 'online-dot';
      const name = document.createElement('span');
      name.textContent = String(friend.username || 'PILOTO');
      profile.append(dot, name);
      const follow = document.createElement('button');
      follow.type = 'button';
      follow.className = 'friends-online-follow';
      follow.textContent = '\u2197';
      follow.title = 'Seguir piloto';
      follow.setAttribute('aria-label', 'Seguir ' + String(friend.username || 'piloto'));
      follow.dataset.sidebarFollowId = String(Number(friend.id));
      follow.dataset.sidebarFollowName = String(friend.username || 'PILOTO');
      const audioCall = document.createElement('button');
      audioCall.type = 'button';
      audioCall.className = 'friends-online-call';
      audioCall.textContent = '\u266a';
      audioCall.title = 'Chamada de áudio';
      audioCall.dataset.sidebarCallId = String(Number(friend.id));
      audioCall.dataset.sidebarCallName = String(friend.username || 'PILOTO');
      const videoCall = document.createElement('button');
      videoCall.type = 'button';
      videoCall.className = 'friends-online-call';
      videoCall.textContent = '\u25a3';
      videoCall.title = 'Chamada de vídeo';
      videoCall.dataset.sidebarVideoId = String(Number(friend.id));
      videoCall.dataset.sidebarVideoName = String(friend.username || 'PILOTO');
      row.append(profile, follow, audioCall, videoCall);
      friendsOnlineBody.append(row);
    });
  };
  window.renderSidebarFriends(window.sidebarFriendCache || []);
  friendsOnlineBody.addEventListener('click', event => {
    const profile = event.target.closest('[data-sidebar-profile-id]');
    const follow = event.target.closest('[data-sidebar-follow-id]');
    const audioCall = event.target.closest('[data-sidebar-call-id]');
    const videoCall = event.target.closest('[data-sidebar-video-id]');
    const socialPanel = document.querySelector('#friendsPanel');
    if (profile) {
      const id = Number(profile.dataset.sidebarProfileId);
      socialPanel?.querySelector(`[data-profile-id="${id}"]`)?.click();
    } else if (follow) {
      const id = Number(follow.dataset.sidebarFollowId);
      const button = socialPanel?.querySelector(`[data-follow-user="${id}"]`);
      if (button) button.click();
      else document.querySelector('#friendsToggle')?.click();
    } else if (audioCall) {
      window.startPilotCall?.(Number(audioCall.dataset.sidebarCallId), audioCall.dataset.sidebarCallName, false);
    } else if (videoCall) {
      window.startPilotCall?.(Number(videoCall.dataset.sidebarVideoId), videoCall.dataset.sidebarVideoName, true);
    }
  });
  const left = document.querySelector('.leftpanel');
  let navReadouts = null, target = null, mission = null;
  if (left) {
    const direct = Array.from(left.children);
    navReadouts = document.createElement('div');
    navReadouts.className = 'dock-readouts';
    direct.slice(0, 4).forEach(node => navReadouts.append(node));
    target = left.querySelector('.targetbox');
    mission = left.querySelector('.mission-hud');
    if (target) target.remove();
    if (mission) mission.remove();
    left.remove();
  }

  const bottomLeft = document.querySelector('.bottomleft');
  const map = bottomLeft?.querySelector('.mapbox');
  const telemetry = bottomLeft?.querySelector('.navbox');
  const leftDock = document.createElement('aside');
  leftDock.id = 'leftControlDock';
  leftDock.setAttribute('aria-label', 'Mapa tatico, contrato e alvo');
  if (map) leftDock.append(panel('MAPA TATICO', 'map', map));
  if (target) leftDock.append(panel('ALVO', 'target', target));
  if (mission) {
    const missionSection = panel('CONTRATO', 'mission', mission);
    if (missionSection) {
      leftDock.append(missionSection);
      const syncMission = () => { missionSection.hidden = mission.hidden; };
      syncMission();
      new MutationObserver(syncMission).observe(mission, {attributes:true, attributeFilter:['hidden']});
    }
  }
  if (leftDock.childElementCount) document.body.append(leftDock);
  telemetry?.remove();
  bottomLeft?.remove();
  const maneuver = document.querySelector('.bottomright');
  maneuver?.remove();

  if (route) { route.querySelector('.route-head')?.append(closeButton(route,'planejador de rota')); dock.append(route); }
  panel('TELEMETRIA', 'telemetry', navReadouts);
  panel('STATUS DA NAVE', 'ship-status', telemetry);
  panel('MANOBRA', 'maneuver', maneuver);
  if (cargo) { cargo.querySelector('.cargo-head')?.append(closeButton(cargo,'compartimento de carga')); dock.append(cargo); }

  // Uma nova sessão começa sem painéis abertos; cada aba é ativada pelo menu sanduíche.
  dock.querySelectorAll('.dock-section').forEach(section => { section.dataset.closed = 'true'; });
  friendsOnlineSection.dataset.closed = 'true';
  if (route) route.dataset.closed = 'true';
  if (cargo) cargo.dataset.closed = 'true';
  if (route) {
    route.classList.add('collapsed');
    const toggle = route.querySelector('#routeMinimize');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Expandir planejador');
  }
  if (cargo) {
    cargo.classList.add('collapsed');
    const toggle = cargo.querySelector('#cargoFold');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Expandir compartimento de carga');
  }
  const style = document.createElement('style');
  style.textContent = `
    .control-sidebar{position:fixed;z-index:30;top:70px;right:12px;width:min(300px,calc(100vw - 24px));max-height:calc(100vh - 82px);display:flex;flex-direction:column;gap:7px;overflow-y:auto;overscroll-behavior:contain;padding:0 3px 4px 0;scrollbar-width:thin;scrollbar-color:rgba(113,211,223,.4) transparent}
    #leftControlDock{position:fixed;z-index:30;left:12px;top:70px;bottom:auto;width:min(250px,calc(100vw - 24px));max-height:calc(100vh - 82px);display:flex;flex-direction:column;gap:7px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(113,211,223,.4) transparent}
    .control-sidebar>.route-panel,.control-sidebar>.cargo-bay{position:relative!important;inset:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;min-width:0!important;max-width:none!important;flex:none;box-sizing:border-box;z-index:auto!important}
    .control-sidebar .route-panel.collapsed,.control-sidebar .cargo-bay.collapsed{width:100%!important;min-width:0!important}
    .control-sidebar .dock-section{flex:none;min-width:0;padding:9px;background:rgba(5,19,31,.92);border:1px solid rgba(113,211,223,.28);backdrop-filter:blur(12px);box-shadow:0 8px 24px #0004}
    .dock-section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;color:#79bcca;font:8px 'Space Mono';letter-spacing:.15em}
    .dock-tab-close{flex:none;width:22px!important;height:22px!important;margin:0 0 0 4px!important;padding:0!important;border:1px solid rgba(123,206,222,.4)!important;border-radius:4px;background:#081b27!important;color:#b9eff1!important;font:16px monospace!important;line-height:1!important;cursor:pointer}.control-sidebar .route-head .dock-tab-close,.control-sidebar .cargo-head .dock-tab-close{width:24px!important;height:24px!important;flex:0 0 24px!important;margin:0!important}
    .dock-section-toggle{flex:none;width:24px;height:22px;margin:0!important;padding:0!important;border:1px solid rgba(123,206,222,.4);background:#081b27;color:#b9eff1;font:15px monospace;cursor:pointer}
    .dock-section-body{min-width:0}.dock-section.collapsed{padding-bottom:8px}.dock-section.collapsed .dock-section-body{display:none}.dock-section.collapsed .dock-section-head{margin:0}
    .friends-online-count{color:#61e5c8;font:8px 'Space Mono';margin-left:auto}.friends-online-section .dock-section-head>span{flex:1}.friends-online-list{display:flex;flex-direction:column;gap:5px;max-height:170px;overflow:auto}.friends-online-row{display:flex;align-items:center;gap:4px;min-width:0;padding:5px 4px;border:1px solid rgba(113,211,223,.16);background:rgba(9,31,43,.76)}.friends-online-profile{display:flex;align-items:center;gap:6px;min-width:0;flex:1;padding:1px;border:0;background:transparent;color:#c5e2e7;text-align:left;font:9px 'Space Mono';cursor:pointer}.friends-online-profile span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.friends-online-profile .online-dot{flex:none;width:7px;height:7px;border-radius:50%;background:#50e9b6;box-shadow:0 0 8px #50e9b6}.friends-online-follow,.friends-online-call{flex:none;width:23px;height:21px;padding:0;border:1px solid rgba(113,211,223,.28);background:#071923;color:#7fe1df;font:11px 'Space Mono';cursor:pointer}.friends-online-follow{color:#7fe1b8;border-color:rgba(117,235,192,.3)}.friends-online-call:hover,.friends-online-follow:hover{border-color:#78eff0;color:#d4ffff}.friends-online-empty{padding:7px;color:#789aa3;font:8px 'Space Mono'}
    .dock-section[data-section="telemetry"] .dock-readouts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.control-sidebar .leftpanel{position:static;width:100%;z-index:auto}.control-sidebar .targetbox{margin:0}.control-sidebar .mapbox,.control-sidebar .navbox{width:100%;box-sizing:border-box}.control-sidebar .map{height:110px}.control-sidebar .navbox{max-height:280px;overflow:auto}
    #leftControlDock .dock-section{flex:none;min-width:0;padding:9px;background:rgba(5,19,31,.92);border:1px solid rgba(113,211,223,.28);backdrop-filter:blur(12px);box-shadow:0 8px 24px #0004}#leftControlDock .dock-section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;color:#79bcca;font:8px 'Space Mono';letter-spacing:.15em}#leftControlDock .dock-section-toggle{flex:none;width:24px;height:22px;margin:0!important;padding:0!important;border:1px solid rgba(123,206,222,.4);background:#081b27;color:#b9eff1;font:15px monospace;cursor:pointer}#leftControlDock .dock-section-body{min-width:0}#leftControlDock .dock-section.collapsed{padding-bottom:8px}#leftControlDock .dock-section.collapsed .dock-section-body{display:none}#leftControlDock .dock-section.collapsed .dock-section-head{margin:0}#leftControlDock .mapbox{width:100%;box-sizing:border-box}#leftControlDock .map{height:110px}#leftControlDock .targetbox{margin:0}#leftControlDock .mission-hud{margin:0}
    .control-sidebar .bottomright{position:static;right:auto;bottom:auto;z-index:auto;display:flex;flex-direction:column;align-items:stretch;gap:7px;width:100%;padding:0;background:transparent;border:0;box-shadow:none;backdrop-filter:none}
    .control-sidebar .speeddial{align-self:center}.control-sidebar .controls{width:100%;box-sizing:border-box}.control-sidebar .controls .dpad{grid-template-columns:repeat(3,38px);justify-content:center}
    .control-sidebar .route-panel{padding:9px!important}.control-sidebar .route-panel button:not(.route-toggle){width:100%;margin-top:7px;padding:8px}.control-sidebar .route-toggle,.control-sidebar .cargo-fold{width:26px!important;height:24px!important;margin:0!important;padding:0!important;flex:none}
    .control-sidebar .cargo-bay{padding:9px!important}.control-sidebar .cargo-bay.collapsed{width:100%!important}
    @media(max-width:760px){.control-sidebar{top:56px;right:7px;width:min(290px,calc(100vw - 14px));max-height:calc(100vh - 64px)}#leftControlDock{left:7px;top:56px;width:min(220px,calc(100vw - 14px));max-height:calc(100vh - 64px)}#leftControlDock .map{height:94px}#leftControlDock .dock-section{padding:8px}.control-sidebar .navbox{max-height:240px}.control-sidebar .dock-section{padding:8px}.control-sidebar .controls{padding:8px}}
  `;
  document.head.appendChild(style);
  function normalizeToggle(button) {
    if (!button) return;
    const sync = () => { const mark = button.getAttribute('aria-expanded') === 'true' ? '\u2212' : '+'; if (button.textContent !== mark) button.textContent = mark; };
    sync();
    new MutationObserver(sync).observe(button, {attributes:true, attributeFilter:['aria-expanded'], childList:true, characterData:true, subtree:true});
  }
  const routePanel = document.querySelector('#routePanel');
  const routeToggle = document.querySelector('#routeMinimize');
  routePanel?.classList.add('collapsed');
  routeToggle?.setAttribute('aria-expanded', 'false');
  routeToggle?.setAttribute('aria-label', 'Expandir planejador');
  routeToggle?.addEventListener('click', () => {
    try { localStorage.setItem('navestar-panel-route-collapsed', String(routePanel.classList.contains('collapsed'))); } catch (_) {}
  });
  normalizeToggle(routeToggle);
  normalizeToggle(document.querySelector('#cargoFold'));
  const navBox = document.querySelector('.navbox');
  const navFold = document.querySelector('#navFold');
  navBox?.classList.remove('expanded');
  navFold?.setAttribute('aria-expanded', 'false');
  navFold?.setAttribute('aria-label', 'Mostrar detalhes de telemetria');
  if (navFold?.lastElementChild) navFold.lastElementChild.textContent = '+';
  navFold?.addEventListener('click', () => {
    try { localStorage.setItem('navestar-panel-telemetry-collapsed', String(!navBox.classList.contains('expanded'))); } catch (_) {}
  });

  const header = document.createElement('div');
  header.className = 'control-sidebar-title';
  header.innerHTML = '<span>PAINEL DA NAVE</span><small>?</small>';
  // Os painéis são acessados pelo menu sanduíche; este cabeçalho duplicava a navegação.
  // Mantém a estrutura gerada fora do layout visual para não afetar a montagem dos painéis.
  header.hidden = true;
  dock.prepend(header);
  const headerStyle = document.createElement('style');
  headerStyle.textContent = '.control-sidebar-title{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:#071724f2;border:1px solid rgba(113,211,223,.38);color:#c6edf0;font:9px "Space Mono";letter-spacing:.16em;backdrop-filter:blur(12px)}.control-sidebar-title small{color:#70e3d2;font-size:14px}';
  document.head.appendChild(headerStyle);
  const orderKeys = ['route', 'cargo', 'friends-online', 'telemetry', 'ship-status', 'maneuver'];
  const defaultOrder = ['route', 'cargo', 'friends-online', 'telemetry', 'ship-status', 'maneuver'];
  const elements = new Map([
    ['route', route], ['cargo', cargo], ['friends-online', friendsOnlineSection],
    ...sections.map(section => [section.dataset.section, section])
  ]);
  const orderTools = document.createElement('style');
  orderTools.textContent = `.dock-drag-handle{flex:none;width:20px;height:20px;padding:0!important;margin:0 5px 0 0!important;border:0!important;background:transparent!important;color:#79bcca!important;font:14px monospace!important;cursor:grab!important;touch-action:none}.dock-drag-handle:active{cursor:grabbing!important}.dock-section-head,.route-head,.cargo-head{display:flex;align-items:center;min-width:0}.dock-section-head>span,.route-head .eyebrow,.cargo-head .cargo-title{flex:1;min-width:0}.control-sidebar .route-head{box-sizing:border-box;width:100%;min-width:0;gap:5px;overflow:hidden}.control-sidebar .route-head .eyebrow{flex:1 1 0;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(7px,3vw,8px);letter-spacing:.07em}.control-sidebar .route-head .dock-drag-handle{flex:0 0 20px;width:20px;margin-right:0!important}.control-sidebar .route-head .route-toggle{box-sizing:border-box;flex:0 0 25px;width:25px!important;height:24px;margin:0 2px 0 0!important;padding:0!important}`;
  document.head.appendChild(orderTools);
  function dragHandle(key, title) {
    const handle = document.createElement('button');
    handle.type = 'button'; handle.className = 'dock-drag-handle'; handle.textContent = '⠿';
    handle.title = 'Arraste para reordenar'; handle.setAttribute('aria-label', `Mover ${title}. Use as setas para cima ou para baixo.`);
    handle.draggable = false; handle.dataset.dragKey = key;
    handle.addEventListener('keydown', event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      const current = orderToolsNow(); const i = current.indexOf(key); const j = i + (event.key === 'ArrowUp' ? -1 : 1);
      if (j < 0 || j >= current.length) return;
      [current[i], current[j]] = [current[j], current[i]]; applyOrder(current); saveOrder(current);
    });
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointerDrag) return;
      pointerDrag = {key, id:event.pointerId, y:event.clientY, started:false, target:key};
      handle.setPointerCapture?.(event.pointerId);
    });
    handle.addEventListener('pointermove', event => {
      if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
      if (!pointerDrag.started && Math.abs(event.clientY-pointerDrag.y) < 7) return;
      pointerDrag.started = true; event.preventDefault();
      const current=orderToolsNow();
      const visible=current.filter(candidate=>{const node=elements.get(candidate);return node&&!node.hidden});
      const above=visible.find(candidate=>{const rect=elements.get(candidate).getBoundingClientRect();return event.clientY<rect.top+rect.height/2});
      pointerDrag.target=above||visible.at(-1)||key;
      pointerDrag.after=!above;
      dock.querySelectorAll('.dock-drop-target').forEach(el=>el.classList.remove('dock-drop-target'));
      elements.get(target)?.classList.add('dock-drop-target');
    });
    const finishPointerDrag = event => {
      if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
      const state=pointerDrag; pointerDrag=null;
      dock.querySelectorAll('.dock-drop-target').forEach(el=>el.classList.remove('dock-drop-target'));
      if (!state.started || state.target===state.key) return;
      const current=orderToolsNow(),from=current.indexOf(state.key);
      if(from<0)return;
      current.splice(from,1);
      const targetIndex=current.indexOf(state.target);
      if(targetIndex<0)return;
      current.splice(targetIndex+(state.after?1:0),0,state.key);applyOrder(current);saveOrder(current);
    };
    handle.addEventListener('pointerup', finishPointerDrag);
    handle.addEventListener('pointercancel', finishPointerDrag);
    return handle;
  }
  let draggedKey = null;
  let pointerDrag = null;
  route?.querySelector('.route-head')?.prepend(dragHandle('route', 'planejador de rota'));
  cargo?.querySelector('.cargo-head')?.prepend(dragHandle('cargo', 'carga'));
  friendsOnlineSection.querySelector('.dock-section-head')?.prepend(dragHandle('friends-online', 'amigos online'));
  sections.forEach(section => section.querySelector('.dock-section-head')?.prepend(dragHandle(section.dataset.section, section.querySelector('.dock-section-head span')?.textContent || 'painel')));
  function orderToolsNow() {
    return Array.from(dock.children, node => [...elements.entries()].find(([, element]) => element === node)?.[0]).filter(key => key && orderKeys.includes(key));
  }
  function applyOrder(order) {
    const normalized = [...order.filter(key => orderKeys.includes(key) && elements.has(key))];
    orderKeys.forEach(key => { if (elements.has(key) && !normalized.includes(key)) normalized.push(key); });
    normalized.forEach(key => { const element = elements.get(key); if (element) dock.append(element); });
  }
  async function saveOrder(order) {
    const validOrder = order.filter(key => orderKeys.includes(key));
    try { localStorage.setItem('navestar-control-order', JSON.stringify(validOrder)); } catch (_) {}
    try { await fetch('multiplayer-api.php?action=control-layout', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({order:validOrder}), credentials:'same-origin'}); } catch (_) {}
  }
  for (const key of orderKeys) {
    const element = elements.get(key); if (!element) continue;
    element.addEventListener('dragover', event => { if (!draggedKey || draggedKey === key) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; element.classList.add('dock-drop-target'); });
    element.addEventListener('dragleave', () => element.classList.remove('dock-drop-target'));
    element.addEventListener('drop', event => {
      event.preventDefault(); element.classList.remove('dock-drop-target');
      const from = draggedKey || event.dataTransfer.getData('text/plain'); if (!from || from === key) return;
      const order = orderToolsNow(); const fromIndex = order.indexOf(from); const toIndex = order.indexOf(key); if (fromIndex < 0 || toIndex < 0) return;
      order.splice(fromIndex, 1); order.splice(toIndex, 0, from); applyOrder(order); saveOrder(order);
    });
  }
  orderTools.textContent += '.dock-drop-target{outline:1px solid #43dce4;outline-offset:1px}';
  orderTools.textContent += '.dock-tab-close{box-sizing:border-box!important;width:28px!important;height:26px!important;flex:0 0 28px!important;margin:0 0 0 4px!important;padding:0!important;border:1px solid rgba(255,132,132,.72)!important;border-radius:5px!important;background:rgba(74,27,34,.78)!important;color:#ffe4e4!important;font:18px/1 monospace!important;cursor:pointer!important}.dock-tab-close:hover{background:#84363d!important;border-color:#ffaaaa!important;color:#fff!important}.dock-section-head{gap:7px!important}.route-head .dock-tab-close,.cargo-head .dock-tab-close{width:28px!important;height:26px!important;flex:0 0 28px!important;margin:0!important;padding:0!important}.control-sidebar .route-head .dock-tab-close,.control-sidebar .cargo-head .dock-tab-close{width:28px!important;height:26px!important;flex:0 0 28px!important;margin:0!important;padding:0!important}';
  applyOrder(defaultOrder);
  try {
    const response = await fetch('multiplayer-api.php?action=control-layout', {credentials:'same-origin',cache:'no-store'});
    if (response.ok) { const data = await response.json(); if (Array.isArray(data.order)) applyOrder(data.order); else { const saved = JSON.parse(localStorage.getItem('navestar-control-order') || 'null'); if (Array.isArray(saved)) applyOrder(saved); } }
    else { const saved = JSON.parse(localStorage.getItem('navestar-control-order') || 'null'); if (Array.isArray(saved)) applyOrder(saved); }
  } catch (_) { try { const saved = JSON.parse(localStorage.getItem('navestar-control-order') || 'null'); if (Array.isArray(saved)) applyOrder(saved); } catch (_) {} }
  window.dispatchEvent(new Event('resize'));
})();
