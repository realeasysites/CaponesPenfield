(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { const t = $('[data-toast]'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); };
  const api = async (url, method = 'GET', body) => {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { location.reload(); throw new Error('login'); }
    return r.json();
  };
  let D = null;
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== b.dataset.tab);
  }));

  async function load() { D = await api('/api/admin/data'); renderInq(); renderMenu(); renderInfo(); }

  function renderInq() {
    const list = D.inquiries;
    $('[data-count]').textContent = list.filter(i => i.status === 'new').length || '';
    $('[data-panel=inq]').innerHTML = `<h2>Catering requests</h2>
      <p class="hint">Every request from the website's catering form lands here. Delete anything that isn't a real lead.</p>
      ${list.length ? list.map(i => `<article class="lead s-${esc(i.status)}" data-id="${i.id}">
        <div class="lead-top"><h3>${esc(i.name)}</h3><time>${esc(new Date(i.created_at.replace(' ', 'T') + 'Z').toLocaleString())}</time></div>
        <p class="meta"><a href="tel:${esc(i.phone)}">${esc(i.phone)}</a>${i.email ? ` · <a href="mailto:${esc(i.email)}">${esc(i.email)}</a>` : ''}</p>
        <p class="meta">${[i.occasion, i.guests && i.guests + ' guests', i.event_date, i.location].filter(Boolean).map(esc).join(' · ')}</p>
        ${i.details ? `<p class="det">${esc(i.details)}</p>` : ''}
        <div class="lead-actions"><select data-status>${['new', 'contacted', 'booked', 'closed'].map(s => `<option${s === i.status ? ' selected' : ''}>${s}</option>`).join('')}</select>
        <button class="del" data-del>Delete</button></div></article>`).join('') : '<p class="empty">No catering requests yet.</p>'}`;
    document.querySelectorAll('.lead').forEach(el => {
      const id = el.dataset.id;
      $('[data-status]', el).addEventListener('change', async e => { await api(`/api/admin/inquiries/${id}/status`, 'POST', { status: e.target.value }); toast('Status saved'); load(); });
      $('[data-del]', el).addEventListener('click', async () => { if (!confirm('Delete this request for good?')) return; await api(`/api/admin/inquiries/${id}`, 'DELETE'); toast('Deleted'); load(); });
    });
  }

  function renderMenu() {
    $('[data-panel=menu]').innerHTML = `<h2>Menu</h2>
      <p class="hint">Edit names, descriptions and prices. Changes show on the website right away. Online ordering prices are managed separately in your ordering system.</p>
      <form class="add" data-add><select name="category">${D.menu.map(c => `<option>${esc(c.name)}</option>`).join('')}</select>
        <input name="name" placeholder="New item name" required><input name="price" placeholder="Price"><button>Add item</button></form>
      ${D.menu.map(c => `<section class="cat"><h3>${esc(c.name)}</h3>${c.items.map(i => `
        <div class="mi" data-id="${i.id}"><input data-f="name" value="${esc(i.name)}" aria-label="Name"><input data-f="price" value="${esc(i.price)}" aria-label="Price" class="price">
        <textarea data-f="description" rows="1" aria-label="Description">${esc(i.description)}</textarea>
        <button data-save>Save</button><button class="del" data-del>✕</button></div>`).join('')}</section>`).join('')}`;
    $('[data-add]').addEventListener('submit', async e => {
      e.preventDefault(); const f = new FormData(e.target);
      await api('/api/admin/menu', 'POST', Object.fromEntries(f)); toast('Item added'); load();
    });
    document.querySelectorAll('.mi').forEach(el => {
      const id = el.dataset.id, val = k => $(`[data-f=${k}]`, el).value;
      $('[data-save]', el).addEventListener('click', async () => { await api(`/api/admin/menu/${id}`, 'PUT', { name: val('name'), price: val('price'), description: val('description') }); toast('Saved'); });
      $('[data-del]', el).addEventListener('click', async () => { if (!confirm('Remove this item from the menu?')) return; await api(`/api/admin/menu/${id}`, 'DELETE'); toast('Removed'); load(); });
    });
  }

  function renderInfo() {
    const s = D.settings, h = s.hours || {};
    const links = [['orderUrl', 'Order online (pickup) link'], ['deliveryUrl', 'Delivery link'], ['rewardsUrl', 'Rewards link'], ['giftCardsUrl', 'Gift cards link'], ['appUrl', 'App link'], ['facebookUrl', 'Facebook page'], ['rochesterOrderUrl', 'Rochester ordering link'], ['phone', 'Phone'], ['email', 'Email']];
    $('[data-panel=info]').innerHTML = `<h2>Hours &amp; links</h2>
      <form data-info>
        <fieldset><legend>Top banner</legend>
          <label class="chk"><input type="checkbox" name="announcementOn" ${s.announcementOn ? 'checked' : ''}> Show banner</label>
          <input name="announcement" value="${esc(s.announcement)}" placeholder="Today's special, holiday hours…"></fieldset>
        <fieldset><legend>Hours (leave blank = closed)</legend>${DAYS.map(d => `<div class="hr"><span>${d}</span>
          <input name="o_${d}" value="${esc((h[d] || [])[0] || '')}" placeholder="11:00 AM"><em>to</em><input name="c_${d}" value="${esc((h[d] || [])[1] || '')}" placeholder="9:00 PM"></div>`).join('')}</fieldset>
        <fieldset><legend>Links &amp; contact</legend>${links.map(([k, l]) => `<label>${l}<input name="${k}" value="${esc(s[k])}"></label>`).join('')}</fieldset>
        <button>Save changes</button></form>`;
    $('[data-info]').addEventListener('submit', async e => {
      e.preventDefault(); const f = new FormData(e.target); const out = { hours: {} };
      for (const [k] of links) out[k] = f.get(k);
      out.announcement = f.get('announcement'); out.announcementOn = !!f.get('announcementOn');
      for (const d of DAYS) { const o = f.get('o_' + d).trim(), c = f.get('c_' + d).trim(); out.hours[d] = o && c ? [o, c] : []; }
      await api('/api/admin/settings', 'POST', out); toast('Saved'); load();
    });
  }
  load();
})();
