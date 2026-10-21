import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 3.1 鉴别清单：长一点更准，还是短一点更准（模式芯片）
// 主导操作：点击芯片切换模型，左侧列表长度条与右侧最终准确率条同帧重绘。

const W = 1080;
const H = 280;

type ModelKey = 'ours' | 'qwen' | 'intern' | 'gemini' | 'gpt5';

type ModelRow = {
  key: ModelKey;
  label: string;
  ddxLen: number;
  finalBacc: number;
  ddxBacc: number;
};

// 数据来自论文 p.12 Table 4（TCGA-RCC，证据寻求协议，平衡准确率，越高越好）。
const MODELS: ModelRow[] = [
  { key: 'ours', label: 'PathFound', ddxLen: 3.18, finalBacc: 92.28, ddxBacc: 95.63 },
  { key: 'qwen', label: 'Qwen3-VL', ddxLen: 21.48, finalBacc: 44.85, ddxBacc: 92.61 },
  { key: 'intern', label: 'InternVL3.5', ddxLen: 19.04, finalBacc: 54.82, ddxBacc: 83.05 },
  { key: 'gemini', label: 'Gemini-2.5', ddxLen: 8.12, finalBacc: 66.59, ddxBacc: 62.01 },
  { key: 'gpt5', label: 'GPT-5', ddxLen: 9.77, finalBacc: 71.52, ddxBacc: 68.42 },
];

const FEEDBACK: Record<ModelKey, { text: string; cls: string }> = {
  ours: { text: '列表只有 3.18 项，最终准确率 92.28%。', cls: 'good' },
  qwen: {
    text: '列表列到 21.48 项，鉴别准确率看起来有 92.61%，但最终准确率只有 44.85%。',
    cls: 'bad',
  },
  intern: {
    text: '列表列到 19.04 项，鉴别准确率 83.05%，最终准确率 54.82%。',
    cls: 'bad',
  },
  gemini: {
    text: '列表短了一些，最终准确率好于开源模型，但仍低于 PathFound。',
    cls: '',
  },
  gpt5: {
    text: '列表短了一些，最终准确率好于开源模型，但仍低于 PathFound。',
    cls: '',
  },
};

const LEFT_X0 = 40;
const LEFT_X1 = 470;
const RIGHT_X0 = 580;
const RIGHT_X1 = 990;
const BAR_Y = 118;
const BAR_H = 36;
const LEN_MAX = 24;

type PieceOpts = {
  fill?: string;
  stroke?: string;
  lines?: number;
  lineColor?: string;
  lineWidth?: number;
  nub?: boolean;
  glow?: boolean;
};

function roundRectPath(
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
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  const top = Math.round(h * 0.5);
  ctx.fillStyle = 'rgba(184, 201, 167, 0.42)';
  ctx.fillRect(0, top, w, h - top);
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, top + 0.5);
  ctx.lineTo(w, top + 0.5);
  ctx.stroke();
  ctx.restore();
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
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#b8c9a7';
  roundRectPath(ctx, x, y, w, h, Math.min(12, h / 2));
  ctx.fill();
  ctx.globalAlpha = Math.min(1, alpha + 0.35);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: PieceOpts = {}
) {
  const fill = opts.fill || '#dfe7d2';
  const stroke = opts.stroke || '#76906a';
  const lineColor = opts.lineColor || stroke;
  const lineWidth = opts.lineWidth || 2;
  const lines = opts.lines === undefined ? 2 : opts.lines;
  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = 'rgba(34, 141, 92, 0.5)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = fill;
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= lines; i += 1) {
    const ly = y + (h * i) / (lines + 1);
    ctx.beginPath();
    ctx.moveTo(x + 7, ly);
    ctx.lineTo(x + w - 7, ly);
    ctx.stroke();
  }
  if (opts.nub !== false) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x + w, y + h / 2, 6, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawPieceBack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#e7e9e3';
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#b8c9a7';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = '#eef3e6';
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1.5;
  const limit = Math.min(w, h) / 2 - 4;
  for (let i = 1; i <= lines; i += 1) {
    const inset = 5 + i * 6;
    if (inset > limit) break;
    roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawJoint(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  ok: boolean
) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.setLineDash(ok ? [] : [8, 6]);
  ctx.strokeStyle = ok ? '#228d5c' : '#c43f52';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawNeedle(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(11, 11);
  ctx.lineTo(26, 26);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted?: boolean
) {
  ctx.save();
  ctx.fillStyle = muted ? '#68778f' : '#21324a';
  ctx.font = (muted ? '18px' : '22px') + ' "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; text: string }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    roundRectPath(ctx, cx, y - 12, 14, 14, 3);
    ctx.fill();
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#68778f';
    ctx.fillText(item.text, cx + 20, y);
    cx += 20 + ctx.measureText(item.text).width + 26;
  }
  ctx.restore();
}

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ key: ModelKey }>({ key: 'ours' });
  const [model, setModel] = useState<ModelKey>('ours');
  const [feedback, setFeedback] = useState(FEEDBACK.ours);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (key: ModelKey) => {
      const row = MODELS.find((m) => m.key === key) || MODELS[0];
      const lenW = clamp(row.ddxLen / LEN_MAX, 0, 1) * (LEFT_X1 - LEFT_X0);
      const accW = clamp(row.finalBacc / 100, 0, 1) * (RIGHT_X1 - RIGHT_X0);
      const accColor = key === 'ours' ? '#228d5c' : '#27446e';

      clearScene(ctx, W, H);
      drawBoard(ctx, 16, 96, 1048, 156, 0.35);

      ctx.save();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(540, 20);
      ctx.lineTo(540, 252);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (let v = 0; v <= LEN_MAX; v += 6) {
        const x = LEFT_X0 + (v / LEN_MAX) * (LEFT_X1 - LEFT_X0);
        ctx.strokeStyle = '#d7deea';
        ctx.beginPath();
        ctx.moveTo(x, BAR_Y + BAR_H);
        ctx.lineTo(x, BAR_Y + BAR_H + 10);
        ctx.stroke();
        ctx.fillText(String(v), x, BAR_Y + BAR_H + 32);
      }
      for (let v = 0; v <= 100; v += 25) {
        const x = RIGHT_X0 + (v / 100) * (RIGHT_X1 - RIGHT_X0);
        ctx.strokeStyle = '#d7deea';
        ctx.beginPath();
        ctx.moveTo(x, BAR_Y + BAR_H);
        ctx.lineTo(x, BAR_Y + BAR_H + 10);
        ctx.stroke();
        ctx.fillText(String(v), x, BAR_Y + BAR_H + 32);
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#d7deea';
      roundRectPath(ctx, LEFT_X0, BAR_Y, LEFT_X1 - LEFT_X0, BAR_H, 6);
      ctx.fill();
      roundRectPath(ctx, RIGHT_X0, BAR_Y, RIGHT_X1 - RIGHT_X0, BAR_H, 6);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#f07e47';
      roundRectPath(ctx, LEFT_X0, BAR_Y, Math.max(4, lenW), BAR_H, 6);
      ctx.fill();
      ctx.fillStyle = accColor;
      roundRectPath(ctx, RIGHT_X0, BAR_Y, Math.max(4, accW), BAR_H, 6);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.ddxLen.toFixed(2), LEFT_X0 + Math.max(4, lenW) + 10, BAR_Y + BAR_H / 2);
      ctx.fillText(
        row.finalBacc.toFixed(2),
        RIGHT_X0 + Math.max(4, accW) + 10,
        BAR_Y + BAR_H / 2
      );
      ctx.restore();

      drawSceneLabel(ctx, '列表长度', 40, 44, false);
      drawSceneLabel(ctx, '最终准确率', 580, 44, false);
      drawLegend(
        ctx,
        [
          { color: '#228d5c', text: '论文方法' },
          { color: '#27446e', text: '对照模型' },
          { color: '#f07e47', text: '鉴别列表长度' },
        ],
        40,
        266
      );
    };

    const tick = () => {
      render(stateRef.current.key);
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

  const pick = (key: ModelKey) => {
    stateRef.current.key = key;
    setModel(key);
    setFeedback(FEEDBACK[key]);
  };

  const row = MODELS.find((m) => m.key === model) || MODELS[0];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MODELS.map((m) => (
          <button
            key={m.key}
            className={`chip ${model === m.key ? 'selected' : ''}`}
            onClick={() => pick(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="metrics">
        <span className="metric">
          列表长度 <span className="val">{row.ddxLen.toFixed(2)}</span>
        </span>
        <span className="metric">
          鉴别命中率 <span className="val">{row.ddxBacc.toFixed(2)}</span>
        </span>
        <span className="metric">
          最终准确率 <span className="val">{row.finalBacc.toFixed(2)}</span>
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31;
