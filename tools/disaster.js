/* ---------- FELAKET BÖLÜMLERİ: 3 Deprem · 4 Zombi · 5 Sel+Elektrik · 6 Asteroit / Dünyanın Son Nöbeti ---------- */
var DIS={day:0,need:0,t:0,ev:[],zs:[],sh:0,shP:0,pf:1,gap:1,res:{},rpick:0,water:null,wl:0,st:{quakes:0,zk:0,zt:0,blk:0,flood:0,imp:0},sw:0,fin:0,fin2:0,lastHp:100,sa:0,fx:null,wait:0};
var DNAMES=['','İLK NÖBET','DOLUNAY','BÜYÜK DEPREM','ZOMBİ SALDIRISI','SEL VE KARANLIK','DÜNYANIN SON NÖBETİ'];
(function(){
  CHAPT[2]={t:'BÜYÜK DEPREM',lines:[
    ['nermin','Doktor, gece yarısına doğru yer sallanabilir. Televizyondaki sismolog amca “bu gece kesin” dedi. Her gece diyor ama bu sefer sesi titriyordu.'],
    ['selim','Telefondan konuşuyorum: şehirde yedi büyüklüğüne yakın bir deprem bekleniyor. Kırmızı alanı hazırda tut, travma yataklarına göz kulak ol.'],
    ['ramazan','Raflara yaslanma, tavandaki karolara da güvenme. Ben çoktan kapının eşiğine geçtim. Eşik en sağlam yer.'],
    ['anons','Sayın personel, sarsıntı hâlinde çök, kapan, tutun. Kahve makinesine tutunmak “tutun” sayılmaz.'],
    ['nermin','Bu gece hastalar ezilmeyle, kırıkla, tozla gelecek. Sabırları kısa, sıraları uzun olacak. Hazır ol.']]};
  CHAPT[3]={t:'ZOMBİ SALDIRISI',lines:[
    ['nermin','Şehirde “garip bir ısırık salgını” varmış. Haberlerde “vatandaşlar sakin olsun” diyorlar, bu yüzden hiç sakin değilim.'],
    ['selim','Isırığı olan hastayı bekleme salonunda bırakma. Bir süre sonra… değişebiliyorlar. Sakın “Pazartesi sendromu” deme.'],
    ['ramazan','Elinde ne varsa kullan: neşter, balyoz, plastik balık. Ben kapıyı tutuyorum, kapı da beni tutuyor.'],
    ['ece','Hocam, şu hastanın nabzı yok ama yürüyor… bu normal mi?'],
    ['nermin','Normal değil. Ama yirmi yedi yıldır gördüğüm ilk “beklemekten sinirlenen” hasta da değil.']]};
  CHAPT[4]={t:'SEL VE KARANLIK',lines:[
    ['anons','Meteoroloji kırmızı alarm verdi. Zemin kat su altında kalabilir. Lütfen ayaklarınızı ıslatmayınız. Islatacaksınız.'],
    ['nermin','Jeneratör var ama sadece iyi niyetle çalışıyor. Elektrik kesilirse monitörlere pil takarız. Pil yoksa dua.'],
    ['selim','Sular yükselirken hastalar soğuktan donmuş gelecek. Çabuk ol: ıslak hasta mutsuz hasta.'],
    ['ramazan','Lastik çizmemi sana verirdim ama bende tek tane var. O da sol.']]};
  CHAPT[5]={t:'DÜNYANIN SON NÖBETİ',lines:[
    ['anons','Dikkat: yörüngesi değişen bir asteroit yaklaşıyor. Hastane yönetimi sabaha kadar nöbet tutulmasını rica eder.'],
    ['nermin','Deprem, zombi, sel, karanlık… bu gece hepsi sırayla geri gelecek. Sonra da gökten bir şey. Ben bu işi kırk yıl yapmak istemiyordum zaten.'],
    ['selim','Sabaha çıkarsan nöbeti devralırım. Çıkarsan.'],
    ['ece','Hocam korkuyorum… ama kahve içersem geçiyor.'],
    ['ramazan','Bir şey söyleyeceğim: seninle çalışmak şereftir. Bir de otopark ücretini bu gece silmedim.'],
    ['nermin','Hadi doktor. Dünyanın son nöbeti. İmzanı at.']]};
  DIS.FINAL=[
    ['anons','Sabah 06:00. Güneş doğdu. Asteroit okyanusa düştü. Kahve makinesi hâlâ çalışıyor.'],
    ['selim','Günaydın, nöbeti devralıyorum. Raporda ne var? Deprem, zombi, sel, asteroit… tamam, “olağan bir gece”.'],
    ['nermin','Doktor, yirmi yedi yıldır böyle bir vardiya görmedim. Sana bir çay borçluyum. Büyük çay.'],
    ['ece','Hocam… ben bu nöbetten sonra stajı bırakıyorum. Şaka şaka. Hemen başka acile gidiyorum.'],
    ['ramazan','Kapıyı kapattım. Dünya hâlâ dönüyor. Şimdi eve gidebilirsin.'],
    ['nermin','Güle güle doktor. Yarın akşam yine… yok yok, yarın izinlisin. Bu kez gerçekten.']];
})();
chapterOf=function(day){return CHAPT[(day-1)%CHAPT.length]};

/* gece modu: felaket bölümleri kendi adını taşır */
var _mpDis=modPick;modPick=function(){_mpDis();if(S.day>=3&&S.day<=6){MOD={k:'dis'+S.day,n:DNAMES[S.day],d:['','','','Yer sallanıyor.','Isırıklar ve yürüyen ölüler.','Su yükseliyor, elektrik gidip geliyor.','Her şey birden. Sabaha çıkabilir misin?'][S.day],t:0,flip:0}}};

var _nsDis=newShift;newShift=function(){_nsDis();DIS.need=1;DIS.day=S.day;DIS.t=0;DIS.ev=[];DIS.zs=[];DIS.sh=0;DIS.res={};DIS.rpick=0;DIS.fin=0;DIS.fin2=0;DIS.sw=0;DIS.wl=0;DIS.st={quakes:0,zk:0,zt:0,blk:0,flood:0,imp:0};
  DIS.pf=[1,1,1,.85,.8,.75,.7][Math.min(S.day,6)]||.7;DIS.gap=[1,1,1,.65,.6,.55,.5][Math.min(S.day,6)]||.5;if(S.day>6){DIS.pf=.7;DIS.gap=.5}
  if(DIS.water){scene.remove(DIS.water);DIS.water=null}};

/* ---- hasta sabrı ve geliş sıklığı ---- */
var _mpD2=makePatient;makePatient=function(e,k){var p=_mpD2(e,k);if(DIS.pf<1&&p){p.patience*=DIS.pf;p.max*=DIS.pf}return p};
var _swDis=spawnWalker;spawnWalker=function(enc){var r=_swDis(enc);if(r&&DIS.gap<1&&S.nextSpawn>S.clock)S.nextSpawn=S.clock+(S.nextSpawn-S.clock)*DIS.gap;return r};

/* ---- ortak efekt katmanı ---- */
function disFx(){if(DIS.fx)return DIS.fx;var d=document.createElement('div');d.id='disFx';d.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;transition:opacity .15s';document.body.appendChild(d);DIS.fx=d;return d}
function disFlash(col,a,fade){var d=disFx();d.style.transition='none';d.style.background=col;d.style.opacity=a;void d.offsetWidth;d.style.transition='opacity '+(fade||1.5)+'s ease-out';d.style.opacity=0}

/* ---- DEPREM ---- */
function quake(pw){DIS.st.quakes++;DIS.sh=4+pw*2.5;DIS.shP=.6+pw*.5;
  banner('DEPREM!','ÇÖK · KAPAN · TUT','anons',pw>=1.5?'Büyük sarsıntı! Raflardan uzak dur, tavan karoları düşüyor!':'Yer sallanıyor! Tavan karolarına dikkat et.');
  try{sfxNoise(4+pw,60,.7,.22,'lowpass');sfxNoise(3,140,.9,.12,'lowpass');tone(38,3.2,'sine',.14)}catch(e){}
  S.stress=clamp(S.stress+6+pw*3,0,150);absOnce('Depremde hasta bakan doktor',8);
  if(pw>=1){try{startBlackout(3+pw*2)}catch(e){}}
  var nT=pw>=1.5?3:pw>=1?2:1;for(var i=0;i<nT;i++)setTimeout(function(){if(LIVE())try{ceilDrop()}catch(e){}},900+i*1300);
  setTimeout(function(){if(!LIVE())return;var n=0;try{if(spawnTrauma())n++}catch(e){}try{if(pw>=1&&spawnBed(nextEnc(),true))n++}catch(e){}
    try{if(waiting().length<12){spawnWalker(nextEnc());if(pw>=1)spawnWalker(nextEnc())}}catch(e){}
    toast('Enkazdan yaralılar geliyor! Travma yataklarını kontrol et.','bad');newsAdd('Deprem: acile yaralılar akın etti')},4500)}

/* ---- ZOMBİ ---- */
function zInfect(n){var cand=waiting().filter(function(p){return !p.busy&&!p.zomb&&!p.inf});var k=0;
  while(k<n){var p=cand.shift();if(!p){try{spawnWalker(nextEnc());p=P[P.length-1]}catch(e){break}}
    if(!p)break;p.inf=1;k++;(function(p){tagOn(p,'🩸 ISIRIK','#7a1015','#ffffff',12);setTimeout(function(){zTurn(p)},9000+Math.random()*5000)})(p)}
  banner('ISIRIK VAKALARI','BEKLEME SALONUNA DİKKAT','nermin','Isırığı olanlar bekleme salonunda. Bir süre sonra değişecekler… elindeki eşyayla hazır ol.');
  try{sfxNoise(1.4,500,.6,.05)}catch(e){}}
function zTurn(p){if(!p||P.indexOf(p)<0||p.zomb||p.dead||p.state==='bed'||p.state==='trauma'||p.state==='transit')return;
  p.zomb=1;p.inf=0;p.state='zomb';p.busy=false;if(p.seat)p.seat.taken=false;try{sitPose(p.g,false)}catch(e){}p.g.position.y=0;if(p.bar)p.bar.visible=false;
  var vis=null;try{vis=zomVis()}catch(e){}
  if(vis){p.g.traverse(function(o){if(o.isMesh||o.isSkinnedMesh)o.visible=false});vis.position.copy(p.g.position);scene.add(vis)}
  else{var em=new THREE.MeshBasicMaterial({color:0xff2020});[-.035,.035].forEach(function(x){var s=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),em);s.position.set(x,1.625,.09);s.userData.noHit=true;p.g.add(s)})}
  tagOn(p,'🧟 ZOMBİ','#173a1a','#9dff8a',60);
  DIS.zs.push({p:p,vis:vis,ph:rnd(0,6),hp:DIS.res.security?2:3,hit:rnd(.6,1.2),sp:rnd(.9,1.2),moan:rnd(2,6)});DIS.st.zt++;
  try{tone(70,.8,'sawtooth',.05);sfxNoise(.8,300,.8,.04)}catch(e){}if(DIS.st.zt===1)try{subtitle('ece','Hocam! Hasta “ıııı” diyerek bana doğru geliyor!')}catch(e){}
  S.stress=clamp(S.stress+4,0,150)}
function zTick(dt){var cp=camera.position,fwd=V(0,0,0);camera.getWorldDirection(fwd);var fl=Math.hypot(fwd.x,fwd.z)||1;fwd.x/=fl;fwd.z/=fl;
  var sw=S.swing>.9||PUN.t>.22;var strike=sw&&!DIS.sw;DIS.sw=sw?1:0;
  for(var i=DIS.zs.length-1;i>=0;i--){var z=DIS.zs[i],p=z.p;if(P.indexOf(p)<0){if(z.vis)scene.remove(z.vis);DIS.zs.splice(i,1);continue}var g=p.g,dx=cp.x-g.position.x,dz=cp.z-g.position.z,d=Math.hypot(dx,dz)||1;
    if(strike&&d<2.7&&(dx*fwd.x+dz*fwd.z)/d>.35){z.hp--;S.kick=Math.max(S.kick,.5);try{sfx.punch&&sfx.punch()}catch(e){}g.position.x-=dx/d*.5;g.position.z-=dz/d*.5;
      if(z.hp<=0){p.state='zdead';p.zomb=0;DIS.zs.splice(i,1);DIS.st.zk++;g.rotation.x=-Math.PI/2;g.position.y=.14;if(z.vis){z.vis.rotation.set(-Math.PI/2,g.rotation.y,0);z.vis.position.set(g.position.x,.14,g.position.z);(function(v){setTimeout(function(){scene.remove(v)},22000)})(z.vis)}if(p._tag&&p._tag.parent)p._tag.parent.remove(p._tag);S.score+=6;scorePop(6,'Zombi etkisiz');absOnce('Hastane koridorunda zombi avlayan doktor',8);
        toast('Zombi etkisiz hale getirildi!','good');(function(p){setTimeout(function(){var ix=P.indexOf(p);if(ix>=0){try{dropP(p)}catch(e){}}},22000)})(p);continue}}
    var sp=z.sp*(1+S.day*.03);if(d>.9){var nx=g.position.x+dx/d*sp*dt,nz=g.position.z+dz/d*sp*dt;if(!hitCol(nx,g.position.z,.25))g.position.x=nx;if(!hitCol(g.position.x,nz,.25))g.position.z=nz}
    faceMove(g,dx,dz);if(z.vis){z.ph+=dt*5;z.vis.position.set(g.position.x,Math.abs(Math.sin(z.ph))*.04,g.position.z);z.vis.rotation.set(.14,g.rotation.y,Math.sin(z.ph*.5)*.07)}else{try{walkAnim(g,1.2,dt)}catch(e){}}g.position.y=0;
    z.hit-=dt;if(d<1.15&&z.hit<=0){z.hit=1.3;var dm=DIS.res.security?4:9;S.hp=Math.max(1,S.hp-dm);S.hpT=S.t;S.stress=clamp(S.stress+6,0,150);S.kick=1;try{sfx.punch();setTimeout(sfx.ouch,100)}catch(e){}toast('Zombi seni ısırdı! Can: %'+Math.round(S.hp),'bad')}
    z.moan-=dt;if(z.moan<=0&&d<9){z.moan=rnd(3,7);try{tone(rnd(70,110),.7,'sawtooth',.035);sfxNoise(.5,250,.8,.03)}catch(e){}}}}

/* ---- SEL ---- */
function floodTick(dt){if(!DIS.water){var g=new THREE.PlaneGeometry(34,22);g.rotateX(-Math.PI/2);DIS.water=new THREE.Mesh(g,new THREE.MeshPhongMaterial({color:0x2f6f86,transparent:true,opacity:.5,shininess:90,specular:0xaad8e6,depthWrite:false}));DIS.water.position.set(0,.02,0);DIS.water.renderOrder=3;DIS.water.userData.noHit=true;scene.add(DIS.water);DIS.st.flood=1;
    banner('SU BASIYOR','ZEMİN KAT YÜKSELİYOR','anons','Su seviyesi yükseliyor. Yürümek yavaşlayacak; elektrik de gidip gelecek.')}
  var rate=DIS.res.generator?.0006:.0010;DIS.wl=Math.min(.34,DIS.wl+dt*rate*(1+S.day*.1)*.6);DIS.water.position.y=.02+DIS.wl;DIS.water.material.opacity=.45+DIS.wl*.4;
  if(Math.random()<dt*.6)try{sfxNoise(.5,1200,.8,.01,'bandpass')}catch(e){}}
var _tmDis=tryMove;tryMove=function(dx,dz){if(DIS.water&&DIS.wl>.08){var k=1-clamp(DIS.wl,0,.34)*1.4;dx*=k;dz*=k}return _tmDis(dx,dz)};

/* ---- ASTEROİT ---- */
function impact(){DIS.st.imp=1;DIS.sh=9;DIS.shP=2.2;disFlash('#fff7e0',1,5);banner('ASTEROİT','DÜNYANIN SON NÖBETİ','anons','Çarpma! Çok büyük bir ışık, sonra sessizlik… sonra bağırışlar.');
  try{sfxNoise(6,50,.5,.3,'lowpass');tone(32,4,'sine',.18);sfxNoise(2,2000,.4,.12)}catch(e){}S.stress=clamp(S.stress+10,0,150);absOnce('Dünyanın sonunda nöbet tutan doktor',10);
  try{startBlackout(9)}catch(e){}for(var i=0;i<3;i++)setTimeout(function(){if(LIVE())try{ceilDrop()}catch(e){}},1200+i*1400);
  setTimeout(function(){if(!LIVE())return;try{spawnTrauma()}catch(e){}try{spawnBed(nextEnc(),true)}catch(e){}try{spawnWalker(nextEnc());spawnWalker(nextEnc())}catch(e){}toast('Şok dalgasından yaralananlar geliyor!','bad');newsAdd('Asteroit düştü: acilde nöbet sürüyor')},4000)}

/* ---- bölüm planı ---- */
function disPlan(){var D=S.DUR,e=[];
  function at(f,fn){e.push({t:D*f,fn:fn})}
  if(S.day===3){at(.12,function(){quake(.6)});at(.34,function(){quake(1)});at(.57,function(){quake(1.5)});at(.78,function(){quake(2)})}
  else if(S.day===4){at(.14,function(){zInfect(2)});at(.36,function(){zInfect(3)});at(.58,function(){zInfect(4)});at(.78,function(){zInfect(5)})}
  else if(S.day===5){[.2,.4,.6,.8].forEach(function(f){at(f,function(){if(BLK.t<=0){DIS.st.blk++;startBlackout((DIS.res.generator?.5:1)*rnd(14,22))}})})}
  else if(S.day===6){var evs=[function(){quake(1)},function(){zInfect(2)},function(){if(BLK.t<=0){DIS.st.blk++;startBlackout((DIS.res.generator?.5:1)*rnd(10,16))}},function(){quake(.6)},function(){zInfect(3)}];
    for(var f=.1,k=0;f<.7;f+=.1,k++)at(f,evs[(k+Math.floor(Math.random()*2))%evs.length]);at(.74,impact);at(.84,function(){zInfect(2)});at(.9,function(){quake(.8)})}
  DIS.ev=e}

/* ---- kaynak seçimi ---- */
var RESOPT=[
  ['hemsire','👩‍⚕️ Ek hemşire','Bekleyen hastaların sabrı %25 daha yavaş azalır.'],
  ['generator','🔌 Yedek jeneratör','Elektrik kesintileri yarı sürer, su daha yavaş yükselir.'],
  ['security','🛡️ Güvenlik takviyesi','Zombi ısırığı yarıya iner, zombiler daha kolay devrilir.'],
  ['medkit','🩹 İlk yardım çantası','Canın 3 kat hızlı yenilenir.'],
  ['coffee','☕ Kahve ve simit paketi','+3 kupa kahve, moral +2, tokluk dolar.']];
function resShow(){if(DIS.rpick||S.day<2)return;DIS.rpick=1;S.mode='mini';try{unlock()}catch(e){}
  var o=document.getElementById('resPick');if(!o){o=document.createElement('div');o.id='resPick';o.style.cssText='position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(4,10,14,.82);color:#fff;font-family:inherit;padding:16px';document.body.appendChild(o)}
  var opts=RESOPT.slice().sort(function(){return Math.random()-.5}).slice(0,3);
  o.innerHTML='<div style="max-width:620px;width:100%;display:grid;gap:12px"><div style="font:700 13px/1 sans-serif;letter-spacing:.3em;color:#ffd23f">BÖLÜM '+S.day+' · '+DNAMES[Math.min(S.day,6)]+'</div><h2 style="margin:0;font-size:28px">Gece için bir kaynak seç</h2>'+
    opts.map(function(r){return '<button data-k="'+r[0]+'" style="text-align:left;padding:14px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(20,36,42,.95);color:#fff;font:600 17px/1.35 sans-serif;cursor:pointer"><b>'+r[1]+'</b><br><span style="font-weight:400;opacity:.85;font-size:15px">'+r[2]+'</span></button>'}).join('')+'</div>';
  o.hidden=false;o.style.display='grid';
  [].forEach.call(o.querySelectorAll('button'),function(b){b.onclick=function(){var k=b.getAttribute('data-k');DIS.res[k]=1;
    if(k==='coffee'){S.coffee+=3;S.moral+=2;S.food=100}
    o.style.display='none';S.mode='play';try{lock()}catch(e){}toast('Kaynak: '+b.textContent.split('\n')[0],'good')}})}
var _ceDis=cineEnd;cineEnd=function(){if(CINE.final){CINE.final=0;if(CINE.typing){clearInterval(CINE.typing);CINE.typing=null}CINE.on=false;bc('cine',0);var el=$('#cine');if(el){el.classList.remove('in');el.classList.add('out');setTimeout(function(){if(!CINE.on)el.hidden=true},450)}DIS.fin2=1;S.mode='play';endShift(true);return}
  _ceDis();if(!DIS.rpick&&S.day>=2)resShow()};

/* ---- final: gündoğumu ve vardiya devri ---- */
var _esDis=endShift;endShift=function(done){if(done&&!S.over&&S.day===6&&!DIS.fin2){DIS.fin=1;CINE.on=true;CINE.final=1;CINE.i=-1;CINE.lines=DIS.FINAL;CINE.t=0;S.mode='cine';bc('cine',1);
    var el=$('#cine');if(!el)return _esDis(done);$('#cnNum').textContent='SON';$('#cnTitle').textContent='VARDİYA DEVRİ';$('#cnPlace').textContent='Sabah 06:00 · Şehir Devlet Hastanesi · Acil Servis';
    $('#cnCard').hidden=false;$('#cnLine').hidden=true;el.hidden=false;el.classList.remove('out');void el.offsetWidth;el.classList.add('in');return}
  _esDis(done);try{disNews()}catch(e){}};

/* ---- haber bülteni ---- */
function disNews(){var kv=document.getElementById('endAb');if(!kv)return;var box=kv.parentNode.parentNode,o=document.getElementById('endNews');if(!o){o=document.createElement('div');o.id='endNews';o.style.cssText='grid-column:1/-1;margin-top:10px;padding:12px 16px;border-radius:12px;background:rgba(10,20,24,.7);border:1px solid rgba(255,255,255,.15)';box.appendChild(o)}
  var H=[],c=S.cnt,st=DIS.st;
  if(c.ex>=2)H.push('Acilde '+c.ex+' hasta kaybı: Etik kurul “neden bu kadar komik anlar?” diye sordu');else if(c.ex===0&&S.seen>3)H.push('Gece boyu kayıp yok: Acil doktoru “şans” dedi, kahve makinesi “emek” dedi');
  if(S.left>=3)H.push(S.left+' hasta sabırsızlıktan gitti: Bekleme salonuna “kısa kısa dua” panosu asıldı');
  if(S.seen>=8)H.push('Doktor '+S.seen+' hasta gördü: “Ayağım uyuştu ama gülümsemem hâlâ yerinde”');
  if(S.hurt>=2)H.push('Hastaları hırpalayan doktor: “Kazara oldu, eşyalar çok yakındı”');
  if(S.social>=1)H.push('Sosyal medyada hastayla selfie skandalı: “Beğenmeyenler engellensin”');
  if(S.dmg>=3)H.push('Hastane malzemelerinde hasar: Sigorta şirketi “bu acilde ne oluyor?” diye aradı');
  if(st.quakes)H.push('Deprem acili salladı: '+st.quakes+' sarsıntıda tavan karoları “ben burada değildim” dedi');
  if(st.zt)H.push('Zombi salgını: '+st.zk+'/'+st.zt+' zombi etkisiz hale getirildi, geriye kalan “yürüyen hasta” olarak kayıtlara geçti');
  if(st.flood)H.push('Zemin kat su altında: Hastane “yüzme havuzu açıldı” duyurusu yaptı');
  if(st.blk)H.push('Elektrik '+st.blk+' kez gitti: Jeneratör “ben ışık değilim, ben bir duyguyum” dedi');
  if(st.imp)H.push('Asteroit düştü, nöbet bitmedi: Dünya hâlâ dönüyor, doktor da kahve içiyor');
  if(S.absurdity>=15)H.push('Absürtlük rekoru: Bu gece anlatılacak hikâyeler 3 sene yeter');
  if(!H.length)H.push('Sıradan bir gece: Haber değeri yok, bu yüzden haber yaptık');
  H=H.slice(0,5);o.innerHTML='<div style="font:800 12px/1 sans-serif;letter-spacing:.25em;color:#ff6b5a;margin-bottom:8px">📰 SON DAKİKA · SABAH BÜLTENİ</div>'+H.map(function(h){return '<div style="font:600 15px/1.45 sans-serif;margin:6px 0">• '+h+'</div>'}).join('')}

/* ---- ana döngü ---- */
var _gfDis=gfxFrame;gfxFrame=function(dt){_gfDis(dt);try{disTick(dt)}catch(e){DIS.err=e}};
function disTick(dt){
  if(DIS.need&&LIVE()){DIS.need=0;disPlan();if(S.day>=5)STORM.on=true;if(S.day===6)STORM.t=Math.min(STORM.t,12)}
  if(LIVE()){var ci=CINE&&CINE.on;
    if(!ci){for(var i=0;i<DIS.ev.length;i++){if(S.clock>=DIS.ev[i].t){var f=DIS.ev[i].fn;DIS.ev.splice(i,1);i--;if(CB.state!=='cpr'&&CB.state!=='alarm')try{f()}catch(e){}else{DIS.ev.push({t:S.clock+8,fn:f});break}}}}
    if(DIS.zs.length)zTick(dt);
    if(S.day===5||(S.day===6&&S.clock>S.DUR*.3))floodTick(dt);
    if(DIS.res.hemsire)waiting().forEach(function(p){if(!p.busy)p.patience=Math.min(p.max,p.patience+dt*.25*(1+S.day*.08))});
    if(DIS.res.medkit&&S.t-S.hpT>1)S.hp=Math.min(100,S.hp+dt*2.4)}
  if(DIS.sh>0&&S.mode!=='end'){DIS.sh=Math.max(0,DIS.sh-dt);var k=Math.min(1,DIS.sh/1.2)*DIS.shP;camera.rotation.z+=Math.sin(S.t*37)*.012*k;camera.rotation.x+=Math.sin(S.t*29)*.010*k;camera.rotation.y+=Math.sin(S.t*23)*.008*k}
  if(DIS.st.zt&&DIS.zs.length&&LIVE()){var d=disFx();d.style.transition='opacity .6s';d.style.background='radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(40,160,40,.28))';d.style.opacity=1}else if(DIS.fx&&DIS.zs.length===0&&DIS.fx.style.background.indexOf('radial')>=0&&DIS.fx.style.opacity==='1'){DIS.fx.style.opacity=0}
}
