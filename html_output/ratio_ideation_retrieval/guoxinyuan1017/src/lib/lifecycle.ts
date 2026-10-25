// Per-mount lifecycle scope for the ported prototype behaviour.
//
// Every screen in this tutorial drives one requestAnimationFrame timeline and listens to a
// few window events. Without a scope those loops survive a chapter switch and keep running
// against detached nodes, so each mount registers everything it starts here and the React
// effect disposes it on unmount.

export interface Scope {
  readonly alive: boolean;
  /** requestAnimationFrame that silently drops the callback once the scope is disposed. */
  raf(cb: FrameRequestCallback): number;
  /** addEventListener whose listener is removed on dispose. */
  on(target: EventTarget, type: string, fn: EventListenerOrEventListenerObject): void;
  dispose(): void;
}

export function createScope(): Scope {
  let alive = true;
  const frames = new Set<number>();
  const listeners: Array<[EventTarget, string, EventListenerOrEventListenerObject]> = [];

  return {
    get alive() {
      return alive;
    },

    raf(cb: FrameRequestCallback): number {
      if (!alive) return 0;
      const id = window.requestAnimationFrame((t) => {
        frames.delete(id);
        if (alive) cb(t);
      });
      frames.add(id);
      return id;
    },

    on(target: EventTarget, type: string, fn: EventListenerOrEventListenerObject): void {
      if (!alive) return;
      target.addEventListener(type, fn);
      listeners.push([target, type, fn]);
    },

    dispose(): void {
      alive = false;
      frames.forEach((id) => window.cancelAnimationFrame(id));
      frames.clear();
      listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn));
      listeners.length = 0;
    },
  };
}
