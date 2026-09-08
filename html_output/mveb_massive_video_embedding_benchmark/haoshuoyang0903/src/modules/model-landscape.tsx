import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeOutCubic, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { STORY_COLORS as C, clearStoryCanvas, label } from './storyKit';

type ModelId = 'lco' | 'ebind' | 'qwen';

const ABILITIES = [
  { key: 'classification', label: '分类', metric: 'Accuracy' },
  { key: 'zeroShot', label: '零样本', metric: 'Accuracy' },
  { key: 'clustering', label: '聚类', metric: 'V-measure' },
  { key: 'retrieval', label: '检索', metric: 'nDCG@10' },
  { key: 'pair', label: '成对', metric: 'max-AP' },
  { key: 'qa', label: '视频问答', metric: 'Accuracy' },
] as const;

const MODELS = {
  lco: {
    name: 'LCO-Embedding-Omni-7B',
    short: 'Embedding-specific MLLM',
    color: C.green,
    values: { classification: 59.2, zeroShot: 55.5, clustering: 27.3, retrieval: 58.7, pair: 79.6, qa: 57.0 },
    note: '它在 MVEB 的 23-task Borda 总榜排第 1，但没有拿下每一类任务。',
  },
  ebind: {
    name: 'eBind-full',
    short: 'Multimodal binding',
    color: C.purple,
    values: { classification: 51.3, zeroShot: 61.1, clustering: 20.1, retrieval: 62.3, pair: 75.4, qa: 31.4 },
    note: '它在检索和零样本任务上靠前，视频问答的表现则弱得多。',
  },
  qwen: {
    name: 'Qwen2.5-Omni-7B',
    short: '生成式 MLLM 直接取嵌入',
    color: C.red,
    values: { classification: 20.2, zeroShot: 16.5, clustering: 7.5, retrieval: 0.5, pair: 53.2, qa: 13.2 },
    note: '不做专门的嵌入训练，直接取生成式模型的表征，多数任务表现较弱。',
  },
} as const;

const MODEL_IDS = Object.keys(MODELS) as ModelId[];
const AXIS_COUNT = ABILITIES.length;

function radarPoint(
  centerX: number,
  centerY: number,
  radius: number,
  index: number,
) {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / AXIS_COUNT);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
    angle,
  };
}

function tracePolygon(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
}

function drawRadarGrid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) {
  [0.25, 0.5, 0.75, 1].forEach((level) => {
    const points = ABILITIES.map((_, index) => radarPoint(centerX, centerY, radius * level, index));
    ctx.strokeStyle = level === 1 ? '#aebbc9' : '#d7deea';
    ctx.lineWidth = level === 1 ? 1.4 : 1;
    tracePolygon(ctx, points);
    ctx.stroke();
  });
  ABILITIES.forEach((_, index) => {
    const point = radarPoint(centerX, centerY, radius, index);
    ctx.strokeStyle = '#c8d2df';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  });
}

function drawRadarShape(
  ctx: CanvasRenderingContext2D,
  values: (typeof MODELS)[ModelId]['values'],
  color: string,
  centerX: number,
  centerY: number,
  radius: number,
  progress: number,
  fillAlpha = 0.2,
) {
  const points = ABILITIES.map((ability, index) => (
    radarPoint(centerX, centerY, radius * (values[ability.key] / 100) * progress, index)
  ));
  ctx.save();
  tracePolygon(ctx, points);
  ctx.globalAlpha = fillAlpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  points.forEach((point) => {
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function drawRadarLabels(
  ctx: CanvasRenderingContext2D,
  model: (typeof MODELS)[ModelId],
  centerX: number,
  centerY: number,
  labelRadius: number,
) {
  ABILITIES.forEach((ability, index) => {
    const point = radarPoint(centerX, centerY, labelRadius, index);
    const cosine = Math.cos(point.angle);
    const align: CanvasTextAlign = Math.abs(cosine) < 0.2 ? 'center' : cosine > 0 ? 'left' : 'right';
    const value = model.values[ability.key];
    label(
      ctx,
      ability.label + '  ' + value.toFixed(1),
      point.x,
      point.y - 5,
      model.color,
      align,
      '800 10px "Microsoft YaHei", sans-serif',
    );
    label(
      ctx,
      ability.metric,
      point.x,
      point.y + 8,
      C.muted,
      align,
      '8px "Segoe UI", sans-serif',
    );
  });
}

function LandscapeAnalogy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 244, 130);
    const draw = () => {
      clearStoryCanvas(ctx, 244, 130);
      drawRadarGrid(ctx, 122, 59, 38);
      drawRadarShape(ctx, MODELS.lco.values, MODELS.lco.color, 122, 59, 38, 1, 0.08);
      drawRadarShape(ctx, MODELS.ebind.values, MODELS.ebind.color, 122, 59, 38, 1, 0.08);
      drawRadarShape(ctx, MODELS.qwen.values, MODELS.qwen.color, 122, 59, 38, 1, 0.06);
      label(ctx, '三个模型，三种能力轮廓', 122, 112, C.text, 'center', '700 10px "Microsoft YaHei", sans-serif');
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, []);
  return (
    <canvas
      ref={canvasRef}
      width={244}
      height={130}
      role="img"
      aria-label="三个代表模型在六类任务上形成不同的雷达图轮廓。"
    />
  );
}

export const ModelLandscape: React.FC<WidgetProps> = ({ moduleId }) => {
  const isAnalogy = moduleId === 'ana';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelId, setModelId] = useState<ModelId>('lco');
  const [epoch, setEpoch] = useState(0);
  const model = MODELS[modelId];

  useEffect(() => {
    if (isAnalogy) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 560, 280);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let frame: number | null = null;
    let began = 0;
    const render = (now: number) => {
      if (!began) began = now;
      const progress = reduced ? 1 : easeOutCubic(clamp((now - began) / 650, 0, 1));
      clearStoryCanvas(ctx, 560, 280);
      label(ctx, model.name, 18, 18, model.color, 'left', '800 13px "Segoe UI", sans-serif');
      label(ctx, '六条轴保留各自论文指标', 542, 18, C.muted, 'right', '10px "Microsoft YaHei", sans-serif');
      drawRadarGrid(ctx, 280, 139, 70);
      drawRadarShape(ctx, model.values, model.color, 280, 139, 70, progress);
      drawRadarLabels(ctx, model, 280, 139, 98);
      label(
        ctx,
        '雷达图只用来看能力分布。Accuracy、V-measure、max-AP 与 nDCG@10 不能直接横向比较。',
        280,
        264,
        C.muted,
        'center',
        '9px "Microsoft YaHei", sans-serif',
      );
      canvas.classList.add('is-ready');
      if (progress < 1 && !reduced) frame = requestAnimationFrame(render);
    };
    const start = () => {
      began = 0;
      if (frame === null) frame = requestAnimationFrame(render);
    };
    const stop = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [epoch, isAnalogy, model]);

  if (isAnalogy) return <LandscapeAnalogy />;

  const selectModel = (id: ModelId) => {
    setModelId(id);
    setEpoch((value) => value + 1);
  };

  return (
    <div className="story-widget model-landscape">
      <div className="story-kicker">33 MODELS · 6 EMBEDDING PARADIGMS</div>
      <div className="chip-row" role="group" aria-label="选择代表模型">
        {MODEL_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={'chip ' + (modelId === id ? 'selected' : '')}
            aria-pressed={modelId === id}
            onClick={() => selectModel(id)}
          >
            {MODELS[id].name}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={280}
        role="img"
        aria-label={model.name + ' 在六类任务上的雷达图；每条轴使用该任务自己的论文指标。'}
      />
      <div className="story-verdict">No single model dominates.</div>
      <div className="feedback" role="status" aria-live="polite">
        {model.short}｜{model.note}
      </div>
    </div>
  );
};

export default ModelLandscape;
