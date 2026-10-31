/* Acilde Bir Gün — kemikli (skinned) insan sistemi
 *
 *  - Gerçek bir iskelet: pelvis > omurga > boyun > kafa, köprücük > omuz > dirsek > bilek, kalça > diz > ayak bileği.
 *  - Tek parça yumuşak ağ (skinned mesh): eklemler bükülürken deri/kumaş birlikte deforme olur (blok blok değil).
 *  - Gerçekçi yürüyüş/koşu: pelvis salınımı ve dönmesi, omuzların ters dönmesi, diz bükülmesi, topuk-parmak ayak hareketi,
 *    kol sallama, öne eğim, durağan duruşta nefes ve ağırlık aktarma.
 *  - Yüz "mimik paneli": kafaya oturan yüz dokusu; göz kırpma, bakış yönü, kaş, ağız (konuşma), gülümseme, şaşkınlık,
 *    endişe, kızgınlık ifadeleri.
 *  - ABG.rig.make(L)            -> oyun karakter grubu (eski makePerson ile aynı userData sözleşmesi)
 *  - ABG.rig.walk/relax/sit     -> hareket (oyunun walkAnim/relax/sitPose'u bunları çağırır)
 *  - ABG.rig.express(g,'smile',2) / ABG.rig.talk(g, 2.5)
 *  - ABG.rig.makeArms(parentR, parentL, skinHex, sleeveHex) -> birinci şahıs kollar/eller (parmak kıvırma)
 *  Gerçek bir insan modeli (ör. Mixamo/ReadyPlayerMe .glb) ileride aynı arayüzle bağlanabilir.
 */
(function () {
  'use strict';
  var THREE = window.THREE, ABG = window.ABG = window.ABG || {};
  if (!THREE) return;
  var R = ABG.rig = { list: [], on: true };
  var MOB = !!((window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window));
  var NS = MOB ? 10 : 16;                                   /* halka başına köşe sayısı */
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function col(hex) { var c = new THREE.Color(hex); if (ABG.pbr && !(ABG.legacy > 0)) c.convertSRGBToLinear(); return c; }
  function shade(hex, f) { var c = new THREE.Color(hex); c.r = clamp(c.r * f, 0, 1); c.g = clamp(c.g * f, 0, 1); c.b = clamp(c.b * f, 0, 1); return c.getHex(); }

  /* ===================== iskelet tanımı (dinlenme pozu, dünya koordinatları, +Z ileri, +X karakterin solu) ===================== */
  var B = { pelvis: 0, spine1: 1, spine2: 2, neck: 3, head: 4, clavL: 5, shL: 6, elL: 7, wrL: 8, clavR: 9, shR: 10, elR: 11, wrR: 12, hipL: 13, knL: 14, anL: 15, hipR: 16, knR: 17, anR: 18 };
  var NAMES = ['pelvis', 'spine1', 'spine2', 'neck', 'head', 'clavL', 'shL', 'elL', 'wrL', 'clavR', 'shR', 'elR', 'wrR', 'hipL', 'knL', 'anL', 'hipR', 'knR', 'anR'];
  var PARENT = [-1, 0, 1, 2, 3, 2, 5, 6, 7, 2, 9, 10, 11, 0, 13, 14, 0, 16, 17];
  var WP = [ /* dünya konumları */
    [0, .93, 0], [0, 1.05, 0], [0, 1.25, 0], [0, 1.45, 0], [0, 1.53, 0],
    [.05, 1.36, 0], [.205, 1.38, 0], [.205, 1.09, 0], [.205, .84, 0],
    [-.05, 1.36, 0], [-.205, 1.38, 0], [-.205, 1.09, 0], [-.205, .84, 0],
    [.092, .90, 0], [.092, .46, 0], [.092, .08, 0], [-.092, .90, 0], [-.092, .46, 0], [-.092, .08, 0]];

  /* ===================== ağ kurucu ===================== */
  function Mesh() { this.pos = []; this.rgb = []; this.si = []; this.sw = []; this.idx = []; }
  /* tek bir halka ekle. c: merkez [x,y,z], u,v: halka düzleminin birim eksenleri, a,b: yarıçaplar */
  Mesh.prototype.ring = function (c, u, v, a, b, color, w) {
    if (typeof w === 'function') w = w(0);
    var base = this.pos.length / 3, i, t, ca, sa;
    for (i = 0; i < NS; i++) {
      t = i / NS * Math.PI * 2; ca = Math.cos(t) * a; sa = Math.sin(t) * b;
      this.pos.push(c[0] + u[0] * ca + v[0] * sa, c[1] + u[1] * ca + v[1] * sa, c[2] + u[2] * ca + v[2] * sa);
      this.rgb.push(color.r, color.g, color.b);
      var ww = w.slice(0, 4); while (ww.length < 4) ww.push([0, 0]);
      this.si.push(ww[0][0], ww[1][0], ww[2][0], ww[3][0]); this.sw.push(ww[0][1], ww[1][1], ww[2][1], ww[3][1]);
    }
    return base;
  };
  /* ardışık halkaları birbirine bağla (yüzler dışa bakar); kapaklar için tek noktaya dönüşen halka eklenebilir */
  Mesh.prototype.join = function (r0, r1, flip) {
    for (var i = 0; i < NS; i++) {
      var j = (i + 1) % NS, a = r0 + i, b = r0 + j, c = r1 + i, d = r1 + j;
      if (flip) this.idx.push(a, c, b, b, c, d); else this.idx.push(a, b, c, b, d, c);
    }
  };
  Mesh.prototype.cap = function (r, flip) {
    var cx = 0, cy = 0, cz = 0, i, p = this.pos;
    for (i = 0; i < NS; i++) { cx += p[(r + i) * 3]; cy += p[(r + i) * 3 + 1]; cz += p[(r + i) * 3 + 2]; }
    var ci = p.length / 3; p.push(cx / NS, cy / NS, cz / NS);
    this.rgb.push(this.rgb[r * 3], this.rgb[r * 3 + 1], this.rgb[r * 3 + 2]);
    this.si.push(this.si[r * 4], this.si[r * 4 + 1], this.si[r * 4 + 2], this.si[r * 4 + 3]); this.sw.push(this.sw[r * 4], this.sw[r * 4 + 1], this.sw[r * 4 + 2], this.sw[r * 4 + 3]);
    for (i = 0; i < NS; i++) { var j = (i + 1) % NS; if (flip) this.idx.push(ci, r + j, r + i); else this.idx.push(ci, r + i, r + j); }
  };
  /* dikey (Y boyunca) bir uzuv: spec = [y, cx, cz, rx, rz, renk, ağırlıkFn(y)] yukarıdan aşağıya */
  var UX = [1, 0, 0], UZ = [0, 0, 1], UY = [0, 1, 0];
  Mesh.prototype.vloft = function (rings, capTop, capBot) {
    var prev = -1, first = -1, last = -1;
    for (var k = 0; k < rings.length; k++) {
      var s = rings[k], r = this.ring([s[1], s[0], s[2]], UX, UZ, s[3], s[4], s[5], s[6](s[0]));
      if (prev >= 0) this.join(prev, r, false); else first = r;
      prev = r; last = r;
    }
    if (capTop) this.cap(first, true); if (capBot) this.cap(last, false);
  };
  /* Z boyunca uzanan (ayak) halkalar: [z, cx, cy, rx(genişlik), ry(yükseklik), renk, w] */
  Mesh.prototype.zloft = function (rings, capA, capB) {
    var prev = -1, first = -1, last = -1;
    for (var k = 0; k < rings.length; k++) {
      var s = rings[k], r = this.ring([s[1], s[2], s[0]], UX, UY, s[3], s[4], s[5], s[6]);
      if (prev >= 0) this.join(prev, r, true); else first = r;
      prev = r; last = r;
    }
    if (capA) this.cap(first, false); if (capB) this.cap(last, true);
  };
  /* ağırlık: zincir [[kemik, eklemY],...] yukarıdan aşağıya; ekleme yakın yumuşak geçiş */
  function chainW(chain, band) {
    return function (y) {
      var t = [0], i; for (i = 1; i < chain.length; i++) t.push(sstep(chain[i][1] + band[i - 1], chain[i][1] - band[i - 1], y)); t.push(0);
      var out = []; for (i = 0; i < chain.length; i++) { var w = (i === 0 ? 1 - t[1] : t[i] - t[i + 1]); if (w > 0.002) out.push([chain[i][0], w]); }
      return out.length ? out : [[chain[0][0], 1]];
    };
  }
  function fixW(b) { return function () { return [[b, 1]]; }; }

  /* ===================== insan ağını üret ===================== */
  function bodyMesh(L) {
    var M = new Mesh(), fem = !!L.fem, skin = col(L.skin), skinS = col(shade(L.skin, .93)), shirt = col(L.shirt), pants = col(L.pants);
    var shoe = col(L.shoe || 0xf2f2f0), lowerArmSkin = !L.longSleeve;
    var wTorso = function (y) {
      var a = sstep(.95, 1.12, y), b = sstep(1.2, 1.34, y), c = sstep(1.40, 1.48, y), o = [];
      o.push([B.pelvis, 1 - a]); o.push([B.spine1, a * (1 - b)]); o.push([B.spine2, b * (1 - c)]); o.push([B.neck, c]);
      return o.filter(function (q) { return q[1] > .002; });
    };
    function sw(sx) {                       /* sx=+1 sol (+x), -1 sağ */
      var s = sx > 0;
      return {
        arm: chainW([[B.spine2, 9], [s ? B.shL : B.shR, 1.40], [s ? B.elL : B.elR, 1.09], [s ? B.wrL : B.wrR, .84]], [.06, .045, .035]),
        leg: chainW([[s ? B.hipL : B.hipR, 9], [s ? B.knL : B.knR, .46], [s ? B.anL : B.anR, .09]], [.055, .04]),
        hip: s ? B.hipL : B.hipR, an: s ? B.anL : B.anR
      };
    }
    /* ---- gövde ---- */
    var wf = fem ? .88 : 1, hf = fem ? 1.04 : 1, bust = fem ? .014 : 0;
    var T = [
      [.80, 0, 0, .150 * hf, .100, pants, wTorso],
      [.93, 0, 0, .170 * hf, .108, pants, wTorso],
      [1.00, 0, 0, .160 * hf, .102, pants, wTorso],
      [1.00, 0, 0, .165 * hf, .106, shirt, wTorso],
      [1.08, 0, 0, .145 * wf, .096, shirt, wTorso],
      [1.18, 0, .002, .150 * wf, .100 + bust * .6, shirt, wTorso],
      [1.27, 0, .004 + bust * .4, .168, .108 + bust, shirt, wTorso],
      [1.35, 0, 0, .184, .100, shirt, wTorso],
      [1.40, 0, 0, .172, .086, shirt, wTorso],
      [1.425, 0, 0, .100, .068, shirt, wTorso],
      [1.425, 0, 0, .062, .058, skin, wTorso],
      [1.47, 0, .004, .053, .056, skin, wTorso],
      [1.545, 0, .008, .050, .054, skin, wTorso]];
    M.vloft(T, false, true);
    /* ---- kollar ---- */
    [1, -1].forEach(function (sx) {
      var W = sw(sx), x = .205 * sx, shortSl = !L.longSleeve;
      var sleeve = shirt, cuffY = shortSl ? 1.20 : .90;
      var A = [
        [1.415, x * .94, 0, .040, .042, sleeve, W.arm], [1.375, x, 0, .053, .053, sleeve, W.arm],
        [1.26, x, 0, .046, .046, sleeve, W.arm],
        [cuffY, x, 0, .042, .043, sleeve, W.arm], [cuffY, x, 0, .040, .041, skin, W.arm],
        [1.09, x, 0, .036, .038, skin, W.arm], [1.00, x, 0, .037, .040, skin, W.arm],
        [.90, x, 0, .029, .031, skin, W.arm], [.84, x, 0, .026, .030, skin, W.arm]];
      if (!shortSl) { A[3][5] = sleeve; A[4][5] = sleeve; A[5][5] = sleeve; A[6][5] = sleeve; A[7][5] = sleeve; A[8] = [.84, x, 0, .028, .032, sleeve, W.arm]; A.push([.82, x, 0, .026, .030, skin, W.arm]); }
      M.vloft(A, true, false);
      /* el: avuç + parmaklar tek yassı yapı */
      var hb = sx > 0 ? B.wrL : B.wrR;
      M.vloft([[.84, x, 0, .028, .026, skin, fixW(hb)], [.80, x, .002, .036, .018, skin, fixW(hb)], [.75, x, .004, .038, .016, skin, fixW(hb)], [.70, x, .006, .034, .013, skin, fixW(hb)], [.665, x, .006, .026, .010, skin, fixW(hb)], [.655, x, .006, .01, .006, skin, fixW(hb)]], false, true);
      /* başparmak */
      M.vloft([[.80, x - sx * .035, .018, .011, .011, skin, fixW(hb)], [.755, x - sx * .042, .026, .010, .010, skin, fixW(hb)], [.72, x - sx * .042, .03, .008, .008, skin, fixW(hb)], [.715, x - sx * .042, .03, .004, .004, skin, fixW(hb)]], false, true);
    });
    /* ---- bacaklar ve ayaklar ---- */
    [1, -1].forEach(function (sx) {
      var W = sw(sx), x = .092 * sx, lowC = fem && L.skirt ? skin : pants;
      var G = [
        [.97, x, 0, .090, .092, pants, W.leg], [.90, x, 0, .088, .090, pants, W.leg], [.78, x, .002, .083, .086, pants, W.leg],
        [.62, x, .002, .070, .074, pants, W.leg], [.50, x, 0, .056, .060, pants, W.leg], [.46, x, 0, .054, .058, pants, W.leg],
        [.38, x, -.012, .054, .058, pants, W.leg], [.28, x, -.006, .048, .050, pants, W.leg], [.16, x, 0, .037, .038, pants, W.leg],
        [.11, x, 0, .036, .040, pants, W.leg], [.07, x, .002, .036, .042, shoe, fixW(W.an)]];
      M.vloft(G, false, false);
      /* ayakkabı (ayak bileğine sabit) */
      var f = fixW(W.an);
      M.zloft([[-.065, x, .045, .030, .040, shoe, f], [-.045, x, .040, .038, .046, shoe, f], [.00, x, .036, .042, .046, shoe, f], [.07, x, .030, .047, .038, shoe, f], [.13, x, .026, .048, .028, shoe, f], [.18, x, .022, .040, .020, shoe, f], [.205, x, .018, .028, .012, shoe, f]], true, true);
    });
    return M;
  }

  function skinnedFrom(M, mat) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(M.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(M.rgb, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(M.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(M.sw, 4));
    g.setIndex(M.idx); g.computeVertexNormals();
    return new THREE.SkinnedMesh(g, mat);
  }

  /* ===================== yüz paneli ===================== */
  var HC = [0, 1.62, .004], HR = [.098, .122, .108];                 /* kafa elipsoidi */
  var FP = { phi: .98, t0: 1.02, t1: 2.30 };                         /* yüz yaması açıları */
  function faceMap(x, y) {
    var dy = clamp((y - HC[1]) / HR[1], -.999, .999), th = Math.acos(dy), sn = Math.sin(th);
    var az = Math.asin(clamp(x / (HR[0] * sn), -.999, .999));
    return [(az + FP.phi) / (2 * FP.phi), (th - FP.t0) / (FP.t1 - FP.t0), HR[0] * sn, HR[1] * sn];
  }
  function headDeform(v) {                                           /* çene inceltme; elipsoid yüzeyine uygulanır */
    var ny = v.y / HR[1];
    if (ny < 0) { var k = 1 - .30 * Math.pow(-ny, 1.7); v.x *= k; v.z *= (1 - .20 * Math.pow(-ny, 1.7)); v.z += .012 * Math.pow(-ny, 2); }
    return v;
  }
  function paintFace(ctx, W, H, st, L) {
    ctx.clearRect(0, 0, W, H);
    var skin = '#' + new THREE.Color(L.skin).getHexString(), skinD = '#' + new THREE.Color(shade(L.skin, .78)).getHexString();
    function P(x, y) { var m = faceMap(x, y); return [m[0] * W, m[1] * H, W / (2 * FP.phi) / m[2], H / ((FP.t1 - FP.t0) * m[3])]; }   /* px, py, px/m yatay, px/m dikey */
    function E(x, y, rx, ry, fill, rot) { var p = P(x, y); ctx.beginPath(); ctx.ellipse(p[0], p[1], rx * p[2], ry * p[3], rot || 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); return p; }
    var hair = '#' + new THREE.Color(L.hair || 0x3a2a1c).getHexString();
    var brow = '#' + new THREE.Color(shade(L.hair || 0x3a2a1c, .7)).getHexString();
    var iris = L.iris || '#5b3d28', fem = !!L.fem, ex = st.expr, bl = st.blink, ey = 1.628, mx = 1.553;
    /* yumuşak gölgeler: göz çukuru, burun yanları, yanaklar */
    [-1, 1].forEach(function (s) {
      var p = P(s * .038, ey + .002), g = ctx.createRadialGradient(p[0], p[1], 1, p[0], p[1], .030 * p[2]);
      g.addColorStop(0, 'rgba(110,60,45,.22)'); g.addColorStop(1, 'rgba(110,60,45,0)'); ctx.fillStyle = g; ctx.fillRect(p[0] - 40, p[1] - 30, 80, 60);
      var q = P(s * .055, 1.585), gb = ctx.createRadialGradient(q[0], q[1], 1, q[0], q[1], .028 * q[2]), bk = ex === 'smile' ? .26 : (fem ? .17 : .1);
      gb.addColorStop(0, 'rgba(225,105,95,' + bk + ')'); gb.addColorStop(1, 'rgba(225,105,95,0)'); ctx.fillStyle = gb; ctx.fillRect(q[0] - 40, q[1] - 30, 80, 60);
      var n = P(s * .021, 1.583), gn = ctx.createRadialGradient(n[0], n[1], 1, n[0], n[1], .014 * n[2]);
      gn.addColorStop(0, 'rgba(100,60,45,.16)'); gn.addColorStop(1, 'rgba(100,60,45,0)'); ctx.fillStyle = gn; ctx.fillRect(n[0] - 30, n[1] - 30, 60, 60);
    });
    /* gözler */
    [-1, 1].forEach(function (s) {
      var cx = s * .038, open = (1 - bl) * (ex === 'surprised' ? 1.25 : ex === 'angry' ? .8 : 1), p = P(cx, ey), rx = .0145 * p[2], ry = .0090 * p[3] * open;
      if (ry < .8) ry = .8;
      ctx.save(); ctx.beginPath(); ctx.ellipse(p[0], p[1], rx, ry, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = bl > .5 ? skin : '#f3efe9'; ctx.fillRect(p[0] - rx, p[1] - ry, rx * 2, ry * 2);
      if (bl <= .5) {
        var gx = clamp(st.gx, -1, 1) * .0035 * p[2], gy = clamp(st.gy, -1, 1) * .0025 * p[3], ir = .0082 * p[2];
        ctx.beginPath(); ctx.arc(p[0] + gx, p[1] + gy, ir, 0, Math.PI * 2); ctx.fillStyle = iris; ctx.fill();
        ctx.beginPath(); ctx.arc(p[0] + gx, p[1] + gy, ir * .45, 0, Math.PI * 2); ctx.fillStyle = '#0c0a09'; ctx.fill();
        ctx.beginPath(); ctx.arc(p[0] + gx - ir * .35, p[1] + gy - ir * .4, ir * .22, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
        var sh = ctx.createLinearGradient(0, p[1] - ry, 0, p[1]); sh.addColorStop(0, 'rgba(60,35,25,.35)'); sh.addColorStop(1, 'rgba(60,35,25,0)'); ctx.fillStyle = sh; ctx.fillRect(p[0] - rx, p[1] - ry, rx * 2, ry);
      }
      ctx.restore();
      ctx.lineWidth = Math.max(1.2, .0016 * p[3]); ctx.strokeStyle = '#2a1a14'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(p[0], p[1], rx, ry, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();       /* üst kapak çizgisi */
      if (fem) { ctx.beginPath(); ctx.moveTo(p[0] + s * rx, p[1] - ry * .2); ctx.lineTo(p[0] + s * (rx + .004 * p[2]), p[1] - ry * .7); ctx.lineWidth = 1.6; ctx.stroke(); }
      ctx.strokeStyle = 'rgba(110,60,45,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(p[0], p[1] + ry * .25, rx * .95, ry * 1.05, 0, .15, Math.PI - .15); ctx.stroke(); /* alt kapak */
      /* kaş */
      var inY = 1.652, outY = 1.657, lift = 0;
      if (ex === 'angry') { inY -= .008; outY += .002; } else if (ex === 'sad') { inY += .009; outY -= .002; } else if (ex === 'surprised') { lift = .009; } else if (ex === 'smile') { lift = .002; }
      var b0 = P(s * .015, inY + lift), b1 = P(s * .037, outY + .006 + lift), b2 = P(s * .060, outY - .004 + lift);
      ctx.strokeStyle = brow; ctx.lineCap = 'round'; ctx.lineWidth = (fem ? .0042 : .0062) * b1[3];
      ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.quadraticCurveTo(b1[0], b1[1], b2[0], b2[1]); ctx.stroke();
    });
    /* burun */
    ctx.fillStyle = 'rgba(90,50,40,.55)'; [-1, 1].forEach(function (s) { E(s * .0085, 1.5715, .0045, .0028, 'rgba(80,40,32,.6)'); });
    var nb = P(0, 1.60), gb2 = ctx.createLinearGradient(nb[0] - 6, 0, nb[0] + 6, 0); gb2.addColorStop(0, 'rgba(255,255,255,0)'); gb2.addColorStop(.5, 'rgba(255,240,225,.10)'); gb2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gb2; ctx.fillRect(nb[0] - 8, nb[1] - .018 * nb[3], 16, .036 * nb[3]);
    /* bıyık */
    if (L.stache) {
      var s0 = P(0, mx + .020), sl = P(-.032, mx + .012), sr = P(.032, mx + .012);
      ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(sl[0], sl[1] + 2); ctx.quadraticCurveTo(s0[0] - 10, s0[1] - 7, s0[0], s0[1] - 1); ctx.quadraticCurveTo(s0[0] + 10, s0[1] - 7, sr[0], sr[1] + 2);
      ctx.quadraticCurveTo(s0[0] + 6, s0[1] + 3, s0[0], s0[1] + 1.5); ctx.quadraticCurveTo(s0[0] - 6, s0[1] + 3, sl[0], sl[1] + 2); ctx.fill();
    }
    /* ağız */
    var lip = fem ? '#b5524c' : '#a65f52', lipD = fem ? '#8f3a37' : '#7e463d';
    var wm = (ex === 'smile' ? .056 : ex === 'surprised' ? .030 : .046), op = st.mouth * .022 + (ex === 'surprised' ? .016 : 0), cy = (ex === 'smile' ? .0045 : ex === 'sad' ? -.0045 : ex === 'angry' ? -.002 : 0.0006);
    var c0 = P(-wm / 2, mx + cy), c1 = P(wm / 2, mx + cy), mid = P(0, mx), up = P(0, mx + .0058 + op * .15), dn = P(0, mx - .0075 - op);
    if (op > .0025) {                                                  /* açık ağız */
      ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.quadraticCurveTo(up[0], up[1] - 3, c1[0], c1[1]); ctx.quadraticCurveTo(dn[0], dn[1] + 4, c0[0], c0[1]);
      ctx.fillStyle = '#35100e'; ctx.fill(); ctx.save(); ctx.clip();
      ctx.fillStyle = '#f2eee8'; ctx.fillRect(c0[0], up[1] - 4, c1[0] - c0[0], Math.max(3, (mid[1] - up[1]) * .8));
      ctx.fillStyle = '#c96a6a'; ctx.beginPath(); ctx.ellipse(mid[0], dn[1] - 1, (c1[0] - c0[0]) * .28, Math.max(2, (dn[1] - mid[1]) * .5), 0, 0, 6.3); ctx.fill(); ctx.restore();
      ctx.lineWidth = 2; ctx.strokeStyle = lipD; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.quadraticCurveTo(up[0], up[1] - 3, c1[0], c1[1]); ctx.quadraticCurveTo(dn[0], dn[1] + 4, c0[0], c0[1]); ctx.stroke();
    } else {                                                           /* kapalı ağız: dudak bantları */
      var lw = fem ? .0058 : .0045;
      ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.quadraticCurveTo(mid[0] - 8, mid[1] - lw * mid[3] * 1.3, mid[0], mid[1] - lw * mid[3] * .8); ctx.quadraticCurveTo(mid[0] + 8, mid[1] - lw * mid[3] * 1.3, c1[0], c1[1]);
      ctx.quadraticCurveTo(mid[0], mid[1] + lw * mid[3] * 1.4, c0[0], c0[1]); ctx.fillStyle = lip; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = lipD; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.quadraticCurveTo(mid[0], mid[1] + (ex === 'smile' ? 2.5 : 0.5), c1[0], c1[1]); ctx.stroke();
    }
    if (ex === 'smile') { [-1, 1].forEach(function (s) { var d = P(s * (wm / 2 + .004), mx + .003); ctx.strokeStyle = 'rgba(110,60,45,.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(d[0], d[1], 4.5, s > 0 ? -1.1 : Math.PI - 2.0, s > 0 ? 1.1 : Math.PI + 1.1); ctx.stroke(); }); }
    if (L.age > 55) { [-1, 1].forEach(function (s) { var a = P(s * .033, 1.577), b = P(s * .045, 1.545); ctx.strokeStyle = 'rgba(100,60,50,.28)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2 + s * 3, (a[1] + b[1]) / 2, b[0], b[1]); ctx.stroke(); }); }
  }

  /* ===================== saç / başörtüsü ===================== */
  function ellipsoid(rx, ry, rz, ph0, phL, th0, thL, mat, y0) {
    var g = new THREE.SphereGeometry(1, 28, 18, ph0, phL, th0, thL), p = g.attributes.position;
    for (var i = 0; i < p.count; i++) { p.setXYZ(i, p.getX(i) * rx, p.getY(i) * ry + (y0 || 0), p.getZ(i) * rz); }
    g.computeVertexNormals(); return new THREE.Mesh(g, mat);
  }
  function addHair(head, L, mats) {
    var st = L.hairStyle || 'short', cy = HC[1] - 1.53, m = mats.hair, grp = new THREE.Group(); head.add(grp);
    if (st === 'bald') return grp;
    if (st === 'scarf') {
      var sm = mats.scarf;
      var cap = ellipsoid(HR[0] * 1.12, HR[1] * 1.10, HR[2] * 1.14, 0, Math.PI * 2, 0, 1.28, sm, cy + .004); cap.position.z = -.004; grp.add(cap);
      var back = ellipsoid(HR[0] * 1.14, HR[1] * 1.12, HR[2] * 1.16, Math.PI / 2 + .98, Math.PI * 2 - 1.96, 0, 2.55, sm, cy - .01); back.position.z = -.012; grp.add(back);
      var drape = new THREE.Mesh(new THREE.CylinderGeometry(.115, .20, .22, 18, 1, true, Math.PI * .30, Math.PI * 1.40), sm); drape.position.set(0, -.07, -.045); drape.material.side = THREE.DoubleSide; grp.add(drape);
      return grp;
    }
    var top = ellipsoid(HR[0] * 1.045, HR[1] * 1.04, HR[2] * 1.06, 0, Math.PI * 2, 0, st === 'short' ? 1.12 : 1.08, m, cy + .002); top.position.z = -.002; grp.add(top);
    var side = ellipsoid(HR[0] * 1.05, HR[1] * 1.045, HR[2] * 1.07, Math.PI / 2 + 1.15, Math.PI * 2 - 2.3, 0, st === 'short' ? 1.95 : 2.35, m, cy - .004); side.position.z = -.004; grp.add(side);
    if (st === 'ponytail') {
      var tail = new THREE.Group(); tail.position.set(0, .12, -.098); grp.add(tail);
      var knot = ellipsoid(.024, .024, .024, 0, 6.3, 0, 3.15, m, 0); tail.add(knot);
      var pts = []; for (var i = 0; i < 6; i++) pts.push(new THREE.Vector3(0, -i * .045, -.015 * i - .02));
      var tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, .022, 8, false), m); tail.add(tube);
      var tip = ellipsoid(.018, .03, .018, 0, 6.3, 0, 3.15, m, 0); tip.position.set(0, -.255, -.095); tail.add(tip);
      L._tail = tail;
    } else if (st === 'bun') { var bun = ellipsoid(.05, .05, .05, 0, 6.3, 0, 3.15, m, 0); bun.position.set(0, .165, -.075); grp.add(bun); }
    else if (st === 'long') {
      var lg = new THREE.Mesh(new THREE.CylinderGeometry(.085, .075, .30, 16, 1, true, Math.PI * .55, Math.PI * 1.9), m); lg.position.set(0, -.08, -.045); lg.material.side = THREE.DoubleSide; grp.add(lg);
    }
    return grp;
  }

  /* ===================== karakter üretimi ===================== */
  R.make = function (L) {
    L = Object.assign({ skin: 0xe0ac84, shirt: 0xffffff, pants: 0x2f7d6a, hair: 0x3b2a1f }, L || {});
    var g = new THREE.Group(), bones = [], i;
    for (i = 0; i < NAMES.length; i++) { var b = new THREE.Bone(); b.name = NAMES[i]; bones.push(b); }
    for (i = 0; i < bones.length; i++) {
      var p = PARENT[i];
      if (p < 0) bones[i].position.set(WP[i][0], WP[i][1], WP[i][2]);
      else { bones[i].position.set(WP[i][0] - WP[p][0], WP[i][1] - WP[p][1], WP[i][2] - WP[p][2]); bones[p].add(bones[i]); }
    }
    var mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78, metalness: 0, skinning: true, envMapIntensity: ABG.envI || .25 });
    var M = bodyMesh(L), mesh = skinnedFrom(M, mat);
    mesh.add(bones[0]); g.add(mesh); g.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(bones));
    mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true;
    /* kafa: elipsoit + yüz paneli (kemiğe sabit) */
    var head = bones[B.head], skinC = col(L.skin);
    var hm = new THREE.MeshStandardMaterial({ color: skinC, roughness: .72, metalness: 0, envMapIntensity: ABG.envI || .25 });
    var hg = new THREE.SphereGeometry(1, 30, 22), hp = hg.attributes.position, v = new THREE.Vector3();
    for (i = 0; i < hp.count; i++) { v.set(hp.getX(i) * HR[0], hp.getY(i) * HR[1], hp.getZ(i) * HR[2]); headDeform(v); hp.setXYZ(i, v.x, v.y + (HC[1] - 1.53), v.z + HC[2]); }
    hg.computeVertexNormals(); var hmesh = new THREE.Mesh(hg, hm); hmesh.castShadow = true; head.add(hmesh);
    var fg = new THREE.SphereGeometry(1, 26, 18, Math.PI / 2 - FP.phi, 2 * FP.phi, FP.t0, FP.t1 - FP.t0), fp = fg.attributes.position;
    for (i = 0; i < fp.count; i++) { v.set(fp.getX(i) * HR[0], fp.getY(i) * HR[1], fp.getZ(i) * HR[2]); headDeform(v); v.x *= 1.006; v.y = (v.y - 0) * 1.0; v.z *= 1.008; fp.setXYZ(i, v.x, v.y + (HC[1] - 1.53), v.z + HC[2] + .0008); }
    fg.computeVertexNormals();
    var cv = document.createElement('canvas'); cv.width = cv.height = 256; var ctx = cv.getContext('2d');
    var tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    var fm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: .72, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, envMapIntensity: ABG.envI || .25 });
    var fmesh = new THREE.Mesh(fg, fm); head.add(fmesh);
    /* burun + kulaklar */
    var nose = ellipsoid(.011, .016, .016, 0, 6.3, 0, 3.15, hm, 0); nose.position.set(0, 1.583 - 1.53, .106); nose.rotation.x = .35; head.add(nose);
    [-1, 1].forEach(function (s) { var ear = ellipsoid(.008, .026, .018, 0, 6.3, 0, 3.15, hm, 0); ear.position.set(s * .098, 1.62 - 1.53, 0); ear.rotation.z = s * .15; head.add(ear); });
    if (L.skirt) {
      var sk = new THREE.Mesh(new THREE.CylinderGeometry(.17, .30, .60, 22, 1, true), new THREE.MeshStandardMaterial({ color: col(L.skirt), roughness: .85, metalness: 0, side: THREE.DoubleSide }));
      sk.position.y = -.31; sk.castShadow = true; bones[B.pelvis].add(sk);
    }
    var mats = { hair: new THREE.MeshStandardMaterial({ color: col(L.hair), roughness: .55, metalness: 0, envMapIntensity: ABG.envI || .25 }), scarf: new THREE.MeshStandardMaterial({ color: col(L.scarf || 0x7e57c2), roughness: .8, metalness: 0 }) };
    var hairGrp = addHair(head, L, mats);
    /* yan donanım: rozet, cep vb. omurgaya */
    if (L.badge) { var bd = new THREE.Mesh(new THREE.BoxGeometry(.05, .035, .006), new THREE.MeshStandardMaterial({ color: col(0x3a6fd8), roughness: .5 })); bd.position.set(.075, 1.22 - 1.25, .108); bones[B.spine2].add(bd); }
    /* userData: eski makePerson sözleşmesi + rig */
    var rig = {
      b: bones, L: L, mesh: mesh, ph: 0, w: 0, seed: Math.random() * 9, sit: false, lookY: 0, lookX: 0, mop: 0,
      face: { expr: 'neutral', exprT: 0, blink: 0, blinkT: 1.5 + Math.random() * 3, mouth: 0, talk: 0, gx: 0, gy: 0, key: '', ctx: ctx, tex: tex, ph: Math.random() * 6 },
      tail: L._tail || null, hair: hairGrp
    };
    var dummy = new THREE.Group(), sh = new THREE.Mesh(new THREE.CircleGeometry(.42, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = .012; sh.userData.noHit = true; g.add(sh);
    g.userData = {
      rig: rig, legs: dummy, up: bones[B.pelvis], sl: dummy, sh: sh, seed: rig.seed, ph: 0, mv: -9,
      L: bones[B.hipL], R: bones[B.hipR], kL: bones[B.knL], kR: bones[B.knR],
      arms: [{ a: bones[B.shL], e: bones[B.elL], s: 1 }, { a: bones[B.shR], e: bones[B.elR], s: -1 }]
    };
    if (L.scale) g.scale.setScalar(L.scale);
    paintFace(ctx, 256, 256, { expr: 'neutral', blink: 0, mouth: 0, gx: 0, gy: 0 }, L); tex.needsUpdate = true;
    R.list.push(g);
    restPose(rig);
    return g;
  };

  /* ===================== hareket ===================== */
  function restPose(r) {
    var b = r.b; for (var i = 0; i < b.length; i++) b[i].rotation.set(0, 0, 0);
    b[B.pelvis].position.y = WP[0][1];
    b[B.shL].rotation.z = .05; b[B.shR].rotation.z = -.05; b[B.elL].rotation.x = -.12; b[B.elR].rotation.x = -.12;
  }
  function ease(cur, tgt, k) { return cur + (tgt - cur) * k; }
  var PI = Math.PI;

  R.walk = function (g, sp, dt, S) {
    var u = g.userData, r = u.rig; if (!r) return false;
    if (r.sit) return true;
    var b = r.b, run = clamp((sp - 2.2) / 2.2, 0, 1);
    var f = clamp(.42 * sp + .32, .6, 2.5), k = Math.min(1, dt * 16);
    r.ph += PI * 2 * f * dt; r.w = Math.min(1, r.w + dt * 5); u.mv = S ? S.t : 0;
    var A = clamp(.26 + .075 * sp, .3, .78), φ = r.ph, ph2 = φ + PI;
    function leg(hip, kn, an, p) {
      var th = A * Math.sin(p);                                        /* uyluk öne (+) */
      var swing = Math.max(0, Math.cos(p + .3));
      var kf = .07 + (.55 + .55 * run) * Math.pow(swing, 1.4) + .14 * Math.max(0, -Math.sin(p - .6)) * (1 - swing);
      var ank = -.20 * Math.max(0, Math.sin(p + .15)) * (1 - swing * .6) + (.34 + .15 * run) * Math.max(0, Math.sin(-p + .45)) * (1 - swing);
      hip.rotation.x = ease(hip.rotation.x, -th, k); kn.rotation.x = ease(kn.rotation.x, kf, k); an.rotation.x = ease(an.rotation.x, ank, k);
      hip.rotation.z = ease(hip.rotation.z, 0, k);
    }
    leg(b[B.hipL], b[B.knL], b[B.anL], φ); leg(b[B.hipR], b[B.knR], b[B.anR], ph2);
    var pel = b[B.pelvis];
    pel.position.y = ease(pel.position.y, WP[0][1] - .008 + (.018 + .02 * run) * Math.cos(2 * φ) - .01 * run, k);
    pel.position.x = ease(pel.position.x, .02 * (1 - run * .5) * -Math.cos(φ), k);
    pel.rotation.y = ease(pel.rotation.y, -(.08 + .04 * run) * Math.sin(φ), k);
    pel.rotation.z = ease(pel.rotation.z, .035 * Math.cos(φ) * (1 - run * .5), k);
    pel.rotation.x = ease(pel.rotation.x, .02 + .05 * run, k);
    b[B.spine1].rotation.y = ease(b[B.spine1].rotation.y, (.06 + .03 * run) * Math.sin(φ), k);
    b[B.spine2].rotation.y = ease(b[B.spine2].rotation.y, (.07 + .04 * run) * Math.sin(φ), k);
    b[B.spine1].rotation.x = ease(b[B.spine1].rotation.x, .03 + .10 * run, k);
    b[B.spine2].rotation.z = ease(b[B.spine2].rotation.z, -.03 * Math.cos(φ), k);
    /* kollar: bacakla zıt; dirsek yürürken hafif, koşarken ~90° */
    var AS = clamp(.28 + .08 * sp, .3, .95), sl = AS * Math.sin(φ), sr = -sl;
    b[B.shL].rotation.x = ease(b[B.shL].rotation.x, sl, k); b[B.shR].rotation.x = ease(b[B.shR].rotation.x, sr, k);
    b[B.shL].rotation.z = ease(b[B.shL].rotation.z, .06, k); b[B.shR].rotation.z = ease(b[B.shR].rotation.z, -.06, k);
    var eb = .18 + .22 * run; b[B.elL].rotation.x = ease(b[B.elL].rotation.x, -(eb + Math.max(0, -sl) * (.6 + .5 * run) + run * .55), k);
    b[B.elR].rotation.x = ease(b[B.elR].rotation.x, -(eb + Math.max(0, -sr) * (.6 + .5 * run) + run * .55), k);
    /* kafa: yürüyüşü dengele */
    b[B.head].rotation.y = ease(b[B.head].rotation.y, -.5 * (pel.rotation.y + b[B.spine2].rotation.y), k);
    b[B.neck].rotation.x = ease(b[B.neck].rotation.x, -.03 - .06 * run, k);
    if (r.tail) r.tail.rotation.x = .12 * Math.sin(φ * 2) - .05 * run;
    return true;
  };

  R.sit = function (g, sit) {
    var r = g.userData.rig; if (!r) return false; var b = r.b; r.sit = !!sit;
    if (sit) {
      restPose(r); b[B.pelvis].position.y = .52; b[B.hipL].rotation.x = b[B.hipR].rotation.x = -1.50; b[B.knL].rotation.x = b[B.knR].rotation.x = 1.52;
      b[B.hipL].rotation.z = .05; b[B.hipR].rotation.z = -.05; b[B.spine1].rotation.x = -.06; b[B.shL].rotation.x = b[B.shR].rotation.x = -.45;
      b[B.elL].rotation.x = b[B.elR].rotation.x = -1.05; b[B.anL].rotation.x = b[B.anR].rotation.x = .0;
    } else { restPose(r); }
    return true;
  };

  var _tv = new THREE.Vector3();
  R.relax = function (g, dt, look, S, cam, scene) {
    var u = g.userData, r = u.rig; if (!r) return false;
    var b = r.b, t = S ? S.t : 0, e = Math.min(1, dt * 9);
    u.sh.visible = g.parent === scene && Math.abs(g.rotation.x) < .1;
    var breath = Math.sin(t * 1.7 + r.seed), still = !S || (t - u.mv > .12);
    if (!still) return true;
    r.w = Math.max(0, r.w - dt * 4);
    if (!r.sit) {
      var sway = Math.sin(t * .45 + r.seed) * .5 + Math.sin(t * .23 + r.seed * 2) * .5;
      var rest = [[B.hipL, 'x', 0], [B.hipR, 'x', 0], [B.knL, 'x', .03], [B.knR, 'x', .03], [B.anL, 'x', 0], [B.anR, 'x', 0], [B.spine1, 'x', .0], [B.spine1, 'y', 0], [B.spine2, 'y', 0], [B.spine2, 'z', 0]];
      rest.forEach(function (q) { b[q[0]].rotation[q[1]] = ease(b[q[0]].rotation[q[1]], q[2], e); });
      var pel = b[B.pelvis];
      pel.position.y = ease(pel.position.y, WP[0][1] - .004 * Math.abs(sway) + breath * .0015, e); pel.position.x = ease(pel.position.x, sway * .012, e);
      pel.rotation.z = ease(pel.rotation.z, sway * .025, e); pel.rotation.y = ease(pel.rotation.y, sway * .02, e); pel.rotation.x = ease(pel.rotation.x, 0, e);
      b[B.hipL].rotation.z = ease(b[B.hipL].rotation.z, .02 + sway * .02, e); b[B.hipR].rotation.z = ease(b[B.hipR].rotation.z, -.02 + sway * .02, e);
      b[B.shL].rotation.x = ease(b[B.shL].rotation.x, .02 + Math.sin(t * .8 + r.seed) * .015, e); b[B.shR].rotation.x = ease(b[B.shR].rotation.x, -.02 + Math.sin(t * .8 + r.seed + 1) * .015, e);
      b[B.shL].rotation.z = ease(b[B.shL].rotation.z, .05 + breath * .006, e); b[B.shR].rotation.z = ease(b[B.shR].rotation.z, -.05 - breath * .006, e);
      b[B.elL].rotation.x = ease(b[B.elL].rotation.x, -.14, e); b[B.elR].rotation.x = ease(b[B.elR].rotation.x, -.14, e);
    }
    b[B.spine2].scale.set(1 + breath * .006, 1 + breath * .008, 1 + breath * .012);
    /* bakış: oyuncuya dön */
    var ty = 0, tx = 0, gx = 0, gy = 0;
    if (look && cam) {
      var dx = cam.position.x - g.position.x, dz = cam.position.z - g.position.z, d = Math.hypot(dx, dz);
      if (d < 7) { var a = Math.atan2(dx, dz) - g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) < 2.2) { ty = clamp(a, -.95, .95); tx = clamp((cam.position.y - 1.5 - 0.1) / Math.max(d, 1) * -.4, -.2, .2); gx = clamp(a * 1.4, -1, 1); gy = 0; } }
    }
    r.lookY = ease(r.lookY, ty, Math.min(1, dt * 3.5)); r.lookX = ease(r.lookX, tx, Math.min(1, dt * 3.5));
    b[B.spine2].rotation.y = ease(b[B.spine2].rotation.y, r.lookY * .22, e); b[B.neck].rotation.y = ease(b[B.neck].rotation.y, r.lookY * .35, e); b[B.head].rotation.y = ease(b[B.head].rotation.y, r.lookY * .45, e);
    b[B.head].rotation.x = ease(b[B.head].rotation.x, r.lookX + Math.sin(t * .7 + r.seed) * .01, e); b[B.neck].rotation.x = ease(b[B.neck].rotation.x, 0, e);
    r.face.gx = ease(r.face.gx, gx, Math.min(1, dt * 8)); r.face.gy = ease(r.face.gy, gy, Math.min(1, dt * 8));
    return true;
  };

  /* ===================== yüz güncellemesi ===================== */
  R.express = function (g, name, dur) { var r = g && g.userData && g.userData.rig; if (!r) return; r.face.expr = name; r.face.exprT = dur || 2; };
  R.talk = function (g, dur) { var r = g && g.userData && g.userData.rig; if (!r) return; r.face.talk = Math.max(r.face.talk, dur || 2); };
  R.update = function (dt, S, cam) {
    for (var i = R.list.length - 1; i >= 0; i--) {
      var g = R.list[i]; if (!g.parent && !g.userData.keepFace) continue;
      var r = g.userData.rig, f = r.face;
      if (cam && g.visible) { var dx = cam.position.x - g.position.x, dz = cam.position.z - g.position.z; if (dx * dx + dz * dz > 400) continue; }
      if (g.visible === false) continue;
      f.blinkT -= dt; if (f.blinkT <= 0) { f.blink = 1; f.blinkT = 2.2 + Math.random() * 3.6; f.blinkEnd = .13; }
      if (f.blink && (f.blinkEnd -= dt) <= 0) f.blink = 0;
      if (f.exprT > 0) { f.exprT -= dt; if (f.exprT <= 0) f.expr = 'neutral'; }
      var m = 0; if (f.talk > 0) { f.talk -= dt; f.ph += dt * 11; m = .25 + .75 * Math.abs(Math.sin(f.ph)) * (.6 + .4 * Math.sin(f.ph * .37)); }
      f.mouth = m;
      var key = f.expr + '|' + f.blink + '|' + Math.round(m * 3) + '|' + Math.round(f.gx * 2) + '|' + Math.round(f.gy * 2);
      if (key !== f.key) { f.key = key; paintFace(f.ctx, 256, 256, { expr: f.expr, blink: f.blink, mouth: Math.round(m * 3) / 3, gx: Math.round(f.gx * 2) / 2, gy: Math.round(f.gy * 2) / 2 }, r.L); f.tex.needsUpdate = true; }
    }
  };

  /* ===================== birinci şahıs kollar ve eller ===================== */
  /* parent: kamera altındaki kol grubu (öne doğru -Z). Eski kutu/küre kol parçalarını gizler, yerine kemikli kol+el koyar. */
  R.makeArm = function (par, skinHex, sleeveHex, sx) {
    {                                     /* 0: sağ kol (+x'te görünür), 1: sol */
      var sleeve = col(sleeveHex), skin = col(skinHex), skinD = col(shade(skinHex, .9));
      var M = new Mesh(), bones = [], nm = ['fore', 'wrist', 'f1', 'f2', 'f3', 't1', 't2'], i;
      var pos = [[0, 0, .30], [0, 0, -.06], [0, 0, -.2], [0, 0, -.245], [0, 0, -.285], [-.036 * sx, -.004, -.14], [-.046 * sx, -.006, -.18]];
      var par_ = [-1, 0, 1, 2, 3, 1, 5];
      for (i = 0; i < 7; i++) { var bn = new THREE.Bone(); bn.name = nm[i]; bones.push(bn); }
      for (i = 0; i < 7; i++) { var q = par_[i]; if (q < 0) bones[i].position.set(pos[i][0], pos[i][1], pos[i][2]); else { bones[i].position.set(pos[i][0] - pos[q][0], pos[i][1] - pos[q][1], pos[i][2] - pos[q][2]); bones[q].add(bones[i]); } }
      var wfore = function (z) { return z > -.03 ? [[0, 1]] : z > -.09 ? [[0, 1 - sstep(-.03, -.09, z)], [1, sstep(-.03, -.09, z)]] : [[1, 1]]; };
      /* z boyunca halkalar (XY düzleminde): [z, cx, cy, rx, ry, renk, w] */
      var F = [[.30, 0, 0, .056, .054, sleeve], [.20, 0, 0, .050, .048, sleeve], [.10, 0, 0, .046, .045, sleeve], [-.02, 0, 0, .042, .042, sleeve], [-.02, 0, 0, .031, .030, skin], [-.07, 0, 0, .027, .025, skin]];
      var prev = -1, first = -1;
      F.forEach(function (s) { var r = M.ring([s[1], s[2], s[0]], UX, UY, s[3], s[4], s[5], wfore(s[0])); if (prev >= 0) M.join(prev, r, true); else first = r; prev = r; });
      M.cap(first, false);
      var hw = [[1, 1]];
      var H = [[-.07, 0, 0, .031, .017, skin, hw], [-.12, 0, 0, .040, .020, skin, hw], [-.17, 0, 0, .041, .019, skin, hw], [-.20, 0, 0, .040, .017, skinD, hw]];
      prev = -1; H.forEach(function (s) { var r = M.ring([s[1], s[2], s[0]], UX, UY, s[3], s[4], s[5], s[6]); if (prev >= 0) M.join(prev, r, true); prev = r; });
      /* parmaklar: 4 adet, f1-f3 kemiklerine yumuşak bağlı */
      var fx = [-.027, -.009, .009, .027];
      fx.forEach(function (x, k) {
        var ln = k === 0 || k === 3 ? .8 : 1, rr = .0095;
        var seg = [[-.195, x, -.002, rr * 1.1, rr * 1.0, skin, [[1, .5], [2, .5]]], [-.225, x, -.003, rr, rr * .95, skin, [[2, 1]]], [-.245, x, -.004, rr * .95, rr * .92, skin, [[2, .5], [3, .5]]], [-.265, x, -.005, rr * .9, rr * .88, skin, [[3, 1]]], [-.285, x, -.005, rr * .88, rr * .85, skin, [[3, .5], [4, .5]]], [-.292 - .01 * ln, x, -.005, rr * .5, rr * .5, skin, [[4, 1]]]];
        var pv = -1, fr = -1; seg.forEach(function (s) { var r = M.ring([s[1], s[2], s[0]], UX, UY, s[3], s[4], s[5], s[6]); if (pv >= 0) M.join(pv, r, true); else fr = r; pv = r; }); M.cap(pv, true);
      });
      /* başparmak */
      var T = [[-.12, -.036 * sx, -.004, .012, .011, skin, [[1, 1]]], [-.145, -.043 * sx, -.007, .011, .010, skin, [[5, 1]]], [-.175, -.046 * sx, -.010, .010, .009, skin, [[5, .5], [6, .5]]], [-.20, -.046 * sx, -.012, .009, .0085, skin, [[6, 1]]], [-.215, -.046 * sx, -.012, .005, .005, skin, [[6, 1]]]];
      var pv2 = -1; T.forEach(function (s) { var r = M.ring([s[1], s[2], s[0]], UX, UY, s[3], s[4], s[5], s[6]); if (pv2 >= 0) M.join(pv2, r, true); pv2 = r; }); M.cap(pv2, true);
      var mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75, metalness: 0, skinning: true, envMapIntensity: ABG.envI || .25 });
      var mesh = skinnedFrom(M, mat); mesh.add(bones[0]); par.add(mesh); par.updateMatrixWorld(true); mesh.updateMatrixWorld(true); bones[0].updateMatrixWorld(true);
      mesh.bind(new THREE.Skeleton(bones)); mesh.frustumCulled = false; mesh.renderOrder = 3;
      /* eski kol parçalarını gizle (Mesh, grup dışı çocuklar) */
      par.children.forEach(function (c) { if (c !== mesh && c.isMesh) c.visible = false; });
      (R.arms = R.arms || []).push({ mesh: mesh, bones: bones, curl: .25, par: par, sx: sx });
    }
  };
  R.updateArms = function (dt, grip, t) {
    if (!R.arms) return;
    R.arms.forEach(function (a, i) {
      var tgt = grip ? 1 : .22; a.curl += (tgt - a.curl) * Math.min(1, dt * 9);
      var br = Math.sin(t * 1.6 + i * 1.3) * .03, c = a.curl, b = a.bones;
      b[2].rotation.x = -(.15 + c * .85) - br; b[3].rotation.x = -(.2 + c * 1.0) - br; b[4].rotation.x = -(.15 + c * .7);
      b[5].rotation.y = a.sx * (.1 + c * .45); b[6].rotation.x = -(.1 + c * .4);
    });
  };
})();
