import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, clay, hand, seal, bars, label, GUIDE, OK, EMPH, MUTED, WHEEL } from './clayKit';

// 模块 7.1：双分支合批训练。同一条批内交替走去噪（MSE）与解码（CE）两道工序。
const W = 1080;
const H = 280;

export const Ch7TwoBranch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<'denoise' | 'decode'>('denoise');
  const [phase, setPhase] = useState<'denoise' | 'decode'>('denoise');
  const [fb, setFb] = useState({ text: '按「下一步」在同一批里切换两道工序：约 80% 走均方误差，20% 走交叉熵。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (now: number) => {
      const ph = phaseRef.current;
      field(ctx, W, H);
      clay(ctx, 240, 176, 62, ph === 'denoise' ? 0.5 : 0.08, now / 600, WHEEL);
      hand(ctx, 240 + 74, 162, 1.1, 1);
      if (ph === 'decode') seal(ctx, 240, 176, true);
      bars(ctx, 560, 88, 380, [
        { label: '去噪分支 MSE（约 80%）', value: 0.8, color: GUIDE },
        { label: '解码分支 CE（约 20%）', value: 0.2, color: EMPH },
      ]);
      label(ctx, ph === 'denoise' ? '当前：去噪' : '当前：解码', 566, 76, ph === 'denoise' ? GUIDE : EMPH);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const toggle = () => {
    const next = phaseRef.current === 'denoise' ? 'decode' : 'denoise';
    phaseRef.current = next;
    setPhase(next);
    setFb(
      next === 'decode'
        ? { text: '解码分支：t=1 时用交叉熵把干净嵌入读成词元，权重与去噪共用。', cls: 'good' }
        : { text: '去噪分支：用均方误差把含噪嵌入往干净嵌入推。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          当前工序 <span className="val">{phase === 'denoise' ? '去噪' : '解码'}</span>
        </label>
        <button className="chip" onClick={toggle}>
          下一步
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch7TwoBranch;
