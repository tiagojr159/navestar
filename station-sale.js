window.createStationSale = function ({ enabled, api, stationScreen, getCargo, setCargo, getCredits, setCredits, savePosition, setMessage, refreshMarket, refreshBank }) {
  stationScreen.querySelector('.ore-exchange').innerHTML = `<div class="sale-head"><strong>VENDA DE MINÉRIOS À ESTAÇÃO</strong><small id="salePriceLabel">A estação paga 50% do preço-base</small></div><div class="sale-controls"><select id="sellMineral" aria-label="Minério para vender"><option value="iron">Minério de ferro</option><option value="nickel">Minério de níquel</option><option value="cobalt">Minério de cobalto</option></select><select id="sellSource" aria-label="Local do minério"><option value="ship">Compartimento da nave</option><option value="bank">Cofre desta estação</option></select><input id="sellIronAmount" type="number" min="1" step="1" value="1" aria-label="Quantidade de minério para vender"><button id="sellIronButton">VENDER MINÉRIO →</button></div><div class="sale-stock">Disponível: <b id="sellIronStock">0</b> <span id="saleUnit">kg</span> · valor estimado: <b id="saleEstimate">0 CR</b></div>`;
  const style = document.createElement('style');
  style.textContent = `.ore-exchange{display:block!important}.sale-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.sale-head strong{font:8px 'Space Mono';letter-spacing:.1em;color:#b4e5dc}.sale-head small,.sale-stock{font:7px 'Space Mono';color:#789ca5}.sale-controls{display:grid;grid-template-columns:1.2fr 1.2fr .7fr auto;gap:6px;margin-top:10px}.sale-controls select,.sale-controls input{min-width:0;padding:8px;background:#06131e;color:#dff4f2;border:1px solid rgba(119,197,202,.24);font:8px 'Space Mono'}.sale-controls button{padding:8px 10px;border:1px solid rgba(110,215,199,.34);background:rgba(51,132,125,.16);color:#b7e9dc;font:7px 'Space Mono';cursor:pointer}.sale-controls button:disabled{opacity:.4;cursor:not-allowed}.sale-stock{margin-top:8px}.sale-stock b{color:#c2eadf}.sale-controls select:focus,.sale-controls input:focus{outline:1px solid #71e7f3}@media(max-width:700px){.sale-controls{grid-template-columns:1fr 1fr}.sale-controls select:first-child{grid-column:1/-1}.sale-controls button{grid-column:1/-1}}`;
  document.head.appendChild(style);
  const $ = selector => stationScreen.querySelector(selector);
  let prices = { iron: 10, nickel: 20, cobalt: 30 };
  const names = { iron: 'Minério de ferro', nickel: 'Minério de níquel', cobalt: 'Minério de cobalto' };
  let station = '', bank = { items: {} }, bankBusy = false, saleBusy = false;

  async function getBank() {
    if (!enabled || !station) return;
    bankBusy = true;
    try {
      const response = await fetch(api + '?action=station-bank&station=' + encodeURIComponent(station), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Banco indisponível.');
      bank = data.bank;
      prices = { ...prices, ...(data.prices || {}) };
      paint();
    } catch (error) { $('#salePriceLabel').textContent = error.message; }
    finally { bankBusy = false; paint(); }
  }

  function stock() {
    const code = $('#sellMineral').value, source = $('#sellSource').value;
    if (source === 'bank') return Number(bank.items[code] || 0);
    const key = { iron: 'Ferro', nickel: 'Niquel', cobalt: 'Cobalto' }[code];
    return Number(getCargo()[key] || 0);
  }

  function paint() {
    const code = $('#sellMineral').value, count = stock(), amount = Math.max(0, Math.floor(Number($('#sellIronAmount').value) || 0));
    const payout = Math.floor(prices[code] / 2);
    $('#salePriceLabel').textContent = `Base ${prices[code]} CR/kg · estação paga ${payout} CR/kg (50%)`;
    $('#sellIronStock').textContent = count.toLocaleString('pt-BR');
    $('#saleEstimate').textContent = (payout * amount).toLocaleString('pt-BR') + ' CR';
    $('#sellIronAmount').max = String(count);
    $('#sellIronButton').disabled = saleBusy || bankBusy || amount < 1 || amount > count;
  }

  async function sell() {
    if (saleBusy) return;
    const resource = $('#sellMineral').value, source = $('#sellSource').value;
    const amount = Math.floor(Number($('#sellIronAmount').value) || 0);
    if (amount < 1 || amount > stock()) { paint(); return; }
    saleBusy = true; paint();
    try {
      let data;
      if (enabled) {
        const response = await fetch(api + '?action=station-sale&station=' + encodeURIComponent(station), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ station, resource, source, amount })
        });
        data = await response.json();
        if (!response.ok) throw new Error(data.error || 'A estação recusou a venda.');
        setCredits(Number(data.credits));
        const cargo = getCargo();
        cargo.Ferro = Number(data.cargo.Ferro || 0);
        cargo.Niquel = Number(data.cargo.Niquel || 0);
        cargo.Cobalto = Number(data.cargo.Cobalto || 0);
        setCargo(cargo);
        bank = data.bank || bank;
      } else {
        const cargo = getCargo(), key = { iron: 'Ferro', nickel: 'Niquel', cobalt: 'Cobalto' }[resource];
        cargo[key] -= amount; setCargo(cargo);
        const unitPrice = Math.floor(prices[resource] / 2), total = amount * unitPrice;
        setCredits(getCredits() + total);
        data = { sold: { quantity: amount, unitPrice, total }, station: 'Estação' };
      }
      const sold = data.sold;
      setMessage(`${sold.quantity} kg de ${names[resource].toLowerCase()} vendidos por ${sold.total.toLocaleString('pt-BR')} CR (50% do preço-base).`);
      $('#sellIronAmount').value = '1';
      if (enabled) { await getBank(); await refreshBank(); }
      refreshMarket();
      savePosition();
    } catch (error) { $('#salePriceLabel').textContent = error.message; }
    finally { saleBusy = false; paint(); }
  }

  $('#sellMineral').addEventListener('change', paint);
  $('#sellSource').addEventListener('change', () => { if ($('#sellSource').value === 'bank') getBank(); else paint(); });
  $('#sellIronAmount').addEventListener('input', paint);
  $('#sellIronButton').addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation(); sell();
  }, true);
  return { open(code) { station = String(code || ''); bank = { items: {} }; paint(); getBank(); }, refresh: getBank, refreshUI: paint };
};
