// =========== WEZAR data: products, collections, cart ============

const COLLECTIONS = [
  { slug: 'heirloom',  name: 'Heirloom',  tagline: 'Anchors the long game.',     desc: 'Solid gold, real stones, signed editions. Pieces designed to outlive the trends that inspired them.', tone: 'dark' },
  { slug: 'everyday',  name: 'Everyday',  tagline: 'Lives on the body.',          desc: 'The pieces you forget you\u2019re wearing until someone asks. Polished, lightweight, never put away.', tone: 'pearl' },
  { slug: 'editorial', name: 'Editorial', tagline: 'Finishes the outfit.',        desc: 'Statement geometry, generous gold. Made for the photograph and the room it walks into.', tone: 'blush' },
  { slug: 'personal',  name: 'Personal',  tagline: 'Speaks only to you.',         desc: 'Letters, signets, hand-engraving. Initials and dates. Quiet language, worn close.', tone: 'deep' },
];

const PRODUCTS = [
  { id:'p01', name:'The Solitaire',     category:'rings',     collection:'heirloom',  price:1890, meta:'14k gold · 0.5ct',     tag:'New',           tone:'pearl', edition:'Edition 14 / 50' },
  { id:'p02', name:'Tuesday Hoops',     category:'earrings',  collection:'everyday',  price:680,  meta:'Solid 18k',            tag:'',              tone:'blush' },
  { id:'p03', name:'Onyx Signet',       category:'rings',     collection:'personal',  price:1240, meta:'Hand-engraved',        tag:'New',           tone:'dark' },
  { id:'p04', name:'The Letter',        category:'necklaces', collection:'personal',  price:420,  meta:'Personalised · 14k',   tag:'',              tone:'deep' },
  { id:'p05', name:'Pearl Drop',        category:'earrings',  collection:'editorial', price:920,  meta:'18k · Akoya pearl',    tag:'',              tone:'pearl' },
  { id:'p06', name:'Felt Wheel Band',   category:'rings',     collection:'everyday',  price:540,  meta:'14k · 1.2mm',          tag:'',              tone:'bone' },
  { id:'p07', name:'The Curb',          category:'necklaces', collection:'editorial', price:1480, meta:'18k · 4mm',            tag:'',              tone:'dark' },
  { id:'p08', name:'Mira Studs',        category:'earrings',  collection:'everyday',  price:340,  meta:'14k · 3mm',            tag:'',              tone:'pearl' },
  { id:'p09', name:'Editorial Cuff',    category:'bracelets', collection:'editorial', price:1620, meta:'Solid 14k',            tag:'New',           tone:'blush' },
  { id:'p10', name:'Sunday Chain',      category:'bracelets', collection:'everyday',  price:380,  meta:'14k · 2.1mm',          tag:'',              tone:'pearl' },
  { id:'p11', name:'Heirloom Halo',     category:'rings',     collection:'heirloom',  price:2340, meta:'18k · 0.7ct halo',     tag:'',              tone:'deep',  edition:'Edition 03 / 25' },
  { id:'p12', name:'Initial Pendant',   category:'necklaces', collection:'personal',  price:290,  meta:'14k · A\u2013Z',       tag:'',              tone:'pearl' },
  { id:'p13', name:'Crescent Ear',      category:'earrings',  collection:'editorial', price:1180, meta:'18k · Sculpted',       tag:'New',           tone:'dark' },
  { id:'p14', name:'Signet Mini',       category:'rings',     collection:'personal',  price:760,  meta:'14k · Engraved',       tag:'',              tone:'pearl' },
  { id:'p15', name:'Linen Chain',       category:'necklaces', collection:'everyday',  price:620,  meta:'18k · 1.6mm',          tag:'',              tone:'bone' },
  { id:'p16', name:'Heirloom Locket',   category:'necklaces', collection:'heirloom',  price:1980, meta:'14k · Hinged',         tag:'',              tone:'deep',  edition:'Edition 08 / 40' },
];

const fmtPrice = (n) => '\u20AC' + n.toLocaleString('en-US');

// ----- CART (localStorage) -----
const CART_KEY = 'wezar.cart.v1';
const cart = {
  read() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e) { return []; }
  },
  write(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); this._notify(); },
  count() { return this.read().reduce((s, i) => s + i.qty, 0); },
  subtotal() {
    return this.read().reduce((s, i) => {
      const p = PRODUCTS.find(x => x.id === i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  },
  add(id, qty = 1) {
    const items = this.read();
    const ex = items.find(i => i.id === id);
    if (ex) ex.qty += qty; else items.push({ id, qty });
    this.write(items);
  },
  update(id, qty) {
    const items = this.read().map(i => i.id === id ? { ...i, qty } : i).filter(i => i.qty > 0);
    this.write(items);
  },
  remove(id) {
    this.write(this.read().filter(i => i.id !== id));
  },
  clear() { this.write([]); },
  _notify() {
    document.querySelectorAll('[data-bag-count]').forEach(el => {
      const n = this.count();
      el.textContent = n;
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  },
};

// ----- WISHLIST (localStorage) -----
const WISHLIST_KEY = 'wezar.wishlist.v1';
const wishlist = {
  read() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch(e) { return []; }
  },
  write(ids) { localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids)); this._notify(); },
  has(id) { return this.read().includes(id); },
  count() { return this.read().length; },
  toggle(id) {
    const ids = this.read();
    const idx = ids.indexOf(id);
    if (idx === -1) ids.push(id); else ids.splice(idx, 1);
    this.write(ids);
  },
  _notify() {
    document.querySelectorAll('[data-wishlist-count]').forEach(el => {
      const n = this.count();
      el.textContent = n;
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('[data-heart-id]').forEach(el => {
      const saved = this.has(el.dataset.heartId);
      el.classList.toggle('is-saved', saved);
      const path = el.querySelector('svg path');
      if (path) path.setAttribute('fill', saved ? 'var(--wz-rose-deep)' : 'none');
    });
  },
};

// ----- HEADER / FOOTER PARTIALS -----
function renderHeader(active) {
  const svgSearch = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>`;
  const svgHeart  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  return `
  <nav class="nav" data-screen-label="Header">
    <a href="index.html" class="nav-brand">WEZAR</a>
    <ul class="nav-links">
      <li><a href="shop.html" class="${active==='shop'?'active':''}">Shop</a></li>
      <li><a href="collections.html" class="${active==='collections'?'active':''}">Collections</a></li>
      <li><a href="shop.html?category=rings">Rings</a></li>
      <li><a href="shop.html?category=earrings">Earrings</a></li>
    </ul>
    <div class="nav-icons">
      <button id="nav-search-btn" aria-label="Search">${svgSearch}</button>
      <button id="nav-wishlist-btn" aria-label="Wishlist">${svgHeart}<span class="nav-wishlist-count" data-wishlist-count style="display:none">0</span></button>
      <a href="cart.html" aria-label="Bag"><span class="nav-bag-icon" aria-hidden="true"></span><span class="nav-bag-count" data-bag-count style="display:none">0</span></a>
    </div>
  </nav>`;
}
function renderFooter() {
  return `
  <footer class="footer" data-screen-label="Footer">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">WEZAR</div>
        <div class="footer-tagline">Access to brilliance.</div>
        <p style="font-family:var(--wz-font-body);font-size:13px;color:var(--wz-mist);max-width:32ch;line-height:1.6;font-weight:300;">Solid gold, real stones, modern soul. Designed in Paris, made by hand.</p>
      </div>
      <div class="footer-col"><h5>Shop</h5><ul>
        <li><a href="shop.html">All jewelry</a></li>
        <li><a href="shop.html?category=rings">Rings</a></li>
        <li><a href="shop.html?category=earrings">Earrings</a></li>
        <li><a href="shop.html?category=necklaces">Necklaces</a></li>
        <li><a href="shop.html?category=bracelets">Bracelets</a></li>
      </ul></div>
      <div class="footer-col"><h5>Wezar</h5><ul>
        <li><a href="collections.html">Collections</a></li>
        <li><a>Materials</a></li>
        <li><a>Care</a></li>
        <li><a>Sustainability</a></li>
      </ul></div>
      <div class="footer-col"><h5>Help</h5><ul>
        <li><a>Shipping</a></li>
        <li><a>Returns</a></li>
        <li><a>Contact</a></li>
        <li><a>FAQ</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Wezar — All rights reserved</span>
      <span>Instagram &nbsp;·&nbsp; Pinterest &nbsp;·&nbsp; TikTok</span>
    </div>
  </footer>`;
}

function renderOverlays() {
  const svgClose = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  return `
  <div class="search-overlay" id="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
    <button class="search-close" id="search-close" aria-label="Close search">${svgClose}</button>
    <div class="search-inner">
      <input class="search-input" id="search-input" type="search" placeholder="Search pieces…" autocomplete="off" spellcheck="false">
      <ul class="search-results" id="search-results" role="listbox"></ul>
    </div>
  </div>
  <div class="wishlist-drawer" id="wishlist-drawer" role="dialog" aria-modal="true" aria-label="Saved pieces">
    <div class="wishlist-header">
      <span class="wishlist-title">SAVED PIECES</span>
      <button class="wishlist-close" id="wishlist-close" aria-label="Close">${svgClose}</button>
    </div>
    <div class="wishlist-body" id="wishlist-body"></div>
  </div>
  <div class="overlay-backdrop" id="overlay-backdrop"></div>`;
}

// ----- DECORATIVE SVG art for product placeholders -----
function productArt(product) {
  const id = product.id;
  const cat = product.category;
  const dark = product.tone === 'dark';
  const stroke = dark ? '#F0A4B1' : '#A85563';
  // pick shape per category
  const seed = parseInt(id.replace(/\D/g,''), 10) || 1;
  const off = (seed * 7) % 14 - 7;
  let shape = '';
  if (cat === 'rings') {
    shape = `<circle cx="120" cy="${130+off}" r="46" fill="none" stroke="${stroke}" stroke-width="1"/>
             <circle cx="120" cy="${88+off}" r="6" fill="${stroke}" fill-opacity=".5"/>`;
  } else if (cat === 'earrings') {
    shape = `<path d="M${100+off} 70 Q120 ${110+off} 100 ${150+off}" fill="none" stroke="${stroke}" stroke-width="1"/>
             <path d="M${140-off} 70 Q120 ${110+off} 140 ${150-off}" fill="none" stroke="${stroke}" stroke-width="1"/>
             <circle cx="${100+off}" cy="${150+off}" r="5" fill="${stroke}" fill-opacity=".55"/>
             <circle cx="${140-off}" cy="${150-off}" r="5" fill="${stroke}" fill-opacity=".55"/>`;
  } else if (cat === 'necklaces') {
    shape = `<path d="M40 60 Q120 ${180+off} 200 60" fill="none" stroke="${stroke}" stroke-width="1"/>
             <path d="M${110+off} ${165+off/2} l10 14 l10 -14 l-10 -10 z" fill="none" stroke="${stroke}" stroke-width="1"/>`;
  } else if (cat === 'bracelets') {
    shape = `<ellipse cx="120" cy="${130+off}" rx="80" ry="22" fill="none" stroke="${stroke}" stroke-width="1"/>
             <ellipse cx="120" cy="${130+off}" rx="60" ry="14" fill="none" stroke="${stroke}" stroke-width=".7" stroke-opacity=".6"/>`;
  } else {
    shape = `<circle cx="120" cy="130" r="40" fill="none" stroke="${stroke}" stroke-width="1"/>`;
  }
  return `<svg viewBox="0 0 240 260" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="width:55%;height:auto;">${shape}</svg>`;
}

function tonelClass(tone) {
  return tone === 'dark' ? 'dark' : tone === 'blush' ? 'blush' : tone === 'deep' ? 'pearl-deep' : tone === 'bone' ? 'bone' : 'pearl';
}

// Render a product card. ctx default is shop link.
function productCard(p, opts = {}) {
  const href = `product.html?id=${p.id}`;
  const tone = p.tone || 'pearl';
  const toneClass = tone === 'dark' ? 'dark' : tone === 'blush' ? 'blush' : tone === 'deep' ? 'deep' : tone === 'bone' ? 'bone' : '';
  const tag = p.tag ? `<span class="tag ${p.tag==='New'?'':'gold'}">${p.tag}</span>` : '';
  return `
    <a class="card" href="${href}" data-category="${p.category}" data-collection="${p.collection}" data-price="${p.price}" data-id="${p.id}">
      <div class="img ${toneClass}">
        ${tag}
        <div class="ph">${productArt(p)}</div>
        <div class="img-overlay"><span>View piece</span></div>
      </div>
      <div class="name">${p.name}</div>
      <div class="meta">${p.meta}</div>
      <div class="price">${fmtPrice(p.price)}</div>
    </a>`;
}

function getQuery(name) {
  return new URLSearchParams(location.search).get(name);
}

function injectChrome(active) {
  const headerSlot = document.getElementById('site-header');
  if (headerSlot) headerSlot.outerHTML = renderHeader(active);
  const footerSlot = document.getElementById('site-footer');
  if (footerSlot) footerSlot.outerHTML = renderFooter();
  cart._notify();
}
