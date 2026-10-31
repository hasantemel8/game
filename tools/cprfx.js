/* ---------- KPR efekti: kamera hastanın göğsüne eğilir, eller göğse bastırır, her basışta göğüs çöker ---------- */
var CPF={on:0,kick:0,sx:0,sz:0,sa:null,k:0};
var _cpPr=cprPress;cprPress=function(){_cpPr();if(CB.state==='cpr')CPF.kick=1};
var _gfCp=gfxFrame;gfxFrame=function(dt){_gfCp(dt);try{cpfTick(dt)}catch(e){}};
function cpfTick(dt){var p=CB.p,on=CB.state==='cpr'&&p&&p.g&&S.armR&&S.armL;
  if(on&&!CPF.on){CPF.on=1;CPF.sx=camera.position.x;CPF.sz=camera.position.z;CPF.k=0;CPF.sa=[S.armR.position.clone(),S.armR.rotation.clone(),S.armL.position.clone(),S.armL.rotation.clone()]}
  if(CPF.on&&!on){CPF.on=0;camera.position.x=CPF.sx;camera.position.z=CPF.sz;if(CPF.sa&&S.armR){S.armR.position.copy(CPF.sa[0]);S.armR.rotation.copy(CPF.sa[1]);S.armL.position.copy(CPF.sa[2]);S.armL.rotation.copy(CPF.sa[3])}if(p&&p.g&&p.bed)p.g.position.y=.9;return}
  if(!on)return;CPF.kick=Math.max(0,CPF.kick-dt*5.5);var g=p.g,k=Math.min(1,dt*6);CPF.k+=(1-CPF.k)*k;
  var vent=CB.phase==='vent',cz=g.position.z-1.3+(vent?-.55:0),tx=g.position.x+.62,ty=1.52,tz=cz+(vent?.25:.02);
  camera.position.x+=(tx-camera.position.x)*k;camera.position.z+=(tz-camera.position.z)*k;camera.position.y+=(ty-CPF.kick*.07-camera.position.y)*Math.min(1,dt*14);
  camera.lookAt(g.position.x,vent?1.0:.98,cz);camera.rotation.z+=Math.sin(S.t*2.2)*.004;
  var kk=CPF.kick,dp=vent?0:kk*.09;
  S.armR.position.set(.04,-.30-dp,-.52);S.armR.rotation.set(.95,.1,0);S.armL.position.set(-.04,-.33-dp,-.55);S.armL.rotation.set(.95,-.1,0);
  g.position.y=.9-(vent?0:kk*.018);if(!vent)g.rotation.z=Math.sin(kk*3)*.01}
