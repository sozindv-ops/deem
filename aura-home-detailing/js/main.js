/* AURA HOME DETAILING — shared interactions */
document.addEventListener('DOMContentLoaded', () => {

  /* photo loading: try local file first, fall back to the stock URL,
     then to the textured placeholder. Fades in once something loads.
     A hard timeout backs up 'error' events: flaky/throttled mobile
     connections often stall a request without ever firing 'error',
     which used to leave the photo blank forever instead of degrading
     to the placeholder. */
  const wireImg = (img) => {
    let timer = null;
    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const ok = () => { img.classList.add('ok'); clearTimer(); };
    const onErr = () => {
      clearTimer();
      if (img.dataset.fallback) {           // swap to fallback source once
        const fb = img.dataset.fallback;
        delete img.dataset.fallback;
        img.src = fb;
        armTimer();
      } else {
        img.remove();                         // reveal textured placeholder
      }
    };
    const armTimer = () => { clearTimer(); timer = setTimeout(onErr, 9000); };
    if (img.complete && img.naturalWidth > 0) { ok(); return; }
    img.addEventListener('load', ok);
    img.addEventListener('error', onErr);
    if (img.loading === 'lazy' && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { armTimer(); io.disconnect(); }
        });
      }, { rootMargin: '600px 0px' });
      io.observe(img);
    } else {
      armTimer();
    }
  };
  document.querySelectorAll('.ph img, .hero-bg img, .page-hero-bg img, .cta-banner-bg img, .video-block img').forEach(wireImg);

  /* floating decorative markers drifting over hero photography */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    document.querySelectorAll('.hero-bg, .page-hero-bg').forEach((host) => {
      const count = host.classList.contains('page-hero-bg') ? 3 : 5;
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.className = 'float-dot';
        dot.style.left = (10 + Math.random() * 80) + '%';
        dot.style.top = (15 + Math.random() * 60) + '%';
        dot.style.animationDelay = (Math.random() * 5).toFixed(2) + 's';
        dot.style.setProperty('--ring-delay', (Math.random() * 3).toFixed(2) + 's');
        const ring = dot;
        ring.style.animationDuration = (6 + Math.random() * 3).toFixed(2) + 's';
        host.appendChild(dot);
      }
    });
  }

  /* subtle parallax on hero while scrolling the first viewport
     (applied to the .hero-bg container, not the <img>, so it doesn't
     fight the Ken Burns keyframe animation running on the image itself) */
  const heroEl = document.querySelector('.hero');
  if (heroEl && !reduceMotion) {
    const heroBg = heroEl.querySelector('.hero-bg');
    const heroContent = heroEl.querySelector('.hero-content');
    const onHeroParallax = () => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return;
      if (heroBg) heroBg.style.transform = `translateY(${y * 0.14}px)`;
      if (heroContent) { heroContent.style.transform = `translateY(${y * 0.06}px)`; heroContent.style.opacity = String(Math.max(0, 1 - y / 700)); }
    };
    document.addEventListener('scroll', onHeroParallax, { passive: true });
  }

  /* preloader */
  const loader = document.querySelector('.loader');
  if (loader) {
    window.addEventListener('load', () => setTimeout(() => loader.classList.add('hide'), 250));
    setTimeout(() => loader.classList.add('hide'), 1800);
  }

  /* scroll progress bar */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  /* nav scroll state + progress */
  const nav = document.querySelector('.nav');
  const totop = document.querySelector('.totop');
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 40);
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
        if (el.dataset.done) { cio.unobserve(el); return; }
        el.dataset.done = '1';
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

  /* demo forms (no backend) */
  document.querySelectorAll('.js-form, #contactForm').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = 'Отправлено ✓';
      btn.style.pointerEvents = 'none';
      setTimeout(() => { btn.innerHTML = original; btn.style.pointerEvents = ''; form.reset(); }, 3200);
    });
  });

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

  /* language toggle (RU / EN demo) */
  document.querySelectorAll('[data-set-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.setLang;
      document.documentElement.setAttribute('data-lang', lang);
      document.querySelectorAll('[data-set-lang]').forEach(b =>
        b.classList.toggle('active', b.dataset.setLang === lang));
    });
  });

  /* client cabinet — dashboard tabs */
  document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const root = tab.closest('.dash');
      const key = tab.dataset.tab;
      root.querySelectorAll('.dash-tab').forEach(t => t.classList.toggle('active', t === tab));
      root.querySelectorAll('.dash-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === key));
    });
  });

  /* generate decorative QR codes (visual placeholder for warranty link) */
  const drawQR = (el) => {
    const N = 25, seedStr = el.dataset.qr || 'AURA-A142-STONE-140626';
    let seed = 0; for (const c of seedStr) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    // 7x7 finder pattern at a given top-left corner
    const inFinder = (r, c) => {
      const zones = [[0, 0], [0, N - 7], [N - 7, 0]];
      for (const [zr, zc] of zones) {
        if (r >= zr && r < zr + 7 && c >= zc && c < zc + 7) {
          const rr = r - zr, cc = c - zc;
          const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6;
          const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
          return { hit: true, on: ring || core };
        }
        if (r >= zr - 1 && r <= zr + 7 && c >= zc - 1 && c <= zc + 7) return { hit: true, on: false }; // quiet border
      }
      return { hit: false };
    };
    let rects = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const f = inFinder(r, c);
      const on = f.hit ? f.on : rnd() > .5;
      if (on) rects += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
    }
    el.innerHTML = `<svg viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" fill="#16130d">${rects}</svg>`;
  };
  document.querySelectorAll('.qr').forEach(drawQR);

  /* behind-the-scenes video modal */
  const videoTriggers = document.querySelectorAll('[data-video]');
  if (videoTriggers.length) {
    const modal = document.createElement('div');
    modal.className = 'v-modal';
    modal.innerHTML = '<div class="frame"><button class="close" aria-label="Закрыть">&times;</button><div class="note">Здесь воспроизводится фильм<br>«AURA · За кулисами мастерства»<br><br>(демонстрационный блок — подключается ваше видео)</div></div>';
    document.body.appendChild(modal);
    const close = () => modal.classList.remove('open');
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.classList.contains('close')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    videoTriggers.forEach(t => t.addEventListener('click', () => modal.classList.add('open')));
  }

  /* magnetic gold buttons (subtle premium micro-interaction) */
  if (window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    document.querySelectorAll('.btn-gold').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = `translate(${x}px,${y - 2}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }
});
