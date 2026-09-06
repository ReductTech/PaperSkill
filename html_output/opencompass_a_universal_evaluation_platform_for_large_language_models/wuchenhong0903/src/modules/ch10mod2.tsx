import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch10 M10.2 — "浏览 100+ 基准库" (P4 chips, technical view).
// Browse OpenCompass's benchmarks grouped by the paper's 8 domains (§4 Benchmarks).
const W = 560;
const H = 220;

type Bench = { n: string; d: string };
type Domain = { name: string; desc: string; benches: Bench[] };

const DOMAINS: Domain[] = [
  {
    name: '知识 Knowledge',
    desc: '评估模型的多领域知识储备与事实记忆。',
    benches: [
      { n: 'MMLU', d: '覆盖 57 个学科的多选题，测知识广度' },
      { n: 'GPQA', d: '跨领域通用事实问答' },
      { n: 'SimpleQA', d: '简单但可验证的事实题' },
    ],
  },
  {
    name: '推理 Reasoning',
    desc: '评估逻辑、因果与常识推理能力。',
    benches: [
      { n: 'BBH', d: 'Big-Bench 精选 23 种推理任务' },
      { n: 'HellaSwag', d: '7 万道常识续写多选题' },
      { n: 'HLE', d: '人类知识前沿的高难基准' },
    ],
  },
  {
    name: '计算 Computation',
    desc: '数学竞赛与计算能力。',
    benches: [
      { n: 'AIME / AMO', d: '国际数学竞赛原题' },
      { n: 'MATH', d: '1.25 万道竞赛级数学题' },
    ],
  },
  {
    name: '科学 Science',
    desc: '物理、气候、化学等专业领域。',
    benches: [
      { n: 'PHYSICS', d: '博士资格考试物理题' },
      { n: 'ClimaQA', d: '气候科学问答' },
      { n: 'SmolInstruct', d: '化学小分子领域数据集' },
    ],
  },
  {
    name: '语言 Language',
    desc: '多语言理解与跨语言迁移。',
    benches: [
      { n: 'MMMLU', d: 'MMLU 的 14 语言多语版' },
      { n: 'PMMEval', d: '10 种语言的多语基准' },
    ],
  },
  {
    name: '代码 Code',
    desc: '编程与代码生成能力。',
    benches: [
      { n: 'LiveCodeBench', d: '无污染的实时编程评测' },
      { n: 'BigCodeBench', d: '复杂函数调用与代码生成' },
    ],
  },
  {
    name: '长文本 Long-text',
    desc: '长上下文理解与检索。',
    benches: [
      { n: 'Ruler', d: '长上下文「大海捞针」扩展' },
      { n: 'LongBench', d: '中英双语长文本多任务' },
    ],
  },
  {
    name: '其他 Others',
    desc: '指令遵循与通用泛化。',
    benches: [
      { n: 'Arc-AGI', d: '逻辑规则泛化任务' },
      { n: 'IFEval / IFBench', d: '可验证的指令遵循' },
    ],
  },
];

export const Ch10Mod2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const [sel, setSel] = useState(0);
  const [feedback, setFeedback] = useState({ text: DOMAINS[0].desc, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { sel: number }) => {
      clear(ctx, W, H);
      const d = DOMAINS[s.sel];
      label(ctx, d.name, 24, 24, 15, C.blue, 'left', 800);
      label(ctx, d.desc, 24, 48, 12, C.muted, 'left');
      d.benches.forEach((b, i) => {
        const y = 64 + i * 46;
        ctx.fillStyle = '#fff';
        rr(ctx, 24, y, 512, 40, 6);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, 24, y, 512, 40, 6);
        ctx.stroke();
        ctx.fillStyle = C.green;
        rr(ctx, 24, y, 6, 40, 3);
        ctx.fill();
        label(ctx, b.n, 44, y + 14, 13, C.ink, 'left', 700);
        label(ctx, b.d, 44, y + 30, 11, C.muted, 'left');
      });
      label(ctx, '覆盖 8 大领域 · 100+ 基准', 512, 214, 12, C.orange, 'right', 700);
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

  const pick = (i: number) => {
    stateRef.current.sel = i;
    setSel(i);
    setFeedback({ text: DOMAINS[i].desc, cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {DOMAINS.map((d, i) => (
          <button key={d.name} className={`chip ${sel === i ? 'selected' : ''}`} onClick={() => pick(i)}>
            {d.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod2;
