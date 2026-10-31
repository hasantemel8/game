/* ---------- silah/bıçak item'ları, FPS kolları için item tanıma, zombi modelleri ---------- */
ABG.rig.isItem=function(c){try{return S.items.some(function(it){return it.obj===c})}catch(e){return false}};
var ZMOD={a:null,b:null};
(function(){if(!THREE.GLTFLoader||new URLSearchParams(location.search).get('glb')==='0')return;
  function ld(k,f,h){new THREE.GLTFLoader().load('models/'+f,function(g){var o=g.scene;o.traverse(function(n){if(n.isMesh){n.castShadow=false;n.frustumCulled=false;var m=n.material;if(m&&m.isMeshStandardMaterial){m.envMapIntensity=.3;m.roughness=Math.max(.55,m.roughness)}}});
    o.updateMatrixWorld(true);var bb=new THREE.Box3().setFromObject(o),sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3()),s=h/sz.y;
    var w=new THREE.Group();o.scale.setScalar(s);o.position.set(-c.x*s,-bb.min.y*s,-c.z*s);w.add(o);ZMOD[k]=w},undefined,function(){})}
  ld('a','zombie_a.glb',1.8);ld('b','zombie_b.glb',1.78)})();
function zomVis(){var k=Math.random()<.5?'a':'b',m=ZMOD[k]||ZMOD.a||ZMOD.b;if(!m)return null;var o=new THREE.Group();m.children.forEach(function(c){o.add(c.clone(true))});o.userData.noHit=true;return o}
