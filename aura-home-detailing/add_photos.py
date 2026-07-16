#!/usr/bin/env python3
"""Insert real open-source photos (Unsplash) into every image slot.
The .viz texture stays behind each photo as a graceful fallback for
environments where external images are blocked (e.g. the preview link)."""
import re, pathlib

ROOT = pathlib.Path(__file__).parent
FILES = sorted(p for p in ROOT.glob("*.html") if p.name != "aura-single.html")

U = "https://images.unsplash.com/photo-{}?q=80&w={}&auto=format&fit=crop"

# curated interior / architecture / lab photo IDs by material theme
PHOTOS = {
    "viz-marble":  ["1600566752355-35792bedcfea", "1600585154340-be6161a56a0c", "1584622650111-993a426fbf0a"],
    "viz-onyx":    ["1600210492486-724fe5c67fb0", "1600607687920-4e2a09cf159d"],
    "viz-stone":   ["1600585152220-90363fe7e115", "1556911220-e15b29be8c8f"],
    "viz-wood":    ["1591825729269-caeb344f6df2", "1618219908412-a29a1bb7b86e", "1600585154526-990dced4db0d"],
    "viz-lab":     ["1532187863486-abf9dbad1b69", "1616401784845-180882ba9ba8", "1631815588090-d4bfec5b1ccb"],
    "viz-leather": ["1550254478-ead40cc54513"],
    "viz-textile": ["1600166898405-da9535204843"],
    "viz-forest":  ["1600607687939-ce8a6c25118c", "1600585154526-990dced4db0d"],
    "viz-emerald": ["1600607687644-c7171b42498f"],
    "viz-gold":    ["1600566753190-17f0baa2a6c3"],
    "viz-champagne": ["1600210492493-0946911123ea"],
}

# per-page hero photos
HERO = {
    "index.html":               "1600607687939-ce8a6c25118c",
    "about.html":               "1600210492486-724fe5c67fb0",
    "production.html":          "1616401784845-180882ba9ba8",
    "services.html":            "1600607688969-a5bfcd646154",
    "portfolio.html":           "1600585154340-be6161a56a0c",
    "pricing.html":             "1600607687920-4e2a09cf159d",
    "partners.html":            "1600585154526-990dced4db0d",
    "cabinet.html":             "1600566753190-17f0baa2a6c3",
    "blog.html":                "1532187863486-abf9dbad1b69",
    "contacts.html":            "1600566753086-00f18fb6b3ea",
    "case-stone-rublevka.html": "1600566752355-35792bedcfea",
    "case-wood-barvikha.html":  "1591825729269-caeb344f6df2",
    "case-full-novorizhskoe.html": "1600607687939-ce8a6c25118c",
    "blog-himiya-vs-klining.html": "1584622650111-993a426fbf0a",
    "blog-uhod-za-parketom.html":  "1618219908412-a29a1bb7b86e",
    "blog-sertifikaty-testy.html": "1532187863486-abf9dbad1b69",
    "blog-oshibki-uhoda.html":     "1556911220-e15b29be8c8f",
}

TEAM = ["1560250097-0b93528c311a", "1573496359142-b8d87734a5a2",
        "1472099645785-5658abf4ff4e", "1580489944761-15a19d654956"]

counters = {}
def next_photo(viz):
    pool = PHOTOS.get(viz, PHOTOS["viz-onyx"])
    i = counters.get(viz, 0)
    counters[viz] = i + 1
    return pool[i % len(pool)]

def transform(name, html):
    global counters
    counters = {}
    team_i = [0]

    # 1) .ph tiles that currently have a viz class and no <img>
    def ph_repl(m):
        cls = m.group(1)
        vm = re.search(r'(viz-[a-z]+)', cls)
        viz = vm.group(1) if vm else "viz-onyx"
        if "team" in name:  # unused branch, kept simple
            pid = TEAM[team_i[0] % len(TEAM)]; team_i[0] += 1
        else:
            pid = next_photo(viz)
        url = U.format(pid, 1200)
        return f'<div class="{cls}"><img src="{url}" alt="" loading="lazy"></div>'
    html = re.sub(r'<div class="(ph[^"]*viz[^"]*)"\s*>\s*</div>', ph_repl, html)

    # 2) page-hero-bg / hero-bg / cta-banner-bg photo layers
    hero_id = HERO.get(name, "1600607687939-ce8a6c25118c")
    hero_url = U.format(hero_id, 2000)
    html = html.replace('<div class="page-hero-bg"></div>',
                        f'<div class="page-hero-bg"><img src="{hero_url}" alt="" loading="eager"></div>')
    html = html.replace('<div class="hero-bg"></div>',
                        f'<div class="hero-bg"><img src="{hero_url}" alt="" loading="eager"></div>')
    cta_url = U.format("1600566753190-17f0baa2a6c3", 2000)
    html = html.replace('<div class="cta-banner-bg"></div>',
                        f'<div class="cta-banner-bg"><img src="{cta_url}" alt="" loading="lazy"></div>')

    # 3) video block cover
    html = html.replace('class="reveal video-block viz viz-forest" data-video>',
                        f'class="reveal video-block" data-video><img src="{U.format("1600607687939-ce8a6c25118c",1600)}" alt="" loading="lazy">')
    return html

for f in FILES:
    src = f.read_text(encoding="utf-8")
    out = transform(f.name, src)
    n = out.count("images.unsplash")
    f.write_text(out, encoding="utf-8")
    print(f"{f.name}: {n} photos wired")
