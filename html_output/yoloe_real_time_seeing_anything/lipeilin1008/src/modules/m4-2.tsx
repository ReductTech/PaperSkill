import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, bar } from './birdKit';

// m4-2 (align-chips) — 对齐值多少：路线图里的 RepRTA（Tab 5 三档对比）。

const W = 1080;
const H = 280;

interface Variant {
  key: string;
  label: string;
  ap: number;
  apr: number;
  fps: number;
  prevAp: number;
  prevApr: number;
}
const VARIANTS: Variant[] = [
  { key: 'base', label: '去融合基线', ap: 30.0, apr: 19.1, fps: 102.5, prevAp: 30.0, prevApr: 19.1 },
  { key: 'mobileclip', label: '+MobileCLIP', ap: 31.5, apr: 20.2, fps: 102.5, prevAp: 30.0, prevApr: 19.1 },
  { key: 'reprta', label: '+RepRTA', ap: 33.5, apr: 29.5, fps: 102.5, prevAp: 31.5, prevApr: 20.2 },
];
const FEEDBACK: Record<string, { text: string; cls: string }> = {
  base: { text: '去掉跨模态融合后，AP 掉到 30.0——便宜的代价。', cls: 'bad' },
  mobileclip: { text: '换更强的文本编码器，AP 回到 31.5。', cls: '' },
  reprta: { text: '加上 RepRTA：AP 33.5、罕见类 APr 29.5，FPS 纹丝不动。', cls: 'good' },
};

export const M4_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ variant: 'base', animFrom: 0, animStart: 0 });
  const rafRef = useRef<number | null>(null);
  const [variant, setVariant] = useState('base');
  const [feedback, setFeedback] = useState(FEEDBACK.base);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      const v = VARIANTS.find((x) => x.key === s.variant)!;
      const anim = easeOutCubic(clamp((performance.now() - s.animStart) / 400, 0, 1));
      clearScene(ctx, W, H);

      const rows: { name: string; val: number; prev: number; max: number; color: string }[] = [
        { name: 'AP', val: v.ap, prev: v.prevAp, max: 40, color: PALETTE.blue },
        { name: 'APr（罕见类）', val: v.apr, prev: v.prevApr, max: 35, color: PALETTE.blue },
        { name: 'FPS（T4）', val: v.fps, prev: v.fps, max: 110, color: '#7f93ad' },
      ];
      rows.forEach((r, i) => {
        const y = 66 + i * 70;
        drawSceneLabel(ctx, r.name, 90, y + 16, PALETTE.ink);
        const shown = (s.animFrom >= 0 ? r.prev + (r.val - r.prev) * anim : r.val);
        const frac = shown / r.max;
        bar(ctx, 260, y, 560, 24, frac, r.color, r.val.toFixed(1));
        // 增量段绿色叠加（仅 RepRTA 档且动画结束）
        if (v.key === 'reprta' && i < 2 && anim >= 1) {
          const baseFrac = r.prev / r.max;
          ctx.save();
          ctx.fillStyle = PALETTE.green;
          ctx.fillRect(260 + 560 * baseFrac, y, 560 * (frac - baseFrac), 24);
          ctx.fillStyle = PALETTE.green;
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText('+' + (r.val - r.prev).toFixed(1), 260 + 560 * frac + 56, y + 17);
          ctx.restore();
        }
      });

      drawSceneLabel(ctx, '数据：论文 Tab 5（v8-L，30 轮）', 260, 256, PALETTE.muted);
    };

    const tick = () => {
      render();
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

  const onChip = (key: string) => {
    stateRef.current.variant = key;
    stateRef.current.animStart = performance.now();
    setVariant(key);
    setFeedback(FEEDBACK[key]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={variant === v.key ? 'chip selected' : 'chip'}
            onClick={() => onChip(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M4_2;
