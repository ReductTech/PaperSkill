import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
type Mode = 'compress' | 'protect';

export const ProtectToggle: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'protect' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('protect');
  const [feedback, setFeedback] = useState({ text: 'SVDQuant 保护：所有方向都保留，难方向 16-bit、尾部 4-bit 残差。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const sig = Array.from({ length: 48 }, (_, i) => (i < 6 ? 50 - Math.pow(i, 1.7) * 7 : 8 * Math.exp(-i / 20) + 0.2));
    const r = 6;
    const render = (s: { mode: Mode }) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const base = H - 52;
      const maxH = H - 120;
      const px = (i: number) => 90 + (i / 47) * 900;
      sig.forEach((v, i) => {
        const h = (v / 55) * maxH;
        const x = px(i);
        let color = COLORS.axis;
        if (i < r) color = COLORS.green;
        else if (s.mode === 'protect') color = COLORS.orange;
        else color = COLORS.red;
        ctx.fillStyle = color;
        ctx.fillRect(x, base - h, 12, h);
        if (s.mode === 'compress' && i >= r) {
          ctx.strokeStyle = COLORS.red;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 3, base - h - 6);
          ctx.lineTo(x + 15, base + 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 15, base - h - 6);
          ctx.lineTo(x - 3, base + 6);
          ctx.stroke();
        }
      });
      ctx.strokeStyle = COLORS.muted;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(px(r), 52);
      ctx.lineTo(px(r), base);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, '头部 r 个方向：16-bit 低秩分支', 100, 32, COLORS.green, 17);
      text(
        ctx,
        s.mode === 'protect' ? '尾部方向：4-bit 残差（保留）' : '尾部方向：被丢弃（红叉，信息损失）',
        500,
        32,
        s.mode === 'protect' ? COLORS.orange : COLORS.red,
        17,
      );
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

  const select = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'compress') setFeedback({ text: '低秩压缩：直接丢尾部方向，信息有损、画质退化。', cls: 'bad' });
    else setFeedback({ text: 'SVDQuant 保护：所有方向都保留，难方向 16-bit、尾部 4-bit 残差。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'compress' ? 'active' : ''}`} onClick={() => select('compress')}>
          低秩压缩
        </button>
        <button className={`chip ${mode === 'protect' ? 'active' : ''}`} onClick={() => select('protect')}>
          SVDQuant 保护
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ProtectToggle;
