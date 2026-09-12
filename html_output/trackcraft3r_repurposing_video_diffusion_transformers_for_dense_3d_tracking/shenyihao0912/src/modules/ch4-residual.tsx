import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawTracker, drawSofa, drawLegend, drawSceneLabel } from './dogKit';
import type { WidgetProps } from './registry';

// Module 4.1 残差记录器 — three chips (static / moving / occluded). Left 55%: the
// life scene with the green mark (blue Δ arrow when moving, dimmed behind the
// sofa when occluded). Right 45%: bare readouts Δⱼ, P₀(t₀), P̂₀(tⱼ) and the o badge.
const W = 1080;
const H = 280;

type Mode = 'static' | 'moving' | 'occluded';

const MODES: Record<Mode, { delta: [number, number, number]; pHat: [number, number, number]; o: number }> = {
  static: { delta: [0, 0, 0], pHat: [1.2, 0, 0.4], o: 1 },
  moving: { delta: [-0.3, 0, 0.2], pHat: [0.9, 0, 0.6], o: 1 },
  occluded: { delta: [-0.3, 0, 0.2], pHat: [0.9, 0, 0.6], o: 0 },
};

const FB: Record<Mode, { text: string; cls: string }> = {
  static: { text: '没动：残差为零，模型只需输出 0——训练目标更简单。', cls: 'good' },
  moving: { text: '动了：只学位移量，绝对位置由 P₀(t₀) 提供。', cls: '' },
  occluded: { text: '被挡住：t₀ 在沙发外看得见（o=1），tⱼ 走到沙发后（o=0）——位置仍在预测，身份与轨迹不丢。', cls: 'bad' },
};

const fmt = (v: number) => v.toFixed(2).replace('-', '−');
const triple = (t: [number, number, number]) => `(${fmt(t[0])}, ${fmt(t[1])}, ${fmt(t[2])})`;

export const Ch4Residual: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'static' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('static');
  const [feedback, setFeedback] = useState({ text: '三种情形共用同一条公式，切换看看差别。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const oldNose = { x: 273, y: 211 }; // nose position of the static dog

    const arrow = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const ang = Math.atan2(to.y - from.y, to.x - from.x);
      ctx.strokeStyle = C.blue;
      ctx.fillStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x - 6, from.y);
      ctx.lineTo(to.x - 8 * Math.cos(ang), to.y - 8 * Math.sin(ang));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - 9 * Math.cos(ang - 0.45), to.y - 9 * Math.sin(ang - 0.45));
      ctx.lineTo(to.x - 9 * Math.cos(ang + 0.45), to.y - 9 * Math.sin(ang + 0.45));
      ctx.closePath();
      ctx.fill();
    };

    const render = (s: { mode: Mode }) => {
      const m = MODES[s.mode];
      ctx.clearRect(0, 0, W, H);
      // ---- left 55%: life scene ----
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 594, H);
      ctx.clip();
      drawSceneBg(ctx, 594, H);
      if (s.mode === 'occluded') {
        // t₀: dog out in the open, mark visible; tⱼ: dog has moved behind the sofa
        ctx.save();
        ctx.globalAlpha = 0.35;
        drawDog(ctx, 170, 236, 1, { mood: 'idle', t: 0 });
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(193, 211, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        // Δ arrow from the t₀ nose to the hidden position behind the sofa
        arrow({ x: 193, y: 211 }, { x: 509, y: 211 });
        // tⱼ dog behind the sofa (sofa drawn after it, partially covering it)
        drawDog(ctx, 486, 236, 1, { mood: 'hide' });
        drawSofa(ctx, 508, 240, 0.9);
        ctx.save();
        ctx.globalAlpha = 0.5;
        drawTracker(ctx, 509, 211, 4);
        ctx.restore();
        drawSceneLabel(ctx, 't₀ 可见', 150, 168, { color: C.green });
        drawSceneLabel(ctx, 'tⱼ 挡住', 470, 168, { color: C.red });
      } else {
        drawSofa(ctx, 490, 240, 0.9);
        if (s.mode === 'static') {
          drawDog(ctx, 250, 236, 1, { mood: 'idle', t: 0 });
          drawTracker(ctx, oldNose.x, oldNose.y, 4);
        } else {
          drawDog(ctx, 170, 236, 1, { mood: 'walk', t: 0.25, flip: true });
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(oldNose.x, oldNose.y, 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          arrow(oldNose, { x: 147, y: 211 });
          drawTracker(ctx, 147, 211, 4);
        }
      }
      drawLegend(
        ctx,
        [
          ['Δ 位移', C.blue],
          ['跟踪标记', C.green],
        ],
        20,
        H - 12
      );
      ctx.restore();

      // divider
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(600, 0);
      ctx.lineTo(600, H);
      ctx.stroke();

      // ---- right 45%: readout panel ----
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(612, 14, 456, 252, 8);
      ctx.fill();
      ctx.stroke();
      ctx.font = '15px "Cambria Math", Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = s.mode === 'static' ? C.green : C.blue;
      ctx.fillText(`Δⱼ = ${triple(m.delta)}`, 636, 54);
      ctx.fillStyle = C.text;
      ctx.fillText(`P₀(t₀) = ${triple([1.2, 0, 0.4])}`, 636, 100);
      ctx.fillText(`P̂₀(tⱼ) = ${triple(m.pHat)}`, 636, 146);
      // visibility badge
      const oc = m.o === 1 ? C.green : C.red;
      ctx.fillStyle = oc;
      ctx.beginPath();
      ctx.roundRect(636, 182, 96, 30, 15);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.font = '14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(`o = ${m.o.toFixed(1)}`, 660, 198);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(FB[m]);
  };

  const chip = (m: Mode, label: string) => (
    <button type="button" className={`chip${mode === m ? ' selected' : ''}`} onClick={() => pick(m)}>
      {label}
    </button>
  );

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {chip('static', '静态点')}
        {chip('moving', '运动点')}
        {chip('occluded', '被遮挡')}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Residual;
