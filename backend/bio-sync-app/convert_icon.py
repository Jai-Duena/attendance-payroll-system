"""
convert_icon.py
---------------
Run ONCE before building the .exe:
    python convert_icon.py

Reads the company logo from the backend uploads folder, copies it to
assets/logo.png, and generates assets/icon.ico (multi-size) using Pillow.
"""
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow is required.  Run:  pip install Pillow")
    sys.exit(1)

# Source logo — adjust this path if you move the project
SRC_LOGO = Path(r'C:\xampp\htdocs\backend\uploads\company\logo.png')

# Output paths (relative to this script's directory)
HERE     = Path(__file__).parent
ASSETS   = HERE / 'assets'
DST_LOGO = ASSETS / 'logo.png'
DST_ICO  = ASSETS / 'icon.ico'

ASSETS.mkdir(exist_ok=True)

if not SRC_LOGO.exists():
    print(f"ERROR: Source logo not found at {SRC_LOGO}")
    print("Please copy your logo.png to  bio-sync-app/assets/logo.png  manually,")
    print("then run:   python convert_icon.py  again.")
    sys.exit(1)

# Load and convert
img = Image.open(SRC_LOGO).convert('RGBA')

# Copy logo.png
img.save(DST_LOGO)
print(f"  logo.png  →  {DST_LOGO}")

# Build ICO with all standard sizes
SIZES = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]

def _resize(im: Image.Image, size: tuple) -> Image.Image:
    # Fit into a square bounding box with transparent padding
    im = im.copy()
    im.thumbnail(size, Image.LANCZOS)
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    offset = ((size[0] - im.width) // 2, (size[1] - im.height) // 2)
    canvas.paste(im, offset, im)
    return canvas

frames = [_resize(img, s) for s in SIZES]
frames[0].save(
    DST_ICO,
    format='ICO',
    sizes=SIZES,
    append_images=frames[1:],
)
print(f"  icon.ico  →  {DST_ICO}")
print("Done.")
