import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawSceneLabel,
  SUCCESS,
  FAIL,
  EMPHASIS,
  TEXT,
  TEXT_MUTED,
  BORDER,
} from './billiardsKit';

// 模块 7.1：三份损失的配比。
// 主导操作只有一个：用三枚芯片切换训练配置。柱高始终是论文数值，切换只改顶饰、
// 柱色、描边与反馈，绝不改柱高或数字。

const W = 1080;
const H = 280;
const BASE_Y = 240;
const MAX_BAR = 164; // 0–100 映射 0–164 px
const GROW_MS = 800;

type Variant = 'full' | 'noWm' | 'noLang';
type BarKey = 'a0' | 'a1' | 'b0' | 'b1';

interface Bar {
  key: BarKey;
  value: number;
  x: number;
  w: number;
}

// 左组：RoboTwin 2.0 Clean（x 100–470）；右组：RMBench 平均（x 590–960）
const BARS: Bar[] = [
  { key: 'a0', value: 92.94, x: 140, w: 96 },
  { key: 'a1', value: 90.98, x: 284, w: 96 },
  { key: 'b0', value: 56.5, x: 630, w: 96 },
  { key: 'b1', value: 17.3, x: 774, w: 96 },
];

const GROUPS: { x1: number; x2: number }[] = [
  { x1: 100, x2: 470 },
  { x1: 590, x2: 960 },
];

const AFFECTED: Record<Variant, BarKey | null> = { full: null, noWm: 'a1', noLang: 'b1' };

const CHIPS: { id: Variant; label: string }[] = [
  { id: 'full', label: '三项一起练' },
  { id: 'noWm', label: '去掉世界建模损失 −L_wm' },
  { id: 'noLang', label: '去掉语言损失 −L_lang' },
];

interface Feedback {
  text: string;
  cls: string;
  color?: string;
}

const FEEDBACKS: Record<Variant, Feedback> = {
  full: {
    text: '三项一起练：RoboTwin 2.0 Clean 92.94%，RMBench 平均 56.5%。',
    cls: 'good',
  },
  noWm: {
    text: '去掉世界建模损失：RoboTwin 2.0 Clean 从 92.94% 降到 90.98%，少了 1.96 个百分点。',
    cls: '',
    color: EMPHASIS,
  },
  noLang: {
    text: '去掉语言子任务损失：RMBench 平均从 56.5% 掉到 17.3%（正文写作 17.25%）。',
    cls: 'bad',
  },
};

interface BarStyle {
  fill: string;
  cap: boolean;
  outline?: string;
}

function barStyle(variant: Variant, key: BarKey): BarStyle {
  const affected = AFFECTED[variant];
  if (affected === null) {
    // 三项一起练：论文方法的两根绿柱，对照用的灰柱
    return key === 'a0' || key === 'b0'
      ? { fill: SUCCESS, cap: false }
      : { fill: TEXT_MUTED, cap: false };
  }
  if (key === affected) {
    if (variant === 'noWm') return { fill: EMPHASIS, cap: true };
    // 掉得最多的那一根：红色填充加红色描边
    return { fill: FAIL, cap: true, outline: FAIL };
  }
  return { fill: TEXT_MUTED, cap: false };
}

export const Wla71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ variant: 'full' as Variant, grow: 0 });
  const rafRef = useRef<number | null>(null);
  const [variant, setVariant] = useState<Variant>('full');
  const [feedback, setFeedback] = useState<Feedback>(FEEDBACKS.full);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { variant: Variant; grow: number }) => {
      clearScene(ctx, W, H);
      drawTable(ctx, W, H);

      // 两组各自的基线
      ctx.save();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      GROUPS.forEach((g) => {
        ctx.beginPath();
        ctx.moveTo(g.x1, BASE_Y);
        ctx.lineTo(g.x2, BASE_Y);
        ctx.stroke();
      });
      ctx.restore();

      BARS.forEach((bar) => {
        const style = barStyle(s.variant, bar.key);
        const full = (bar.value / 100) * MAX_BAR;
        const h = full * clamp(s.grow, 0, 1);
        const top = BASE_Y - h;

        ctx.fillStyle = style.fill;
        ctx.fillRect(bar.x, top, bar.w, h);
        if (style.outline) {
          ctx.save();
          ctx.strokeStyle = style.outline;
          ctx.lineWidth = 3;
          ctx.strokeRect(bar.x, BASE_Y - full, bar.w, full);
          ctx.restore();
        }
        if (style.cap) {
          ctx.fillStyle = EMPHASIS;
          ctx.fillRect(bar.x - 6, BASE_Y - full - 7, bar.w + 12, 6);
        }
      });

      // 柱顶裸数字：位置固定，不随切换变化；进场动画末尾淡入
      const numAlpha = clamp((s.grow - 0.85) / 0.15, 0, 1);
      if (numAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = numAlpha;
        BARS.forEach((bar) => {
          const style = barStyle(s.variant, bar.key);
          const top = BASE_Y - (bar.value / 100) * MAX_BAR;
          drawSceneLabel(ctx, String(bar.value), bar.x + bar.w / 2, top - (style.cap ? 20 : 14), {
            align: 'center',
            color: TEXT,
          });
        });
        ctx.restore();
      }

      // 两个短标签放在左侧留白里，避开上下库边
      drawSceneLabel(ctx, '成功率', 56, 150, { color: TEXT });
      drawSceneLabel(ctx, '越高越好', 56, 170, { color: TEXT_MUTED });
    };

    const t0 = performance.now();
    const tick = () => {
      const s = stateRef.current;
      if (s.grow < 1) {
        s.grow = clamp((performance.now() - t0) / GROW_MS, 0, 1);
      }
      render({ variant: s.variant, grow: easeOutCubic(s.grow) });
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

  const onPickVariant = (next: Variant) => {
    stateRef.current.variant = next;
    setVariant(next);
    setFeedback(FEEDBACKS[next]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="训练配置">
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`chip ${variant === chip.id ? 'selected' : ''}`}
            aria-pressed={variant === chip.id}
            onClick={() => onPickVariant(chip.id)}
            style={{ minHeight: 44 }}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        style={feedback.color ? { color: feedback.color, borderLeftColor: feedback.color } : undefined}
      >
        {feedback.text}
      </div>
    </div>
  );
};

export default Wla71;
