(function(){
  const CREW=[
    {id:'captain',name:'Capitao',role:'Comando da estacao',body:0x18233e,secondary:0x111a31,pants:0x172137,trim:0xe6b75a,skin:0xc59276,hair:0x40404a,type:'male'},
    {id:'pilot',name:'Piloto',role:'Navegacao de voo',body:0xe6672d,secondary:0x252e38,pants:0xdc612a,trim:0xffc073,skin:0xe6b29a,hair:0x201d27,type:'female'},
    {id:'engineer',name:'Engenheiro',role:'Sistemas e reparos',body:0x627650,secondary:0xb28a4b,pants:0x8a7a4d,trim:0xe6ba62,skin:0xca956c,hair:0x593628,type:'male'},
    {id:'medic',name:'Medica',role:'Saude da tripulacao',body:0xf2eff0,secondary:0xd63445,pants:0xeeedf1,trim:0xd73c4c,skin:0xf0c9b0,hair:0xe4c17c,type:'female'},
    {id:'security',name:'Seguranca',role:'Protecao e vigilancia',body:0x2d303a,secondary:0x545563,pants:0x242832,trim:0xdb444a,skin:0x784938,hair:0x18161b,type:'male'},
    {id:'navigator',name:'Navegadora',role:'Mapas e trajetorias',body:0x233452,secondary:0xf2dfba,pants:0x222f48,trim:0xe9b65f,skin:0xe5b59a,hair:0x151927,type:'female'},
    {id:'scientist',name:'Cientista',role:'Pesquisa orbital',body:0xe5ebf1,secondary:0x323d49,pants:0x343d49,trim:0x75c4df,skin:0xc99076,hair:0xaab6bc,type:'male'},
    {id:'comms',name:'Comunicacoes',role:'Operacao de sinais',body:0x563472,secondary:0x222437,pants:0x33283e,trim:0xbc6bfa,skin:0xd89b89,hair:0x8537a2,type:'female'},
    {id:'mechanic',name:'Mecanico',role:'Manutencao pesada',body:0xc89a45,secondary:0x3e4149,pants:0x80623e,trim:0xf0ae4f,skin:0x6d92c4,hair:0x3d4c63,type:'alien'},
    {id:'cadet',name:'Cadete',role:'Treinamento espacial',body:0xf0f1f2,secondary:0xeda331,pants:0xececf0,trim:0xeab046,skin:0xefbd9d,hair:0x543322,type:'young'}
  ];
  window.createCrewAvatarModel=function(THREE,index,parent,helpers){
    const {box,tube,mat,glow}=helpers;
    const d=CREW[Number.isInteger(index)&&index>=0&&index<CREW.length?index:0];
    const avatarRoot=new THREE.Group();parent.add(avatarRoot);
    const g=new THREE.Group();avatarRoot.add(g);
    let faceHead=null,rigArms=[],rigLegs=[],fxMeshes=[];
    function ell(x,y,z,rx,ry,rz,material,target,quality=12){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,quality,Math.max(8,Math.floor(quality*.78))),material);mesh.scale.set(rx,ry,rz);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;target.add(mesh);return mesh}
    function cyl(x,y,z,rt,rb,h,material,target,segments=9){const a=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);a.position.set(x,y,z);a.castShadow=true;target.add(a);return a}
    function ring(x,y,z,r,thick,material,target){const m=new THREE.Mesh(new THREE.TorusGeometry(r,thick,5,24),material);m.position.set(x,y,z);target.add(m);return m}
    function coatPanel(x,y,z,w,h,d,material,target,rot=0){const m=box(x,y,z,w,h,d,material,target);m.rotation.z=rot;return m}
    function patchCross(target,x,y,z,size,red){box(x,y,z,size*.29,size,.018,red,target,false);box(x,y,z,size,size*.29,.023,red,target,false)}
    let wide=d.type==='alien'?1.22:d.id==='security'?1.08:d.id==='engineer'?1.10:d.type==='young'?.85:d.type==='female'?.90:1;
    const ht=d.type==='alien'?1.09:d.type==='young'?.88:d.id==='security'?1.075:1;
    g.scale.set(wide,ht,wide>1?1.07:.96);
    rigArms=[];rigLegs=[];fxMeshes=[];
    const primary=mat(d.body,.26,.67),secondary=mat(d.secondary,.2,.69),trousers=mat(d.pants,.27,.65),trim=mat(d.trim,.32,.43);
    const skin=mat(d.skin,.02,.83),hair=mat(d.hair,.08,.80),sole=mat(0x161f2b,.3,.68);
    const steel=mat(0x8899aa,.73,.27),charcoal=mat(0x202735,.35,.44),ivory=mat(0xf5f4e9,.15,.72);
    const gold=mat(0xe8b65d,.66,.33),red=mat(0xd92b46,.35,.5),lilac=glow(0xb46bff,.7),holo=glow(0x61dfff,.6);
    const bodyWidth=d.type==='female'?.385:d.type==='alien'?.52:.445;
    const uniformTop=d.id==='engineer'?primary:d.id==='navigator'?primary:primary;
    // Corpo em volumes orgÃ¢nicos sobrepostos, com cotovelos e joelhos animados.
    ell(0,1.42,0,bodyWidth,.50,.25,uniformTop,g,16);
    ell(0,1.09,.012,.35,.24,.235,d.id==='medic'?primary:secondary,g);
    ell(0,1.02,0,.34,.12,.22,secondary,g);
    box(0,1.045,-.227,.70,.105,.07,charcoal,g);
    box(0,1.045,-.274,.115,.15,.04,steel,g,false);
    for(const s of [-1,1]){
      box(s*.235,1.045,-.271,.07,.09,.03,trim,g,false);
      const leg=new THREE.Group();leg.position.set(s*.19,1.00,.015);g.add(leg);rigLegs.push({part:leg,s});
      ell(0,-.245,.01,.185,.32,.20,trousers,leg);
      ell(0,-.59,-.002,.17,.29,.172,trousers,leg);
      ell(0,-.81,-.005,.17,.22,.175,secondary,leg);
      ell(0,-.90,-.09,.20,.103,.29,sole,leg);
      box(0,-.82,-.187,.32,.12,.033,trim,leg,false);
      const arm=new THREE.Group();arm.position.set(s*(bodyWidth+.075),1.69,0);g.add(arm);rigArms.push({part:arm,s});
      ell(0,-.07,0,.20,.18,.225,secondary,arm);
      ell(s*.018,-.28,0,.15,.27,.163,primary,arm);
      ell(s*.015,-.52,-.002,.131,.235,.145,primary,arm);
      box(0,-.585,-.105,.25,.095,.23,secondary,arm);
      ell(0,-.745,-.012,.12,.125,.13,skin,arm);
      box(0,-.584,-.172,.13,.057,.03,trim,arm,false);
    }
    // ClavÃ­cula, pescoÃ§o, cabeÃ§a, olhos, sobrancelhas, boca e orelhas.
    ell(0,1.775,0,.29,.14,.24,primary,g);
    cyl(0,1.855,0,.115,.135,.25,skin,g);
    faceHead=new THREE.Group();faceHead.position.set(0,2.075,-.008);g.add(faceHead);
    ell(0,.012,0,.264,.322,.265,skin,faceHead,18);
    ell(0,-.14,-.052,.212,.173,.210,skin,faceHead,14);
    for(const s of [-1,1]){
      ell(s*.259,-.021,0,.059,.09,.052,skin,faceHead,10);
      ell(s*.107,.023,-.248,.066,.047,.035,ivory,faceHead,10);
      ell(s*.107,.021,-.277,.025,.030,.015,charcoal,faceHead,9);
      coatPanel(s*.107,.112,-.261,.127,.021,.018,hair,faceHead,s*.085);
    }
    ell(0,-.066,-.274,.061,.083,.055,skin,faceHead,10);
    box(0,-.16,-.269,.119,.014,.012,mat(0x734b48,.05,.88),faceHead,false);
    // Diferentes cabelos e rostos da equipe.
    if(d.id==='captain'||d.id==='engineer'){
      ell(0,.236,.035,.284,.16,.269,hair,faceHead);
      for(let i=0;i<5;i++){const xx=(i-2)*.103;ell(xx,.322,-.11,.079,.092,.087,hair,faceHead,9)}
      ell(0,-.188,-.13,.20,.095,.154,hair,faceHead);
      ell(-.205,-.13,-.035,.06,.134,.085,hair,faceHead);
      ell(.205,-.13,-.035,.06,.134,.085,hair,faceHead);
      if(d.id==='captain')for(const s of [-1,1])ell(s*.20,.17,.07,.095,.16,.16,hair,faceHead);
    }else if(d.id==='security'){
      ell(0,-.173,-.124,.18,.085,.12,hair,faceHead); // barba curta
    }else if(d.id==='scientist'){
      ell(0,.245,.09,.271,.126,.22,hair,faceHead);
      for(const s of [-1,1])ell(s*.227,.117,.026,.086,.21,.12,hair,faceHead);
      ell(0,-.174,-.135,.205,.13,.13,hair,faceHead);
      const glasses=mat(0x596778,.62,.25);
      for(const s of [-1,1])ring(s*.115,.032,-.283,.097,.012,glasses,faceHead);
      box(0,.042,-.297,.07,.014,.016,glasses,faceHead,false);
    }else if(d.id==='medic'||d.id==='navigator'){
      ell(0,.25,.035,.28,.15,.272,hair,faceHead);
      ell(0,.325,.20,.18,.19,.16,hair,faceHead);
      for(const s of [-1,1])ell(s*.21,.105,-.015,.075,.16,.13,hair,faceHead);
      if(d.id==='medic')ell(0,.38,.22,.16,.14,.14,hair,faceHead);
    }else if(d.id==='comms'){
      ell(0,.243,.023,.29,.157,.27,hair,faceHead);
      ell(.215,.08,-.022,.11,.24,.13,hair,faceHead);
      ell(-.21,.086,-.018,.09,.21,.13,hair,faceHead);
      ell(-.14,.226,-.186,.13,.115,.095,hair,faceHead);
      const phones=mat(0x353349,.2,.5),accent=glow(0xb862ff,.65);
      ell(-.307,.02,0,.055,.17,.09,phones,faceHead);ell(.307,.02,0,.055,.17,.09,phones,faceHead);
      ell(-.327,.015,-.029,.026,.081,.066,accent,faceHead);ell(.327,.015,-.029,.026,.081,.066,accent,faceHead);
      const arc=new THREE.Mesh(new THREE.TorusGeometry(.30,.021,5,23,Math.PI),phones);arc.rotation.z=Math.PI;arc.position.set(0,.08,.04);faceHead.add(arc);
    }else if(d.id==='pilot'){
      ell(0,.224,.04,.30,.164,.28,hair,faceHead);
      ell(-.228,.009,.005,.085,.20,.12,hair,faceHead);
      ell(.229,.009,.005,.085,.20,.12,hair,faceHead);
      ell(.13,.23,-.18,.17,.12,.11,hair,faceHead);
    }else if(d.id==='mechanic'){
      // AlienÃ­gena com pele azul e dois chifres curtos como na ilustraÃ§Ã£o.
      for(const s of [-1,1]){
        const horn=cyl(s*.22,.315,0,.015,.098,.35,mat(0x5d6b8d,.1,.68),faceHead,9);horn.rotation.z=-s*.49;
      }
      ell(0,.261,.08,.23,.105,.22,hair,faceHead);
      ell(0,-.18,-.134,.20,.08,.14,hair,faceHead);
    }else if(d.id==='cadet'){
      ell(0,.236,.034,.272,.122,.263,hair,faceHead);
      for(let i=0;i<14;i++){
        const a=i*Math.PI*2/14;
        ell(Math.cos(a)*.22,.29+Math.sin(i*2)*.037,Math.sin(a)*.18,.084,.081,.076,hair,faceHead,8);
      }
    }
    // Costuras e detalhes de uniforme vistos de frente e de costas.
    for(const s of [-1,1]){
      box(s*(bodyWidth-.10),1.68,-.168,.10,.052,.16,trim,g,false);
      box(s*(bodyWidth-.07),1.65,.172,.115,.052,.12,trim,g,false);
    }
    box(0,1.32,-.250,.045,.61,.021,trim,g,false);
    for(const x of [-.12,.12])box(x,1.52,-.252,.18,.07,.02,secondary,g,false);
    box(0,1.55,.240,.36,.07,.02,trim,g,false);
    // Trajes, distintivos, equipamentos de costas e acessÃ³rios exclusivos.
    if(d.id==='captain'){
      for(const s of [-1,1]){
        coatPanel(s*.27,.94,.08,.24,.71,.18,primary,g,s*.06);
        for(let j=0;j<3;j++)box(s*.42,1.55-j*.10,-.13,.085,.021,.06,gold,g,false);
      }
      box(0,1.55,-.26,.19,.10,.028,gold,g,false);
      box(0,1.44,.257,.45,.10,.03,gold,g,false);
    } else if(d.id==='pilot'){
      box(0,1.37,-.271,.25,.33,.042,secondary,g);
      box(0,1.37,-.300,.19,.16,.016,holo,g,false);
      ell(-.50,1.05,.20,.245,.238,.24,charcoal,g);
      ell(-.50,1.05,-.001,.201,.112,.198,ivory,g);
      box(-.50,1.038,-.128,.35,.14,.07,steel,g);
      for(const s of [-1,1])box(s*.21,1.39,.254,.10,.58,.04,steel,g);
    } else if(d.id==='engineer'){
      box(0,1.39,-.260,.59,.66,.065,secondary,g);
      for(const s of [-1,1])box(s*.255,1.70,-.249,.082,.30,.09,secondary,g);
      box(0,1.18,-.304,.36,.17,.065,primary,g);
      for(const x of [-.22,.22])box(x,.97,-.20,.17,.19,.15,charcoal,g);
      // Chave inglesa longa apoiada nas costas.
      const tool=new THREE.Group();tool.position.set(.50,1.76,.33);tool.rotation.z=-.64;g.add(tool);
      tube([0,-.47,0],[0,.44,0],.062,steel,tool);
      tube([0,.34,0],[-.15,.56,0],.056,steel,tool);
      tube([0,.34,0],[.15,.56,0],.056,steel,tool);
      ell(0,-.43,0,.11,.10,.08,steel,tool);
      // Ã“culos de engenharia apoiados na testa.
      for(const s of [-1,1])ring(s*.13,.25,-.259,.115,.036,steel,faceHead);
    } else if(d.id==='medic'){
      for(const s of [-1,1])box(s*.30,1.49,-.20,.095,.26,.09,red,g);
      box(0,1.37,-.282,.24,.25,.027,ivory,g);
      patchCross(g,0,1.375,-.305,.17,red);
      box(0,1.47,.257,.42,.36,.08,ivory,g);
      patchCross(g,0,1.48,.304,.19,red);
      const medbox=new THREE.Group();medbox.position.set(-.47,.94,-.32);g.add(medbox);
      box(0,0,0,.44,.43,.20,ivory,medbox);
      patchCross(medbox,0,0,-.109,.25,red);
      box(0,.27,0,.21,.12,.09,steel,medbox);
    } else if(d.id==='security'){
      ell(0,1.42,-.19,.44,.43,.19,secondary,g);
      box(0,1.50,-.352,.48,.22,.055,charcoal,g);
      box(-.15,1.63,-.365,.13,.09,.018,red,g,false);
      for(const s of [-1,1]){
        box(s*.3,1.39,-.325,.15,.29,.075,charcoal,g);
        box(s*.22,.96,-.16,.16,.21,.13,secondary,g);
        box(s*.37,.45,-.15,.12,.30,.14,secondary,g);
      }
      box(0,1.42,.30,.59,.59,.16,secondary,g);
      box(0,1.45,.396,.31,.14,.03,red,g,false);
      const blaster=new THREE.Group();blaster.position.set(.22,1.22,-.49);blaster.rotation.z=-.65;g.add(blaster);
      box(0,.26,0,.19,.68,.20,charcoal,blaster);
      box(0,.60,-.04,.13,.25,.17,steel,blaster);
      box(.06,-.06,-.02,.12,.24,.19,charcoal,blaster);
    } else if(d.id==='navigator'){
      for(const s of [-1,1])coatPanel(s*.27,.80,.035,.28,.77,.18,primary,g,s*.07);
      for(const s of [-1,1])box(s*.34,.84,-.103,.035,.69,.036,gold,g,false);
      box(0,1.52,-.270,.45,.07,.036,gold,g,false);
      box(0,1.35,.264,.45,.04,.024,gold,g,false);
      const holoRoot=new THREE.Group();holoRoot.position.set(.70,1.48,-.49);g.add(holoRoot);
      for(let i=0;i<3;i++){const r=ring(0,0,0,.25+i*.07,.013,holo,holoRoot);r.rotation.x=i*.45+.10;r.rotation.y=i*.63;fxMeshes.push(r)}
      ell(0,0,0,.048,.048,.048,gold,holoRoot,10);
    } else if(d.id==='scientist'){
      for(const s of [-1,1])coatPanel(s*.265,.90,.045,.25,.77,.15,primary,g,s*.035);
      box(0,1.42,-.274,.40,.40,.023,secondary,g);
      for(const s of [-1,1])box(s*.22,1.15,-.285,.18,.13,.02,trim,g,false);
      box(0,1.44,.250,.46,.43,.07,primary,g);
      const tab=new THREE.Group();tab.position.set(-.38,1.10,-.39);tab.rotation.z=.17;g.add(tab);
      box(0,0,0,.38,.52,.055,charcoal,tab);
      box(0,0,-.034,.31,.43,.018,holo,tab,false);
      for(let i=0;i<4;i++)box(0,.14-i*.09,-.047,.22,.011,.004,ivory,tab,false);
    } else if(d.id==='comms'){
      box(0,1.40,-.265,.30,.37,.043,secondary,g);
      for(const s of [-1,1])box(s*.36,.62,-.16,.22,.33,.14,secondary,g);
      box(0,1.40,.29,.49,.42,.145,charcoal,g);
      ring(0,1.44,.38,.14,.023,lilac,g);
      box(0,1.00,.26,.23,.22,.14,steel,g);
      const panel=new THREE.Group();panel.position.set(.44,1.15,-.45);panel.rotation.y=.22;g.add(panel);
      box(0,0,0,.48,.33,.035,lilac,panel,false);
      box(0,0,-.024,.39,.25,.017,charcoal,panel,false);
      ring(0,0,-.04,.092,.012,lilac,panel);
      for(const a of [-.13,.13])box(a,-.10,-.046,.074,.012,.009,lilac,panel,false);
    } else if(d.id==='mechanic'){
      box(0,1.39,-.27,.57,.62,.065,secondary,g);
      box(0,1.32,-.312,.36,.30,.038,primary,g);
      for(const s of [-1,1]){
        box(s*.31,1.68,-.245,.12,.29,.12,secondary,g);
        box(s*.37,1.64,.17,.24,.20,.20,primary,g);
      }
      box(0,1.03,-.292,.49,.095,.08,steel,g);
      box(0,1.4,.29,.60,.48,.12,secondary,g);
      // Ferramenta mecÃ¢nica de grande porte sobre ombro direito.
      const heavy=new THREE.Group();heavy.position.set(.66,1.93,.13);heavy.rotation.z=-.77;g.add(heavy);
      tube([0,-.61,0],[0,.41,0],.072,steel,heavy);
      tube([0,.35,0],[-.22,.54,0],.09,steel,heavy);
      tube([0,.35,0],[.22,.54,0],.09,steel,heavy);
      ell(0,-.53,0,.16,.11,.12,charcoal,heavy);
    } else if(d.id==='cadet'){
      box(0,1.40,-.251,.36,.38,.056,secondary,g);
      box(0,1.56,-.29,.27,.08,.035,gold,g);
      for(const s of [-1,1])box(s*.26,.56,-.153,.085,.40,.055,trim,g);
      box(0,1.41,.34,.57,.64,.23,secondary,g);
      for(const s of [-1,1])box(s*.28,1.37,.257,.11,.73,.115,gold,g);
      box(0,1.14,.472,.43,.12,.08,steel,g);
    }

    return {root:avatarRoot,visual:g,arms:rigArms,legs:rigLegs,name:d.name,role:d.role,index:Number.isInteger(index)&&index>=0&&index<CREW.length?index:0};
  };
})();

