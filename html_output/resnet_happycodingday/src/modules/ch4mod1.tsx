import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawMark, drawSceneLabel } from './kit-p2';
import type { WidgetProps } from './registry';

// Ch4 M4.1: P1 slider delta (-1..1). Left: original + correction merge. Right: formula panel y = F(x,{Wi}) + x.
const W = 560;
const H = 240;

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ delta: 0.2 });
  const rafRef = useRef<number | null>(null);
  const [delta, setDelta] = useState(0.2);
  const [feedback, setFeedback] = useState({
    text: '调整「修正量」，看原文与修正的合并效果与公式数值如何同步变化。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { delta: number }) => {
      clearScene(ctx, W, H);
      const d = s.delta;
      drawPage(ctx, 150, 140, 260, 84, 0);
      // original line x
      drawTextLines(ctx, 50, 126, 200, 2, 1, C.ink);
      // correction F proportional to |d|
      const markLen = clamp(Math.abs(d), 0, 1) * 150;
      const color = d > 0.5 ? C.orange : d < 0 ? C.red : C.red;
      if (markLen > 2) drawMark(ctx, 70 + markLen / 2, 152, 'under', color, markLen);
      drawSceneLabel(ctx, `修正量 F = ${d >= 0 ? '+' : ''}${d.toFixed(2)}`, 40, 40, color);
      // formula panel
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(360, 40, 180, 170);
      ctx.strokeRect(360, 40, 180, 170);
      drawSceneLabel(ctx, 'y = F(x, {Wᵢ}) + x', 372, 54, C.blue);
      drawSceneLabel(ctx, `x = 1.00`, 372, 86, C.muted);
      drawSceneLabel(ctx, `F = ${(d >= 0 ? '+' : '')}${d.toFixed(2)}`, 372, 112, color);
      drawSceneLabel(ctx, `y = ${(1 + d).toFixed(2)}`, 372, 138, C.ink);
      drawSceneLabel(ctx, d > 0.5 ? '修正过量' : Math.abs(d) < 0.1 ? '修正太弱' : '修正适中', 372, 172, d > 0.5 ? C.orange : Math.abs(d) < 0.1 ? C.red : C.green);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = (Number(e.target.value) / 100) * 2 - 1;
    stateRef.current.delta = v;
    setDelta(v);
    const av = Math.abs(v);
    setFeedback(
      av < 0.1
        ? { text: '修正太弱，错误几乎没被消除。', cls: 'bad' }
        : av <= 0.5
        ? { text: '修正适中，修订句接近正确——恒等捷径让网络永远记得输入 x。', cls: 'good' }
        : { text: '修正过量，句子被改过头。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          修正量 <span className="val">{(delta >= 0 ? '+' : '') + delta.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(((delta + 1) / 2) * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
