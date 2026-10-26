import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8.2 —— 四种改法，谁真划算。
// 左边结构小图（共享块 / 多划的专属层 / 扩张出来的紫块），右边旧、新任务两组条形。
// 数值取自 Table 2(a)：ImageNet→CUB，AlexNet，三次取平均。

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  ink: '#21324a',
  axis: '#c3cfdd',
  soft: '#d7deea',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  orange: '#f07e47',
  purple: '#7c3aed',
  porcelain: '#ece6d9',
  edge: '#7a4a22',
};

interface VariantDef {
  id: string;
  label: string;
  old: number;
  neu: number;
  specific: string[];
  expand: boolean;
  note: string;
  cls: string;
}

const VARIANTS: VariantDef[] = [
  {
    id: 'out',
    label: '输出层专属',
    old: 54.7,
    neu: 57.7,
    specific: ['head'],
    expand: false,
    note: '只把输出层当专属：旧 54.7、新 57.7 —— 这就是本文的默认做法。',
    cls: 'good',
  },
  {
    id: 'last',
    label: '最后隐层',
    old: 54.7,
    neu: 56.2,
    specific: ['fc7', 'head'],
    expand: false,
    note: '把最后隐层也划成专属：旧 54.7 没涨，新 56.2 反而更低 —— 存储变大，收益没来。',
    cls: '',
  },
  {
    id: 'second',
    label: '倒数第二层',
    old: 54.6,
    neu: 57.1,
    specific: ['fc6', 'fc7', 'head'],
    expand: false,
    note: '再多划一层：旧 54.6、新 57.1，和只换输出层几乎没差别。',
    cls: '',
  },
  {
    id: 'expand',
    label: '网络扩张',
    old: 57.0,
    neu: 54.0,
    specific: ['head'],
    expand: true,
    note: '扩张网络单独用：旧任务 57.0 是所有改法里最高的，新任务却掉到 54.0 —— 它是靠冻结旧参数换来不遗忘，代价落在新任务和参数量上。',
    cls: '',
  },
  {
    id: 'expand_lwf',
    label: '扩张 + LwF',
    old: 54.4,
    neu: 57.0,
    specific: ['head'],
    expand: true,
    note: '扩张 + LwF：和原版几乎一样（54.4 / 57.0），代价却更高。',
    cls: 'good',
  },
];

interface Row {
  key: string;
  y: number;
  w: number;
  h: number;
}

const ROWS: Row[] = [
  { key: 'conv', y: 42, w: 150, h: 20 },
  { key: 'fc6', y: 82, w: 132, h: 20 },
  { key: 'fc7', y: 122, w: 122, h: 20 },
  { key: 'fc8', y: 162, w: 104, h: 20 },
  { key: 'head', y: 202, w: 96, h: 20 },
];

const SX = 76;

const BX0 = 600;
const BX1 = 1010;
const OLD_Y = 96;
const NEW_Y = 156;
const BAR_H = 34;

const xVal = (v: number) => BX0 + ((v - 50) / 10) * (BX1 - BX0);

interface BarAnim {
  co: number;
  cn: number;
  fo: number;
  fn: number;
  to: number;
  tn: number;
  t0: number;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export const M8Variants: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const variantRef = useRef('out');
  const anim = useRef<BarAnim>({
    co: 54.7,
    cn: 57.7,
    fo: 54.7,
    fn: 57.7,
    to: 54.7,
    tn: 57.7,
    t0: -1,
  });
  const [variant, setVariant] = useState('out');
  const first = VARIANTS[0];
  const [feedback, setFeedback] = useState({ text: first.note, cls: first.cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const draw = (now: number) => {
      const v = VARIANTS.find((d) => d.id === variantRef.current) || VARIANTS[0];
      const a = anim.current;
      if (a.t0 >= 0) {
        const p = clamp((now - a.t0) / 450, 0, 1);
        const e = easeOutCubic(p);
        a.co = a.fo + (a.to - a.fo) * e;
        a.cn = a.fn + (a.tn - a.fn) * e;
        if (p >= 1) a.t0 = -1;
      } else {
        a.co = a.to;
        a.cn = a.tn;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- 左：结构小图 ----
      ROWS.forEach((r, i) => {
        const isSpecific = v.specific.indexOf(r.key) >= 0;
        if (r.key === 'head') {
          ctx.fillStyle = 'rgba(124,58,237,0.14)';
        } else if (r.key === 'fc8') {
          ctx.fillStyle = 'rgba(34,141,92,0.14)';
        } else if (isSpecific) {
          ctx.fillStyle = 'rgba(240,126,71,0.2)';
        } else {
          ctx.fillStyle = C.porcelain;
        }
        roundRect(ctx, SX, r.y, r.w, r.h, 5);
        ctx.fill();

        if (r.key === 'head') {
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1.8;
        } else if (r.key === 'fc8') {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 1.8;
        } else if (isSpecific) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = C.edge;
          ctx.lineWidth = 1.4;
        }
        roundRect(ctx, SX, r.y, r.w, r.h, 5);
        ctx.stroke();

        // 扩张出来的紫块（顶三层）
        if (v.expand && (r.key === 'conv' || r.key === 'fc6' || r.key === 'fc7')) {
          ctx.fillStyle = 'rgba(124,58,237,0.2)';
          roundRect(ctx, SX + r.w + 8, r.y, 26, r.h, 5);
          ctx.fill();
          ctx.strokeStyle = C.purple;
          ctx.lineWidth = 1.6;
          roundRect(ctx, SX + r.w + 8, r.y, 26, r.h, 5);
          ctx.stroke();
        }

        // 层间连线
        if (i < ROWS.length - 1) {
          ctx.strokeStyle = C.axis;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(SX + 44, r.y + r.h + 2);
          ctx.lineTo(SX + 44, ROWS[i + 1].y - 2);
          ctx.stroke();
        }
      });

      if (v.expand) {
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(330, 52, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(323, 52);
        ctx.lineTo(337, 52);
        ctx.moveTo(330, 45);
        ctx.lineTo(330, 59);
        ctx.stroke();
      }

      // ---- 右：两组条形 ----
      ctx.strokeStyle = C.soft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(560, 66);
      ctx.lineTo(560, 216);
      ctx.stroke();

      // 轴
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(BX0, 212);
      ctx.lineTo(BX1, 212);
      ctx.stroke();

      [50, 55, 60].forEach((tick) => {
        const x = xVal(tick);
        ctx.strokeStyle = C.soft;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 212);
        ctx.lineTo(x, 218);
        ctx.stroke();
      });

      ctx.fillStyle = C.ink;
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('50', BX0, 236);
      ctx.fillText('60', BX1, 236);

      // 旧任务
      ctx.fillStyle = C.blue;
      roundRect(ctx, BX0, OLD_Y, Math.max(2, xVal(a.co) - BX0), BAR_H, 4);
      ctx.fill();

      // 新任务：扩张那一档掉到 54.0，用橙标出来
      ctx.fillStyle = v.id === 'expand' ? C.orange : C.green;
      roundRect(ctx, BX0, NEW_Y, Math.max(2, xVal(a.cn) - BX0), BAR_H, 4);
      ctx.fill();

      ctx.fillStyle = C.ink;
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(a.co.toFixed(1), xVal(a.co) + 10, OLD_Y + 24);
      ctx.fillText(a.cn.toFixed(1), xVal(a.cn) + 10, NEW_Y + 24);

      // 两个标签
      ctx.fillStyle = C.ink;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('旧任务', 548, OLD_Y + 23);
      ctx.fillText('新任务', 548, NEW_Y + 23);
    };

    const tick = () => {
      draw(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (id: string) => {
    const v = VARIANTS.find((d) => d.id === id);
    if (!v) return;
    const a = anim.current;
    a.fo = a.co;
    a.fn = a.cn;
    a.to = v.old;
    a.tn = v.neu;
    a.t0 = performance.now();
    variantRef.current = id;
    setVariant(id);
    setFeedback({ text: v.note, cls: v.cls });
  };

  return (
    <div>
      <div className="chip-row">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`chip${v.id === variant ? ' selected' : ''}`}
            aria-pressed={v.id === variant}
            onClick={() => select(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M8Variants;
