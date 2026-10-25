import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Frame, Chip, Feedback, Bars, C } from './pvKit';

type View = 'table1' | 'alignment' | 'psoups' | 'overall' | 'vdr' | 'efficiency';
const main = [
  { label: 'Qwen2.5-VL-7B / Full', values: [64.84, 54.48, 43.63, 3.08] },
  { label: 'Qwen2.5-VL-7B / 简单 RAG', values: [61.20, 59.01, 45.67, 37.88] },
  { label: 'PersonaVLM / SFT', values: [64.84, 67.18, 52.12, 43.60] },
  { label: 'PersonaVLM / RL', values: [71.48, 71.05, 56.53, 47.28] },
  { label: 'GPT-4o / Full', values: [72.35, 69.23, 39.20, 45.32] },
  { label: 'InternVL3-38B / Full', values: [71.04, 67.18, 57.93, 46.56] },
];
const align = [
  { label: 'Qwen2.5-VL-7B', values: [69.91, 52.27, 37.11] },
  { label: 'Qwen3-30B-A3B', values: [80.09, 83.06, 47.14] },
  { label: 'PersonaVLM', values: [89.16, 92.22, 49.60] },
];
const comprehensive = [{ label: 'Qwen2.5-VL-7B', value: 54.62 }, { label: 'GPT-4o', value: 71.90 }, { label: 'GPT-5', value: 82.95 }, { label: 'PersonaVLM', value: 77.08 }];
const recall = [{ label: 'PersonaVLM', value: 50.70 }, { label: 'GPT-4o', value: 73.68 }, { label: 'Gemini-2.5-Flash', value: 88.06 }];
const efficiency = [{ label: 'baseline', values: [43530, 8.40] }, { label: 'w/o reasoning', values: [2726, 2.09] }, { label: '完整 PersonaVLM', values: [2170, 10.18] }];
const titles: Record<View, string> = { table1: '主表1 · 理解', alignment: '表2 · 动态对齐', psoups: '表2 · P-SOUPS', overall: '补表4 · 综合', vdr: '补表4 · 视觉回忆', efficiency: '表11 · 效率' };

export function ResultsExplorer({ chapterId }: WidgetProps) {
  const [view, setView] = useState<View>(Number(chapterId.replace(/\D/g, '')) === 9 ? 'vdr' : 'table1');
  const [context, setContext] = useState<0 | 1>(1);
  const [dataset, setDataset] = useState<0 | 1>(0);
  const [effMetric, setEffMetric] = useState<0 | 1>(0);
  const column = dataset * 2 + context;
  let source = '', protocol = '', feedback = '';
  let rows: { label: string; value: number; color?: string }[] = [];
  let unit = '%', maximum = 100;
  if (view === 'table1') {
    source = 'M7 Table 1';
    protocol = `${dataset === 0 ? 'Persona-MME · 六方面 overall' : 'PERSONAMEM · 理解测试'}；${context === 0 ? '32k' : '128k'} 历史配置；accuracy (%)，越高越好。所示为原表选定比较项。`;
    rows = main.map(r => ({ label: r.label, value: r.values[column] }));
    const gain = main[3].values[column] - main[1].values[column];
    const leader = rows.reduce((a, b) => a.value > b.value ? a : b);
    feedback = `PersonaVLM / RL 相对同表简单 RAG 提高 ${gain.toFixed(2)} pp（据表计算）。当前所示最高为 ${leader.label}：${leader.value.toFixed(2)}%。${leader.label.includes('PersonaVLM') ? '该结果仅支持当前评测协议下的比较。' : '此设置下 PersonaVLM 并未领先所有所示模型。'}主表1与补表4的 overall 不可互换。`;
  } else if (view === 'alignment' || view === 'psoups') {
    source = 'M7 Table 2';
    const index = view === 'psoups' ? 2 : context;
    protocol = view === 'psoups' ? 'P-SOUPS · 给定 profile 的二选一对齐；overall accuracy (%)，越高越好；不带 context 切换。' : `Persona-MME · alignment；${context === 0 ? '32k' : '128k'} 历史配置；accuracy (%)，越高越好。`;
    rows = align.map(r => ({ label: r.label, value: r.values[index] }));
    feedback = view === 'psoups' ? 'PersonaVLM 为 49.60%，相对 Qwen3-30B-A3B 提高 2.46 pp（据表计算），但绝对分数仍低于二选一的 50% 随机期望这一数学参考。该参考并非论文测量的随机模型。' : `PersonaVLM 对齐准确率为 ${align[2].values[index].toFixed(2)}%，相对 Qwen3-30B-A3B 提高 ${(align[2].values[index] - align[1].values[index]).toFixed(2)} pp（据表计算）。这是 alignment，不能当成理解测试或 P-SOUPS 的分数。`;
  } else if (view === 'overall') {
    source = 'S5 Table 4'; protocol = '补表4 · Persona-MME 综合 overall；128k；accuracy (%)，越高越好。'; rows = comprehensive;
    feedback = 'PersonaVLM 为 77.08%，较同表 Qwen2.5-VL-7B 高 22.46 pp、较 GPT-4o 高 5.18 pp，但比 GPT-5 低 5.87 pp（均据表计算）。77.08 与主表1的 71.05 属于不同 overall 口径；原文未完整披露统一聚合/权重细则，保留各表原值。';
  } else if (view === 'vdr') {
    source = 'S5 Table 4'; protocol = 'Visual Detail Recall · 视觉细节回忆；128k；accuracy (%)，越高越好。'; rows = recall;
    feedback = 'PersonaVLM 的视觉回忆为 50.70%，比 GPT-4o 低 22.98 pp、比 Gemini-2.5-Flash 低 37.36 pp（据表计算）。综合得分提高并未消除视觉细节回忆的不足。';
  } else {
    source = 'S11 Table 11';
    protocol = `随机 100 样本；当前单位：${effMetric === 0 ? 'tokens' : '秒'}，通常越低越省；时间不含异步 memory update。`;
    rows = efficiency.map(r => ({ label: r.label, value: r.values[effMetric] }));
    unit = effMetric === 0 ? ' tokens' : ' 秒'; maximum = effMetric === 0 ? 50000 : 12;
    feedback = effMetric === 0 ? '完整 PersonaVLM 使用 2,170 tokens，w/o reasoning 为 2,726，baseline 为 43,530。节省 token 不等于延迟降低：切换“秒”可见完整系统需要 10.18 秒。' : '完整 PersonaVLM 为 10.18 秒，比 baseline 的 8.40 秒更慢；w/o reasoning 为 2.09 秒。这里不含异步资料更新时间，不能解释成全部运行成本。';
  }
  rows = rows.map(r => ({ ...r, color: r.label.includes('PersonaVLM') ? C.blue : C.muted }));
  return <Frame kind="paper" evidence={source} id="results">
    <label>评测视图<select value={view} onChange={e => setView(e.target.value as View)}>{Object.entries(titles).map(([key, title]) => <option value={key} key={key}>{title}</option>)}</select></label>
    {view === 'table1' && <div className="pv-controls" aria-label="理解测试 benchmark"><Chip active={dataset === 0} onClick={() => setDataset(0)}>Persona-MME</Chip><Chip active={dataset === 1} onClick={() => setDataset(1)}>PERSONAMEM</Chip></div>}
    {(view === 'table1' || view === 'alignment') && <div className="pv-controls" aria-label="评估历史配置"><span>Context：</span><Chip active={context === 0} onClick={() => setContext(0)}>32k</Chip><Chip active={context === 1} onClick={() => setContext(1)}>128k</Chip></div>}
    {view === 'efficiency' && <div className="pv-controls" aria-label="效率单位"><Chip active={effMetric === 0} onClick={() => setEffMetric(0)}>tokens</Chip><Chip active={effMetric === 1} onClick={() => setEffMetric(1)}>秒</Chip></div>}
    <div className="pv-detail"><h5>{titles[view]}</h5><p>{protocol}</p></div>
    <Bars rows={rows} max={maximum} unit={unit} />
    {view === 'table1' && <p className="pv-muted">实验设置（M7 §5.1）：简单 RAG 为 Qwen2.5-VL-7B 检索 top-5 相关 messages；PersonaVLM 使用自己的多类型、时间条件与多轮检索机制。</p>}
    {view === 'table1' && dataset === 1 && <p className="pv-muted">来源脚注（主表1）：GPT-4o 的 PERSONAMEM 结果引用自参考文献 [14]（PERSONAMEM 原论文），并非本文作者全部重新运行所得。</p>}
    <Feedback tone={view === 'vdr' ? 'bad' : 'info'}>{feedback}</Feedback>
    {view === 'table1' && <p className="pv-muted">说明：摘要对 PERSONAMEM 写作 +9.8；本模块采用主表1可复算的 128k 差值 +9.40 pp。128k 是评估历史配置，不表示每一步都输入全量 128k。</p>}
  </Frame>;
}
