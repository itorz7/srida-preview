// /brand/: the copy buttons (a colour code, the font-family line, a company text) and the "download all" button.
import { initSite } from './site.js';

initSite();

document.addEventListener('click', async (e) => {
  const btn = e.target instanceof Element ? e.target.closest('[data-copy]') : null;
  if (!btn) return;
  const label = btn.querySelector('[data-label]');
  let ok = false;
  try {
    await navigator.clipboard.writeText(btn.dataset.copy);
    ok = true;
  } catch {
    // no clipboard access: select the text so Ctrl+C works
    const range = document.createRange();
    range.selectNodeContents(label);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  if (!ok) return;
  label.dataset.text ||= label.textContent;
  btn.dataset.name ||= btn.getAttribute('aria-label');
  label.textContent = 'คัดลอกแล้ว';
  btn.setAttribute('aria-label', 'คัดลอกแล้ว'); // the name a screen reader speaks follows the visible text
  btn.classList.add('done');
  clearTimeout(btn._t);
  btn._t = setTimeout(() => {
    label.textContent = label.dataset.text;
    btn.setAttribute('aria-label', btn.dataset.name);
    btn.classList.remove('done');
  }, 1400);
});

// "Download all": the whole pack is too large to sit beside the page (25 MB a file), so its address is set in
// data/products.json → settings.brandPackUrl. Until one is there the button says so and does nothing.
const all = document.querySelector('[data-pack-all][aria-disabled]');
if (all) {
  fetch('/data/products.json').then((r) => r.json()).then(({ settings = {} }) => {
    const url = String(settings.brandPackUrl || '').trim();
    if (!/^https:\/\//i.test(url)) return;
    all.href = url;
    all.rel = 'noopener';
    all.removeAttribute('aria-disabled');
    document.querySelector('[data-wait]')?.remove();
  }).catch(() => {});
}
