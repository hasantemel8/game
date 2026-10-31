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
