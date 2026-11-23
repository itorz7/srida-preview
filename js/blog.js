// Blog pages: the reading column needs no motion, so fx.js and the motion libraries never load here. Contents list + the share buttons.
import { initSite, trackSections } from './site.js';

initSite({ fx: false });
trackSections(new Map([...document.querySelectorAll('.toc--side a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a])));

const box = document.querySelector('[data-share]');
if (box) {
  const copy = box.querySelector('[data-copy]'), native = box.querySelector('[data-native]'), live = box.querySelector('[data-live]');
  const url = document.querySelector('link[rel=canonical]').href, label = copy.querySelector('span'), was = label.textContent;
  box.hidden = false;
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); } catch { const t = document.createElement('textarea'); t.value = url; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
    label.textContent = live.textContent = 'คัดลอกแล้ว';
    clearTimeout(copy._t);
    copy._t = setTimeout(() => { label.textContent = was; live.textContent = ''; }, 2000);
  });
  if (navigator.share) {
    native.hidden = false;
    native.addEventListener('click', () => navigator.share({ title: document.title, url }).catch(() => {}));
  }
}
