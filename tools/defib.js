/* ---------- DEFİBRİLATÖR: gerçekçi cihaz (3B) + şarj / çekilin / şok akışı ---------- */
var DFS={st:'idle',energy:0,chg:0,flash:0,msg:'',flat:0,shocks:0};
function dfDraw(x,W,H,t){var live=!!S.dfD,vf=live&&ecgRed.mode==='vf'&&DFS.flat<=0,hr=vf?0:(live?96:72),u=H/220;
  x.fillStyle='#050b09';x.fillRect(0,0,W,H);x.fillStyle='#0e2119';x.fillRect(0,0,W,26*u);x.font='bold '+(15*u|0)+'px monospace';x.fillStyle='#9fd8b0';x.fillText('MANUEL · DERİV II',8*u,18*u);
  x.fillStyle=DFS.energy?'#ffd23f':'#6b7f76';x.fillText((DFS.energy?DFS.energy:'---')+' J',W-86*u,18*u);
  x.strokeStyle='rgba(47,226,138,.12)';x.lineWidth=1;for(var gx=0;gx<W;gx+=18*u){x.beginPath();x.moveTo(gx,26*u);x.lineTo(gx,H-52*u);x.stroke()}
  x.strokeStyle=vf?'#ff6b5a':'#2fe28a';x.lineWidth=2.2*u;x.beginPath();var base=H*.46,flat=DFS.flat>0;
  for(var i=0;i<W;i++){var y=flat?base:base-ecgSample(vf?'vf':'normal',hr||75,t-(i/W)*3,'II',i,t)*H*.2;i?x.lineTo(i,y):x.moveTo(i,y)}x.stroke();
  x.fillStyle='#ffd23f';x.font='bold '+(20*u|0)+'px monospace';x.fillText(flat?'HR --':(vf?'HR ---  VF':'HR '+hr),10*u,H-30*u);
  x.fillStyle=DFS.st==='charged'?'#ff6b5a':'#9fd8b0';x.font=(14*u|0)+'px monospace';x.fillText(DFS.msg||(live?'':'BEKLEMEDE · pedler takılı değil'),10*u,H-10*u);
  if(DFS.st==='charging'||DFS.st==='charged'){x.fillStyle='#1b2b24';x.fillRect(W-150*u,H-40*u,140*u,14*u);x.fillStyle=DFS.st==='charged'?'#ff6b5a':'#ffd23f';x.fillRect(W-150*u,H-40*u,140*u*DFS.chg/100,14*u)}
  if(DFS.flash>0){x.fillStyle='rgba(255,255,255,'+Math.min(1,DFS.flash*3)+')';x.fillRect(0,0,W,H)}}
function dfMsg(m){DFS.msg=m;var e=$('#dfTxt');if(e)e.textContent=m}
function dfBtns(){var D=S.dfD;if(!D)return;var st=DFS.st;document.querySelectorAll('.dfe').forEach(function(b){b.disabled=!(st==='select');b.classList.toggle('on',+b.dataset.e===DFS.energy)});
  $('#dfChg').disabled=!(st==='select'&&DFS.energy);$('#dfClr').disabled=!(st==='charged'&&!D.clear);$('#dfShk').disabled=!(st==='charged');$('#dfAtt').textContent='Şok '+D.att+'/3 · önce enerji seç, şarj et, çekilin de, sonra şokla (Boşluk: sıradaki adım)'}
function startDefib(p,good){S.mode='defib';unlock();ecgRed.mode='vf';ecgRed.hr=0;sfx.alarm();S.dfD={p:p,good:good,att:1,over:false,clear:false,t:0};DFS.st='analyze';DFS.energy=0;DFS.chg=0;DFS.flat=0;DFS.flash=0;dfMsg('Ritim analiz ediliyor… hastaya dokunma.');show('#df',true);show('#prompt',false);dfBtns();clearInterval(DFS.h);DFS.last=0;DFS.h=setInterval(dfTick,50)}
function dfTick(){var D=S.dfD;if(!D){clearInterval(DFS.h);DFS.st='idle';DFS.energy=0;DFS.msg='';return}var nw=performance.now(),dt=Math.min(.25,(nw-(DFS.last||nw))/1000);DFS.last=nw;D.t+=dt;
  if(DFS.flash>0)DFS.flash-=dt;if(DFS.flat>0){DFS.flat-=dt;if(DFS.flat<=0&&D.after)D.after()}
  if(DFS.st==='analyze'&&D.t>1.6){DFS.st='select';dfMsg('ŞOKLANABİLİR RİTİM: VF. Bifazik enerji seç.');try{tone(1200,.1,'sine',.04)}catch(e){}dfBtns()}
  if(DFS.st==='charging'){DFS.chg=Math.min(100,DFS.chg+dt/2.4*100);if(DFS.chg>=100){DFS.st='charged';D.ct=0;D.clear=false;dfMsg('ŞARJ TAMAM. “Herkes uzaklaşsın!” de, sonra şokla.');try{tone(1000,.5,'sine',.05)}catch(e){}dfBtns()}}
  if(DFS.st==='charged'){D.ct+=dt;if(Math.floor(D.ct*2)!==Math.floor((D.ct-dt)*2))try{tone(1000,.08,'sine',.03)}catch(e){}if(D.ct>12){DFS.st='select';DFS.chg=0;dfMsg('Süre doldu: şarj iç yükle boşaltıldı. Tekrar şarj et.');dfBtns()}}
  var c=$('#dfScr');if(c&&S.mode==='defib')dfDraw(c.getContext('2d'),c.width,c.height,S.t)}
function dfPick(e){if(!S.dfD||DFS.st!=='select')return;DFS.energy=e;try{sfx.click()}catch(er){}dfMsg(e+' J seçildi. Şimdi şarj et.');dfBtns()}
function dfCharge(){var D=S.dfD;if(!D||DFS.st!=='select'||!DFS.energy)return;DFS.st='charging';DFS.chg=0;dfMsg('Şarj oluyor… '+DFS.energy+' J');try{for(var i=0;i<12;i++)tone(380+i*105,.22,'sawtooth',.018,i*.2)}catch(e){}dfBtns()}
function dfClear(){var D=S.dfD;if(!D||DFS.st!=='charged'||D.clear)return;D.clear=true;dfMsg('“Ben temizim, sen temiz, herkes temiz!” — kimse dokunmuyor. Şok ver.');try{tone(660,.1,'sine',.05)}catch(e){}dfBtns()}
function dfShock(){var D=S.dfD;if(!D||D.over||DFS.st!=='charged')return;if(!D.clear){dfMsg('DUR! Önce “ÇEKİLİN!” de; hastaya dokunan olabilir.');try{sfx.bad()}catch(e){}return}
  var ok=D.good?DFS.energy>=150:DFS.energy>=200;DFS.st='shock';DFS.flash=.35;DFS.flat=1.3;DFS.chg=0;try{sfx.shock();tone(70,.35,'sine',.2)}catch(e){}
  var f=$('#dfFlash');if(f){f.style.opacity='.9';setTimeout(function(){f.style.opacity='0'},90)}
  try{var g=D.p&&D.p.g;if(g){var y0=g.position.y;g.position.y=y0+.09;setTimeout(function(){g.position.y=y0},130)}}catch(e){}
  dfBtns();
  D.after=function(){D.after=null;if(ok){D.over=true;ecgRed.mode='normal';ecgRed.hr=96;DFS.st='done';dfMsg('Şok verildi. Organize ritim döndü! KPR’yi hemen kesme, nabız kontrol et.');try{sfx.good()}catch(e){}setTimeout(function(){DFS.st='idle';DFS.energy=0;endDefib(true)},1500)}
    else{D.att++;var m=DFS.energy<150?'Enerji yetersiz kaldı (bifazikte 150–200 J).':'Ritim değişmedi.';if(D.att>3){D.over=true;dfMsg(m+' Üç şok da işe yaramadı.');setTimeout(function(){DFS.st='idle';DFS.energy=0;endDefib(false)},1300)}else{DFS.st='select';DFS.energy=0;dfMsg(m+' 2 dk KPR sonrası tekrar dene: enerji seç.');dfBtns()}}}}
dfDown=function(e){if(e&&e.preventDefault)e.preventDefault();var D=S.dfD;if(!D||D.over)return;if(DFS.st==='select'){if(!DFS.energy)dfPick(200);else dfCharge()}else if(DFS.st==='charged'){if(!D.clear)dfClear();else dfShock()}};
dfRelease=function(){};
(function(){var fl=document.createElement('div');fl.id='dfFlash';fl.style.cssText='position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .4s;z-index:60';document.body.appendChild(fl);
  document.querySelectorAll('.dfe').forEach(function(b){b.addEventListener('click',function(){dfPick(+b.dataset.e)})});var a=$('#dfChg'),c=$('#dfClr'),s=$('#dfShk');if(a)a.addEventListener('click',dfCharge);if(c)c.addEventListener('click',dfClear);if(s)s.addEventListener('click',dfShock)})();
/* ---- 3B cihaz: acil arabası + manuel defibrilatör ---- */
function buildDefib3D(x,z,ry){var g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);
  var red=Lm(0xb3261e),dk=Lm(0x252b30),gr=Lm(0x9aa4aa),yl=Lm(0xf2b705),wh=Lm(0xe6eaec),blk=Lm(0x101214),mt=Lm(0xc9d0d4);
  function B(w,h,d,m,px,py,pz,par){var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(px,py,pz);o.castShadow=true;(par||g).add(o);return o}
  function C(rt,rb,h,m,px,py,pz,par,rx){var o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,18),m);o.position.set(px,py,pz);if(rx)o.rotation.x=rx;o.castShadow=true;(par||g).add(o);return o}
  B(.64,.05,.54,dk,0,.12,0);[[-.28,-.23],[.28,-.23],[-.28,.23],[.28,.23]].forEach(function(a){var w=C(.035,.035,.03,blk,a[0],.04,a[1]);w.rotation.z=Math.PI/2});
  B(.6,.6,.5,red,0,.45,0);[0,1,2].forEach(function(i){B(.54,.17,.012,Lm(0xd9453b),0,.2+i*.19+.1,.256);B(.2,.02,.02,mt,0,.27+i*.19,.266)});
  B(.66,.03,.56,gr,0,.765,0);B(.66,.06,.012,mt,0,.8,.275);B(.66,.06,.012,mt,0,.8,-.275);
  C(.016,.016,.9,gr,.3,1.0,-.24);C(.016,.016,.9,gr,-.3,1.0,-.24);B(.64,.02,.02,gr,0,1.44,-.24);
  var U=new THREE.Group();U.position.set(0,.78,0);g.add(U);
  B(.42,.28,.24,dk,0,.15,0,U);B(.44,.04,.26,yl,0,.31,0,U);B(.26,.03,.03,dk,0,.36,0,U);B(.03,.06,.03,dk,-.12,.335,0,U);B(.03,.06,.03,dk,.12,.335,0,U);
  B(.24,.17,.012,blk,-.03,.17,.122,U);
  var cv=document.createElement('canvas');cv.width=512;cv.height=300;var tx=new THREE.CanvasTexture(cv);var sc=new THREE.Mesh(new THREE.PlaneGeometry(.22,.13),new THREE.MeshBasicMaterial({map:tx}));sc.position.set(-.03,.17,.129);U.add(sc);
  C(.034,.034,.03,dk,.155,.2,.13,U,Math.PI/2);C(.034,.034,.008,gr,.155,.2,.147,U,Math.PI/2);B(.006,.03,.006,yl,.155,.215,.152,U);
  C(.018,.018,.016,Lm(0xf08c1a),.12,.085,.13,U,Math.PI/2);C(.026,.026,.02,Lm(0xd32020),.17,.085,.13,U,Math.PI/2);C(.014,.014,.014,Lm(0x2a7de1),.07,.085,.13,U,Math.PI/2);
  [-.17,-.12,-.07,-.02].forEach(function(px){B(.022,.01,.012,Lm(0x3a444b),px,.045,.126,U)});
  [-1,1].forEach(function(s){B(.04,.2,.2,dk,s*.25,.12,0,U);var pd=new THREE.Group();pd.position.set(s*.285,.17,.02);U.add(pd);C(.02,.02,.14,gr,0,0,0,pd);C(.05,.05,.025,mt,0,-.085,0,pd);C(.052,.052,.01,blk,0,-.07,0,pd);B(.025,.03,.025,Lm(0xd32020),0,.04,.03,pd);
    var pts=[];for(var i=0;i<=20;i++){var a=i/20;pts.push(new THREE.Vector3(s*(.285-.2*a)*1.0,.34-.2*a+.05*Math.sin(a*6.28),.02-.16*a));}
    var tb=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(function(v){return new THREE.Vector3(v.x,v.y,v.z)})),24,.006,6,false),blk);U.add(tb)});
  var o={g:g,c:cv,x:cv.getContext('2d'),t:tx,kind:'defib',px:x,pz:z};PCS.push(o);return g}
