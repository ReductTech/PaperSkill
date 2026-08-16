import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch5 Module 2：边界 token 的双重作业（semantic + geometric）
const W = 560;
const H = 220;

export const M52: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [dual, setDual] = useState(true);
  const [feedback, setFeedback] = useState({
    text: '点击「开始双重监督」：一个边界 token 同时收语义（这是什么）与几何（边界结构如何）两份作业。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();
    const render = (d: boolean, t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const gx = 200;
      const gy = 40;
      const gs = 100;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(gx, gy, gs / 2, gs);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(gx + gs / 2, gy, gs / 2, gs);
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2.4;
      ctx.strokeRect(gx, gy, gs, gs);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx + gs / 2, gy);
      ctx.lineTo(gx + gs / 2, gy + gs);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('边界 token', gx + gs / 2 - 40, gy + gs + 20);

      const seg = ((t - t0) % 3000) / 3000;
      if (seg < 0.3) {
        ctx.fillStyle = '#21324a';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(gx, gy, gs, gs);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('?', gx + gs / 2 - 12, gy + gs / 2 + 10);
      }

      if (d && seg > 0.3) {
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(gx + gs / 2, gy + gs / 2);
        ctx.lineTo(gx + gs / 2 + 150, gy - 30);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('L_iBOT 语义：“这里该是什么？”', gx + gs / 2 + 40, gy - 36);
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(gx + gs / 2, gy + gs / 2);
        ctx.lineTo(gx + gs / 2 + 150, gy + gs + 30);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('L_bnd 几何：“边界结构如何？”', gx + gs / 2 + 40, gy + gs + 40);
      } else if (!d) {
        ctx.fillStyle = '#c43f52';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('只有语义：在「两区交界」处，语义本就含糊。', 40, 210);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current, performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef(true);
  stateRef.current = dual;

  const setDualState = (d: boolean) => {
    stateRef.current = d;
    setDual(d);
    setFeedback(
      d
        ? { text: '双重作业：语义目标在交界处含糊，几何目标正好补上这块短板——两者互补不互斥。', cls: 'good' }
        : { text: '仅语义：交界处的「这里该是什么」本身就不确定，模型学不清。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${dual ? 'active' : ''}`} onClick={() => setDualState(true)}>
          双重监督（语义+几何）
        </button>
        <button className={`chip ${!dual ? 'active' : ''}`} onClick={() => setDualState(false)}>
          仅语义
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M52;
