import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
type ViewKey = 'ao' | 'mle' | 'transfer';
type SplitKey = 'dev' | 'test';
type Direction = 'up' | 'down';

const SYSTEMS = ['Initial', 'Codex', 'Claude Code', 'Arbor'] as const;
const AO_TASKS = [
  {
    id: 'optimizer',
    type: '模型训练',
    label: 'Optimizer Design',
    metric: 'steps',
    unit: '',
    direction: 'down' as Direction,
    initial: 'NanoGPT-Bench 官方调优 Muon 基线',
    objective: '在 val_loss ≤ 3.28 时，最小化达到目标所需训练步数',
    devProtocol: '标准 NanoGPT-Bench 评估用于反复搜索',
    testProtocol: '用两个留出随机种子重跑选中优化器并取平均',
    dev: [3325, 3325, 3275, 3225],
    test: [3325, 3325, 3287.5, 3237.5],
  },
  {
    id: 'architecture',
    type: '模型训练',
    label: 'Architecture Design',
    metric: 'loss',
    unit: '',
    direction: 'down' as Direction,
    initial: 'autoresearch LLM 训练代码库',
    objective: '在固定训练时间预算内最小化最终验证损失',
    devProtocol: '固定时间预算的开发训练运行用于搜索',
    testProtocol: '用两个留出随机种子重跑选中架构并取平均',
    dev: [1.096, 1.089, 1.033, 1.029],
    test: [1.098, 1.083, 1.033, 1.028],
  },
  {
    id: 'terminal',
    type: 'Harness 工程',
    label: 'Terminal-Bench 2.0',
    metric: 'pass rate',
    unit: '%',
    direction: 'up' as Direction,
    initial: '官方 terminal-agent 代码库',
    objective: '提高终端代码与 shell 任务的通过率',
    devProtocol: '按难度分层得到 36 个开发任务',
    testProtocol: '其余 53 个任务作为不参与搜索的留出集合',
    dev: [58.33, 63.89, 75, 72.22],
    test: [69.81, 73.59, 71.7, 77.36],
  },
  {
    id: 'browse',
    type: 'Harness 工程',
    label: 'BrowseComp',
    metric: 'accuracy',
    unit: '%',
    direction: 'up' as Direction,
    initial: '最小 ReAct 风格搜索 harness',
    objective: '提高浏览问答准确率',
    devProtocol: '50 道 BrowseComp 问题用于迭代优化',
    testProtocol: '300 道不重叠问题用于留出验证',
    dev: [52.5, 57.5, 55, 72.5],
    test: [45.33, 50, 53.33, 67.67],
  },
  {
    id: 'search',
    type: '数据合成',
    label: 'Search-Agent Data Synthesis',
    metric: 'mean pass gap',
    unit: '',
    direction: 'up' as Direction,
    initial: '手工设计的搜索数据生成管线',
    objective: '提高生成问题的平均 pass@4 − pass@1 gap',
    devProtocol: '50 个种子用于迭代开发',
    testProtocol: '100 个不相交种子用于留出验证',
    dev: [4, 12, 12, 16],
    test: [5, 9, 12, 18],
  },
  {
    id: 'math',
    type: '数据合成',
    label: 'Math-Reasoning Data Synthesis',
    metric: 'mean pass gap',
    unit: '',
    direction: 'up' as Direction,
    initial: '手工设计的 AIME 风格数学数据管线',
    objective: '提高生成问题的平均 pass@4 − pass@1 gap',
    devProtocol: '10 个种子，每个生成 5 个候选，最多 50 题',
    testProtocol: '12 个留出种子，每个生成 8 个候选，最多 96 题',
    dev: [2, 6, 8, 24],
    test: [1.04, 6.25, 8.33, 20.83],
  },
] as const;

type MleMetricKey = 'valid' | 'above' | 'bronze' | 'silver' | 'gold' | 'medal';
const MLE_METRICS: Record<MleMetricKey, string> = {
  valid: 'Valid submission',
  above: 'Above median',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  medal: 'Any medal',
};
const MLE_ROWS = [
  { method: 'InternAgent · DeepSeek-R1', valid: 100, above: 78.79, bronze: 10.61, silver: 16.67, gold: 34.85, medal: 62.12 },
  { method: 'ML-Master · DeepSeek-R1', valid: 100, above: 74.24, bronze: 4.55, silver: 13.64, gold: 30.3, medal: 48.48 },
  { method: 'AIRA-dojo · o3', valid: 100, above: 70.45, bronze: 7.95, silver: 12.73, gold: 34.32, medal: 55 },
  { method: 'ML-Master 2.0 · DeepSeek V3.2-Spe', valid: 100, above: 84.85, bronze: 13.64, silver: 31.82, gold: 30.3, medal: 75.76 },
  { method: 'R&D-Agent · GPT-5', valid: 77.27, above: 74.24, bronze: 12.12, silver: 22.73, gold: 33.33, medal: 68.18 },
  { method: 'Famou-Agent 2.0 · Gemini-2.5-Pro', valid: 100, above: 86.36, bronze: 15.15, silver: 19.7, gold: 40.91, medal: 75.76 },
  { method: 'MARS · Gemini-3-Pro', valid: 100, above: 89.39, bronze: 6.06, silver: 15.15, gold: 53.03, medal: 74.24 },
  { method: 'Leeroo · Gemini-3-Pro', valid: 68.18, above: 68.18, bronze: 18.18, silver: 19.7, gold: 30.3, medal: 68.18 },
  { method: 'AIBuildAI · Claude-Opus-4.6', valid: 100, above: 81.82, bronze: 13.64, silver: 25.76, gold: 37.88, medal: 77.27 },
  { method: 'AIDE · Gemini-3-Flash', valid: 77.27, above: 54.55, bronze: 4.55, silver: 9.09, gold: 31.82, medal: 45.45 },
  { method: 'LoongFlow · Gemini-3-Flash', valid: 77.27, above: 77.27, bronze: 12.12, silver: 25.76, gold: 39.39, medal: 77.27 },
  { method: 'Codex · GPT-5.5 (xhigh)', valid: 100, above: 81.82, bronze: 1.52, silver: 19.7, gold: 46.97, medal: 68.18 },
  { method: 'AI-Scientist · Gemini-3-Flash', valid: 100, above: 86.36, bronze: 18.18, silver: 31.82, gold: 31.82, medal: 81.82 },
  { method: 'Arbor · Gemini-3-Flash', valid: 100, above: 86.36, bronze: 13.64, silver: 27.27, gold: 40.9, medal: 81.82 },
  { method: 'Arbor · GPT-5.5', valid: 100, above: 95.45, bronze: 0, silver: 9.09, gold: 77.27, medal: 86.36 },
] as const;

const TRANSFER = [
  { task: 'BrowseComp（源任务）', before: 45.33, after: 67.67, beforeLabel: '45.33%', afterLabel: '67.67%' },
  { task: 'DeepSearchQA（未见）', before: 61, after: 69, beforeLabel: '61.00 ± 6.76%', afterLabel: '69.00 ± 6.41%' },
  { task: 'HLE（未见）', before: 25.5, after: 31.5, beforeLabel: '25.50%', afterLabel: '31.50%' },
] as const;

function formatAoValue(value: number, unit: string) {
  const digits = Number.isInteger(value) ? 0 : value < 2 ? 3 : 2;
  return `${value.toFixed(digits)}${unit}`;
}

export const MetricDirectionBoard: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<ViewKey>('ao');
  const [taskIndex, setTaskIndex] = useState(0);
  const [split, setSplit] = useState<SplitKey>('test');
  const [mleMetric, setMleMetric] = useState<MleMetricKey>('medal');
  const canvasHeight = view === 'mle' ? 570 : 360;
  const activeTask = AO_TASKS[taskIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, canvasHeight);
    } catch {
      return;
    }
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, W, canvasHeight);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, canvasHeight);

    if (view === 'ao') {
      const task = AO_TASKS[taskIndex];
      const values = task[split];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = Math.max(0.0001, max - min);
      ctx.fillStyle = '#27446e';
      ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${task.label} · ${split === 'dev' ? 'Edev' : 'Etest'}`, 30, 38);
      ctx.fillStyle = task.direction === 'up' ? '#228d5c' : '#d97706';
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${task.metric} · ${task.direction === 'up' ? '越高越好' : '越低越好'}`, 730, 38);

      values.forEach((value, index) => {
        const y = 78 + index * 60;
        const performance = task.direction === 'up' ? (value - min) / span : (max - value) / span;
        const width = 90 + performance * 350;
        const best = task.direction === 'up' ? value === max : value === min;
        ctx.fillStyle = '#21324a';
        ctx.font = '700 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(SYSTEMS[index], 30, y + 20);
        ctx.fillStyle = '#e3eadc';
        ctx.fillRect(150, y, 440, 28);
        ctx.fillStyle = best ? '#228d5c' : index === 3 ? '#27446e' : '#7c3aed';
        ctx.fillRect(150, y, width, 28);
        ctx.fillStyle = '#21324a';
        ctx.textAlign = 'right';
        ctx.fillText(formatAoValue(value, task.unit), 710, y + 20);
        if (best) {
          ctx.fillStyle = '#228d5c';
          ctx.fillText('best', 650, y + 20);
        }
      });
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Table 2 原生指标。条长已按指标方向统一为“越长越好”，右侧保留原始数值。', 30, 334);
    }

    if (view === 'mle') {
      const label = MLE_METRICS[mleMetric];
      const values = MLE_ROWS.map((row) => row[mleMetric]);
      const best = Math.max(...values);
      ctx.fillStyle = '#27446e';
      ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`MLE-Bench Lite · ${label}`, 24, 34);
      ctx.fillStyle = '#228d5c';
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Table 3 · 全部条目 · 单位 %', 736, 34);
      MLE_ROWS.forEach((row, index) => {
        const value = row[mleMetric];
        const y = 58 + index * 32;
        const isBest = value === best;
        ctx.fillStyle = isBest ? '#21324a' : '#4d5c51';
        ctx.font = `${isBest ? 700 : 500} 11px "Segoe UI", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(row.method, 24, y + 17);
        ctx.fillStyle = '#e3eadc';
        ctx.fillRect(300, y, 340, 20);
        ctx.fillStyle = isBest ? '#228d5c' : row.method.startsWith('Arbor') ? '#27446e' : '#7c3aed';
        ctx.fillRect(300, y, 340 * (value / 100), 20);
        ctx.fillStyle = '#21324a';
        ctx.textAlign = 'right';
        ctx.fillText(`${value.toFixed(2)}%`, 730, y + 16);
      });
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('同骨干比较时应优先查看 Arbor · Gemini-3-Flash 与其他 Gemini-3-Flash 系统。', 24, 550);
    }

    if (view === 'transfer') {
      ctx.fillStyle = '#27446e';
      ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Figure 3(b) · 冻结 search harness 后直接迁移', 28, 38);
      TRANSFER.forEach((item, index) => {
        const y = 86 + index * 80;
        ctx.fillStyle = '#21324a';
        ctx.font = '700 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.task, 28, y);
        ctx.fillStyle = '#d8dfd5';
        ctx.fillRect(210, y - 18, item.before * 5.7, 20);
        ctx.fillStyle = '#228d5c';
        ctx.fillRect(210, y + 10, item.after * 5.7, 20);
        ctx.fillStyle = '#21324a';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`初始 ${item.beforeLabel}`, 730, y - 3);
        ctx.fillText(`冻结后 ${item.afterLabel}`, 730, y + 27);
      });
      ctx.fillStyle = '#92400e';
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('关键协议：HLE 与 DeepSearchQA 从未参与 BrowseComp 优化，也没有后续任务特定优化。', 28, 334);
    }
    canvas.classList.add('is-ready');
  }, [canvasHeight, mleMetric, split, taskIndex, view]);

  return (
    <div>
      <div className="ctrl metric-view-grid" role="group" aria-label="选择实验结果视图">
        <button type="button" aria-pressed={view === 'ao'} onClick={() => setView('ao')}>六项 AO 任务</button>
        <button type="button" aria-pressed={view === 'mle'} onClick={() => setView('mle')}>MLE-Bench Lite</button>
        <button type="button" aria-pressed={view === 'transfer'} onClick={() => setView('transfer')}>冻结 harness 迁移</button>
      </div>
      {view === 'ao' && (
        <div className="ctrl" style={{ display: 'grid', gap: 8 }}>
          <div className="metric-task-grid" role="group" aria-label="选择 AO 任务">
            {AO_TASKS.map((task, index) => (
              <button key={task.id} type="button" aria-pressed={taskIndex === index} onClick={() => setTaskIndex(index)}>{task.label}</button>
            ))}
          </div>
          <div className="metric-split-grid" role="group" aria-label="选择开发或留出分割">
            <button type="button" aria-pressed={split === 'dev'} onClick={() => setSplit('dev')}>开发 Edev</button>
            <button type="button" aria-pressed={split === 'test'} onClick={() => setSplit('test')}>留出 Etest</button>
          </div>
        </div>
      )}
      {view === 'mle' && (
        <div className="ctrl metric-mle-grid" role="group" aria-label="选择 MLE-Bench Lite 指标">
          {(Object.keys(MLE_METRICS) as MleMetricKey[]).map((key) => (
            <button key={key} type="button" aria-pressed={mleMetric === key} onClick={() => setMleMetric(key)}>{MLE_METRICS[key]}</button>
          ))}
        </div>
      )}
      {view === 'ao' && (
        <section className="ao-task-contract" aria-live="polite" key={activeTask.id}>
          <header>
            <span>{activeTask.type}</span>
            <strong>{activeTask.label} · AO 任务契约</strong>
          </header>
          <div className="ao-task-contract-grid">
            <div><span>M₀ · 初始制品</span><p>{activeTask.initial}</p></div>
            <div><span>O · 优化目标</span><p>{activeTask.objective}</p></div>
            <div><span>Edev · 开发反馈</span><p>{activeTask.devProtocol}</p></div>
            <div><span>Etest · 留出验证</span><p>{activeTask.testProtocol}</p></div>
          </div>
          <p className="ao-task-contract-rule">
            <strong>为什么属于 AO：</strong>智能体在固定目标与评估协议下，无逐步人工监督地修改可执行制品；开发反馈指导搜索，留出反馈只验证迁移。
          </p>
        </section>
      )}
      <div style={{ overflowX: 'auto' }}>
        <canvas className="paper-wide-canvas" id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={canvasHeight} />
      </div>
      <div className={`feedback ${view === 'transfer' ? 'good' : ''}`} aria-live="polite">
        {view === 'ao' && 'Table 2：六项真实 AO 任务分别使用原生指标，并同时保留开发与留出结果。'}
        {view === 'mle' && 'Table 3：这是独立的 MLE-Bench Lite 官方协议，不能与六项 AO 任务混成同一排行榜。'}
        {view === 'transfer' && '同一个 BrowseComp 优化后、被冻结的 search harness 在 HLE 与 DeepSearchQA 上直接提升；迁移的是代码制品，不是相邻任务间复用树状态。'}
      </div>
    </div>
  );
};

export default MetricDirectionBoard;
