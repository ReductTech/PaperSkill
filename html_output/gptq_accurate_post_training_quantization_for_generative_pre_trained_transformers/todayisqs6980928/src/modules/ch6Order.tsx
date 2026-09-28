import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawBackground, drawLabel } from './scaleKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const MODES = [
  { id: 'fixed', name: '固定顺序 (GPTQ)', curve: 'fixed', txt: 'GPTQ 按固定顺序量化：误差略高于贪心但可忽略，换来复杂度降低一个数量级。', cls: 'good' },
  { id: 'greedy', name: '贪心 (OBQ)', curve: 'greedy', txt: 'OBQ 每次贪心挑最不敏感的权重：误差最低，但全局搜索慢到无法上大模型。', cls: '' },
];

// P4 模式切换：对比 GPTQ 固定顺序 vs OBQ 贪心顺序的误差增长曲线。
export const Ch6Order: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('fixed');

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
      drawBackground(ctx, W, H);
      const x0 = 150;
      const yBase = 200;
      const plotW = W - 300;
      const plotH = 150;

      // 坐标轴
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, yBase);
      ctx.lineTo(x0 + plotW, yBase);
      ctx.moveTo(x0, yBase - plotH);
      ctx.lineTo(x0, yBase);
      ctx.stroke();

      const drawCurve = (kind: string, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const t = i / 60;
          const x = x0 + t * plotW;
          const err = kind === 'fixed' ? t * 0.62 + 0.12 : t * 0.5;
          const y = yBase - err * plotH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      if (sel === 'fixed') drawCurve('fixed', C.green);
      else drawCurve('greedy', C.blue);
      drawLabel(ctx, '累计误差', x0 + plotW / 2, 40, C.ink, 20);
      drawLabel(ctx, '量化进度 →', x0 + plotW / 2, yBase + 26, C.muted, 16);

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
  }, [sel]);

  const cur = MODES.find((m) => m.id === sel)!;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MODES.map((m) => (
          <button key={m.id} className={`chip ${sel === m.id ? 'selected' : ''}`} onClick={() => setSel(m.id)}>
            {m.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${cur.cls}`}>{cur.txt}</div>
    </div>
  );
};

export default Ch6Order;
