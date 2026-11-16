/* ---- SİLAH DOLABI + personelin silahlanması: zombi gelince ortalık savaş alanı ---- */
var WAR={list:[],on:0,t:0,amb:2,kill:0,tr:[]};
function warGun(){var g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color:0x1d1d1d});var a=new THREE.Mesh(new THREE.BoxGeometry(.05,.07,.5),m);a.userData.noHit=true;g.add(a);var b=new THREE.Mesh(new THREE.BoxGeometry(.04,.14,.06),m);b.position.set(0,-.08,-.1);b.userData.noHit=true;g.add(b);g.position.set(.2,1.12,.32);g.userData.noHit=true;return g}
function warAdd(g,spawned){if(!g)return null;for(var i=0;i<WAR.list.length;i++)if(WAR.list[i].g===g)return WAR.list[i];var s={g:g,sp:spawned,cd:rnd(.2,1),gun:warGun(),tgt:null,wp:null,wt:0};g.add(s.gun);WAR.list.push(s);return s}
function warSpawn(k){var L=Object.assign({},LOOKS.hemsire,{rig:1,badge:1});L.fem=Math.random()<.6?1:0;if(!L.fem){L.shirt=0xffffff;L.pants=0x2d4f6b;L.hairStyle='short'}else{L.hairStyle=pick(['ponytail','bun','long'])}
  var g=makePerson(L);g.position.set(15.6,0,.4+k*.9);g.rotation.y=-Math.PI/2;scene.add(g);var s=warAdd(g,1);s.life=1;return s}
function warBang(a,b,hit){var d=b.clone().sub(a),l=d.length();if(l<.1)return;var m=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,l,5),new THREE.MeshBasicMaterial({color:0xffe08a,transparent:true,opacity:.95}));m.userData.noHit=true;
  m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());scene.add(m);WAR.tr.push({m:m,t:.07});
  var f=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),new THREE.MeshBasicMaterial({color:0xfff2b0}));f.userData.noHit=true;f.position.copy(a);scene.add(f);WAR.tr.push({m:f,t:.05});
  try{sfx.shot('pistol')}catch(e){}}
function zKillW(z){var p=z.p,g=p.g,i=DIS.zs.indexOf(z);if(i>=0)DIS.zs.splice(i,1);p.state='zdead';p.zomb=0;DIS.st.zk++;WAR.kill++;g.rotation.x=-Math.PI/2;g.position.y=.14;
  if(z.vis){z.vis.rotation.set(-Math.PI/2,g.rotation.y,0);z.vis.position.set(g.position.x,.14,g.position.z);(function(v){setTimeout(function(){scene.remove(v)},22000)})(z.vis)}
  if(p._tag&&p._tag.parent)p._tag.parent.remove(p._tag);(function(p){setTimeout(function(){if(P.indexOf(p)>=0){try{dropP(p)}catch(e){}}},22000)})(p);
  if(WAR.kill%3===1)toast(pick(['Hemşire zombiyi devirdi! 🔫','Personel ateş açtı: zombi yere serildi!','Güvenlik: “Temiz atış!”']),'good')}
function warTick(dt){
  for(var i=WAR.tr.length-1;i>=0;i--){var t=WAR.tr[i];t.t-=dt;if(t.t<=0){scene.remove(t.m);WAR.tr.splice(i,1)}}
  var zs=DIS.zs.filter(function(z){return z.p&&z.p.state==='zomb'});
  if(!WAR.on&&zs.length&&S.day>=4){WAR.on=1;WAR.t=0;try{banner('SİLAH DOLABI AÇILDI','PERSONEL SİLAHLANDI','anons','Güvenlik: “Herkes silah dolabına! Ben bir şey demedim, siz de bir şey duymadınız!”')}catch(e){}
    if(S.nurse)warAdd(S.nurse,0);if(ECEW&&ECEW.g)warAdd(ECEW.g,0);if(BH&&BH.g&&BH.st!=='none'&&BH.st!=='leave')warAdd(BH.g,0);for(var k=0;k<3;k++)warSpawn(k)}
  if(!WAR.on)return;WAR.t+=dt;
  var cp=camera.position;
  WAR.list.forEach(function(s){var g=s.g,gp=g.position;var best=null,bd=99;zs.forEach(function(z){var d=Math.hypot(z.p.g.position.x-gp.x,z.p.g.position.z-gp.z);if(d<bd){bd=d;best=z}});
    if(s.sp){if(!best||bd>9){s.wt-=dt;var tx=cp.x+Math.sin(WAR.t*.3+gp.x)*3,tz=cp.z+Math.cos(WAR.t*.3)*2.2;var dx=tx-gp.x,dz=tz-gp.z,d=Math.hypot(dx,dz);if(d>2.5){var sp=2.4*dt,nx=gp.x+dx/d*sp,nz=gp.z+dz/d*sp;if(!hitCol(nx,gp.z,.3))gp.x=nx;if(!hitCol(gp.x,nz,.3))gp.z=nz;faceMove(g,dx,dz);try{walkAnim(g,1.8,dt)}catch(e){}}}
      else if(bd<3.2){var ax=gp.x-best.p.g.position.x,az=gp.z-best.p.g.position.z,al=Math.hypot(ax,az)||1,sp2=2.6*dt,nx2=gp.x+ax/al*sp2,nz2=gp.z+az/al*sp2;if(!hitCol(nx2,gp.z,.3))gp.x=nx2;if(!hitCol(gp.x,nz2,.3))gp.z=nz2}}
    if(best&&bd<11){var dx2=best.p.g.position.x-gp.x,dz2=best.p.g.position.z-gp.z;g.rotation.y=Math.atan2(dx2,dz2);s.cd-=dt;if(s.cd<=0){s.cd=rnd(.5,1.1);var a=new THREE.Vector3(gp.x+Math.sin(g.rotation.y)*.45,1.2,gp.z+Math.cos(g.rotation.y)*.45),b=new THREE.Vector3(best.p.g.position.x+rnd(-.12,.12),rnd(.9,1.5),best.p.g.position.z+rnd(-.12,.12));warBang(a,b);
        if(Math.random()<.6){best.hp-=1;best.p.g.position.x+=dx2/(bd||1)*.15;best.p.g.position.z+=dz2/(bd||1)*.15;if(best.hp<=0)zKillW(best)}}}});
  /* ortam: uzaktan silah sesleri, rastgele kurşun izleri */
  WAR.amb-=dt;if(WAR.amb<=0){WAR.amb=rnd(1.4,3.6);try{noiseBurst(.1,.06,rnd(2800,5200));if(Math.random()<.35)tone(rnd(300,520),.12,'square',.02)}catch(e){}
    if(WAR.list.length&&Math.random()<.5){var s=pick(WAR.list),a2=new THREE.Vector3(s.g.position.x,1.2,s.g.position.z),b2=new THREE.Vector3(s.g.position.x+rnd(-9,9),rnd(.5,2),s.g.position.z+rnd(-6,6));warBang(a2,b2)}}}
function warClear(){WAR.list.forEach(function(s){if(s.sp)scene.remove(s.g);else if(s.gun&&s.gun.parent)s.gun.parent.remove(s.gun)});WAR.list=[];WAR.tr.forEach(function(t){scene.remove(t.m)});WAR.tr=[];WAR.on=0;WAR.kill=0}
var _nsWar=newShift;newShift=function(){warClear();_nsWar()};
var _gfWar=gfxFrame;gfxFrame=function(dt){_gfWar(dt);try{if(LIVE())warTick(dt)}catch(e){WAR.err=e}};
/* silah dolabı menüsü: tabanca, M4A4 ve ilaçlar */
function warGive(n){var it=S.items.filter(function(x){return x.name===n||x.n===n})[0];if(!it){toast('Dolapta '+n+' yok.','');return false}it.owned=true;setItem(S.items.indexOf(it),true);return true}
var _odWar=openDrug;openDrug=function(){
  openDialog({title:'Silah Dolabı',sub:'Çantanda: '+(S.inv.length?S.inv.map(function(d){return d[0]}).join(', '):'boş')+' · ilaç en fazla 3',quote:'(Dolabın kapağında not: “Kırmızı anahtar sadece zombi vakasında. Şimdilik herkes serbest, ama kimse bir şey söylemedi.”)',
   choices:[{t:'🔫 Tabanca al',fn:function(){hc.it=null;return {msg:warGive('Tabanca')?'🔫 Tabanca alındı. Eşya değiştirerek (R) çıkarırsın. Sol tıkla ateş.':'Dolapta yok.',tone:'good'}}},
    {t:'🔫 M4A4 al',fn:function(){hc.it=null;return {msg:warGive('M4 tüfek')?'🔫 M4A4 alındı. Otomatik ateş için tıkı basılı tut.':'Dolapta yok.',tone:'good'}}},
    {t:'💊 İlaç al (en fazla 3)',fn:function(){hc.it=null;S.mode='play';setTimeout(function(){_odWar()},50);return {msg:'İlaç rafı açılıyor…',tone:'good'}}}]})};
