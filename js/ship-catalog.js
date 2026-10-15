(() => {
  const models = {
    explorer: {name:'Astra Explorer',role:'Exploração',tag:'STARTER · EQUILIBRADA',cargo:2000,fuel:1000,hull:120,price:0,starter:true,accent:'#69e8e0',summary:'Nave versátil para mapear setores e começar sua carreira.'},
    prospector: {name:'Mantis Prospector',role:'Mineração',tag:'STARTER · EXTRAÇÃO',cargo:3200,fuel:850,hull:125,price:0,starter:true,accent:'#f2bd72',summary:'Casco reforçado e porão amplo para trazer mais minério de cada viagem.'},
    scout: {name:'Kite Scout',role:'Reconhecimento',tag:'STARTER · LONGO ALCANCE',cargo:1500,fuel:1500,hull:100,price:0,starter:true,accent:'#87b9ff',summary:'Leve e econômica, alcança destinos distantes com tanque ampliado.'},
    freighter: {name:'Atlas Hauler',role:'Carga pesada',tag:'ESTALEIRO · LOGÍSTICA',cargo:12000,fuel:1800,hull:170,price:220000,starter:false,accent:'#e7c87e',summary:'Cargueiro de grande capacidade; não aceita canhões.'},
    attack: {name:'Viper Interceptor',role:'Combate',tag:'ESTALEIRO · CLASSE DE ATAQUE',cargo:1500,fuel:1000,hull:180,price:380000,starter:false,accent:'#ff8d83',summary:'Caça blindado com canhão de plasma e dano reforçado.'}
  };
  let serial=0;
  function art(code){
    const color=models[code]?.accent||'#76d9df',id='ship-grad-'+(++serial);
    const bodies={
      explorer:`<path d="M190 22 221 76 298 101 304 119 224 112 209 145 190 132 171 145 156 112 76 119 82 101 159 76Z"/><path d="m190 31 12 54-12 39-12-39z" class="glass"/><path d="m85 104 70 4m140-4-70 4M164 116l26 15 26-15" class="line"/><circle cx="190" cy="108" r="3" class="lamp"/>`,
      prospector:`<path d="M190 28 216 69 234 92 219 126 190 143 161 126 146 92 164 69Z"/><path d="m165 79-64-20-23 15 63 32m83-27 64-20 23 15-63 32" class="line"/><path d="m79 70-30 16 29 8m164-8 29-16 30 16-29 8"/><path d="m148 101-36 5v26l44-7m72-24 36 5v26l-44-7" class="pod"/><path d="m177 91 13-32 13 32-13 10z" class="glass"/><circle cx="190" cy="116" r="4" class="lamp"/>`,
      scout:`<path d="M190 13 210 88 202 111 190 145 178 111 170 88Z"/><path d="m177 84-77-24 14 27 62 29m41-32 77-24-14 27-62 29" class="line"/><path d="m113 65-15-25 39 29m130-4 15-25-39 29"/><path d="m181 64 9-31 9 31-9 21z" class="glass"/><path d="m184 116 6 19 6-19" class="lamp"/>`,
      freighter:`<path d="M190 17 216 43 221 114 190 141 159 114 164 43Z"/><rect x="103" y="53" width="47" height="63" rx="10" class="pod"/><rect x="230" y="53" width="47" height="63" rx="10" class="pod"/><path d="m159 70-13 12m85-12 13 12M166 109h48" class="line"/><path d="m178 47 12-18 12 18v24h-24z" class="glass"/><circle cx="190" cy="124" r="5" class="lamp"/>`,
      attack:`<path d="M190 15 214 58 226 83 337 108 345 130 229 120 213 136 201 117 190 143 179 117 167 136 151 120 35 130 43 108 154 83 166 58Z"/><path d="m190 24 11 62-11 25-11-25z" class="glass"/><path d="m55 116 102-19m168 19L223 97m-29 4v26" class="line"/><path d="m77 119 20 4m226-4-20 4" class="lamp"/>`
    };
    return `<svg class="ship-art ship-art-${code}" viewBox="0 0 380 160" role="img" aria-label="Ilustração da nave ${models[code]?.name||code}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3ffff"/><stop offset=".3" stop-color="${color}"/><stop offset=".72" stop-color="#24475b"/><stop offset="1" stop-color="#0b1a2a"/></linearGradient><radialGradient id="${id}-glow"><stop stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><style>.ship-art .line{fill:none;stroke:#bcecf2;stroke-width:2}.ship-art .glass{fill:#09243a;stroke:#d9fbff}.ship-art .pod{fill:#234252;stroke:#b5dfe4}.ship-art .lamp{fill:${color};stroke:#fff0cf}</style><ellipse cx="190" cy="132" rx="112" ry="18" fill="url(#${id}-glow)" opacity=".35"/><g fill="url(#${id})" stroke="#d9fbff" stroke-width="2" stroke-linejoin="round">${bodies[code]}</g><g fill="none" stroke="${color}" stroke-width="1.3" opacity=".85">${code==='prospector'?'<path d="m52 80 21 8m255-8-21 8"/>':code==='freighter'?'<path d="M112 65h29m-29 10h29m98-10h29m-29 10h29"/>':'<path d="m151 90 25 9m63-9-25 9"/>'}</g><circle cx="190" cy="128" r="16" fill="url(#${id}-glow)"/><path d="M180 137 190 158 200 137" fill="${color}" opacity=".8"/></svg>`;
  }
  window.shipCatalog=models;
  window.shipArt=art;
})();
