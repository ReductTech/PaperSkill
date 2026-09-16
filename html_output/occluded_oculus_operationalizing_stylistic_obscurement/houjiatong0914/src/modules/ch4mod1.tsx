import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, dist } from '../lib/canvasKit';
import { COLORS, clearScene, drawLabel } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const AUTHORS = [
  { name: 'Gilmore', x: 300, y: 90 },
  { name: 'Hughes', x: 430, y: 196 },
  { name: 'May', x: 640, y: 120 },
];

const METRICS = ['delta', 'argamon', 'eder', 'simple', 'canberra', 'manhattan', 'euclidean', 'cosine', 'wurzburg', 'minmax'];

const HOME = { bx: 780, by: 150 };

/** Nearest author sample to a point. Shared by the initial state, the reset
 *  button and drag updates so the HTML label always agrees with the canvas. */
function nearestTo(bx: number, by: number): { name: string; d: number } {
  let best = AUTHORS[0];
  let bestD = Infinity;
  for (const a of AUTHORS) {
    const dd = dist(a.x, a.y, bx, by);
    if (dd < bestD) {
      bestD = dd;
      best = a;
    }
  }
  return { name: best.name, d: bestD };
}

const HOME_NEAREST = nearestTo(HOME.bx, HOME.by);

export const Ch4Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ bx: HOME.bx, by: HOME.by, dragging: false });
  const raf = useRef<number | null>(null);
  const [nearest, setNearest] = useState(HOME_NEAREST.name);
  const [d, setD] = useState(HOME_NEAREST.d);
  const [fb, setFb] = useState({ text: '拖动橙色样本点，观察它与三位作者样本的距离。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { bx: number; by: number }) => {
      clearScene(ctx, W, H);
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(80, 240); ctx.lineTo(W - 60, 240); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(100, 250); ctx.lineTo(100, 40); ctx.stroke();

      let best = AUTHORS[0];
      let bestD = Infinity;
      for (const a of AUTHORS) {
        const dd = dist(a.x, a.y, s.bx, s.by);
        if (dd < bestD) { bestD = dd; best = a; }
      }

      for (const a of AUTHORS) {
        const isBest = a === best;
        ctx.fillStyle = COLORS.blue;
        ctx.beginPath(); ctx.arc(a.x, a.y, isBest ? 16 : 12, 0, Math.PI * 2); ctx.fill();
        if (isBest) {
          ctx.strokeStyle = COLORS.blue;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(a.x, a.y, 26, 0, Math.PI * 2); ctx.stroke();
        }
      }

      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 6]);
      ctx.beginPath(); ctx.moveTo(best.x, best.y); ctx.lineTo(s.bx, s.by); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = COLORS.orange;
      ctx.beginPath(); ctx.arc(s.bx, s.by, 15, 0, Math.PI * 2); ctx.fill();

      drawLabel(ctx, 'd = ' + bestD.toFixed(2), (best.x + s.bx) / 2 - 30, (best.y + s.by) / 2 - 12, COLORS.ink, 20);
    };

    const tick = () => {
      render(st.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, []);

  const update = (bx: number, by: number) => {
    st.current.bx = clamp(bx, 130, W - 60);
    st.current.by = clamp(by, 40, 230);
    const { name, d: bestD } = nearestTo(st.current.bx, st.current.by);
    setNearest(name);
    setD(bestD);
    setFb(
      bestD < 120
        ? { text: '样本落进最近邻范围，会被直接归为 ' + name + '。', cls: 'bad' }
        : bestD < 240
        ? { text: '样本位于边界附近，归属开始变得不确定。', cls: '' }
        : { text: '样本远离所有作者样本，更难被归为任何一位。', cls: 'good' }
    );
  };

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    if (dist(p.x, p.y, st.current.bx, st.current.by) < 40) {
      st.current.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!st.current.dragging) return;
    const p = toCanvas(e);
    update(p.x, p.y);
  };
  const onPointerUp = () => { st.current.dragging = false; };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: 'grab', touchAction: 'none' }}
      />
      <div className="ctrl">
        <button className="chip" onClick={() => update(HOME.bx, HOME.by)}>重置样本</button>
        <span className="val">最近邻 {nearest} · d = {d.toFixed(2)}</span>
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>论文实际使用的十种距离度量</div>
        <div style={{ lineHeight: 1.8 }}>{METRICS.join(' · ')}</div>
        <div style={{ marginTop: 8, color: 'var(--paper-ink-muted)' }}>
          画布中的坐标与距离为说明性示意，用于展示“归属即最近邻”这一机制；论文的真实数值见第 7 章的距离表。
        </div>
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default Ch4Mod1;
