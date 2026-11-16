/* ---------- parlak zemin: tavan ışıklarını/duvarları yansıtan küp harita (bir kez çekilir) ---------- */
var RFL={done:false,t:0};
var _gfRf=gfxFrame;gfxFrame=function(dt){_gfRf(dt);try{if(RFL.done||MOB||GFX.q==='low'||S.mode!=='play')return;RFL.t+=dt;if(RFL.t<2.5)return;RFL.done=true;
var fl=null;scene.children.forEach(function(o){if(fl||!o.isMesh||!o.geometry||o.geometry.type!=='PlaneGeometry')return;var p=o.geometry.parameters;if(p.width===34&&p.height===22&&o.rotation.x<0&&o.material&&o.material.map&&o.material.isMeshPhongMaterial)fl=o});
if(!fl)return;
var rt=new THREE.WebGLCubeRenderTarget(256,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter}),cc=new THREE.CubeCamera(.1,60,rt);cc.position.set(0,1.1,0);
var hid=[];scene.traverse(function(o){if(o.isMesh&&(o.userData.rig||o.isSkinnedMesh||(o.parent&&o.parent.userData&&o.parent.userData.rig))&&o.visible){o.visible=false;hid.push(o)}});
fl.visible=false;cc.update(renderer,scene);fl.visible=true;hid.forEach(function(o){o.visible=true});
var old=fl.material,m=new THREE.MeshStandardMaterial({map:old.map,roughness:.34,metalness:.0,envMap:rt.texture,envMapIntensity:.42});
fl.material=m;
}catch(e){RFL.err=e}};
