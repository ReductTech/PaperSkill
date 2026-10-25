import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', gd: '#76906a', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', orange: '#f07e47', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

export const EwcCh3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: '这是任务 A 的解 θ_A*。点“下一步”看两条路径。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      // left archery scene
      ctx.fillStyle = C.ground;
      ctx.fillRect(0, 230, 520, 30);
      ctx.fillStyle = C.gd;
      ctx.fillRect(0, 230, 520, 3);
      const bothGreen = s.step === 3;
      for (const [tx, col] of [[120, bothGreen ? C.green : (s.step === 1 ? C.red : C.green)], [400, s.step >= 2 ? C.green : C.blue]] as [number, string][]) {
        for (let i = 3; i >= 1; i--) {
          ctx.beginPath();
          ctx.arc(tx, 170, 20 * i, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 1 ? C.scene : C.ground;
          ctx.fill();
          ctx.strokeStyle = C.ink;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(tx, 170, 9, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
      const lean = s.step === 1 ? 20 : s.step >= 2 ? 6 : 2;
      ctx.strokeStyle = s.step === 1 ? C.red : C.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(260, 200);
      ctx.lineTo(260 + lean, 176);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(260 + lean, 164, 12, 0, Math.PI * 2);
      ctx.stroke();
      // right parameter space inset
      const ix = 560, iy = 20, iw = 500, ih = 230;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(ix, iy, iw, ih);
      const ax = ix + 60, ay = iy + ih - 50;
      const bx = ix + iw - 50, by = iy + 50;
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(ix + 20, ay);
      ctx.lineTo(ix + iw - 10, ay);
      ctx.moveTo(ix + 20, iy + 10);
      ctx.lineTo(ix + 20, ay);
      ctx.stroke();
      ctx.fillStyle = 'rgba(184,201,167,0.55)';
      ctx.beginPath();
      ctx.ellipse(ax, ay, 90, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(240,126,71,0.30)';
      ctx.beginPath();
      ctx.ellipse(bx, by, 90, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      if (s.step >= 1) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (s.step >= 2) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((ax + bx) / 2, ay - 30, s.step === 3 ? bx : (ax + bx) / 2, s.step === 3 ? by : ay - 10);
        ctx.stroke();
      }
      ctx.fillStyle = C.ink;
      ctx.font = '13px sans-serif';
      ctx.fillText('θ_A*', ax - 26, ay + 18);
      ctx.fillText('θ_B*', bx + 8, by + 4);
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

  const go = (delta: number) => {
    const next = Math.max(0, Math.min(3, stateRef.current.step + delta));
    stateRef.current.step = next;
    setStep(next);
    if (next === 0) setFeedback({ text: '这是任务 A 的解 θ_A*。', cls: '' });
    else if (next === 1) setFeedback({ text: '普通梯度下降大步冲向任务 B，直接冲出任务 A 的低误差区。', cls: 'bad' });
    else if (next === 2) setFeedback({ text: 'EWC 被锚点轻轻拉回，沿着任务 A 低误差区边缘前进。', cls: '' });
    else setFeedback({ text: '小步微调到达 θ_B* 附近，新旧任务都保住了。', cls: 'good' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="chip" onClick={() => go(-1)} disabled={step === 0}>上一步</button>
        <span className="step-label">第 <b>{step + 1}</b> / 4 步</span>
        <button className="chip" onClick={() => go(1)} disabled={step === 3}>下一步</button>
        <button className="chip" onClick={() => go(-step)}>重置</button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh3Mod1;
