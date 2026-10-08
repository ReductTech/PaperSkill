import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// 通用：量化位数（P1 滑块）。位数越低，量化误差越大、体积越小。
const W = 1080;
const H = 280;

export const BitSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ bits: 8 });
  const rafRef = useRef<number | null>(null);
  const [bits, setBits] = useState(8);
  const [feedback, setFeedback] = useState({ text: '8 位：误差与体积的折中。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { bits: number }) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const err = clamp((16 - s.bits) / 14, 0, 1);
      const bw = W - 180;
      text(ctx, '量化误差', 40, 40, COLORS.ink, 22);
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(80, 60, bw, 28);
      ctx.fillStyle = err > 0.6 ? COLORS.red : err > 0.3 ? COLORS.orange : COLORS.green;
      ctx.fillRect(80, 60, bw * err, 28);
      text(ctx, `${(err * 100).toFixed(0)}%`, 80 + bw * err + 14, 74, COLORS.ink, 20);
      text(ctx, `${s.bits} bits`, 40, 124, COLORS.blue, 30);
      const memRatio = s.bits / 32;
      text(ctx, '相对内存（对比 32-bit）', 40, 174, COLORS.ink, 20);
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(80, 194, bw, 24);
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(80, 194, bw * memRatio, 24);
      text(ctx, `${Math.round(memRatio * 100)}%`, 80 + bw * memRatio + 14, 206, COLORS.ink, 18);
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
    stateRef.current.bits = v;
    setBits(v);
    if (v <= 3) setFeedback({ text: '极低位：体积很小，但量化误差明显。', cls: 'bad' });
    else if (v <= 6) setFeedback({ text: '中低位：误差与体积都在可接受范围。', cls: '' });
    else setFeedback({ text: '较高位：误差很小，但体积节省有限。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          量化位数 <span className="val">{bits} bit</span>
        </label>
        <input type="range" min={2} max={16} value={bits} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default BitSlider;
