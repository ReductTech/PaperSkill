import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, lerpColor, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 800;
const H = 310;
const PLOT = { x: 66, y: 28, w: 500, h: 228 };
const PANEL = { x: 592, y: 28, w: 180, h: 228 };

const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const TEXT = '#21324a';
const POINT = BLUE;

type Stage = 0 | 1 | 2;

interface DataPoint {
  category: number;
  x: number;
  quality: number;
  selected: boolean;
}

const CATEGORY_COUNTS = [30, 25, 21, 17, 14, 11, 9, 7, 6, 5, 4, 3];

function makePoints(): DataPoint[] {
  let seed = 260525347;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  return CATEGORY_COUNTS.flatMap((count, category) => {
    const points = Array.from({ length: count }, () => ({
      category,
      x: clamp(category / (CATEGORY_COUNTS.length - 1) + (random() - 0.5) * 0.055, 0.015, 0.985),
      quality: clamp(0.08 + Math.pow(random(), 0.82) * 0.84, 0.05, 0.96),
      selected: false,
    }));
    const keep = Math.max(2, Math.ceil(count * 0.22));
    const top = new Set(
      [...points]
        .sort((a, b) => b.quality - a.quality)
        .slice(0, keep)
    );
    return points.map((point) => ({ ...point, selected: top.has(point) }));
  });
}

const DATA = makePoints();

const STAGES: Array<{ label: string; panelTitle: string; panelLines: string[]; feedback: string }> = [
  {
    label: '原始数据池',
    panelTitle: '分布失衡',
    panelLines: ['常见类别样本密集', '长尾类别样本稀少', '质量高低混杂'],
    feedback: '原始池的大多数点集中在高频类别；如果只按总体质量排序，稀有语义仍可能被淹没。',
  },
  {
    label: '① 类间平衡',
    panelTitle: '先保语义覆盖',
    panelLines: ['按细粒度类别组织', '结合类别规模与质量', '提高长尾类别权重'],
    feedback: '第一层在类别之间分配采样权重，让长尾类别仍有机会进入训练，而不是被高频类别完全占据。',
  },
  {
    label: '② 类内择优',
    panelTitle: '再选类内质量',
    panelLines: ['每个类别内部比较', '高审美分数权重更高', '高质量点覆盖长尾'],
    feedback: '第二层在每个类别内部依据审美分数加权；最终高权重点横跨高频与长尾类别，同时兼顾覆盖和质量。',
  },
];

function drawDotLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fill: string,
  label: string,
  stroke?: string
) {
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = MUTED;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 10, y + 4);
}

export const Ch3DataWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage>(0);
  const fromStageRef = useRef<Stage>(0);
  const transitionStartRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState<Stage>(0);

  const selectStage = (next: Stage) => {
    if (next === stageRef.current) return;
    fromStageRef.current = stageRef.current;
    stageRef.current = next;
    transitionStartRef.current = performance.now();
    setStage(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    reduceMotionRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const draw = (now: number) => {
      const duration = reduceMotionRef.current ? 1 : 850;
      const elapsed = transitionStartRef.current === 0 ? duration : now - transitionStartRef.current;
      const t = easeInOutQuad(clamp(elapsed / duration, 0, 1));
      const phase = lerp(fromStageRef.current, stageRef.current, t);
      const balance = clamp(phase, 0, 1);
      const quality = clamp(phase - 1, 0, 1);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.fillRect(PLOT.x, PLOT.y, PLOT.w, PLOT.h);
      ctx.strokeRect(PLOT.x + 0.5, PLOT.y + 0.5, PLOT.w - 1, PLOT.h - 1);

      ctx.strokeStyle = '#e7ebf1';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      for (let i = 1; i < 4; i += 1) {
        const y = PLOT.y + (PLOT.h * i) / 4;
        ctx.beginPath();
        ctx.moveTo(PLOT.x, y);
        ctx.lineTo(PLOT.x + PLOT.w, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      const tailGlow = clamp((balance - 0.25) / 0.75, 0, 1);
      if (tailGlow > 0) {
        const tailX = PLOT.x + PLOT.w * 0.68;
        ctx.fillStyle = `rgba(217,119,6,${0.035 + 0.08 * tailGlow})`;
        ctx.fillRect(tailX, PLOT.y + 1, PLOT.x + PLOT.w - tailX - 1, PLOT.h - 2);
        ctx.fillStyle = ORANGE;
        ctx.globalAlpha = tailGlow;
        ctx.font = '700 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('长尾类别获得更多采样机会', tailX + (PLOT.x + PLOT.w - tailX) / 2, PLOT.y + 18);
        ctx.globalAlpha = 1;
      }

      DATA.forEach((point) => {
        const tailness = point.category / (CATEGORY_COUNTS.length - 1);
        const fill = point.selected ? lerpColor(POINT, GREEN, quality) : POINT;
        const baseAlpha = 0.82;
        const alpha = point.selected
          ? lerp(baseAlpha, 0.98, quality)
          : lerp(baseAlpha, 0.16, quality);
        const radius = point.selected ? lerp(3.8, 4.8, quality) : lerp(3.8, 2.8, quality);
        const x = PLOT.x + 14 + point.x * (PLOT.w - 28);
        const y = PLOT.y + PLOT.h - 14 - point.quality * (PLOT.h - 28);

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        const ringStrength = balance
          * (0.12 + 0.88 * Math.pow(tailness, 0.72))
          * lerp(1, point.selected ? 1 : 0.18, quality);
        if (ringStrength > 0.06) {
          ctx.globalAlpha = ringStrength;
          ctx.beginPath();
          ctx.arc(x, y, radius + 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = ORANGE;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = TEXT;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('高频类别', PLOT.x, PLOT.y + PLOT.h + 22);
      ctx.textAlign = 'right';
      ctx.fillText('长尾类别', PLOT.x + PLOT.w, PLOT.y + PLOT.h + 22);
      ctx.textAlign = 'center';
      ctx.fillStyle = MUTED;
      ctx.fillText('类别频率与覆盖范围  →', PLOT.x + PLOT.w / 2, PLOT.y + PLOT.h + 40);
      ctx.save();
      ctx.translate(24, PLOT.y + PLOT.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('审美质量  →', 0, 0);
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = BORDER;
      ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
      ctx.strokeRect(PANEL.x + 0.5, PANEL.y + 0.5, PANEL.w - 1, PANEL.h - 1);
      const current = STAGES[stageRef.current];
      ctx.fillStyle = stageRef.current === 2 ? GREEN : stageRef.current === 1 ? ORANGE : BLUE;
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(current.panelTitle, PANEL.x + 16, PANEL.y + 26);
      ctx.fillStyle = TEXT;
      ctx.font = '12px "Segoe UI", sans-serif';
      current.panelLines.forEach((line, index) => {
        ctx.fillText(`${index + 1}. ${line}`, PANEL.x + 16, PANEL.y + 55 + index * 25);
      });

      ctx.strokeStyle = BORDER;
      ctx.beginPath();
      ctx.moveTo(PANEL.x + 16, PANEL.y + 126);
      ctx.lineTo(PANEL.x + PANEL.w - 16, PANEL.y + 126);
      ctx.stroke();
      drawDotLegend(ctx, PANEL.x + 22, PANEL.y + 146, POINT, '原始样本');
      drawDotLegend(ctx, PANEL.x + 22, PANEL.y + 168, POINT, '长尾覆盖加权', ORANGE);
      drawDotLegend(ctx, PANEL.x + 22, PANEL.y + 190, GREEN, '类内高质量');
      drawDotLegend(ctx, PANEL.x + 22, PANEL.y + 212, GREEN, '高质量 + 长尾', ORANGE);

      canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      draw(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={`海量预训练数据的二维分布，当前为${STAGES[stage].label}阶段`}
      />
      <div className="chip-row" role="radiogroup" aria-label="两级采样阶段">
        {STAGES.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={`chip ${stage === index ? 'selected' : ''}`}
            role="radio"
            aria-checked={stage === index}
            onClick={() => selectStage(index as Stage)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${stage === 2 ? 'good' : ''}`} aria-live="polite">
        {STAGES[stage].feedback}
      </div>
      <div className="hotspot-info">
        <b>如何读图：</b>横轴从高频类别走向长尾类别，纵轴越高表示审美质量越高。蓝色是原始样本，橙色外圈表示类间覆盖加权，绿色表示类内高质量；绿色加橙色外圈就是同时满足质量与长尾覆盖的样本。其余点并非被硬性删除。
      </div>
    </div>
  );
};

export default Ch3DataWidget;
