import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const MASK_PATTERN = [0, 2, 3];

export const BlockDiffusionAnalogy: React.FC<WidgetProps> = () => {
  const [round, setRound] = useState(0);
  const revealed = round === 0 ? 0 : round === 1 ? 1 : round === 2 ? 2 : 3;
  return (
    <div className="chapter-analogy block-analogy">
      <header><span>块级显影</span><b>Block k</b></header>
      <div className="block-strip">
        <div className="film-block is-clean"><small>前序干净块</small><div>{[0,1,2,3].map((i) => <i key={i}>✓</i>)}</div><em>稳定条件</em></div>
        <span className="film-arrow">→</span>
        <div className="film-block is-current"><small>当前噪声块</small><div>{[0,1,2,3].map((i) => {
          const maskOrder = MASK_PATTERN.indexOf(i);
          const done = maskOrder < 0 || maskOrder < revealed;
          return <i key={i} className={done ? 'is-done' : 'is-mask'}>{done ? '✓' : 'MASK'}</i>;
        })}</div><em>{revealed === 3 ? '当前块完成' : `${3 - revealed} 个位置待预测`}</em></div>
        <span className="film-arrow is-muted">→</span>
        <div className="film-block is-locked"><small>后续块</small><div>{[0,1,2,3].map((i) => <i key={i}>·</i>)}</div><em>暂不处理</em></div>
      </div>
      <div className="analogy-action-row">
        <button type="button" onClick={() => setRound((value) => (value + 1) % 4)}>{round === 3 ? '重新遮罩' : '并行显影一步'}</button>
        <p><b>损失范围：</b>{revealed === 3 ? '本轮 Mask 已恢复' : '只计算当前块中的 Mask 位置'}</p>
      </div>
    </div>
  );
};

const TASKS = [
  { name: '理解', tokens: ['图', '图', '问', 'MASK'], condition: '图像 + 问题', target: '文本答案' },
  { name: '生成', tokens: ['文', '文', 'MASK', 'MASK'], condition: '文本提示', target: '视觉 Token' },
  { name: '编辑', tokens: ['图', '文', 'MASK', 'MASK'], condition: '原图 + 指令', target: '修改后图像' },
  { name: '交错', tokens: ['文', '图', '文', 'MASK'], condition: '历史图文', target: '下一视觉块' },
];

export const TaskLayoutAnalogy: React.FC<WidgetProps> = () => {
  const [taskIndex, setTaskIndex] = useState(0);
  const task = TASKS[taskIndex];
  return (
    <div className="chapter-analogy task-layout-analogy">
      <header><span>同一序列</span><b>{task.name}任务</b></header>
      <div className="task-mini-tabs">
        {TASKS.map((item, index) => <button type="button" key={item.name} className={index === taskIndex ? 'is-active' : ''} onClick={() => setTaskIndex(index)}>{item.name}</button>)}
      </div>
      <div className="task-token-line">
        {task.tokens.map((token, index) => <i key={`${token}-${index}`} className={token === 'MASK' ? 'is-target' : token === '图' ? 'is-image' : 'is-text'}>{token}</i>)}
      </div>
      <div className="task-condition-map"><span><b>保留条件</b>{task.condition}</span><em>→</em><span><b>补全目标</b>{task.target}</span></div>
    </div>
  );
};

export const SpeedAnalogy: React.FC<WidgetProps> = () => {
  const [fast, setFast] = useState(false);
  return (
    <div className={`chapter-analogy speed-analogy${fast ? ' is-fast' : ''}`}>
      <header><span>两段计时</span><b>{fast ? '论文加速方案' : '标准方案'}</b></header>
      <button className="speed-switch" type="button" onClick={() => setFast((value) => !value)}><i /><span>{fast ? '切回标准' : '启用加速'}</span></button>
      <div className="speed-lanes">
        <div><span><b>dLLM 主干</b><small>{fast ? 'SPRINT · 平均 TPS 1.6×' : '重复读取完整前缀'}</small></span><i><em style={{ width: fast ? '62%' : '100%' }} /></i></div>
        <div><span><b>图像 Decoder</b><small>{fast ? '8 步 · 2.90 s' : '50 步 · 32.95 s'}</small></span><i><em style={{ width: fast ? '9%' : '100%' }} /></i></div>
      </div>
      <p>两种加速作用于不同阶段，数字不能相乘。</p>
    </div>
  );
};

const EVIDENCE_LEVELS = [
  { tag: '现象', title: '样例看起来不错', detail: '定性案例只能说明模型能够生成这类结果。' },
  { tag: '指标', title: 'GenEval Overall = 0.89', detail: '数字必须连同 benchmark、单位与指标方向一起读取。' },
  { tag: '协议', title: '在论文对应表格与比较协议内具有竞争力', detail: '还要确认比较对象、模型类型与推理设置。' },
  { tag: '边界', title: '不能推出所有生成与理解任务都领先', detail: '最强的可信结论必须保留未评测项与已报告局限。' },
];

export const EvidenceLensAnalogy: React.FC<WidgetProps> = () => {
  const [level, setLevel] = useState(0);
  const evidence = EVIDENCE_LEVELS[level];
  const marks = useMemo(() => EVIDENCE_LEVELS.map((_, index) => index <= level), [level]);
  return (
    <div className="chapter-analogy evidence-lens-analogy">
      <header><span>证据放大镜</span><b>{evidence.tag}</b></header>
      <div className="evidence-lens-body">
        <div className="lens-visual"><i style={{ transform: `scale(${1 + level * .09})` }}><span>{level + 1}×</span></i><em /></div>
        <div className="evidence-claim"><strong>{evidence.title}</strong><p>{evidence.detail}</p></div>
      </div>
      <div className="evidence-level-control">
        <input type="range" min={0} max={3} step={1} value={level} onChange={(event) => setLevel(Number(event.target.value))} aria-label="证据检查深度" />
        <div>{marks.map((done, index) => <button type="button" key={EVIDENCE_LEVELS[index].tag} className={done ? 'is-done' : ''} onClick={() => setLevel(index)}>{EVIDENCE_LEVELS[index].tag}</button>)}</div>
      </div>
    </div>
  );
};
