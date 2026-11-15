"""Adornos de fileteado porteño para el sitio, generados en SVG.

Sigue las reglas de «El ABC del fileteado porteño» (Alfredo Genovese, 2022), resumidas en
data/guias/fileteado.md:
- volumen con luz desde arriba a la izquierda: lado iluminado claro, lado opuesto oscuro, brillo
  blanco fino sobre la nervadura y sombra proyectada abajo a la derecha;
- hoja de acanto terminada en voluta e integrada a la banda; el follaje se construye sobre círculos y
  cada hoja se diferencia un poco de las demás;
- flores planas: círculo dividido en partes iguales, pétalos acorazonados cóncavos (sombra arriba,
  luz abajo) y centro convexo (luz arriba);
- cinta dividida en tres (celeste, blanco, celeste), con el revés de los pliegues en otro tono;
- llave (bigoteado): líneas finas entrelazadas, como las que se hacen con el pincel de banda.

    python3 tools/filete.py public/filete.svg
"""
import math
import sys

# Colores planos de la tabla del manual: contrafondo, verde, ocre, rosa, celeste, blanco
C = {
    "contrafondo": "#23160F",
    "verde": "#3FAE5A", "verde_luz": "#9BE3A8", "verde_sombra": "#1D6B33",
    "ocre": "#D49A2A", "ocre_luz": "#F6CB6B", "ocre_sombra": "#8A5A12",
    "rosa": "#E8607A", "rosa_luz": "#F7A8B8", "rosa_sombra": "#A8334B",
    "celeste": "#7EC3E6", "celeste_luz": "#CDEBFA", "celeste_sombra": "#3E86B0",
    "bermellon": "#C8261C", "blanco": "#FFFFFF", "sombra": "rgba(0,0,0,.45)",
}


def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def suave(pts, cerrar=False):
    """Catmull-Rom → Bézier."""
    m = len(pts)
    d = f"M{f(pts[0][0])} {f(pts[0][1])}"
    for i in range(m - 1):
        p0, p1, p2 = pts[max(i - 1, 0)], pts[i], pts[i + 1]
        p3 = pts[min(i + 2, m - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    return d + ("Z" if cerrar else "")


def espiral(cx, cy, r0, r1, t0, t1, n=60):
    return [(cx + r0 * (r1 / r0) ** (i / n) * math.cos(t0 + (t1 - t0) * i / n),
             cy + r0 * (r1 / r0) ** (i / n) * math.sin(t0 + (t1 - t0) * i / n)) for i in range(n + 1)]


def normales(pts):
    out = []
    for i in range(len(pts)):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, len(pts) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        l = math.hypot(dx, dy) or 1
        out.append((-dy / l, dx / l))
    return out


def volumen(contorno, lado_luz, nervadura, color, desplaz=5):
    """Sombra proyectada + cuerpo en sombra + lado iluminado + brillo (luz arriba a la izquierda)."""
    return [
        f'<path d="{suave(contorno, True)}" fill="{C["sombra"]}" transform="translate({desplaz} {desplaz})"/>',
        f'<path d="{suave(contorno, True)}" fill="{C[color + "_sombra"]}"/>',
        f'<path d="{suave(lado_luz, True)}" fill="{C[color]}"/>',
        f'<path d="{suave(nervadura)}" fill="none" stroke="{C["blanco"]}" stroke-width="1.6" '
        f'stroke-linecap="round" opacity=".85"/>',
    ]


def tallo(centro, a0, a1, color):
    """Tallo que se afina, con el lado que mira arriba/izquierda iluminado."""
    ns = normales(centro)
    n = len(centro)
    w = [a0 + (a1 - a0) * (i / (n - 1)) ** 0.8 for i in range(n)]
    izq = [(p[0] + nx * wi / 2, p[1] + ny * wi / 2) for p, (nx, ny), wi in zip(centro, ns, w)]
    der = [(p[0] - nx * wi / 2, p[1] - ny * wi / 2) for p, (nx, ny), wi in zip(centro, ns, w)]
    s = [f'<path d="{suave(izq + der[::-1], True)}" fill="{C["sombra"]}" transform="translate(5 5)"/>',
         f'<path d="{suave(izq + der[::-1], True)}" fill="{C[color + "_sombra"]}"/>']
    # por tramos: en cada punto se ilumina el borde que está más arriba/izquierda (x + y menor)
    for i in range(0, n - 1, 4):
        j = min(i + 5, n)
        lado = [izq[k] if izq[k][0] + izq[k][1] < der[k][0] + der[k][1] else der[k] for k in range(i, j)]
        tramo = lado + centro[i:j][::-1]
        s.append(f'<path d="{suave(tramo, True)}" fill="{C[color]}"/>')
    brillo = []
    for k in range(3, n - 8):
        lado = izq[k] if izq[k][0] + izq[k][1] < der[k][0] + der[k][1] else der[k]
        brillo.append(((lado[0] + centro[k][0]) / 2, (lado[1] + centro[k][1]) / 2))
    s.append(f'<path d="{suave(brillo)}" fill="none" stroke="{C["blanco"]}" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>')
    return s


def hoja(x, y, ang, largo, ancho, lobulos, sentido, color):
    """Hoja de acanto: lóbulos festoneados de un lado y la punta enrollada hacia atrás."""
    a = math.radians(ang)
    ca, sa = math.cos(a), math.sin(a)
    T = lambda u, v: (x + u * ca - v * sa * sentido, y + u * sa + v * ca * sentido)
    n = 50
    arriba, abajo, media = [], [], []
    for i in range(n + 1):
        u = largo * i / n
        base = math.sin(math.pi * min(u / largo * 0.92, 1)) ** 0.75
        fest = 0.6 + 0.4 * abs(math.cos(math.pi * lobulos * u / largo))
        arriba.append(T(u, ancho * base * fest))
        abajo.append(T(u, -ancho * 0.38 * base))
        media.append(T(u, ancho * 0.18 * base))
    s = volumen(arriba + abajo[::-1], arriba + media[::-1], media[6:-8], color, 4)
    px, py = T(largo * 0.94, 0)
    cx, cy = T(largo * 0.86, ancho * 0.42)
    r0 = math.hypot(px - cx, py - cy)
    t0 = math.atan2(py - cy, px - cx)
    rulo = espiral(cx, cy, r0, ancho * 0.08, t0, t0 + 5.4 * sentido, 36)
    s += [f'<path d="{suave(rulo)}" fill="none" stroke="{C[color + "_sombra"]}" stroke-width="{f(ancho * .34)}" stroke-linecap="round"/>',
          f'<path d="{suave(rulo)}" fill="none" stroke="{C[color]}" stroke-width="{f(ancho * .2)}" stroke-linecap="round"/>']
    return s


def bolita(x, y, r, color):
    """Bolita convexa: luz arriba a la izquierda y sombra proyectada."""
    return [f'<circle cx="{f(x + r * .35)}" cy="{f(y + r * .35)}" r="{f(r)}" fill="{C["sombra"]}"/>',
            f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{C[color + "_sombra"]}"/>',
            f'<circle cx="{f(x - r * .15)}" cy="{f(y - r * .15)}" r="{f(r * .8)}" fill="{C[color]}"/>',
            f'<circle cx="{f(x - r * .38)}" cy="{f(y - r * .38)}" r="{f(r * .28)}" fill="{C["blanco"]}"/>']


def flor(x, y, r, color="rosa", petalos=5, giro=-90):
    """Flor plana: pétalos iguales acorazonados, cóncavos (sombra arriba), y centro de bolita."""
    s = []
    for k in range(petalos):
        a = math.radians(giro + 360 * k / petalos)
        ca, sa = math.cos(a), math.sin(a)
        T = lambda u, v: (x + u * ca - v * sa, y + u * sa + v * ca)
        borde = [T(r * .18, 0), T(r * .45, r * .36), T(r * .85, r * .42), T(r * 1.0, r * .2),
                 T(r * .9, 0), T(r * 1.0, -r * .2), T(r * .85, -r * .42), T(r * .45, -r * .36)]
        s.append(f'<path d="{suave(borde + [borde[0]], True)}" fill="{C["sombra"]}" transform="translate(3 3)"/>')
        s.append(f'<path d="{suave(borde + [borde[0]], True)}" fill="{C[color]}"/>')
        interior = [T(r * .3, 0), T(r * .5, r * .24), T(r * .78, r * .26), T(r * .78, -r * .26), T(r * .5, -r * .24)]
        arriba = sum(p[1] for p in interior) / len(interior) < y
        tono = C[color + "_sombra"] if arriba else C[color + "_luz"]
        s.append(f'<path d="{suave(interior + [interior[0]], True)}" fill="{tono}" opacity=".9"/>')
    s += bolita(x, y, r * .26, "celeste" if color != "celeste" else "rosa")
    return s


def esquinero_banda(t=14):
    """Esquina recortada de la banda: la banda gira con un cuarto de círculo cóncavo centrado en la
    esquina, y la bolita va en el recorte. 90x90; la línea media de la banda queda a 1,5·t del borde
    (arriba: y = 1,5t; derecha: x = 90 - 1,5t), igual que los tramos rectos del CSS."""
    W, R = 90, 30
    px, py = W - 1.5 * t, 1.5 * t
    d = f"M0 {f(py)} L{f(px - R)} {f(py)} A{R} {R} 0 0 0 {f(px)} {f(py + R)} L{f(px)} {W}"
    s = [f'<path d="{d}" fill="none" stroke="{C["sombra"]}" stroke-width="{t}" transform="translate(4 4)"/>',
         f'<path d="{d}" fill="none" stroke="{C["verde_sombra"]}" stroke-width="{t}"/>',
         f'<path d="{d}" fill="none" stroke="{C["verde"]}" stroke-width="{t * .55}" transform="translate({-t * .2} {-t * .2})"/>',
         f'<path d="{d}" fill="none" stroke="{C["verde_luz"]}" stroke-width="1.6" transform="translate({-t * .32} {-t * .32})"/>']
    s += bolita(px - 2, py + 2, 8, "rosa")
    return "\n".join(s)


def acanto_lateral():
    """Nivel exterior: hoja de acanto terminada en voluta, integrada a la banda de arriba.
    viewBox 0 0 300 560; la banda de arriba entra por la derecha con su línea media en y = 21.
    El follaje sube por el lado exterior (izquierda) y cada hoja es un poco distinta."""
    cx, cy, Rx, Ry = 150, 290, 116, 262
    E = lambda g: (cx + Rx * math.cos(math.radians(g)), cy + Ry * math.sin(math.radians(g)))
    pts = [(306, 28), (250, 28), (cx + 30, 28.5)]
    pts += [E(-90 - 165 * i / 44) for i in range(45)]          # baja por la izquierda hasta abajo
    ux, uy = pts[-1]
    vc = (158, 446)
    r0 = math.hypot(ux - vc[0], uy - vc[1])
    t0 = math.atan2(uy - vc[1], ux - vc[0])
    vol = espiral(vc[0], vc[1], r0, 9, t0, t0 - 2 * math.pi * 1.45, 80)   # voluta hacia adentro
    centro = pts + vol[1:]
    s = []
    # follaje: (ángulo sobre el tallo, dirección de la hoja, largo, ancho, lóbulos, lado, color)
    for g, ang, largo, ancho, lob, sent, color in [
            (-112, -28, 120, 30, 3, -1, "verde"),
            (-138, -62, 140, 36, 3, -1, "verde"),
            (-162, -84, 130, 33, 4, -1, "ocre"),
            (-188, -96, 112, 30, 3, -1, "verde"),
            (-232, 18, 92, 24, 2, 1, "verde")]:
        x, y = E(g)
        s += hoja(x, y, ang, largo, ancho, lob, sent, color)
    s += tallo(centro, 16, 34, "verde")
    s += bolita(vc[0], vc[1], 9, "rosa")
    gx, gy = 196, 96
    s += [f'<path d="M{gx} {gy - 60} L{gx} {gy - 8}" stroke="{C["celeste_sombra"]}" stroke-width="2"/>',
          f'<path d="M{gx} {gy - 8} C{gx + 9} {gy + 6} {gx + 6} {gy + 18} {gx} {gy + 18} '
          f'C{gx - 6} {gy + 18} {gx - 9} {gy + 6} {gx} {gy - 8}Z" fill="{C["celeste"]}"/>',
          f'<circle cx="{gx - 2}" cy="{gy + 8}" r="2" fill="{C["blanco"]}"/>']
    return "\n".join(s)


def ramo():
    """Nivel interior: tres flores planas con hojitas; 230x130."""
    s = []
    for ang, sent in [(-165, -1), (-15, 1), (-120, -1), (-60, 1)]:
        s += hoja(115, 78, ang, 74, 16, 2, sent, "verde")
    s += flor(48, 80, 30, "rosa", 5, -90)
    s += flor(182, 80, 30, "celeste", 4, -45)
    s += flor(115, 66, 42, "rosa", 5, -90)
    return "\n".join(s)


def cinta(largo=520, alto=54):
    """Cinta argentina: tramo central dividido en tres y colas plegadas con el revés en otro tono."""
    s = []
    cola, y0 = 70, 14
    for lado in (-1, 1):
        borde = 0 if lado < 0 else largo
        interno = cola if lado < 0 else largo - cola
        d = (f"M{interno} {y0 + 12} L{borde} {y0 + 12} L{borde + lado * -20} {f(y0 + 12 + alto / 2)} "
             f"L{borde} {y0 + 12 + alto} L{interno} {y0 + 12 + alto}Z")
        s.append(f'<path d="{d}" fill="{C["sombra"]}" transform="translate(4 4)"/>')
        s.append(f'<path d="{d}" fill="{C["celeste_sombra"]}"/>')
        s.append(f'<path d="M{interno} {y0} L{interno - lado * 14} {y0 + 12} L{interno - lado * 14} {y0 + 12 + alto} '
                 f'L{interno} {y0 + alto}Z" fill="{C["rosa_sombra"]}"/>')
    x1, x2 = cola, largo - cola
    franja = alto / 3
    s.append(f'<rect x="{x1}" y="{y0}" width="{x2 - x1}" height="{alto}" fill="{C["sombra"]}" transform="translate(4 4)"/>')
    for k, col in enumerate(["celeste", "blanco", "celeste"]):
        s.append(f'<rect x="{x1}" y="{f(y0 + k * franja)}" width="{x2 - x1}" height="{f(franja + .5)}" fill="{C[col]}"/>')
    s.append(f'<rect x="{x1}" y="{y0}" width="{x2 - x1}" height="3" fill="{C["celeste_luz"]}"/>')
    s.append(f'<rect x="{x1}" y="{f(y0 + alto - 4)}" width="{x2 - x1}" height="4" fill="{C["celeste_sombra"]}"/>')
    return "\n".join(s)


def llave(largo=600):
    """Llave o bigoteado: líneas finas entrelazadas y simétricas, en rojo y celeste; 600x60."""
    s = []
    m, cx = 30, largo / 2
    rojo, cel = C["bermellon"], C["celeste_sombra"]
    for lado in (-1, 1):
        s.append(f'<path d="M{f(cx + lado * 30)} {m} L{f(cx + lado * (largo / 2 - 4))} {m}" stroke="{rojo}" stroke-width="2.2" stroke-linecap="round"/>')
        for a, b, h, col in [(30, 150, 14, cel), (95, 215, 10, rojo), (170, 262, 7, cel)]:
            x0, x1 = cx + lado * a, cx + lado * b
            s.append(f'<path d="M{f(x0)} {m} Q{f((x0 + x1) / 2)} {m - h} {f(x1)} {m} Q{f((x0 + x1) / 2)} {m + h} {f(x0)} {m}" '
                     f'fill="none" stroke="{col}" stroke-width="2"/>')
        for sg in (-1, 1):
            s.append(f'<path d="M{f(cx + lado * 60)} {m + sg * 9} q{f(lado * 10)} {sg * 12} {f(lado * 18)} {sg * 4} '
                     f'q{f(lado * 2)} {sg * -7} {f(lado * -5)} {sg * -6}" fill="none" stroke="{rojo}" stroke-width="2" stroke-linecap="round"/>')
    s.append(f'<path d="M{cx} {m - 14} L{cx + 14} {m} L{cx} {m + 14} L{cx - 14} {m}Z" fill="{C["rosa"]}" stroke="{rojo}" stroke-width="2"/>')
    s.append(f'<circle cx="{cx}" cy="{m}" r="3.5" fill="{C["celeste"]}"/>')
    return "\n".join(s)


def banda(d, t=16):
    """Banda de ancho uniforme con volumen: sombra proyectada, cuerpo oscuro, cara iluminada y brillo."""
    return [f'<path d="{d}" fill="none" stroke="{C["sombra"]}" stroke-width="{t}" transform="translate(5 5)"/>',
            f'<path d="{d}" fill="none" stroke="{C["verde_sombra"]}" stroke-width="{t}"/>',
            f'<path d="{d}" fill="none" stroke="{C["verde"]}" stroke-width="{t * .55}" transform="translate({-t * .2} {-t * .2})"/>',
            f'<path d="{d}" fill="none" stroke="{C["verde_luz"]}" stroke-width="1.6" transform="translate({-t * .34} {-t * .34})"/>']


def acanto_pintado(escala=.375, dx=30, dy=33):
    """Hoja de acanto generada como imagen (Canva), reducida a cuatro tonos planos y vectorizada con
    potrace (tools/filete_capas.py). Las capas están en tools/filete-acanto.json; acá se pintan con la
    paleta y se les agrega la sombra proyectada."""
    import json
    import os
    datos = json.load(open(os.path.join(os.path.dirname(__file__), "filete-acanto.json")))
    capas = datos["capas"]
    s = [f'<g transform="translate({dx} {dy}) scale({escala})">',
         f'<path d="{capas["verde_sombra"]}" fill="{C["sombra"]}" transform="translate(6 6)"/>']
    for k in ["verde_sombra", "verde", "verde_luz", "blanco"]:
        s.append(f'<path d="{capas[k]}" fill="{C[k]}"/>')
    s.append("</g>")
    return "\n".join(s)


def letrero(W=1180, H=600):
    """Panel completo: marco, nivel exterior (acanto a la izquierda + banda que completa la derecha
    con esquinas recortadas y bolitas), firulete y, en el nivel interior, un ramo de flores planas.
    El texto se escribe encima desde el HTML, dentro del firulete."""
    m, R = 60, 34
    s = [f'<rect x="8" y="8" width="{W - 16}" height="{H - 16}" fill="none" stroke="{C["celeste"]}" stroke-width="3"/>']
    d = (f"M300 {m} H{W - m - R} A{R} {R} 0 0 0 {W - m} {m + R} V{H - m - R} "
         f"A{R} {R} 0 0 0 {W - m - R} {H - m} H220")
    s += banda(d)
    # firulete: línea más fina entre la banda y el nivel interior, con el mismo recorrido
    k, r2 = 30, 20
    df = (f"M340 {m + k} H{W - m - k - r2} A{r2} {r2} 0 0 0 {W - m - k} {m + k + r2} V{H - m - k - r2} "
          f"A{r2} {r2} 0 0 0 {W - m - k - r2} {H - m - k} H300")
    s.append(f'<path d="{df}" fill="none" stroke="{C["bermellon"]}" stroke-width="2.5"/>')
    s += bolita(W - m, m, 9, "rosa") + bolita(W - m, H - m, 9, "rosa")
    # nivel exterior: la hoja de acanto, desplazada para que su tallo entre en la banda de arriba
    s.append(acanto_pintado())
    # nivel interior: ramo abajo a la derecha
    s.append(f'<g transform="translate({W - m - k - 250} {H - m - k - 150})">{ramo()}</g>')
    return "\n".join(s)


def sprite():
    return f'''<svg xmlns="http://www.w3.org/2000/svg">
<!-- Fileteado porteño generado por tools/filete.py siguiendo data/guias/fileteado.md -->
<symbol id="letrero" viewBox="0 0 1180 600">
{letrero()}
</symbol>
<symbol id="esquina" viewBox="0 0 90 90">
{esquinero_banda()}
</symbol>
<symbol id="ramo" viewBox="0 0 236 136">
{ramo()}
</symbol>
<symbol id="cinta" viewBox="-4 0 532 90">
{cinta()}
</symbol>
<symbol id="llave" viewBox="0 0 600 60">
{llave()}
</symbol>
</svg>
'''


if __name__ == "__main__":
    salida = sys.argv[1] if len(sys.argv) > 1 else "public/filete.svg"
    with open(salida, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(sprite())
