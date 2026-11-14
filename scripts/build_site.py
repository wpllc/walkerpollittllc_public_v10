"""Render reviewed public copy and an allowlisted Cloudflare output."""
import argparse
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RETIRED = re.compile(r"raven\s*forge\s*systems|ravenforgesystems|ravenforge\s+llc", re.I)


def render():
    manifest = json.loads((ROOT / "content/ravenforge.json").read_text(encoding="utf-8"))
    template = (ROOT / "templates/index.html").read_text(encoding="utf-8")
    esc = html.escape
    cards = []
    for feature in manifest["features"]:
        cards.append(
            '<article class="bg-slate-900 p-4 rounded border border-slate-800">'
            f'<p class="text-[10px] text-emerald-400 font-mono mb-2">{esc(feature["status"])}</p>'
            f'<h3 class="text-sm font-semibold text-slate-200 mb-2">{esc(feature["name"])}</h3>'
            f'<p class="text-xs text-slate-400 leading-relaxed">{esc(feature["description"])}</p></article>'
        )
    replacements = {
        "RAVENFORGE_OWNERSHIP": esc(manifest["ownership"]),
        "RAVENFORGE_SUMMARY": esc(manifest["summary"]),
        "RAVENFORGE_FEATURES": "\n".join(cards),
        "RAVENFORGE_REVIEWED_ON": esc(manifest["reviewed_on"]),
        "RAVENFORGE_DEVELOPMENT_NOTE": esc(manifest["development_note"]),
    }
    for key, value in replacements.items():
        template = template.replace("{{" + key + "}}", value)
    if re.search(r"\{\{[A-Z_]+\}\}", template):
        raise ValueError("Unresolved template field")
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in {".git", "dist", "__pycache__"} for part in path.relative_to(ROOT).parts):
            continue
        if path.suffix not in {".html", ".json", ".md", ".xml", ".txt"}:
            continue
        if path.name == "index.html" and path.parent == ROOT:
            continue
        if RETIRED.search(path.read_text(encoding="utf-8")):
            raise ValueError(f"Retired brand found in {path.relative_to(ROOT)}")
    if RETIRED.search(template):
        raise ValueError("Retired brand found in rendered HTML")
    ids = re.findall(r'\bid="([^"]+)"', template)
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate element IDs")
    for fragment in re.findall(r'href="#([^"]+)"', template):
        if fragment not in ids:
            raise ValueError(f"Missing anchor: {fragment}")
    keys = set(re.findall(r'^\s*(\w+):\s*"https?://', template, re.M))
    for key in re.findall(r'data-href-key="([^"]+)"', template):
        if key not in keys:
            raise ValueError(f"Unresolved link key: {key}")
    return template


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    page = render()
    index = ROOT / "index.html"
    if args.check:
        if index.read_text(encoding="utf-8") != page:
            raise SystemExit("Generated index.html needs rebuilding")
        print("PASS: generated copy, branding, anchors, and link bindings")
        return
    index.write_text(page, encoding="utf-8", newline="\n")
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    for name in ("index.html", "robots.txt", "sitemap.xml", "_headers"):
        shutil.copy2(ROOT / name, dist / name)
    (dist / "ravenforge.json").write_text(
        (ROOT / "content/ravenforge.json").read_text(encoding="utf-8"), encoding="utf-8"
    )
    print("PASS: built index.html, public manifest, and allowlisted dist output")


if __name__ == "__main__":
    main()
