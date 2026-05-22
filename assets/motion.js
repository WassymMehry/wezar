// =============================================================
// WEZAR motion foundation (Phase 2)
// framer-motion DOM + Lenis smooth scroll + GSAP/ScrollTrigger
// All loaded via ESM CDN — no build step.
// Exposed on window.Motion so non-module scripts can use it.
// =============================================================

import {
  animate, scroll, inView, stagger, spring,
  easeIn, easeOut, easeInOut,
} from "https://esm.sh/framer-motion@latest/dom";
import Lenis from "https://esm.sh/lenis@1.1.18";
import { gsap } from "https://esm.sh/gsap@3.12.5";
import { ScrollTrigger } from "https://esm.sh/gsap@3.12.5/ScrollTrigger";

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Lenis smooth scroll ----------
// Skipped when the user prefers reduced motion — native scroll is honored.
let lenis = null;
if (!reducedMotion) {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => 1 - Math.pow(1 - t, 4), // ease-out-quart
    smoothWheel: true,
    smoothTouch: false,
  });

  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
} else {
  gsap.registerPlugin(ScrollTrigger);
}

// ---------- char / word / line split helper ----------
// Wraps each unit in a mask container so a child translateY reveals from below.
// Returns the array of inner spans for animation.
function split(el, mode = 'chars') {
  if (!el) return [];
  const text = (el.textContent || '').replace(/\s+/g, ' ');
  el.innerHTML = '';
  const inners = [];

  const wrap = (klass, content) => {
    const outer = document.createElement('span');
    outer.className = klass;
    const inner = document.createElement('span');
    inner.className = 'wz-split-inner';
    inner.textContent = content;
    outer.appendChild(inner);
    el.appendChild(outer);
    inners.push(inner);
  };

  if (mode === 'words') {
    text.split(' ').forEach((w, i, arr) => {
      if (!w) return;
      wrap('wz-split-word', w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  } else if (mode === 'lines') {
    text.split('\n').forEach((line) => wrap('wz-split-line', line));
  } else {
    [...text].forEach((c) => {
      if (c === ' ') el.appendChild(document.createTextNode(' '));
      else wrap('wz-split-char', c);
    });
  }
  return inners;
}

// ---------- expose on window ----------
window.Motion = {
  // framer-motion
  animate, scroll, inView, stagger, spring,
  easeIn, easeOut, easeInOut,
  // foundations
  lenis, gsap, ScrollTrigger,
  split,
  reducedMotion,
};
