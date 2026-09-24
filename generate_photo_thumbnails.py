"""
Generate gallery thumbnails for the photos in images/photography/.

Every image directly inside images/photography/ gets a copy in
images/photography/thumbs/ (same filename, long edge 800px, EXIF/GPS stripped)
that the grid at /photography/ uses. The random photo on the home page and the
lightbox still use the originals. Existing thumbnails are skipped, so just
re-run this after dropping new photos into images/photography/.

Usage:
    pip install pillow
    python generate_photo_thumbnails.py
"""

import glob
import os

from PIL import Image, ImageOps

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
PHOTO_DIR = os.path.join(SITE_DIR, "images", "photography")
THUMB_DIR = os.path.join(PHOTO_DIR, "thumbs")

THUMB_EDGE = 800  # long edge in px (grid tiles are ~200-400px wide; 2x for retina)
EXTENSIONS = (".jpg", ".jpeg", ".png")


def make_thumbnail(src, dst):
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)  # bake in rotation before EXIF is dropped
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.thumbnail((THUMB_EDGE, THUMB_EDGE), Image.LANCZOS)
        if dst.lower().endswith(".png"):
            im.save(dst, "PNG", optimize=True)
        else:
            # no exif= argument, so all metadata (including GPS) is stripped
            im.save(dst, "JPEG", quality=84, optimize=True, progressive=True)
        return im.size


def main():
    os.makedirs(THUMB_DIR, exist_ok=True)
    photos = [
        p for p in sorted(glob.glob(os.path.join(PHOTO_DIR, "*")))
        if os.path.isfile(p) and p.lower().endswith(EXTENSIONS)
    ]
    if not photos:
        print("No photos found in", PHOTO_DIR)
        return

    made = 0
    for src in photos:
        name = os.path.basename(src)
        dst = os.path.join(THUMB_DIR, name)
        if os.path.exists(dst):
            continue
        w, h = make_thumbnail(src, dst)
        made += 1
        print("  %s -> thumbs/%s (%dx%d, %d KB)" % (name, name, w, h, os.path.getsize(dst) // 1024))

    print("\n%d thumbnail(s) generated, %d photos total." % (made, len(photos)))

    for t in sorted(os.listdir(THUMB_DIR)):
        if not os.path.exists(os.path.join(PHOTO_DIR, t)):
            print("note: thumbs/%s has no matching original (delete it if the photo was removed)" % t)


if __name__ == "__main__":
    main()
