/* Acilde Bir Gün — gerçekçi görünüm katmanı (PBR)
 * three.min.js'ten HEMEN SONRA, oyun betiğinden ÖNCE yüklenir.
 *
 * Oyun kodunu yeniden yazmadan şunları yapar:
 *  1) Lambert/Phong malzemeleri MeshStandardMaterial (PBR) olur
 *  2) Renk iş akışı doğrusal olur: malzeme renkleri sRGB->doğrusal, CanvasTexture'lar sRGB,
 *     renderer.outputEncoding = sRGBEncoding
 *  3) ACESFilmic ton eşleme (Basic malzemeler, tabela/ekran/ışık panelleri hariç tutulur)
 *  4) Küçük bir prosedürel "oda" ortam haritası (PMREM)
 *  5) Kolayca kapatma: adres sonuna ?pbr=0 ekle. Mobilde varsayılan KAPALI (?pbr=1 ile açılır).
 *
 * Mini oyunlar (ameliyat vb.) kendi renderer'larında zaten sRGB/ACES kullanıyor; onların
 * init fonksiyonları ABG.legacy sayacıyla sarıldığı için eski görünümleri aynen korunur.
 */
(function () {
  'use strict';
  var THREE = window.THREE;
  var ABG = window.ABG = window.ABG || {};
  ABG.legacy = 0;
  ABG.pbr = false;
  if (!THREE) return;

  var Q = new URLSearchParams(location.search);
  var coarse = !!((window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window));
  var pm = Q.get('pbr');
  /* Kipler: 'lite' (masaüstü varsayılanı) = parlak/metal malzemeler + zemin + GLB eşyalar PBR, düz boyalı
 * yüzeyler eski hafif Lambert (köşe ışıklandırma) kalır -> çok daha hızlı. 'full' = hepsi PBR (ağır).
 * ?pbr=0 kapalı | ?pbr=lite | ?pbr=full (ya da 1). Mobilde varsayılan kapalı. */
  var MODE = pm === '0' ? 'off' : (pm === 'full' || pm === '1') ? 'full' : pm === 'lite' ? 'lite' : (coarse ? 'off' : 'lite');
  var ON = MODE !== 'off';
  ABG.pbr = ON; ABG.mode = MODE;
  ABG.exposure = parseFloat(Q.get("exp")) || 0.5;
  ABG.envI = Q.get('env') !== null ? parseFloat(Q.get('env')) : 0.25;

  /* ---- bayrak: oyun içindeki eski .isMeshLambertMaterial / .isMeshPhongMaterial kontrolleri ---- */
  THREE.MeshLambertMaterial.prototype.abgLam = true;
  THREE.MeshPhongMaterial.prototype.abgPhg = true;
  if (!ON) return;

  function legacy() { return ABG.legacy > 0 || !!(ABG.isMini && ABG.isMini()); }
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ================= 1) Doğrusal renk: sRGB ile yazılmış hex'ler ================= */
  var CP = THREE.Color.prototype;
  var LinColor = (function () {
    class LinColor extends THREE.Color {
      clone() { return new LinColor().copy(this); }
      getHex() { var c = new THREE.Color().copy(this).convertLinearToSRGB(); return (Math.round(c.r * 255) << 16) ^ (Math.round(c.g * 255) << 8) ^ Math.round(c.b * 255); }
      getHexString() { return ('000000' + this.getHex().toString(16)).slice(-6); }
    }
    ['setHex', 'setRGB', 'setHSL', 'setStyle', 'setColorName'].forEach(function (n) {
      var orig = CP[n];
      LinColor.prototype[n] = function () {
        if (this._d) return orig.apply(this, arguments);          /* iç içe çağrıda tek dönüşüm */
        this._d = 1;
        try { orig.apply(this, arguments); } finally { this._d = 0; }
        return this.convertSRGBToLinear();
      };
    });
    return LinColor;
  })();

  function linearize(m, key) {
    var c = m[key];
    if (!c || !c.isColor || c instanceof LinColor) return;
    m[key] = new LinColor().copy(c);                                 /* varsayılan beyaz/siyah: dönüşüm gerekmez */
  }

  var BASICISH = { MeshBasicMaterial: 1, SpriteMaterial: 1, PointsMaterial: 1, LineBasicMaterial: 1, LineDashedMaterial: 1 };
  var matProto = THREE.Material.prototype, _sv = matProto.setValues;
  matProto.setValues = function (v) {
    if (!legacy()) {
      linearize(this, 'color'); linearize(this, 'emissive');
      if (BASICISH[this.type]) this.toneMapped = false;              /* tabela, ekran, ışık panelleri olduğu gibi kalsın */
    }
    return _sv.call(this, v);
  };

  /* CanvasTexture -> sRGB */
  var CT = THREE.CanvasTexture;
  THREE.CanvasTexture = function () {
    var t = Reflect.construct(CT, arguments);
    if (!legacy()) t.encoding = THREE.sRGBEncoding;
    return t;
  };
  THREE.CanvasTexture.prototype = CT.prototype;

  /* ================= 2) Lambert / Phong -> MeshStandardMaterial ================= */
  var OL = THREE.MeshLambertMaterial, OP = THREE.MeshPhongMaterial, OS = THREE.MeshStandardMaterial;
  function lum(c) { c = new THREE.Color(c); return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b; }
  function toStd(p, phong) {
    p = Object.assign({}, p || {});
    var sh = p.shininess, sp = p.specular;
    ['specular', 'shininess', 'reflectivity', 'combine', 'refractionRatio'].forEach(function (k) { delete p[k]; });
    var rough = 0.9, metal = 0;
    if (phong) {
      sh = sh === undefined ? 30 : sh;
      rough = clamp(Math.sqrt(2 / (sh + 2)) * 1.6, 0.22, 0.9);
      if (sp !== undefined) metal = clamp((lum(sp) - 0.25) * 1.2, 0, 0.6);
    }
    var o = Object.assign({ roughness: rough, metalness: metal, envMapIntensity: ABG.envI }, p);
    var m = new OS(o);
    if (phong) m.abgPhg = true; else m.abgLam = true;
    return m;
  }
  THREE.MeshLambertMaterial = function (p) { return (legacy() || MODE !== 'full') ? new OL(p) : toStd(p, false); };
  THREE.MeshLambertMaterial.prototype = OL.prototype;
  THREE.MeshPhongMaterial = function (p) { return legacy() ? new OP(p) : toStd(p, true); };
  THREE.MeshPhongMaterial.prototype = OP.prototype;

  /* ================= 3) Renderer: sRGB + ACES, ortam haritası ================= */
  var RC = THREE.WebGLRenderer, mainR = null, envTex = null;
  THREE.WebGLRenderer = function () {
    var r = Reflect.construct(RC, arguments);
    if (!mainR) {
      mainR = r; ABG.renderer = r;
      r.outputEncoding = THREE.sRGBEncoding;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = ABG.exposure;
      try { envTex = makeEnv(r); } catch (e) { if (window.console) console.warn('ortam haritası yapılamadı', e); }
    }
    return r;
  };
  THREE.WebGLRenderer.prototype = RC.prototype;

  var SC = THREE.Scene;
  THREE.Scene = function () {
    var s = Reflect.construct(SC, arguments);
    if (!ABG.scene && mainR) { ABG.scene = s; if (envTex) s.environment = envTex; }
    return s;
  };
  THREE.Scene.prototype = SC.prototype;

  /* Küçük prosedürel hastane odası: gri duvarlar, tavan armatürleri, hafif sıcak zemin yansıması */
  function makeEnv(r) {
    ABG.legacy++;
    var envScene = new SC();
    try {
      var room = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 12),
        new THREE.MeshBasicMaterial({ color: 0x9aa7a6, side: THREE.BackSide }));
      room.position.y = 2.5; envScene.add(room);
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ color: 0x6c6a64 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; envScene.add(floor);
      function panel(w, d, x, z, k) {
        var m = new THREE.MeshBasicMaterial({ color: 0xffffff }); m.color.setScalar(k);
        var p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
        p.rotation.x = Math.PI / 2; p.position.set(x, 4.95, z); envScene.add(p);
      }
      panel(5, 0.7, -2.5, -2, 14); panel(5, 0.7, 2.5, -2, 14); panel(5, 0.7, -2.5, 2.5, 14); panel(5, 0.7, 2.5, 2.5, 14);
      var win = new THREE.MeshBasicMaterial({ color: 0xdfeaff }); win.color.setScalar(7);
      var w = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.2), win); w.position.set(0, 2.6, -5.9); envScene.add(w);
      var pg = new THREE.PMREMGenerator(r);
      var rt = pg.fromScene(envScene, 0.04);
      pg.dispose();
      return rt.texture;
    } finally { ABG.legacy--; }
  }

  /* ================= 4) Zemine pişirilmiş AO (çarpışma kutularından) ================= */
  /* Oyun, build() bittikten sonra bunu çağırır. Zemin 34x22: tuval x -> dünya x, tuval y -> dünya z. */
  ABG.bakeFloorAO = function (scene, colliders) {
    var floor = null;
    scene.children.forEach(function (o) {
      if (floor || !o.isMesh || !o.geometry || o.geometry.type !== 'PlaneGeometry') return;
      var p = o.geometry.parameters;
      if (p.width === 34 && p.height === 22 && o.rotation.x < 0 && o.material && !Array.isArray(o.material) && o.material.isMeshStandardMaterial) floor = o;
    });
    if (!floor) return false;
    var W = 34, H = 22, K = 40, cw = W * K, ch = H * K;              /* 40 px / metre */
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch);
    function X(x) { return (x + W / 2) * K; }
    function Z(z) { return (z + H / 2) * K; }
    /* duvar diplerine gradyan */
    var edge = 0.9 * K, gr;
    [[0, 0, cw, edge, 0, 0, 0, edge], [0, ch - edge, cw, edge, 0, ch, 0, ch - edge],
     [0, 0, edge, ch, 0, 0, edge, 0], [cw - edge, 0, edge, ch, cw, 0, cw - edge, 0]].forEach(function (a) {
      gr = g.createLinearGradient(a[4], a[5], a[6], a[7]);
      gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(a[0], a[1], a[2], a[3]);
    });
    /* eşyaların altına yumuşak temas gölgesi */
    g.filter = 'blur(' + Math.round(0.16 * K) + 'px)';
    g.fillStyle = 'rgba(0,0,0,.55)';
    (colliders || []).forEach(function (b) {
      if (!b || b.x1 - b.x0 > 12 || b.z1 - b.z0 > 12) return;
      var pad = 0.04;
      g.fillRect(X(b.x0 - pad), Z(b.z0 - pad), (b.x1 - b.x0 + 2 * pad) * K, (b.z1 - b.z0 + 2 * pad) * K);
    });
    g.filter = 'none';
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.LinearEncoding; tex.anisotropy = 4;
    var geo = floor.geometry;
    if (!geo.attributes.uv2) geo.setAttribute('uv2', new THREE.BufferAttribute(geo.attributes.uv.array, 2));
    floor.material.aoMap = tex; floor.material.aoMapIntensity = 1.0; floor.material.needsUpdate = true;
    return true;
  };
})();
