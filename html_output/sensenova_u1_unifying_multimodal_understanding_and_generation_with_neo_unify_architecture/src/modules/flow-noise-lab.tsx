import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C } from './studio-kit';

const W = 960;
const H = 540;
const PATCH = 32;
const BASE_TOKENS = 64;
const BASE_SIGMA = 1;
const MAX_SIGMA = 8;

const RESOLUTIONS = [
  { width: 256, height: 256, label: '256 x 256' },
  { width: 512, height: 512, label: '512 x 512' },
  { width: 1024, height: 1024, label: '1024 x 1024' },
  { width: 2048, height: 2048, label: '2048 x 2048' },
] as const;

type ResolutionIndex = 0 | 1 | 2 | 3;
type Stage = 0 | 1 | 2 | 3;
type LabState = { resolutionIndex: ResolutionIndex; stage: Stage };

const shared = C as unknown as Record<string, string>;
const ink = (key: string, fallback: string) => shared[key] || fallback;
const P = {
  field: ink('field', '#f5f8f0'),
  desk: ink('desk', '#b8c9a7'),
  contour: ink('contour', '#76906a'),
  blue: ink('blue', '#27446e'),
  green: ink('green', '#228d5c'),
  red: ink('red', '#c43f52'),
  orange: ink('orange', '#d97706'),
  purple: ink('purple', '#7c3aed'),
  text: ink('text', '#21324a'),
  muted: ink('muted', '#68778f'),
  border: ink('border', '#d7deea'),
  white: '#ffffff',
};

function tokenCount(width: number, height: number) {
  return (width * height) / PATCH ** 2;
}

function noiseScale(tokens: number) {
  return BASE_SIGMA * Math.sqrt(tokens / BASE_TOKENS);
}

function formatNumber(value: number, digits = 3) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = P.text,
  size = 14,
  align: CanvasTextAlign = 'left'
) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function card(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string,
  color: string,
  detail: string
) {
  ctx.fillStyle = P.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  label(ctx, title, x + w / 2, y + 27, P.muted, 12, 'center');
  label(ctx, value, x + w / 2, y + 61, color, 18, 'center');
  label(ctx, detail, x + w / 2, y + 91, P.muted, 11, 'center');
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color: string,
  caption: string
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 10, y - 7);
  ctx.lineTo(x2 - 10, y + 7);
  ctx.closePath();
  ctx.fill();
  label(ctx, caption, (x1 + x2) / 2, y - 19, P.muted, 10.5, 'center');
}

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  border = P.contour
) {
  ctx.fillStyle = P.white;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
}

function base(ctx: CanvasRenderingContext2D, stage: Stage) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = P.field;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.desk;
  ctx.fillRect(0, 478, W, 62);
  label(ctx, '论文 §3.1：动态噪声尺度', 28, 27, P.text, 18);

  const steps = ['① 固定先验的问题', '② 计算自适应尺度', '③ 训练与推理用途', '④ 显式尺度条件'];
  const gap = 10;
  const tabWidth = 219;
  steps.forEach((text, index) => {
    const x = 27 + index * (tabWidth + gap);
    ctx.fillStyle = index === stage ? P.white : P.field;
    ctx.strokeStyle = index === stage ? P.orange : P.border;
    ctx.lineWidth = index === stage ? 3 : 1;
    ctx.beginPath();
    ctx.roundRect(x, 50, tabWidth, 42, 8);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x + tabWidth / 2, 71, index === stage ? P.orange : P.muted, 11.5, 'center');
  });
}

function drawProblem(ctx: CanvasRenderingContext2D, state: LabState) {
  const selected = RESOLUTIONS[state.resolutionIndex];
  const selectedTokens = tokenCount(selected.width, selected.height);

  card(ctx, 54, 132, 300, 122, '低分辨率生成', 'N = 64 tokens', P.blue, '256 x 256，固定单位先验');
  card(ctx, 606, 132, 300, 122, '高分辨率生成', 'N = 4096 tokens', P.purple, '2048 x 2048，仍固定单位先验');
  arrow(ctx, 374, 586, 193, P.red, '同一流时间却使用相同尺度');

  panel(ctx, 84, 300, 792, 132, P.red);
  label(ctx, '朴素做法：所有分辨率都令纯噪声端点服从 N(0, I)', 480, 330, P.red, 16, 'center');
  label(ctx, '论文指出，这会使噪声先验与不同分辨率的信号尺度失配，', 480, 366, P.text, 13, 'center');
  label(ctx, '从而在同一 flow timestep 上形成不一致的 SNR 分布。', 480, 390, P.text, 13, 'center');
  label(
    ctx,
    `当前选择 ${selected.label}：N=${selectedTokens}。下一步为它计算分辨率自适应噪声尺度。`,
    480,
    452,
    P.blue,
    12.5,
    'center'
  );
}

function drawScale(ctx: CanvasRenderingContext2D, state: LabState) {
  const resolution = RESOLUTIONS[state.resolutionIndex];
  const n = tokenCount(resolution.width, resolution.height);
  const sigma = noiseScale(n);

  card(ctx, 34, 132, 215, 122, '图像分辨率', resolution.label, P.orange, '高 H x 宽 W');
  arrow(ctx, 260, 330, 193, P.blue, '32 x 32 patch');
  card(ctx, 342, 132, 250, 122, '生成 token 数', `N(H,W) = ${n}`, P.blue, 'N = H x W / 32²');
  arrow(ctx, 603, 673, 193, P.purple, '平方根缩放');
  card(ctx, 684, 132, 242, 122, '自适应噪声尺度', `σR = ${formatNumber(sigma)}`, P.green, 'σ₀=1，N₀=64');

  panel(ctx, 34, 296, 892, 140);
  label(ctx, 'Table 2 报告的尺度范围', 58, 319, P.text, 13);
  RESOLUTIONS.forEach((item, index) => {
    const count = tokenCount(item.width, item.height);
    const scale = noiseScale(count);
    const x = 64 + index * 216;
    const active = index === state.resolutionIndex;
    ctx.fillStyle = active ? '#edf7f1' : P.field;
    ctx.strokeStyle = active ? P.green : P.border;
    ctx.lineWidth = active ? 3 : 1;
    ctx.beginPath();
    ctx.roundRect(x, 342, 184, 68, 8);
    ctx.fill();
    ctx.stroke();
    label(ctx, item.label, x + 92, 364, active ? P.blue : P.text, 12, 'center');
    label(ctx, `N=${count}  ·  σR=${formatNumber(scale)}`, x + 92, 391, active ? P.green : P.muted, 11.5, 'center');
  });
  label(ctx, '平方根缩放用于维持跨分辨率近似一致的 SNR 分布，不是生成质量分数。', 480, 454, P.orange, 12.5, 'center');
}

function drawUsage(ctx: CanvasRenderingContext2D, state: LabState) {
  const resolution = RESOLUTIONS[state.resolutionIndex];
  const n = tokenCount(resolution.width, resolution.height);
  const sigma = noiseScale(n);

  label(ctx, `${resolution.label}  →  N=${n}  →  σR=${formatNumber(sigma)}`, 480, 118, P.purple, 13, 'center');
  card(ctx, 48, 152, 244, 126, '训练阶段', '缩放纯噪声端点', P.blue, 'z₀ = σR ε，ε ~ N(0,I)');
  arrow(ctx, 304, 358, 215, P.blue, '同一尺度');
  card(ctx, 370, 152, 244, 126, '推理阶段', '初始化 flow ODE', P.green, '从匹配分辨率的噪声起点出发');
  arrow(ctx, 626, 680, 215, P.green, '共同目标');
  card(ctx, 692, 152, 220, 126, '跨分辨率效果', 'SNR 分布更一致', P.orange, '近似保持每 token 噪声能量');

  panel(ctx, 92, 326, 776, 112);
  label(ctx, 'σR 不是只在训练数据预处理时使用，也不是额外的采样超参数。', 480, 356, P.text, 13.5, 'center');
  label(ctx, '它定义终端噪声的标准差，并在推理时直接决定 ODE 的初始噪声尺度。', 480, 388, P.text, 13.5, 'center');
  label(ctx, '像素流中间状态和速度回归仍属于论文 §3.3 的 Flow Matching 目标。', 480, 456, P.orange, 12.5, 'center');
}

function drawConditioning(ctx: CanvasRenderingContext2D, state: LabState) {
  const resolution = RESOLUTIONS[state.resolutionIndex];
  const n = tokenCount(resolution.width, resolution.height);
  const sigma = noiseScale(n);
  const normalized = sigma / MAX_SIGMA;

  label(ctx, `${resolution.label}：σR=${formatNumber(sigma)}，归一化后 σ̄=${normalized.toFixed(3)}`, 480, 116, P.purple, 13, 'center');
  card(ctx, 34, 150, 196, 122, '分辨率尺度', `σR = ${formatNumber(sigma)}`, P.green, '动态噪声尺度');
  arrow(ctx, 240, 292, 211, P.blue, '除以 σmax=8');
  card(ctx, 304, 150, 196, 122, '归一化尺度', `σ̄ = ${normalized.toFixed(3)}`, P.purple, '范围 [0,1]');
  arrow(ctx, 510, 562, 211, P.purple, 'NSEmb');
  card(ctx, 574, 150, 164, 122, '尺度嵌入', '正弦 MLP', P.purple, '显式告知去噪器');
  arrow(ctx, 748, 790, 211, P.green, '+ τt');
  card(ctx, 802, 150, 124, 122, '联合条件', 'st', P.green, '作用于图像 token');

  panel(ctx, 112, 318, 736, 122);
  label(ctx, '时间嵌入 τt：告诉模型当前位于 flow 的哪个时刻', 480, 349, P.blue, 13, 'center');
  label(ctx, '尺度嵌入 NSEmb(σ̄)：告诉模型该分辨率使用了多强的终端噪声', 480, 380, P.purple, 13, 'center');
  label(ctx, '两者相加得到 st，避免模型只能从 noisy input 中间接猜测噪声尺度。', 480, 411, P.text, 13, 'center');
  label(ctx, '动态尺度改变噪声先验；尺度条件化则把这个变化显式输入去噪器。', 480, 458, P.orange, 12.5, 'center');
}

function drawLab(ctx: CanvasRenderingContext2D, state: LabState) {
  base(ctx, state.stage);
  if (state.stage === 0) drawProblem(ctx, state);
  else if (state.stage === 1) drawScale(ctx, state);
  else if (state.stage === 2) drawUsage(ctx, state);
  else drawConditioning(ctx, state);
}

export const FlowNoiseLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleRef = useRef(true);
  const [state, setState] = useState<LabState>({ resolutionIndex: 1, stage: 0 });
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      ctxRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const render = () => {
      if (!ctxRef.current) return;
      drawLab(ctxRef.current, stateRef.current);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        render();
      },
      () => {
        visibleRef.current = false;
      }
    );
    render();
    return disconnect;
  }, []);

  useEffect(() => {
    if (visibleRef.current && ctxRef.current) drawLab(ctxRef.current, state);
  }, [state]);

  const resolution = RESOLUTIONS[state.resolutionIndex];
  const n = tokenCount(resolution.width, resolution.height);
  const sigma = noiseScale(n);
  const normalized = sigma / MAX_SIGMA;
  const stageFeedback = [
    `固定单位先验对所有分辨率都使用 σ=1。论文指出，这会使 ${resolution.label} 等不同分辨率在同一 flow timestep 上具有不一致的 SNR 分布。`,
    `${resolution.label} 对应 N(H,W)=${n} 个生成 token；代入 σR=σ₀√(N/N₀)，得到 σR=${formatNumber(sigma)}。`,
    `训练时以 σR=${formatNumber(sigma)} 缩放终端高斯噪声；推理时同一尺度用于初始化 flow ODE。`,
    `σR=${formatNumber(sigma)} 归一化为 σ̄=${normalized.toFixed(3)}，经 NSEmb 编码后与时间嵌入 τt 相加，形成作用于图像 token 的条件 st。`,
  ][state.stage];

  return (
    <div className="flow-noise-lab">
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={`动态噪声尺度，第 ${state.stage + 1} 步，分辨率 ${resolution.label}，生成 token 数 ${n}，噪声尺度 ${formatNumber(sigma)}`}
      />
      <div className="ctrl flow-noise-steps" role="group" aria-label="选择动态噪声尺度解释步骤">
        <button type="button" aria-pressed={state.stage === 0} onClick={() => setState((current) => ({ ...current, stage: 0 }))}>1 · 固定先验的问题</button>
        <button type="button" aria-pressed={state.stage === 1} onClick={() => setState((current) => ({ ...current, stage: 1 }))}>2 · 计算自适应尺度</button>
        <button type="button" aria-pressed={state.stage === 2} onClick={() => setState((current) => ({ ...current, stage: 2 }))}>3 · 训练与推理用途</button>
        <button type="button" aria-pressed={state.stage === 3} onClick={() => setState((current) => ({ ...current, stage: 3 }))}>4 · 显式尺度条件</button>
      </div>
      <div className="ctrl flow-noise-resolutions" role="group" aria-label="选择生成图像分辨率">
        <span>生成分辨率</span>
        {RESOLUTIONS.map((item, index) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={state.resolutionIndex === index}
            onClick={() => setState((current) => ({ ...current, resolutionIndex: index as ResolutionIndex }))}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="feedback good" aria-live="polite">{stageFeedback}</div>
      <p className="note">论文边界：动态噪声尺度解决跨分辨率的噪声先验与 SNR 一致性问题；噪声尺度条件化负责把当前尺度显式输入去噪器。Table 2 报告 σ₀=1、N₀=64，并在 N∈[64,4096] 时使用 σR∈[1,8]。</p>
    </div>
  );
};

export default FlowNoiseLab;
