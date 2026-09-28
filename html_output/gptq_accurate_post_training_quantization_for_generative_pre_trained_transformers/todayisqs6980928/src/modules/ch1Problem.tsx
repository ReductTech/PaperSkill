import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'fp16' | 'rtn' | 'gptq';

// 第一章核心：作者要回答的研究问题。三态对比展示「显存约束 / 精度退化 / 精度可控」。
const STATES: Record<Mode, { name: string; tag: string; mem: string; memNote: string; ppl: string; pplNote: string; verdict: string; tone: string }> = {
  fp16: {
    name: 'FP16 原始模型',
    tag: '未量化',
    mem: '326GB',
    memNote: '超出单卡显存容量，需 5×A100',
    ppl: '8.34',
    pplNote: 'WikiText2 困惑度基线（越低越好）',
    verdict: '超出单卡显存约束',
    tone: 'base',
  },
  rtn: {
    name: 'RTN 最近邻舍入',
    tag: '最近邻舍入',
    mem: '≈ 1/4',
    memNote: '4bit 满足显存约束',
    ppl: '10.54 / 7.3×10³',
    pplNote: '4bit 困惑度上升 2.2；3bit 激增到 7.3×10³',
    verdict: '满足显存约束，但精度显著退化',
    tone: 'risk',
  },
  gptq: {
    name: 'GPTQ（本文方法）',
    tag: '二阶误差补偿',
    mem: '63GB（3bit）',
    memNote: '单张 A100 即可完成生成推理',
    ppl: '8.37',
    pplNote: '4bit 困惑度仅上升 0.03；3bit 仍为 8.68',
    verdict: '同时满足显存与精度约束',
    tone: 'good',
  },
};

const CONSTRAINTS = [
  { title: '显存约束', text: '千亿参数模型需在单卡显存内完成部署。', tone: 'resource' },
  { title: '精度约束', text: '3–4bit 量化下的困惑度退化需可忽略。', tone: 'risk' },
  { title: '计算效率', text: '量化过程应在小时级内完成，而非数周。', tone: 'speed' },
  { title: '无需重训', text: '仅依赖后训练（one-shot），不涉及重训。', tone: 'action' },
];

export const Ch1Problem: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('fp16');
  const cur = STATES[mode];

  return (
    <div className="ch1-problem" data-testid="ch1-problem" data-mode={mode}>
      <div className="ch1-mode-switch" role="group" aria-label="三种方案">
        {(Object.keys(STATES) as Mode[]).map((k) => (
          <button key={k} type="button" className={mode === k ? 'active' : ''} aria-pressed={mode === k} onClick={() => setMode(k)}>
            {STATES[k].name}
          </button>
        ))}
      </div>

      <p className="ch1-thesis">
        <strong>核心命题：</strong>低比特量化需同时满足显存约束、精度保持、计算效率与无需重训四项条件。
      </p>

      <div className={`ch1-card ${cur.tone}`}>
        <header>
          <span>{cur.name}</span>
          <small>{cur.tag}</small>
        </header>
        <div className="ch1-metrics">
          <div>
            <small>存储开销</small>
            <strong>{cur.mem}</strong>
            <span>{cur.memNote}</span>
          </div>
          <div>
            <small>WikiText2 困惑度</small>
            <strong>{cur.ppl}</strong>
            <span>{cur.pplNote}</span>
          </div>
        </div>
        <div className="ch1-verdict">{cur.verdict}</div>
      </div>

      <div className="ch1-constraints" aria-label="低比特量化需同时满足的四项约束">
        {CONSTRAINTS.map((c) => (
          <div key={c.title} className={c.tone}>
            <strong>{c.title}</strong>
            <span>{c.text}</span>
          </div>
        ))}
      </div>

      <div className="ch1-summary">
        <strong>研究问题：能否在无需重训的前提下，将 175B 模型一次性量化至 3–4bit，且精度几乎不降？</strong>
        <div>
          <span>FP16 超出单卡显存</span>
          <b>↓</b>
          <span>RTN 满足显存但精度退化</span>
          <b>↓</b>
          <span>需要同时满足显存、精度、效率与无需重训的量化方法</span>
        </div>
      </div>
    </div>
  );
};

export default Ch1Problem;
