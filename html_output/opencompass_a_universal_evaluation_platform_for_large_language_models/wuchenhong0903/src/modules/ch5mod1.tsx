import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch5 M5.1 — "评测器选择挑战" (P4 chips + goal/score, technical game).
// Be the evaluation engineer: read a task scenario, pick the best evaluator, get scored.
const W = 560;
const H = 210;

type EvalId = 'rule' | 'judge' | 'cascade';

const EVALS: { id: EvalId; name: string; hint: string; icon: string }[] = [
  { id: 'rule', name: '基于规则', hint: '成本低 · 客观题', icon: '📏' },
  { id: 'judge', name: 'LLM 裁判', hint: '成本高 · 主观题', icon: '🔍' },
  { id: 'cascade', name: '级联', hint: '成本中 · 平衡', icon: '📏🔍' },
];

const SCENARIOS: { desc: string; best: EvalId; good: string; bad: string }[] = [
  { desc: '选择题，答案固定 A/B/C/D，样本量很大', best: 'rule', good: '有标准答案，规则抽取选项即可，轻量且无额外模型成本。', bad: '用裁判或级联会白白增加成本。' },
  { desc: '开放式作文，需评价连贯性与创新性', best: 'judge', good: '无唯一答案，需 LLM 裁判做多维质量打分。', bad: '规则无法覆盖主观质量。' },
  { desc: '客观判断题为主，少量边界样本难判定', best: 'cascade', good: '规则先筛确定对的，边界样本交裁判复核，兼顾精度与成本。', bad: '纯规则漏边界、纯裁判成本高。' },
  { desc: '创意写作，需做相对质量排名', best: 'judge', good: '高度主观，需裁判与参考输出做相对比较。', bad: '规则无法评价创意质量。' },
  { desc: '大量客观题 + 少量复杂题，要平衡成本与精度', best: 'cascade', good: '级联在成本与精度之间取得平衡。', bad: '要么成本过高、要么精度不够。' },
  { desc: '数学题，答案需 LaTeX 公式校验', best: 'rule', good: 'MathEvaluator 用 LaTeX 解析验证，轻量高效。', bad: '结果格式明确，无需调用裁判。' },
];

export const Ch5Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idx: 0, right: 0, wrong: 0 });
  const [picked, setPicked] = useState<EvalId | null>(null);
  const [feedback, setFeedback] = useState({ text: '看下面的任务场景，选一个最合适的评测器，试试你能不能每次都选对。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      clear(ctx, W, H);
      const sc = SCENARIOS[stateRef.current.idx];
      // 任务场景卡片
      ctx.fillStyle = '#fff';
      rr(ctx, 24, 16, 512, 70, 8);
      ctx.fill();
      ctx.strokeStyle = C.axis;
      rr(ctx, 24, 16, 512, 70, 8);
      ctx.stroke();
      label(ctx, '任务场景', 40, 36, 11, C.muted, 'left', 700);
      label(ctx, sc.desc, 40, 58, 15, C.ink, 'left', 700);
      // 决策参考
      label(ctx, '决策参考', 40, 104, 11, C.muted, 'left', 700);
      EVALS.forEach((e, i) => {
        const x = 24 + i * 176;
        ctx.fillStyle = '#fff';
        rr(ctx, x, 114, 166, 46, 6);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, x, 114, 166, 46, 6);
        ctx.stroke();
        label(ctx, `${e.icon} ${e.name}`, x + 83, 130, 12, C.ink, 'center', 700);
        label(ctx, e.hint, x + 83, 150, 10, C.muted, 'center');
      });
      // 分数
      label(ctx, `✓ ${stateRef.current.right}   ✗ ${stateRef.current.wrong}`, 536, 192, 14, C.green, 'right', 700);
    };
    let raf = 0;
    const tick = () => {
      render();
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

  const pick = (id: EvalId) => {
    if (picked !== null) return;
    const sc = SCENARIOS[stateRef.current.idx];
    if (id === sc.best) {
      stateRef.current.right += 1;
      setFeedback({ text: `✓ 最优！${sc.good}`, cls: 'good' });
    } else {
      stateRef.current.wrong += 1;
      const bestName = EVALS.find((e) => e.id === sc.best)!.name;
      setFeedback({ text: `✗ ${sc.bad}（最优是「${bestName}」）`, cls: 'bad' });
    }
    setPicked(id);
  };

  const next = () => {
    let ni = stateRef.current.idx;
    while (ni === stateRef.current.idx) ni = Math.floor(Math.random() * SCENARIOS.length);
    stateRef.current.idx = ni;
    setPicked(null);
    setFeedback({ text: '新任务来了，选一个最合适的评测器。', cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {EVALS.map((e) => (
          <button key={e.id} className={`chip ${picked === e.id ? 'selected' : ''}`} onClick={() => pick(e.id)} disabled={picked !== null}>
            {e.icon} {e.name}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={next}>
          下一题 →
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
