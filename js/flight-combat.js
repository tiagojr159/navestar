/* Exterior flight controller. Existing station, economy and crew flows stay in index.php. */
(() => {
  'use strict';
  const model = window.NaveStarFlight;
  const input = { held: new Set(), stickX: 0, stickY: 0, mouseX: 0, mouseY: 0, mouseId: null };
  const motion = { turn: 0, lift: 0, boost: 100 };
  const triggers = new Map(), lastShot = new Map(), busy = new Set(), beams = [], bursts = [];
  let lock = null, hitUntil = 0, lastHud = 0, lastSync = 0, previousHull = shipHull, notice = '', noticeUntil = 0;
  const surface = document.querySelector('#space');
  const hud = document.createElement('div');
  hud.className = 'flight-hud';
  hud.innerHTML = `<div class="flight-reticle" aria-hidden="true"><i></i><b>×</b></div>
    <div class="flight-vitals"><span>CASCO <strong data-hull></strong></span><span>VELOCIDADE <strong data-speed></strong></span><span>BOOST <strong data-boost></strong></span><span data-ammo></span></div>
    <div class="flight-contact" hidden><span data-kind></span><strong data-name></strong><span data-distance></span><div class="flight-hp"><i></i></div><small data-lock-hint></small><button type="button" data-unlock aria-label="Liberar alvo">×</button></div>
    <div class="flight-notice" role="status" aria-live="polite"></div>
    <div class="flight-tools"><button type="button" data-next title="Selecionar próximo alvo · T">◎ ALVO <small>T</small></button><button type="button" data-help aria-expanded="false">? CONTROLES</button></div>
    <div class="flight-help" hidden><strong>PILOTAGEM E COMBATE</strong><p class="flight-help-desktop">W / S: acelerar / reduzir · A / D: desviar lateralmente<br>Setas: virar e subir / descer<br>Segure o botão direito e mova o mouse para pilotar.<br>Botão esquerdo ou Espaço: segure para atirar<br>Shift: boost · X: freio · T: próximo alvo · C: centralizar<br>F2–F4: armas adicionais · E: mineração</p><p class="flight-help-touch">Joystick esquerdo: virar e subir / descer.<br>Use + / − para controlar a velocidade.<br>Segure ATIRAR e manobre com o outro dedo.<br>BOOST: acelerar · FREAR: parar · ALVO: trocar alvo.<br>Toque em uma nave ou asteroide para selecionar.</p><p>Alinhe a mira com o alvo. O auxílio corrige apenas pequenos desvios. Tiros fora da mira também consomem munição.</p></div>
    <div class="flight-throttle"><button type="button" data-throttle="-1" aria-label="Reduzir velocidade">−</button><span>VELOCIDADE<br><b data-throttle-value>0</b></span><button type="button" data-throttle="1" aria-label="Acelerar">+</button><button type="button" data-boost-button>BOOST</button></div>`;
  document.body.appendChild(hud);
  document.body.classList.add('flight-redesign');
  function say(message) { notice = combatMessage = message; noticeUntil = performance.now() + 3200; }
  function blocked() {
    return document.hidden || shipHull <= 0 || window.crewDocked || window.dockingRequested || dockingCinematic.active || pilotCabinAutopilot ||
      !!document.querySelector('#communicationsHub.open,#stationScreen.open,.crew-interior.open,.passenger-cabin.open,.combat-overlay.open,#pilotOverlay.open,#friendsPanel.open,.mc-pop.open,.mc-menu.open,.flight-help:not([hidden])');
  }
  function canPilot() { return !blocked() && window.crewRole !== 'copilot' && window.crewRole !== 'passenger' && !window.tractorSystem?.isBeingTowed; }
  function canFire() { return !blocked() && window.crewRole !== 'passenger' && !window.tractorSystem?.isBeingTowed; }
  function release() {
    input.held.clear(); input.stickX = input.stickY = input.mouseX = input.mouseY = 0; input.mouseId = null;
    triggers.clear(); motion.turn = motion.lift = 0;
    hud.querySelectorAll('.pressed').forEach(node => node.classList.remove('pressed'));
  }
  function manual() {
    if (!canPilot()) return;
    autopilot = orbitMode = false; routeTarget = null; followTargetId = 0; miningState.active = false;
    routeMessage = 'CONTROLE MANUAL'; cameraYawTarget = cameraPitchTarget = 0;
  }
  function contacts() {
    return [
      ...bodies.filter(body => body.type === 'Asteroide' && !destroyedAsteroids.has(body.id) && !asteroidEffects.has(body.id)).map(body => ({ type: 'rock', id: body.id, body, radius: Math.max(1, body.r), name: body.name })),
      ...remoteShips.filter(ship => Number(ship.hull) > 0).map(ship => ({ type: 'ship', id: Number(ship.id), body: ship, radius: 45, name: ship.username || ship.name }))
    ].filter(contact => dist3(player, contact.body) <= 120000);
  }
  function currentLock() { return lock && contacts().find(item => item.type === lock.type && item.id === lock.id); }
  function select(contact) {
    lock = contact ? { type: contact.type, id: contact.id } : null;
    combatTargetId = contact?.type === 'ship' ? Number(contact.id) : 0;
    if (contact?.type === 'rock') { selected = contact.body; targetManuallyChosen = true; stationAutoTargetId = null; }
  }
  function cycle() {
    if (!canFire()) return;
    const list = contacts().sort((a, b) => dist3(player, a.body) - dist3(player, b.body));
    const at = list.findIndex(item => item.type === lock?.type && item.id === lock?.id);
    select(list[(at + 1) % list.length] || null);
    if (!list.length) say('Nenhuma nave ou asteroide no radar próximo.');
  }
  function shotTarget(range) {
    const direction = model.forward(player.yaw, player.pitch);
    const candidates = contacts().map(contact => ({ ...contact, ...model.aim(player, direction, contact.body, contact.radius, .045, range) }));
    // The nearest surface in the firing cone wins; selecting a target never permits shooting through another.
    return candidates.filter(item => item.hit).sort((a, b) => (a.depth - a.radius) - (b.depth - b.radius))[0] || null;
  }
  function beam(target, kind) {
    const point = target ? project({ ...target.body, r: target.radius }) : null;
    beams.push({ born: performance.now(), duration: 160, x: point?.x ?? W / 2, y: point?.y ?? H / 2, color: model.weapons[kind].color });
    window.gameAudio?.play('laser');
  }
  function impact(target, destroyed = false) {
    hitUntil = performance.now() + 180;
    const point = project({ ...target.body, r: target.radius });
    if (point) bursts.push({ x: point.x, y: point.y, born: performance.now(), destroyed, seed: Math.random() * 10 });
    if (destroyed && target.type === 'ship') window.gameAudio?.play('explosion_small');
  }
  async function fire(index = 0) {
    const mount = weaponSystem.mounts[index], now = performance.now();
    if (!canFire()) return false;
    if (!mount || !weaponSystem.installed) { say('Equipe uma arma e munição na estação.'); return false; }
    const spec = model.weapons[mount.kind];
    if (!spec || busy.has(mount.kind) || now - (lastShot.get(mount.kind) ?? -Infinity) < spec.interval) return false;
    if (mount.ammo <= 0) { say('Munição esgotada. Recarregue na estação.'); return false; }
    lastShot.set(mount.kind, now);
    miningState.active = false;
    const target = shotTarget(spec.range), damage = Number(mount.damage) * (shipClass === 'attack' ? 1.35 : 1);
    beam(target, mount.kind);
    let result;
    if (multiplayerEnabled) {
      busy.add(mount.kind);
      try {
        result = await socialRequest('weapon-fire', { user_id: target?.type === 'ship' ? target.id : 0, kind: mount.kind, yaw: player.yaw, pitch: player.pitch });
        weaponSystem.mounts.filter(item => item.kind === mount.kind).forEach(item => { item.ammo = Number(result.ammo); });
      } catch (error) { say(error.message); return false; }
      finally { busy.delete(mount.kind); }
    } else mount.ammo--;
    weaponSystem.kind = mount.kind; weaponSystem.ammo = mount.ammo; weaponSystem.damage = mount.damage;
    renderFireControls();
    if (target?.type === 'ship') {
      if (result?.hit) {
        target.body.hull = Number(result.hull); impact(target, result.destroyed);
        say(result.destroyed ? 'Nave destruída. Carga disponível para recuperação.' : 'Impacto confirmado · casco do alvo ' + result.hull + '%');
        if (result.destroyed) { remoteShips = remoteShips.filter(ship => Number(ship.id) !== target.id); select(null); pollCombatWorld(); }
      } else say('Alvo saiu da linha de tiro.');
    } else if (target?.type === 'rock' && !destroyedAsteroids.has(target.id) && !asteroidEffects.has(target.id)) {
      select(target); asteroidDamage[target.id] = Math.min(100, (asteroidDamage[target.id] || 0) + damage);
      impact(target); mineFeedbackUntil = Date.now() + 4000;
      if (asteroidDamage[target.id] >= 100) { destroyAsteroid(target.id); select(null); }
      else say('Impacto · integridade da rocha ' + Math.round(100 - asteroidDamage[target.id]) + '%');
    } else say('Disparo livre · alinhe a mira com um alvo.');
    // The normal position sync persists cargo and local asteroid state without an extra request per shot.
    return true;
  }
  function holdButton(button, down, up) {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !canFire()) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); button.classList.add('pressed'); down(event.pointerId);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, event => { button.classList.remove('pressed'); up(event.pointerId); });
  }
  hud.querySelector('[data-next]').addEventListener('click', cycle);
  hud.querySelector('[data-unlock]').addEventListener('click', () => select(null));
  hud.querySelector('[data-help]').addEventListener('click', event => {
    const help = hud.querySelector('.flight-help'); help.hidden = !help.hidden; release();
    event.currentTarget.setAttribute('aria-expanded', String(!help.hidden));
  });
  hud.querySelectorAll('[data-throttle]').forEach(button => holdButton(button, id => { input.held.add('throttle:' + id + ':' + button.dataset.throttle); manual(); }, id => {
    for (const key of input.held) if (key.startsWith('throttle:' + id + ':')) input.held.delete(key);
  }));
  holdButton(hud.querySelector('[data-boost-button]'), id => { input.held.add('boost:' + id); manual(); }, id => input.held.delete('boost:' + id));
  const controlledCodes = new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space','KeyX','KeyC','KeyT','F2','F3','F4']);
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape') {
      hud.querySelector('.flight-help').hidden = true;
      hud.querySelector('[data-help]').setAttribute('aria-expanded', 'false');
      release();
    }
    const editable = event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
    if (editable) { if (controlledCodes.has(event.code) || event.code === 'KeyE') event.stopImmediatePropagation(); return; }
    if (event.code === 'KeyE' && !canFire()) { event.stopImmediatePropagation(); return; }
    if (!controlledCodes.has(event.code)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!canFire()) return;
    input.held.add(event.code);
    if (event.code === 'KeyT' && !event.repeat) cycle();
    if (event.code === 'KeyC') { cameraYaw = cameraPitch = cameraYawTarget = cameraPitchTarget = 0; }
    if (event.code === 'Space' || /^F[234]$/.test(event.code)) {
      const index = event.code === 'Space' ? 0 : Number(event.code.slice(1)) - 1;
      triggers.set(event.code, index); if (!event.repeat) fire(index);
    } else if (!['KeyT','KeyC'].includes(event.code)) manual();
  }, true);
  window.addEventListener('keyup', event => {
    if (!controlledCodes.has(event.code)) return;
    input.held.delete(event.code); triggers.delete(event.code); event.stopImmediatePropagation();
  }, true);
  surface.addEventListener('contextmenu', event => event.preventDefault());
  surface.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || !canFire()) return;
    event.preventDefault(); event.stopImmediatePropagation(); surface.setPointerCapture(event.pointerId);
    if (event.button === 0) { triggers.set('mouse:' + event.pointerId, 0); fire(0); }
    if (event.button === 2 && canPilot()) { input.mouseId = event.pointerId; manual(); }
  }, true);
  surface.addEventListener('pointermove', event => {
    if (input.mouseId !== event.pointerId) return;
    const rect = surface.getBoundingClientRect();
    input.mouseX = model.clamp((event.clientX - rect.left - rect.width / 2) / (rect.width * .32), -1, 1);
    input.mouseY = model.clamp((rect.height / 2 - event.clientY + rect.top) / (rect.height * .32), -1, 1);
  }, true);
  for (const type of ['pointerup','pointercancel','lostpointercapture']) surface.addEventListener(type, event => {
    triggers.delete('mouse:' + event.pointerId);
    if (input.mouseId === event.pointerId) { input.mouseId = null; input.mouseX = input.mouseY = 0; }
  }, true);
  // Clicks select contacts; other clicks remain available for stations and salvage.
  surface.addEventListener('click', event => {
    const rect = surface.getBoundingClientRect(), x = (event.clientX - rect.left) * W / rect.width, y = (event.clientY - rect.top) * H / rect.height;
    if (!canFire()) return;
    const found = contacts().map(item => ({ ...item, point: project({ ...item.body, r: item.radius }) })).filter(item => item.point && Math.hypot(item.point.x - x, item.point.y - y) < Math.max(28, item.point.r)).sort((a,b) => a.point.z - b.point.z)[0];
    if (found) { event.stopImmediatePropagation(); select(found); }
  }, true);
  // Delegate holds so dynamically added weapon buttons receive identical multi-touch behavior.
  document.addEventListener('pointerdown', event => {
    const button = event.target.closest?.('.flight-fire,.mc-fire,#mcBrake,#flightBrake');
    if (!button || button.disabled || event.button !== 0 || !canFire()) return;
    event.preventDefault(); event.stopImmediatePropagation(); button.setPointerCapture(event.pointerId);
    if (button.matches('#mcBrake,#flightBrake')) { input.held.add('brake:' + event.pointerId); manual(); }
    else { const index = Number(button.dataset.weaponIndex) || 0; triggers.set('button:' + event.pointerId, index); fire(index); }
  }, true);
  for (const type of ['pointerup','pointercancel','lostpointercapture']) document.addEventListener(type, event => {
    triggers.delete('button:' + event.pointerId); input.held.delete('brake:' + event.pointerId);
  }, true);
  document.addEventListener('click', event => {
    const reloadButton = event.target.closest?.('#buyAmmo');
    if (reloadButton && multiplayerEnabled) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (reloadButton.disabled) return;
      reloadButton.disabled = true;
      socialRequest('weapon-reload', { station: selected.id, kind: weaponSystem.kind }).then(result => {
        credits = Number(result.credits);
        weaponSystem.mounts.filter(item => item.kind === result.kind).forEach(item => { item.ammo = Number(result.ammo); });
        weaponSystem.ammo = Number(result.ammo);
        setStationMessage('Recarga concluída: +' + result.loaded + ' projéteis.');
        renderFireControls(); refreshStationMarket(); savePosition();
      }).catch(error => setStationMessage(error.message)).finally(() => { reloadButton.disabled = false; });
      return;
    }
    if (event.target.closest?.('.flight-fire,.mc-fire,#mcBrake,#flightBrake')) {
      // Keyboard/assistive activation still fires one shot. Pointer activation was handled on press.
      if (!event.detail) {
        const button = event.target.closest('button');
        if (button.matches('#mcBrake,#flightBrake')) { player.speed = 0; manual(); }
        else fire(Number(button.dataset.weaponIndex) || 0);
      }
      event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', release);
  window.addEventListener('navestar:pilot-cabin-enter', release);
  function tick(now, dt) {
    const suspended = blocked();
    hud.hidden = suspended && !hud.querySelector('.flight-help:not([hidden])');
    if (suspended) { release(); return; }
    if (shipHull < previousHull) { document.body.classList.add('flight-damaged'); setTimeout(() => document.body.classList.remove('flight-damaged'), 220); say('Impacto recebido · casco ' + shipHull + '%'); }
    previousHull = shipHull;
    for (const index of new Set(triggers.values())) fire(index);
    if (lock && !currentLock()) select(null);
    if (now - lastSync > 900 && positionReady && (player.speed > 0 || Math.abs(motion.turn) + Math.abs(motion.lift) > .01)) { lastSync = now; savePosition(); }
    if (now - lastHud < 90) return;
    lastHud = now;
    hud.querySelector('[data-hull]').textContent = Math.round(shipHull) + '%';
    hud.querySelector('[data-speed]').textContent = Math.round(player.speed * 60) + ' km/s';
    hud.querySelector('[data-boost]').textContent = Math.round(motion.boost) + '%';
    hud.querySelector('[data-ammo]').textContent = weaponSystem.mounts.length ? 'MUNIÇÃO ' + weaponSystem.mounts.map(m => m.ammo).join(' / ') : 'SEM ARMAMENTO';
    hud.querySelector('[data-throttle-value]').textContent = Math.round(player.speed * 60);
    hud.querySelector('.flight-notice').textContent = now < noticeUntil ? notice : '';
    hud.querySelector('.flight-reticle').classList.toggle('hit', now < hitUntil);
    const contact = currentLock(), panel = hud.querySelector('.flight-contact'); panel.hidden = !contact;
    if (contact) {
      const info = model.aim(player, model.forward(player.yaw, player.pitch), contact.body, contact.radius);
      hud.querySelector('[data-kind]').textContent = contact.type === 'ship' ? 'NAVE DE JOGADOR' : 'ASTEROIDE';
      hud.querySelector('[data-name]').textContent = contact.name;
      hud.querySelector('[data-distance]').textContent = fmt(info.distance) + ' km';
      const hp = contact.type === 'ship' ? contact.body.hull : 100 - (asteroidDamage[contact.id] || 0);
      hud.querySelector('.flight-hp i').style.width = model.clamp(hp, 0, 100) + '%';
      hud.querySelector('[data-lock-hint]').textContent = info.distance > 25000 ? 'FORA DE ALCANCE · APROXIME-SE' : info.hit ? 'NA MIRA · SEGURE PARA ATIRAR' : 'ALINHE A NAVE COM O ALVO';
    }
  }
  function step(dt) {
    if (!canPilot()) return;
    const held = input.held, anyPrefix = prefix => [...held].some(key => key.startsWith(prefix));
    const yaw = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0) + model.deadzone(input.stickX) + model.deadzone(input.mouseX);
    const pitch = (held.has('ArrowUp') ? 1 : 0) - (held.has('ArrowDown') ? 1 : 0) - model.deadzone(input.stickY) + model.deadzone(input.mouseY);
    const throttle = (held.has('KeyW') || anyPrefix('throttle:') && [...held].some(key => key.endsWith(':1')) ? 1 : 0) - (held.has('KeyS') || [...held].some(key => key.endsWith(':-1')) ? 1 : 0);
    Object.assign(motion, { yaw: player.yaw, pitch: player.pitch, speed: player.speed });
    const movement = model.step(motion, { yaw, pitch, throttle, strafe: (held.has('KeyD') ? 1 : 0) - (held.has('KeyA') ? 1 : 0), brake: held.has('KeyX') || anyPrefix('brake:'), boost: held.has('ShiftLeft') || held.has('ShiftRight') || anyPrefix('boost:'), fuel: fuelUnits > .001 }, dt / 60);
    Object.assign(player, { yaw: motion.yaw, pitch: motion.pitch, speed: motion.speed });
    cameraYawTarget = cameraPitchTarget = 0;
    shipBank = window.shipFlightEffects?.updateBank(motion.turn * .65, dt) ?? -motion.turn * .15;
    window.shipFlightEffects?.setStrafe((held.has('KeyD') ? 1 : 0) - (held.has('KeyA') ? 1 : 0), fuelUnits > 0);
    moveShip(movement.x, movement.z, movement.y);
  }
  function draw(now) {
    if (blocked()) return;
    const contact = currentLock();
    if (contact) {
      const point = project({ ...contact.body, r: contact.radius });
      ctx.save(); ctx.strokeStyle = contact.type === 'ship' ? '#ff938f' : '#ffd28a'; ctx.lineWidth = 1.5;
      if (point && point.x > 30 && point.x < W - 30 && point.y > 50 && point.y < H - 60) {
        const radius = model.clamp(point.r + 12, 22, 90), x = point.x, y = point.y;
        for (const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) { ctx.beginPath(); ctx.moveTo(x+sx*(radius-9),y+sy*radius); ctx.lineTo(x+sx*radius,y+sy*radius); ctx.lineTo(x+sx*radius,y+sy*(radius-9)); ctx.stroke(); }
      } else {
        const yaw = Math.atan2(contact.body.x - player.x, -(contact.body.z - player.z)) - player.yaw;
        const vertical = Math.atan2((contact.body.y || 0) - player.y, Math.hypot(contact.body.x-player.x,contact.body.z-player.z)) - player.pitch;
        const lateral = Math.cos(yaw) < 0 ? (Math.sin(yaw) < 0 ? -1 : 1) : Math.sin(yaw);
        const x = model.clamp(W/2 + lateral*W*.42, 32, W-32), y = model.clamp(H/2-vertical*H*.45, 100, H*.7);
        ctx.translate(x,y); ctx.rotate(Math.atan2(-vertical, Math.sin(yaw) || 1)); ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-6,-6); ctx.lineTo(-6,6); ctx.closePath(); ctx.stroke();
      }
      ctx.restore();
    }
    for (let i=beams.length-1;i>=0;i--) {
      const b=beams[i], t=(now-b.born)/b.duration; if(t>=1){beams.splice(i,1);continue;}
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=b.color; ctx.shadowColor=b.color; ctx.shadowBlur=12; ctx.lineWidth=2.5; ctx.globalAlpha=1-t;
      for(const side of [-1,1]){const x=W/2+side*Math.min(75,W*.12),y=H*.82;ctx.beginPath();ctx.moveTo(x+(b.x-x)*Math.max(0,t-.22),y+(b.y-y)*Math.max(0,t-.22));ctx.lineTo(x+(b.x-x)*Math.min(1,t+.35),y+(b.y-y)*Math.min(1,t+.35));ctx.stroke();} ctx.restore();
    }
    for(let i=bursts.length-1;i>=0;i--){const b=bursts[i],t=(now-b.born)/(b.destroyed?1000:300);if(t>=1){bursts.splice(i,1);continue;}ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle='#ffd497';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,4+t*(b.destroyed?95:20),0,Math.PI*2);ctx.stroke();for(let n=0;n<12;n++){const a=n*Math.PI/6+b.seed,r=t*(b.destroyed?140:32);ctx.fillStyle=n%2?'#ff986b':'#fff0ce';ctx.fillRect(b.x+Math.cos(a)*r,b.y+Math.sin(a)*r,3,3);}ctx.restore();}
  }
  window.flightCombat = { tick, step, draw, fire, release, cycle, select, setStick(x,y) { input.stickX=x; input.stickY=y; if(Math.hypot(x,y)>.1)manual(); } };
  window.attackRemoteShip = (id, kind) => { const contact=contacts().find(item=>item.type==='ship'&&item.id===Number(id)); select(contact); closeProfile(); return fire(Math.max(0,weaponSystem.mounts.findIndex(m=>m.kind===kind))); };
  document.querySelector('#mcCenter')?.addEventListener('click',()=>{cameraYaw=cameraPitch=cameraYawTarget=cameraPitchTarget=0;});
})();
