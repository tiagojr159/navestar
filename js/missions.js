(() => {
  const PASSENGER_CAPACITY = 12;
  const PASSENGER_MASS_KG = 75;
  const MATERIAL_CAPACITY_KG = 2000;
  const DELIVERY_RANGE = 1800;

  function createMissionSystem(options) {
    const { bodies, stationScreen, getPlayer, getCargo, getEquipmentWeight=()=>0, getCargoCapacity=()=>MATERIAL_CAPACITY_KG, getCredits, setCredits, savePosition, setRoute } = options;
    const stations = bodies.filter(body => body.type === 'Estação');
    const moons = bodies.filter(body => body.type === 'Lua');
    const byId = new Map(bodies.map(body => [body.id, body]));
    let activeMission = null;
    let openStationId = stations[0]?.id || '';

    const style = document.createElement('style');
    style.textContent = `
      .mission-board{margin:16px 0;padding:14px;background:linear-gradient(145deg,rgba(8,28,39,.88),rgba(5,18,28,.9));border:1px solid rgba(103,192,204,.23)}
      .mission-board-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
      .mission-board h2{margin:4px 0;color:#d9f4f0;font:15px 'Space Mono';letter-spacing:.04em}
      .mission-board-note{color:#779aa2;font:7px 'Space Mono';line-height:1.6}
      .mission-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .mission-card{display:flex;flex-direction:column;min-height:176px;padding:11px;background:rgba(4,16,25,.75);border:1px solid rgba(103,192,204,.17)}
      .mission-card-tag{color:#7bb9bf;font:7px 'Space Mono';letter-spacing:.12em}
      .mission-card h3{margin:8px 0 5px;color:#e0f2ee;font-size:17px;font-weight:500}
      .mission-card p{margin:0;color:#88a5a8;font-size:12px;line-height:1.45}
      .mission-card-meta{display:flex;justify-content:space-between;gap:8px;margin:10px 0;color:#c1d5cf;font:7px 'Space Mono'}
      .mission-card-meta b{color:#f1ce8e;font-weight:400}
      .mission-action{width:100%;margin-top:auto;padding:9px 7px;border:1px solid rgba(113,220,224,.34);background:rgba(35,111,124,.16);color:#b9eeea;font:7px 'Space Mono';cursor:pointer}
      .mission-action:hover:not(:disabled){border-color:#79e5eb;background:rgba(35,111,124,.32)}
      .mission-action:disabled{opacity:.38;cursor:not-allowed}
      .mission-active-card{margin-bottom:12px;padding:11px;border:1px solid rgba(247,193,117,.31);background:rgba(105,72,32,.12)}
      .mission-active-card strong{color:#f4d69c;font:9px 'Space Mono'}
      .mission-active-card p{margin:6px 0;color:#9ab4b2;font-size:12px;line-height:1.5}
      .mission-active-card .mission-action{margin-top:6px}
      .mission-hud{margin-top:10px;padding:10px 11px;background:rgba(5,17,28,.82);border:1px solid rgba(244,192,117,.3);border-left:2px solid #e8b66e}
      .mission-hud[hidden]{display:none}
      .mission-hud-label{color:#dfb86e;font:7px 'Space Mono';letter-spacing:.15em}
      .mission-hud-title{margin-top:5px;color:#e7f2eb;font-size:15px}
      .mission-hud-detail{margin-top:4px;color:#91abb1;font:7px 'Space Mono';line-height:1.6}
      .mission-hud-actions{display:grid;gap:5px;margin-top:8px}
      .mission-hud .mission-action{padding:7px;font-size:6px}
      @media(max-width:950px){.mission-list{grid-template-columns:1fr}.mission-card{min-height:145px}}
      @media(max-width:620px){.mission-board{padding:10px}.mission-board h2{font-size:12px}.mission-hud{max-width:165px}}
    `;
    style.textContent += `
      .mission-payout-toast{position:fixed;right:24px;top:84px;z-index:9000;min-width:220px;padding:13px 16px;background:linear-gradient(145deg,rgba(7,32,42,.97),rgba(5,19,29,.97));border:1px solid rgba(103,234,193,.62);box-shadow:0 0 24px rgba(72,220,177,.2);color:#dffbf2;font:11px 'Space Mono';opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .2s,transform .2s}
      .mission-payout-toast.open{opacity:1;transform:translateY(0)}.mission-payout-toast strong{display:block;color:#83ffd1;font-size:17px;margin-bottom:5px}.mission-payout-toast span{color:#b1c9c8;font-size:9px}
    `;
    document.head.appendChild(style);
    const payoutToast=document.createElement('div');payoutToast.className='mission-payout-toast';payoutToast.setAttribute('role','status');document.body.appendChild(payoutToast);
    let payoutTimer=0;
    function showPayout(amount){if(amount<=0)return;payoutToast.innerHTML=`<strong>+${amount.toLocaleString('pt-BR')} CR</strong><span>SALDO: ${getCredits().toLocaleString('pt-BR')} CR</span>`;payoutToast.classList.add('open');clearTimeout(payoutTimer);payoutTimer=setTimeout(()=>payoutToast.classList.remove('open'),6500)}

    const board = document.createElement('section');
    board.className = 'mission-board';
    board.innerHTML = '<div class="mission-board-head"><div><div class="eyebrow">Central de contratos</div><h2>Rotas comerciais</h2><div class="mission-board-note">PASSAGEIROS: ATÉ 12 POR VIAGEM · MATERIAIS: ATÉ 2.000 KG A BORDO</div></div><div class="mission-board-note" id="missionStationLabel"></div></div><div id="missionActiveInBoard"></div><div class="mission-list" id="missionOfferList"></div>';
    stationScreen.querySelector('.station-message').insertAdjacentElement('beforebegin', board);

    const hud = document.createElement('section');
    hud.className = 'mission-hud';
    hud.hidden = true;
    hud.innerHTML = '<div class="mission-hud-label">CONTRATO ATIVO</div><div class="mission-hud-title" id="missionHudTitle"></div><div class="mission-hud-detail" id="missionHudDetail"></div><div class="mission-hud-actions"><button class="mission-action" id="missionNavigate">NAVEGAR ATÉ A ROTA</button><button class="mission-action" id="missionStep" hidden></button><button class="mission-action" id="missionCancel">ABANDONAR CONTRATO</button></div>';
    document.querySelector('.leftpanel').appendChild(hud);

    function offersFor(station) {
      const index = stations.findIndex(candidate => candidate.id === station.id);
      const nextStation = stations[(index + 1) % stations.length];
      const firstMoon = moons[(index + 1) % moons.length];
      const secondMoon = moons[(index + 5) % moons.length];
      return [
        { id: station.id + '-passengers-' + nextStation.id, type: 'passengers', title: 'Transporte de passageiros', destination: nextStation, amount: 50, reward: 4200, material: '' },
        { id: station.id + '-ore-' + firstMoon.id, type: 'material', title: 'Entrega de minério de ferro', destination: firstMoon, amount: 1500, reward: 2850, material: 'minério de ferro' },
        { id: station.id + '-ammo-' + secondMoon.id, type: 'material', title: 'Remessa de munição', destination: secondMoon, amount: 1100, reward: 2450, material: 'munição' }
      ];
    }

    function bodyDistance(body) {
      const player = getPlayer();
      return Math.hypot(player.x - body.x, player.y - body.y, player.z - body.z);
    }

    function missionTitle(mission) {
      return mission.type === 'passengers' ? 'Transporte de passageiros' : 'Entrega de ' + mission.material;
    }

    function currentStop() {
      if (!activeMission) return null;
      return byId.get(activeMission.phase === 'pickup' ? activeMission.origin : activeMission.destination) || null;
    }

    function renderActiveBoard() {
      const capacity = Math.max(0, Number(getCargoCapacity()) || MATERIAL_CAPACITY_KG);
      const host = board.querySelector('#missionActiveInBoard');
      if (!activeMission) {
        host.replaceChildren();
        return;
      }
      const origin = byId.get(activeMission.origin), destination = byId.get(activeMission.destination);
      const card = document.createElement('article');
      card.className = 'mission-active-card';
      const title = document.createElement('strong');
      title.textContent = 'CONTRATO ACEITO · ' + missionTitle(activeMission).toUpperCase();
      const details = document.createElement('p');
      const loadText = activeMission.type === 'passengers'
        ? `${activeMission.onboard} passageiros a bordo · ${activeMission.delivered}/${activeMission.amount} transportados`
        : `${activeMission.amount.toLocaleString('pt-BR')} kg de ${activeMission.material} · capacidade máxima ${capacity.toLocaleString('pt-BR')} kg`;
      details.textContent = `${origin?.name || activeMission.origin} → ${destination?.name || activeMission.destination} · ${loadText} · recompensa ${activeMission.reward.toLocaleString('pt-BR')} CR`;
      card.append(title, details);
      host.replaceChildren(card);
    }

    function renderBoard() {
      const station = byId.get(openStationId);
      if (!station) return;
      board.querySelector('#missionStationLabel').textContent = station.name.toUpperCase();
      const cargoNote=board.querySelector('.mission-board-head .mission-board-note');if(cargoNote)cargoNote.textContent=`PASSAGEIROS: ATE ${PASSENGER_CAPACITY} / MATERIAIS: ATE ${Math.max(0,Number(getCargoCapacity())||MATERIAL_CAPACITY_KG).toLocaleString('pt-BR')} KG`;
      renderActiveBoard();
      const list = board.querySelector('#missionOfferList');
      list.replaceChildren();
      for (const offer of offersFor(station)) {
        const card = document.createElement('article');
        card.className = 'mission-card';
        const tag = document.createElement('div');
        tag.className = 'mission-card-tag';
        tag.textContent = offer.type === 'passengers' ? 'PASSAGEIROS · CONTRATO MULTIVIAGEM' : 'CARGA · ENTREGA ÚNICA';
        const title = document.createElement('h3');
        title.textContent = offer.title;
        const description = document.createElement('p');
        description.textContent = offer.type === 'passengers'
          ? `Leve ${offer.amount} pessoas até ${offer.destination.name}. Sua nave comporta ${PASSENGER_CAPACITY} por viagem, então serão necessárias várias viagens.`
          : `Transporte ${offer.amount.toLocaleString('pt-BR')} kg de ${offer.material} até ${offer.destination.name}.`;
        const meta = document.createElement('div');
        meta.className = 'mission-card-meta';
        const quantity = document.createElement('span');
        quantity.textContent = offer.type === 'passengers' ? '12 PESSOAS / VIAGEM' : offer.amount.toLocaleString('pt-BR') + ' / 2.000 KG';
        const reward = document.createElement('b');
        reward.textContent = offer.reward.toLocaleString('pt-BR') + ' CR';
        meta.append(quantity, reward);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mission-action';
        button.textContent = activeMission ? 'JÁ EXISTE UM CONTRATO ATIVO' : 'ACEITAR E SELECIONAR →';
        button.disabled = !!activeMission;
        button.addEventListener('click', () => accept(offer, station));
        card.append(tag, title, description, meta, button);
        list.appendChild(card);
      }
    }

    function renderHud() {
      if (!activeMission) {
        hud.hidden = true;
        return;
      }
      hud.hidden = false;
      const stop = currentStop();
      const atStop = stop && bodyDistance(stop) <= DELIVERY_RANGE;
      document.querySelector('#missionHudTitle').textContent = missionTitle(activeMission);
      let detail;
      if (activeMission.type === 'passengers') {
        detail = activeMission.phase === 'pickup'
          ? `Retorne a ${stop?.name} para embarcar até ${Math.min(PASSENGER_CAPACITY, activeMission.amount - activeMission.delivered)} passageiros.`
          : `${activeMission.onboard} a bordo · ${activeMission.delivered}/${activeMission.amount} entregues · destino: ${stop?.name}.`;
      } else {
        detail = `${activeMission.amount.toLocaleString('pt-BR')} kg a bordo · destino: ${stop?.name}.`;
      }
      document.querySelector('#missionHudDetail').textContent = detail;
      const nav = document.querySelector('#missionNavigate');
      nav.textContent = stop ? 'NAVEGAR ATÉ ' + stop.name.toUpperCase() + ' →' : 'ROTA INDISPONÍVEL';
      nav.disabled = !stop;
      const step = document.querySelector('#missionStep');
      step.hidden = !(atStop && (activeMission.phase === 'pickup' || activeMission.phase === 'delivery'));
      if (step.hidden) return;
      step.textContent = activeMission.phase === 'pickup' ? 'EMBARCAR PRÓXIMO GRUPO' : 'ENTREGAR CARGA / PASSAGEIROS';
      step.onclick = activeMission.phase === 'pickup' ? loadPassengerGroup : completeDelivery;
    }

    function accept(offer, station) {
      if (activeMission) return;
      if (offer.type === 'material') {
        const currentKg = Object.values(getCargo()).reduce((sum, amount) => sum + Math.max(0, Number(amount) || 0), 0);
        const capacity = Math.max(0, Number(getCargoCapacity()) || MATERIAL_CAPACITY_KG);
        if (currentKg + offer.amount > capacity) {
          options.message(`Espaço insuficiente. A carga atual é ${currentKg.toLocaleString('pt-BR')} kg; a nave comporta ${capacity.toLocaleString('pt-BR')} kg de materiais.`);
          return;
        }
      } else if (offer.type === 'passengers') {
        const cargoKg = Object.values(getCargo()).reduce((sum, amount) => sum + Math.max(0, Number(amount) || 0), 0);
        const passengerKg = Math.min(PASSENGER_CAPACITY, offer.amount) * PASSENGER_MASS_KG;
        const totalKg = cargoKg + Math.max(0, Number(getEquipmentWeight()) || 0) + passengerKg;
        const capacity = Math.max(0, Number(getCargoCapacity()) || MATERIAL_CAPACITY_KG);
        if (totalKg > capacity) {
          options.message(`Não há espaço para embarcar. Passageiros: ${passengerKg.toLocaleString('pt-BR')} kg; carga total prevista: ${totalKg.toLocaleString('pt-BR')} / ${capacity.toLocaleString('pt-BR')} kg.`);
          return;
        }
      }
      activeMission = {
        id: offer.id, type: offer.type, material: offer.material, origin: station.id,
        destination: offer.destination.id, amount: offer.amount, delivered: 0,
        onboard: offer.type === 'passengers' ? Math.min(PASSENGER_CAPACITY, offer.amount) : offer.amount,
        reward: offer.reward, paid: 0, phase: 'delivery', acceptedAt: new Date().toISOString()
      };
      options.message('Contrato selecionado. Use o painel da missão para traçar a rota.');
      savePosition();
      renderBoard();
      renderHud();
    }

    function loadPassengerGroup() {
      if (!activeMission || activeMission.type !== 'passengers' || activeMission.phase !== 'pickup') return;
      if (bodyDistance(byId.get(activeMission.origin)) > DELIVERY_RANGE) return;
      activeMission.onboard = Math.min(PASSENGER_CAPACITY, activeMission.amount - activeMission.delivered);
      activeMission.phase = 'delivery';
      options.message(`${activeMission.onboard} passageiros embarcados. Siga para o destino.`);
      savePosition();
      renderBoard();
      renderHud();
    }

    async function settlePayout(mission) {
      if (typeof options.payMission === 'function') {
        const result = await options.payMission({ ...mission });
        if (result) {
          mission.paid = Math.max(Number(mission.paid) || 0, Number(result.paid) || 0);
          setCredits(Number(result.credits) || 0);
          return Math.max(0, Number(result.earned) || 0);
        }
      }
      const earnedToDate = mission.type === 'passengers'
        ? Math.floor(mission.reward * mission.delivered / mission.amount)
        : (mission.delivered >= mission.amount ? mission.reward : 0);
      const earned = Math.max(0, earnedToDate - (Number(mission.paid) || 0));
      mission.paid = Math.max(Number(mission.paid) || 0, earnedToDate);
      if (earned > 0) setCredits(getCredits() + earned);
      return earned;
    }

    async function completeDelivery() {
      if (!activeMission) return;
      const mission = activeMission;
      const destination = mission.phase === 'pickup' ? byId.get(mission.origin) : byId.get(mission.destination);
      if (!destination || bodyDistance(destination) > DELIVERY_RANGE) return;
      if (mission.phase === 'pickup') { loadPassengerGroup(); return; }
      const title = missionTitle(mission);
      if (mission.type === 'passengers') {
        mission.delivered += mission.onboard;
        mission.onboard = 0;
      } else {
        mission.delivered = mission.amount;
      }
      const stepButton=document.querySelector('#missionStep');stepButton.disabled=true;
      let payment=0;
      try { payment=await settlePayout(mission); }
      catch(error) { options.message(error.message || 'Não foi possível registrar o pagamento. Tente novamente.');stepButton.disabled=false;return; }
      if (activeMission !== mission) return;
      if (mission.type === 'passengers' && mission.delivered < mission.amount) {
        mission.phase = 'pickup';
        showPayout(payment);
        options.message(`Grupo entregue: ${mission.delivered}/${mission.amount}. +${payment.toLocaleString('pt-BR')} CR; saldo ${getCredits().toLocaleString('pt-BR')} CR. Retorne à origem para buscar o próximo grupo.`);
        savePosition(); renderBoard(); renderHud(); return;
      }
      window.gameAudio?.play('missionDone');
      activeMission = null;
      showPayout(payment);
      options.message(`${title} concluído. +${payment.toLocaleString('pt-BR')} CR; saldo ${getCredits().toLocaleString('pt-BR')} CR.`);
      savePosition(); renderBoard(); renderHud();
    }

    document.querySelector('#missionNavigate').addEventListener('click', () => {
      const stop = currentStop();
      if (stop) setRoute(stop, 'MISSÃO · ' + stop.name);
    });
    document.querySelector('#missionCancel').addEventListener('click', () => {
      if (!activeMission || !window.confirm('Abandonar este contrato? A carga ou os passageiros em trânsito serão perdidos.')) return;
      activeMission = null;
      options.message('Contrato abandonado.');
      savePosition();
      renderBoard();
      renderHud();
    });

    return {
      openAt(body) { if (body?.type === 'Estação') openStationId = body.id; renderBoard(); },
      getMission() { return activeMission; },
      getPassengerCargo() {
        const passengers = activeMission?.type === 'passengers' && activeMission.phase === 'delivery' ? Math.max(0, Number(activeMission.onboard) || 0) : 0;
        return { count: passengers, weightKg: passengers * PASSENGER_MASS_KG };
      },
      remainingMaterialCapacity() {
        const stored = Object.values(getCargo()).reduce((sum, amount) => sum + Math.max(0, Number(amount) || 0), 0);
        const contracted = activeMission?.type === 'material' && activeMission.phase === 'delivery' ? activeMission.amount : 0;
        const passengers = activeMission?.type === 'passengers' && activeMission.phase === 'delivery' ? Math.max(0, Number(activeMission.onboard) || 0) * PASSENGER_MASS_KG : 0;
        return Math.max(0, (Number(getCargoCapacity()) || MATERIAL_CAPACITY_KG) - stored - contracted - passengers - Math.max(0,Number(getEquipmentWeight())||0));
      },
      load(mission) {
        if (!mission || typeof mission !== 'object' || !byId.has(mission.origin) || !byId.has(mission.destination)) return;
        if (!['passengers', 'material'].includes(mission.type) || !['pickup', 'delivery'].includes(mission.phase)) return;
        activeMission = {
          id: String(mission.id || ''), type: mission.type, material: String(mission.material || ''),
          origin: mission.origin, destination: mission.destination,
          amount: Math.max(1, Math.min(mission.type === 'passengers' ? 500 : (Number(getCargoCapacity())||MATERIAL_CAPACITY_KG), Number(mission.amount) || 1)),
          delivered: Math.max(0, Number(mission.delivered) || 0),
          onboard: Math.max(0, Number(mission.onboard) || 0), reward: Math.max(0, Number(mission.reward) || 0),
          paid: Math.max(0, Number(mission.paid) || 0), phase: mission.phase, acceptedAt: String(mission.acceptedAt || '')
        };
        if(activeMission.delivered>0&&typeof options.payMission==='function'){
          const missionRef=activeMission;
          options.payMission({...activeMission}).then(result=>{if(!result||activeMission!==missionRef)return;activeMission.paid=Math.max(activeMission.paid,Number(result.paid)||0);setCredits(Number(result.credits)||0);if(Number(result.earned)>0){showPayout(Number(result.earned));options.message(`Pagamento das entregas anteriores: +${Number(result.earned).toLocaleString('pt-BR')} CR; saldo ${getCredits().toLocaleString('pt-BR')} CR.`);savePosition()}}).catch(error=>options.message(error.message||'Não foi possível atualizar o saldo da missão.'));
        } else if(activeMission.type==='passengers'&&activeMission.delivered>0){const priorEarnings=Math.floor(activeMission.reward*activeMission.delivered/activeMission.amount);const catchUp=Math.max(0,priorEarnings-activeMission.paid);if(catchUp>0){activeMission.paid=priorEarnings;setCredits(getCredits()+catchUp);showPayout(catchUp);options.message(`Pagamento das entregas anteriores: +${catchUp.toLocaleString('pt-BR')} CR; saldo ${getCredits().toLocaleString('pt-BR')} CR.`);savePosition()}}
        renderBoard();
        renderHud();
      },
      update: renderHud
    };
  }

  window.createMissionSystem = createMissionSystem;
})();
