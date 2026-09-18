import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', purple: '#7c3aed', orange: '#f07e47',
  text: '#21324a', muted: '#68778f', border: '#d7deea',
};

const STEPS = [
  '标出源图 Xsrc 与噪声配对点',
  '沿源提示构造 Zsrc_t',
  '沿目标提示构造 Ztar_t',
  '平行四边形得到 Z_inv',
  '对角线即编辑捷径',
];

/** P2：逐步展示 Z_inv 平行四边形构造 */
export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEPS[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const A = { x: 220, y: 220, label: 'Xsrc' };
    const B = { x: 380, y: 70, label: 'Zsrc' };
    const Cp = { x: 780, y: 70, label: 'Ztar' };
    const D = { x: 620, y: 220, label: 'Zinv' };

    const render = () => {
      const s = stateRef.current.step;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(60, 30, W - 120, H - 60);
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 30, W - 120, H - 60);

      // faint full parallelogram guide (always visible)
      ctx.strokeStyle = 'rgba(118,144,106,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(Cp.x, Cp.y);
      ctx.lineTo(D.x, D.y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      const drawEdge = (p: typeof A, q: typeof A, color: string, dash = false, width = 3) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        if (dash) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      if (s >= 1) drawEdge(A, B, C.blue);
      if (s >= 2) drawEdge(B, Cp, C.purple, true);
      if (s >= 3) {
        drawEdge(Cp, D, C.orange);
        drawEdge(A, D, C.border, true, 2);
      }
      if (s >= 4) drawEdge(A, D, C.green, false, 4);

      // noise cloud near B when step highlights source path
      if (s >= 1 && s < 4) {
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          const rr = 18 + (i % 3) * 6;
          ctx.fillStyle = 'rgba(196,63,82,0.18)';
          ctx.beginPath();
          ctx.arc(B.x + Math.cos(ang) * rr, B.y + Math.sin(ang) * rr * 0.6, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const pts = [
        [A, C.brown, 0],
        [B, C.blue, 1],
        [Cp, C.orange, 2],
        [D, C.green, 3],
      ] as const;
      for (const [p, col, need] of pts) {
        if (need !== 0 && s < need) continue;
        if (need === 3 && s < 3) continue;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.text;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(p.label, p.x + 14, p.y - 10);
      }

      // larger photo card at A
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2.5;
      ctx.fillRect(A.x - 70, A.y - 36, 56, 44);
      ctx.strokeRect(A.x - 70, A.y - 36, 56, 44);
      ctx.fillStyle = C.light;
      ctx.fillRect(A.x - 62, A.y - 28, 40, 20);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(A.x - 58, A.y - 18);
      ctx.lineTo(A.x - 30, A.y - 10);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('源图', A.x - 58, A.y + 14);

      if (s >= 4) {
        ctx.fillStyle = C.green;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText('直接捷径', (A.x + D.x) / 2 - 28, (A.y + D.y) / 2 - 12);
      }

      canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const off = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  const go = (n: number) => {
    const v = Math.max(0, Math.min(STEPS.length - 1, n));
    stateRef.current.step = v;
    setStep(v);
    setFeedback({
      text: STEPS[v],
      cls: v === STEPS.length - 1 ? 'good' : '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" disabled={step === 0} className="tiny ghost" onClick={() => go(step - 1)}>
          上一步
        </button>
        <span className="val">
          {step + 1} / {STEPS.length}
        </span>
        <button type="button" disabled={step === STEPS.length - 1} className="tiny" onClick={() => go(step + 1)}>
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
