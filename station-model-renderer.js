/* Shared low-poly 3D station models used by the game and station catalog. */function stationModelDraw(ctx,body,p,player,drawTime,showLabel=false,scaleOverride=null){
    const design=Number(body.design)||0,time=drawTime;
    const scale=scaleOverride===null?(design===2?Math.min(1.15,Math.max(.035,p.r/145)):Math.min(.9,Math.max(.018,p.r/220))):scaleOverride;
    // Project the station through the same camera angles used by `project()`.
    // The previous billboard-like rotation followed the ship's position, keeping the station face-on.
    const bearing=player.yaw,spin=time*.018,basePitch=design===17?1.12:(design===18?0.92:(design===19?1.18:0.2)),stationPitch=basePitch+Math.sin(time*.13+design)*.012,stationRoll=design===15 ? 0.02 : 0.045;
    const accent=body.color||'#7bd5df',triangles=[],stationBeacons=[],focus=720;
    const rotate=v=>{const cs=Math.cos(spin),ss=Math.sin(spin),mx=v.x*cs+v.z*ss,mz=-v.x*ss+v.z*cs,mp=Math.cos(stationPitch),mq=Math.sin(stationPitch),my=v.y*mp-mz*mq,mzp=v.y*mq+mz*mp,cr=Math.cos(stationRoll),sr=Math.sin(stationRoll),rx=mx*cr-my*sr,ry=mx*sr+my*cr,cy=Math.cos(bearing),sy=Math.sin(bearing),x=rx*cy+mzp*sy,viewZ=rx*sy-mzp*cy,cp=Math.cos(player.pitch),sp=Math.sin(player.pitch);return{x,y:ry*cp-viewZ*sp,z:ry*sp+viewZ*cp}};
    const toRgb=color=>{const n=parseInt(String(color).replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255]};
    const shade=(color,light)=>{const rgb=toRgb(color);return `rgb(${rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*light)))).join(',')})`};
    function tri(a,b,c,color,glow=0){const A=rotate(a),B=rotate(b),C=rotate(c),u=[B.x-A.x,B.y-A.y,B.z-A.z],v=[C.x-A.x,C.y-A.y,C.z-A.z],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1,diffuse=Math.abs((n[0]*-.28+n[1]*.76+n[2]*.58)/len),specular=Math.pow(Math.abs(n[2]/len),16)*.22,light=.34+.48*diffuse+specular+glow;triangles.push({a:A,b:B,c:C,z:(A.z+B.z+C.z)/3,color:shade(color,light)})}
    function quad(a,b,c,d,color,glow=0){tri(a,b,c,color,glow);tri(a,c,d,color,glow)}
    function tube(a,b,r,color,segments=7){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz)||1,axis={x:dx/len,y:dy/len,z:dz/len},helper=Math.abs(axis.y)<.88?{x:0,y:1,z:0}:{x:0,y:0,z:1};let ux=axis.y*helper.z-axis.z*helper.y,uy=axis.z*helper.x-axis.x*helper.z,uz=axis.x*helper.y-axis.y*helper.x,un=Math.hypot(ux,uy,uz)||1;ux/=un;uy/=un;uz/=un;const vx=axis.y*uz-axis.z*uy,vy=axis.z*ux-axis.x*uz,vz=axis.x*uy-axis.y*ux;let prevA,prevB;for(let i=0;i<=segments;i++){const t=i/segments*Math.PI*2,ca=Math.cos(t)*r,sa=Math.sin(t)*r,ra={x:a.x+ux*ca+vx*sa,y:a.y+uy*ca+vy*sa,z:a.z+uz*ca+vz*sa},rb={x:b.x+ux*ca+vx*sa,y:b.y+uy*ca+vy*sa,z:b.z+uz*ca+vz*sa};if(prevA){quad(prevA,ra,rb,prevB,color)}prevA=ra;prevB=rb}}
    function ellipsoid(cx,cy,cz,rx,ry,rz,color,rows=Math.min(14,Math.max(6,Math.round(6+p.r/32))),cols=Math.min(22,Math.max(10,Math.round(10+p.r/20)))){for(let i=0;i<rows;i++){const a0=-Math.PI/2+i*Math.PI/rows,a1=-Math.PI/2+(i+1)*Math.PI/rows;for(let j=0;j<cols;j++){const b0=j*2*Math.PI/cols,b1=(j+1)*2*Math.PI/cols,pt=(a,b)=>({x:cx+rx*Math.cos(a)*Math.cos(b),y:cy+ry*Math.sin(a),z:cz+rz*Math.cos(a)*Math.sin(b)});quad(pt(a0,b0),pt(a0,b1),pt(a1,b1),pt(a1,b0),color)}}}
    const ringSegments=Math.min(64,Math.max(34,Math.round(34+p.r*.11))),ringSections=Math.min(12,Math.max(8,Math.round(8+p.r*.015)));
    function ring(cx,cy,cz,rx,ry,r,color){const around=ringSegments,section=ringSections;for(let i=0;i<around;i++){const a0=i*2*Math.PI/around,a1=(i+1)*2*Math.PI/around;for(let j=0;j<section;j++){const b0=j*2*Math.PI/section,b1=(j+1)*2*Math.PI/section,pt=(a,b)=>({x:cx+(rx+r*Math.cos(b))*Math.cos(a),y:cy+(ry+r*Math.cos(b))*Math.sin(a),z:cz+r*Math.sin(b)});quad(pt(a0,b0),pt(a1,b0),pt(a1,b1),pt(a0,b1),color)}}}
    function ringSide(cx,cy,cz,rz,ry,r,color){const around=ringSegments,section=ringSections;for(let i=0;i<around;i++){const a0=i*2*Math.PI/around,a1=(i+1)*2*Math.PI/around;for(let j=0;j<section;j++){const b0=j*2*Math.PI/section,b1=(j+1)*2*Math.PI/section,pt=(a,b)=>({x:cx+r*Math.sin(b),y:cy+(ry+r*Math.cos(b))*Math.cos(a),z:cz+(rz+r*Math.cos(b))*Math.sin(a)});quad(pt(a0,b0),pt(a1,b0),pt(a1,b1),pt(a0,b1),color)}}}
    function radialPod(x,y,z,angle,color){const rows=9,cols=16,rx=34,ry=18,rz=25,c=Math.cos(angle),s=Math.sin(angle);for(let i=0;i<rows;i++){const a0=-Math.PI/2+i*Math.PI/rows,a1=-Math.PI/2+(i+1)*Math.PI/rows;for(let j=0;j<cols;j++){const b0=j*2*Math.PI/cols,b1=(j+1)*2*Math.PI/cols,pt=(a,b)=>{const u=rx*Math.cos(a)*Math.cos(b),v=ry*Math.sin(a);return{x:x+u*c-v*s,y:y+u*s+v,z:z+rz*Math.cos(a)*Math.sin(b)}};quad(pt(a0,b0),pt(a0,b1),pt(a1,b1),pt(a1,b0),color)}}ellipsoid(x,y,z+rz*.82,7,7,3,accent,7,10)}
    function panel(cx,cy,cz,w,h,tilt=0){const point=(u,v,z=0)=>({x:cx+u,y:cy+v*Math.cos(tilt)-z*Math.sin(tilt),z:cz+v*Math.sin(tilt)+z*Math.cos(tilt)}),a=point(-w/2,-h/2),b=point(w/2,-h/2),c=point(w/2,h/2),d=point(-w/2,h/2);quad(a,b,c,d,'#123b66',.08);tube(a,b,1.5,accent);tube(b,c,1.5,accent);tube(c,d,1.5,accent);tube(d,a,1.5,accent);for(let i=1;i<5;i++){const x=-w/2+w*i/5;tube(point(x,-h/2,.8),point(x,h/2,.8),.65,'#65aaca')}for(let i=1;i<7;i++){const y=-h/2+h*i/7;tube(point(-w/2,y,.8),point(w/2,y,.8),.65,'#65aaca')}}
    const p3=(x,y,z)=>({x,y,z}),beam=(a,b,r=4,color='#72949e')=>tube(a,b,r,color);
    const pod=(x,y,z,rx,ry,rz,color='#436b79')=>{ellipsoid(x,y,z,rx,ry,rz,color,9,16);ellipsoid(x-rx*.38,y+ry*.25,z+rz*.72,rx*.23,ry*.12,Math.max(1,rz*.12),'#b4d1cf',6,12);ellipsoid(x+rx*.42,y,z+rz*.72,Math.max(2,rx*.08),ry*.7,Math.max(1,rz*.12),accent,6,12)};
    function box(cx,cy,cz,w,h,d,color){const x=w/2,y=h/2,z=d/2,a=p3(cx-x,cy-y,cz-z),b=p3(cx+x,cy-y,cz-z),c=p3(cx+x,cy+y,cz-z),e=p3(cx-x,cy+y,cz-z),f=p3(cx-x,cy-y,cz+z),g=p3(cx+x,cy-y,cz+z),q=p3(cx+x,cy+y,cz+z),r=p3(cx-x,cy+y,cz+z);quad(a,b,c,e,color);quad(f,r,q,g,color);quad(a,f,g,b,color);quad(b,g,q,c,color);quad(c,q,r,e,color);quad(e,r,f,a,color)}
    function litBox(cx,cy,cz,w,h,d,color=accent){box(cx,cy,cz,w,h,d,color);stationBeacons.push({point:p3(cx,cy,cz+d/2+2),color,size:3})}
    // Veintitrés siluetas 3D exclusivas para las estáciones del sector.
    if(design===0){ // Aurora: colônia circular com eixo habitável
        ring(-80,0,4,75,128,15,'#a9c6c0');ring(-80,0,12,68,120,3,accent);ring(-80,0,-12,82,136,4,'#597987');
        beam(p3(-300,0,0),p3(210,0,0),9,'#8caeb1');ellipsoid(-80,0,0,38,38,30,'#294b59',12,20);
        for(let i=0;i<12;i++){const a=i*Math.PI/6;beam(p3(-80+Math.cos(a)*64,Math.sin(a)*108,0),p3(-80+Math.cos(a)*24,Math.sin(a)*40,0),4,'#9aafb0');pod(-80+Math.cos(a)*76,Math.sin(a)*128,4,16,9,13,'#557985')}
    }else if(design===1){ // Orbitalis: base modular vertical
        beam(p3(0,-240,0),p3(0,240,0),12,'#9aafb0');ellipsoid(0,0,0,42,46,35,'#315867',12,20);
        for(const y of [-185,-105,-20,70,155]){ring(0,y,0,54,50,10,'#9aaea8');pod(0,y,0,35,24,28,'#547986');for(let side of [-1,1]){beam(p3(side*35,y,0),p3(side*110,y,0),8,'#8caeb1');pod(side*132,y,0,30,22,25,'#436c7b');stationBeacons.push({point:p3(side*153,y,20),color:accent,size:3})}}
        ring(0,218,0,75,16,8,'#d4e2dc');beam(p3(0,220,0),p3(0,286,0),5,accent);
    }else if(design===2){ // Bastião: fortaleza blindada com quatro hangares
        ring(0,0,12,155,158,18,'#718e94');ring(0,0,29,143,150,5,'#c5d3cc');ringSide(0,0,-30,146,153,14,'#3b5968');
        beam(p3(-150,0,0),p3(150,0,0),15,'#385967');ellipsoid(0,0,0,57,57,44,'#294b59',12,20);
        for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(p3(Math.cos(a)*50,Math.sin(a)*52,8),p3(Math.cos(a)*142,Math.sin(a)*145,16),5,'#b8c9c2');pod(Math.cos(a)*148,Math.sin(a)*151,18,24,18,24,'#536f79')}
        for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,x=Math.cos(a)*112,y=Math.sin(a)*118,z=i%2?55:-55;beam(p3(x*.45,y*.45,0),p3(x,y,z),8,'#afc2bc');radialPod(x*1.5,y*1.5,z*1.2,a,'#496b77');stationBeacons.push({point:p3(x*1.67,y*1.67,z*1.2),color:accent,size:4})}
        for(let side of [-1,1]){panel(side*205,side*145,48,68,92,side*.2);beam(p3(side*120,side*75,20),p3(side*184,side*129,42),6,'#849fa3')}
    }else if(design===3){ // Celestia: resort de terraços orbitais
        beam(p3(0,-220,0),p3(0,180,0),12,'#b4c9c2');
        for(const [r,y] of [[150,-110],[112,-10],[78,92]]){ring(0,y,0,r,r*.72,12,'#b4c9c2');ring(0,y,8,r-12,r*.72-10,3,accent);for(let i=0;i<12;i++){const a=i*Math.PI/6;pod(Math.cos(a)*r,Math.sin(a)*r*.72+y,0,17,10,15,'#80999a')}}
        ellipsoid(0,0,0,52,58,44,'#547582',12,20);ellipsoid(0,125,0,40,25,38,'#83b4bd',10,16);ring(0,125,0,45,29,5,'#e1d6b3');
        for(let i=0;i<6;i++){const a=i*Math.PI/3;beam(p3(Math.cos(a)*42,Math.sin(a)*42,0),p3(Math.cos(a)*120,Math.sin(a)*88,0),4,'#d1c6a6')}
    }else if(design===4){ // Khepri: radial orbital shipyard and foundry
        // A layered ring gives the yard a broad, unmistakable silhouette.
        ringSide(0,0,-24,126,126,18,'#354f5c');ring(0,0,-6,127,127,10,'#80999b');ring(0,0,20,106,106,6,'#c1ccc2');ring(0,0,43,72,72,5,'#536f78');
        ellipsoid(0,0,2,61,61,51,'#334f5d',12,20);ellipsoid(0,0,40,37,37,31,'#7c9291',12,18);ellipsoid(0,0,67,24,24,22,'#ff9e51',12,18);
        ring(0,0,69,31,31,5,'#e7c78a');stationBeacons.push({point:p3(0,0,94),color:accent,size:7});
        // Six radial dock arms carry paired pressure-locks and berth lights.
        for(let i=0;i<6;i++){const a=i*Math.PI/3,c=Math.cos(a),s=Math.sin(a),x=c*196,y=s*196,z=(i%2?34:-24);
            beam(p3(c*86,s*86,4),p3(c*158,s*158,z),9,'#9aafb0');beam(p3(c*120,s*120,z+12),p3(c*177,s*177,z+12),4,'#c5a36e');
            radialPod(c*185,s*185,z,a,'#526e79');ringSide(c*185,s*185,z+2,37,29,6,'#bac9c1');
            pod(x,y,z+18,24,18,22,'#607c82');stationBeacons.push({point:p3(c*211,s*211,z+32),color:accent,size:4});
        }
        // Trussed cargo cranes and capture arms rise above the docking ring.
        for(let i=0;i<3;i++){const a=i*2*Math.PI/3+.25,c=Math.cos(a),s=Math.sin(a),x=c*96,y=s*96;
            beam(p3(x,y,-4),p3(c*154,s*154,112),7,'#bd9560');beam(p3(c*154,s*154,112),p3(c*218,s*218,112),5,'#d1ae78');
            beam(p3(c*218,s*218,112),p3(c*218,s*218,48),4,'#8ca4a2');pod(c*218,s*218,37,13,11,17,'#687f82');
        }
        // Four framed solar wings sit at different depths around the foundry.
        for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,c=Math.cos(a),s=Math.sin(a),x=c*228,y=s*228,z=i%2?82:-72;
            beam(p3(c*118,s*118,12),p3(x*.78,y*.78,z),5,'#8da9ad');panel(x,y,z,54,78,a);
            stationBeacons.push({point:p3(x,y,z+8),color:'#64d9e7',size:2.5});
        }
        // Ore and service craft staged outside the perimeter.
        for(const [x,y,z,r] of [[-245,42,-62,20],[205,-156,70,16],[58,248,-96,13]])ellipsoid(x,y,z,r,r*.8,r,'#776f68',8,12);    }else if(design===5){ // Biosfera: laboratório com cúpulas ecológicas
        ellipsoid(0,0,0,90,78,70,'#329e67',14,22);ellipsoid(0,0,0,98,85,77,'#69bbd0',14,22);ring(0,0,0,100,88,4,'#cbd8e4');
        for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*175,y=Math.sin(a)*150;beam(p3(Math.cos(a)*76,Math.sin(a)*66,0),p3(x,y,0),5,'#a8c6c3');ellipsoid(x,y,0,38,31,33,i%2?'#457c71':'#548a79',10,16);ellipsoid(x,y,18,40,33,35,'#65b0d0',10,16);ring(x,y,18,41,34,3,accent);stationBeacons.push({point:p3(x,y,48),color:accent,size:3})}
        for(let i=0;i<4;i++){const a=i*Math.PI/2;panel(Math.cos(a)*215,Math.sin(a)*190,22,48,65,a)}
    }else if(design===6){ // Hélios: usina de energia em matriz radial
        ellipsoid(0,0,0,48,48,40,'#455d68',12,18);ring(0,0,0,58,58,7,'#d4a25e');
        for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a),y=Math.sin(a);beam(p3(x*42,y*42,0),p3(x*220,y*220,0),5,'#d8a25d');panel(x*248,y*248,15,76,104,a);stationBeacons.push({point:p3(x*204,y*204,12),color:accent,size:3})}
        beam(p3(0,-80,0),p3(0,80,0),8,'#aebfba');ring(0,0,26,72,72,4,accent);
    }else if(design===7){ // Eco Profundo: antena de comunicações e radares
        beam(p3(0,-220,0),p3(0,170,0),9,'#9aafb0');for(const y of [-175,-70,28]){pod(0,y,0,52,28,36,'#526e79');ring(0,y,0,55,30,5,'#aebfba')}
        ellipsoid(0,160,0,92,35,78,'#c8d7e9',12,20);ellipsoid(0,154,4,76,29,66,'#152d4c',12,20);beam(p3(0,130,0),p3(0,235,0),4,'#b4c5c5');ellipsoid(0,238,0,12,12,12,accent,8,12);
        for(let i=0;i<12;i++){const a=i*Math.PI/6;beam(p3(0,160,0),p3(Math.cos(a)*82,Math.sin(a)*160,Math.sin(a)*60),2,'#8caeb1')}
        for(let side of [-1,1]){panel(side*110,-105,20,60,82,side*.2);beam(p3(side*25,-76,0),p3(side*100,-112,20),4,'#8da9ad')}
    }else if(design===8){ // Éden: biodomo orbital
        ellipsoid(0,0,0,112,95,88,'#329e67',14,24);ellipsoid(0,0,4,120,101,94,'#69bbd0',14,24);ring(0,0,4,122,103,4,'#d4e2dc');ringSide(0,0,0,90,103,3,'#d4e2dc');ring(0,0,4,122,103,3,'#d4e2dc');
        for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*182,y=Math.sin(a)*150;beam(p3(Math.cos(a)*103,Math.sin(a)*82,0),p3(x,y,0),5,'#b1c5ba');ellipsoid(x,y,0,32,25,29,'#4c8970',10,16);ellipsoid(x,y,16,34,27,31,'#65b0d0',10,16);pod(x,y,-10,20,15,20,'#47866e')}
        for(let i=0;i<22;i++){const a=i*2.399,r=Math.sqrt(i/22)*82;ellipsoid(Math.cos(a)*r,Math.sin(a)*r,44,5,8,4,i%2?'#86cf83':'#d5bd72',6,8)}
    }else if(design===9){ // Círculo Infinito: cidade rotativa com docas distribuídas
        ring(0,0,15,175,178,23,'#c7d3c7');ring(0,0,34,157,160,5,'#bde9fe');ringSide(0,0,-18,171,174,12,'#526f79');ring(0,0,50,82,84,13,'#7899a2');
        beam(p3(-210,0,0),p3(210,0,0),11,'#849fa4');ellipsoid(0,0,0,58,58,48,'#294b59',12,20);
        for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.cos(a),y=Math.sin(a);beam(p3(x*82,y*84,0),p3(x*155,y*158,18),4,'#b5c9c2');pod(x*169,y*172,20,21,14,18,'#597c85');if(i%2===0)stationBeacons.push({point:p3(x*182,y*185,28),color:accent,size:2.7})}
        for(let i=0;i<6;i++){const a=i*Math.PI/3;panel(Math.cos(a)*220,Math.sin(a)*220,35,54,82,a);beam(p3(Math.cos(a)*170,Math.sin(a)*170,15),p3(Math.cos(a)*205,Math.sin(a)*205,30),4,'#8da9ad')}
    }else if(design===10){
        ring(0,0,16,190,172,18,'#93a8bc');ring(0,0,40,158,146,7,'#c6d5ee');ringSide(0,0,-30,170,154,10,'#3b4f72');ring(0,0,62,96,90,8,'#7f70d6');ellipsoid(0,0,52,54,54,42,'#313e68',12,20);ellipsoid(0,0,83,30,30,25,'#9d85ff',10,18);ring(0,0,85,42,42,5,accent);
        for(let i=0;i<10;i++){const a=i*Math.PI/5,c=Math.cos(a),s=Math.sin(a),r=190+(i%2)*16;beam(p3(c*58,s*54,18),p3(c*r,s*(r*.9),22),5,'#a7b6d0');pod(c*r,s*(r*.9),24,22,15,20,'#576686');if(i%2===0){panel(c*238,s*215,48,34,56,a);stationBeacons.push({point:p3(c*r,s*(r*.9),48),color:accent,size:4})}}
        for(let i=0;i<3;i++){const a=i*2*Math.PI/3+.3;beam(p3(Math.cos(a)*72,Math.sin(a)*68,65),p3(Math.cos(a)*126,Math.sin(a)*116,142),7,'#c3b3ff');ringSide(Math.cos(a)*126,Math.sin(a)*116,145,24,23,5,'#b6a5ff')}
    }else if(design===11){
        ring(0,0,8,158,142,20,'#91aaa8');ring(0,0,34,138,124,6,'#6fe4d8');ringSide(0,0,-28,146,132,14,'#304d61');ellipsoid(0,0,28,76,68,58,'#315269',12,20);ellipsoid(0,0,66,38,35,30,'#73d7ca',10,18);ring(0,0,66,52,46,5,'#c6f4e7');
        for(let i=0;i<6;i++){const a=i*Math.PI/3,c=Math.cos(a),s=Math.sin(a),x=c*202,y=s*181,z=(i%2)*28;beam(p3(c*72,s*64,15),p3(x,y,z),10,'#b2c7be');pod(x,y,z+10,35,23,27,'#526f7b');ringSide(x,y,z+12,35,23,5,'#b8d2c9');panel(c*225,s*203,z+48,43,57,a);stationBeacons.push({point:p3(x*1.14,y*1.14,z+31),color:accent,size:4})}for(let i=0;i<3;i++){const a=i*2*Math.PI/3;beam(p3(Math.cos(a)*48,Math.sin(a)*43,35),p3(Math.cos(a)*132,Math.sin(a)*120,88),5,'#67d8d4')}
    }else if(design===12){
        ellipsoid(0,0,18,84,72,75,'#246d61',14,24);ellipsoid(0,0,32,88,77,78,'#4aa8a3',14,24);ring(0,0,30,96,84,5,'#b6eee0');ringSide(0,0,0,68,73,4,'#d5e5cb');
        for(let i=0;i<9;i++){const a=i*2*Math.PI/9,c=Math.cos(a),s=Math.sin(a),x=c*205,y=s*176,z=20+Math.sin(a*2)*30;beam(p3(c*75,s*65,20),p3(x,y,z),6,'#acd0b5');ellipsoid(x,y,z,34,29,32,i%2?'#4e9278':'#527c76',10,16);ellipsoid(x,y,z+9,37,32,34,'#69bccc',11,18);ring(x,y,z+9,38,33,3,accent);for(let j=0;j<5;j++){const q=j*2*Math.PI/5;ellipsoid(x+Math.cos(q)*16,y+Math.sin(q)*14,z+34,4,7,4,j%2?'#b2dc81':'#f3d782',6,8)}stationBeacons.push({point:p3(x,y,z+44),color:accent,size:3.5})}for(let i=0;i<4;i++){const a=i*Math.PI/2;panel(Math.cos(a)*124,Math.sin(a)*112,112,44,68,a);beam(p3(Math.cos(a)*68,Math.sin(a)*62,55),p3(Math.cos(a)*117,Math.sin(a)*106,112),4,'#c1ddc4')}
        ring(0,0,90,126,108,4,'#d1e9d8');ellipsoid(0,0,100,26,24,20,'#a6efce',9,14);
    }else if(design===13){
        ring(0,0,6,170,158,22,'#7e8d96');ringSide(0,0,-28,162,150,17,'#3c485c');ring(0,0,38,124,116,9,'#ff7b62');ellipsoid(0,0,12,88,80,62,'#4b5261',12,20);ellipsoid(0,0,48,52,48,38,'#803f4c',11,18);ring(0,0,55,64,58,7,'#ffad71');ellipsoid(0,0,82,24,23,20,'#ffc477',10,16);
        for(let i=0;i<8;i++){const a=i*Math.PI/4,c=Math.cos(a),s=Math.sin(a),x=c*222,y=s*205,z=(i%2)*32;beam(p3(c*80,s*73,12),p3(x,y,z),12,'#a0a9ad');pod(x,y,z+8,31,23,26,'#596879');ringSide(x,y,z+9,31,23,6,'#e8a66d');beam(p3(x,y,z+20),p3(x*1.16,y*1.16,z+45),5,'#bd826b');ellipsoid(x*1.16,y*1.16,z+48,12,10,10,accent,8,12);if(i%2===0)panel(c*246,s*226,65,38,52,a);stationBeacons.push({point:p3(x*1.16,y*1.16,z+48),color:accent,size:4.5})}for(let i=0;i<4;i++){const a=i*Math.PI/2;beam(p3(Math.cos(a)*50,Math.sin(a)*46,60),p3(Math.cos(a)*108,Math.sin(a)*98,142),8,'#d89970');ellipsoid(Math.cos(a)*108,Math.sin(a)*98,143,15,15,24,'#66747c',9,14)}
    }else if(design===14){
        beam(p3(0,-255,0),p3(0,232,0),9,'#8fb9d1');ring(0,-115,0,96,76,12,'#819daa');ring(0,-25,0,148,112,9,'#b5ced7');ringSide(0,65,0,121,99,12,'#46627b');ring(0,142,0,76,58,8,'#c2d9df');ellipsoid(0,-25,0,56,50,43,'#2f5c74',11,18);ellipsoid(0,-25,36,34,32,25,'#6be0f3',10,16);ring(0,-25,38,45,41,5,accent);
        const crystal=(cx,cy,cz,r,color)=>{const top=p3(cx,cy+r,cz),bottom=p3(cx,cy-r,cz),points=[];for(let j=0;j<6;j++){const a=j*Math.PI/3;points.push(p3(cx+Math.cos(a)*r*.72,cy,cz+Math.sin(a)*r*.72))}for(let j=0;j<6;j++){const a=points[j],b=points[(j+1)%6];tri(top,a,b,color,.12);tri(bottom,b,a,'#a6d5e8',.05);if(j%2===0)stationBeacons.push({point:a,color:accent,size:3})}};crystal(0,132,0,87,'#69b9d2');crystal(0,-130,0,61,'#658ba7');
        for(let i=0;i<6;i++){const a=i*Math.PI/3,c=Math.cos(a),s=Math.sin(a);beam(p3(c*35,s*35,10),p3(c*138,s*104,0),5,'#c1d7dd');pod(c*151,s*114,0,22,16,20,'#547b8c');panel(c*208,s*157,28,42,58,a)}ring(0,185,0,48,38,4,'#a9d9e6');ellipsoid(0,243,0,13,12,12,accent,8,12);beam(p3(0,185,0),p3(0,231,0),4,'#c8e7eb');
    }else if(design===15){ // Cruz de Orion: cruz de modulos blindados
        box(0,0,0,128,150,132,'#394651');box(0,0,8,112,595,108,'#273541');box(0,0,8,590,108,106,'#303d49');box(0,0,15,108,104,590,'#35434e');
        box(0,0,82,190,158,155,'#46545d');box(0,0,92,122,112,118,'#263c4a');box(0,0,155,78,72,72,'#344c5b');
        for(const x of [-252,-196,-140,140,196,252]){box(x,0,8,36,74,84,'#414d55');for(const y of [-30,0,30])litBox(x,y,53,11,8,3)}
        for(const y of [-252,-194,-136,136,194,252]){box(0,y,8,72,36,84,'#414d55');for(const x of [-27,0,27])litBox(x,y,53,8,11,3)}
        for(const z of [-250,-190,-130,130,190,250]){box(0,0,z,78,70,34,'#46525a');litBox(0,0,z+19,24,18,3)}
        for(const [x,y,z] of [[0,300,8],[0,-300,8],[300,0,8],[-300,0,8],[0,0,300],[0,0,-300]]){box(x,y,z,82,64,82,'#52616b');box(x,y,z+42,44,35,4,'#172b39');litBox(x,y,z+46,18,6,3)}
    }else if(design===16){ // Anel de Gaia: habitat circular com anel de docas
        ring(0,0,0,230,220,25,'#657983');ring(0,0,22,218,208,12,'#a1b7b9');ring(0,0,42,198,190,5,'#435968');ringSide(0,0,-16,224,214,15,'#354c5b');ring(0,0,65,146,140,8,'#89a2a8');
        ellipsoid(0,0,20,62,62,55,'#364f60',13,22);ellipsoid(0,0,59,34,34,29,'#547a88',11,18);ring(0,0,63,48,48,5,accent);
        for(let i=0;i<24;i++){const a=i*Math.PI/12,c=Math.cos(a),s=Math.sin(a),x=c*220,y=s*210;beam(p3(c*76,s*73,4),p3(x,y,12),5,'#b3c1bd');box(x,y,20,34,25,54,'#506773');box(x,y,49,20,3,3,accent);if(i%2===0)stationBeacons.push({point:p3(x,y,58),color:accent,size:3.5})}
        for(let i=0;i<12;i++){const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);beam(p3(c*145,s*140,4),p3(c*202,s*193,10),6,'#899da0');panel(c*270,s*258,34,46,64,a)}
        for(let i=0;i<8;i++){const a=i*Math.PI/4;pod(Math.cos(a)*262,Math.sin(a)*250,28,25,18,22,'#526d79')}
    }else if(design===17){ // Anel de Nereida: anel baixo e largo de mineracao orbital
        ring(0,0,0,265,205,17,'#485c6a');ring(0,0,20,252,194,8,'#99abb0');ring(0,0,42,224,170,5,'#58b8d0');ringSide(0,0,-14,258,199,14,'#293f50');ring(0,0,60,112,86,8,'#6a8996');
        ellipsoid(0,0,12,57,47,43,'#354f60',12,20);ellipsoid(0,0,50,29,25,23,'#638797',10,18);
        for(let i=0;i<16;i++){const a=i*Math.PI/8,c=Math.cos(a),s=Math.sin(a),x=c*250,y=s*193;beam(p3(c*65,s*50,12),p3(x,y,8),5,'#b5c3be');box(x,y,17,47,26,54,'#586a76');ringSide(x,y,18,27,19,3,'#b3c1bd');if(i%2===0){litBox(x,y,48,14,7,3);stationBeacons.push({point:p3(x,y,53),color:accent,size:3})}}
        for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(p3(Math.cos(a)*90,Math.sin(a)*70,0),p3(Math.cos(a)*226,Math.sin(a)*172,0),5,'#92a7ad')}
    }else if(design===18){ // Cupula Helix: esfera central protegida por anel e torres
        ring(0,0,0,225,220,21,'#708991');ring(0,0,23,211,206,7,'#c3d2d0');ringSide(0,0,-18,216,210,13,'#344e60');ring(0,0,50,154,149,8,'#52c6dc');
        ellipsoid(0,0,4,117,110,106,'#284a62',16,26);ellipsoid(0,12,35,103,97,89,'#397d9a',15,24);ellipsoid(0,23,63,78,76,70,'#72c4d8',14,22);ellipsoid(0,26,82,47,45,43,'#a5ddeb',12,20);ring(0,0,3,122,114,6,'#c8d4cc');
        for(let i=0;i<12;i++){const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a),x=c*210,y=s*204;beam(p3(c*100,s*96,0),p3(x,y,15),8,'#b6c8c4');box(x,y,25,31,44,48,'#566e7b');box(x,y,52,18,4,3,accent);stationBeacons.push({point:p3(x,y,58),color:accent,size:4});if(i%3===0){beam(p3(x,y,42),p3(x*1.05,y*1.05,130),8,'#91a9b0');pod(x*1.05,y*1.05,147,26,20,24,'#617e88')}}
        for(let i=0;i<4;i++){const a=i*Math.PI/2;panel(Math.cos(a)*273,Math.sin(a)*266,28,44,72,a)}
    }else if(design===19){ // Gemeas de Eos: duas cidades circulares ligadas por eixo
        ring(0,-112,0,204,192,19,'#788d91');ring(0,-93,18,190,180,6,'#e2c48c');ringSide(0,-105,-17,198,187,12,'#3b5361');ring(0,112,0,157,148,16,'#82979a');ring(0,128,18,144,137,6,'#7ce1dc');ringSide(0,117,-14,151,143,11,'#344b5d');
        beam(p3(0,-175,0),p3(0,174,0),20,'#4b606a');ellipsoid(0,0,0,76,74,70,'#2d4b59',13,22);ellipsoid(0,0,43,45,43,39,'#71919a',12,20);ring(0,0,50,57,54,6,accent);
        for(const [y,rx,ry] of [[-112,194,182],[112,148,139]])for(let i=0;i<16;i++){const a=i*Math.PI/8,c=Math.cos(a),s=Math.sin(a),x=c*rx,yy=y+s*ry;beam(p3(c*75,y+s*70,8),p3(x,yy,8),5,'#bbc8c1');box(x,yy,22,30,24,44,'#536873');if(i%2===0)litBox(x,yy,46,11,6,3)}
        for(let i=0;i<6;i++){const a=i*Math.PI/3,c=Math.cos(a),s=Math.sin(a);beam(p3(c*92,s*88,-5),p3(c*158,s*150,0),8,'#a3b6b5');pod(c*160,s*150,10,22,17,20,'#596f79')}
    }else if(design===20){ // Bastilha de Orion: plataforma larga em H, com docas em degraus
        box(0,0,0,132,154,142,'#394954');box(0,0,12,96,610,108,'#273541');box(0,0,12,610,92,110,'#303d49');
        box(-190,0,20,220,126,154,'#46545d');box(190,0,20,220,126,154,'#46545d');box(0,-190,20,126,220,154,'#3c4d59');box(0,190,20,126,220,154,'#3c4d59');
        box(-190,0,105,142,84,30,'#243b4b');box(190,0,105,142,84,30,'#243b4b');box(0,-190,105,78,142,30,'#243b4b');box(0,190,105,78,142,30,'#243b4b');
        for(const x of [-278,-220,220,278])for(const y of [-42,42]){box(x,y,20,38,52,90,'#56636a');litBox(x,y,68,16,8,4)}
        for(const y of [-278,-220,220,278])for(const x of [-42,42]){box(x,y,20,52,38,90,'#56636a');litBox(x,y,68,8,16,4)}
        for(const [x,y] of [[-300,-100],[-300,100],[300,-100],[300,100]]){box(x,y,0,68,78,125,'#354653');box(x,y,68,38,44,8,'#142d3b');litBox(x,y,74,24,16,4)}
    }else if(design===21){ // Lanca de Orion: quilha comprida e asas diagonais blindadas
        box(0,0,0,118,160,144,'#394954');box(0,0,18,116,650,102,'#263743');box(0,0,76,78,420,38,'#344957');
        for(const side of [-1,1]){beam(p3(0,side*78,6),p3(side*218,side*250,15),18,'#637680');beam(p3(side*218,side*250,15),p3(side*304,side*306,15),13,'#425761');box(side*231,side*245,26,176,112,142,'#46545d');box(side*285,side*294,40,96,76,88,'#344956');litBox(side*285,side*294,87,34,8,4);beam(p3(0,side*126,12),p3(side*178,side*212,12),7,'#a8b8b8');
            for(const offset of [-42,0,42]){box(side*270,side*245+offset,99,30,25,12,'#657780');litBox(side*270,side*245+offset,106,12,5,3)}}
        for(const y of [-260,-185,185,260]){box(0,y,3,80,54,82,'#53616a');litBox(0,y,48,26,8,4)}
        box(0,-330,12,142,66,110,'#59666c');box(0,330,12,142,66,110,'#59666c');litBox(0,-330,72,40,12,4);litBox(0,330,72,40,12,4);
    }else if(design===22){ // Coroa de Orion: fortaleza radial com tres bracos em cada eixo
        box(0,0,0,178,178,160,'#46545d');box(0,0,76,128,128,48,'#263b49');box(0,0,104,72,72,16,'#5b6870');
        for(let i=0;i<8;i++){const a=i*Math.PI/4,c=Math.cos(a),s=Math.sin(a),x=c*258,y=s*258;beam(p3(c*78,s*78,12),p3(c*208,s*208,12),18,'#596a73');beam(p3(c*208,s*208,12),p3(x,y,12),12,'#374b58');box(x,y,25,112,92,136,'#46555e');box(x*1.09,y*1.09,86,72,58,12,'#243d4d');litBox(x*1.09,y*1.09,94,32,18,4);box(c*154,s*154,70,56,50,48,'#5c6970');stationBeacons.push({point:p3(x,y,99),color:accent,size:4})}
        ring(0,0,8,120,120,11,'#74848a');ring(0,0,29,101,101,5,'#334c5b');
        for(const [x,y] of [[0,-314],[314,0],[0,314],[-314,0]]){box(x,y,4,80,80,120,'#354854');litBox(x,y,70,26,26,5)}
    }else{
        ring(0,0,15,175,178,23,'#c7d3c7');ring(0,0,34,157,160,5,'#bde9fe');ringSide(0,0,-18,171,174,12,'#526f79');ring(0,0,50,82,84,13,'#7899a2');beam(p3(-210,0,0),p3(210,0,0),11,'#849fa4');ellipsoid(0,0,0,58,58,48,'#294b59',12,20);
        for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.cos(a),y=Math.sin(a);beam(p3(x*82,y*84,0),p3(x*155,y*158,18),4,'#b5c9c2');pod(x*169,y*172,20,21,14,18,'#597c85');if(i%2===0)stationBeacons.push({point:p3(x*182,y*185,28),color:accent,size:2.7})}for(let i=0;i<6;i++){const a=i*Math.PI/3;panel(Math.cos(a)*220,Math.sin(a)*220,35,54,82,a);beam(p3(Math.cos(a)*170,Math.sin(a)*170,15),p3(Math.cos(a)*205,Math.sin(a)*205,30),4,'#8da9ad')}
    }
    // Lit docking beacons sit on the modules rather than on a flat overlay.
    triangles.sort((a,b)=>a.z-b.z);ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
    const projectLocal=v=>{const den=Math.max(180,focus-v.z);return{x:v.x*focus/den,y:-v.y*focus/den}};
    for(const t of triangles){const a=projectLocal(t.a),b=projectLocal(t.b),c=projectLocal(t.c);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.fillStyle=t.color;ctx.fill()}
    if(stationBeacons.length){ctx.save();ctx.globalCompositeOperation='lighter';for(const beacon of stationBeacons){const q=projectLocal(rotate(beacon.point)),pulse=.82+Math.sin(time*3+q.x*.02)*.18;ctx.globalAlpha=pulse;ctx.fillStyle=beacon.color;ctx.shadowColor=beacon.color;ctx.shadowBlur=9;ctx.beginPath();ctx.arc(q.x,q.y,beacon.size,0,Math.PI*2);ctx.fill()}ctx.restore()}
    const hub={x:design===9?0:(design===2?168*Math.sin(bearing):-72*Math.cos(bearing)+14*Math.sin(bearing)),y:0};const glow=ctx.createRadialGradient(hub.x,hub.y,2,hub.x,hub.y,36);glow.addColorStop(0,'#efffff');glow.addColorStop(.22,accent);glow.addColorStop(1,'rgba(40,160,190,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(hub.x,hub.y,36,0,Math.PI*2);ctx.fill();ctx.restore();
    if(showLabel&&p.r>8){ctx.save();ctx.textAlign='center';ctx.font='10px Space Mono';ctx.fillStyle='#d9f7f6';ctx.shadowColor='#020711';ctx.shadowBlur=7;ctx.fillText(body.name.toUpperCase(),p.x,p.y+Math.min(p.r*.9,150*scale)+18);ctx.restore()}
}

window.stationModelRenderer={draw(ctx,body,canvas,options={}){const design=Number(body.design)||0,p={x:options.x??canvas.width/2,y:options.y??canvas.height/2,r:options.radius??95},players={yaw:options.yaw===undefined?0.45:options.yaw,pitch:options.pitch===undefined?0.12:options.pitch},scaleByDesign={0:.37,1:.25,2:.39,3:.34,4:.29,5:.40,6:.25,7:.32,8:.38,9:.34,10:.29,11:.27,12:.29,13:.27,14:.29,15:.27,16:.31,17:.31,18:.33,19:.31,20:.20,21:.19,22:.23},scale=(scaleByDesign[design]||.34)*(Number(options.scaleFactor)||1);stationModelDraw(ctx,body,p,players,performance.now()/1000,false,scale)}};
