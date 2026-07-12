from __future__ import annotations

import argparse
import io
from pathlib import Path

import pdfplumber
from pdf2image import convert_from_path
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild a scanned PDF with optimized page images.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--dpi", type=int, default=150)
    parser.add_argument("--quality", type=int, default=80)
    parser.add_argument("--poppler-path", type=Path, required=True)
    args = parser.parse_args()

    with pdfplumber.open(args.input) as document:
        page_sizes = [(float(page.width), float(page.height)) for page in document.pages]

    rendered = convert_from_path(
        args.input,
        dpi=args.dpi,
        fmt="jpeg",
        jpegopt={"quality": args.quality, "optimize": True, "progressive": True},
        poppler_path=str(args.poppler_path),
        thread_count=2,
    )
    if len(rendered) != len(page_sizes):
        raise SystemExit("Rendered page count does not match the source PDF")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(args.output), pageCompression=1)
    for image, (width, height) in zip(rendered, page_sizes, strict=True):
        buffer = io.BytesIO()
        image.convert("RGB").save(buffer, "JPEG", quality=args.quality, optimize=True, progressive=True)
        buffer.seek(0)
        pdf.setPageSize((width, height))
        pdf.drawImage(ImageReader(buffer), 0, 0, width=width, height=height, preserveAspectRatio=False)
        pdf.showPage()
    pdf.save()
    print(f"Rebuilt {len(rendered)} pages at {args.dpi} DPI")


if __name__ == "__main__":
    main()
