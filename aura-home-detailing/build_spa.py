#!/usr/bin/env python3
"""Merge the multi-page AURA site into one self-contained single-file SPA."""
import re, pathlib, base64, mimetypes

ROOT = pathlib.Path(__file__).parent

PAGES = [
    ("index.html", "home", "Главная"),
    ("about.html", "about", "О компании"),
    ("production.html", "production", "Производство"),
    ("services.html", "services", "Услуги"),
    ("portfolio.html", "portfolio", "Портфолио"),
    ("pricing.html", "pricing", "Цены"),
    ("partners.html", "partners", "Партнёрам"),
    ("cabinet.html", "cabinet", "Кабинет"),
    ("blog.html", "blog", "Блог"),
    ("contacts.html", "contacts", "Контакты"),
    ("case-stone-rublevka.html", "case-stone-rublevka", "Портфолио"),
    ("case-wood-barvikha.html", "case-wood-barvikha", "Портфолио"),
    ("case-full-novorizhskoe.html", "case-full-novorizhskoe", "Портфолио"),
    ("blog-himiya-vs-klining.html", "blog-himiya-vs-klining", "Блог"),
    ("blog-uhod-za-parketom.html", "blog-uhod-za-parketom", "Блог"),
    ("blog-sertifikaty-testy.html", "blog-sertifikaty-testy", "Блог"),
    ("blog-oshibki-uhoda.html", "blog-oshibki-uhoda", "Блог"),
]
SLUG_BY_FILE = {f: s for f, s, _ in PAGES}
NAV_BY_SLUG = {s: n for _, s, n in PAGES}

MOBILE_MENU_MARKER_START = '<div class="mobile-menu">'
FOOTER_MARKER = '<footer class="footer">'

_IMG_CACHE = {}
def inline_local_images(html: str) -> str:
    """Replace src="images/xxx.jpg" with an embedded base64 data URI so the
    single-file build stays self-contained (needed for Artifact publishing,
    which only ships the one file)."""
    def repl(m):
        rel = m.group(1)
        if rel not in _IMG_CACHE:
            fp = ROOT / "images" / rel
            if not fp.is_file():
                return m.group(0)
            mime = mimetypes.guess_type(fp.name)[0] or "image/jpeg"
            b64 = base64.b64encode(fp.read_bytes()).decode("ascii")
            _IMG_CACHE[rel] = f'src="data:{mime};base64,{b64}"'
        return _IMG_CACHE[rel]
    return re.sub(r'src="images/([a-zA-Z0-9_.-]+)"', repl, html)

def extract_fragment(html: str) -> str:
    start = html.index(MOBILE_MENU_MARKER_START)
    # mobile menu block is always closed right before the next top-level <section
    menu_close = html.index("\n</div>\n", start) + len("\n</div>\n")
    end = html.index(FOOTER_MARKER)
    return html[menu_close:end].strip()

LINK_RE = re.compile(r'href="([a-zA-Z0-9_-]+)\.html(#[a-zA-Z0-9_-]+)?"')

def fix_links(fragment: str) -> str:
    def repl(m):
        fname = m.group(1) + ".html"
        frag = m.group(2)
        if fname == "pricing.html" and frag == "#club":
            return 'href="#pricing-club"'
        if frag:
            return f'href="{frag}"'
        slug = SLUG_BY_FILE.get(fname)
        if slug:
            return f'href="#{slug}"'
        return m.group(0)
    return LINK_RE.sub(repl, fragment)

sections = []
for fname, slug, _navlabel in PAGES:
    html = (ROOT / fname).read_text(encoding="utf-8")
    frag = extract_fragment(html)
    frag = fix_links(frag)
    frag = inline_local_images(frag)
    if fname == "pricing.html":
        frag = frag.replace('class="price-card" id="club"', 'class="price-card" id="pricing-club"')
    sections.append(
        f'<section class="page-section" id="pg-{slug}" data-nav="{slug}" hidden>\n{frag}\n</section>'
    )

nav_html = (ROOT / "index.html").read_text(encoding="utf-8")
header_start = nav_html.index('<header class="nav">')
header_end = nav_html.index(MOBILE_MENU_MARKER_START)
header_block = nav_html[header_start:header_end]
header_block = fix_links(header_block)

menu_start = nav_html.index(MOBILE_MENU_MARKER_START)
menu_end = nav_html.index("\n</div>\n", menu_start) + len("\n</div>\n")
menu_block = nav_html[menu_start:menu_end]
menu_block = fix_links(menu_block)

footer_start = nav_html.index(FOOTER_MARKER)
footer_end = nav_html.index("</footer>") + len("</footer>")
footer_block = nav_html[footer_start:footer_end]
footer_block = fix_links(footer_block)

css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
js = (ROOT / "js" / "main.js").read_text(encoding="utf-8")

router_js = """
/* ---- SPA router (added for single-file build) ---- */
(function(){
  var SLUGS = %s;
  function labelFor(slug){ return (SLUGS[slug] || 'Главная'); }
  function activateNav(navSlug){
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function(a){
      var h = a.getAttribute('href') || '';
      var s = h === '#home' ? 'home' : h.replace(/^#/, '');
      a.classList.toggle('active', s === navSlug);
    });
  }
  function animateCountersIn(scope){
    scope.querySelectorAll('[data-count]').forEach(function(el){
      if (el.dataset.done) return;
      el.dataset.done = '1';
      var target = parseFloat(el.dataset.count);
      var decimals = (el.dataset.count.split('.')[1] || '').length;
      var suffix = el.dataset.suffix || '';
      var dur = 1400, start = performance.now();
      function step(now){
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = target * eased;
        el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('ru-RU')) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  function showPage(hash){
    var raw = (hash || '').replace(/^#/, '') || 'home';
    var targetId = null, scrollId = null;
    if (document.getElementById('pg-' + raw)) {
      targetId = 'pg-' + raw;
    } else {
      var el = document.getElementById(raw);
      if (el) {
        var sec = el.closest('.page-section');
        if (sec) { targetId = sec.id; scrollId = raw; }
      }
    }
    if (!targetId) targetId = 'pg-home';
    document.querySelectorAll('.page-section').forEach(function(s){ s.hidden = (s.id !== targetId); });
    var shown = document.getElementById(targetId);
    activateNav(shown.dataset.nav || 'home');
    shown.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    animateCountersIn(shown);
    document.querySelectorAll('.mobile-menu').forEach(function(m){ m.classList.remove('open'); });
    if (scrollId) {
      requestAnimationFrame(function(){
        var t = document.getElementById(scrollId);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      window.scrollTo(0, 0);
    }
  }
  window.addEventListener('hashchange', function(){ showPage(location.hash); });
  document.addEventListener('DOMContentLoaded', function(){ showPage(location.hash); });
})();
""" % (
    "{" + ",".join(f"'{s}':'{n}'" for _, s, n in PAGES) + "}"
)

# Shared inner content (works whether or not it's wrapped in <html>/<body>)
# The viewport/charset meta tags are included even in the body-only fragment:
# browsers hoist stray <meta>/<title>/<link> tags found in <body> into <head>
# per the HTML parsing spec, so this works even though the Artifact platform
# supplies its own <head>. Without it, mobile browsers fall back to a ~980px
# desktop layout viewport, which breaks image sizing/lazy-load thresholds.
body_content = f"""<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
{css}
.page-section[hidden]{{display:none}}
</style>

<div class="loader"><div class="mark">AURA</div><div class="bar"></div></div>

{header_block}
{menu_block}

{chr(10).join(sections)}

{footer_block}

<button class="totop" aria-label="Наверх">↑</button>
<script>
{js}
</script>
<script>
{router_js}
</script>
"""

# 1) Full standalone document — for direct hosting / opening the file
full_doc = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AURA HOME DETAILING — Премиальный уход за элитной недвижимостью Москвы</title>
<meta name="description" content="AURA HOME DETAILING — детейлинг элитной недвижимости Рублёвки, Новорижского и Сколково. Собственное производство химии с 2015 года, ответственность застрахована на 10 000 000 ₽.">
<link rel="icon" href="data:,">
</head>
<body>
{body_content}
</body>
</html>
"""
out_full = ROOT / "aura-single.html"
out_full.write_text(full_doc, encoding="utf-8")
print(f"Wrote {out_full} ({len(full_doc)/1024:.1f} KB)")

# 2) Body-only fragment — for publishing as an Artifact (platform adds <head>/<body>)
out_frag = ROOT / "aura-artifact.html"
out_frag.write_text(body_content, encoding="utf-8")
print(f"Wrote {out_frag} ({len(body_content)/1024:.1f} KB)")
