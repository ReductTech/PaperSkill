import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import { C, clearScene, drawPage, drawTextLines, drawSceneLabel } from './kit-p1';
import type { WidgetProps } from './registry';

// Ch1 M1.1: P1 slider copyCount 1..56. Left: manuscript clarity. Right: training error curve.
const W = 560;
const H = 240;

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ copyCount: 20 });
  const rafRef = useRef<number | null>(null);
  const [copyCount, setCopyCount] = useState(20);
  const [feedback, setFeedback] = useState({
    text: '拖动「抄写次数」，观察文字清晰度与训练误差如何同步恶化。',
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
    const render = (s: { copyCount: number }) => {
      clearScene(ctx, W, H);
      const clarity = clamp(map(s.copyCount, 1, 56, 1, 0.15), 0.15, 1);
      // left manuscript
      drawPage(ctx, 130, 130, 200, 90, 0);
      drawTextLines(ctx, 55, 112, 150, 3, clarity, C.ink);
      drawSceneLabel(ctx, `抄写 ${s.copyCount} 次`, 40, 40, C.blue);
      // right error curve
      const ox = 360;
      const oy = 210;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 180, oy);
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy - 160);
      ctx.stroke();
      drawSceneLabel(ctx, '训练误差', ox + 6, oy - 170, C.muted);
      drawSceneLabel(ctx, '层数', ox + 150, oy + 8, C.muted);
      const curve = (n: number) => 0.1 + (n / 56) * 0.85;
      const errAt = (n: number) => oy - curve(n) * 160;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let n = 1; n <= s.copyCount; n += 2) {
        const x = ox + map(n, 1, 56, 0, 170);
        const y = errAt(n);
        if (n === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // reference points 20 / 56
      for (const ref of [20, 56]) {
        const x = ox + map(ref, 1, 56, 0, 170);
        ctx.fillStyle = ref === 20 ? C.blue : C.red;
        ctx.beginPath();
        ctx.arc(x, errAt(ref), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ref === 20 ? C.blue : C.red;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(`${ref}层`, x - 8, oy - curve(ref) * 160 - 14);
      }
      // current marker
      const cx = ox + map(s.copyCount, 1, 56, 0, 170);
      const cy = errAt(s.copyCount);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.stroke();
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
    const v = Number(e.target.value);
    stateRef.current.copyCount = v;
    setCopyCount(v);
    setFeedback(
      v > 40
        ? { text: '字形已难以辨认——网络越深，训练误差反而越高（56 层 > 20 层）。', cls: 'bad' }
        : v >= 25
        ? { text: '字形开始走样，误差缓慢上升：退化正在出现。', cls: '' }
        : { text: '抄写次数少，文字还算清晰，训练误差低。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          抄写次数 <span className="val">{copyCount}</span>
        </label>
        <input type="range" min={1} max={56} value={copyCount} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
