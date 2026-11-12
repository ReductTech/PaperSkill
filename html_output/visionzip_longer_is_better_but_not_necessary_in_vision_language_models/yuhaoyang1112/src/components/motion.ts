import { useLayoutEffect, useRef } from 'react';

export const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const queryReduced = new URLSearchParams(location.search).get('motion') === 'reduce';
const running = new Set<Animation>();
export const easeOut = 'cubic-bezier(.22, 1, .36, 1)';

export const reducedMotion = () => queryReduced || motionPreference.matches;
export function motionAllowed() {
  return !document.hidden && !reducedMotion();
}

function settle() {
  if (motionAllowed()) return;
  for (const animation of running) animation.finish();
}
function syncVisibility() {
  document.documentElement.classList.toggle('vz-ui-hidden', document.hidden);
  settle();
}
syncVisibility();
document.addEventListener('visibilitychange', syncVisibility);
motionPreference.addEventListener('change', settle);

export function animateUI(el: HTMLElement, frames: Keyframe[], duration: number) {
  if (!motionAllowed() || !el.animate) return;
  const animation = el.animate(frames, { duration, easing: easeOut });
  running.add(animation);
  animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  return animation;
}

// The content switches synchronously. Animate its reading surface without cloning
// controls, focusable terms or live regions. Rapid reversals resume mid-flight.
export function useContentMotion<T extends HTMLElement>(value: string | number, instantKey?: string) {
  const node = useRef<T>(null);
  const lastValue = useRef(value);
  const lastInstant = useRef(instantKey);
  const active = useRef<Animation>();
  useLayoutEffect(() => {
    if (lastInstant.current !== instantKey) {
      active.current?.cancel();
      lastInstant.current = instantKey;
      lastValue.current = value;
      return;
    }
    if (lastValue.current === value) return;
    lastValue.current = value;
    const el = node.current;
    if (!el) return;
    const continuing = active.current?.playState === 'running';
    const start = continuing ? getComputedStyle(el) : null;
    const from = { opacity: start?.opacity ?? '.72', transform: start?.transform ?? 'translateY(4px)' };
    active.current?.cancel();
    const rect = el.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) {
      active.current = animateUI(el, [from, { opacity: 1, transform: 'translateY(0)' }], 320);
    }
  }, [value, instantKey]);
  useLayoutEffect(() => () => active.current?.cancel(), []);
  return node;
}
