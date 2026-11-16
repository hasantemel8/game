/* ---------- PERDELİ KABİNLER + KAPI DETAYLARI ---------- */
function bkCurtain(x,z,len,ry,col,band){var g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);
  var seg=Math.round(len*16),geo=new THREE.PlaneGeometry(len,1.42,seg,6),p=geo.attributes.position,cs=[],c0=new THREE.Color(col),c1=new THREE.Color(band);
  for(var i=0;i<p.count;i++){var px=p.getX(i),py=p.getY(i);p.setZ(i,Math.sin(px*10.5)*.05+Math.sin(px*27)*.008+(py<0?Math.sin(px*10.5)*.01:0));var cc=py<-.45?c1:c0;cs.push(cc.r,cc.g,cc.b)}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));geo.computeVertexNormals();
  var f=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,side:THREE.DoubleSide}));f.position.y=.95;f.castShadow=true;g.add(f);
  var ng=new THREE.PlaneGeometry(len,.52,seg,2),np=ng.attributes.position;for(var j=0;j<np.count;j++)np.setZ(j,Math.sin(np.getX(j)*10.5)*.05);ng.computeVertexNormals();
  var n=new THREE.Mesh(ng,new THREE.MeshStandardMaterial({color:0xf2f6f7,roughness:.9,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false}));n.position.y=1.92;g.add(n);
  var st=new THREE.MeshStandardMaterial({color:0xc9d0d4,roughness:.35,metalness:.7});var rl=new THREE.Mesh(new THREE.BoxGeometry(len+.04,.03,.05),st);rl.position.y=2.22;g.add(rl);
  for(var k=0;k<=Math.floor(len/.16);k++){var r=new THREE.Mesh(new THREE.TorusGeometry(.018,.004,6,10),st);r.position.set(-len/2+.05+k*.16,2.18,0);r.rotation.y=Math.PI/2;g.add(r)}
  return g}
function doorDetail(){try{var D=DOOR,st=new THREE.MeshStandardMaterial({color:0xcfd6da,roughness:.3,metalness:.8}),dk=new THREE.MeshStandardMaterial({color:0x2b3136,roughness:.6});
  [[D.l,.42],[D.r,-.42]].forEach(function(a){var m=a[0],zz=a[1];[-1,1].forEach(function(s){var bar=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.55,10),st);bar.position.set(s*.075,-.05,zz);m.add(bar);[.2,-.2].forEach(function(dy){var so=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.04,6),st);so.rotation.z=Math.PI/2;so.position.set(s*.05,-.05+dy,zz);m.add(so)})});
    var kp=new THREE.Mesh(new THREE.BoxGeometry(.1,.24,1.06),st);kp.position.set(0,-1.0,0);m.add(kp);var gk=new THREE.Mesh(new THREE.BoxGeometry(.1,2.3,.02),dk);gk.position.set(0,0,-a[1]/.42*.545);m.add(gk)});
  var sn=new THREE.Mesh(new THREE.BoxGeometry(.32,.09,.06),dk);sn.position.set(16.85,2.44,7);scene.add(sn);var led=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),new THREE.MeshBasicMaterial({color:0x2fe28a}));led.position.set(16.85,2.44,7.04);scene.add(led)}catch(e){if(window.console)console.error(e)}}
var _bV36=build;build=function(){_bV36();try{
  var hide=[];scene.traverse(function(o){var gp=o.geometry&&o.geometry.parameters;if(o.isMesh&&gp&&gp.width===.05&&gp.depth===3.6&&(gp.height===2||gp.height===2.2||gp.height===2.0))hide.push(o)});
  hide.forEach(function(o){o.visible=false;var red=o.geometry.parameters.height===2.2;bkCurtain(o.position.x,o.position.z,3.5,Math.PI/2,red?0xe3a9a3:0x9fd0c6,red?0xc9716a:0x5fa89a)});
  doorDetail()}catch(e){if(window.console)console.error(e)}};
