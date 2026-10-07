import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC = r"C:/Users/ignacio.gauna/Desktop/new-work-projects/compliance/compliance-fe/docs/Trailer - Complia"
OUT = os.path.join(SRC, "componentes")
FONT = r"C:/Users/IGNACI~1.GAU/AppData/Local/Temp/claude/c--Users-ignacio-gauna-Desktop-new-work-projects-compliance-compliance-fe/fd95c7b2-4df2-48d5-828c-f491a16e2c93/scratchpad/Inter.ttf"
os.makedirs(OUT, exist_ok=True)

BG_DARK = (2, 6, 23)        # #020617 fondo de página (slate-950)
BG_LIGHT = (248, 250, 252)  # #f8fafc
SURFACE = (10, 16, 34)      # #0a1022 superficie de tablas/menú


def src(name):
    return Image.open(os.path.join(SRC, name)).convert("RGBA")


def crop(name, box):
    return src(name).crop(box)


W, H = 1920, 1080


def place(img, bg=BG_DARK, max_scale=3.0, **_):
    """Componente centrado en un lienzo 16:9 del color de la app, con aire alrededor.

    Todas las referencias salen en 1920x1080 para que el modelo no las recorte
    al encuadrarlas: una tira de 4:1 recortada a 16:9 pierde los extremos."""
    s = min(max_scale, 0.86 * W / img.width, 0.78 * H / img.height)
    if s != 1:
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), bg + (255,))
    canvas.alpha_composite(img, ((W - img.width) // 2, (H - img.height) // 2))
    return canvas


def save(img, name):
    img.convert("RGB").save(os.path.join(OUT, name), optimize=True)
    print(f"{name:42s} {img.size}")


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


# Degradé de marca (marca.tsx): #22d3ee 0% -> #2563eb 55% -> #4f46e5 100%
C0, C1, C2 = (0x22, 0xD3, 0xEE), (0x25, 0x63, 0xEB), (0x4F, 0x46, 0xE5)


def brand(t):
    return lerp(C0, C1, t / 0.55) if t <= 0.55 else lerp(C1, C2, (t - 0.55) / 0.45)


def gradient_rect(w, h):
    """Degradé objectBoundingBox de (0,0) a (1,1): t = (u + v) / 2."""
    g = Image.new("RGBA", (w, h))
    px = g.load()
    for y in range(h):
        for x in range(w):
            t = ((x / max(w - 1, 1)) + (y / max(h - 1, 1))) / 2
            px[x, y] = brand(t) + (255,)
    return g


ANGULOS = [0, 30, 60, 90, 120, 150]
LARGO = [9.2, 6.6, 6.6, 9.2, 6.6, 6.6]


def glyph(size, escalas=(1,) * 6, nucleo=None, giro=0, ss=4):
    """El glifo de IconoComplia (viewBox 24) renderizado con supersampling."""
    S = size * ss
    k = S / 24
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    for ang, largo, esc in zip(ANGULOS, LARGO, escalas):
        w, h = round(1.9 * k), round(largo * 2 * k)
        petal = gradient_rect(w, h)
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=0.95 * k, fill=255)
        petal.putalpha(mask)
        if esc != 1:  # scaleY sobre el centro del pétalo, como el motion.g
            nh = max(2, round(h * esc))
            petal = petal.resize((w, nh), Image.LANCZOS)
        if esc != 1:
            op = 0.35 + esc * 0.65
            a = petal.getchannel("A").point(lambda v: round(v * op))
            petal.putalpha(a)
        rot = petal.rotate(-(ang + giro), resample=Image.BICUBIC, expand=True)
        canvas.alpha_composite(rot, ((S - rot.width) // 2, (S - rot.height) // 2))
    if nucleo:
        r = 1.5 * nucleo * k
        d = round(2 * r)
        dot = gradient_rect(d, d)
        m = Image.new("L", (d, d), 0)
        ImageDraw.Draw(m).ellipse([0, 0, d - 1, d - 1], fill=255)
        dot.putalpha(m)
        canvas.alpha_composite(dot, ((S - d) // 2, (S - d) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


# ---------------------------------------------------------------- marca
logo = glyph(1024)
logo.save(os.path.join(OUT, "01_logo_complia.png"), optimize=True)
print(f"{'01_logo_complia.png':42s} {logo.size} (transparente)")

CUADROS = [
    [1, 1, 1, 1, 1, 1],
    [1, 0.28, 0.28, 1, 0.28, 0.28],
    [0.18, 1, 0.18, 1, 0.18, 1],
    [0.12, 0.12, 0.12, 0.12, 0.12, 0.12],
    [1, 0.18, 1, 0.18, 1, 0.18],
    [0.3, 0.85, 0.3, 0.85, 0.3, 0.85],
    [0.7, 0.45, 0.7, 0.45, 0.7, 0.45],
    [0.92, 0.92, 0.92, 0.92, 0.92, 0.92],
]
cell, gap = 340, 70
sheet = Image.new("RGBA", (W, H), BG_DARK + (255,))
x0 = (W - (4 * cell + 3 * gap)) // 2
y0 = (H - (2 * cell + gap)) // 2
for i, c in enumerate(CUADROS):
    g = glyph(cell, escalas=c, nucleo=1.9 - c[0] * 0.9, giro=i * 30)
    sheet.alpha_composite(g, (x0 + (i % 4) * (cell + gap), y0 + (i // 4) * (cell + gap)))
save(sheet, "02_logo_pensando_secuencia.png")

# ---------------------------------------------------------------- bienvenida
save(place(crop("1.png", (285, 112, 1150, 438))), "03_hero_bienvenida_oscuro.png")
save(place(crop("7.png", (280, 108, 1145, 435)), bg=BG_LIGHT), "04_hero_bienvenida_claro.png")
save(place(crop("1.png", (498, 478, 940, 562))), "05_boton_ver_todo.png")

sol = crop("1.png", (1348, 10, 1422, 84)).resize((370, 370), Image.LANCZOS)
luna = crop("7.png", (1342, 4, 1418, 80)).resize((380, 380), Image.LANCZOS)
tog = Image.new("RGBA", (W, H), BG_DARK + (255,))
tog.paste(Image.new("RGBA", (W // 2, H), BG_LIGHT + (255,)), (W // 2, 0))
tog.alpha_composite(sol, (W // 4 - 185, H // 2 - 185))
tog.alpha_composite(luna, (3 * W // 4 - 190, H // 2 - 190))
save(tog, "06_toggle_tema_oscuro_claro.png")

save(place(crop("2.png", (0, 0, 1365, 110))), "07_input_chat.png")

# ---------------------------------------------------------------- menú de acciones
save(place(crop("3.png", (0, 0, 1347, 502))), "08_menu_acciones.png")
filas = {
    "09_menu_declaraciones.png": (8, 16, 1325, 112),
    "10_menu_formularios.png": (8, 110, 1325, 200),
    "11_menu_tests.png": (8, 199, 1325, 289),
    "12_menu_mensajes.png": (8, 288, 1325, 378),
    "13_menu_reportes.png": (8, 377, 1325, 462),
}
for nombre, box in filas.items():
    save(place(crop("3.png", box), bg=SURFACE), nombre)

save(place(crop("4.png", (0, 0, 1350, 640))), "14_modal_buscar_declaraciones.png")
save(place(crop("4.png", (1050, 556, 1335, 630)), bg=(15, 23, 42)), "15_boton_buscar.png")

# ---------------------------------------------------------------- conversación
# La burbuja real dice "dddd": se recrea con las clases de ConversacionComplia
# (rounded-2xl rounded-tr-md, to-br cyan-500 -> blue-600, 15px, px-4 py-2.5)
# a 3x CSS, y se le suma el avatar recortado de la captura.
K = 3
texto = "Mostrame las declaraciones en análisis"
font = ImageFont.truetype(FONT, 15 * K)
font.set_variation_by_axes([14, 400])
tw = round(font.getlength(texto))
bw, bh = tw + 2 * 16 * K, round(15 * 1.625 * K) + 2 * 10 * K
grad = Image.new("RGBA", (bw, bh))
gp = grad.load()
A, B = (0x06, 0xB6, 0xD4), (0x25, 0x63, 0xEB)
for y in range(bh):
    for x in range(bw):
        gp[x, y] = lerp(A, B, ((x / (bw - 1)) + (y / (bh - 1))) / 2) + (255,)
W4, H4, R = bw * 4, bh * 4, 16 * K * 4
mask = Image.new("L", (W4, H4), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, W4 - 1, H4 - 1], radius=R, fill=255)
chica = Image.new("L", (W4, H4), 0)
ImageDraw.Draw(chica).rounded_rectangle([0, 0, W4 - 1, H4 - 1], radius=6 * K * 4, fill=255)
mask.paste(chica.crop((W4 - R, 0, W4, R)), (W4 - R, 0))  # esquina sup. derecha: rounded-tr-md
grad.putalpha(mask.resize((bw, bh), Image.LANCZOS))
ImageDraw.Draw(grad).text((16 * K, bh // 2), texto, font=font, fill="white", anchor="lm")

avatar = crop("5.png", (1260, 10, 1312, 62))
avatar = avatar.resize((avatar.width * 2, avatar.height * 2), Image.LANCZOS)
gap_av = round(19 * 2)
cw, ch = bw + gap_av + avatar.width + 160, bh + 200
conv = Image.new("RGBA", (cw, ch), BG_DARK + (255,))
sombra = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
bx, by = 80, 100 - 12
ImageDraw.Draw(sombra).rounded_rectangle(
    [bx + 10, by + 22, bx + bw - 10, by + bh + 18], radius=16 * K, fill=(37, 99, 235, 70)
)
conv.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(28)))
conv.alpha_composite(grad, (bx, by))
conv.alpha_composite(avatar, (bx + bw + gap_av, by))
save(place(conv, max_scale=1.2), "16_burbuja_consulta_usuario.png")

save(place(crop("5.png", (40, 120, 430, 170))), "17_estado_buscando.png")
save(place(crop("6.png", (0, 0, 359, 478))), "18_sidebar_historial.png")
save(place(crop("6.png", (4, 80, 354, 150))), "19_boton_nueva_consulta.png")

# ---------------------------------------------------------------- resultados
kpis = {
    "20_kpi_encontradas.png": (16, 4, 318, 138),
    "21_kpi_en_analisis.png": (321, 4, 623, 138),
    "22_kpi_procesadas.png": (627, 4, 929, 138),
    "23_kpi_con_actualizaciones.png": (932, 4, 1234, 138),
}
for nombre, box in kpis.items():
    save(place(crop("8.png", box)), nombre)

save(place(crop("8.png", (16, 150, 1234, 505))), "24_tabla_declaraciones.png")

chips = [
    crop("8.png", (550, 241, 698, 277)),     # En análisis
    crop("10.png", (523, 342, 847, 380)),    # Actualización + En análisis
    crop("10.png", (523, 247, 698, 284)),    # Sin conflictos
    crop("10.png", (523, 54, 794, 92)),      # Con conflictos · con plan
]
chips = [c.resize((c.width * 3, c.height * 3), Image.LANCZOS) for c in chips]
sep = 60
cw = max(c.width for c in chips) + 240
ch = sum(c.height for c in chips) + sep * (len(chips) + 1)
hoja = Image.new("RGBA", (cw, ch), SURFACE + (255,))
y = sep
for c in chips:
    hoja.alpha_composite(c, ((cw - c.width) // 2, y))
    y += c.height + sep
save(place(hoja, bg=SURFACE, max_scale=1.2), "25_chips_estado.png")

save(place(crop("10.png", (0, 500, 1205, 582))), "26_barra_acciones_tabla.png")

# ---------------------------------------------------------------- planilla
# La fila 6 trae nombre y email de una persona real: se reemplazan las celdas
# B-D por las de la fila 7 (datos de ejemplo) antes de publicar la pieza.
plan = src("9.png")
fila7 = plan.crop((475, 547, 1357, 589))
plan.paste(fila7, (475, 502))
save(place(plan, scale=1.25), "27_planilla_excel.png")
save(place(crop("9.png", (1600, 6, 1892, 74))), "28_boton_descargar_excel.png")
