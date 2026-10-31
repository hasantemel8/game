/* ---------- YATAK BAŞI MONİTÖR DETAYI, OKSİJEN TÜPÜ, AMBU ---------- */
function prM(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r==null?.6:r,metalness:m||0})}
function prB(par,w,h,d,mat,x,y,z){var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.castShadow=true;par.add(o);return o}
function prC(par,rt,rb,h,mat,x,y,z,seg){var o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||18),mat);o.position.set(x,y,z);o.castShadow=true;par.add(o);return o}
function monDetail(M){var g=new THREE.Group();scene.add(g);var x=M.px,z=M.pz,dk=prM(0x161d20,.5),gr=prM(0x8e9ba1,.35,.6),b=M.bed;
  prB(g,.64,.46,.16,dk,x,1.58,z-.13);prB(g,.5,.34,.08,dk,x,1.58,z-.24);
  prB(g,.34,.02,.03,prM(0x24b36b,.4),x-.2,1.94,z+.02);prB(g,.2,.02,.03,prM(M.red?0xd32020:0xf2b705,.4),x+.1,1.94,z+.02);
  prB(g,.04,.06,.04,gr,x-.2,1.97,z-.1);prB(g,.04,.06,.04,gr,x+.2,1.97,z-.1);prB(g,.44,.025,.03,gr,x,2.0,z-.1);
  [[-.34,0x3a444b],[-.26,0x3a444b],[-.18,0x3a444b],[.18,0x2a7de1],[.26,0x2fa24a],[.34,0xd32020]].forEach(function(a){prB(g,.055,.02,.012,prM(a[1],.5),x+a[0],1.295,z+.066)});
  [[0,1,1],[1,0,1],[-1,0,1],[0,-1,1],[.7,.7,1]].forEach(function(a,i){var an=i/5*6.283;prC(g,.016,.016,.03,dk,x+Math.cos(an)*.27,.03,z+Math.sin(an)*.27,10).rotation.x=Math.PI/2*0;prB(g,.04,.025,.1,dk,x+Math.cos(an)*.15,.04,z+Math.sin(an)*.15).rotation.y=-an});
  var pts=[new THREE.Vector3(x+.3,1.3,z-.1),new THREE.Vector3(x+.42,1.0,z-.05),new THREE.Vector3(x+.2,.8,z+.3),new THREE.Vector3(b.x+.5,1.06,b.z-.35)];
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.008,6,false),prM(0x2a2e31,.6)));
  var pts2=[new THREE.Vector3(x+.22,1.3,z-.1),new THREE.Vector3(x+.34,.95,z),new THREE.Vector3(x+.1,.85,z+.5),new THREE.Vector3(b.x+.55,1.05,b.z+.05)];
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2),24,.006,6,false),prM(0x3a7be0,.6)));
  var cuff=prB(g,.12,.01,.16,prM(0x30363a,.8),b.x+.55,1.05,b.z+.05)}
function o2Tank(x,z){var g=new THREE.Group();g.position.set(x,0,z);scene.add(g);var wh=prM(0xf1f3f4,.35,.1),br=prM(0xc9a14a,.3,.8),gr=prM(0x9aa4aa,.35,.7);
  prC(g,.07,.07,.5,wh,0,.5,0);var sh=new THREE.Mesh(new THREE.SphereGeometry(.07,16,10,0,6.283,0,1.571),wh);sh.position.set(0,.75,0);g.add(sh);prC(g,.022,.026,.06,gr,0,.84,0);
  prC(g,.075,.075,.1,prM(0x2f9e44,.4),0,.64,0);
  prB(g,.1,.1,.08,br,0,.9,.03);prC(g,.035,.035,.016,prM(0xffffff,.3),.0,.92,.085,20).rotation.x=Math.PI/2;prC(g,.04,.04,.008,gr,0,.92,.078,20).rotation.x=Math.PI/2;
  prC(g,.012,.012,.16,prM(0xd8eef5,.1),.07,.95,.04,10);var ball=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),prM(0x222222));ball.position.set(.07,.96,.04);g.add(ball);prC(g,.01,.01,.03,br,.07,.86,.04,8);
  prC(g,.1,.12,.03,prM(0x2b3136,.5),0,.015,0);[0,1,2].forEach(function(i){var a=i*2.094;prB(g,.04,.03,.2,prM(0x2b3136,.5),Math.cos(a)*.08,.02,Math.sin(a)*.08).rotation.y=-a});
  prB(g,.2,.02,.02,gr,0,.65,.07);return g}
function bkAmbu(x,y,z,ry){var g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry||0;scene.add(g);var cl=prM(0xeef3f5,.35),bl=new THREE.MeshStandardMaterial({color:0xcfe9f6,roughness:.2,transparent:true,opacity:.65});
  var bag=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),cl);bag.scale.set(.075,.07,.13);bag.position.set(0,.07,0);g.add(bag);
  for(var i=-3;i<=3;i++){var r=new THREE.Mesh(new THREE.TorusGeometry(.07*Math.sqrt(Math.max(0,1-(i*.3)*(i*.3)))+.002,.003,6,20),prM(0xd5dde0,.5));r.position.set(0,.07,i*.036);g.add(r)}
  prC(g,.03,.035,.07,bl,0,.07,-.17,14).rotation.x=Math.PI/2;prC(g,.022,.022,.05,prM(0x2a7de1,.4),0,.07,-.22,12).rotation.x=Math.PI/2;
  var mk=new THREE.Mesh(new THREE.ConeGeometry(.06,.09,16,1,true),bl);mk.rotation.x=-Math.PI/2;mk.position.set(0,.07,-.3);g.add(mk);var rim=new THREE.Mesh(new THREE.TorusGeometry(.058,.008,8,20),prM(0xe0e6e8,.5));rim.position.set(0,.07,-.345);g.add(rim);
  var rs=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),prM(0xe5f1f6,.4));rs.scale.set(.04,.05,.12);rs.position.set(0,.09,.22);g.add(rs);
  prC(g,.01,.01,.07,prM(0x2f9e44,.5),0,.07,.145,8).rotation.x=Math.PI/2;return g}
var _bV35=build;build=function(){_bV35();try{MONS.forEach(monDetail);beds.forEach(function(b){o2Tank(b.x-.95,b.z-1.0);bkAmbu(b.x+.38,1.2,b.z-1.12,0)})}catch(e){if(window.console)console.error(e)}};
