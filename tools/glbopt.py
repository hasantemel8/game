#!/usr/bin/env python3
"""GLB küçültücü (yalnızca numpy + Pillow gerekir; harici araç/ağ yok).
Kullanım: python3 tools/glbopt.py girdi.glb çıktı.glb [--tex 1024] [--verts 20000] [--q 82]
  --tex N    : dokuları en uzun kenarı N piksel olacak şekilde küçültür (JPEG/PNG korunur)
  --verts N  : iskeletsiz (skin'siz) modellerde köşe sayısını ~N'e indirir (ızgara kümeleme, UV dikişi korunur)
Skin'li (kemikli) modellerde geometri olduğu gibi kalır; yalnızca dokular küçülür."""
import sys, json, struct, io, argparse
import numpy as np
from PIL import Image

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT2': 4, 'MAT3': 9, 'MAT4': 16}


def read_glb(path):
    d = open(path, 'rb').read()
    assert d[:4] == b'glTF'
    off = 12; j = None; b = b''
    while off < len(d):
        n, t = struct.unpack('<II', d[off:off + 8]); c = d[off + 8:off + 8 + n]; off += 8 + n
        if t == 0x4E4F534A: j = json.loads(c)
        elif t == 0x004E4942: b = c
    return j, b


def write_glb(path, j, b):
    js = json.dumps(j, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    b += b'\0' * ((4 - len(b) % 4) % 4)
    out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(b))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(b), 0x004E4942) + b
    open(path, 'wb').write(out)


def acc_array(j, b, i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']]); nc = NC[a['type']]
    stride = bv.get('byteStride') or dt.itemsize * nc
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    if stride == dt.itemsize * nc:
        return np.frombuffer(b, dtype=dt, count=a['count'] * nc, offset=off).reshape(a['count'], nc).copy()
    raw = np.frombuffer(b, dtype=np.uint8, count=stride * a['count'], offset=off).reshape(a['count'], stride)
    return np.frombuffer(raw[:, :dt.itemsize * nc].tobytes(), dtype=dt).reshape(a['count'], nc).copy()


def cluster(pos, nor, uv, idx, target):
    """ızgara kümeleme ile köşe azaltma"""
    mn, mx = pos.min(0), pos.max(0); size = (mx - mn).max()
    lo, hi = size / 2000., size / 4.
    for _ in range(18):                        # hedef köşe sayısına ikili arama
        cell = (lo * hi) ** .5
        key = np.floor((pos - mn) / cell).astype(np.int64)
        uk = np.floor(uv * 6).astype(np.int64)  # UV dikişlerini ayrı tut
        k = np.concatenate([key, uk], 1)
        _, inv = np.unique(k, axis=0, return_inverse=True)
        n = inv.max() + 1
        if n > target: lo = cell
        else: hi = cell
        if abs(n - target) < target * .06: break
    inv = inv.reshape(-1); n = inv.max() + 1
    cnt = np.bincount(inv, minlength=n).astype(np.float64)[:, None]
    def avg(a):
        o = np.zeros((n, a.shape[1])); np.add.at(o, inv, a.astype(np.float64)); return o / cnt
    p2 = avg(pos); n2 = avg(nor); n2 /= np.maximum(np.linalg.norm(n2, axis=1, keepdims=True), 1e-9); u2 = avg(uv)
    tri = inv[idx.reshape(-1, 3)]
    ok = (tri[:, 0] != tri[:, 1]) & (tri[:, 1] != tri[:, 2]) & (tri[:, 0] != tri[:, 2])
    tri = tri[ok]
    srt = np.sort(tri, 1); _, first = np.unique(srt, axis=0, return_index=True)   # çift üçgenleri at
    tri = tri[np.sort(first)]
    return p2.astype(np.float32), n2.astype(np.float32), u2.astype(np.float32), tri.astype(np.uint32).reshape(-1)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--tex', type=int, default=1024); ap.add_argument('--verts', type=int, default=0); ap.add_argument('--q', type=int, default=82)
    a = ap.parse_args()
    j, b = read_glb(a.src)
    skinned = bool(j.get('skins'))
    newbuf = bytearray(); views = []; accs = []

    def add_view(data, target=None):
        while len(newbuf) % 4: newbuf.append(0)
        v = {'buffer': 0, 'byteOffset': len(newbuf), 'byteLength': len(data)}
        if target: v['target'] = target
        newbuf.extend(data); views.append(v); return len(views) - 1

    def add_acc(arr, typ, comp, target=None, minmax=False):
        bi = add_view(arr.tobytes(), target)
        ac = {'bufferView': bi, 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
        if minmax:
            ac['min'] = [float(x) for x in arr.min(0)]; ac['max'] = [float(x) for x in arr.max(0)]
        accs.append(ac); return len(accs) - 1

    # --- dokular ---
    imgs = j.get('images', [])
    alpha_imgs = set()
    for m in j.get('materials', []):
        if m.get('alphaMode') in ('BLEND', 'MASK'):
            t = m.get('pbrMetallicRoughness', {}).get('baseColorTexture')
            if t: alpha_imgs.add(j['textures'][t['index']].get('source'))
    new_img_view = {}
    for i, im in enumerate(imgs):
        raw = b[j['bufferViews'][im['bufferView']].get('byteOffset', 0):][:j['bufferViews'][im['bufferView']]['byteLength']]
        pil = Image.open(io.BytesIO(raw)); pil.load()
        w, h = pil.size; s = max(w, h)
        if s > a.tex:
            f = a.tex / s; pil = pil.resize((max(1, round(w * f)), max(1, round(h * f))), Image.LANCZOS)
        out = io.BytesIO()
        has_a = pil.mode in ('RGBA', 'LA') and np.asarray(pil.getchannel('A')).min() < 250
        if im.get('mimeType') == 'image/png' and (has_a or i in alpha_imgs):
            pil.convert('RGBA').save(out, 'PNG', optimize=True); im['mimeType'] = 'image/png'
        else:
            pil.convert('RGB').save(out, 'JPEG', quality=a.q, optimize=True); im['mimeType'] = 'image/jpeg'
        new_img_view[i] = out.getvalue()
        print('  doku', i, (w, h), '->', pil.size, len(out.getvalue()) // 1024, 'KB')

    if skinned or not a.verts:
        # geometri/animasyon olduğu gibi kalsın: tüm bufferView'leri sırayla kopyala, görselleri değiştir
        img_views = {im['bufferView']: i for i, im in enumerate(imgs)}
        for vi, bv in enumerate(j['bufferViews']):
            if vi in img_views:
                data = new_img_view[img_views[vi]]
            else:
                data = b[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
            while len(newbuf) % 4: newbuf.append(0)
            nb = dict(bv); nb['byteOffset'] = len(newbuf); nb['byteLength'] = len(data); nb['buffer'] = 0
            newbuf.extend(data); views.append(nb)
        j['bufferViews'] = views
    else:
        # iskeletsiz tarama: ilkelleri azalt
        for im_i, im in enumerate(imgs):
            im['bufferView'] = add_view(new_img_view[im_i])
        total = sum(j['accessors'][p['attributes']['POSITION']]['count'] for m in j['meshes'] for p in m['primitives'])
        for m in j['meshes']:
            for p in m['primitives']:
                at = p['attributes']
                pos = acc_array(j, b, at['POSITION']).astype(np.float64)
                nor = acc_array(j, b, at['NORMAL']).astype(np.float64) if 'NORMAL' in at else np.tile([0, 1, 0], (len(pos), 1)).astype(np.float64)
                uv = acc_array(j, b, at['TEXCOORD_0']).astype(np.float64) if 'TEXCOORD_0' in at else np.zeros((len(pos), 2))
                idx = acc_array(j, b, p['indices']).reshape(-1) if 'indices' in p else np.arange(len(pos))
                tg = int(a.verts * len(pos) / total)
                p2, n2, u2, tri = cluster(pos, nor, uv, idx, tg)
                print('  prim', len(pos), '->', len(p2), 'köşe,', len(idx) // 3, '->', len(tri) // 3, 'üçgen')
                p['attributes'] = {'POSITION': add_acc(p2, 'VEC3', 5126, 34962, True), 'NORMAL': add_acc(n2, 'VEC3', 5126, 34962),
                                   'TEXCOORD_0': add_acc(u2, 'VEC2', 5126, 34962)}
                p['indices'] = add_acc(tri.reshape(-1, 1), 'SCALAR', 5125, 34963)
                p.pop('targets', None)
        j['accessors'] = accs; j['bufferViews'] = views
    j['buffers'] = [{'byteLength': len(newbuf)}]
    write_glb(a.dst, j, bytes(newbuf))
    print('yazıldı:', a.dst, len(newbuf) // 1024, 'KB')


if __name__ == '__main__':
    main()
