/* ---------- ruh hali: hasta/personel yüz ifadeleri durumdan türetilir ---------- */
var MOOD={t:0};
var _gfMd=gfxFrame;gfxFrame=function(dt){_gfMd(dt);try{MOOD.t-=dt;if(MOOD.t>0||!window.ABG||!ABG.rig||!ABG.rig.express)return;MOOD.t=.7;
P.forEach(function(p){if(!p.g||!p.g.userData||!p.g.userData.rig||p.g.parent!==scene)return;var e=null,r=Math.random();
if(p.dead||p.state==='dead')e='sleepy';
else if(p.state==='wait'){var f=p.max?p.patience/p.max:1;e=f<.3?'angry':f<.6?'worry':(f>.85&&r<.3?'smile':null)}
else if(p.trauma||p.state==='trauma')e='pain';
else if(p.state==='bed'||p.state==='await')e=(p.n%3===0)?'sleepy':'pain';
else if(p.state==='chase'||p.state==='alarm')e='surprised';
if(e)ABG.rig.express(p.g,e,1.2)});
[ECEW,HUS,CLN].forEach(function(w){if(w&&w.g&&w.g.userData&&w.g.userData.rig&&Math.random()<.12)ABG.rig.express(w.g,Math.random()<.7?'smile':'worry',2.2)})}catch(e){}};
