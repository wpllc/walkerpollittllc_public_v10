"""Render the public landing and build the exact Cloudflare Pages output."""
import argparse
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RETIRED = re.compile(r"raven\s*forge\s*systems|ravenforgesystems|ravenforge\s+llc", re.I)
FILES = (
    "index.html", "about/index.html", "404.html", "ravenforge.json",
    "assets/site.css", "assets/council.jpg", "assets/muster.jpg", "assets/facility.jpg",
    "travel/index.html", "travel/editorial.css", "travel/mobile-office-hotspot.webp",
    "travel/stop-letting-your-laptop-eat-your-hotspot/index.html",
    "travel/finding-lodging-in-crowded-project-towns/index.html",
    "travel/project-town-lodging.jpg",
    "robots.txt", "sitemap.xml", "_headers", "_redirects", "_worker.js", "_routes.json",
)


def validate_html(page, name):
    if RETIRED.search(page):
        raise ValueError(f"Retired brand in {name}")
    ids = re.findall(r'\bid="([^"]+)"', page)
    if len(ids) != len(set(ids)):
        raise ValueError(f"Duplicate element IDs in {name}")
    for fragment in re.findall(r'href="#([^"]+)"', page):
        if fragment not in ids:
            raise ValueError(f"Missing anchor {fragment} in {name}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest_text = (ROOT / "content/ravenforge.json").read_text(encoding="utf-8")
    manifest = json.loads(manifest_text)
    if RETIRED.search(manifest_text):
        raise ValueError("Retired brand in the public product manifest")

    page = (ROOT / "templates/index.html").read_text(encoding="utf-8")
    page = page.replace("{{RAVENFORGE_SUMMARY}}", html.escape(manifest["landing_summary"]))
    credit = f'{manifest["name"]} software by {manifest["creator"]}'
    page = page.replace("{{RAVENFORGE_CREDIT}}", html.escape(credit))
    if re.search(r"\{\{[A-Z_]+\}\}", page):
        raise ValueError("Unresolved landing template field")
    validate_html(page, "index.html")
    for name in (path for path in FILES if path.endswith(".html") and path != "index.html"):
        validate_html((ROOT / name).read_text(encoding="utf-8"), name)
    for name, content in {"index.html": page, "ravenforge.json": manifest_text}.items():
        path = ROOT / name
        if args.check:
            if path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"Generated {name} needs rebuilding")
        else:
            path.write_text(content, encoding="utf-8", newline="\n")

    if not args.check:
        dist = ROOT / "dist"
        extra = {
            path.relative_to(dist).as_posix() for path in dist.rglob("*") if path.is_file()
        } - set(FILES)
        if extra:
            raise SystemExit(f"Unexpected files in dist: {', '.join(sorted(extra))}")
        for name in FILES:
            destination = dist / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / name, destination)
    print("PASS: public landing, product manifest, branding, anchors and release files")


if __name__ == "__main__":
    main()
