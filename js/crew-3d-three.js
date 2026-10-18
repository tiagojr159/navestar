(function(){
  window.createStationScene3D=function(container){
    const canvas=document.createElement('canvas');canvas.className='crew-3d-canvas';canvas.setAttribute('aria-label','Interior 3D da estaÃ§Ã£o espacial');container.prepend(canvas);
    let currentData={},runtime=null,active=false,yaw=0,pitch=.14,avatarYaw=0,onSelect=()=>{};
    const queuedPosition={x:50,z:66.5};
    function worldPosition(roomX,roomZ){return{x:(Number(roomX)-50)*.244,z:(Number(roomZ)-66.5)*.434}}
    async function initialize(){
      let THREE,lastError;
      const baseScript=document.currentScript?.src||document.querySelector('script[src*="crew-3d-three.js"]')?.src||window.location.href;
      const localThree=new URL('three.module.js',new URL('.',baseScript)).href;
      for(const url of [localThree,'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js','https://unpkg.com/three@0.161.0/build/three.module.js']){try{THREE=await import(url);break}catch(error){lastError=error}}
      if(!THREE)throw lastError||new Error('Three.js indisponÃ­vel');
      const rect=container.getBoundingClientRect(),width=Math.max(1,rect.width),height=Math.max(1,rect.height);
      const $=id=>document.getElementById(id);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030b16);
  const camera = new THREE.PerspectiveCamera(69,width/height,0.07,350);
  const renderer = new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
  renderer.setSize(width,height,false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.15));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  // -----------------------------------------------------------------
  // CONFIGURAÃ‡Ã•ES, MATERIAIS E FERRAMENTAS DE MODELAGEM
  // -----------------------------------------------------------------
  const ROOM={halfW:11.15,front:-18.10,back:64.35,height:7.8};
  const palette={cyan:0x45dfff,blue:0x287fed,orange:0xffa258,white:0xd8f5ff,green:0x69ffd8};
  const mat=(color,metal=.42,rough=.47)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
  const glow=(color,power=1.8)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:power,metalness:.12,roughness:.25});
  const M={shell:mat(0x172432,.65,.39),panel:mat(0x223647,.61,.32),black:mat(0x0b1522,.4,.44),edge:mat(0x354b5d,.75,.29),trim:mat(0x778da2,.75,.3),tile:mat(0xa4c3d4,.58,.26),seat:mat(0x28475a,.31,.52),darkGlass:new THREE.MeshPhysicalMaterial({color:0x051c36,metalness:.14,roughness:.08,transparent:true,opacity:.7,depthWrite:false}),cyan:glow(palette.cyan,2.35),blue:glow(palette.blue,2.05),orange:glow(palette.orange,2.2),white:glow(palette.white,1.6),green:glow(palette.green,1.6)};
  const baseWallPalettes={
    'luna-base':{shell:0xe9edf1,panel:0xc9d5de,edge:0x718596,accent:'#d9e8f2'},
    'ganymede-base':{shell:0xd8e6db,panel:0xb9d5c6,edge:0x687c70,accent:'#a9d7bc'},
    'titan-base':{shell:0xf2d6a6,panel:0xd4ac77,edge:0x786247,accent:'#efc27c'},
    'callisto-base':{shell:0xd7d4e8,panel:0xbab8d0,edge:0x6f6c84,accent:'#b9b4dd'},
    'io-base':{shell:0xf2c0a1,panel:0xd89a72,edge:0x805841,accent:'#f0a467'},
    'europa-base':{shell:0xd4edf5,panel:0xb0d6e5,edge:0x5d8190,accent:'#9bdcef'},
    'triton-base':{shell:0xd4eee9,panel:0xa9d5cd,edge:0x537b77,accent:'#a5e7df'},
    'titania-base':{shell:0xd9e8cd,panel:0xb5c99d,edge:0x68754e,accent:'#b5dc8f'},
    'rhea-base':{shell:0xf0d8dd,panel:0xdbb4bf,edge:0x866774,accent:'#eab5c5'},
    'oberon-base':{shell:0xd5e4d7,panel:0xaec8b7,edge:0x5f7868,accent:'#9ed0aa'},
    'iapetus-base':{shell:0xebe0c8,panel:0xcdbb96,edge:0x7f7256,accent:'#d5bd83'}
  };
  const isMoonBase=code=>Object.prototype.hasOwnProperty.call(baseWallPalettes,String(code||''));
  function box(x,y,z,w,h,d,material,parent=scene,shadow=true){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);a.position.set(x,y,z);a.castShadow=shadow;a.receiveShadow=shadow;parent.add(a);return a}
  function sphere(x,y,z,r,material,parent=scene,segments=16){let a=new THREE.Mesh(new THREE.SphereGeometry(r,segments,Math.max(8,segments/2)),material);a.position.set(x,y,z);parent.add(a);return a}
  function tube(a,b,r,material,parent=scene,seg=7){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(B),seg),material);mesh.position.copy(A).add(B).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());parent.add(mesh);return mesh}
  function light(x,y,z,color,intensity,range){const p=new THREE.PointLight(color,intensity,range,2);p.position.set(x,y,z);scene.add(p);return p}
  function textTexture(w,h,draw){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');draw(c,w,h);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
  function rand(seed){let v=seed>>>0;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296}}
  const rnd=rand(271828);
  function strokePanel(c,x,y,w,h,color='rgba(67,225,255,.4)',fill='rgba(0,23,41,.9)'){c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle=color;c.lineWidth=3;c.strokeRect(x+.5,y+.5,w-1,h-1)}

  // Ambiente de reflexÃµes gerado por cÃ³digo: melhora o metal sem HDR externo.
  const env=textTexture(1024,512,(c,w,h)=>{
    let grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#09111d');grad.addColorStop(.35,'#617b9b');grad.addColorStop(.50,'#142b43');grad.addColorStop(.78,'#426179');grad.addColorStop(1,'#080e19');c.fillStyle=grad;c.fillRect(0,0,w,h);
    for(let i=0;i<22;i++){const x=rnd()*w;const y=110+rnd()*195;c.fillStyle=i%4?'rgba(124,212,255,.6)':'rgba(255,187,109,.85)';c.fillRect(x,y,1+rnd()*8,4+rnd()*47)}
  });env.mapping=THREE.EquirectangularReflectionMapping;scene.environment=env;
  scene.add(new THREE.HemisphereLight(0x8ed6ff,0x0a1320,2.0));
  const keyLight=new THREE.DirectionalLight(0xcbefff,2.15);keyLight.position.set(-3,7,6);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-17;keyLight.shadow.camera.right=17;keyLight.shadow.camera.top=23;keyLight.shadow.camera.bottom=-23;keyLight.shadow.normalBias=.035;keyLight.shadow.bias=-.00015;scene.add(keyLight);
  light(-6.5,6,-10,0x3aa6ff,32,17);light(6.4,6,-4,0x68c7ff,23,16);light(-5,6,12,0xff974c,16,12);light(7,6,10,0x33d7ff,18,13);

  // -----------------------------------------------------------------
  // PISO METÃLICO, JUNTAS, REFLEXOS E CAMINHOS ILUMINADOS
  // -----------------------------------------------------------------
  box(0,-.32,0,22.65,.68,37.65,M.black);
  const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(2.07,.06,2.18),M.tile,10*16);
  let m4=new THREE.Matrix4(),ci=0;
  for(let j=0;j<16;j++)for(let i=0;i<10;i++){
    const x=(i-4.5)*2.20,z=(j-7.5)*2.32;
    m4.makeTranslation(x,.04,z);tiles.setMatrixAt(ci,m4);
    const col=new THREE.Color().setHSL(.575+(rnd()-.5)*.018,.28+(rnd()-.5)*.1,.16+rnd()*.075);
    if(i===4||i===5)col.multiplyScalar(1.25);
    tiles.setColorAt(ci,col);ci++;
  }
  tiles.receiveShadow=true;scene.add(tiles);
  for(const x of [-10.1,-3.45,3.45,10.1]){
    box(x,.092,0,.065,.021,35.7,M.black,scene,false);
    for(let z=-16.7;z<17.5;z+=4.65){box(x,.113,z,.058,.025,3.15,x<0?M.cyan:M.orange,scene,false);}
  }
  for(let j=-16;j<=16;j+=4){
    box(0,.088,j,20.7,.017,.045,M.edge,scene,false);
    for(const x of [-9.2,-5.9,5.9,9.2]){
      box(x,.116,j,.7,.028,.047,j%8===0?M.cyan:M.orange,scene,false);
    }
  }
  for(const x of [-10.52,10.52]){box(x,.21,0,.16,.28,36.5,M.edge);box(x,.36,0,.04,.04,35.5,M.cyan,scene,false)}

  // -----------------------------------------------------------------
  // PAREDES LATERAIS, PILARES, FORRO E FITAS DE LUZ
  // -----------------------------------------------------------------
  for(const side of [-1,1]){
    const X=side*11.27;
    box(X,3.88,0,.34,7.8,37.2,M.shell);
    box(side*11.015,4.15,0,.075,5.8,35.6,M.panel);
    for(let z=-15.5;z<=16;z+=5.35){
      box(side*10.87,3.76,z,.26,7.2,.41,M.edge);
      box(side*10.69,4.35,z,.065,5.4,.12,z%2?M.cyan:M.blue,scene,false);
      box(side*10.89,6.89,z+2.5,.10,.11,4.25,M.orange,scene,false);
      box(side*10.82,1.27,z+2.5,.10,.065,4.3,M.cyan,scene,false);
      for(let k=0;k<3;k++)box(side*10.86,2.0+k*1.22,z+2.3,.055,.027,3.75,M.trim,scene,false);
    }
    box(side*10.96,.92,0,.34,1.25,36.9,M.black);
    for(let z=-16;z<=16;z+=4.1)box(side*10.76,.77,z,.045,.12,2.2,M.orange,scene,false);
    box(side*11.12,7.16,0,.5,.86,36.5,M.black);
  }
  box(0,7.76,0,22.8,.23,37.5,M.shell,scene,false);
  const ceilMaterials=[mat(0x142331,.45,.42),mat(0x223040,.45,.4),mat(0x1d2e3e,.51,.38)];
  for(let i=0;i<8;i++)for(let j=0;j<13;j++){
    const x=(i-3.5)*2.7,z=(j-6)*2.8;
    box(x,7.56,z,2.49,.13,2.58,ceilMaterials[(i*5+j*11)%3],scene,false);
    if((i+j)%5===0){box(x,7.45,z,1.1,.05,1.45,M.black,scene,false);for(const xx of [-.35,0,.35])box(x+xx,7.408,z,.08,.015,1.15,M.edge,scene,false)}
  }
  for(let z=-15.3;z<=17;z+=5.4){
    box(0,7.22,z,22.2,.52,.39,M.edge,scene,false);
    box(0,7.00,z,19.8,.045,.09,M.black);
    box(0,6.976,z,12.8,.027,.044,M.blue,scene,false);
    for(const x of [-8.7,-4.2,4.2,8.7])box(x,7.04,z,.2,.26,.65,M.shell);
  }
  for(const x of [-9.0,-6.1,-2.4,2.4,6.1,9.0]){
    for(let z=-16.2;z<17;z+=4.75){
      box(x,7.44,z,.135,.07,3.45,(Math.round(x+z)%3===0)?M.orange:M.cyan,scene,false);
      box(x,7.53,z,.35,.09,4.1,M.black,scene,false);
    }
  }
  // A porta fica aberta para o corredor que conecta a sala ao segundo habitat.
  for(const x of [-8.02,8.02])box(x,3.9,18.22,6.4,7.8,.4,M.shell);
  for(const x of [-10.7,-5.35,5.35,10.7])box(x,4.25,17.93,.35,6.7,.14,M.edge);
  box(0,7.08,18.22,5.35,1.44,.4,M.shell);
  for(const x of [-2.68,2.68]){
    box(x,3.52,18.30,.14,6.15,.32,M.edge);
    box(x-Math.sign(x)*.11,3.55,18.10,.035,5.65,.04,M.cyan,scene,false);
  }
  box(0,6.58,18.30,5.48,.12,.34,M.edge);
  box(0,6.42,18.10,5.25,.035,.04,M.cyan,scene,false);

  // -----------------------------------------------------------------
  // JANELA PANORÃ‚MICA: VÃƒO REAL, VIDRO, MOLDURA, PROTEÃ‡ÃƒO
  // -----------------------------------------------------------------
  const WZ=-18.05;
  box(0,7.08,WZ,21.85,1.46,.74,M.shell);
  box(0,.94,WZ,21.8,1.88,.8,M.shell);
  box(-10.52,3.9,WZ,.78,7.3,.85,M.edge);
  box(10.52,3.9,WZ,.78,7.3,.85,M.edge);
  box(0,1.78,-17.72,19.6,.16,.56,M.edge);
  box(0,1.94,-17.72,19.2,.07,.32,M.cyan,scene,false);
  box(0,6.39,-17.72,19.25,.15,.38,M.edge);
  box(0,6.25,-17.63,19.25,.052,.1,M.blue,scene,false);
  for(const x of [-10.00,10.00]){
    box(x,4.17,-17.71,.19,4.49,.35,M.edge);
    box(x+(x<0?.15:-.15),4.11,-17.49,.043,4.30,.044,M.cyan,scene,false);
  }
  for(const s of [-1,1]){
    tube([s*10.0,6.36,-17.55],[s*8.76,6.88,-17.55],.21,M.edge);
    tube([s*10.0,6.24,-17.43],[s*8.76,6.68,-17.43],.054,M.orange);
  }
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(19.7,4.3),new THREE.MeshPhysicalMaterial({color:0x3297c6,roughness:.03,metalness:.06,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide}));
  glass.position.set(0,4.13,-17.85);scene.add(glass);
  // Linhas muito discretas de reflexo no vidro, sem bloquear a vista.
  for(const x of [-8.6,8.8])box(x,4.17,-17.82,.025,3.9,.009,new THREE.MeshBasicMaterial({color:0x80dafd,transparent:true,opacity:.09}),scene,false);
  for(const x of [-7.6,7.6]){
    box(x,1.32,-17.41,3.5,.35,.65,M.panel);
    box(x,1.53,-17.3,3.25,.08,.48,M.edge);
    box(x,1.59,-17.13,2.75,.026,.14,M.orange,scene,false);
  }
  for(const x of [-9.3,9.3])box(x,2.12,-17.18,.85,.17,.6,M.shell);

  // -----------------------------------------------------------------
  // FUNDO ESPACIAL TOTALMENTE PROCEDURAL (nÃ£o usa imagem externa)
  // -----------------------------------------------------------------
  const starsCanvas=textTexture(2048,1024,(c,w,h)=>{
    let bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#010611');bg.addColorStop(.3,'#020a1b');bg.addColorStop(.68,'#050b24');bg.addColorStop(1,'#01050e');c.fillStyle=bg;c.fillRect(0,0,w,h);
    for(let i=0;i<90;i++){
      const x=rnd()*w,y=rnd()*h,r=35+rnd()*210;const hue=i%3===0?'120,71,171':i%3===1?'54,112,191':'44,87,141';const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${hue},${.012+rnd()*.03})`);g.addColorStop(1,`rgba(${hue},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<1300;i++){const x=rnd()*w,y=rnd()*h,r=rnd()<.03?1.7+rnd()*1.9:.22+rnd()*1.02,a=.2+rnd()*.8;const warm=rnd()<.11;c.beginPath();c.fillStyle=warm?`rgba(255,194,146,${a})`:`rgba(199,230,255,${a})`;c.arc(x,y,r,0,Math.PI*2);c.fill();if(r>2.2){c.fillStyle='rgba(144,220,255,.12)';c.fillRect(x-8,y,16,.6);c.fillRect(x,y-7,.6,14)}}
  });
  const starField=new THREE.Mesh(new THREE.PlaneGeometry(130,70),new THREE.MeshBasicMaterial({map:starsCanvas,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));starField.position.set(0,7,-105);scene.add(starField);
  // -----------------------------------------------------------------
  // LIVE DOCKING BOARD
  // -----------------------------------------------------------------
  function drawDockBoard(c,w,h,ships,stationName='ESTAÇÃO ORBITAL',occupants=[],stationCode=''){
    c.fillStyle='#03111f';c.fillRect(0,0,w,h);strokePanel(c,16,15,w-32,h-30,'rgba(40,186,240,.8)','rgba(4,20,38,.96)');
    const grd=c.createLinearGradient(0,0,w,0);grd.addColorStop(0,'#0c4370');grd.addColorStop(1,'#061e33');c.fillStyle=grd;c.fillRect(35,34,w-70,122);
    c.font='bold 48px monospace';c.fillStyle='#70f0ff';c.textAlign='center';c.shadowColor='#18baff';c.shadowBlur=15;c.fillText(String(stationName||'ESTAÇÃO ORBITAL').toLocaleUpperCase('pt-BR').slice(0,27),w/2,101);c.shadowBlur=0;
    if(isMoonBase(stationCode)){
      const roomNames={airlock:'DESCOMPRESSAO',command:'COMANDO',observatory:'OBSERVATORIO',geology:'GEOLOGIA',workshop:'OFICINA',medical:'ENFERMARIA',quarters:'ALOJAMENTO',hydroponics:'HIDROPONIA',communications:'COMUNICACOES','surface-hangar':'HANGAR DE SUPERFICIE'};
      c.font='25px monospace';c.fillStyle='#9bd9e8';c.fillText(String(stationName||'BASE LUNAR').toLocaleUpperCase('pt-BR')+' / COLONIA DE SUPERFICIE',w/2,201);
      c.fillStyle='#0f3855';c.fillRect(35,230,w-70,49);c.font='bold 27px monospace';c.textAlign='left';c.fillStyle='#94f7ff';c.fillText('PILOTO',52,264);c.fillText('SALA',500,264);c.fillText('ESTADO',803,264);
      const rows=(occupants||[]).slice(0,8);
      if(!rows.length){c.fillStyle='#0b1e30';c.fillRect(36,292,950,590);c.font='bold 33px monospace';c.textAlign='center';c.fillStyle='#8dc6d5';c.fillText('NENHUM PILOTO NA BASE',w/2,590)}
      rows.forEach((person,i)=>{const y=305+i*74;c.fillStyle=i%2?'rgba(12,35,54,.76)':'rgba(5,25,43,.6)';c.fillRect(36,y,950,66);c.font='25px monospace';c.textAlign='left';c.fillStyle='#c2eaff';c.fillText(String(person.name||'PILOTO').toUpperCase().slice(0,22),55,y+42);c.fillStyle='#80b6c9';c.fillText(roomNames[person.roomCode]||'BASE',500,y+42);c.fillStyle='#83ffbb';c.fillText('ONLINE',804,y+42)});
      c.strokeStyle='rgba(66,211,246,.5)';c.beginPath();c.moveTo(35,926);c.lineTo(989,926);c.stroke();c.fillStyle='#0b4565';c.fillRect(35,952,954,94);c.font='bold 39px monospace';c.textAlign='center';c.fillStyle='#8ef9ff';c.fillText('PILOTOS NA BASE: '+String((occupants||[]).length).padStart(2,'0'),w/2,1012);c.font='24px monospace';c.fillStyle='#5fa8c4';c.fillText('REDE LOCAL / PRESENCA ATUALIZADA',w/2,1112);c.textAlign='left';c.font='18px monospace';c.fillStyle='#5f93ac';c.fillText(String(stationName||'BASE').toLocaleUpperCase('pt-BR')+' / SISTEMA DE CONVIVENCIA',43,1214);return;
    }
    c.font='25px monospace';c.fillStyle='#9bd9e8';c.fillText('ESTAÇÃO ESPACIAL / TELÃO INFORMATIVO',w/2,201);
    c.fillStyle='#0f3855';c.fillRect(35,230,w-70,49);c.font='bold 27px monospace';c.textAlign='left';c.fillStyle='#94f7ff';c.fillText('NAVE / REGISTRO',52,264);c.fillText('PILOTO',500,264);c.fillText('ESTADO',803,264);
    const rows=(ships||[]).slice(0,8);
    if(!rows.length){c.fillStyle='#0b1e30';c.fillRect(36,292,950,590);c.font='bold 33px monospace';c.textAlign='center';c.fillStyle='#8dc6d5';c.fillText('NENHUMA NAVE ATRACADA',w/2,590)}
    rows.forEach((ship,i)=>{const y=305+i*74;c.fillStyle=i%2?'rgba(12,35,54,.76)':'rgba(5,25,43,.6)';c.fillRect(36,y,950,66);c.font='25px monospace';c.textAlign='left';c.fillStyle='#c2eaff';c.fillText(String(ship.name||'NAVE SEM REGISTRO').toUpperCase().slice(0,22),55,y+42);c.fillStyle='#80b6c9';c.fillText(String(ship.owner||'PILOTO').toUpperCase().slice(0,15),500,y+42);c.fillStyle=ship.active?'#83ffbb':'#8de2f0';c.fillText(ship.active?'ATIVA':'ACOPLADA',804,y+42)});
    c.strokeStyle='rgba(66,211,246,.5)';c.beginPath();c.moveTo(35,926);c.lineTo(989,926);c.stroke();
    c.fillStyle='#0b4565';c.fillRect(35,952,954,94);c.font='bold 39px monospace';c.textAlign='center';c.fillStyle='#8ef9ff';c.fillText('NAVES NO HANGAR: '+String((ships||[]).length).padStart(2,'0'),w/2,1012);
    c.font='24px monospace';c.fillStyle='#5fa8c4';c.fillText('SISTEMA DE DOCA / '+String((ships||[]).filter(ship=>ship.active).length).padStart(2,'0')+' ATIVAS',w/2,1112);
    for(let i=0;i<16;i++){c.fillStyle=i<(ships||[]).length?'#62edbb':'#227a99';c.fillRect(75+i*55,1144,39,23)}
    c.textAlign='left';c.font='18px monospace';c.fillStyle='#5f93ac';c.fillText('SISTEMA DE TRÃFEGO AEROESPACIAL Â· V 07.2',43,1214);
  }
  const boardTex=textTexture(1024,1250,(c,w,h)=>drawDockBoard(c,w,h,[]));
  function refreshDockBoard(ships,stationName,occupants,stationCode){drawDockBoard(boardTex.image.getContext('2d'),1024,1250,ships,stationName,occupants,stationCode);boardTex.needsUpdate=true}
  const board=new THREE.Group();board.position.set(-10.69,4.49,-5.55);board.rotation.y=Math.PI/2;scene.add(board);
  box(0,0,-.03,5.70,5.73,.18,M.black,board);
  box(0,0,.062,5.52,5.57,.12,M.edge,board);
  const boardFace=new THREE.Mesh(new THREE.PlaneGeometry(5.35,5.39),new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false}));boardFace.position.z=.128;board.add(boardFace);
  for(const xx of [-2.8,2.8])box(xx,0,.13,.06,5.7,.075,M.cyan,board,false);
  for(const yy of [-2.83,2.83])box(0,yy,.13,5.65,.06,.075,M.cyan,board,false);
  light(-8.9,5.6,-9.2,0x138fff,6.6,7);

  // -----------------------------------------------------------------
  // MOBILIÃRIO, BANCOS, QUIOSQUES E PLANTAS
  // -----------------------------------------------------------------
  const obstacles=[];
  function collider(x,z,halfX,halfZ){obstacles.push({minX:x-halfX,maxX:x+halfX,minZ:z-halfZ,maxZ:z+halfZ})}
  function bench(x,z,side){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=side===1?-Math.PI/2:Math.PI/2;scene.add(g);
    box(0,.41,0,2.55,.23,.93,M.edge,g);box(0,.56,-.08,2.37,.12,.81,M.seat,g);
    box(0,.95,.36,2.55,.98,.17,M.shell,g);box(0,1.0,.28,2.28,.53,.08,M.panel,g);
    for(const xx of [-1.07,1.07]){box(xx,.24,0,.22,.48,.68,M.trim,g);box(xx,.55,.08,.085,.075,.9,M.cyan,g,false)}
    box(0,.44,-.485,2.26,.052,.035,M.orange,g,false);
    collider(x,z,1.04,1.62);
  }
  bench(-8.35,1.8,-1);bench(8.35,3.6,1);bench(-8.35,12.2,-1);bench(8.35,-10.9,1);
  const kioskTex=textTexture(512,640,(c,w,h)=>{
    c.fillStyle='#061629';c.fillRect(0,0,w,h);c.fillStyle='#0e4263';c.fillRect(25,24,w-50,65);c.fillStyle='#8bf7ff';c.textAlign='center';c.font='bold 32px monospace';c.fillText('ACESSO DIGITAL',w/2,66);
    c.strokeStyle='#3baed5';c.strokeRect(26,118,w-52,445);c.font='25px monospace';c.textAlign='left';
    for(let i=0;i<6;i++){c.fillStyle=i%2?'#5aa7c9':'#c0f9ff';c.fillText(['CHECK-IN','SUA POSIÃ‡ÃƒO','MAPA DE DOCA','NAVEGADORES','SISTEMAS','SEGURANÃ‡A'][i],47,160+i*60);c.fillStyle='#26baeb';c.fillRect(37,177+i*60,424,2)}
    c.fillStyle='#5affe2';c.fillRect(40,578,432,25);c.fillStyle='#0b2532';c.textAlign='center';c.font='bold 18px monospace';c.fillText('SERVIÃ‡O OPERACIONAL',w/2,598);
  });
  function kiosk(x,z,side){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;scene.add(g);
    box(0,.17,0,1.52,.29,1.23,M.black,g);
    box(0,.81,0,.42,1.11,.51,M.edge,g);
    box(0,1.36,-.025,1.23,1.72,.33,M.shell,g);
    box(0,1.37,-.218,1.08,1.53,.04,M.blue,g,false);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.42),new THREE.MeshBasicMaterial({map:kioskTex,toneMapped:false}));screen.position.set(0,1.39,.246);g.add(screen);
    box(0,2.28,-.06,1.22,.055,.36,M.orange,g,false);
    collider(x,z,1.0,1.05);
  }
  kiosk(-9.28,8.16,-1);kiosk(9.28,-5.28,1);
  function plant(x,z){
    const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
    box(0,.38,0,1.05,.77,1.05,M.edge,g);
    box(0,.77,0,.94,.08,.94,M.cyan,g,false);
    box(0,.82,0,.84,.1,.84,M.black,g);
    tube([0,.75,0],[0,2.03,0],.083,mat(0x355f47,.05,.8),g);
    for(let i=0;i<8;i++){
      const a=i*Math.PI*2/8,ext=.36+rnd()*.48;
      const sx=Math.cos(a)*ext,sz=Math.sin(a)*ext;
      const leaf=new THREE.Mesh(new THREE.ConeGeometry(.24+rnd()*.10,.95+rnd()*.36,5),mat(i%3===0?0x55aa88:i%2?0x438a78:0x78ba99,.04,.82));
      leaf.position.set(sx*.62,1.25+rnd()*.45,sz*.62);leaf.rotation.z=-Math.cos(a)*(.33+rnd()*.28);leaf.rotation.x=Math.sin(a)*(.3+rnd()*.25);g.add(leaf);
    }
    collider(x,z,.68,.68);
  }
  for(const p of [[-9.58,-14.6],[9.52,-14.6],[-9.62,16.3],[9.55,16.2],[-9.65,-1.7],[9.65,7.35]])plant(...p);
  // Colunas de serviÃ§o, placas ambientais e faixa informativa de rodapÃ©.
  for(const x of [-10.5,10.5])for(const z of [-15.9,16.6]){
    box(x,3.68,z,.53,6.2,.48,M.edge);
    box(x+(x<0?.35:-.35),4.35,z,.042,4.2,.10,M.blue,scene,false);
  }
  const wallNotice=textTexture(768,190,(c,w,h)=>{
    c.fillStyle='#071b2e';c.fillRect(0,0,w,h);c.strokeStyle='#43c6f2';c.lineWidth=5;c.strokeRect(3,3,w-6,h-6);
    c.fillStyle='#7febff';c.textAlign='center';c.font='bold 45px monospace';c.fillText('SETOR PANORÃ‚MICO',w/2,74);
    c.fillStyle='#e4b478';c.font='25px monospace';c.fillText('OBSERVATÃ“RIO 07  /  ABERTO',w/2,131);
  });
  const notice=new THREE.Mesh(new THREE.PlaneGeometry(12.3,1.92),new THREE.MeshBasicMaterial({map:wallNotice,toneMapped:false}));notice.position.set(0,5.75,64.015);notice.rotation.y=Math.PI;scene.add(notice);
  function refreshLunarTitle(stationName,stationCode){const base=isMoonBase(stationCode),style=baseWallPalettes[stationCode]||{accent:'#7febff'},c=wallNotice.image.getContext('2d'),title=String(stationName||'ESTACAO ESPACIAL').toLocaleUpperCase('pt-BR');c.fillStyle='#071b2e';c.fillRect(0,0,768,190);c.strokeStyle=style.accent;c.lineWidth=6;c.strokeRect(3,3,762,184);c.fillStyle=style.accent;c.textAlign='center';let font=58;c.font='bold '+font+'px sans-serif';while(c.measureText(title).width>710&&font>34){font-=2;c.font='bold '+font+'px sans-serif'}c.fillText(title,384,82);c.fillStyle='#c6e6ee';c.font='25px monospace';c.fillText(base?'BASE DE SUPERFICIE / 10 MODULOS':'ESTACAO ESPACIAL / SETOR HABITADO',384,143);wallNotice.needsUpdate=true}
  // ColisÃµes: vidro e paredes delimitam completamente a circulaÃ§Ã£o.
  // O espaÃ§o central permanece livre para explorar a sala inteira.

  // -----------------------------------------------------------------
  // PERSONAGEM: ROBÃ” LOW-POLY ANIMADO / TERCEIRA PESSOA
  // -----------------------------------------------------------------
  // Open corridor and a second connected room built with the station modules.
  const extensionCount=3*7+10*13;
  const extensionFloor=new THREE.InstancedMesh(new THREE.BoxGeometry(2.07,.06,2.18),M.tile,extensionCount);
  let extensionIndex=0,extensionMatrix=new THREE.Matrix4();
  function addExtensionTile(x,z){extensionMatrix.makeTranslation(x,.04,z);extensionFloor.setMatrixAt(extensionIndex,extensionMatrix);const shade=new THREE.Color().setHSL(.575+(rnd()-.5)*.018,.28+(rnd()-.5)*.1,.16+rnd()*.075);if(extensionIndex%5===0)shade.multiplyScalar(1.18);extensionFloor.setColorAt(extensionIndex,shade);extensionIndex++}
  for(let row=0;row<7;row++)for(let col=0;col<3;col++)addExtensionTile((col-1)*1.95,19.35+row*2.18);
  for(let row=0;row<13;row++)for(let col=0;col<10;col++)addExtensionTile((col-4.5)*2.2,35.25+row*2.18);
  extensionFloor.instanceMatrix.needsUpdate=true;extensionFloor.receiveShadow=true;scene.add(extensionFloor);
  for(const side of [-1,1]){
    const x=side*3.18;
    box(x,3.9,26.1,.30,7.8,15.8,M.shell);
    box(side*3.00,4.05,26.1,.07,5.8,14.8,M.panel);
    for(let z=19.5;z<=32.8;z+=3.25){box(side*2.88,3.82,z,.18,6.9,.32,M.edge);box(side*2.76,3.85,z,.045,5.3,.06,z%2?M.cyan:M.blue,scene,false);box(side*2.83,1.15,z,.065,.11,2.7,M.orange,scene,false)}
  }
  box(0,7.67,26.1,6.3,.24,15.9,M.shell);
  for(let z=20;z<=32;z+=4){box(0,7.35,z,5.9,.24,.34,M.edge);box(0,7.18,z,4.0,.04,.07,M.cyan,scene,false)}
  box(0,-.32,26.1,6.25,.68,15.8,M.black);
  light(0,6.2,26.1,0x39bfff,16,13);
  for(const side of [-1,1])box(side*2.84,.15,26.1,.08,.10,15.4,M.cyan,scene,false);
  const room2Front=34.05,room2Back=64.25,room2Center=(room2Front+room2Back)/2,room2Length=room2Back-room2Front;
  box(0,-.32,room2Center,22.65,.68,room2Length+.5,M.black);
  for(const side of [-1,1]){
    const x=side*11.27;
    box(x,.95,room2Center,.38,1.9,room2Length,M.black);
    box(x,7.18,room2Center,.42,1.24,room2Length,M.shell);
    for(const [z,length] of [[36.3,4.5],[46.55,7.5],[59.4,9.7]])box(x,3.94,z,.40,4.65,length,M.panel);
    for(const z of [38.55,42.75,50.30,54.50]){box(x,3.92,z,.36,4.8,.20,M.edge);box(side*11.02,3.94,z,.045,4.25,.035,M.cyan,scene,false);box(side*11.02,1.72,z,.04,.045,.035,M.orange,scene,false);box(side*11.02,6.16,z,.04,.045,.035,M.cyan,scene,false)}
    for(const z of [40.65,52.40]){const pane=new THREE.Mesh(new THREE.PlaneGeometry(4.05,3.95),new THREE.MeshPhysicalMaterial({color:0x2689b5,metalness:.08,roughness:.05,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide}));pane.position.set(side*11.045,4,z);pane.rotation.y=side*Math.PI/2;scene.add(pane);for(const y of [1.98,6.02])box(side*11.02,y,z,.08,.08,4.25,y<3?M.edge:M.cyan,scene,false)}
    for(let z=36.5;z<63;z+=5){box(side*10.92,4.25,z,.14,5.6,.32,M.edge);box(side*10.75,4.45,z,.04,4.4,.06,M.blue,scene,false)}
  }
  for(const x of [-6.93,6.93])box(x,3.9,room2Front,8.5,7.8,.4,M.shell);
  box(0,7.08,room2Front,5.35,1.44,.4,M.shell);
  for(const x of [-2.68,2.68]){box(x,3.52,room2Front,.14,6.15,.32,M.edge);box(x-Math.sign(x)*.11,3.55,room2Front-.2,.035,5.65,.04,M.cyan,scene,false)}
  box(0,3.9,room2Back,22.45,7.8,.4,M.shell);
  for(const x of [-9.5,-5.8,5.8,9.5])box(x,4.25,room2Back-.24,.35,6.7,.14,M.edge);
  box(0,7.67,room2Center,22.8,.23,room2Length,M.shell);
  for(let z=36.5;z<63;z+=5.4){box(0,7.18,z,22.2,.48,.39,M.edge,scene,false);box(0,6.96,z,19.8,.045,.09,M.black);box(0,6.93,z,12.8,.027,.044,M.blue,scene,false)}
  light(-5,5.9,41.5,0x39bfff,19,17);light(5,5.9,55,0x39bfff,19,17);
  bench(-8.35,41.6,-1);bench(8.35,55,1);bench(-8.35,59.2,-1);bench(8.35,36.8,1);
  kiosk(-9.28,48,-1);kiosk(9.28,57.2,1);plant(-9.62,61.7);plant(9.62,35.8);

  const lunarRooms=['AIRLOCK / DESCOMPRESSAO','CENTRO DE COMANDO','OBSERVATORIO LUNAR','LABORATORIO GEOLOGICO','OFICINA DE MANUTENCAO','ENFERMARIA','ALOJAMENTO DA TRIPULACAO','ESTUFA HIDROPONICA','COMUNICACOES','HANGAR DE SUPERFICIE'];
  const lunarRoomPartitions=[];
  const lunarBaseInterior=new THREE.Group();lunarBaseInterior.name='INTERIOR_BASE_LUNAR';lunarBaseInterior.visible=false;scene.add(lunarBaseInterior);
  function lunarRoomSign(label){return textTexture(640,150,(c,w,h)=>{c.fillStyle='#061927';c.fillRect(0,0,w,h);c.strokeStyle='#54d9e8';c.lineWidth=5;c.strokeRect(3,3,w-6,h-6);c.fillStyle='#82e8f2';c.font='bold 25px monospace';c.textAlign='center';c.fillText('BASE / MODULO',w/2,42);c.fillStyle='#f1c887';c.font='bold 32px monospace';c.fillText(label,w/2,108)})}
  for(let index=0;index<10;index++){
    const centerZ=ROOM.front+(index+.5)*(ROOM.back-ROOM.front)/10, narrow=centerZ>18&&centerZ<34,signX=narrow?-2.9:-10.25;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.9,.72),new THREE.MeshBasicMaterial({map:lunarRoomSign(lunarRooms[index]),toneMapped:false,side:THREE.DoubleSide}));sign.position.set(signX,narrow?6.25:5.85,centerZ);sign.rotation.y=Math.PI/2;lunarBaseInterior.add(sign);
    if(index===0)continue;
    const wallZ=ROOM.front+index*(ROOM.back-ROOM.front)/10;lunarRoomPartitions.push(wallZ);
    for(const side of [-1,1])box(side*6.63,3.83,wallZ,8.24,7.55,.34,M.shell,lunarBaseInterior);
    for(const side of [-1,1])box(side*2.5,3.08,wallZ,.28,6.1,.42,M.edge,lunarBaseInterior);
    box(0,6.38,wallZ,4.75,1.02,.42,M.edge,lunarBaseInterior);
    box(0,6.38,wallZ-.23,3.8,.74,.06,M.blue,lunarBaseInterior,false);box(0,6.38,wallZ+.23,3.8,.74,.06,M.blue,lunarBaseInterior,false);
    for(const side of [-1,1])box(side*2.5,3.1,wallZ-.24,.08,5.65,.05,M.cyan,lunarBaseInterior,false);
    box(0,.15,wallZ,4.8,.10,.68,M.cyan,lunarBaseInterior,false);const roomLight=new THREE.PointLight(0x44d9e8,2.2,7,2);roomLight.position.set(0,6.9,wallZ);lunarBaseInterior.add(roomLight);
  }
  const stationGeometry=scene.children.slice();stationGeometry.push(lunarBaseInterior);
  const robot=new THREE.Group();robot.position.set(0,0,7.6);scene.add(robot);
  const avatarMaterials=new Map();
  const avatarHelpers={
    box,
    tube,
    mat:(color,metal=.42,rough=.47)=>{const key=`${color}:${metal}:${rough}`;if(!avatarMaterials.has(key))avatarMaterials.set(key,mat(color,metal,rough));return avatarMaterials.get(key)},
    glow:(color,power=1.8)=>{const key=`glow:${color}:${power}`;if(!avatarMaterials.has(key))avatarMaterials.set(key,glow(color,power));return avatarMaterials.get(key)}
  };
  let robotModel=null,robotVisual=null,arms=[],legs=[],currentAvatarCode='';
  function avatarIndex(code){const index=['captain','pilot','engineer','medic','security','navigator','scientist','comms','mechanic','cadet'].indexOf(String(code||''));return index<0?0:index}
  function setAvatar(group,code,isSelf=false){
    const old=group.userData.crewModel;
    if(old&&old.index===avatarIndex(code))return old;
    if(old){group.remove(old.root);old.root.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    const model=window.createCrewAvatarModel(THREE,avatarIndex(code),group,avatarHelpers);
    group.userData.crewModel=model;group.userData.avatarCode=['captain','pilot','engineer','medic','security','navigator','scientist','comms','mechanic','cadet'][model.index];
    if(isSelf){robotModel=model;robotVisual=model.visual;arms=model.arms;legs=model.legs;currentAvatarCode=group.userData.avatarCode}
    return model;
  }
  const robotShadow=new THREE.Mesh(new THREE.CircleGeometry(.58,28),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.26,depthWrite:false}));robotShadow.rotation.x=-Math.PI/2;robotShadow.position.y=.083;robot.add(robotShadow);
  const glowFoot=new THREE.PointLight(0x53e6e6,1.1,2.3,2);glowFoot.position.set(0,.45,-.5);robot.add(glowFoot);
  setAvatar(robot,'captain',true);

  // CABINE DE PASSAGEIROS: cenÃ¡rio independente, mantendo os mesmos avatares
  // e contratos de movimento da aplicaÃ§Ã£o original.
  let passengerMode=false,passengerWorld=null,passengerPilot=null,passengerPilotModel=null;
  const cabinColliders=[];
  const cabinScale={x:.76,z:.65};
  const cabinDims={halfW:10.4*cabinScale.x,front:-16.6*cabinScale.z,back:16.6*cabinScale.z};
  function cabinCollider(x,z,w,d){x*=cabinScale.x;z*=cabinScale.z;w*=cabinScale.x;d*=cabinScale.z;cabinColliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2})}
  function cabinPosition(roomX,roomZ){
    const mapped=mapRoom(roomX,roomZ);
    return {x:THREE.MathUtils.clamp(mapped.x*cabinScale.x,-9.7*cabinScale.x,9.7*cabinScale.x),z:THREE.MathUtils.clamp(mapped.z*cabinScale.z,-15.2*cabinScale.z,15.2*cabinScale.z)};
  }
  function buildPassengerCabin(){
    if(passengerWorld)return;
    passengerWorld=new THREE.Group();passengerWorld.name='PASSENGER_CARGO_CABIN';passengerWorld.scale.set(cabinScale.x,1,cabinScale.z);scene.add(passengerWorld);
    const root=passengerWorld;
    root.add(new THREE.HemisphereLight(0xa3d8ff,0x2a3441,2.35));
    const cabinFill=new THREE.DirectionalLight(0xc9e7ff,2.1);cabinFill.position.set(1,7,14);root.add(cabinFill);
    const wallTexture=new THREE.TextureLoader().load('assets/textures/cabin-wall-v1.png');
    wallTexture.colorSpace=THREE.SRGBColorSpace;
    wallTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    const wallDecalMaterial=new THREE.MeshStandardMaterial({map:wallTexture,metalness:.36,roughness:.48,side:THREE.DoubleSide});
    const seatTexture=new THREE.TextureLoader().load('assets/textures/cabin-seat-v1.png');
    seatTexture.colorSpace=THREE.SRGBColorSpace;
    seatTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    const seatSurfaceMaterial=new THREE.MeshStandardMaterial({map:seatTexture,roughness:.84,metalness:.12,side:THREE.DoubleSide});
    const hull=mat(0x101e2d,.78,.34),panel=mat(0x243a50,.68,.36),steel=mat(0x405a70,.82,.29),dark=mat(0x07121f,.53,.48);
    const seatMat=mat(0x26313c,.2,.73),seatTrim=mat(0x687986,.8,.3),floorMat=mat(0x263d55,.73,.36);
    const crateMat=mat(0x344454,.74,.42),yellow=mat(0xc48a24,.63,.35);
    const makeBox=(x,y,z,w,h,d,m)=>box(x,y,z,w,h,d,m,root);
    const stripe=(x,y,z,w,h,d,m)=>box(x,y,z,w,h,d,m,root,false);
    function lamp(x,y,z,color,power,range){const L=new THREE.PointLight(color,power,range,2);L.position.set(x,y,z);root.add(L)}
    function beam(a,b,r=.13,m=steel){return tube(a,b,r,m,root,8)}
    // Piso de painÃ©is quadrados profundos, juntas e trilhos iluminados.
    makeBox(0,-.28,0,21.2,.55,34.5,dark);
    for(let ix=-6;ix<=6;ix++)for(let iz=-10;iz<=10;iz++){
      const x=ix*1.54,z=iz*1.56;
      makeBox(x,.015,z,1.49,.055,1.50,(ix+iz)%5===0?panel:floorMat);
      for(const sx of [-.62,.62])for(const sz of [-.62,.62]){
        const screw=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,.012,6),steel);
        screw.position.set(x+sx,.053,z+sz);root.add(screw);
      }
    }
    const floorTexture=new THREE.TextureLoader().load('assets/textures/cabin-floor-v1.png');
    floorTexture.wrapS=floorTexture.wrapT=THREE.RepeatWrapping;
    floorTexture.repeat.set(2.5,4.4);
    floorTexture.colorSpace=THREE.SRGBColorSpace;
    floorTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    const floorSurface=new THREE.Mesh(new THREE.PlaneGeometry(20.0,32.5),new THREE.MeshStandardMaterial({map:floorTexture,metalness:.48,roughness:.52}));
    floorSurface.rotation.x=-Math.PI/2;floorSurface.position.y=.061;floorSurface.receiveShadow=true;root.add(floorSurface);
    for(const x of [-2.05,2.05]){
      stripe(x,.081,0,.085,.026,32.7,M.orange);
      stripe(x+(x<0?-.14:.14),.076,0,.032,.02,32.7,M.cyan);
    }
    for(let z=-14;z<=14;z+=3.9){
      for(const x of [-4.3,4.3]){
        makeBox(x,.079,z,1.2,.03,1.10,dark);
        for(let i=0;i<8;i++)stripe(x-.47+i*.135,.104,z,.045,.016,.94,steel);
      }
    }
    // Laterais angulares segmentadas e corredores de luz.
    for(const side of [-1,1]){
      const X=side*10.53;
      makeBox(X,3.68,0,.42,7.4,34,hull);
      stripe(side*10.25,.78,0,.07,.10,33,M.orange);
      stripe(side*10.25,5.95,0,.08,.10,33,M.cyan);
      for(let z=-15;z<16;z+=3.2){
        makeBox(side*10.27,3.85,z,.14,4.55,2.82,panel);
        makeBox(side*10.12,3.83,z,.10,2.58,1.95,hull);
        makeBox(side*10.035,3.7,z,.05,1.55,1.22,steel);
        makeBox(side*10.00,3.72,z,.028,1.32,1.04,dark);
        const wallDecal=new THREE.Mesh(new THREE.PlaneGeometry(2.68,1.52),wallDecalMaterial);
        wallDecal.rotation.y=side<0?Math.PI/2:-Math.PI/2;
        wallDecal.position.set(side*9.93,4.3,z);root.add(wallDecal);
        for(const y of [2.74,4.64])for(const dz of [-.72,.72]){
          const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,.016,8),steel);
          bolt.rotation.z=Math.PI/2;bolt.position.set(side*9.95,y,z+dz);root.add(bolt);
        }
        for(let line=0;line<5;line++)stripe(side*9.96,4.15-line*.12,z,.035,.025,.65,seatTrim);
        stripe(side*9.98,6.03,z,.08,.13,1.80,M.cyan);
        stripe(side*9.95,1.65,z,.08,.065,1.8,M.orange);
        makeBox(side*9.87,3.8,z-1.45,.27,5.8,.28,steel);
        stripe(side*9.7,4.05,z-1.45,.035,3.45,.07,M.blue);
        // PeÃ§as chanfradas simuladas por vigas diagonais.
        beam([side*10.1,5.9,z-1.46],[side*7.9,7.12,z-1.46],.23,steel);
      }
      cabinCollider(X,0,.6,34);
    }
    // Teto industrial com mÃ³dulos profundos, lÃ¢mpadas brancas e Ã¢mbar.
    makeBox(0,7.4,0,21.2,.45,34.4,hull);
    for(let z=-15;z<=15;z+=3.15){
      makeBox(0,7.05,z,20.7,.43,.34,steel);
      makeBox(0,7.08,z,5.0,.23,2.44,dark);
      for(const x of [-8.15,-5.35,5.35,8.15]){
        stripe(x,6.99,z+.55,.36,.085,1.53,x<0?M.cyan:M.orange);
        makeBox(x,7.19,z-.5,.75,.24,.88,panel);
      }
      lamp(0,6.6,z,0x73bbff,3.3,9);
    }
    for(const side of [-1,1])stripe(side*9.12,7.08,0,.065,.04,33,M.blue);
    // Fundo do compartimento, estrutura de acesso Ã  nave.
    makeBox(0,3.7,17,21.2,7.4,.6,hull);
    makeBox(0,3.5,16.56,4.3,5.5,.13,panel);
    stripe(0,6.26,16.45,3.85,.075,.1,M.cyan);
    cabinCollider(0,17,21,.8);
    // Frente: abertura panorÃ¢mica grande acima do painel de instrumentos.
    makeBox(0,1.12,-17,21.2,2.24,.9,hull);
    makeBox(0,6.86,-17,21.2,1.3,.86,hull);
    for(const side of [-1,1]){
      makeBox(side*9.6,4.3,-16.95,.70,5.3,.9,steel);
      beam([side*9.4,6.55,-16.9],[side*7.45,7.12,-16.9],.32,steel);
      stripe(side*9.12,4.15,-16.38,.05,3.5,.06,M.cyan);
    }
    stripe(0,2.19,-16.53,19.0,.10,.18,M.cyan);
    stripe(0,6.27,-16.53,18.8,.08,.16,M.blue);
    // Vidro muito sutil. Nunca encobrir o espaÃ§o.
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(18.8,4.02),new THREE.MeshPhysicalMaterial({color:0x78cfff,transparent:true,opacity:.028,roughness:.04,depthWrite:false,side:THREE.DoubleSide}));
    glass.position.set(0,4.22,-16.67);root.add(glass);
    const exteriorTexture=new THREE.TextureLoader().load('assets/textures/cabin-window-v1.png');
    exteriorTexture.colorSpace=THREE.SRGBColorSpace;
    exteriorTexture.wrapT=THREE.ClampToEdgeWrapping;
    exteriorTexture.repeat.set(1,.52);
    exteriorTexture.offset.set(0,.30);
    exteriorTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
    const exterior=new THREE.Mesh(new THREE.PlaneGeometry(18.8,4.18),new THREE.MeshBasicMaterial({map:exteriorTexture,toneMapped:false}));
    exterior.position.set(0,4.22,-17.35);root.add(exterior);
    // EspaÃ§o externo procedural, planeta com atmosfera e milhares de estrelas.
    const random=rand(773312);
    const pts=[];
    for(let i=0;i<1250;i++)pts.push((random()-.5)*125,(random()-.5)*65,-28-random()*90);
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    root.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xd1e9ff,size:.23,transparent:true,opacity:.86})));
    const planetTexture=textTexture(1024,512,(c,w,h)=>{
      c.fillStyle='#145e93';c.fillRect(0,0,w,h);
      const cloudRandom=rand(91307);
      for(let i=0;i<160;i++){
        const x=cloudRandom()*w,y=cloudRandom()*h,r=10+cloudRandom()*95;
        c.fillStyle=i%4===0?'rgba(234,249,255,.28)':'rgba(71,173,211,.26)';
        c.beginPath();c.ellipse(x,y,r,r*(.16+cloudRandom()*.28),cloudRandom()*.8,0,Math.PI*2);c.fill();
      }
      for(let i=0;i<22;i++){
        c.strokeStyle='rgba(226,246,255,.2)';c.lineWidth=1+cloudRandom()*6;
        const x=cloudRandom()*w,y=cloudRandom()*h;
        c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+40,y-12,x+95,y+20,x+155,y-7);c.stroke();
      }
    });
    const planetMat=new THREE.MeshStandardMaterial({map:planetTexture,emissive:0x0e4265,emissiveIntensity:.5,roughness:1});
    const planet=new THREE.Mesh(new THREE.SphereGeometry(22,40,30),planetMat);
    planet.position.set(-15,-7,-52);root.add(planet);
    const halo=new THREE.Mesh(new THREE.SphereGeometry(22.5,40,30),new THREE.MeshBasicMaterial({color:0x72bfff,side:THREE.BackSide,transparent:true,opacity:.19,depthWrite:false}));halo.position.copy(planet.position);root.add(halo);
    for(let i=0;i<19;i++){
      const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.28+random()*.65),mat(0x647481,.12,.85));
      rock.position.set(6+random()*15,4+random()*9,-29-random()*20);root.add(rock);
    }
    // Dez assentos de passageiros: cinco de cada lado, voltados para o corredor.
    function seat(x,z,side){
      const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=0;g.scale.setScalar(1.22);root.add(g);
      box(0,.36,0,1.63,.45,1.52,steel,g);
      box(0,.78,-.09,1.55,.24,1.40,seatMat,g);
      box(0,1.76,.59,1.61,1.82,.35,seatMat,g);
      const upholstery=new THREE.Mesh(new THREE.PlaneGeometry(1.48,1.92),seatSurfaceMaterial);
      upholstery.position.set(0,1.75,.79);g.add(upholstery);
      box(0,2.62,.61,1.18,.45,.30,panel,g);
      box(0,1.67,.355,1.35,1.30,.11,mat(0x33424f,.2,.78),g);
      for(const sx of [-.31,.31])box(sx,1.60,.275,.47,1.04,.09,seatMat,g);
      box(0,2.35,.29,.95,.13,.07,seatTrim,g,false);
      for(const sx of [-.52,.52])box(sx,1.63,.285,.045,1.15,.035,seatTrim,g,false);
      box(0,1.78,.282,.70,.06,.04,dark,g,false);
      box(0,2.58,.41,.74,.10,.07,seatTrim,g,false);
      for(const sx of [-.88,.88]){
        box(sx,1.05,-.09,.18,.18,1.55,seatTrim,g);
        box(sx,.65,-.58,.18,.65,.22,steel,g);
        box(sx,1.16,-.1,.22,.065,1.4,yellow,g,false);
      }
      box(0,.74,-.82,.55,.045,.04,M.orange,g,false);
      cabinCollider(x,z,2.35,2.10);
    }
    for(const z of [-8.2,-4.4,-.6,3.2,7.0]){seat(-7.0,z,-1);seat(7.0,z,1)}
    // Caixas modulares de carga, alÃ§as, fechaduras e reforÃ§os.
    function crate(x,z,w,h,d,gold){
      const g=new THREE.Group();g.position.set(x,h/2,z);root.add(g);
      box(0,0,0,w,h,d,gold?yellow:crateMat,g);
      const crateFront=new THREE.MeshStandardMaterial({color:gold?0xb4822d:0x43576b,emissive:gold?0x6e4710:0x1b344c,emissiveIntensity:.35,metalness:.55,roughness:.42});
      box(0,0,d/2+.02,w-.40,h-.32,.05,crateFront,g,false);
      for(const sx of [-1,1])box(sx*(w/2-.10),0,0,.23,h+.035,d+.035,dark,g);
      for(const sy of [-1,1])box(0,sy*(h/2-.10),0,w+.035,.19,d+.035,steel,g);
      for(const sx of [-.55,.55])box(sx*(w/2),0,d/2+.065,.055,h-.42,.025,dark,g,false);
      box(0,h*.23,d/2+.068,w-.57,.05,.028,yellow,g,false);
      box(0,.06,d/2+.04,.49,.23,.07,dark,g);
      box(0,.06,d/2+.083,.21,.065,.025,M.cyan,g,false);
      cabinCollider(x,z,w+.2,d+.2);
    }
    crate(-8.15,11.1,3.2,1.4,2.4,true);
    crate(8.10,11.0,3.3,1.25,2.4,false);
    crate(-8.1,14.15,3.15,1.15,2.0,false);
    crate(8.15,14.1,3.15,1.35,2.2,true);
    crate(-5.5,4.8,2.4,1.4,2.1,true);
    crate(5.5,4.8,2.4,1.35,2.1,false);
    // Equipamento de emergÃªncia preso Ã  lateral junto ao cockpit.
    const extinguisher=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,1.35,12),mat(0xb52420,.3,.43));
    extinguisher.position.set(-9.5,3.55,-11.8);root.add(extinguisher);
    makeBox(-9.5,4.31,-11.8,.30,.14,.30,steel);
    stripe(-9.5,3.54,-11.52,.34,.12,.035,M.white);
    // Consoles de cockpit, telas de navegaÃ§Ã£o procedurais e assento.
    makeBox(0,1.7,-14.9,16.5,2.25,3.3,dark);
    makeBox(0,2.78,-14.6,14.9,.22,2.1,steel);
    const displayTexture=textTexture(512,256,(c,w,h)=>{
      c.fillStyle='#031525';c.fillRect(0,0,w,h);
      c.strokeStyle='#009eea';c.lineWidth=4;c.strokeRect(9,9,w-18,h-18);
      for(let i=0;i<20;i++){c.strokeStyle=i%3?'#087dad':'#28d9ff';c.lineWidth=2;c.beginPath();c.moveTo(26+i*21,47);c.lineTo(26+i*21,65+(i*47)%120);c.stroke()}
      c.strokeStyle='#32dcff';c.beginPath();c.arc(w*.72,h*.53,68,0,Math.PI*2);c.stroke();c.beginPath();c.arc(w*.72,h*.53,46,0,Math.PI*2);c.stroke();
      c.fillStyle='#59f1ff';c.font='bold 21px monospace';c.fillText('ASTRA / NAV SYSTEM',30,31);
      c.font='14px monospace';c.fillText('FLIGHT READY',29,225);
    });
    for(const x of [-4.05,4.05]){
      makeBox(x,3.2,-14.08,5.4,1.75,.26,steel);
      const monitor=new THREE.Mesh(new THREE.PlaneGeometry(5.14,1.56),new THREE.MeshBasicMaterial({map:displayTexture,toneMapped:false}));
      monitor.position.set(x,3.2,-13.93);root.add(monitor);
      lamp(x,3.65,-13.2,0x008bff,2.5,6);
    }
    makeBox(0,2.67,-13.76,2.0,.42,1.0,panel);
    stripe(0,2.94,-13.4,1.42,.04,.38,M.cyan);
    // Cadeira do piloto voltada Ã  jÃ¡nela (costas para passageiro).
    makeBox(0,.65,-11.45,1.55,.53,1.48,steel);
    makeBox(0,1.83,-11.01,2.05,2.15,.45,seatMat);
    makeBox(0,2.88,-10.98,1.55,.52,.42,dark);
    makeBox(0,2.35,-10.745,1.05,.13,.05,M.orange);
    makeBox(0,1.95,-10.745,1.38,.37,.05,panel);
    for(const sx of [-1,1])makeBox(sx*1.10,1.14,-11.44,.22,.22,1.28,steel);
    cabinCollider(0,-11.45,2.8,2.2);
    cabinCollider(0,-14.65,15.8,3.4);
    // Piloto personalizado utilizando o criador de avatares jÃ¡ disponÃ­vel.
    passengerPilot=new THREE.Group();passengerPilot.position.set(0,.8,-11.05);passengerPilot.rotation.y=0;root.add(passengerPilot);
    passengerPilotModel=setAvatar(passengerPilot,'pilot');passengerPilot.scale.setScalar(1.45);
    passengerPilotModel.legs.forEach(({part})=>{part.visible=false});
    passengerPilotModel.arms.forEach(({part})=>{part.visible=false});
    const pilotSleeve=mat(0x172641,.3,.57),pilotGlove=mat(0x577489,.3,.55);
    box(0,1.45,.28,.94,.92,.24,pilotSleeve,passengerPilot);
    box(0,1.62,.415,.55,.10,.045,yellow,passengerPilot,false);
    for(const side of [-1,1]){
      sphere(side*1.12,2.56,-11.05,.35,pilotSleeve,root,16);
      beam([side*1.12,2.55,-11.05],[side*1.38,2.34,-11.8],.19,pilotSleeve);
      beam([side*1.38,2.34,-11.8],[side*1.60,2.84,-13.22],.15,pilotSleeve);
      sphere(side*1.60,2.84,-13.22,.15,pilotGlove,root,12);
    }
    // Luzes de preenchimento para contrastes prÃ³ximos da imagem.
    lamp(0,5.5,-12,0x6ac8ff,10,18);
    for(const z of [-10,-3,5,12])for(const side of [-1,1])lamp(side*8.8,5.3,z,side<0?0x3caaff:0xffb269,4.0,7);
  }
  function setPassengerMode(enabled){
    const flag=!!enabled;if(passengerMode===flag)return;
    passengerMode=flag;
    if(flag)buildPassengerCabin();
    for(const object of stationGeometry)object.visible=!flag;
    if(passengerWorld)passengerWorld.visible=flag;
    robot.visible=!flag;
    if(flag){const p=cabinPosition(queuedPosition.x,queuedPosition.z);robot.position.set(p.x,.12,p.z);yaw=0;avatarYaw=0;pitch=0;}
  }
  function passengerCanOccupy(roomX,roomZ){
    const p=cabinPosition(roomX,roomZ),r=.44;
    if(p.x< -cabinDims.halfW+r||p.x>cabinDims.halfW-r||p.z<cabinDims.front+r||p.z>cabinDims.back-r)return false;
    for(const c of cabinColliders){const x=Math.max(c.minX,Math.min(p.x,c.maxX)),z=Math.max(c.minZ,Math.min(p.z,c.maxZ));if((x-p.x)**2+(z-p.z)**2<r*r)return false}
    return true;
  }
  // -----------------------------------------------------------------

      // REFERENCE_SCENE_END
      const remoteRobots=new Map(),raycaster=new THREE.Raycaster(),cameraRaycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),clock=new THREE.Clock();let selfHeadingLoaded=false,avatarYaw=0;
      let renderActive=false,frameHandle=0,lastMoveAt=0,walkPhase=0,remoteMoveAt=new Map(),lastRenderAt=0;
      function mapRoom(roomX,roomZ){return{x:(Number(roomX)-50)*.244,z:(Number(roomZ)-66.5)*.434}}
      function canOccupy(roomX,roomZ,originX=null,originZ=null){if(passengerMode)return passengerCanOccupy(roomX,roomZ);const p=mapRoom(roomX,roomZ),origin=originX===null?null:mapRoom(originX,originZ),radius=.42;if(p.x< -ROOM.halfW+radius||p.x>ROOM.halfW-radius||p.z<ROOM.front+radius||p.z>ROOM.back-radius)return false;if(p.z>17.75&&p.z<34.45&&Math.abs(p.x)>2.22)return false;if(isMoonBase(currentData.station?.code)&&lunarRoomPartitions.some(z=>Math.abs(p.z-z)<.34&&Math.abs(p.x)>2.22))return false;for(const obstacle of obstacles){const cx=Math.max(obstacle.minX,Math.min(p.x,obstacle.maxX)),cz=Math.max(obstacle.minZ,Math.min(p.z,obstacle.maxZ));if((p.x-cx)**2+(p.z-cz)**2<radius*radius)return false}for(const avatar of remoteRobots.values()){const other=avatar.userData.target||avatar.position,dist=Math.hypot(p.x-other.x,p.z-other.z),start=origin?Math.hypot(origin.x-other.x,origin.z-other.z):Infinity;if(dist<.92&&(start>=.92||dist<start-.002))return false}return true}
      function syncPeople(data){const seen=new Set();for(const person of data.occupants||[]){const id=Number(person.id);if(id===Number(data.selfId)){const code=person.avatar||'captain';if(avatarIndex(code)!==avatarIndex(currentAvatarCode))setAvatar(robot,code,true);if(!selfHeadingLoaded){yaw=Number(person.roomYaw)||0;avatarYaw=yaw;robot.rotation.y=-avatarYaw;selfHeadingLoaded=true}continue}const p=passengerMode?cabinPosition(Number(person.roomX)||50,Number(person.roomZ)||75):mapRoom(Number(person.roomX)||50,Number(person.roomZ)||75);seen.add(id);let avatar=remoteRobots.get(id);if(!avatar){avatar=new THREE.Group();scene.add(avatar);remoteRobots.set(id,avatar)}setAvatar(avatar,person.avatar||'captain');avatar.userData.crewPerson=person;const target=avatar.userData.target||new THREE.Vector3();target.set(p.x,.12,p.z);avatar.userData.target=target;avatar.userData.roomYaw=Number(person.roomYaw)||0;remoteMoveAt.set(id,performance.now())}for(const [id,avatar] of remoteRobots){if(!seen.has(id)){scene.remove(avatar);avatar.traverse(o=>{if(o.geometry)o.geometry.dispose()});remoteRobots.delete(id);remoteMoveAt.delete(id)}}}
      function update(data){currentData=data||{};setPassengerMode(!!data.isPassengerCabin);const wallStyle=baseWallPalettes[data.station?.code];M.shell.color.setHex(wallStyle?.shell??0x172432);M.panel.color.setHex(wallStyle?.panel??0x223647);M.edge.color.setHex(wallStyle?.edge??0x354b5d);lunarBaseInterior.visible=!data.isPassengerCabin&&isMoonBase(data.station?.code);if(passengerMode&&passengerPilot){const pilotCode=data.passenger?.pilotAvatar||'pilot';passengerPilotModel=setAvatar(passengerPilot,pilotCode);passengerPilotModel.legs.forEach(({part})=>{part.visible=false});passengerPilotModel.arms.forEach(({part})=>{part.visible=false});passengerPilot.userData.pilotName=data.passenger?.pilot||'Piloto'}const cabinOccupants=data.passenger?.occupants||data.occupants||[];const cockpitIds=new Set([Number(data.passenger?.pilotId)||0,Number(data.passenger?.copilotId)||0]);const roster=passengerMode?cabinOccupants.filter(person=>!cockpitIds.has(Number(person.id))):cabinOccupants;const renderData={...data,occupants:roster,ships:data.ships||[]};board.visible=!data.isPassengerCabin;refreshDockBoard(renderData.ships,renderData.station?.name,renderData.occupants,renderData.station?.code);syncPeople(renderData);refreshLunarTitle(data.station?.name,data.station?.code)}
      function setPlayerPosition(roomX,roomZ,heading=null){const p=passengerMode?cabinPosition(roomX,roomZ):mapRoom(roomX,roomZ),dx=p.x-robot.position.x,dz=p.z-robot.position.z;if(Math.hypot(dx,dz)>.002)lastMoveAt=performance.now();robot.position.set(p.x,.12,p.z);if(heading!==null&&heading!==undefined&&Number.isFinite(Number(heading)))avatarYaw=Number(heading);robot.rotation.y=-avatarYaw}
      function rotateCamera(dt){const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));if(passengerMode){const desiredCamera=robot.position.clone().add(new THREE.Vector3(0,1.72,0));const aim=desiredCamera.clone().addScaledVector(forward,4);aim.y+=pitch*3;camera.position.lerp(desiredCamera,1-Math.exp(-12*dt));camera.lookAt(aim);return}const aim=robot.position.clone().add(new THREE.Vector3(0,1.28+pitch*.35,0)).addScaledVector(forward,.35),cameraOrigin=robot.position.clone().add(new THREE.Vector3(0,1.35,0)),distance=5.55*Math.cos(pitch*.8),desiredCamera=robot.position.clone().addScaledVector(forward,-distance);desiredCamera.y=2.91+pitch*3.2;desiredCamera.x=THREE.MathUtils.clamp(desiredCamera.x,-10.32,10.32);desiredCamera.z=THREE.MathUtils.clamp(desiredCamera.z,ROOM.front+1.26,ROOM.back-1.26);if(desiredCamera.z>17.85&&desiredCamera.z<34.35)desiredCamera.x=THREE.MathUtils.clamp(desiredCamera.x,-2.65,2.65);desiredCamera.y=THREE.MathUtils.clamp(desiredCamera.y,1.9,5.7);const cameraDirection=desiredCamera.clone().sub(cameraOrigin),desiredDistance=cameraDirection.length();cameraDirection.normalize();cameraRaycaster.set(cameraOrigin,cameraDirection);cameraRaycaster.far=desiredDistance;const obstruction=cameraRaycaster.intersectObjects(stationGeometry,true).find(hit=>hit.distance>.4);if(obstruction)desiredCamera.copy(cameraOrigin).addScaledVector(cameraDirection,Math.max(.12,obstruction.distance-.42));camera.position.lerp(desiredCamera,1-Math.exp(-9*dt));camera.lookAt(aim)}
      function resize(){const r=container.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.15));camera.aspect=w/h;camera.fov=passengerMode?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(70)/2)*1.36/camera.aspect)):69;camera.updateProjectionMatrix()}
      function frame(){if(!renderActive)return;frameHandle=requestAnimationFrame(frame);const renderNow=performance.now();if(renderNow-lastRenderAt<33)return;const dt=Math.min(clock.getDelta()||.016,.05),now=clock.elapsedTime,moving=renderNow-lastMoveAt<320;lastRenderAt=renderNow;walkPhase+=dt*11.5;const energy=moving?1:0;if(robotVisual)robotVisual.position.y=moving?Math.abs(Math.sin(walkPhase))*.035:Math.sin(now*1.9)*.012;arms.forEach(({part,s})=>{part.rotation.x=moving?Math.sin(walkPhase+s*Math.PI/2+Math.PI/2)*.58:Math.sin(now*1.5+s)*.03});legs.forEach(({part,s})=>{part.rotation.x=moving?Math.sin(walkPhase+(s>0?Math.PI:0))*.62:0});if(passengerMode&&passengerPilotModel){passengerPilotModel.arms.forEach(({part,s})=>{part.rotation.x=-.72+Math.sin(now*2.1+s)*.10;part.rotation.z=s*.16+Math.sin(now*1.45+s)*.045});passengerPilotModel.visual.position.y=Math.sin(now*1.8)*.008}robotShadow.material.opacity=.21+(1-energy)*.06;for(const [id,avatar] of remoteRobots){if(avatar.userData.target)avatar.position.lerp(avatar.userData.target,1-Math.exp(-12*dt));avatar.rotation.y=-(avatar.userData.roomYaw||0)}rotateCamera(dt);renderer.render(scene,camera)}
      function setActive(value){if(renderActive===!!value)return;renderActive=!!value;if(renderActive){resize();camera.position.set(robot.position.x,passengerMode?1.72:3.38,robot.position.z+(passengerMode?0:6.1));clock.start();frameHandle=requestAnimationFrame(frame)}else if(frameHandle)cancelAnimationFrame(frameHandle)}
      function selectPerson(event){const rect=canvas.getBoundingClientRect();pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...remoteRobots.values()],true)[0];if(!hit)return;let object=hit.object;while(object&&!object.userData.crewPerson)object=object.parent;if(object?.userData.crewPerson)onSelect(object.userData.crewPerson)}
      let lookPointer=null,dragged=false;canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;lookPointer={id:event.pointerId,x:event.clientX,y:event.clientY};dragged=false;canvas.setPointerCapture?.(event.pointerId)});canvas.addEventListener('pointermove',event=>{if(!lookPointer||lookPointer.id!==event.pointerId)return;const dx=event.clientX-lookPointer.x,dy=event.clientY-lookPointer.y;if(Math.abs(dx)+Math.abs(dy)>2)dragged=true;yaw=(yaw+dx*.006+Math.PI*3)%(Math.PI*2)-Math.PI;pitch=Math.max(-.55,Math.min(.65,pitch-dy*.004));lookPointer.x=event.clientX;lookPointer.y=event.clientY});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{lookPointer=null;setTimeout(()=>{dragged=false},0)});canvas.addEventListener('click',event=>{if(!dragged)selectPerson(event)});
      const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
      return{update,setPlayerAvatar(code){if(code)setAvatar(robot,code,true)},setPlayerPosition,canOccupy,canMove(fromX,fromZ,toX,toZ){const a=mapRoom(fromX,fromZ),b=mapRoom(toX,toZ),steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let i=1;i<=steps;i++){const t=i/steps;if(!canOccupy(fromX+(toX-fromX)*t,fromZ+(toZ-fromZ)*t,fromX,fromZ))return false}return true},getHeading:()=>yaw,getAvatarHeading:()=>avatarYaw,rotate(yawDelta=0,pitchDelta=0){yaw=(yaw+yawDelta+Math.PI*3)%(Math.PI*2)-Math.PI;pitch=THREE.MathUtils.clamp(pitch+pitchDelta,-.55,.65)},setActive,onSelect(callback){onSelect=callback}};
    }
    const ready=initialize().then(value=>{runtime=value;runtime.setPlayerPosition(queuedPosition.x,queuedPosition.z);runtime.update(currentData);runtime.setActive(active)}).catch(error=>{console.error('Falha ao carregar a sala 3D:',error);const fallback=document.createElement('div');fallback.className='crew-3d-fallback';fallback.textContent='Nao foi possivel carregar o ambiente 3D. Verifique a conexao com o CDN.';container.prepend(fallback)});
    return{update(data){currentData=data||{};if(runtime)runtime.update(currentData)},setPlayerAvatar(code){if(runtime)runtime.setPlayerAvatar(code)},setPlayerPosition(x,z,heading=null){queuedPosition.x=Number(x)||50;queuedPosition.z=Number(z)||66.5;if(heading!==null&&heading!==undefined&&Number.isFinite(Number(heading)))avatarYaw=Number(heading);if(runtime)runtime.setPlayerPosition(queuedPosition.x,queuedPosition.z,heading)},getWorldPosition:worldPosition,canOccupy(x,z){return runtime?runtime.canOccupy(x,z):Number(x)>=8&&Number(x)<=92&&Number(z)>=27.1&&Number(z)<=220},canMove(fromX,fromZ,toX,toZ){return runtime?runtime.canMove(fromX,fromZ,toX,toZ):this.canOccupy(toX,toZ)},getHeading(){return runtime?.getHeading()??yaw},getAvatarHeading(){return runtime?.getAvatarHeading()??avatarYaw},rotate(yawDelta=0,pitchDelta=0){if(runtime){runtime.rotate(yawDelta,pitchDelta);yaw=runtime.getHeading();return}yaw=(yaw+yawDelta+Math.PI*3)%(Math.PI*2)-Math.PI;pitch=Math.max(-.55,Math.min(.65,pitch+pitchDelta))},setActive(value){active=!!value;runtime?.setActive(active)},onSelect(callback){onSelect=callback;runtime?.onSelect(callback)}};
  };
})();




