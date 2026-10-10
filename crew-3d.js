(() => {
  const vertexShader = `
    attribute vec3 aPosition; attribute vec3 aNormal;
    uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProjection;
    varying vec3 vNormal; varying vec3 vWorld;
    void main(){ vec4 world=uModel*vec4(aPosition,1.0); vWorld=world.xyz; vNormal=normalize(mat3(uModel)*aNormal); gl_Position=uProjection*uView*world; }
  `;
  const fragmentShader = `
    precision mediump float; uniform vec3 uColor; uniform float uGlow; uniform vec3 uEye;
    varying vec3 vNormal; varying vec3 vWorld;
    void main(){ float light=.43+.57*max(dot(normalize(vNormal),normalize(vec3(-.35,.86,.42))),0.0); float rim=pow(1.0-max(dot(normalize(uEye-vWorld),normalize(vNormal)),0.0),3.0); vec3 color=uColor*light+uColor*uGlow+vec3(.12,.42,.55)*rim*.34; gl_FragColor=vec4(color,1.0); }
  `;
  function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader}
  function vec(x,y,z){return[x,y,z]}
  function norm(a){const n=Math.hypot(...a)||1;return a.map(v=>v/n)}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far),m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)*nf;m[11]=-1;m[14]=2*far*near*nf;return m}
  function lookAt(eye,target,up=[0,1,0]){const z=norm([eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]]),x=norm(cross(up,z)),y=cross(z,x),m=new Float32Array(16);m[0]=x[0];m[1]=y[0];m[2]=z[0];m[4]=x[1];m[5]=y[1];m[6]=z[1];m[8]=x[2];m[9]=y[2];m[10]=z[2];m[12]=-dot(x,eye);m[13]=-dot(y,eye);m[14]=-dot(z,eye);m[15]=1;return m}
  function model(x,y,z,sx,sy,sz,yaw=0){const c=Math.cos(yaw),s=Math.sin(yaw),m=new Float32Array(16);m[0]=c*sx;m[2]=-s*sx;m[5]=sy;m[8]=s*sz;m[10]=c*sz;m[12]=x;m[13]=y;m[14]=z;m[15]=1;return m}
  function cube(){const p=[],n=[];const faces=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,-1,1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,-1,-1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,-1],[1,-1,1],[-1,-1,1]]]];for(const [normal,points]of faces)for(const point of points){p.push(...point);n.push(...normal)}return{p,n}}
  function sphere(rows=14,cols=18){const p=[],n=[];for(let r=0;r<rows;r++){const a1=Math.PI*r/rows,a2=Math.PI*(r+1)/rows;for(let c=0;c<cols;c++){const b1=2*Math.PI*c/cols,b2=2*Math.PI*(c+1)/cols,point=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)],q=[point(a1,b1),point(a2,b1),point(a2,b2),point(a1,b1),point(a2,b2),point(a1,b2)];for(const v of q){p.push(...v);n.push(...v)}}}return{p,n}}
  const colors={ 'sol-vale':[.25,.78,.72],'maya-chen':[.34,.58,.98],'amara-nyx':[.74,.42,.92],'ines-rocha':[.95,.58,.32],'zara-khan':[.94,.35,.48],'caio-vale':[.27,.76,.8],'leo-ortiz':[.45,.63,.96],'davi-okafor':[.92,.66,.28],'noah-park':[.65,.48,.95],'rafael-moraes':[.4,.78,.58] };
  window.createStationScene3D=function(container){
    const canvas=document.createElement('canvas');canvas.className='crew-3d-canvas';canvas.setAttribute('aria-label','Cena 3D do interior da estação espacial');container.prepend(canvas);
    const shipBoard=document.createElement('section');shipBoard.className='crew-world-ship-board';shipBoard.setAttribute('aria-label','Naves atracadas na estação');
    shipBoard.innerHTML='<header><span>⌖ HANGAR</span><b>TRÁFEGO DE NAVES</b><i>ESTAÇÃO / BAIA</i></header><div class="crew-world-ship-list"></div><footer><span>REDE LOCAL</span><b>● SISTEMA OPERACIONAL</b></footer>';
    Object.assign(shipBoard.style,{position:'absolute',left:'0',top:'0',width:'780px',height:'300px',boxSizing:'border-box',padding:'18px 22px',overflow:'hidden',zIndex:'2',pointerEvents:'none',transformOrigin:'top left',border:'3px solid #64c8d1',background:'linear-gradient(145deg,rgba(6,26,38,.97),rgba(5,15,25,.98))',boxShadow:'0 0 28px #38d8e655,inset 0 0 32px #168bb522',color:'#d4f3f3',fontFamily:'Space Mono,monospace',textShadow:'0 0 8px #53cfe966'});
    const boardStyle=document.createElement('style');boardStyle.textContent='.crew-world-ship-board header{height:36px;display:flex;align-items:center;gap:20px;border-bottom:1px solid #397582;font-size:20px;letter-spacing:2px}.crew-world-ship-board header span{color:#64e6db}.crew-world-ship-board header b{font-weight:700}.crew-world-ship-board header i{margin-left:auto;color:#78aeb8;font-size:14px;font-style:normal}.crew-world-ship-list{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;padding-top:11px}.crew-world-ship-row{height:73px;box-sizing:border-box;display:grid;grid-template-columns:42px 1fr;grid-template-rows:1fr 1fr;align-items:center;padding:5px 9px;border:1px solid #315968;background:linear-gradient(100deg,#102d3a,#091a27)}.crew-world-ship-icon{grid-row:1/3;color:#6fe7e2;font-size:30px;text-align:center}.crew-world-ship-row strong{align-self:end;font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crew-world-ship-row small{align-self:start;margin-top:3px;color:#80b5bf;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crew-world-ship-empty{grid-column:1/3;height:150px;display:grid;place-items:center;border:1px dashed #315968;color:#83b4be;font-size:20px;letter-spacing:2px}.crew-world-ship-board footer{position:absolute;bottom:9px;left:22px;right:22px;display:flex;justify-content:space-between;color:#78aeb8;font-size:12px;letter-spacing:1px}.crew-world-ship-board footer b{color:#66e2bd;font-size:12px}';container.append(boardStyle,shipBoard);
    function refreshShipBoard(list){const target=shipBoard.querySelector('.crew-world-ship-list');target.replaceChildren();const docked=(list||[]).slice(0,4);if(!docked.length){const empty=document.createElement('div');empty.className='crew-world-ship-empty';empty.textContent='NENHUMA NAVE ATRACADA';target.append(empty);return}for(const ship of docked){const row=document.createElement('div');row.className='crew-world-ship-row';const icon=document.createElement('span');icon.className='crew-world-ship-icon';icon.textContent='✧';const name=document.createElement('strong');name.textContent=ship.name||'NAVE SEM IDENTIFICAÇÃO';const status=document.createElement('small');status.textContent=[ship.class||'EXPLORER',ship.owner||'PILOTO DESCONHECIDO',ship.active?'ATIVA':'ACOPLADA'].join(' · ').toUpperCase();row.append(icon,name,status);target.append(row)}}
    let gl;try{gl=canvas.getContext('webgl',{antialias:true,alpha:false})||canvas.getContext('experimental-webgl')}catch(error){}
    if(!gl){const fallback=document.createElement('div');fallback.className='crew-3d-fallback';fallback.textContent='WebGL indisponível neste navegador.';container.prepend(fallback);return{update(){},setPlayerPosition(){},setActive(){},onSelect(){}}}
    const program=gl.createProgram();gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,vertexShader));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,fragmentShader));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const loc={p:gl.getAttribLocation(program,'aPosition'),n:gl.getAttribLocation(program,'aNormal'),model:gl.getUniformLocation(program,'uModel'),view:gl.getUniformLocation(program,'uView'),projection:gl.getUniformLocation(program,'uProjection'),color:gl.getUniformLocation(program,'uColor'),glow:gl.getUniformLocation(program,'uGlow'),eye:gl.getUniformLocation(program,'uEye')};
    function mesh(data){const pb=gl.createBuffer(),nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.p),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.n),gl.STATIC_DRAW);return{pb,nb,count:data.p.length/3}}
    const box=mesh(cube()),ball=mesh(sphere()),meshes=[];let player={x:50,z:67},people=[],ships=[],station='KHEPRI',active=false,lastFrame=0,walkAmount=0,onSelect=()=>{},cameraEye=[0,3,8],cameraTarget=[0,1,-2],heading=0,pitch=0,humanPose=null,buildingRoom=false,doorBlend=[0,0];const ROOM_X=3,ROOM_Z=5;
    function add(shape,x,y,z,sx,sy,sz,color,yaw=0,glow=0){if(buildingRoom){x*=ROOM_X;z*=ROOM_Z}meshes.push({shape,transform:model(x,y,z,sx,sy,sz,yaw),color,glow,collision:shape===box?{x,y,z,sx,sy,sz,yaw}:null})}
    function posePoint(x,y,z,yaw=0){if(!humanPose)return{x,y,z,yaw};const dx=x-humanPose.x,dz=z-humanPose.z,c=Math.cos(humanPose.yaw),s=Math.sin(humanPose.yaw);return{x:humanPose.x+dx*c-dz*s,y,z:humanPose.z+dx*s+dz*c,yaw:yaw+humanPose.yaw}}
    function block(x,y,z,sx,sy,sz,color,yaw=0,glow=0,stretch=''){if(buildingRoom){if(stretch.includes('x'))sx*=ROOM_X;if(stretch.includes('z'))sz*=ROOM_Z}const p=posePoint(x,y,z,yaw);add(box,p.x,p.y,p.z,sx,sy,sz,color,p.yaw,glow)}function orb(x,y,z,s,color,glow=0,stretch=false){const p=posePoint(x,y,z);add(ball,p.x,p.y,p.z,s*(buildingRoom&&stretch?ROOM_X:1),s*(buildingRoom&&stretch?ROOM_X:1),s*(buildingRoom&&stretch?ROOM_X:1),color,p.yaw,glow)}
    function buildRoom(){buildingRoom=true;meshes.length=0;
      // A new three-bay orbital atrium: broad deck, enclosed shell, and a clear central route.
      block(0,-.32,0,16,.64,38,[.035,.075,.105],0,0,'xz');
      block(0,-.02,0,5.2,.08,37,[.07,.15,.18],0,.04,'z');
      for(const side of [-1,1]){
        block(side*7.55,4.85,0,.8,9.7,38,[.075,.13,.17],0,0,'z');
        block(side*7.28,4.5,0,.08,8.1,38,[.08,.24,.3],0,.12,'z');
        block(side*7.1,.12,0,.55,.2,37,[.11,.25,.29],0,.12,'z');
        for(let z=-16;z<=16;z+=5.3){
          block(side*7.08,4.9,z,.16,6.2,4.8,[.025,.13,.2],0,.12,'z');
          block(side*7.02,4.9,z,.055,5.7,4.5,[.035,.22,.31],0,.18,'z');
          block(side*7.12,8.5,z,.6,.18,4.8,[.2,.72,.79],0,.22,'z');
          block(side*7.12,1.2,z,.6,.15,4.8,[.13,.5,.59],0,.16,'z');
        }
      }
      // Deep ceiling panels replace the exposed, tangled truss canopy.
      block(0,10.0,0,16,.42,38,[.045,.085,.12],0,0,'xz');
      for(let z=-16;z<=16;z+=5.3){
        block(0,9.72,z,15.2,.13,.22,[.16,.3,.36],0,.08,'x');
        for(const x of [-4.5,0,4.5])block(x,9.74,z,2.3,.045,2.8,[.18,.67,.75],0,.34);
        for(const side of [-1,1])block(side*7.25,9.45,z,.5,.5,.3,[.26,.75,.78],0,.25);
      }
      // Floor panels and luminous guide rails organize the long hall without clutter.
      for(let z=-17;z<=17;z+=2.5){
        block(0,.025,z,14.4,.045,.055,[.13,.27,.32]);
        block(-2.1,.06,z,.045,.035,.5,[.2,.84,.79],0,.28);
        block(2.1,.06,z,.045,.035,.5,[.2,.84,.79],0,.28);
      }
      for(const z of [-13,-6,1,8,15]){
        block(0,.012,z,3.4,.04,4.2,[.055,.12,.15]);
        block(0,.04,z-1.85,2.8,.035,.045,[.19,.59,.67],0,.16);
        block(0,.04,z+1.85,2.8,.035,.045,[.19,.59,.67],0,.16);
      }
      // Freestanding hangar status display, mounted high so the central path stays open.
      block(0,5.15,-4.45,12.3,4.15,.36,[.12,.26,.33],0,.1);
      block(0,5.15,-4.24,11.72,3.57,.08,[.025,.11,.17],0,.28);
      block(0,7.0,-4.28,11.55,.045,.055,[.19,.7,.75],0,.38);
      block(0,3.3,-4.28,11.55,.045,.055,[.17,.56,.65],0,.24);
      for(const side of [-1,1]){
        block(side*2.2,3.05,-4.45,.22,5.8,.5,[.18,.35,.41],0,.04);
        block(side*2.2,5.9,-4.34,.34,.12,.3,[.2,.85,.78],0,.35);
      }
      // Two full pressure bulkheads have a wide, walkable center doorway.
      for(const z of [-3.2,4.1]){
        block(-5.05,3.35,z,5.9,6.45,.5,[.085,.17,.23],0,0,'x');
        block(5.05,3.35,z,5.9,6.45,.5,[.085,.17,.23],0,0,'x');
        block(0,6.52,z,4.55,.38,.55,[.16,.43,.5],0,.14,'x');
        block(-2.18,3.15,z,.3,5.95,.55,[.12,.35,.42],0,.18);
        block(2.18,3.15,z,.3,5.95,.55,[.12,.35,.42],0,.18);
        block(0,.12,z,4.35,.12,.78,[.12,.65,.66],0,.3,'x');
        for(const side of [-1,1]){
          block(side*1.95,5.35,z,.16,.14,.2,[.2,.9,.79],0,.5);
          block(side*1.95,4.95,z,.12,.12,.2,[.95,.62,.29],0,.32);
        }
      }
      // Recessed service alcoves keep the walking lane open.
      for(const z of [-8,0,8])for(const side of [-1,1]){
        const accent=z<0?[.2,.7,.95]:z===0?[.2,.88,.72]:[.95,.62,.3];
        block(side*5.35,1.25,z,.95,2.3,1.35,[.055,.13,.18]);
        block(side*5.35,1.92,z-.69,.72,.72,.08,[.05,.25,.34],0,.12);
        block(side*5.35,1.92,z-.75,.52,.48,.04,accent,0,.32);
        block(side*5.35,.18,z+.35,1.1,.22,1.7,[.1,.2,.25]);
        block(side*5.35,.32,z+.35,.88,.08,1.45,[.15,.32,.38]);
      }
      // Panorama portal opens toward nearby traffic, planets, and the station's docking arms.
      block(0,9.15,-18.4,15.8,.42,.55,[.15,.31,.37],0,.12,'x');
      block(0,.5,-18.4,15.8,.48,.55,[.1,.23,.29],0,.08,'x');
      block(-7.72,4.8,-18.4,.48,8.7,.55,[.17,.36,.42]);
      block(7.72,4.8,-18.4,.48,8.7,.55,[.17,.36,.42]);
      for(const side of [-1,1]){
        block(side*5.45,4.8,-18.25,.12,7.8,.3,[.24,.56,.63],0,.16);
        block(side*5.45,4.8,-18.25,.05,7.2,.22,[.12,.37,.48],0,.18);
      }
      orb(-4.4,5.3,-21.8,2.15,[.08,.34,.59],.2,true);
      orb(-4.9,6.05,-23.05,.72,[.27,.69,.84],.24,true);
      for(let i=0;i<44;i++){
        const x=((i*73)%151)/10-7.5,y=1.6+((i*37)%65)/10,z=-20.4-((i*19)%65)/10;
        orb(x,y,z,.035+(i%3)*.018,i%5===0?[.18,.9,.8]:[.43,.68,.84],.12);
      }
      // Exterior service dock occupies only the right third of the viewport;
      // the rest stays open to the stars and the distant planet.
      block(5.15,7.35,-23.4,17,.42,1.35,[.12,.27,.34],0,.08);
      block(5.15,.8,-23.4,17,.5,1.35,[.09,.2,.27],0,.06);
      block(5.15,7.08,-23.4,16,.075,.11,[.2,.65,.73],0,.26);
      block(5.15,1.08,-23.4,16,.075,.11,[.16,.54,.62],0,.2);
      for(let bay=0;bay<4;bay++){
        const x=1.55+bay*2.4;
        block(x,4.05,-23.15,.22,5.75,1.0,[.18,.35,.41],0,.04);
        block(x,4.0,-22.57,.1,4.8,.08,[.23,.71,.77],0,.22);
        block(x,6.8,-22.45,.48,.14,.45,bay%2?[.19,.8,.78]:[.97,.61,.3],0,.34);
        block(x,.97,-22.45,.78,.13,.62,[.22,.39,.45],0,.04);
        for(let led=0;led<3;led++)orb(x-.2+led*.2,1.08,-22.1,.045,led===1?[.2,.91,.78]:[.98,.61,.3],.3);
      }
      for(let shipIndex=0;shipIndex<3;shipIndex++){
        const x=3.05+shipIndex*1.72,z=-21.35-(shipIndex%2)*.38;
        const hull=shipIndex===0?[.34,.62,.7]:shipIndex===1?[.48,.57,.62]:[.32,.68,.65];
        const trim=shipIndex===1?[.98,.61,.3]:[.22,.83,.82];
        // Docked courier hull, broad wings, cockpit, engines and a visible berth clamp.
        block(x,3.55,z,.82,.48,3.05,hull,0,.06);
        block(x,3.68,z+1.02,.68,.36,.8,[.08,.23,.32],0,.2);
        block(x,3.76,z+1.43,.48,.16,.08,[.19,.78,.92],0,.45);
        block(x,3.42,z-.1,4.5,.16,1.05,[.19,.35,.42],0,.04);
        block(x,3.49,z+.12,3.25,.065,.13,trim,0,.2);
        for(const side of [-1,1]){
          block(x+side*1.45,3.55,z-.62,.9,.25,1.4,[.14,.28,.35],side*.12,.04);
          block(x+side*.43,3.48,z-1.42,.16,.28,.35,[.27,.45,.5]);
          orb(x+side*.34,3.54,z-1.64,.16,[.22,.79,.98],.5);
          orb(x+side*1.55,3.57,z-.15,.085,trim,.35);
        }
        block(x,4.42,z-.9,.16,1.28,.16,[.27,.46,.51]);
        block(x,5.05,z-.92,.65,.14,.82,[.16,.34,.4],0,.06);
        block(x,5.22,z-.92,.31,.16,.43,[.96,.62,.3],0,.3);
        block(x,2.92,z-.3,.56,.18,2.15,[.1,.23,.29]);
      }
      // A monumental rear bulkhead and suspended bay beacons give the three zones scale.
      block(-5.05,4.6,18.8,5.9,9.2,.8,[.065,.13,.17],0,0,'x');
      block(5.05,4.6,18.8,5.9,9.2,.8,[.065,.13,.17],0,0,'x');
      block(0,9.3,18.8,16,.55,.8,[.13,.29,.35],0,.12,'x');
      for(const [z,color] of [[-11,[.2,.7,.95]],[0,[.18,.88,.76]],[11,[.98,.62,.3]]]){
        block(0,8.85,z,5.8,.12,.2,color,0,.42,'x');
        block(-2.82,8.3,z,.12,.95,.2,color,0,.3);
        block(2.82,8.3,z,.12,.95,.2,color,0,.3);
      }
      // 1. Heavy transverse ribs make the roof read as a pressurized spacecraft hull.
      for(let z=-15;z<=15;z+=5){
        block(0,9.42,z,15.65,.42,.36,[.12,.2,.26],0,.06,'x');
        block(0,9.18,z,12.9,.08,.12,[.2,.4,.46],0,.14,'x');
        for(const side of [-1,1])block(side*7.28,5.15,z,.42,8.35,.42,[.13,.25,.31],0,.08);
      }
      // 2. Panoramic side windows carry a deep-blue starfield and distant planet lights.
      for(const side of [-1,1])for(let i=0;i<7;i++){
        const z=-15+i*5;
        block(side*7.13,5.05,z,.065,4.6,3.0,[.025,.12,.2],0,.1,'z');
        block(side*7.08,7.55,z,.11,.1,3.0,[.22,.65,.75],0,.24,'z');
        block(side*7.08,2.55,z,.11,.1,3.0,[.12,.48,.56],0,.15,'z');
        for(let k=0;k<4;k++)orb(side*6.98,3.4+((i*13+k*7)%37)/10,z-1.2+((i*5+k*9)%24)/10,.035+(k%2)*.02,k===0?[.24,.85,.88]:[.5,.72,.85],.16);
        if(i===1||i===5)orb(side*6.91,5.45,z,.42,i===1?[.12,.38,.67]:[.36,.27,.62],.12);
      }
      // 3. Recessed ceiling luminaires and 4. exposed life-support conduits.
      for(let z=-14;z<=14;z+=4){
        for(const x of [-4.8,-1.6,1.6,4.8]){
          block(x,9.48,z,2.25,.045,2.7,[.24,.68,.73],0,.4);
          block(x,9.37,z,.28,.14,2.25,[.36,.49,.52],0,.06);
        }
        for(const side of [-1,1]){
          block(side*6.25,8.95,z,.18,.2,4.1,[.26,.43,.48],0,.04);
          block(side*6.25,8.74,z,.08,.06,3.6,[.16,.75,.73],0,.24);
        }
      }
      // 5. Wall-mounted navigation and life-support consoles sit in side alcoves.
      for(const side of [-1,1])for(const z of [-11,0,11]){
        block(side*6.9,2.65,z,.18,2.05,2.35,[.09,.18,.23],0,.04);
        block(side*6.78,3.05,z-.25,.06,.72,1.25,[.025,.24,.34],0,.22);
        for(let row=0;row<3;row++)block(side*6.76,2.45-row*.25,z+.52,.045,.055,.58,row===0?[.18,.85,.76]:[.25,.47,.54],0,.28);
        block(side*6.85,1.45,z,.65,.14,2.6,[.15,.27,.31]);
        for(let n=0;n<4;n++)orb(side*6.74,1.95,z-.72+n*.2,.055,n===0?[.2,.9,.75]:[.95,.61,.28],.24);
      }
      // 6. Rest stations add furniture and human scale beside the open walking lane.
      for(const side of [-1,1])for(const z of [-13,0,13]){
        block(side*5.75,.68,z,2.2,.28,1.25,[.13,.24,.29]);
        block(side*5.75,.88,z,1.95,.12,1.04,[.22,.34,.38]);
        for(const dx of [-.85,.85])block(side*5.75+dx,.38,z,.12,.5,.14,[.32,.48,.52]);
        block(side*6.72,1.42,z,.18,1.3,.18,[.17,.32,.37]);
        block(side*6.72,2.12,z,.32,.12,.38,[.2,.84,.79],0,.3);
      }
      // 7. Pressure doors receive layered frames, status lights, and floor warning bands.
      for(const z of [-3.2,4.1]){
        for(const side of [-1,1]){
          block(side*2.35,3.25,z,.13,6.1,.72,[.19,.36,.42],0,.12);
          block(side*2.35,3.25,z+side*.16,.055,5.5,.08,[.22,.84,.78],0,.34);
          block(side*5.2,6.55,z,.85,.22,.62,[.16,.31,.37]);
          for(let lamp=0;lamp<3;lamp++)orb(side*(1.75+lamp*.25),6.58,z+.36,.065,lamp===0?[.2,.9,.72]:[.98,.64,.3],.32);
        }
        for(let stripe=0;stripe<9;stripe++)block(-1.6+stripe*.4,.205,z+.72,.19,.025,.16,stripe%2?[.85,.49,.2]:[.16,.29,.33],0,.12);
      }
      // 8. Cargo pallets and tool lockers identify the rear bay as a working hangar.
      for(let row=0;row<3;row++)for(let side of [-1,1]){
        const x=side*(4.2+row*.72),z=13.4+row*.55;
        block(x,.72,z,1.05,1.25,1.2,[.13,.23,.29]);
        block(x,.72,z-.62,.72,.72,.045,[.18,.42,.5],0,.08);
        block(x,.17,z,.9,.12,1.04,[.2,.35,.4]);
        for(let mark=0;mark<3;mark++)block(x-.28+mark*.28,1.39,z-.48,.12,.055,.06,mark===0?[.95,.62,.28]:[.24,.77,.76],0,.22);
      }
      for(const side of [-1,1]){
        block(side*6.25,4.65,15.5,.72,4.4,.75,[.08,.17,.22]);
        for(let shelf=0;shelf<4;shelf++)block(side*6.25,2.85+shelf*.85,15.05,.9,.12,1.5,[.23,.37,.41]);
      }
      // Detailed floor finish: panel seams, service hatches, tactile strips and bay rings.
      for(let z=-18;z<=18;z+=1.2){
        block(0,.012,z,15.6,.018,.025,[.1,.19,.23],0,0,'x');
        for(const side of [-1,1]){
          block(side*4.65,.035,z,1.9,.025,.035,[.16,.3,.34],0,.035);
          block(side*6.85,.045,z,.045,.035,.11,[.22,.68,.72],0,.16);
        }
      }
      for(let x=-6.8;x<=6.8;x+=.8)block(x,.014,0,.022,.02,37,[.08,.15,.19],0,0,'z');
      for(const center of [-13,0,13])for(let i=0;i<16;i++){
        const a=i*Math.PI/8,ringColor=i%4===0?[.95,.58,.26]:[.16,.62,.66];
        block(Math.cos(a)*3.0,.045,center+Math.sin(a)*1.75,1.1,.035,.1,ringColor,-a, i%4===0?.16:.08);
        block(Math.cos(a)*2.55,.048,center+Math.sin(a)*1.48,.8,.028,.07,[.12,.3,.35],-a,.04);
      }
      for(const z of [-15,-10,-5,0,5,10,15])for(const side of [-1,1]){
        block(side*4.9,.07,z,1.55,.12,2.1,[.09,.17,.21]);
        block(side*4.9,.14,z,1.2,.025,1.7,[.15,.27,.31]);
        for(let bolt=0;bolt<4;bolt++)orb(side*4.9-.48+(bolt%2)*.96,.16,z-.62+Math.floor(bolt/2)*1.24,.035,[.53,.67,.68],.08);
      }
      // Repeated wall cassettes close the visual gaps and make the side walls feel manufactured.
      for(const side of [-1,1])for(let bay=0;bay<11;bay++){
        const z=-16+bay*3.2,metal=bay%2?[.12,.22,.28]:[.095,.18,.24],accent=bay%3===0?[.2,.73,.8]:[.14,.43,.51];
        block(side*7.38,4.65,z,.16,7.55,2.72,metal,0,.02,'z');
        block(side*7.27,4.65,z,.06,6.95,2.4,accent,0,.06,'z');
        for(const y of [1.15,1.42,7.86,8.13])block(side*7.19,y,z,.09,.075,2.55,[.31,.47,.5],0,.04,'z');
        for(let slat=0;slat<5;slat++)block(side*7.12,3.45+slat*.32,z-.78,.07,.07,1.05,[.19,.36,.42],0,.04);
        for(const end of [-1,1]){
          block(side*7.08,4.65,z+end*1.14,.085,6.6,.08,[.28,.53,.57],0,.11);
          orb(side*7.0,8.42,z+end*.96,.075,end>0?[.2,.85,.77]:[.94,.59,.28],.28);
        }
      }
      // Ventilation banks, acoustic baffles and illuminated access panels.
      for(const side of [-1,1])for(let bay=0;bay<8;bay++){
        const z=-14+bay*4;
        block(side*6.98,7.25,z,.12,1.15,2.5,[.055,.12,.16]);
        for(let vane=0;vane<7;vane++)block(side*6.88,6.83+vane*.14,z,.045,.055,2.16,[.24,.38,.42],0,.025);
        block(side*6.94,2.25,z,.14,1.25,1.9,[.07,.15,.19]);
        block(side*6.84,2.5,z-.35,.05,.54,.72,[.035,.26,.36],0,.2);
        for(let led=0;led<4;led++)orb(side*6.78,2.18,z-.42+led*.28,.04,led===0?[.28,.9,.73]:[.92,.57,.27],.25);
      }
      // Ceiling service trays, paired coolant lines and access hatches.
      for(const side of [-1,1]){
        block(side*5.65,9.02,0,.72,.3,37,[.09,.17,.22],0,.03,'z');
        for(const pipe of [-.22,0,.22]){
          block(side*5.65+pipe,8.78,0,.095,.09,37,[.28,.4,.44],0,.035,'z');
          block(side*5.65+pipe,8.66,0,.045,.035,37,pipe===0?[.18,.69,.72]:[.19,.34,.39],0,.12,'z');
        }
        for(let hatch=-15;hatch<=15;hatch+=5){
          block(side*4.1,9.48,hatch,1.3,.055,1.8,[.12,.2,.24]);
          block(side*4.1,9.44,hatch,.82,.035,1.24,[.2,.34,.38]);
          for(let bolt=0;bolt<4;bolt++)orb(side*4.1-.46+(bolt%2)*.92,9.4,hatch-.65+Math.floor(bolt/2)*1.3,.035,[.67,.73,.68],.05);
        }
      }
      // A small hydroponic life-support bay adds color and a lived-in station feel.
      for(const side of [-1,1])for(const z of [-12,0,12]){
        block(side*5.85,.55,z,1.45,.72,2.7,[.045,.14,.16]);
        block(side*5.85,.94,z,1.25,.12,2.42,[.18,.36,.35]);
        block(side*5.85,1.12,z,1.12,.14,2.18,[.11,.23,.2]);
        for(let plant=0;plant<5;plant++){
          const px=side*5.85-.43+(plant%3)*.43,pz=z-.72+Math.floor(plant/3)*.8;
          block(px,1.43,pz,.11,.62,.11,[.16,.45,.31],(plant-2)*.1);
          orb(px-.18,1.67,pz-.05,.2,[.19,.62,.37],.07);
          orb(px+.15,1.76,pz+.06,.18,[.3,.71,.42],.08);
        }
        for(let lamp=0;lamp<3;lamp++)block(side*5.85,2.05,z-.62+lamp*.62,.08,.08,.42,[.25,.83,.65],0,.24);
      }
      // Storage lockers, emergency kits and maintenance carts along the perimeter.
      for(const side of [-1,1])for(const z of [-16,-12,-8,8,12,16]){
        block(side*6.4,2.25,z,.78,2.6,1.55,[.09,.17,.22]);
        block(side*6.28,2.28,z-.18,.045,1.7,.78,[.035,.23,.31],0,.12);
        block(side*6.27,3.18,z-.18,.05,.07,.45,[.21,.77,.73],0,.22);
        for(let shelf=0;shelf<3;shelf++)block(side*6.27,1.55+shelf*.32,z+.38,.04,.055,.35,[.29,.42,.44],0,.02);
        orb(side*6.2,3.42,z+.52,.07,z<0?[.2,.85,.75]:[.95,.6,.29],.24);
      }
      for(const z of [-9,9])for(const side of [-1,1]){
        block(side*6.0,.62,z,1.5,.62,1.0,[.13,.24,.28]);
        block(side*6.0,.96,z-.28,.8,.14,.48,[.18,.4,.44]);
        for(let wheel=-1;wheel<=1;wheel+=2)orb(side*6.0+wheel*.52,.19,z+.28,.16,[.055,.09,.11],.02);
        block(side*6.0,1.55,z,.08,.4,.08,[.27,.48,.5]);
      }
      // Detailed observatory station: instrument consoles, chairs and a reinforced viewport rim.
      for(const side of [-1,1]){
        const x=side*4.55,z=-16.35;
        block(x,1.2,z,1.15,1.75,1.25,[.07,.17,.22]);
        block(x,2.12,z-.48,1.02,.82,.08,[.035,.23,.34],0,.18);
        block(x,2.16,z-.54,.8,.56,.035,side<0?[.18,.72,.88]:[.2,.85,.72],0,.28);
        for(let key=0;key<6;key++)orb(x-.38+(key%3)*.38,1.78,z+.3+Math.floor(key/3)*.24,.055,key%2?[.93,.61,.28]:[.22,.88,.75],.24);
        block(x, .65,z+1.0,.82,.18,.85,[.15,.28,.32]);
        block(x,.98,z+1.26,.68,.68,.12,[.12,.22,.27]);
        for(const foot of [-1,1])block(x+foot*.26,.36,z+1.08,.08,.46,.08,[.31,.47,.5]);
      }
      for(let band=0;band<5;band++){
        block(0,9.52,-17+band*1.15,14.8,.075,.08,band%2?[.13,.29,.35]:[.2,.42,.48],0,.09,'x');
        for(const side of [-1,1])block(side*7.0,5.0,-17+band*1.15,.08,7.1,.075,[.18,.38,.43],0,.08);
      }
      // Airlock status bars, handrails and broad color-coded bay thresholds.
      for(const z of [-3.2,4.1]){
        for(const side of [-1,1]){
          for(let rail=0;rail<4;rail++)block(side*(2.6+rail*.18),3.15,z+side*.38,.045,4.9,.035,rail%2?[.17,.4,.46]:[.27,.72,.75],0,.12);
          block(side*3.0,7.02,z,.7,.06,.28,[.2,.84,.77],0,.3);
          block(side*3.0,6.82,z,.45,.05,.22,[.96,.62,.3],0,.2);
        }
        for(let tick=0;tick<13;tick++)block(-2.0+tick*.34,.22,z+1.03,.13,.035,.22,tick%2?[.12,.28,.32]:[.94,.55,.24],0,.1);
      }
      // Docking machinery and service craft silhouettes fill the panoramic view.
      for(const side of [-1,1]){
        const x=side*6.35,z=-21.4;
        block(x,4.35,z,2.4,.28,1.25,[.13,.29,.36],side*.12,.16);
        block(x,5.05,z-.25,.16,1.35,.16,[.22,.56,.64],side*.08,.18);
        block(x,5.65,z-.25,1.15,.14,.35,[.18,.4,.48],side*.08,.16);
        orb(x,5.7,z-.5,.24,[.35,.82,.83],.22);
        for(let node=0;node<4;node++)orb(x-side*.7+node*.46,4.45,z+.54,.085,node%2?[.2,.84,.76]:[.95,.61,.29],.28);
      }
      for(let i=0;i<7;i++){
        const x=-6+i*2,z=-25.5-(i%3)*1.15;
        block(x,2.5,z,.8,.12,1.55,[.11,.24,.3],i*.04,.11);
        block(x,2.82,z-.32,.52,.48,.045,[.035,.2,.3],0,.24);
        orb(x,3.15,z,.13,[.2,.86,.8],.3);
      }
      buildingRoom=false;
    }
    buildRoom();
    // Clear every scenic object outside the front viewport; repopulate it only with stars.
    for(let i=meshes.length-1;i>=0;i--)if(meshes[i].transform[14]<-100)meshes.splice(i,1);
    for(let i=0;i<220;i++){
      const x=((i*73)%157)/10-7.8,y=.9+((i*37)%78)/10,z=-101-((i*19)%115)/10;
      const color=i%17===0?[.25,.83,.98]:i%11===0?[.83,.75,.58]:[.42,.64,.82];
      orb(x,y,z,.025+(i%5)*.012,color,i%13===0?.2:.06);
    }
    // Merge the static room into material batches. The richer room can then
    // render in a few dozen calls instead of issuing one call per decoration.
    function batchRoom(source){
      const groups=new Map();
      for(const item of source){
        const key=[item.shape===box?'box':'sphere',...item.color.map(value=>value.toFixed(3)),item.glow.toFixed(3)].join(':');
        let group=groups.get(key);if(!group){group={shape:item.shape,color:item.color,glow:item.glow,p:[],n:[]};groups.set(key,group)}
        const m=item.transform,sx=Math.hypot(m[0],m[2])||1,sz=Math.hypot(m[8],m[10])||1,sy=Math.abs(m[5])||1;
        const c=m[0]/sx,s=m[8]/sz;
        const sourceMesh=item.shape===box?cubeData:sphereData;
        for(let i=0;i<sourceMesh.p.length;i+=3){
          const x=sourceMesh.p[i],y=sourceMesh.p[i+1],z=sourceMesh.p[i+2];
          group.p.push(m[0]*x+m[8]*z+m[12],m[5]*y+m[13],m[2]*x+m[10]*z+m[14]);
          const nx=sourceMesh.n[i],ny=sourceMesh.n[i+1],nz=sourceMesh.n[i+2],tx=c*nx/sx+s*nz/sz,ty=ny/sy,tz=-s*nx/sx+c*nz/sz,len=Math.hypot(tx,ty,tz)||1;
          group.n.push(tx/len,ty/len,tz/len);
        }
      }
      const identity=model(0,0,0,1,1,1);
      return Array.from(groups.values(),group=>({shape:mesh({p:group.p,n:group.n}),transform:identity,color:group.color,glow:group.glow,collision:null}));
    }
    const cubeData=cube(),sphereData=sphere();
    const roomCollision=meshes.filter(item=>item.collision).map(item=>item.collision);
    const roomMeshes=batchRoom(meshes);
    function drawHuman(x,z,color,isSelf,phase=0,yaw=0,avatar=''){
      humanPose={x,z,yaw};
      const walking=isSelf&&walkAmount>0,step=walking?Math.sin(phase*11)*.16:0,bob=walking?Math.abs(Math.sin(phase*11))*.045:0;
      const suit=colors[avatar]|| (isSelf?color:[.25,.39,.47]),dark=[.075,.14,.19],metal=[.42,.62,.68],accent=[.18,.82,.79];
      // Life-support pack and articulated pressure suit.
      block(x,1.38+bob,z-.25,.43,.7,.24,dark,0,.06);block(x,1.47+bob,z-.4,.3,.43,.18,[.13,.25,.3]);
      block(x,1.18+bob,z,.47,.72,.34,suit,0,.07);block(x,1.55+bob,z,.57,.2,.38,metal,0,.1);block(x,1.12+bob,z+.19,.31,.38,.08,dark);
      block(x,1.23+bob,z+.25,.21,.3,.045,accent,0,.32);orb(x,1.25+bob,z+.29,.045,[.95,.71,.31],.4);orb(x-.095,1.25+bob,z+.29,.026,[.35,.79,.98],.3);orb(x+.095,1.25+bob,z+.29,.026,[.35,.79,.98],.3);
      // Helmet with a broad reflective faceplate, collar and side hardware.
      block(x,1.88+bob,z,.36,.36,.34,[.72,.78,.75],0,.08);orb(x,2.2+bob,z,.39,[.71,.82,.82],.1);
      block(x,2.2+bob,z+.275,.29,.2,.12,[.045,.17,.24],0,.48);block(x,2.08+bob,z+.28,.29,.035,.055,[.18,.72,.82],0,.55);
      block(x-.39,2.2+bob,z,.12,.18,.21,metal,0,.14);block(x+.39,2.2+bob,z,.12,.18,.21,metal,0,.14);
      // Shoulder guards, forearms and gloves swing with the walking cycle.
      block(x-.35,1.55+bob,z,.23,.28,.3,metal,-step*.35,.08);block(x+.35,1.55+bob,z,.23,.28,.3,metal,step*.35,.08);
      block(x-.38,1.22+bob,z+.015,.19,.43,.21,suit,-step*.62);block(x+.38,1.22+bob,z+.015,.19,.43,.21,suit,step*.62);
      orb(x-.38,.98+bob,z+.02,.12,dark,.04);orb(x+.38,.98+bob,z+.02,.12,dark,.04);
      // Reinforced legs, knee joints and magnetic boots.
      block(x-.15,.59+bob,z,.2,.58,.22,dark,step*.45);block(x+.15,.59+bob,z,.2,.58,.22,dark,-step*.45);
      block(x-.15,.67+bob,z+.13,.2,.17,.08,metal);block(x+.15,.67+bob,z+.13,.2,.17,.08,metal);
      block(x-.16,.18+bob,z+.04,.29,.18,.4,[.13,.25,.31],step*.45);block(x+.16,.18+bob,z+.04,.29,.18,.4,[.13,.25,.31],-step*.45);
      block(x-.16,.12+bob,z+.23,.19,.055,.08,accent,0,.18);block(x+.16,.12+bob,z+.23,.19,.055,.08,accent,0,.18);
      if(isSelf)orb(x,2.72,z,.045,[.3,.96,.78],.35);humanPose=null
    }
    function worldPosition(x,z){return{x:(Number(x)-50)/42*5.6*ROOM_X,z:(Number(z)-67)/23*10.5*ROOM_Z}}
    function drawCraft(index,ship){const x=(index-(ships.length-1)/2)*2.45*ROOM_X,z=-21.2*ROOM_Z,y=2.95+index*.22,color=ship.class==='attack'?[.83,.39,.3]:ship.class==='freighter'?[.76,.58,.29]:[.35,.72,.78];block(x,y,z,.62,.36,1.5,color,index*.05,.1);block(x,y,z-.68,.22,.2,.7,[.46,.81,.84],index*.05,.2);block(x,y,z+.2,1.7,.09,.55,[.19,.37,.44],index*.05);orb(x,y,z+1.1,.1,[.98,.58,.29],.26)}
    function resize(){const rect=container.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.7),w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
    function cameraPointClear(x,y,z){return x> -23&&x<23&&z> -90&&z<90&&y>.3&&y<6.55}
    function segmentHitsBox(a,b,boxInfo){const c=Math.cos(boxInfo.yaw),s=Math.sin(boxInfo.yaw),local=point=>{const dx=point[0]-boxInfo.x,dz=point[2]-boxInfo.z;return[c*dx-s*dz,point[1]-boxInfo.y,s*dx+c*dz]},p=local(a),q=local(b),d=[q[0]-p[0],q[1]-p[1],q[2]-p[2]],h=[boxInfo.sx/2+.24,boxInfo.sy/2+.24,boxInfo.sz/2+.24];let low=0,high=1;for(let axis=0;axis<3;axis++){if(Math.abs(d[axis])<1e-6){if(p[axis]<-h[axis]||p[axis]>h[axis])return false;continue}let t1=(-h[axis]-p[axis])/d[axis],t2=(h[axis]-p[axis])/d[axis];if(t1>t2)[t1,t2]=[t2,t1];low=Math.max(low,t1);high=Math.min(high,t2);if(low>high)return false}return high>=0&&low<=1}
    function cameraPathClear(start,end){if(!cameraPointClear(...end))return false;for(const obstacle of roomCollision)if(segmentHitsBox(start,end,obstacle))return false;return true}
    function cameraBoom(px,pz){const start=[px,2.65,pz],sideX=Math.cos(heading)*2.4,sideZ=Math.sin(heading)*2.4,dx=-Math.sin(heading),dz=Math.cos(heading);for(let length=8.2;length>=1.15;length-=.25){const end=[px+dx*length+sideX,4.25,pz+dz*length+sideZ];if(cameraPathClear(start,end))return end}return[px,3.1,pz]}
    function render(now){if(!active)return;resize();const elapsed=Math.min(.05,(now-lastFrame)/1000||0);lastFrame=now;if(walkAmount)walkAmount=Math.max(0,walkAmount-elapsed*2.5);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.clearColor(.015,.035,.052,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const px=(player.x-50)/42*5.6*ROOM_X,pz=(player.z-67)/23*10.5*ROOM_Z,cosPitch=Math.cos(pitch),look=[Math.sin(heading)*cosPitch,Math.sin(pitch),-Math.cos(heading)*cosPitch],eye=cameraBoom(px,pz),target=[px+look[0]*2.7,1.45+look[1]*2.7,pz+look[2]*2.7];cameraEye=eye;cameraTarget=target;positionShipBoard();const view=lookAt(eye,target),projection=perspective(Math.PI*.34,canvas.width/canvas.height,.1,650);gl.uniformMatrix4fv(loc.view,false,view);gl.uniformMatrix4fv(loc.projection,false,projection);gl.uniform3fv(loc.eye,eye);meshes.length=0;meshes.push(...roomMeshes);[-3.2,4.1].forEach((gate,index)=>{const gateZ=gate*ROOM_Z,near=Math.abs(pz-gateZ)<8;doorBlend[index]=Math.max(0,Math.min(1,doorBlend[index]+(near?1:-1)*elapsed*2.4));const offset=3.15+6.35*doorBlend[index];for(const side of [-1,1]){const x=side*offset;block(x,2.85,gateZ,6.0,5.25,.24,[.075,.22,.29],0,.08);block(x,2.85,gateZ+side*.14,5.45,.035,.035,[.18,.76,.81],0,.3)}});for(const person of people){if(Number(person.id)===Number(window.crewSelfId))continue;const p=worldPosition(person.roomX,person.roomZ);drawHuman(p.x,p.z,colors[person.avatar]||[.45,.69,.8],false,0,Number(person.roomYaw)||0,person.avatar)}drawHuman(px,pz,colors[selfAvatar]||[.3,.85,.76],true,now/1000,heading,selfAvatar);
      for(const item of meshes){gl.bindBuffer(gl.ARRAY_BUFFER,item.shape.pb);gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,item.shape.nb);gl.enableVertexAttribArray(loc.n);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(loc.model,false,item.transform);gl.uniform3fv(loc.color,item.color);gl.uniform1f(loc.glow,item.glow);gl.drawArrays(gl.TRIANGLES,0,item.shape.count)}requestAnimationFrame(render)}
    let selfAvatar='sol-vale';
    function screenPoint(point){const forward=norm([cameraTarget[0]-cameraEye[0],cameraTarget[1]-cameraEye[1],cameraTarget[2]-cameraEye[2]]),right=norm(cross(forward,[0,1,0])),up=cross(right,forward),delta=[point[0]-cameraEye[0],point[1]-cameraEye[1],point[2]-cameraEye[2]],depth=dot(delta,forward);if(depth<=.1)return null;const tangent=Math.tan(Math.PI/6),aspect=canvas.width/canvas.height,nx=dot(delta,right)/(depth*tangent*aspect),ny=dot(delta,up)/(depth*tangent);return{x:(nx+1)*canvas.clientWidth/2,y:(1-ny)*canvas.clientHeight/2,visible:Math.abs(nx)<1.2&&Math.abs(ny)<1.2}}
    function positionShipBoard(){const leftTop=screenPoint([-5.86,6.935,-21.05]),rightTop=screenPoint([5.86,6.935,-21.05]),leftBottom=screenPoint([-5.86,3.365,-21.05]),rightBottom=screenPoint([5.86,3.365,-21.05]);if(!leftTop||!rightTop||!leftBottom||!rightBottom||![leftTop,rightTop,leftBottom,rightBottom].some(point=>point.visible)){shipBoard.style.display='none';return}const left=Math.min(leftTop.x,leftBottom.x,rightTop.x,rightBottom.x),right=Math.max(leftTop.x,leftBottom.x,rightTop.x,rightBottom.x),top=Math.min(leftTop.y,rightTop.y,leftBottom.y,rightBottom.y),bottom=Math.max(leftTop.y,rightTop.y,leftBottom.y,rightBottom.y);shipBoard.style.display='block';shipBoard.style.left=left+'px';shipBoard.style.top=top+'px';shipBoard.style.transform=`scale(${(right-left)/780},${(bottom-top)/300})`}
    canvas.addEventListener('click',event=>{const rect=canvas.getBoundingClientRect(),mx=event.clientX-rect.left,my=event.clientY-rect.top;let candidate=null,best=55;for(const person of people){if(Number(person.id)===Number(window.crewSelfId))continue;const p=worldPosition(person.roomX,person.roomZ),screen=screenPoint([p.x,1.2,p.z]);if(!screen?.visible)continue;const d=Math.hypot(screen.x-mx,screen.y-my);if(d<best){best=d;candidate=person}}if(candidate)onSelect(candidate)});
    function canOccupy(x,z){const p=worldPosition(x,z);if(p.x< -21.6||p.x>21.6||p.z< -91.2||p.z>90)return false;for(const gate of [-3.2,4.1])if(Math.abs(p.z-gate*ROOM_Z)<.9&&Math.abs(p.x)>6.0)return false;for(const localZ of [-8,0,8])for(const side of [-1,1]){const kioskX=side*5.35*ROOM_X,kioskZ=localZ*ROOM_Z;if(Math.abs(p.x-kioskX)<.85&&Math.abs(p.z-kioskZ)<1.05)return false}for(const localZ of [-13,0,13])for(const side of [-1,1])if(Math.abs(p.x-side*5.75*ROOM_X)<1.35&&Math.abs(p.z-localZ*ROOM_Z)<1.05)return false;for(let row=0;row<3;row++)for(const side of [-1,1])if(Math.abs(p.x-side*(4.2+row*.72)*ROOM_X)<.72&&Math.abs(p.z-(13.4+row*.55)*ROOM_Z)<.85)return false;return true}
    function canMove(fromX,fromZ,toX,toZ){const from=worldPosition(fromX,fromZ),to=worldPosition(toX,toZ);for(const gate of [-3.2,4.1]){const gateWorldZ=gate*ROOM_Z,fromSide=from.z-gateWorldZ,toSide=to.z-gateWorldZ;if(fromSide*toSide<=0&&Math.abs(toSide-fromSide)>.001){const t=Math.max(0,Math.min(1,-fromSide/(toSide-fromSide))),crossingX=from.x+(to.x-from.x)*t;if(Math.abs(crossingX)>6.0)return false}}return canOccupy(toX,toZ)}
    return{update(data){people=data.occupants||[];ships=data.ships||[];refreshShipBoard(ships);station=data.station?.name||station;const me=people.find(p=>Number(p.id)===Number(data.selfId));if(me)selfAvatar=me.avatar||selfAvatar},setPlayerPosition(x,z){player={x:Number(x)||50,z:Number(z)||67};walkAmount=1},getWorldPosition:worldPosition,canOccupy,canMove,getHeading(){return heading},rotate(yawDelta=0,pitchDelta=0){heading=(heading+yawDelta+Math.PI*3)%(Math.PI*2)-Math.PI;pitch=Math.max(-.72,Math.min(.72,pitch+pitchDelta))},setActive(value){const next=!!value;if(next===active)return;active=next;if(active){lastFrame=performance.now();requestAnimationFrame(render)}},onSelect(callback){onSelect=callback}};
  };
})();
