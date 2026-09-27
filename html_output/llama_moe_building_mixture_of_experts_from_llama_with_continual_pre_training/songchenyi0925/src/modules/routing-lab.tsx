import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';
const W = 1080;

function bg(ctx: CanvasRenderingContext2D, h: number) { ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, h); ctx.fillStyle = '#edf3e8'; ctx.fillRect(0, h * 0.68, W, h * 0.32); }
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, active = false) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.strokeStyle = active ? color : LINE; ctx.lineWidth = active ? 4 : 1; ctx.strokeRect(x, y, w, h); }
function stand(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, active = false) { ctx.fillStyle = active ? color : '#dfe7ea'; ctx.fillRect(x - 12, y - 32, 24, 50); ctx.strokeStyle = active ? color : LINE; ctx.lineWidth = active ? 4 : 1; ctx.strokeRect(x - 12, y - 32, 24, 50); ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x, y + 36); ctx.stroke(); }

const CONFIGS = [
  { label: '2/16', k: 2, n: 16, active: 3.0 },
  { label: '4/16', k: 4, n: 16, active: 3.5 },
  { label: '2/8', k: 2, n: 8, active: 3.5 },
] as const;

const RouteModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(1);
  const c = CONFIGS[idx];
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 280; const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      bg(ctx, H); box(ctx, 54, 108, 106, 50, '#fff'); ctx.fillStyle = BLUE; ctx.font = '18px "Segoe UI", sans-serif'; ctx.fillText('token', 78, 140);
      box(ctx, 246, 100, 110, 66, '#fff'); ctx.fillStyle = BLUE; ctx.fillText('Gate', 282, 140);
      for (let i = 0; i < c.n; i++) {
        const y = 30 + (i % 8) * 26; const x = i < 8 ? 510 : 770; const active = i < c.k;
        stand(ctx, x, y + 20, active ? GREEN : BLUE, active);
        ctx.strokeStyle = active ? GREEN : LINE; ctx.lineWidth = active ? 3 : 1;
        ctx.beginPath(); ctx.moveTo(356, 133); ctx.quadraticCurveTo(430, y + 28, x, y + 20); ctx.stroke();
      }
      box(ctx, 930, 106, 104, 54, '#fff');
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [c]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row">{CONFIGS.map((x, i) => <button key={x.label} className={`chip ${i === idx ? 'selected' : ''}`} onClick={() => setIdx(i)}>{x.label}</button>)}</div><div className="feedback good">{`每个 token 选择 ${c.k} 个专家，共 ${c.n} 个专家。`}</div></div>;
};

const ParameterModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(1); const c = CONFIGS[idx];
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 260; const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      bg(ctx, H); ctx.fillStyle = '#21324a'; ctx.font = '18px "Segoe UI", sans-serif'; ctx.fillText('总参数', 76, 82); ctx.fillText('激活参数', 76, 150);
      ctx.fillStyle = '#e6ebee'; ctx.fillRect(196, 60, 760, 28); ctx.fillStyle = BLUE; ctx.fillRect(196, 60, 760 * (7 / 7), 28);
      ctx.fillStyle = '#e6ebee'; ctx.fillRect(196, 128, 760, 28); ctx.fillStyle = GREEN; ctx.fillRect(196, 128, 760 * (c.active / 7), 28);
      for (let i = 0; i < c.n; i++) stand(ctx, 220 + i * (c.n > 8 ? 34 : 62), 222, i < c.k ? BLUE : '#dfe7ea', i < c.k);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [c]);
  const meta = c.label === '2/16' ? '总参数约 7B，激活参数约 3.0B（2 个专家）。' : '总参数约 7B，激活参数约 3.5B。';
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="ctrl"><label>配置 <span className="val">{c.label}</span></label><input type="range" min={0} max={2} step={1} value={idx} onChange={(e) => setIdx(Number(e.target.value))} /></div><div className={`feedback ${c.label === '2/16' ? '' : 'good'}`}>{meta}</div></div>;
};

const ConstructionModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [method, setMethod] = useState<'random'|'cluster'|'inner'|'inter'>('random');
  const names = { random: '独立随机', cluster: '独立聚类', inner: '内共享', inter: '外共享' } as const;
  const feedback = method === 'random'
    ? { cls: 'good', text: '把 32 个神经元完整、互斥地分成 4 个专家；论文当前预算下，独立随机的平均分数最好。' }
    : method === 'cluster'
    ? { cls: '', text: '聚类先按 up 投影行向量的相似性排布神经元，再切出连续簇；论文中表现低于独立随机。' }
    : method === 'inner'
    ? { cls: '', text: '每个专家选择自己数据簇中的 8 个高重要度神经元；相邻专家可以共享同一神经元，紫色表示重叠。' }
    : { cls: '', text: '先保留一个所有专家共享的重要神经元池，各专家再补充少量独享神经元；共享会降低专家独立性。' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 280; const ctx = setupCanvas(canvas, W, H);
    const colors = ['#27446e', '#228d5c', '#4d7aa8', '#76906a'];
    const x0 = 86, cellW = 25, step = 29;
    const drawCell = (row: number, index: number, color: string, shared = false) => {
      const x = x0 + index * step; const y = 100 + row * 38;
      ctx.fillStyle = shared ? '#e9ddff' : color; ctx.fillRect(x, y, cellW, 24);
      ctx.strokeStyle = shared ? PURPLE : color; ctx.lineWidth = shared ? 3 : 2; ctx.strokeRect(x, y, cellW, 24);
    };
    const draw = () => {
      bg(ctx, H);
      ctx.fillStyle = '#e8eef2'; ctx.fillRect(x0 - 8, 48, 32 * step + 4, 210);
      for (let i = 0; i < 32; i++) { ctx.fillStyle = '#dfe7ea'; ctx.fillRect(x0 + i * step, 54, cellW, 28); ctx.strokeStyle = LINE; ctx.strokeRect(x0 + i * step, 54, cellW, 28); }
      if (method === 'random') {
        const order = [0,13,26,7,19,3,30,11,22,9,16,1,28,6,24,14,4,18,31,10,21,2,27,15,8,23,5,29,12,25,17,20];
        order.forEach((idx, pos) => { const row = Math.floor(pos / 8); drawCell(row, idx, colors[row]); });
      } else if (method === 'cluster') {
        for (let e = 0; e < 4; e++) { ctx.fillStyle = `${colors[e]}18`; ctx.fillRect(x0 + e * 8 * step - 6, 94, 8 * step + 8, 36); for (let j = 0; j < 8; j++) drawCell(e, e * 8 + j, colors[e]); }
      } else if (method === 'inner') {
        const sets = [[0,1,2,3,4,5,6,7],[6,7,8,9,10,11,12,13],[12,13,14,15,16,17,18,19],[18,19,20,21,22,23,24,25]];
        const overlapped = sets.flat().filter((v, i, a) => a.indexOf(v) !== i);
        for (let e = 0; e < 4; e++) sets[e].forEach((idx) => drawCell(e, idx, colors[e], overlapped.includes(idx)));
        overlapped.forEach((idx) => { const xs = sets.map((s, e) => s.includes(idx) ? e : -1).filter((e) => e >= 0); ctx.strokeStyle = PURPLE; ctx.lineWidth = 2; ctx.beginPath(); xs.forEach((e, i) => { const x = x0 + idx * step + cellW / 2; const y = 112 + e * 38; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); });
      } else {
        for (let i = 10; i <= 15; i++) { ctx.fillStyle = '#e9ddff'; ctx.fillRect(x0 + i * step, 52, cellW, 26); ctx.strokeStyle = PURPLE; ctx.lineWidth = 3; ctx.strokeRect(x0 + i * step, 52, cellW, 26); }
        const unique = [[0,1],[16,17],[22,23],[30,31]];
        for (let e = 0; e < 4; e++) { unique[e].forEach((idx) => drawCell(e, idx, colors[e])); for (let i = 10; i <= 15; i++) drawCell(e, i, colors[e], true); const sx = x0 + 10 * step + 70; const sy = 84; const ex = x0 + 6 * step; const ey = 112 + e * 38; ctx.strokeStyle = PURPLE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(480, 78 + e * 34, ex, ey); ctx.stroke(); }
      }
      ctx.fillStyle = BLUE; ctx.fillRect(920, 42, 18, 18); ctx.fillStyle = '#68778f'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText('独享', 944, 56);
      ctx.fillStyle = PURPLE; ctx.fillRect(996, 42, 18, 18); ctx.fillStyle = '#68778f'; ctx.fillText('共享', 1020, 56);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [method]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row">{(Object.keys(names) as Array<keyof typeof names>).map((m) => <button key={m} className={`chip ${method === m ? 'selected' : ''}`} onClick={() => setMethod(m)}>{names[m]}</button>)}</div><div className={`feedback ${feedback.cls}`}>{feedback.text}</div></div>;
};

const RescaleModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => { if (!started) return; const s = performance.now(); let raf = 0; const tick = (now: number) => { const p = clamp((now - s) / 1800, 0, 1); setT(easeOutCubic(p)); if (p < 1) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [started]);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 280; const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      bg(ctx, H);
      const panels = [{ x: 130, label: '无缩放', color: RED, vals: [21.76, 34.56] }, { x: 620, label: '有缩放', color: GREEN, vals: [28.5, 51.04] }];
      panels.forEach((panel) => {
        ctx.strokeStyle = LINE; ctx.strokeRect(panel.x - 50, 54, 350, 184);
        ctx.fillStyle = BLUE; ctx.font = '18px "Segoe UI", sans-serif'; ctx.fillText(panel.label, panel.x - 34, 78);
        panel.vals.forEach((v, i) => { const start = i === 0 ? 21.76 : 34.56; const shown = start + (v - start) * t; const baseH = start / 60 * 145; const h = shown / 60 * 145; const bx = panel.x + i * 155; ctx.setLineDash([5, 4]); ctx.strokeStyle = '#9aa8b8'; ctx.lineWidth = 2; ctx.strokeRect(bx, 218 - baseH, 78, baseH); ctx.setLineDash([]); ctx.fillStyle = panel.color; ctx.fillRect(bx, 218 - h, 78, h); ctx.strokeStyle = panel.color; ctx.lineWidth = 2; ctx.strokeRect(bx, 218 - h, 78, h); });
      });
      ctx.fillStyle = '#9aa8b8'; ctx.fillRect(455, 34, 14, 14); ctx.fillStyle = '#68778f'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText('ARC', 474, 45);
      ctx.fillStyle = '#c6d0d8'; ctx.fillRect(525, 34, 14, 14); ctx.fillStyle = '#68778f'; ctx.fillText('Hella', 544, 45);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [t]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row"><button className="chip selected" onClick={() => { setT(0); setStarted(true); }}>{started ? '再次对比' : '开始对比'}</button></div><div className={`feedback ${started ? 'good' : ''}`}>{started ? '5B-token 消融：ARC 21.76→28.5，Hella 34.56→51.04。灰色虚线是起始基线；这里只说明该消融设置。' : '点击开始对比，观察 N/k 重标定前后的两项分数。'}</div></div>;
};

export const RoutingLab: React.FC<WidgetProps> = (props) => {
  const m = props.moduleId;
  return useMemo(() => m === '4.1' ? <RouteModule {...props} /> : m === '4.2' ? <ParameterModule {...props} /> : m === '5.1' ? <ConstructionModule {...props} /> : <RescaleModule {...props} />, [m]);
};
export default RoutingLab;
