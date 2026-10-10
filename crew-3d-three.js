(function(){
  window.createStationScene3D=function(container){
    const canvas=document.createElement('canvas');canvas.className='crew-3d-canvas';canvas.setAttribute('aria-label','Interior 3D da estaÃƒÂ§ÃƒÂ£o espacial');container.prepend(canvas);
    let currentData={},runtime=null,active=false,yaw=0,pitch=.14,onSelect=()=>{};
    const queuedPosition={x:50,z:66.5};
    function worldPosition(roomX,roomZ){return{x:(Number(roomX)-50)*.244,z:(Number(roomZ)-66.5)*.434}}
    async function initialize(){
      let THREE,lastError;
      for(const url of ['https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js','https://unpkg.com/three@0.161.0/build/three.module.js']){try{THREE=await import(url);break}catch(error){lastError=error}}
      if(!THREE)throw lastError||new Error('Three.js indisponÃƒÂ­vel');
      const rect=container.getBoundingClientRect(),width=Math.max(1,rect.width),height=Math.max(1,rect.height);
      const $=id=>document.getElementById(id);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030b16);
  const camera = new THREE.PerspectiveCamera(69,width/height,0.07,350);
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setSize(width,height,false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // -----------------------------------------------------------------
  // CONFIGURAÃƒâ€¡Ãƒâ€¢ES, MATERIAIS E FERRAMENTAS DE MODELAGEM
  // -----------------------------------------------------------------
  const ROOM={halfW:11.15,front:-18.10,back:64.35,height:7.8};
  const palette={cyan:0x45dfff,blue:0x287fed,orange:0xffa258,white:0xd8f5ff,green:0x69ffd8};
  const mat=(color,metal=.42,rough=.47)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
  const glow=(color,power=1.8)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:power,metalness:.12,roughness:.25});
  const M={shell:mat(0x172432,.65,.39),panel:mat(0x223647,.61,.32),black:mat(0x0b1522,.4,.44),edge:mat(0x354b5d,.75,.29),trim:mat(0x778da2,.75,.3),tile:mat(0xa4c3d4,.58,.26),seat:mat(0x28475a,.31,.52),darkGlass:new THREE.MeshPhysicalMaterial({color:0x051c36,metalness:.14,roughness:.08,transparent:true,opacity:.7,depthWrite:false}),cyan:glow(palette.cyan,2.35),blue:glow(palette.blue,2.05),orange:glow(palette.orange,2.2),white:glow(palette.white,1.6),green:glow(palette.green,1.6)};
  function box(x,y,z,w,h,d,material,parent=scene,shadow=true){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);a.position.set(x,y,z);a.castShadow=shadow;a.receiveShadow=shadow;parent.add(a);return a}
  function sphere(x,y,z,r,material,parent=scene,segments=16){let a=new THREE.Mesh(new THREE.SphereGeometry(r,segments,Math.max(8,segments/2)),material);a.position.set(x,y,z);parent.add(a);return a}
  function tube(a,b,r,material,parent=scene,seg=7){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(B),seg),material);mesh.position.copy(A).add(B).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());parent.add(mesh);return mesh}
  function light(x,y,z,color,intensity,range){const p=new THREE.PointLight(color,intensity,range,2);p.position.set(x,y,z);scene.add(p);return p}
  function textTexture(w,h,draw){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');draw(c,w,h);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
  function rand(seed){let v=seed>>>0;return()=>{v=(v*1664525+1013904223)>>>0;return v/4294967296}}
  const rnd=rand(271828);
  function strokePanel(c,x,y,w,h,color='rgba(67,225,255,.4)',fill='rgba(0,23,41,.9)'){c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle=color;c.lineWidth=3;c.strokeRect(x+.5,y+.5,w-1,h-1)}

  // Ambiente de reflexÃƒÂµes gerado por cÃƒÂ³digo: melhora o metal sem HDR externo.
  const env=textTexture(1024,512,(c,w,h)=>{
    let grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#09111d');grad.addColorStop(.35,'#617b9b');grad.addColorStop(.50,'#142b43');grad.addColorStop(.78,'#426179');grad.addColorStop(1,'#080e19');c.fillStyle=grad;c.fillRect(0,0,w,h);
    for(let i=0;i<22;i++){const x=rnd()*w;const y=110+rnd()*195;c.fillStyle=i%4?'rgba(124,212,255,.6)':'rgba(255,187,109,.85)';c.fillRect(x,y,1+rnd()*8,4+rnd()*47)}
  });env.mapping=THREE.EquirectangularReflectionMapping;scene.environment=env;
  scene.add(new THREE.HemisphereLight(0x8ed6ff,0x0a1320,2.0));
  const keyLight=new THREE.DirectionalLight(0xcbefff,2.15);keyLight.position.set(-3,7,6);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-17;keyLight.shadow.camera.right=17;keyLight.shadow.camera.top=23;keyLight.shadow.camera.bottom=-23;keyLight.shadow.normalBias=.035;keyLight.shadow.bias=-.00015;scene.add(keyLight);
  light(-6.5,6,-10,0x3aa6ff,32,17);light(6.4,6,-4,0x68c7ff,23,16);light(-5,6,12,0xff974c,16,12);light(7,6,10,0x33d7ff,18,13);

  // -----------------------------------------------------------------
  // PISO METÃƒÂLICO, JUNTAS, REFLEXOS E CAMINHOS ILUMINADOS
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
  // JANELA PANORÃƒâ€šMICA: VÃƒÆ’O REAL, VIDRO, MOLDURA, PROTEÃƒâ€¡ÃƒÆ’O
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
  // FUNDO ESPACIAL TOTALMENTE PROCEDURAL (nÃƒÂ£o usa imagem externa)
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
  function drawDockBoard(c,w,h,ships){
    c.fillStyle='#03111f';c.fillRect(0,0,w,h);strokePanel(c,16,15,w-32,h-30,'rgba(40,186,240,.8)','rgba(4,20,38,.96)');
    const grd=c.createLinearGradient(0,0,w,0);grd.addColorStop(0,'#0c4370');grd.addColorStop(1,'#061e33');c.fillStyle=grd;c.fillRect(35,34,w-70,122);
    c.font='bold 57px monospace';c.fillStyle='#70f0ff';c.textAlign='center';c.shadowColor='#18baff';c.shadowBlur=15;c.fillText('NAVES ATRACADAS',w/2,111);c.shadowBlur=0;
    c.font='25px monospace';c.fillStyle='#639eb6';c.fillText('TRÃƒÂFEGO LOCAL / ESTAÃƒâ€¡ÃƒÆ’O',w/2,201);
    c.fillStyle='#0f3855';c.fillRect(35,230,w-70,49);c.font='bold 27px monospace';c.textAlign='left';c.fillStyle='#94f7ff';c.fillText('NAVE / REGISTRO',52,264);c.fillText('PILOTO',500,264);c.fillText('ESTADO',803,264);
    const rows=(ships||[]).slice(0,8);
    if(!rows.length){c.fillStyle='#0b1e30';c.fillRect(36,292,950,590);c.font='bold 33px monospace';c.textAlign='center';c.fillStyle='#8dc6d5';c.fillText('NENHUMA NAVE ATRACADA',w/2,590)}
    rows.forEach((ship,i)=>{const y=305+i*74;c.fillStyle=i%2?'rgba(12,35,54,.76)':'rgba(5,25,43,.6)';c.fillRect(36,y,950,66);c.font='25px monospace';c.textAlign='left';c.fillStyle='#c2eaff';c.fillText(String(ship.name||'NAVE SEM REGISTRO').toUpperCase().slice(0,22),55,y+42);c.fillStyle='#80b6c9';c.fillText(String(ship.owner||'PILOTO').toUpperCase().slice(0,15),500,y+42);c.fillStyle=ship.active?'#83ffbb':'#8de2f0';c.fillText(ship.active?'ATIVA':'ACOPLADA',804,y+42)});
    c.strokeStyle='rgba(66,211,246,.5)';c.beginPath();c.moveTo(35,926);c.lineTo(989,926);c.stroke();
    c.fillStyle='#0b4565';c.fillRect(35,952,954,94);c.font='bold 39px monospace';c.textAlign='center';c.fillStyle='#8ef9ff';c.fillText('NAVES NO HANGAR: '+String((ships||[]).length).padStart(2,'0'),w/2,1012);
    c.font='24px monospace';c.fillStyle='#5fa8c4';c.fillText('SISTEMA DE DOCA / '+String((ships||[]).filter(ship=>ship.active).length).padStart(2,'0')+' ATIVAS',w/2,1112);
    for(let i=0;i<16;i++){c.fillStyle=i<(ships||[]).length?'#62edbb':'#227a99';c.fillRect(75+i*55,1144,39,23)}
    c.textAlign='left';c.font='18px monospace';c.fillStyle='#5f93ac';c.fillText('SISTEMA DE TRÃƒÂFEGO AEROESPACIAL Ã‚Â· V 07.2',43,1214);
  }
  const boardTex=textTexture(1024,1250,(c,w,h)=>drawDockBoard(c,w,h,[]));
  function refreshDockBoard(ships){drawDockBoard(boardTex.image.getContext('2d'),1024,1250,ships);boardTex.needsUpdate=true}
  const board=new THREE.Group();board.position.set(-10.69,4.49,-8.85);board.rotation.y=Math.PI/2;scene.add(board);
  box(0,0,-.03,5.70,5.73,.18,M.black,board);
  box(0,0,.062,5.52,5.57,.12,M.edge,board);
  const boardFace=new THREE.Mesh(new THREE.PlaneGeometry(5.35,5.39),new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false}));boardFace.position.z=.128;board.add(boardFace);
  for(const xx of [-2.8,2.8])box(xx,0,.13,.06,5.7,.075,M.cyan,board,false);
  for(const yy of [-2.83,2.83])box(0,yy,.13,5.65,.06,.075,M.cyan,board,false);
  light(-8.9,5.6,-9.2,0x138fff,6.6,7);

  // -----------------------------------------------------------------
  // MOBILIÃƒÂRIO, BANCOS, QUIOSQUES E PLANTAS
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
    for(let i=0;i<6;i++){c.fillStyle=i%2?'#5aa7c9':'#c0f9ff';c.fillText(['CHECK-IN','SUA POSIÃƒâ€¡ÃƒÆ’O','MAPA DE DOCA','NAVEGADORES','SISTEMAS','SEGURANÃƒâ€¡A'][i],47,160+i*60);c.fillStyle='#26baeb';c.fillRect(37,177+i*60,424,2)}
    c.fillStyle='#5affe2';c.fillRect(40,578,432,25);c.fillStyle='#0b2532';c.textAlign='center';c.font='bold 18px monospace';c.fillText('SERVIÃƒâ€¡O OPERACIONAL',w/2,598);
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
  // Colunas de serviÃƒÂ§o, placas ambientais e faixa informativa de rodapÃƒÂ©.
  for(const x of [-10.5,10.5])for(const z of [-15.9,16.6]){
    box(x,3.68,z,.53,6.2,.48,M.edge);
    box(x+(x<0?.35:-.35),4.35,z,.042,4.2,.10,M.blue,scene,false);
  }
  const wallNotice=textTexture(768,190,(c,w,h)=>{
    c.fillStyle='#071b2e';c.fillRect(0,0,w,h);c.strokeStyle='#43c6f2';c.lineWidth=5;c.strokeRect(3,3,w-6,h-6);
    c.fillStyle='#7febff';c.textAlign='center';c.font='bold 45px monospace';c.fillText('SETOR PANORÃƒâ€šMICO',w/2,74);
    c.fillStyle='#e4b478';c.font='25px monospace';c.fillText('OBSERVATÃƒâ€œRIO 07  /  ABERTO',w/2,131);
  });
  const notice=new THREE.Mesh(new THREE.PlaneGeometry(3.75,.95),new THREE.MeshBasicMaterial({map:wallNotice,toneMapped:false}));notice.position.set(5.7,5.28,17.65);notice.rotation.y=Math.PI;scene.add(notice);
  // ColisÃƒÂµes: vidro e paredes delimitam completamente a circulaÃƒÂ§ÃƒÂ£o.
  // O espaÃƒÂ§o central permanece livre para explorar a sala inteira.

  // -----------------------------------------------------------------
  // PERSONAGEM: ROBÃƒâ€ LOW-POLY ANIMADO / TERCEIRA PESSOA
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

  // -----------------------------------------------------------------

      // REFERENCE_SCENE_END
      const remoteRobots=new Map(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),clock=new THREE.Clock();let selfHeadingLoaded=false;
      let renderActive=false,frameHandle=0,lastMoveAt=0,walkPhase=0,remoteMoveAt=new Map();
      function mapRoom(roomX,roomZ){return{x:(Number(roomX)-50)*.244,z:(Number(roomZ)-66.5)*.434}}
      function canOccupy(roomX,roomZ){const p=mapRoom(roomX,roomZ),radius=.42;if(p.x< -ROOM.halfW+radius||p.x>ROOM.halfW-radius||p.z<ROOM.front+radius||p.z>ROOM.back-radius)return false;if(p.z>17.75&&p.z<34.45&&Math.abs(p.x)>2.22)return false;for(const obstacle of obstacles){const cx=Math.max(obstacle.minX,Math.min(p.x,obstacle.maxX)),cz=Math.max(obstacle.minZ,Math.min(p.z,obstacle.maxZ));if((p.x-cx)**2+(p.z-cz)**2<radius*radius)return false}return true}
      function syncPeople(data){const seen=new Set();for(const person of data.occupants||[]){const id=Number(person.id);if(id===Number(data.selfId)){const code=person.avatar||'captain';if(avatarIndex(code)!==avatarIndex(currentAvatarCode))setAvatar(robot,code,true);if(!selfHeadingLoaded){yaw=Number(person.roomYaw)||0;robot.rotation.y=yaw;selfHeadingLoaded=true}continue}const p=mapRoom(Number(person.roomX)||50,Number(person.roomZ)||75);seen.add(id);let avatar=remoteRobots.get(id);if(!avatar){avatar=new THREE.Group();scene.add(avatar);remoteRobots.set(id,avatar)}setAvatar(avatar,person.avatar||'captain');avatar.userData.crewPerson=person;const target=avatar.userData.target||new THREE.Vector3();target.set(p.x,0,p.z);avatar.userData.target=target;avatar.userData.roomYaw=Number(person.roomYaw)||0;remoteMoveAt.set(id,performance.now())}for(const [id,avatar] of remoteRobots){if(!seen.has(id)){scene.remove(avatar);avatar.traverse(o=>{if(o.geometry)o.geometry.dispose()});remoteRobots.delete(id);remoteMoveAt.delete(id)}}}
      function update(data){const renderData={...data,occupants:data.passenger?.occupants||data.occupants||[],ships:data.ships||[]};board.visible=!data.isPassengerCabin;refreshDockBoard(renderData.ships);syncPeople(renderData)}
      function setPlayerPosition(roomX,roomZ){const p=mapRoom(roomX,roomZ),dx=p.x-robot.position.x,dz=p.z-robot.position.z,distance=Math.hypot(dx,dz);if(distance>.002){lastMoveAt=performance.now();yaw=Math.atan2(-dx,-dz)}robot.position.set(p.x,0,p.z);if(robotVisual)robotVisual.rotation.y=yaw}
      function rotateCamera(dt){const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)),aim=robot.position.clone().add(new THREE.Vector3(0,1.24+pitch*.4,0)).addScaledVector(forward,2.2),distance=5.55*Math.cos(pitch*.8),desiredCamera=robot.position.clone().addScaledVector(forward,-distance);desiredCamera.y=2.91+pitch*3.2;desiredCamera.x=THREE.MathUtils.clamp(desiredCamera.x,-10.32,10.32);desiredCamera.z=THREE.MathUtils.clamp(desiredCamera.z,ROOM.front+1.26,ROOM.back-1.26);if(desiredCamera.z>17.85&&desiredCamera.z<34.35)desiredCamera.x=THREE.MathUtils.clamp(desiredCamera.x,-2.65,2.65);desiredCamera.y=THREE.MathUtils.clamp(desiredCamera.y,1.9,5.7);camera.position.lerp(desiredCamera,1-Math.exp(-9*dt));camera.lookAt(aim);robot.rotation.y=yaw}
      function resize(){const r=container.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));camera.aspect=w/h;camera.updateProjectionMatrix()}
      function frame(){if(!renderActive)return;frameHandle=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta()||.016,.05),now=clock.elapsedTime,moving=performance.now()-lastMoveAt<105;walkPhase+=dt*9.4;const energy=moving?1:0;if(robotVisual)robotVisual.position.y=moving?Math.abs(Math.sin(walkPhase))*.063:Math.sin(now*1.9)*.012;arms.forEach(({part,s})=>{part.rotation.x=moving?Math.sin(walkPhase+s*Math.PI/2+Math.PI/2)*.45:Math.sin(now*1.5+s)*.03});legs.forEach(({part,s})=>{part.rotation.x=moving?Math.sin(walkPhase+(s>0?Math.PI:0))*.42:0});robotShadow.material.opacity=.21+(1-energy)*.06;for(const [id,avatar] of remoteRobots){if(avatar.userData.target)avatar.position.lerp(avatar.userData.target,1-Math.exp(-12*dt));avatar.rotation.y=avatar.userData.roomYaw||0}rotateCamera(dt);renderer.render(scene,camera)}
      function setActive(value){if(renderActive===!!value)return;renderActive=!!value;if(renderActive){resize();camera.position.set(0,3.38,robot.position.z+6.1);clock.start();frameHandle=requestAnimationFrame(frame)}else if(frameHandle)cancelAnimationFrame(frameHandle)}
      function selectPerson(event){const rect=canvas.getBoundingClientRect();pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...remoteRobots.values()],true)[0];if(!hit)return;let object=hit.object;while(object&&!object.userData.crewPerson)object=object.parent;if(object?.userData.crewPerson)onSelect(object.userData.crewPerson)}
      canvas.addEventListener('click',selectPerson);
      const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
      return{update,setPlayerPosition,canOccupy,canMove(fromX,fromZ,toX,toZ){return canOccupy(toX,toZ)},rotate(){robot.rotation.y=yaw},setActive,onSelect(callback){onSelect=callback}};
    }
    const ready=initialize().then(value=>{runtime=value;runtime.setPlayerPosition(queuedPosition.x,queuedPosition.z);runtime.update(currentData);runtime.setActive(active)}).catch(error=>{console.error('Falha ao carregar a sala 3D:',error);const fallback=document.createElement('div');fallback.className='crew-3d-fallback';fallback.textContent='Nao foi possivel carregar o ambiente 3D. Verifique a conexao com o CDN.';container.prepend(fallback)});
    return{update(data){currentData=data||{};if(runtime)runtime.update(currentData)},setPlayerPosition(x,z){queuedPosition.x=Number(x)||50;queuedPosition.z=Number(z)||66.5;if(runtime)runtime.setPlayerPosition(queuedPosition.x,queuedPosition.z)},getWorldPosition:worldPosition,canOccupy(x,z){return runtime?runtime.canOccupy(x,z):Number(x)>=8&&Number(x)<=92&&Number(z)>=27.1&&Number(z)<=220},canMove(fromX,fromZ,toX,toZ){return runtime?runtime.canMove(fromX,fromZ,toX,toZ):this.canOccupy(toX,toZ)},getHeading(){return yaw},rotate(yawDelta=0,pitchDelta=0){yaw=(yaw+yawDelta+Math.PI*3)%(Math.PI*2)-Math.PI;pitch=Math.max(-.55,Math.min(.65,pitch+pitchDelta));runtime?.rotate(yawDelta,pitchDelta)},setActive(value){active=!!value;runtime?.setActive(active)},onSelect(callback){onSelect=callback;runtime?.onSelect(callback)}};
  };
})();



