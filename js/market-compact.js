(() => {
  const screen = document.querySelector('#stationScreen');
  if (!screen) return;
  const shell = screen.querySelector('.station-shell');
  if (!shell) return;
  screen.classList.add('market-icon-mode');

  const icons = {
    cart: '<path d="M3 4h2l2 12h13l3-8H7"/><circle cx="10" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>',
    fuel: '<path d="M6 21V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17M4 21h14M9 6h5v5H9zM17 8h2l2 3v7a2 2 0 0 1-4 0"/>',
    minerals: '<path d="m12 2 8 5-2 11-6 4-7-5L4 8l8-6Z"/><path d="m4 8 8 5 8-6M12 13v9"/>',
    crate: '<path d="m3 7 9-5 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5m-9 5v10"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8a4 4 0 1 0 0 8M8 12h7"/>',
    ship: '<path d="M12 2c4 4 5 8 5 13v5l-5-2-5 2v-5c0-5 1-9 5-13Z"/><path d="M7 12 3 16v4l4-2m10-6 4 4v4l-4-2"/>',
    equipment: '<path d="M14 6 18 2l4 4-4 4M3 21l11-11m-3 0 3 3m-6 0 3 3"/>',
    radio: '<path d="M5 9a10 10 0 0 1 14 0M8 12a6 6 0 0 1 8 0m-5 3a2 2 0 0 1 2 0M12 17v5"/>',
    shield: '<path d="m12 2 8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3Z"/>',
    station: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-28 12 12)"/><path d="M12 2v20"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>'
  };
  const svg = name => window.marketIconAsset?.(name) || `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.station}</svg>`;
  const textOf = node => {
    const clone = node.cloneNode(true);
    clone.querySelectorAll('script,style,svg,.market-hover-tip').forEach(child => child.remove());
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    const parts = [];
    while (walker.nextNode()) { const part = walker.currentNode.nodeValue.replace(/\s+/g, ' ').trim(); if (part) parts.push(part); }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };
  const applyTip = (node, label, focusable = false) => {
    label = String(label || '').trim();
    if (!label) return;
    node.dataset.marketTip = label;
    if (!node.hasAttribute('aria-label')) node.setAttribute('aria-label', label);
    if (focusable && !node.hasAttribute('tabindex')) node.tabIndex = 0;
  };

  const tip = document.createElement('div');
  tip.className = 'market-hover-tip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('aria-hidden', 'true');
  document.body.append(tip);
  let active = null;
  function showTip(node) {
    if (!node || !node.dataset.marketTip) return;
    active = node;
    tip.textContent = node.dataset.marketTip;
    tip.classList.add('is-visible');
    tip.setAttribute('aria-hidden', 'false');
    const rect = node.getBoundingClientRect();
    requestAnimationFrame(() => {
      if (active !== node) return;
      const box = tip.getBoundingClientRect();
      const left = Math.max(8, Math.min(innerWidth - box.width - 8, rect.left + rect.width / 2 - box.width / 2));
      const below = rect.bottom + 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${below + box.height < innerHeight - 8 ? below : Math.max(8, rect.top - box.height - 8)}px`;
    });
  }
  function hideTip(node) {
    if (node && active !== node) return;
    active = null;
    tip.classList.remove('is-visible');
    tip.setAttribute('aria-hidden', 'true');
  }
  screen.addEventListener('pointerover', event => {
    const node = event.target.closest('[data-market-tip]');
    if (node && screen.contains(node)) showTip(node);
  });
  screen.addEventListener('pointerout', event => {
    const node = event.target.closest('[data-market-tip]');
    if (node && !node.contains(event.relatedTarget)) hideTip(node);
  });
  screen.addEventListener('focusin', event => showTip(event.target.closest('[data-market-tip]')));
  screen.addEventListener('focusout', event => hideTip(event.target.closest('[data-market-tip]')));
  window.addEventListener('scroll', () => hideTip(), true);

  const iconButton = (button, name, label) => {
    if (!button) return;
    applyTip(button, label || textOf(button));
    if (!button.querySelector('svg,img')) button.insertAdjacentHTML('afterbegin', svg(name));
    button.classList.add('market-icon-action');
  };
  screen.querySelectorAll('.ship-product').forEach(card => applyTip(card, textOf(card), true));
  const extraTips = ['.shipyard-fleet','.station-side-stats','.sale-controls','.bank-vault','.market-ship-status'];
  extraTips.forEach(selector => screen.querySelectorAll(selector).forEach(node => applyTip(node, textOf(node), true)));
  const appendIcon = (node, name) => { if (node && !node.querySelector(':scope > svg,:scope > img')) node.insertAdjacentHTML('afterbegin', svg(name)); };
  appendIcon(screen.querySelector('.shipyard-head'), 'ship');
  appendIcon(screen.querySelector('.sale-head'), 'minerals');
  appendIcon(screen.querySelector('.shop-label'), 'equipment');
  screen.querySelectorAll('.station-side-stats>div').forEach((row,index) => appendIcon(row, ['station','equipment','radio'][index] || 'station'));
  screen.querySelectorAll('.shop-item').forEach(card => applyTip(card, textOf(card), true));
  screen.querySelectorAll('.market-tab').forEach(button => applyTip(button, textOf(button)));
  screen.querySelectorAll('.market-credit,.station-title,.station-illustration,.station-side-note,.market-heading,.market-live,.shipyard-head,.fuel-market,.ore-exchange,.shop-label,.station-footer,.market-ship-heading,.market-ship-name,.market-meter,.station-side-stats>div,.resource-wallet>div,.station-bank,.mission-board').forEach(node => applyTip(node, textOf(node), node.matches('.market-meter,.resource-wallet>div')));
  screen.querySelectorAll('.station-close').forEach(button => { if (!button.querySelector('svg,img')) button.innerHTML = svg('close'); applyTip(button, 'Fechar mercado'); });
  screen.querySelectorAll('.ship-product-action,.item-buy .trade-button').forEach(button => iconButton(button, 'cart'));
  screen.querySelectorAll('.fuel-market-actions button').forEach(button => iconButton(button, 'fuel'));
  screen.querySelectorAll('.sale-controls button').forEach(button => iconButton(button, 'coin'));
  screen.querySelectorAll('.market-details').forEach(button => iconButton(button, 'ship'));
  screen.querySelectorAll('.sale-controls select').forEach((select, index) => {
    select.dataset.marketIcon = index === 0 ? 'minerals' : 'crate';
    applyTip(select, select.getAttribute('aria-label') || [...select.options].map(option => option.text).join(' / '));
  });
  screen.querySelectorAll('button,a,input,select').forEach(node => {
    if (node.matches('.market-tab,.station-close,.ship-product-action,.trade-button,.fuel-market-actions button,.sale-controls button,.market-details')) return;
    applyTip(node, node.getAttribute('aria-label') || node.getAttribute('title') || textOf(node) || node.placeholder || node.value);
  });

  function wrapText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const text = walker.currentNode;
      if (!text.nodeValue.trim() || text.parentElement.closest('script,style,svg,.market-hover-tip,.market-hidden-copy')) continue;
      nodes.push(text);
    }
    for (const text of nodes) {
      const label = text.nodeValue.replace(/\s+/g, ' ').trim();
      if (!label) continue;
      const span = document.createElement('span');
      span.className = 'market-hidden-copy';
      span.dataset.marketTip = label;
      span.title = label;
      span.textContent = text.nodeValue;
      text.parentNode.replaceChild(span, text);
    }
  }
  wrapText(screen);
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) wrapText(node.parentElement);
        else if (node.nodeType === Node.ELEMENT_NODE && node !== tip) wrapText(node);
      }
      if (record.type === 'characterData') wrapText(record.target.parentElement);
      const fleet = record.target.nodeType === Node.ELEMENT_NODE ? record.target.closest('.shipyard-fleet') : record.target.parentElement?.closest('.shipyard-fleet');
      if (fleet) applyTip(fleet, textOf(fleet), true);
    }
  });
  observer.observe(screen, {childList:true, characterData:true, subtree:true});
})();
