#!/usr/bin/env python3
"""Ham oyun HTML'ini (tek dosya, CDN'li) bu deponun yapısına uyarlar: yerel Three.js, PBR katmanı, GLB yuvaları.
Kullanım: python3 tools/port.py ham_oyun.html index.html
Her değişiklik tam bir kez eşleşmelidir; oyun kodu değiştiyse betik hangi satırın uymadığını söyler."""
import sys
src, dst = sys.argv[1], sys.argv[2]
h = open(src, encoding='utf8').read()

def rep(old, new, count=1):
    global h
    n = h.count(old)
    assert n == count, 'EŞLEŞME HATASI (%d kez bulundu): %s' % (n, old[:90])
    h = h.replace(old, new)

# --- 1) betikler ---
rep('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
    '<script src="vendor/three.min.js"></script>\n<script src="js/pbr.js"></script>\n<script src="vendor/GLTFLoader.js"></script>')
rep("</script>\n\n</body></html>", "</script>\n<script src=\"js/glb-props.js\"></script>\n\n</body></html>")

# --- 2) tür kontrolleri: Lambert/Phong yerine PBR katmanının bayrakları ---
h = h.replace('.isMeshLambertMaterial', '.abgLam').replace('.isMeshPhongMaterial', '.abgPhg')
rep("o.material.color.setHex(0x726b60);o.material.specular.setHex(0x2e2c28);o.material.shininess=60}",
    "o.material.color.setHex(0x726b60);if(o.material.specular){o.material.specular.setHex(0x2e2c28);o.material.shininess=60}else{o.material.roughness=.34}}")

# --- 3) GLB yuva kaydı ---
rep("function col(x,z,w,d){colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2})}",
"""function col(x,z,w,d){colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2})}
/* ===== GLB eşya yuvaları =====
   js/glb-props.js modelleri yükleyip PR.provide(anahtar, üretici) ile verir. Model yoksa/yüklenemezse
   eski box/cyl görünümü aynen kalır. Yuva: eski düğümler gizlenir, yerine model konur. */
var PR=(function(){
  var tpl={},slots=[];
  function place(s){var t=tpl[s.key];if(!t||s.obj||s.failed)return;
    var o=t();if(!o){s.failed=true;return}
    o.position.set(s.x,s.y||0,s.z);o.rotation.y=s.ry||0;o.userData.noBreak=true;o.userData.glb=s.key;
    (s.par||scene).add(o);
    if(s.cb){var r;try{r=s.cb(o,s)}catch(e){r=false;if(window.console)console.error(e)}if(r===false){(s.par||scene).remove(o);s.failed=true;return}}
    s.obj=o;s.hide.forEach(function(n){n.visible=false})}
  return {
    mark:function(){return scene.children.length},
    grab:function(i0){return scene.children.slice(i0)},
    slot:function(key,hide,x,y,z,ry,par,cb){var s={key:key,hide:hide||[],x:x,y:y,z:z,ry:ry,par:par,cb:cb};slots.push(s);place(s);return s},
    has:function(key){return !!tpl[key]},
    make:function(key){return tpl[key]?tpl[key]():null},
    group:function(key){var o=tpl[key]?tpl[key]():null;if(!o)return null;var g=new THREE.Group(),w=[];g.add(o);o.traverse(function(n){if(/^wheel(?![a-z])/i.test(n.name))w.push(n)});return {g:g,wheels:w}},
    provide:function(key,make){tpl[key]=make;slots.forEach(function(s){if(s.key===key)place(s)})},
    slots:slots,tpl:tpl};
})();
(window.ABG=window.ABG||{}).props=PR;ABG.THREE=THREE;ABG.scene=scene;ABG.renderer=renderer;ABG.camera=camera;ABG.S=S;
ABG.isMini=function(){try{return !!((typeof O!=='undefined'&&O&&O.on)||(typeof OG!=='undefined'&&OG&&OG.on))}catch(e){return false}};""")

# --- 4) yuvalar ---
rep("box(1,.45,2.1,bedBase,bx,.38,-8);box(.94,.12,2,matt,bx,.67,-8);box(1,.7,.1,bedBase,bx,.8,-9.1);",
    "var _b0=PR.mark();box(1,.45,2.1,bedBase,bx,.38,-8);box(.94,.12,2,matt,bx,.67,-8);box(1,.7,.1,bedBase,bx,.8,-9.1);PR.slot('bed',PR.grab(_b0),bx,0,-8,0);")
rep("box(1.1,.45,2.3,bedBase,rx,.38,-8);box(1.04,.12,2.2,Lm(0xe28e86),rx,.67,-8);box(1.1,.7,.1,bedBase,rx,.8,-9.2);",
    "var _b0=PR.mark();box(1.1,.45,2.3,bedBase,rx,.38,-8);box(1.04,.12,2.2,Lm(0xe28e86),rx,.67,-8);box(1.1,.7,.1,bedBase,rx,.8,-9.2);PR.slot('bed_red',PR.grab(_b0),rx,0,-8,0);")
rep("function makeStretcherModel(){var g=new THREE.Group(),", "function makeStretcherModel(){var tg=PR.group('stretcher');if(tg)return tg;var g=new THREE.Group(),")
rep("function makeWC(){var g=new THREE.Group(),", "function makeWC(){var tg=PR.group('wheelchair');if(tg)return tg;var g=new THREE.Group(),")
rep("var tube=cyl(.004,.004,1.05,Lm(0xdfeef2),.13,1.18,0,g,6);tube.rotation.z=.08});",
    "var tube=cyl(.004,.004,1.05,Lm(0xdfeef2),.13,1.18,0,g,6);tube.rotation.z=.08;PR.slot('iv_stand',[g],b.x-.78,0,b.z-.75,0)});")
rep("var dk=Lm(0x1b2427),steel=Lm(0x8a9aa0);\n  cyl(.22,.26,.05,dk,x,.025,z,null,12);",
    "var _m0=PR.mark();var dk=Lm(0x1b2427),steel=Lm(0x8a9aa0);\n  cyl(.22,.26,.05,dk,x,.025,z,null,12);")
rep("  M.led=sph(.025,Bm(0x2fe28a),x+.38,1.3,z+.065);MONS.push(M)}",
    "  PR.slot('monitor',PR.grab(_m0),x,0,z,0,null,function(o){var sc=o.getObjectByName('screen');if(!sc)return false;sc.material=new THREE.MeshBasicMaterial({map:M.t});sc.userData.noHit=false});\n  M.led=sph(.025,Bm(0x2fe28a),x+.38,1.3,z+.065);MONS.push(M)}")

# --- 5) kalite: otomatik düşürme ÇÖZÜNÜRLÜĞÜ düşürmesin (pikselleşme) ---
rep("var pr=q==='high'?Math.min(window.devicePixelRatio||1,2):q==='med'?Math.min(window.devicePixelRatio||1,1.5):1;QL.pr=pr;",
    "var pr=GFX.keepPR||(q==='high'?Math.min(window.devicePixelRatio||1,2):q==='med'?Math.min(window.devicePixelRatio||1,1.5):1);QL.pr=pr;")
rep("if(avg>.045&&GFX.q!=='low'){GFX.q=GFX.q==='high'?'med':'low';applyQ();",
    "if(avg>.045&&GFX.q!=='low'){GFX.keepPR=renderer.getPixelRatio();GFX.q=GFX.q==='high'?'med':'low';applyQ();")
rep("GFX.q={low:'med',med:'high',high:'low'}[GFX.q];GFX.auto=false;applyQ();",
    "GFX.q={low:'med',med:'high',high:'low'}[GFX.q];GFX.auto=false;GFX.keepPR=0;applyQ();")

# --- 6) mini oyunlar eski görünümde kalsın + zemin AO ---
rep("/* ================= BAŞLAT ================= */",
"""/* ===== mini oyunlar eski (legacy) görünümde kalsın: PBR katmanını başlatma sırasında devre dışı bırak ===== */
(function(){function lg(f){return function(){ABG.legacy=(ABG.legacy||0)+1;try{return f.apply(this,arguments)}finally{ABG.legacy--}}}
  try{or3Init=lg(or3Init)}catch(e){}try{ogInit=lg(ogInit)}catch(e){}try{tdInit=lg(tdInit)}catch(e){}})();
/* ===== dünya kurulduktan sonra: zemine pişirilmiş AO ===== */
(function(){var _bb=build;build=function(){_bb();try{if(ABG.pbr&&ABG.bakeFloorAO)ABG.bakeFloorAO(scene,colliders)}catch(e){if(window.console)console.error(e)}}})();
/* ================= BAŞLAT ================= */""")

# --- 7) ek yuvalar: ilaç dolabı, doktor sandalyesi, ambulans, defibrilatör arabası, elde tutulan eşyalar ---
rep("box(.7,2.1,2.2,Lm(0xdfe6e4),16.5,1.05,2);box(.05,1.7,2,",
    "var _c0=PR.mark();box(.7,2.1,2.2,Lm(0xdfe6e4),16.5,1.05,2);box(.05,1.7,2,")
rep("box(.12,.16,.3,Lm(pick([0xff6b5a,0xffd23f,0x5ac8fa,0xffffff])),16.2,.6+sh*.42,2+dz)});",
    "box(.12,.16,.3,Lm(pick([0xff6b5a,0xffd23f,0x5ac8fa,0xffffff])),16.2,.6+sh*.42,2+dz)});PR.slot('med_cabinet',PR.grab(_c0),16.5,0,2,-Math.PI/2);PR.slot('defib',[],6.5,0,-9.6,0);")
rep("box(.5,.07,.5,Lm(0x2e3a40),POLI.doc.x,.48,POLI.doc.z);box(.08,.6,.5,Lm(0x2e3a40),POLI.doc.x+.27,.8,POLI.doc.z);cyl(.04,.04,.45,legM,POLI.doc.x,.24,POLI.doc.z,null,8);",
    "var _d0=PR.mark();box(.5,.07,.5,Lm(0x2e3a40),POLI.doc.x,.48,POLI.doc.z);box(.08,.6,.5,Lm(0x2e3a40),POLI.doc.x+.27,.8,POLI.doc.z);cyl(.04,.04,.45,legM,POLI.doc.x,.24,POLI.doc.z,null,8);PR.slot('doctor_chair',PR.grab(_d0),POLI.doc.x,0,POLI.doc.z,-Math.PI/2);")
rep("var t=cyl(.38,.38,.3,dk,w[0],.38,w[1],ag,12);t.rotation.z=Math.PI/2});\n  var la=",
    "var t=cyl(.38,.38,.3,dk,w[0],.38,w[1],ag,12);t.rotation.z=Math.PI/2});var _ah=ag.children.slice();\n  var la=")
rep("AMBS={a:la,b:lb,g:ag};\n", "AMBS={a:la,b:lb,g:ag};PR.slot('ambulance',_ah,0,0,.75,0,ag);\n")
rep("function addItem(n,line,rx,fx,fn){var g=new THREE.Group();fn(g);",
    "function addItem(n,line,rx,fx,fn){var g=new THREE.Group();fn(g);PR.slot('item_'+n.toLowerCase().replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'_'),g.children.slice(),0,0,0,0,g);")

# --- 8) Doktor dinlenme odası: gerçek bir oda (masa, yatak, dolap), yatağa etkileşimle 15 dk kestirme ---
rep("PR.slot('defib',[],6.5,0,-9.6,0);", "PR.slot('defib',[],7.95,0,-5.85,0);")
rep("function napGo(){", r"""function buildRestRoom(){
  var X0=4.72,X1=7.18,Z0=-10.7,Z1=-6.0,H=2.9,cx=(X0+X1)/2,cz=(Z0+Z1)/2;
  var wallM=Lm(0xe8e1d2),trim=Lm(0x4e6b73),wood=Lm(0x8d6e63),dkw=Lm(0x5d4037),dk=Lm(0x2a3236);
  var c=cvs(128,128),x=c.getContext('2d');x.fillStyle='#3b5a63';x.fillRect(0,0,128,128);for(var i=0;i<700;i++){x.fillStyle='rgba(255,255,255,'+(Math.random()*.06)+')';x.fillRect(Math.random()*128,Math.random()*128,2,2)}
  var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,3);
  var fl=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,Z1-Z0),new THREE.MeshLambertMaterial({map:t}));fl.rotation.x=-Math.PI/2;fl.position.set(cx,.014,cz);scene.add(fl);
  var cl=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,Z1-Z0),Lm(0xf1ede4));cl.rotation.x=Math.PI/2;cl.position.set(cx,H,cz);scene.add(cl);
  /* duvarlar (batı, doğu, güney + kapı boşluğu 5.0–6.0) */
  box(.1,H,Z1-Z0,wallM,X0-.05,H/2,cz);col(X0-.05,cz,.16,Z1-Z0);
  box(.1,H,Z1-Z0,wallM,X1+.05,H/2,cz);col(X1+.05,cz,.16,Z1-Z0);
  box(5.0-X0,H,.1,wallM,(X0+5.0)/2,H/2,Z1);col((X0+5.0)/2,Z1,5.0-X0,.16);
  box(X1-6.0,H,.1,wallM,(6.0+X1)/2,H/2,Z1);col((6.0+X1)/2,Z1,X1-6.0,.16);
  box(1.0,H-2.1,.1,wallM,5.5,2.1+(H-2.1)/2,Z1);
  [5.0,6.0].forEach(function(dx){box(.06,2.1,.14,wood,dx,1.05,Z1)});box(1.06,.06,.14,wood,5.5,2.1,Z1);
  /* lambri şeridi (iç yüz) */
  box(.03,1.0,Z1-Z0,trim,X0+.015,.5,cz);box(.03,1.0,Z1-Z0,trim,X1-.015,.5,cz);box(X1-X0,1.0,.03,trim,cx,.5,Z0+.015);
  /* tavan lambası */
  box(.9,.04,.4,Bm(0xfff4d6),cx,H-.03,cz);var rl=new THREE.PointLight(0xffe2b0,.8,7,1.5);rl.position.set(cx,2.5,cz);scene.add(rl);
  /* kapı üstü tabela + not */
  placeSign(signMesh('DOKTOR DİNLENME ODASI',2.0,.42,'#1d3b5c','#ffffff',.46),5.5,2.5,Z1+.07,0);
  var c2=cvs(256,128),k2=c2.getContext('2d');k2.fillStyle='#fff3c4';k2.fillRect(0,0,256,128);k2.fillStyle='#5b4220';k2.font='bold 22px sans-serif';k2.textAlign='center';k2.fillText('RAHATSIZ ETMEYİN',128,50);k2.font='18px sans-serif';k2.fillText('(kod mavi hariç)',128,86);
  var nt=new THREE.Mesh(new THREE.PlaneGeometry(.38,.19),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c2)}));nt.position.set(6.45,1.5,Z1+.07);scene.add(nt);
  /* çalışma masası */
  var r0=PR.mark();
  box(1.5,.05,.7,wood,5.55,.75,-10.35);box(.04,.72,.62,dkw,4.85,.36,-10.35);box(.5,.68,.62,dkw,6.05,.36,-10.35);
  box(.5,.32,.04,Bm(0x0b1a22),5.3,1.02,-10.45);cyl(.015,.015,.14,dk,5.3,.85,-10.45,null,6);box(.34,.015,.12,dk,5.3,.785,-10.2);cyl(.04,.035,.09,Lm(0xe8e8e2),5.65,.82,-10.2,null,10);
  PR.slot('rest_desk',PR.grab(r0),5.55,0,-10.35,0);col(5.55,-10.35,1.5,.7);
  /* sandalye (masaya dönük) */
  var r1=PR.mark();box(.5,.07,.5,Lm(0x2e3a40),5.55,.48,-9.55);box(.5,.6,.08,Lm(0x2e3a40),5.55,.8,-9.3);cyl(.04,.04,.45,dk,5.55,.24,-9.55,null,8);
  PR.slot('doctor_chair',PR.grab(r1),5.55,0,-9.55,Math.PI);
  /* dinlenme yatağı (baş ucu kuzeyde) */
  var r2=PR.mark();
  box(.95,.3,2.05,Lm(0xcfd8dc),6.65,.28,-7.6);box(.9,.14,1.98,Lm(0xa5d6a7),6.65,.5,-7.6);box(.5,.09,.34,Lm(0xf4f6f6),6.65,.61,-8.4);box(.88,.1,1.1,Lm(0x6c8fb3),6.65,.6,-6.95);
  PR.slot('rest_bed',PR.grab(r2),6.65,0,-7.6,0);col(6.65,-7.6,1.0,2.1);
  /* soyunma dolabı (batı duvarı) */
  var r3=PR.mark();box(.9,1.9,.5,Lm(0x607d8b),5.0,.95,-8.7);
  PR.slot('locker',PR.grab(r3),5.0,0,-8.7,Math.PI/2);col(5.0,-8.7,.5,.9);
  fixedTargets.push({pos:V(6.65,.9,-7.6),r:2.4,label:'Yatağa uzan',sub:'15 dakika kestir',act:function(){napGo()}})}
function napGo(){""")
rep("try{buildRest();nurseFem()}catch(e)", "try{buildRestRoom();nurseFem()}catch(e)")
rep("if(Math.hypot(camera.position.x-15.9,camera.position.z+1.5)<3)a.push({pos:V(16.2,1.3,-1.5),r:2.6,label:'Doktor Dinlenme Odası',sub:'15 dakika kestir · Uyku %'+Math.round(SLEEP.v),act:napGo});",
    "if(camera.position.x>4.6&&camera.position.x<7.3&&camera.position.z<-5.9&&camera.position.z>-10.8)a.push({pos:V(6.65,.9,-7.6),r:3,label:'Yatağa uzan',sub:'15 dakika kestir · Uyku %'+Math.round(SLEEP.v),act:napGo});")
rep("Sağ arkadaki “Doktor Dinlenme Odası”nda 15 dakika", "Boxların yanındaki “Doktor Dinlenme Odası”nda 15 dakika")
rep("SLEEP.v+dt*(h>24?.24:.14)", "SLEEP.v+dt*(h>24?.16:.09)")


# --- 9) kemikli karakterler (js/characters.js): hemşire, Ece, Zozan Abla, temizlikçi, birinci şahıs kollar ---
rep('<script src="js/pbr.js"></script>', '<script src="js/pbr.js"></script>\n<script src="js/characters.js"></script>')
rep("function makePerson(L){\n  if(L.bird)return makeBird();",
    "function makePerson(L){\n  if(L.bird)return makeBird();\n  if(L.rig&&window.ABG&&ABG.rig&&ABG.rig.on&&new URLSearchParams(location.search).get('rig')!=='0'){try{return ABG.rig.make(L)}catch(e){console.warn('rig hata, eski model:',e)}}")
rep("function sitPose(g,sit){", "function sitPose(g,sit){if(g.userData.rig){ABG.rig.sit(g,sit);return}")
rep("function walkAnim(g,sp,dt){var u=g.userData;if(!u||!u.L)return;", "function walkAnim(g,sp,dt){var u=g.userData;if(!u||!u.L)return;if(u.rig){ABG.rig.walk(g,sp,dt,S);return}")
rep("function relax(g,dt,look){var u=g.userData;if(!u||!u.L)return;", "function relax(g,dt,look){var u=g.userData;if(!u||!u.L)return;if(u.rig){ABG.rig.relax(g,dt,look,S,camera,scene);return}")
rep("function relaxAll(dt){", "function relaxAll(dt){if(window.ABG&&ABG.rig){ABG.rig.update(dt,S,camera);ABG.rig.updateArms(dt,S.item>0,S.t)}")
# hemşire
rep("var nurse=makePerson(LOOKS.hemsire);", "var nurse=makePerson(Object.assign({rig:1,fem:1,hairStyle:'ponytail',hair:0x3b2a1f,iris:'#4a3426',badge:1},LOOKS.hemsire));")
# Ece
rep("var g=makePerson(L);var nb=box(.16,.2,.03,Lm(0x3a6fd8),.0,.0,0,g);nb.position.set(.28,.95,.22);",
    "L.rig=1;L.fem=1;L.hairStyle='bun';L.badge=1;L.iris='#3a5a3a';var g=makePerson(L);if(!g.userData.rig){var nb=box(.16,.2,.03,Lm(0x3a6fd8),.0,.0,0,g);nb.position.set(.28,.95,.22)}")
# temizlikçi (Gülsüm)
rep("function buildCleaner(){var g=makePerson({skin:0xc99272,shirt:0x2f8f83,pants:0x2f8f83,hair:0x5a3b2a});",
    "function buildCleaner(){var g=makePerson({rig:1,fem:1,hairStyle:'scarf',scarf:0xe8dcc8,skin:0xc99272,shirt:0x2f8f83,pants:0x2f8f83,hair:0x5a3b2a,iris:'#4a2e1c'});")
# Zozan Abla
rep("var g=makePerson({skin:0xd9a47e,shirt:0x8e3b5f,pants:0x5a2440,hair:0x2a1a12,extra:'dress'});\n  g.traverse(",
    "var g=makePerson({rig:1,fem:1,hairStyle:'scarf',scarf:0xf2a65a,skirt:0x8e3b5f,skin:0xd9a47e,shirt:0x8e3b5f,pants:0x5a2440,hair:0x2a1a12,iris:'#3d2616',age:48});\n  if(g.userData.rig){g.userData.up=new THREE.Group()}\n  g.traverse(")
# kollar
rep("armR.position.set(.33,-.34,-.38);armR.rotation.set(.25,.25,0);camera.add(armR);",
    "armR.position.set(.33,-.34,-.38);armR.rotation.set(.25,.25,0);camera.add(armR);try{ABG.rig.makeArm(armR,0xe0ac84,0xf4f6f6,1)}catch(e){console.warn('kol hata',e)}")
rep("armL.position.set(-.33,-.36,-.38);armL.rotation.set(.2,-.25,0);camera.add(armL);",
    "armL.position.set(-.33,-.36,-.38);armL.rotation.set(.2,-.25,0);camera.add(armL);try{ABG.rig.makeArm(armL,0xe0ac84,0xf4f6f6,-1)}catch(e){console.warn('kol hata',e)}")
# konuşma / çığlık
rep("function subtitle(who,line){var el=$('#subs');if(!el)return;",
    "function subtitle(who,line){try{var tg={ece:ECEW.g,husnu:HUS.g,gulsum:CLN.g,nermin:S.nurse}[who];if(tg&&window.ABG&&ABG.rig){ABG.rig.talk(tg,Math.min(6,line.length*.07));ABG.rig.express(tg,who==='ece'?'smile':'neutral',3)}}catch(e){}var el=$('#subs');if(!el)return;")
rep("ECEL.scrT=14;try{subtitle('ece',line)}catch(e){}", "ECEL.scrT=14;try{subtitle('ece',line);ABG.rig.express(E.g,'surprised',3)}catch(e){}")


# --- 9b) sonradan yeniden tanımlanan femStaff katmanı: kemikli karakterleri bozmasın ---
rep("var g=makePerson(LL);femExtra(g,opt||{});return g}", "var g=makePerson(LL);if(!g.userData.rig)femExtra(g,opt||{});return g}")
rep("function nurseFem(){var n=S.nurse;if(!n||n.userData.fem)return;", "function nurseFem(){var n=S.nurse;if(!n||n.userData.fem||n.userData.rig)return;")
rep("var g=femStaff(L,'long',24,{hairCol:0x5b4636,long:1});var nb=box(.16,.2,.03,Lm(0x3a6fd8),.0,.0,0,g);nb.position.set(.28,.95,.22);\n  var bn=box(.13,.07,.01,Bm(0xffffff),0,0,0,g);bn.position.set(-.1,1.33,.155);",
    "var g=femStaff(Object.assign(L,{rig:1,fem:1,hairStyle:'long',badge:1,iris:'#3a5a3a'}),'long',24,{hairCol:0x5b4636,long:1});if(!g.userData.rig){var nb=box(.16,.2,.03,Lm(0x3a6fd8),.0,.0,0,g);nb.position.set(.28,.95,.22);\n  var bn=box(.13,.07,.01,Bm(0xffffff),0,0,0,g);bn.position.set(-.1,1.33,.155)}")
rep("var g=femStaff({skin:0xd9a47e,shirt:0x8e3b5f,pants:0x5a2440,hair:0x2a1a12,extra:'dress'},'bun',48,",
    "var g=femStaff({rig:1,fem:1,hairStyle:'scarf',scarf:0xf2a65a,skirt:0x8e3b5f,age:48,iris:'#3d2616',skin:0xd9a47e,shirt:0x8e3b5f,pants:0x5a2440,hair:0x2a1a12,extra:'dress'},'bun',48,")
rep("var up=g.userData.up;if(up){var sc=sph(.215,Lm(0xf2a65a),0,.9,-.03,up);sc.scale.set(1.02,.8,1.04)", "var up=g.userData.up;if(up&&!g.userData.rig){var sc=sph(.215,Lm(0xf2a65a),0,.9,-.03,up);sc.scale.set(1.02,.8,1.04)")
rep("buildCleaner=function(){var g=femStaff({skin:0xc99272,", "buildCleaner=function(){var g=femStaff({rig:1,fem:1,hairStyle:'scarf',scarf:0xe8dcc8,iris:'#4a2e1c',skin:0xc99272,")


# --- 10) pembe "DOKTOR" alanı + doktor masası + epikriz ekranı kaldırıldı (işlevsizdi) ---
_a = h.index("  /* doktor odası / epikriz */")
_e = "act:function(){openEpi()}});"
_b = h.index(_e, _a) + len(_e)
h = h[:_a] + "  /* (doktor masası / epikriz kaldırıldı) */" + h[_b:]
rep("  floorText('DOKTOR',2.1,.55,'#b0306f',8.6,-.7,0);\n", "")


# --- 11) hazır (CC-BY) insan modelleri: erkek yetişkin hastalara varyasyon olarak ---
rep("function makePatient(enc,lookKey){var p={n:++S.pn,enc:enc,age:(enc.age>10&&!enc.vk)?enc.age+Math.round(rnd(-3,3)):enc.age,g:makePerson(withFace(randLook(lookKey||enc.look),enc)),",
    "function pickVar(L,enc){try{var R=ABG.rig;if(!R||!R.vready||L.bird||L.extra||(enc.sex!=='Erkek'&&enc.sex!=='Kadın')||enc.age<20||enc.age>68||Math.random()>.45)return L;var n=0;P.forEach(function(q){if(q.g&&q.g.userData.rig&&q.g.userData.rig.variant)n++});if(n>=(MOB?3:7))return L;var vk=R.vpick(enc.sex==='Kadın');if(!vk)return L;L.rig=1;L.variant=vk}catch(e){}return L}\nfunction makePatient(enc,lookKey){var p={n:++S.pn,enc:enc,age:(enc.age>10&&!enc.vk)?enc.age+Math.round(rnd(-3,3)):enc.age,g:makePerson(pickVar(withFace(randLook(lookKey||enc.look),enc),enc)),")


# --- 12) POV kolları referansa göre: daha yukarı, daha büyük, ağzı görünür ---
rep("armR.position.set(.33,-.34,-.38);armR.rotation.set(.25,.25,0);", "armR.position.set(.34,-.26,-.40);armR.rotation.set(.42,.22,0);")
rep("armL.position.set(-.33,-.36,-.38);armL.rotation.set(.2,-.25,0);", "armL.position.set(-.34,-.28,-.40);armL.rotation.set(.40,-.22,0);")
rep("S.armR.rotation.x=.25+S.swing*", "S.armR.rotation.x=.42+S.swing*")
rep("S.armR.position.y=-.34+(", "S.armR.position.y=-.26+(")
rep("S.armL.position.y=-.36+(", "S.armL.position.y=-.28+(")

# decoUp: phong metal; moto vb. başka yuvalar sonraki adımda eklenecek
open(dst, 'w', encoding='utf8').write(h)
print('tamam:', dst)
