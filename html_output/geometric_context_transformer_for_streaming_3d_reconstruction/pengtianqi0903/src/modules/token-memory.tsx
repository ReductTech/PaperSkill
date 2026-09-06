import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CanvasViewport } from '../components/CanvasViewport';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.text,
  size = 13,
  weight = 600,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(value, x, y);
}

function base(ctx: CanvasRenderingContext2D, height: number) {
  ctx.clearRect(0, 0, W, height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, height);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(12.5, 12.5, W - 25, height - 25);
}

function useDrawCanvas(draw: (ctx: CanvasRenderingContext2D) => void, height: number) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      const ctx = setupCanvas(canvas, W, height);
      draw(ctx);
      canvas.style.width = `${W}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.classList.add('is-ready');
    } catch {
      // Text feedback below the Canvas remains available.
    }
  }, [draw, height]);
  return ref;
}

function formatTokens(value: number) {
  return Math.round(value).toLocaleString('zh-CN');
}

export const MemoryComplexityExact: React.FC<WidgetProps> = ({ moduleId }) => {
  const [frames, setFrames] = useState(1_000);
  const rangeId = useId();
  const feedbackId = `${moduleId}-complexity-feedback`;
  const n = 3;
  const k = 16;
  const m = 500;
  const causal = frames * (m + 6);
  const gca = (n + k) * m + 6 * frames;
  const marginalRatio = (m + 6) / 6;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const h = 285;
      base(ctx, h);
      label(ctx, `T = ${formatTokens(frames)} 帧`, 24, 36, C.orange, 15, 800);
      label(ctx, '两根柱共用同一线性刻度', 354, 36, C.muted, 10, 700);

      const axisLeft = 56;
      const baseline = 224;
      const maxHeight = 150;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(axisLeft, 57);
      ctx.lineTo(axisLeft, baseline);
      ctx.lineTo(322, baseline);
      ctx.stroke();

      const maxValue = Math.max(causal, gca);
      const barHeight = (value: number) => (value / maxValue) * maxHeight;
      label(ctx, formatTokens(maxValue), 15, 71, C.muted, 9, 600);
      label(ctx, formatTokens(maxValue / 2), 15, 147, C.muted, 9, 600);
      label(ctx, '0', 42, baseline + 4, C.muted, 9, 600);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(axisLeft, baseline - maxHeight / 2);
      ctx.lineTo(322, baseline - maxHeight / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const bars = [
        { name: 'Full Causal', value: causal, x: 92, color: C.red },
        { name: 'GCA', value: gca, x: 218, color: C.green },
      ];
      bars.forEach((bar) => {
        const height = barHeight(bar.value);
        ctx.fillStyle = bar.color;
        ctx.fillRect(bar.x, baseline - height, 76, height);
        label(ctx, bar.name, bar.x - 3, baseline + 22, bar.color, 11, 800);
        label(ctx, formatTokens(bar.value), bar.x - 5, Math.max(68, baseline - height - 9), bar.color, 11, 800);
      });

      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.fillRect(346, 60, 184, 164);
      ctx.strokeRect(346, 60, 184, 164);
      label(ctx, '每个淘汰帧的增量', 365, 87, C.text, 12, 800);
      label(ctx, 'Full Causal', 365, 119, C.red, 11, 700);
      label(ctx, 'M + 6 ≈ 506', 365, 140, C.red, 17, 800);
      label(ctx, 'GCA', 365, 170, C.green, 11, 700);
      label(ctx, '6 tokens', 365, 194, C.green, 17, 800);
      label(ctx, `增长率约 ${marginalRatio.toFixed(1)}×`, 365, 215, C.orange, 10, 700);

      label(ctx, 'Ncausal = T(M+6)', 57, 263, C.red, 11, 700);
      label(ctx, 'NGCA = (n+k)M + 6T', 273, 263, C.green, 11, 700);
    },
    [causal, frames, gca, marginalRatio],
  );

  const canvasRef = useDrawCanvas(draw, 285);
  const canonicalExample = frames === 10_000;
  const feedback = canonicalExample
    ? '论文示例到达 T=10,000：按 M≈500 计算，Full Causal 为 5,060,000，GCA 为 69,500；论文将它们取整为约 5×10⁶ 与 7×10⁴。两者都仍随 T 增长。'
    : `当前 T=${formatTokens(frames)}：Full Causal 约 ${formatTokens(causal)} token，GCA 约 ${formatTokens(gca)} token；淘汰一帧后的边际增长分别是 M+6 与 6。继续向右拖动可观察斜率差异，但不能据此把 GCA 称为 O(1) 状态。`;

  return (
    <div>
      <CanvasViewport label="缓存复杂度柱状图，可横向滚动查看" mobileMinWidth={540}>
        <canvas
          ref={canvasRef}
          width={W}
          height={285}
          role="img"
          aria-label={`复杂度对比，T 等于 ${frames}，Full Causal 保留 ${causal} 个 token，GCA 保留 ${gca} 个 token；两根柱使用同一线性刻度`}
          aria-describedby={feedbackId}
        />
      </CanvasViewport>
      <div className="ctrl">
        <label htmlFor={rangeId}>
          序列长度 T <span className="val">{formatTokens(frames)}</span>
        </label>
        <input
          id={rangeId}
          type="range"
          min="100"
          max="10000"
          step="100"
          value={frames}
          aria-describedby={feedbackId}
          onChange={(event) => setFrames(Number(event.currentTarget.value))}
        />
        <div className="complexity-range-scale" aria-hidden="true">
          <span>T=100</span>
          <span>论文复杂度示例：T=10,000</span>
        </div>
      </div>
      <div
        className="complexity-readout"
        role="group"
        aria-label={`当前代入结果：Full Causal ${causal} 个 token，GCA ${gca} 个 token；边际增长分别为 ${m + 6} 与 6；GCA 仍然不是常数状态`}
      >
        <div className="complexity-readout-item">
          <span>当前 N<sub>causal</sub></span>
          <b>{formatTokens(causal)}</b>
        </div>
        <div className="complexity-readout-item">
          <span>当前 N<sub>GCA</sub></span>
          <b>{formatTokens(gca)}</b>
        </div>
        <div className="complexity-readout-item">
          <span>淘汰一帧后的增量</span>
          <b>{m + 6} vs 6</b>
        </div>
        <div className="complexity-readout-item">
          <span>状态阶数</span>
          <b>仍含 6T · 非 O(1)</b>
        </div>
      </div>
      <div id={feedbackId} className="feedback good" role="status" aria-live="polite">
        {feedback}
      </div>
      <div className="hotspot-info">
        <b>结论边界：</b>GCA 并非严格 O(1) 状态；总量仍含 <b>6T</b>。它固定的是昂贵的完整图像 token 项，而论文所说“约 80×”指典型 <b>M≈500</b> 时每个淘汰帧的增长率。这里用 <b>n=3、k=16</b> 复现复杂度示例；默认推理的 <b>k=64</b> 是另一配置。
      </div>
    </div>
  );
};

const LIFE_STEPS = [
  {
    title: '新帧到达',
    feedback: '选取一个非锚点新帧：它先携带 M 个图像 token，以及 c、a、4 个 register token，共 M+6 个 token。',
  },
  {
    title: '留在最近窗口',
    feedback: '只要该帧仍属于最近 k 帧，Local Pose-Reference Window 就保留它完整的 M+6 个 token，供稠密近邻注册使用。',
  },
  {
    title: '离开窗口',
    feedback: '当这个非锚点帧同时位于 anchor set 与 active window 之外时，系统淘汰占用最大的 M 个图像 token。',
  },
  {
    title: '进入轨迹记忆',
    feedback: '最终保留 c、a、r₁、r₂、r₃、r₄ 共 6 个上下文 token，并加入视频时间位置编码，成为 Trajectory Memory 的一项。',
  },
] as const;

function drawImageTokens(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean) {
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      ctx.fillStyle = active ? C.blue : '#e7ecf3';
      ctx.fillRect(x + col * 13, y + row * 13, 9, 9);
    }
  }
  label(ctx, 'M 个 image tokens', x, y + 67, active ? C.blue : C.muted, 10, 700);
}

function drawContextTokens(ctx: CanvasRenderingContext2D, x: number, y: number, memory: boolean) {
  const tokens = ['c', 'a', 'r₁', 'r₂', 'r₃', 'r₄'];
  tokens.forEach((token, index) => {
    ctx.fillStyle = memory ? C.purple : index < 2 ? C.green : C.blue;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1;
    ctx.fillRect(x + index * 31, y, 26, 28);
    ctx.strokeRect(x + index * 31, y, 26, 28);
    label(ctx, token, x + index * 31 + 7, y + 19, C.white, 10, 800);
  });
  label(ctx, '6 个 context tokens', x, y + 47, memory ? C.purple : C.green, 10, 700);
}

export const TokenLifecycle: React.FC<WidgetProps> = ({ moduleId }) => {
  const [step, setStep] = useState(0);
  const canvasId = useId();
  const feedbackId = `${moduleId}-lifecycle-feedback`;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const h = 285;
      base(ctx, h);
      label(ctx, `步骤 ${step + 1}/4 · ${LIFE_STEPS[step].title}`, 24, 36, C.orange, 15, 800);
      label(ctx, '对象：一个非 anchor frame', 363, 36, C.muted, 10, 600);

      const stages = ['到达', 'Window 内', '淘汰 M', 'Memory'];
      stages.forEach((stageName, index) => {
        const x = 58 + index * 145;
        ctx.fillStyle = index < step ? C.green : index === step ? C.orange : C.white;
        ctx.strokeStyle = index <= step ? (index === step ? C.orange : C.green) : C.border;
        ctx.lineWidth = index === step ? 4 : 2;
        ctx.beginPath();
        ctx.arc(x, 70, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        label(ctx, String(index + 1), x - 4, 75, index <= step ? C.white : C.muted, 11, 800);
        label(ctx, stageName, x - 24, 100, index === step ? C.orange : C.muted, 10, 700);
        if (index < stages.length - 1) {
          ctx.strokeStyle = index < step ? C.green : C.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 18, 70);
          ctx.lineTo(x + 126, 70);
          ctx.stroke();
        }
      });

      const imageActive = step < 2;
      const memory = step === 3;
      drawImageTokens(ctx, 54, 139, imageActive);
      drawContextTokens(ctx, memory ? 318 : 246, 151, memory);

      if (step === 1) {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.strokeRect(38, 121, 413, 102);
        label(ctx, '完整 M+6 保留在最近 k 帧窗口', 169, 244, C.green, 11, 800);
      }
      if (step >= 2) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(48, 132);
        ctx.lineTo(196, 210);
        ctx.moveTo(196, 132);
        ctx.lineTo(48, 210);
        ctx.stroke();
        label(ctx, '丢弃 M，不是把 M 做显式平均', 41, 244, C.red, 11, 800);
      }
      if (memory) {
        ctx.strokeStyle = C.purple;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.roundRect(304, 137, 210, 76, 12);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, '+ Video RoPE', 365, 126, C.purple, 11, 800);
        label(ctx, 'Trajectory Memory', 357, 232, C.purple, 12, 800);
      }
    },
    [step],
  );

  const canvasRef = useDrawCanvas(draw, 285);

  return (
    <div>
      <CanvasViewport label="Token 生命周期图示，可横向滚动查看" mobileMinWidth={540}>
        <canvas
          id={canvasId}
          ref={canvasRef}
          width={W}
          height={285}
          role="img"
          aria-label={`非锚点帧 token 生命周期，第 ${step + 1} 步：${LIFE_STEPS[step].title}`}
          aria-describedby={feedbackId}
        />
      </CanvasViewport>
      <div className="step-ctrl" role="group" aria-label="token 生命周期步骤控制">
        <button
          type="button"
          className="tiny ghost"
          disabled={step === 0}
          aria-controls={canvasId}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          上一步
        </button>
        <span className="step-label">
          <b>{step + 1}</b> / 4
        </span>
        <button
          type="button"
          className="tiny"
          disabled={step === LIFE_STEPS.length - 1}
          aria-controls={canvasId}
          onClick={() => setStep((value) => Math.min(LIFE_STEPS.length - 1, value + 1))}
        >
          {step === LIFE_STEPS.length - 1 ? '已完成' : '下一步'}
        </button>
        <button
          type="button"
          className="tiny ghost"
          disabled={step === 0}
          aria-controls={canvasId}
          onClick={() => setStep(0)}
        >
          重置
        </button>
      </div>
      <div
        id={feedbackId}
        className={`feedback ${step === LIFE_STEPS.length - 1 ? 'good' : step === 2 ? 'bad' : ''}`}
        role="status"
        aria-live="polite"
      >
        {LIFE_STEPS[step].feedback}
      </div>
      <div className="hotspot-info">
        Anchor frames 始终保留完整 token；上述淘汰路径只描述<strong>同时位于 anchor set 与当前局部窗口之外的非锚点帧</strong>。论文没有定义一个额外的“把 M 显式池化成 6”的操作，而是丢弃 image tokens，保留已经参与网络计算的 c、a 与 4 个 register tokens。
      </div>
    </div>
  );
};
