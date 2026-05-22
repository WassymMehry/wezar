# Navbar Icons, Search & Wishlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Unicode nav icons with hairline SVGs, add a live-search overlay, and add a localStorage-backed wishlist with a slide-in drawer and per-card heart toggles.

**Architecture:** All logic stays in `assets/data.js`; all styles in `assets/site.css`. No new files, no extra `<script>` tags — overlays are injected by `injectChrome()` which every page already calls. The `wishlist` singleton mirrors the existing `cart` API pattern.

**Tech Stack:** Vanilla JS, CSS custom properties, localStorage, inline SVG

---

### Task 1: Replace Unicode icons with SVG in renderHeader + extend nav-icons CSS

**Files:**
- Modify: `assets/data.js:69-85`
- Modify: `assets/site.css:52-62`

- [ ] **Step 1: Replace renderHeader (data.js lines 69–85)**

The bag icon uses the uploaded PNG via CSS `mask-image` so it responds to `currentColor` (hover color change works). Search and heart remain inline SVG.

```js
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
```

- [ ] **Step 2: Update nav-icons CSS (site.css lines 52–62)**

Replace lines 52–62 with:

```css
.nav-icons { display: flex; gap: 18px; font-size: 16px; justify-self: end; align-items: center; }
.nav-icons a,
.nav-icons button { color: var(--wz-onyx); transition: color 180ms var(--wz-ease); position: relative; }
.nav-icons a:hover,
.nav-icons button:hover { color: var(--wz-rose-deep); }
.nav-bag-count,
.nav-wishlist-count {
  position: absolute; top: -6px; right: -10px;
  background: var(--wz-rose-deep); color: var(--wz-rose-whisper);
  font-family: var(--wz-font-body); font-size: 9px; font-weight: 500;
  letter-spacing: .04em; min-width: 16px; height: 16px; padding: 0 4px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--wz-radius-pill);
}
```

- [ ] **Step 3: Verify icons render**

Serve the project: `python3 -m http.server 8000`, open `http://localhost:8000`.

Expected: three clean SVG hairline icons in the nav (magnifying glass · heart outline · shopping bag). No Unicode symbols. Bag still links to `cart.html`. Count badges are hidden.

- [ ] **Step 4: Commit**

```bash
rtk git add assets/data.js assets/site.css && rtk git commit -m "feat: replace unicode nav icons with SVG"
```

---

### Task 2: Add wishlist localStorage singleton

**Files:**
- Modify: `assets/data.js` (insert after line 66 — the closing `};` of the `cart` object)

- [ ] **Step 1: Insert wishlist object after the cart object**

After the line `};` that closes `cart` (line 66), insert:

```js
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
```

- [ ] **Step 2: Verify in browser console**

Open any page. In the browser console run:
```js
wishlist.toggle('p01'); wishlist.read();
```
Expected: `["p01"]`. Run again → `[]`. No JS errors.

- [ ] **Step 3: Commit**

```bash
rtk git add assets/data.js && rtk git commit -m "feat: add wishlist localStorage singleton"
```

---

### Task 3: Add renderOverlays() to data.js

**Files:**
- Modify: `assets/data.js` (insert after the closing `}` of `renderFooter`, currently around line 120)

- [ ] **Step 1: Insert renderOverlays() after renderFooter()**

```js
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
```

- [ ] **Step 2: Commit**

```bash
rtk git add assets/data.js && rtk git commit -m "feat: add renderOverlays HTML template"
```

---

### Task 4: Add renderWishlistBody(), initNavInteractions(), update injectChrome()

**Files:**
- Modify: `assets/data.js` (insert before `injectChrome`, replace `injectChrome`)

- [ ] **Step 1: Insert renderWishlistBody() and initNavInteractions() before injectChrome()**

Immediately before `function injectChrome(active)` insert:

```js
function renderWishlistBody() {
  const ids = wishlist.read();
  if (!ids.length) return `<p class="wishlist-empty">No saved pieces yet.</p>`;
  const svgHeartFilled = `<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--wz-rose-deep)" stroke="var(--wz-rose-deep)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  return ids.map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return '';
    return `
    <div class="wishlist-item">
      <a class="wishlist-item-art" href="product.html?id=${p.id}">${productArt(p)}</a>
      <div class="wishlist-item-info">
        <a class="wishlist-item-name" href="product.html?id=${p.id}">${p.name}</a>
        <span class="wishlist-item-meta">${p.collection} · ${fmtPrice(p.price)}</span>
        <div class="wishlist-item-actions">
          <button class="wishlist-move-to-bag" data-move-id="${p.id}">Move to bag</button>
          <button class="wishlist-remove" data-remove-id="${p.id}" aria-label="Remove">${svgHeartFilled}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function initNavInteractions() {
  const searchBtn     = document.getElementById('nav-search-btn');
  const wishlistBtn   = document.getElementById('nav-wishlist-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const wishlistDrawer= document.getElementById('wishlist-drawer');
  const backdrop      = document.getElementById('overlay-backdrop');
  const searchClose   = document.getElementById('search-close');
  const wishlistClose = document.getElementById('wishlist-close');
  const searchInput   = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const wishlistBody  = document.getElementById('wishlist-body');

  function openSearch() {
    searchOverlay.classList.add('is-open');
    wishlistDrawer.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    setTimeout(() => searchInput.focus(), 50);
  }
  function openWishlist() {
    wishlistDrawer.classList.add('is-open');
    searchOverlay.classList.remove('is-open');
    backdrop.classList.add('is-visible');
    wishlistBody.innerHTML = renderWishlistBody();
  }
  function closeAll() {
    searchOverlay.classList.remove('is-open');
    wishlistDrawer.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    searchInput.value = '';
    searchResults.innerHTML = '';
  }

  searchBtn.addEventListener('click', openSearch);
  wishlistBtn.addEventListener('click', openWishlist);
  searchClose.addEventListener('click', closeAll);
  wishlistClose.addEventListener('click', closeAll);
  backdrop.addEventListener('click', closeAll);

  // clicking the dark area outside the search panel closes it
  searchOverlay.addEventListener('click', e => {
    if (!e.target.closest('.search-inner')) closeAll();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ''; return; }
    const hits = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.collection.toLowerCase().includes(q)
    );
    if (!hits.length) {
      searchResults.innerHTML = `<li class="search-no-results">No pieces found</li>`;
      return;
    }
    searchResults.innerHTML = hits.map(p => `
      <li class="search-result-item">
        <a href="product.html?id=${p.id}">
          <span class="search-result-name">${p.name}</span>
          <span class="search-result-collection">${p.collection}</span>
        </a>
      </li>`).join('');
  });

  wishlistBody.addEventListener('click', e => {
    const moveBtn   = e.target.closest('[data-move-id]');
    const removeBtn = e.target.closest('[data-remove-id]');
    if (moveBtn)   { cart.add(moveBtn.dataset.moveId); wishlist.toggle(moveBtn.dataset.moveId); wishlistBody.innerHTML = renderWishlistBody(); }
    if (removeBtn) { wishlist.toggle(removeBtn.dataset.removeId); wishlistBody.innerHTML = renderWishlistBody(); }
  });
}
```

- [ ] **Step 2: Replace injectChrome()**

Replace the existing `injectChrome` function with:

```js
function injectChrome(active) {
  const headerSlot = document.getElementById('site-header');
  if (headerSlot) headerSlot.outerHTML = renderHeader(active);
  const footerSlot = document.getElementById('site-footer');
  if (footerSlot) footerSlot.outerHTML = renderFooter();
  document.body.insertAdjacentHTML('beforeend', renderOverlays());
  initNavInteractions();
  cart._notify();
  wishlist._notify();
}
```

- [ ] **Step 3: Verify in browser**

Open `index.html`:
- Search icon click → dark overlay opens with input centered
- Type "soli" → "The Solitaire" appears; click it → navigates to product page
- Press Esc → overlay closes
- Heart icon click → drawer slides in from right, shows "No saved pieces yet."
- Backdrop area click → drawer closes

- [ ] **Step 4: Commit**

```bash
rtk git add assets/data.js && rtk git commit -m "feat: add search and wishlist interaction logic"
```

---

### Task 5: Add heart toggle button to productCard()

**Files:**
- Modify: `assets/data.js:157-173`

- [ ] **Step 1: Replace productCard()**

```js
function productCard(p, opts = {}) {
  const href      = `product.html?id=${p.id}`;
  const tone      = p.tone || 'pearl';
  const toneClass = tone === 'dark' ? 'dark' : tone === 'blush' ? 'blush' : tone === 'deep' ? 'deep' : tone === 'bone' ? 'bone' : '';
  const tag       = p.tag ? `<span class="tag ${p.tag==='New'?'':'gold'}">${p.tag}</span>` : '';
  const saved     = wishlist.has(p.id);
  const heartFill = saved ? 'var(--wz-rose-deep)' : 'none';
  const svgHeart  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="${heartFill}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  return `
    <a class="card" href="${href}" data-category="${p.category}" data-collection="${p.collection}" data-price="${p.price}" data-id="${p.id}">
      <div class="img ${toneClass}">
        ${tag}
        <div class="ph">${productArt(p)}</div>
        <div class="img-overlay"><span>View piece</span></div>
        <button class="heart-btn${saved?' is-saved':''}" data-heart-id="${p.id}" aria-label="Save to wishlist" onclick="event.preventDefault();wishlist.toggle('${p.id}')">${svgHeart}</button>
      </div>
      <div class="name">${p.name}</div>
      <div class="meta">${p.meta}</div>
      <div class="price">${fmtPrice(p.price)}</div>
    </a>`;
}
```

- [ ] **Step 2: Verify on shop page**

Open `shop.html`. Hover any product card → small heart button appears bottom-right of the image. Click it → heart fills rose-red, nav heart badge shows "1". Click again → heart empties, badge hides. Nav heart → drawer shows the saved product.

- [ ] **Step 3: Commit**

```bash
rtk git add assets/data.js && rtk git commit -m "feat: add heart toggle button to product cards"
```

---

### Task 6: CSS — search overlay, wishlist drawer, heart button

**Files:**
- Modify: `assets/site.css` (append at end of file)

- [ ] **Step 1: Append all new styles to site.css**

The `.nav-bag-icon` rule uses CSS `mask-image` with the uploaded PNG (at `uploads/Shopping Bag.png`) so the bag icon responds to `currentColor` — hover turns it rose-deep automatically, identical to the SVG icons. URL-encode the space in the filename as `%20`; the path is relative to `assets/site.css` so it begins with `../`.

```css
/* ---------- BAG PNG ICON (mask → currentColor) ---------- */
.nav-bag-icon {
  display: block; width: 20px; height: 20px;
  background-color: currentColor;
  -webkit-mask-image: url('../uploads/Shopping%20Bag.png');
  -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center;
  mask-image: url('../uploads/Shopping%20Bag.png');
  mask-size: contain; mask-repeat: no-repeat; mask-position: center;
}

/* ---------- SEARCH OVERLAY ---------- */
.search-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(10,10,10,0.72);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 14vh;
  opacity: 0; pointer-events: none;
  transition: opacity 260ms var(--wz-ease);
}
.search-overlay.is-open { opacity: 1; pointer-events: auto; }

.search-close {
  position: absolute; top: 28px; right: 36px;
  color: var(--wz-pearl); opacity: .6;
  transition: opacity 160ms var(--wz-ease);
}
.search-close:hover { opacity: 1; }

.search-inner { width: min(600px, 90vw); }

.search-input {
  width: 100%; background: transparent; border: none;
  border-bottom: 1px solid rgba(244,239,232,.3);
  color: var(--wz-pearl); font-family: var(--wz-font-body);
  font-size: 22px; font-weight: 300; letter-spacing: .06em;
  padding: 12px 0; outline: none;
  transition: border-color 200ms var(--wz-ease);
}
.search-input::placeholder { color: rgba(244,239,232,.35); }
.search-input:focus { border-bottom-color: var(--wz-rose); }

.search-results { list-style: none; margin: 8px 0 0; padding: 0; }
.search-result-item a {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 1px solid rgba(244,239,232,.1);
  color: var(--wz-pearl); transition: color 160ms var(--wz-ease);
}
.search-result-item a:hover { color: var(--wz-rose); }
.search-result-name { font-size: 15px; font-weight: 300; letter-spacing: .03em; }
.search-result-collection { font-size: 10px; letter-spacing: .18em; text-transform: uppercase; opacity: .45; }
.search-no-results {
  padding: 24px 0; color: rgba(244,239,232,.35);
  font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
}

/* ---------- WISHLIST DRAWER ---------- */
.wishlist-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 200;
  width: 380px; max-width: 100vw;
  background: var(--wz-rose-whisper);
  border-left: 1px solid var(--wz-rose-soft);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 340ms var(--wz-ease);
}
.wishlist-drawer.is-open { transform: translateX(0); }

.wishlist-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 28px; border-bottom: 1px solid var(--wz-rose-soft); flex-shrink: 0;
}
.wishlist-title {
  font-family: var(--wz-font-body); font-size: 11px; font-weight: 500;
  letter-spacing: .28em; text-transform: uppercase; color: var(--wz-onyx);
}
.wishlist-close { color: var(--wz-onyx); opacity: .4; transition: opacity 160ms var(--wz-ease); }
.wishlist-close:hover { opacity: 1; }

.wishlist-body { flex: 1; overflow-y: auto; padding: 0 28px; }

.wishlist-empty {
  text-align: center; padding: 56px 0;
  font-size: 11px; letter-spacing: .14em; color: var(--wz-mist); text-transform: uppercase;
}

.wishlist-item {
  display: flex; gap: 16px; align-items: flex-start;
  padding: 20px 0; border-bottom: 1px solid var(--wz-rose-soft);
}
.wishlist-item-art {
  width: 72px; min-width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
  background: var(--wz-rose-soft); border-radius: 2px; overflow: hidden;
}
.wishlist-item-art svg { width: 100% !important; height: 100%; }
.wishlist-item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.wishlist-item-name {
  font-size: 14px; font-weight: 400; letter-spacing: .03em; color: var(--wz-onyx);
  transition: color 160ms var(--wz-ease);
}
.wishlist-item-name:hover { color: var(--wz-rose-deep); }
.wishlist-item-meta { font-size: 11px; letter-spacing: .08em; color: var(--wz-mist); text-transform: capitalize; }
.wishlist-item-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.wishlist-move-to-bag {
  font-size: 10px; letter-spacing: .18em; text-transform: uppercase; font-weight: 500;
  padding: 6px 14px; border: 1px solid var(--wz-onyx); color: var(--wz-onyx);
  transition: background 200ms var(--wz-ease), color 200ms var(--wz-ease);
}
.wishlist-move-to-bag:hover { background: var(--wz-onyx); color: var(--wz-rose-whisper); }
.wishlist-remove { color: var(--wz-rose-deep); opacity: .6; transition: opacity 160ms var(--wz-ease); }
.wishlist-remove:hover { opacity: 1; }

/* ---------- OVERLAY BACKDROP (behind wishlist drawer) ---------- */
.overlay-backdrop {
  position: fixed; inset: 0; z-index: 190;
  background: rgba(10,10,10,0.35);
  opacity: 0; pointer-events: none;
  transition: opacity 300ms var(--wz-ease);
}
.overlay-backdrop.is-visible { opacity: 1; pointer-events: auto; }

/* ---------- PRODUCT CARD HEART BUTTON ---------- */
.heart-btn {
  position: absolute; bottom: 10px; right: 10px; z-index: 2;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(252,234,237,0.88); color: var(--wz-onyx);
  opacity: 0; transform: scale(0.85);
  transition: opacity 200ms var(--wz-ease), transform 200ms var(--wz-ease),
              background 160ms var(--wz-ease), color 160ms var(--wz-ease);
}
.card:hover .heart-btn,
.heart-btn.is-saved { opacity: 1; transform: scale(1); }
.heart-btn.is-saved { color: var(--wz-rose-deep); background: rgba(252,234,237,0.96); }
.heart-btn svg path { transition: fill 160ms var(--wz-ease); }
```

- [ ] **Step 2: Full end-to-end verification**

Serve at `python3 -m http.server 8000` and check all flows:

1. **Icons** — three clean SVG lines in nav, no Unicode artifacts
2. **Search** — click search icon → overlay; type "onyx" → "Onyx Signet" appears; click → lands on product page; Esc → closes; click dark area outside input → closes
3. **Card hearts** — on `shop.html`, hover a card → heart appears bottom-right; click → fills rose, nav heart badge shows count; refresh page → heart state restored from localStorage
4. **Wishlist drawer** — click nav heart → drawer slides in from right; saved product visible with art, name, collection, price; "Move to bag" → removed from drawer, cart badge increments; heart remove button → removed from drawer; backdrop click → drawer closes
5. **Bag** — existing cart functionality unchanged; `cart.html` still works
6. **Mobile (≤760px)** — icons visible, no layout breakage; drawers open full-width

- [ ] **Step 3: Commit**

```bash
rtk git add assets/site.css && rtk git commit -m "feat: add search overlay, wishlist drawer, and heart button styles"
```
