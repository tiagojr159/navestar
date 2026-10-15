(() => {
  const files = {
    market: '65_arte_3d_icon_mercado_colorido.png', cart: '65_arte_3d_icon_mercado_colorido.png',
    ships: '68_arte_3d_icon_naves_colorido.png', ship: '68_arte_3d_icon_naves_colorido.png',
    minerals: '66_arte_3d_icon_minerios_colorido.png',
    equipment: '64_arte_3d_icon_itens_colorido.png', items: '64_arte_3d_icon_itens_colorido.png',
    weapons: '61_arte_3d_icon_armas_colorido.png', ammo: '67_arte_3d_icon_municao_colorido.png',
    fuel: '69_arte_3d_icon_reabastecimento_colorido.png', credit: '62_arte_3d_icon_creditos_colorido.png',
    coin: '62_arte_3d_icon_creditos_colorido.png', token: '70_arte_3d_icon_token_colorido.png',
    crate: '17_caixa_carga.png', bank: '18_bau.png', container: '19_container.png',
    station: '04_estacao.png', radio: '46_sensores.png', upgrade: '48_upgrade.png',
    repair: '41_reparos.png', tools: '42_ferramentas.png', shield: '30_escudo.png',
    energy: '63_arte_3d_icon_energia_colorido.png', laser: '25_arma_laser.png',
    plasma: '26_espada_plasma.png', reward: '60_recompensa.png', buy: '24_comprar.png', sell: '23_venda.png'
  };
  window.marketIconAsset = name => {
    const file = files[name];
    return file ? `<img class="market-raster-icon" src="midia/${file}" alt="" aria-hidden="true" decoding="async">` : '';
  };
})();
