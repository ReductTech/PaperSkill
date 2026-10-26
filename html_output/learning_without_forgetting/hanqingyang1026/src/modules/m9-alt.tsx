import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  deep: '#7a4a22',
  porcelain: '#ece6d9',
  tea: '#a9713a',
  teaLight: '#d9b073',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  axis: '#d7deea',
  ink: '#21324a',
};

type Trick = 'lowlr' | 'l2' | 'distill' | 'freeze';

interface Values {
  old: number;
  next: number;
  oldMin: number;
  oldMax: number;
  nextMin: number;
  nextMax: number;
}

const DATA: Record<Trick, { old: number; next: number }> = {
  lowlr: { old: 54.8, next: 62.7 },
  l2: { old: 54.5, next: 63.75 },
  distill: { old: 55.9, next: 64.5 },
  freeze: { old: 57.1, next: 61.2 },
};

// 按 Fig.7(b) 读出：L2 的四个点聚在 旧 54.0–54.9 / 新 63.4–64.1
const L2_BAND = { oldMin: 54.0, oldMax: 54.9, nextMin: 63.4, nextMax: 64.1 };

const COLOR: Record<Trick, string> = {
  lowlr: C.red,
  l2: C.purple,
  distill: C.green,
  freeze: C.blue,
};

const LABEL: Record<Trick, string> = {
  lowlr: '降低学习率',
  l2: '参数 L2',
  distill: '输出蒸馏',
  freeze: '冻结共享层',
};

const COPY: Record<Trick, { text: string; cls: string }> = {
  lowlr: {
    text: '只把共享层学习率降到 10%：旧任务 54.8，新任务也掉到 62.7 —— 两头都不划算。',
    cls: 'bad',
  },
  l2: {
    text: '把参数拉住：λ 加大时，点从 54.0/64.1 滑到 54.9/63.4 —— 旧升新降，只在微调附近打转，离输出蒸馏还差一截（数值按 Fig.7(b) 读出）。',
    cls: '',
  },
  distill: {
    text: '拉输出：旧 55.9、新 64.5 —— 旧任务只比冻共享层低 1.2，新任务却是全场最高，是唯一两头都拿得出手的一条。',
    cls: 'good',
  },
  freeze: {
    text: '干脆冻住：旧 57.1 最高，新任务 61.2 最低 —— 回到特征提取。',
    cls: '',
  },
};

function valuesFor(trick: Trick): Values {
  const d = DATA[trick];
  if (trick === 'l2') {
    return { old: d.old, next: d.next, ...L2_BAND };
  }
  return {
    old: d.old,
    next: d.next,
    oldMin: d.old,
    oldMax: d.old,
    nextMin: d.next,
    nextMax: d.next,
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCup(ctx: CanvasRenderingContext2D, cx: number, level: number) {
  const rimY = 108;
  const baseY = 236;
  const rimW = 142;
  const baseW = 86;

  // 茶托
  ctx.fillStyle = C.porcelain;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, 244, 88, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 杯身
  const body = new Path2D();
  body.moveTo(cx - rimW / 2, rimY);
  body.quadraticCurveTo(cx - rimW / 2 + 8, baseY - 30, cx - baseW / 2, baseY);
  body.lineTo(cx + baseW / 2, baseY);
  body.quadraticCurveTo(cx + rimW / 2 - 8, baseY - 30, cx + rimW / 2, rimY);
  body.closePath();

  ctx.fillStyle = C.porcelain;
  ctx.fill(body);

  // 茶汤：液面高度就是旧任务的保持程度
  ctx.save();
  ctx.clip(body);
  const innerTop = rimY + 10;
  const innerBottom = baseY - 4;
  const surface = innerBottom - (innerBottom - innerTop) * clamp(level, 0.06, 0.94);
  ctx.fillStyle = C.tea;
  ctx.globalAlpha = 0.78;
  ctx.fillRect(cx - rimW / 2, surface, rimW, innerBottom - surface);
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.teaLight;
  ctx.beginPath();
  ctx.ellipse(cx, surface, rimW / 2 - 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.stroke(body);
  ctx.beginPath();
  ctx.ellipse(cx, rimY, rimW / 2, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.porcelain;
  ctx.fill();
  ctx.stroke();

  // 热气
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 16 + i * 26, 94);
    ctx.bezierCurveTo(cx - 24 + i * 26, 78, cx - 6 + i * 26, 70, cx - 12 + i * 26, 56);
    ctx.stroke();
  }
}

function drawRow(
  ctx: CanvasRenderingContext2D,
  v: Values,
  y: number,
  min: number,
  max: number,
  band: boolean,
  color: string
) {
  const x0 = 520;
  const x1 = 1000;
  const h = 30;
  const toX = (n: number) => x0 + ((n - min) / (max - min)) * (x1 - x0);

  ctx.fillStyle = 'rgba(39, 68, 110, 0.07)';
  roundRect(ctx, x0, y, x1 - x0, h, 6);
  ctx.fill();

  if (band) {
    const a = toX(Math.min(v.oldMin, v.oldMax));
    const b = toX(Math.max(v.oldMin, v.oldMax));
    ctx.fillStyle = 'rgba(124, 58, 237, 0.24)';
    roundRect(ctx, a, y, Math.max(4, b - a), h, 6);
    ctx.fill();
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 1.5;
    roundRect(ctx, a, y, Math.max(4, b - a), h, 6);
    ctx.stroke();
  } else {
    const end = toX(v.old);
    ctx.fillStyle = color;
    roundRect(ctx, x0, y, Math.max(3, end - x0), h, 6);
    ctx.fill();
  }
}

function drawValue(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export const M9Alt: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trick, setTrick] = useState<Trick>('lowlr');
  const trickRef = useRef<Trick>('lowlr');
  const [feedback, setFeedback] = useState(COPY.lowlr);
  const dispRef = useRef<Values>(valuesFor('lowlr'));
  const fromRef = useRef<Values>(valuesFor('lowlr'));
  const toRef = useRef<Values>(valuesFor('lowlr'));
  const tweenStartRef = useRef(0);
  const tweeningRef = useRef(false);

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
      if (tweeningRef.current) {
        const p = clamp((now - tweenStartRef.current) / 420, 0, 1);
        const e = easeOutCubic(p);
        const from = fromRef.current;
        const to = toRef.current;
        dispRef.current = {
          old: from.old + (to.old - from.old) * e,
          next: from.next + (to.next - from.next) * e,
          oldMin: from.oldMin + (to.oldMin - from.oldMin) * e,
          oldMax: from.oldMax + (to.oldMax - from.oldMax) * e,
          nextMin: from.nextMin + (to.nextMin - from.nextMin) * e,
          nextMax: from.nextMax + (to.nextMax - from.nextMax) * e,
        };
        if (p >= 1) tweeningRef.current = false;
      }

      const v = dispRef.current;
      const trick = trickRef.current;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 底板
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      roundRect(ctx, 36, 40, 350, 208, 10);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, 406, 40, 638, 208, 10);
      ctx.fill();
      ctx.stroke();

      // 桌面
      ctx.fillStyle = C.table;
      ctx.fillRect(0, 258, W, 22);
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 258);
      ctx.lineTo(W, 258);
      ctx.stroke();

      const level = (v.old - 48) / 12;
      drawCup(ctx, 208, level);

      // 两行条形
      const oldColor = trick === 'l2' ? C.purple : COLOR[trick];
      drawRow(ctx, v, 92, 48, 66, trick === 'l2', oldColor);
      drawRow(
        ctx,
        { ...v, old: v.next, oldMin: v.nextMin, oldMax: v.nextMax },
        188,
        48,
        66,
        trick === 'l2',
        oldColor
      );

      ctx.fillStyle = C.ink;
      ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('旧任务', 420, 107);
      ctx.fillText('新任务', 420, 203);

      if (trick === 'l2') {
        drawValue(
          ctx,
          `${v.oldMin.toFixed(1)}–${v.oldMax.toFixed(1)}`,
          Math.max(toXFor(v.oldMax, 48, 66), 0) + 10,
          107,
          C.purple
        );
        drawValue(
          ctx,
          `${v.nextMin.toFixed(1)}–${v.nextMax.toFixed(1)}`,
          Math.max(toXFor(v.nextMax, 48, 66), 0) + 10,
          203,
          C.purple
        );
      } else {
        drawValue(ctx, v.old.toFixed(1), toXFor(v.old, 48, 66) + 10, 107, oldColor);
        drawValue(ctx, v.next.toFixed(1), toXFor(v.next, 48, 66) + 10, 203, oldColor);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onSelect = (nextTrick: Trick) => {
    setTrick(nextTrick);
    trickRef.current = nextTrick;
    setFeedback(COPY[nextTrick]);
    fromRef.current = { ...dispRef.current };
    toRef.current = valuesFor(nextTrick);
    tweenStartRef.current = performance.now();
    tweeningRef.current = true;
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="三条替代路线与输出蒸馏">
        {(Object.keys(LABEL) as Trick[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${trick === key ? 'selected' : ''}`}
            aria-pressed={trick === key}
            onClick={() => onSelect(key)}
          >
            {LABEL[key]}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

function toXFor(value: number, min: number, max: number): number {
  return 520 + ((value - min) / (max - min)) * (1000 - 520);
}

export default M9Alt;
