import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

type Method = 'sgd' | 'l2' | 'ewc';

export const EwcCh1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ method: Method }>({ method: 'sgd' });
  const rafRef = useRef<number | null>(null);
  const [method, setMethod] = useState<Method>('sgd');
  const [feedback, setFeedback] = useState({ text: 'SGD：学会任务 B，冲掉任务 A。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { method: Method }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      const ix = 60, iy = 20, iw = 960, ih = 230;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(ix, iy, iw, ih);
      const x0 = ix + 40;
      const yBase = iy + ih - 34;
      const top = iy + 20;
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, top);
      ctx.lineTo(x0, yBase);
      ctx.lineTo(ix + iw - 10, yBase);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '12px sans-serif';
      ctx.fillText('0', x0 - 16, yBase + 4);
      ctx.fillText('1', x0 - 16, top + 8);
      ctx.fillText('训练进程 →', ix + iw - 90, yBase + 4);
      ctx.strokeStyle = C.border;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, yBase - 0.9 * (yBase - top));
      ctx.lineTo(ix + iw - 20, yBase - 0.9 * (yBase - top));
      ctx.stroke();
      ctx.setLineDash([]);
      const curve = (vals: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        vals.forEach((v, i) => {
          const x = x0 + (i / (vals.length - 1)) * (iw - 70);
          const y = yBase - v * (yBase - top);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };
      const aSgd = [0.95, 0.92, 0.8, 0.55, 0.28, 0.1, 0.06];
      const bSgd = [0.1, 0.35, 0.62, 0.82, 0.92, 0.95, 0.95];
      const aL2 = [0.95, 0.93, 0.91, 0.9, 0.9, 0.9, 0.9];
      const bL2 = [0.1, 0.18, 0.25, 0.3, 0.33, 0.35, 0.35];
      const aEwc = [0.95, 0.94, 0.92, 0.91, 0.9, 0.9, 0.9];
      const bEwc = [0.1, 0.35, 0.6, 0.8, 0.9, 0.94, 0.95];
      if (s.method === 'sgd') {
        curve(aSgd, C.red);
        curve(bSgd, C.blue);
      } else if (s.method === 'l2') {
        curve(aL2, C.green);
        curve(bL2, C.blue);
      } else {
        curve(aEwc, C.green);
        curve(bEwc, C.blue);
      }
      ctx.fillStyle = C.ink;
      ctx.font = '13px sans-serif';
      ctx.fillText('任务A', x0 + 10, top + 30);
      ctx.fillText('任务B', x0 + 10, top + 52);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, top + 24);
      ctx.lineTo(x0 + 28, top + 24);
      ctx.stroke();
      ctx.strokeStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(x0, top + 46);
      ctx.lineTo(x0 + 28, top + 46);
      ctx.stroke();
    };
    const tick = () => {
      render(stateRef.current);
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

  const pick = (m: Method) => {
    stateRef.current.method = m;
    setMethod(m);
    if (m === 'sgd') setFeedback({ text: 'SGD 学会了任务 B，却把任务 A 冲掉了。', cls: 'bad' });
    else if (m === 'l2') setFeedback({ text: 'L2 把每个权重都同样拉住，旧任务保住了，但新任务学不动。', cls: 'bad' });
    else setFeedback({ text: 'EWC 只牢牢拉住重要权重，新旧任务都能保持在 0.9 附近。', cls: 'good' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(['sgd', 'l2', 'ewc'] as Method[]).map((m) => (
          <button key={m} className={'chip' + (method === m ? ' selected' : '')} onClick={() => pick(m)}>
            {m === 'sgd' ? 'SGD' : m === 'l2' ? 'L2 约束' : 'EWC'}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh1Mod2;
