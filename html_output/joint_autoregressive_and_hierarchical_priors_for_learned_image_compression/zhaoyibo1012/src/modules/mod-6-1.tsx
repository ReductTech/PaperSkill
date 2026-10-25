import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const N = 5;
const TOTAL = N * N;

export const Mod61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '第 0 块：点「下一步」开始光栅扫描。', cls: '' });

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
      const s = stateRef.current;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      const gx = 60;
      const gy = 70;
      const cell = 36;
      for (let idx = 0; idx < TOTAL; idx++) {
        const i = Math.floor(idx / N);
        const j = idx % N;
        const x = gx + j * cell;
        const y = gy + i * cell;
        if (idx < s.step) ctx.fillStyle = '#27446e';
        else if (idx === s.step) ctx.fillStyle = '#f07e47';
        else ctx.fillStyle = '#d7deea';
        ctx.fillRect(x, y, cell - 4, cell - 4);
      }

      ctx.fillStyle = '#68778f';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('光栅扫描（蓝=已解码 橙=当前 灰=未解码）', 60, 40);

      const cur = Math.min(s.step, TOTAL - 1);
      const i = Math.floor(cur / N);
      const j = cur % N;
      const mu = (0.2 + 0.6 * ((i + j) / 8)).toFixed(2);
      const sigma = (0.5 - 0.28 * ((i + j) / 8)).toFixed(2);
      ctx.fillStyle = '#21324a';
      ctx.font = '24px "Segoe UI", sans-serif';
      ctx.fillText('当前块', 420, 90);
      ctx.fillStyle = '#27446e';
      ctx.fillText('μ = ' + mu, 420, 130);
      ctx.fillText('σ = ' + sigma, 420, 166);
      ctx.fillStyle = '#68778f';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('只能参考左上方已解码邻居', 420, 206);

      ctx.fillStyle = '#27446e';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('进度 ' + s.step + ' / ' + TOTAL, 60, H - 44);

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

  const go = (v: number) => {
    const next = clamp(v, 0, TOTAL);
    stateRef.current.step = next;
    setStep(next);
    if (next >= TOTAL) setFeedback({ text: '全部解码完成，这就是串行顺序。', cls: 'good' });
    else setFeedback({ text: `第 ${next} 块：只能看左上方已解码的邻居。`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step <= 0}>
          上一步
        </button>
        <span className="step-label">
          步 <b>{step}</b> / {TOTAL}
        </span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step >= TOTAL}>
          下一步
        </button>
        <button className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod61;
