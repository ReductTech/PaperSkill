import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import {
  CanvasStage, ChipRow, StepControls, COLORS, W, H,
  studioBase, label, drawFilter, drawArrow, drawBar, drawLayers, drawAnalogy, roundedRect,
} from './c1-camera-kit';

const Analogy = ({ chapter }: { chapter: number }) => (
  <CanvasStage labelText={`第 ${chapter} 章相机滤镜类比动画`} animate draw={(ctx, _w, _h, phase) => drawAnalogy(ctx, chapter, phase)} />
);

export const C8Analogy: React.FC<WidgetProps> = () => <Analogy chapter={8} />;
export const C9Analogy: React.FC<WidgetProps> = () => <Analogy chapter={9} />;
export const C10Analogy: React.FC<WidgetProps> = () => <Analogy chapter={10} />;

type ArchNode = 'attn' | 'adapterA' | 'ffn' | 'adapterB' | 'norm' | 'head';
export const C8ArchitectureMap: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<ArchNode>('adapterA');
  const nodes: Array<{ id: ArchNode; name: string; train: boolean; color: string }> = [
    { id: 'attn', name: '多头注意力', train: false, color: COLORS.blue },
    { id: 'adapterA', name: 'Adapter A', train: true, color: COLORS.green },
    { id: 'ffn', name: '前馈网络', train: false, color: COLORS.blue },
    { id: 'adapterB', name: 'Adapter B', train: true, color: COLORS.green },
    { id: 'norm', name: 'LayerNorm', train: true, color: COLORS.orange },
    { id: 'head', name: '任务头', train: true, color: COLORS.purple },
  ];
  const current = nodes.find((node) => node.id === selected)!;
  const feedback = selected === 'adapterA' || selected === 'adapterB'
    ? '适配器位于子层投影之后、残差相加之前，随后进入 LayerNorm。'
    : current.train
      ? `${current.name} 是任务相关的可训练参数。`
      : `${current.name} 属于预训练主干，在 Adapter 训练中保持冻结。`;
  return (
    <div>
      <CanvasStage labelText="Transformer 层中两个适配器的位置与训练状态" height={320} draw={(ctx, _w, h) => {
        studioBase(ctx, W, h);
        label(ctx, '单个 Transformer 层', 360, 28, COLORS.ink, 18, 'center');
        nodes.slice(0, 5).forEach((node, i) => {
          const x = 50 + i * 132;
          const isSelected = node.id === selected;
          roundedRect(ctx, x, 96, 110, 70, 9, isSelected ? `${node.color}22` : COLORS.paper, isSelected ? node.color : COLORS.line);
          label(ctx, node.name, x + 55, 120, node.color, 13, 'center');
          label(ctx, node.train ? '训练' : '冻结', x + 55, 146, node.train ? COLORS.green : COLORS.blue, 12, 'center');
          if (i < 4) drawArrow(ctx, x + 112, 131, x + 128, 131, i < nodes.findIndex((n) => n.id === selected) ? COLORS.green : COLORS.line);
        });
        roundedRect(ctx, 750, 54, 280, 206, 10, COLORS.paper, current.color);
        label(ctx, current.name, 890, 84, current.color, 18, 'center');
        label(ctx, current.train ? '状态：任务专属，可训练' : '状态：共享主干，冻结', 890, 122, COLORS.ink, 14, 'center');
        if (selected === 'adapterA' || selected === 'adapterB') {
          drawArrow(ctx, 800, 178, 850, 178, COLORS.blue);
          roundedRect(ctx, 858, 154, 64, 48, 8, COLORS.paleGreen, COLORS.green);
          label(ctx, 'm', 890, 178, COLORS.green, 15, 'center');
          drawArrow(ctx, 930, 178, 980, 178, COLORS.green);
          label(ctx, 'd → m → d', 890, 226, COLORS.ink, 14, 'center');
        } else {
          label(ctx, selected === 'norm' ? '任务特定归一化参数' : selected === 'head' ? '映射到任务输出' : '保持预训练变换', 890, 180, COLORS.muted, 14, 'center');
        }
      }} />
      <ChipRow options={nodes.map((node) => ({ value: node.id, label: node.name }))} value={selected} onChange={setSelected} />
      <div className={`feedback ${current.train ? 'good' : ''}`}>{feedback}</div>
    </div>
  );
};

export const C8Propagation: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const steps = ['注意力投影', 'Adapter A', '残差 + LayerNorm', '前馈投影', 'Adapter B', '残差 + LayerNorm'];
  const feedback = [
    '隐藏状态以 d 维进入冻结的注意力投影。',
    '任务适配器执行 d→m→d，层接口仍为 d。',
    '与残差相加后进入任务特定 LayerNorm。',
    'd 维状态通过冻结的前馈投影。',
    '第二个任务适配器再次执行 d→m→d。',
    '当前层输出仍保持 d 维，交给下一层。',
  ];
  return (
    <div>
      <CanvasStage labelText="隐藏状态通过 Transformer 层的六个步骤" draw={(ctx) => {
        studioBase(ctx, W, H);
        const names = ['Attn', 'A', 'Add+Norm', 'FFN', 'B', 'Add+Norm'];
        names.forEach((name, i) => {
          const x = 45 + i * 170;
          const adapter = i === 1 || i === 4;
          const active = i === stage;
          roundedRect(ctx, x, 94, 130, 68, 9, active ? (adapter ? COLORS.paleGreen : COLORS.paleBlue) : COLORS.paper, active ? (adapter ? COLORS.green : COLORS.blue) : COLORS.line);
          label(ctx, name, x + 65, 120, adapter ? COLORS.green : COLORS.blue, 15, 'center');
          label(ctx, adapter ? 'd→m→d' : 'd', x + 65, 145, active ? COLORS.orange : COLORS.muted, 13, 'center');
          if (i < names.length - 1) drawArrow(ctx, x + 134, 128, x + 164, 128, i < stage ? COLORS.green : COLORS.line);
        });
        drawBar(ctx, 45, 218, 980, (stage + 1) / 6, COLORS.green, `当前：${steps[stage]} · 层接口维度 d`);
      }} />
      <StepControls value={stage} max={5} onChange={setStage} labels={steps} />
      <div className="feedback good">{feedback[stage]}</div>
    </div>
  );
};

type Dataset = 'mnli' | 'cola';
export const C9AblationSpan: React.FC<WidgetProps> = () => {
  const [dataset, setDataset] = useState<Dataset>('mnli');
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(4);
  const updateStart = (value: number) => setStart(Math.min(value, end));
  const updateEnd = (value: number) => setEnd(Math.max(value, start));
  const single = start === end;
  const full = start === 0 && end === 11;
  const lowerMnli = dataset === 'mnli' && start === 0 && end === 4;
  const message = single
    ? '论文报告单层移除的最大下降不超过 2%。'
    : lowerMnli
      ? '移除 MNLI 低层 0–4 几乎不影响性能。'
      : full
        ? `全部移除后，${dataset === 'mnli' ? 'MNLI 降至约 37%' : 'CoLA 降至约 69%'}，接近多数类基线。`
        : 'Figure 6 显示区间越广通常影响越大；本教程不伪造当前区间的精确数值。';
  const removed = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div>
      <CanvasStage labelText="BERT 十二层连续适配器消融" draw={(ctx) => {
        studioBase(ctx, W, H);
        label(ctx, `${dataset === 'mnli' ? 'MNLI' : 'CoLA'} · BERT-BASE · m=64 · 无重训`, 540, 38, COLORS.ink, 17, 'center');
        drawLayers(ctx, 220, 92, [], removed);
        drawBar(ctx, 220, 205, 575, removed.length / 12, COLORS.red, `移除层 ${start}–${end}（${removed.length}/12）`);
        roundedRect(ctx, 835, 82, 190, 112, 9, full ? COLORS.paleRed : COLORS.paleGreen, full ? COLORS.red : COLORS.green);
        label(ctx, full ? (dataset === 'mnli' ? '约 37%' : '约 69%') : single ? '最大下降 ≤2%' : '趋势观察', 930, 120, full ? COLORS.red : COLORS.green, 20, 'center');
        label(ctx, '仅明确状态给精确值', 930, 160, COLORS.muted, 13, 'center');
      }} />
      <ChipRow options={[{ value: 'mnli', label: 'MNLI' }, { value: 'cola', label: 'CoLA' }]} value={dataset} onChange={setDataset} />
      <div className="ctrl">
        <label>起始层 <span className="val">{start}</span></label>
        <input aria-label="消融起始层" type="range" min={0} max={11} value={start} onChange={(e) => updateStart(Number(e.target.value))} />
        <label>结束层 <span className="val">{end}</span></label>
        <input aria-label="消融结束层" type="range" min={0} max={11} value={end} onChange={(e) => updateEnd(Number(e.target.value))} />
      </div>
      <div className={`feedback ${full ? 'bad' : 'good'}`}>{message}</div>
    </div>
  );
};

type ReportedWidth = '8' | '64' | '256';
export const C9WidthRobustness: React.FC<WidgetProps> = () => {
  const [width, setWidth] = useState<ReportedWidth>('8');
  const values: Record<ReportedWidth, number> = { '8': 86.2, '64': 85.8, '256': 85.7 };
  const score = values[width];
  return (
    <div>
      <CanvasStage labelText="三个瓶颈宽度的平均验证准确率" draw={(ctx) => {
        studioBase(ctx, W, H);
        label(ctx, '八个分类条目平均验证准确率（STS-B 排除）', 540, 42, COLORS.ink, 17, 'center');
        drawFilter(ctx, 140, 86, 28 + Number(width) / 6, COLORS.orange);
        label(ctx, `m=${width}`, 210, 204, COLORS.orange, 18, 'center');
        drawBar(ctx, 430, 114, 500, (score - 84) / 3, COLORS.green, `${score.toFixed(1)}%`);
        label(ctx, '差异很小，但结论受该汇总协议限制', 680, 180, COLORS.muted, 15, 'center');
      }} />
      <ChipRow options={[{ value: '8', label: 'm=8' }, { value: '64', label: 'm=64' }, { value: '256', label: 'm=256' }]} value={width} onChange={setWidth} />
      <div className="feedback good">m={width}：{score.toFixed(1)}%。差异很小，但这是八个分类条目的特定汇总，不能推出“宽度永远不重要”。</div>
    </div>
  );
};

type Suite = 'glue' | 'tasks17' | 'squad';
const suiteData: Record<Suite, { name: string; metric: string; full: number; adapter: number; train: string; totalFull: string; totalAdapter: string; note: string }> = {
  glue: { name: 'GLUE', metric: '论文 Total（越高越好）', full: 80.4, adapter: 80.0, train: '3.6%', totalFull: '9×', totalAdapter: '1.3×', note: 'BERT-LARGE；WNLI 省略；按任务从 m∈{8,64,256} 选择。' },
  tasks17: { name: '17 个分类任务', metric: '平均测试准确率（越高越好）', full: 73.7, adapter: 73.3, train: '1.14%', totalFull: '17×', totalAdapter: '1.19×', note: 'BERT-BASE；每项按验证集选择配置。' },
  squad: { name: 'SQuAD v1.1', metric: '验证集 F1（越高越好）', full: 90.7, adapter: 90.4, train: '约 2%', totalFull: '未报告', totalAdapter: '未报告', note: 'm=64；Adapter 与全量微调分别搜索超参数。' },
};

export const C10ResultRace: React.FC<WidgetProps> = () => {
  const [suite, setSuite] = useState<Suite>('glue');
  const [running, setRunning] = useState(false);
  const data = suiteData[suite];
  const gap = (data.full - data.adapter).toFixed(1);
  return (
    <div>
      <CanvasStage labelText={`${data.name} 协议下的全量微调与适配器结果`} animate={running} height={320} draw={(ctx, _w, h, phase) => {
        studioBase(ctx, W, h);
        label(ctx, `${data.name} · ${data.metric}`, 540, 34, COLORS.ink, 18, 'center');
        const progress = running ? Math.min(1, phase * 2.5) : 1;
        const base = Math.min(data.full, data.adapter) - 3;
        const scale = (score: number) => ((score - base) / 4) * 650 * progress;
        label(ctx, '全量微调', 60, 94, COLORS.red, 15); label(ctx, 'Adapter', 60, 160, COLORS.green, 15);
        drawBar(ctx, 190, 82, 700, scale(data.full) / 700, COLORS.red, `${data.full}`);
        drawBar(ctx, 190, 148, 700, scale(data.adapter) / 700, COLORS.green, `${data.adapter}`);
        roundedRect(ctx, 915, 68, 130, 130, 9, COLORS.paper, COLORS.line);
        label(ctx, `差 ${gap}`, 980, 98, COLORS.ink, 17, 'center');
        label(ctx, `训练 ${data.train}`, 980, 136, COLORS.green, 14, 'center');
        label(ctx, `总量 ${data.totalAdapter}`, 980, 171, COLORS.green, 14, 'center');
        drawBar(ctx, 190, 238, 360, data.totalFull === '未报告' ? 0 : 1, COLORS.red, `全量总规模 ${data.totalFull}`);
        drawBar(ctx, 610, 238, 360, data.totalAdapter === '未报告' ? 0 : Number(data.totalAdapter.replace('×', '')) / Math.max(2, Number(data.totalFull.replace('×', ''))), COLORS.green, `Adapter 总规模 ${data.totalAdapter}`);
      }} />
      <ChipRow options={[{ value: 'glue', label: 'GLUE' }, { value: 'tasks17', label: '17 个分类任务' }, { value: 'squad', label: 'SQuAD' }]} value={suite} onChange={(v) => { setSuite(v); setRunning(false); }} />
      <div className="step-ctrl"><button type="button" className="tiny" onClick={() => setRunning((v) => !v)}>{running ? '暂停比较' : '开始比较'}</button></div>
      <div className="feedback good">{data.name}：Adapter {data.adapter}，全量微调 {data.full}，差 {gap}；每任务训练参数 {data.train}。{data.note}</div>
    </div>
  );
};

type Claim = 'performance' | 'storage' | 'continual' | 'architecture';
export const C10Boundaries: React.FC<WidgetProps> = () => {
  const [claim, setClaim] = useState<Claim>('performance');
  const claims: Record<Claim, { bad: string; good: string; locator: string }> = {
    performance: { bad: 'Adapter 总是更准', good: '在论文 GLUE 协议下，80.0 接近全量微调的 80.4。', locator: 'Table 1 · BERT-LARGE · WNLI 省略' },
    storage: { bad: '完全没有任务存储', good: '每个任务仍保存适配器、层归一化参数和任务头。', locator: 'Section 2 · 参数所有权' },
    continual: { bad: '任务间自动迁移知识', good: '任务隔离避免新任务改写旧任务参数。', locator: 'Sections 1–2 · 独立任务设定' },
    architecture: { bad: '适配器可以任意插入', good: '本文结果对应每层两个串联适配器的特定位置。', locator: 'Section 2.1 · Figure 2' },
  };
  const current = claims[claim];
  return (
    <div>
      <CanvasStage labelText="论文结论的过度表述与限定表述" draw={(ctx) => {
        studioBase(ctx, W, H);
        roundedRect(ctx, 70, 60, 420, 145, 10, COLORS.paleRed, COLORS.red);
        label(ctx, '越界说法', 280, 90, COLORS.red, 17, 'center');
        label(ctx, current.bad, 280, 142, COLORS.red, 20, 'center');
        drawArrow(ctx, 510, 132, 565, 132, COLORS.orange);
        roundedRect(ctx, 590, 60, 420, 145, 10, COLORS.paleGreen, COLORS.green);
        label(ctx, '证据支持的说法', 800, 90, COLORS.green, 17, 'center');
        const words = current.good.length > 27 ? [current.good.slice(0, 27), current.good.slice(27)] : [current.good];
        words.forEach((line, i) => label(ctx, line, 800, 132 + i * 30, COLORS.ink, 15, 'center'));
        label(ctx, current.locator, 540, 222, COLORS.muted, 14, 'center');
      }} />
      <ChipRow options={[{ value: 'performance', label: '性能' }, { value: 'storage', label: '存储' }, { value: 'continual', label: '持续学习' }, { value: 'architecture', label: '架构' }]} value={claim} onChange={setClaim} />
      <div className="feedback bad">拒绝：{current.bad}</div>
      <div className="feedback good">保留：{current.good}（{current.locator}）</div>
    </div>
  );
};
