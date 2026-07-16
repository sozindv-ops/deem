/* AURA HOME DETAILING — shared interactions */
document.addEventListener('DOMContentLoaded', () => {

  /* preloader */
  const loader = document.querySelector('.loader');
  if (loader) {
    window.addEventListener('load', () => setTimeout(() => loader.classList.add('hide'), 250));
    setTimeout(() => loader.classList.add('hide'), 1800);
  }

  /* nav scroll state */
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
    const totop = document.querySelector('.totop');
    if (totop) totop.classList.toggle('show', window.scrollY > 700);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-close');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => mobileMenu.classList.add('open'));
    mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
  }

  /* scroll reveal */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* animated counters */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const decimals = (el.dataset.count.split('.')[1] || '').length;
        const suffix = el.dataset.suffix || '';
        const dur = 1600;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('ru-RU')) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* FAQ accordion */
  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    head?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.acc-item.open').forEach(o => {
        if (o !== item) { o.classList.remove('open'); o.querySelector('.acc-body').style.maxHeight = null; }
      });
      item.classList.toggle('open', !isOpen);
      body.style.maxHeight = !isOpen ? body.scrollHeight + 'px' : null;
    });
  });

  /* before/after sliders */
  document.querySelectorAll('.ba').forEach(ba => {
    const after = ba.querySelector('.ba-after');
    const handle = ba.querySelector('.ba-handle');
    let dragging = false;
    const setPos = (clientX) => {
      const rect = ba.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(2, Math.min(98, pct));
      after.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = pct + '%';
    };
    ba.addEventListener('pointerdown', (e) => { dragging = true; setPos(e.clientX); });
    window.addEventListener('pointermove', (e) => { if (dragging) setPos(e.clientX); });
    window.addEventListener('pointerup', () => dragging = false);
    ba.addEventListener('touchmove', (e) => setPos(e.touches[0].clientX), { passive: true });
  });

  /* filter tabs (portfolio / blog) */
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const targetSel = group.dataset.filterGroup;
    const items = document.querySelectorAll(targetSel);
    group.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        items.forEach(it => {
          const show = cat === 'all' || it.dataset.cat === cat;
          it.style.display = show ? '' : 'none';
        });
      });
    });
  });

  /* contact form (demo — no backend) */
  const form = document.querySelector('#contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = 'Отправлено ✓';
      btn.style.pointerEvents = 'none';
      setTimeout(() => { btn.innerHTML = original; btn.style.pointerEvents = ''; form.reset(); }, 3200);
    });
  }

  /* cost calculator (pricing page) */
  const calc = document.querySelector('#calcForm');
  if (calc) {
    const area = calc.querySelector('#calcArea');
    const tier = calc.querySelector('#calcTier');
    const out = document.querySelector('#calcResult');
    const compute = () => {
      const a = parseFloat(area.value) || 0;
      const rates = { start: 180, home: 260, estate: 340 };
      const rate = rates[tier.value] || 260;
      const val = Math.max(35000, Math.round((a * rate) / 1000) * 1000);
      out.textContent = val.toLocaleString('ru-RU') + ' ₽';
    };
    [area, tier].forEach(el => el.addEventListener('input', compute));
    compute();
  }

  /* back to top */
  document.querySelector('.totop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
