#!/usr/bin/env python3
"""Taranmış el modelini (sol el) oyunun POV eksenlerine çevirir: parmaklar -Z'ye, el sırtı +Y'ye, başparmak +X'e, metre ölçeği.
Bilek hizasından önceki kısım atılır (önlük/ön kol oyunda ayrı modellenir). Kullanım: handbake.py girdi.glb çıktı.glb"""
import sys, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import glbopt
src, dst = sys.argv[1], sys.argv[2]
j, b = glbopt.read_glb(src)
F = np.array([.5097037, -.83576536, .20420185]); U = np.array([-.13205658, .15853512, .9784823]); Lt = np.array([.8501548, .52570224, .02956238])
F /= np.linalg.norm(F); Xp = -Lt; Yp = U; Zp = -F
R = np.stack([Xp, Yp, Zp])            # satır: yeni eksenler
S = .2                                  # ham birim -> metre
T_CUT = -.22                            # bilekten ~3 cm önce kes (F boyunca ham birim)
newbuf = bytearray(); views = []; accs = []
def add_view(data, target=None):
    while len(newbuf) % 4: newbuf.append(0)
    v = {'buffer': 0, 'byteOffset': len(newbuf), 'byteLength': len(data)}
    if target: v['target'] = target
    newbuf.extend(data); views.append(v); return len(views) - 1
def add_acc(arr, typ, comp, target=None, minmax=False):
    bi = add_view(arr.tobytes(), target); ac = {'bufferView': bi, 'componentType': comp, 'count': int(arr.shape[0]), 'type': typ}
    if minmax: ac['min'] = [float(x) for x in arr.min(0)]; ac['max'] = [float(x) for x in arr.max(0)]
    accs.append(ac); return len(accs) - 1
# görseller aynen
for im in j['images']:
    bv = j['bufferViews'][im['bufferView']]; data = b[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    im['bufferView'] = add_view(bytes(data))
allp = np.concatenate([glbopt.acc_array(j, b, p['attributes']['POSITION']) for m in j['meshes'] for p in m['primitives']]).astype(np.float64)
c = allp.mean(0)
wrist_t = T_CUT
# bilek noktası (ham): F boyunca t=wrist_t'deki kesit merkezi
tt = (allp - c) @ F; sel = np.abs(tt - wrist_t) < .04; wc = allp[sel].mean(0)
for m in j['meshes']:
    for p in m['primitives']:
        at = p['attributes']
        pos = glbopt.acc_array(j, b, at['POSITION']).astype(np.float64); nor = glbopt.acc_array(j, b, at['NORMAL']).astype(np.float64); uv = glbopt.acc_array(j, b, at['TEXCOORD_0']).astype(np.float32)
        idx = glbopt.acc_array(j, b, p['indices']).reshape(-1, 3)
        t = (pos - c) @ F; keep = (t[idx] >= wrist_t).all(1); idx = idx[keep]
        used = np.unique(idx); remap = -np.ones(len(pos), np.int64); remap[used] = np.arange(len(used)); idx = remap[idx]
        pos = pos[used]; nor = nor[used]; uv = uv[used]
        P = ((pos - wc) @ R.T) * S; N = nor @ R.T
        N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
        p['attributes'] = {'POSITION': add_acc(P.astype(np.float32), 'VEC3', 5126, 34962, True), 'NORMAL': add_acc(N.astype(np.float32), 'VEC3', 5126, 34962), 'TEXCOORD_0': add_acc(uv, 'VEC2', 5126, 34962)}
        p['indices'] = add_acc(idx.reshape(-1, 1).astype(np.uint32), 'SCALAR', 5125, 34963)
        print('prim', len(P), 'köşe', len(idx), 'üçgen', 'bbox', P.min(0).round(3), P.max(0).round(3))
# düğüm dönüşümlerini sıfırla
for n in j['nodes']:
    n.pop('matrix', None)
j['accessors'] = accs; j['bufferViews'] = views; j['buffers'] = [{'byteLength': len(newbuf)}]
glbopt.write_glb(dst, j, bytes(newbuf)); print('yazıldı', dst, len(newbuf) // 1024, 'KB')
