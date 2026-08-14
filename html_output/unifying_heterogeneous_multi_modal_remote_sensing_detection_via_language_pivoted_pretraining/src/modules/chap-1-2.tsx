import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap1Mod2 — cross-modality gradient cosine matrix (math/technical, P4 chip).
// Two preset states: late alignment (off-diag = -0.42) vs early alignment (off-diag = +0.12).

const W = 560;
const H = 260;
const LABELS = ['SAR', 'RGB', 'IR'];
const LATE = [
  [1.00, -0.42, -0.36],
  [-0.42, 1.00, -0.28],
  [-0.36, -0.28, 1.00],
];
const EARLY = [
  [1.00, 0.12, 0.08],
  [0.12, 1.00, 0.18],
  [0.08, 0.18, 1.00],
];

function colorFor(v: number) {
  // -1 -> red, 0 -> neutral, +1 -> green
  if (v >= 0) return lerpColor('#f5f8f0', '#228d5c', v);
  return lerpColor('#f5f8f0', '#c43f52', -v);
}

export const Chap1Mod2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'late' as 'late' | 'early', anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'late' | 'early'>('late');
  const [feedback, setFeedback] = useState({ text: '晚期对齐：跨模态梯度相互拉扯，∥g∥² 变大。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      s.anim = Math.min(1, s.anim + 0.04);
      const a = easeOutCubic(s.anim);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const target = s.mode === 'late' ? LATE : EARLY;
      const gridX = 130, gridY = 36;
      const cellW = 120, cellH = 60;
      const gap = 6;

      // column labels
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) {
        ctx.fillText(LABELS[i], gridX + i * (cellW + gap) + cellW / 2, gridY - 14);
      }
      // row labels
      ctx.textAlign = 'right';
      for (let i = 0; i < 3; i++) {
        ctx.fillText(LABELS[i], gridX - 12, gridY + i * (cellH + gap) + cellH / 2);
      }
      // heatmap
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = gridX + c * (cellW + gap);
          const y = gridY + r * (cellH + gap);
          const v = target[r][c];
          ctx.fillStyle = colorFor(v);
          ctx.fillRect(x, y, cellW, cellH);
          ctx.strokeStyle = '#d7deea';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellW, cellH);
          ctx.fillStyle = '#21324a';
          ctx.font = 'bold 14px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(v.toFixed(2), x + cellW / 2, y + cellH / 2);
        }
      }

      // title
      ctx.fillStyle = '#27446e';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('跨模态梯度余弦  cos(g_i, g_j)', 20, 22);

      // legend
      const lx = 20, ly = H - 36;
      const grad = ctx.createLinearGradient(lx, ly, lx + 200, ly);
      grad.addColorStop(0, '#c43f52');
      grad.addColorStop(0.5, '#f5f8f0');
      grad.addColorStop(1, '#228d5c');
      ctx.fillStyle = grad;
      ctx.fillRect(lx, ly, 200, 10);
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(lx, ly, 200, 10);
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('-1 (冲突)  0  +1 (同向)', lx, ly + 24);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const switchMode = (m: 'late' | 'early') => {
    setMode(m);
    stateRef.current.mode = m;
    stateRef.current.anim = 0;
    if (m === 'late') {
      setFeedback({ text: '晚期对齐：跨模态梯度相互拉扯，∥g∥² 变大。', cls: 'bad' });
    } else {
      setFeedback({ text: '<b>早期对齐</b>：跨模态梯度趋于同向，方差变小。', cls: 'good' });
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'late' ? 'selected' : ''}`} onClick={() => switchMode('late')}>晚期对齐（关）</button>
        <button className={`chip ${mode === 'early' ? 'selected' : ''}`} onClick={() => switchMode('early')}>早期 + 语言枢轴（开）</button>
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Chap1Mod2;
