window.createStationBank = function ({ enabled, api, stationScreen, getCargo, setCargo, getCredits, setCredits, getFuel, setFuel, setEnergy, savePosition, message }) {
  const style = document.createElement('style');
  style.textContent = `.station-bank{margin:14px 0 18px;padding:14px;background:linear-gradient(120deg,rgba(17,47,57,.8),rgba(5,19,28,.92));border:1px solid rgba(111,211,217,.27);position:relative}.station-bank:before{content:'';position:absolute;left:-1px;top:-1px;width:44px;height:2px;background:#83e7d2}.bank-head{display:flex;align-items:center;gap:10px}.bank-mark{width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(115,226,220,.55);border-radius:8px;color:#9bf4e2;font:19px 'Space Mono';background:rgba(31,117,112,.15)}.bank-head-copy{flex:1}.bank-head strong{display:block;font:10px 'Space Mono';letter-spacing:.1em;color:#c8f4e8}.bank-head small{font:8px 'Space Mono';color:#7599a2}.bank-vault{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:11px 0}.bank-vault>div{min-height:58px;padding:7px;background:rgba(3,13,21,.55);border:1px solid rgba(112,184,193,.15);display:grid;grid-template-columns:25px 1fr;grid-template-rows:auto auto;align-items:center;column-gap:7px}.bank-icon{grid-row:1/3;width:24px;height:24px;display:grid;place-items:center;border:1px solid rgba(112,210,215,.26);border-radius:7px;color:#9eece7;font:15px 'Space Mono'}.bank-vault small{font:8px 'Space Mono';color:#89aeb5}.bank-vault b{font:10px 'Space Mono';color:#e0f5ed;white-space:nowrap}.bank-actions{display:grid;grid-template-columns:1fr auto auto auto;gap:6px}.bank-actions select,.bank-actions input{min-width:0;padding:9px 7px;background:#06131e;color:#dff4f2;border:1px solid rgba(119,197,202,.24);font:9px 'Space Mono'}.bank-actions button{padding:8px 10px;border:1px solid rgba(110,215,199,.34);background:rgba(51,132,125,.16);color:#b7e9dc;font:8px 'Space Mono';cursor:pointer}.bank-actions button:hover{border-color:#95f1de}.bank-actions button:disabled,.bank-actions select:disabled,.bank-actions input:disabled{opacity:.4;cursor:not-allowed}.bank-actions .bank-all{grid-column:1/-1;padding:11px;background:linear-gradient(90deg,rgba(39,127,121,.37),rgba(27,80,92,.42));border-color:rgba(120,235,212,.55);font:9px 'Space Mono';letter-spacing:.1em}.bank-hint{margin-top:8px;min-height:14px;font:9px 'Space Mono';color:#9bc2c7}.bank-guest{font:9px 'Space Mono';color:#dda980;margin-top:10px}@media(max-width:700px){.bank-vault{grid-template-columns:repeat(2,minmax(0,1fr))}.bank-actions{grid-template-columns:1fr 1fr}.bank-actions select{grid-column:1/-1}.bank-actions .bank-all{grid-column:1/-1}}`;
  document.head.appendChild(style);
  stationScreen.querySelector('.ore-exchange').insertAdjacentHTML('afterend', `<section class="station-bank"><div class="bank-head"><span class="bank-mark" aria-hidden="true">▤</span><span class="bank-head-copy"><strong>COFRE DA ESTAÇÃO</strong><small id="bankStationName">ARMAZENAMENTO PESSOAL</small></span></div><div class="bank-vault"><div><span class="bank-icon">¢</span><small>CR</small><b id="bankCredits">0</b></div><div><span class="bank-icon">◆</span><small>FERRO</small><b id="bankIron">0 kg</b></div><div><span class="bank-icon">⚙</span><small>NÍQUEL</small><b id="bankNickel">0 kg</b></div><div><span class="bank-icon">⬡</span><small>COBALTO</small><b id="bankCobalt">0 kg</b></div><div><span class="bank-icon">❄</span><small>GELO</small><b id="bankIce">0 kg</b></div><div><span class="bank-icon">ϟ</span><small>ENERGIA</small><b id="bankEnergy">0 UE</b></div><div><span class="bank-icon">⛽</span><small>COMBUSTÍVEL</small><b id="bankFuel">0 U</b></div><div><span class="bank-icon">▣</span><small>ITENS</small><b id="bankItems">0</b></div></div><div class="bank-actions"><button type="button" class="bank-all" id="bankDepositAll">↓ &nbsp; GUARDAR TUDO</button><select id="bankResource" aria-label="Escolha o recurso"><option value="credits">¢ &nbsp; Créditos</option><option value="iron">◆ &nbsp; Ferro</option><option value="nickel">⚙ &nbsp; Níquel</option><option value="cobalt">⬡ &nbsp; Cobalto</option><option value="ice">❄ &nbsp; Gelo</option><option value="energy">ϟ &nbsp; Energia</option><option value="fuel">⛽ &nbsp; Combustível</option></select><input id="bankAmount" type="number" min="1" step="1" value="1" aria-label="Quantidade"><button type="button" id="bankDeposit" title="Depositar">↓</button><button type="button" id="bankWithdraw" title="Retirar">↑</button></div><div class="bank-hint" id="bankHint">Aproxime-se da estação para guardar recursos.</div></section>`);

  const $ = selector => stationScreen.querySelector(selector);
  const labels = { credits: 'CR', iron: 'kg de ferro', nickel: 'kg de níquel', cobalt: 'kg de cobalto', ice: 'kg de gelo', energy: 'UE de energia', fuel: 'U de combustível' };
  let station = null, bank = { credits: 0, items: {} }, busy = false;
  const controls = [$('#bankResource'), $('#bankAmount'), $('#bankDeposit'), $('#bankWithdraw'), $('#bankDepositAll')];
  const amount = value => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  function show() {
    $('#bankCredits').textContent = amount(bank.credits);
    $('#bankIron').textContent = amount(bank.items.iron) + ' kg';
    $('#bankNickel').textContent = amount(bank.items.nickel) + ' kg';
    $('#bankCobalt').textContent = amount(bank.items.cobalt) + ' kg';
    $('#bankIce').textContent = amount(bank.items.ice) + ' kg';
    $('#bankEnergy').textContent = amount(bank.items.energy) + ' UE';
    $('#bankFuel').textContent = amount(bank.items.fuel) + ' U';
    $('#bankItems').textContent = amount(Object.entries(bank.items).filter(([key, value]) => key.startsWith('equipment:') && Number(value) > 0).reduce((sum, [, value]) => sum + Number(value), 0));
    const select = $('#bankResource'), selected = select.value;
    select.querySelectorAll('[data-stored-equipment]').forEach(option => option.remove());
    Object.entries(bank.items).filter(([key, value]) => key.startsWith('equipment:') && Number(value) > 0).forEach(([key, value]) => {
      const code = key.slice('equipment:'.length), label = code.replaceAll('_', ' ').toUpperCase();
      const option = new Option('▣ ' + label + ' · ' + amount(value), key); option.dataset.storedEquipment = '1'; select.add(option);
    });
    if ([...select.options].some(option => option.value === selected)) select.value = selected;
    controls.forEach(control => { control.disabled = !enabled || busy; });
  }

  function applyShip(data) {
    setCredits(Number(data.credits || 0));
    const cargo = getCargo();
    cargo.Ferro = Number(data.items.iron || 0);
    cargo.Niquel = Number(data.items.nickel || 0);
    cargo.Cobalto = Number(data.items.cobalt || 0);
    cargo.Gelo = Number(data.items.ice || 0);
    setCargo(cargo);
    setFuel?.(Number(data.fuel || 0));
    setEnergy?.(Number(data.energy || 0));
  }

  async function load() {
    if (!enabled || !station) return;
    try {
      const response = await fetch(api + '?action=station-bank&station=' + encodeURIComponent(station), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível consultar o cofre.');
      bank = data.bank;
      applyShip(data.ship);
      $('#bankStationName').textContent = String(data.station.name || 'ESTAÇÃO').toUpperCase();
      show();
      $('#bankHint').textContent = 'Carga da nave: ' + (Number(data.ship.items.iron || 0) + Number(data.ship.items.nickel || 0) + Number(data.ship.items.cobalt || 0) + Number(data.ship.items.ice || 0)).toLocaleString('pt-BR') + ' kg';
    } catch (error) { $('#bankHint').textContent = error.message; }
  }

  async function move(operation) {
    if (!enabled || !station || busy) return;
    const quantity = Math.floor(Number($('#bankAmount').value) || 0);
    if (quantity < 1) { $('#bankHint').textContent = 'Informe uma quantidade válida.'; return; }
    busy = true; show();
    try {
      const resource = $('#bankResource').value;
      const response = await fetch(api + '?action=station-bank&station=' + encodeURIComponent(station), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station, operation, resource, amount: quantity })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível movimentar o cofre.');
      bank = data.bank; applyShip(data.ship); show();
      const resourceLabel = labels[resource] || resource.replace('equipment:', '').replaceAll('_', ' ');
      $('#bankHint').textContent = (operation === 'deposit' ? 'Guardado' : 'Retirado') + ': ' + amount(data.moved || quantity) + ' ' + resourceLabel + ' · ' + data.station.name;
      if (resource.startsWith('equipment:')) await window.crewGame?.refreshShip?.();
      savePosition(); message('Cofre atualizado · ' + data.station.name + '.');
    } catch (error) { $('#bankHint').textContent = error.message; }
    finally { busy = false; show(); }
  }

  async function depositAll() {
    if (!enabled || !station || busy) return;
    busy = true; show();
    try {
      const response = await fetch(api + '?action=station-bank&station=' + encodeURIComponent(station), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station, operation: 'deposit_all' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível guardar a carga.');
      bank = data.bank; applyShip(data.ship); show();
      $('#bankHint').textContent = 'Carga guardada · ' + data.station.name;
      await window.crewGame?.refreshShip?.();
      savePosition(); message('Carga transferida para o cofre da estação.');
    } catch (error) { $('#bankHint').textContent = error.message; }
    finally { busy = false; show(); }
  }

  $('#bankDeposit').addEventListener('click', () => move('deposit'));
  $('#bankWithdraw').addEventListener('click', () => move('withdraw'));
  $('#bankDepositAll').addEventListener('click', depositAll);
  if (!enabled) {
    stationScreen.querySelector('.station-bank').insertAdjacentHTML('beforeend', '<div class="bank-guest">Entre no multiplayer para usar o cofre.</div>');
    $('#bankHint').textContent = 'Cofre pessoal da estação.';
  }
  show();
  return { open(code) { station = String(code || ''); load(); }, refresh() { return load(); } };
};
