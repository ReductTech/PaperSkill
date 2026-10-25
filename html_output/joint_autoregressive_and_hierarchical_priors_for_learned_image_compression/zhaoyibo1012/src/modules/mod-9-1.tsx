import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const CHIPS = [
  { id: 'm5', label: '5×5 掩码', cost: 0.5, par: 0.15, parLabel: '低' },
  { id: 'm3', label: '3×3 掩码', cost: 0.3, par: 0.2, parLabel: '低' },
  { id: 'm7', label: '7×7 掩码', cost: 0.7, par: 0.15, parLabel: '低' },
  { id: 'left', label: '只左邻', cost: 2.1, par: 0.6, parLabel: '中' },
  { id: 'row3', label: '上一行3码', cost: 3.1, par: 0.9, parLabel: '高' },
];

export const Mod91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'm5' });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('m5');
  const [feedback, setFeedback] = useState({ text: '5×5 掩码：看得全、预测准，但只能串行。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const cur = CHIPS.find((c) => c.id === stateRef.current.sel) || CHIPS[0];
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      // left: context window illustration (5x5 grid with shaded causal area)
      const gx = 80;
      const gy = 70;
      const cell = 28;
      ctx.fillStyle = '#68778f';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('因果上下文窗口', 80, 44);
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const x = gx + j * cell;
          const y = gy + i * cell;
          ctx.fillStyle = '#27446e';
          ctx.fillRect(x, y, cell - 4, cell - 4);
        }
      }
      // causal shading: upper-left + left + upper are visible (5x5 mask centered on current)
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(gx + 2 * cell, gy + 2 * cell, cell - 4, cell - 4);

      // right: two trade-off bars
      const bx = 480;
      const bw = 520;
      const costH = cur.cost / 3.2;
      const parH = cur.par;
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(bx, 90, costH * bw, 40);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, 90, bw, 40);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(bx, 190, parH * bw, 40);
      ctx.strokeRect(bx, 190, bw, 40);

      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('体积增幅（示意·越低越好）', bx, 78);
      ctx.fillText('并行度（越高越好）', bx, 178);
      ctx.fillStyle = '#68778f';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('+' + cur.cost.toFixed(1) + '%', bx + costH * bw + 10, 116);
      ctx.fillText(cur.parLabel, bx + parH * bw + 10, 216);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    stateRef.current.sel = id;
    setSel(id);
    if (id === 'm5') setFeedback({ text: '5×5 掩码：看得全、预测准，但只能串行。', cls: '' });
    else if (id === 'm3') setFeedback({ text: '3×3 掩码：体积略省，仍串行。', cls: '' });
    else if (id === 'm7') setFeedback({ text: '7×7 掩码：看得更多，体积稍增。', cls: '' });
    else if (id === 'left') setFeedback({ text: '只左邻：小幅体积增加（示意），换取可并行。', cls: 'good' });
    else setFeedback({ text: '上一行3码：稍多体积增加（示意），降成一维、并行度最高。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CHIPS.map((c) => (
          <button key={c.id} className={`chip ${sel === c.id ? 'selected' : ''}`} onClick={() => pick(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod91;
