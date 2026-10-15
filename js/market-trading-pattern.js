(() => {
  const screen = document.querySelector('#stationScreen');
  if (!screen) return;
  screen.dataset.marketCardPattern = 'padrão de mercado';
  window.marketPatternName = 'padrão de mercado';

  const prices = {
    buyCannon: 120, buyIon: 260, buyHeavy: 500, buySingularity: 50000,
    buyAmmo: 30, buyUpgrade: 80, towItemButton: 12000, buyOreIron: 10, buyOreNickel: 20, buyOreCobalt: 30, buyOreIce: 5
  };
  const names = {
    buyCannon: 'Canhão de pulso', buyIon: 'Canhão de íons',
    buyHeavy: 'Canhão de plasma', buySingularity: 'Canhão de singularidade',
    buyAmmo: 'Cápsulas de plasma', buyUpgrade: 'Capacitor de cerâmica', towItemButton: 'Rebocador orbital', buyOreIron: 'Minério de ferro', buyOreNickel: 'Minério de níquel', buyOreCobalt: 'Minério de cobalto', buyOreIce: 'Gelo'
  };
  const modal = document.createElement('div');
  modal.className = 'market-info-overlay';
  modal.hidden = true;
  modal.innerHTML = '<section class="market-info-dialog" role="dialog" aria-modal="true" aria-labelledby="marketInfoTitle"><button type="button" class="market-info-close" aria-label="Fechar">×</button><small>FICHA DO ITEM</small><h2 id="marketInfoTitle"></h2><div class="market-info-content"></div><footer><span class="market-info-sell"></span><span class="market-info-buy"></span></footer></section>';
  screen.append(modal);

  const close = () => { modal.hidden = true; };
  modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('.market-info-close')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) close(); });

  function showInfo(card, name, sell, buy) {
    modal.querySelector('#marketInfoTitle').textContent = name;
    const copy = card.querySelector('p')?.textContent?.trim() || card.querySelector('.market-feature-copy small')?.textContent?.trim() || card.querySelector('.ship-product-specs')?.textContent?.trim() || 'Item disponível neste terminal.';
    const specs = card.querySelector('.weapon-specs, .ship-product-specs, .siege-cost, .upgrade-arrow');
    modal.querySelector('.market-info-content').replaceChildren(...[
      Object.assign(document.createElement('p'), { textContent: copy }),
      ...(specs ? [Object.assign(document.createElement('div'), { className: 'market-info-specs', textContent: specs.innerText || specs.textContent })] : [])
    ]);
    const unit=card.dataset.mineralResource?' / kg':'';
    modal.querySelector('.market-info-sell').textContent = `VENDA ${sell ? sell.toLocaleString('pt-BR') + ' CR' + unit : '—'}`;
    modal.querySelector('.market-info-buy').textContent = `COMPRA ${buy.toLocaleString('pt-BR')} CR${unit}`;
    modal.hidden = false;
  }

  function initCard(card, actionId) {
    const name = names[actionId] || card.querySelector('h2')?.textContent?.trim() || 'Item';
    const buyPrice = prices[actionId] || Number((card.querySelector('.price strong')?.textContent || '').replace(/\D/g, '')) || 0;
    const sellPrice = Math.floor(buyPrice * .5);
    const currentButton = card.querySelector(`#${actionId}`);
    const mineral = ({ buyOreIron: 'iron', buyOreNickel: 'nickel', buyOreCobalt: 'cobalt', buyOreIce: 'ice' })[actionId];
    const weaponKind = ({ buyCannon: 'pulse', buyIon: 'ion', buyHeavy: 'heavy', buySingularity: 'singularity' })[actionId];
    const canSell = weaponKind || actionId === 'buyAmmo' || actionId === 'buyUpgrade' || mineral;
    const unit = mineral ? ' CR / KG' : ' CR';
    const priceRow = document.createElement('div');
    priceRow.className = 'market-dual-price';
    priceRow.innerHTML = `<span><small>VENDA</small><b>${canSell?sellPrice.toLocaleString('pt-BR')+unit:'—'}</b></span><span><small>COMPRA</small><b>${buyPrice.toLocaleString('pt-BR')}${unit}</b></span>`;
    const controls = document.createElement('div');
    controls.className = 'market-item-actions';
    const buy = document.createElement('button');
    buy.type = 'button'; buy.className = 'market-buy-action'; buy.textContent = '+';
    buy.setAttribute('aria-label', `Comprar ${name} por ${buyPrice.toLocaleString('pt-BR')} créditos`);
    buy.disabled = !!currentButton?.disabled;
    buy.addEventListener('click', () => { if (currentButton && !currentButton.disabled) currentButton.click(); });
    const sell = document.createElement('button');
    sell.type = 'button'; sell.className = 'market-sell-action'; sell.textContent = '−';
    sell.setAttribute('aria-label', `Vender ${name} por ${sellPrice.toLocaleString('pt-BR')} créditos`);
    sell.disabled = !canSell || !isOwned(actionId, weaponKind);
    sell.title = canSell ? `Vender por ${sellPrice.toLocaleString('pt-BR')} CR` : 'Este item não pode ser vendido';
    if (canSell) sell.addEventListener('click', async () => {
      if (sell.disabled || (mineral ? !window.marketSellMineral : !window.marketSellWeapon)) return;
      sell.disabled = true;
      try {
        if (mineral) await window.marketSellMineral(mineral, Math.max(1, Math.floor(Number(card.querySelector('.market-sell-quantity')?.value) || 1)));
        else await window.marketSellWeapon(actionId, sellPrice);
      }
      finally { refresh(); }
    });
    const info = document.createElement('button');
    info.type = 'button'; info.className = 'market-info-action'; info.textContent = '!'; info.title = `Mais informações: ${name}`;
    info.setAttribute('aria-label', `Informações sobre ${name}`);
    info.addEventListener('click', () => showInfo(card, name, sellPrice, buyPrice));
    controls.append(buy, sell, info);
    let quantity=null, fixedQuantity=null, stockRow=null;
    if(mineral) {
      quantity=document.createElement('input'); quantity.type='number'; quantity.min='1'; quantity.step='1'; quantity.value='1'; quantity.className='market-sell-quantity'; quantity.setAttribute('aria-label',`Quantidade de ${name} para vender`); quantity.addEventListener('input',refresh);
      buy.disabled=true; buy.title='Compra deste minério indisponível';
    } else {
      stockRow=document.createElement('div'); stockRow.className='market-stock-row';
      stockRow.innerHTML='<small>DISPONÍVEL</small><b>1 UN</b>';
      fixedQuantity=document.createElement('input'); fixedQuantity.type='number'; fixedQuantity.min='1'; fixedQuantity.value='1'; fixedQuantity.readOnly=true; fixedQuantity.className='market-sell-quantity market-fixed-quantity'; fixedQuantity.setAttribute('aria-label',`Quantidade por unidade de ${name}`);
    }
    const oldBuy = card.querySelector('.item-buy');
    if (oldBuy) oldBuy.hidden = true;
    if(stockRow) card.append(stockRow);
    card.append(priceRow, ...(quantity?[quantity]:fixedQuantity?[fixedQuantity]:[]), controls);
    card.dataset.tradeAction = actionId;
  }

  function refresh() {
    screen.querySelectorAll('.market-item-actions').forEach(actions => {
      const card=actions.closest('.shop-item'), action=card?.dataset.tradeAction;
      const sell=actions.querySelector('.market-sell-action');
      const mineral=({buyOreIron:'iron',buyOreNickel:'nickel',buyOreCobalt:'cobalt',buyOreIce:'ice'})[action];
      const quantity=Math.max(1,Math.floor(Number(card?.querySelector('.market-sell-quantity')?.value)||1));
      if(sell)sell.disabled=mineral?mineralStock(mineral)<quantity:!isOwned(action,({buyCannon:'pulse',buyIon:'ion',buyHeavy:'heavy',buySingularity:'singularity'})[action]);
      if(mineral)card.querySelector('.market-mineral-stock').textContent=mineralStock(mineral).toLocaleString('pt-BR')+' kg';
      const buy=actions.querySelector('.market-buy-action'),source=card?.querySelector(`#${action}`);
      if(buy&&source){
        buy.disabled=!!mineral||!!source.disabled;
        const label=/EQUIPAR/i.test(source.textContent)?'Equipar':/EQUIPADO|INSTALADO/i.test(source.textContent)?'Já equipado':'Comprar';
        buy.title=mineral?'Compra indisponível':action==='towItemButton'?'Comprar Rebocador orbital por 12.000 CR + 250 kg de ferro':`${label} ${card.querySelector('h2')?.textContent?.trim()||'item'} por ${prices[action]||''} CR`;
      }
    });
  }
  function isOwned(action, kind) {
    const state=window.weaponSystem;
    if(!state)return false;
    if(kind)return state.owned?.includes(kind);
    if(action==='buyAmmo')return Number(state.ammo)>0;
    if(action==='buyUpgrade')return !!state.upgraded;
    const mineral=({buyOreIron:'iron',buyOreNickel:'nickel',buyOreCobalt:'cobalt',buyOreIce:'ice'})[action];
    if(mineral)return mineralStock(mineral)>0;
    return false;
  }

  function mineralStock(resource) {
    const id={iron:'#stationIron',nickel:'#stationNickel',cobalt:'#stationCobalt',ice:'#cargoIce'}[resource];
    return Number((screen.querySelector(id)?.textContent||'').replace(/\D/g,''))||0;
  }

  const mineralGrid=screen.querySelector('.armory-grid');
  if(mineralGrid) {
    for(const [suffix,code,label,asset] of [['Iron','iron','Minério de ferro','09_minerio_ferro.png'],['Nickel','nickel','Minério de níquel','10_cristal_azul.png'],['Cobalt','cobalt','Minério de cobalto','16_minerio_cobalto.png'],['Ice','ice','Gelo','15_minerio_gelo.png']]) {
      const card=document.createElement('article'); card.className='shop-item market-mineral-item'; card.dataset.marketCategory='minerals';
      card.innerHTML=`<div class="item-icon"><img src="midia/${asset}" alt="" aria-hidden="true"></div><div class="item-tag">CARGA DA NAVE <b>50%</b></div><h2>${label}</h2><p>Minério armazenado no compartimento de carga.</p><div class="ammo-meta"><span>DISPONÍVEL</span><b class="market-mineral-stock">0 kg</b></div><div class="item-buy"><div class="price"><strong>${({iron:10,nickel:20,cobalt:30,ice:5})[code]}</strong><small>CR / KG</small></div><button class="trade-button" id="buyOre${suffix}">COMPRAR</button></div>`;
      mineralGrid.append(card); initCard(card,`buyOre${suffix}`);
    }
  }

  screen.querySelectorAll('.shop-item:not(.market-mineral-item)').forEach(card => {
    const button = card.querySelector('.item-buy button[id]');
    if (button) initCard(card, button.id);
  });
  screen.querySelectorAll('.ship-product').forEach(card => {
    const button = card.querySelector('[data-buy-ship]');
    if (!button) return;
    const model = button.dataset.buyShip;
    const name = card.querySelector('h2')?.textContent?.trim() || model;
    const buyPrice = model === 'freighter' ? 220000 : 380000;
    const sellPrice = Math.floor(buyPrice * .5);
    const row = document.createElement('div'); row.className = 'market-dual-price';
    row.innerHTML = `<span><small>VENDA</small><b>${sellPrice.toLocaleString('pt-BR')} CR</b></span><span><small>COMPRA</small><b>${buyPrice.toLocaleString('pt-BR')} CR</b></span>`;
    const stock = document.createElement('div'); stock.className='market-stock-row'; stock.innerHTML='<small>DISPONÍVEL</small><b>1 UN</b>';
    const quantity = document.createElement('input'); quantity.type='number'; quantity.min='1'; quantity.value='1'; quantity.readOnly=true; quantity.className='market-sell-quantity market-fixed-quantity'; quantity.setAttribute('aria-label',`Quantidade por unidade de ${name}`);
    const actions = document.createElement('div'); actions.className = 'market-item-actions';
    const buy = document.createElement('button'); buy.type='button'; buy.className='market-buy-action'; buy.textContent='+'; buy.title=`Comprar ${name}`; buy.disabled=!!button.disabled; buy.addEventListener('click',()=>{ if(!button.disabled) button.click(); });
    const sell = document.createElement('button'); sell.type='button'; sell.className='market-sell-action'; sell.textContent='−'; sell.disabled=true; sell.title='Venda de naves indisponível';
    const info = document.createElement('button'); info.type='button'; info.className='market-info-action'; info.textContent='!'; info.title=`Mais informações: ${name}`; info.setAttribute('aria-label',`Informações sobre ${name}`); info.addEventListener('click',()=>showInfo(card,name,sellPrice,buyPrice));
    actions.append(buy,sell,info); button.hidden=true; card.append(stock,row,quantity,actions);
  });
  screen.addEventListener('click', event => {
    const button=event.target.closest('.market-vault-info');
    if(!button)return;
    event.preventDefault();event.stopPropagation();
    const card=button.closest('.market-vault-card');
    if(card)showInfo(card,'Cofre da estação',2500,5000);
  });
  window.refreshMarketTradingPattern=refresh;
  refresh();
})();
