/* ---------- BİLGİSAYARLAR: triyaj (2 adet) + yeşil alan (EKG / tomografi, yakınlaştırılabilir) ---------- */
var PCS=[],PCT=0,PCZ={on:false,p:null,slice:10,zoom:null,acc:0};
function pcMake(x,y,z,ry,kind){var g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;var dk=Lm(0x1b2226);
  [[.62,.4,.05,0,.3,0],[.08,.16,.06,0,.08,-.02],[.26,.02,.18,0,.01,-.02]].forEach(function(a){var m=new THREE.Mesh(new THREE.BoxGeometry(a[0],a[1],a[2]),dk);m.position.set(a[3],a[4],a[5]);g.add(m)});
  var kb=new THREE.Mesh(new THREE.BoxGeometry(.42,.02,.15),Lm(0x2c3438));kb.position.set(0,.01,.3);g.add(kb);
  var c=cvs(512,300),t=new THREE.CanvasTexture(c);var sc=new THREE.Mesh(new THREE.PlaneGeometry(.56,.33),new THREE.MeshBasicMaterial({map:t}));sc.position.set(0,.3,.028);g.add(sc);scene.add(g);
  var o={g:g,c:c,x:c.getContext('2d'),t:t,kind:kind,px:x,pz:z};PCS.push(o);return o}
function pcCur(){return POLI.cur&&P.indexOf(POLI.cur)>=0?POLI.cur:null}
function pcHr(p){var v=p&&(p.lv||(p.enc&&p.enc.vit));return clamp(v&&v[0]?v[0]:76,35,190)}

/* ---- bilimsel EKG motoru (P, QRS, ST, T bileşenleri; derivasyona göre) ---- */
function G(u,m,w){var d=(u-m)/w;return Math.exp(-d*d)}
function sig(x,c,k){return 1/(1+Math.exp(-(x-c)/k))}
var AFS=null;function afStarts(){if(AFS)return AFS;AFS=[0];var s=0,h=7;for(var i=0;i<3000;i++){h=(h*16807)%2147483647;s+=.55+.9*(h/2147483647);AFS.push(s)}return AFS}
var LD={II:{r:1,s:1,t:1,st:1,q:1},V2:{r:.35,s:2.8,t:1.35,st:1.4,q:0},V5:{r:1.25,s:.3,t:1,st:.9,q:.8}};
var EM={normal:{p:.15,q:.08,r:1,s:.15,st:0,t:.3},
 st:{p:.15,q:.2,r:.9,s:.05,st:.5,t:.7},twi:{p:.15,q:.08,r:1,s:.15,st:-.05,t:-.5,tb:.2},
 perik:{p:.14,q:.05,r:.95,s:.1,st:.22,t:.3,pr:-.1},hyperk:{p:.05,q:.06,r:.8,s:.2,st:0,t:1,tw:.03,qw:1.3},
 hypok:{p:.18,q:.08,r:.9,s:.2,st:-.14,t:.08,uw:.22},wpw:{p:.15,q:0,r:1,s:.1,st:0,t:.3,dl:.35},
 lbbb:{p:.15,q:0,r:.85,r2:.5,s:.05,st:-.3,t:-.4,qw:2.3,disc:1},av3:{p:.15,q:.08,r:1,s:.15,st:0,t:.3},
 af:{p:0,q:.08,r:1,s:.15,st:0,t:.28},svt:{p:0,q:.05,r:.9,s:.1,st:-.12,t:.15},
 pe:{p:.15,q:.3,r:.8,s:.55,st:0,t:-.3},long:{p:.15,q:.08,r:1,s:.15,st:0,t:.35,tc:.74,tw:.07},osborn:{p:.12,q:.08,r:.9,s:.15,st:0,t:.25,j:.45}};
function ecgSample(mode,hr,tau,lead,i,t){var L=LD[lead]||LD.II;
  if(mode==='flat')return .012*Math.sin(i*.2+t);if(mode==='vf')return ecgY(0,'vf',i,t);
  var RR=60/hr;if(mode==='vt'||mode==='sine'){if(mode==='vt')RR=60/Math.max(hr,170);return (mode==='vt'?.85:.7)*Math.sin(tau/RR*6.283)*(lead==='V2'?-.8:1)}
  var M=EM[mode]||EM.normal,uP,uQ;
  if(mode==='av3'){uP=((tau/.75)%1+1)%1;uQ=((tau/1.7)%1+1)%1}
  else if(mode==='af'){var S=afStarts(),tot=S[3000]*RR,tt=((tau%tot)+tot)%tot/RR,lo=0,hi=3000;while(hi-lo>1){var md=(lo+hi)>>1;if(S[md]<=tt)lo=md;else hi=md}uQ=(tt-S[lo])/(S[lo+1]-S[lo]);uP=uQ}
  else{uQ=((tau/RR)%1+1)%1;uP=uQ}
  var w=M.qw||1,sg=(M.disc&&lead==='V2')?-1:1,y=0;
  if(M.p)y+=M.p*G(uP,.14,.03);if(M.pr)y+=M.pr*G(uQ,.24,.05);
  y+=-M.q*L.q*G(uQ,.31-.006*w,.007*w)+M.r*L.r*G(uQ,.335,.01*w)-M.s*L.s*G(uQ,.36+.006*w,.009*w);
  if(M.r2)y+=M.r2*L.r*G(uQ,.36,.012*w);if(M.dl)y+=M.dl*G(uQ,.3,.022);
  if(M.st)y+=sg*M.st*L.st*(sig(uQ,.385+.01*w,.008)-sig(uQ,.54,.03));
  y+=sg*M.t*L.t*G(uQ,M.tc||.62,M.tw||.05);if(M.tb)y-=M.tb*G(uQ,.55,.03);if(M.uw)y+=M.uw*G(uQ,.75,.025);if(M.j)y+=M.j*G(uQ,.41,.018);
  if(mode==='af')y+=.04*Math.sin(tau*41)*Math.sin(tau*13)+.03*Math.sin(tau*63);
  return y}
function ecgBand(x,X,Y,W,H,mode,hr,t,lw,ph,lead){x.save();x.beginPath();x.rect(X,Y,W,H);x.clip();x.fillStyle='#04100c';x.fillRect(X,Y,W,H);x.strokeStyle='rgba(47,226,138,.14)';x.lineWidth=1;var gs=Math.max(8,H/6);for(var gx=0;gx<W;gx+=gs){x.beginPath();x.moveTo(X+gx,Y);x.lineTo(X+gx,Y+H);x.stroke()}for(var gy=0;gy<H;gy+=gs){x.beginPath();x.moveTo(X,Y+gy);x.lineTo(X+W,Y+gy);x.stroke()}
  x.strokeStyle='#2fe28a';x.lineWidth=lw||2;x.beginPath();var base=Y+H*.6,span=3.4;for(var i=0;i<W;i++){var tau=t+(ph||0)-(i/W)*span;var yy=base-ecgSample(mode,hr,tau,lead||'II',i,t)*H*.36;if(i===0)x.moveTo(X+i,yy);else x.lineTo(X+i,yy)}x.stroke();x.restore()}
/* ---- tanı eşleme: hastanın şikâyetinden EKG ritmi + BT bulgusu ---- */
var ECGCAP={normal:'Normal sinüs ritmi: her QRS’den önce P, PR 120–200 ms, dar QRS, T uyumlu.',st:'ST yükselmesi (komşu derivasyonlarda) + hiperakut T/Q dalgası: akut STEMI; resiprokal değişiklikleri ara, kateter laboratuvarını uyar.',twi:'Derin/bifazik T negatifliği (Wellens benzeri): kritik proksimal LAD darlığı; stres testi yapma.',af:'Atriyal fibrilasyon: düzensiz R-R, P dalgası yok, fibrilasyon zemini.',svt:'Dar QRS taşikardi (~180/dk), düzenli, P görünmez: SVT. Stabilse vagal manevra/adenozin.',vt:'Geniş QRS monomorfik taşikardi: VT. Nabızsız ise defibrilasyon.',vf:'Ventriküler fibrilasyon: kaotik zemin, QRS yok. Hemen defibrilasyon.',av3:'Tam AV blok: P-P düzenli (~80/dk), QRS bağımsız ve yavaş (~35/dk). Pacing hazırla.',sine:'Sinüs dalgası paterni: ağır hiperkalemi. Kalsiyum glukonat.',hyperk:'Sivri ve simetrik T, düşük P, geniş QRS: hiperkalemi.',hypok:'Düşük T, ST çökmesi, belirgin U dalgası: hipokalemi.',perik:'Yaygın konkav ST yükselmesi + PR depresyonu: perikardit.',pe:'Sinüs taşikardi, S1Q3T3 ve T negatifliği: akut sağ yüklenme/PE ile uyumlu.',wpw:'Kısa PR + delta dalgası: preeksitasyon (WPW).',lbbb:'Geniş QRS, diskordan ST-T: sol dal bloğu.',long:'Uzamış QT (T geç ve geniş): torsades riski.',osborn:'J (Osborn) dalgası + bradikardi: hipotermi.',flat:'Asistoli: izoelektrik çizgi.'};
var CTX=[ /* [regex, bölge, tanı, açıklama] */
 [/inme|felç|yüzü kay|konuşam|kol.*güçsüz/i,'head','b_mca','Nonkontrast BT: sol MCA alanında kama biçimli hipodens alan, gri-beyaz cevher ayrımı kaybı (iskemik inme).'],
 [/subaraknoid|gök gürültü|hayatımın en şiddetli|ani şiddetli baş/i,'head','b_sah','Nonkontrast BT: bazal sisternalarda ve Sylvian fissürde hiperdens kan (subaraknoid kanama).'],
 [/subdural|yaşlı.*düş|antikoagülan.*düş|varfarin/i,'head','b_sdh','Nonkontrast BT: hilal biçimli hiperdens ekstra-aksiyel kolleksiyon, hafif orta hat kayması (akut subdural hematom).'],
 [/epidural|kafasına|başına.*(vur|çarp|düş)|kask|kafa travma/i,'head','b_edh','Nonkontrast BT: bikonveks (mercek biçimli) hiperdens ekstra-aksiyel kolleksiyon (epidural hematom).'],
 [/intraserebral|beyin kanama|ani.*bilinç|hipertansif/i,'head','b_ich','Nonkontrast BT: bazal ganglionda geniş hiperdens hematom ve çevresinde hipodens ödem.'],
 [/hidrosefali|şant/i,'head','b_hyd','Nonkontrast BT: lateral ve 3. ventrikül genişlemiş (hidrosefali).'],
 [/apse|ensefalit|menenjit/i,'head','b_abs','BT: halka tarzı kontrast tutan lezyon ve çevresinde ödem (beyin apsesi).'],
 [/kafatası|kırık/i,'head','b_fx','Kemik penceresi: kafatasında çizgisel kırık ve pnömosefali (hava kabarcıkları).'],
 [/baş|kafa|bayıl|bilinç|sersem/i,'head','','Nonkontrast BT: akut kanama, kitle ya da orta hat kayması yok; sulkus ve ventrikül normal.'],
 [/perfor|ülser|serbest hava|akut karın|tahta gibi/i,'abd','a_perf','Nonkontrast BT: ön karın duvarı altında serbest hava kabarcıkları (organ perforasyonu).'],
 [/apandis|sağ alt/i,'abd','a_app','BT: sağ alt kadranda dilate, duvarı kalın apendiks ve çevresinde yağ dokusu bulanıklaşması (akut apandisit).'],
 [/anevrizma|aort.*rüptür|AAA/i,'abd','a_aaa','IV kontrastlı BT: abdominal aort anevrizması, mural trombüs ve retroperitoneal hematom (rüptür).'],
 [/ileus|obstrüksiyon|tıkan|fıtık|kusma/i,'abd','a_sbo','BT: dilate ince bağırsak ansları, hava-sıvı seviyeleri (mekanik ileus).'],
 [/divertikül/i,'abd','a_div','BT: sigmoid duvar kalınlaşması, periçolik yağ bulanıklaşması ve ekstralüminal hava (divertikülit).'],
 [/safra|kolesist|kolik|sağ üst/i,'abd','a_kol','BT: distandü safra kesesi, duvar kalınlaşması ve perikolesistik sıvı (kolesistit).'],
 [/dalak|künt karın|trafik|motor|düşme|yaralı/i,'abd','a_dal','IV kontrastlı BT: dalakta laserasyon (hipodens hat) ve perisplenik/perihepatik serbest kan (hemoperitoneum).'],
 [/karın|mide|bulantı|böbrek|ishal/i,'abd','','BT: solid organlar ve bağırsak normal; serbest hava ya da sıvı yok.'],
 [/pnömotoraks|gidon|göğüs travma|bıçak|delici/i,'chest','ptx','Toraks BT: sağ hemitoraksta periferik hava (damar izi yok), akciğer hilusa doğru çökmüş, mediastende kayma (basınçlı pnömotoraks).'],
 [/emboli|bacak.*şiş|uzun uçuş|pulmoner/i,'chest','pe','IV kontrastlı BT: sağ pulmoner arterde dolum defekti (pulmoner emboli).'],
 [/diseksiyon|yırtılma|sırta vuran|yırtıcı/i,'chest','dis','IV kontrastlı BT: çıkan ve inen aortta intimal flep, gerçek ve yalancı lümen (aort diseksiyonu).'],
 [/tamponad|perikard|bıçak.*kalp/i,'chest','tam','BT: kalbi çevreleyen perikardiyal sıvı halkası (tamponad fizyolojisi).'],
 [/ödem|kalp yetmezliği|nefes darlığı.*yat/i,'chest','edm','BT: bilateral perihiler buzlu cam, kelebek (bat-wing) dağılımı (kardiyojenik pulmoner ödem).'],
 [/pnömoni|zatürre|ateş|öksürük|balgam/i,'chest','pna','BT: sağ alt lobda konsolidasyon ve hava bronkogramı (pnömoni).'],
 [/plevral|sıvı|kanser/i,'chest','eff','BT: bilateral posterior plevral sıvı ve kompresif atelektazi.'],
 [/göğüs|nefes|çarpıntı|kalp|kriz/i,'chest','','Toraks BT: akciğer parankimi, mediasten ve büyük damarlar normal.']];
function pcInfo(p){if(!p)return {hr:76,mode:'normal',ecgCap:'',kind:'chest',dx:'',ctCap:'',abn:false,has:false};if(p._pci&&p._pci.hr===pcHr(p))return p._pci;
  var e=p.enc||{},tx=[e.key,e.cc,e.absurd,e.quote,e.story].join(' '),hr=pcHr(p),m=p.ecgMode||'';
  if(!m){if(/hiperkalemi|potasyum/i.test(tx))m='hyperk';else if(/hipokalemi/i.test(tx))m='hypok';else if(/perikardit/i.test(tx))m='perik';else if(/emboli|uzun uçuş/i.test(tx))m='pe';else if(/wpw|preeksit/i.test(tx))m='wpw';else if(/uzun qt|torsad/i.test(tx))m='long';else if(/hipotermi|donma/i.test(tx))m='osborn';else if(/göğüs ağr|kalp krizi|infarkt|kolumun|sol kol|baskı/i.test(tx))m='st';else if(/çarpıntı/i.test(tx))m='svt';else if(/AV blok|bayıl.*yavaş/i.test(tx))m='av3';else m='normal'}
  if(m==='brady')m='av3';if(m==='svt'&&hr<150)hr=180;if(m==='osborn')hr=Math.min(hr,44);
  var kind='chest',dx='',cap='Nonkontrast BT: akut patoloji saptanmadı.';for(var i=0;i<CTX.length;i++)if(CTX[i][0].test(tx)){kind=CTX[i][1];dx=CTX[i][2];cap=CTX[i][3];break}
  if(!dx&&p.trauma){kind='abd';dx='a_dal';cap=CTX[14][3]}
  return (p._pci={hr:pcHr(p),ehr:hr,mode:m,ecgCap:ECGCAP[m]||ECGCAP.normal,kind:kind,dx:dx,ctCap:cap,abn:!!dx,has:!!(p.ecgMode||m!=='normal'||dx)})}
/* ---- BT çizimi: hiperdens = parlak (taze kan, kontrast, kemik), hipodens = koyu (ödem, sıvı, iskemi), hava = siyah ---- */
function ctDraw(x,W,H,kind,dx,slice){x.fillStyle='#000';x.fillRect(0,0,W,H);var cx=W/2,cy=H/2,s=(kind==='head')?Math.min(W,H)/2:Math.min(W/3.05,H/2),k=1+Math.sin(slice*.7)*.04,sd=slice*977+7;function rn(){sd=(sd*9301+49297)%233280;return sd/233280}
  function el(a,b,rx,ry,col,rot){x.fillStyle=col;x.beginPath();x.ellipse(cx+a,cy+b,Math.max(1,rx),Math.max(1,ry),rot||0,0,7);x.fill()}
  function ln(a,b,c,d,col,w){x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(cx+a,cy+b);x.lineTo(cx+c,cy+d);x.stroke()}
  function mix(n,cols,rx,ry,r0,r1,sz){for(var i=0;i<n;i++){var a=rn()*6.28,r=r0+rn()*(r1-r0);el(Math.cos(a)*rx*r,Math.sin(a)*ry*r,s*sz*(.5+rn()),s*sz*(.4+rn()*.8),cols[(rn()*cols.length)|0],rn()*3)}}
  if(kind==='head'){var hv=dx==='b_hyd'?1.9:1;el(0,0,s*.82*k,s*.93*k,'#f0f0f0');el(0,0,s*.74*k,s*.85*k,'#8a8a8a');mix(55,['rgba(70,70,70,.5)','rgba(165,165,165,.45)'],s*.74,s*.85,0,.9,.06);
    ln(0,-s*.8,0,s*.8,'rgba(210,210,210,.5)',2);
    var vx=dx==='b_edh'||dx==='b_sdh'||dx==='b_ich'?-s*.05:0;el(vx-s*.1,-s*.06,s*.07*hv,s*.2*hv,'#1c1c1c',.25);el(vx+s*.1,-s*.06,s*.07*hv,s*.2*hv,'#1c1c1c',-.25);el(vx,s*.16,s*.035*hv,s*.06,'#1c1c1c');
    if(dx==='b_edh'){el(s*.66,-s*.12,s*.13,s*.4,'#f6f6f6',.15);el(s*.6,-s*.12,s*.06,s*.3,'#8a8a8a')}
    else if(dx==='b_sdh'){x.strokeStyle='#f2f2f2';x.lineWidth=s*.11;x.beginPath();x.ellipse(cx,cy,s*.66*k,s*.78*k,0,2.4,4.1);x.stroke()}
    else if(dx==='b_sah'){ln(0,-s*.05,-s*.55,-s*.3,'#f4f4f4',s*.05);ln(0,-s*.05,s*.55,-s*.3,'#f4f4f4',s*.05);ln(0,-s*.05,0,s*.55,'#f4f4f4',s*.05);el(0,0,s*.09,s*.09,'#f4f4f4');ln(-s*.1,0,-s*.5,s*.15,'#e8e8e8',s*.03);ln(s*.1,0,s*.5,s*.15,'#e8e8e8',s*.03)}
    else if(dx==='b_ich'){el(s*.3,0,s*.3,s*.26,'rgba(30,30,30,.7)');el(s*.3,0,s*.2,s*.16,'#f6f6f6',.4)}
    else if(dx==='b_abs'){el(-s*.3,-s*.1,s*.34,s*.3,'rgba(30,30,30,.75)');el(-s*.3,-s*.1,s*.16,s*.16,'#202020');x.strokeStyle='#eee';x.lineWidth=s*.035;x.beginPath();x.ellipse(cx-s*.3,cy-s*.1,s*.16,s*.16,0,0,7);x.stroke()}
    else if(dx==='b_mca'){x.fillStyle='rgba(35,35,35,.72)';x.beginPath();x.moveTo(cx-s*.7,cy-s*.2);x.lineTo(cx-s*.12,cy-s*.05);x.lineTo(cx-s*.2,cy+s*.35);x.lineTo(cx-s*.62,cy+s*.35);x.closePath();x.fill();el(-s*.3,s*.02,s*.2,s*.1,'rgba(200,200,200,.35)')}
    else if(dx==='b_fx'){ln(s*.55,-s*.68,s*.78,-s*.35,'#000',s*.035);for(var i=0;i<5;i++)el(-s*.1+rn()*s*.4,-s*.7+rn()*s*.1,s*.025,s*.025,'#000')}
    else if(dx==='b_tum'){el(s*.3,s*.25,s*.3,s*.25,'rgba(30,30,30,.65)');el(s*.3,s*.25,s*.15,s*.14,'#b0b0b0')}}
  else if(kind==='abd'){el(0,0,s*1.45,s*.92,'#bdbdbd');el(0,0,s*1.36,s*.84,'#3a3a3a');
    for(var j=0;j<70;j++)el((rn()-.5)*s*2.4,(rn()-.5)*s*1.4,s*.04,s*.03,'rgba(210,210,210,.07)');
    el(-s*.62,-s*.1,s*.5,s*.34,'#8d8d8d',.1);el(s*.72,-s*.05,s*.2,s*.3,'#8a8a8a',-.2);el(-s*.1,-s*.3,s*.2,s*.12,'#8a8a8a');
    el(0,s*.55,s*.14,s*.14,'#ececec');el(-s*.28,s*.38,s*.1,s*.16,'#a8a8a8');el(s*.28,s*.38,s*.1,s*.16,'#a8a8a8');el(-s*.07,s*.3,s*.07,s*.07,'#e8e8e8');el(-s*.2,s*.28,s*.07,s*.06,'#b0b0b0');
    mix(10,['#606060','#777'],s*1.2,s*.7,.1,.7,.12);
    if(dx==='a_perf'){for(var a1=0;a1<9;a1++)el(-s*.5+a1*s*.12,-s*.76+rn()*s*.05,s*.05+rn()*s*.04,s*.03,'#000')}
    else if(dx==='a_app'){x.strokeStyle='#9a9a9a';x.lineWidth=s*.13;x.beginPath();x.moveTo(cx-s*.8,cy+s*.2);x.lineTo(cx-s*.55,cy+s*.55);x.stroke();x.strokeStyle='#4a4a4a';x.lineWidth=s*.05;x.beginPath();x.moveTo(cx-s*.8,cy+s*.2);x.lineTo(cx-s*.55,cy+s*.55);x.stroke();for(var a2=0;a2<26;a2++)el(-s*.95+rn()*s*.55,s*.05+rn()*s*.7,s*.035,s*.025,'rgba(235,235,235,.5)')}
    else if(dx==='a_aaa'){el(0,s*.34,s*.3,s*.3,'#9c9c9c');el(0,s*.34,s*.17,s*.17,'#f0f0f0');el(s*.45,s*.4,s*.28,s*.22,'rgba(120,120,120,.9)',.2)}
    else if(dx==='a_sbo'){for(var a3=0;a3<6;a3++){var bx=(a3%3-1)*s*.5,by=(a3<3?-.1:.35)*s;el(bx,by,s*.22,s*.17,'#6a6a6a');x.save();x.beginPath();x.ellipse(cx+bx,cy+by,s*.22,s*.17,0,0,7);x.clip();x.fillStyle='#050505';x.fillRect(cx+bx-s*.3,cy+by-s*.2,s*.6,s*.2);x.restore();ln(bx-s*.22,by,bx+s*.22,by,'#bbb',1.5)}}
    else if(dx==='a_div'){el(-s*.3,s*.32,s*.2,s*.14,'#999');el(-s*.3,s*.32,s*.08,s*.06,'#111');for(var a4=0;a4<30;a4++)el(-s*.6+rn()*s*.55,s*.1+rn()*s*.45,s*.03,s*.02,'rgba(235,235,235,.5)');el(-s*.38,s*.28,s*.03,s*.03,'#000')}
    else if(dx==='a_kol'){el(-s*.28,s*.0,s*.2,s*.3,'#3c3c3c',.3);el(-s*.28,s*.0,s*.15,s*.25,'#555',.3);x.strokeStyle='#9a9a9a';x.lineWidth=s*.03;x.beginPath();x.ellipse(cx-s*.28,cy,s*.2,s*.3,.3,0,7);x.stroke()}
    else if(dx==='a_dal'){el(s*.72,-s*.05,s*.2,s*.3,'#8a8a8a',-.2);ln(s*.6,-s*.2,s*.8,s*.05,'rgba(30,30,30,.9)',s*.04);x.strokeStyle='rgba(150,150,150,.8)';x.lineWidth=s*.07;x.beginPath();x.ellipse(cx+s*.72,cy-s*.05,s*.28,s*.38,-.2,3.4,5.8);x.stroke();el(-s*.82,s*.2,s*.12,s*.3,'rgba(120,120,120,.85)')}}
  else{el(0,0,s*1.45,s*.9,'#c4c4c4');el(0,0,s*1.36,s*.82,'#555');
    var lungL={x:-s*.62,rx:s*.45},lungR={x:s*.62,rx:s*.45};
    if(dx==='ptx'){lungL.x=-s*.55;lungL.rx=s*.2;el(-s*.62,-s*.02,s*.45,s*.58,'#000',-.08)}else el(-s*.62,-s*.02,s*.45,s*.58,'#0b0b0b',-.08);
    if(dx==='ptx'){el(-s*.7,-s*.02,s*.1,s*.3,'rgba(120,120,120,.5)')}
    el(s*.62,-s*.02,s*.45,s*.58,'#0b0b0b',.08);
    el(dx==='ptx'?s*.15:-s*.08,s*.05,s*.3,s*.3,'#a2a2a2');el(0,s*.62,s*.13,s*.13,'#ececec');
    for(var q=0;q<44;q++){var sx=rn()<.5?-1:1;el(sx*(s*.2+rn()*s*.7),(rn()-.5)*s*.9,s*.03,s*.02,'rgba(120,120,120,.5)')}
    if(dx==='pna'){el(-s*.62,s*.2,s*.32,s*.28,'rgba(200,200,200,.75)');ln(-s*.8,s*.1,-s*.5,s*.3,'#222',2)}
    else if(dx==='pe'){el(-s*.25,-s*.2,s*.07,s*.07,'#f0f0f0');el(-s*.45,-s*.1,s*.14,s*.06,'#f0f0f0',.5);el(-s*.4,-s*.12,s*.06,s*.04,'#6a6a6a',.5)}
    else if(dx==='dis'){el(-s*.05,-s*.08,s*.17,s*.17,'#f0f0f0');el(s*.2,s*.45,s*.13,s*.13,'#f0f0f0');x.save();x.beginPath();x.ellipse(cx-s*.05,cy-s*.08,s*.17,s*.17,0,0,7);x.clip();x.fillStyle='#6a6a6a';x.fillRect(cx-s*.05,cy-s*.3,s*.2,s*.5);x.restore();ln(-s*.05,-s*.28,-s*.05,s*.12,'#222',2)}
    else if(dx==='tam'){x.strokeStyle='rgba(95,95,95,.95)';x.lineWidth=s*.13;x.beginPath();x.ellipse(cx-s*.05,cy+s*.05,s*.34,s*.34,0,0,7);x.stroke();el(-s*.05,s*.05,s*.22,s*.22,'#a8a8a8')}
    else if(dx==='edm'){el(-s*.5,0,s*.28,s*.4,'rgba(190,190,190,.45)');el(s*.5,0,s*.28,s*.4,'rgba(190,190,190,.45)')}
    else if(dx==='eff'){el(-s*.62,s*.32,s*.45,s*.26,'rgba(105,105,105,.95)',-.08);el(s*.62,s*.32,s*.45,s*.26,'rgba(105,105,105,.95)',.08)}}
  for(var n=0;n<240;n++){x.fillStyle='rgba(255,255,255,'+(rn()*.06).toFixed(3)+')';x.fillRect(rn()*W,rn()*H,1.5,1.5)}}
function splash(x,W,H,t){x.fillStyle='#0a2540';x.fillRect(0,0,W,H);x.fillStyle='#12406b';x.fillRect(0,H*.62,W,H*.38);x.fillStyle='#e8f1fa';x.fillRect(W/2-9,H*.14,18,54);x.fillRect(W/2-27,H*.14+18,54,18);x.textAlign='center';x.font='bold '+Math.round(H*.13)+'px sans-serif';x.fillText('MARVARD ACİL',W/2,H*.5);x.font=Math.round(H*.065)+'px sans-serif';x.fillStyle='#9cc4e8';x.fillText('Acil Servis Bilgi Sistemi',W/2,H*.6);if(((t*1.5)|0)%2){x.fillStyle='#7fe0ff';x.fillRect(W/2-5,H*.8,10,14)}x.textAlign='left'}
function pcDraw(o,t){var x=o.x,W=512,H=300;
  if(o.kind==='tri'){x.fillStyle='#0b2a3a';x.fillRect(0,0,W,H);x.fillStyle='#124b66';x.fillRect(0,0,W,36);x.fillStyle='#fff';x.font='bold 22px sans-serif';x.fillText('TRİYAJ KAYIT · BEKLEYENLER',12,26);
    var l=P.filter(function(p){return p.state==='wait'||p.state==='walk'||p.state==='bed'}).slice(0,8);x.font='19px monospace';
    l.forEach(function(p,i){var c=triColor(p);x.fillStyle=c[1];x.fillRect(12,50+i*30,14,22);x.fillStyle='#d9f2ff';x.fillText('#'+p.n+'  '+(((p.enc&&p.enc.cc)||'').slice(0,32)),36,68+i*30)});
    if(!l.length){x.fillStyle='#7fb4cc';x.fillText('Kuyruk boş. Kahve molası mı?',16,100)}if(((t*2)|0)%2){x.fillStyle='#7fe0ff';x.fillRect(W-24,H-24,12,16)}}
  else if(o.kind==='tri2'){x.fillStyle='#16241c';x.fillRect(0,0,W,H);x.fillStyle='#1f5a3a';x.fillRect(0,0,W,36);x.fillStyle='#fff';x.font='bold 22px sans-serif';x.fillText('YATAK & NÖBET DURUMU',12,26);
    var fr=0,tt=0;try{beds.forEach(function(b){tt++;if(!b.busy)fr++})}catch(e){}var wc=0;try{wc=waiting().length}catch(e){}
    x.font='24px monospace';x.fillStyle='#bff5d0';x.fillText('Boş yatak : '+fr+' / '+tt,16,84);x.fillText('Bekleyen  : '+wc,16,122);x.fillText('Puan      : '+Math.round(S.score||0),16,160);
    x.strokeStyle='#2fe28a';x.lineWidth=2;x.beginPath();for(var i=0;i<W-30;i++){var yy=230-Math.sin(i*.05+t*3)*8*Math.sin(i*.011+t);if(i===0)x.moveTo(15,yy);else x.lineTo(15+i,yy)}x.stroke()}
  else if(!pcInfo(pcCur()).has){splash(x,W,H,t)}
  else{var p=pcCur(),I=pcInfo(p),hr=I.ehr||I.hr,md=I.mode;x.fillStyle='#071a14';x.fillRect(0,0,W,H);x.fillStyle='#1b5e3b';x.fillRect(0,0,W,34);x.fillStyle='#fff';x.font='bold 20px sans-serif';x.fillText(p?('Hasta '+p.n+(p.name?' · '+p.name:'')):'POLİKLİNİK · HASTA BEKLENİYOR',10,24);
    ecgBand(x,10,44,300,100,md,hr,t,2,0,'II');ecgBand(x,10,148,300,70,md,hr,t,1.5,.18,'V5');
    x.save();x.translate(322,44);x.beginPath();x.rect(0,0,180,174);x.clip();ctDraw(x,180,174,I.kind,I.dx,10);x.restore();
    x.fillStyle='#ffd23f';x.font='18px monospace';x.fillText('HR '+hr+'  '+(md==='normal'?'SİNÜS':md.toUpperCase()),12,246);x.fillStyle='#9fd8b0';x.fillText(p?('Şikâyet: '+(((p.enc&&p.enc.cc)||'').slice(0,34))):'Yakından bak: [E]',12,274);x.fillStyle='#9fd8b0';x.fillText('BT '+I.kind.toUpperCase()+(I.dx?' ●':''),330,246)}
  o.t.needsUpdate=true}
function pczDraw(t,full){var p=PCZ.p,E=$('#pczE'),C=$('#pczC');if(!E||!C)return;var I=pcInfo(p),hr=I.ehr||I.hr,md=I.mode,x=E.getContext('2d'),W=E.width,H=E.height;if(!I.has){splash(x,W,H,t);if(full||PCZ.ctDirty){PCZ.ctDirty=false;var c0=C.getContext('2d');c0.fillStyle='#000';c0.fillRect(0,0,C.width,C.height);c0.fillStyle='#9cc4e8';c0.font='20px sans-serif';c0.textAlign='center';c0.fillText('Görüntüleme istenmedi',C.width/2,C.height/2);c0.textAlign='left'}return}
  [['II',0,0],['V2',1,.22],['V5',2,.4]].forEach(function(a){var h=(H-4)/3,y0=a[1]*h+a[1]*2;ecgBand(x,0,y0,W,h,md,hr,t,2.4,a[2],a[0]);x.fillStyle='#ffd23f';x.font='18px monospace';x.fillText(a[0],8,y0+20)});x.fillStyle='#ffd23f';x.font='20px monospace';x.fillText('HR '+hr+'  '+(md==='normal'?'SİNÜS':md.toUpperCase()),W-210,26);
  if(full||PCZ.ctDirty){PCZ.ctDirty=false;var c=C.getContext('2d');ctDraw(c,C.width,C.height,I.kind,I.dx,PCZ.slice);c.fillStyle='#9fd8b0';c.font='18px monospace';c.fillText('BT '+I.kind.toUpperCase()+' · kesit '+PCZ.slice+'/20',10,24)}}
function pczLayout(){var g=$('#pczG'),E=$('#pczE'),C=$('#pczC');g.style.gridTemplateColumns=PCZ.zoom?'1fr':'repeat(auto-fit,minmax(280px,1fr))';E.style.display=PCZ.zoom==='c'?'none':'';C.style.display=PCZ.zoom==='e'?'none':'';$('#pczH').textContent=PCZ.zoom?'Küçültmek için tekrar tıkla.':'Ekrana tıklayarak yakınlaştır · BT üzerinde tekerlek/kaydırıcı = kesit.'}
function pczOpen(){var p=pcCur();PCZ.p=p;PCZ.zoom=null;PCZ.slice=10;PCZ.ctDirty=true;S.mode='ui';unlock();show('#prompt',false);show('#pcz',true);PCZ.on=true;$('#pczS').value=10;
  $('#pczT').textContent=p?('Hasta '+p.n+(p.name?' · '+p.name:'')+(pcInfo(p).has?' · EKG ve Tomografi':' · Marvard Acil')):'Marvard Acil · Bilgi Sistemi';var I=pcInfo(p);$('#pczI').innerHTML=I.has?'<b>EKG:</b> '+I.ecgCap+'<br><b>BT:</b> '+I.ctCap:'Bu hasta için özel EKG ya da görüntüleme sonucu yok.';pczLayout();pczDraw(S.t||0,true)}
function pczClose(){if(!PCZ.on)return;PCZ.on=false;show('#pcz',false);S.mode='play';lock()}
(function(){var E=$('#pczE'),C=$('#pczC');if(!E)return;E.addEventListener('click',function(){PCZ.zoom=PCZ.zoom?null:'e';pczLayout()});C.addEventListener('click',function(){PCZ.zoom=PCZ.zoom?null:'c';pczLayout()});
  C.addEventListener('wheel',function(e){e.preventDefault();PCZ.slice=clamp(PCZ.slice+(e.deltaY>0?1:-1),1,20);$('#pczS').value=PCZ.slice;PCZ.ctDirty=true},{passive:false});
  $('#pczS').addEventListener('input',function(){PCZ.slice=+this.value;PCZ.ctDirty=true});$('#pczX').addEventListener('click',pczClose);
  addEventListener('keydown',function(e){if(PCZ.on&&(e.code==='Escape'||e.code==='KeyE')){e.preventDefault();e.stopPropagation();pczClose()}},true)})();
var _bV31=build;build=function(){_bV31();try{pcMake(4.9,1.16,4.35,Math.PI,'tri');pcMake(7.1,1.16,4.35,Math.PI,'tri2');pcMake(POLI.desk.x+.05,.77,POLI.desk.z-.2,Math.PI/2,'poli');
  fixedTargets.push({pos:V(-5.8,1.1,8.35),r:2.3,label:'Bilgisayar: EKG & tomografi',sub:'Ekranı yakınlaştır',act:pczOpen})}catch(e){if(window.console)console.error(e)}};
var _gfV31=gfxFrame;gfxFrame=function(dt){_gfV31(dt);try{PCT+=dt;if(PCT>.12){PCT=0;var t=S.t||0;PCS.forEach(function(o){if(Math.hypot(camera.position.x-o.px,camera.position.z-o.pz)<16)pcDraw(o,t)});if(PCZ.on)pczDraw(t,false)}}catch(e){}};

/* ---------- personel gezintisi: hemşire + temizlikçi ---------- */
var NW={st:'idle',t:4,tx:6,tz:3.5,pts:[[6,3.5],[4.6,3.1],[7.6,3.1],[6,1.6],[10,2.5],[2.4,2.2],[6,3.5]]};
function nurseTick(dt){var n=S.nurse;if(!n||CB.state==='cpr')return;
  if(NW.st==='idle'){NW.t-=dt;if(NW.t<=0){var q=pick(NW.pts);NW.tx=q[0];NW.tz=q[1];NW.st='go'}return}
  if(stepTo({g:n},NW.tx,NW.tz,1.25,dt)){NW.st='idle';NW.t=rnd(4,10);try{if(Math.random()<.35&&Math.hypot(camera.position.x-n.position.x,camera.position.z-n.position.z)<9)subtitle('nermin',pick(['Triyajda kuyruk uzuyor, bir göz atar mısın hocam?','Kâğıtlar bitti, yazıcı yine pes etti.','Kimlik göstermeden “ben acilim” diyen çok var.','Bir çay içsem mi… yok, hastalar bekliyor.']))}catch(e){}}}
var CW={st:'none',t:5,tx:0,tz:0};
var _clnV31=clnTick;clnTick=function(dt){var C=CLN;if(!C.g)return;
  if(C.q.length&&CW.st!=='none'){CW.st='none';CW.t=rnd(5,9)}
  if(C.st==='idle'&&!C.q.length){
    if(CW.st==='none'){CW.t-=dt;if(CW.t<=0){var q=pick(CATP);CW.tx=q[0];CW.tz=q[1];CW.st='go'}else return _clnV31(dt)}
    if(CW.st==='go'||CW.st==='ret'){if(stepTo({g:C.g},CW.tx,CW.tz,1.5,dt)){if(CW.st==='go'){CW.st='clean';CW.t=rnd(4,8)}else{CW.st='none';CW.t=rnd(5,10)}}return}
    if(CW.st==='clean'){CW.t-=dt;if(C.mop)C.mop.rotation.x=Math.sin(S.t*8)*.4;C.g.rotation.y+=Math.sin(S.t*1.3)*.01;if(CW.t<=0){if(C.mop)C.mop.rotation.x=0;CW.st='ret';CW.tx=C.home.x;CW.tz=C.home.z}return}}
  return _clnV31(dt)};
var _gfV32=gfxFrame;gfxFrame=function(dt){_gfV32(dt);try{if(LIVE())nurseTick(dt)}catch(e){}};

ABG.dbg=function(c){return eval(c)};
