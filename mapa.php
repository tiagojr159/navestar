<?php
declare(strict_types=1);
?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mapa estelar | NAVE</title>
  <style>
    :root{color-scheme:dark;--bg:#030912;--panel:rgba(7,19,31,.94);--line:rgba(115,202,219,.22);--cyan:#79e7f1;--muted:#81a3b0;--gold:#ffd184}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 55% 42%,#0b2336 0,#050e1b 50%,var(--bg) 100%);color:#e6f4f7;font:14px 'Segoe UI',Arial,sans-serif;letter-spacing:.04em}
    .top{height:76px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);background:rgba(2,9,17,.7)}
    .brand{font:700 16px 'Courier New',monospace;letter-spacing:.24em}.brand span{color:var(--cyan)}.topright{display:flex;align-items:center;gap:18px}.status{font:10px 'Courier New',monospace;color:#9cb9c2}.status i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px;background:#72f1b8;box-shadow:0 0 10px #72f1b8}
    a,.button{color:var(--cyan);text-decoration:none;border:1px solid var(--line);background:rgba(10,31,45,.7);padding:10px 13px;border-radius:4px;font:10px 'Courier New',monospace;cursor:pointer}a:hover,.button:hover{border-color:var(--cyan);background:rgba(35,96,112,.3)}
    main{max-width:1460px;margin:auto;padding:25px 26px 30px}.heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:18px}.eyebrow{font:10px 'Courier New',monospace;letter-spacing:.17em;color:#72adba;text-transform:uppercase}.heading h1{font-weight:500;font-size:clamp(24px,3vw,34px);margin:5px 0}.heading p{color:var(--muted);margin:0;font-size:13px}.scale-note{font:10px 'Courier New',monospace;color:#9bb9c2;text-align:right;line-height:1.8}.layout{display:grid;grid-template-columns:minmax(0,1fr) 295px;gap:16px;align-items:start}
    .map-panel,.side-panel{background:var(--panel);border:1px solid var(--line);border-radius:7px;box-shadow:0 18px 65px rgba(0,0,0,.23)}.map-panel{padding:14px}.map-toolbar{display:flex;align-items:center;gap:8px;padding:0 0 12px}.map-toolbar .spacer{flex:1}.map-toolbar .readout{font:10px 'Courier New',monospace;color:#93b3bd;margin:0 8px}.map-stage{position:relative;width:100%;max-height:calc(100vh - 205px);aspect-ratio:1/1;overflow:hidden;border:1px solid rgba(112,193,211,.22);border-radius:3px;background:#020813}canvas{width:100%;height:100%;display:block;cursor:crosshair}.legend{display:flex;flex-wrap:wrap;gap:17px;padding:13px 3px 0;color:#96b2ba;font:9px 'Courier New',monospace}.legend span{display:inline-flex;align-items:center;gap:7px}.key{width:8px;height:8px;display:inline-block;border-radius:50%;background:#53a3eb}.key.moon{width:6px;height:6px;background:#aabac0}.key.station{width:8px;height:8px;border:1px solid #d8fcff;background:#75e8eb;transform:rotate(45deg);border-radius:1px}.key.ship{width:0;height:0;background:none;border-radius:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:10px solid #78f2bc}
    .side-panel{overflow:hidden}.panel-section{padding:17px;border-bottom:1px solid var(--line)}.panel-section:last-child{border-bottom:0}.panel-section h2{font:10px 'Courier New',monospace;letter-spacing:.15em;color:#8db5c0;margin:0 0 13px}.ship-coord{font:17px 'Courier New',monospace;color:var(--cyan)}.sub{margin-top:6px;color:#71939e;font:9px 'Courier New',monospace}.selection-name{font-size:18px;margin:0 0 9px}.data-row{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid rgba(114,175,189,.1);font-size:12px}.data-row span:first-child{color:#7d9eaa}.data-row span:last-child{font:10px 'Courier New',monospace;text-align:right;color:#c6dce0}.button.full{width:100%;margin-top:11px}.search{width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:3px;background:#06111d;color:#e5f4f6;outline:none}.search:focus{border-color:#65cfdf}.body-list{max-height:245px;overflow:auto;margin-top:9px}.body-option{width:100%;display:flex;align-items:center;gap:9px;padding:8px 4px;border:0;border-bottom:1px solid rgba(114,175,189,.09);background:transparent;color:#bdd0d3;text-align:left;cursor:pointer;font-size:12px}.body-option:hover,.body-option.active{color:#fff;background:rgba(77,166,184,.12)}.dot{width:7px;height:7px;flex:none;border-radius:50%;background:#53a3eb}.dot.station{border-radius:1px;background:#75e8eb;transform:rotate(45deg)}.dot.moon{width:5px;height:5px;background:#abbac1}.body-option small{margin-left:auto;color:#688a96;font:8px 'Courier New',monospace}.message{padding:12px 16px;color:#ffc8a0;font:10px 'Courier New',monospace;display:none}.message.show{display:block}
    @media(max-width:980px){main{padding:18px 14px}.layout{grid-template-columns:minmax(0,1fr) 260px}.map-stage{max-height:none}}
    @media(max-width:720px){.top{height:62px;padding:0 13px}.status{display:none}main{padding:16px 10px}.heading{align-items:start;flex-direction:column}.scale-note{text-align:left}.layout{grid-template-columns:1fr}.map-panel{padding:8px}.map-toolbar{gap:5px}.button,a{padding:9px 8px;font-size:9px}.map-stage{max-height:none}.side-panel{display:grid;grid-template-columns:1fr 1fr}.panel-section{padding:13px}.panel-section:last-child{grid-column:1/-1}.body-list{max-height:180px}}
  </style>
</head>
<body>
  <header class="top"><div class="brand">NAVE <span>/ CARTOGRAFIA</span></div><div class="topright"><div class="status"><i></i><span id="connection">CONECTANDO AO SISTEMA</span></div><a href="catélogo.php">CATALOGO</a><a href="avatar.php">AVATAR</a><a href="index.php">VOLTAR AO JOGO</a></div></header>
  <main>
    <div class="heading"><div><div class="eyebrow">Carta de navegação · setor local</div><h1>Mapa geral do espaço</h1><p>Visualização completa dos planetas, luas e estações no espaço navegável.</p></div><div class="scale-note">ALCANCE MÁXIMO<br><strong>450.000 px a partir do centro</strong><br>Faixa completa: −450.000 a +450.000 em X e Z</div></div>
    <div class="layout">
      <section class="map-panel" aria-label="Mapa estelar de mil por mil pixels">
        <div class="map-toolbar"><button class="button" id="zoomOut" title="Afastar">−</button><span class="readout" id="zoomReadout">VISÃO GERAL · 1×</span><button class="button" id="zoomIn" title="Aproximar">+</button><span class="spacer"></span><button class="button" id="centerShip">CENTRAR NAVE</button><button class="button" id="resetMap">VISÃO GERAL</button></div>
        <div class="map-stage"><canvas id="starMap" width="1000" height="1000"></canvas></div>
        <div class="legend"><span><i class="key"></i>PLANETA</span><span><i class="key moon"></i>LUA</span><span><i class="key station"></i>ESTAÇÃO</span><span><i class="key ship"></i>SUA NAVE</span></div>
        <div class="message" id="mapMessage">Não foi possível carregar os dados do mapa.</div>
      </section>
      <aside class="side-panel">
        <section class="panel-section"><h2>POSIÇÃO DA NAVE</h2><div class="ship-coord" id="shipCoord">X 0 · Z 0</div><div class="sub">Atualizada pelo arquivo de posição salvo no servidor</div></section>
        <section class="panel-section"><h2>ALVO SELECIONADO</h2><div class="selection-name" id="targetName">Nenhum alvo</div><div class="data-row"><span>Tipo</span><span id="targetType">—</span></div><div class="data-row"><span>Coordenadas</span><span id="targetCoords">—</span></div><div class="data-row"><span>Distância da nave</span><span id="targetDistance">—</span></div><button class="button full" id="centerTarget" disabled>CENTRAR NO ALVO</button></section>
        <section class="panel-section"><h2>CATÁLOGO DE CORPOS</h2><input class="search" id="searchBodies" type="search" placeholder="Buscar planeta, lua ou estação"><div class="body-list" id="bodyList"></div></section>
      </aside>
    </div>
  </main>
  <script>
    let requestedTargetId=new URLSearchParams(location.search).get('target');const canvas=document.querySelector('#starMap'),ctx=canvas.getContext('2d');
    const bounds=450000,size=1000,worldToPixel=size/(bounds*2);
    let bodies=[],ship={x:0,z:0},selected=null,zoom=1,center={x:0,z:0},drag=null;
    const fmt=n=>Math.round(n).toLocaleString('pt-BR');
    const mapMessage=document.querySelector('#mapMessage');
    function point(x,z){return{x:size/2+(x-center.x)*worldToPixel*zoom,y:size/2+(z-center.z)*worldToPixel*zoom}}
    function draw(){
      ctx.clearRect(0,0,size,size);
      const bg=ctx.createRadialGradient(500,470,8,500,500,740);bg.addColorStop(0,'#0a1a2b');bg.addColorStop(1,'#020711');ctx.fillStyle=bg;ctx.fillRect(0,0,size,size);
      let seed=513;for(let i=0;i<460;i++){seed=(seed*16807)%2147483647;let x=(seed%1000);seed=(seed*16807)%2147483647;let y=seed%1000;ctx.fillStyle=`rgba(177,218,245,${.12+(seed%50)/200})`;ctx.fillRect(x,y,1+(seed%2),1+(seed%2))}
      const topLeft=point(-bounds,-bounds),bottomRight=point(bounds,bounds);
      ctx.strokeStyle='rgba(104,190,211,.18)';ctx.lineWidth=1;ctx.strokeRect(topLeft.x,topLeft.y,bottomRight.x-topLeft.x,bottomRight.y-topLeft.y);
      const gridStep=10000*worldToPixel*zoom;
      if(gridStep>13){ctx.strokeStyle='rgba(100,167,188,.075)';ctx.lineWidth=1;ctx.beginPath();for(let i=-bounds;i<=bounds;i+=10000){let x=point(i,0).x,y=point(0,i).y;if(x>=0&&x<=size){ctx.moveTo(x,0);ctx.lineTo(x,size)}if(y>=0&&y<=size){ctx.moveTo(0,y);ctx.lineTo(size,y)}}ctx.stroke()}
      const origin=point(0,0);ctx.strokeStyle='rgba(105,207,218,.2)';ctx.beginPath();ctx.moveTo(origin.x,0);ctx.lineTo(origin.x,size);ctx.moveTo(0,origin.y);ctx.lineTo(size,origin.y);ctx.stroke();
      for(const b of bodies){const p=point(b.x,b.z);if(p.x<-15||p.x>size+15||p.y<-15||p.y>size+15)continue;const isStation=Number.isInteger(b.design),isMoon=b.type==='Lua',isSun=b.type==='Estrela';
        ctx.save();ctx.translate(p.x,p.y);if(selected&&selected.id===b.id){ctx.strokeStyle='rgba(255,222,147,.88)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.stroke()}
        ctx.fillStyle=b.color||'#8acbe8';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=isStation?10:6;
        if(isStation){ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.strokeStyle='#e3ffff';ctx.lineWidth=1;ctx.strokeRect(-4,-4,8,8)}else if(isSun){ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffe9aa';ctx.lineWidth=1;ctx.stroke()}else{ctx.beginPath();ctx.arc(0,0,isMoon?2.4:4,0,Math.PI*2);ctx.fill();if(!isMoon){ctx.strokeStyle='rgba(220,246,255,.68)';ctx.lineWidth=.8;ctx.stroke()}}
        ctx.restore();
        if(!isMoon||zoom>=2.1){ctx.font=isStation?'11px Courier New':'10px Courier New';ctx.fillStyle=isStation?'#b5eff0':isMoon?'#92aab4':'#b7cbd2';ctx.fillText(b.name.toUpperCase(),p.x+8,p.y-7)}
      }
      const s=point(ship.x,ship.z);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(-Math.PI/2);ctx.fillStyle='#73f2b9';ctx.shadowColor='#73f2b9';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-6,-5);ctx.lineTo(-3,0);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.restore();
      document.querySelector('#zoomReadout').textContent=`VISÃO GERAL · ${zoom.toFixed(1).replace('.0','')}×`;
    }
    function selectBody(body){selected=body;document.querySelector('#targetName').textContent=body.name;document.querySelector('#targetType').textContent=body.type;document.querySelector('#targetCoords').textContent=`${fmt(body.x)} / ${fmt(body.z)}`;document.querySelector('#targetDistance').textContent=fmt(Math.hypot(body.x-ship.x,body.z-ship.z))+' unidades';document.querySelector('#centerTarget').disabled=false;document.querySelectorAll('.body-option').forEach(el=>el.classList.toggle('active',el.dataset.id===body.id));draw()}
    function renderList(query=''){const list=document.querySelector('#bodyList');list.replaceChildren();for(const b of bodies.filter(item=>item.name.toLowerCase().includes(query.toLowerCase()))){const button=document.createElement('button');button.className='body-option';button.dataset.id=b.id;const dot=document.createElement('i');dot.className='dot '+(Number.isInteger(b.design)?'station':b.type==='Lua'?'moon':'');const name=document.createElement('span');name.textContent=b.name;const kind=document.createElement('small');kind.textContent=Number.isInteger(b.design)?'ESTAÇÃO':b.type.toUpperCase();button.append(dot,name,kind);button.addEventListener('click',()=>selectBody(b));list.append(button)}}
    function setZoom(value){zoom=Math.max(1,Math.min(8,value));draw()}
    document.querySelector('#zoomIn').addEventListener('click',()=>setZoom(zoom*1.35));document.querySelector('#zoomOut').addEventListener('click',()=>setZoom(zoom/1.35));
    document.querySelector('#resetMap').addEventListener('click',()=>{zoom=1;center={x:0,z:0};draw()});
    document.querySelector('#centerShip').addEventListener('click',()=>{center={x:ship.x,z:ship.z};zoom=Math.max(zoom,1.7);draw()});
    document.querySelector('#centerTarget').addEventListener('click',()=>{if(!selected)return;center={x:selected.x,z:selected.z};zoom=Math.max(zoom,2);draw()});
    document.querySelector('#searchBodies').addEventListener('input',e=>renderList(e.target.value));
    canvas.addEventListener('click',e=>{if(drag&&drag.moved)return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*size/rect.width,y=(e.clientY-rect.top)*size/rect.height;let nearest=null,dist=18;for(const b of bodies){const p=point(b.x,b.z),d=Math.hypot(p.x-x,p.y-y);if(d<dist){nearest=b;dist=d}}if(nearest)selectBody(nearest)});
    canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>2)drag.moved=true;if(drag.moved){const rect=canvas.getBoundingClientRect(),unit=bounds*2/(rect.width*zoom);center.x-=dx*unit;center.z-=dy*unit;drag.x=e.clientX;drag.y=e.clientY;draw()}});
    canvas.addEventListener('pointerup',()=>{if(drag)setTimeout(()=>drag=null,0)});canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*(e.deltaY<0?1.15:1/1.15))},{passive:false});
    async function refreshMap(){try{const response=await fetch('index.php?action=load-map',{cache:'no-store'});if(!response.ok)throw new Error('Resposta inválida do servidor');const data=await response.json();bodies=data.bodies||[];ship=data.ship||{x:0,z:0};document.querySelector('#shipCoord').textContent=`X ${fmt(ship.x)} · Z ${fmt(ship.z)}`;document.querySelector('#connection').textContent='MAPA ATUALIZADO';mapMessage.classList.remove('show');renderList(document.querySelector('#searchBodies').value);if(requestedTargetId){const requested=bodies.find(b=>b.id===requestedTargetId);if(requested){center={x:requested.x,z:requested.z};zoom=2;selectBody(requested);requestedTargetId=null;return}}if(selected){const fresh=bodies.find(b=>b.id===selected.id);if(fresh)selectBody(fresh)}else draw()}catch(error){document.querySelector('#connection').textContent='SEM CONEXÃO';mapMessage.classList.add('show')}}
    refreshMap();setInterval(refreshMap,5000);
  </script>
</body>
</html>
