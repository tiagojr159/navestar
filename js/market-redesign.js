(() => {
  const screen = document.querySelector('#stationScreen');
  if (!screen) return;
  const shell = screen.querySelector('.station-shell');
  const top = screen.querySelector('.station-top');
  const main = screen.querySelector('.station-market');
  if (!shell || !top || !main) return;

  const icon = (name) => {
    const image = window.marketIconAsset?.(name);
    if (image) return image;
    const paths = {
      market: '<path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h9.4a2 2 0 0 0 1.9-1.4L23 9H7"/><circle cx="10" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M10 11h9M11 14h7"/>',
      ships: '<path d="M12 2c3 3 5 7 5 12v5l-5-2-5 2v-5c0-5 2-9 5-12Z"/><path d="m7 12-4 4v4l4-2m10-6 4 4v4l-4-2M12 7v5"/>',
      minerals: '<path d="m12 2 8 5-2 11-6 4-7-5L4 8l8-6Z"/><path d="m4 8 8 5 8-6M12 13v9M9 4l3 9 4-7"/>',
      equipment: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10M8 4.3l9 5.1v5.2l-5 2.8-5-2.8V9.4"/>',
      weapons: '<path d="m4 19 9-9m-6 12-4-4 13-13 4 4-13 13Z"/><path d="m14 5 5 5m-2-7 5 5"/>',
      ammo: '<path d="M8 22V7l2-5 2 5v15M15 22V7l2-5 2 5v15"/><path d="M8 12h4m3 0h4"/>',
      items: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m12 7 2 3 4 1-3 3 .5 4-3.5-2-3.5 2 .5-4-3-3 4-1 2-3Z"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      fuel: '<path d="M5 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M3 21h16M8 6h6v5H8zM17 8h2l2 3v7a2 2 0 0 1-4 0"/><path d="m11 12-2 4h2l-1 3 4-5h-2l1-2"/>',
      crate: '<path d="m3 7 9-5 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5m-9 5v10m-4-17 9 5"/>',
      credit: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5a4 4 0 1 0 0 7M8 12h7"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.items}</svg>`;
  };

  const tabs = [
    ['market','MERCADO'],['ships','NAVES'],['minerals','MINÉRIOS'],['equipment','EQUIPAMENTOS'],
    ['weapons','ARMAS'],['ammo','MUNIÇÃO'],['items','ITENS']
  ];
  const nav = document.createElement('nav');
  nav.className = 'market-nav';
  nav.setAttribute('aria-label','Categorias do mercado');
  nav.innerHTML = tabs.map(([id,label]) => `<button type="button" class="market-tab${id==='market'?' is-active':''}" data-market-tab="${id}" aria-pressed="${id==='market'}">${icon(id)}<span>${label}</span></button>`).join('');
  top.insertBefore(nav, top.querySelector('.dock-state'));
  const wallet = main.querySelector('#stationCredits');
  const creditBlock = document.createElement('div');
  creditBlock.className='market-credit';
  creditBlock.innerHTML=`<span class="market-credit-icon">${icon('credit')}</span><span><small>CRÉDITOS</small><strong></strong></span>`;
  const creditValue=creditBlock.querySelector('strong');
  if(wallet) { creditValue.append(wallet); wallet.innerHTML=''; }
  else creditValue.textContent='0 CR';
  top.insertBefore(creditBlock,top.querySelector('.station-close'));
  const close=top.querySelector('.station-close');
  if(close){close.innerHTML=icon('close');close.setAttribute('aria-label','Fechar mercado');}

  main.querySelector('.market-heading h1').textContent='MERCADO ORBITAL';
  main.querySelector('.market-heading p').hidden=true;
  main.querySelector('.market-heading .eyebrow').textContent='PORTO AURORA / TERMINAL COMERCIAL';
  main.querySelector('.market-live').innerHTML='<i></i> MERCADO ABERTO';
  const marketMessage=main.querySelector('.station-message');
  if(marketMessage) marketMessage.hidden=true;
  const sidebar=screen.querySelector('.station-sidebar');
  sidebar.querySelector('.eyebrow').textContent='ESTAÇÃO';
  sidebar.insertAdjacentHTML('afterbegin','<div class="station-title"><small>ÓRBITA DE AURORA</small><strong>PORTO AURORA</strong></div>');
  sidebar.querySelector('.station-orbit-label').textContent='ESTAÇÃO DE SERVIÇO E REABASTECIMENTO';
  sidebar.querySelector('.station-side-note').textContent='“Rotas seguras. Cargas prontas. Bem-vindo de volta, piloto.”';

  const shipyard=main.querySelector('.shipyard');
  const fuel=main.querySelector('.fuel-market');
  const ore=main.querySelector('.ore-exchange');
  const weapons=main.querySelector('.armory-grid');
  const bank=main.querySelector('.station-bank');
  const walletPanel=main.querySelector('.resource-wallet');
  if(walletPanel) walletPanel.hidden=true;
  if(shipyard) shipyard.dataset.marketCategory='ships';
  if(fuel) fuel.dataset.marketCategory='market';
  if(fuel) fuel.querySelector('div:first-child')?.insertAdjacentHTML('afterbegin',`<span class="market-fuel-icon">${icon('fuel')}</span>`);
  if(ore) ore.dataset.marketCategory='minerals';
  if(weapons) delete weapons.dataset.marketCategory;
  const viperArt=main.querySelector('.ship-product.attack .ship-product-art');
  if(viperArt) viperArt.innerHTML='<img class="market-viper-render" src="midia/68_arte_3d_icon_naves_colorido.png" alt="Viper Interceptor">';
  const haulerArt=main.querySelector('.ship-product.freighter .ship-product-art');
  if(haulerArt) haulerArt.innerHTML='<img class="market-hauler-render" src="midia/68_arte_3d_icon_naves_colorido.png" alt="Atlas Hauler">';
  if(bank) bank.dataset.marketCategory='items';
  const contracts=main.querySelector('.mission-board');
  if(contracts) contracts.dataset.marketCategory='items';
  if(walletPanel) walletPanel.dataset.marketCategory='minerals ammo';
  main.querySelectorAll('.shop-item').forEach((card,index)=>{
    card.dataset.marketCategory=card.classList.contains('upgrade-item')?'equipment':index===1?'ammo':'weapons';
    const ico=card.querySelector('.item-icon');
    const action=card.querySelector('button[id]')?.id||'';
    const itemIcon=action==='buyAmmo'?'ammo':action==='buyUpgrade'?'upgrade':action==='buyIon'?'laser':action==='buyHeavy'?'plasma':action==='buySingularity'?'weapons':action==='towItemButton'?'tools':index===1?'ammo':'laser';
    if(ico) ico.innerHTML=icon(itemIcon);
  });
  main.querySelectorAll('.bank-icon').forEach((node,index)=>node.innerHTML=icon(index===6?'fuel':index===0?'credit':'crate'));
  main.querySelectorAll('.bank-mark').forEach(node=>node.innerHTML=icon('crate'));
  main.querySelector('.shop-label').hidden=true;
  const showcase=document.createElement('section');
  showcase.className='market-category-showcase';
  showcase.dataset.marketCategory='market';
  showcase.setAttribute('aria-label','Categorias em destáque');
  const featuredCategories=[
    ['items','bank','COFRE DA ESTAÇÃO','Guarde itens e recursos'],
    ['equipment','equipment','EQUIPAMENTOS','Melhorias e módulos'],
    ['weapons','weapons','ARMAS','Sistemas de ataque'],
    ['ammo','ammo','MUNIÇÃO','Todos os calibres'],
    ['items','token','ITENS ESPECIAIS','Tecnologia rara']
  ];
  showcase.innerHTML=featuredCategories.map(([category,image,title,description])=>image==='bank'
    ? `<article class="market-feature-card market-vault-card" data-market-tab="items"><button type="button" class="market-vault-main" data-market-tab="items" aria-label="Abrir cofre da estação"><span class="market-feature-art">${icon(image)}<span class="market-vault-prices"><b>2.500</b><b>5.000</b></span></span><span class="market-feature-copy"><strong>${title}</strong><small>${description}</small></span></button><span class="market-vault-actions"><button type="button" data-vault-action="deposit" title="Guardar recursos no cofre" aria-label="Guardar recursos no cofre">−</button><button type="button" data-vault-action="withdraw" title="Retirar recursos do cofre" aria-label="Retirar recursos do cofre">+</button></span><button type="button" class="market-vault-info market-info-action" title="Mais informações: ${title}" aria-label="Informações sobre ${title}">!</button></article>`
    : `<button type="button" class="market-feature-card" data-market-tab="${category}"><span class="market-feature-art">${icon(image)}</span><span class="market-feature-copy"><strong>${title}</strong><small>${description}</small></span></button>`).join('');
  main.insertBefore(showcase,weapons);
  main.querySelector('.station-footer span:last-child').textContent='ESC / × PARA FECHAR O TERMINAL';
  const owned=document.createElement('section');
  owned.className='market-ship-status';
  owned.innerHTML=`<div class="market-ship-heading"><strong>SUA NAVE</strong><small>STATUS DO COMPARTIMENTO</small></div><div class="market-ship-name">${icon('ships')}<span><b>Nave atual</b><small>ATIVA / PORTO AURORA</small></span></div><div class="market-meter"><span class="meter-icon">${icon('crate')}</span><span><small>CARGA</small><b id="marketCargoStat">—</b><i><em></em></i></span></div><div class="market-meter"><span class="meter-icon orange">${icon('fuel')}</span><span><small>COMBUSTÍVEL</small><b id="marketFuelStat">—</b><i><em></em></i></span></div><button type="button" class="market-details" data-market-tab="ships">VER DETALHES <b>›</b></button>`;
  const placeOwnedPanel=()=>{
    if(window.matchMedia('(max-width: 800px)').matches) main.append(owned);
    else sidebar.insertBefore(owned,sidebar.querySelector('.station-side-note'));
  };
  placeOwnedPanel();
  window.addEventListener('resize',placeOwnedPanel,{passive:true});
  const numberFrom = (s) => Number((s||'').replace(/[^0-9]/g,''))||0;
  const update = () => {
    const cargo=document.querySelector('#bayCapacityText')?.textContent||document.querySelector('#cargoReadout')?.textContent||document.querySelector('#cargoTotal')?.textContent||'0 kg';
    const fuelText=document.querySelector('#fuelReadout')?.textContent||'0 / 1.000 U';
    const cargoStat=owned.querySelector('#marketCargoStat'),fuelStat=owned.querySelector('#marketFuelStat');
    if(cargoStat)cargoStat.textContent=cargo.trim();
    if(fuelStat)fuelStat.textContent=fuelText.trim();
    const cargoBar=owned.querySelector('.market-meter:first-of-type em');
    const fuelBar=owned.querySelector('.market-meter:nth-of-type(3) em');
    if(cargoBar){const parts=cargo.split('/');cargoBar.style.width=Math.min(100,numberFrom(parts[0])/Math.max(1,numberFrom(parts[1]||'2000'))*100)+'%';}
    if(fuelBar)fuelBar.style.width=Math.min(100,numberFrom(fuelText)/1000*100)+'%';
  };
  update();setInterval(update,1200);

  const setCategory = (category) => {
    const all=category==='market';
    main.dataset.activeMarketCategory=category;
    showcase.hidden=!all;
    weapons.hidden=all;
    main.querySelector('.shop-label').hidden=all;
    main.querySelectorAll('[data-market-category]').forEach(node=>{
      const categories=(node.dataset.marketCategory||'').split(/\s+/);
      node.hidden=all?(node.classList.contains('mission-board')||node.classList.contains('station-bank')||node.classList.contains('resource-wallet')):!categories.includes(category);
    });
    nav.querySelectorAll('.market-tab').forEach(button=>{
      const active=button.dataset.marketTab===category;
      button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
    });
    main.scrollTop=0;
  };
  nav.addEventListener('click',event=>{
    const button=event.target.closest('[data-market-tab]');if(button)setCategory(button.dataset.marketTab);
  });
  showcase.addEventListener('click',event=>{
    const info=event.target.closest('.market-vault-info');if(info)return;
    const vaultAction=event.target.closest('[data-vault-action]');
    if(vaultAction){setCategory('items');setTimeout(()=>document.querySelector(vaultAction.dataset.vaultAction==='deposit'?'#bankDeposit':'#bankWithdraw')?.focus(),0);return;}
    const button=event.target.closest('[data-market-tab]');if(button)setCategory(button.dataset.marketTab);
  });
  owned.querySelector('.market-details').addEventListener('click',()=>setCategory('ships'));
  screen.classList.add('market-redesign');
  screen.querySelector('.station-brand strong').textContent='PORTO AURORA';
  screen.querySelector('.station-brand small').textContent='MERCADO ORBITAL';
  setCategory('market');
})();
