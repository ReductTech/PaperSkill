import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// group-size 参数（P1 滑块）：精度 vs 显存/速度 的权衡。
const W = 1080;
const H = 280;
const OPTIONS = [1, 32, 64, 128, -1];

export const GroupSize: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ idx: 3 });
  const rafRef = useRef<number | null>(null);
  const [idx, setIdx] = useState(3);
  const [feedback, setFeedback] = useState({ text: 'group-size=128：精度与开销的常见折中。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { idx: number }) => {
      const g = OPTIONS[s.idx];
      const gNorm = g === -1 ? 0 : 1 - s.idx / (OPTIONS.length - 1);
      const acc = g === -1 ? 0.62 : 0.82 + gNorm * 0.15;
      const mem = g === -1 ? 1 : 0.18 + gNorm * 0.42;
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const bw = W - 180;
      text(ctx, '相对精度（越高越好）', 40, 48, COLORS.ink, 22);
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(80, 66, bw, 28);
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(80, 66, bw * acc, 28);
      text(ctx, (acc * 100).toFixed(0) + '%', 80 + bw * acc + 14, 80, COLORS.ink, 20);
      text(ctx, '相对显存开销（越低越好）', 40, 140, COLORS.ink, 22);
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(80, 158, bw, 28);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(80, 158, bw * mem, 28);
      text(ctx, (mem * 100).toFixed(0) + '%', 80 + bw * mem + 14, 172, COLORS.ink, 20);
      text(ctx, g === -1 ? 'group-size=-1（整层一组）' : 'group-size=' + g, 40, 232, COLORS.orange, 26);
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
    stateRef.current.idx = v;
    setIdx(v);
    const g = OPTIONS[v];
    if (g === 1) setFeedback({ text: 'group-size=1：精度最高，但需要更多缩放因子，显存与计算开销最大。', cls: 'good' });
    else if (g === -1) setFeedback({ text: 'group-size=-1：整层共享一个尺度，最省但精度损失最大。', cls: 'bad' });
    else setFeedback({ text: 'group-size=' + g + '：精度与开销的折中档。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          group-size <span className="val">{OPTIONS[idx]}</span>
        </label>
        <input type="range" min={0} max={4} step={1} value={idx} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default GroupSize;
