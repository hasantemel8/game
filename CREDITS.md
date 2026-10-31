# Krediler / Credits

## Yazılım
- [Three.js](https://threejs.org) r128 (MIT) — `vendor/three.min.js`, `vendor/GLTFLoader.js`, `vendor/SkeletonUtils.js`

## 3B modeller (`models/`)
Bu depodaki varsayılan `.glb` dosyaları (yatak, sedye, tekerlekli sandalye, serum askısı, monitör)
oyun için üretilmiş basit yer tutucu modellerdir; üçüncü taraf telif içermez.

Kendi indirdiğin modellerle değiştirirsen, lisansı burada belirt. CC-BY modeller için yapımcı adı ve
bağlantı zorunludur. Şablon:

| Dosya | Model adı | Yapımcı | Lisans | Kaynak |
|-------|-----------|---------|--------|--------|
| models/bed.glb | (örnek) Hospital Bed | (yapımcı) | CC-BY 4.0 | (bağlantı) |

Not: "NonCommercial" (CC BY-NC) lisanslı modelleri, ücretli bir ürüne dönüşme ihtimali olan projelerde kullanma.

## Karakterler (kemikli insan modeli)
`js/characters.js` — bu projeye özel, sıfırdan yazılmış kemikli (skinned) insan sistemi: 19 kemikli iskelet, yumuşak deri/kumaş ağı, yüz mimik paneli (göz kırpma, bakış, kaş, ağız, ifadeler), prosedürel yürüyüş/koşu/oturma ve birinci şahıs kol–el modeli. Harici model, doku ya da telifli içerik kullanılmamıştır. Hemşire, Ece, Zozan Abla ve temizlikçi bu sistemle çalışır; `?rig=0` ile eski modele dönülür. Test sayfası: `tools/chartest.html`.

## Hasta modelleri (CC-BY 4.0 — Sketchfab)
Bu üç model Creative Commons Attribution 4.0 lisansıyla paylaşılmıştır (https://creativecommons.org/licenses/by/4.0/). Boyutları/dokuları küçültüldü, kollar aşağı indirildi ve oyundaki kemikli iskelete bağlandı (`tools/glbopt.py`, `js/characters.js`). Değişiklikler yapılmıştır.
- **Indian Man in suit** — Pixel_Monster — https://sketchfab.com/3d-models/indian-man-in-suit-985dd9756d89464b9380414b5b12d8aa → `models/patient_suit.glb`
- **Full Body Scan - Clean Pose** — OverseerThuror — https://sketchfab.com/3d-models/full-body-scan-clean-pose-ae9559912f6240a8a87057911b69edd0 → `models/patient_hoodie.glb`
- **Ryan full body scan** — FletchTech — https://sketchfab.com/3d-models/ryan-full-body-scan-d0b560123d06492aa7bf9e5361642811 → `models/patient_tee.glb`
- **Anna** — Trevon896850541 (CC-BY 4.0) — https://sketchfab.com/3d-models/anna-087e5e108dfd43af869e1ea6889014d0 → `models/patient_anna.glb`
- **Full body 3D scan** — fablabbudapest (CC-BY 4.0) — https://sketchfab.com/3d-models/full-body-3d-scan-c531fb928a5c408286a1ab7d9e18958e → `models/patient_scanf.glb`

### Birinci şahıs el modeli
- "hand" — kevinruiz — https://sketchfab.com/3d-models/hand-a43c9c9059b24e2aa4af08d1a76f0916 — CC-BY-4.0 (kırpılıp ölçeklenerek `models/hand_pov.glb` yapıldı).

### Klinik içerik notu
- Bilgisayar ekranındaki EKG ve BT görüntüleri oyun içinde kodla (prosedürel) çizilir; harici kitap/atlas görüntüsü kopyalanmamıştır.

## Kullanıcı tarafından sağlanan karakter modelleri (v_*.glb)
models/v_*.glb: proje sahibinin eklediği insan modelleri; dokular küçültüldü, animasyonlar çıkarıldı, T-pozlu olanların kolları oyun kodunda aşağı indirilir. Orijinal lisans/yazar bilgileri model kaynaklarından kontrol edilmelidir.
