import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 300;

/** 论文如何一步步推出：回归头 / 重增强 / 复杂损失 并非必要条件 */
const STEPS: {
  title: string;
  short: string;
  body: string;
  cls: 'warn' | 'good';
}[] = [
  {
    title: '① 旧共识',
    short: '专家依赖三件套',
    body: '专家视觉模型长期默认：多解码器/回归头、重几何·光度增强、多损失调权（MSE/L1/certainty/clipped L2…）是细粒度 3D 的「必要设计」（§2）。',
    cls: 'warn',
  },
  {
    title: '② 换提问',
    short: '能否不做这些？',
    body: '受 DepthLM 启发，论文追问：标准 VLM 若不改架构/损失、不加重量增强，能否在多样细粒度 3D 上匹敌专家？（§1）',
    cls: 'warn',
  },
  {
    title: '③ 只留三要素',
    short: '焦距·文本·配比',
    body: 'VLM3 只保留：统一焦距、文本像素引用、数据配比与规模 + 标准文本 SFT。刻意不引入回归头、重增强与复杂多损失（§3.1）。',
    cls: 'good',
  },
  {
    title: '④ 否掉回归头',
    short: '位姿也用文本',
    body: '相机位姿输出距离/方向/欧拉角，仍用下一词预测达到 AUC@30°≈94.0（近 DA3-Giant）。说明即便输出连续几何量，回归公式也非必要条件（§3.2 / Table 1–2）。',
    cls: 'good',
  },
  {
    title: '⑤ 否掉增强与堆损',
    short: '配比>花活',
    body: '消融（Table 3）：文本引用≈视觉标记；配比从均匀 0.842→VLM3 0.904。放大与混合远比堆增强/堆损失关键——重增强与复杂损失可被「正确数据杠杆」替代。',
    cls: 'good',
  },
  {
    title: '⑥ 总证伪',
    short: '三件套非必要',
    body: '主结果上深度/物体/对应/位姿一致追近专家（Fig.1, Table 1–2），却全程标准架构 + 文本 SFT。故：回归头、重增强、复杂损失并非有效 3D 学习的必要条件（§5）。',
    cls: 'good',
  },
];

function textAt(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'center',
  baseline: CanvasTextBaseline = 'middle',
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export const Ch10Concl: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: STEPS[0].body,
    cls: STEPS[0].cls,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cellW = 84;
    const cellH = 56;
    const gap = 8;
    const totalW = STEPS.length * cellW + (STEPS.length - 1) * gap;
    const x0 = (W - totalW) / 2;
    const y0 = 48;

    const render = () => {
      const s = stateRef.current.step;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      textAt(ctx, '论证链：为何三件套不是必要条件', 16, 14, C.text, 14, 'left', 'top');
      textAt(ctx, '逐步点亮 · 对照论文 §1–§5', W - 16, 14, C.muted, 10, 'right', 'top');

      STEPS.forEach((item, i) => {
        const x = x0 + i * (cellW + gap);
        const on = i === s;
        const reached = i <= s;
        const fill = !reached ? '#fff' : item.cls === 'good' ? '#e8f5ee' : '#fff7ed';
        const stroke = on ? (item.cls === 'good' ? C.green : C.orange) : reached ? C.border : C.border;

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = on ? 2.5 : 1.2;
        ctx.fillRect(x, y0, cellW, cellH);
        ctx.strokeRect(x, y0, cellW, cellH);

        textAt(ctx, item.title, x + cellW / 2, y0 + 18, on ? (item.cls === 'good' ? C.green : C.orange) : C.text, 11, 'center', 'middle');
        textAt(ctx, item.short, x + cellW / 2, y0 + 38, C.muted, 10, 'center', 'middle');

        if (i < STEPS.length - 1) {
          const ax = x + cellW + 1;
          ctx.strokeStyle = i < s ? C.green : C.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ax, y0 + cellH / 2);
          ctx.lineTo(ax + gap - 2, y0 + cellH / 2);
          ctx.stroke();
        }
      });

      // 底部：被否定的三件套 vs 保留的三要素
      const boxY = 128;
      textAt(ctx, '专家默认真必要 → VLM3 证伪', 16, boxY, C.muted, 11, 'left', 'top');

      const bad = ['回归头', '重增强', '复杂损失'];
      const good = ['统一焦距', '文本引用', '配比规模'];
      bad.forEach((name, i) => {
        const x = 40 + i * 100;
        const struck = s >= 5 || (s >= 3 && i === 0) || (s >= 4 && i >= 1);
        ctx.fillStyle = struck ? '#fde8ec' : '#fff';
        ctx.strokeStyle = struck ? C.red : C.border;
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, boxY + 22, 88, 36);
        ctx.strokeRect(x, boxY + 22, 88, 36);
        textAt(ctx, name, x + 44, boxY + 40, struck ? C.red : C.muted, 12, 'center', 'middle');
        if (struck) {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 10, boxY + 40);
          ctx.lineTo(x + 78, boxY + 40);
          ctx.stroke();
        }
      });

      good.forEach((name, i) => {
        const x = 40 + i * 100;
        const on = s >= 2;
        ctx.fillStyle = on ? '#e8f5ee' : '#fff';
        ctx.strokeStyle = on ? C.green : C.border;
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, boxY + 70, 88, 36);
        ctx.strokeRect(x, boxY + 70, 88, 36);
        textAt(ctx, name, x + 44, boxY + 88, on ? C.green : C.muted, 12, 'center', 'middle');
      });

      textAt(ctx, '× 非必要', 360, boxY + 40, C.red, 11, 'left', 'middle');
      textAt(ctx, '✓ 真正关键', 360, boxY + 88, C.green, 11, 'left', 'middle');

      textAt(ctx, '点击步骤或下方芯片，沿论文逻辑推进', W / 2, 286, C.muted, 10, 'center', 'middle');
    };

    const tick = () => {
      render();
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const d = observeCanvas(canvas, start, stop);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      const my = ((e.clientY - rect.top) / rect.height) * H;
      STEPS.forEach((_, i) => {
        const x = x0 + i * (cellW + gap);
        if (mx >= x && mx <= x + cellW && my >= y0 && my <= y0 + cellH) {
          stateRef.current.step = i;
          setStep(i);
          setFeedback({ text: STEPS[i].body, cls: STEPS[i].cls });
        }
      });
    };
    canvas.addEventListener('click', onClick);
    return () => {
      stop();
      d();
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  const pick = (i: number) => {
    stateRef.current.step = i;
    setStep(i);
    setFeedback({ text: STEPS[i].body, cls: STEPS[i].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {STEPS.map((item, i) => (
          <button
            key={item.title}
            type="button"
            className={`chip ${step === i ? 'on' : ''}`}
            onClick={() => pick(i)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Concl;
