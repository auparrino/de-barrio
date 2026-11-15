"""Reduce la hoja generada a capas de color plano y las vectoriza con potrace."""
import sys
import numpy as np
from PIL import Image, ImageFilter
import potrace

ESC = 0.5  # trabajar a 720x1440
img = Image.open("acanto.png").convert("RGB")
img = img.resize((int(img.width * ESC), int(img.height * ESC)), Image.LANCZOS)
a = np.asarray(img).astype(float)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
verde = ((g > r + 18) & (g > b + 10) & (lum > 35)) | ((lum > 200) & (abs(r - g) < 40))

def limpia(m, tam=5):
    im = Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.MedianFilter(tam))
    return np.asarray(im) > 127

capas = [
    ("verde_sombra", limpia(verde, 7)),
    ("verde", limpia(verde & (lum > 92), 7)),
    ("verde_luz", limpia(verde & (lum > 145), 5)),
    ("blanco", limpia(verde & (lum > 205), 3)),
]

def a_path(m, turd=30):
    bm = potrace.Bitmap(~m)
    plist = bm.trace(turdsize=turd, alphamax=1.1, opticurve=True, opttolerance=0.4)
    d = []
    for curva in plist:
        s = curva.start_point
        d.append(f"M{s.x:.1f} {s.y:.1f}")
        for seg in curva.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x:.1f} {seg.c.y:.1f} L{seg.end_point.x:.1f} {seg.end_point.y:.1f}")
            else:
                d.append(f"C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} {seg.end_point.x:.1f} {seg.end_point.y:.1f}")
        d.append("Z")
    return " ".join(d)

out = {}
for nombre, m in capas:
    out[nombre] = a_path(m)
    print(nombre, m.sum(), len(out[nombre]))
import json
json.dump({"w": img.width, "h": img.height, "capas": out}, open("acanto-capas.json", "w"))
