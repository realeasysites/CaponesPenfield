(() => {
  // mobile drawer
  const b = document.querySelector('[data-burger]'), d = document.querySelector('[data-drawer]');
  if (b && d) b.addEventListener('click', () => {
    const open = d.classList.toggle('open'); b.setAttribute('aria-expanded', open);
  });

  // open / closed (America/New_York)
  const H = window.CAP_HOURS || {};
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const mins = t => { const m = String(t || '').match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
  const pretty = t => String(t).replace(':00', '');
  let now;
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = k => p.find(x => x.type === k)?.value;
    now = { day: g('weekday').toLowerCase(), m: (+g('hour') % 24) * 60 + +g('minute') };
  } catch { const n = new Date(); now = { day: DAYS[n.getDay()], m: n.getHours() * 60 + n.getMinutes() }; }
  const today = H[now.day] || [];
  const o = mins(today[0]), c = mins(today[1]);
  let open = false, msg = '';
  if (o != null && c != null && now.m >= o && now.m < c) { open = true; msg = `Open now · until ${pretty(today[1])}`; }
  else if (o != null && now.m < o) msg = `Closed now · opens today at ${pretty(today[0])}`;
  else {
    const nd = DAYS[(DAYS.indexOf(now.day) + 1) % 7], nh = H[nd];
    msg = nh && nh[0] ? `Closed now · opens ${nd[0].toUpperCase() + nd.slice(1)} at ${pretty(nh[0])}` : 'Closed now';
  }
  document.querySelectorAll('[data-status]').forEach(el => { el.classList.add(open ? 'open' : 'closed'); el.querySelector('span').textContent = open ? 'Open now' : 'Closed'; });
  document.querySelectorAll('[data-today],[data-now]').forEach(el => { el.textContent = msg; });
  document.querySelectorAll(`[data-hours] tr[data-day="${now.day}"]`).forEach(tr => tr.classList.add('today'));

  // Facebook feed (Page Plugin) — loads when scrolled near
  const fb = document.querySelector('[data-fb]');
  if (fb && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return; io.disconnect();
      const w = Math.min(500, Math.max(280, Math.floor(fb.clientWidth)));
      const src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(fb.dataset.href) +
        `&tabs=timeline&width=${w}&height=540&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;
      const f = document.createElement('iframe');
      f.src = src; f.title = "Capone's latest Facebook posts"; f.loading = 'lazy';
      f.allow = 'encrypted-media'; f.style.width = w + 'px';
      const fallback = fb.innerHTML; fb.innerHTML = ''; fb.appendChild(f);
      f.addEventListener('error', () => { fb.innerHTML = fallback; });
    }, { rootMargin: '400px' });
    io.observe(fb);
  }

  // menu tabs: highlight section in view
  const tabs = [...document.querySelectorAll('.menu-tabs a')];
  if (tabs.length && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      tabs.forEach(t => t.classList.toggle('on', t.getAttribute('href') === '#' + e.target.id));
      const on = tabs.find(t => t.classList.contains('on'));
      if (on) on.parentElement.scrollTo({ left: on.offsetLeft - 24, behavior: 'smooth' });
    }), { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.menu-sec').forEach(s => io2.observe(s));
  }
})();
