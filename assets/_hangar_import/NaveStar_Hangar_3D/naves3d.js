/*
 NAVESTAR / HANGAR DE FROTA — renderizador WebGL2 sem dependências.
 Modelos tridimensionais procedurais: 10 naves distintas.
 Eixos: nariz +Z, cima +Y, asas +/-X.
 API pública: window.NaveStarHangar.openShip(index), .getShipInfo(index), .setView(view).
*/
(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const canvas = $('#ship-canvas');
const gl = canvas && canvas.getContext('webgl2', { alpha: true, antialias: true, depth: true, powerPreference: 'high-performance' });
if (!gl) {
 const fallback=[['Nave Padrão Alpha','PADRÃO','Exploradora multipropósito'],['Nave Padrão Beta','PADRÃO','Modular de alto desempenho'],['Pesquisa Orbital','PESQUISA','Ciência e cartografia espacial'],['Pesquisa Profunda','PESQUISA','Laboratório de longo alcance'],['Guerra Interceptora','GUERRA','Caça furtivo de combate'],['Guerra Pesada','GUERRA','Cruzador de batalha blindado'],['Shuttle de Passageiros','PASSAGEIROS','Transporte civil compacto'],['Liner de Passageiros','PASSAGEIROS','Cruzeiro interestelar de luxo'],['Cargueiro Industrial','CARGA','Transporte logístico pesado'],['Veloz R-01','CORRIDA','Protótipo de alta velocidade']];
 const area=$('#ship-list'); const pic=document.createElement('img');pic.className='fallback-art';$('#ship-stage').appendChild(pic);
 const msg=$('#render-error');msg.hidden=false;msg.textContent='Visualização ilustrativa. Ative o WebGL 2 e a aceleração de hardware no Chrome ou Edge para ver e girar os modelos 3D.';
 function show(i){pic.src=`assets/nave-${String(i+1).padStart(2,'0')}.webp`;pic.alt=fallback[i][0];$('#detail-title').textContent=fallback[i][0];$('#detail-type').textContent=fallback[i][1];$('#detail-subtitle').textContent=fallback[i][2];$('#ship-number').textContent=String(i+1).padStart(2,'0');area.querySelectorAll('button').forEach((b,j)=>b.classList.toggle('selected',i===j));}
 fallback.forEach((v,i)=>{let b=document.createElement('button');b.type='button';b.className='ship-card';b.innerHTML=`<span class="card-thumb"><img src="assets/nave-${String(i+1).padStart(2,'0')}.webp" alt=""><span class="card-index">${String(i+1).padStart(2,'0')}</span></span><span class="card-copy"><strong>${v[0]}</strong><span>${v[1]}</span></span>`;b.addEventListener('click',()=>show(i));area.append(b)});show(0);return;
}
const PI=Math.PI, TAU=PI*2;
const V=(x=0,y=0,z=0)=>[x,y,z], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s], len=a=>Math.hypot(...a),norm=a=>{let d=len(a)||1;return mul(a,1/d)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const ID=()=>Float32Array.from([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
const mm=(a,b)=>{let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let x=0;for(let k=0;k<4;k++)x+=a[k*4+r]*b[c*4+k];o[c*4+r]=x}return o};
function transform(p=[0,0,0],r=[0,0,0],s=[1,1,1]){
 let [sx,cx]=[Math.sin(r[0]),Math.cos(r[0])], [sy,cy]=[Math.sin(r[1]),Math.cos(r[1])], [sz,cz]=[Math.sin(r[2]),Math.cos(r[2])];
 const rx=Float32Array.from([1,0,0,0, 0,cx,sx,0, 0,-sx,cx,0, 0,0,0,1]);
 const ry=Float32Array.from([cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1]);
 const rz=Float32Array.from([cz,sz,0,0, -sz,cz,0,0, 0,0,1,0, 0,0,0,1]);
 const S=Float32Array.from([s[0],0,0,0, 0,s[1],0,0, 0,0,s[2],0, 0,0,0,1]);
 let T=ID(); T[12]=p[0];T[13]=p[1];T[14]=p[2];return mm(mm(mm(mm(T,rz),ry),rx),S);
}
function basisBetween(a,b,thick=0.12){const d=sub(b,a),h=len(d),y=norm(d),u=Math.abs(dot(y,[0,0,1]))>.96?[1,0,0]:[0,0,1],x=norm(cross(u,y)),z=norm(cross(y,x)),p=mul(add(a,b),.5);return Float32Array.from([x[0]*thick,x[1]*thick,x[2]*thick,0, y[0]*h,y[1]*h,y[2]*h,0,z[0]*thick,z[1]*thick,z[2]*thick,0, p[0],p[1],p[2],1]);}
function perspective(fovy,aspect,n,f){let t=1/Math.tan(fovy/2),o=new Float32Array(16);o[0]=t/aspect;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=(2*f*n)/(n-f);return o}
function lookAt(eye,center){let z=norm(sub(eye,center)),x=norm(cross([0,1,0],z)),y=cross(z,x);return Float32Array.from([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1])}
const M={
 white:{c:[.82,.88,.94],metal:.74,rough:.24}, pearl:{c:[.94,.955,1],metal:.49,rough:.18}, ivory:{c:[.72,.79,.85],metal:.75,rough:.31},
 graphite:{c:[.16,.21,.28],metal:.92,rough:.31}, black:{c:[.045,.065,.10],metal:.82,rough:.16}, onyx:{c:[.095,.12,.17],metal:.92,rough:.22},
 steel:{c:[.36,.45,.54],metal:.96,rough:.25}, gunmetal:{c:[.23,.27,.33],metal:.95,rough:.38}, armor:{c:[.27,.33,.39],metal:.96,rough:.4},
 silver:{c:[.58,.71,.80],metal:.96,rough:.14}, gold:{c:[.95,.68,.33],metal:.9,rough:.23}, bronze:{c:[.59,.37,.23],metal:.9,rough:.25},
 glass:{c:[.045,.22,.32],metal:.77,rough:.06}, blueglass:{c:[.07,.35,.58],metal:.70,rough:.08}, darkglass:{c:[.018,.073,.13],metal:.88,rough:.065},
 red:{c:[.85,.087,.12],metal:.79,rough:.2}, crimson:{c:[.40,.032,.058],metal:.91,rough:.24},
 orange:{c:[.88,.36,.105],metal:.66,rough:.42}, container:{c:[.39,.44,.48],metal:.71,rough:.52},
 cyan:{c:[.18,.82,1],metal:.1,rough:.16,emi:1.3}, electric:{c:[.13,.43,1],metal:.09,rough:.2,emi:1.45},
 redlight:{c:[1,.075,.12],metal:.08,rough:.14,emi:1.9}, amber:{c:[1,.49,.10],metal:.13,rough:.15,emi:1.6},
 whiteneon:{c:[.67,.87,1],metal:.12,rough:.1,emi:1.6}, shadow:{c:[.085,.11,.15],metal:.9,rough:.5},
};
const GEO={};
class Shape {
 constructor(){this.p=[];this.n=[];this.i=[]}
 vertex(v,n){this.p.push(...v);this.n.push(...n);return this.p.length/3-1}
 tri(a,b,c){const n=norm(cross(sub(b,a),sub(c,a)));let i=this.vertex(a,n),j=this.vertex(b,n),k=this.vertex(c,n);this.i.push(i,j,k)}
 quad(a,b,c,d){this.tri(a,b,c);this.tri(a,c,d)}
 output(){return {positions:new Float32Array(this.p),normals:new Float32Array(this.n),indices:new Uint16Array(this.i)}}
}
function boxGeo(){let s=new Shape(),v=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];for(let f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])s.quad(...f.map(i=>v[i]));return s.output()}
function cylGeo(seg=20){let s=new Shape(),t=[],b=[];for(let i=0;i<=seg;i++){let a=i/seg*TAU,c=Math.cos(a),d=Math.sin(a);t.push([c*.5,.5,d*.5]);b.push([c*.5,-.5,d*.5])}for(let i=0;i<seg;i++){s.quad(b[i],b[i+1],t[i+1],t[i]);s.tri([0,.5,0],t[i],t[i+1]);s.tri([0,-.5,0],b[i+1],b[i])}return s.output()}
function sphereGeo(seg=22,rings=12){let s=new Shape();for(let j=0;j<rings;j++){let p0=-PI/2+j/rings*PI,p1=-PI/2+(j+1)/rings*PI;for(let i=0;i<seg;i++){let a0=i/seg*TAU,a1=(i+1)/seg*TAU;let v=(p,a)=>[Math.cos(p)*Math.cos(a)*.5,Math.sin(p)*.5,Math.cos(p)*Math.sin(a)*.5];s.quad(v(p0,a0),v(p0,a1),v(p1,a1),v(p1,a0))}}return s.output()}
function torusGeo(rad=.88,tube=.065,n=64,k=10){let s=new Shape();const v=(a,b)=>[(rad+tube*Math.cos(b))*Math.cos(a),(rad+tube*Math.cos(b))*Math.sin(a),tube*Math.sin(b)];for(let j=0;j<n;j++)for(let i=0;i<k;i++)s.quad(v(j/n*TAU,i/k*TAU),v((j+1)/n*TAU,i/k*TAU),v((j+1)/n*TAU,(i+1)/k*TAU),v(j/n*TAU,(i+1)/k*TAU));return s.output()}
function hullGeo(profile,segments=24){let s=new Shape();let v=(p,a)=>[p[1]*Math.cos(a),p[3]+p[2]*Math.sin(a),p[0]];for(let k=0;k<profile.length-1;k++){let a=profile[k],b=profile[k+1];for(let i=0;i<segments;i++){let t0=i/segments*TAU,t1=(i+1)/segments*TAU;s.quad(v(a,t0),v(a,t1),v(b,t1),v(b,t0))}}for(let a of [profile[0],profile[profile.length-1]]){for(let i=0;i<segments;i++){let t0=i/segments*TAU,t1=(i+1)/segments*TAU;s.tri([0,a[3],a[0]],v(a,t0),v(a,t1))}}return s.output()}
function wingGeo(points,thickness=.13){let s=new Shape(),t=points.map(q=>[q[0],thickness/2,q[1]]),b=points.map(q=>[q[0],-thickness/2,q[1]]);for(let i=1;i<t.length-1;i++){s.tri(t[0],t[i],t[i+1]);s.tri(b[0],b[i+1],b[i])}for(let i=0;i<t.length;i++){let j=(i+1)%t.length;s.quad(b[i],b[j],t[j],t[i])}return s.output()}
function dishGeo(){let s=new Shape(),seg=56,rings=11;let v=(r,a)=>[r*Math.cos(a),r*Math.sin(a),-.6+r*r*.58];for(let k=0;k<rings;k++)for(let i=0;i<seg;i++){let r0=k/rings,r1=(k+1)/rings,a=i/seg*TAU,b=(i+1)/seg*TAU;s.quad(v(r0,a),v(r1,a),v(r1,b),v(r0,b))}return s.output()}
const STATIC={box:boxGeo(),cyl:cylGeo(),sphere:sphereGeo(),torus:torusGeo(),dish:dishGeo()};
let shipCount=0;
class Ship{
 constructor(){this.nodes=[];this.animated=[];shipCount++}
 put(geo,material='white',pos=[0,0,0],rot=[0,0,0],scale=[1,1,1]){this.nodes.push({geo,material,matrix:transform(pos,rot,scale)});return this}
 box(pos,scale,mat='steel',rot=[0,0,0]){return this.put(STATIC.box,mat,pos,rot,scale)}
 cyl(pos,scale,mat='steel',rot=[0,0,0]){return this.put(STATIC.cyl,mat,pos,rot,scale)}
 ball(pos,scale,mat='white'){return this.put(STATIC.sphere,mat,pos,[0,0,0],scale)}
 ring(pos,scale,mat='steel',rot=[0,0,0]){return this.put(STATIC.torus,mat,pos,rot,scale)}
 wing(points,thickness,mat='white',y=0){return this.put(wingGeo(points,thickness),mat,[0,y,0])}
 loft(profile,mat='white',p=[0,0,0],r=[0,0,0]){return this.put(hullGeo(profile),mat,p,r)}
 beam(a,b,thick,mat='steel',cylinder=false){this.nodes.push({geo:cylinder?STATIC.cyl:STATIC.box,material:mat,matrix:basisBetween(a,b,thick)});return this}
 exhaust(x,y,z,r=1,col='cyan'){this.cyl([x,y,z],[r*2,.23,r*2],'black',[PI/2,0,0]);this.ring([x,y,z+.16],[r,r,.6],'steel');this.ring([x,y,z+.21],[r*.78,r*.78,.65],col);this.ball([x,y,z+.26],[r*1.23,r*1.23,.045],col);this.cyl([x,y,z+.08],[r*1.1,.11,r*1.1],'gunmetal',[PI/2,0,0]);return this}
 stripes(xs,zValues,y,mat='cyan',thick=.03){for(let x of xs)for(let z of zValues)this.box([x,y,z],[thick,.025,.24],mat);return this}
 panelBolts(center,dx,dz,y,mat='steel'){for(let x of [-1,1])for(let z of [-1,1])this.ball([center[0]+x*dx,center[1]+y,center[2]+z*dz],[.062,.042,.062],mat);return this}
 cockpit(p=[0,0,2],sc=[1,1,2],frame='silver'){
  this.loft([[-1.15,.4,.29,0],[-.85,.72,.50,.08],[0,.84,.53,.12],[.94,.50,.29,-.06],[1.5,.035,.03,-.18]],'darkglass',p,[0,0,0]);
  for(let s of [-1,1])this.beam([p[0]+s*.47,p[1]+.42,p[2]-.76],[p[0]+s*.26,p[1]+.22,p[2]+1.07],.043,frame);
  for(let z of [-.52,.24,.88])this.beam([p[0]-.60,p[1]+.51,p[2]+z],[p[0]+.60,p[1]+.51,p[2]+z],.033,frame);
  return this;
 }
 radiator(x,y,z,l=2,mat='graphite'){this.box([x,y,z],[.18,.18,l],mat);for(let j=-4;j<=4;j++)this.box([x,y+.12,z+j*l/10],[.22,.055,.044],'silver');return this}
 pod(x,y,z,scale=1,mat='white',glow='cyan'){
  this.loft([[-2.45,.47,.48,0],[-1.92,.68,.65,0],[-.6,.63,.61,0],[.7,.50,.48,0],[1.7,.12,.15,0]],mat,[x,y,z]);
  this.loft([[-2.46,.23,.23,0],[-2.32,.4,.40,0]],'black',[x,y,z]);
  this.exhaust(x,y,z-2.45,.4*scale,glow);
  this.box([x,y+.58,z-.1],[.35,.10,1.5],'steel');
  for(let q of [-1,1])this.box([x+q*.47,y,z-.47],[.10,.14,2],'graphite');
  return this;
 }
 turret(x,y,z,size=.5){
  this.ball([x,y,z],[size*2,size*.62,size*2],'gunmetal');this.cyl([x,y+size*.5,z],[size*.9,size*.5,size*.9],'armor');
  for(let s of [-1,1]){this.beam([x+s*size*.27,y+size*.65,z],[x+s*size*.27,y+size*.65,z+size*2.5],size*.16,'steel');this.ball([x+s*size*.27,y+size*.65,z+size*2.5],[size*.18,size*.18,size*.18],'black')}return this
 }
}
function lights(ship,xs,zs,y){for(let x of xs)for(let z of zs){ship.box([x,y,z],[.12,.035,.29],'whiteneon');ship.box([x,y-.035,z],[.20,.016,.43],'darkglass')}}
function alpha(){let s=new Ship();s.loft([[-5.7,.36,.35,.08],[-4.9,1.07,.76,0],[-2.6,1.40,.79,.05],[-.6,1.33,.61,-.03],[1.7,1.04,.47,-.04],[3.6,.62,.36,-.06],[5.28,.03,.045,-.13]],'pearl');
 s.loft([[-4.2,.38,.28,.46],[-2.1,.75,.41,.49],[.8,.67,.42,.46],[2.8,.38,.20,.33],[3.65,.03,.02,.25]],'ivory');s.cockpit([0,.51,1.45]);
 for(let d of [-1,1]){s.wing([[d*.83,1.6],[d*3.95,-2.75],[d*4.75,-4.2],[d*3.2,-3.95],[d*1.23,-1.65]],.19,'white',-.12);s.wing([[d*1.45,-2.65],[d*3.03,-4.5],[d*2.1,-4.5],[d*1.1,-3.63]],.16,'gunmetal',.18);
 s.pod(d*3.11,-.13,-2.75,.9,'ivory','cyan');s.box([d*2.05,.03,-1.12],[.38,.14,2.12],'steel',[0,0,d*.12]);s.beam([d*1.25,.46,1.02],[d*2.9,.18,-1.4],.052,'gold');
 s.box([d*1.77,.12,-2.2],[.14,.08,2.1],'graphite');for(let z of [-2.35,-1.4,-.45])s.box([d*1.66,.22,z],[.4,.06,.12],'silver');
 s.ball([d*3.9,-.03,-3.5],[.17,.09,.19],'amber');s.beam([d*1.0,-.38,.9],[d*3.7,-.3,-2.9],.075,'black');
 }
 for(let i=0;i<8;i++){let z=-4.25+i*.88,r=1.20-.065*i;s.box([0,.76,z],[r*1.7,.045,.075],i%2?'silver':'steel')}
 s.box([0,-.62,-1.3],[1.15,.12,5.0],'gunmetal');s.exhaust(0,-.22,-5.5,.40,'electric');lights(s,[-.83,.83],[-3.1,-2.3,-1.5,-.7],.57);return s}
function beta(){let s=new Ship();s.loft([[-5.9,.65,.55,0],[-5.0,1.55,.82,0],[-2.9,1.55,.70,0],[.2,1.15,.60,0],[2.9,.65,.39,-.07],[4.8,.02,.02,-.12]],'gunmetal');
 s.loft([[-3.5,.74,.33,.57],[-1.0,.86,.32,.57],[2.25,.50,.33,.44],[3.6,.025,.03,.3]],'graphite');s.cockpit([0,.48,1.55]);
 for(let d of [-1,1]){s.wing([[d*1.2,1.8],[d*2.68,.20],[d*4.68,-3.0],[d*4.5,-4.15],[d*2.6,-3.3],[d*1.1,-3.75]],.3,'armor',-.24);
  for(let j=0;j<2;j++){let x=d*(2.3+j*1.42);s.pod(x,-.05,-2.42,.8,'graphite','electric');s.box([x,.54,-2.3],[.67,.12,3.1],'gunmetal');s.box([x,.66,-2.1],[.33,.085,1.8],'steel')}
  s.box([d*1.65,.17,-1.32],[.28,.2,2.8],'onyx');s.beam([d*1.28,.41,.65],[d*3.8,.22,-3.15],.09,'silver');
  s.wing([[d*1.42,-3.1],[d*2.6,-5.03],[d*1.9,-4.7],[d*.9,-4.0]],.18,'graphite',1.1);
  for(let z of [-2.7,-1.85,-1])s.box([d*3.35,.61,z],[.85,.13,.16],'black');
 }
 s.box([0,-.66,-1.5],[1.9,.36,5.5],'black');s.exhaust(0,0,-5.8,.53,'electric');for(let z=-4;z<2;z+=.58)s.box([0,.88,z],[1.15,.08,.095],'steel');lights(s,[-1.28,1.28],[-1.9,-.75,.4],.73);return s}
function orbital(){let s=new Ship();s.loft([[-7,.38,.40,.05],[-5.5,.85,.67,0],[-2.8,.88,.61,0],[-.4,.83,.59,0],[2.2,.73,.42,0],[4.8,.47,.31,-.06],[6.3,.06,.06,-.09]],'ivory');
 s.loft([[-2.8,.42,.35,.48],[0,.58,.42,.5],[2.15,.48,.30,.43],[3.65,.23,.19,.25]],'pearl');s.cockpit([0,.46,3.48]);
 for(let z of [-4.1,-2.4,-.4,1.15]){s.cyl([0,0,z],[2,.17,2],'steel',[PI/2,0,0]);s.ring([0,0,z],[1.02,1.02,1],'silver')}
 // Anéis de laboratório orbital, arcos e contraventamentos
 s.ring([0,0,-1.25],[3.85,3.85,1],'pearl');s.ring([0,0,-1.25],[3.55,3.55,.72],'cyan');s.ring([0,0,-1.25],[3.95,3.95,.66],'gold');
 for(let j=0;j<20;j++){let a=j/20*TAU,x=Math.cos(a)*3.3,y=Math.sin(a)*3.3;s.beam([x*.46,y*.46,-1.30],[x,y,-1.25],.082,'silver');if(j%2===0)s.ball([x,y,-1.25],[.15,.15,.15],'amber')}
 for(let d of [-1,1]){s.wing([[d*.7,2.15],[d*2.8,.6],[d*2.1,-.85],[d*.85,-1.75]],.16,'white',-.55);s.box([d*1.48,-.65,0],[.15,.15,3.9],'gold');s.box([d*1.94,-.54,-3.8],[1.1,.45,2.0],'graphite');
 for(let k=0;k<7;k++)s.box([d*1.89,-.29,-4.55+k*.3],[.89,.04,.055],'cyan');s.beam([d*.8,.42,1.3],[d*2.1,.24,-4.0],.06,'steel')}
 for(let i=0;i<7;i++){let z=-4.9+i*1.3;s.box([0,.66,z],[.72,.13,.2],'white');s.ball([0,.83,z],[.13,.14,.13],'cyan')}
 s.cyl([0,1.03,-3.3],[.10,3,.10],'steel');s.ball([0,2.6,-3.3],[.42,.42,.42],'glass');s.exhaust(0,0,-7.0,.57,'electric');return s}
function deepResearch(){let s=new Ship();s.loft([[-8,.30,.34,0],[-6.8,.66,.55,0],[-1.5,.48,.43,0],[2.6,.55,.48,0],[5.7,.25,.22,0]],'graphite');
 for(let z=-6;z<=4.7;z+=1.05){s.ring([0,0,z],[1.1,1.1,1],'silver');for(let d of [-1,1])s.box([d*.76,0,z],[.18,.17,.2],'gold')}
 for(let d of [-1,1])for(let y of [-1,1]){s.beam([d*.73,y*.65,-7.4],[d*.73,y*.65,5.35],.095,'silver');for(let z=-6.3;z<4;z+=1.5)s.beam([d*.75,y*.69,z],[d*.75,-y*.68,z+1.5],.050,'steel')}
 for(let d of [-1,1]){s.loft([[-1.45,.54,.53,0],[0,.55,.54,0],[1.43,.36,.35,0]],'white',[d*1.8,0,-1.1]);s.ball([d*1.8,0,-1.2],[.83,.75,.85],'silver');s.box([d*1.80,-.84,-1.13],[1.52,.09,1.64],'gold');
 s.cyl([d*1.78,.52,1.3],[.10,2.8,.1],'steel');s.ball([d*1.78,2.0,1.3],[.21,.21,.21],'cyan');
 for(let q of [-1,1]){s.beam([d*.75,.3,-4.7],[d*(2.6+q*.32),.3,-3.0],.085,'gold')}
 }
 s.put(STATIC.dish,'ivory',[0,0,6.5],[0,0,0],[3.7,3.7,2]);s.ring([0,0,7.57],[3.65,3.65,.8],'gold');s.cyl([0,0,7.6],[.14,2.5,.14],'steel',[PI/2,0,0]);s.ball([0,0,8.85],[.34,.34,.34],'electric');
 for(let i=0;i<12;i++){let a=i/12*TAU,x=Math.cos(a)*3.0,y=Math.sin(a)*3.0;s.beam([x,y,7.23],[0,0,8.7],.045,'steel')}
 s.ring([0,0,-6.1],[1.68,1.68,1],'gold');s.exhaust(0,0,-8.05,.42,'electric');return s}
function interceptor(){let s=new Ship();s.loft([[-5.5,.30,.33,-.05],[-4.4,.94,.38,-.06],[-1.4,.9,.43,0],[2.15,.68,.39,-.08],[5.95,.01,.018,-.20]],'graphite');
 s.loft([[-2.2,.35,.30,.25],[.7,.47,.38,.32],[2.8,.32,.24,.24],[4.5,.015,.02,.08]],'crimson');s.cockpit([0,.40,2]);
 for(let d of [-1,1]){s.wing([[d*.70,2.55],[d*4.9,-2.75],[d*5.55,-4.5],[d*2.56,-3.4],[d*.86,-2.9]],.135,'gunmetal',-.20);
  s.wing([[d*1.05,1.1],[d*4.4,-2.84],[d*3.8,-3.3],[d*1.18,-1.3]],.03,'crimson',-.05);s.wing([[d*1.28,-2.85],[d*2.25,-5.4],[d*1.2,-4.65]],.14,'red',1.0);
  s.beam([d*.8,.24,1.92],[d*3.9,.06,-2.63],.085,'redlight');s.beam([d*1.36,.12,-2.4],[d*5.15,.12,-4.22],.095,'redlight');
  s.box([d*1.18,-.11,0],[.16,.12,4.0],'onyx');s.beam([d*.85,-.2,2],[d*1.3,-.2,4.05],.11,'steel');s.ball([d*1.3,-.2,4.05],[.16,.11,.25],'redlight');
  s.exhaust(d*.75,-.18,-5.25,.37,'redlight');}
 s.ring([0,-.06,-5.4],[.42,.42,1],'steel');s.ball([0,-.06,-5.48],[.33,.33,.08],'redlight');
 for(let i=0;i<6;i++)s.box([0,.45,-3.2+i*.6],[.55,.09,.13],'red');return s}
function heavyWar(){let s=new Ship();s.loft([[-10.5,1.09,1.14,0],[-9.1,2.20,1.55,0],[-5.85,2.45,1.58,0],[-2.4,2.38,1.42,0],[3.0,1.8,1.13,0],[7.8,1.16,.80,-.03],[10.2,.14,.16,-.12]],'armor');
 s.loft([[-8.4,1.4,.42,1.17],[-3.4,1.58,.67,1.20],[2.1,1.25,.59,1.0],[6.3,.64,.35,.65],[8.1,.12,.14,.22]],'gunmetal');
 s.cockpit([0,1.22,5.6],[1,1,1],'silver');
 for(let d of [-1,1]){s.wing([[d*1.55,4.25],[d*3.75,1.2],[d*4.50,-6.6],[d*2.1,-8.8],[d*1.90,-3]],.65,'gunmetal',-.33);
   for(let k=0;k<10;k++){let z=-7.5+k*1.39;s.box([d*2.07,1.2,z],[.67,.37,1.0],k%2?'armor':'graphite');s.box([d*2.63,.68,z],[.13,.20,.92],'black');if(k%2===0)s.box([d*2.12,1.43,z],[.42,.056,.2],'redlight');s.panelBolts([d*2.11,1.42,z],.23,.32,.1)}
   s.loft([[-8,.53,.45,0],[-7.2,.69,.63,0],[5.0,.53,.47,0],[7.4,.16,.14,0]],'onyx',[d*3.08,-.48,-.7]);s.exhaust(d*3.06,-.48,-8.7,.42,'redlight');
   for(let k=0;k<4;k++){s.box([d*1.16,1.76,3.8-k*1.65],[.64,.3,.76],'onyx');s.ball([d*1.16,1.98,3.8-k*1.65],[.16,.16,.16],'redlight')}
   s.turret(d*1.1,1.73,3.7,.56);s.turret(d*1.2,1.79,-3.1,.7);
   for(let k=0;k<14;k++){let z=-8.2+k*1.28;s.box([d*2.14,-1.0,z],[.18,.08,.57],'silver')}
 }
 for(let x of [-1.3,0,1.3])for(let y of [-.45,.65])s.exhaust(x,y,-10.55,.55,'redlight');
 for(let z of [-8.8,-7.2,-5.6,-4.0,-2.4,-.8,1,3,5.1])s.box([0,1.75,z],[2.0,.17,.29],'graphite');
 for(let z of [1.9,3.2,4.5,5.8])s.cyl([0,1.9,z],[.30,.55,.30],'silver');s.turret(0,1.95,-.2,.87);lights(s,[-1.57,1.57],[-6,-4,-2,0,2,4],1.32);return s}
function shuttle(){let s=new Ship();s.loft([[-5.6,.56,.57,-.06],[-4.6,1.21,1.0,0],[-1.4,1.58,1.05,0],[2.1,1.55,.91,0],[4.35,1.17,.68,-.03],[6.7,.12,.11,-.12]],'pearl');
 s.loft([[-4.1,.83,.45,.56],[-2,.95,.56,.65],[1.8,1.02,.56,.57],[4.6,.66,.4,.38],[5.9,.12,.09,.08]],'white');
 s.loft([[-.65,.97,.44,.45],[1.7,1.04,.42,.40],[4.4,.80,.30,.29],[5.64,.10,.03,.14]],'darkglass');
 for(let d of [-1,1]){s.wing([[d*1.3,2.65],[d*3.35,-1.7],[d*3.15,-4.4],[d*1.3,-3.75]],.23,'ivory',-.6);
  s.pod(d*2.40,-.34,-3.15,.78,'ivory','cyan');s.box([d*1.55,.30,-.3],[.067,.18,4.45],'silver');
  for(let j=0;j<8;j++){let z=-3.6+j*.67;s.box([d*1.45,.30,z],[.058,.22,.37],'blueglass');s.box([d*1.51,.32,z],[.026,.042,.29],'cyan')}
  s.beam([d*.92,-.78,2.4],[d*3.16,-.58,-2.9],.06,'silver');}
 s.box([0,-1.05,-.75],[2.2,.21,6.7],'graphite');s.box([0,1.07,-1.3],[.61,.14,5.5],'silver');for(let z=-3.7;z<1.6;z+=1.0)s.box([0,1.21,z],[.67,.026,.25],'cyan');s.exhaust(0,-.04,-5.68,.34,'electric');return s}
function liner(){let s=new Ship();s.loft([[-9.4,.83,.94,-.18],[-7.9,1.80,1.18,-.04],[-4.6,2.36,1.30,0],[2.2,2.35,1.13,0],[6.5,1.76,.80,-.08],[8.95,.18,.15,-.18]],'pearl');
 for(let deck=0;deck<3;deck++){let y=1.2+deck*.56, r=2.12-deck*.38;s.loft([[-7.7,r*.77,.28,y],[-5.7,r,.32,y],[2.6,r*.99,.32,y],[6.3,r*.66,.26,y],[8.1,.09,.06,y]],deck===1?'ivory':'white');
  for(let d of [-1,1])for(let i=0;i<23;i++){let z=-6.6+i*.60,edge=r*(1-.11*Math.abs(z)/8);s.box([d*edge,y+.05,z],[.13,.18,.27],i%5===0?'gold':'darkglass');if(i%2===0)s.box([d*(edge+.03),y+.22,z],[.08,.04,.3],'whiteneon')}
  s.box([0,y+.22,-.35],[r*1.5,.067,10.7],deck===2?'gold':'silver');}
 s.loft([[-1.5,.48,.39,2.7],[1.15,.64,.43,2.7],[4.7,.52,.39,2.5],[6,.05,.05,2.2]],'blueglass');
 for(let d of [-1,1]){s.wing([[d*1.54,3.9],[d*3.63,-3.7],[d*3.04,-6.75],[d*1.75,-6.9]],.3,'white',-.7);
  s.loft([[-4.4,.35,.36,0],[-3.5,.48,.50,0],[2.5,.38,.37,0]],'silver',[d*2.95,-.39,-2.9]);s.exhaust(d*2.92,-.4,-7.4,.37,'cyan');
  for(let z=-7.4;z<5;z+=1.6)s.box([d*2.3,-.83,z],[.12,.1,.5],'gold');}
 s.box([0,3.17,-1.5],[.15,.8,.15],'gold');s.ball([0,3.66,-1.5],[.33,.30,.33],'cyan');for(let i=0;i<18;i++)s.box([0,2.45,-6.9+i*.8],[.93,.07,.05],'gold');s.exhaust(0,-.47,-9.42,.62,'electric');return s}
function cargo(){let s=new Ship();s.loft([[-9.8,.72,.63,0],[-8.7,1.40,1.1,0],[-4,1.16,.89,0],[3.5,1.21,.94,0],[7.2,1.0,.81,-.04],[9.3,.28,.24,-.08]],'gunmetal');
 for(let d of [-1,1])for(let y of [-1,1])s.beam([d*2.03,y*1.24,-8.5],[d*2.03,y*1.24,6.2],.21,'steel');
 for(let z=-8.1;z<6.3;z+=2.0)for(let d of [-1,1]){s.beam([d*2.0,-1.22,z],[d*2.0,1.23,z+1.95],.12,'silver');s.beam([d*2.0,1.22,z],[d*2.0,-1.23,z+1.95],.12,'graphite')}
 let cols=[-1,1];for(let d of cols)for(let row of [-1,1])for(let j=0;j<5;j++){let z=-6.8+j*2.65,x=d*1.92,y=row*.73;let mat=j%3===0?'orange':j%3===1?'container':'armor';s.box([x,y,z],[1.94,1.33,2.38],mat);s.box([x,y+.66,z],[1.78,.07,2.23],'steel');
  for(let k=-3;k<=3;k++)s.box([x+k*.25,y,z+1.22],[.046,1.17,.04],'graphite');
  for(let zz of [-1,1]){s.box([x-.78,y,z+zz*1.24],[.13,1.2,.07],'silver');s.box([x+.78,y,z+zz*1.24],[.13,1.2,.07],'silver')}
  s.box([x,y-.67,z],[.55,.05,.9],'black');s.panelBolts([x,y+.69,z],.63,.9,.05,'gold');}
 s.loft([[2.5,.55,.53,0],[5.8,1.05,.95,0],[7.5,1.02,.89,-.05],[9.3,.39,.26,-.09],[9.65,.05,.04,-.12]],'white');s.cockpit([0,.85,7.36]);
 for(let d of [-1,1]){s.wing([[d*.85,8.1],[d*2.7,5.8],[d*2.6,3.3],[d*.9,4.0]],.2,'orange',.66);s.exhaust(d*1.1,-.54,-9.63,.56,'electric');}
 s.exhaust(0,.75,-9.65,.53,'amber');for(let j=0;j<11;j++)s.box([0,1.42,-7.6+j*1.33],[.26,.19,.65],'orange');return s}
function racer(){let s=new Ship();s.loft([[-5.8,.22,.23,-.14],[-4.9,.72,.44,-.08],[-2.5,.77,.42,-.08],[.8,.57,.34,-.12],[4.1,.32,.21,-.12],[7.16,.008,.008,-.21]],'pearl');
 s.loft([[-3,.33,.22,.30],[-1.1,.45,.28,.27],[1.8,.34,.28,.20],[3.7,.12,.12,.1]],'red');s.cockpit([0,.25,2]);
 for(let d of [-1,1]){s.wing([[d*.45,2.9],[d*2.78,.2],[d*4.47,-3.62],[d*3.6,-3.85],[d*1.22,-2.5]],.13,'white',-.13);
 s.wing([[d*1.0,1.85],[d*3.8,-2.95],[d*3.44,-3.16],[d*1.1,-.1]],.027,'red',.04);
 s.wing([[d*2.44,-2.6],[d*3.2,-5.0],[d*2.25,-4.52]],.15,'red',.98);
 s.beam([d*.55,.03,1.55],[d*3.9,.05,-3.52],.07,'whiteneon');s.box([d*1.03,-.03,-1.2],[.29,.14,4.5],'black');
 s.loft([[-3,.53,.53,0],[-1.8,.7,.67,0],[.45,.34,.38,0]],'graphite',[d*2.18,-.18,-2.45]);s.exhaust(d*2.2,-.18,-5.54,.57,'electric');s.ring([d*2.2,-.18,-5.46],[.84,.84,1],'cyan');
 for(let z of [-2.5,-1.55,-.6])s.box([d*2.22,.43,z],[.63,.09,.18],'red');}
 s.ball([0,-.13,7.0],[.13,.12,.23],'red');s.box([0,.63,-3.25],[.30,.23,3.15],'red');s.wing([[-.46,-4.43],[.48,-4.43],[.55,-5.2],[-.55,-5.2]],.11,'graphite',.43);return s}
const SHIPS=[
 {name:'Nave Padrão Alpha',type:'PADRÃO',subtitle:'Exploradora multipropósito',role:'Patrulha, exploração e missões interplanetárias',speed:79,armor:65,cargo:42,crew:'2–6',size:'Média',range:'LONGO',radius:18,accent:'#63ddff',build:alpha,features:['Propulsão dupla','Casco versátil','Cabine panorâmica']},
 {name:'Nave Padrão Beta',type:'PADRÃO',subtitle:'Modular de alto desempenho',role:'Missões táticas, escolta e reconhecimento',speed:84,armor:73,cargo:56,crew:'3–8',size:'Média',range:'LONGO',radius:20,accent:'#7eadff',build:beta,features:['Módulos laterais','Quatro propulsores','Sensores táticos']},
 {name:'Pesquisa Orbital',type:'PESQUISA',subtitle:'Ciência e cartografia espacial',role:'Mapeamento de planetas, análise orbital e coleta',speed:48,armor:35,cargo:61,crew:'8–16',size:'Grande',range:'ORBITAL',radius:21,accent:'#64e6e4',build:orbital,features:['Anel de laboratório','Instrumentos orbitais','Observação profunda']},
 {name:'Pesquisa Profunda',type:'PESQUISA',subtitle:'Laboratório de longo alcance',role:'Exploração de regiões distantes e radioastronomia',speed:39,armor:32,cargo:79,crew:'12–24',size:'Grande',range:'MUITO LONGO',radius:24,accent:'#d9a767',build:deepResearch,features:['Radiotelescópio','Treliças estruturais','Cápsulas científicas']},
 {name:'Guerra Interceptora',type:'GUERRA',subtitle:'Caça furtivo de combate',role:'Interceptação, combate rápido e defesa',speed:100,armor:57,cargo:14,crew:'1–2',size:'Pequena',range:'CURTO',radius:18,accent:'#ff5362',build:interceptor,features:['Asas de ataque','Armamento frontal','Propulsão rápida']},
 {name:'Guerra Pesada',type:'GUERRA',subtitle:'Cruzador de batalha blindado',role:'Defesa pesada, proteção de frotas e combate',speed:36,armor:100,cargo:80,crew:'45–120',size:'Gigante',range:'LONGO',radius:33,accent:'#ff6a68',build:heavyWar,features:['Torres de artilharia','Casco reforçado','Motores múltiplos']},
 {name:'Shuttle de Passageiros',type:'PASSAGEIROS',subtitle:'Transporte civil compacto',role:'Deslocamentos curtos entre estações e planetas',speed:75,armor:38,cargo:43,crew:'2 + 24',size:'Média',range:'CURTO',radius:20,accent:'#79d9ff',build:shuttle,features:['Janelas panorâmicas','Cabine pressurizada','Embarque rápido']},
 {name:'Liner de Passageiros',type:'PASSAGEIROS',subtitle:'Cruzeiro interestelar de luxo',role:'Viagens interplanetárias de grande capacidade',speed:44,armor:61,cargo:92,crew:'60 + 600',size:'Gigante',range:'MUITO LONGO',radius:30,accent:'#f0c88d',build:liner,features:['Conveses múltiplos','Área panorâmica','Suítes e serviços']},
 {name:'Cargueiro Industrial',type:'CARGA',subtitle:'Transporte logístico pesado',role:'Comércio, logística e transporte de contêineres',speed:31,armor:68,cargo:100,crew:'4–14',size:'Gigante',range:'LONGO',radius:29,accent:'#ffaf54',build:cargo,features:['Contêineres modulares','Treliças reforçadas','Engates de carga']},
 {name:'Veloz R-01',type:'CORRIDA',subtitle:'Protótipo de alta velocidade',role:'Corridas interestelares e provas de agilidade',speed:100,armor:19,cargo:7,crew:'1',size:'Pequena',range:'CURTO',radius:19,accent:'#ff6c7d',build:racer,features:['Cockpit esportivo','Asas de baixa massa','Propulsão extrema']},
];
const vert=`#version 300 es
precision highp float;
in vec3 aPosition;in vec3 aNormal;
uniform mat4 uModel;uniform mat4 uVP;
out vec3 vNormal;out vec3 vWorld;out vec3 vLocal;
void main(){vec4 pos=uModel*vec4(aPosition,1.);vWorld=pos.xyz;vLocal=aPosition;vNormal=normalize(mat3(uModel)*aNormal);gl_Position=uVP*pos;}`;
const frag=`#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vWorld;in vec3 vLocal;
uniform vec3 uColor;uniform vec3 uCam;
uniform float uMetal;uniform float uRough;uniform float uEmissive;uniform float uTime;
out vec4 outColor;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
void main(){vec3 n=normalize(vNormal);vec3 v=normalize(uCam-vWorld);
vec3 l1=normalize(vec3(-.52,.90,1.05));vec3 l2=normalize(vec3(.89,.20,-.59));
float a=max(dot(n,l1),0.),b=max(dot(n,l2),0.);
vec3 sky=vec3(.17,.26,.43),fill=vec3(.16,.24,.39);
float fres=pow(1.-max(dot(n,v),0.),3.);
float rough=max(.09,uRough);
float spec1=pow(max(dot(reflect(-l1,n),v),0.),mix(125.,18.,rough));
float spec2=pow(max(dot(reflect(-l2,n),v),0.),mix(115.,14.,rough));
vec3 base=uColor*(.20+.86*a*vec3(1.04,1.13,1.20)+.26*b*vec3(.31,.54,.93));
float metal=uMetal;vec3 specColor=mix(vec3(.25),uColor,metal);
base+=(spec1*1.18+spec2*.45)*specColor*(1.1-rough*.5);
base+=fres*(sky+fill)*mix(.15,.72,metal);
float grain=hash(floor(vLocal*70.))-.5;base*=1.+grain*.075;
float pulse=.84+.16*sin(uTime*3.4+vWorld.z*.8);
base+=uColor*uEmissive*(1.25+pulse*.38);
base=base/(base+vec3(.72));base=pow(max(base,vec3(0.)),vec3(.86));
outColor=vec4(base,1.);}`;
function shader(type,source){let sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vert));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
const U={model:gl.getUniformLocation(prog,'uModel'),VP:gl.getUniformLocation(prog,'uVP'),color:gl.getUniformLocation(prog,'uColor'),cam:gl.getUniformLocation(prog,'uCam'),metal:gl.getUniformLocation(prog,'uMetal'),rough:gl.getUniformLocation(prog,'uRough'),emi:gl.getUniformLocation(prog,'uEmissive'),time:gl.getUniformLocation(prog,'uTime')};
const attrPos=gl.getAttribLocation(prog,'aPosition'),attrNorm=gl.getAttribLocation(prog,'aNormal');
const gpuCache=new WeakMap();
function upload(geo){if(gpuCache.has(geo))return gpuCache.get(geo);let vao=gl.createVertexArray();gl.bindVertexArray(vao);for(let [arr,loc] of [[geo.positions,attrPos],[geo.normals,attrNorm]]){let buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0)}let ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geo.indices,gl.STATIC_DRAW);gl.bindVertexArray(null);let obj={vao,count:geo.indices.length};gpuCache.set(geo,obj);return obj}
const cam={yaw:.78,pitch:.32,dist:20,tyaw:.78,tpitch:.32,tdist:20,spin:true}, render={idx:0,model:null,time:0,last:0,frame:0};
const statsNodes=['#stat-speed','#stat-armor','#stat-cargo'];
function setShip(index){index=clamp(+index||0,0,9);render.idx=index;render.model=SHIPS[index].model||(SHIPS[index].model=SHIPS[index].build());const ship=SHIPS[index];
 $('#detail-title').textContent=ship.name;$('#spec-number').textContent='NS–'+String(index+1).padStart(4,'0');$('#detail-type').textContent=ship.type;$('#detail-subtitle').textContent=ship.subtitle;$('#detail-role').textContent=ship.role;$('#ship-number').textContent=String(index+1).padStart(2,'0');
 $('#spec-crew').textContent=ship.crew;$('#spec-size').textContent=ship.size;$('#spec-range').textContent=ship.range;$('#spec-class').textContent=ship.type;
 [['speed',ship.speed],['armor',ship.armor],['cargo',ship.cargo]].forEach(([key,v])=>{$(`#bar-${key}`).style.width=v+'%';$(`#value-${key}`).textContent=v+' / 100'});
 $('#feature-tags').replaceChildren(...ship.features.map(v=>{let e=document.createElement('span');e.textContent=v;return e}));
 document.documentElement.style.setProperty('--accent',ship.accent);const cards=document.querySelectorAll('.ship-card');cards.forEach((el,i)=>{el.classList.toggle('selected',i===index);el.setAttribute('aria-pressed',i===index?'true':'false')});
 cam.tdist=ship.radius;cam.tyaw=.78;cam.tpitch=.32;$('#ship-stage').dataset.type=ship.type;
 $('#live-ship').textContent=ship.name+' selecionada. Modelo 3D carregado.';
}
const catalog=$('#ship-list');SHIPS.forEach((o,i)=>{let b=document.createElement('button');b.className='ship-card'+(i===0?' selected':'');b.type='button';b.setAttribute('aria-pressed',i===0?'true':'false');b.innerHTML=`<span class="card-thumb"><img src="assets/nave-${String(i+1).padStart(2,'0')}.webp" alt="Arte conceitual da nave ${o.name}" loading="${i<4?'eager':'lazy'}"><span class="card-index">${String(i+1).padStart(2,'0')}</span></span><span class="card-copy"><strong>${o.name}</strong><span>${o.type}</span></span><span class="card-arrow">↗</span>`;b.onclick=()=>setShip(i);catalog.appendChild(b)});
function setView(mode){if(mode==='front'){cam.tyaw=0;cam.tpitch=.075}else if(mode==='side'){cam.tyaw=PI/2;cam.tpitch=.1}else if(mode==='top'){cam.tyaw=.30;cam.tpitch=1.43}else{cam.tyaw=.78;cam.tpitch=.32;cam.tdist=SHIPS[render.idx].radius} }
$('#btn-front').onclick=()=>setView('front');$('#btn-side').onclick=()=>setView('side');$('#btn-top').onclick=()=>setView('top');$('#btn-reset').onclick=()=>setView('reset');
$('#btn-spin').onclick=()=>{cam.spin=!cam.spin;$('#btn-spin').setAttribute('aria-pressed',String(cam.spin));$('#btn-spin').querySelector('.spin-label').textContent=cam.spin?'Giro automático: ON':'Giro automático: OFF'};
$('#btn-zoom-in').onclick=()=>cam.tdist=clamp(cam.tdist*.81,6,75);$('#btn-zoom-out').onclick=()=>cam.tdist=clamp(cam.tdist*1.22,6,75);
$('#btn-next').onclick=()=>setShip((render.idx+1)%10);$('#btn-prev').onclick=()=>setShip((render.idx+9)%10);
let pointer=null;canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);cam.spin=false;$('#btn-spin').querySelector('.spin-label').textContent='Giro automático: OFF';$('#btn-spin').setAttribute('aria-pressed','false');canvas.classList.add('dragging')});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;let dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;cam.tyaw+=dx*.008;cam.tpitch=clamp(cam.tpitch+dy*.0065,-1.45,1.45)});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>canvas.addEventListener(ev,()=>{pointer=null;canvas.classList.remove('dragging')}));
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.tdist=clamp(cam.tdist*Math.exp(e.deltaY*.001),6,80)},{passive:false});canvas.addEventListener('dblclick',()=>setView('reset'));
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowRight')setShip((render.idx+1)%10);if(e.key==='ArrowLeft')setShip((render.idx+9)%10);if(e.key.toLowerCase()==='r')setView('reset')});
function fit(){let dpr=Math.min(window.devicePixelRatio||1,2),r=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h)}
gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
function draw(ts){if(!render.last)render.last=ts;let dt=Math.min(.04,(ts-render.last)/1000);render.last=ts;render.time+=dt;fit();
 if(cam.spin&&!pointer){cam.tyaw+=dt*.085}cam.yaw+=(cam.tyaw-cam.yaw)*Math.min(1,dt*7);cam.pitch+=(cam.tpitch-cam.pitch)*Math.min(1,dt*7);cam.dist+=(cam.tdist-cam.dist)*Math.min(1,dt*7);
 let eye=[cam.dist*Math.sin(cam.yaw)*Math.cos(cam.pitch),cam.dist*Math.sin(cam.pitch),cam.dist*Math.cos(cam.yaw)*Math.cos(cam.pitch)];let vp=mm(perspective(43*PI/180,canvas.width/canvas.height,.10,250),lookAt(eye,[0,0,0]));
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(prog);gl.uniformMatrix4fv(U.VP,false,vp);gl.uniform3fv(U.cam,eye);gl.uniform1f(U.time,render.time);
 const ship=render.model;if(ship){let old=null;for(let node of ship.nodes){let geo=upload(node.geo),mat=M[node.material];if(!mat)continue;if(mat!==old){gl.uniform3fv(U.color,mat.c);gl.uniform1f(U.metal,mat.metal);gl.uniform1f(U.rough,mat.rough);gl.uniform1f(U.emi,mat.emi||0);old=mat}gl.uniformMatrix4fv(U.model,false,node.matrix);gl.bindVertexArray(geo.vao);gl.drawElements(gl.TRIANGLES,geo.count,gl.UNSIGNED_SHORT,0)}}gl.bindVertexArray(null);
 render.frame=requestAnimationFrame(draw)}
setShip(0);render.frame=requestAnimationFrame(draw);
window.NaveStarHangar={openShip:(index)=>setShip(index),getShipInfo:index=>{let {build,model,...info}=SHIPS[clamp(index,0,9)];return {...info}},setView,getMeshStats:index=>{let i=clamp(index|0,0,9),sh=SHIPS[i].model||(SHIPS[i].model=SHIPS[i].build());return {objects:sh.nodes.length,triangles:sh.nodes.reduce((n,o)=>n+o.geo.indices.length/3,0)};}};
})();
