/* ---------- YATAK DONANIMI: battaniye, çarşaf, yastık, EKG elektrotları, defib pedleri, serum askısı + damar yolu ---------- */
var BK=[];
function bkCloth(w,h,d,col,amp){var g=new THREE.BoxGeometry(w,h,d,18,1,26),p=g.attributes.position;for(var i=0;i<p.count;i++){var x=p.getX(i),y=p.getY(i),z=p.getZ(i),e=Math.max(0,(Math.abs(x)-w*.34)/(w*.16));y+=amp*(Math.sin(x*9+z*5)*.5+Math.sin(z*13-x*4)*.5)-.2*e*e;p.setY(i,y)}g.computeVertexNormals();var m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:col,roughness:.97,metalness:0}));m.castShadow=true;m.receiveShadow=true;return m}
function bkTube(pts,r,col){var t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),28,r,6,false),new THREE.MeshStandardMaterial({color:col,roughness:.5,metalness:0,transparent:col===0xdde6ea,opacity:col===0xdde6ea?.7:1}));return t}
function bkBuild(b){var g=new THREE.Group();scene.add(g);var bx=b.x,bz=b.z,red=!!b.red,W=red?1.0:.94;
  var K={g:g,b:b,cols:[0x7fb5d6,0x9fc8b5,0xd9d4c4,0xb9a7d6,0xe7b6b0]};
  var bl=new THREE.Group();bl.position.set(bx,1.045,bz+.55);var cl=bkCloth(W+.1,.025,1.05,0x7fb5d6,.01);bl.add(cl);K.bl=cl;
  var fold=new THREE.Mesh(new THREE.BoxGeometry(W*.9,.03,.16),new THREE.MeshStandardMaterial({color:0xf2f4f5,roughness:.95}));fold.position.set(0,.012,-.47);bl.add(fold);g.add(bl);
  var pil=new THREE.Mesh(new THREE.BoxGeometry(.5,.1,.34),new THREE.MeshStandardMaterial({color:0xf4f6f7,roughness:.95}));pil.position.set(bx,.79,bz-.93);pil.rotation.x=-.08;g.add(pil);
  /* EKG elektrotları + kablolar */
  var el=new THREE.Group();g.add(el);var mx=bx+(red?1.0:1.05),mz=red?-9.6:-9.5;
  [[-.12,-.52],[.12,-.52],[-.16,-.36],[.16,-.36],[0,-.3]].forEach(function(a,i){var d=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.006,12),new THREE.MeshStandardMaterial({color:0xf0f0ec,roughness:.8}));d.position.set(bx+a[0],1.07,bz+a[1]);el.add(d);var c=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.01,8),new THREE.MeshStandardMaterial({color:i%2?0xd32020:0x2a7de1,roughness:.5}));c.position.set(bx+a[0],1.08,bz+a[1]);el.add(c);
    el.add(bkTube([new THREE.Vector3(bx+a[0],1.08,bz+a[1]),new THREE.Vector3(bx+a[0]*1.8+.15,1.1,bz+a[1]-.12),new THREE.Vector3(bx+.62,.9,bz-.6),new THREE.Vector3(mx-.1,.95,mz+.25),new THREE.Vector3(mx,1.05,mz+.1)],.0035,[0x1c1c1c,0xd32020,0x2a7de1,0xf2b705,0x2f9e44][i]))});
  /* defib pedleri (kırmızı alan) */
  var pd=new THREE.Group();g.add(pd);[[.2,-.5],[-.19,-.18]].forEach(function(a){var p=new THREE.Mesh(new THREE.BoxGeometry(.13,.006,.11),new THREE.MeshStandardMaterial({color:0xe9e4d8,roughness:.8}));p.position.set(bx+a[0],1.07,bz+a[1]);p.rotation.y=.4;pd.add(p);var c=new THREE.Mesh(new THREE.BoxGeometry(.06,.008,.05),new THREE.MeshStandardMaterial({color:0xf08c1a,roughness:.6}));c.position.set(bx+a[0],1.075,bz+a[1]);c.rotation.y=.4;pd.add(c);
    pd.add(bkTube([new THREE.Vector3(bx+a[0],1.08,bz+a[1]),new THREE.Vector3(bx+a[0]+.2,1.0,bz+a[1]-.1),new THREE.Vector3(bx+.6,.85,bz-.75),new THREE.Vector3(7.95,.9,-5.85)],.006,0x14161a))});
  K.pd=pd;K.el=el;
  /* serum: askıdaki torba + hat + kanül */
  var iv=new THREE.Group();g.add(iv);var sx=bx-.65,sz=bz-.75;
  iv.add(bkTube([new THREE.Vector3(sx,1.7,sz),new THREE.Vector3(sx+.02,1.3,sz+.1),new THREE.Vector3(bx-.4,1.02,bz-.35),new THREE.Vector3(bx-.3,1.05,bz-.12),new THREE.Vector3(bx-.26,1.06,bz-.06)],.004,0xdde6ea));
  var can=new THREE.Mesh(new THREE.BoxGeometry(.025,.012,.04),new THREE.MeshStandardMaterial({color:0x2b6fd6,roughness:.5}));can.position.set(bx-.26,1.07,bz-.06);iv.add(can);var tp=new THREE.Mesh(new THREE.BoxGeometry(.07,.004,.06),new THREE.MeshStandardMaterial({color:0xf4f1ea,roughness:.9}));tp.position.set(bx-.26,1.069,bz-.07);iv.add(tp);
  K.iv=iv;g.visible=false;BK.push(K);return K}
/* sabit serum askısı direği (hastadan bağımsız) */
function bkPole(b){var m=new THREE.MeshStandardMaterial({color:0xc9d0d4,roughness:.35,metalness:.7}),sx=b.x-.62,sz=b.z-.45;var p=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,1.8,10),m);p.position.set(sx,.9,sz);scene.add(p);var h=new THREE.Mesh(new THREE.BoxGeometry(.3,.015,.015),m);h.position.set(sx,1.78,sz);scene.add(h);[0,1,2,3,4].forEach(function(i){var a=i*1.2566,f=new THREE.Mesh(new THREE.BoxGeometry(.28,.015,.02),m);f.position.set(sx,.04,sz);f.rotation.y=a;scene.add(f)})}
var _bV34=build;build=function(){_bV34();try{beds.forEach(function(b){bkBuild(b)})}catch(e){if(window.console)console.error(e)}};
var _gfV34=gfxFrame;gfxFrame=function(dt){_gfV34(dt);try{BK.forEach(function(K){var b=K.b,p=b.busy?b.p:null,on=!!p&&p.g&&p.g.parent===scene&&!p.fell&&(p.state==='bed'||p.state==='trauma'||p.state==='await');if(on&&!K.p){K.cl=K.cols[(p.n*7)%K.cols.length];K.bl.material.color.setHex(K.cl);K.bl.material.needsUpdate=true}K.p=on?p:null;K.g.visible=on;if(on){K.pd.visible=!!b.red||p.state==='trauma';K.iv.visible=!!b.red||(p.n%3!==0)}})}catch(e){}};
