"""Reduce una pieza de fileteado generada como imagen a capas de color plano y las vectoriza.

Separa cada familia de color (verde, rosa, celeste, ocre) por tono, la divide en tres niveles de luz
(sombra, base, luz) con umbrales propios de cada familia, agrega los brillos blancos y traza cada capa
con potrace. El resultado es un JSON de capas que tools/filete.py pinta con la paleta del manual.

    python3 tools/filete_capas.py imagen.png salida.json [familias...]
    python3 tools/filete_capas.py acanto.png tools/filete-acanto.json verde
"""
import colorsys
import json
import sys

import numpy as np
import potrace
from PIL import Image, ImageFilter

FAMILIAS = {
    # rangos de tono (0-1) de cada familia
    "verde": [(0.20, 0.45)],
    "rosa": [(0.88, 1.0), (0.0, 0.04)],
    "celeste": [(0.50, 0.64)],
    "ocre": [(0.07, 0.17)],
}


def limpia(m, tam=5):
    im = Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.MedianFilter(tam))
    return np.asarray(im) > 127


def a_path(m, turd=30):
    plist = potrace.Bitmap(~m).trace(turdsize=turd, alphamax=1.1, opticurve=True, opttolerance=0.4)
    d = []
    for curva in plist:
        s = curva.start_point
        d.append(f"M{s.x:.1f} {s.y:.1f}")
        for seg in curva.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x:.1f} {seg.c.y:.1f} L{seg.end_point.x:.1f} {seg.end_point.y:.1f}")
            else:
                d.append(f"C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} "
                         f"{seg.end_point.x:.1f} {seg.end_point.y:.1f}")
        d.append("Z")
    return " ".join(d)


def capas(ruta, familias, ancho_trabajo=720):
    img = Image.open(ruta).convert("RGB")
    esc = ancho_trabajo / img.width
    img = img.resize((ancho_trabajo, int(img.height * esc)), Image.LANCZOS)
    a = np.asarray(img).astype(float) / 255
    h, s, v = np.vectorize(colorsys.rgb_to_hsv, otypes=[float, float, float])(a[..., 0], a[..., 1], a[..., 2])
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    brillo = (lum > 0.82) & (s < 0.25)
    salida = {}
    for fam in familias:
        en_tono = np.zeros(h.shape, bool)
        for lo, hi in FAMILIAS[fam]:
            en_tono |= (h >= lo) & (h <= hi)
        m = en_tono & (s > 0.22) & (v > 0.18)
        if m.sum() < 500:
            continue
        # la familia incluye sus brillos internos para que la silueta quede cerrada
        silueta = limpia(m | (brillo & limpia(m, 15)), 7)
        p30, p75 = np.percentile(lum[m], [30, 75])
        salida[f"{fam}_sombra"] = a_path(silueta)
        salida[fam] = a_path(limpia(silueta & ((lum > p30) | brillo), 7))
        salida[f"{fam}_luz"] = a_path(limpia(silueta & ((lum > p75) | brillo), 5))
        print(fam, int(m.sum()), "umbrales", round(p30, 2), round(p75, 2))
    salida["blanco"] = a_path(limpia(brillo, 3), turd=8)
    return {"w": img.width, "h": img.height, "orden": list(salida.keys()), "capas": salida}


if __name__ == "__main__":
    origen, destino, *fams = sys.argv[1:]
    res = capas(origen, fams or ["verde"])
    with open(destino, "w", encoding="utf-8", newline="\n") as f:
        json.dump(res, f)
