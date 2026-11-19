import { initSite, initTabs, settlePhrases, trackSections } from './site.js';
import { loadCatalog, card, featureTile, stateNode } from './shop.js';

initSite();

/* ---------- the five product lines: tabs swap the mascot pose and the mock screen ---------- */
const show = document.querySelector('.show-tabs');
if (show) {
  const { tabs, select } = initTabs(show, {
    // keep the chosen tab in view inside the scrolling row, without moving the page
    onSelect: (t, i, panel, motion) => motion && show.scrollTo({ left: t.offsetLeft - show.clientWidth / 2 + t.offsetWidth / 2, behavior: 'smooth' }),
  });
  select(tabs[0], { motion: false });
}

/* ---------- machine picker: a segmented control whose thumb slides to the chosen machine ---------- */
const seg = document.querySelector('.seg');
if (seg) {
  const { tabs, select } = initTabs(seg, {
    onSelect: (t, i) => {
      seg.style.setProperty('--i', i);
      settlePhrases(seg.parentElement);
    },
  });
  // start on the visitor's likely machine: Mac browsers get the Mac commands
  const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent) && !/iPhone|iPad/.test(navigator.userAgent);
  select(tabs.find((t) => t.dataset.machine === (isMac ? 'mac' : 'nvidia')) || tabs[0], { motion: false });
  requestAnimationFrame(() => requestAnimationFrame(() => seg.classList.add('is-ready')));
}

/* ---------- top bar: mark the section in view ---------- */
trackSections(new Map([...document.querySelectorAll('.nav a[href^="/#"]')].map((a) => [a.getAttribute('href').slice(2), a])));

/* ---------- products from /data/products.json ---------- */
const featureSlot = document.querySelector('[data-featured]');
const grid = document.querySelector('[data-products]');
try {
  const { products, settings } = await loadCatalog();
  const featured = products.find((p) => p.featured) || products[0];
  if (featureSlot) {
    if (featured) featureSlot.querySelector('.wrap').replaceChildren(featureTile(featured, settings));
    else featureSlot.hidden = true;
  }
  if (grid) {
    const limit = Number(grid.dataset.limit) || products.length;
    grid.replaceChildren(...(products.length ? products.slice(0, limit).map((p) => card(p, settings)) : [stateNode('ยังไม่มีสินค้าในตอนนี้')]));
  }
} catch {
  if (featureSlot) featureSlot.hidden = true;
  grid?.replaceChildren(stateNode('โหลดรายการสินค้าไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง'));
}
settlePhrases();
