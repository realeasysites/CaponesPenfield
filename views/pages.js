// Server-rendered pages for Capone's Italian Eatery
let V = {};
const setVersions = v => { V = v; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tel = p => 'tel:+1' + String(p || '').replace(/\D/g, '').slice(-10);
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const short = t => String(t || '').replace(':00', '').replace(' ', ' ');

const REVIEWS = [
  ['Tried this place tonight for the first time. My mom is a picky eater and even she raved about her meal. Found our new favorite take out place!', 'Abby L.'],
  ['The pizza was Amazing! This will be my go to place! Accurate wait times and great staff!', 'Jackalyn I.'],
  ['Fantastic food. A massive win for Penfield.', 'Riley C.'],
  ['Highly recommend! Sub and pizza were fantastic as well as the staff!', 'Patrick B.'],
  ['Great spot for pizza and subs or anything they make. Always fresh and friendly staff.', 'Alex C.'],
  ['Awesome pizza! Will be back for sure.', 'Kelly B.']
];

const deco = `<svg class="fan" viewBox="0 0 120 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M60 58 L60 4"/><path d="M60 58 L30 10"/><path d="M60 58 L90 10"/><path d="M60 58 L8 30"/><path d="M60 58 L112 30"/><path d="M14 58a46 46 0 0 1 92 0"/><path d="M30 58a30 30 0 0 1 60 0"/></g></svg>`;
const fedora = `<svg class="fedora" viewBox="0 0 64 28" aria-hidden="true"><path fill="currentColor" d="M18 18c0-9 4-15 14-15s14 6 14 15c0 0-6-3-14-3s-14 3-14 3zm-16 3c6-2 16-4 30-4s24 2 30 4c-4 3-14 5-30 5S6 24 2 21z"/><path fill="#a3162a" d="M18.6 15.4c4-1.6 8.3-2.4 13.4-2.4s9.4.8 13.4 2.4l.3 2.2c-4.1-1.5-8.6-2.3-13.7-2.3s-9.6.8-13.7 2.3z"/></svg>`;

function head(s, { title, desc, path = '/' }) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'Restaurant', name: "Capone's Italian Eatery",
    servesCuisine: ['Italian', 'Pizza', 'Deli'], priceRange: '$$', telephone: s.phone, email: s.email,
    address: { '@type': 'PostalAddress', streetAddress: '1811 Penfield Rd', addressLocality: 'Penfield', addressRegion: 'NY', postalCode: '14526', addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: 43.1294792, longitude: -77.476628 },
    url: 'https://caponeitalianeatery.com/', menu: '/menu', acceptsReservations: false,
    hasMap: 'https://maps.google.com/?q=1811+Penfield+Rd+Penfield+NY+14526',
    sameAs: [s.facebookUrl].filter(Boolean),
    openingHoursSpecification: DAYS.filter(d => s.hours?.[d]).map(d => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: d[0].toUpperCase() + d.slice(1), opens: to24(s.hours[d][0]), closes: to24(s.hours[d][1]) }))
  };
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#130f0e">
<link rel="canonical" href="${esc(path)}">
<meta property="og:type" content="restaurant"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="/img/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="/img/og.jpg">
<link rel="icon" href="/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,700;1,6..96,500;1,6..96,700&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css?v=${V['css/site.css']}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head><body>`;
}
function to24(t) { const m = String(t).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return t; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return String(h).padStart(2, '0') + ':' + m[2]; }

function header(s, active) {
  const nav = [['/', 'Home'], ['/menu', 'Menu'], ['/catering', 'Catering'], ['/#visit', 'Visit']];
  return `${s.announcementOn && s.announcement ? `<div class="announce"><span>${esc(s.announcement)}</span></div>` : ''}
<header class="top">
  <div class="top-in">
    <a class="brand" href="/" aria-label="Capone's Italian Eatery home"><img src="/img/logo.png" alt="Capone's Italian Eatery — Pizza, Deli, Pasta" width="502" height="70"></a>
    <nav class="nav" aria-label="Main">${nav.map(([h, l]) => `<a href="${h}"${active === h ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="top-cta">
      <a class="status" data-status href="/#visit"><i></i><span>Hours</span></a>
      <a class="btn btn-red" href="${esc(s.orderUrl)}" rel="noopener">Order Online</a>
    </div>
    <button class="burger" aria-label="Open menu" aria-expanded="false" data-burger><span></span><span></span></button>
  </div>
  <div class="drawer" data-drawer>
    ${nav.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}
    <a href="${esc(s.orderUrl)}" class="btn btn-red">Order Pickup</a>
    <a href="${esc(s.deliveryUrl)}" class="btn btn-ghost">Order Delivery</a>
    <a href="${tel(s.phone)}" class="btn btn-ghost">Call ${esc(s.phone)}</a>
  </div>
</header>`;
}

function footer(s) {
  return `<footer class="foot">
  <div class="foot-in">
    <div class="foot-brand">
      <img src="/img/logo.png" alt="Capone's Italian Eatery" width="502" height="70" loading="lazy">
      <p>New York–style pizza, deli and pasta.<br>Family owned &amp; operated in Penfield.</p>
      <a class="fb" href="${esc(s.facebookUrl)}" rel="noopener" target="_blank" aria-label="Capone's on Facebook"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.4H7.6V14h2.7v8z"/></svg> Facebook</a>
    </div>
    <div>
      <h4>Penfield</h4>
      <p>1811 Penfield Rd<br>Penfield, NY 14526<br><a href="${tel(s.phone)}">${esc(s.phone)}</a><br><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
    </div>
    <div>
      <h4>Eat</h4>
      <p><a href="/menu">Full menu</a><br><a href="${esc(s.orderUrl)}">Order pickup</a><br><a href="${esc(s.deliveryUrl)}">Order delivery</a><br><a href="/catering">Catering &amp; sheet pizzas</a></p>
    </div>
    <div>
      <h4>Extras</h4>
      <p><a href="${esc(s.rewardsUrl)}">Rewards</a><br><a href="${esc(s.giftCardsUrl)}">Gift cards</a><br><a href="${esc(s.appUrl)}">Get the app</a><br><a href="/#rochester">Rochester location</a></p>
    </div>
  </div>
  <div class="foot-base">
    <span>© ${new Date().getFullYear()} The Dezio Group LLC · Capone's Italian Eatery</span>
    <a class="credit" href="https://getrealeasysites.com" rel="noopener" target="_blank">Website by Real Easy Sites</a>
  </div>
</footer>
<nav class="dock" aria-label="Quick actions">
  <a href="${tel(s.phone)}"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1z"/></svg>Call</a>
  <a href="/menu"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 4h16v2H4zm0 7h16v2H4zm0 7h10v2H4z"/></svg>Menu</a>
  <a class="go" href="${esc(s.orderUrl)}"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2 1 21h22zm0 5 6.5 11h-13z"/></svg>Order Now</a>
</nav>
<script>window.CAP_HOURS=${JSON.stringify(s.hours || {})};</script>
<script src="/js/site.js?v=${V['js/site.js']}" defer></script>
</body></html>`;
}

function hoursTable(s) {
  return `<table class="hours" data-hours>${DAYS.map(d => {
    const h = s.hours?.[d];
    return `<tr data-day="${d}"><th>${d[0].toUpperCase() + d.slice(1, 3)}</th><td>${h && h[0] ? `${esc(short(h[0]))} – ${esc(short(h[1]))}` : 'Closed'}</td></tr>`;
  }).join('')}</table>`;
}

function itemRow(i, { compact = false } = {}) {
  return `<li class="item"><div class="item-top"><span class="item-name">${esc(i.name)}</span><span class="dots" aria-hidden="true"></span><span class="item-price">${esc(i.price)}</span></div>${i.description && !compact ? `<p>${esc(i.description)}</p>` : ''}</li>`;
}

function home(s, menu) {
  const cat = n => (menu.find(c => c.name === n) || { items: [] }).items;
  const pick = (n, names) => names.map(x => cat(n).find(i => i.name === x)).filter(Boolean);
  const pies = pick('Specialty Pizza', ['The Antonia', 'The Paisan', 'Bronx Bomber', 'Vodka Sausage', 'Pollo Pazzo', 'Margherita']);
  const family = [
    ...pick('Hot Subs', ['The Greg Dezio']),
    ...pick('Cold Subs', ['The Dominic', 'The Nathalie', 'The Carmella']),
    ...pick('Specialty Pizza', ['The Antonia'])
  ];
  const outfit = [
    ...pick('Hot Subs', ['The Mobster', 'Big Milanese', 'Vodka Chicken Parm']),
    ...pick('Cold Subs', ['The Capone', 'Godfather'])
  ];
  return head(s, {
    title: "Capone's Italian Eatery | NYC-Style Pizza, Deli & Pasta in Penfield, NY",
    desc: "Capone's Italian Eatery at 1811 Penfield Rd — New York–style pizza, hot and cold subs, calzones, chicken riggies and red-sauce pasta. Order pickup or delivery, or book catering."
  }) + header(s, '/') + `
<main id="main">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">${deco}<span>1811 Penfield Road · Est. 2023</span></p>
      <h1>New <span class="nw">York–style</span> pizza.<em>Old-school Italian manners.</em></h1>
      <p class="lede">Fresh-from-the-oven pies, stacked deli subs and red-sauce pasta — made by a Penfield family, the way a neighborhood Italian place ought to be.</p>
      <div class="hero-actions">
        <a class="btn btn-red btn-lg" href="${esc(s.orderUrl)}">Order Pickup</a>
        <a class="btn btn-cream btn-lg" href="${esc(s.deliveryUrl)}">Get Delivery</a>
        <a class="link-call" href="${tel(s.phone)}">or call ${esc(s.phone)}</a>
      </div>
      <p class="today" data-today>Open daily for lunch &amp; dinner</p>
    </div>
    <div class="hero-art">
      <div class="arch arch-main"><img src="/img/pepperoni.webp" alt="Capone's pepperoni pizza with fresh basil, straight from the oven" width="1200" height="1200" fetchpriority="high"></div>
      <div class="arch arch-small"><img src="/img/storefront.webp" alt="Capone's Italian Eatery storefront on Penfield Road with red umbrellas" width="720" height="720"></div>
      <div class="seal" aria-hidden="true"><span>Pizza</span><b>·</b><span>Deli</span><b>·</b><span>Pasta</span></div>
    </div>
  </section>

  <div class="marquee" aria-hidden="true"><div>${Array(2).fill('<span>Specialty Pies</span><i>✦</i><span>Fresh-Breaded Cutlets</span><i>✦</i><span>Chicken Riggies</span><i>✦</i><span>Huge Calzones</span><i>✦</i><span>Sheet Pizzas</span><i>✦</i><span>Garlic Knots</span><i>✦</i><span>Manhattan Special</span><i>✦</i>').join('')}</div></div>

  <section class="pies" id="pies">
    <div class="pies-photo">
      <figure class="frame"><img src="/img/cheese-pizza.webp" alt="A whole New York–style cheese pizza on the counter at Capone's" width="1200" height="1200" loading="lazy"></figure>
      <p class="caption">The plain cheese pie — the one we're judged by.</p>
    </div>
    <div class="card-menu">
      <p class="kicker">The House Pies</p>
      <h2>Twelve specialties. <em>Three sizes.</em></h2>
      <p class="sub">Medium <b>$21</b> · XL <b>$30</b> · Sheet <b>$43</b></p>
      <ul class="items">${pies.map(i => itemRow({ ...i, price: '' })).join('')}</ul>
      <div class="row-actions"><a class="btn btn-red" href="${esc(s.orderUrl)}">Order a pie</a><a class="arrow" href="/menu#specialty-pizza">All twelve →</a></div>
    </div>
  </section>

  <section class="family">
    <div class="family-head">
      ${fedora}
      <p class="kicker">Named for the family</p>
      <h2>Read the menu closely.</h2>
      <p>Capone's is family owned and operated, and it shows on the board. Some of the best things we make carry a name from behind the counter.</p>
    </div>
    <div class="cards">${family.map((i, k) => `
      <article class="calling-card c${k}">
        <span class="cc-corner tl"></span><span class="cc-corner tr"></span><span class="cc-corner bl"></span><span class="cc-corner br"></span>
        <p class="cc-type">${/Pizza/.test(i.category) ? 'Specialty pie' : (i.category === 'Hot Subs' ? 'Hot sub' : 'Cold sub')}</p>
        <h3>${esc(i.name)}</h3>
        <p>${esc(i.description)}</p>
        <p class="cc-price">${esc(/Pizza/.test(i.category) ? 'from $21' : 'from ' + i.price.replace('+', ''))}</p>
      </article>`).join('')}
    </div>
  </section>

  <section class="outfit">
    <div class="outfit-copy">
      <p class="kicker">The Outfit</p>
      <h2>Subs with a reputation.</h2>
      <ul class="items">${outfit.map(i => itemRow(i)).join('')}</ul>
      <a class="arrow" href="/menu#hot-subs">Every hot &amp; cold sub →</a>
    </div>
    <div class="outfit-photos">
      <figure class="frame"><img src="/img/caprese-sub.webp" alt="Fresh mozzarella, tomato and arugula sub with balsamic glaze" width="1100" height="1100" loading="lazy"></figure>
      <figure class="frame"><img src="/img/garlic-bread.webp" alt="Golden garlic bread loaves fresh out of the oven" width="1100" height="1100" loading="lazy"></figure>
    </div>
  </section>

  <section class="band-photo">
    <img src="/img/bruschetta.webp" alt="A row of bruschetta with prosciutto, fresh mozzarella and arugula" width="1440" height="558" loading="lazy">
    <div class="band-copy">
      <p class="kicker light">Catering &amp; big orders</p>
      <h2>Feeding the whole crew?</h2>
      <p>Office lunches, game days, graduation parties, the holidays. Sheet pizzas, huge calzones, sub trays and pans of riggies — just give us a day's notice.</p>
      <a class="btn btn-cream" href="/catering">Plan a catering order</a>
    </div>
  </section>

  <section class="word">
    <p class="kicker center">Word around Penfield</p>
    <div class="quotes">${REVIEWS.map(([q, n]) => `<blockquote><p>“${esc(q)}”</p><cite>— ${esc(n)} <span aria-label="5 stars">★★★★★</span></cite></blockquote>`).join('')}</div>
  </section>

  <section class="perks">
    <a class="perk" href="${esc(s.rewardsUrl)}"><b>Rewards</b><span>Earn points on every order and eat free.</span></a>
    <a class="perk" href="${esc(s.appUrl)}"><b>The Capone's app</b><span>Your usual, two taps away.</span></a>
    <a class="perk" href="${esc(s.giftCardsUrl)}"><b>Gift cards</b><span>The easiest gift in Penfield.</span></a>
  </section>

  <section class="visit" id="visit">
    <div class="visit-card">
      <p class="kicker">Visit us</p>
      <h2>1811 Penfield Road</h2>
      <p class="addr">Penfield, NY 14526 · plenty of easy parking out front</p>
      <p class="now" data-now></p>
      ${hoursTable(s)}
      <div class="row-actions">
        <a class="btn btn-red" href="https://www.google.com/maps/dir/?api=1&destination=1811+Penfield+Rd+Penfield+NY+14526" rel="noopener" target="_blank">Directions</a>
        <a class="btn btn-ghost-dark" href="${tel(s.phone)}">${esc(s.phone)}</a>
      </div>
    </div>
    <div class="visit-map">
      <iframe title="Map to Capone's Italian Eatery" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Capone's+Italian+Eatery,+1811+Penfield+Rd,+Penfield,+NY+14526&z=15&output=embed"></iframe>
    </div>
    <div class="visit-fb">
      <p class="kicker">Fresh off our Facebook</p>
      <div class="fb-frame" data-fb data-href="${esc(s.facebookUrl)}">
        <a class="btn btn-ghost-dark" href="${esc(s.facebookUrl)}" target="_blank" rel="noopener">See today's posts on Facebook</a>
      </div>
    </div>
  </section>

  <section class="sister" id="rochester">
    <div>
      <p class="kicker light">Also in the family</p>
      <h2>Capone's Rochester</h2>
      <p>12 Cooper Rd, Rochester, NY 14617 · <a href="tel:+15856481039">(585) 648-1039</a></p>
    </div>
    <a class="btn btn-cream" href="${esc(s.rochesterOrderUrl)}">Order from Rochester</a>
  </section>
</main>` + footer(s);
}

function slug(n) { return n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function menu(s, cats) {
  return head(s, {
    title: "Menu | Capone's Italian Eatery, Penfield NY",
    desc: "Full menu for Capone's Italian Eatery in Penfield: specialty pizzas, build-your-own pies, hot and cold subs, chicken riggies, calzones, salads, wings and desserts.",
    path: '/menu'
  }) + header(s, '/menu') + `
<main id="main" class="menu-page">
  <section class="menu-hero">
    <p class="eyebrow">${deco}<span>Penfield menu</span></p>
    <h1>The Menu</h1>
    <p class="lede">Prices for pickup at 1811 Penfield Rd. Order online for pickup or delivery and earn rewards on every order.</p>
    <div class="hero-actions center"><a class="btn btn-red btn-lg" href="${esc(s.orderUrl)}">Order Online</a><a class="btn btn-cream btn-lg" href="${tel(s.phone)}">Call ${esc(s.phone)}</a></div>
  </section>
  <nav class="menu-tabs" aria-label="Menu sections"><div>${cats.map(c => `<a href="#${slug(c.name)}">${esc(c.name)}</a>`).join('')}</div></nav>
  <div class="menu-book">
    ${cats.map((c, k) => `
    <section class="menu-sec" id="${slug(c.name)}">
      <header><span class="num">${String(k + 1).padStart(2, '0')}</span><h2>${esc(c.name)}</h2>${c.note ? `<p>${esc(c.note)}</p>` : ''}</header>
      <ul class="items">${c.items.map(i => itemRow(i)).join('')}</ul>
    </section>`).join('')}
  </div>
  <p class="menu-fine">Menu and prices can change — the online ordering menu is always current. Questions about allergies? Call us at <a href="${tel(s.phone)}">${esc(s.phone)}</a> before ordering.</p>
</main>` + footer(s);
}

function catering(s, { sent, error, values = {} } = {}) {
  const v = k => esc(values[k] || '');
  const opt = (name, list) => list.map(o => `<option${values[name] === o ? ' selected' : ''}>${esc(o)}</option>`).join('');
  return head(s, {
    title: "Catering | Capone's Italian Eatery, Penfield NY",
    desc: "Catering from Capone's Italian Eatery in Penfield, NY: sheet pizzas, sub trays, huge calzones and pans of pasta for offices, parties and game days.",
    path: '/catering'
  }) + header(s, '/catering') + `
<main id="main" class="cater">
  <section class="cater-hero">
    <div>
      <p class="eyebrow">${deco}<span>Catering</span></p>
      <h1>Feed the room.<em>We'll handle the rest.</em></h1>
      <p class="lede">From an office lunch for ten to a grad party for fifty — Capone's sheets, subs and pasta travel well and disappear fast. Give us 24 hours' notice and we'll take it from there.</p>
    </div>
    <figure class="arch arch-main"><img src="/img/cheese-pizza.webp" alt="Capone's cheese pizza" width="1200" height="1200"></figure>
  </section>
  <section class="cater-grid">
    <div class="cater-list">
      <h2>Crowd favorites</h2>
      <ul class="items">
        ${itemRow({ name: 'Sheet pizza — build your own', price: '$33', description: 'Your sauce, your toppings. The game-day default.' })}
        ${itemRow({ name: 'Specialty sheet pizza', price: '$43', description: 'The Antonia, Paisan, Bronx Bomber, Vodka Sausage and more.' })}
        ${itemRow({ name: 'Huge calzones', price: '$20', description: 'Taste of Italy, Three Cheese, Buffalo Chicken and more.' })}
        ${itemRow({ name: 'Sub trays', price: 'Call', description: 'Hot cutlet subs and cold deli subs, cut and arranged.' })}
        ${itemRow({ name: 'Pasta by the pan', price: 'Call', description: 'Chicken riggies, vodka chicken parm, broccoli chicken Alfredo.' })}
        ${itemRow({ name: 'Wings & garlic knots', price: 'Call', description: 'Because somebody always asks.' })}
      </ul>
      <dl class="faq">
        <dt>How much notice do you need?</dt><dd>24 hours for catering orders. Same-day big orders — call and we'll do our best.</dd>
        <dt>Is there a minimum?</dt><dd>No minimum for catering or delivery.</dd>
        <dt>Plates and napkins?</dt><dd>Not included by default — just ask when we call you back.</dd>
        <dt>Dietary needs?</dt><dd>We'll do our best with allergies and restrictions. Call us to talk it through.</dd>
      </dl>
    </div>
    <div class="cater-form">
      ${sent ? `<div class="thanks"><h2>Request received.</h2><p>Thanks — we'll call you back shortly to confirm details. Need it sooner? Call <a href="${tel(s.phone)}">${esc(s.phone)}</a>.</p><a class="btn btn-red" href="/catering">Send another</a></div>` : `
      <form method="post" action="/catering" novalidate>
        <h2>Plan your order</h2>
        <p class="form-sub">Tell us the basics. We'll call you back to build the order.</p>
        ${error ? `<p class="form-err" role="alert">${esc(error)}</p>` : ''}
        <label>Name<input name="name" required autocomplete="name" value="${v('name')}"></label>
        <div class="two"><label>Phone<input name="phone" type="tel" required autocomplete="tel" value="${v('phone')}"></label>
        <label>Email <small>(optional)</small><input name="email" type="email" autocomplete="email" value="${v('email')}"></label></div>
        <div class="two"><label>Event date<input name="event_date" type="date" value="${v('event_date')}"></label>
        <label>Guests<select name="guests">${opt('guests', ['10–20', '20–30', '30–40', '40–50', '50+', 'Under 10'])}</select></label></div>
        <div class="two"><label>Occasion<select name="occasion">${opt('occasion', ['Office lunch', 'Party / celebration', 'Game day', 'Holiday', 'Graduation', 'Other'])}</select></label>
        <label>Location<select name="location">${opt('location', ['Penfield', 'Rochester'])}</select></label></div>
        <label>What are you thinking?<textarea name="details" rows="4" placeholder="e.g. 3 sheets, a sub tray, pickup at noon">${v('details')}</textarea></label>
        <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <button class="btn btn-red btn-lg" type="submit">Send request</button>
      </form>`}
    </div>
  </section>
</main>` + footer(s);
}

function notFound(s) {
  return head(s, { title: "Not found | Capone's Italian Eatery", desc: '' }) + header(s, '') +
    `<main class="nf"><h1>This page took the cannoli.</h1><p>Let's get you back to the good stuff.</p><div class="hero-actions center"><a class="btn btn-red" href="/menu">See the menu</a><a class="btn btn-cream" href="/">Home</a></div></main>` + footer(s);
}

function adminShell(body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Capone's Dashboard</title><link rel="icon" href="/img/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Bodoni+Moda:ital,opsz,wght@1,6..96,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/admin.css?v=${V['css/admin.css']}"></head><body>${body}</body></html>`;
}
function login(err) {
  return adminShell(`<form class="login" method="post" action="/admin/login">
    <img src="/img/logo.png" alt="Capone's" width="300"><h1>Dashboard</h1>
    ${err ? `<p class="err">${esc(err)}</p>` : ''}
    <label>Password<input type="password" name="password" autofocus autocomplete="current-password" required></label>
    <button>Sign in</button></form>`);
}
function admin() {
  return adminShell(`<header class="bar"><img src="/img/logo.png" alt="Capone's" height="30"><nav>
    <button data-tab="inq" class="on">Catering requests <span data-count></span></button><button data-tab="menu">Menu</button><button data-tab="info">Hours &amp; links</button></nav>
    <form method="post" action="/admin/logout"><button class="out">Sign out</button></form></header>
  <main><section data-panel="inq"></section><section data-panel="menu" hidden></section><section data-panel="info" hidden></section></main>
  <div class="toast" data-toast></div>
  <script src="/js/admin.js?v=${V['js/admin.js']}"></script>`);
}

module.exports = { setVersions, home, menu, catering, notFound, login, admin };
