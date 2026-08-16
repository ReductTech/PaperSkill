import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label, sheet } from './kit';

// Ch4 M4.1 — "从配置到 模型×数据集" (P2 step-through, technical view).
// Step through config reading -> parsing -> the Cartesian product (model × dataset) -> task list.
const W = 560;
const H = 230;
const STEPS = ['读取配置', '解析对齐', '笛卡尔积配对', '任务列表'];
const STEP_DESC = [
  '从 CLI 或 Python 配置文件读入模型列表、数据集列表与评测策略。',
  '基于 MMEngine 解析并对齐异构配置，构建统一的评测配置对象。',
  '笛卡尔积：把每个模型与每个数据集两两配对——2 个模型 × 3 个数据集 = 6 种组合。',
  'Partitioner 按策略把组合切分成原子子任务，打包成结构化任务列表。',
];

export const Ch4Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEP_DESC[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { step: number }) => {
      clear(ctx, W, H);
      // Top: four pipeline nodes (progress indicator).
      const nodes = ['配置', '解析', '笛卡尔积', '任务列表'];
      for (let i = 0; i < 4; i++) {
        const x = 24 + i * 130;
        const active = i === s.step;
        ctx.fillStyle = active ? C.blue : '#fff';
        rr(ctx, x, 16, 108, 30, 8);
        ctx.fill();
        ctx.strokeStyle = active ? C.blue : C.axis;
        rr(ctx, x, 16, 108, 30, 8);
        ctx.stroke();
        label(ctx, nodes[i], x + 54, 31, 12, active ? '#fff' : C.ink, 'center', 700);
        if (i < 3) {
          ctx.strokeStyle = C.axis;
          ctx.beginPath();
          ctx.moveTo(x + 108, 31);
          ctx.lineTo(x + 130, 31);
          ctx.stroke();
        }
      }

      if (s.step === 0) {
        sheet(ctx, 40, 66, 220, 130, '#fff', 5);
        label(ctx, 'opencompass_config.py', 150, 88, 13, C.blue, 'center', 700);
        label(ctx, 'models = [M1, M2]', 150, 118, 12, C.ink, 'center', 600);
        label(ctx, 'datasets = [D1, D2, D3]', 150, 142, 12, C.ink, 'center', 600);
        label(ctx, 'eval = { metric: ... }', 150, 166, 12, C.muted, 'center', 600);
        label(ctx, '配置定义「评什么、怎么评」', 420, 130, 13, C.muted, 'center');
      } else if (s.step === 1) {
        sheet(ctx, 40, 66, 220, 90, '#fff', 3);
        label(ctx, '异构配置（CLI/文件）', 150, 96, 12, C.muted, 'center');
        ctx.strokeStyle = C.green;
        ctx.beginPath();
        ctx.moveTo(270, 111);
        ctx.lineTo(330, 111);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        rr(ctx, 340, 76, 180, 70, 8);
        ctx.fill();
        ctx.strokeStyle = C.green;
        rr(ctx, 340, 76, 180, 70, 8);
        ctx.stroke();
        label(ctx, '统一评测配置对象', 430, 104, 12, C.green, 'center', 700);
        label(ctx, 'MMEngine 解析对齐', 430, 126, 11, C.muted, 'center');
        label(ctx, '异构配置 → 统一对象', 280, 180, 13, C.green, 'center', 700);
      } else if (s.step === 2) {
        // 笛卡尔积：一张「模型 × 数据集」交叉表，逐个高亮正在配对的组合。
        const models = ['M1', 'M2'];
        const datasets = ['D1', 'D2', 'D3'];
        const gx = 100;
        const gy = 76;
        const cw = 130;
        const ch = 48;
        label(ctx, '笛卡尔积：每个模型 × 每个数据集', 24, 62, 12, C.ink, 'left', 700);
        // 左上角乘积符号。
        ctx.fillStyle = C.muted;
        rr(ctx, 40, gy, 60, 28, 4);
        ctx.fill();
        label(ctx, '×', 70, gy + 14, 14, '#fff', 'center', 800);
        // 数据集表头（橙）。
        for (let c = 0; c < 3; c++) {
          const x = gx + c * cw;
          ctx.fillStyle = C.orange;
          rr(ctx, x, gy, cw - 14, 28, 4);
          ctx.fill();
          label(ctx, datasets[c], x + (cw - 14) / 2, gy + 14, 12, '#fff', 'center', 700);
        }
        // 模型表头（蓝）。
        for (let r = 0; r < 2; r++) {
          const y = gy + 28 + r * ch;
          ctx.fillStyle = C.blue;
          rr(ctx, 40, y, 60, ch - 8, 4);
          ctx.fill();
          label(ctx, models[r], 70, y + (ch - 8) / 2, 12, '#fff', 'center', 700);
        }
        // 内部组合单元格，逐个高亮轮播。
        const cycle = Math.floor(performance.now() / 600) % 6;
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            const idx = r * 3 + c;
            const x = gx + c * cw;
            const y = gy + 28 + r * ch;
            const active = idx === cycle;
            ctx.fillStyle = active ? C.green : '#fff';
            rr(ctx, x, y, cw - 14, ch - 8, 4);
            ctx.fill();
            ctx.strokeStyle = active ? C.green : C.axis;
            ctx.lineWidth = active ? 2 : 1;
            rr(ctx, x, y, cw - 14, ch - 8, 4);
            ctx.stroke();
            ctx.lineWidth = 1;
            label(ctx, `${models[r]}×${datasets[c]}`, x + (cw - 14) / 2, y + (ch - 8) / 2, 11, active ? '#fff' : C.ink, 'center', active ? 700 : 400);
          }
        }
        label(ctx, '2 个模型 × 3 个数据集 = 6 种组合', 280, 210, 13, C.green, 'center', 700);
      } else {
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = '#fff';
          rr(ctx, 40, 66 + i * 26, 320, 20, 4);
          ctx.fill();
          ctx.strokeStyle = C.axis;
          rr(ctx, 40, 66 + i * 26, 320, 20, 4);
          ctx.stroke();
          label(ctx, `task-${i + 1}`, 52, 76 + i * 26, 11, C.ink, 'left', 600);
        }
        label(ctx, '每个组合 → 一个原子子任务', 460, 110, 13, C.blue, 'center', 700);
      }
    };
    let raf = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const goto = (i: number) => {
    const s = Math.max(0, Math.min(STEPS.length - 1, i));
    stateRef.current.step = s;
    setStep(s);
    setFeedback({ text: STEP_DESC[s], cls: s === 3 ? 'good' : '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => goto(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步 · {STEPS[step]}
        </span>
        <button className="tiny" onClick={() => goto(step + 1)} disabled={step === STEPS.length - 1}>
          下一步
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
