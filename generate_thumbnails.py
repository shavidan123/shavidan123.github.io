"""
Generate thumbnail images from the first page of publication PDFs.
Reads _publications/*.md for paperurl and thumbnail fields,
then renders page 1 of each PDF to images/thumbnail.

Usage:
    conda install pymupdf   # or: pip install pymupdf
    python generate_thumbnails.py
"""

import fitz  # PyMuPDF
import os
import glob
import re

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLICATIONS_DIR = os.path.join(SITE_DIR, "_publications")
IMAGES_DIR = os.path.join(SITE_DIR, "images")
FILES_DIR = os.path.join(SITE_DIR, "files")

DPI = 150  # resolution for thumbnails


def parse_frontmatter(filepath):
    """Extract YAML frontmatter fields from a markdown file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return {}

    fields = {}
    for line in match.group(1).splitlines():
        m = re.match(r"^(\w+)\s*:\s*['\"]?(.*?)['\"]?\s*$", line)
        if m:
            fields[m.group(1)] = m.group(2)
    return fields


def resolve_pdf_path(paperurl):
    """Turn a paperurl into a local file path if it's a local PDF."""
    if not paperurl:
        return None

    # Strip site URL prefix to get relative path
    for prefix in [
        "https://shavidan123.github.io/",
        "http://shavidan123.github.io/",
    ]:
        if paperurl.startswith(prefix):
            paperurl = paperurl[len(prefix):]
            break

    local_path = os.path.join(SITE_DIR, paperurl.replace("/", os.sep))
    if os.path.isfile(local_path):
        return local_path
    return None


def generate_thumbnail(pdf_path, output_path):
    """Render first page of a PDF to a PNG thumbnail."""
    doc = fitz.open(pdf_path)
    page = doc[0]
    mat = fitz.Matrix(DPI / 72, DPI / 72)
    pix = page.get_pixmap(matrix=mat)
    pix.save(output_path)
    doc.close()
    print(f"  -> {output_path}")


def main():
    os.makedirs(IMAGES_DIR, exist_ok=True)

    pub_files = glob.glob(os.path.join(PUBLICATIONS_DIR, "*.md"))
    if not pub_files:
        print("No publication files found in", PUBLICATIONS_DIR)
        return

    for pub_file in pub_files:
        fields = parse_frontmatter(pub_file)
        title = fields.get("title", os.path.basename(pub_file))
        thumbnail = fields.get("thumbnail")
        paperurl = fields.get("paperurl")

        if not thumbnail:
            print(f"Skipping '{title}': no thumbnail field")
            continue

        output_path = os.path.join(IMAGES_DIR, thumbnail)
        if os.path.exists(output_path):
            print(f"Skipping '{title}': {thumbnail} already exists")
            continue

        pdf_path = resolve_pdf_path(paperurl)
        if not pdf_path:
            print(f"Skipping '{title}': could not find local PDF for '{paperurl}'")
            continue

        print(f"Generating thumbnail for '{title}'...")
        generate_thumbnail(pdf_path, output_path)

    print("\nDone!")


if __name__ == "__main__":
    main()
