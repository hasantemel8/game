# models/ — GLB eşyalar

Oyun bu klasördeki dosyaları açılışta yüklemeye çalışır. **Dosya yoksa ya da bozuksa oyun eski
box/cyl görünümüyle çalışmaya devam eder.** Test için `?glb=0` ile modelleri kapatabilirsin.

| Dosya | Oyundaki yeri | Yön / adlandırma |
|-------|---------------|------------------|
| bed.glb | 4 normal yatak + 3 kırmızı alan yatağı | baş ucu **-Z**; şilte malzemesi adı `mattress` (kırmızı alanda boyanır) |
| stretcher.glb | paramedik sedyesi (ambulans/morg) | baş ucu **-Z**; tekerlek düğümleri `wheel*` adlı, pivot tekerlek merkezinde, X ekseninde döner |
| wheelchair.glb | tekerlekli sandalyeli hastalar | hasta **+Z**'ye bakar; tekerlekler `wheel*` |
| iv_stand.glb | her yatağın serum askısı | yükseklik ~2 m |
| monitor.glb | her yatağın monitörü | ekran **+Z**'ye bakar; ekran yüzeyi `screen` adlı mesh (UV 0..1) — canlı EKG buraya çizilir. `screen` yoksa model kullanılmaz, eski monitör kalır |

Kendi modelini koymak için: dosyayı aynı adla üzerine yaz **ya da** `js/glb-props.js` içindeki
`MODELS` tablosunda dosya adını değiştir. Model otomatik ortalanır, yere oturtulur ve `len` (en uzun
yatay kenar, m) / `h` (yükseklik, m) değerine ölçeklenir. Ters duruyorsa `rotY: Math.PI` ekle.

## Boyut bütçesi
Sabit eşya başına < 1 MB, toplam < 10-15 MB. Sıkıştırma: `npx gltfpack -i in.glb -o out.glb -cc -tc`
(meshopt kullanırsan `vendor/` içine MeshoptDecoder eklemek gerekir) ya da `gltf-transform optimize`.
Doku boyutu en fazla 1024 px.
