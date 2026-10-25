import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', gd: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

export const EwcCh4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ fi: 0.2 });
  const rafRef = useRef<number | null>(null);
  const [fi, setFi] = useState(0.2);
  const [feedback, setFeedback] = useState({ text: 'F_i 较小：这个权重不重要，弹簧很软。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { fi: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.ground;
      ctx.fillRect(0, 230, 520, 30);
      ctx.fillStyle = C.gd;
      ctx.fillRect(0, 230, 520, 3);
      // left: strap anchored to post pulling wrist back
      const k = s.fi;
      const postX = 140, postY = 60;
      const wristX = 300, wristY = 150;
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(postX, postY);
      ctx.lineTo(postX, 230);
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2 + 8 * k;
      ctx.beginPath();
      ctx.moveTo(postX, postY);
      ctx.lineTo(wristX, wristY);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(wristX, wristY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(wristX - 30, 200);
      ctx.lineTo(wristX, wristY);
      ctx.stroke();
      // right: quadratic penalty curve
      const ix = 560, iy = 20, iw = 500, ih = 230;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(ix, iy, iw, ih);
      const x0 = ix + iw / 2;
      const yBase = iy + ih - 34;
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(ix + 20, yBase);
      ctx.lineTo(ix + iw - 10, yBase);
      ctx.moveTo(x0, iy + 10);
      ctx.lineTo(x0, yBase);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '12px sans-serif';
      ctx.fillText('Δθ', ix + iw - 40, yBase - 6);
      ctx.fillText('惩罚', ix + 24, iy + 24);
      const curve = (x: number) => {
        const dx = x - x0;
        return yBase - k * 220 * (dx / 220) * (dx / 220);
      };
      ctx.strokeStyle = k > 0.7 ? C.green : C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = ix + 20; x <= ix + iw - 20; x += 4) {
        const y = curve(x);
        if (x === ix + 20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const mx = x0 + 100;
      const my = curve(mx);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.fillText((k * 0.5 * 100 * 100 / 220 / 220 * 220).toFixed(1), mx + 10, my - 6);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.fi = v;
    setFi(v);
    if (v < 0.3) setFeedback({ text: 'F_i 小：这个权重不重要，弹簧很软，可以大步更新。', cls: '' });
    else if (v < 0.7) setFeedback({ text: 'F_i 中等：新旧任务之间需要小心平衡。', cls: '' });
    else setFeedback({ text: 'F_i 大：这个权重对旧任务至关重要，弹簧很硬，几乎不允许偏离。', cls: 'good' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>权重重要度 F_i <span className="val">{fi.toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={Math.round(fi * 100)} onChange={onChange} />
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh4Mod1;
