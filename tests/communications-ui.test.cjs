const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const core=require('../js/communications-core.js');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function environment(){
  class Element {
    constructor(){this.children=new Map();this.handlers=new Map();this.style={};this.dataset={};this.attributes={};this.value='';this.scrollHeight=100;this.scrollTop=0;this.clientHeight=100;this.hidden=false;this.disabled=false;this.textContent='';this.innerHTML='';this.classList={add(){},remove(){},toggle(){return false;}};}
    querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Element());return this.children.get(selector);}
    addEventListener(type,fn){this.handlers.set(type,fn);}setAttribute(name,value){this.attributes[name]=value;}
    append(...nodes){this.appended=(this.appended||[]).concat(nodes);}replaceChildren(){this.innerHTML='';}focus(){}
  }
  const body=new Element(),intervals=[],requests=[];
  const message=(id,text)=>({id,clientId:'id-'+id,senderId:id===100?1:2,name:'Alice',text,createdAt:'2026-11-11 12:00:00Z'});
  const context={console,Map,Set,Date,Math,Number,String,Promise,URLSearchParams,AbortController,Blob,
    multiplayerUserId:1,NaveCommunications:core,crewGame:{enabled:true,api:'multiplayer-api.php'},
    navigator:{mediaDevices:{},sendBeacon(){return true;}},crypto:{randomUUID:()=> 'client-000000000001'},
    document:{hidden:false,hasFocus:()=>true,body,createElement:()=>new Element(),querySelector:()=>null,addEventListener(){}},
    setTimeout:()=>1,clearTimeout(){},setInterval:(fn,ms)=>intervals.push({fn,ms}),addEventListener(){},
    fetch:async(url,options)=>{
      const query=new URLSearchParams(url.split('?')[1]),action=query.get('action'),payload=options.body?JSON.parse(options.body):null;requests.push({action,query,payload});
      let data;
      if(action==='comms-config')data={iceServers:[]};
      else if(action==='chat-roster')data={friends:[{id:2,name:'Alice <img>',online:true,unread:1}],room:null};
      else if(action==='call-poll')data={calls:[],signals:[]};
      else if(action==='chat-history')data={messages:query.get('after')?[message(99,'Unseen incoming'),{...message(100,'Reply'),clientId:'client-000000000001'}]:[message(90,'<script>hello</script>')],hasMore:false,peerReadId:0,typing:[]};
      else if(action==='chat-send')data={message:{...message(100,payload.text),clientId:payload.client_id}};
      else data={ok:true};
      return {ok:true,status:200,json:async()=>data};
    }};
  context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../js/communications.js'),'utf8'),context);
  return {context,requests,intervals,hub:body.appended[1]};
}
test('conversation UI boots, renders text safely and keeps reads behind fetched history',async()=>{
  const f=environment();await flush();f.context.communications.openChat(2,'Alice');await flush();await flush();
  const log=f.hub.querySelector('.comms-thread');assert.match(log.innerHTML,/&lt;script&gt;hello&lt;\/script&gt;/);assert.doesNotMatch(log.innerHTML,/<script>/);
  assert.match(f.hub.querySelector('.comms-roster').innerHTML,/Alice &lt;img&gt;/);
  const textarea=f.hub.querySelector('textarea');textarea.value='Reply';textarea.handlers.get('input')();
  f.hub.querySelector('.comms-compose').handlers.get('submit')({preventDefault(){}});await flush();await flush();
  const beforePoll=f.requests.filter(r=>r.action==='chat-read').map(r=>r.payload.message_id);assert.ok(beforePoll.every(id=>id<=90),'own response must not acknowledge unseen incoming messages');
  f.intervals.find(timer=>timer.ms===1700).fn();await flush();await flush();
  const history=f.requests.filter(r=>r.action==='chat-history');assert.equal(history.at(-1).query.get('after'),'90','poll cursor must not jump to the outgoing message ID');
  assert.match(log.innerHTML,/Unseen incoming/);assert.ok(f.requests.some(r=>r.action==='chat-read'&&r.payload.message_id===100));
});
