(() => {
  const side = document.querySelector('.crew-interior .crew-side');
  if (!side || !window.crewGame?.enabled) return;

  const keys = ['ships', 'users', 'inventory', 'events'];
  const dock = document.createElement('div');
  dock.className = 'crew-panel-dock';
  dock.id = 'crewPanelDock';
  const shipTitle = side.querySelector('.crew-section-title');
  if (!shipTitle) return;
  side.insertBefore(dock, shipTitle);

  const ships = document.createElement('section');
  ships.className = 'crew-dashboard-section crew-movable-panel';
  ships.dataset.crewPanel = 'ships';
  ships.innerHTML = '<div class="crew-section-head"><span>NAVES ATRACADAS</span></div><div class="crew-panel-body"></div>';
  const shipsBody = ships.querySelector('.crew-panel-body');
  [shipTitle, side.querySelector('#crewShipSelectionTitle'), side.querySelector('#crewShipSelection'), side.querySelector('#crewDockedShips'), side.querySelector('#crewPassengerRequests')]
    .filter(Boolean).forEach(element => shipsBody.append(element));
  dock.append(ships);

  const panelNodes = [
    ships,
    side.querySelector('#crewOccupants')?.closest('.crew-dashboard-section'),
    side.querySelector('#crewInventory')?.closest('.crew-dashboard-section'),
    side.querySelector('#crewStationEvents')?.closest('.crew-dashboard-section')
  ];
  const panels = new Map();
  const style = document.createElement('style');
  style.textContent = `
    #crewPanelDock{display:grid;gap:7px;min-width:0}
    #crewPanelDock .crew-movable-panel{min-width:0;margin:0!important;padding:7px!important;border:1px solid #183847;background:rgba(5,19,31,.24)}
    #crewPanelDock .crew-panel-head{display:flex;align-items:center;gap:6px;min-height:23px;margin:0 0 5px;color:#71d8e7;font:8px 'Space Mono';letter-spacing:.09em}
    #crewPanelDock .crew-panel-head>span{flex:1;min-width:0}
    #crewPanelDock .crew-panel-tools{display:flex;align-items:center;gap:4px;flex:none}
    #crewPanelDock .crew-panel-move,#crewPanelDock .crew-panel-toggle{display:grid;place-items:center;width:23px;height:22px;margin:0;padding:0;border:1px solid #315c69;background:#071a25;color:#aee8ed;font:13px monospace;cursor:pointer}
    #crewPanelDock .crew-panel-move{cursor:grab;touch-action:none;user-select:none}
    #crewPanelDock .crew-panel-move:active{cursor:grabbing}
    #crewPanelDock .crew-panel-toggle{font-size:15px}
    #crewPanelDock .crew-movable-panel.collapsed{padding-bottom:5px!important}
    #crewPanelDock .crew-movable-panel.collapsed .crew-panel-head{margin:0}
    #crewPanelDock .crew-movable-panel.collapsed .crew-panel-body{display:none!important}
    #crewPanelDock .crew-movable-panel.dragging{opacity:.55}
    #crewPanelDock .crew-movable-panel.drop-before{box-shadow:inset 0 2px #4fe0e5}
    #crewPanelDock .crew-movable-panel.drop-after{box-shadow:inset 0 -2px #4fe0e5}
  `;
  document.head.append(style);

  for (const panel of panelNodes.filter(Boolean)) {
    const key = panel.dataset.crewPanel || (panel.querySelector('#crewOccupants') ? 'users' : panel.querySelector('#crewInventory') ? 'inventory' : 'events');
    panel.dataset.crewPanel = key;
    panel.classList.add('crew-movable-panel');
    const existingHead = panel.querySelector('.crew-section-head');
    existingHead.classList.add('crew-panel-head');
    const body = document.createElement('div');
    body.className = 'crew-panel-body';
    [...panel.children].filter(element => element !== existingHead).forEach(element => body.append(element));
    panel.append(body);
    dock.append(panel);
    panels.set(key, panel);
  }

  function currentOrder() { return [...dock.querySelectorAll(':scope > [data-crew-panel]')].map(panel => panel.dataset.crewPanel); }
  function applyOrder(order) {
    const normalized = [...new Set((Array.isArray(order) ? order : []).filter(key => keys.includes(key)))];
    keys.forEach(key => { if (!normalized.includes(key)) normalized.push(key); });
    normalized.forEach(key => { const panel = panels.get(key); if (panel) dock.append(panel); });
  }
  function applyCollapsed(state) {
    for (const key of keys) {
      const panel = panels.get(key), collapsed = Boolean(state?.[key]);
      panel.classList.toggle('collapsed', collapsed);
      const button = panel.querySelector('.crew-panel-toggle');
      if (button) { button.textContent = collapsed ? '+' : '−'; button.setAttribute('aria-expanded', String(!collapsed)); button.setAttribute('aria-label', (collapsed ? 'Expandir ' : 'Minimizar ') + key); }
    }
  }

  let saveTimer = 0;
  function saveLayout() {
    const state = Object.fromEntries(keys.map(key => [key, panels.get(key).classList.contains('collapsed')]));
    const layout = {order: currentOrder(), collapsed: state};
    try { localStorage.setItem('navestar-station-panel-layout', JSON.stringify(layout)); } catch (_) {}
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => fetch((window.crewGame.api || 'multiplayer-api.php') + '?action=station-panel-layout', {
      method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(layout)
    }).catch(() => {}), 250);
  }

  let dragged = null;
  function clearDropMarks() { dock.querySelectorAll('.drop-before,.drop-after').forEach(panel => panel.classList.remove('drop-before','drop-after')); }
  function addControls(panel, key) {
    const head = panel.querySelector('.crew-panel-head');
    const label = head.querySelector('span') || head.querySelector('b');
    if (label && label.tagName === 'B') label.style.flex = '1';
    const tools = document.createElement('div'); tools.className = 'crew-panel-tools';
    const move = document.createElement('button'); move.type = 'button'; move.className = 'crew-panel-move'; move.textContent = '⠿'; move.title = 'Arraste para mover esta aba'; move.setAttribute('aria-label', `Mover painel ${key}; use as setas para reordenar`);
    move.addEventListener('keydown', event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault(); const all = [...dock.querySelectorAll(':scope > [data-crew-panel]')], index = all.indexOf(panel), next = all[index + (event.key === 'ArrowUp' ? -1 : 1)];
      if (next) { event.key === 'ArrowUp' ? dock.insertBefore(panel, next) : dock.insertBefore(next, panel); saveLayout(); }
    });
    move.addEventListener('pointerdown', event => { event.preventDefault(); dragged = panel; panel.classList.add('dragging'); move.setPointerCapture?.(event.pointerId); });
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'crew-panel-toggle'; toggle.textContent = '−'; toggle.setAttribute('aria-expanded','true'); toggle.setAttribute('aria-label',`Minimizar ${key}`);
    toggle.addEventListener('click', () => { panel.classList.toggle('collapsed'); applyCollapsed(Object.fromEntries(keys.map(name => [name, panels.get(name).classList.contains('collapsed')]))); saveLayout(); });
    tools.append(move, toggle); head.append(tools);
  }
  panels.forEach((panel,key) => addControls(panel,key));

  function onPointerMove(event) {
    if (!dragged) return;
    const target = document.elementFromPoint(event.clientX,event.clientY)?.closest('#crewPanelDock > [data-crew-panel]');
    if (!target || target === dragged) { clearDropMarks(); return; }
    clearDropMarks();
    const before = event.clientY < target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2;
    target.classList.add(before ? 'drop-before' : 'drop-after');
    dock.insertBefore(dragged, before ? target : target.nextSibling);
  }
  function onPointerEnd() { if (!dragged) return; dragged.classList.remove('dragging'); dragged = null; clearDropMarks(); document.removeEventListener('pointermove',onPointerMove); document.removeEventListener('pointerup',onPointerEnd); document.removeEventListener('pointercancel',onPointerEnd); saveLayout(); }
  dock.addEventListener('pointerdown',event => { if (event.target.closest('.crew-panel-move')) document.addEventListener('pointermove',onPointerMove); });
  document.addEventListener('pointerup',onPointerEnd);
  document.addEventListener('pointercancel',onPointerEnd);

  applyOrder(keys);
  applyCollapsed({});
  try { const saved = JSON.parse(localStorage.getItem('navestar-station-panel-layout') || 'null'); if (saved) { applyOrder(saved.order); applyCollapsed(saved.collapsed); } } catch (_) {}
  fetch((window.crewGame.api || 'multiplayer-api.php') + '?action=station-panel-layout', {credentials:'same-origin',cache:'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(layout => { if (layout?.order) { applyOrder(layout.order); applyCollapsed(layout.collapsed); } })
    .catch(() => {});
})();
