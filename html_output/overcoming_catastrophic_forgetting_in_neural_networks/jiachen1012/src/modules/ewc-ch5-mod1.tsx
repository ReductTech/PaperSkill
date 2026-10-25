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

export const EwcCh5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lamIdx: 1 });
  const rafRef = useRef<number | null>(null);
  const [lamIdx, setLamIdx] = useState(1);
  const [feedback, setFeedback] = useState({ text: 'λ 适中：旧任务 0.90、新任务 0.88，两边都能接受。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { lamIdx: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.ground;
      ctx.fillRect(0, 230, 520, 30);
      ctx.fillStyle = C.gd;
      ctx.fillRect(0, 230, 520, 3);
      // left: bow + strap sag
      const sag = 30 - 20 * s.lamIdx;
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(300, 150, 46, -1.2, 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(300, 104);
      ctx.lineTo(300, 196);
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3 + 2 * s.lamIdx;
      ctx.beginPath();
      ctx.moveTo(180, 60);
      ctx.quadraticCurveTo(240, 60 + sag, 300, 70);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(180, 60, 8, 0, Math.PI * 2);
      ctx.fill();
      // right: two accuracy bars
      const rx = 560, ry = 30, rw = 480, rh = 210;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(rx, ry, rw, rh);
      const bars = s.lamIdx === 0 ? [0.45, 0.95] : s.lamIdx === 1 ? [0.9, 0.88] : [0.96, 0.35];
      const labels = ['旧任务', '新任务'];
      labels.forEach((label, i) => {
        const y = ry + 40 + i * 80;
        ctx.fillStyle = C.ink;
        ctx.font = '13px sans-serif';
        ctx.fillText(label, rx + 16, y + 6);
        ctx.fillStyle = C.border;
        ctx.fillRect(rx + 80, y - 8, 300, 24);
        const v = bars[i];
        ctx.fillStyle = v >= 0.8 ? C.green : v >= 0.4 ? C.orange : C.red;
        ctx.fillRect(rx + 80, y - 8, 300 * v, 24);
        ctx.fillStyle = C.ink;
        ctx.fillText(v.toFixed(2), rx + 80 + 300 * v + 8, y + 10);
      });
      ctx.fillStyle = C.muted;
      ctx.fillText('λ = ' + (s.lamIdx === 0 ? '0.1' : s.lamIdx === 1 ? '1' : '10'), rx + 16, ry + rh - 14);
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

  const pick = (i: number) => {
    stateRef.current.lamIdx = i;
    setLamIdx(i);
    if (i === 0) setFeedback({ text: 'λ 太小，弹簧形同虚设：新任务学好了，旧任务几乎忘光。', cls: 'bad' });
    else if (i === 1) setFeedback({ text: 'λ 适中：旧任务 0.90、新任务 0.88，两边都能接受。', cls: 'good' });
    else setFeedback({ text: 'λ 太大，所有参数都被钉死：旧任务很好，新任务学不动。', cls: 'bad' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {['λ 小 (0.1)', 'λ 中 (1)', 'λ 大 (10)'].map((label, i) => (
          <button key={label} className={'chip' + (lamIdx === i ? ' selected' : '')} onClick={() => pick(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh5Mod1;
