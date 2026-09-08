import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type Dataset = 'Baby' | 'Sports' | 'Clothing';
type Lens = 'component' | 'modality' | 'k' | 'lambda' | 'distribution';
type Variant = 'full' | 'woBG' | 'woMV' | 'woBA';
type Judgment = 'quantitative' | 'qualitative' | 'universal' | null;
type LabState = { variant: Variant; lens: Lens; dataset: Dataset; judgment: Judgment; ambientPhase: number };

const initialState: LabState = { variant: 'full', lens: 'component', dataset: 'Baby', judgment: null, ambientPhase: 0 };

const table3: Record<Dataset, Record<'Text' | 'Visual' | 'All', [number, number]>> = {
  Baby: { Text: [0.0857, 0.0386], Visual: [0.0939, 0.0408], All: [0.0964, 0.0427] },
  Sports: { Text: [0.1017, 0.0454], Visual: [0.1055, 0.0465], All: [0.1106, 0.0496] },
  Clothing: { Text: [0.0902, 0.0404], Visual: [0.0919, 0.0422], All: [0.0945, 0.0428] },
};

const lensLabels: Record<Lens, string> = {
  component: '组件消融', modality: '模态组合', k: 'K 敏感性', lambda: 'λ_C 敏感性', distribution: '表征分布',
};

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = '#fff') {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function seededPoint(index: number, phase: number, spread: number) {
  const a = (index * 47.3 + phase) * Math.PI / 180;
  const r = ((index * 29) % 43) / 43 * spread;
  return [Math.cos(a) * r, Math.sin(a * 1.3) * r] as const;
}

function drawToolRack(ctx: CanvasRenderingContext2D, state: LabState) {
  const tools: Array<[Variant, string]> = [['woBG', '净化器'], ['woMV', '双视图'], ['woBA', '融合器']];
  tools.forEach(([key, label], index) => {
    const y = 40 + index * 48;
    const removed = state.variant === key;
    ctx.fillStyle = removed ? '#fff1f2' : '#f4f8f1';
    ctx.fillRect(24, y, 132, 32);
    ctx.strokeStyle = removed ? RED : GREEN;
    ctx.lineWidth = removed ? 2.5 : 1.5;
    ctx.strokeRect(24, y, 132, 32);
    ctx.fillStyle = removed ? RED : INK;
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText(label, 38, y + 21);
    if (removed) {
      ctx.beginPath();
      ctx.moveTo(26, y + 4);
      ctx.lineTo(152, y + 28);
      ctx.stroke();
    }
  });
}

function drawComponent(ctx: CanvasRenderingContext2D, state: LabState) {
  const labels = ['Baby', 'Sports', 'Clothing'];
  labels.forEach((label, index) => {
    const y = 54 + index * 38;
    ctx.fillStyle = MUTED;
    ctx.fillText(label, 356, y + 13);
    ctx.fillStyle = '#dfe5ec';
    ctx.fillRect(414, y, 104, 16);
    ctx.fillStyle = state.variant === 'full' ? GREEN : MUTED;
    ctx.fillRect(414, y, state.variant === 'full' ? 104 : 78, 16);
  });
  ctx.fillStyle = state.variant === 'full' ? GREEN : RED;
  ctx.fillText(state.variant === 'full' ? '完整配置' : '低于完整模型（方向证据）', 356, 176);
}

function drawModality(ctx: CanvasRenderingContext2D, state: LabState) {
  const rows = table3[state.dataset];
  (['Text', 'Visual', 'All'] as const).forEach((name, index) => {
    const [recall, ndcg] = rows[name];
    const y = 48 + index * 42;
    ctx.fillStyle = INK;
    ctx.fillText(name, 354, y + 13);
    ctx.fillStyle = name === 'All' ? GREEN : BLUE;
    ctx.fillRect(406, y, recall * 900, 10);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(406, y + 15, ndcg * 900, 7);
    ctx.fillStyle = INK;
    ctx.fillText(`${recall.toFixed(4)} / ${ndcg.toFixed(4)}`, 432, y + 20);
  });
}

function drawSensitivity(ctx: CanvasRenderingContext2D, lens: 'k' | 'lambda') {
  const points = lens === 'k'
    ? [[364, 142], [400, 102], [438, 62], [476, 82], [514, 116]]
    : [[364, 130], [400, 92], [438, 60], [476, 102], [514, 148]];
  ctx.strokeStyle = lens === 'lambda' ? PURPLE : BLUE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
  points.forEach(([x, y], index) => {
    ctx.fillStyle = index === 2 ? ORANGE : '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = MUTED;
  ctx.fillText(lens === 'k' ? '多数约 15；Baby 更适合 20' : '论文设置约 0.01；过大时下降', 356, 176);
  ctx.fillText('趋势示意，不补造曲线纵轴数值', 356, 192);
}

function drawDistribution(ctx: CanvasRenderingContext2D, phase: number) {
  ctx.fillStyle = MUTED;
  ctx.fillText('原始', 370, 43);
  ctx.fillText('净化后', 468, 43);
  for (let i = 0; i < 24; i += 1) {
    const [rx, ry] = seededPoint(i, phase, 35);
    const [px, py] = seededPoint(i + 11, phase * 0.35, 43);
    ctx.fillStyle = i % 3 === 0 ? RED : BLUE;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.arc(402 + rx * 0.55, 106 + ry, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(492 + px, 106 + py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = MUTED;
  ctx.fillText('Clothing · 随机 500 项 · t-SNE/KDE（定性）', 350, 178);
}

function expectedJudgment(lens: Lens): Exclude<Judgment, null> {
  return lens === 'modality' ? 'quantitative' : 'qualitative';
}

function baseFeedback(state: LabState): string {
  if (state.lens === 'component') {
    if (state.variant === 'full') return '完整模型保留净化、双视图编码与行为感知融合三项机制。';
    if (state.variant === 'woBG') return '去掉行为引导净化器后，三个数据集的 Recall@20 均低于完整 MGCN；证据不支持虚构精确降幅。';
    if (state.variant === 'woMV') return '去掉多视图信息编码器会降低报告的 Recall@20，说明协同与语义分视图编码各有贡献。';
    return '去掉行为感知融合器会降低报告的 Recall@20，平均融合不能替代行为条件权重。';
  }
  if (state.lens === 'modality') {
    const row = table3[state.dataset];
    return `${state.dataset}：All 为 ${row.All[0].toFixed(4)}/${row.All[1].toFixed(4)}，高于 Visual 的 ${row.Visual[0].toFixed(4)}/${row.Visual[1].toFixed(4)} 与 Text 的 ${row.Text[0].toFixed(4)}/${row.Text[1].toFixed(4)}。`;
  }
  if (state.lens === 'k') return 'K 是数据集敏感的邻居数：多数实验约为 15，Baby 更适合 20。';
  if (state.lens === 'lambda') return 'λ_C 在论文设置中约 0.01 较合适；过大会让辅助任务压过主任务。';
  return '这是 Clothing 500 个样本的定性可视化，不能直接替代 Recall/NDCG。';
}

function feedbackFor(state: LabState): { text: string; cls: string } {
  if (!state.judgment) {
    const cls = state.variant === 'full' || state.lens === 'modality'
      ? 'good'
      : state.lens === 'component'
        ? 'bad'
        : '';
    return { text: baseFeedback(state), cls };
  }
  if (state.judgment === 'universal') return { text: '过度外推：K 与 λ_C 依数据集或设置而变，模态和可视化结论也有实验边界。', cls: 'bad' };
  if (state.judgment === expectedJudgment(state.lens)) {
    return state.lens === 'modality'
      ? { text: '判断准确：可以复述表中精确值，但必须保留数据集、指标与输入条件。', cls: 'good' }
      : { text: '判断准确：当前证据只允许定性复述。', cls: 'good' };
  }
  return { text: '证据强度不匹配：请检查当前镜头来自精确表格还是定性图示。', cls: 'bad' };
}

export const MgcnAblationLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<LabState>(initialState);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || state.lens !== 'distribution') return;
    const timer = window.setInterval(() => setState((s) => ({ ...s, ambientPhase: (s.ambientPhase + 2) % 360 })), 120);
    return () => window.clearInterval(timer);
  }, [state.lens]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    card(ctx, 10, 10, 160, 184);
    card(ctx, 180, 10, 154, 184, '#fbfcfa');
    card(ctx, 344, 10, 206, 184);
    drawToolRack(ctx, state);
    ctx.fillStyle = BLUE;
    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillText(lensLabels[state.lens], 194, 38);
    ctx.fillStyle = ORANGE;
    ctx.fillText(state.dataset, 194, 66);
    ctx.fillStyle = MUTED;
    ctx.font = '12px "Segoe UI", sans-serif';
    const evidence = {
      component: ['图 3 · §3.3.1', '方向证据', '不补造降幅'],
      modality: ['表 3 · §3.3.2', 'Recall@20', 'NDCG@20'],
      k: ['图 4(a) · §3.4.1', '数据集敏感', '非普适常数'],
      lambda: ['图 4(b) · §3.4.2', '设置敏感', '趋势证据'],
      distribution: ['图 5–6 · §3.5', 'Clothing 500 项', '定性可视化'],
    }[state.lens];
    evidence.forEach((line, i) => ctx.fillText(line, 194, 100 + i * 24));
    ctx.font = '12px "Segoe UI", sans-serif';
    if (state.lens === 'component') drawComponent(ctx, state);
    if (state.lens === 'modality') drawModality(ctx, state);
    if (state.lens === 'k' || state.lens === 'lambda') drawSensitivity(ctx, state.lens);
    if (state.lens === 'distribution') drawDistribution(ctx, state.ambientPhase);
    ctx.fillStyle = '#f7f9fc';
    ctx.fillRect(10, 204, 540, 26);
    ctx.fillStyle = INK;
    ctx.fillText('实线边框＝精确表格；虚线/轮廓＝定性证据', 22, 222);
  }, [state]);

  const feedback = feedbackFor(state);
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="MGCN 消融、模态、敏感性和表征证据画布" />
      <div className="ctrl" role="group" aria-label="证据镜头">
        {(Object.keys(lensLabels) as Lens[]).map((lens) => (
          <button key={lens} type="button" aria-pressed={state.lens === lens} onClick={() => setState((s) => ({ ...s, lens, judgment: null }))}>
            {lensLabels[lens]}
          </button>
        ))}
      </div>
      <div className="ctrl" role="group" aria-label="模型变体">
        {([
          ['full', '完整 MGCN'], ['woBG', '去掉净化器'], ['woMV', '去掉多视图'], ['woBA', '去掉融合器'],
        ] as Array<[Variant, string]>).map(([variant, label]) => (
          <button key={variant} type="button" disabled={state.lens !== 'component'} aria-pressed={state.variant === variant} onClick={() => setState((s) => ({ ...s, variant, judgment: null }))}>{label}</button>
        ))}
      </div>
      <div className="ctrl" role="group" aria-label="数据集">
        {(['Baby', 'Sports', 'Clothing'] as Dataset[]).map((dataset) => (
          <button key={dataset} type="button" aria-pressed={state.dataset === dataset} onClick={() => setState((s) => ({ ...s, dataset, judgment: null }))}>{dataset}</button>
        ))}
        <button type="button" onClick={() => setState(initialState)}>重置证据台</button>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
      <div className="ctrl" role="group" aria-label="证据强度判断">
        <span>当前结论可以说到多强？</span>
        <button type="button" onClick={() => setState((s) => ({ ...s, judgment: 'quantitative' }))}>可作定量复述</button>
        <button type="button" onClick={() => setState((s) => ({ ...s, judgment: 'qualitative' }))}>只能作定性复述</button>
        <button type="button" onClick={() => setState((s) => ({ ...s, judgment: 'universal' }))}>参数可普适迁移</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="paper">
          <caption>表 3：每个模态条件都包含行为信息；单元格为 Recall@20 / NDCG@20</caption>
          <thead><tr><th scope="col">数据集</th><th scope="col">Text</th><th scope="col">Visual</th><th scope="col">All</th></tr></thead>
          <tbody>
            {(Object.keys(table3) as Dataset[]).map((dataset) => (
              <tr key={dataset}>
                <th scope="row">{dataset}</th>
                {(['Text', 'Visual', 'All'] as const).map((mode) => <td key={mode}>{table3[dataset][mode].map((v) => v.toFixed(4)).join(' / ')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="feedback">判断边界：“视觉一定比文本更重要”不是普遍结论；这里只能说三数据集的该实验中，且每个条件都包含行为信息时，视觉单模态高于文本单模态。</div>
    </div>
  );
};

export default MgcnAblationLab;
