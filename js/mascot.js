// บักสีดา moves. Every .disc[data-clip] holds her still picture (the clip's first pose); this lays the short loop over it.
// An extra, loaded at idle by site.js and never under reduced motion or Save-Data: without it the page shows the stills.
// Only a clip that is on screen plays; on a touch screen one clip plays at a time (the one nearest the middle of the screen);
// everything stops while the tab is hidden. data-hover names a clip that plays once on hover (mouse) or tap (touch).
// The clips are WebM (VP9) with a transparent background: Chrome, Edge, Firefox and Android play them with alpha. Safari and
// iPhone do not show WebM alpha, so they keep the transparent still (no canvas or WebGL keying: that would make a phone lag).
const SAFARI = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
const CAN_ALPHA = !SAFARI && !!document.createElement('video').canPlayType('video/webm; codecs="vp9"');
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const file = (name, el) => `/assets/mascot/clip/baksida-${name}-${el.clientWidth * Math.min(window.devicePixelRatio || 1, 2) > 520 ? 720 : 480}.webm`;
const seen = new Map(); // disc → share of it on screen
const clips = new WeakMap(); // disc → its looping <video>

function video(el, name, loop) {
  const v = document.createElement('video');
  v.muted = true;
  v.defaultMuted = true;
  v.loop = loop;
  v.playsInline = true;
  v.preload = 'none';
  v.disablePictureInPicture = true;
  v.tabIndex = -1;
  v.setAttribute('aria-hidden', 'true');
  v.addEventListener('playing', () => v.classList.add('is-on'));
  v.src = file(name, el);
  el.append(v);
  return v;
}

function update() {
  const on = [...seen].filter(([el, share]) => share >= 0.35 && el.isConnected).map(([el]) => el);
  let play = on;
  if (!FINE && on.length > 1) {
    const mid = innerHeight / 2;
    const off = (el) => { const r = el.getBoundingClientRect(); return Math.abs((r.top + r.bottom) / 2 - mid); };
    play = [on.reduce((a, b) => (off(b) < off(a) ? b : a))];
  }
  for (const el of seen.keys()) {
    const want = !document.hidden && play.includes(el) && !el.dataset.busy;
    let v = clips.get(el);
    if (want) {
      if (!v) clips.set(el, (v = video(el, el.dataset.clip, true)));
      if (v.paused) v.play().catch(() => {});
    } else if (v && !v.paused) v.pause();
  }
}

function once(el) { // the hover / tap clip: played once over the loop, then the loop shows again
  if (el.dataset.busy) return;
  el.dataset.busy = '1';
  const v = video(el, el.dataset.hover, false);
  const done = () => {
    if (!el.dataset.busy) return;
    delete el.dataset.busy;
    v.classList.remove('is-on');
    setTimeout(() => v.remove(), 450);
    update();
  };
  v.addEventListener('ended', done);
  v.addEventListener('error', done);
  v.play().catch(done);
  if (!FINE) update(); // a phone decodes one clip at a time: the loop under it waits
}

export function initMascot() {
  if (!CAN_ALPHA || matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) seen.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
    update();
  }, { threshold: [0, 0.35, 0.7] });
  document.querySelectorAll('.disc[data-clip]').forEach((el) => {
    seen.set(el, 0);
    io.observe(el);
    if (!el.dataset.hover) return;
    if (FINE) el.addEventListener('pointerenter', () => once(el));
    else el.addEventListener('click', () => once(el));
  });
  document.addEventListener('visibilitychange', update);
  addEventListener('scroll', () => { if (!FINE) requestAnimationFrame(update); }, { passive: true });

  // moving parts that have left the screen stand still until they come back (the stylesheet pauses .is-away)
  const away = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-away', !e.isIntersecting)));
  document.querySelectorAll('.scene, .mock, .bento').forEach((el) => away.observe(el));
}
