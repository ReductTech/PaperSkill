import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, ring, label, EMPH, GUIDE, OK, BAD, MUTED, LINE } from './clayKit';

// 模块 2.1：四种连续表示（泥料）的筹码切换，观察嵌入分布与推荐结论。
const W = 1080;
const H = 300;

type Kind = 'pretrained-ctx' | 'scratch-ctx' | 'frozen-gaussian' | 'learnable';

const KINDS: { id: Kind; label: string; spread: number }[] = [
  { id: 'pretrained-ctx', label: '预训练上下文', spread: 0.32 },
  { id: 'scratch-ctx', label: '从零训练编码器', spread: 0.46 },
  { id: 'frozen-gaussian', label: '冻结高斯嵌入', spread: 0.72 },
  { id: 'learnable', label: '可学习嵌入', spread: 0.95 },
];

const SCATTER = { x: 150, y: 56, w: 620, h: 200 };

function dots(spread: number) {
  const centers = [
    [0.28, 0.65],
    [0.52, 0.35],
    [0.76, 0.6],
  ];
  const out: number[][] = [];
  let seed = 7;
  for (let i = 0; i < 66; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const r1 = seed / 2147483648;
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const r2 = seed / 2147483648;
    const c = centers[i % 3];
    out.push([c[0] + (r1 - 0.5) * spread * 0.5, c[1] + (r2 - 0.5) * spread * 0.5]);
  }
  return out;
}

export const Ch2Embedding: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kindRef = useRef<Kind>('pretrained-ctx');
  const [kind, setKind] = useState<Kind>('pretrained-ctx');
  const [fb, setFb] = useState({ text: '选一种连续表示：上下文嵌入同时看整句，非上下文只看单个词。', cls: '' });

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
      const cur = KINDS.find((k) => k.id === kindRef.current) || KINDS[0];
      field(ctx, W, H);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.fillRect(SCATTER.x, SCATTER.y, SCATTER.w, SCATTER.h);
      ctx.strokeRect(SCATTER.x, SCATTER.y, SCATTER.w, SCATTER.h);
      ctx.restore();
      dots(cur.spread).forEach((d) => {
        ctx.save();
        ctx.fillStyle = GUIDE;
        ctx.beginPath();
        ctx.arc(SCATTER.x + d[0] * SCATTER.w, SCATTER.y + d[1] * SCATTER.h, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ring(ctx, 930, 150, 52, EMPH, false);
      label(ctx, '当前', 908, 88, EMPH);
      label(ctx, cur.spread < 0.4 ? '分布紧致' : cur.spread < 0.8 ? '分布偏散' : '分布很散', 160, 46, MUTED);
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

  const pick = (k: Kind) => {
    kindRef.current = k;
    setKind(k);
    const map: Record<Kind, { text: string; cls: string }> = {
      'pretrained-ctx': { text: '预训练上下文嵌入的困惑度-熵权衡最好。', cls: 'good' },
      'scratch-ctx': { text: '从零训练的编码器也不错，但略逊于预训练版本。', cls: '' },
      'frozen-gaussian': { text: '丢掉上下文信息后明显变差。', cls: 'bad' },
      learnable: { text: '嵌入与去噪器互相拖累，表现最差。', cls: 'bad' },
    };
    setFb(map[k]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {KINDS.map((k) => (
          <button key={k.id} className={`chip ${kind === k.id ? 'selected' : ''}`} onClick={() => pick(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch2Embedding;
