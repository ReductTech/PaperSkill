import { useEffect, useId, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { setupCanvas } from '../lib/canvasKit';

type Phase = 'down' | 'move' | 'up';
type CanvasProps = {
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;
  height?: number;
  width?: number;
  animate?: boolean;
  label?: string;
  interaction?: 'drag' | 'select';
  onPointer?: (x: number, y: number, phase: Phase) => void;
  overlay?: ReactNode;
};

function DrawingSurface({ draw, width = 1080, height = 280, animate = false, label = '交互示意图', interaction = 'select', onPointer }: CanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current!;
    const context = setupCanvas(canvas, width, height);
    canvas.style.width = '100%'; canvas.style.height = 'auto';
    canvas.style.aspectRatio = `${width} / ${height}`;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, inView = false, running = false, elapsed = 0, last = 0;
    const paint = () => { context.clearRect(0, 0, width, height); drawRef.current(context, width, height, motion.matches ? 0 : elapsed); canvas.classList.add('is-ready'); };
    const tick = (now: number) => { elapsed += now - last; last = now; paint(); if (running) frame = requestAnimationFrame(tick); };
    const sync = () => {
      const shouldRun = animate && inView && !document.hidden && !motion.matches;
      if (shouldRun && !running) { running = true; last = performance.now(); frame = requestAnimationFrame(tick); }
      if (!shouldRun && running) { running = false; cancelAnimationFrame(frame); }
      paint();
    };
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, { threshold: 0.02 });
    observer.observe(canvas); paint();
    document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync);
    return () => { running = false; cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync); };
  }, [width, height, animate]);
  useEffect(() => {
    if (animate || !ref.current) return;
    const context = ref.current.getContext('2d');
    if (context) { context.clearRect(0, 0, width, height); draw(context, width, height, 0); ref.current.classList.add('is-ready'); }
  }, [draw, width, height, animate]);
  const point = (event: PointerEvent<HTMLCanvasElement>, phase: Phase) => {
    if (!onPointer) return;
    if (phase === 'down' && interaction === 'drag') event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    onPointer((event.clientX - rect.left) * width / rect.width, (event.clientY - rect.top) * height / rect.height, phase);
    if (phase === 'up' && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <canvas ref={ref} role="img" aria-label={label} style={{ touchAction: onPointer && interaction === 'drag' ? 'none' : 'auto', cursor: onPointer ? interaction === 'drag' ? 'crosshair' : 'pointer' : 'default' }} onPointerDown={e => point(e, 'down')} onPointerMove={e => point(e, 'move')} onPointerUp={e => point(e, 'up')} onPointerCancel={e => point(e, 'up')} />;
}

export function CanvasStage(props: CanvasProps) {
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!expanded || !dialog.current) return;
    dialog.current.showModal();
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = priorOverflow; opener.current?.focus({ preventScroll: true }); };
  }, [expanded]);
  return <div className="canvas-stage">
    <div className="canvas-viewport"><DrawingSurface {...props} />{props.overlay}</div>
    {!props.animate && <div className="canvas-tools">
      <span>{props.onPointer ? props.interaction === 'drag' ? '拖动图中橙点，或使用下方按钮' : '点选节点查看说明' : '图示随当前选项同步变化'}</span>
      <button ref={opener} type="button" className="canvas-expand" onClick={() => setExpanded(true)}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4" /><path d="m7 7-4-4m10 4 4-4M7 13l-4 4m10-4 4 4" /></svg>放大图示</button>
    </div>}
    {expanded && <dialog ref={dialog} className="canvas-dialog" aria-labelledby={titleId} onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="canvas-dialog-shell">
        <header><div><strong id={titleId}>图示详情</strong><span>左右滑动查看完整图示 · 返回实验继续操作</span></div><button type="button" className="canvas-dialog-close" onClick={() => dialog.current?.close()} aria-label="关闭放大图示">关闭 <span aria-hidden="true">×</span></button></header>
        <div className="canvas-dialog-scroll" tabIndex={0} aria-label="可横向滚动的放大图示"><div className="canvas-dialog-drawing" style={{ minWidth: Math.min(props.width ?? 1080, 960) }}><DrawingSurface {...props} onPointer={undefined} animate={false} />{props.overlay}</div></div>
        <p className="canvas-dialog-description">{props.label}</p>
      </div>
    </dialog>}
  </div>;
}
