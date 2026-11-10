import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

export const RankSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ rank: number }>({ rank: 32 });
  const rafRef = useRef<number | null>(null);
  const [rank, setRank] = useState(32);
  const [feedback, setFeedback] = useState('rank=32：残差范数较小，低秩分支开销可忽略。');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const sig = Array.from({ length: 64 }, (_, i) => (i < 6 ? 50 - Math.pow(i, 1.7) * 7 : 8 * Math.exp(-i / 22) + 0.3));
    const render = (s: { rank: number }) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const base = H - 52;
      const maxH = H - 120;
      const px = (i: number) => 90 + (i / 63) * 900;
      sig.forEach((v, i) => {
        const h = (v / 55) * maxH;
        ctx.fillStyle = i < s.rank ? COLORS.green : COLORS.axis;
        ctx.fillRect(px(i), base - h, 9, h);
      });
      ctx.strokeStyle = COLORS.orange;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(px(s.rank), 52);
      ctx.lineTo(px(s.rank), base);
      ctx.stroke();
      ctx.setLineDash([]);
      let residual = 0;
      for (let i = s.rank; i < 64; i += 1) residual += sig[i] * sig[i];
      text(ctx, `rank r = ${s.rank}`, px(Math.min(63, s.rank + 2)), 40, COLORS.orange, 17);
      text(ctx, `残差范数 ‖R‖ ≈ ${Math.sqrt(residual).toFixed(1)}`, 90, base + 22, COLORS.ink, 16);
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

  const change = (v: number) => {
    stateRef.current.rank = v;
    setRank(v);
    if (v < 4) setFeedback('rank 太小：残差仍承载大奇异值，4-bit 残差难量化。');
    else if (v > 48) setFeedback('rank 太大：低秩分支开销增大，边际收益下降。');
    else setFeedback('rank=' + v + '：残差范数较小，低秩分支开销可忽略。');
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>rank r：</label>
        <input type="range" min={0} max={63} value={rank} onChange={(e) => change(Number(e.target.value))} />
        <span>{rank}</span>
      </div>
      <div className={`feedback ${rank < 4 || rank > 48 ? 'bad' : 'good'}`}>{feedback}</div>
    </div>
  );
};

export default RankSlider;
