(() => {
  if (!multiplayerEnabled) return;

  const stationScreen = document.querySelector('#stationScreen');
  const armory = stationScreen?.querySelector('.armory-grid');
  if (!armory) return;

  let operations = [];
  let pollBusy = false;
  let lastPoll = 0;
  let activeWreck = null;
  let rescueDialog = null;
  const completedRescueIds = new Set();
  const handledRescueRequests = new Set();

  const towCard = document.createElement('article');
  towCard.className = 'shop-item tractor-item';
  towCard.innerHTML = `<div class="item-icon">⌁</div>
    <div class="item-tag">RESGATE / EQUIPAMENTO DE CASCO <b>TRATOR</b></div>
    <h2>Rebocador orbital</h2>
    <p>Resgata naves sem combust?vel com autoriza??o do piloto ou recupera destro?os.</p>
    <div class="weapon-specs"><div><span>PESO</span><strong>380 kg</strong></div><div><span>ALCANCE DO CABO</span><strong>2.500 km</strong></div><div><span>INSTALAÇÃO</span><strong id="towItemStatus">NO HANGAR</strong></div></div>
    <div class="siege-cost">12.000 CR + 250 kg de ferro</div>
    <div class="item-buy"><div class="price"><strong>TRATOR DE CASCO</strong><small>EQUIPAMENTO DE RESGATE</small></div><button class="trade-button" id="towItemButton">COMPRAR</button></div>`;
  armory.append(towCard);

  const towStyle = document.createElement('style');
  towStyle.textContent = `.tractor-item:before{background:#63f4d1}.tractor-item .item-icon{color:#8fffe6;border-color:#63f4d166;text-shadow:0 0 14px #59eacb}.tow-wreck-button{border-color:#61f2d4!important;color:#a7ffeb!important}.tow-wreck-button:disabled{opacity:.4}`;
  document.head.append(towStyle);

  const actionRow = document.querySelector('#wreckOverlay .combat-actions');
  const towButton = document.createElement('button');
  towButton.type = 'button';
  towButton.id = 'wreckTow';
  towButton.className = 'ctrl tow-wreck-button';
  towButton.textContent = 'REBOCAR NAVE';
  towButton.hidden = true;
  actionRow?.prepend(towButton);

  function status(message) {
    const node = document.querySelector('#stationMessage');
    if (node) node.textContent = message;
    const wreckMessage = document.querySelector('#wreckMessage');
    if (wreckMessage && document.querySelector('#wreckOverlay')?.classList.contains('open')) wreckMessage.textContent = message;
  }

  function refreshCard() {
    const item = window.towSystem || {};
    const statusNode = document.querySelector('#towItemStatus');
    const button = document.querySelector('#towItemButton');
    if (!statusNode || !button) return;
    statusNode.textContent = item.installed ? 'INSTALADO' : item.owned ? 'NO HANGAR' : 'DISPONÍVEL';
    button.textContent = item.owned ? (item.installed ? 'RETIRAR' : 'INSTALAR') : 'COMPRAR';
    button.disabled = !stationIds.includes(selected.id) || dist3(player, selected) > 2200 || !multiplayerEnabled;
  }

  async function refreshShip() {
    await window.crewGame?.refreshShip?.();
    refreshCard();
    updateHud();
    refreshStationMarket();
  }

  document.querySelector('#towItemButton').addEventListener('click', async () => {
    const button = document.querySelector('#towItemButton');
    button.disabled = true;
    try {
      const item = window.towSystem || {};
      const result = item.owned
        ? await socialRequest('tow-toggle', { station: selected.id, installed: !item.installed })
        : await socialRequest('tow-purchase', { station: selected.id });
      if (Number.isFinite(Number(result.credits))) credits = Number(result.credits);
      if (Number.isFinite(Number(result.iron))) miningState.oreCounts.Ferro = Number(result.iron);
      miningState.ore = Object.values(miningState.oreCounts).reduce((sum, value) => sum + (Number(value) || 0), 0);
      await refreshShip();
      status(result.installed ? 'Rebocador instalado. Peso adicionado: 380 kg.' : result.owned ? 'Rebocador guardado no hangar.' : 'Rebocador comprado e instalado.');
      savePosition();
    } catch (error) {
      status(error.message);
      button.disabled = false;
    }
  });

  towButton.addEventListener('click', async () => {
    if (!activeWreck || !window.towSystem?.installed) return;
    towButton.disabled = true;
    try {
      const result = await socialRequest('tow-start', { wreck_id: Number(activeWreck.id) });
      status('Cabo magnético conectado. Reboque iniciado rumo a ' + result.station + '.');
      await poll();
      pollCombatWorld();
    } catch (error) {
      status(error.message);
      towButton.disabled = false;
    }
  });

  function showWreck(wreck, distance) {
    activeWreck = wreck;
    towButton.hidden = wreck.dropType !== 'wreck' || !Number(wreck.destroyedShipId);
    const inProgress = !!wreck.towing || operations.some(item => Number(item.wreckId) === Number(wreck.id));
    towButton.disabled = inProgress || !window.towSystem?.installed || distance > 2500;
    towButton.textContent = inProgress ? 'REBOQUE EM ANDAMENTO' : window.towSystem?.installed ? 'CONECTAR REBOCADOR' : 'EQUIPAR REBOCADOR NA ESTAÇÃO';
  }

  function ensureRescueDialog() {
    if (rescueDialog) return rescueDialog;
    rescueDialog = document.createElement('div');
    rescueDialog.id = 'towRescueDialog';
    rescueDialog.hidden = true;
    rescueDialog.style.cssText = 'position:fixed;inset:0;z-index:12000;background:#020b12cc;display:none;align-items:center;justify-content:center;padding:18px';
    rescueDialog.innerHTML = '<section style="width:min(440px,100%);background:#071923;border:1px solid #62dbea;padding:22px;color:#d9f6f7;font:14px Space Mono,monospace;box-shadow:0 0 32px #39dff455"><div style="color:#74e9fa;font-size:11px;letter-spacing:.16em">PEDIDO DE RESGATE</div><h2 id="towRescueTitle" style="font-size:20px;margin:12px 0">Nave sem combust?vel</h2><p id="towRescueCopy" style="line-height:1.6"></p><div style="display:flex;gap:10px;margin-top:18px"><button type="button" id="towRescueAccept" class="ctrl">ACEITAR REBOQUE</button><button type="button" id="towRescueDecline" class="ctrl">RECUSAR</button></div></section>';
    document.body.append(rescueDialog);
    return rescueDialog;
  }

  let visibleRescueRequest = 0;
  async function answerRescue(accept) {
    if (!visibleRescueRequest) return;
    const id = visibleRescueRequest;
    const buttons = rescueDialog.querySelectorAll('button'); buttons.forEach(button => { button.disabled = true; });
    try {
      await socialRequest('tow-rescue-response', { request_id: id, accept });
      handledRescueRequests.add(id); visibleRescueRequest = 0; rescueDialog.hidden = true; rescueDialog.style.display = 'none';
      status(accept ? 'Resgate aceito. Sua nave ser? levada at? a esta??o indicada.' : 'Pedido de reboque recusado.');
      await poll();
    } catch (error) {
      status(error.message);
    } finally { buttons.forEach(button => { button.disabled = false; }); }
  }
  ensureRescueDialog();
  rescueDialog.querySelector('#towRescueAccept').addEventListener('click', () => answerRescue(true));
  rescueDialog.querySelector('#towRescueDecline').addEventListener('click', () => answerRescue(false));

  async function poll() {
    if (pollBusy || !multiplayerEnabled) return;
    pollBusy = true;
    try {
      const response = await fetch(multiplayerApi + '?action=tow-world', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao atualizar os reboques.');
      operations = [
        ...(data.tows || []).map(item => ({ ...item, sampledAt: performance.now() })),
        ...(data.rescues || []).map(item => ({ ...item, wreckId: 0, rescue: true, sampledAt: performance.now() }))
      ];
      const request = (data.requests || []).find(item => !handledRescueRequests.has(Number(item.id)));
      if (request && (!visibleRescueRequest || visibleRescueRequest !== Number(request.id))) {
        visibleRescueRequest = Number(request.id);
        rescueDialog.querySelector('#towRescueTitle').textContent = `Reboque solicitado por ${request.tugUsername}`;
        rescueDialog.querySelector('#towRescueCopy').textContent = `Sua nave est? sem combust?vel. Aceitar levar? a nave at? ${request.station} em aproximadamente ${Math.ceil(Number(request.duration) / 60)} min.`;
        rescueDialog.hidden = false; rescueDialog.style.display = 'flex';
      }
      for (const completed of data.completedRescues || []) {
        const id = Number(completed.id);
        if (completedRescueIds.has(id)) continue;
        completedRescueIds.add(id);
        player.x = Number(completed.x) + 180; player.z = Number(completed.z) + 140; player.speed = 0;
        if (typeof savePosition === 'function') savePosition();
        status('Reboque conclu?do. Sua nave chegou ? esta??o espacial.');
      }
      lastPoll = performance.now();
    } catch (error) {
      // O radar de reboque é opcional para as telas que não usam o equipamento.
    } finally {
      pollBusy = false;
    }
  }

  function draw() {
    const now = performance.now();
    for (const tow of operations) {
      const elapsed = Number(tow.elapsed) + (now - tow.sampledAt) / 1000;
      const progress = Math.max(0, Math.min(1, elapsed / Math.max(1, Number(tow.duration))));
      const x = Number(tow.originX) + (Number(tow.destinationX) - Number(tow.originX)) * progress;
      const z = Number(tow.originZ) + (Number(tow.destinationZ) - Number(tow.originZ)) * progress;
      if (tow.rescue && Number(tow.targetUserId) === Number(multiplayerUserId)) {
        player.x = x; player.z = z; player.speed = 0;
      }
      const target = project({ x, y: 0, z, r: 34 });
      if (!target || target.x < -50 || target.x > W + 50 || target.y < -50 || target.y > H + 50) continue;

      let tug = { x: W / 2, y: H - 88 };
      if (Number(tow.userId) !== Number(multiplayerUserId)) {
        const remote = remoteShips.find(ship => Number(ship.id) === Number(tow.userId));
        const remotePoint = remote ? project({ x: Number(tow.tugX), y: 0, z: Number(tow.tugZ) }) : null;
        if (remotePoint) tug = remotePoint;
      }

      ctx.save();
      const pulse = .55 + .35 * Math.sin(now / 110);
      ctx.strokeStyle = `rgba(99,255,218,${pulse})`;
      ctx.shadowColor = '#4dffdb';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -now / 65;
      ctx.beginPath();
      ctx.moveTo(tug.x, tug.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.translate(target.x, target.y);
      ctx.rotate(now / 1800);
      ctx.fillStyle = 'rgba(15,72,74,.9)';
      ctx.strokeStyle = '#9bffe8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-13, -5); ctx.lineTo(-5, -12); ctx.lineTo(7, -8); ctx.lineTo(14, 1); ctx.lineTo(8, 10); ctx.lineTo(-9, 9); ctx.lineTo(-14, 2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d7fff2'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '9px Space Mono';
      ctx.fillStyle = '#a9ffe8';
      ctx.shadowColor = '#53f5d5';
      ctx.shadowBlur = 9;
      ctx.fillText(`REBOQUE ${Math.round(progress * 100)}% · ${String(tow.station).toUpperCase()}`, target.x, target.y + 25);
      ctx.restore();
    }
  }

  window.tractorSystem = { poll, draw, showWreck, refreshCard, get operations() { return operations; } };
  refreshCard();
  setInterval(poll, 1300);
  setInterval(refreshCard, 900);
})();
