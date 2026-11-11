const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../js/flight-model.js');

const initial = () => ({ yaw:0, pitch:0, speed:0, turn:0, lift:0, boost:100 });
const controls = extra => ({ yaw:0, pitch:0, throttle:0, strafe:0, brake:false, boost:false, fuel:true, ...extra });
test('flight travels consistently at 30, 60 and 120 fps', () => {
  const simulate = fps => {
    const ship=initial(); let z=0;
    for(let i=0;i<fps*6;i++)z+=model.step(ship,controls({throttle:1}),1/fps).z;
    return {ship,z};
  };
  const a=simulate(30),b=simulate(60),c=simulate(120);
  assert.equal(a.ship.speed,30); assert.equal(c.ship.speed,30);
  assert.ok(Math.abs(a.z-b.z)/Math.abs(b.z)<.005);
  assert.ok(Math.abs(c.z-b.z)/Math.abs(b.z)<.005);
});
test('analog direction changes heading and altitude without setting throttle', () => {
  const ship=initial();ship.speed=10;
  let y=0;
  for(let i=0;i<60;i++)y+=model.step(ship,controls({yaw:.5,pitch:.5}),1/60).y;
  assert.ok(ship.yaw>.5 && ship.yaw<1);assert.ok(ship.pitch>.5);assert.ok(y>0);assert.equal(ship.speed,10);
  const before=ship.yaw;
  for(let i=0;i<60;i++)model.step(ship,controls(),1/60);
  assert.ok(ship.yaw-before<.1,'assist damps rotation when controls are released');
});
test('braking stops a boosted ship and empty fuel limits movement', () => {
  const ship=initial();ship.speed=50;
  for(let i=0;i<60;i++)model.step(ship,controls({brake:true}),1/60);
  assert.equal(ship.speed,0);
  for(let i=0;i<120;i++)model.step(ship,controls({throttle:1,boost:true,fuel:false}),1/60);
  assert.ok(ship.speed<=.35);assert.equal(ship.boost,100);
});
test('boost depletes, then recharges before activating again', () => {
  const ship=initial();let exhausted=false,recharged=false;
  for(let i=0;i<600;i++){
    const result=model.step(ship,controls({boost:true}),1/60);
    if(ship.boostLocked){exhausted=true;assert.equal(result.boosting,false);}
    if(exhausted&&result.boosting)recharged=true;
    assert.ok(ship.boost>=0&&ship.boost<=100);
  }
  assert.ok(exhausted&&recharged);
});
test('aim rejects targets behind, outside the cone, above the ray or out of range', () => {
  const p={x:0,y:0,z:0},dir=model.forward(0);
  assert.equal(model.aim(p,dir,{x:0,y:0,z:-1000}).hit,true);
  for(const target of [{x:0,y:0,z:1000},{x:300,y:0,z:-1000},{x:0,y:300,z:-1000},{x:0,y:0,z:-25001}])assert.equal(model.aim(p,dir,target).hit,false);
  assert.equal(model.aim(p,model.forward(0,Math.PI/4),{x:0,y:1000,z:-1000}).hit,true);
});

// Run the actual integration controller without a renderer, server or live player data.
function environment(multiplayer=false) {
  const handlers=new Map(),nodes=new Map();let time=1000,modal=false;
  function node(name) {
    if(nodes.has(name))return nodes.get(name);
    const value={name,hidden:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},
      addEventListener(type,fn){const key=name+':'+type;handlers.set(key,[...(handlers.get(key)||[]),fn]);},
      querySelector(selector){if(selector==='.flight-help:not([hidden])')return null;return node(name+selector);},
      querySelectorAll(){return [];},appendChild(){},setAttribute(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:1000,height:700};}};
    nodes.set(name,value);return value;
  }
  const context={console,Map,Set,Math,Number,Promise,setTimeout(){},performance:{now:()=>time},NaveStarFlight:model,
    player:{x:0,y:0,z:0,yaw:0,pitch:0,speed:0},shipHull:100,shipClass:'explorer',fuelUnits:1000,positionReady:false,
    remoteShips:[],bodies:[],destroyedAsteroids:new Set(),asteroidEffects:new Map(),asteroidDamage:{},
    weaponSystem:{installed:true,mounts:[{kind:'pulse',damage:25,ammo:10}]},multiplayerEnabled:multiplayer,
    selected:null,targetManuallyChosen:false,stationAutoTargetId:null,combatTargetId:0,autopilot:false,orbitMode:false,routeTarget:null,followTargetId:0,routeMessage:'',combatMessage:'',
    cameraYaw:0,cameraPitch:0,cameraYawTarget:0,cameraPitchTarget:0,shipBank:0,
    dockingCinematic:{active:false},pilotCabinAutopilot:false,miningState:{active:false},mineFeedbackUntil:0,
    W:1000,H:700,dist3:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),fmt:Math.round,
    project:body=>({x:500,y:350,r:body.r,z:1000}),renderFireControls(){},closeProfile(){},pollCombatWorld(){},savePosition(){},
    destroyAsteroid(id){context.destroyedAsteroids.add(id);},moveShip(x,z,y){context.player.x+=x;context.player.y+=y;context.player.z+=z;},
    document:{hidden:false,body:node('body'),createElement:()=>node('hud'),querySelector(selector){return selector.includes('.crew-interior.open')?(modal?node('modal'):null):node(selector);},addEventListener:(type,fn)=>node('document').addEventListener(type,fn)},
    addEventListener:(type,fn)=>node('window').addEventListener(type,fn)};
  context.window=context;context.document.querySelector=((original)=>selector=>selector.includes('.crew-interior.open')?(modal?node('modal'):null):original(selector))(context.document.querySelector);
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../js/flight-combat.js'),'utf8'),context);
  return {c:context,advance(ms){time+=ms;},modal(on){modal=on;},emit(name,type,extra={}){const event={button:0,pointerId:1,target:{closest:()=>null},preventDefault(){},stopImmediatePropagation(){},...extra};for(const fn of handlers.get(name+':'+type)||[])fn(event);}};
}
test('controller hits the nearest asteroid; lock never bypasses aim; damage fragments it', async () => {
  const env=environment(),c=env.c;
  c.bodies=[{id:'near',type:'Asteroide',x:0,y:0,z:-1000,r:40,name:'Near'},{id:'far',type:'Asteroide',x:0,y:0,z:-2000,r:40,name:'Far'}];
  c.flightCombat.select({id:'far',type:'rock',body:c.bodies[1]});
  await c.flightCombat.fire();assert.equal(c.asteroidDamage.near,25);assert.equal(c.asteroidDamage.far,undefined);
  assert.equal(c.weaponSystem.mounts[0].ammo,9);
  await c.flightCombat.fire();assert.equal(c.weaponSystem.mounts[0].ammo,9,'cadence prevents duplicate fire');
  for(let i=0;i<3;i++){env.advance(200);await c.flightCombat.fire();}
  assert.ok(c.destroyedAsteroids.has('near'));
  env.advance(200);await c.flightCombat.fire();assert.equal(c.asteroidDamage.far,25);
  c.player.yaw=Math.PI;env.advance(200);await c.flightCombat.fire();
  assert.equal(c.asteroidDamage.far,25);assert.equal(c.weaponSystem.mounts[0].ammo,4,'miss still consumes ammo');
});
test('continuous fire and movement stop on blur, modal or passenger role', async () => {
  const env=environment(),c=env.c;
  env.emit('window','keydown',{code:'KeyW'});c.flightCombat.step(1);assert.ok(c.player.speed>0);
  env.emit('window','keydown',{code:'Space'});const ammo=c.weaponSystem.mounts[0].ammo;
  env.emit('window','blur');env.advance(250);c.flightCombat.tick(1250,1);
  assert.equal(c.weaponSystem.mounts[0].ammo,ammo);
  env.modal(true);await c.flightCombat.fire();assert.equal(c.weaponSystem.mounts[0].ammo,ammo);
  env.modal(false);c.crewRole='passenger';await c.flightCombat.fire();assert.equal(c.weaponSystem.mounts[0].ammo,ammo);
});
test('multiplayer applies only confirmed damage and serializes each weapon request', async () => {
  const env=environment(true),c=env.c;let resolve,requests=0;
  c.remoteShips=[{id:2,x:0,y:0,z:-1000,hull:100,username:'Test'}];
  c.socialRequest=(action,payload)=>{assert.equal(action,'weapon-fire');assert.equal(payload.user_id,2);requests++;return new Promise(r=>resolve=r);};
  const pending=c.flightCombat.fire();env.advance(500);await c.flightCombat.fire();assert.equal(requests,1);assert.equal(c.remoteShips[0].hull,100);
  resolve({hit:true,hull:75,ammo:9,destroyed:false});await pending;assert.equal(c.remoteShips[0].hull,75);assert.equal(c.weaponSystem.mounts[0].ammo,9);
});
test('server miss and failure cannot damage a ship; a later confirmed kill removes it', async () => {
  const env=environment(true),c=env.c;
  c.remoteShips=[{id:2,x:0,y:0,z:-1000,hull:25,username:'Test'}];
  c.socialRequest=async()=>({hit:false,ammo:9,destroyed:false});
  await c.flightCombat.fire();assert.equal(c.remoteShips[0].hull,25);assert.equal(c.weaponSystem.mounts[0].ammo,9);
  c.socialRequest=async()=>{throw new Error('Offline');};env.advance(200);
  await c.flightCombat.fire();assert.equal(c.remoteShips[0].hull,25);assert.equal(c.weaponSystem.mounts[0].ammo,9);
  c.socialRequest=async()=>({hit:true,hull:0,ammo:8,destroyed:true});env.advance(200);
  await c.flightCombat.fire();assert.equal(c.remoteShips.length,0);assert.equal(c.combatTargetId,0);
});
test('analog release and text entry never leave a steering command active', () => {
  const env=environment(),c=env.c;
  c.flightCombat.setStick(.5,-.5);c.flightCombat.step(1);assert.ok(c.player.yaw>0&&c.player.pitch>0);
  c.flightCombat.setStick(0,0);c.flightCombat.release();const before=c.player.yaw;
  c.flightCombat.step(1);assert.equal(c.player.yaw,before);
  const speed=c.player.speed;
  env.emit('window','keydown',{code:'KeyW',target:{closest:()=>({tagName:'INPUT'})}});
  c.flightCombat.step(1);assert.equal(c.player.speed,speed);
});
test('inline game scripts remain syntactically valid after PHP interpolation', () => {
  const source=fs.readFileSync(require.resolve('../index.php'),'utf8').replace(/<\?(?:php|=)[\s\S]*?\?>/g,'null');
  const scripts=[...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
  assert.doesNotThrow(()=>new vm.Script(scripts));
});
