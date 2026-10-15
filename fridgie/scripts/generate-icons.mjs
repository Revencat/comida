// ─── Generación de iconos de FRIDGIE (PWA + Android + iOS) ──────────────────
// Dibuja el icono vectorial "fridge-arch" (símbolo propio de FRIDGIE: arco de
// nevera verde sobre fondo blanco, con hoja y punto de mango) y lo rasteriza a
// todos los tamaños declarados en public/manifest.webmanifest.
//
// Uso:  node scripts/generate-icons.mjs
// Requiere: Pillow (pip install pillow). Los PNG generados se commitean en
// public/icons para que el build de producción no dependa de Python.

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');

const SIZES = [32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

const python = `
import sys, json
from PIL import Image, ImageDraw

sizes = json.loads(sys.argv[1])
outdir = sys.argv[2]

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

GREEN   = (47, 168, 96)     # #2fa860
DARK    = (29, 122, 65)     # #1d7a41
LEAFBG  = (234, 247, 239)   # #eaf7ef
WHITE   = (255, 255, 255)

for s in sizes:
    ss = s * 4  # supersampling x4
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Fondo blanco con esquinas redondeadas (radio 112/512)
    radius = int(ss * 112 / 512)
    d.rounded_rectangle([0, 0, ss - 1, ss - 1], radius=radius, fill=WHITE + (255,))

    def U(v):  # coordenadas del viewBox 512 -> supersampled
        return v * ss / 512.0

    # Arco de nevera: rectangulo + semicerro superior
    top = U(216); left = U(120); right = U(392); bottom = U(432)
    cx = (left + right) / 2
    r = (right - left) / 2
    d.rectangle([left, top, right, bottom], fill=GREEN)
    d.pieslice([left, top - r, right, top + r], 180, 360, fill=GREEN)

    # Linea de puerta
    d.rectangle([left, U(300), right, U(318)], fill=WHITE)
    # Mango
    d.rounded_rectangle([U(330), U(238), U(350), U(282)], radius=U(10), fill=WHITE)
    # Hoja simplificada (dos cuartos superpuestos)
    lx, ly, lr = U(214), U(204), U(46)
    d.pieslice([lx, ly, lx + 2*lr, ly + 2*lr], 0, 90, fill=LEAFBG)
    d.polygon([(lx+lr, ly), (lx+lr, ly+lr), (lx, ly+lr)], fill=LEAFBG)
    d.ellipse([lx+lr-U(4), ly+lr-U(4), lx+lr+U(4), ly+lr+U(4)], fill=DARK)

    out = img.resize((s, s), Image.LANCZOS)
    out.save(f"{outdir}/icon-{s}.png")

# apple-touch-icon: 180px sin transparentar (iOS la rellena mal si hay alpha)
img = None  # regenerar 180 con fondo solido
print("ok")
`;

execFileSync('python3', ['-c', python, JSON.stringify([...SIZES, 180]), outDir]);

// apple-touch-icon.png = versión de 180px (iOS no admite transparencias fiables)
writeFileSync(join(outDir, 'apple-touch-icon.png'), readFileSync(join(outDir, 'icon-180.png')));
console.log(`✔ Iconos generados en public/icons: ${SIZES.join(', ')} px + apple-touch-icon (180)`);
