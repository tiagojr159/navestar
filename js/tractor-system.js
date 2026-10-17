(() => {
  if (!multiplayerEnabled) return;

  const stationScreen = document.querySelector('#stationScreen');
  const armory = stationScreen?.querySelector('.armory-grid');
  if (!armory) return;

  let operations = [];
  let beingTowed = false;
  let pollBusy = false;
  let lastPoll = 0;
  let activeWreck = null;
  let rescueDialog = null;
  const completedRescueIds = new Set();
  const handledRescueRequests = new Set();
  const towAlignSeconds = 4;

  const towCard = document.createElement('article');
  towCard.className = 'shop-item tractor-item';
  towCard.innerHTML = `<div class="item-icon">⌁</div>
    <div class="item-tag">RESGATE / EQUIPAMENTO DE CASCO <b>TRATOR</b></div>
    <h2>Rebocador orbital</h2>
    <p>Resgata naves sem combustível com autorização do piloto ou recupera destroços.</p>
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
    if (node) {
      node.textContent = message;
      if (stationScreen?.classList.contains('open')) {
        node.hidden = false;
        node.classList.add('market-feedback-active');
        node.classList.toggle('market-feedback-error', /saldo|faltam|compra nao realizada|ferro insuficiente/i.test(message));
        clearTimeout(window.marketFeedbackTimer);
        window.marketFeedbackTimer = setTimeout(() => {
          node.classList.remove('market-feedback-active', 'market-feedback-error');
          node.hidden = true;
        }, 6500);
      }
    }
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
    rescueDialog.innerHTML = '<section style="width:min(440px,100%);background:#071923;border:1px solid #62dbea;padding:22px;color:#d9f6f7;font:14px Space Mono,monospace;box-shadow:0 0 32px #39dff455"><div style="color:#74e9fa;font-size:11px;letter-spacing:.16em">PEDIDO DE RESGATE</div><h2 id="towRescueTitle" style="font-size:20px;margin:12px 0">Nave sem combustível</h2><p id="towRescueCopy" style="line-height:1.6"></p><div style="display:flex;gap:10px;margin-top:18px"><button type="button" id="towRescueAccept" class="ctrl">ACEITAR REBOQUE</button><button type="button" id="towRescueDecline" class="ctrl">RECUSAR</button></div></section>';
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
      status(accept ? 'Resgate aceito. Rebocador alinhando a nave e conectando o cabo.' : 'Pedido de reboque recusado.');
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
      beingTowed = (data.rescues || []).some(item => Number(item.targetUserId) === Number(multiplayerUserId));
      operations = [
        ...(data.tows || []).map(item => ({ ...item, sampledAt: performance.now() })),
        ...(data.rescues || []).map(item => ({ ...item, wreckId: 0, rescue: true, sampledAt: performance.now() }))
      ];
      const request = (data.requests || []).find(item => !handledRescueRequests.has(Number(item.id)));
      if (request && (!visibleRescueRequest || visibleRescueRequest !== Number(request.id))) {
        visibleRescueRequest = Number(request.id);
        rescueDialog.querySelector('#towRescueTitle').textContent = `Reboque solicitado por ${request.tugUsername}`;
        rescueDialog.querySelector('#towRescueCopy').textContent = `Sua nave está sem combustível. Aceitar levará a nave até ${request.station} em aproximadamente ${Math.ceil(Number(request.duration) / 60)} min.`;
        rescueDialog.hidden = false; rescueDialog.style.display = 'flex';
      }
      for (const completed of data.completedRescues || []) {
        const id = Number(completed.id);
        if (completedRescueIds.has(id)) continue;
        completedRescueIds.add(id);
        player.x = Number(completed.x) + (Number(multiplayerUserId) % 2) * 180; player.z = Number(completed.z) + (Number(multiplayerUserId) % 3) * 140; player.speed = 0;
        if (window.crewGame?.enabled) window.crewGame.refreshShip?.().catch(() => {});

        if (typeof savePosition === 'function') savePosition();
        status('Reboque concluído. Sua nave chegou ? estação espacial.');
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
      const rescue = !!tow.rescue, align = rescue ? Math.max(0, Math.min(1, elapsed / towAlignSeconds)) : 1;
      const progress = rescue ? Math.max(0, Math.min(1, (elapsed - towAlignSeconds) / Math.max(1, Number(tow.duration) - towAlignSeconds))) : Math.max(0, Math.min(1, elapsed / Math.max(1, Number(tow.duration))));
      const originX = Number(tow.originX), originZ = Number(tow.originZ), tugX = Number(tow.tugX), tugZ = Number(tow.tugZ);
      const offsetX = originX - tugX, offsetZ = originZ - tugZ, offsetLength = Math.hypot(offsetX, offsetZ) || 1;
      const alignedX = originX + (tugX + offsetX / offsetLength * 620 - originX) * align;
      const alignedZ = originZ + (tugZ + offsetZ / offsetLength * 620 - originZ) * align;
      const x = rescue ? alignedX + (Number(tow.destinationX) - alignedX) * progress : originX + (Number(tow.destinationX) - originX) * progress;
      const z = rescue ? alignedZ + (Number(tow.destinationZ) - alignedZ) * progress : originZ + (Number(tow.destinationZ) - originZ) * progress;
      const localVictim = rescue && Number(tow.targetUserId) === Number(multiplayerUserId), localTug = Number(tow.userId) === Number(multiplayerUserId);
      if (localVictim) {
        player.x = x; player.z = z; player.speed = 0;
        if (align < 1) player.yaw = Math.atan2(tugX - x, -(tugZ - z));
      }
      const targetShip = rescue && !localVictim ? remoteShips.find(ship => Number(ship.id) === Number(tow.targetUserId)) : null;
      const targetProjection = localVictim ? { x: W / 2, y: H * .70 } : project({ x, y: 0, z, r: 34 });
      const targetRadar = !targetProjection && targetShip ? remoteShipRenderInfo({ ...targetShip, x, z }) : null;
      const target = targetProjection || (targetRadar ? targetRadar.mode === 'radar' ? { x: targetRadar.x, y: targetRadar.y } : targetRadar.point : null);
      if (!target || target.x < -50 || target.x > W + 50 || target.y < -50 || target.y > H + 50) continue;

      let tug = { x: W / 2, y: H * .70 };
      if (!localTug) {
        const remote = remoteShips.find(ship => Number(ship.id) === Number(tow.userId));
        const remotePoint = remote ? remoteShipRenderInfo(remote) : null;
        if (remotePoint) tug = remotePoint.mode === 'radar' ? { x: remotePoint.x, y: remotePoint.y } : remotePoint.point;
      }

      if (rescue && !localVictim) drawRescueShip(target.x, target.y, now, targetShip, Math.atan2(tug.y - target.y, tug.x - target.x));

      ctx.save();
      const pulse = .55 + .35 * Math.sin(now / 110);
      ctx.strokeStyle = `rgba(99,255,218,${pulse})`;
      ctx.shadowColor = '#4dffdb';
      ctx.shadowBlur = 15;
      ctx.lineWidth = rescue ? 3.5 : 2;
      if (align < 1) ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = -now / 65;
      ctx.beginPath();
      ctx.moveTo(tug.x, tug.y);
      const dx = target.x - tug.x, dy = target.y - tug.y, length = Math.hypot(dx, dy) || 1, sag = align < 1 ? (1 - align) * 26 : Math.min(18, length * .04);
      const controlX = (tug.x + target.x) / 2 - dy / length * sag, controlY = (tug.y + target.y) / 2 + dx / length * sag;
      ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (rescue) {
        ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(190,255,247,${pulse})`; ctx.lineWidth = 1.5; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(tug.x, tug.y); ctx.quadraticCurveTo(controlX, controlY, target.x, target.y); ctx.stroke();
        if (align >= 1) for (let i = 1; i <= 3; i++) { const t = (now / 1100 + i / 4) % 1; ctx.fillStyle = '#d7fff7'; ctx.beginPath(); ctx.arc(tug.x + dx * t - dy / length * Math.sin(t * Math.PI) * sag, tug.y + dy * t + dx / length * Math.sin(t * Math.PI) * sag, 2.2, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (!rescue) {
      ctx.translate(target.x, target.y);
      ctx.rotate(now / 1800);
      ctx.fillStyle = 'rgba(15,72,74,.9)';
      ctx.strokeStyle = '#9bffe8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-13, -5); ctx.lineTo(-5, -12); ctx.lineTo(7, -8); ctx.lineTo(14, 1); ctx.lineTo(8, 10); ctx.lineTo(-9, 9); ctx.lineTo(-14, 2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d7fff2'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = rescue ? '8px Space Mono' : '9px Space Mono';
      ctx.fillStyle = rescue && align < 1 ? '#d2fbff' : '#a9ffe8';
      ctx.shadowColor = '#53f5d5';
      ctx.shadowBlur = 9;
      ctx.fillText(`REBOQUE ${Math.round(progress * 100)}% · ${String(tow.station).toUpperCase()}`, target.x, target.y + 25);
      ctx.restore();
    }
  }

  function drawRescueShip(x, y, now, ship, heading = 0) {
    const size = Math.max(18, Math.min(52, 30000 / Math.max(1, Number(ship?.distance) || 1000))), w = size, h = size * .42;
    ctx.save(); ctx.translate(x, y); ctx.rotate(heading + Math.sin(now / 450) * .035);
    ctx.shadowColor = '#76f5ec'; ctx.shadowBlur = 16; ctx.fillStyle = 'rgba(13,49,62,.96)'; ctx.strokeStyle = '#9efff4'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(w * .58, 0); ctx.lineTo(w * .18, -h * .26); ctx.lineTo(-w * .12, -h * .5); ctx.lineTo(-w * .42, -h * .43); ctx.lineTo(-w * .27, -h * .1); ctx.lineTo(-w * .27, h * .1); ctx.lineTo(-w * .42, h * .43); ctx.lineTo(-w * .12, h * .5); ctx.lineTo(w * .18, h * .26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d7fff4'; ctx.shadowBlur = 9; ctx.beginPath(); ctx.ellipse(w * .18, 0, w * .13, h * .12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#55ffe2'; ctx.globalAlpha = .4 + .3 * Math.sin(now / 90); ctx.fillRect(-w * .43, -h * .13, w * .13, h * .26); ctx.restore();
    if (ship?.username) { ctx.save(); ctx.textAlign = 'center'; ctx.font = '7px Space Mono'; ctx.fillStyle = '#d6fff7'; ctx.shadowColor = '#06212b'; ctx.shadowBlur = 6; ctx.fillText(String(ship.username).toUpperCase().slice(0, 16) + ' · SOB REBOQUE', x, y + h + 13); ctx.restore(); }
  }

  window.tractorSystem = { poll, draw, showWreck, refreshCard, get operations() { return operations; }, shouldHideRemoteShip(userId) { return operations.some(item => item.rescue && Number(item.targetUserId) === Number(userId) && Number(item.userId) !== Number(multiplayerUserId)); }, get isBeingTowed() { return beingTowed; } };
  refreshCard();
  setInterval(poll, 1300);
  setInterval(refreshCard, 900);
})();
