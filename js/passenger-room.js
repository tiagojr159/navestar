/* Sala compacta de passageiros com cockpit frontal - implementacao independente, outubro/2026. */
(function(){
'use strict';
window.createPassengerRoom3D=function(host){
  const canvas=document.createElement('canvas');canvas.className='passenger-room-canvas';host.prepend(canvas);
  let active=false,model=null,data={},heading=0,pitch=.13,pos={x:50,z:75},onSelect=()=>{};
  const bound=(n,a,b)=>Math.max(a,Math.min(b,n));
  const roomToWorld=(x,z)=>({x:(bound(Number(x)||50,8,92)-50)*.089,z:(bound(Number(z)||75,27.1,220)-123.55)*.055});
  const cargoRects=[],otherPlayers=[];
  const fixedRects=[{x:0,z:-4.15,hx:.62,hz:.62},{x:-1.65,z:-4,hx:.86,hz:.88},{x:1.65,z:-4,hx:.86,hz:.88},...[-2.88,2.88].flatMap(x=>[-1.9,2.05].map(z=>({x,z,hx:.62,hz:.9})) )];
  const allowed=(x,z,origin=null)=>{const p=roomToWorld(x,z),r=.48;if(p.x<-3.35||p.x>3.35||p.z<-4.75||p.z>5.05||Math.abs(p.x)>1.25&&p.z>-4.1&&p.z<.9||Math.abs(p.x)<1.02&&p.z<-3.25&&p.z>-4.75)return false;if(fixedRects.concat(cargoRects).some(o=>Math.abs(p.x-o.x)<o.hx+r&&Math.abs(p.z-o.z)<o.hz+r))return false;return !otherPlayers.some(o=>{const d=Math.hypot(p.x-o.x,p.z-o.z),start=origin?Math.hypot(origin.x-o.x,origin.z-o.z):Infinity;return d<.92&&(start>=.92||d<=start+.004);});};
  const canMove=(x0,z0,x1,z1)=>{const a=roomToWorld(x0,z0),b=roomToWorld(x1,z1),steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let i=1;i<=steps;i++){const t=i/steps;if(!allowed(50+(a.x+(b.x-a.x)*t)/.089,123.55+(a.z+(b.z-a.z)*t)/.055,a))return false;}return true;};
  async function init(){
    let T,lastError;
    const base=new URL('.',document.currentScript?.src||window.location.href);
    for(const url of [new URL('three.module.js',base).href,'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js','https://unpkg.com/three@0.161.0/build/three.module.js']){
      try{T=await import(url);break;}catch(e){lastError=e;console.warn('Three.js',url,e)}
    }
    if(!T)throw new Error('Three.js: '+(lastError?.message||'nao carregou'));
    const scene=new T.Scene();scene.background=new T.Color(0x030b13);
    const camera=new T.PerspectiveCamera(66,1,.05,120);
    const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    const m=(c,met=.5,r=.47)=>new T.MeshStandardMaterial({color:c,metalness:met,roughness:r});
    const e=(c,p=2)=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:p,roughness:.34});
    const M={wall:m(0x253744,.65,.48),dark:m(0x101d2a,.5,.55),metal:m(0x496070,.8,.34),floor:m(0x263e50,.72,.33),seat:m(0x263444,.15,.8),cyan:e(0x51d5ef,2),amber:e(0xffbc70,1.8),red:e(0xe14f47,1.5),yellow:m(0xb17d32,.38,.56),crate:m(0x455564,.64,.46),glass:new T.MeshPhysicalMaterial({color:0x85dbff,roughness:.02,metalness:.06,transparent:true,opacity:.08,transmission:.25,clearcoat:1,clearcoatRoughness:.04,side:T.DoubleSide})};
    const room=new T.Group();scene.add(room);
    function block(x,y,z,w,h,d,mat,parent=room){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function line(a,b,r,mat,parent=room){const v=new T.Vector3(...a),w=new T.Vector3(...b);const mesh=new T.Mesh(new T.CylinderGeometry(r,r,v.distanceTo(w),8),mat);mesh.position.copy(v).add(w).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
    function plane(x,y,z,w,h,mat,parent=room){const mesh=new T.Mesh(new T.PlaneGeometry(w,h),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
    scene.add(new T.HemisphereLight(0xafd9ff,0x09101b,2.1));
    const light=new T.DirectionalLight(0xf2f6ff,2);light.position.set(-3,7,3);light.castShadow=true;light.shadow.mapSize.set(1024,1024);room.add(light);
    for(const z of [-3.2,0,3.2]){const l=new T.PointLight(0x56bbff,5,9);l.position.set(0,3.7,z);room.add(l);}

    // Fundo espacial visto pelo para-brisa
    const skyCanvas=document.createElement('canvas');skyCanvas.width=1024;skyCanvas.height=512;const sctx=skyCanvas.getContext('2d');
    const grad=sctx.createLinearGradient(0,0,1024,512);grad.addColorStop(0,'#010612');grad.addColorStop(.45,'#041126');grad.addColorStop(1,'#02050d');sctx.fillStyle=grad;sctx.fillRect(0,0,1024,512);
    for(let i=0;i<650;i++){const x=Math.random()*1024,y=Math.random()*512,r=Math.random()<.06?1.4+Math.random()*1.3:.35+Math.random()*.8;sctx.beginPath();sctx.fillStyle=Math.random()<.08?`rgba(255,209,154,${.4+Math.random()*.6})`:`rgba(214,237,255,${.35+Math.random()*.65})`;sctx.arc(x,y,r,0,Math.PI*2);sctx.fill();}
    const neb=sctx.createRadialGradient(790,170,30,790,170,190);neb.addColorStop(0,'rgba(84,130,255,.20)');neb.addColorStop(1,'rgba(84,130,255,0)');sctx.fillStyle=neb;sctx.fillRect(560,20,360,300);
    const starsTex=new T.CanvasTexture(skyCanvas);starsTex.colorSpace=T.SRGBColorSpace;
    const outerSpace=new T.Group();scene.add(outerSpace);
    plane(0,2.5,-9.6,10.4,5.8,new T.MeshBasicMaterial({map:starsTex,toneMapped:false}),outerSpace);
    for(let i=0;i<12;i++){const rock=new T.Mesh(new T.IcosahedronGeometry(.12+Math.random()*.16,0),m(0x566475,.18,.9));rock.position.set(1+Math.random()*3.8,1+Math.random()*2.2,-8.2-Math.random()*1.4);rock.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);outerSpace.add(rock);}

    // Piso compacto
    block(0,-.20,0,8.6,.4,12.6,M.dark);
    for(let i=0;i<5;i++)for(let j=0;j<7;j++){
      const x=(i-2)*1.57,z=(j-3)*1.74;
      block(x,.016,z,1.48,.05,1.64,(i+j)%4===0?M.metal:M.floor);
      for(const s of [-1,1])block(x+s*.62,.048,z,0.035,.01,1.5,M.dark);
    }
    for(const x of [-1.36,1.36])block(x,.065,.7,.07,.025,9.9,M.amber);

    // Laterais e teto
    for(const side of [-1,1]){
      const x=side*4.16;
      block(x,2.2,0,.32,4.6,12.6,M.wall);
      block(side*3.91,2.2,0,.09,3.4,11.9,M.dark);
      for(const z of [-4.6,-2.3,0,2.3,4.6]){
        block(side*3.85,2.24,z,.18,4.2,.22,M.metal);
        block(side*3.72,3.18,z,.05,1.35,.065,M.cyan);
        block(side*3.77,.64,z,.05,.08,1.5,M.amber);
      }
      block(side*3.85,4.13,0,.12,.15,11.5,M.cyan);
      // nervuras inclinadas
      line([side*3.25,4.3,-4.8],[side*2.25,4.5,-1.0],.08,M.metal);
      line([side*3.25,4.3,.3],[side*2.25,4.5,4.1],.08,M.metal);
    }
    block(0,2.18,6.18,8.4,4.55,.35,M.wall);
    block(0,4.45,0,8.55,.25,12.6,M.wall);
    for(const z of [-4.5,-2,0.5,3,5]){
      block(0,4.21,z,7.8,.28,.22,M.metal);
      for(const x of [-2.65,0,2.65])block(x,4.035,z,.35,.065,1.5,x===0?M.cyan:M.amber);
    }

    // Frente com cabine de comando e parabrisa
    block(0,1.0,-5.45,8.2,1.9,.28,M.wall);
    block(-3.94,2.35,-5.0,.36,4.2,.8,M.metal);
    block(3.94,2.35,-5.0,.36,4.2,.8,M.metal);
    // estrutura inclinada do parabrisa
    const leftPillar=block(-2.95,3.2,-5.12,.28,3.5,.35,M.metal);leftPillar.rotation.z=-.52;
    const rightPillar=block(2.95,3.2,-5.12,.28,3.5,.35,M.metal);rightPillar.rotation.z=.52;
    block(0,4.52,-5.0,6.85,.28,.6,M.metal);
    // vidro frontal amplo
    const windshield=plane(0,2.72,-5.18,6.35,3.35,M.glass);
    windshield.rotation.x=0;
    block(0,1.03,-5.02,6.25,.08,.4,M.cyan);
    for(const x of [-2.1,0,2.1]) block(x,2.72,-5.08,.08,3.1,.08,M.metal);

    // Estacao unica de comando: tres paineis legiveis voltados ao piloto.
    block(0,.69,-4.82,4.65,.52,1.02,M.dark);
    block(0,.99,-4.72,4.48,.12,.78,M.metal);
    for(const x of [-1.88,1.88])block(x,1.16,-4.62,.08,.32,.48,M.cyan);
    for(let i=0;i<12;i++)block(-1.18+i*.215,1.08,-4.48,.12,.055,.12,i%3===0?M.amber:M.cyan);
    const pilotScreens={};
    function pilotScreen(id,x,w,h){
      block(x,1.72,-5.09,w+.13,h+.13,.15,M.metal);
      block(x,1.72,-5.005,w+.05,h+.05,.035,M.cyan);
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
      const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,toneMapped:false}));mesh.position.set(x,1.72,-4.975);mesh.rotation.x=.10;room.add(mesh);
      pilotScreens[id]={canvas,ctx:canvas.getContext('2d'),texture};
    }
    pilotScreen('crew',-1.48,1.27,.72);pilotScreen('map',0,1.52,.82);pilotScreen('systems',1.48,1.27,.72);
    function drawPilotDisplays(p={}){
      const crew=pilotScreens.crew,ctx=crew.ctx,cw=crew.canvas.width,ch=crew.canvas.height;
      ctx.fillStyle='#03101b';ctx.fillRect(0,0,cw,ch);ctx.strokeStyle='#36b9d5';ctx.lineWidth=3;ctx.strokeRect(8,8,cw-16,ch-16);
      ctx.fillStyle='#57e4e2';ctx.font='bold 27px monospace';ctx.fillText('TRIPULACAO',24,42);
      const occupants=Array.isArray(p.occupants)?p.occupants:[],passengers=occupants.filter(person=>Number(person.id)!==Number(p.pilotId)&&Number(person.id)!==Number(p.copilotId)),entries=[{name:p.pilot||'PILOTO',role:'PILOTO'},...(p.copilot?[{name:p.copilot,role:'COPILOTO'}]:[]),...passengers.map(person=>({name:person.name||'PASSAGEIRO',role:'PASSAGEIRO'}))];
      ctx.fillStyle='#8bb9c8';ctx.font='20px monospace';ctx.fillText(`${passengers.length} / 10 PASSAGEIROS`,24,75);
      entries.slice(0,5).forEach((person,i)=>{const y=113+i*39;ctx.fillStyle=i===0?'#ffc77a':'#d9f5f8';ctx.beginPath();ctx.arc(29,y-5,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d9f5f8';ctx.font='bold 20px monospace';ctx.fillText(String(person.name).slice(0,19),46,y);ctx.fillStyle='#54c5d5';ctx.font='15px monospace';ctx.textAlign='right';ctx.fillText(person.role,cw-22,y);ctx.textAlign='left'});
      crew.texture.needsUpdate=true;

      const map=pilotScreens.map,m=map.ctx,mw=map.canvas.width,mh=map.canvas.height;
      m.fillStyle='#04131f';m.fillRect(0,0,mw,mh);m.strokeStyle='#12374a';m.lineWidth=1;
      for(let x=24;x<mw;x+=48){m.beginPath();m.moveTo(x,52);m.lineTo(x,mh-22);m.stroke()}for(let y=58;y<mh-18;y+=38){m.beginPath();m.moveTo(18,y);m.lineTo(mw-18,y);m.stroke()}
      m.fillStyle='#64efda';m.font='bold 24px monospace';m.fillText('MAPA DE ROTA',22,34);
      m.fillStyle='#96b9c5';m.font='17px monospace';m.fillText(String(p.origin||'ORIGEM').toUpperCase().slice(0,20),23,mh-21);m.textAlign='right';m.fillText(String(p.destination||'DESTINO').toUpperCase().slice(0,20),mw-23,mh-21);m.textAlign='left';
      const y0=mh*.49;m.strokeStyle='#42d5da';m.lineWidth=4;m.beginPath();m.moveTo(86,y0+34);m.lineTo(mw-86,y0-34);m.stroke();
      m.fillStyle='#ffc56c';m.beginPath();m.arc(86,y0+34,10,0,Math.PI*2);m.fill();m.fillStyle='#74eaff';m.beginPath();m.arc(mw-86,y0-34,10,0,Math.PI*2);m.fill();
      m.fillStyle='#efffff';m.beginPath();m.arc(mw*.49,y0,8,0,Math.PI*2);m.fill();m.shadowColor='#71efff';m.shadowBlur=15;m.fill();m.shadowBlur=0;map.texture.needsUpdate=true;

      const sys=pilotScreens.systems,s=sys.ctx,sw=sys.canvas.width,sh=sys.canvas.height;
      s.fillStyle='#03101b';s.fillRect(0,0,sw,sh);s.strokeStyle='#36b9d5';s.lineWidth=3;s.strokeRect(8,8,sw-16,sh-16);s.fillStyle='#57e4e2';s.font='bold 25px monospace';s.fillText('NAVE / SISTEMAS',22,42);
      const fuel=Math.max(0,Number(p.fuel)||0),fuelMax=Math.max(1,Number(p.fuelCapacity)||1),cargo=Math.max(0,Number(p.cargoWeightKg)||0),capacity=Math.max(1,Number(p.cargoCapacity)||1);
      const meter=(label,value,max,y,color)=>{s.fillStyle='#a5c8d1';s.font='18px monospace';s.fillText(label,22,y);s.textAlign='right';s.fillStyle='#efffff';s.fillText(`${Math.round(value).toLocaleString('pt-BR')} / ${Math.round(max).toLocaleString('pt-BR')}`,sw-22,y);s.textAlign='left';s.fillStyle='#102d3b';s.fillRect(22,y+10,sw-44,16);s.fillStyle=color;s.fillRect(22,y+10,(sw-44)*Math.max(0,Math.min(1,value/max)),16)};
      meter('COMBUSTIVEL (U)',fuel,fuelMax,91,'#ffc36a');meter('CARGA (KG)',cargo,capacity,183,'#4ad8d4');
      s.fillStyle='#8fb7c4';s.font='16px monospace';s.fillText(`${Math.max(0,Math.round(capacity-cargo)).toLocaleString('pt-BR')} KG LIVRES`,22,276);sys.texture.needsUpdate=true;
    }

    // cadeira do piloto
    const chair=new T.Group();chair.position.set(0,0,-4.15);room.add(chair);
    block(0,.56,0,.92,1.04,.82,M.seat,chair);
    block(0,1.26,.22,.88,1.45,.20,M.dark,chair);
    block(0,1.84,.24,.68,.24,.18,M.metal,chair);
    block(0,.25,0,.42,.5,.42,M.metal,chair);
    block(-.52,.88,0,.12,.4,.82,M.metal,chair);block(.52,.88,0,.12,.4,.82,M.metal,chair);

    // bancos laterais para passageiros
    function bench(side,z){const g=new T.Group();g.position.set(side*2.88,0,z);g.rotation.y=side>0?Math.PI/2:-Math.PI/2;room.add(g);
      block(0,.45,0,1.68,.28,1.05,M.metal,g);block(0,.67,-.03,1.48,.17,.93,M.seat,g);
      block(0,1.36,.43,1.65,1.53,.22,M.seat,g);block(0,1.7,.55,1.43,.09,.08,M.cyan,g);
      for(const a of [-.72,.72]){block(a,.84,-.1,.13,.55,1.0,M.metal,g);block(a,.23,0,.18,.47,.52,M.dark,g);}block(0,.6,-.55,1.4,.08,.08,M.amber,g);
    }
    for(const z of [-1.9,2.05]){bench(-1,z);bench(1,z);}

    // Caixas 3D: a quantidade acompanha o peso real de carga da nave.
    const cargoBay=new T.Group();room.add(cargoBay);let cargoSignature='';
    const cargoSkins={iron:m(0x9a7130,.55,.52),nickel:m(0x526b78,.72,.38),cobalt:m(0x315e91,.58,.42),ice:m(0x39899b,.4,.3),fuel:m(0x4c5962,.7,.4)};
    const cargoAccents={iron:M.amber,nickel:M.metal,cobalt:M.cyan,ice:M.cyan,fuel:M.yellow};
    function cargoBox(x,z,y,type,index){
      const g=new T.Group();g.position.set(x,y,z);cargoBay.add(g);const shell=cargoSkins[type]||M.crate,accent=cargoAccents[type]||M.cyan;
      block(0,.43,0,1.24,.82,.98,shell,g);block(0,.855,0,1.2,.07,.94,M.dark,g);
      for(const sx of [-.56,.56])for(const sz of [-.43,.43])block(sx,.43,sz,.09,.82,.09,M.metal,g);
      for(const yy of [.17,.69])block(0,yy,-.505,1.08,.055,.035,accent,g);
      block(0,.45,-.514,.48,.25,.035,M.dark,g);block(-.12,.47,-.54,.12,.035,.018,accent,g);block(.08,.47,-.54,.22,.035,.018,M.metal,g);
      for(const sx of [-.43,.43])block(sx,.895,0,.12,.025,.78,M.metal,g);
    }
    function syncCargo(p){
      const cargo=p?.cargo||{},items=[['iron',Number(cargo.iron)||0],['nickel',Number(cargo.nickel)||0],['cobalt',Number(cargo.cobalt)||0],['ice',Number(cargo.ice)||0],['fuel',Number(cargo.fuelWeightKg)||0]].filter(item=>item[1]>0);
      const load=items.reduce((sum,item)=>sum+item[1],0),capacity=Math.max(1,Number(p?.cargoCapacity)||1),count=Math.min(16,Math.ceil(load/capacity*16));
      const counts=items.map(()=>0);for(let i=0;i<count;i++){let pick=0,best=-Infinity;for(let k=0;k<items.length;k++){const score=(i+1)*items[k][1]/load-counts[k];if(score>best){best=score;pick=k;}}counts[pick]++;}
      const types=[];items.forEach((item,k)=>{for(let n=0;n<counts[k];n++)types.push(item[0]);});const signature=types.join('|');if(signature===cargoSignature)return;cargoSignature=signature;
      for(const child of [...cargoBay.children]){cargoBay.remove(child);child.traverse(obj=>obj.geometry?.dispose?.());}cargoRects.length=0;
      if(!count)return;
      const slots=[],columns=[-2.9,-1.6,1.6,2.9];for(let layer=0;layer<2;layer++)for(let row=0;row<2;row++)for(const x of columns)slots.push({x,z:3.48+row*1.2,y:layer*.84});
      types.forEach((type,i)=>{cargoRects.push({x:slots[i].x,z:slots[i].z,hx:.62,hz:.49});cargoBox(slots[i].x,slots[i].z,slots[i].y,type,i);});
    }
    // terminais traseiros
    block(-3.76,2.3,4.75,.16,1.32,.9,M.dark);block(-3.645,2.35,4.75,.04,1.04,.69,M.cyan);
    block(3.74,1.82,4.8,.16,.94,.8,M.dark);block(3.64,1.82,4.8,.03,.6,.54,M.amber);

    const avatars=new Map(), avatarMaterials=new Map();
    const helpers={block,line,box:block,tube:line,mat:(c,a=.42,b=.47)=>{const k=`${c}-${a}-${b}`;if(!avatarMaterials.has(k))avatarMaterials.set(k,m(c,a,b));return avatarMaterials.get(k);},glow:(c,p=2)=>e(c,p)};
    const types=['captain','pilot','engineer','medic','security','navigator','scientist','comms','mechanic','cadet'];
    function skin(g,code){const ind=Math.max(0,types.indexOf(String(code||'captain')));const old=g.userData.model;if(old&&old.index===ind)return old;
      if(old){g.remove(old.root);old.root.traverse(o=>o.geometry?.dispose?.());}
      if(window.createCrewAvatarModel){g.userData.model=window.createCrewAvatarModel(T,ind,g,helpers);}else{const root=new T.Group();g.add(root);block(0,.92,0,.65,1,.36,M.seat,root);block(0,1.65,0,.48,.48,.45,M.metal,root);g.userData.model={root,index:ind,arms:[],legs:[],visual:root};}
      return g.userData.model;
    }

    function updateNameplate(group,person,height=2.32){let tag=group.userData.nameplate;if(!tag){const canvas=document.createElement('canvas');canvas.width=240;canvas.height=64;const context=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const material=new T.SpriteMaterial({map:texture,transparent:true,depthTest:true,depthWrite:false,toneMapped:false});tag=new T.Sprite(material);tag.userData={canvas,context,texture};tag.renderOrder=10;group.add(tag);group.userData.nameplate=tag;}const hostile=Boolean(person.hasPk),armed=Boolean(person.hasWeapons),pk=hostile||armed,name=String(person.name||'PILOTO').trim().slice(0,24),context=tag.userData.context;context.font='12px monospace';const nameWidth=context.measureText(name).width,width=Math.max(88,Math.min(260,Math.ceil(nameWidth+(pk?48:24))));tag.userData.canvas.width=width*2;tag.userData.canvas.height=64;context.setTransform(2,0,0,2,0,0);context.clearRect(0,0,width,32);context.beginPath();context.roundRect(1,1,width-2,30,5);context.fillStyle='rgba(3,15,25,.9)';context.fill();context.lineWidth=1;context.strokeStyle=hostile?'#ff4d5f':armed?'#f5fcff':'#57bed1';context.stroke();context.font='12px monospace';context.textBaseline='middle';context.textAlign='left';context.fillStyle='#e8fbff';context.fillText(name,10,16,Math.max(30,width-(pk?46:18)));if(pk){context.textAlign='right';context.fillStyle=hostile?'#ff4d5f':'#ffffff';context.font='bold 12px monospace';context.fillText('PK',width-9,16);}tag.userData.texture.needsUpdate=true;tag.position.set(0,height,0);tag.scale.set(width/100,.34,1);return tag;}
    const self=new T.Group();room.add(self);skin(self,'captain');
    const pilotAvatar=new T.Group();pilotAvatar.position.set(0,.02,-4.18);room.add(pilotAvatar);pilotAvatar.scale.setScalar(.96);let pilotName='PILOTO';

    function posePilot(){
      const model=pilotAvatar.userData.model;if(!model) return;
      if(model.visual){model.visual.position.y=-.16;model.visual.rotation.y=0;}
      if(Array.isArray(model.legs)) model.legs.forEach(({part,s=0})=>{if(part){part.rotation.x=1.18;part.rotation.z=-s*.04;}});
      if(Array.isArray(model.arms)) model.arms.forEach(({part,s=0})=>{if(part){part.rotation.x=.92;part.rotation.z=-s*.04;}});
    }

    let initializedYaw=false,prevWalk=0;const clock=new T.Clock();let running=false,raf=0;const walkIntent={active:false,forward:0,strafe:0,facing:null};
    function sync(payload){
      data=payload||{};
      const pData=data.passenger||{};
      syncCargo(pData);
      pilotName=pData.pilot||'PILOTO';
      drawPilotDisplays(pData);
      skin(pilotAvatar,pData.pilotAvatar||'pilot');
      pilotAvatar.rotation.y=Math.PI;posePilot();const members=pData.occupants||data.occupants||[],pilotPerson=members.find(person=>Number(person.id)===Number(pData.pilotId));updateNameplate(pilotAvatar,{...(pilotPerson||{}),name:pilotName},2.4);
      const ids=new Set(),seenIds=new Set();const people=pData.occupants||data.occupants||[];const cockpitIds=new Set([Number(pData.pilotId)||0,Number(pData.copilotId)||0].filter(Boolean));otherPlayers.length=0;
      for(const p of people){const id=Number(p.id),role=String(p.mode||'').toLowerCase();if(!Number.isFinite(id)||id<=0||seenIds.has(id))continue;seenIds.add(id);if(id===Number(data.selfId)){skin(self,p.avatar);updateNameplate(self,p);if(!initializedYaw){heading=Number(p.roomYaw)||0;self.rotation.y=Math.PI-heading;walkIntent.facing=heading;initializedYaw=true;}continue;}if(cockpitIds.has(id)||role==='pilot'||role==='copilot')continue;
        ids.add(id);let obj=avatars.get(id);if(!obj){obj=new T.Group();room.add(obj);avatars.set(id,obj);}skin(obj,p.avatar);obj.userData.person=p;updateNameplate(obj,p);
        const point=roomToWorld(p.roomX,p.roomZ);otherPlayers.push({id,x:point.x,z:point.z});obj.userData.destination=new T.Vector3(point.x,0,point.z);obj.userData.heading=Number(p.roomYaw)||0;
      }
      for(const [id,obj] of avatars){if(!ids.has(id)){room.remove(obj);obj.traverse(o=>o.geometry?.dispose?.());avatars.delete(id);}}
    }
    function setPlayerPosition(x,z){const p=roomToWorld(x,z);if(Math.hypot(self.position.x-p.x,self.position.z-p.z)>.008){prevWalk=performance.now();}self.position.set(p.x,0,p.z);}
    function resize(){const b=host.getBoundingClientRect();const w=Math.max(1,b.width),h=Math.max(1,b.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    function frame(){if(!running)return;raf=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta()||.016,.05);
      for(const obj of avatars.values()){if(obj.userData.destination)obj.position.lerp(obj.userData.destination,1-Math.exp(-8*dt));obj.rotation.y=Math.PI-(obj.userData.heading||0);}
      const avatarModel=self.userData.model,gait=walkIntent.active?1:0,phase=clock.elapsedTime*10;
      if(avatarModel){avatarModel.legs?.forEach(({part,s=0})=>{if(part)part.rotation.x=Math.sin(phase+(s<0?0:Math.PI))*.48*gait;});avatarModel.arms?.forEach(({part,s=0})=>{if(part)part.rotation.x=-Math.sin(phase+(s<0?0:Math.PI))*.24*gait;});if(avatarModel.visual)avatarModel.visual.position.y=Math.abs(Math.sin(phase*2))*.045*gait;}
      const targetFacing=Math.PI-(walkIntent.facing??heading),angle=targetFacing-self.rotation.y;self.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-10*dt));
      posePilot();
      const direction=new T.Vector3(Math.sin(heading),0,-Math.cos(heading));const look=self.position.clone().add(new T.Vector3(0,1.35+pitch*.4,0)).addScaledVector(direction,2.2);
      const ideal=self.position.clone().addScaledVector(direction,-5.15);ideal.y=2.8+pitch*2.0;ideal.x=bound(ideal.x,-3.55,3.55);ideal.z=bound(ideal.z,-5.7,5.7);
      camera.position.lerp(ideal,1-Math.exp(-9*dt));camera.lookAt(look);renderer.render(scene,camera);
    }
    let lookPointer=null,dragged=false;canvas.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;lookPointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY};dragged=false;canvas.setPointerCapture?.(ev.pointerId);});canvas.addEventListener('pointermove',ev=>{if(!lookPointer||lookPointer.id!==ev.pointerId)return;const dx=ev.clientX-lookPointer.x,dy=ev.clientY-lookPointer.y;if(Math.abs(dx)+Math.abs(dy)>2)dragged=true;heading=bound(heading+dx*.006,-1e9,1e9);pitch=bound(pitch-dy*.004,-.4,.45);lookPointer.x=ev.clientX;lookPointer.y=ev.clientY;});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{lookPointer=null;setTimeout(()=>{dragged=false},0)});const raycaster=new T.Raycaster();const mouse=new T.Vector2();canvas.addEventListener('click',ev=>{if(dragged)return;const r=canvas.getBoundingClientRect();mouse.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);let hit=raycaster.intersectObjects([...avatars.values()],true)[0];if(!hit)return;let obj=hit.object;while(obj&&!obj.userData.person)obj=obj.parent;if(objá.userData.person)onSelect(obj.userData.person);});
    new ResizeObserver(resize).observe(host);
    function setWalking(active,forward=0,strafe=0,baseHeading=heading){walkIntent.active=!!active&&!!(forward||strafe);walkIntent.forward=forward;walkIntent.strafe=strafe;if(walkIntent.active)walkIntent.facing=baseHeading+Math.atan2(strafe,forward);}
    return {update:sync,setPlayerPosition,canOccupy:allowed,canMove,setWalking,getHeading:()=>heading,rotate:(a=0,b=0)=>{heading=bound(heading+a,-1e9,1e9);pitch=bound(pitch+b,-.4,.45);},setActive:v=>{if(running===!!v)return;running=!!v;if(running){resize();clock.start();camera.position.set(0,2.4,8);raf=requestAnimationFrame(frame);}else cancelAnimationFrame(raf);},onSelect:fn=>{onSelect=fn;}};
  }
  init().then(value=>{model=value;model.setPlayerPosition(pos.x,pos.z);model.update(data);model.setActive(active);}).catch(err=>{console.error('Sala de passageiros:',err);const p=document.createElement('div');p.className='crew-3d-fallback';p.textContent='Falha ao abrir cabine 3D: '+(err?.stack||err?.message||String(err));p.setAttribute('role','alert');p.style.cssText+='white-space:pre-wrap;text-align:left;padding:24px;overflow:auto;font:12px/1.5 monospace';host.prepend(p);});
  return {update:x=>{data=x||{};model?.update(data);},setPlayerPosition:(x,z)=>{pos={x:Number(x)||50,z:Number(z)||75};model?.setPlayerPosition(pos.x,pos.z);},canOccupy:allowed,canMove,setWalking:(active,forward,strafe,baseHeading)=>model?.setWalking(active,forward,strafe,baseHeading),getHeading:()=>model?.getHeading()??heading,rotate:(a=0,b=0)=>{heading+=a;pitch=bound(pitch+b,-.4,.45);model?.rotate(a,b);},setActive:v=>{active=!!v;model?.setActive(active);},onSelect:fn=>{onSelect=fn;model?.onSelect(fn);}};
};
})();
