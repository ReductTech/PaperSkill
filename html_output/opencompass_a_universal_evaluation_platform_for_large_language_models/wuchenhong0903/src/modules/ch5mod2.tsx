import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, rr, label } from './kit';

// Ch5 M5.2 — "评测器细节" (two modes: rule subtypes + LLM-judge factors).
// Merges the rule evaluator subtypes (paper §3.4) and the LLM-as-a-Judge dimensions.
const W = 560;
const H = 210;

type Mode = 'rule' | 'judge';
type RuleSub = 'opt' | 'regex' | 'nlp';

const RULE: Record<RuleSub, { name: string; desc: string; input: string; rule: string; verdict: string }> = {
  opt: { name: '选项提取', desc: '从生成文本抽取选项字母，与标准答案比对，用于选择题。', input: '模型输出：答案是 B', rule: '抽取选项 → B', verdict: '标准 B → 判对 ✓' },
  regex: { name: '正则·数学', desc: '正则提取目标内容；MathEvaluator 用 LaTeX 解析验证数学结果。', input: '模型输出：x = 3', rule: '正则提取 → 3', verdict: 'MathEvaluator → 一致 ✓' },
  nlp: { name: '经典 NLP 指标', desc: 'BLEU / ROUGE / F1 / AUC-ROC 等自动指标，量化文本相似度或分类质量。', input: '模型摘要 vs 参考', rule: 'BLEU / ROUGE', verdict: '得分 0.62 ✓' },
};

const FACTORS = [
  { name: '相关性', score: 92, desc: '回答是否切中问题要点。' },
  { name: '流畅性', score: 88, desc: '语言是否通顺自然。' },
  { name: '逻辑性', score: 85, desc: '推理与结构是否自洽。' },
  { name: '创新性', score: 65, desc: '是否有超出常规的新见解。' },
  { name: '指令遵循', score: 95, desc: '是否严格遵守指令格式与要求。' },
];

export const Ch5Mod2: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'rule' as Mode, ruleSub: 'opt' as RuleSub, judgeSub: 0 });
  const [mode, setMode] = useState<Mode>('rule');
  const [ruleSub, setRuleSub] = useState<RuleSub>('opt');
  const [judgeSub, setJudgeSub] = useState(0);
  const [feedback, setFeedback] = useState({ text: RULE.opt.desc, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const drawBox = (x: number, y: number, w: number, h: number, text: string, fill: string, tcolor: string) => {
      ctx.fillStyle = fill;
      rr(ctx, x, y, w, h, 6);
      ctx.fill();
      label(ctx, text, x + w / 2, y + h / 2, 12, tcolor, 'center', 700);
    };
    const arrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.lineWidth = 1;
    };
    const render = (s: { mode: Mode; ruleSub: RuleSub; judgeSub: number }) => {
      clear(ctx, W, H);
      if (s.mode === 'rule') {
        const r = RULE[s.ruleSub];
        label(ctx, `规则评测器 · ${r.name}`, 24, 28, 15, C.blue, 'left', 800);
        ctx.fillStyle = '#fff';
        rr(ctx, 24, 80, 150, 56, 6);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, 24, 80, 150, 56, 6);
        ctx.stroke();
        label(ctx, r.input, 99, 108, 12, C.ink, 'center', 700);
        arrow(174, 108, 210, 108);
        drawBox(210, 80, 150, 56, r.rule, C.blue, '#fff');
        arrow(360, 108, 396, 108);
        drawBox(396, 80, 140, 56, r.verdict, C.green, '#fff');
        label(ctx, r.desc, 24, 170, 12, C.muted, 'left');
      } else {
        label(ctx, '模型作答', 24, 26, 12, C.muted, 'left', 700);
        ctx.fillStyle = '#fff';
        rr(ctx, 24, 36, 240, 140, 8);
        ctx.fill();
        ctx.strokeStyle = C.axis;
        rr(ctx, 24, 36, 240, 140, 8);
        ctx.stroke();
        label(ctx, '巴黎是法国的首都，也是欧洲', 40, 76, 13, C.ink, 'left', 400);
        label(ctx, '重要的文化与经济中心。', 40, 98, 13, C.ink, 'left', 400);
        label(ctx, '（一段主观开放式作答）', 40, 124, 11, C.muted, 'left');
        label(ctx, 'LLM 裁判 · 多维打分', 300, 26, 12, C.muted, 'left', 700);
        FACTORS.forEach((f, i) => {
          const y = 44 + i * 30;
          const active = i === s.judgeSub;
          label(ctx, f.name, 300, y + 8, 12, active ? C.blue : C.ink, 'left', active ? 700 : 400);
          ctx.fillStyle = C.axis;
          ctx.fillRect(380, y, 140, 14);
          const col = f.score >= 85 ? C.green : f.score >= 60 ? C.orange : C.red;
          ctx.fillStyle = active ? C.blue : col;
          ctx.fillRect(380, y, (f.score / 100) * 140, 14);
          if (active) {
            ctx.strokeStyle = C.blue;
            ctx.lineWidth = 2;
            rr(ctx, 380, y, 140, 14, 2);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
          label(ctx, `${f.score}`, 528, y + 7, 11, C.ink, 'right', 700);
        });
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

  const pickMode = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(
      m === 'rule'
        ? { text: RULE[stateRef.current.ruleSub].desc, cls: 'good' }
        : { text: `${FACTORS[stateRef.current.judgeSub].name}（${FACTORS[stateRef.current.judgeSub].score} 分）：${FACTORS[stateRef.current.judgeSub].desc}`, cls: '' }
    );
  };

  const pickRule = (r: RuleSub) => {
    stateRef.current.ruleSub = r;
    setRuleSub(r);
    setFeedback({ text: RULE[r].desc, cls: 'good' });
  };

  const pickJudge = (i: number) => {
    stateRef.current.judgeSub = i;
    setJudgeSub(i);
    setFeedback({ text: `${FACTORS[i].name}（${FACTORS[i].score} 分）：${FACTORS[i].desc}`, cls: '' });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'rule' ? 'selected' : ''}`} onClick={() => pickMode('rule')}>
          规则评测器
        </button>
        <button className={`chip ${mode === 'judge' ? 'selected' : ''}`} onClick={() => pickMode('judge')}>
          LLM 裁判
        </button>
      </div>
      {mode === 'rule' ? (
        <div className="chip-row">
          {(Object.keys(RULE) as RuleSub[]).map((k) => (
            <button key={k} className={`chip ${ruleSub === k ? 'selected' : ''}`} onClick={() => pickRule(k)}>
              {RULE[k].name}
            </button>
          ))}
        </div>
      ) : (
        <div className="chip-row">
          {FACTORS.map((f, i) => (
            <button key={f.name} className={`chip ${judgeSub === i ? 'selected' : ''}`} onClick={() => pickJudge(i)}>
              {f.name}
            </button>
          ))}
        </div>
      )}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod2;
