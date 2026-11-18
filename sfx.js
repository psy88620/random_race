// 효과음 + 배경 리듬 (WebAudio로 즉석 합성 — 음원 파일 필요 없음). random-race-3d.html / random-marble.html 공용
const sfx=(()=>{
  let ac,out,nbuf,muted=false,bpmV=128,bgmOn=false,slowOn=false,timer=0,nextT=0,step=0,eng=null;
  try{muted=localStorage.getItem('sfxMuted')=='1'}catch(e){}
  const last={};
  const GAP={tick:0,go:0,fanfare:0,alert:0,gate:0,heart:0,mushroom:80,star:100,banana:100,shell:100,bomb:100,pop:60,
    slip:150,ding:40,finish:300,tickpeg:35,boing:60,squelch:120,thud:100,box:50,bonk:80,spring:100};

  // iframe 안에서 자동 시작되면 오디오가 막혀 있을 수 있어, 첫 클릭/키 입력 때 풀어 줌
  for(const e of['pointerdown','keydown'])addEventListener(e,()=>{if(ac&&ac.state=='suspended')ac.resume()},{passive:true});
  function init(){
    if(ac){if(ac.state=='suspended')ac.resume();return}
    ac=new(window.AudioContext||window.webkitAudioContext)();
    out=ac.createGain();out.gain.value=muted?0:.6;
    const comp=ac.createDynamicsCompressor();out.connect(comp);comp.connect(ac.destination);
    nbuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
    const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }
  function tone(f,dur,{type='square',vol:v=.2,to=f,at=0}={}){
    const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.setValueAtTime(f,t);
    if(to!=f)o.frequency.exponentialRampToValueAtTime(to,t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.02);
  }
  function noise(dur,{vol:v=.3,f=1000,to=f,type='lowpass',at=0,q=1}={}){
    const t=ac.currentTime+at,s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();
    s.buffer=nbuf;s.loop=true;fl.type=type;fl.Q.value=q;
    fl.frequency.setValueAtTime(f,t);fl.frequency.exponentialRampToValueAtTime(Math.max(to,20),t+dur);
    g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02);
  }
  const S={
    tick:v=>tone(880,.08,{vol:.25*v}),
    go:v=>{tone(660,.1,{vol:.25});tone(990,.1,{at:.08,vol:.25});tone(1320,.4,{at:.16,vol:.3,type:'sawtooth'});noise(.5,{vol:.15,f:300,to:4000,type:'bandpass'})},
    box:v=>[660,880,1320].forEach((f,i)=>tone(f,.1,{type:'triangle',at:i*.06,vol:.3*v})),
    mushroom:v=>{tone(180,.4,{type:'sawtooth',to:900,vol:.18*v});noise(.4,{vol:.12*v,f:500,to:3500,type:'bandpass'})},
    star:v=>[784,988,1175,1568,1976,1568,2349].forEach((f,i)=>tone(f,.09,{at:i*.05,vol:.12*v})),
    banana:v=>{tone(800,.5,{to:120,vol:.2*v});tone(200,.15,{at:.45,type:'sine',vol:.3*v})},
    shell:v=>{noise(.6,{vol:.45*v,f:2000,to:80});tone(140,.5,{type:'sine',to:35,vol:.6*v})},
    bomb:v=>{noise(.7,{vol:.35*v,f:3000,to:200,type:'bandpass',q:.8});[300,450,700].forEach((f,i)=>tone(f,.15,{type:'sine',to:f*2,at:i*.07,vol:.25*v}))},
    pop:v=>tone(1500,.09,{type:'sine',to:300,vol:.25*v}),
    slip:v=>noise(.3,{vol:.1*v,f:2000,to:6000,type:'highpass'}),
    ding:v=>tone(1568,.18,{type:'triangle',vol:.25*v}),
    finish:v=>[1047,1319,1568,2093].forEach((f,i)=>tone(f,.18,{type:'triangle',at:i*.08,vol:.3*v})),
    fanfare:v=>[[523,0],[659,.14],[784,.28],[1047,.42],[784,.7],[1047,.84],[1319,.98]].forEach(([f,a])=>{
      tone(f,.3,{at:a,vol:.2});tone(f/2,.3,{type:'triangle',at:a,vol:.25})}),
    alert:v=>{for(let i=0;i<4;i++)tone(i%2?880:660,.18,{at:i*.2,vol:.2})},
    tickpeg:v=>tone([523,587,659,784,880,1047,1175][Math.random()*7|0]*(1+v*.5),.06,{type:'triangle',vol:.18}), // v: 충돌 세기 0~1
    boing:v=>{tone(300,.3,{type:'sine',to:800,vol:.35*v});tone(800,.2,{type:'sine',to:350,at:.15,vol:.3*v})},
    gate:v=>{noise(.8,{vol:.4,f:400,to:100});tone(80,.3,{type:'sine',to:40,vol:.5})},
    squelch:v=>tone(250,.15,{type:'sawtooth',to:120,vol:.12*v}),
    thud:v=>tone(110,.12,{type:'sine',to:40,vol:.4*v}),
    bonk:v=>{tone(220,.18,{type:'square',to:60,vol:.35*v});noise(.14,{vol:.3*v,f:1800,to:250})},
    spring:v=>{tone(300,.35,{type:'sine',to:1200,vol:.35*v});tone(1200,.25,{type:'sine',to:500,at:.3,vol:.3*v})},
    crack:v=>{noise(.35,{vol:.5*v,f:3500,to:200,type:'bandpass',q:.7});tone(120,.35,{type:'sawtooth',to:40,vol:.35*v})},
    heart:v=>{tone(70,.14,{type:'sine',to:40,vol:.7});tone(70,.14,{type:'sine',to:40,at:.18,vol:.5})},
  };
  function play(name,v=1){
    if(!ac||muted||!S[name])return;
    const t=performance.now();
    if(t-(last[name]||0)<(GAP[name]??60))return; // 동시에 수십 개가 울리지 않도록 종류별 간격 제한
    last[name]=t;S[name](v);
  }

  // 배경 리듬: 킥·스네어·햇 + 베이스 + 아르페지오 (16스텝, 4마디마다 코드 변화)
  const ROOT=[1,1.189,.891,1.335],ARP=[1,1.2,1.5,1.8,2,1.8,1.5,1.2];
  function sched(){
    while(nextT<ac.currentTime+.15){
      const at=nextT-ac.currentTime,s=step%16,r=ROOT[(step>>4)%4];
      if(slowOn){if(s%8==0){tone(70,.14,{type:'sine',to:40,vol:.7,at});tone(70,.14,{type:'sine',to:40,vol:.5,at:at+.18})}}
      else{
        if(s%4==0)tone(150,.12,{type:'sine',to:45,vol:.5,at});
        if(s%8==4)noise(.1,{vol:.22,f:1800,type:'highpass',at});
        if(s%2==1)noise(.03,{vol:.07,f:7000,type:'highpass',at});
        if(s%2==0)tone(55*r,.13,{type:'sawtooth',vol:.12,at});
        tone(220*r*ARP[s%8],.08,{vol:.05,at});
      }
      nextT+=60/bpmV/4;step++;
    }
  }
  function bgm(on){
    if(!ac)return;
    clearInterval(timer);bgmOn=on;
    if(on){nextT=ac.currentTime+.05;step=0;timer=setInterval(sched,25)}
  }
  // 엔진 소리: 속도에 따라 음이 높아짐 (v: 0~1)
  function engine(v){
    if(!ac)return;
    if(!eng){
      const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();
      o.type='sawtooth';f.type='lowpass';f.frequency.value=450;g.gain.value=.05;
      o.connect(f);f.connect(g);g.connect(out);o.start();eng={o};
    }
    eng.o.frequency.setTargetAtTime(50+v*110,ac.currentTime,.1);
  }
  function engineOff(){if(eng){try{eng.o.stop()}catch(e){}eng=null}}

  // 음소거 버튼 (왼쪽 위)
  const btn=document.createElement('button');
  btn.style.cssText='position:fixed;top:12px;left:12px;z-index:20;font-size:20px;padding:6px 12px;border-radius:50%;box-shadow:none;background:#ffffffcc';
  const paint=()=>btn.textContent=muted?'🔇':'🔊';
  btn.onclick=()=>{muted=!muted;paint();if(out)out.gain.value=muted?0:.6;try{localStorage.setItem('sfxMuted',muted?'1':'0')}catch(e){}};
  paint();document.body.append(btn);

  return{init,play,bgm,engine,engineOff,
    bpm:v=>{bpmV=v},
    slow:on=>{slowOn=on;bpmV=on?70:128}};
})();
