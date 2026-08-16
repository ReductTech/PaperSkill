import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const MAIN_W = 560;
const MAIN_H = 290;
const MINI_W = 244;
const MINI_H = 130;
const COLORS = {
  desk: '#f5f8f0', paper: '#ffffff', shadow: '#b8c9a7', contour: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea'
};
const EDGE_COLORS = ['#050505', '#dc2626', '#eab308', '#16a34a', '#06b6d4', '#2563eb', '#c026d3', '#f8fafc'];
const EDGE_NAMES = ['黑→红', '红→黄', '黄→绿', '绿→青', '青→蓝', '蓝→品红', '品红→白'];
type RgbPoint = [number, number, number];
const RGB_PATH_POINTS: RgbPoint[] = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 1, 1], [0, 0, 1], [1, 0, 1], [1, 1, 1],
];

type DepthStage = 'encode' | 'color' | 'decode';
interface DepthState {
  d: number;
  inputText: string;
  isLimit: boolean;
  lambda: number;
  c: number;
  stage: DepthStage;
  f: number;
  pathPosition: number;
  segmentIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  localT: number;
  rgb: [number, number, number];
  projectedF: number | null;
  decodedD: number | null;
  inputError: string | null;
}

function depthToF(d: number, lambda = -3, c = 10 / 3) {
  return 1 - Math.pow(1 - d / (lambda * c), lambda + 1);
}

function rgbOnPath(f: number) {
  const s = clamp(f, 0, 0.999999) * 7;
  const index = Math.min(6, Math.floor(s)) as DepthState['segmentIndex'];
  const t = s - index;
  const a = RGB_PATH_POINTS[index];
  const b = RGB_PATH_POINTS[index + 1];
  const rgb = a.map((v, channel) => Math.round(255 * lerp(v, b[channel], t))) as [number, number, number];
  return { s, index, t, rgb };
}

function projectedF(rgb: [number, number, number], index: number) {
  const [r, g, b] = rgb.map((v) => v / 255);
  const local = [r, g, 1 - r, b, 1 - g, r, g][index];
  return (index + clamp(local, 0, 1)) / 7;
}

function inverseDepth(f: number, lambda = -3, c = 10 / 3) {
  return lambda * c * (1 - Math.pow(1 - clamp(f, 0, 0.999999), 1 / (lambda + 1)));
}

function buildDepthState(d: number, stage: DepthStage = 'encode'): DepthState {
  const f = depthToF(d);
  const encoded = rgbOnPath(f);
  const pf = projectedF(encoded.rgb, encoded.index);
  return {
    d, inputText: String(d), isLimit: false, lambda: -3, c: 10 / 3, stage,
    f, pathPosition: encoded.s, segmentIndex: encoded.index, localT: encoded.t,
    rgb: encoded.rgb, projectedF: stage === 'decode' ? pf : null,
    decodedD: stage === 'decode' ? inverseDepth(pf) : null,
    inputError: null
  };
}

function compactMode(moduleId: string) {
  return !/^\d+(\.\d+)?$/.test(moduleId);
}

function paper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = COLORS.shadow;
  ctx.fillRect(x + 3, y + 4, w, h);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function seal(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.strokeStyle = COLORS.green;
  ctx.fillStyle = 'rgba(34,141,92,.10)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COLORS.green; ctx.font = 'bold 10px Segoe UI, sans-serif';
  ctx.textAlign = 'center'; ctx.fillText(text, x, y + 3); ctx.textAlign = 'left';
}

function projectRgb([r, g, b]: RgbPoint) {
  return {
    x: 378 + r * 82 + g * 58,
    y: 190 + r * 18 - g * 32 - b * 82,
  };
}

function fillRgbFace(ctx: CanvasRenderingContext2D, points: ReturnType<typeof projectRgb>[], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
}

function drawRgbCube(ctx: CanvasRenderingContext2D, state: DepthState) {
  const points = RGB_PATH_POINTS.map(projectRgb);
  fillRgbFace(ctx, [points[0], points[1], points[6], points[5]], 'rgba(220, 38, 38, 0.035)');
  fillRgbFace(ctx, [points[0], points[3], points[4], points[5]], 'rgba(22, 163, 74, 0.04)');
  fillRgbFace(ctx, [points[5], points[6], points[7], points[4]], 'rgba(37, 99, 235, 0.05)');

  const cubeEdges: Array<[number, number]> = [
    [0, 1], [0, 3], [0, 5], [1, 2], [1, 6], [2, 3],
    [2, 7], [3, 4], [4, 5], [4, 7], [5, 6], [6, 7],
  ];
  ctx.strokeStyle = '#aebbc9';
  ctx.lineWidth = 1.25;
  cubeEdges.forEach(([from, to]) => {
    ctx.beginPath();
    ctx.moveTo(points[from].x, points[from].y);
    ctx.lineTo(points[to].x, points[to].y);
    ctx.stroke();
  });

  ctx.lineCap = 'round';
  RGB_PATH_POINTS.slice(0, -1).forEach((_, index) => {
    const from = points[index];
    const to = points[index + 1];
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
    const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
    gradient.addColorStop(0, EDGE_COLORS[index]);
    gradient.addColorStop(1, EDGE_COLORS[index + 1]);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  });
  ctx.lineCap = 'butt';

  const start = RGB_PATH_POINTS[state.segmentIndex];
  const end = RGB_PATH_POINTS[state.segmentIndex + 1];
  const current3d: RgbPoint = [
    lerp(start[0], end[0], state.localT),
    lerp(start[1], end[1], state.localT),
    lerp(start[2], end[2], state.localT),
  ];
  const current = projectRgb(current3d);
  ctx.fillStyle = `rgb(${state.rgb.join(',')})`;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(current.x, current.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(current.x, current.y, 10, 0, Math.PI * 2); ctx.stroke();

  ctx.font = '700 11px Segoe UI, sans-serif';
  ctx.fillStyle = '#b91c1c'; ctx.fillText('R', points[1].x - 3, points[1].y + 16);
  ctx.fillStyle = '#15803d'; ctx.fillText('G', points[2].x + 8, points[2].y + 5);
  ctx.fillStyle = '#1d4ed8'; ctx.fillText('B', points[5].x - 16, points[5].y + 5);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '10px Segoe UI, sans-serif';
  ctx.fillText('黑', points[0].x - 15, points[0].y + 14);
  ctx.fillText('白', points[7].x + 8, points[7].y - 5);
  return current;
}

function drawMini(ctx: CanvasRenderingContext2D, now: number, reduced: boolean) {
  ctx.clearRect(0, 0, MINI_W, MINI_H);
  ctx.fillStyle = COLORS.desk; ctx.fillRect(0, 0, MINI_W, MINI_H);
  paper(ctx, 10, 18, 224, 96);
  ctx.strokeStyle = COLORS.contour; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(28, 80); ctx.bezierCurveTo(68, 32, 118, 96, 154, 48); ctx.stroke();
  const legend = ['#050505', '#dc2626', '#eab308', '#16a34a', '#06b6d4', '#2563eb', '#c026d3'];
  legend.forEach((color, i) => { ctx.fillStyle = color; ctx.fillRect(162 + i * 9, 75, 9, 13); });
  const p = reduced ? 0.83 : (now % 3200) / 3200;
  const move = p < .25 ? p / .25 : p < .57 ? (p - .25) / .32 : 1;
  const x = lerp(54, 185, clamp(move, 0, 1));
  const y = lerp(62, 63, clamp(move, 0, 1));
  ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x - 10, y + 13); ctx.moveTo(x, y - 20); ctx.lineTo(x + 10, y + 13); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - 20, 3, 0, Math.PI * 2); ctx.fillStyle = COLORS.orange; ctx.fill();
  if (p > .57 || reduced) { ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2; ctx.strokeRect(180, 70, 13, 23); }
  if (p > .78 || reduced) seal(ctx, 132, 90, '可解码');
}

function drawMain(ctx: CanvasRenderingContext2D, state: DepthState) {
  ctx.clearRect(0, 0, MAIN_W, MAIN_H);
  ctx.fillStyle = COLORS.desk; ctx.fillRect(0, 0, MAIN_W, MAIN_H);
  paper(ctx, 12, 12, 536, 228);
  ctx.fillStyle = COLORS.text; ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillText('米制距离 d', 28, 34); ctx.fillText('弯曲距离 f', 176, 34); ctx.fillText('三维 RGB 路径（论文图 5 视角）', 370, 34);

  ctx.strokeStyle = COLORS.contour; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(72, 52); ctx.lineTo(72, 216); ctx.stroke();
  [0, 1, 3, 10, 36].forEach((v) => {
    const fy = depthToF(v); const y = 214 - fy * 150;
    ctx.beginPath(); ctx.moveTo(66, y); ctx.lineTo(78, y); ctx.stroke();
    ctx.fillStyle = COLORS.muted; ctx.fillText(String(v), 40, y + 4);
  });
  ctx.fillText('∞', 42, 60);
  const fY = 214 - clamp(state.f, 0, .999) * 150;
  ctx.fillStyle = state.inputError ? COLORS.red : COLORS.orange;
  ctx.beginPath(); ctx.arc(72, fY, 6, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = COLORS.contour; ctx.beginPath(); ctx.moveTo(176, 160); ctx.lineTo(326, 160); ctx.stroke();
  for (let i = 0; i <= 4; i++) { const x = 176 + i * 37.5; ctx.beginPath(); ctx.moveTo(x, 155); ctx.lineTo(x, 165); ctx.stroke(); ctx.fillStyle = COLORS.muted; ctx.fillText((i / 4).toFixed(2), x - 10, 181); }
  const fX = 176 + clamp(state.f, 0, .999) * 150;
  ctx.fillStyle = COLORS.blue; ctx.beginPath(); ctx.arc(fX, 160, 6, 0, Math.PI * 2); ctx.fill();
  ctx.setLineDash([5, 4]); ctx.strokeStyle = COLORS.orange; ctx.beginPath(); ctx.moveTo(78, fY); ctx.lineTo(fX, 160); ctx.stroke(); ctx.setLineDash([]);

  ctx.strokeStyle = state.stage === 'encode' ? COLORS.border : COLORS.blue;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(334, 160); ctx.lineTo(362, 160); ctx.stroke();
  ctx.fillStyle = state.stage === 'encode' ? COLORS.border : COLORS.blue;
  ctx.beginPath(); ctx.moveTo(362, 155); ctx.lineTo(371, 160); ctx.lineTo(362, 165); ctx.fill();

  const rgbPoint = drawRgbCube(ctx, state);
  if (state.stage === 'decode') {
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(rgbPoint.x, rgbPoint.y); ctx.lineTo(fX, 160); ctx.stroke();
    ctx.setLineDash([]);
    seal(ctx, 350, 216, '可解码');
  }

  const nodes = ['d', 'f', 'RGB', 'd̂'];
  nodes.forEach((n, i) => {
    const x = 150 + i * 88; const y = 268; const active = i <= (state.stage === 'encode' ? 1 : state.stage === 'color' ? 2 : 3);
    ctx.fillStyle = active ? (i === 3 ? COLORS.green : COLORS.blue) : '#e5e7eb';
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = active ? '#fff' : COLORS.muted; ctx.textAlign = 'center'; ctx.fillText(n, x, y + 4); ctx.textAlign = 'left';
    if (i < 3) { ctx.strokeStyle = active ? COLORS.blue : COLORS.border; ctx.beginPath(); ctx.moveTo(x + 12, y); ctx.lineTo(x + 76, y); ctx.stroke(); }
  });
}

export const DepthColorBijection: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const compact = compactMode(moduleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<DepthState>(() => buildDepthState(3));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = compact ? MINI_W : MAIN_W;
    const height = compact ? MINI_H : MAIN_H;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf: number | null = null;
    const frame = (now: number) => {
      if (compact) drawMini(ctx, now, reduced); else drawMain(ctx, state);
      canvas.classList.add('is-ready');
      raf = compact && !reduced ? requestAnimationFrame(frame) : null;
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(frame); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [compact, state]);

  const feedback = useMemo(() => {
    if (state.inputError) return '距离 d 必须是大于或等于 0 的米制数值。';
    if (state.isLimit) return '当 d → ∞ 时，f → 1，路径逼近白色端点；这不是一个有限距离读数。';
    if (state.stage === 'encode') return `输入 d = ${state.d.toFixed(2)} m。弯曲后 f = ${state.f.toFixed(4)}；近处获得更细的颜色分辨率，远处逐渐压缩。`;
    if (state.stage === 'color') return `编码为 rgb(${state.rgb.join(', ')}，位于“${EDGE_NAMES[state.segmentIndex]}”路径段。`.replace('，位于', ')，位于');
    return `从最近 RGB 路径段反解得到 d̂ = ${(state.decodedD ?? 0).toFixed(2)} m；当前差值来自显示量化与舍入。`;
  }, [state]);

  const readoutStage = state.inputError
    ? '输入有误'
    : state.stage === 'encode'
      ? '当前：弯曲距离'
      : state.stage === 'color'
        ? '当前：RGB 路径编码'
        : '当前：反向解码完成';
  const readoutStageClass = state.inputError
    ? 'is-error'
    : state.stage === 'decode'
      ? 'is-success'
      : '';

  if (compact) return <canvas ref={canvasRef} width={MINI_W} height={MINI_H} aria-label="分规测量路线，并在颜色图例上找到可反解的位置" />;

  const chooseDistance = (value: number | 'inf') => {
    if (value === 'inf') {
      const encoded = rgbOnPath(.999999);
      setState({ ...buildDepthState(0), inputText: '∞', isLimit: true, f: 1, pathPosition: 7, segmentIndex: 6, localT: .999999, rgb: encoded.rgb, stage: 'color' });
    } else setState(buildDepthState(value));
  };
  const onInput = (value: string) => {
    const d = Number(value);
    if (value.trim() === '' || !Number.isFinite(d) || d < 0) setState((s) => ({ ...s, inputText: value, inputError: 'invalid', isLimit: false }));
    else setState({ ...buildDepthState(d), inputText: value });
  };
  const setStage = (stage: DepthStage) => {
    if (state.inputError || state.isLimit) return setState((s) => ({ ...s, stage }));
    setState(buildDepthState(state.d, stage));
  };

  return (
    <div>
      <figure className="paper-evidence-figure">
        <img src="/images/paper-depth-in-wild.png" alt="论文图 7 高分辨率局部：金阁寺手机照片、Vision Banana 深度图与 Google 地图测距" loading="lazy" />
        <figcaption>
          <strong>图 7｜真实场景的米制深度检查</strong>
          <span>模型从普通手机照片估计相机到金阁寺约 13.71 米；Google 地图测得约 12.87 米。这个案例提供直观校验，但不能替代六个基准上的定量结果。</span>
        </figcaption>
      </figure>
      <div className="ctrl" role="group" aria-label="距离编码控制">
        <label>距离 d（米） <input type="number" min="0" step="0.1" value={state.inputText} onChange={(e) => onInput(e.target.value)} aria-invalid={Boolean(state.inputError)} /></label>
        <span className="val">λ=-3</span><span className="val">c=10/3</span>
      </div>
      <div className="paper-choice-group" role="group" aria-label="距离预设">
        {[0,1,3,10,36].map((v) => <button key={v} type="button" aria-pressed={!state.isLimit && !state.inputError && state.d === v} onClick={() => chooseDistance(v)}>{v} m</button>)}
        <button type="button" aria-pressed={state.isLimit} onClick={() => chooseDistance('inf')}>d → ∞</button>
      </div>
      <div className="paper-step-group" role="group" aria-label="编码阶段">
        <button type="button" aria-current={state.stage === 'encode' ? 'step' : undefined} onClick={() => setStage('encode')}>① 弯曲距离</button>
        <button type="button" aria-current={state.stage === 'color' ? 'step' : undefined} onClick={() => setStage('color')}>② 沿颜色路径编码</button>
        <button type="button" aria-current={state.stage === 'decode' ? 'step' : undefined} onClick={() => setStage('decode')}>③ 反向解码</button>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MAIN_W} height={MAIN_H} style={{maxWidth:'100%',height:'auto'}} aria-label="米制距离经过幂变换、RGB 路径编码并反解回米数" />
      <div className={`feedback ${state.inputError ? 'bad' : state.stage === 'decode' ? 'good' : ''}`} role="status" aria-live="polite">{feedback}</div>
      <section className="paper-depth-readout" aria-label="距离编码的同步数值">
        <header className="paper-depth-readout-header">
          <div>
            <span>同步读数</span>
            <h4>距离编码的同步数值</h4>
          </div>
          <strong className={`paper-depth-stage-badge ${readoutStageClass}`}>{readoutStage}</strong>
        </header>
        <dl className="paper-depth-readout-grid">
          <div className="paper-depth-readout-card">
            <dt>输入距离</dt>
            <dd>{state.isLimit ? 'd → ∞' : `d = ${state.d.toFixed(2)} m`}</dd>
          </div>
          <div className={`paper-depth-readout-card ${state.stage === 'encode' ? 'is-active' : ''}`}>
            <dt>弯曲值</dt>
            <dd>{state.isLimit ? 'f → 1' : `f = ${state.f.toFixed(4)}`}</dd>
          </div>
          <div className={`paper-depth-readout-card ${state.stage === 'color' ? 'is-active' : ''}`}>
            <dt>所在路径段</dt>
            <dd>{EDGE_NAMES[state.segmentIndex]}</dd>
            <span className="paper-depth-color-strip" style={{ background: `linear-gradient(90deg, ${EDGE_COLORS[state.segmentIndex]}, ${EDGE_COLORS[state.segmentIndex + 1]})` }} aria-hidden="true" />
          </div>
          <div className={`paper-depth-readout-card ${state.stage === 'color' ? 'is-active' : ''}`}>
            <dt>编码颜色</dt>
            <dd>RGB ({state.rgb.join(', ')})</dd>
            <span className="paper-depth-color-strip" style={{ background: `rgb(${state.rgb.join(',')})` }} aria-hidden="true" />
          </div>
          <div className={`paper-depth-readout-card ${state.stage === 'decode' ? 'is-success' : 'is-waiting'}`}>
            <dt>反解距离</dt>
            <dd>{state.decodedD === null ? '等待反向解码' : `d̂ = ${state.decodedD.toFixed(2)} m`}</dd>
          </div>
        </dl>
      </section>
      <details className="paper-technical-details">
        <summary>技术细节：参数、颜色路径与使用边界</summary>
        <div className="paper-technical-details-body">
          <ul>
            <li>论文所有实验固定使用 λ=−3、c=10/3；λ 控制远距离压缩形状，c 控制弯曲尺度。</li>
            <li>归一化距离沿 RGB 立方体边缘的分段线性路径插值；解码时先投影到最近路径段，再反解弯曲函数。</li>
            <li>训练数据还使用 Plasma、Inferno、Viridis 与灰度色图做增强，但主映射的双射公式保持不变。</li>
            <li>深度预测本身不使用相机内参；只有将深度反投影为三维点云时才需要内参。</li>
          </ul>
        </div>
      </details>
      <details className="paper-technical-details paper-benchmark-details">
        <summary>查看论文表 6：完整深度评测与模型对比</summary>
        <div className="paper-technical-details-body">
          <section className="paper-benchmark-section">
            <h4>单目度量深度估计｜六个公开基准</h4>
            <p className="paper-benchmark-source">论文表 6；零样本迁移。δ₁ 越高越好，AbsRel 越低越好。</p>
            <div className="paper-table-scroll wide" role="region" aria-label="论文表6单目度量深度完整评测，可横向滚动" tabIndex={0}>
              <table className="paper" aria-label="单目度量深度模型对比">
                <thead>
                  <tr><th>数据或要求</th><th>指标</th><th>DepthLM-7B</th><th>Depth Anything V3</th><th>Depth Pro</th><th>UniK3D</th><th>MoGe-2</th><th>Vision Banana</th></tr>
                </thead>
                <tbody>
                  <tr><td>推理使用相机内参</td><td>—</td><td>✓</td><td>✓</td><td>—</td><td>—</td><td>—</td><td><strong>—</strong></td></tr>
                  <tr><td>训练使用相机内参</td><td>—</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td><strong>—</strong></td></tr>
                  <tr><td>所有基准平均</td><td>δ₁ ↑</td><td>部分*</td><td>部分*</td><td>0.715</td><td>0.823</td><td>0.802</td><td><strong>0.882</strong></td></tr>
                  <tr><td>所有基准平均</td><td>AbsRel ↓</td><td>—</td><td>—</td><td>—</td><td>0.156</td><td>0.144</td><td><strong>0.116</strong></td></tr>
                  <tr><td>NYU</td><td>δ₁ ↑</td><td>0.915</td><td>0.963</td><td>0.961</td><td>0.965</td><td>0.961</td><td><strong>0.948</strong></td></tr>
                  <tr><td>NYU</td><td>AbsRel ↓</td><td>—</td><td>0.070</td><td>—</td><td>0.074</td><td>0.0733</td><td><strong>0.081</strong></td></tr>
                  <tr><td>iBims1</td><td>δ₁ ↑</td><td>0.920</td><td>—</td><td>0.913</td><td>0.919</td><td>0.830</td><td><strong>0.934</strong></td></tr>
                  <tr><td>iBims1</td><td>AbsRel ↓</td><td>—</td><td>—</td><td>—</td><td>0.104</td><td>0.136</td><td><strong>0.078</strong></td></tr>
                  <tr><td>ETH3D</td><td>δ₁ ↑</td><td>0.718</td><td>0.917</td><td>0.415</td><td>0.687</td><td>0.908</td><td><strong>0.935</strong></td></tr>
                  <tr><td>ETH3D</td><td>AbsRel ↓</td><td>—</td><td>0.104</td><td>0.327</td><td>0.236</td><td>0.104</td><td><strong>0.103</strong></td></tr>
                  <tr><td>DIODE-Indoor</td><td>δ₁ ↑</td><td>—</td><td>0.838</td><td>0.671</td><td>0.713</td><td>0.664</td><td><strong>0.917</strong></td></tr>
                  <tr><td>DIODE-Indoor</td><td>AbsRel ↓</td><td>—</td><td>0.123</td><td>0.199</td><td>0.161</td><td>0.175</td><td><strong>0.108</strong></td></tr>
                  <tr><td>KITTI</td><td>δ₁ ↑</td><td>—</td><td>0.953</td><td>0.843‡</td><td>0.812</td><td>0.629</td><td><strong>0.915</strong></td></tr>
                  <tr><td>KITTI</td><td>AbsRel ↓</td><td>—</td><td>0.086</td><td>0.121‡</td><td>0.174</td><td>0.181</td><td><strong>0.107</strong></td></tr>
                  <tr><td>nuScenes</td><td>δ₁ ↑</td><td>0.865†</td><td>—</td><td>0.491</td><td>0.840</td><td>0.820</td><td><strong>0.643</strong></td></tr>
                  <tr><td>nuScenes</td><td>AbsRel ↓</td><td>—</td><td>—</td><td>0.287</td><td>0.189</td><td>0.195</td><td><strong>0.219</strong></td></tr>
                </tbody>
              </table>
            </div>
            <p className="paper-benchmark-note">* DepthLM-7B 与 Depth Anything V3 只报告各自覆盖的四个数据集；在 NYU、ETH3D、DIODE、KITTI 四个共同数据集上，Vision Banana 与 Depth Anything V3 的平均 δ₁ 分别为 0.929 和 0.918。† DepthLM 使用 nuScenes 训练。‡ 数值由 Depth Anything V3 论文报告。</p>
          </section>
        </div>
      </details>
    </div>
  );
};

export default DepthColorBijection;
