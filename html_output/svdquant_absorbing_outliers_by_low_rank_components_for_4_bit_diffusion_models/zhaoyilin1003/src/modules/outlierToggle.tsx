import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text } from './qkit';
import type { WidgetProps } from './registry';

// 离群值处理（P4 芯片）：有离群值 vs 已平滑。
const W = 1080;
const H = 280;
type Mode = 'with' | 'smooth';

export const OutlierToggle: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'with' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('with');
  const [feedback, setFeedback] = useState({ text: '存在离群值：量化时它们会占用大量动态范围。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { mode: Mode }) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);
      const cy = H * 0.55;
      const cx = W / 2;
      const spread = s.mode === 'with' ? 260 : 110;
      // 主体分布
      for (let i = 0; i < 40; i += 1) {
        const gx = cx + Math.sin(i * 37) * 130;
        ctx.fillStyle = COLORS.blue;
        ctx.beginPath();
        ctx.arc(gx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // 离群值
      const outlierX = s.mode === 'with' ? [cx - spread, cx + spread] : [cx - spread * 0.45, cx + spread * 0.45];
      for (const ox of outlierX) {
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.arc(ox, cy - 14, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      text(ctx, s.mode === 'with' ? '离群值让量化范围被拉大' : '离群值被吸收，分布更集中', cx, 40, COLORS.ink, 22, 'center');
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
    if (m === 'with') setFeedback({ text: '存在离群值：少数极端值占据量化范围，普通值精度被牺牲。', cls: 'bad' });
    else setFeedback({ text: '消除离群值后：分布更集中，量化精度得到保留。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'with' ? 'active' : ''}`} onClick={() => select('with')}>
          有离群值
        </button>
        <button className={`chip ${mode === 'smooth' ? 'active' : ''}`} onClick={() => select('smooth')}>
          已平滑
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default OutlierToggle;
