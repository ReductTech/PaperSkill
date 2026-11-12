const explicitReduction = new URLSearchParams(location.search).get('motion') === 'reduce';
export const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => explicitReduction || motionPreference.matches;
export const skipFeedback = () => document.hidden || reducedMotion();
export const controlEase = 'cubic-bezier(.22,1,.36,1)';
export const plotChange = 'fastv-plot-selection';

// Only small, user-triggered feedback is tracked here. End it if the tab or
// motion setting changes, so an old selection never plays on returning.
const running = new Set<Animation>();
function finishFeedback() {
  if (skipFeedback()) for (const animation of running) animation.finish();
}
document.addEventListener('visibilitychange', finishFeedback);
motionPreference.addEventListener('change', finishFeedback);
export function playFeedback(el: Element, frames: Keyframe[], duration: number) {
  if (skipFeedback()) return;
  const animation = el.animate(frames, {duration, easing: controlEase});
  running.add(animation);
  const remove = () => running.delete(animation);
  animation.onfinish = remove;
  animation.oncancel = remove;
  return animation;
}


const readingAnimations = new WeakMap<HTMLElement, Animation>();
export function signalReading(el: HTMLElement) {
  if (skipFeedback()) return;
  const old = readingAnimations.get(el);
  const opacity = old?.playState === 'running' ? getComputedStyle(el).opacity : '.7';
  old?.cancel();
  const next = playFeedback(el, [{opacity}, {opacity: 1}], 240);
  if (next) readingAnimations.set(el, next);
}
