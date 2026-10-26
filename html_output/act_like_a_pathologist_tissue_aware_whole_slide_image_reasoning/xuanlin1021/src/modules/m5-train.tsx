import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearPlate, drawContactSheet, drawTag, usePlate } from './scene-kit';

// §5 模块 5.1：同一道题，两种采样器同时开始。
// 数值是论文的真实结果：随机采样 88.84%，训练后的选择器 94.57%（Table 4，Morphology）。
// 右墙只点亮 30% 的格位，对应 5k 预算约等于全部片块的 30%。

const W = 1080;
const H = 280;
const DUR = 2600;
const LEFT_ACC = 88.84;
const RIGHT_ACC = 94.57;

type Phase = 'idle' | 'running' | 'done';

const PANEL = { w: 496, h: 176, y: 40 };
const ALL = Array.from({ length: 20 }, (_, i) => i);
const RIGHT_LIT = [1, 4, 6, 9, 13, 16, 18, 2];

export const M5Train: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const plate = usePlate(W, H);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);

  const render = useCallback(
    (p: number) => {
      const canvas = ref.current;
      const ctx = plate(canvas);
      if (!ctx) return;
      clearPlate(ctx, W, H);

      const panels = [
        { x: 28, lit: ALL, tone: 'red' as const, acc: LEFT_ACC * p, label: '随机' },
        { x: 556, lit: RIGHT_LIT, tone: 'green' as const, acc: RIGHT_ACC * p, label: '选出' },
      ];
      panels.forEach((panel) => {
        drawContactSheet(
          ctx,
          { x: panel.x, y: PANEL.y, w: PANEL.w, h: PANEL.h },
          5,
          4,
          panel.lit,
          { seed: panel.tone === 'red' ? 21 : 22, tone: panel.tone, dimUnlit: 0.2 }
        );
        // 准确率条
        const barY = PANEL.y + PANEL.h + 12;
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1;
        ctx.strokeRect(panel.x + 0.5, barY + 0.5, PANEL.w, 16);
        ctx.fillStyle = panel.tone === 'red' ? C.red : C.green;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(panel.x + 1, barY + 1, (PANEL.w - 2) * (panel.acc / 100), 14);
        ctx.globalAlpha = 1;
        if (p > 0.02) {
          ctx.fillStyle = C.text;
          ctx.font = '600 15px "Segoe UI","Microsoft YaHei",sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(panel.acc.toFixed(2), panel.x + PANEL.w - 4, barY - 4);
        }
        drawTag(ctx, panel.label, panel.x + 2, PANEL.y - 8, { size: 13, color: C.muted });
      });
      if (canvas && !canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    },
    [plate]
  );

  useEffect(() => {
    render(progress);
  }, [render, progress]);

  useEffect(() => {
    if (phase !== 'running') return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / DUR);
      setProgress(p);
      if (p >= 1) {
        setPhase('done');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const start = () => {
    setProgress(0);
    setPhase('running');
  };

  const fb =
    phase === 'idle'
      ? { text: '按一次，两侧同时开始：左边把片块随便送进去，右边送训练后选出的片块。', cls: '' }
      : phase === 'running'
      ? { text: '同样的预算，不同的挑法。', cls: '' }
      : { text: '随机采样 88.84%，训练后的选择器 94.57%：差的不是运气，是排序。', cls: 'good' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className="chip" onClick={start} disabled={phase === 'running'}>
          {phase === 'done' ? '重新比较' : '同时开始'}
        </button>
        <span className="val">同一道题 · 5k 预算</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M5Train;
