import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', orange: '#f07e47', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const ROWS = 4;
const COLS = 6;
const important = new Set([2, 6, 10, 14, 18, 22]);

function fiFor(i: number): number {
  return important.has(i) ? 0.7 + ((i / 4) % 2) * 0.2 : 0.05 + ((i * 7) % 5) * 0.05;
}

export const EwcCh8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);
  const [feedback, setFeedback] = useState({ text: 'F_i 低：这个权重对旧任务几乎无关，EWC 会放手让它学新任务。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { sel: number }, now: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      const gx = 40, gy = 30, cw = 52, ch = 40, gap = 6;
      for (let i = 0; i < ROWS * COLS; i++) {
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        const x = gx + c * (cw + gap);
        const y = gy + r * (ch + gap);
        const fi = fiFor(i);
        ctx.fillStyle = fi > 0.7 ? C.orange : fi > 0.3 ? C.ground : '#ffffff';
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = s.sel === i ? C.blue : C.border;
        ctx.lineWidth = s.sel === i ? 4 : 1;
        ctx.strokeRect(x, y, cw, ch);
        if (s.sel === i) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 250);
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1 + 3 * pulse;
          ctx.strokeRect(x - 3, y - 3, cw + 6, ch + 6);
        }
      }
      // right detail panel
      const rx = 470, ry = 30, rw = 570, rh = 220;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(rx, ry, rw, rh);
      const fi = fiFor(s.sel);
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('权重 #' + s.sel, rx + 20, ry + 34);
      ctx.fillStyle = C.muted;
      ctx.fillText('F_i（重要度）', rx + 20, ry + 70);
      ctx.fillStyle = C.border;
      ctx.fillRect(rx + 140, ry + 54, 300, 24);
      ctx.fillStyle = fi > 0.7 ? C.orange : C.blue;
      ctx.fillRect(rx + 140, ry + 54, 300 * fi, 24);
      ctx.fillStyle = C.ink;
      ctx.fillText(fi.toFixed(2), rx + 140 + 300 * fi + 8, ry + 72);
      const penalty = 200 * fi * 0.04;
      ctx.fillStyle = C.muted;
      ctx.fillText('惩罚贡献 (λ/2)F_iΔθ², Δθ=0.2', rx + 20, ry + 120);
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(penalty.toFixed(1), rx + 20, ry + 150);
      ctx.fillStyle = C.muted;
      ctx.font = '12px sans-serif';
      ctx.fillText('橙色=高重要度，白色=低重要度', rx + 20, ry + 190);
    };
    const tick = (now: number) => {
      render(stateRef.current, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disc = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disc();
    };
  }, []);

  const pick = (i: number) => {
    stateRef.current.sel = i;
    setSel(i);
    const fi = fiFor(i);
    if (fi < 0.3) setFeedback({ text: 'F_i 低：这个权重对旧任务几乎无关，EWC 会放手让它学新任务。', cls: '' });
    else if (fi < 0.7) setFeedback({ text: 'F_i 中等：旧任务对它有一定依赖，更新要谨慎。', cls: '' });
    else setFeedback({ text: 'F_i 高：这是旧任务的关键权重，EWC 会把它牢牢锚住。', cls: 'good' });
  };
  const clickCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const gx = 40, gy = 30, cw = 52, ch = 40, gap = 6;
    const c = Math.floor((x - gx) / (cw + gap));
    const r = Math.floor((y - gy) / (ch + gap));
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) pick(r * COLS + c);
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} onClick={clickCanvas} style={{ cursor: 'pointer' }} />
      <div className="chip-row">
        {[0, 4, 8, 12, 16, 20].map((i) => (
          <button key={i} className={'chip' + (sel === i ? ' selected' : '')} onClick={() => pick(i)}>
            权重#{i}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh8Mod1;
