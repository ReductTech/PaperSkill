import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, drawLegend, bar } from './birdKit';

// m9-2 (deploy-chips) — 部署指标尺：FPS 只在同设备同引擎下可比（Tab 1）。

const W = 1080;
const H = 280;

const DATA: Record<string, { name: string; s: [number, number]; l: [number, number]; max: number }> = {
  t4: { name: 'T4 + TensorRT', s: [305.8, 216.4], l: [102.5, 80.0], max: 330 },
  iphone: { name: 'iPhone 12 + CoreML', s: [64.3, 48.9], l: [27.2, 22.1], max: 80 },
};
const FEEDBACK: Record<string, { text: string; cls: string }> = {
  t4: { text: 'T4 + TensorRT：小模型 1.4×、大模型 1.3× 提速。', cls: 'good' },
  iphone: { text: 'iPhone 12 + CoreML：1.3×/1.2×——结论一致，尺子不同。', cls: '' },
};

export const M9_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ platform: 't4', prev: 't4', animStart: 0 });
  const rafRef = useRef<number | null>(null);
  const [platform, setPlatform] = useState('t4');
  const [feedback, setFeedback] = useState(FEEDBACK.t4);

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
      const cur = DATA[s.platform];
      const prev = DATA[s.prev];
      const anim = easeOutCubic(clamp((performance.now() - s.animStart) / 350, 0, 1));
      const lerp = (a: number, b: number) => a + (b - a) * anim;
      clearScene(ctx, W, H);

      drawSceneLabel(ctx, cur.name, 110, 40, PALETTE.ink);
      drawLegend(
        ctx,
        [
          { color: PALETTE.green, text: 'YOLOE' },
          { color: '#7f93ad', text: 'YOLO-Worldv2' },
        ],
        860,
        42
      );

      const groups: { label: string; pair: [number, number]; prevPair: [number, number]; y: number }[] = [
        { label: 'v8-S', pair: cur.s, prevPair: prev.s, y: 80 },
        { label: 'v8-L', pair: cur.l, prevPair: prev.l, y: 180 },
      ];
      groups.forEach((g) => {
        drawSceneLabel(ctx, g.label, 110, g.y + 30, PALETTE.ink);
        const v0 = lerp(g.prevPair[0], g.pair[0]);
        const v1 = lerp(g.prevPair[1], g.pair[1]);
        bar(ctx, 200, g.y, 520, 26, v0 / cur.max, PALETTE.green, g.pair[0].toFixed(1));
        bar(ctx, 200, g.y + 38, 520, 26, v1 / cur.max, '#7f93ad', g.pair[1].toFixed(1));
        if (anim >= 1) {
          ctx.save();
          ctx.fillStyle = PALETTE.orange;
          ctx.font = 'bold 15px sans-serif';
          // 倍率标签固定在数值列右侧（数值恒在 728 起、约 34px 宽），避免与数值重叠
          ctx.fillText('×' + (g.pair[0] / g.pair[1]).toFixed(1), 770, g.y + 19);
          ctx.restore();
        }
      });

      drawSceneLabel(ctx, '口径：论文 Tab 1 FPS 列', 200, 262, PALETTE.muted);
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
    stateRef.current.prev = stateRef.current.platform;
    stateRef.current.platform = key;
    stateRef.current.animStart = performance.now();
    setPlatform(key);
    setFeedback(FEEDBACK[key]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={platform === 't4' ? 'chip selected' : 'chip'} onClick={() => onChip('t4')}>
          T4 + TensorRT
        </button>
        <button
          type="button"
          className={platform === 'iphone' ? 'chip selected' : 'chip'}
          onClick={() => onChip('iphone')}
        >
          iPhone 12 + CoreML
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M9_2;
