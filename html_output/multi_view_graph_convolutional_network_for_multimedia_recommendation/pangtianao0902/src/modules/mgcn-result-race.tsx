import React, { useEffect, useRef, useState } from 'react';
import { easeOutCubic, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type Dataset = 'Baby' | 'Sports' | 'Clothing';
type Metric = 'Recall@10' | 'Recall@20' | 'NDCG@10' | 'NDCG@20';
type Method = 'MF' | 'LightGCN' | 'VBPR' | 'MMGCN' | 'GRCN' | 'SLMRec' | 'BM3' | 'MICRO' | 'MGCN';
type Baseline = Exclude<Method, 'MGCN'>;
type RaceState = { dataset: Dataset; metric: Metric; baseline: Baseline; running: boolean; progress: number; showRelative: boolean; protocolChanged: boolean };

const methods: Method[] = ['MF', 'LightGCN', 'VBPR', 'MMGCN', 'GRCN', 'SLMRec', 'BM3', 'MICRO', 'MGCN'];
const baselines: Baseline[] = ['MF', 'LightGCN', 'VBPR', 'MMGCN', 'GRCN', 'SLMRec', 'BM3', 'MICRO'];
const datasets: Dataset[] = ['Baby', 'Sports', 'Clothing'];
const metrics: Metric[] = ['Recall@10', 'Recall@20', 'NDCG@10', 'NDCG@20'];

const table2: Record<Dataset, Record<Metric, Record<Method, number>>> = {
  Baby: {
    'Recall@10': { MF: 0.0357, LightGCN: 0.0479, VBPR: 0.0423, MMGCN: 0.0378, GRCN: 0.0532, SLMRec: 0.0540, BM3: 0.0564, MICRO: 0.0584, MGCN: 0.0620 },
    'Recall@20': { MF: 0.0575, LightGCN: 0.0754, VBPR: 0.0663, MMGCN: 0.0615, GRCN: 0.0824, SLMRec: 0.0810, BM3: 0.0883, MICRO: 0.0929, MGCN: 0.0964 },
    'NDCG@10': { MF: 0.0192, LightGCN: 0.0257, VBPR: 0.0223, MMGCN: 0.0200, GRCN: 0.0282, SLMRec: 0.0285, BM3: 0.0301, MICRO: 0.0318, MGCN: 0.0339 },
    'NDCG@20': { MF: 0.0249, LightGCN: 0.0328, VBPR: 0.0284, MMGCN: 0.0261, GRCN: 0.0358, SLMRec: 0.0357, BM3: 0.0383, MICRO: 0.0407, MGCN: 0.0427 },
  },
  Sports: {
    'Recall@10': { MF: 0.0432, LightGCN: 0.0569, VBPR: 0.0558, MMGCN: 0.0370, GRCN: 0.0559, SLMRec: 0.0676, BM3: 0.0656, MICRO: 0.0679, MGCN: 0.0729 },
    'Recall@20': { MF: 0.0653, LightGCN: 0.0864, VBPR: 0.0856, MMGCN: 0.0605, GRCN: 0.0877, SLMRec: 0.1017, BM3: 0.0980, MICRO: 0.1050, MGCN: 0.1106 },
    'NDCG@10': { MF: 0.0241, LightGCN: 0.0311, VBPR: 0.0307, MMGCN: 0.0193, GRCN: 0.0306, SLMRec: 0.0374, BM3: 0.0355, MICRO: 0.0367, MGCN: 0.0397 },
    'NDCG@20': { MF: 0.0298, LightGCN: 0.0387, VBPR: 0.0384, MMGCN: 0.0254, GRCN: 0.0389, SLMRec: 0.0462, BM3: 0.0438, MICRO: 0.0463, MGCN: 0.0496 },
  },
  Clothing: {
    'Recall@10': { MF: 0.0187, LightGCN: 0.0340, VBPR: 0.0280, MMGCN: 0.0197, GRCN: 0.0424, SLMRec: 0.0452, BM3: 0.0421, MICRO: 0.0521, MGCN: 0.0641 },
    'Recall@20': { MF: 0.0279, LightGCN: 0.0526, VBPR: 0.0414, MMGCN: 0.0328, GRCN: 0.0650, SLMRec: 0.0675, BM3: 0.0625, MICRO: 0.0772, MGCN: 0.0945 },
    'NDCG@10': { MF: 0.0103, LightGCN: 0.0188, VBPR: 0.0159, MMGCN: 0.0101, GRCN: 0.0225, SLMRec: 0.0247, BM3: 0.0228, MICRO: 0.0283, MGCN: 0.0347 },
    'NDCG@20': { MF: 0.0126, LightGCN: 0.0236, VBPR: 0.0193, MMGCN: 0.0135, GRCN: 0.0283, SLMRec: 0.0303, BM3: 0.0280, MICRO: 0.0347, MGCN: 0.0428 },
  },
};

const initialState: RaceState = { dataset: 'Baby', metric: 'Recall@20', baseline: 'MICRO', running: false, progress: 0, showRelative: false, protocolChanged: false };

function format4(value: number) { return value.toFixed(4); }

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = BORDER) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 9);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function protocolChip(ctx: CanvasRenderingContext2D, x: number, text: string) {
  rounded(ctx, x, 14, text.length * 12 + 18, 24, '#eef3f8', BLUE);
  ctx.fillStyle = BLUE;
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText(text, x + 9, 30);
}

function drawLane(ctx: CanvasRenderingContext2D, y: number, label: string, value: number, rowMax: number, progress: number, color: string) {
  const x = 104;
  const width = 390;
  ctx.fillStyle = INK;
  ctx.font = '600 12px "Segoe UI", sans-serif';
  ctx.fillText(label, 20, y + 17);
  ctx.fillStyle = '#e9edf2';
  ctx.fillRect(x, y, width, 24);
  const barWidth = width * (value / rowMax) * easeOutCubic(progress);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, barWidth, 24);
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.arc(x + barWidth, y + 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'right';
  ctx.fillText(format4(value * progress), 540, y + 17);
  ctx.textAlign = 'left';
}

function raceFeedback(state: RaceState): { text: string; cls: string } {
  const ours = table2[state.dataset][state.metric].MGCN;
  const base = table2[state.dataset][state.metric][state.baseline];
  if (state.protocolChanged) return { text: '口径已改变，动画已重置；请重新开始比较。', cls: '' };
  if (state.running) return { text: '正在读取表 2 并按同一坐标轴绘制，不跨数据集比较。', cls: '' };
  if (state.progress < 1) return { text: `已锁定 ${state.dataset} · ${state.metric} · 全量排序协议；按“开始比较”查看同口径结果。`, cls: '' };
  const special = state.dataset === 'Clothing' && state.metric === 'Recall@20' && state.baseline === 'MICRO'
    ? ' 论文将 0.0945 相对 0.0772 的提升描述为约 23.3%。' : '';
  return { text: `在论文列出的基线与 8:1:1 全量排序协议下，MGCN 的 ${state.dataset} ${state.metric} 为 ${format4(ours)}，高于 ${state.baseline} 的 ${format4(base)}。${special}`, cls: 'good' };
}

export const MgcnResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<RaceState>(initialState);

  useEffect(() => {
    if (!state.running) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setState((s) => ({ ...s, running: false, progress: 1, protocolChanged: false }));
      return;
    }
    const startProgress = state.progress;
    const startTime = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, startProgress + (now - startTime) / 1200);
      setState((s) => ({ ...s, progress: next, running: next < 1, protocolChanged: false }));
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    rounded(ctx, 8, 8, 544, 224, '#fff');
    protocolChip(ctx, 18, '8:1:1 随机划分');
    protocolChip(ctx, 164, '全量排序协议');
    protocolChip(ctx, 294, '越高越好');
    const row = table2[state.dataset][state.metric];
    const ours = row.MGCN;
    const baseline = row[state.baseline];
    const rowMax = Math.max(...methods.map((method) => row[method])) * 1.08;
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const x = 104 + i * 97.5;
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, 140);
      ctx.stroke();
    }
    drawLane(ctx, 64, state.baseline, baseline, rowMax, state.progress, MUTED);
    drawLane(ctx, 108, 'MGCN', ours, rowMax, state.progress, GREEN);
    const gap = ours - baseline;
    const relative = gap / baseline * 100;
    rounded(ctx, 18, 158, 310, 58, '#f7faf5', GREEN);
    ctx.fillStyle = INK;
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText(`绝对差：${format4(gap)}`, 30, 180);
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(state.showRelative ? `相对提升：${relative.toFixed(1)}%（由表中数值计算）` : '相对提升已隐藏，避免脱离基线解释', 30, 201);
    rounded(ctx, 340, 158, 202, 58, '#fff7f8', RED);
    ctx.fillStyle = RED;
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText('冷启动：未解决', 354, 181);
    ctx.fillStyle = INK;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('外部知识与大语言模型仅为未来方向', 354, 202);
    if (state.progress === 1) {
      ctx.fillStyle = GREEN;
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText('MGCN · 当前单元格最高', 384, 30);
    }
  }, [state]);

  const resetProtocol = <K extends 'dataset' | 'metric' | 'baseline'>(key: K, value: RaceState[K]) => {
    setState((s) => ({ ...s, [key]: value, running: false, progress: 0, protocolChanged: true }));
  };
  const feedback = raceFeedback(state);
  const currentRow = table2[state.dataset][state.metric];

  return (
    <div onKeyDown={(e) => {
      if (e.key.toLowerCase() === 's') setState((s) => ({ ...s, running: true, protocolChanged: false }));
      if (e.key.toLowerCase() === 'r') setState(initialState);
      if (e.key === 'Escape') setState((s) => ({ ...s, running: false }));
    }}>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="表 2 同口径结果竞赛画布" />
      <div className="ctrl" role="group" aria-label="选择数据集">
        {datasets.map((dataset) => <button key={dataset} type="button" aria-pressed={state.dataset === dataset} onClick={() => resetProtocol('dataset', dataset)}>{dataset}</button>)}
      </div>
      <div className="ctrl" role="group" aria-label="选择指标">
        {metrics.map((metric) => <button key={metric} type="button" aria-pressed={state.metric === metric} onClick={() => resetProtocol('metric', metric)}>{metric}</button>)}
      </div>
      <div className="ctrl">
        <label htmlFor={`baseline-${chapterId}-${moduleId}`}>比较基线</label>
        <select id={`baseline-${chapterId}-${moduleId}`} value={state.baseline} onChange={(e) => resetProtocol('baseline', e.target.value as Baseline)}>
          {baselines.map((method) => <option key={method} value={method}>{method}</option>)}
        </select>
        <button type="button" onClick={() => setState((s) => ({ ...s, running: true, protocolChanged: false }))}>{state.progress > 0 && state.progress < 1 ? '继续' : '开始比较'}</button>
        <button type="button" disabled={!state.running} onClick={() => setState((s) => ({ ...s, running: false }))}>暂停</button>
        <button type="button" aria-pressed={state.showRelative} onClick={() => setState((s) => ({ ...s, showRelative: !s.showRelative }))}>显示相对提升</button>
        <button type="button" onClick={() => setState(initialState)}>重置</button>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
      <div className="feedback bad">边界：冷启动并未在本文中解决；结合外部知识与大语言模型只是未来方向。不同划分或候选集的跨论文数字不能直接放入本赛道。</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="paper">
          <caption>表 2：8:1:1 随机划分、全量排序协议；Recall/NDCG 均为越高越好</caption>
          <thead>
            <tr><th scope="col">数据集</th><th scope="col">指标</th>{methods.map((method) => <th scope="col" key={method}>{method}</th>)}</tr>
          </thead>
          <tbody>
            {datasets.flatMap((dataset) => metrics.map((metric, metricIndex) => (
              <tr key={`${dataset}-${metric}`}>
                {metricIndex === 0 ? <th scope="rowgroup" rowSpan={4}>{dataset}</th> : null}
                <th scope="row">{metric}</th>
                {methods.map((method) => {
                  const selected = dataset === state.dataset && metric === state.metric && (method === state.baseline || method === 'MGCN');
                  return <td key={method} aria-current={selected ? 'true' : undefined}><strong>{method === 'MGCN' ? format4(table2[dataset][metric][method]) : null}</strong>{method !== 'MGCN' ? format4(table2[dataset][metric][method]) : null}</td>;
                })}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <div className="ctrl" role="group" aria-label="结果判断">
        <span>能否把 Baby Recall@20 与 Clothing NDCG@20 放在同一比赛轴上？</span>
        <button type="button" onClick={() => setState((s) => ({ ...s, protocolChanged: false }))}>不能，数据集与指标都不同</button>
      </div>
      <div className="feedback">协议：Amazon Baby、Sports、Clothing；训练/验证/测试随机划分为 8:1:1；对测试用户执行全量排序并取平均。视觉特征 4096 维，文本特征 384 维。当前精确单元格：MGCN {format4(currentRow.MGCN)}。</div>
    </div>
  );
};

export default MgcnResultRace;
