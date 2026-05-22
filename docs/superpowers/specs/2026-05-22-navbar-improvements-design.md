# Navbar Improvements — Design Spec
**Date:** 2026-05-22  
**Status:** Approved

## Context

The Wezar navbar has three icon placeholders — search, wishlist, and bag — but only the bag works. The bag icon itself uses a Unicode glyph (`⌗`) that looks amateurish on a luxury jewelry site. The goal is to make all three icons fully functional and replace the Unicode glyphs with thin-stroke SVG icons that match the aesthetic of premium e-commerce sites (Cartier, Net-a-Porter).

---

## Scope

Three deliverables:
1. **Replace all three nav icons** with inline 24×24 SVG hairline icons
2. **Search overlay** — live product search with keyboard support
3. **Wishlist drawer** — localStorage-persisted favorites with per-card heart toggles

---

## Architecture

All changes live in two files only: `assets/data.js` and `assets/site.css`. No new files, no new `<script>` tags on any page. The overlays are injected by `injectChrome()`, which is already called on every page.

---

## 1. SVG Icons

Replace the Unicode characters in `renderHeader()` in `assets/data.js`:

| Icon | Current | Replacement |
|------|---------|-------------|
| Search | `⌕` | 24×24 magnifying glass SVG, stroke-width 1.5 |
| Wishlist | `♡` | 24×24 heart outline SVG, stroke-width 1.5; fills `var(--wz-rose-deep)` when items are saved |
| Bag | `⌗` | 24×24 shopping bag SVG, stroke-width 1.5 |

All icons: `fill="none"`, `stroke="currentColor"`, `viewBox="0 0 24 24"`. The bag count badge keeps its current implementation unchanged.

---

## 2. Search Overlay

### Behavior
- Opens when the search icon is clicked
- Closes on: `Esc` key, backdrop click, or `×` button
- Filters `PRODUCTS` (all 16) live as the user types — matches name, category, and collection (case-insensitive)
- Each result is a link to `product.html?id=...`
- Empty query shows no results list
- No matches shows "No pieces found" in muted text

### Layout
```
[full-screen backdrop: rgba(0,0,0,0.6), backdrop-filter: blur(4px)]
  Centered content panel:
    [×] close button (top-right)
    Centered text input with animated underline
    Results list below input (max-height scroll)
      Each row: product name (left) · collection (right, muted)
```

### Implementation (assets/data.js)
- New `renderOverlays()` function returns the overlay + drawer HTML string
- Called inside `injectChrome()`, appended to `document.body`
- New `initNavInteractions()` function wires all event listeners (called in `injectChrome()` after DOM insertion)
- Search filters over the `PRODUCTS` array already in scope

### CSS (assets/site.css)
- `.search-overlay` — fixed fullscreen, z-index 200, hidden by default (`opacity:0; pointer-events:none`)
- `.search-overlay.is-open` — visible (`opacity:1; pointer-events:auto`), transition via `--wz-ease`
- `.search-input` — large centered input, bottom-border only, no background, uppercase tracking
- `.search-results` — list of rows, hover highlight
- `.search-result-item` — flex row, name left, collection right

---

## 3. Wishlist Drawer

### Wishlist Object (`assets/data.js`)
New `wishlist` singleton alongside `cart`, stored at `wezar.wishlist.v1`:

```js
wishlist = {
  read()         // → string[] of product IDs
  write(ids)     // persists + calls _notify()
  toggle(id)     // add if absent, remove if present
  has(id)        // → boolean
  _notify()      // updates [data-wishlist-count] badges + [data-heart-id] fill states
}
```

### Behavior
- Nav heart icon opens/closes the drawer (slide in from right)
- Drawer is independent of the search overlay (both can't be open simultaneously — opening one closes the other)
- Per-card heart button in `productCard()` calls `wishlist.toggle(id)` and updates fill state
- "Move to Bag" button in drawer calls `cart.add(id)` + `wishlist.toggle(id)`
- Heart badge on nav icon: same pill style as bag count badge, hidden at 0

### Layout
```
Right-side drawer (width: 360px, slides in from right):
  Header: "SAVED PIECES" + [×] close
  ─────────────────────────────────
  Each item:
    [SVG art placeholder]  Name
                           Collection · $price
                           [Move to Bag]  [♡ remove]
  ─────────────────────────────────
  Empty state: "No saved pieces yet" centered
```

### Implementation
- `renderOverlays()` includes drawer HTML alongside search overlay HTML
- `initNavInteractions()` wires drawer open/close events
- `productCard()` gets a `<button data-heart-id="${id}">` with heart SVG appended to card markup
- `wishlist._notify()` queries all `[data-heart-id]` elements and sets filled/outline state

### CSS (assets/site.css)
- `.wishlist-drawer` — fixed right-side panel, transform: translateX(100%), z-index 200
- `.wishlist-drawer.is-open` — transform: translateX(0), transition via `--wz-ease`
- `.wishlist-item` — flex row with art, text column, actions
- `.heart-btn` — transparent button, inherits icon color, fills on `.is-saved` class

---

## Files Modified

| File | What changes |
|------|-------------|
| `assets/data.js` | SVG icons in `renderHeader()`; `wishlist` object; `renderOverlays()`; `initNavInteractions()`; updated `injectChrome()`; heart button in `productCard()` |
| `assets/site.css` | Search overlay styles; wishlist drawer styles; heart button on product cards |

---

## Verification

1. Open `index.html` in a browser (via `python3 -m http.server 8000`)
2. **Icons**: Confirm all three nav icons display as clean SVG lines, not Unicode symbols
3. **Search**: Click search icon → overlay appears; type "ring" → ring products appear; click a result → navigates to PDP; press Esc → overlay closes
4. **Wishlist**: Click heart on a product card → heart fills; click nav heart → drawer opens with that product; "Move to Bag" → item moves to cart; nav heart badge shows count
5. **Bag**: Confirm existing bag functionality is unchanged (badge updates, links to cart.html)
6. Check on mobile (≤760px): icons still visible and functional; no layout breakage
