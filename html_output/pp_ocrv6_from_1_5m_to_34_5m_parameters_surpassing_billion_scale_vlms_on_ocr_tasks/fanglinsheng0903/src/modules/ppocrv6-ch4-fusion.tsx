import React, { useEffect, useRef, useState } from 'react';
import { LineIcon } from '../components/LineIcon';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f7f9fc',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

type Transition = { from: number; to: number; start: number | null };
type ScopeMode = 'token' | 'channel';

const STEP_META = [
  { label: '① 训练图', short: '三条路径共同学习' },
  { label: '② 等价化', short: 'BN 吸收并对齐 3×3' },
  { label: '③ 合并', short: '得到部署参数' },
  { label: '④ 推理图', short: '只执行一条路径' },
];

const STEP_FEEDBACK = [
  '训练图：3×3 DW、1×1 DW 与 Identity 提供不同形式的优化路径，但不是三套独立 OCR 模型。',
  '等价化：先吸收 BN，再把 1×1 与 Identity 写到共同的 3×3 参数空间；这不是重新训练新分支。',
  '参数合并：等价 kernel 与对应 bias 分别求和，得到一个可保存的部署卷积。',
  '推理图：部署模型只执行一个普通 3×3 DWConv，不会在每次推理时重新融合。',
];

const STEP_ARIA = [
  '训练图中 Input 分成 DW 3×3 加 BN、DW 1×1 加 BN、Identity 加 BN 三条并行路径，再求和得到 Output。',
  '三个分支先吸收 BN，再表示成等价 3×3 参数。1×1 外围补零，Identity 变成中心为 1 的 delta kernel。',
  '三个等价 kernel 滑到同一位置并相加，同时合并对应 bias，形成 Kdeploy 和 bdeploy。',
  '部署图只保留 Input、Fused 3×3 DWConv 和 Output。转换只在部署前执行一次。',
];

const K3 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
const K1 = ['0', '0', '0', '0', 'w', '0', '0', '0', '0'];
const KID = ['0', '0', '0', '0', '1', '0', '0', '0', '0'];
const KFUSED = ['p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y'];

function useCanvas(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  deps: React.DependencyList,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    let raf = 0;
    const tick = (ms: number) => {
      draw(ctx, ms);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, deps);
  return ref;
}

function ease(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function clear(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.ink,
  align: CanvasTextAlign = 'left',
  font = '600 12px Segoe UI, sans-serif',
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 7) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function moduleBox(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  alpha = 1,
  titleColor = '#fff',
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, title, x + width / 2, y + height / 2 - 2, titleColor, 'center', '700 12px Segoe UI, sans-serif', alpha);
  if (subtitle) {
    text(ctx, subtitle, x + width / 2, y + height / 2 + 14, titleColor, 'center', '600 9px Segoe UI, sans-serif', alpha * 0.9);
  }
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  alpha = 1,
  width = 2,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, x, y, width, 24, 6);
  ctx.fillStyle = color === C.green ? '#e6f4eb' : color === C.orange ? '#fff3df' : '#f0ebff';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
  text(ctx, value, x + width / 2, y + 16, color, 'center', '700 10px Segoe UI, sans-serif', alpha);
}

function kernel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: number,
  values: string[],
  color: string,
  alpha = 1,
  zeroAlpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let index = 0; index < 9; index += 1) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const value = values[index];
    ctx.fillStyle = value !== '0'
      ? color === C.green ? '#e7f4eb' : color === C.orange ? '#fff3df' : '#f0ebff'
      : '#fff';
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
    ctx.strokeRect(x + col * cell, y + row * cell, cell, cell);
    ctx.save();
    ctx.globalAlpha = alpha * (value === '0' ? zeroAlpha : 1);
    ctx.fillStyle = value === '0' ? C.muted : color;
    ctx.font = `700 ${Math.max(10, Math.min(13, cell * 0.62))}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(value, x + col * cell + cell / 2, y + row * cell + cell * 0.69);
    ctx.restore();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, cell * 3, cell * 3);
  ctx.restore();
}

function drawTraining(ctx: CanvasRenderingContext2D, alpha: number) {
  const ys = [45, 111, 177];
  const titles = ['DW 3×3 + BN', 'DW 1×1 + BN', 'Identity + BN'];
  const roles = ['正常空间邻域', '中心位置响应', '直接保留输入'];
  moduleBox(ctx, 'Input', '', 18, 116, 72, 42, '#fff', C.blue, alpha, C.blue);
  arrow(ctx, 90, 137, 116, 137, C.blue, alpha);
  ys.forEach((y, index) => {
    moduleBox(ctx, titles[index], roles[index], 140, y, 170, 48, index === 2 ? '#f0ebff' : C.purple, C.purple, alpha, index === 2 ? C.purple : '#fff');
    arrow(ctx, 116, 137, 140, y + 24, C.purple, alpha);
    arrow(ctx, 310, y + 24, 368, 137, C.purple, alpha);
  });
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(390, 137, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  text(ctx, '⊕', 390, 144, C.purple, 'center', '700 22px Segoe UI, sans-serif', alpha);
  arrow(ctx, 410, 137, 444, 137, C.purple, alpha, 2.5);
  moduleBox(ctx, 'Output', '', 444, 116, 92, 42, '#fff', C.purple, alpha, C.purple);
  pill(ctx, 'Training only · 仅训练阶段', 366, 31, 170, C.purple, alpha);
  text(ctx, '三条路径共同学习，不是三套独立 OCR 模型', 280, 258, C.muted, 'center', '600 11px Segoe UI, sans-serif', alpha);
}

function drawEquivalent(ctx: CanvasRenderingContext2D, progress: number) {
  const graphAlpha = 1 - ease(clamp(progress / 0.7, 0, 1));
  drawTraining(ctx, graphAlpha);
  const shown = ease(clamp((progress - 0.16) / 0.84, 0, 1));
  const zeroShown = ease(clamp((progress - 0.48) / 0.52, 0, 1));
  const values = [K3, K1, KID];
  const colors = [C.purple, C.orange, C.blue];
  const targetX = [62, 247, 432];
  const sourceY = [69, 135, 201];
  const labels = ['3×3 · 保持尺寸', '1×1 · 外围补零', 'Identity · delta kernel'];
  text(ctx, "Conv + BN  →  Equivalent Conv (K′, b′)", 280, 31, C.orange, 'center', '700 12px Segoe UI, sans-serif', shown);
  values.forEach((item, index) => {
    const cell = lerp(12, 22, shown);
    const x = lerp(225 - cell * 1.5, targetX[index], shown);
    const y = lerp(sourceY[index] - cell * 1.5, 74, shown);
    kernel(ctx, x, y, cell, item, colors[index], shown, index === 0 ? 1 : zeroShown);
    text(ctx, labels[index], targetX[index] + 33, 164, colors[index], 'center', '700 10px Segoe UI, sans-serif', shown);
  });
  pill(ctx, '共同的 3×3 参数空间', 196, 192, 168, C.orange, shown);
  text(ctx, '等价参数表示，不是重新训练一个新的 3×3 分支', 280, 236, C.muted, 'center', '600 11px Segoe UI, sans-serif', shown);
  text(ctx, 'Depthwise 情况按每个 channel 分别理解', 280, 257, C.muted, 'center', '600 10px Segoe UI, sans-serif', shown);
}

function drawAlignedKernels(ctx: CanvasRenderingContext2D, progress: number, alpha = 1) {
  const starts = [62, 247, 432];
  const ends = [205, 216, 227];
  const values = [K3, K1, KID];
  const colors = [C.purple, C.orange, C.blue];
  const labels = ['K3', 'pad(K1)', 'Kid'];
  values.forEach((item, index) => {
    const x = lerp(starts[index], ends[index], progress);
    const cell = lerp(22, 19, progress);
    const y = lerp(74, 90, progress);
    kernel(ctx, x, y, cell, item, colors[index], alpha, 1 - progress * 0.72);
    text(ctx, labels[index], x + cell * 1.5, 72, colors[index], 'center', '700 11px Segoe UI, sans-serif', alpha * (1 - progress));
  });
}

function drawFusion(ctx: CanvasRenderingContext2D, alpha: number) {
  text(ctx, '等价 kernel 与 bias 分别合并', 280, 31, C.orange, 'center', '700 12px Segoe UI, sans-serif', alpha);
  arrow(ctx, 285, 119, 400, 119, C.orange, alpha, 2.5);
  kernel(ctx, 418, 86, 22, KFUSED, C.orange, alpha);
  text(ctx, 'Kdeploy', 451, 75, C.orange, 'center', '700 11px Segoe UI, sans-serif', alpha);
  ctx.save();
  ctx.globalAlpha = alpha;
  roundRect(ctx, 95, 184, 370, 42, 7);
  ctx.fillStyle = '#fff3df';
  ctx.fill();
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  text(ctx, 'Kdeploy = K3 + pad(K1) + Kid', 280, 211, C.orange, 'center', '700 14px Segoe UI, sans-serif', alpha);
  text(ctx, '融合后保存单分支参数，推理不再执行这一步', 280, 255, C.muted, 'center', '600 11px Segoe UI, sans-serif', alpha);
}

function drawDeploy(ctx: CanvasRenderingContext2D, alpha: number, detailAlpha = alpha) {
  text(ctx, 'Deployment graph · 推理计算图', 280, 38, C.green, 'center', '700 12px Segoe UI, sans-serif', alpha);
  moduleBox(ctx, 'Input', '', 24, 112, 78, 44, '#fff', C.green, alpha, C.green);
  arrow(ctx, 102, 134, 170, 134, C.green, alpha, 2.5);
  moduleBox(ctx, 'Fused 3×3 DWConv', 'Kdeploy', 170, 92, 220, 84, '#e6f4eb', C.green, alpha, C.green);
  arrow(ctx, 390, 134, 438, 134, C.green, alpha, 2.5);
  moduleBox(ctx, 'Output', '', 438, 112, 96, 44, '#fff', C.green, alpha, C.green);
  pill(ctx, 'Training graph · 3 paths', 67, 207, 188, C.purple, detailAlpha);
  arrow(ctx, 255, 219, 306, 219, C.orange, detailAlpha);
  pill(ctx, 'Deployment graph · 1 path', 306, 207, 188, C.green, detailAlpha);
  text(ctx, '转换开销：部署前一次 · 额外推理分支：0', 280, 260, C.green, 'center', '700 11px Segoe UI, sans-serif', detailAlpha);
}

function drawFusionToDeploy(ctx: CanvasRenderingContext2D, progress: number) {
  const fusionAlpha = 1 - ease(clamp(progress / 0.56, 0, 1));
  drawAlignedKernels(ctx, 1, fusionAlpha);
  drawFusion(ctx, fusionAlpha);
  const movingAlpha = 1 - ease(clamp((progress - 0.08) / 0.72, 0, 1));
  const x = lerp(418, 246, progress);
  const y = lerp(86, 105, progress);
  const cell = lerp(22, 18, progress);
  kernel(ctx, x, y, cell, KFUSED, C.orange, movingAlpha);
  const graphAlpha = ease(clamp((progress - 0.14) / 0.64, 0, 1));
  const detailAlpha = ease(clamp((progress - 0.62) / 0.38, 0, 1));
  drawDeploy(ctx, graphAlpha, detailAlpha);
}

export const Ch4Fusion: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [showBias, setShowBias] = useState(false);
  const [verified, setVerified] = useState(false);
  const stepRef = useRef(0);
  const transition = useRef<Transition>({ from: 0, to: 0, start: null });
  const replayTimers = useRef<number[]>([]);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionMs = reducedMotion ? 1 : 760;

  const currentStage = (now: number) => {
    const state = transition.current;
    if (state.start === null) return state.to;
    const progress = clamp((now - state.start) / transitionMs, 0, 1);
    return lerp(state.from, state.to, ease(progress));
  };

  const clearReplay = () => {
    replayTimers.current.forEach((timer) => window.clearTimeout(timer));
    replayTimers.current = [];
  };

  const goTo = (next: number) => {
    if (next < 0 || next > 3 || next === stepRef.current) return;
    const now = performance.now();
    transition.current = { from: currentStage(now), to: next, start: now };
    stepRef.current = next;
    setStep(next);
    if (next < 2) setVerified(false);
  };

  const replay = () => {
    clearReplay();
    goTo(0);
    [1, 2, 3].forEach((target, index) => {
      replayTimers.current.push(window.setTimeout(() => goTo(target), 1050 * (index + 1)));
    });
  };

  useEffect(() => () => clearReplay(), []);

  const canvasRef = useCanvas(560, 280, (ctx, now) => {
    clear(ctx, 560, 280);
    const stage = currentStage(now);
    if (stage <= 1) {
      drawEquivalent(ctx, stage);
    } else if (stage <= 2) {
      const progress = stage - 1;
      drawAlignedKernels(ctx, progress);
      drawFusion(ctx, ease(clamp((progress - 0.24) / 0.76, 0, 1)));
    } else {
      drawFusionToDeploy(ctx, stage - 2);
    }
  }, []);

  return (
    <div className={`rep5-lab rep5-step-${step + 1}`}>
      <div className="rep5-constant-bar">
        <div className="rep5-lifecycle" aria-label="结构重参数化发生阶段">
          <span className={step === 0 ? 'active training' : ''}>训练：多路径</span>
          <b aria-hidden="true">→</b>
          <span className={step === 1 || step === 2 ? 'active conversion' : ''}>部署转换：一次</span>
          <b aria-hidden="true">→</b>
          <span className={step === 3 ? 'active deploy' : ''}>推理：单路径</span>
        </div>
        <div className="rep5-invariant">
          <span>不变的东西</span>
          <strong>Input → Output 的函数关系</strong>
          <code>f_train(x) = f_deploy(x)</code>
        </div>
      </div>

      <div className="rep5-stepper-row">
        <div className="rep5-stepper" role="group" aria-label="RepDWConv 四个阶段">
          {STEP_META.map((item, index) => (
            <button
              type="button"
              key={item.label}
              className={step === index ? 'selected' : index < step ? 'completed' : ''}
              aria-pressed={step === index}
              onClick={() => {
                clearReplay();
                goTo(index);
              }}
            >
              <strong>{item.label}</strong>
              <small>{item.short}</small>
            </button>
          ))}
        </div>
        <button type="button" className="rep5-replay ui-replay" title="重播整个折叠过程" onClick={replay}>
          <LineIcon name="rotate" />
          重播
        </button>
      </div>

      <div className="rep5-stage-shell">
        <div className="technical-canvas-viewport rep5-canvas">
          <canvas
            ref={canvasRef}
            width={560}
            height={280}
            role="img"
            aria-label={`RepDWConv 第 ${step + 1} 步，共 4 步：${STEP_ARIA[step]}`}
          />
        </div>
        <div className="rep5-offline-note">
          <strong>Export / Deploy-time conversion · 只转换一次</strong>
          <span>≠ 每次推理时重新融合</span>
        </div>
      </div>

      <div className="rep5-step-panels">
        <section className={step === 0 ? 'active' : ''} aria-hidden={step !== 0}>
          <div className="rep5-branch-notes">
            <article><span>3×3 DW</span><strong>正常空间邻域</strong><small>观察中心周围的 3×3 范围。</small></article>
            <article><span>1×1 DW</span><strong>更局部的中心响应</strong><small>只作用于当前中心位置。</small></article>
            <article><span>Identity</span><strong>直接保留输入路径</strong><small>不改变空间邻域。</small></article>
          </div>
          <p>三条训练路径提供不同尺度与形式的优化路径；它们不是三个不同任务，也不是三套独立模型。</p>
        </section>

        <section className={step === 1 ? 'active' : ''} aria-hidden={step !== 1}>
          <div className="rep5-equivalent-actions">
            <article><span>动作 A</span><strong>吸收 BN</strong><code>Conv + BN → Equivalent Conv (K′, b′)</code></article>
            <article><span>动作 B</span><strong>对齐空间尺寸</strong><code>K3 · pad(K1) · Kid → 3×3</code></article>
          </div>
          <p>BN 同时进入等价 weight / bias；1×1 只是把权重放到 3×3 中心并在外围补零，Identity 则写成中心为 1 的 delta kernel。</p>
        </section>

        <section className={step === 2 ? 'active' : ''} aria-hidden={step !== 2}>
          <div className="rep5-formula-row">
            <div><span>等价部署 kernel</span><strong>Kdeploy = K3 + pad(K1) + Kid</strong></div>
            <button type="button" aria-expanded={showBias} onClick={() => setShowBias((current) => !current)}>
              {showBias ? '收起完整参数' : '查看完整等价参数'}
            </button>
          </div>
          <div className={`rep5-bias-detail ${showBias ? 'visible' : ''}`}>
            <code>bdeploy = b3 + b1 + bid</code>
            <span>前一步已把 BN 折叠为等价卷积参数，因此相应 bias 也要一起合并。</span>
          </div>
          <p>结构重参数化不只是把三个训练中的原始矩阵直接相加，而是先等价化、对齐，再合并兼容参数。</p>
        </section>

        <section className={step === 3 ? 'active' : ''} aria-hidden={step !== 3}>
          <div className="rep5-deploy-summary">
            <article><span>Training graph</span><strong>3 paths</strong></article>
            <b aria-hidden="true">→</b>
            <article><span>Deployment graph</span><strong>1 path</strong></article>
            <small>转换开销：部署前一次 · 额外分支延迟：0</small>
          </div>
          <div className="rep5-not-chips" aria-label="结构重参数化常见误解">
            <span>不是剪枝</span>
            <span>不是推理时动态选路</span>
            <span>不是重新训练一个 3×3</span>
          </div>
          <p>它是训练完成后进行的一次代数等价参数变换；新的单分支参数随后被保存为部署模型。</p>
        </section>
      </div>

      <div className="rep5-controls">
        <button type="button" className="ui-page-button ui-page-button-prev" disabled={step === 0} onClick={() => { clearReplay(); goTo(step - 1); }}><LineIcon name="chevron-left" />上一步</button>
        <span className="val">{step + 1} / 4</span>
        <button type="button" className="ui-page-button ui-page-button-next" disabled={step === 3} onClick={() => { clearReplay(); goTo(step + 1); }}>下一步<LineIcon name="chevron-right" /></button>
      </div>

      <div className={`feedback ${step === 3 ? 'good' : ''}`} role="status" aria-live="polite">
        {STEP_FEEDBACK[step]}
      </div>

      <section className={`rep5-equivalence ${verified ? 'verified' : ''}`} aria-label="结构重参数化等价性验证">
        <div>
          <span>教学示例</span>
          <strong>真的等价吗？</strong>
          <p>给训练图与部署图同一个输入 patch，比较融合前后的输出。</p>
        </div>
        <div className="rep5-output-compare">
          <article><span>训练图 · 3 branches</span><strong>{verified ? '2.00' : 'Output A'}</strong></article>
          <b className={verified ? 'equal' : ''}>{verified ? '=' : 'vs.'}</b>
          <article><span>部署图 · Fused 3×3</span><strong>{verified ? '2.00' : 'Output B'}</strong></article>
        </div>
        <button type="button" disabled={step < 2} onClick={() => setVerified(true)}>
          {verified ? 'Equivalent ✓' : step < 2 ? '完成等价化后验证' : '验证一次'}
        </button>
        <small>{verified ? '数值仅用于教学演示；它说明目标是函数等价，不是论文准确率。' : '融合改变计算图表达，不是为了得到另一个近似函数。'}</small>
      </section>
    </div>
  );
};

export const Ch4ReparamScope: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<ScopeMode | null>(null);
  const tokenSelected = mode === 'token';
  const channelSelected = mode === 'channel';

  return (
    <div className={`rep5d-lab rep5d-${mode ?? 'pending'}`}>
      <header className="rep5d-question">
        <span>如果你是论文作者，你会怎么选？</span>
        <strong>这张“Rep 多分支升级券”，你会给谁？</strong>
        <p>假设只能把“训练时增加分支、部署前再融合”的策略放到真正值得的位置，你会选哪个模块？</p>
      </header>

      <div className="rep5d-upgrade-mark" aria-hidden="true"><LineIcon name="merge" /><span>REP UPGRADE</span><small>仅选一个位置</small></div>

      <div className="rep5d-choice-grid" role="group" aria-label="选择 RepDWConv 应该作用的模块">
        <article className={`rep5d-choice-card token ${tokenSelected ? 'selected' : ''}`}>
          <header><span>负责空间</span><strong>TOKEN MIXER</strong></header>
          <div className="rep5d-spatial-view" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => <i className={index === 4 ? 'center' : ''} key={index} />)}
            <b>观察周围</b>
          </div>
          <p>像换不同焦段观察周围：不同视野，真的能看到不同信息。</p>
          <button type="button" aria-pressed={tokenSelected} onClick={() => setMode('token')}>把升级给它</button>
        </article>

        <article className={`rep5d-choice-card channel ${channelSelected ? 'selected' : ''}`}>
          <header><span>负责通道</span><strong>CHANNEL MIXER</strong></header>
          <div className="rep5d-channel-view" aria-hidden="true">
            <div><i>C₁</i><i>C₂</i><i>C₃</i><i>C₄</i></div><b>→</b><strong>●</strong>
          </div>
          <p>像重新混合已有频道：重点是组合，不是扩大空间视野。</p>
          <button type="button" aria-pressed={channelSelected} onClick={() => setMode('channel')}>把升级给它</button>
        </article>
      </div>

      <section className="rep5d-result" role="status" aria-live="polite">
        {!mode ? (
          <div className="rep5d-result-pending"><strong>先把升级券交给一个模块</strong><span>选择后，画面会告诉你多分支是否带来了新的空间视野。</span></div>
        ) : tokenSelected ? (
          <div className="rep5d-token-result">
            <div className="rep5d-token-flow" aria-hidden="true">
              <div><i>3×3</i><i>1×1</i><i>Identity</i></div><b>→</b><strong>不同空间视野一起训练</strong><b>→</b><span>部署仍为一个 3×3 DWConv</span>
            </div>
            <div className="rep5d-benefit-tags"><span>多种空间尺度</span><span>训练路径更丰富</span><span>推理仍然轻量</span></div>
            <p><strong>值得升级</strong><span>Token Mixer 本来就在处理“周围有什么”。不同空间分支能提供真正不同的观察尺度，因此多分支训练有明确价值。</span><small>论文最终在部署前完成融合，推理图不会保留额外分支。</small></p>
          </div>
        ) : (
          <div className="rep5d-channel-result">
            <div className="rep5d-one-by-one" aria-hidden="true">{[1, 2, 3].map((item) => <span key={item}><i>1×1</i><b>●</b></span>)}</div>
            <strong>视野没有变大</strong>
            <p>Channel Mixer 关注“同一个位置上，不同通道怎样重新组合”。即使增加更多 1×1 分支，每条路径仍只作用于同一个空间位置，因此不像 Token Mixer 那样获得不同尺度的空间信息。</p>
            <small>所以 PP-OCRv6 把 structural reparameterization 用在 Token Mixer，而不是让整个 block 都变复杂。</small>
          </div>
        )}
      </section>

      <details className="rep5d-details">
        <summary>查看论文细节与消融证据</summary>
        <div>
          <article><span>RepDWConv 组成与融合</span><p>训练图包含 3×3 DW + BN、1×1 DW + BN 与 Identity + BN。部署前先吸收 BN，把各分支对齐到 3×3 参数空间，再融合成一个 3×3 DWConv；具体过程已在 §5.1 展开。</p></article>
          <article><span>为什么不扩展 Channel Mixer</span><p>Token Mixer 的 depthwise convolution 具有 spatial extent；Channel Mixer 的 1×1 convolution 主要负责 cross-channel interaction，没有可由类似多尺度空间分支扩展的感受野。</p></article>
          <article className="rep5d-ablation"><span>论文证据 · Appendix C.1</span><strong>Recognition Backbone Ablation</strong><div><i>MetaFormer-style block <b>78.24</b></i><em>→</em><i>+ RepDWConv <b>78.30</b></i></div><p>该实验说明在其他设计基本保持不变时，引入 RepDWConv 带来正向贡献。它是论文证据，不是本节需要记忆的核心数字。</p></article>
        </div>
      </details>

      <p className="rep5d-takeaway"><strong>你应该记住：</strong> Structural reparameterization 不是“哪里都加”。Token Mixer 负责空间建模，不同空间分支能提供不同尺度的信息，因此更值得使用；Channel Mixer 主要进行 1×1 通道变换，额外多分支收益有限。<span>把复杂度加在真正能利用它的地方。</span></p>
    </div>
  );
};
