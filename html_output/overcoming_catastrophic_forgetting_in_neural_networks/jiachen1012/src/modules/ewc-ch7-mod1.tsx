import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

export const EwcCh7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 0, running: false });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({ text: '两个方法从同一参数出发，训练任务 B。按“开始训练”播放。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { phase: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      const panel = (px: number, title: string, tint: string, aLoss: number, bLoss: number) => {
        ctx.fillStyle = tint;
        ctx.fillRect(px, 20, 500, 232);
        ctx.strokeStyle = C.border;
        ctx.strokeRect(px, 20, 500, 232);
        ctx.fillStyle = C.ink;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(title, px + 16, 48);
        const x0 = px + 30;
        const yBase = 20 + 232 - 34;
        const top = 20 + 56;
        ctx.strokeStyle = C.muted;
        ctx.beginPath();
        ctx.moveTo(x0, top);
        ctx.lineTo(x0, yBase);
        ctx.lineTo(px + 480, yBase);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = '12px sans-serif';
        ctx.fillText('损失', px + 20, top - 6);
        ctx.fillText('0', x0 - 14, yBase + 4);
        ctx.fillText('1', x0 - 14, top + 8);
        const yA = yBase - aLoss * (yBase - top);
        const yB = yBase - bLoss * (yBase - top);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x0, yBase - 0.1 * (yBase - top));
        ctx.lineTo(x0 + s.phase * 420, yA);
        ctx.stroke();
        ctx.strokeStyle = C.blue;
        ctx.beginPath();
        ctx.moveTo(x0, yBase - 1 * (yBase - top));
        ctx.lineTo(x0 + s.phase * 420, yB);
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.fillText(aLoss.toFixed(2), x0 + s.phase * 420 - 34, yA - 6);
        ctx.fillText(bLoss.toFixed(2), x0 + s.phase * 420 - 34, yB + 14);
      };
      const p = s.phase;
      const aSgd = 0.1 + 0.8 * p;
      const bSgd = 1 - 0.9 * p;
      const aEwc = 0.1 + 0.15 * p;
      const bEwc = 1 - 0.8 * p;
      panel(20, 'SGD（无保护）', 'rgba(196,63,82,0.06)', aSgd, bSgd);
      panel(560, 'EWC（弹性惩罚）', 'rgba(34,141,92,0.06)', aEwc, bEwc);
      ctx.fillStyle = C.muted;
      ctx.fillText('任务A损失（红） / 任务B损失（蓝）', 20, 270);
    };
    const tick = (now: number) => {
      const s = stateRef.current;
      if (s.running && s.phase < 1) {
        const t = (now - startRef.current) / 1800;
        s.phase = Math.min(1, easeOutCubic(Math.max(0, t)));
        if (s.phase >= 1) {
          s.running = false;
          setRunning(false);
          setFeedback({ text: '训练结束：SGD 遗忘了任务 A，EWC 把任务 A 损失压在低位。', cls: 'good' });
        }
      }
      render(s);
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

  const begin = () => {
    stateRef.current.phase = 0;
    stateRef.current.running = true;
    startRef.current = performance.now();
    setRunning(true);
    setFeedback({ text: '训练进行中：SGD 的任务 A 损失快速上升，EWC 只小幅波动。', cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="chip" onClick={begin} disabled={running}>开始训练</button>
        <button className="chip" onClick={begin}>重播</button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh7Mod1;
