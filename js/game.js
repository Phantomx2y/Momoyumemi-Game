// ─────────────────────────────────────────────────────────────────────────────
// game.js  –  Canvas setup, game state, background rendering, physics,
//             shield / HUD helpers, and the main game loop.
// ─────────────────────────────────────────────────────────────────────────────

const cv=document.getElementById('c'),X=cv.getContext('2d');
cv.width=window.innerWidth;cv.height=window.innerHeight;
const W=cv.width,H=cv.height;
let F=0,gameOn=false,playerName='',selChar=0,selTheme=0;
let score=0,peachCount=0,peachProg=0,hasShield=false,shieldTimer=0,stage=0,clearObsTimer=0;

const NFTS=IMG_DATA.map(d=>{const img=new Image();img.src=d;return img;});
const CNAMES=['Seishun Drifter','Yandere Blitz','Akuma Gothic','Capybara Shinigami','Konbini Kuudere'];

const THEMES=[
  {key:'momo',    label:'桃夢見',    emoji:'🌸',wallCol:'#580838',wallEdge:'#f030a0',sky:['#100820','#220a30','#1a0828'],okk:'夢の終わり',ott:'MOMO',  os2:'she woke up',   drawBG:drawBG_Momo},
  {key:'shirayuki',label:'Shirayuki',emoji:'❄️',wallCol:'#0a1830',wallEdge:'#60c0ff',sky:['#050d18','#0a1828','#0d1e30'],okk:'氷の終わり',ott:'RUKIA', os2:'frozen',        drawBG:drawBG_Shirayuki},
  {key:'capsule', label:'Capsule',   emoji:'🔵',wallCol:'#001830',wallEdge:'#00ccff',sky:['#000a14','#001828','#001030'],okk:'GAME OVER', ott:'BULMA', os2:'back to the lab',drawBG:drawBG_Capsule},
  {key:'grandline',label:'Grand Line',emoji:'🌊',wallCol:'#0a2840',wallEdge:'#ffaa00',sky:['#0a1830','#1a3050','#061828'],okk:'SHIPWRECK', ott:'NAMI',  os2:'lost at sea',   drawBG:drawBG_GrandLine},
  {key:'ackerman',label:'Ackerman',  emoji:'⚔️',wallCol:'#101820',wallEdge:'#6688aa',sky:['#060c14','#0c1828','#080e18'],okk:'TITAN BREACH',ott:'MIKASA',os2:'retreat',    drawBG:drawBG_Ackerman},
];

// BG elements
const bld=Array.from({length:7},(_,i)=>({x:i*230,w:80+Math.random()*30,h:100+Math.random()*80}));
const bld2=Array.from({length:7},(_,i)=>({x:i*230,w:75+Math.random()*30,h:90+Math.random()*75}));
const tor=Array.from({length:6},(_,i)=>({x:i*280}));
const midB=Array.from({length:8},(_,i)=>({x:i*155,w:32+Math.random()*16,h:50+Math.random()*40}));
const flt=Array.from({length:10},(_,i)=>({x:Math.random()*W,y:20+Math.random()*(H-40),t:i%5,sz:9+Math.random()*13,al:0.06+Math.random()*0.12,vx:0.07+Math.random()*0.11,rot:Math.random()*Math.PI*2,ph:Math.random()*Math.PI*2}));
const petArr=Array.from({length:40},()=>({x:Math.random()*W,y:Math.random()*H,vx:-(0.4+Math.random()*0.7),vy:0.1+Math.random()*0.25,sz:2+Math.random()*5,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.04,dr:Math.random()*Math.PI*2}));
const snow=Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H,vx:-(0.2+Math.random()*0.5),vy:0.3+Math.random()*0.5,sz:2+Math.random()*7,rot:Math.random()*Math.PI*2,rv:(Math.random()-0.5)*0.015,al:0.3+Math.random()*0.6}));
const techP=Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H,vx:-(1+Math.random()*2),vy:(Math.random()-0.5)*0.5,sz:1+Math.random()*2,col:Math.random()<0.5?'#00e5ff':'#fff',al:0.4+Math.random()*0.5}));
const sparkles=Array.from({length:35},()=>({x:Math.random()*W,y:Math.random()*H,ph:Math.random()*Math.PI*2,sz:2+Math.random()*4}));
const odmL=Array.from({length:8},()=>({x:Math.random()*W,y:Math.random()*H,len:80+Math.random()*160,angle:-0.4+Math.random()*0.8,vx:-(2+Math.random()*2),al:0.2+Math.random()*0.3}));

function scrollBG(){
  bld.forEach(b=>{b.x-=0.4;if(b.x+b.w<0)b.x+=7*230;});
  bld2.forEach(b=>{b.x-=0.6;if(b.x+b.w<0)b.x+=7*230;});
  tor.forEach(b=>{b.x-=1.2;if(b.x+70<0)b.x+=6*280;});
  midB.forEach(b=>{b.x-=2;if(b.x+b.w<0)b.x+=8*155;});
  flt.forEach(d=>{d.x-=d.vx;d.rot+=0.007;if(d.x<-30)d.x=W+30;});
  petArr.forEach(p=>{p.x+=p.vx;p.y+=p.vy+Math.sin(F*0.016+p.dr)*0.14;p.rot+=p.rv;if(p.x<-12){p.x=W+8;p.y=Math.random()*H;}});
  snow.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.rot+=p.rv;if(p.x<-12||p.y>H+10){p.x=Math.random()<0.5?W+5:Math.random()*W;p.y=-10;}});
  techP.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<-5){p.x=W+5;p.y=Math.random()*H;}});
  sparkles.forEach(p=>p.ph+=0.04);
  odmL.forEach(l=>{l.x+=l.vx;if(l.x+l.len<0){l.x=W+50;l.y=Math.random()*H;}});
}

function fe(x,y,s=0.13){const dx=(x-W/2)/W*2,dy=(y-H/2)/H*2,r=Math.sqrt(dx*dx+dy*dy),f=1+s*r*r;return[W/2+dx*f*W/2,H/2+dy*f*H/2];}
function vs(col){const v=X.createRadialGradient(W/2,H/2,H*0.14,W/2,H/2,H*0.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,col);X.fillStyle=v;X.fillRect(0,0,W,H);X.fillStyle='rgba(0,0,0,0.045)';for(let y=0;y<H;y+=3)X.fillRect(0,y,W,1);}


// ── Background draw functions ─────────────────────────────────────────────────

function drawBG_Momo(f){
  const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#100820');g.addColorStop(0.5,'#220a30');g.addColorStop(1,'#1a0828');X.fillStyle=g;X.fillRect(0,0,W,H);
  for(let i=0;i<50;i++){const sx=(i*137+61)%W,sy=(i*89+47)%H,sb=0.3+0.7*Math.sin(f*0.03+i*0.8);X.fillStyle=`rgba(248,218,232,${sb*0.5})`;X.beginPath();X.arc(sx,sy,i%6===0?1.8:0.9,0,Math.PI*2);X.fill();}
  const[mx,my]=fe(W*0.78,H*0.12);X.save();X.fillStyle='#fde8d4';X.beginPath();X.arc(mx,my,48,0,Math.PI*2);X.fill();X.fillStyle='#100820';X.beginPath();X.arc(mx+15,my-8,41,0,Math.PI*2);X.fill();X.fillStyle='rgba(249,200,216,0.2)';X.font='17px serif';X.textAlign='center';X.fillText('夢',mx-9,my+6);X.restore();
  bld.forEach(b=>{const[fx]=fe(b.x+b.w/2,H/2);X.fillStyle='#130818';X.fillRect(fx-b.w/2,H-b.h,b.w,b.h);X.fillStyle='rgba(249,150,100,0.09)';for(let r=0;r<4;r++)for(let c=0;c<2;c++)if(Math.sin(f*0.012+r+c+b.x*0.1)>0)X.fillRect(fx-b.w/2+7+c*23,H-b.h+16+r*25,9,12);});
  tor.forEach(t=>{const[fx]=fe(t.x+28,H*0.5);X.fillStyle='#801e40';X.fillRect(fx-3,H*0.28,5,H*0.72);X.fillRect(fx+46,H*0.28,5,H*0.72);X.fillRect(fx-10,H*0.26,64,9);X.fillRect(fx-6,H*0.30,58,7);});
  midB.forEach(b=>{const[fx]=fe(b.x,H-b.h);X.fillStyle='#180528';X.fillRect(fx,H-b.h,b.w,b.h);});
  flt.forEach(d=>{const[fx,fy]=fe(d.x,d.y+Math.sin(f*0.022+d.ph)*8);X.save();X.globalAlpha=d.al*(0.7+0.3*Math.sin(f*0.035+d.ph));X.translate(fx,fy);X.rotate(d.rot);X.fillStyle='#f9c0d0';if(d.t===0){X.font=`${d.sz*1.8}px serif`;X.textAlign='center';X.textBaseline='middle';X.fillText('✦',0,0);}else if(d.t===1){X.beginPath();X.arc(0,0,d.sz,0,Math.PI*2);X.fill();X.fillStyle='#100820';X.beginPath();X.arc(d.sz*0.38,-d.sz*0.2,d.sz*0.76,0,Math.PI*2);X.fill();}else{X.fillStyle='#f9a870';X.beginPath();X.arc(0,0,d.sz,0,Math.PI*2);X.fill();}X.restore();});
  petArr.forEach(p=>{const[fx,fy]=fe(p.x,p.y);X.save();X.translate(fx,fy);X.rotate(p.rot);X.fillStyle=['#f9d0c0','#f9c0d0','#fdeae0','#f4b0c0','#fde0d0'][Math.floor((p.x*p.y+1)%5)];X.globalAlpha=0.62;X.beginPath();X.ellipse(0,0,p.sz,p.sz*0.5,0,0,Math.PI*2);X.fill();X.restore();});
  vs('rgba(4,0,10,0.55)');
}
function drawBG_Shirayuki(f){
  const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#050d18');g.addColorStop(0.5,'#0a1828');g.addColorStop(1,'#0d1e30');X.fillStyle=g;X.fillRect(0,0,W,H);
  X.fillStyle='#0d2040';X.fillRect(0,H*0.75,W,H*0.25);
  for(let i=0;i<18;i++){const ix=(i*97+33)%W;X.fillStyle=`rgba(180,220,255,${0.15+0.1*(i%3)})`;X.beginPath();X.moveTo(ix,H);X.lineTo(ix+12,H*0.75);X.lineTo(ix+24,H);X.closePath();X.fill();}
  tor.forEach(t=>{const[fx]=fe(t.x+28,H*0.5);X.fillStyle='rgba(160,210,255,0.3)';X.fillRect(fx-3,H*0.25,5,H*0.5);X.fillRect(fx+46,H*0.25,5,H*0.5);X.fillRect(fx-10,H*0.23,64,9);X.fillRect(fx-6,H*0.27,58,7);});
  bld.forEach(b=>{const[fx]=fe(b.x+b.w/2,H/2);X.fillStyle='rgba(15,35,60,0.9)';X.fillRect(fx-b.w/2,H-b.h,b.w,b.h);X.strokeStyle='rgba(140,200,255,0.2)';X.lineWidth=0.5;X.strokeRect(fx-b.w/2,H-b.h,b.w,b.h);});
  const[mx,my]=fe(W*0.75,H*0.12);X.save();X.fillStyle='#e8f4ff';X.beginPath();X.arc(mx,my,52,0,Math.PI*2);X.fill();X.fillStyle='#050d18';X.beginPath();X.arc(mx+14,my-8,45,0,Math.PI*2);X.fill();X.fillStyle='rgba(200,230,255,0.25)';X.font='16px serif';X.textAlign='center';X.fillText('白雪',mx-8,my+6);X.restore();
  snow.forEach(p=>{const[fx,fy]=fe(p.x,p.y);X.save();X.translate(fx,fy);X.rotate(p.rot);X.globalAlpha=p.al;if(p.sz<4){X.fillStyle='#ddf0ff';X.beginPath();X.arc(0,0,p.sz,0,Math.PI*2);X.fill();}else{X.strokeStyle='#c0e0ff';X.lineWidth=0.8;for(let a=0;a<6;a++){X.save();X.rotate(a*Math.PI/3);X.beginPath();X.moveTo(0,0);X.lineTo(0,p.sz);X.stroke();X.restore();}}X.restore();});
  for(let i=0;i<40;i++){const sx=(i*141+51)%W,sy=(i*97+31)%(H*0.7),sb=0.3+0.7*Math.sin(f*0.028+i*0.9);X.fillStyle=`rgba(200,230,255,${sb*0.65})`;X.beginPath();X.arc(sx,sy,0.9,0,Math.PI*2);X.fill();}
  vs('rgba(2,6,14,0.6)');
}
function drawBG_Capsule(f){
  const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#000a14');g.addColorStop(0.5,'#001828');g.addColorStop(1,'#001030');X.fillStyle=g;X.fillRect(0,0,W,H);
  X.strokeStyle='rgba(0,200,255,0.12)';X.lineWidth=0.5;for(let i=0;i<W;i+=40){X.beginPath();X.moveTo(i,H*0.72);X.lineTo((i-60+W)%W,H);X.stroke();}
  X.fillStyle='rgba(0,180,255,0.08)';X.fillRect(0,H*0.72,W,H*0.28);X.fillStyle='rgba(0,220,255,0.25)';X.fillRect(0,H*0.72,W,2);
  bld2.forEach((b,bi)=>{const[fx]=fe(b.x+b.w/2,H/2);X.fillStyle='#001830';X.fillRect(fx-b.w/2,H-b.h,b.w,b.h);X.strokeStyle=`rgba(0,${180+bi*10},255,0.2)`;X.lineWidth=0.5;X.strokeRect(fx-b.w/2,H-b.h,b.w,b.h);X.fillStyle=`rgba(0,230,255,${0.06+0.04*Math.sin(f*0.02+bi)})`;for(let r=0;r<5;r++)for(let c=0;c<3;c++)if(Math.sin(f*0.015+r+c+b.x)>-0.2)X.fillRect(fx-b.w/2+6+c*18,H-b.h+14+r*22,12,14);X.fillStyle=`rgba(0,255,200,${0.5+0.5*Math.sin(f*0.15+bi)})`;X.beginPath();X.arc(fx,H-b.h-2,2,0,Math.PI*2);X.fill();});
  for(let i=0;i<5;i++){const vx=((f*0.8+i*180)%W),vy=H*0.15+i*H*0.08;const[fx2,fy2]=fe(vx,vy);X.save();X.globalAlpha=0.7;X.fillStyle='#00ddff';X.beginPath();X.ellipse(fx2,fy2,12,4,0,0,Math.PI*2);X.fill();X.restore();}
  techP.forEach(p=>{const[fx,fy]=fe(p.x,p.y);X.save();X.globalAlpha=p.al;X.fillStyle=p.col;X.beginPath();X.arc(fx,fy,p.sz,0,Math.PI*2);X.fill();X.restore();});
  for(let i=0;i<40;i++){const sx=(i*137+61)%W,sy=(i*89+47)%(H*0.65),sb=0.3+0.7*Math.sin(f*0.025+i*0.9);X.fillStyle=`rgba(180,240,255,${sb*0.5})`;X.beginPath();X.arc(sx,sy,i%7===0?1.8:0.8,0,Math.PI*2);X.fill();}
  vs('rgba(0,4,12,0.6)');
}
function drawBG_GrandLine(f){
  const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a1830');g.addColorStop(0.4,'#1a3050');g.addColorStop(1,'#061828');X.fillStyle=g;X.fillRect(0,0,W,H);
  X.fillStyle='#082840';X.fillRect(0,H*0.72,W,H*0.28);
  X.strokeStyle='rgba(0,160,220,0.25)';X.lineWidth=1;for(let i=0;i<6;i++){const wy=H*0.73+i*8;X.beginPath();for(let x=0;x<W;x+=4)X.lineTo(x,wy+Math.sin((x*0.03)+f*0.08+i)*4);X.stroke();}
  [[W*0.15,H*0.68,55,38],[W*0.5,H*0.66,75,42],[W*0.82,H*0.7,48,33]].forEach(([ix,iy,iw,ih])=>{const[fx,fy]=fe(ix,iy);X.fillStyle='#0d2a18';X.beginPath();X.ellipse(fx,fy,iw,ih,0,0,Math.PI*2);X.fill();X.fillStyle='#1a3a10';X.fillRect(fx-2,fy-ih*0.8,4,ih*0.7);X.fillStyle='#1e4a14';X.beginPath();X.ellipse(fx,fy-ih*0.85,18,9,-0.3,0,Math.PI*2);X.fill();X.beginPath();X.ellipse(fx,fy-ih*0.85,18,9,0.3,0,Math.PI*2);X.fill();});
  sparkles.forEach(p=>{const[fx,fy]=fe(p.x,p.y);const pulse=Math.abs(Math.sin(p.ph));X.save();X.globalAlpha=0.5*pulse;X.fillStyle='#ffcc44';X.beginPath();X.arc(fx,fy,p.sz*pulse,0,Math.PI*2);X.fill();X.restore();});
  if(Math.sin(f*0.05)>0.96){const lx=W*0.3+Math.random()*W*0.4;X.save();X.globalAlpha=0.7;X.strokeStyle='#ffffaa';X.lineWidth=1.5;X.beginPath();X.moveTo(lx,H*0.1);X.lineTo(lx+15,H*0.35);X.lineTo(lx-10,H*0.5);X.stroke();X.restore();}
  const[sx,sy]=fe(W*0.8,H*0.15);X.save();X.fillStyle='#c88820';X.beginPath();X.arc(sx,sy,38,0,Math.PI*2);X.fill();X.fillStyle='#ffcc44';X.beginPath();X.arc(sx,sy,30,0,Math.PI*2);X.fill();X.restore();
  bld.forEach(b=>{const[fx]=fe(b.x+b.w/2,H*0.72);X.fillStyle='#2a1808';X.fillRect(fx-5,H*0.55,10,H*0.17);X.fillStyle='#3a2010';X.fillRect(fx-20,H*0.71,40,5);});
  for(let i=0;i<30;i++){const sx2=(i*137+61)%W,sy2=(i*89+47)%(H*0.45),sb=0.3+0.7*Math.sin(f*0.025+i*0.9);X.fillStyle=`rgba(255,240,200,${sb*0.5})`;X.beginPath();X.arc(sx2,sy2,0.9,0,Math.PI*2);X.fill();}
  vs('rgba(2,6,12,0.52)');
}
function drawBG_Ackerman(f){
  const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#060c14');g.addColorStop(0.5,'#0c1828');g.addColorStop(1,'#080e18');X.fillStyle=g;X.fillRect(0,0,W,H);
  X.fillStyle='#0d1820';X.fillRect(0,H*0.68,W,H*0.32);X.fillStyle='rgba(100,140,180,0.15)';X.fillRect(0,H*0.68,W,3);
  X.strokeStyle='rgba(80,110,140,0.1)';X.lineWidth=0.5;for(let r=0;r<4;r++)for(let c=0;c<16;c++){const bx=c*W/14+(r%2)*W/28,by=H*0.69+r*H*0.08;X.strokeRect(bx,by,W/14,H*0.08);}
  bld.forEach(b=>{const[fx]=fe(b.x+b.w/2,H/2);X.fillStyle='#0a1420';X.fillRect(fx-b.w/2,H-b.h,b.w,b.h);X.strokeStyle='rgba(80,120,160,0.2)';X.lineWidth=0.5;X.strokeRect(fx-b.w/2,H-b.h,b.w,b.h);});
  for(let i=0;i<3;i++){const wx=(i*300+200)%W;const[fx]=fe(wx,H*0.5);X.fillStyle='rgba(15,28,45,0.8)';X.fillRect(fx-38,0,76,H);X.strokeStyle='rgba(80,120,160,0.18)';X.lineWidth=1;X.strokeRect(fx-38,0,76,H);}
  odmL.forEach(l=>{const[fx,fy]=fe(l.x,l.y);X.save();X.globalAlpha=l.al;X.strokeStyle='rgba(160,190,220,0.6)';X.lineWidth=0.8;X.beginPath();X.moveTo(fx,fy);X.lineTo(fx+Math.cos(l.angle)*l.len,fy+Math.sin(l.angle)*l.len*0.5);X.stroke();X.fillStyle='rgba(180,210,240,0.8)';X.beginPath();X.arc(fx+Math.cos(l.angle)*l.len,fy+Math.sin(l.angle)*l.len*0.5,2,0,Math.PI*2);X.fill();X.restore();});
  const[mx,my]=fe(W*0.7,H*0.12);X.save();X.fillStyle='#c8d8e8';X.beginPath();X.arc(mx,my,44,0,Math.PI*2);X.fill();X.fillStyle='#060c14';X.beginPath();X.arc(mx+12,my-6,38,0,Math.PI*2);X.fill();X.restore();
  for(let i=0;i<6;i++){const cx=((i*190+f*0.4)%W),cy=H*0.06+i*H*0.06;const[fx2,fy2]=fe(cx,cy);X.save();X.globalAlpha=0.18;X.fillStyle='#182838';X.beginPath();X.arc(fx2,fy2,30+i*4,0,Math.PI*2);X.fill();X.restore();}
  for(let i=0;i<12;i++){const lx=((i*80+f*4)%W),ly=H*0.1+i*(H*0.065);X.save();X.globalAlpha=0.06;X.strokeStyle='rgba(140,180,220,0.8)';X.lineWidth=0.5;X.beginPath();X.moveTo(lx,ly);X.lineTo(lx-60,ly+4);X.stroke();X.restore();}
  for(let i=0;i<35;i++){const sx=(i*137+61)%W,sy=(i*89+47)%(H*0.55),sb=0.2+0.8*Math.sin(f*0.025+i*0.9);X.fillStyle=`rgba(180,210,240,${sb*0.5})`;X.beginPath();X.arc(sx,sy,0.9,0,Math.PI*2);X.fill();}
  vs('rgba(2,4,10,0.65)');
}

// GAME
const GRAV=0.42,FLAP=-7.2,WW=68,R=20,SSECS=8;
const charX=W*0.2;
let charY=H/2,charVY=0,charFlash=0,parts=[],walls=[],peachItems=[],wTimer=0,curPat=[],patIdx=0,survStart=Date.now();

function wSpeed(){return peachCount>=30?4.2:peachCount>=7?3.4:2.5;}
function wInterval(){return peachCount>=30?Math.max(55,90-stage*6):peachCount>=7?Math.max(65,105-stage*6):Math.max(90,130-stage*4);}
function gapH(){return Math.max(100,200-stage*14);}

function getPat(){
  const m=H/2;
  const ps=[
    [{cy:m-70},{cy:m+70},{cy:m-70},{cy:m+70}],
    [{cy:m},{cy:m-110},{cy:m+110},{cy:m}],
    [{cy:m-50},{cy:m+30},{cy:m+120},{cy:m-50}],
    [{cy:m+120},{cy:m+20},{cy:m-90},{cy:m}],
    [{cy:m},{cy:m+150},{cy:m+150},{cy:m},{cy:m-150},{cy:m-150},{cy:m}],
    [{cy:m-90},{cy:m+90},{cy:m-90},{cy:m+90},{cy:m}],
    [{cy:m+5},{cy:m-5},{cy:m+12},{cy:m-12}],
    [{cy:m},{cy:m+160},{cy:m+160},{cy:m-160},{cy:m-160},{cy:m}],
  ];
  return ps[Math.floor(Math.random()*Math.min(ps.length,2+Math.floor(stage/2)))];
}
function nextWall(){
  if(patIdx>=curPat.length||!curPat.length){curPat=getPat();patIdx=0;}
  const pat=curPat[patIdx++];const gh=gapH();
  const cy=Math.max(gh/2+35,Math.min(H-gh/2-35,pat.cy));
  walls.push({x:W+40,gapY:cy-gh/2,gapH:gh,ps:false});
}

function spawnPeach(w,pw){
  if(Math.random()>0.70)return;
  const roll=Math.random();let px,py;
  if(!pw||roll<0.40){
    // Inside gap — middle zone with variation
    py=w.gapY+w.gapH*0.5+(-w.gapH*0.28+Math.random()*w.gapH*0.56);
    px=w.x+WW/2;
  } else if(roll<0.70){
    // Between B(prev) and B(cur) — dip below bottom edges
    const pe=pw.gapY+pw.gapH; // prev bottom wall start (lower edge of prev gap)
    const ce=w.gapY+w.gapH;   // cur bottom wall start
    const deep=Math.max(pe,ce);
    py=deep+16+Math.random()*Math.min(H-deep-30,55);
    py=Math.min(py,H-22);
    px=pw.x+WW+(w.x-pw.x-WW)*0.5; // midpoint between walls horizontally
  } else {
    // Between T(prev) and T(cur) — fly above top edges
    const pe=pw.gapY; // prev gap top (bottom of prev top-wall)
    const ce=w.gapY;  // cur gap top
    const high=Math.min(pe,ce);
    py=high-16-Math.random()*Math.min(high-22,55);
    py=Math.max(py,20);
    px=pw.x+WW+(w.x-pw.x-WW)*0.5;
  }
  peachItems.push({x:px,y:py,got:false,bob:Math.random()*Math.PI*2});
}

function burst(x,y,col,n=7){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=1.5+Math.random()*3;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.2,life:1,col,sz:2+Math.random()*3});}}


// ── Character head (NFT image clipped to circle) ──────────────────────────────

function drawHead(px,py){
  X.save();
  if(charFlash>0&&Math.floor(charFlash/4)%2===0)X.globalAlpha=0.3;
  const bob=Math.sin(F*0.12)*2.5,cy=py+bob;
  if(hasShield){
    X.save();const p2=0.22+0.1*Math.sin(F*0.18);X.globalAlpha=p2;X.fillStyle='#60d8ff';X.beginPath();X.arc(px,cy,R+12,0,Math.PI*2);X.fill();X.globalAlpha=p2*0.5;X.strokeStyle='#a0eeff';X.lineWidth=2;X.beginPath();X.arc(px,cy,R+16,0,Math.PI*2);X.stroke();X.restore();
  }
  X.save();X.beginPath();X.arc(px,cy,R,0,Math.PI*2);X.clip();
  const img=NFTS[selChar];
  if(img.complete&&img.naturalWidth>0){X.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,px-R,cy-R,R*2,R*2);}
  else{X.fillStyle='#f9c0d0';X.fill();}
  X.restore();
  X.strokeStyle=hasShield?'#60d8ff':'rgba(255,200,220,0.7)';X.lineWidth=hasShield?2.5:1.5;X.beginPath();X.arc(px,cy,R,0,Math.PI*2);X.stroke();
  X.restore();
}

function drawWall(w){
  if(clearObsTimer>0)return;
  const T=THEMES[selTheme];
  const wx=w.x,gh=w.gapH,gy=w.gapY,tH=gy,bY=gy+gh,bH=H-bY;
  X.fillStyle=T.wallCol;X.fillRect(wx,0,WW,tH);
  X.fillStyle='rgba(255,255,255,0.04)';for(let r=8;r<tH-8;r+=20)X.fillRect(wx+4,r,WW-8,9);
  X.fillStyle=T.wallEdge;X.fillRect(wx,tH-4,WW,4);X.fillStyle='rgba(255,255,255,0.4)';X.fillRect(wx,tH-8,WW,4);
  if(tH>60){X.fillStyle='rgba(255,255,255,0.15)';X.font='12px serif';X.textAlign='center';X.fillText('夢',wx+WW/2,tH/2+5);}
  X.strokeStyle=T.wallEdge;X.lineWidth=1.5;X.strokeRect(wx,0,WW,tH);
  X.fillStyle=T.wallCol;X.fillRect(wx,bY,WW,bH);
  X.fillStyle='rgba(255,255,255,0.04)';for(let r=bY+8;r<H-8;r+=20)X.fillRect(wx+4,r,WW-8,9);
  X.fillStyle=T.wallEdge;X.fillRect(wx,bY,WW,4);X.fillStyle='rgba(255,255,255,0.4)';X.fillRect(wx,bY+4,WW,4);
  if(bH>60){X.fillStyle='rgba(255,255,255,0.15)';X.font='12px serif';X.textAlign='center';X.fillText('見',wx+WW/2,bY+bH/2+5);}
  X.strokeStyle=T.wallEdge;X.lineWidth=1.5;X.strokeRect(wx,bY,WW,bH);
  if(gh<130){X.fillStyle=`rgba(255,50,50,${0.05+(130-gh)/260})`;X.fillRect(wx,gy,WW,gh);}
}

function drawPeach(p){
  if(p.got)return;
  const bob=Math.sin(F*0.1+p.bob)*5;
  const[fx,fy]=fe(p.x,p.y+bob);
  const pulse=0.88+0.12*Math.sin(F*0.14+p.bob);
  X.save();X.translate(fx,fy);X.scale(pulse,pulse);
  X.save();X.globalAlpha=0.28;X.fillStyle='#f9a870';X.beginPath();X.arc(0,0,18,0,Math.PI*2);X.fill();X.restore();
  X.fillStyle='#f9a070';X.beginPath();X.arc(0,0,11,0,Math.PI*2);X.fill();
  X.fillStyle='#fdd0a0';X.beginPath();X.arc(0,0,11,Math.PI,Math.PI*2);X.fill();
  X.strokeStyle='#e87840';X.lineWidth=0.8;X.beginPath();X.moveTo(0,-11);X.bezierCurveTo(2,-5,2,4,0,11);X.stroke();
  X.fillStyle='#5aaa50';X.beginPath();X.ellipse(2,-13,5,2.4,-0.4,0,Math.PI*2);X.fill();
  X.fillStyle='rgba(255,255,255,0.55)';X.beginPath();X.ellipse(-4,-5,3,2,-0.3,0,Math.PI*2);X.fill();
  X.restore();
}


// ── Collision & peach pickup ──────────────────────────────────────────────────

function checkCol(){
  if(charFlash>0||clearObsTimer>0)return;
  let hit=charY-R<0||charY+R>H;
  if(!hit)for(const w of walls){if(charX+R>w.x&&charX-R<w.x+WW&&(charY-R<w.gapY||charY+R>w.gapY+w.gapH)){hit=true;break;}}
  if(!hit)return;
  if(hasShield){
    hasShield=false;shieldTimer=0;peachProg=0;charFlash=55;clearObsTimer=90;
    burst(charX,charY,'#60d8ff',14);updShield();playHitSfx();
    const fo=document.getElementById('fov');fo.style.background='rgba(80,220,255,0.35)';fo.style.opacity='1';setTimeout(()=>fo.style.opacity='0',300);
    document.getElementById('stimer').style.opacity='0';
  } else {
    const fo=document.getElementById('fov');fo.style.background='rgba(255,50,50,0.45)';fo.style.opacity='1';playDeathSfx();
    setTimeout(()=>{fo.style.opacity='0';endGame();},350);
  }
}

function checkPeach(){
  peachItems.forEach(p=>{
    if(p.got)return;
    const dx=charX-p.x,dy=charY-p.y;
    if(Math.sqrt(dx*dx+dy*dy)<R+13){
      p.got=true;burst(p.x,p.y,'#f9a870',6);
      peachCount++;score+=10;
      document.getElementById('sv').textContent=score;
      playPeachSfx();
      if(!hasShield){
        peachProg++;
        if(peachProg>=3){hasShield=true;shieldTimer=SSECS*60;peachProg=0;burst(charX,charY,'#60d8ff',12);showCtxt('🛡️ shield!');playShieldSfx();}
        else showCtxt('🍑 +10');
      } else showCtxt('🍑 +10');
      updShield();
      if(peachCount===7)glbl('speeding up...');
      if(peachCount===30)glbl('maximum speed!');
    }
  });
}

function showCtxt(t){const el=document.getElementById('ctxt');el.textContent=t;el.style.opacity='1';setTimeout(()=>el.style.opacity='0',700);}
function glbl(t){const gl=document.getElementById('gaplabel');gl.textContent=t;gl.style.opacity='0.7';setTimeout(()=>gl.style.opacity='0',1800);}

// ── Shield / HUD helpers ──────────────────────────────────────────────────────

function updShield(){
  const ic=document.getElementById('shield-icon'),pg=document.getElementById('peach-prog'),st=document.getElementById('stimer');
  if(hasShield){ic.textContent='🛡️';ic.style.filter='drop-shadow(0 0 6px #60d8ff)';pg.textContent='shield active!';pg.style.color='#60d8ff';st.style.opacity='1';}
  else{ic.textContent='🍑';ic.style.filter='none';pg.textContent=peachProg+' / 3';pg.style.color='#f9a870';st.style.opacity='0';}
}


// ── Main game loop ────────────────────────────────────────────────────────────

function update(){
  F++;stage=Math.floor(peachCount/5);
  const secs=Math.floor((Date.now()-survStart)/1000);
  const mm=Math.floor(secs/60),ss=secs%60;
  document.getElementById('surv-timer').textContent=mm+':'+(ss<10?'0':'')+ss;
  charVY+=GRAV;charY+=charVY;
  scrollBG();
  if(hasShield&&shieldTimer>0){
    shieldTimer--;
    document.getElementById('stimer').textContent='⏱ '+Math.ceil(shieldTimer/60)+'s';
    if(shieldTimer<=0){hasShield=false;peachProg=0;updShield();glbl('shield gone!');playShieldExpireSfx();}
  }
  if(clearObsTimer>0)clearObsTimer--;
  const ws=wSpeed();
  wTimer++;
  if(wTimer>wInterval()){
    const pw=walls.length>0?walls[walls.length-1]:null;
    nextWall();
    const nw=walls[walls.length-1];
    if(!nw.ps){nw.ps=true;spawnPeach(nw,pw);}
    wTimer=0;
  }
  walls.forEach(w=>w.x-=ws);walls=walls.filter(w=>w.x+WW>-10);
  peachItems.forEach(p=>p.x-=ws);peachItems=peachItems.filter(p=>p.x>-40);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life-=0.04;});parts=parts.filter(p=>p.life>0);
  if(charFlash>0)charFlash--;
  checkCol();checkPeach();
}

function draw(){
  X.clearRect(0,0,W,H);
  THEMES[selTheme].drawBG(F);
  walls.forEach(drawWall);
  peachItems.forEach(drawPeach);
  parts.forEach(p=>{X.save();X.globalAlpha=p.life*0.8;X.fillStyle=p.col;X.beginPath();X.arc(p.x,p.y,p.sz,0,Math.PI*2);X.fill();X.restore();});
  const[mx,my]=fe(charX,charY);drawHead(mx,my);
}

function loop(){if(!gameOn)return;update();draw();requestAnimationFrame(loop);}
function flap(){if(!gameOn)return;charVY=FLAP;}
document.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();flap();}});
document.addEventListener('touchstart',e=>{const t=e.target;if(t.tagName==='BUTTON'||t.tagName==='INPUT'||t.classList.contains('ccard')||t.classList.contains('tcard'))return;if(!gameOn)return;e.preventDefault();flap();},{passive:false});
document.addEventListener('mousedown',e=>{const t=e.target;if(t.tagName==='BUTTON'||t.tagName==='INPUT'||t.classList.contains('ccard')||t.classList.contains('tcard'))return;flap();});
