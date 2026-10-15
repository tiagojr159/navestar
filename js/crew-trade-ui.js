(function () {
  const items = {
    credits: { name: 'Créditos', unit: 'CR', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M15 8.5c-.7-.7-1.6-1-2.8-1-1.5 0-2.5.7-2.5 1.8 0 2.8 5.6 1 5.6 4 0 1.2-1.1 2.1-2.8 2.1-1.2 0-2.3-.4-3.1-1.2M12 5.5v13"/></svg>' },
    iron: { name: 'Ferro', unit: 'kg', icon: '<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.6 8-4.6M12 12v9"/></svg>' },
    nickel: { name: 'Níquel', unit: 'kg', icon: '<svg viewBox="0 0 24 24"><path d="m5 5 7 7-7 7M12 5l7 7-7 7"/></svg>' },
    cobalt: { name: 'Cobalto', unit: 'kg', icon: '<svg viewBox="0 0 24 24"><path d="m12 3 8 5v8l-8 5-8-5V8l8-5Z"/><circle cx="12" cy="12" r="2.5"/></svg>' }
  };
  const form = document.querySelector('#crewTradeForm');
  const modal = document.querySelector('.crew-social-modal');
  if (!form || !modal) return;
  const inventory = form.querySelector('#crewTradeInventory');
  const dropZone = form.querySelector('[data-trade-drop]');
  if (!inventory || !dropZone) return;

  function getAvailable(key) {
    const label = form.querySelector(`[data-available-label="${key}"]`);
    return Number((label?.textContent || '').replace(/[^\d]/g, '')) || 0;
  }
  function renderInventory() {
    const signature = Object.keys(items).map(key => `${key}:${getAvailable(key)}:${!!form.querySelector(`[data-offer="${key}"]`)?.disabled}`).join('|');
    if (inventory.dataset.signature === signature) return;
    inventory.dataset.signature = signature;
    inventory.innerHTML = Object.entries(items).map(([key, item]) => {
      const amount = getAvailable(key);
      const disabled = amount < 1 || !!form.querySelector(`[data-offer="${key}"]`)?.disabled;
      return `<button type="button" class="crew-trade-item" draggable="${!disabled}" data-trade-item="${key}" ${disabled ? 'disabled' : ''} aria-label="${item.name}: ${amount.toLocaleString('pt-BR')} ${item.unit}"><span class="crew-trade-item-icon">${item.icon}</span><span class="crew-trade-item-name"><b>${item.name}</b><small>${amount ? 'DISPONÍVEL' : 'SEM ESTOQUE'}</small></span><strong>${amount.toLocaleString('pt-BR')}<small>${item.unit}</small></strong></button>`;
    }).join('');
    renderOffer();
  }
  function renderOffer() {
    const selected = [...form.querySelectorAll('[data-offer]')].map(input => [input.dataset.offer, Math.max(0, Math.floor(Number(input.value) || 0))]).filter(([, amount]) => amount > 0);
    const summary = form.querySelector('#crewTradeDropSummary');
    const chips = form.querySelector('#crewTradeOfferChips');
    if (!summary || !chips) return;
    summary.textContent = selected.length ? `${selected.length} ${selected.length === 1 ? 'item adicionado' : 'itens adicionados'} · quantidades editáveis ao lado` : 'Arraste ou toque em um item para adicioná-lo.';
    chips.innerHTML = selected.map(([key, amount]) => `<span class="crew-trade-chip">${items[key].name} <b>${amount.toLocaleString('pt-BR')} ${items[key].unit}</b></span>`).join('');
  }
  function addItem(key) {
    if (!items[key]) return;
    const input = form.querySelector(`[data-offer="${key}"]`);
    const amount = getAvailable(key);
    if (!input || input.disabled || amount < 1) return;
    input.value = String(amount);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }
  modal.classList.add('trade-ui-ready');
  modal.addEventListener('click', event => {
    const item = event.target.closest('[data-trade-item]');
    if (item && !item.disabled) addItem(item.dataset.tradeItem);
  });
  form.addEventListener('input', renderOffer);
  modal.addEventListener('dragstart', event => {
    const item = event.target.closest('[data-trade-item]');
    if (!item || item.disabled) return;
    event.dataTransfer.setData('text/nave-trade-item', item.dataset.tradeItem);
    event.dataTransfer.effectAllowed = 'copy';
  });
  modal.addEventListener('dragover', event => {
    if (!event.target.closest('[data-trade-drop]')) return;
    event.preventDefault();
    dropZone.classList.add('drag-over');
  });
  modal.addEventListener('dragleave', event => {
    if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('drag-over');
  });
  modal.addEventListener('drop', event => {
    if (!event.target.closest('[data-trade-drop]')) return;
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    addItem(event.dataTransfer.getData('text/nave-trade-item'));
  });
  new MutationObserver(renderInventory).observe(form, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'value'] });
  renderInventory();

  const style = document.createElement('style');
  style.textContent = `
    .crew-social-modal.trade-mode .crew-social-card{width:min(960px,calc(100vw - 36px));padding:30px 32px 28px}
    .crew-social-modal.trade-mode .crew-trade-copy{max-width:760px;margin:9px 0 17px;color:#a7c0c8;line-height:1.45}
    .crew-trade-inventory{margin:0 0 14px;padding:13px 14px 14px;border:1px solid rgba(100,181,197,.22);border-radius:14px;background:linear-gradient(145deg,rgba(10,32,46,.88),rgba(6,20,31,.9))}
    .crew-trade-inventory-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
    .crew-trade-inventory-head b{color:#d9f3f5;font:8px 'Space Mono';letter-spacing:.13em}.crew-trade-inventory-head small{color:#79aeb9;font:7px 'Space Mono';letter-spacing:.08em}
    .crew-trade-items{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    .crew-trade-item{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:8px;min-width:0;padding:9px 10px;border:1px solid rgba(91,153,171,.26);border-radius:11px;background:linear-gradient(145deg,rgba(14,43,58,.92),rgba(8,26,39,.96));color:#e3f5f7;text-align:left;cursor:grab;transition:transform .18s,border-color .18s,background .18s,box-shadow .18s}
    .crew-trade-item:hover:not(:disabled){transform:translateY(-2px);border-color:rgba(100,225,222,.62);background:linear-gradient(145deg,rgba(19,65,77,.98),rgba(9,34,47,.98));box-shadow:0 8px 20px rgba(0,0,0,.19),0 0 16px rgba(74,197,205,.1)}.crew-trade-item:active:not(:disabled){cursor:grabbing}.crew-trade-item:disabled{opacity:.46;cursor:not-allowed}
    .crew-trade-item-icon{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(104,207,213,.2);border-radius:10px;background:rgba(57,156,167,.1);color:#83e3dc}.crew-trade-item-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .crew-trade-item-name{display:grid;gap:4px;min-width:0}.crew-trade-item-name b{overflow:hidden;color:#d9eef1;font:9px 'Space Mono';text-overflow:ellipsis;white-space:nowrap}.crew-trade-item-name small{color:#7397a3;font:6px 'Space Mono';letter-spacing:.08em}
    .crew-trade-item>strong{display:grid;justify-items:end;color:#f1f8f7;font:10px 'Space Mono';white-space:nowrap}.crew-trade-item>strong small{margin-top:3px;color:#7ba5ae;font:6px 'Space Mono'}
    .crew-trade-columns{grid-template-columns:1fr 1fr;gap:12px}.crew-trade-columns section{padding:14px;border-color:rgba(86,158,174,.26);border-radius:14px}.crew-trade-columns section>b{color:#8fd5d8}.crew-trade-own>label{padding:6px 0;border-bottom:1px solid rgba(102,151,164,.1)}
    .crew-trade-drop{display:flex;align-items:center;gap:10px;min-height:66px;margin:10px 0 9px;padding:10px 12px;border:1px dashed rgba(96,190,199,.36);border-radius:11px;background:rgba(7,26,39,.72);transition:border-color .16s,background .16s,box-shadow .16s}.crew-trade-drop.drag-over{border-color:#77eee1;background:rgba(23,81,83,.28);box-shadow:inset 0 0 0 1px rgba(119,238,225,.24),0 0 18px rgba(74,211,203,.12)}.crew-trade-drop-mark{display:grid;place-items:center;width:32px;height:32px;flex:none;border:1px solid rgba(116,224,215,.32);border-radius:10px;color:#9bf2df;font:20px 'Barlow Condensed',sans-serif}.crew-trade-drop>div{min-width:0}.crew-trade-drop>div>b{display:block;color:#b8e3e4;font:7px 'Space Mono';letter-spacing:.12em}.crew-trade-drop>div>small{display:block;margin-top:4px;color:#779ba5;font:7px 'Space Mono'}
    #crewTradeOfferChips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.crew-trade-chip{padding:4px 7px;border:1px solid rgba(94,193,184,.22);border-radius:7px;background:rgba(26,96,86,.18);color:#a3d8cc;font:7px 'Space Mono'}.crew-trade-chip b{color:#d2f2e7;font-weight:700}
    .crew-trade-their{min-height:152px;padding:10px 12px;border:1px solid rgba(95,147,163,.13);border-radius:10px;background:rgba(4,18,29,.48);line-height:2}
    @media(max-width:720px){.crew-social-modal.trade-mode .crew-social-card{width:100%;max-height:94vh;overflow:auto;padding:25px 18px 20px}.crew-trade-items{grid-template-columns:repeat(2,minmax(0,1fr))}.crew-trade-columns{grid-template-columns:1fr}.crew-trade-their{min-height:80px}.crew-trade-inventory-head{align-items:flex-start;flex-direction:column;gap:5px}}
  `;
  document.head.appendChild(style);
})();
