import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10.2 谁领先，领先在哪一项：侵袭检测任务上四个模型的精确率 / 召回 / F1 取舍。
// 数字全部取自论文 p.11 Table 3。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const ENV = '#b8c9a7';
const ENV_D = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const MUTED = '#68778f';
const LINE = '#d7deea';
const FONT_L = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
const FONT_S = '18px "Segoe UI", "Microsoft YaHei", sans-serif';

type ModelKey = 'ours' | 'gemini' | 'gpt5' | 'intern';

type ModelSpec = {
  label: string;
  prec: number;
  rec: number;
  f1: number;
  tag: string;
  text: string;
  cls: string;
};

const MODELS: Record<ModelKey, ModelSpec> = {
  ours: {
    label: 'PathFound',
    prec: 67.65,
    rec: 75.82,
    f1: 71.5,
    tag: '取舍均衡',
    text: '67.65 / 75.82 / 71.50——F1 最高，精确率与召回都不走极端。',
    cls: 'good',
  },
  gemini: {
    label: 'Gemini-2.5',
    prec: 41.75,
    rec: 90.0,
    f1: 57.04,
    tag: '偏向召回',
    text: '召回 90.00 最高，但精确率只有 41.75——它倾向于把可疑的都判成有侵袭。',
    cls: 'bad',
  },
  gpt5: {
    label: 'GPT-5',
    prec: 40.81,
    rec: 78.89,
    f1: 53.79,
    tag: '偏向召回',
    text: '召回 78.89，精确率 40.81——与 Gemini 同一类取舍。',
    cls: 'bad',
  },
  intern: {
    label: 'InternVL3.5',
    prec: 46.67,
    rec: 62.22,
    f1: 53.33,
    tag: '落在中段',
    text: 'F1 53.33，落在中段。',
    cls: '',
  },
};

const ORDER: ModelKey[] = ['ours', 'gemini', 'gpt5', 'intern'];

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function ease(t: number) {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
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

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = ENV;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.globalAlpha = clamp(alpha + 0.35, 0, 1);
  ctx.strokeStyle = ENV_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = FONT_S;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    ctx.fillStyle = it.color;
    roundRect(ctx, cx, y - 7, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.fillText(it.label, cx + 20, y);
    cx += 20 + ctx.measureText(it.label).width + 18;
  }
  ctx.restore();
}

function render(
  ctx: CanvasRenderingContext2D,
  s: { model: ModelKey; prec: number; rec: number; f1: number }
) {
  ctx.clearRect(0, 0, W, H);
  clearScene(ctx, W, H);
  drawBoard(ctx, 20, 6, 1040, 270, 0.14);

  const isOurs = s.model === 'ours';
  const color = isOurs ? GREEN : BLUE;
  const baseY = 250;
  const maxH = 170;
  const barW = 90;
  const xs = [100, 250, 400];
  const vals = [s.prec, s.rec, s.f1];
  const labels = ['精确率', '召回', 'F1'];

  // 三根刻度线
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  for (let k = 0; k <= 2; k++) {
    const ty = baseY - (maxH * k) / 2;
    ctx.beginPath();
    ctx.moveTo(60, ty);
    ctx.lineTo(540, ty);
    ctx.stroke();
  }
  ctx.restore();

  // 三根竖条 + 条顶裸数字
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    const h = (clamp(vals[i], 0, 100) / 100) * maxH;
    const x = xs[i];
    const y = baseY - h;

    roundRect(ctx, x, y, barW, h, 8);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = ORANGE;
    roundRect(ctx, x, y - 3, barW, 5, 2);
    ctx.fill();

    ctx.font = FONT_L;
    ctx.fillStyle = color;
    ctx.fillText(vals[i].toFixed(2), x + barW / 2, y - 18);

    ctx.font = FONT_S;
    ctx.fillStyle = MUTED;
    ctx.fillText(labels[i], x + barW / 2, baseY + 16);
  }
  ctx.restore();

  // 分隔线
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(620, 22);
  ctx.lineTo(620, 258);
  ctx.stroke();
  ctx.restore();

  // 当前模型的 F1 数值 + 一个短标签
  const spec = MODELS[s.model];
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  roundRect(ctx, 664, 88, 14, 14, 4);
  ctx.fill();
  ctx.font = FONT_L;
  ctx.fillStyle = color;
  ctx.fillText(s.f1.toFixed(2), 690, 96);

  ctx.font = FONT_S;
  const tagW = ctx.measureText(spec.tag).width;
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = color;
  roundRect(ctx, 664, 148, tagW + 32, 36, 18);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, 664, 148, tagW + 32, 36, 18);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(spec.tag, 680, 167);
  ctx.restore();

  // 一个 3 项图例
  drawLegend(
    ctx,
    [
      { label: '论文方法', color: GREEN },
      { label: '对照模型', color: BLUE },
      { label: '当前模型', color: ORANGE },
    ],
    660,
    240
  );
}

export const M102: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const st = useRef({
    model: 'ours' as ModelKey,
    from: { prec: 67.65, rec: 75.82, f1: 71.5 },
    to: { prec: 67.65, rec: 75.82, f1: 71.5 },
    startAt: 0,
    moving: false,
  });
  const [model, setModel] = useState<ModelKey>('ours');
  const [feedback, setFeedback] = useState({ text: MODELS.ours.text, cls: MODELS.ours.cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const now = performance.now();
      const s = st.current;
      let t = 1;
      if (s.moving) {
        t = clamp((now - s.startAt) / 600, 0, 1);
        if (t >= 1) {
          s.moving = false;
          s.from = { prec: s.to.prec, rec: s.to.rec, f1: s.to.f1 };
        }
      }
      const e = ease(t);
      render(ctx, {
        model: s.model,
        prec: mix(s.from.prec, s.to.prec, e),
        rec: mix(s.from.rec, s.to.rec, e),
        f1: mix(s.from.f1, s.to.f1, e),
      });
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

  const pick = (k: ModelKey) => {
    const s = st.current;
    const now = performance.now();
    const t = s.moving ? clamp((now - s.startAt) / 600, 0, 1) : 1;
    const e = ease(t);
    s.from = {
      prec: mix(s.from.prec, s.to.prec, e),
      rec: mix(s.from.rec, s.to.rec, e),
      f1: mix(s.from.f1, s.to.f1, e),
    };
    const spec = MODELS[k];
    s.to = { prec: spec.prec, rec: spec.rec, f1: spec.f1 };
    s.model = k;
    s.startAt = now;
    s.moving = true;
    setModel(k);
    setFeedback({ text: spec.text, cls: spec.cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ORDER.map((k) => (
          <button
            key={k}
            className={`chip ${model === k ? 'selected' : ''}`}
            onClick={() => pick(k)}
          >
            {MODELS[k].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M102;
