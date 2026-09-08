import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { assetUrl } from './asset-url';

type DecoderMode = 'distilled' | 'baseline';

const TOKEN_STEPS = 4;
const TOKEN_LABELS = ['V₈', 'V₃', 'V₁₁', 'V₂', 'V₇', 'V₅', 'V₁', 'V₁₀', 'V₄', 'V₉', 'V₆', 'V₁₂'];

const MODES: Record<
  DecoderMode,
  {
    label: string;
    shortLabel: string;
    decoderSteps: number;
    time: string;
    geneval: string;
    image: string;
    note: string;
  }
> = {
  distilled: {
    label: '8 步蒸馏 Decoder',
    shortLabel: '8 步蒸馏',
    decoderSteps: 8,
    time: '2.90 s',
    geneval: '0.87',
    image: assetUrl('decoder-8-steps.png'),
    note: '论文的 CFG-free 8 步蒸馏版本',
  },
  baseline: {
    label: '50 步 Decoder',
    shortLabel: '50 步基线',
    decoderSteps: 50,
    time: '32.95 s',
    geneval: '0.89',
    image: assetUrl('decoder-50-steps.png'),
    note: '论文报告的 50 步基线版本',
  },
};

function deterministicNoise(x: number, y: number, seed: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function drawNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number,
  progress: number,
) {
  const cell = progress < 0.28 ? 7 : progress < 0.68 ? 5 : 3;
  ctx.save();
  ctx.globalAlpha = opacity;
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      const n = deterministicNoise(x / cell, y / cell, 19);
      const r = Math.round(36 + n * 190);
      const g = Math.round(44 + deterministicNoise(x / cell, y / cell, 31) * 184);
      const b = Math.round(51 + deterministicNoise(x / cell, y / cell, 47) * 180);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, cell + 0.6, cell + 0.6);
    }
  }
  ctx.restore();
}

function FlowArrow({ state }: { state: 'upcoming' | 'active' | 'done' }) {
  return (
    <div className={`dgp-arrow is-${state}`} aria-hidden="true">
      <span />
    </div>
  );
}

function PipelineCard({
  eyebrow,
  title,
  detail,
  tone,
  active,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  tone: 'orange' | 'blue' | 'green' | 'purple';
  active?: boolean;
}) {
  return (
    <div className={`dgp-pipeline-card is-${tone}${active ? ' is-active' : ''}`}>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function DecoderFigureCompareV4(_props: WidgetProps) {
  const [mode, setMode] = useState<DecoderMode>('distilled');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const config = MODES[mode];
  const totalSteps = TOKEN_STEPS + config.decoderSteps;
  const tokenProgress = Math.min(step / TOKEN_STEPS, 1);
  const decoderStep = Math.max(0, step - TOKEN_STEPS);
  const decoderProgress = Math.min(decoderStep / config.decoderSteps, 1);
  const stage = step < TOKEN_STEPS ? 'token' : 'decoder';
  const completed = step >= totalSteps;
  const revealedTokens = Math.round(tokenProgress * TOKEN_LABELS.length);

  const stageText = useMemo(() => {
    if (completed) return '生成完成：视觉 Token 已被解码为图像';
    if (stage === 'token') {
      return `主干恢复语义 Token · 教学分段 ${step + 1}/${TOKEN_STEPS}`;
    }
    return `Diffusion Decoder 去噪 · 第 ${decoderStep}/${config.decoderSteps} 步`;
  }, [completed, config.decoderSteps, decoderStep, stage, step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return observeCanvas(
      canvas,
      () => setInView(true),
      () => {
        setInView(false);
        setPlaying(false);
      },
    );
  }, []);

  useEffect(() => {
    if (!playing || !inView) return;
    const interval = mode === 'distilled' ? 460 : 95;
    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= totalSteps) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, interval);
    return () => window.clearInterval(timer);
  }, [inView, mode, playing, totalSteps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const width = 320;
    const height = 210;
    const ctx = setupCanvas(canvas, width, height);
    const target = new Image();

    const draw = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ebe9e2';
      ctx.fillRect(0, 0, width, height);

      const p = decoderProgress;
      if (p > 0 && target.complete && target.naturalWidth > 0) {
        const cropWidth = target.naturalWidth * 0.38;
        ctx.save();
        ctx.globalAlpha = Math.pow(p, 0.68);
        ctx.filter = `blur(${Math.max(0, (1 - p) * 9)}px) saturate(${0.55 + p * 0.45}) contrast(${0.82 + p * 0.18})`;
        ctx.drawImage(target, 0, 0, cropWidth, target.naturalHeight, 0, 0, width, height);
        ctx.restore();
      }

      drawNoise(ctx, width, height, Math.pow(1 - p, 1.2), p);

      if (p > 0.12 && p < 0.96) {
        ctx.save();
        ctx.globalAlpha = (1 - p) * 0.18;
        ctx.fillStyle = '#f6eee1';
        for (let y = 0; y < height; y += 18) ctx.fillRect(0, y, width, 1);
        ctx.restore();
      }
      setCanvasReady(true);
    };

    target.onload = draw;
    target.onerror = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#e8ecee';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#91a1ad';
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(12, 12, width - 24, height - 24);
      ctx.setLineDash([]);
      ctx.fillStyle = '#40566a';
      ctx.font = '700 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('图片资源未加载', width / 2, height / 2 - 4);
      ctx.fillStyle = '#72808b';
      ctx.font = '12px sans-serif';
      ctx.fillText('请检查预览服务或部署路径', width / 2, height / 2 + 20);
      setCanvasReady(true);
    };
    target.src = config.image;
    draw();
    return () => {
      cancelled = true;
    };
  }, [config.image, decoderProgress]);

  const chooseMode = (nextMode: DecoderMode) => {
    setMode(nextMode);
    setStep(0);
    setPlaying(false);
    setCanvasReady(false);
  };

  const togglePlayback = () => {
    if (step >= totalSteps) setStep(0);
    setPlaying((current) => !current);
  };

  const changeStep = (next: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(totalSteps, next)));
  };

  const tokenArrowState = stage === 'token' ? 'active' : 'done';
  const decoderArrowState = completed ? 'done' : stage === 'decoder' ? 'active' : 'upcoming';

  return (
    <div className="dgp-shell">
      <div className="dgp-topbar">
        <div>
          <span className="dgp-kicker">双阶段生成播放器</span>
          <h4>先恢复视觉 Token，再把它们逐步解码成图像</h4>
        </div>
        <div className="dgp-mode-switch" aria-label="选择 Diffusion Decoder 版本">
          {(Object.keys(MODES) as DecoderMode[]).map((key) => (
            <button
              key={key}
              type="button"
              className={mode === key ? 'is-selected' : ''}
              onClick={() => chooseMode(key)}
            >
              {MODES[key].shortLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="dgp-player-panel">
        <div className="dgp-transport" aria-label="播放器控制">
          <button type="button" onClick={() => changeStep(step - 1)} disabled={step === 0} aria-label="后退一步">
            ‹
          </button>
          <button type="button" className="dgp-play-button" onClick={togglePlayback} aria-label={playing ? '暂停' : '播放'}>
            {playing ? 'Ⅱ' : '▶'}
          </button>
          <button
            type="button"
            onClick={() => changeStep(step + 1)}
            disabled={step === totalSteps}
            aria-label="前进一步"
          >
            ›
          </button>
          <div className="dgp-stage-readout">
            <strong>{stageText}</strong>
            <span>{step}/{totalSteps}</span>
          </div>
        </div>
        <input
          className="dgp-timeline"
          type="range"
          min={0}
          max={totalSteps}
          step={1}
          value={step}
          onChange={(event) => changeStep(Number(event.target.value))}
          aria-label="生成时间轴"
          style={{ '--dgp-progress': `${(step / totalSteps) * 100}%` } as React.CSSProperties}
        />
        <div className="dgp-timeline-labels">
          <span>全部 MASK</span>
          <span>视觉 Token 就绪</span>
          <span>{config.decoderSteps} 步图像完成</span>
        </div>
      </div>

      <div className={`dgp-pipeline${playing ? ' is-playing' : ' is-paused'}`}>
        <PipelineCard eyebrow="条件" title="文字提示" detail="目标、属性与空间关系" tone="orange" active={stage === 'token'} />
        <FlowArrow state={tokenArrowState} />
        <PipelineCard eyebrow="共享主干" title="16B MoE dLLM" detail="并行预测被 Mask 的位置" tone="blue" active={stage === 'token'} />
        <FlowArrow state={tokenArrowState} />

        <div className={`dgp-token-card${stage === 'token' ? ' is-active' : ''}`}>
          <span>语义视觉 Token</span>
          <div className="dgp-token-grid" aria-label={`${revealedTokens} 个视觉 Token 已恢复`}>
            {TOKEN_LABELS.map((label, index) => (
              <b key={label} className={index < revealedTokens ? 'is-revealed' : ''}>
                {index < revealedTokens ? label : 'MASK'}
              </b>
            ))}
          </div>
          <small>4 段仅用于讲清“分批恢复”，不是论文采样步数</small>
        </div>

        <FlowArrow state={decoderArrowState} />
        <PipelineCard
          eyebrow="图像重建"
          title="6B Diffusion Decoder"
          detail={config.note}
          tone="purple"
          active={stage === 'decoder' && !completed}
        />
        <FlowArrow state={decoderArrowState} />

        <div className={`dgp-result-card${canvasReady ? ' is-ready' : ''}${completed ? ' is-complete' : ''}`}>
          <div className="dgp-result-heading">
            <span>1024² 图像</span>
            <b>{Math.round(decoderProgress * 100)}% 清晰</b>
          </div>
          <canvas ref={canvasRef} className="dgp-result-canvas" width={320} height={210} />
          <small>中间状态为教学可视化；终点采用论文 Figure 9 同组结果</small>
        </div>
      </div>

      <div className="dgp-feedback" aria-live="polite">
        <span>{stage === 'token' ? '阶段 A · 统一离散空间' : '阶段 B · 像素空间重建'}</span>
        <p>
          {stage === 'token'
            ? '此时 dLLM 预测的是离散视觉 Token，而不是直接生成像素；绿色 Token 逐批替换 MASK。'
            : completed
              ? `语义 Token 已经由 ${config.label} 重建为最终图像。`
              : `Decoder 正在将固定的语义 Token 还原为像素细节，当前为第 ${decoderStep} / ${config.decoderSteps} 步。`}
        </p>
      </div>

      <div className="dgp-metrics" aria-label="论文报告的速度与质量指标">
        <div className={mode === 'baseline' ? 'is-current' : ''}>
          <span>50 步基线</span>
          <strong>32.95 s</strong>
          <small>GenEval 0.89</small>
        </div>
        <div className={mode === 'distilled' ? 'is-current' : ''}>
          <span>8 步蒸馏</span>
          <strong>2.90 s</strong>
          <small>GenEval 0.87</small>
        </div>
        <div className="is-speedup">
          <span>Decoder 加速</span>
          <strong>11.4×</strong>
          <small>仅下降 0.02 GenEval</small>
        </div>
      </div>

      <p className="dgp-protocol-note">
        论文 Table 14 测试口径：单张 GPU、1024×1024、batch=1、BF16。播放器中的噪声与模糊过渡用于解释过程，不冒充论文未公开的逐步采样帧。
      </p>
    </div>
  );
}
