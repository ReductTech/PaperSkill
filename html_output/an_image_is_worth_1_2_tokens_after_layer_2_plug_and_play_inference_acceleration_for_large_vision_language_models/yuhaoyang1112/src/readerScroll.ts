import { motionPreference as preference, reducedMotion } from './lib/controlMotion';

const root = document.documentElement;

function syncMotionPreference() {
  root.classList.toggle('is-reduced-motion', reducedMotion());
}
syncMotionPreference();
preference.addEventListener('change', syncMotionPreference);

/** Take one reader-initiated trip, then briefly track layout changes at the destination. */
export function positionReader(target: HTMLElement, main: HTMLElement, fromClick: boolean) {
  const scroller = document.scrollingElement ?? root;
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;
  let quietTimer = 0;
  let limitTimer = 0;
  let travelling = false;
  let observer: ResizeObserver | undefined;

  function destination() {
    if (target.id === 'top') return 0;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - margin - padding;
    return Math.max(0, Math.min(top, scroller.scrollHeight - scroller.clientHeight));
  }
  function position(y: number) {
    window.scrollTo({ top: y, behavior: 'instant' });
  }
  function stop() {
    controller.abort();
    cancelAnimationFrame(frame);
    clearTimeout(quietTimer);
    clearTimeout(limitTimer);
    observer?.disconnect();
    if (travelling) {
      travelling = false;
      root.classList.remove('reader-travelling');
    }
  }
  function settle() {
    if (signal.aborted) return;
    const top = destination();
    if (Math.abs(window.scrollY - top) > 1) position(top);
    clearTimeout(quietTimer);
    quietTimer = window.setTimeout(stop, 300);
  }
  function arrive() {
    cancelAnimationFrame(frame);
    root.classList.remove('reader-travelling');
    travelling = false;
    position(destination());
    if (fromClick) {
      const heading = document.getElementById(target.getAttribute('aria-labelledby') || '');
      const focusTarget = heading ?? target;
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
    if (document.hidden) { stop(); return; }
    observer = new ResizeObserver(settle);
    observer.observe(main);
    observer.observe(target);
    window.addEventListener('resize', settle, { signal });
    quietTimer = window.setTimeout(stop, 300);
    limitTimer = window.setTimeout(stop, 3000);
  }
  function interrupt() {
    const wasMoving = travelling;
    stop();
    if (wasMoving) window.dispatchEvent(new Event('scroll'));
  }
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    window.addEventListener(event, interrupt, { capture: true, passive: true, signal });
  }
  if (target instanceof HTMLDetailsElement) target.open = true;
  const distance = Math.abs(destination() - window.scrollY);
  if (!fromClick || distance < 2 || document.hidden || reducedMotion()) {
    arrive();
    return stop;
  }

  travelling = true;
  root.classList.add('reader-travelling');
  const duration = Math.min(460, 205 + 72 * Math.log1p(distance / Math.max(320, window.innerHeight * 0.65)));
  const start = performance.now();
  let previousProgress = 0;
  function step(now: number) {
    if (signal.aborted) return;
    const t = Math.max(0, Math.min(1, (now - start) / duration));
    if (t >= 1) { arrive(); return; }
    const progress = t * t * (3 - 2 * t);
    // Consume the remaining distance so an image or canvas resizing mid-trip
    // changes the landing position without restarting or snapping the scroll.
    const fraction = (progress - previousProgress) / (1 - previousProgress);
    position(window.scrollY + (destination() - window.scrollY) * fraction);
    previousProgress = progress;
    frame = requestAnimationFrame(step);
  }
  const finishIfNecessary = () => {
    if (travelling && (document.hidden || preference.matches)) arrive();
  };
  document.addEventListener('visibilitychange', finishIfNecessary, { signal });
  preference.addEventListener('change', finishIfNecessary, { signal });
  frame = requestAnimationFrame(step);
  return stop;
}
