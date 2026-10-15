(function(){
  window.createPassengerCabinScene3D = function(container){
    const canvas = document.createElement('canvas');
    canvas.className = 'crew-3d-canvas passenger-cabin-canvas';
    canvas.setAttribute('aria-label','Cabine 3D de passageiros');
    container.prepend(canvas);

    let runtime = null;
    let active = false;
    let currentData = {};
    let yaw = 0;
    let pitch = 0.08;
    let onSelect = ()=>{};
    const queuedPosition = {x:50,z:88};

    function clamp(value,min,max){ return Math.max(min,Math.min(max,value)); }
    function mapRoom(roomX, roomZ){
      const x = ((Number(roomX)-50)/42) * 3.45;
      const z = 6.8 - ((Number(roomZ)-27.1)/192.9) * 8.4;
      return {x, z};
    }

    async function initialize(){
      let THREE, lastError;
      for(const url of [
        'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js',
        'https://unpkg.com/three@0.161.0/build/three.module.js'
      ]){
        try{ THREE = await import(url); break; }catch(error){ lastError = error; }
      }
      if(!THREE) throw lastError || new Error('Three.js indisponível');

      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020913);

      const camera = new THREE.PerspectiveCamera(63, width/height, 0.05, 280);
      const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
      renderer.setSize(width,height,false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.22;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const clock = new THREE.Clock();
      let frameHandle = 0;
      let renderActive = false;
      let lastMoveAt = 0;
      let walkPhase = 0;
      let selfHeadingLoaded = false;
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const remoteAvatars = new Map();
      const obstacles = [];

      const palette = {
        shell:0x1d2b39,
        panel:0x243b4b,
        trim:0x5b7b90,
        floor:0x253748,
        floorDark:0x15202d,
        seat:0x394a59,
        black:0x08111b,
        cyan:0x48d7ff,
        orange:0xffb163,
        glass:0x86dbff,
        cargo:0x78653b,
        cargo2:0x2b333e
      };
      function mat(color, metal=.55, rough=.42){ return new THREE.MeshStandardMaterial({color, metalness:metal, roughness:rough}); }
      function glow(color, intensity=2){ return new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:intensity, metalness:.18, roughness:.28}); }
      const M = {
        shell: mat(palette.shell,.72,.34),
        panel: mat(palette.panel,.64,.35),
        trim: mat(palette.trim,.8,.27),
        floor: mat(palette.floor,.62,.28),
        floorDark: mat(palette.floorDark,.42,.46),
        seat: mat(palette.seat,.32,.56),
        black: mat(palette.black,.35,.5),
        cargo: mat(palette.cargo,.54,.48),
        cargo2: mat(palette.cargo2,.72,.34),
        cyan: glow(palette.cyan,2.35),
        orange: glow(palette.orange,2.15)
      };

      function box(x,y,z,w,h,d,material,parent=scene,shadow=true){
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
        mesh.position.set(x,y,z);
        mesh.castShadow = shadow;
        mesh.receiveShadow = shadow;
        parent.add(mesh);
        return mesh;
      }
      function plane(x,y,z,w,h,material,parent=scene){
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), material);
        mesh.position.set(x,y,z);
        parent.add(mesh);
        return mesh;
      }
      function tube(a,b,r,material,parent=scene,seg=10){
        const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(B),seg), material);
        mesh.position.copy(A).add(B).multiplyScalar(.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), B.clone().sub(A).normalize());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
      }
      function pointLight(x,y,z,color,intensity,range){
        const l = new THREE.PointLight(color,intensity,range,2);
        l.position.set(x,y,z);
        scene.add(l);
        return l;
      }
      function collider(minX,maxX,minZ,maxZ){ obstacles.push({minX,maxX,minZ,maxZ}); }
      function canOccupy(roomX, roomZ){
        const p = mapRoom(roomX, roomZ);
        const radius = .38;
        if(p.x < -3.55+radius || p.x > 3.55-radius || p.z < -1.45+radius || p.z > 7.15-radius) return false;
        if(Math.abs(p.x) > 1.35 && p.z > -0.5 && p.z < 5.75) return false;
        for(const o of obstacles){
          const cx = Math.max(o.minX, Math.min(p.x, o.maxX));
          const cz = Math.max(o.minZ, Math.min(p.z, o.maxZ));
          if((p.x-cx)**2 + (p.z-cz)**2 < radius*radius) return false;
        }
        return true;
      }

      const envCanvas = document.createElement('canvas');
      envCanvas.width = 1024; envCanvas.height = 512;
      const envCtx = envCanvas.getContext('2d');
      const envGrad = envCtx.createLinearGradient(0,0,0,512);
      envGrad.addColorStop(0,'#09131d');
      envGrad.addColorStop(.32,'#617998');
      envGrad.addColorStop(.55,'#102030');
      envGrad.addColorStop(1,'#070c14');
      envCtx.fillStyle = envGrad;
      envCtx.fillRect(0,0,1024,512);
      for(let i=0;i<36;i++){
        envCtx.fillStyle = i%5===0 ? 'rgba(255,183,108,.75)' : 'rgba(118,212,255,.58)';
        envCtx.fillRect(Math.random()*1024, 90 + Math.random()*260, 2 + Math.random()*12, 10 + Math.random()*54);
      }
      const envTex = new THREE.CanvasTexture(envCanvas);
      envTex.mapping = THREE.EquirectangularReflectionMapping;
      envTex.colorSpace = THREE.SRGBColorSpace;
      scene.environment = envTex;

      scene.add(new THREE.HemisphereLight(0x8fd6ff,0x09131f,1.75));
      const sun = new THREE.DirectionalLight(0xc8ebff,1.95);
      sun.position.set(-2,7,3);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048,2048);
      sun.shadow.camera.left = -15;
      sun.shadow.camera.right = 15;
      sun.shadow.camera.top = 15;
      sun.shadow.camera.bottom = -15;
      sun.shadow.bias = -0.00015;
      sun.shadow.normalBias = .03;
      scene.add(sun);
      pointLight(0,6.1,0,0x2ea7ff,18,24);
      pointLight(0,2.5,-4.4,0xffb56c,10,10);

      const starsCanvas = document.createElement('canvas');
      starsCanvas.width = 2048; starsCanvas.height = 1024;
      const sc = starsCanvas.getContext('2d');
      const bg = sc.createLinearGradient(0,0,2048,1024);
      bg.addColorStop(0,'#020612');
      bg.addColorStop(.55,'#031024');
      bg.addColorStop(1,'#01040c');
      sc.fillStyle = bg; sc.fillRect(0,0,2048,1024);
      for(let i=0;i<1200;i++){
        const x=Math.random()*2048, y=Math.random()*1024, r=Math.random()<.03?1.6+Math.random()*1.7:.2+Math.random()*0.9;
        sc.beginPath();
        sc.fillStyle = Math.random()<.12 ? `rgba(255,205,152,${.3+Math.random()*.7})` : `rgba(205,235,255,${.35+Math.random()*.65})`;
        sc.arc(x,y,r,0,Math.PI*2); sc.fill();
      }
      const neb = sc.createRadialGradient(1280,360,10,1280,360,280);
      neb.addColorStop(0,'rgba(93,137,255,.18)');
      neb.addColorStop(1,'rgba(93,137,255,0)');
      sc.fillStyle = neb; sc.fillRect(980,60,620,560);
      const starsTex = new THREE.CanvasTexture(starsCanvas);
      starsTex.colorSpace = THREE.SRGBColorSpace;
      const spaceBackdrop = plane(0,2.9,-16.3,18,8.2,new THREE.MeshBasicMaterial({map:starsTex, toneMapped:false}));

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(2.2,36,24),
        new THREE.MeshStandardMaterial({color:0x688bc0, emissive:0x214667, emissiveIntensity:.35, roughness:.9, metalness:0})
      );
      planet.position.set(-4.8,1.8,-13.6);
      scene.add(planet);
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(2.34,36,24),
        new THREE.MeshBasicMaterial({color:0x8edbff, transparent:true, opacity:.12, side:THREE.BackSide})
      );
      atmosphere.position.copy(planet.position);
      scene.add(atmosphere);
      const asteroidGeom = new THREE.IcosahedronGeometry(.28,0);
      for(let i=0;i<18;i++){
        const rock = new THREE.Mesh(asteroidGeom, mat(0x4e5967,.22,.88));
        rock.position.set(-1 + Math.random()*8, 1.3 + Math.random()*3.2, -12.6 - Math.random()*3.6);
        const s = .45 + Math.random()*.8;
        rock.scale.setScalar(s);
        rock.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
        scene.add(rock);
      }

      const room = new THREE.Group();
      scene.add(room);
      // floor
      box(0,-.2,1.2,8.6,.4,18.8,M.floorDark,room);
      for(let row=0; row<8; row++){
        for(let col=0; col<5; col++){
          const x = (col-2)*1.54;
          const z = (row-3.5)*2.05 + .7;
          box(x,.02,z,1.36,.06,1.82,M.floor,room,false);
          box(x,.055,z,1.28,.01,1.74,M.black,room,false);
        }
      }
      for(const x of [-1.12,1.12]){
        box(x,.09,1.1,.09,.03,14.8,M.orange,room,false);
      }
      for(let z=-5.3; z<=7; z+=1.95){
        box(0,.088,z,.06,.03,1.12,M.cyan,room,false);
      }

      // walls and ceiling
      for(const side of [-1,1]){
        const x = side*4.18;
        box(x,2.4,1.1,.38,5.2,18.1,M.shell,room);
        box(side*3.9,2.65,1.1,.08,4.55,17.1,M.panel,room);
        for(let z=-5.6; z<7.2; z+=2.25){
          box(side*3.74,2.5,z,.18,4.3,.18,M.trim,room);
          box(side*3.55,2.55,z,.04,3.2,.05, side<0?M.orange:M.cyan,room,false);
        }
        box(side*3.76,.8,1.1,.1,.1,16.4,M.orange,room,false);
        box(side*3.76,4.35,1.1,.1,.1,16.2,M.cyan,room,false);
      }
      box(0,5.0,1.1,8.55,.22,18.1,M.shell,room,false);
      for(let z=-5.5; z<7.5; z+=2.2){
        box(0,4.66,z,7.5,.18,.22,M.trim,room,false);
        box(0,4.53,z,5.2,.05,.05, z%4 ? M.cyan : M.orange,room,false);
      }
      for(const x of [-2.8,0,2.8]){
        for(let z=-5.3; z<7.1; z+=3.1){
          box(x,4.8,z,.95,.08,1.45,M.black,room,false);
          box(x,4.72,z,.54,.05,1.12, x===0 ? M.cyan : M.orange,room,false);
        }
      }

      // cargo boxes
      function cargoStack(x,z,flip=1){
        const g = new THREE.Group(); g.position.set(x,0,z); room.add(g);
        box(0,.52,0,1.45,1.04,1.45,M.cargo2,g);
        box(0,1.32,.12,1.1,.56,1.08,M.cargo,g);
        box(0,.98,.76,.86,.18,.12,M.orange,g,false);
        for(const sx of [-.52,.52]){
          box(sx,.52,.72,.16,.18,.12,M.cyan,g,false);
          box(sx,.52,-.72,.16,.18,.12,M.cyan,g,false);
        }
        collider(x-0.95,x+0.95,z-0.95,z+0.95);
      }
      cargoStack(-3.0,6.0);
      cargoStack(3.0,6.0);
      box(0,.6,6.65,1.8,1.2,1.2,M.cargo2,room);
      collider(-1.15,1.15,6.0,7.15);

      // side passenger seats
      function sideSeat(x,z,side){
        const g = new THREE.Group();
        g.position.set(x,0,z); g.rotation.y = side<0 ? Math.PI/2 : -Math.PI/2; room.add(g);
        box(0,.42,0,1.1,.2,.85,M.trim,g);
        box(0,.56,-.05,.96,.12,.74,M.seat,g);
        box(0,1.02,.29,1.08,.9,.16,M.shell,g);
        box(0,1.05,.22,.88,.46,.08,M.panel,g);
        for(const s of [-.42,.42]) box(s,.28,0,.12,.56,.6,M.trim,g);
        box(0,.42,-.42,.92,.05,.05,M.orange,g,false);
      }
      const seatZ = [-3.6,-.8,2.0];
      seatZ.forEach(z=>{ sideSeat(-2.75,z,-1); sideSeat(2.75,z,1); });

      // cockpit/front frame
      box(0,2.7,-7.2,7.8,4.8,.34,M.shell,room);
      box(-3.88,2.7,-7.0,.3,4.5,.68,M.trim,room);
      box(3.88,2.7,-7.0,.3,4.5,.68,M.trim,room);
      box(0,4.85,-7.0,8.05,.42,.68,M.trim,room);
      box(0,.75,-7.0,8.05,1.2,.68,M.shell,room);
      const wind = new THREE.Mesh(
        new THREE.PlaneGeometry(7.2,4.0),
        new THREE.MeshPhysicalMaterial({color:0x5ca6c8, roughness:.05, metalness:.08, transparent:true, opacity:.08, side:THREE.DoubleSide, depthWrite:false})
      );
      wind.position.set(0,2.9,-6.64); room.add(wind);
      for(const x of [-2.45,0,2.45]) box(x,2.95,-6.82,.08,3.9,.08,M.trim,room,false);

      // pilot consoles and seat
      function cockpitConsole(x){
        const g = new THREE.Group(); g.position.set(x,.2,-4.9); room.add(g);
        box(0,.7,0,1.45,1.1,1.2,M.shell,g);
        box(0,1.28,-.1,1.2,.12,.95,M.trim,g,false);
        const screenCanvas = document.createElement('canvas'); screenCanvas.width=512; screenCanvas.height=256;
        const c = screenCanvas.getContext('2d');
        c.fillStyle='#04111f'; c.fillRect(0,0,512,256);
        c.strokeStyle='#38c9ff'; c.lineWidth=2; c.strokeRect(10,10,492,236);
        c.fillStyle='#75e8ff'; c.font='bold 18px monospace'; c.fillText('NAVEGACAO',24,34);
        c.strokeStyle='rgba(91,224,255,.42)';
        for(let i=0;i<8;i++){ c.strokeRect(28+i*54,62,38,38); }
        c.beginPath(); c.arc(395,134,52,0,Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(342,134); c.lineTo(448,134); c.moveTo(395,82); c.lineTo(395,186); c.stroke();
        c.fillStyle='#ffb56a'; c.fillRect(26,196,160,10);
        c.fillStyle='#5cd4ff'; c.fillRect(26,214,110,8);
        const tex = new THREE.CanvasTexture(screenCanvas); tex.colorSpace = THREE.SRGBColorSpace;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.08,.56), new THREE.MeshBasicMaterial({map:tex, toneMapped:false}));
        screen.position.set(0,1.31,.39); screen.rotation.x = -0.22; g.add(screen);
      }
      cockpitConsole(-1.75);
      cockpitConsole(1.75);
      box(0,.65,-4.95,2.05,.22,1.65,M.shell,room);
      box(0,.96,-4.35,3.8,.1,.3,M.orange,room,false);

      const pilotSeat = new THREE.Group(); pilotSeat.position.set(0,0,-3.6); room.add(pilotSeat);
      box(0,.58,0,.95,1.16,.85,M.seat,pilotSeat);
      box(0,1.32,.22,.92,1.42,.18,M.shell,pilotSeat);
      box(0,1.0,-.28,.62,.18,.32,M.trim,pilotSeat,false);
      for(const x of [-.36,.36]) box(x,.34,0,.12,.68,.12,M.trim,pilotSeat);
      collider(-.8,.8,-4.6,-2.9);

      // decorative extinguisher and crates rails
      box(-3.35,1.85,-1.65,.22,1.05,.22,mat(0xb52924,.22,.54),room);
      box(-3.35,2.45,-1.65,.14,.16,.14,mat(0xd4d4d4,.2,.45),room,false);
      tube([3.2,.3,5.2],[3.2,.3,7.1],.05,M.trim,room);
      tube([-3.2,.3,5.2],[-3.2,.3,7.1],.05,M.trim,room);

      // avatar helpers
      const avatarMaterials = new Map();
      const avatarHelpers = {
        box,
        tube,
        mat:(color,metal=.42,rough=.47)=>{ const key=`${color}:${metal}:${rough}`; if(!avatarMaterials.has(key)) avatarMaterials.set(key,mat(color,metal,rough)); return avatarMaterials.get(key); },
        glow:(color,power=1.8)=>{ const key=`glow:${color}:${power}`; if(!avatarMaterials.has(key)) avatarMaterials.set(key,glow(color,power)); return avatarMaterials.get(key); }
      };
      function avatarIndex(code){
        const list = ['captain','pilot','engineer','medic','security','navigator','scientist','comms','mechanic','cadet'];
        const index = list.indexOf(String(code||''));
        return index < 0 ? 0 : index;
      }
      function createSimpleFallback(group){
        const root = new THREE.Group();
        group.add(root);
        box(0,.95,0,.58,.8,.34,mat(0x244b64,.2,.55),root);
        box(0,1.55,0,.45,.42,.32,mat(0xd7b293,.05,.95),root);
        box(0,.4,0,.75,.16,.42,mat(0x173348,.2,.62),root);
        return {root, visual:root, arms:[], legs:[], index:0};
      }
      function applyAvatar(group, code, isSelf){
        const desired = avatarIndex(code);
        const old = group.userData.crewModel;
        if(old && old.index === desired) return old;
        if(old){ group.remove(old.root); old.root.traverse(obj=>{ if(obj.geometry) obj.geometry.dispose?.(); }); }
        let model;
        if(typeof window.createCrewAvatarModel === 'function'){
          model = window.createCrewAvatarModel(THREE, desired, group, avatarHelpers);
        }else{
          model = createSimpleFallback(group);
        }
        group.userData.crewModel = model;
        if(isSelf){
          selfModel = model;
          arms = model.arms || [];
          legs = model.legs || [];
          visual = model.visual || model.root;
          currentAvatarCode = code;
        }
        return model;
      }

      const selfAvatar = new THREE.Group();
      selfAvatar.position.set(0,0,2.8); room.add(selfAvatar);
      const selfShadow = new THREE.Mesh(new THREE.CircleGeometry(.52,28), new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false}));
      selfShadow.rotation.x = -Math.PI/2; selfShadow.position.y = .03; selfAvatar.add(selfShadow);
      const selfFootLight = new THREE.PointLight(0x4ce8e2,.85,1.8,2); selfFootLight.position.set(0,.4,-.22); selfAvatar.add(selfFootLight);
      let selfModel = null, visual = null, arms = [], legs = [], currentAvatarCode = 'captain';
      applyAvatar(selfAvatar,'captain',true);

      const pilotAvatar = new THREE.Group();
      pilotAvatar.position.set(0,0,-3.68); room.add(pilotAvatar);
      applyAvatar(pilotAvatar,'pilot',false);
      if(pilotAvatar.userData.crewModel?.visual) pilotAvatar.userData.crewModel.visual.rotation.y = Math.PI;
      pilotAvatar.rotation.y = Math.PI;

      function syncPeople(data){
        const seen = new Set();
        const occupants = data.passenger?.occupants || data.occupants || [];
        const selfId = Number(data.selfId);
        for(const person of occupants){
          const id = Number(person.id);
          const code = person.avatar || 'captain';
          if(id === selfId){
            if(avatarIndex(code) !== avatarIndex(currentAvatarCode)) applyAvatar(selfAvatar, code, true);
            if(!selfHeadingLoaded){ yaw = Number(person.roomYaw)||0; selfAvatar.rotation.y = yaw; selfHeadingLoaded = true; }
            continue;
          }
          seen.add(id);
          let remote = remoteAvatars.get(id);
          if(!remote){
            remote = new THREE.Group(); room.add(remote); remoteAvatars.set(id,remote);
          }
          applyAvatar(remote, code, false);
          remote.userData.crewPerson = person;
          remote.userData.target = mapRoom(Number(person.roomX)||50, Number(person.roomZ)||88);
          remote.userData.roomYaw = Number(person.roomYaw)||0;
        }
        for(const [id,remote] of remoteAvatars){
          if(!seen.has(id)){
            room.remove(remote);
            remote.traverse(obj=>{ if(obj.geometry) obj.geometry.dispose?.(); });
            remoteAvatars.delete(id);
          }
        }
      }

      function update(data){
        currentData = data || {};
        syncPeople(currentData);
        const p = currentData.passenger || {};
        const pilotCode = p.pilotAvatar || p.pilotRole || 'pilot';
        applyAvatar(pilotAvatar, pilotCode, false);
        pilotAvatar.rotation.y = Math.PI;
        if(pilotAvatar.userData.crewModel?.visual) pilotAvatar.userData.crewModel.visual.rotation.y = Math.PI;
      }

      function setPlayerPosition(roomX, roomZ){
        const p = mapRoom(roomX, roomZ);
        const dx = p.x - selfAvatar.position.x;
        const dz = p.z - selfAvatar.position.z;
        if(Math.hypot(dx,dz) > .002){
          lastMoveAt = performance.now();
          yaw = Math.atan2(-dx,-dz);
        }
        selfAvatar.position.set(p.x, 0, p.z);
      }

      function rotateCamera(dt){
        const forward = new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
        const aim = selfAvatar.position.clone().add(new THREE.Vector3(0,1.24+pitch*.35,0)).addScaledVector(forward,2.8);
        const desired = selfAvatar.position.clone().addScaledVector(forward,-4.7);
        desired.y = 2.72 + pitch*2.7;
        desired.x = clamp(desired.x,-2.8,2.8);
        desired.z = clamp(desired.z,1.5,8.8);
        camera.position.lerp(desired, 1-Math.exp(-8.5*dt));
        camera.lookAt(aim);
        selfAvatar.rotation.y = yaw;
      }

      function resize(){
        const r = container.getBoundingClientRect();
        const w = Math.max(1,r.width), h = Math.max(1,r.height);
        renderer.setSize(w,h,false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
        camera.aspect = w/h;
        camera.updateProjectionMatrix();
      }

      function frame(){
        if(!renderActive) return;
        frameHandle = requestAnimationFrame(frame);
        const dt = Math.min(clock.getDelta()||.016,.05);
        const now = clock.elapsedTime;
        const moving = performance.now() - lastMoveAt < 110;
        walkPhase += dt*9.2;
        if(visual) visual.position.y = moving ? Math.abs(Math.sin(walkPhase))*.056 : Math.sin(now*1.6)*.01;
        arms.forEach(({part,s})=>{ if(part) part.rotation.x = moving ? Math.sin(walkPhase + s*Math.PI/2 + Math.PI/2)*.42 : Math.sin(now*1.3+s)*.025; });
        legs.forEach(({part,s})=>{ if(part) part.rotation.x = moving ? Math.sin(walkPhase + (s>0?Math.PI:0))*.4 : 0; });
        for(const remote of remoteAvatars.values()){
          const target = remote.userData.target;
          if(target) remote.position.lerp(new THREE.Vector3(target.x,0,target.z), 1-Math.exp(-10*dt));
          remote.rotation.y = remote.userData.roomYaw || 0;
        }
        rotateCamera(dt);
        renderer.render(scene,camera);
      }

      function setActive(value){
        if(renderActive === !!value) return;
        renderActive = !!value;
        if(renderActive){ resize(); camera.position.set(0,2.8,8.2); clock.start(); frameHandle = requestAnimationFrame(frame); }
        else if(frameHandle) cancelAnimationFrame(frameHandle);
      }

      function rotate(yawDelta=0,pitchDelta=0){
        yaw = (yaw + yawDelta + Math.PI*3)%(Math.PI*2)-Math.PI;
        pitch = clamp(pitch + pitchDelta, -0.32, .4);
      }

      function selectPerson(event){
        const rect = canvas.getBoundingClientRect();
        pointer.set(((event.clientX-rect.left)/rect.width)*2-1, -((event.clientY-rect.top)/rect.height)*2+1);
        raycaster.setFromCamera(pointer,camera);
        const hit = raycaster.intersectObjects([...remoteAvatars.values()], true)[0];
        if(!hit) return;
        let obj = hit.object;
        while(obj && !obj.userData.crewPerson) obj = obj.parent;
        if(objá.userData?.crewPerson) onSelect(obj.userData.crewPerson);
      }
      canvas.addEventListener('click', selectPerson);
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      return {
        update,
        setPlayerPosition,
        getHeading(){ return yaw; },
        rotate,
        setActive,
        canOccupy,
        canMove(fromX,fromZ,toX,toZ){ return canOccupy(toX,toZ); },
        onSelect(callback){ onSelect = callback; }
      };
    }

    const ready = initialize().then(instance=>{
      runtime = instance;
      runtime.setPlayerPosition(queuedPosition.x, queuedPosition.z);
      runtime.update(currentData);
      runtime.setActive(active);
    }).catch(error=>{
      console.error('Falha ao carregar a cabine 3D de passageiros:', error);
      const fallback = document.createElement('div');
      fallback.className = 'crew-3d-fallback';
      fallback.textContent = 'Nao foi possivel carregar a cabine 3D. Verifique a conexao com o CDN.';
      container.prepend(fallback);
    });

    return {
      update(data){ currentData = data || {}; if(runtime) runtime.update(currentData); },
      setPlayerPosition(x,z){ queuedPosition.x = Number(x)||50; queuedPosition.z = Number(z)||88; if(runtime) runtime.setPlayerPosition(queuedPosition.x, queuedPosition.z); },
      getHeading(){ return runtime ? runtime.getHeading() : yaw; },
      rotate(yawDelta=0,pitchDelta=0){ yaw = (yaw + yawDelta + Math.PI*3)%(Math.PI*2)-Math.PI; pitch = clamp(pitch + pitchDelta, -0.32, .4); runtime?.rotate(yawDelta,pitchDelta); },
      setActive(value){ active = !!value; runtime?.setActive(active); },
      canOccupy(x,z){ return runtime ? runtime.canOccupy(x,z) : true; },
      canMove(fromX,fromZ,toX,toZ){ return runtime ? runtime.canMove(fromX,fromZ,toX,toZ) : true; },
      onSelect(callback){ onSelect = callback; runtime?.onSelect(callback); }
    };
  };
})();
