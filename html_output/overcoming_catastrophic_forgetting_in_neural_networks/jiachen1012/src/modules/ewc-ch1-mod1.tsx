import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', gd: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

export const EwcCh1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ practice: 0 });
  const rafRef = useRef<number | null>(null);
  const [practice, setPractice] = useState(0);
  const [feedback, setFeedback] = useState({ text: '拖动滑块，观察普通训练如何冲掉旧任务。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { practice: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.ground;
      ctx.fillRect(0, 230, W, 30);
      ctx.fillStyle = C.gd;
      ctx.fillRect(0, 230, W, 3);
      const p = s.practice;
      const turn = p;
      const fade = clamp((p - 0.3) / 0.5, 0, 1);
      const oldColor = lerp(0, 0, fade);
      void oldColor;
      // old target (left)
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(180, 170, 20 * i, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 1 ? C.scene : C.ground;
        ctx.fill();
        ctx.strokeStyle = C.ink;
        ctx.stroke();
      }
      ctx.globalAlpha = 1 - fade * 0.85;
      ctx.beginPath();
      ctx.arc(180, 170, 9, 0, Math.PI * 2);
      ctx.fillStyle = fade > 0.3 ? C.red : C.green;
      ctx.fill();
      ctx.globalAlpha = 1;
      // new target (right)
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(460, 170, 20 * i, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 1 ? C.scene : C.ground;
        ctx.fill();
        ctx.strokeStyle = C.ink;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(460, 170, 9, 0, Math.PI * 2);
      ctx.fillStyle = C.blue;
      ctx.fill();
      // archer turns toward new target
      const lean = lerp(2, 26, turn);
      ctx.strokeStyle = fade > 0.6 ? C.red : C.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(320, 200);
      ctx.lineTo(320 + lean, 176);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(320 + lean, 164, 12, 0, Math.PI * 2);
      ctx.stroke();
      // technical inset: task A accuracy curve
      const ix = 560, iy = 20, iw = 500, ih = 200;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix + 30, iy + ih - 30);
      ctx.lineTo(ix + iw - 10, iy + ih - 30);
      ctx.moveTo(ix + 30, iy + 10);
      ctx.lineTo(ix + 30, iy + ih - 30);
      ctx.stroke();
      const acc = p < 0.2 ? 0.95 : Math.max(0.08, 0.95 - (p - 0.2) * 1.1);
      const x0 = ix + 30;
      const yBase = iy + ih - 30;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, yBase - 0.9 * (ih - 50));
      ctx.lineTo(x0 + p * (iw - 60), yBase - acc * (ih - 50));
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = '12px sans-serif';
      ctx.fillText('任务A准确率', ix + 34, iy + 22);
      ctx.fillText('练习量 ' + p.toFixed(2), ix + iw - 92, iy + 22);
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
    stateRef.current.practice = v;
    setPractice(v);
    if (v < 0.3) setFeedback({ text: '旧靶还很稳，网络还没忘记任务 A。', cls: '' });
    else if (v < 0.7) setFeedback({ text: '新靶练得越多，旧靶命中越差——任务 A 的准确率正在崩塌。', cls: 'bad' });
    else setFeedback({ text: '旧靶几乎脱靶：这就是灾难性遗忘。', cls: 'bad' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>新靶练习量 <span className="val">{practice.toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={Math.round(practice * 100)} onChange={onChange} />
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh1Mod1;
