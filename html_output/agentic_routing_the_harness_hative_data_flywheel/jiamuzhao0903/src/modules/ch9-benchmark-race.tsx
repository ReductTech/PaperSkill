import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawLegend,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

const W = 560;
const H = 260;
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const MUTED = '#d7deea';
const PLOT_LEFT = 208;
const PLOT_RIGHT = 527;
const MARKER_INSET = 10;

type Scenario = 'pinch-single' | 'draco-single' | 'draco-multi-ddg' | 'pinch-multi' | 'draco-dynamic-ddg';
type RaceState = { scenario: Scenario; running: boolean; progress: number };
type ResultRow = {
  method: string;
  score: number;
  scoreText: string;
  cost: number;
  costText: string;
  tokensText: string;
  p50: number | null;
  p50Text: string;
  p95Text: string;
  coverage: string;
};
type ScenarioCard = {
  id: Scenario;
  label: string;
  protocol: string;
  scale: string;
  rows: ResultRow[];
  conclusion: string;
  boundary: string;
};

const CARDS: ScenarioCard[] = [
  {
    id: 'pinch-single',
    label: 'PinchBench 单模型',
    protocol: 'PinchBench v1.2.1；mean score ↑；平均实付 USD/task ↓；总 token K ↓',
    scale: 'OpenClaw 与 OPENSQUILLA 的 Harness/agent 不同；本卡不作延迟结论',
    rows: [
      { method: 'OpenClaw Opus 4.8', score: 93.35, scoreText: '93.35', cost: 0.2224, costText: '$0.2224', tokensText: '187.7K', p50: null, p50Text: '本卡不报告', p95Text: '本卡不报告', coverage: '本卡未列' },
      { method: 'OPENSQUILLA Agentic routing', score: 93.14, scoreText: '93.14', cost: 0.0204, costText: '$0.0204', tokensText: '51.3K', p50: null, p50Text: '本卡不报告', p95Text: '本卡不报告', coverage: '本卡未列' },
    ],
    conclusion: '相对固定 OpenClaw Opus 点保留 99.77% 分数，单任务成本约低 10.9×；Harness 差异必须保留。',
    boundary: '不能把跨 Harness 差额全部归因于路由。',
  },
  {
    id: 'draco-single',
    label: 'DRACO 单模型',
    protocol: '同一 OPENSQUILLA Harness；DRACO native mean score ↑；阈值 0.95；USD/task ↓',
    scale: '总 token K ↓；本卡不补造延迟',
    rows: [
      { method: 'OPENSQUILLA Opus 4.8', score: 52.36, scoreText: '52.36', cost: 0.6559, costText: '$0.6559', tokensText: '103.5K', p50: null, p50Text: '本卡不报告', p95Text: '本卡不报告', coverage: '本卡未列' },
      { method: 'OPENSQUILLA Agentic routing', score: 52.33, scoreText: '52.33', cost: 0.3729, costText: '$0.3729', tokensText: '108.6K', p50: null, p50Text: '本卡不报告', p95Text: '本卡不报告', coverage: '本卡未列' },
    ],
    conclusion: '保留 99.94% 分数并降低 43.15% 成本；token 略高，节省不能等同于 token 变少。',
    boundary: '同一 Harness 支持聚合前沿比较，不支持逐路由因果分解。',
  },
  {
    id: 'draco-multi-ddg',
    label: 'DRACO 多模型 · DuckDuckGo',
    protocol: 'DRACO native score ↑；默认 DuckDuckGo；USD/task、p50/p95 秒 ↓；coverage 必显',
    scale: '不同覆盖不得补齐；token 保留论文 Table 3 的报告值',
    rows: [
      { method: 'Fable 5', score: 59.8, scoreText: '59.80', cost: 1.2122, costText: '$1.2122', tokensText: '93.7K', p50: 187.7, p50Text: '187.7s', p95Text: '343.5s', coverage: '94/100' },
      { method: 'Selected ensemble', score: 60.82, scoreText: '60.82', cost: 0.3766, costText: '$0.3766', tokensText: '579.7K', p50: 535.5, p50Text: '535.5s', p95Text: '3097.0s', coverage: '100/100' },
    ],
    conclusion: '所选集合在已报告点上质量更高、货币成本更低，但墙钟延迟显著更高且覆盖不等。',
    boundary: 'Fable 的 94 个完成任务不能擅自补成 100 个。',
  },
  {
    id: 'pinch-multi',
    label: 'PinchBench 多模型',
    protocol: 'PinchBench normalized score [0,1] ↑；USD/task、token K、p50/p95 秒 ↓',
    scale: '不得与 93.xx 的 PinchBench 单模型卡共用分数轴',
    rows: [
      { method: 'Opus 4.8', score: 0.9433, scoreText: '0.9433', cost: 0.1649, costText: '$0.1649', tokensText: '97.7K', p50: 23.1, p50Text: '23.1s', p95Text: '150.1s', coverage: '本卡未列' },
      { method: 'Selected ensemble', score: 0.9431, scoreText: '0.9431', cost: 0.1349, costText: '$0.1349', tokensText: '272.4K', p50: 96, p50Text: '96.0s', p95Text: '223.7s', coverage: '本卡未列' },
    ],
    conclusion: '质量近乎持平、货币成本低 18.2%，同时付出更高 token 与延迟。',
    boundary: '正文称质量差 0.0003，表格四舍五入值相差 0.0002；本页保留原始表值。',
  },
  {
    id: 'draco-dynamic-ddg',
    label: 'DRACO 动态路由 · DuckDuckGo',
    protocol: 'GLM 5.2 固定聚合器；score ↑；按 judged task 平均的 cost/token/latency ↓',
    scale: 'coverage 是被裁判任务/尝试任务，必须显示',
    rows: [
      { method: 'Control', score: 59.18, scoreText: '59.18', cost: 0.3249, costText: '$0.3249', tokensText: '650.4K', p50: 881.7, p50Text: '881.7s', p95Text: '3122.6s', coverage: '100/100' },
      { method: 'Diversity-heavy', score: 60.31, scoreText: '60.31', cost: 0.3172, costText: '$0.3172', tokensText: '586.6K', p50: 837.1, p50Text: '837.1s', p95Text: '2682.6s', coverage: '99/100' },
      { method: 'Quality-heavy', score: 59.93, scoreText: '59.93', cost: 0.2582, costText: '$0.2582', tokensText: '721.3K', p50: 1023, p50Text: '1023.0s', p95Text: '2439.0s', coverage: '100/100' },
    ],
    conclusion: 'Diversity-heavy 是已报告动态路由中的最高分点但覆盖 99/100；Quality-heavy 是另一低货币成本点。',
    boundary: '运行时组装的动态政策不能冒充按 benchmark 预选的固定集合。',
  },
];

const INITIAL: RaceState = { scenario: 'pinch-single', running: false, progress: 0 };

const localNorm = (value: number, values: number[]) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

const fitCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const glyphs = Array.from(text);
  const suffix = '…';
  let low = 0;
  let high = glyphs.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (ctx.measureText(`${glyphs.slice(0, middle).join('')}${suffix}`).width <= maxWidth) low = middle;
    else high = middle - 1;
  }
  return `${glyphs.slice(0, low).join('')}${suffix}`;
};

export const Ch9BenchmarkRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RaceState>(INITIAL);
  const [state, setState] = useState<RaceState>(INITIAL);

  const commit = (next: RaceState) => {
    stateRef.current = next;
    setState(next);
  };
  const selectScenario = (scenario: Scenario) => {
    if (stateRef.current.running) return;
    commit({ scenario, running: false, progress: 0 });
  };
  const reset = () => commit({ scenario: stateRef.current.scenario, running: false, progress: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = 'min(100%, 560px)';
    canvas.style.height = 'auto';
    let raf: number | null = null;
    let last = performance.now();

    const renderTrack = (label: string, y: number, rows: ResultRow[], values: number[], getter: (row: ResultRow) => number, higher: boolean, colors: string[]) => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(16, y, 528, 40);
      ctx.strokeStyle = MUTED;
      ctx.strokeRect(16, y, 528, 40);
      ctx.fillStyle = '#21324a';
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText(label, 24, y + 15);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PLOT_LEFT, y + 24);
      ctx.lineTo(PLOT_RIGHT, y + 24);
      ctx.stroke();
      rows.forEach((row, index) => {
        const x = PLOT_LEFT + MARKER_INSET
          + localNorm(getter(row), values) * (PLOT_RIGHT - PLOT_LEFT - MARKER_INSET * 2);
        ctx.fillStyle = colors[index] ?? BLUE;
        ctx.beginPath();
        ctx.arc(x, y + 24, index === 1 ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(String(index + 1), x - 3, y + 10);
      });
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(higher ? '较低' : '较优', PLOT_LEFT, y + 37);
      ctx.textAlign = 'right';
      ctx.fillText(higher ? '较高' : '较差', PLOT_RIGHT, y + 37);
      ctx.textAlign = 'left';
    };

    const render = (s: RaceState) => {
      const card = CARDS.find((item) => item.id === s.scenario) ?? CARDS[0];
      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 34, 544, 216);
      drawStudioLabel(ctx, card.label, 16, 20, 'left');
      drawLegend(ctx, [{ label: '基线/对照', color: BLUE }, { label: '路由结果', color: ORANGE }], 352, 20);
      ctx.fillStyle = '#fff';
      ctx.fillRect(12, 42, 536, 28);
      ctx.strokeStyle = RED;
      ctx.strokeRect(12, 42, 536, 28);
      ctx.fillStyle = RED;
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText(fitCanvasText(ctx, card.protocol, 520), 20, 60);

      const colors = card.rows.map((_, index) => index === 0 ? BLUE : index === 1 ? ORANGE : PURPLE);
      renderTrack('质量 ↑（仅本卡局部刻度）', 78, card.rows, card.rows.map((row) => row.score), (row) => row.score, true, colors);
      renderTrack('货币成本 ↓（仅本卡局部刻度）', 124, card.rows, card.rows.map((row) => row.cost), (row) => row.cost, false, colors);
      const rowsWithLatency = card.rows.filter((row) => row.p50 !== null);
      if (rowsWithLatency.length > 0) {
        renderTrack('p50 延迟 ↓（仅本卡局部刻度）', 170, rowsWithLatency, rowsWithLatency.map((row) => row.p50 ?? 0), (row) => row.p50 ?? 0, false, colors);
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(16, 170, 528, 40);
        ctx.strokeStyle = MUTED;
        ctx.strokeRect(16, 170, 528, 40);
        ctx.fillStyle = '#68778f';
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText('p50 / p95 延迟：本卡不报告，因此不填 0、不作结论', 24, 195);
      }
      drawTargetBand(ctx, 410, 216, 126, 12);
      ctx.fillStyle = RED;
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText(fitCanvasText(ctx, `覆盖/边界：${card.scale}`, 374), 20, 236);

      if (s.progress > 0) {
        const x = PLOT_LEFT + s.progress * (PLOT_RIGHT - PLOT_LEFT);
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, 78);
        ctx.lineTo(x, 210);
        ctx.stroke();
        ctx.fillStyle = ORANGE;
        ctx.fillRect(x - 7, 78, 14, 8);
      }
      if (s.progress >= 1) {
        ctx.fillStyle = GREEN;
        ctx.font = '700 12px "Segoe UI", sans-serif';
        ctx.fillText('该协议卡已结算 ✓', 414, 244);
      }
    };

    const tick = (now: number) => {
      const current = stateRef.current;
      if (current.running) {
        const progress = clamp(current.progress + (now - last) / 2600, 0, 1);
        const next: RaceState = progress >= 1
          ? { ...current, running: false, progress: 1 }
          : { ...current, running: true, progress };
        stateRef.current = next;
        setState(next);
      }
      last = now;
      render(stateRef.current);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      last = performance.now();
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const card = CARDS.find((item) => item.id === state.scenario) ?? CARDS[0];
  const feedback = state.running
    ? { cls: '', text: '比较进行中：质量向右更好，成本与延迟向左更好；两条轴不能合并成一个冠军。' }
    : state.progress >= 1
      ? { cls: 'good', text: '论文展示的是一组更好的操作点，而不是所有场景都无条件获胜。' }
      : { cls: 'bad', text: '请先看协议边界：不同 Harness、搜索提供商、覆盖率或分数尺度不能直接混赛。' };

  return (
    <div onKeyDown={(event) => { if (event.key === 'Escape') reset(); }}>
      <div className="chip-row" role="group" aria-label="锁定实验协议">
        {CARDS.map((item) => (
          <button key={item.id} type="button" className={`chip ${state.scenario === item.id ? 'selected' : ''}`} aria-pressed={state.scenario === item.id} disabled={state.running} onClick={() => selectScenario(item.id)}>{item.label}</button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="只在当前实验协议卡内比较质量、货币成本和延迟" />
      <div className="step-ctrl">
        <button type="button" className="tiny" disabled={state.running} onClick={() => commit({ scenario: state.scenario, running: true, progress: 0 })}>{state.progress >= 1 ? '再次比较' : '开始比较'}</button>
        <button type="button" className="tiny ghost" onClick={reset}>重置</button>
        <span className="step-label"><b>{Math.round(state.progress * 100)}%</b> · 只在本卡内</span>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
      <div className="hotspot-info"><b>协议：</b>{card.protocol}。{card.scale}</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="paper">
          <thead><tr><th>方法</th><th>分数 ↑</th><th>USD/task ↓</th><th>Token K ↓</th><th>p50 ↓</th><th>p95 ↓</th><th>覆盖</th></tr></thead>
          <tbody>
            {card.rows.map((row) => <tr key={row.method}><td>{row.method}</td><td>{row.scoreText}</td><td>{row.costText}</td><td>{row.tokensText}</td><td>{row.p50Text}</td><td>{row.p95Text}</td><td>{row.coverage}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="feedback good"><b>本卡可支持：</b>{card.conclusion}</div>
      <div className="feedback bad"><b>本卡边界：</b>{card.boundary}</div>

      <div className="hotspot-info"><b>同协议补充旁证（默认 DuckDuckGo）：</b>Hermes MoA 为 59.55 / $0.4460 / 100/100、无 judge errors；Selected ensemble 为 60.82 / $0.3766 / 100/100。只在论文评估的同一默认 DRACO 配置中比较，不扩展成一般 MoA 结论。</div>

      <h5 style={{ marginTop: 18 }}>DRACO 多模型 · Brave（禁止与 DuckDuckGo 连线）</h5>
      <div style={{ overflowX: 'auto' }}>
        <table className="paper">
          <thead><tr><th>方法</th><th>分数 ↑</th><th>USD/task ↓</th><th>Token K ↓</th><th>p50 ↓</th><th>p95 ↓</th><th>覆盖</th></tr></thead>
          <tbody>
            <tr><td>Fable 5</td><td>62.06</td><td>$1.3241</td><td>106.7K</td><td>126.5s</td><td>206.3s</td><td>93/100</td></tr>
            <tr><td>Selected ensemble</td><td>64.09</td><td>$0.1218</td><td>500.1K</td><td>656.8s</td><td>2096.0s</td><td>100/100</td></tr>
          </tbody>
        </table>
      </div>
      <div className="feedback bad">Brave 卡内所有值都属于 Brave；Fable 的质量、成本、token 与延迟按完成的 93 个任务平均。该卡不能用来解释 DuckDuckGo 差值。</div>

      <div className="hotspot-info"><b>适用性判断：</b>只有在同一 benchmark、Harness、provider、覆盖口径和预算下同时查看质量、实付成本、token 与 p50/p95，才可说“该协议内前沿更好”；跨协议拼榜、隐藏未完成任务或延迟时，结论失效。</div>
    </div>
  );
};
