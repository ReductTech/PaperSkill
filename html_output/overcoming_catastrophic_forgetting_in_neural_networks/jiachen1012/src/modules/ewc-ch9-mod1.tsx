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

const bars = [
  [0.12, 0.0, 0.3],
  [0.35, 0.0, 0.5],
  [0.62, 0.8, 0.7],
];

export const EwcCh9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ modeIdx: 0 });
  const rafRef = useRef<number | null>(null);
  const [modeIdx, setModeIdx] = useState(0);
  const [feedback, setFeedback] = useState({ text: '没有专属件和 EWC：总分很低，普通 DQN 学不会多个游戏。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { modeIdx: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      const labels = ['总分', '已保护游戏', '单游戏平均'];
      const vals = bars[s.modeIdx];
      const rx = 30, ry = 24, rw = 620, rh = 232;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(rx, ry, rw, rh);
      labels.forEach((label, i) => {
        const y = ry + 30 + i * 64;
        ctx.fillStyle = C.ink;
        ctx.font = '13px sans-serif';
        ctx.fillText(label, rx + 16, y + 6);
        ctx.fillStyle = C.border;
        ctx.fillRect(rx + 110, y - 8, 420, 24);
        const v = vals[i];
        ctx.fillStyle = v < 0.2 ? C.red : v < 0.5 ? C.orange : C.green;
        ctx.fillRect(rx + 110, y - 8, 420 * v, 24);
        ctx.fillStyle = C.ink;
        ctx.fillText(v.toFixed(2), rx + 110 + 420 * v + 8, y + 10);
      });
      // right gear inset
      const gx = 760, gy = 30;
      ctx.fillStyle = C.ground;
      ctx.fillRect(gx, gy + 150, 260, 60);
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(gx + 130, gy + 120, 42, -1.2, 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + 130, gy + 78);
      ctx.lineTo(gx + 130, gy + 162);
      ctx.stroke();
      if (s.modeIdx >= 1) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 5;
        ctx.strokeRect(gx + 60, gy + 20, 150, 46);
        ctx.fillStyle = C.green;
        ctx.font = '13px sans-serif';
        ctx.fillText('任务专属增益/偏置', gx + 74, gy + 48);
      }
      if (s.modeIdx >= 2) {
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gx + 40, gy + 40);
        ctx.lineTo(gx + 130, gy + 80);
        ctx.stroke();
        ctx.fillStyle = C.orange;
        ctx.fillText('EWC 保护（20M 帧后）', gx + 50, gy + 110);
      }
      ctx.fillStyle = C.muted;
      ctx.font = '12px sans-serif';
      ctx.fillText('总分与保护均为示意（依据图 3B 与 Table 2）', rx + 16, ry + rh - 14);
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
    stateRef.current.modeIdx = i;
    setModeIdx(i);
    if (i === 0) setFeedback({ text: '没有专属件和 EWC：总分很低，普通 DQN 学不会多个游戏。', cls: 'bad' });
    else if (i === 1) setFeedback({ text: '任务专属增益让每个游戏有独立调节空间，总分上升但旧游戏仍会被覆盖。', cls: '' });
    else setFeedback({ text: '增益 + EWC 双管齐下：多个游戏被保护，总分明显提升。', cls: 'good' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {['无专属件', '+任务增益', '+增益+EWC'].map((label, i) => (
          <button key={label} className={'chip' + (modeIdx === i ? ' selected' : '')} onClick={() => pick(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh9Mod1;
