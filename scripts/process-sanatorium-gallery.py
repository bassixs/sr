from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageOps


SLUGS = {
    "бассейн": "pool",
    "библиотека и зона ручных работ": "library",
    "бильярдная": "billiards",
    "зал мероприятий": "event-hall",
    "игровая": "playroom",
    "кинозал": "cinema",
    "комната психолога": "psychologist",
    "лфк": "exercise-therapy",
    "массаж": "massage",
    "медпункт": "medical-room",
    "минеральная вода": "mineral-water",
    "настольный теннис": "table-tennis",
    "столовая": "dining-room",
    "территория": "grounds",
    "фитосауна": "phyto-sauna",
    "фое": "lobby",
}

DISPLAY_TITLES = {
    "бассейн": "Бассейн",
    "библиотека и зона ручных работ": "Библиотека и зона творчества",
    "бильярдная": "Бильярдная",
    "зал мероприятий": "Зал мероприятий",
    "игровая": "Игровая комната",
    "кинозал": "Кинозал",
    "комната психолога": "Кабинет психолога",
    "лфк": "Зал ЛФК",
    "массаж": "Массажный кабинет",
    "медпункт": "Медицинский кабинет",
    "минеральная вода": "Минеральная вода",
    "настольный теннис": "Настольный теннис",
    "столовая": "Столовая",
    "территория": "Территория",
    "фитосауна": "Фитосауна",
    "фое": "Фойе",
}


def category_slug(name: str) -> str:
    key = name.casefold().strip()
    if key.startswith("комната ") and key.split()[-1].isdigit():
        return f"room-{key.split()[-1]}"
    match = re.match(r"процедуры+\s+(\d+)$", key)
    if match:
        return f"procedure-{match.group(1)}"
    return SLUGS.get(key, re.sub(r"[^a-z0-9]+", "-", key).strip("-") or "gallery")


def category_title(name: str) -> str:
    key = name.casefold().strip()
    if key.startswith("комната ") and key.split()[-1].isdigit():
        return f"Номера — подборка {key.split()[-1]}"
    match = re.match(r"процедуры+\s+(\d+)$", key)
    if match:
        return f"Лечебные кабинеты — подборка {match.group(1)}"
    return DISPLAY_TITLES.get(key, name)


def fit(image: Image.Image, max_edge: int) -> Image.Image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    return image


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare the sanatorium photo library for the website.")
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/media/gallery"))
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not source.is_dir():
        raise SystemExit(f"Source directory does not exist: {source}")

    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    manifest: list[dict[str, object]] = []
    for folder in sorted((item for item in source.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
        files = sorted(folder.glob("*.jpg"))
        if not files:
            continue
        slug = category_slug(folder.name)
        target = output / slug
        target.mkdir()
        images = []
        for index, file in enumerate(files, 1):
            name = f"{index:02d}.webp"
            thumb_name = f"{index:02d}-thumb.webp"
            with Image.open(file) as original:
                full = fit(original.copy(), 1920)
                thumb = fit(original.copy(), 720)
                full.save(target / name, "WEBP", quality=84, method=4)
                thumb.save(target / thumb_name, "WEBP", quality=76, method=4)
                images.append({
                    "src": f"/media/gallery/{slug}/{name}",
                    "thumb": f"/media/gallery/{slug}/{thumb_name}",
                    "width": full.width,
                    "height": full.height,
                })
        manifest.append({"id": slug, "title": category_title(folder.name), "images": images})

    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Prepared {sum(len(item['images']) for item in manifest)} images in {len(manifest)} categories")


if __name__ == "__main__":
    main()
