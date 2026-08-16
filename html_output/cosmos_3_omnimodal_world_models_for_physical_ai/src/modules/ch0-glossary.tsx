import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useCanvas, rounded, label, arrow } from './studio-kit';

type Term = {
  id: string;
  name: string;
  english: string;
  abbr?: string;
  definition: string;
  context: string;
  input: string;
  operation: string;
  output: string;
  color: string;
};

const terms: Term[] = [
  {
    id: 'world-model', name: '世界模型', english: 'World Model', color: C.green,
    definition: '学习环境状态如何随时间和动作变化，并据此预测未来状态的模型。',
    context: 'Cosmos 3 使用视频、音频和动作等连续表示来建模世界变化，并可用语言推理提供生成条件。',
    input: '当前状态 + 动作或指令', operation: '预测世界如何变化', output: '未来状态',
  },
  {
    id: 'ar', name: '自回归', english: 'Autoregressive', abbr: 'AR', color: C.blue,
    definition: '根据已经出现的 token，按顺序预测下一个 token。',
    context: 'Cosmos 3 用 AR 分支生成语言推理前缀；当前位置不能读取未来内容。',
    input: '问题与已有前文', operation: '逐个预测下一个 token', output: '语言推理前缀',
  },
  {
    id: 'dm', name: '扩散模型', english: 'Diffusion Model', abbr: 'DM', color: C.purple,
    definition: '从带噪的连续表示出发，经过迭代求解恢复目标数据。',
    context: 'Cosmos 3 用 DM 分支生成视频、音频和动作；它可以读取 AR 推理前缀作为条件。',
    input: '噪声 + 已知条件', operation: '迭代恢复连续表示', output: '视频·音频·动作',
  },
  {
    id: 'clean', name: '干净条件', english: 'Clean Condition', color: C.blue,
    definition: '保持原值并供模型读取的信息，不作为该位置的去噪目标。',
    context: '文字、首帧、参考视频、当前状态或动作都可以按任务需要设为 Clean Condition。',
    input: '已知信息', operation: '保持原值并提供约束', output: '扩散生成条件',
  },
  {
    id: 'noisy', name: '加噪目标', english: 'Noisy Target', color: C.red,
    definition: '训练时被加入噪声、要求扩散分支恢复的信息。',
    context: '未来视频、音频或动作可以成为 Noisy Target；去噪损失只计算这些目标位置。',
    input: '待预测数据 + 噪声', operation: '学习恢复目标', output: '预测结果',
  },
];

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button className="paper-chip" aria-pressed={active} onClick={onClick}>{children}</button>
);

function fullName(term: Term) {
  return `${term.english}${term.abbr ? ` (${term.abbr})` : ''}`;
}

function wrap(text: string, max = 14) {
  const rows: string[] = [];
  for (let i = 0; i < text.length; i += max) rows.push(text.slice(i, i + max));
  return rows;
}

export const Ch0Glossary: React.FC<WidgetProps> = () => {
  const [termId, setTermId] = useState('world-model');
  const selected = terms.find((term) => term.id === termId) ?? terms[0];

  const ref = useCanvas((ctx) => {
    ctx.clearRect(0, 0, 720, 330);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 720, 330);

    rounded(ctx, 30, 45, 184, 128, 12, '#ffffff', selected.color);
    label(ctx, selected.name, 122, 78, selected.color, 18);
    wrap(fullName(selected), 20).forEach((row, index) => label(ctx, row, 122, 111 + index * 21, C.muted, 11));
    label(ctx, '当前术语', 122, 153, C.muted, 10);

    arrow(ctx, 224, 109, 282, 109, C.blue, 4);
    rounded(ctx, 290, 45, 184, 128, 12, '#ffffff', C.blue);
    wrap(selected.operation, 11).forEach((row, index) => label(ctx, row, 382, 83 + index * 24, C.ink, 13));
    label(ctx, '核心作用', 382, 153, C.muted, 10);

    arrow(ctx, 484, 109, 542, 109, C.blue, 4);
    rounded(ctx, 550, 45, 140, 128, 12, '#ffffff', C.green);
    wrap(selected.output, 8).forEach((row, index) => label(ctx, row, 620, 84 + index * 24, C.ink, 13));
    label(ctx, '输出或结果', 620, 153, C.muted, 10);

    rounded(ctx, 30, 207, 660, 82, 12, '#ffffff', C.line);
    label(ctx, '输入', 58, 230, C.muted, 11, 'left');
    wrap(selected.input, 26).forEach((row, index) => label(ctx, row, 58, 255 + index * 20, C.ink, 13, 'left'));
    label(ctx, '在 Cosmos 3 中', 356, 230, selected.color, 11, 'left');
    wrap(selected.context, 28).slice(0, 2).forEach((row, index) => label(ctx, row, 356, 255 + index * 20, C.ink, 12, 'left'));
  }, 720, 330, [selected]);

  return <div className="paper-widget-shell paper-glossary">
    <div className="paper-control-row paper-glossary-terms">
      {terms.map((term) => (
        <Chip key={term.id} active={selected.id === term.id} onClick={() => setTermId(term.id)}>
          {term.name} · {fullName(term)}
        </Chip>
      ))}
    </div>
    <canvas ref={ref} width={720} height={330} aria-label={`${selected.name}的输入、作用与输出`} />
    <div className="feedback good">
      <b>{selected.name} · {fullName(selected)}：</b>{selected.definition} {selected.context}
    </div>
  </div>;
};
