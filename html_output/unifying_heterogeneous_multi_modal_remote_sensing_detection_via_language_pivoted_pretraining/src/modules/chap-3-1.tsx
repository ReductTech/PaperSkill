import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap3Mod1 — Late vs. early alignment, synchronized P3.
// One "▶ 开始比较" button runs both panels in lockstep.

const W = 560;
const H = 220;

type RunState = 'idle' | 'running' | 'done';
const RUN_DURATION = 1.8;

export const Chap3Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ run: 'idle' as RunState, start: 0 });
  const rafRef = useRef<number | null>(null);
  const [run, setRun] = useState<RunState>('idle');
  const [feedback, setFeedback] = useState({ text: '点击下方按钮开始比较，两栏同时从 t=0 启动。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawBook = (x: number, y: number, color: string, label: string, scribble: boolean, finalized: boolean, finalizedLabel?: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 30, y - 22, 60, 44);
      ctx.strokeStyle = finalized ? '#228d5c' : '#21324a';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - 30, y - 22, 60, 44);
      if (scribble) {
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.moveTo(x - 22 + i * 10, y - 12 + (i % 2 ? 4 : -4));
          ctx.lineTo(x - 14 + i * 10, y - 14 + (i % 2 ? -4 : 4));
        }
        ctx.stroke();
      }
      if (finalized) {
        ctx.fillStyle = '#fff7d6';
        ctx.fillRect(x - 24, y - 6, 48, 12);
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 9px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(finalizedLabel || label, x, y);
      } else if (!scribble) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
      }
    };

    const render = (time: number) => {
      const s = stateRef.current;
      let t = 0;
      if (s.run === 'running') {
        t = clamp((time - s.start) / 1000 / RUN_DURATION, 0, 1);
        if (t >= 1) { s.run = 'done'; setRun('done'); }
      } else if (s.run === 'done') {
        t = 1;
      }
      const ease = easeInOutQuad(t);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      // divider
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2, 12); ctx.lineTo(W / 2, H - 30);
      ctx.stroke();

      // panel labels
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('晚期对齐', W / 4, 24);
      ctx.fillText('早期 + 语言枢轴', (3 * W) / 4, 24);

      // left: late
      const yL = H - 50;
      const scribble = t < 0.9;
      const finalized = t >= 0.9;
      const labels: Array<[string, number]> = [['RGB', W / 4 - 60], ['SAR', W / 4], ['IR', W / 4 + 60]];
      labels.forEach(([lab, x]) => {
        let scribbleState = scribble;
        let finalizedState = false;
        let finalLabel: string | undefined = undefined;
        if (finalized) {
          // each book gets a DIFFERENT label
          const finalLabels: Record<string, string> = { RGB: 'shape', SAR: 'echo', IR: 'warm' };
          finalLabel = finalLabels[lab];
          finalizedState = true;
          scribbleState = false;
        }
        drawBook(x, yL, lab === 'RGB' ? '#c43f52' : lab === 'SAR' ? '#228d5c' : '#7c3aed', lab, scribbleState, finalizedState, finalLabel);
      });
      // pen jitter
      if (scribble) {
        const px = W / 4 + Math.sin(time * 0.011) * 50;
        const py = 70 + Math.cos(time * 0.013) * 30;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(time * 0.009) * 0.4);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-2, -12, 4, 14);
        ctx.restore();
      }

      // right: early
      const yR = H - 50;
      const labelsR: Array<[string, number]> = [['RGB', (3 * W) / 4 - 60], ['SAR', (3 * W) / 4], ['IR', (3 * W) / 4 + 60]];
      labelsR.forEach(([lab, x]) => {
        const ready = t >= 0.4 + (x % 60) * 0.003;
        const fullyDone = t >= 0.95;
        if (fullyDone) {
          drawBook(x, yR, lab === 'RGB' ? '#c43f52' : lab === 'SAR' ? '#228d5c' : '#7c3aed', lab, false, true, '车 / Car');
        } else if (ready) {
          drawBook(x, yR, lab === 'RGB' ? '#c43f52' : lab === 'SAR' ? '#228d5c' : '#7c3aed', lab, false, true, '...');
        } else {
          drawBook(x, yR, lab === 'RGB' ? '#c43f52' : lab === 'SAR' ? '#228d5c' : '#7c3aed', lab, false, false);
        }
      });
      // pen steady
      if (t < 0.95) {
        const px = (3 * W) / 4 - 60 + 120 * ease;
        const py = 70;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-0.2);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-2, -12, 4, 14);
        ctx.restore();
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onStart = () => {
    stateRef.current.run = 'running';
    stateRef.current.start = performance.now();
    setRun('running');
    setFeedback({ text: '正在比较……', cls: '' });
    window.setTimeout(() => {
      if (stateRef.current.run === 'done') {
        setFeedback({ text: '右栏三本书都贴上"车 / Car"；左栏三本书标签互不相同。<b>早期对齐胜出</b>。', cls: 'good' });
      }
    }, RUN_DURATION * 1000 + 100);
  };

  const onReset = () => {
    stateRef.current.run = 'idle';
    setRun('idle');
    setFeedback({ text: '点击下方按钮开始比较，两栏同时从 t=0 启动。', cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={onStart} disabled={run === 'running'}>▶ 开始比较</button>
        <button className="tiny ghost" onClick={onReset}>重置</button>
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Chap3Mod1;
