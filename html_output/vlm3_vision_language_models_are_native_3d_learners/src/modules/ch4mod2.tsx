import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawGridCard, drawDot, label, drawBar, drawCaption } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

export const Ch4Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ f: 800 });
  const rafRef = useRef<number | null>(null);
  const [f, setF] = useState(800);
  const [feedback, setFeedback] = useState({ text: '调节 f，看 s=1000/f 如何改变画幅。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const ff = stateRef.current.f;
      const s = 1000 / ff;
      ctx.clearRect(0, 0, W, H); drawSceneBg(ctx, W, H);
      label(ctx, 's = 1000 / f = ' + s.toFixed(3), 40, 36, C.blue, 16);
      drawBar(ctx, 40, 60, 480, 18, clamp(s / 2, 0, 1), C.green);
      const w = 120 * s, h = 90 * s;
      drawWindow(ctx, 220 - w / 2, 100, w, Math.min(h, 90), Math.abs(ff - 1000) < 100 ? C.green : C.red);
      drawCaption(ctx, W, H, '缩放后画幅 · 目标有效 f = 1000px', C.text);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.f = v; setF(v);
    setFeedback(Math.abs(v - 1000) < 80
      ? { text: '有效焦距已对齐 1000px。未知内参时可先单图标定再统一。', cls: 'good' }
      : { text: '按 s=1000/f 缩放即可，无需新编码器。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>f <span className="val">{f}</span></label>
        <input type="range" min={400} max={1600} value={f} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod2;
