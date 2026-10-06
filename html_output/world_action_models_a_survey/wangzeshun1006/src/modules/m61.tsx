import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawSheetLabel,
  ROUTE,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
  CONTOUR,
} from './chartkit';
import type { WidgetProps } from './registry';

// m61 — 五族骨架：五套画具。切换五个 chip，看每族的工具剪影、参数化公式片段与代表方法。
// 五族不互斥；flow matching 属于扩散族。示意内容不写具体数值。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface Family {
  name: string;
  how: string;
  formula: string;
  examples: string;
  cost: string;
}

const FAMILIES: Family[] = [
  { name: '扩散', how: '迭代去噪逆向链', formula: 'ϵ_θ(s⁽ⁿ⁾, n, c)', examples: 'DreamZero、GR-1', cost: '渲染步数多' },
  { name: '自回归', how: '逐元素序列', formula: 'p(s_t | s_<t, c)', examples: 'WorldVLA、CoT-VLA', cost: '逐个前进' },
  { name: '联合嵌入预测', how: '嵌入空间预测', formula: 'f_pred^θ(E_ctx, c)', examples: 'V-JEPA 2、FLARE', cost: '无视觉指标' },
  { name: '混合', how: '共享骨干双头', formula: 'L_gen + λ · L_act', examples: 'F1、UWM', cost: '损失拔河' },
  { name: 'LLM-VLM', how: 'VLM 承载 token', formula: 'p_θ(token | c)', examples: 'π0.7', cost: 'VLM 栈成本' },
];

const FEEDBACK: string[] = [
  '迭代去噪的逆向链（式 21–22）；flow matching 是同一族里换成速度场的参数化，不算新族。',
  '把输出序列化成一笔一笔的下一个元素（式 24–26）；缓存友好，但逐个前进。',
  '不重建像素，只在嵌入空间预测目标（式 28）：推理便宜，但没有内在的视觉质量指标。',
  '共享骨干 + 生成头 + 动作头（式 30–31）：一致性靠同一干，两个损失要小心共处。',
  '以语言/视觉语言骨干承载未来 token 或子目标（式 32）：继承 VLM 栈的成本，常用冻结骨干加分块。',
];

const CHIPS = ['扩散', '自回归', '联合嵌入预测', '混合', 'LLM-VLM'];

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
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function token(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  bold: boolean,
  align: CanvasTextAlign
): void {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function drawDiffusion(ctx: CanvasRenderingContext2D, now: number): void {
  for (let i = 0; i < 7; i++) {
    const yy = 74 + i * 20;
    const a = clamp(0.12 + 0.1 * i + 0.05 * Math.sin(now / 320 + i), 0.08, 0.72);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = ROUTE;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(78, yy);
    ctx.quadraticCurveTo(190, yy - 16, 304, yy);
    ctx.stroke();
    ctx.restore();
  }
}

function drawAR(ctx: CanvasRenderingContext2D, now: number): void {
  const n = 6;
  const x0 = 80;
  const x1 = 304;
  const step = (x1 - x0) / n;
  const march = (now / 420) % (n + 1.4);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ROUTE;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = i < march ? 1 : 0.2;
    const ax = x0 + i * step;
    const ay = 150 + (i % 2 === 0 ? -18 : 18);
    const bx = x0 + (i + 1) * step;
    const by = 150 + (i % 2 === 0 ? 18 : -18);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawJEPA(ctx: CanvasRenderingContext2D, now: number): void {
  const base: number[][] = [
    [80, 170],
    [118, 96],
    [176, 120],
    [214, 78],
    [288, 120],
    [250, 190],
    [140, 198],
  ];
  ctx.strokeStyle = ROUTE;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let i = 0; i < base.length; i++) {
    const jx = base[i][0] + Math.sin(now / 260 + i) * 2;
    const jy = base[i][1] + Math.cos(now / 300 + i) * 2;
    if (i === 0) ctx.moveTo(jx, jy);
    else ctx.lineTo(jx, jy);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = ROUTE;
  for (let i = 0; i < base.length; i++) {
    const jx = base[i][0] + Math.sin(now / 260 + i) * 2;
    const jy = base[i][1] + Math.cos(now / 300 + i) * 2;
    ctx.beginPath();
    ctx.arc(jx, jy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHybrid(ctx: CanvasRenderingContext2D, now: number): void {
  // 两支笔协作：各自一笔，汇入同一干
  ctx.lineCap = 'round';
  ctx.strokeStyle = ROUTE;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(92, 92);
  ctx.lineTo(178, 150);
  ctx.stroke();
  ctx.strokeStyle = EMPH;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(298, 92);
  ctx.lineTo(204, 150);
  ctx.stroke();
  ctx.strokeStyle = AUX;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(178, 150);
  ctx.lineTo(210, 150);
  ctx.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(now / 300);
  ctx.fillStyle = AUX;
  ctx.globalAlpha = 0.5 + 0.4 * pulse;
  ctx.beginPath();
  ctx.arc(194, 150, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // 笔头
  ctx.fillStyle = ROUTE;
  ctx.beginPath();
  ctx.moveTo(92, 92);
  ctx.lineTo(78, 84);
  ctx.lineTo(84, 102);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = EMPH;
  ctx.beginPath();
  ctx.moveTo(298, 92);
  ctx.lineTo(312, 84);
  ctx.lineTo(306, 102);
  ctx.closePath();
  ctx.fill();
}

function drawLLM(ctx: CanvasRenderingContext2D, now: number): void {
  // token 格 + 子目标图章
  const cols = 4;
  const rows = 3;
  const cw = 30;
  const gap = 8;
  const gx = 92;
  const gy = 96;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gx + c * (cw + gap);
      const y = gy + r * (cw + gap);
      const on = (r + c) % 3 === 0;
      const a = on ? 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(now / 340 + r + c)) : 1;
      ctx.fillStyle = on ? ROUTE : '#fbfaf3';
      ctx.globalAlpha = on ? a : 1;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, cw, cw, 5);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // 图章
  ctx.strokeStyle = EMPH;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(268, 156, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = EMPH;
  ctx.beginPath();
  ctx.moveTo(268, 142);
  ctx.lineTo(280, 162);
  ctx.lineTo(256, 162);
  ctx.closePath();
  ctx.fill();
}

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const famRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [family, setFamily] = useState(0);
  const [feedback, setFeedback] = useState(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number): void => {
      const fam = famRef.current;
      const f = FAMILIES[fam];
      clearField(ctx, W, H);

      // 左：工具剪影底图
      drawSheet(ctx, 40, 44, 310, 192);
      drawContours(ctx, 40, 44, 310, 192, 7, CONTOUR, 2);
      if (fam === 0) drawDiffusion(ctx, now);
      else if (fam === 1) drawAR(ctx, now);
      else if (fam === 2) drawJEPA(ctx, now);
      else if (fam === 3) drawHybrid(ctx, now);
      else drawLLM(ctx, now);

      // 中：参数化公式片段
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = fam === 0 ? ROUTE : LINE;
      ctx.lineWidth = fam === 0 ? 2.5 : 1.5;
      roundRect(ctx, 400, 96, 340, 88, 10);
      ctx.fill();
      ctx.stroke();
      token(ctx, f.formula, 570, 140, ROUTE, 24, true, 'center');

      // 右：三行说明（怎么产生预测 / 代表方法 / 主要代价）
      token(ctx, f.how, 780, 92, INK, 17, true, 'left');
      token(ctx, f.examples, 780, 142, ROUTE, 16, false, 'left');
      token(ctx, f.cost, 780, 192, EMPH, 16, false, 'left');
      ctx.fillStyle = ROUTE;
      ctx.beginPath();
      ctx.arc(770, 92, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(770, 192, 4, 0, Math.PI * 2);
      ctx.fill();

      drawSheetLabel(ctx, '画具', 40, 30, MUTED);
      drawSheetLabel(ctx, '公式', 410, 86, MUTED);
    };

    const tick = (): void => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (i: number): void => {
    famRef.current = i;
    setFamily(i);
    setFeedback(FEEDBACK[i]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CHIPS.map((label, i) => (
          <button
            key={label}
            className={'chip' + (family === i ? ' selected on' : '')}
            onClick={() => pick(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default M61;
