"""Credit Care icon: a shield with a score gauge and a check mark."""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
ICONS = ROOT / "icons"
ICONS.mkdir(exist_ok=True)
S = 1024

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient(size, top, bot):
    img = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        d.line([(0, y), (size, y)], fill=lerp(top, bot, y / (size - 1)) + (255,))
    return img

def shield_pts(cx, top, w, h):
    pts = []
    # top edge with gentle dip, sides, then curve to point
    left, right = cx - w / 2, cx + w / 2
    pts.append((left, top + h * 0.10))
    for i in range(21):
        t = i / 20
        x = left + (right - left) * t
        y = top + h * 0.10 - math.sin(math.pi * t) * h * 0.06 + (abs(t - 0.5) * 0) 
        pts.append((x, y))
    pts.append((right, top + h * 0.10))
    for i in range(1, 31):
        t = i / 30
        x = right - (w / 2) * (t ** 1.6)
        y = top + h * 0.10 + (h * 0.90) * math.sin(t * math.pi / 2)
        pts.append((x, y))
    for i in range(29, 0, -1):
        t = i / 30
        x = left + (w / 2) * (t ** 1.6)
        y = top + h * 0.10 + (h * 0.90) * math.sin(t * math.pi / 2)
        pts.append((x, y))
    return pts

def draw(size_full=S, maskable=False):
    s = size_full
    bg = gradient(s, (11, 61, 74), (6, 28, 44))
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    mask = Image.new("L", (s, s), 0)
    r = 0 if maskable else int(s * 0.22)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=r, fill=255)
    out.paste(bg, (0, 0), mask)
    sc = 0.80 if maskable else 1.0
    cx = s / 2
    w, h = s * 0.66 * sc, s * 0.76 * sc
    top = (s - h) / 2 + s * 0.01
    pts = shield_pts(cx, top, w, h)
    # shadow
    sh = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(sh).polygon([(x, y + s * 0.02) for x, y in pts], fill=(0, 0, 0, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(s * 0.02))
    out = Image.alpha_composite(out, sh)
    # shield body gradient
    body = gradient(s, (32, 201, 151), (12, 128, 104))
    m2 = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m2).polygon(pts, fill=255)
    out.paste(body, (0, 0), m2)
    # inner shield
    inner = shield_pts(cx, top + h * 0.06, w * 0.84, h * 0.86)
    m3 = Image.new("L", (s, s), 0)
    ImageDraw.Draw(m3).polygon(inner, fill=255)
    out.paste(gradient(s, (9, 52, 66), (5, 30, 44)), (0, 0), m3)
    d = ImageDraw.Draw(out)
    # gauge arc
    gcx, gcy = cx, top + h * 0.52
    R = w * 0.30
    wd = int(s * 0.055 * sc)
    box = (gcx - R, gcy - R, gcx + R, gcy + R)
    segs = [((231, 76, 60), 180, 216), ((243, 156, 18), 216, 252), ((241, 196, 15), 252, 288), ((46, 204, 113), 288, 360)]
    for col, a0, a1 in segs:
        d.arc(box, a0 + 1.5, a1 - 1.5, fill=col + (255,), width=wd)
    # needle toward green (~ 320 deg)
    ang = math.radians(322)
    nx, ny = gcx + math.cos(ang) * R * 0.86, gcy + math.sin(ang) * R * 0.86
    d.line([(gcx, gcy), (nx, ny)], fill=(255, 255, 255, 255), width=int(s * 0.026 * sc))
    hub = s * 0.035 * sc
    d.ellipse((gcx - hub, gcy - hub, gcx + hub, gcy + hub), fill=(255, 255, 255, 255))
    # check mark below
    ck = [(cx - w * 0.15, top + h * 0.70), (cx - w * 0.03, top + h * 0.80), (cx + w * 0.17, top + h * 0.61)]
    d.line(ck, fill=(46, 204, 113, 255), width=int(s * 0.05 * sc), joint="curve")
    for p in (ck[0], ck[2]):
        rr = s * 0.025 * sc
        d.ellipse((p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr), fill=(46, 204, 113, 255))
    return out

full = draw()
mask = draw(maskable=True)
for n in (512, 192):
    full.resize((n, n), Image.LANCZOS).save(ICONS / f"icon-{n}.png")
mask.resize((512, 512), Image.LANCZOS).save(ICONS / "maskable-512.png")
full.resize((180, 180), Image.LANCZOS).save(ICONS / "apple-touch-icon.png")
full.resize((64, 64), Image.LANCZOS).save(ICONS / "favicon.png")
full.resize((256, 256), Image.LANCZOS).save(ROOT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
full.resize((512, 512), Image.LANCZOS).save(ROOT / "icon-512.png")
print("ok")
