import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };
type View = Point & { zoom: number };
const initial: View = { zoom: 1, x: 0, y: 0 };
const interactive = 'button, input, select, textarea, a, [role=slider], [role=button], [contenteditable]';

// Slide zoom is independent of browser zoom and never changes the design canvas.
export function SlideStage({ children, fitFactor = 1 }: { children: React.ReactNode; fitFactor?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<View>(initial);
  const current = useRef(view);
  const pointers = useRef(new Map<number, Point>());
  const panAllowed = useRef(false);
  const width = 1600, height = 900;
  const fit = Math.min(size.width / width, size.height / height) * fitFactor;
  const constrain = (v: View): View => {
    const limitX = Math.max(0, (width * fit * v.zoom - size.width) / 2);
    const limitY = Math.max(0, (height * fit * v.zoom - size.height) / 2);
    return { zoom: v.zoom, x: Math.max(-limitX, Math.min(limitX, v.x)), y: Math.max(-limitY, Math.min(limitY, v.y)) };
  };
  const update = (v: View) => { current.current = constrain(v); setView(current.current); };
  const zoomAt = (factor: number, point: Point, previousPoint = point) => {
    const v = current.current;
    const zoom = Math.max(1, Math.min(5, v.zoom * factor));
    const ratio = zoom / v.zoom;
    update({ zoom, x: point.x - (previousPoint.x - v.x) * ratio, y: point.y - (previousPoint.y - v.y) * ratio });
  };
  const local = (x: number, y: number): Point => {
    const rect = host.current!.getBoundingClientRect();
    return { x: x - rect.left - rect.width / 2, y: y - rect.top - rect.height / 2 };
  };
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize(entry.contentRect); current.current = initial; setView(initial);
      pointers.current.clear();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !window.matchMedia('(max-width: 768px)').matches) return;
      event.preventDefault();
      zoomAt(Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.03 : 0.002)), local(event.clientX, event.clientY));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [size.width, size.height, fitFactor]);
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.slide-zoom-controls')) return;
    pointers.current.set(e.pointerId, local(e.clientX, e.clientY));
    if (pointers.current.size === 1) panAllowed.current = !(e.target as HTMLElement).closest(interactive);
    if (pointers.current.size >= 2 || (panAllowed.current && current.current.zoom > 1)) {
      for (const id of pointers.current.keys()) e.currentTarget.setPointerCapture(id);
    }
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    const before = [...pointers.current.values()];
    const point = local(e.clientX, e.clientY);
    pointers.current.set(e.pointerId, point);
    const after = [...pointers.current.values()];
    if (after.length === 2) {
      e.preventDefault();
      const distance = (p: Point[]) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const center = (p: Point[]) => ({ x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 });
      if (distance(before) > 0) zoomAt(distance(after) / distance(before), center(after), center(before));
    } else if (after.length === 1 && panAllowed.current && current.current.zoom > 1) {
      e.preventDefault(); update({ ...current.current, x: current.current.x + point.x - previous.x, y: current.current.y + point.y - previous.y });
    }
  };
  const onEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return (
    <div className={`slide-viewport ${view.zoom > 1 ? 'is-zoomed' : ''}`} ref={host}
      onPointerDownCapture={onDown} onPointerMoveCapture={onMove}
      onPointerUpCapture={onEnd} onPointerCancelCapture={onEnd} onLostPointerCapture={e => pointers.current.delete(e.pointerId)}>
      <div className="slide-content" data-slide-canvas style={{ width, height, left: '50%', top: '50%', transformOrigin: 'center',
        transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${fit * view.zoom})` }}>
        {children}
      </div>
      <div className="slide-zoom-controls" role="group" aria-label="画布缩放">
        <button aria-label="缩小" onClick={() => zoomAt(1 / 1.25, { x: 0, y: 0 })} disabled={view.zoom <= 1}>−</button>
        <button className="slide-zoom-reset" aria-label="恢复适应窗口" title="恢复适应窗口" onClick={() => update(initial)}>{Math.round(view.zoom * 100)}%</button>
        <button aria-label="放大" onClick={() => zoomAt(1.25, { x: 0, y: 0 })} disabled={view.zoom >= 5}>+</button>
      </div>
    </div>
  );
}
