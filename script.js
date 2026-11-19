/* HOOK THEORY — interactions (vanilla JS) */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Sticky nav state ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 40);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  /* ---------- Active nav link on scroll ---------- */
  const links = $$('.nav__links a:not(.btn)');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ---------- Scroll reveal ---------- */
  const rev = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); rev.unobserve(en.target); }
  }), { threshold: .15 });
  $$('.reveal').forEach(el => rev.observe(el));

  /* ---------- Parallax (about images + hero logo) ---------- */
  const para = $$('[data-speed]'), logo = $('.hero__logo');
  let ticking = false;
  const parallax = () => {
    para.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      el.style.translate = `0 ${(r.top - innerHeight / 2) * parseFloat(el.dataset.speed)}px`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => {
    onScroll();
    if (!reduce && !ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  if (!reduce) parallax();

  /* ---------- Services hover image ---------- */
  const peek = $('.svc__peek');
  $$('.svc__row').forEach(row => {
    const show = () => { peek.src = row.dataset.img; peek.classList.add('is-on'); };
    const hide = () => peek.classList.remove('is-on');
    row.addEventListener('mouseenter', show);
    row.addEventListener('mouseleave', hide);
    row.addEventListener('mousemove', e => {
      peek.style.left = e.clientX + 30 + 'px';
      peek.style.top = e.clientY - 140 + 'px';
    });
  });
  peek.addEventListener('error', () => peek.classList.remove('is-on'));

  /* ---------- Portfolio filter ---------- */
  const pills = $$('.pill'), cards = $$('.card'), empty = $('.empty');
  pills.forEach(p => p.addEventListener('click', () => {
    pills.forEach(x => x.classList.toggle('is-active', x === p));
    const f = p.dataset.filter;
    cards.forEach(c => {
      const match = f === 'all' || c.dataset.cat === f;
      if (match) {
        c.classList.remove('is-hidden');
        requestAnimationFrame(() => c.classList.remove('is-out'));
      } else {
        c.classList.add('is-out');
        setTimeout(() => c.classList.contains('is-out') && c.classList.add('is-hidden'), reduce ? 0 : 350);
      }
    });
    empty.hidden = cards.some(c => f === 'all' || c.dataset.cat === f);
  }));

  /* ---------- Hide broken remote images gracefully ---------- */
  $$('.card img, .about__visual img').forEach(img =>
    img.addEventListener('error', () => { img.style.opacity = 0; }));

  /* ---------- Custom cursor over work cards ---------- */
  const cursor = $('.cursor');
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
    (function loop() {
      cx += (x - cx) * .18; cy += (y - cy) * .18;
      cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px';
      requestAnimationFrame(loop);
    })();
    cards.forEach(c => {
      c.addEventListener('mouseenter', () => cursor.classList.add('is-on'));
      c.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    });
  }

  /* ---------- Contact form validation ---------- */
  const form = $('#form'), ok = $('#ok');
  const rules = {
    name: v => v.trim().length >= 2 || 'Enter your name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email, like name@example.com.',
    type: v => !!v || 'Choose a project type.',
    msg: v => v.trim().length >= 15 || 'Tell us a little more (at least 15 characters).'
  };
  const check = el => {
    const res = rules[el.id](el.value), field = el.closest('.field');
    field.classList.toggle('invalid', res !== true);
    $('.err', field).textContent = res === true ? '' : res;
    el.setAttribute('aria-invalid', res !== true);
    return res === true;
  };
  const inputs = $$('input, select, textarea', form);
  inputs.forEach(el => {
    el.addEventListener('blur', () => check(el));
    el.addEventListener('input', () => el.closest('.field').classList.contains('invalid') && check(el));
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const valid = inputs.map(check).every(Boolean);
    if (!valid) { $('[aria-invalid=true]', form)?.focus(); return; }
    // Replace with a real endpoint (Formspree, Netlify Forms, etc.) when ready.
    form.reset(); ok.hidden = false;
    setTimeout(() => (ok.hidden = true), 7000);
  });

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement, tbtn = $('#theme');
  const setTheme = t => {
    root.dataset.theme = t;
    tbtn.setAttribute('aria-pressed', t === 'dark');
    try { localStorage.setItem('ht-theme', t); } catch (e) {}
    syncParticles();
  };
  tbtn.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  /* ---------- Floating amber particles (dark theme only) ---------- */
  const cv = $('#particles'), ctx = cv.getContext('2d');
  let ps = [], raf = 0, W = 0, H = 0;
  const size = () => {
    const d = devicePixelRatio || 1; W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const spawn = init => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 1.8 + .6,
    vy: Math.random() * .35 + .12, vx: (Math.random() - .5) * .25, a: Math.random() * .5 + .2, p: Math.random() * 6.28 });
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(233,154,36,.8)';
    ps.forEach((p, i) => {
      p.p += .01; p.x += p.vx + Math.sin(p.p) * .25; p.y -= p.vy;
      if (p.y < -10) ps[i] = spawn(false);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fillStyle = `rgba(233,154,36,${p.a})`; ctx.fill();
    });
    raf = requestAnimationFrame(tick);
  };
  function syncParticles() {
    cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H);
    if (root.dataset.theme === 'dark' && !reduce && !document.hidden) {
      size(); ps = Array.from({ length: Math.min(70, Math.round(innerWidth / 22)) }, () => spawn(true)); tick();
    }
  }
  addEventListener('resize', () => root.dataset.theme === 'dark' && size());
  document.addEventListener('visibilitychange', syncParticles);
  tbtn.setAttribute('aria-pressed', root.dataset.theme === 'dark');
  syncParticles();
})();
