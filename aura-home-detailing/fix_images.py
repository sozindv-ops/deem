#!/usr/bin/env python3
"""Replace all external <img> references with self-contained CSS material tiles,
and swap hero/cta photo backgrounds for generated scene layers."""
import re, pathlib, hashlib

ROOT = pathlib.Path(__file__).parent
FILES = sorted(p for p in ROOT.glob("*.html") if p.name != "aura-single.html")

VIZ_CYCLE = ["viz-onyx","viz-marble","viz-wood","viz-lab","viz-stone",
             "viz-leather","viz-textile","viz-emerald","viz-forest"]

KEYWORDS = [
    (("мрамор","камен","stone","marble","травертин","гранит","онекс","оникс"), "viz-marble"),
    (("паркет","дерев","wood","дуба","массив","мебел"), "viz-wood"),
    (("лаборатор","хими","состав","формул","тест","сертификат","r&d","производ"), "viz-lab"),
    (("кож","leather"), "viz-leather"),
    (("текстиль","ковр","textile","штор","обивк"), "viz-textile"),
    (("кухн","ванн","санузл","bath","kitchen","душев"), "viz-stone"),
    (("фасад","окн","остеклен","glass","витраж"), "viz-stone"),
    (("лес","forest","загородн","дом ","особняк","резиденц","коттедж"), "viz-forest"),
    (("карт","зоны","map"), "viz-onyx"),
]

def pick_viz(text, idx):
    low = text.lower()
    for keys, viz in KEYWORDS:
        if any(k in low for k in keys):
            return viz
    return VIZ_CYCLE[idx % len(VIZ_CYCLE)]

def transform(html: str) -> str:
    counter = {"i": 0}

    # 1) before/after blocks: two <img> -> two viz divs
    def ba_repl(m):
        block = m.group(0)
        # first img (no class) = "before" (dull), second (ba-after) = after
        block = re.sub(
            r'<img(?![^>]*ba-after)[^>]*alt="([^"]*)"[^>]*>',
            lambda im: f'<div class="viz {pick_viz(im.group(1),0)} dull"></div>',
            block, count=1)
        block = re.sub(
            r'<img[^>]*class="ba-after"[^>]*alt="([^"]*)"[^>]*>',
            lambda im: f'<div class="ba-after viz {pick_viz(im.group(1),1)}"></div>',
            block, count=1)
        return block
    html = re.sub(r'<div class="ba">.*?</div>\s*(?=<div class="ba-handle")',
                  ba_repl, html, flags=re.S)

    # 2) generic .ph blocks containing a single <img>
    def ph_repl(m):
        cls, rest_attrs, img = m.group(1), m.group(2), m.group(3)
        alt = ""
        a = re.search(r'alt="([^"]*)"', img)
        if a: alt = a.group(1)
        if not alt:
            s = re.search(r'src="([^"]*)"', img)
            alt = s.group(1) if s else ""
        viz = pick_viz(alt, counter["i"]); counter["i"] += 1
        return f'<div class="ph{cls} viz {viz}"{rest_attrs}></div>'
    html = re.sub(
        r'<div class="ph([^"]*)"((?:\s+[a-zA-Z-]+="[^"]*")*)>\s*(<img\b[^>]*>)\s*</div>',
        ph_repl, html)

    # 3) hero / page-hero / cta-banner section backgrounds
    def section_repl(m):
        cls = m.group(1)
        style = m.group(2) or ""
        # strip the --img:url(...) declaration, keep any other style
        style = re.sub(r"--img:url\('[^']*'\)\s*;?\s*", "", style).strip().strip(";").strip()
        style_attr = f' style="{style}"' if style else ""
        bg = ""
        if "page-hero" in cls:
            bg = '\n  <div class="page-hero-bg"></div>'
        elif "cta-banner" in cls:
            bg = '\n  <div class="cta-banner-bg"></div>'
        # hero already carries its own <div class="hero-bg"></div>
        return f'<section class="{cls}"{style_attr}>{bg}'
    html = re.sub(
        r'<section class="([^"]*(?:hero|cta-banner)[^"]*)"(?:\s+style="([^"]*)")?>',
        section_repl, html)

    # 4) any stray <img> left (safety) -> viz tile
    html = re.sub(r'<img\b[^>]*>', '<div class="viz viz-onyx" style="aspect-ratio:4/3"></div>', html)

    return html

for f in FILES:
    src = f.read_text(encoding="utf-8")
    out = transform(src)
    f.write_text(out, encoding="utf-8")
    print(f"fixed {f.name}: {src.count('unsplash')} -> {out.count('unsplash')} unsplash refs")
