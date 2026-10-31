# Acilde Bir Gün

Komik, birinci şahıs acil servis oyunu (Three.js). Tarayıcıda çalışır, kurulum gerektirmez.

## Yayınlama (GitHub Pages)
1. Bu klasörün içeriğini bir GitHub reposuna yükle (`index.html` kökte olmalı).
2. Settings → Pages → Branch: `main` / `(root)`.
3. `https://<kullanıcı>.github.io/<repo>/` adresinde açılır.

Yerelde denemek için `file://` ile **açma** (tarayıcı .glb dosyalarını engeller). Bunun yerine:
```
python3 -m http.server 8000     # sonra http://localhost:8000
```

## Yapı
```
index.html            oyun
js/pbr.js             gerçekçi görünüm katmanı (PBR, ACES, ortam haritası, zemin AO)
js/glb-props.js       models/ klasöründeki GLB'leri oyundaki yuvalara bağlar
vendor/               Three.js r128 + GLTFLoader (CDN'e bağımlılık yok; yazı tipleri hariç)
models/               GLB eşyalar (bkz. models/README.md)
CREDITS.md            model/yazılım atıfları
```

## Adres parametreleri (hata ayıklama)
| Parametre | Etki |
|-----------|------|
| `?pbr=0` | PBR katmanını kapatır (eski Lambert/Phong görünüm). Mobilde varsayılan zaten kapalı, `?pbr=1` ile açılır |
| `?glb=0` | GLB modelleri kapatır, eski box/cyl eşyalar kalır |
| `?exp=0.6` | ton eşleme pozlaması |
| `?env=0.25` | ortam haritası şiddeti (malzeme başına) |

## Yeni GLB yuvası eklemek
Oyun kodunda eşyayı kuran yerde:
```js
var i0 = PR.mark();
/* ... eski box()/cyl() çağrıları ... */
PR.slot('anahtar', PR.grab(i0), x, 0, z, rotY);
```
sonra `js/glb-props.js` içindeki `MODELS` tablosuna `anahtar: { file: '...glb', len: ... }` ekle.
Hareketli eşyalar için (`makeStretcherModel`, `makeWC` gibi) `PR.group('anahtar')` kullanılır.
