import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  scene: '#f5f8f0', ground: '#b8c9a7', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const patterns = [
  [1,1,1,0,0,0,0,0, 1,0,0,0,0,0,0,0, 1,1,1,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,1,1,1,0, 0,0,0,0,0,1,0,0, 0,0,0,0,1,1,1,0, 0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0, 1,1,1,0,0,0,0,0, 0,0,0,1,1,1,0,0, 1,1,1,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,1,1,1,0, 0,0,0,0,0,1,0,0, 1,1,1,0,0,0,0,0],
  [1,1,1,0,0,0,0,0, 0,0,1,0,0,0,0,0, 1,1,1,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,1,1,1,0, 0,0,0,0,0,1,0,0, 0,0,0,0,1,1,1,0, 1,1,1,0,0,0,0,0],
];

export const EwcCh6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ obsIdx: 0 });
  const rafRef = useRef<number | null>(null);
  const [obsIdx, setObsIdx] = useState(0);
  const [feedback, setFeedback] = useState({ text: '观察更符合任务 1，系统继续沿用当前上下文。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { obsIdx: number }, now: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);
      // three observation cards
      for (let i = 0; i < 3; i++) {
        const x = 30 + i * 130;
        const y = 20;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, 110, 110);
        ctx.strokeStyle = s.obsIdx === i ? C.blue : C.border;
        ctx.lineWidth = s.obsIdx === i ? 4 : 1;
        ctx.strokeRect(x, y, 110, 110);
        const p = patterns[i];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (p[r * 8 + c]) {
              ctx.fillStyle = i === 2 ? C.purple : C.blue;
              ctx.fillRect(x + 10 + c * 11, y + 10 + r * 11, 9, 9);
            }
          }
        }
        ctx.fillStyle = C.ink;
        ctx.font = '12px sans-serif';
        ctx.fillText('画面' + String.fromCharCode(65 + i), x + 8, y + 126);
      }
      // right: HMM context panel
      const rx = 440, ry = 20, rw = 610, rh = 232;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(rx, ry, rw, rh);
      const isTask2 = s.obsIdx === 2;
      const nodes = [
        { x: rx + 120, y: ry + 90, label: 'c=1', active: !isTask2 },
        { x: rx + 340, y: ry + 90, label: 'c=2', active: isTask2 },
      ];
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 28, 0, Math.PI * 2);
        ctx.fillStyle = n.active ? C.green : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = n.active ? C.green : C.muted;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = '13px sans-serif';
        ctx.fillText(n.label, n.x - 20, n.y + 4);
      });
      ctx.strokeStyle = C.purple;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(rx + 150, ry + 90);
      ctx.lineTo(rx + 310, ry + 90);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.fillText('α', rx + 224, ry + 82);
      const conf = 0.9 - 0.15 * Math.abs(s.obsIdx - (isTask2 ? 2 : 0));
      ctx.fillStyle = C.ink;
      ctx.fillText('置信度', rx + 460, ry + 50);
      ctx.fillStyle = C.border;
      ctx.fillRect(rx + 460, ry + 60, 120, 22);
      ctx.fillStyle = C.blue;
      ctx.fillRect(rx + 460, ry + 60, 120 * conf, 22);
      ctx.fillStyle = C.ink;
      ctx.fillText(conf.toFixed(2), rx + 460 + 120 * conf + 6, ry + 78);
      ctx.fillStyle = C.ink;
      ctx.fillText('推断任务：' + (isTask2 ? '任务 2' : '任务 1'), rx + 460, ry + 130);
      if (s.obsIdx === 2) {
        ctx.fillStyle = C.purple;
        ctx.fillText('创建/切换模型', rx + 460, ry + 160);
      }
      const pulse = 0.5 + 0.5 * Math.sin(now / 300);
      if (s.obsIdx === 2) {
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 3 * pulse;
        ctx.strokeRect(rx + 450, ry + 140, 130, 44);
      }
    };
    const tick = (now: number) => {
      render(stateRef.current, now);
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

  const select = (i: number) => {
    stateRef.current.obsIdx = i;
    setObsIdx(i);
    if (i === 0 || i === 1) setFeedback({ text: '观察更符合任务 1，系统继续沿用当前上下文。', cls: 'good' });
    else setFeedback({ text: '观察更像任务 2，FMN 切换上下文并创建/使用新的任务模型。', cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {['画面 A', '画面 B', '画面 C'].map((label, i) => (
          <button key={label} className={'chip' + (obsIdx === i ? ' selected' : '')} onClick={() => select(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default EwcCh6Mod1;
