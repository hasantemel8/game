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

# decoUp: phong metal; moto vb. başka yuvalar sonraki adımda eklenecek
open(dst, 'w', encoding='utf8').write(h)
print('tamam:', dst)
