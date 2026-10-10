(() => {
  const dock = document.querySelector('#controlSidebar');
  if (!dock) return;
  const sections = [];
  function panel(title, key, node) {
    if (!node) return null;
    const section = document.createElement('section');
    section.className = 'dock-section';
    section.dataset.section = key;
    const head = document.createElement('header');
    head.className = 'dock-section-head';
    const label = document.createElement('span');
    label.textContent = title;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'dock-section-toggle';
    toggle.textContent = '\u2212';
    toggle.setAttribute('aria-label', 'Minimizar ' + title.toLowerCase());
    toggle.setAttribute('aria-expanded', 'true');
    const body = document.createElement('div');
    body.className = 'dock-section-body';
    body.append(node);
    head.append(label, toggle);
    section.append(head, body);
    toggle.addEventListener('click', () => {
      const collapsed = section.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '+' : '\u2212';
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', (collapsed ? 'Expandir ' : 'Minimizar ') + title.toLowerCase());
    });
    sections.push(section);
    return section;
  }

  const route = dock.querySelector('#routePanel');
  const cargo = dock.querySelector('#cargoBay');
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

  if (route) dock.append(route);
  panel('TELEMETRIA', 'telemetry', navReadouts);
  panel('STATUS DA NAVE', 'ship-status', telemetry);
  panel('MANOBRA', 'maneuver', maneuver);
  if (cargo) dock.append(cargo);

  const style = document.createElement('style');
  style.textContent = `
    .control-sidebar{position:fixed;z-index:30;top:70px;right:12px;width:min(300px,calc(100vw - 24px));max-height:calc(100vh - 82px);display:flex;flex-direction:column;gap:7px;overflow-y:auto;overscroll-behavior:contain;padding:0 3px 4px 0;scrollbar-width:thin;scrollbar-color:rgba(113,211,223,.4) transparent}
    #leftControlDock{position:fixed;z-index:30;left:12px;top:70px;bottom:auto;width:min(250px,calc(100vw - 24px));max-height:calc(100vh - 82px);display:flex;flex-direction:column;gap:7px;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(113,211,223,.4) transparent}
    .control-sidebar>.route-panel,.control-sidebar>.cargo-bay{position:relative!important;inset:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;min-width:0!important;max-width:none!important;flex:none;box-sizing:border-box;z-index:auto!important}
    .control-sidebar .route-panel.collapsed,.control-sidebar .cargo-bay.collapsed{width:100%!important;min-width:0!important}
    .control-sidebar .dock-section{flex:none;min-width:0;padding:9px;background:rgba(5,19,31,.92);border:1px solid rgba(113,211,223,.28);backdrop-filter:blur(12px);box-shadow:0 8px 24px #0004}
    .dock-section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;color:#79bcca;font:8px 'Space Mono';letter-spacing:.15em}
    .dock-section-toggle{flex:none;width:24px;height:22px;margin:0!important;padding:0!important;border:1px solid rgba(123,206,222,.4);background:#081b27;color:#b9eff1;font:15px monospace;cursor:pointer}
    .dock-section-body{min-width:0}.dock-section.collapsed{padding-bottom:8px}.dock-section.collapsed .dock-section-body{display:none}.dock-section.collapsed .dock-section-head{margin:0}
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
  normalizeToggle(document.querySelector('#routeMinimize'));
  normalizeToggle(document.querySelector('#cargoFold'));

  const header = document.createElement('div');
  header.className = 'control-sidebar-title';
  header.innerHTML = '<span>PAINEL DA NAVE</span><small>?</small>';
  dock.prepend(header);
  const headerStyle = document.createElement('style');
  headerStyle.textContent = '.control-sidebar-title{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:#071724f2;border:1px solid rgba(113,211,223,.38);color:#c6edf0;font:9px "Space Mono";letter-spacing:.16em;backdrop-filter:blur(12px)}.control-sidebar-title small{color:#70e3d2;font-size:14px}';
  document.head.appendChild(headerStyle);
  window.dispatchEvent(new Event('resize'));
  // Native route and cargo minimize buttons remain their own section controls.
  // Place custom sections in logical order between the planner and cargo bay.
  const cargoNode = cargo;
  sections.forEach(section => {
    if (section.parentElement !== leftDock) dock.insertBefore(section, cargoNode || null);
  });
})();
