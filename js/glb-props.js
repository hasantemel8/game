/* Acilde Bir Gün — GLB eşya yükleyici
 *
 * Oyundaki "yuvalara" (ABG.props) models/ klasöründeki .glb dosyalarını bağlar.
 * - Dosya yoksa / yüklenemezse hiçbir şey olmaz: oyun eski box/cyl görünümüyle çalışmaya devam eder.
 * - Yeni model eklemek: .glb'yi models/ içine at, aşağıdaki MODELS tablosuna bir satır ekle.
 *
 * Her model otomatik normalize edilir: yatay ortalanır, tabanı yere (y=0) oturur, istenirse
 * `len` (en uzun yatay kenar, metre) ya da `h` (yükseklik, metre) değerine ölçeklenir.
 *
 * Yön kuralı (modelin kendi eksenlerinde, Blender'da dışa aktarırken "+Y Up" seçili):
 *   yatak / sedye : baş ucu -Z, ayak ucu +Z      tekerlekli sandalye : hasta +Z'ye bakar
 *   monitör       : ekran +Z'ye bakar, ekran yüzeyi "screen" adlı bir mesh olmalı (canlı EKG buraya çizilir)
 *   tekerlek düğümleri "wheel" ile başlayan adlı ve dönme merkezi (pivot) tekerleğin ortasında olmalı
 *   Model ters duruyorsa `rotY: Math.PI` (ya da ±Math.PI/2) ile döndür.
 */
(function () {
  'use strict';
  var ABG = window.ABG;
  if (!ABG || !ABG.props || !window.THREE || !THREE.GLTFLoader) return;
  var Q = new URLSearchParams(location.search);
  if (Q.get('glb') === '0') return;                  /* ?glb=0 -> modelleri kapat (hata ayıklama) */

  var BASE = 'models/';
  /* anahtar : { file, len|h, rotY, x, y, z, tint:{malzemeAdı:renk} } */
  var MODELS = {
    bed:        { file: 'bed.glb',        len: 2.1 },
    bed_red:    { file: 'bed.glb',        len: 2.3, tint: { mattress: 0xe28e86 } },
    stretcher:  { file: 'stretcher.glb',  len: 1.95 },
    wheelchair: { file: 'wheelchair.glb', len: 1.0 },
    iv_stand:   { file: 'iv_stand.glb',   h: 1.98 },
    monitor:    { file: 'monitor.glb',    h: 1.95 },
    med_cabinet:{ file: 'med_cabinet.glb',len: 2.2 },
    doctor_chair:{file: 'doctor_chair.glb',len: 0.62 },
    ambulance:  { file: 'ambulance.glb',  len: 6.5 },   /* gövde z -2.5..4.0 ; ön +Z */
    defib:      { file: 'defib.glb',      h: 1.08 },
    /* elde tutulan eşyalar (namlu/uç -Z): hold = yere oturtma yok, merkezde tutulur */
    item_tabanca:     { file: 'item_tabanca.glb',     len: 0.26, hold: true },
    item_balyoz:      { file: 'item_balyoz.glb',      len: 0.5,  hold: true },
    item_dev_siringa: { file: 'item_dev_siringa.glb', len: 0.5,  hold: true },
    item_nester:      { file: 'item_nester.glb',      len: 0.2,  hold: true },
    item_testere:        { file: 'item_testere.glb',        len: 0.5,  hold: true },
    item_refleks_cekici: { file: 'item_refleks_cekici.glb', len: 0.26, hold: true },
    item_muz:            { file: 'item_muz.glb',            len: 0.24, hold: true },
    item_plastik_balik:  { file: 'item_plastik_balik.glb',  len: 0.32, hold: true },
    item_megafon:        { file: 'item_megafon.glb',        len: 0.3,  hold: true },
    item_lastik_ordek:   { file: 'item_lastik_ordek.glb',   len: 0.17, hold: true },
    item_keceli_kalem:   { file: 'item_keceli_kalem.glb',   len: 0.17, hold: true },
    item_sprey_boya:     { file: 'item_sprey_boya.glb',     len: 0.17, hold: true },
    item_pompali:        { file: 'item_pompali.glb',        len: 0.5,  hold: true },
    item_konfeti_bazuka: { file: 'item_konfeti_bazuka.glb', len: 0.5,  hold: true },
    /* dinlenme odası */
    rest_desk: { file: 'rest_desk.glb', len: 1.5 },
    rest_bed:  { file: 'bed.glb', len: 2.05, tint: { mattress: 0xa5d6a7 } },
    locker:    { file: 'locker.glb', h: 1.9 }
  };

  /* hazır insan modelleri (CC-BY): erkek yetişkin hastalara varyasyon; bkz. CREDITS.md */
  if (ABG.rig && ABG.rig.loadVariants && Q.get('rig') !== '0') ABG.rig.loadVariants(BASE, [
    { key: 'suit',   file: 'patient_suit.glb',   height: 1.78, armDown: 1.22 },
    { key: 'hoodie', file: 'patient_hoodie.glb', height: 1.74, rotY: Math.PI / 2 },
    { key: 'tee',    file: 'patient_tee.glb',    height: 1.80 },
    { key: 'anna',   file: 'patient_anna.glb',   height: 1.68, armDown: 1.25, fem: true },
    { key: 'scanf',  file: 'patient_scanf.glb',  height: 1.68, rotX: -Math.PI / 2, fem: true }
  ]);

  var loader = new THREE.GLTFLoader();
  var ENV = ABG.pbr ? ABG.envI : 0;

  function prepare(gltf, cfg) {
    var root = gltf.scene;
    root.traverse(function (n) {
      if (!n.isMesh) return;
      n.castShadow = true; n.receiveShadow = true;
      var ms = Array.isArray(n.material) ? n.material : [n.material];
      ms.forEach(function (m) {
        if (!m) return;
        if (m.isMeshStandardMaterial) m.envMapIntensity = ENV || 0.35;
        /* GLTFLoader r128 yalnız baseColor/emissive haritalarını sRGB yapar; diğerleri doğrusal kalmalı */
        ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap'].forEach(function (k) {
          if (m[k]) m[k].encoding = THREE.LinearEncoding;
        });
      });
    });
    /* normalize: ortala, tabanı yere oturt, ölçekle */
    var wrap = new THREE.Group(); wrap.add(root);
    wrap.updateMatrixWorld(true);
    var bb = new THREE.Box3().setFromObject(root), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
    var s = 1;
    if (cfg.len) s = cfg.len / Math.max(sz.x, sz.z, cfg.hold ? sz.y : 0, 1e-4);
    else if (cfg.h) s = cfg.h / Math.max(sz.y, 1e-4);
    else if (cfg.scale) s = cfg.scale;
    root.scale.setScalar(s);
    if (cfg.hold) root.position.set(-c.x * s + (cfg.x || 0), -c.y * s + (cfg.y || 0), -c.z * s + (cfg.z || 0));
    else root.position.set(-c.x * s + (cfg.x || 0), -bb.min.y * s + (cfg.y || 0), -c.z * s + (cfg.z || 0));
    if (cfg.rotY) wrap.rotation.y = cfg.rotY;
    return wrap;
  }

  function factory(src, cfg) {
    return function () {
      var o = src.clone(true);                       /* geometri ve malzemeler paylaşılır; hafif */
      if (cfg.tint) {
        o.traverse(function (n) {
          if (!n.isMesh || !n.material || Array.isArray(n.material)) return;
          var col = cfg.tint[n.material.name];
          if (col !== undefined) { n.material = n.material.clone(); n.material.color.set(col).convertSRGBToLinear(); }
        });
      }
      return o;
    };
  }

  var cache = {};                                    /* aynı dosyayı bir kez indir */
  Object.keys(MODELS).forEach(function (key) {
    var cfg = MODELS[key];
    var p = cache[cfg.file] || (cache[cfg.file] = new Promise(function (res, rej) {
      loader.load(BASE + cfg.file, res, undefined, rej);
    }));
    p.then(function (gltf) {
      var src = prepare({ scene: gltf.scene.clone(true) }, cfg);
      ABG.props.provide(key, factory(src, cfg));
      if (window.console) console.info('[GLB] yüklendi:', key, '<-', cfg.file);
    }).catch(function () {
      if (window.console) console.info('[GLB] yok/yüklenemedi, eski görünüm kullanılacak:', key);
    });
  });
})();
