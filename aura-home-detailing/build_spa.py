#!/usr/bin/env python3
"""Merge the multi-page AURA site into one self-contained single-file SPA."""
import re, pathlib

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

html_out = f"""<!DOCTYPE html>
<html lang="ru" class="no-js">
<head>
<meta charset="UTF-8">
<script>document.documentElement.classList.remove("no-js")</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AURA HOME DETAILING — Премиальный уход за элитной недвижимостью Москвы</title>
<meta name="description" content="AURA HOME DETAILING — детейлинг элитной недвижимости Рублёвки, Новорижского и Сколково. Собственное производство химии с 2015 года, ответственность застрахована на 10 000 000 ₽.">
<link rel="icon" href="data:,">
<style>
{css}
.page-section[hidden]{{display:none}}
</style>
</head>
<body>

<div class="loader"><div class="mark">AURA</div></div>

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
</body>
</html>
"""

out_path = ROOT / "aura-single.html"
out_path.write_text(html_out, encoding="utf-8")
print(f"Wrote {out_path} ({len(html_out)/1024:.1f} KB)")
