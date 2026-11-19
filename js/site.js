// Shared behaviour for every page: top bar, mobile menu, tabs, copy buttons, the contact link.

// A phrase kept whole (.ph) that is wider than its column would strand words on lines of their own.
// Such a phrase is released to flow as normal text. Runs after text is drawn, when fonts arrive and on resize.
export function settlePhrases(root = document) {
  const kept = [...root.querySelectorAll('.ph')];
  kept.forEach((s) => s.classList.remove('is-flow'));
  kept
    .filter((s) => s.offsetHeight > 1.6 * parseFloat(getComputedStyle(s).lineHeight))
    .forEach((s) => s.classList.add('is-flow'));
}

// A tab list (role=tablist) with arrow keys, Home and End. The chosen panel gets .is-in so CSS can play its entrance.
export function initTabs(list, { onSelect } = {}) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function select(tab, { focus = false, motion = true } = {}) {
    tabs.forEach((t, i) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.remove('is-in');
      if (on) {
        if (motion) {
          void panel.offsetWidth; // restart the entrance
          panel.classList.add('is-in');
        }
        onSelect?.(t, i, panel, motion);
      }
    });
    if (focus) tab.focus({ preventScroll: true });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      if (tab.getAttribute('aria-selected') !== 'true') select(tab);
    });
    tab.addEventListener('keydown', (e) => {
      const j = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      select(tabs[j], { focus: true });
    });
  });
  return { tabs, select };
}

// The contact buttons ([data-contact]) wait for an address in data/products.json → settings.contactUrl (or orderUrl).
async function wireContact() {
  const links = document.querySelectorAll('[data-contact]');
  if (!links.length) return;
  try {
    const res = await fetch('/data/products.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const { settings = {} } = await res.json();
    const raw = String(settings.contactUrl || settings.orderUrl || '').trim();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return;
    links.forEach((a) => {
      a.href = raw;
      a.removeAttribute('aria-disabled');
      a.textContent = settings.contactLabel || 'ติดต่อทีม Srida';
      if (/^https?:/i.test(raw)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
  } catch {}
}

export function initSite() {
  settlePhrases();
  document.fonts?.ready.then(() => settlePhrases());
  let settling = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(settling);
    settling = requestAnimationFrame(() => settlePhrases());
  });

  const bar = document.getElementById('bar');
  if (bar) {
    const stuck = () => bar.classList.toggle('is-stuck', window.scrollY > 6);
    stuck();
    window.addEventListener('scroll', stuck, { passive: true });
    const btn = bar.querySelector('.menu-btn');
    const nav = bar.querySelector('.nav');
    if (btn && nav) {
      const set = (open) => {
        nav.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
      };
      btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
      nav.addEventListener('click', (e) => e.target.closest('a') && set(false));
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
          set(false);
          btn.focus();
        }
      });
    }
  }

  // copy a command or a code block (without the "$ " prompt)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const code = btn.closest('.cmd, .code').querySelector('code');
    const text = [...code.childNodes]
      .filter((n) => !(n.nodeType === 1 && n.classList.contains('p')))
      .map((n) => n.textContent)
      .join('')
      .trim();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      ok = !!(document.execCommand && document.execCommand('copy'));
    }
    btn.dataset.label ||= btn.textContent;
    btn.textContent = ok ? 'คัดลอกแล้ว' : 'กด Ctrl+C';
    btn.classList.add('done');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      btn.textContent = btn.dataset.label;
      btn.classList.remove('done');
    }, 1600);
  });

  // links that have no address yet
  document.addEventListener('click', (e) => {
    if (e.target.closest('a[aria-disabled="true"]')) e.preventDefault();
  });

  wireContact();
}

// Mark the link whose section is in view (top-bar anchors on the home page, the contents list of an article).
export function trackSections(links) {
  if (!('IntersectionObserver' in window) || !links.size) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        links.get(en.target.id)?.setAttribute('aria-current', 'true');
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  links.forEach((_, id) => {
    const target = document.getElementById(id);
    if (target) io.observe(target);
  });
}
