import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6.1 —— 四步流程：记快照 → 加新头 → 热身 → 联合优化。
// 网络行 conv1–conv5 → fc6 → fc7 → fc8 → 新头；冻结块盖灰遮罩加小锁，可训块亮绿边。
// 终点数值取自 Table 1(a) ImageNet→CUB：旧 54.7 / 新 57.7。

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  blue: '#27446e',
  green: '#228d5c',
  purple: '#7c3aed',
  axis: '#d7deea',
  ink: '#21324a',
  line: '#c6d0dc',
  mask: 'rgba(120,132,146,',
};

type Block = { key: string; x: number; w: number };

const BLOCKS: Block[] = [
  { key: 'conv1', x: 40, w: 48 },
  { key: 'conv2', x: 100, w: 48 },
  { key: 'conv3', x: 160, w: 48 },
  { key: 'conv4', x: 220, w: 48 },
  { key: 'conv5', x: 280, w: 48 },
  { key: 'fc6', x: 372, w: 56 },
  { key: 'fc7', x: 452, w: 56 },
  { key: 'fc8', x: 532, w: 56 },
  { key: 'head', x: 636, w: 96 },
];

const BY = 92;
const BH = 46;

const OLD_ACC = 54.7;
const NEW_ACC = [0, 0, 0, 41, 57.7];

const CAPTIONS = [
  '起点：一份训练好的旧网络，手上只有新任务的图片和标签。',
  '第一步：把新任务图片喂给旧网络，存下旧类输出 Y_o。',
  '第二步：在输出层加新类节点，随机初始化 θ_n，参数量只有新类数 × 4096。',
  '第三步热身：冻结 θ_s 和 θ_o，只训新头 —— 新任务先及格（41 为示意值，论文未报告该中间值）。',
  '第四步联合：全部参数一起训，旧任务靠蒸馏项守住 54.7，新任务到 57.7。',
];

function trainableKeys(step: number): string[] {
  if (step >= 4) return BLOCKS.map((b) => b.key);
  if (step === 3) return ['head'];
  return [];
}

function maskTarget(step: number, key: string): number {
  return trainableKeys(step).indexOf(key) >= 0 ? 0 : 0.45;
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

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dx * 8 - dy * 3.5, y - dy * 8 + dx * 3.5);
  ctx.lineTo(x - dx * 8 + dy * 3.5, y - dy * 8 - dx * 3.5);
  ctx.closePath();
  ctx.fill();
}

function lock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#4b5b6d';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, 4, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#eef1f4';
  ctx.fillRect(x - 5, y, 10, 8);
  ctx.strokeRect(x - 5, y, 10, 8);
}

function render(ctx: CanvasRenderingContext2D, masks: number[], step: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const yc = BY + BH / 2;

  // 连接线
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < BLOCKS.length - 1; i += 1) {
    const from = BLOCKS[i];
    const next = BLOCKS[i + 1];
    const x1 = from.x + from.w + 2;
    const x2 = next.x - 4;
    ctx.beginPath();
    ctx.moveTo(x1, yc);
    ctx.lineTo(x2, yc);
    ctx.stroke();
    if (next.x - (from.x + from.w) >= 20) {
      ctx.fillStyle = C.axis;
      arrowHead(ctx, x2, yc, 1, 0);
    }
  }

  BLOCKS.forEach((b, i) => {
    const isHead = b.key === 'head';
    const m = clamp(masks[i], 0, 1);
    const grown = step >= 2;
    const trainable = m < 0.12;
    const headOn = step >= 3;

    if (isHead) {
      ctx.fillStyle = grown ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.7)';
      roundRect(ctx, b.x, BY, b.w, BH, 8);
      ctx.fill();
      ctx.strokeStyle = headOn ? C.green : grown ? C.purple : C.line;
      ctx.lineWidth = headOn ? 2.5 : 1.6;
      ctx.setLineDash(headOn ? [] : [6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (grown) {
        ctx.fillStyle = C.purple;
        ctx.globalAlpha = 0.75;
        for (let k = 0; k < 3; k += 1) {
          roundRect(ctx, b.x + 20 + k * 22, yc - 8, 15, 16, 3);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, b.x, BY, b.w, BH, 8);
      ctx.fill();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 冻结遮罩：只盖共享层与旧类头，新头用虚线/绿边自己表示状态
    if (!isHead && m > 0.01) {
      ctx.fillStyle = C.mask + m.toFixed(3) + ')';
      roundRect(ctx, b.x, BY, b.w, BH, 8);
      ctx.fill();
    }

    // 可训块绿描边
    if (!isHead && trainable) {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      roundRect(ctx, b.x + 1.5, BY + 1.5, b.w - 3, BH - 3, 7);
      ctx.stroke();
    }

    // 锁形小方块
    if (!isHead && m > 0.25) {
      ctx.globalAlpha = clamp((m - 0.25) / 0.2, 0, 1);
      lock(ctx, b.x + b.w - 12, BY + 9);
      ctx.globalAlpha = 1;
    }
  });

  // 右上两个数字：旧 / 新
  const cards = [
    { y: 72, color: C.blue, value: OLD_ACC.toFixed(1) },
    { y: 152, color: C.green, value: NEW_ACC[step].toFixed(1) },
  ];
  cards.forEach((c) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 800, c.y, 216, 64, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.color;
    ctx.fillRect(800, c.y + 10, 4, 44);
    ctx.font = '600 30px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(c.value, 820, c.y + 45);
  });

  // 步骤标记（形状，不写字）
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i <= step ? C.blue : C.axis;
    roundRect(ctx, 40 + i * 26, 246, 18, 6, 3);
    ctx.fill();
  }
}

export const M6Steps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef(0);
  const animRef = useRef({
    from: BLOCKS.map(() => 0.45),
    to: BLOCKS.map(() => 0.45),
    t0: 0,
  });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: CAPTIONS[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    animRef.current.t0 = performance.now() - 400;
    let raf: number | null = null;

    const tick = (now: number) => {
      const a = animRef.current;
      const p = clamp((now - a.t0) / 280, 0, 1);
      const e = easeOutCubic(p);
      const masks = a.from.map((v, i) => v + (a.to[i] - v) * e);
      render(ctx, masks, stepRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const target = clamp(next, 0, 4);
    if (target === stepRef.current) return;
    const a = animRef.current;
    const p = clamp((performance.now() - a.t0) / 280, 0, 1);
    const e = easeOutCubic(p);
    const current = a.from.map((v, i) => v + (a.to[i] - v) * e);
    a.from = current;
    a.to = BLOCKS.map((b) => maskTarget(target, b.key));
    a.t0 = performance.now();
    stepRef.current = target;
    setStep(target);
    setFeedback({ text: CAPTIONS[target], cls: target === 4 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <span className="step-label">
          第 <b>{step}</b> / 4 步
        </span>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => go(step - 1)}
          disabled={step === 0}
        >
          上一步
        </button>
        <button type="button" className="tiny" onClick={() => go(step + 1)} disabled={step === 4}>
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)} disabled={step === 0}>
          重置
        </button>
      </div>
      <div className="step-desc">conv1–conv5 → fc6 → fc7 → fc8 → 新头</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M6Steps;
