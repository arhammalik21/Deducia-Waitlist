from pathlib import Path

from PIL import Image

SRC = Path(r"c:\Users\heela\.cursor\projects\c-Users-heela-ai-career-os\assets\c__Users_heela_Downloads_Glossy_Blue_J-B_Monogram_Icon.png")
if not SRC.exists():
    SRC = Path(r"c:\Users\heela\ai-career-os\public\assets\logo.png")

img = Image.open(SRC).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        mx = max(r, g, b)
        is_blueish = b > 40 and b >= r - 5 and b >= g - 5
        if mx < 28 and not is_blueish:
            pixels[x, y] = (0, 0, 0, 0)
        elif mx < 55 and not is_blueish:
            alpha = int(a * (mx / 55.0))
            pixels[x, y] = (r, g, b, alpha)
        elif r < 40 and g < 40 and b < 50 and not (b > r + 10):
            pixels[x, y] = (0, 0, 0, 0)

bbox = img.getbbox()
if bbox:
    pad = 8
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(w, bbox[2] + pad)
    bottom = min(h, bbox[3] + pad)
    cropped = img.crop((left, top, right, bottom))
else:
    cropped = img

side = max(cropped.size)
out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - cropped.size[0]) // 2
oy = (side - cropped.size[1]) // 2
out.paste(cropped, (ox, oy), cropped)

targets = [
    Path(r"c:\Users\heela\ai-career-os\public\assets\logo.png"),
    Path(r"c:\Users\heela\ai-career-os\landing\assets\logo.png"),
    Path(r"c:\Users\heela\ai-career-os\src\app\icon.png"),
    Path(r"c:\Users\heela\ai-career-os\public\favicon.png"),
]
for t in targets:
    t.parent.mkdir(parents=True, exist_ok=True)
    out.save(t, "PNG")
    print(f"wrote {t} {out.size}")
