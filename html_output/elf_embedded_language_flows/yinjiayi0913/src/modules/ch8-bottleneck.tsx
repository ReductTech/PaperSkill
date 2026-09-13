import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, bars, label, GUIDE, OK, MUTED, LINE } from './clayKit';

// 模块 8.2：512 维嵌入 → 128 维瓶颈 → 模型隐藏维的收腰设计。
const W = 1080;
const H = 260;

export const Ch8Bottleneck: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onRef = useRef(true);
  const [on, setOn] = useState(true);
  const [fb, setFb] = useState({ text: '切到「无瓶颈」比较计算量：论文默认先压到 128 维再展开。', cls: '' });

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
    const tick = () => {
      const waist = onRef.current ? 44 : 150;
      field(ctx, W, H);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 60);
      ctx.lineTo(360, 60);
      ctx.lineTo(360, 130 - waist / 2);
      ctx.lineTo(430, 130 - waist / 2);
      ctx.lineTo(430, 130 + waist / 2);
      ctx.lineTo(360, 130 + waist / 2);
      ctx.lineTo(360, 200);
      ctx.lineTo(300, 200);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      bars(ctx, 600, 90, 340, [
        { label: onRef.current ? '瓶颈 128 维：省算力' : '无瓶颈：维度更高更贵', value: onRef.current ? 0.28 : 0.85, color: onRef.current ? OK : GUIDE },
      ]);
      label(ctx, onRef.current ? '512→128' : '512→512', 300, 46, MUTED);
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

  const pick = (v: boolean) => {
    onRef.current = v;
    setOn(v);
    setFb(
      v
        ? { text: '先投影到 128 维再展开回隐藏维，省下大量计算。', cls: 'good' }
        : { text: '直接在原始维度上做，代价明显更高。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${on ? 'selected' : ''}`} onClick={() => pick(true)}>
          有瓶颈 128
        </button>
        <button className={`chip ${!on ? 'selected' : ''}`} onClick={() => pick(false)}>
          无瓶颈
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Bottleneck;
