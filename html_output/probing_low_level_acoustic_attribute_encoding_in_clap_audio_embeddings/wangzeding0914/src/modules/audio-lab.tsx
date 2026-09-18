import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const C = {
  field: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  support: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
};

type Feature = 'RT60' | 'LUFS' | 'SC' | 'RP';
type Probe = 'Linear' | 'MLP' | 'Kernel';
type Stage = 'raw' | 'mono' | 'embedding';
type PairKey = 'music' | 'single';
type MetricStep = 0 | 1 | 2;
type TableKey = 'Table 1' | 'Table 2' | 'Table 3' | 'Table 4';
type DatasetKey = 'White Noise' | 'NSynth' | 'VCTK-Corpus' | 'MusDB18HQ' | 'SonicMaster';
type ModelKey = 'LAION-CLAP' | 'MS-CLAP 2023' | 'Whisper' | 'Wav2Vec2' | 'WavLM-Large' | 'MERT';

type DrawFn = (ctx: CanvasRenderingContext2D, time: number) => void;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
  lineWidth = 1,
) {
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
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = C.white, width = 2) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, size = 17) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.fillText(text, x, y);
}

function studioBase(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.field;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.light;
  ctx.fillRect(0, 228, W, 52);
  line(ctx, 0, 228, W, 228, C.border, 1);
  for (let x = 70; x < W; x += 120) {
    line(ctx, x, 244, x + 52, 244, 'rgba(118, 144, 106, 0.28)', 1);
  }
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  color: string,
  max = 1,
) {
  roundedRect(ctx, x, y, width, height, 7, C.white, C.border);
  const w = clamp(Math.abs(value) / max, 0, 1) * (width - 8);
  roundedRect(ctx, x + 4, y + 4, w, height - 8, 5, color);
  label(ctx, value.toFixed(2), x + width + 12, y + height - 10, value < 0 ? C.red : C.text, 15);
}

function waveform(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, channels = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let c = 0; c < channels; c += 1) {
    const cy = y + height * (c + 0.5) / channels;
    ctx.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const px = x + (i / 80) * width;
      const amp = Math.sin(i * 0.45) * 0.55 + Math.sin(i * 0.13) * 0.35;
      const py = cy + amp * (height / (channels * 4));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

function pointerValue(e: React.PointerEvent<HTMLCanvasElement>, minX: number, maxX: number) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * W;
  return clamp((x - minX) / (maxX - minX), 0, 1);
}

function PaperCanvas({
  draw,
  ariaLabel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  draw: DrawFn;
  ariaLabel: string;
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const render = (time: number) => {
      drawRef.current(ctx, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={onPointerDown ? { touchAction: 'none', cursor: 'grab' } : undefined}
    />
  );
}

const featureInfo: Record<Feature, { unit: string; range: string; value: string; color: string; note: string }> = {
  RT60: { unit: '秒', range: '0-2 s', value: '1.10 s', color: C.blue, note: '声能衰减 60 dB 的时间，越大通常尾音越长。' },
  LUFS: { unit: 'LUFS', range: '-40--10', value: '-24.0', color: C.orange, note: '感知响度尺度，不等同于峰值或 RMS。' },
  SC: { unit: 'Hz', range: '500-5000', value: '2200', color: '#c07100', note: '幅度频谱的加权中心，复杂混音中比 f0 更稳。' },
  RP: { unit: '半音', range: '由 SC 换算', value: '+27.9', color: C.purple, note: '相对 440 Hz 的对数半音尺度。' },
};

const stageInfo: Record<Stage, { label: string; shape: string; note: string }> = {
  raw: { label: '原始 x', shape: 'R^(C×T)', note: 'probe 还没有看到原始多通道波形。' },
  mono: { label: '单声道 x′', shape: 'R^(1×T)', note: '增强后下混成单声道，再送入编码器。' },
  embedding: { label: '嵌入 z', shape: 'R^512', note: '三个 probe 的唯一输入是冻结的 512 维 z。' },
};

const probeInfo: Record<Probe, { params: string; color: string; note: string; score: string; bend: number }> = {
  Linear: { params: '513 参数', color: C.blue, note: '只能找一根方向，适合检验近似线性。', score: 'SC/VCTK r=-0.29', bend: 0 },
  MLP: { params: '约 32.9k 参数', color: C.green, note: '有限非线性能贴近弯曲关系。', score: 'SC/VCTK R²=0.82', bend: 0.45 },
  Kernel: { params: 'M≤10^4 核样本', color: C.purple, note: '灵活非线性参照，但计算更重。', score: 'SC/VCTK R²=0.89', bend: 0.9 },
};

const datasets: Record<DatasetKey, { size: string; kind: string; complexity: number; result: string; note: string }> = {
  'White Noise': { size: '100k', kind: '合成噪声', complexity: 1, result: 'RT60 Kernel R²=0.99', note: '最受控：内容几乎不提供额外变化。' },
  NSynth: { size: '306k', kind: '单音符', complexity: 2, result: 'SC Linear R²=0.43', note: '单音让谱属性相对干净，是 SC 的边界案例。' },
  'VCTK-Corpus': { size: '44k', kind: '语音', complexity: 3, result: 'RT60 Linear R²=0.92', note: '干净语音适合观察声学属性；按说话人切分。' },
  MusDB18HQ: { size: '34k', kind: '混音', complexity: 4, result: 'SC Kernel R²=0.60', note: '复杂混音按歌曲切分，避免泄漏。' },
  SonicMaster: { size: '525k', kind: '母带', complexity: 5, result: 'RP Linear R²=0.82', note: '规模最大且流派均衡，最接近生产式音乐场景。' },
};

const models: Record<ModelKey, { values: Record<Feature, number | null>; note: string }> = {
  'LAION-CLAP': { values: { RT60: 0.92, LUFS: 0.92, SC: null, RP: 0.75 }, note: '主线模型的 VCTK Linear 视角；SC 线性失败，故用红色标出。' },
  'MS-CLAP 2023': { values: { RT60: 0.97, LUFS: 0.93, SC: 0.91, RP: 0.89 }, note: 'Table 3 中四个属性都可由非线性或线性 probe 读出，SC 也有部分线性恢复。' },
  Whisper: { values: { RT60: 0.96, LUFS: 0.99, SC: -0.91, RP: 0.89 }, note: 'LUFS 很强，但 SC 在该协议下仍不是线性好读的属性。' },
  Wav2Vec2: { values: { RT60: 0.95, LUFS: -0.5, SC: -0.9, RP: 0.87 }, note: 'LUFS 接近失败，论文将其与振幅不变性联系起来。' },
  'WavLM-Large': { values: { RT60: 0.98, LUFS: -0.31, SC: -0.93, RP: 0.91 }, note: 'RT60/RP 仍可读，但响度被归一化机制抹掉。' },
  MERT: { values: { RT60: 0.96, LUFS: -0.29, SC: -0.94, RP: 0.93 }, note: '卷积特征提取中的幅度归一化会移除全局响度尺度。' },
};

function drawMethod(ctx: CanvasRenderingContext2D, started: boolean, start: number, time: number) {
  studioBase(ctx);
  const p = started ? clamp((time - start) / 1800, 0, 1) : 0;
  const yOld = 88;
  const yNew = 188;
  label(ctx, '旧方法', 82, 57, C.red, 18);
  label(ctx, 'probing', 82, 158, C.green, 18);
  line(ctx, 184, yOld, 840, yOld, C.border, 4);
  line(ctx, 184, yNew, 840, yNew, C.border, 4);
  line(ctx, 184, yNew, 840, yNew, C.green, 4);
  const x = 184 + p * 656;
  dot(ctx, x, yOld, 17, started && p > 0.8 ? C.red : C.orange);
  dot(ctx, x, yNew, 17, started && p > 0.8 ? C.green : C.blue);
  roundedRect(ctx, 875, 58, 136, 61, 8, C.white, started ? C.red : C.border);
  roundedRect(ctx, 875, 158, 136, 61, 8, C.white, started ? C.green : C.border);
  label(ctx, started ? 'score' : '等待', 910, 94, started ? C.red : C.muted, 18);
  label(ctx, started ? 'ŷ' : '等待', 930, 195, started ? C.green : C.muted, 22);
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  line(ctx, 520, yNew - 42, 520, yNew + 42, C.blue, 2);
  ctx.setLineDash([]);
}

function drawStage(ctx: CanvasRenderingContext2D, stage: Stage) {
  studioBase(ctx);
  const keys: Stage[] = ['raw', 'mono', 'embedding'];
  const active = keys.indexOf(stage);
  const xs = [120, 422, 724];
  keys.forEach((key, i) => {
    roundedRect(ctx, xs[i], 55, 210, 134, 10, C.white, i === active ? C.orange : C.border, i === active ? 3 : 1);
    label(ctx, key === 'embedding' ? 'z' : key === 'mono' ? 'x′' : 'x', xs[i] + 18, 85, i === active ? C.orange : C.muted, 24);
    label(ctx, stageInfo[key].shape, xs[i] + 18, 174, C.muted, 15);
    if (key === 'raw') waveform(ctx, xs[i] + 34, 105, 140, 44, C.blue, 2);
    if (key === 'mono') waveform(ctx, xs[i] + 34, 114, 140, 35, C.blue, 1);
    if (key === 'embedding') {
      for (let b = 0; b < 32; b += 1) {
        const h = 12 + Math.sin(b * 0.75) * 8 + (b % 5) * 3;
        ctx.fillStyle = i === active ? C.green : C.light;
        ctx.fillRect(xs[i] + 28 + b * 5, 146 - h, 3, h);
      }
    }
  });
  for (let i = 0; i < 2; i += 1) {
    line(ctx, xs[i] + 225, 122, xs[i + 1] - 15, 122, i < active ? C.green : C.border, 3);
  }
}

function drawFeature(ctx: CanvasRenderingContext2D, feature: Feature, time: number) {
  studioBase(ctx);
  const info = featureInfo[feature];
  roundedRect(ctx, 80, 44, 360, 164, 12, C.white, C.border);
  roundedRect(ctx, 510, 44, 470, 164, 12, C.white, C.border);
  label(ctx, feature, 112, 86, info.color, 34);
  label(ctx, info.range, 112, 122, C.muted, 18);
  label(ctx, `${info.value} ${info.unit}`, 112, 166, C.text, 24);
  const phase = (time / 2500) % 1;
  const needle = -1.05 + ((Math.sin(phase * Math.PI * 2) + 1) / 2) * 2.1;
  dot(ctx, 690, 132, 61, '#f7faf3', C.border, 2);
  ctx.save();
  ctx.translate(690, 132);
  ctx.rotate(needle);
  line(ctx, 0, 0, 0, -47, info.color, 5);
  ctx.restore();
  dot(ctx, 690, 132, 8, info.color);
  if (feature === 'RT60') {
    for (let i = 0; i < 16; i += 1) {
      ctx.globalAlpha = 1 - i / 18;
      line(ctx, 775 + i * 8, 135 - Math.sin(i) * 18, 781 + i * 8, 135 + Math.sin(i) * 18, info.color, 2);
    }
    ctx.globalAlpha = 1;
  } else if (feature === 'LUFS') {
    drawBar(ctx, 764, 112, 160, 32, 0.62, info.color);
  } else if (feature === 'SC') {
    for (let i = 0; i < 18; i += 1) {
      const h = 8 + i * 2.2;
      ctx.fillStyle = i > 10 ? info.color : C.light;
      ctx.fillRect(764 + i * 8, 166 - h, 5, h);
    }
  } else {
    for (let i = 0; i < 9; i += 1) {
      line(ctx, 780 + i * 18, 166, 780 + i * 18, 106, i === 5 ? info.color : C.border, i === 5 ? 4 : 2);
    }
  }
}

function drawScale(ctx: CanvasRenderingContext2D, sc: number) {
  studioBase(ctx);
  const nx = clamp((sc - 500) / 4500, 0, 1);
  const rp = 12 * Math.log2(sc / 440);
  const rpNorm = clamp((rp + 12) / 60, 0, 1);
  const xSc = 120 + nx * 640;
  const xRp = 120 + rpNorm * 640;
  roundedRect(ctx, 78, 54, 730, 152, 12, C.white, C.border);
  label(ctx, 'SC', 104, 89, C.orange, 24);
  line(ctx, 120, 112, 760, 112, C.border, 3);
  line(ctx, 120, 170, 760, 170, C.border, 3);
  dot(ctx, xSc, 112, 13, C.orange);
  dot(ctx, xRp, 170, 13, C.purple);
  line(ctx, xSc, 112, xRp, 170, C.blue, 2);
  label(ctx, 'RP', 104, 177, C.purple, 24);
  roundedRect(ctx, 840, 72, 170, 106, 10, C.white, C.border);
  label(ctx, `${Math.round(sc)} Hz`, 875, 113, C.text, 24);
  label(ctx, `${rp >= 0 ? '+' : ''}${rp.toFixed(1)} st`, 875, 153, C.purple, 22);
}

function drawProbe(ctx: CanvasRenderingContext2D, probe: Probe) {
  studioBase(ctx);
  const info = probeInfo[probe];
  roundedRect(ctx, 78, 42, 610, 178, 12, C.white, C.border);
  line(ctx, 126, 184, 624, 184, C.border, 2);
  line(ctx, 126, 184, 126, 70, C.border, 2);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(150, 172);
  ctx.lineTo(612, 78);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(150, 172);
  if (probe === 'Linear') ctx.lineTo(612, 78);
  else ctx.bezierCurveTo(285, 178 - info.bend * 70, 430, 76 + info.bend * 55, 612, 78);
  ctx.stroke();
  for (let i = 0; i < 11; i += 1) {
    const x = 158 + i * 42;
    const y = 166 - i * 8 + Math.sin(i * 1.1) * 16;
    dot(ctx, x, y, 5, C.light, C.white, 1);
  }
  label(ctx, probe === 'Linear' ? '直线' : '弯曲', 548, 128, info.color, 18);
  roundedRect(ctx, 735, 62, 260, 132, 12, C.white, C.border);
  label(ctx, probe, 762, 101, info.color, 28);
  label(ctx, info.params, 762, 137, C.muted, 18);
  label(ctx, info.score, 762, 171, probe === 'Linear' ? C.red : C.green, 20);
}

function drawPoint(ctx: CanvasRenderingContext2D, point: 'A' | 'B' | 'C') {
  studioBase(ctx);
  roundedRect(ctx, 78, 42, 740, 180, 12, C.white, C.border);
  line(ctx, 124, 188, 760, 188, C.border, 2);
  line(ctx, 124, 188, 124, 70, C.border, 2);
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 9]);
  ctx.beginPath();
  ctx.moveTo(145, 176);
  ctx.lineTo(760, 82);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(145, 176);
  ctx.bezierCurveTo(300, 169, 430, 91, 760, 82);
  ctx.stroke();
  const pts = {
    A: { x: 230, y: 157, ly: 163 },
    // B sits on the curved trajectory; the red segment still marks its
    // residual from the dashed linear readout.
    B: { x: 430, y: 120, ly: 132 },
    C: { x: 675, y: 97, ly: 95 },
  };
  Object.entries(pts).forEach(([k, p]) => {
    dot(ctx, p.x, p.y, point === k ? 12 : 7, point === k ? C.orange : C.light, C.white, 2);
    label(ctx, k, p.x - 5, p.y - 18, point === k ? C.orange : C.muted, 14);
  });
  const p = pts[point];
  line(ctx, p.x, p.y, p.x, p.ly, point === 'A' ? C.blue : C.red, 3);
  roundedRect(ctx, 860, 75, 150, 100, 10, C.white, C.border);
  label(ctx, `点 ${point}`, 900, 116, C.orange, 28);
  label(ctx, point === 'B' ? '弯曲残差' : point === 'C' ? '边界尺度' : '接近路径', 878, 155, C.muted, 18);
}

function drawAugment(ctx: CanvasRenderingContext2D, amount: number, invalid: boolean) {
  studioBase(ctx);
  const n = amount / 100;
  roundedRect(ctx, 88, 42, 392, 184, 12, C.white, C.border);
  line(ctx, 190, 78, 190, 194, C.support, 6);
  line(ctx, 320, 78, 320, 194, invalid ? C.red : C.border, 6);
  roundedRect(ctx, 169, 184 - n * 104, 42, 28, 7, C.orange, C.white, 2);
  roundedRect(ctx, 299, invalid ? 82 + n * 78 : 134, 42, 28, 7, invalid ? C.red : C.light, C.white, 2);
  label(ctx, '目标', 168, 222, C.orange, 17);
  label(ctx, '干扰', 298, 222, invalid ? C.red : C.muted, 17);
  roundedRect(ctx, 555, 58, 410, 150, 12, C.white, C.border);
  // Leave a dedicated value column between each bar and its semantic label.
  // Without this gap, drawBar's numeric readout collides with "覆盖/稳定".
  drawBar(ctx, 604, 94, 180, 28, n, C.orange);
  drawBar(ctx, 604, 150, 180, 28, invalid ? n : 0.04, invalid ? C.red : C.green);
  label(ctx, '覆盖', 855, 115, C.text, 16);
  label(ctx, invalid ? '共变' : '稳定', 855, 171, invalid ? C.red : C.green, 16);
}

function drawMetric(ctx: CanvasRenderingContext2D, step: MetricStep) {
  studioBase(ctx);
  const rows = [
    { name: 'MAE', value: 0.34, color: C.orange, text: '误差' },
    { name: 'R²', value: 0.82, color: C.green, text: '方差' },
    { name: 'r', value: 0.72, color: C.blue, text: '方向' },
  ];
  rows.forEach((row, i) => {
    const y = 58 + i * 62;
    roundedRect(ctx, 92, y, 820, 40, 8, C.white, i === step ? row.color : C.border, i === step ? 3 : 1);
    label(ctx, row.name, 118, y + 27, i === step ? row.color : C.muted, 21);
    drawBar(ctx, 218, y + 7, 500, 26, row.value, i === step ? row.color : C.light);
    label(ctx, row.text, 780, y + 27, i === step ? C.text : C.muted, 18);
  });
}

function drawDataset(ctx: CanvasRenderingContext2D, selected: DatasetKey) {
  studioBase(ctx);
  const keys = Object.keys(datasets) as DatasetKey[];
  keys.forEach((key, i) => {
    const data = datasets[key];
    const x = 62 + i * 198;
    const h = 46 + data.complexity * 19;
    const y = 182 - h;
    roundedRect(ctx, x, y, 152, h, 10, C.white, key === selected ? C.orange : C.border, key === selected ? 3 : 1);
    label(ctx, `${i + 1}`, x + 14, y + 30, key === selected ? C.orange : C.muted, 22);
    drawBar(ctx, x + 14, y + h - 40, 86, 18, data.complexity / 5, key === selected ? C.blue : C.light);
  });
  const d = datasets[selected];
  roundedRect(ctx, 260, 210, 540, 44, 8, C.white, C.border);
  label(ctx, `${selected} · ${d.size} · ${d.result}`, 292, 239, C.text, 18);
}

function drawGeometry(ctx: CanvasRenderingContext2D, projection: number, pair: PairKey) {
  studioBase(ctx);
  const t = (projection + 1) / 2;
  const cubic = (p0: number, p1: number, p2: number, p3: number) =>
    (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
  const px = cubic(130, 285, 440, 690);
  const curveY = cubic(184, 160, 106, 79);
  roundedRect(ctx, 78, 42, 660, 180, 12, C.white, C.border);
  line(ctx, 128, 184, 694, 184, C.border, 2);
  line(ctx, 128, 184, 128, 68, C.border, 2);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(130, 184);
  ctx.bezierCurveTo(285, 160, 440, 106, 690, 79);
  ctx.stroke();
  dot(ctx, px, curveY, 14, C.orange);
  line(ctx, px, 184, px, curveY, C.orange, 2);
  label(ctx, 'p', 680, 204, C.text, 18);
  const cos = pair === 'music' ? 0.86 : 0.46;
  roundedRect(ctx, 790, 65, 210, 130, 12, C.white, C.border);
  label(ctx, 'cos', 820, 104, C.blue, 24);
  drawBar(ctx, 820, 130, 110, 26, cos, cos > 0.7 ? C.green : C.blue);
}

function drawModels(ctx: CanvasRenderingContext2D, model: ModelKey) {
  studioBase(ctx);
  const values = models[model].values;
  const keys: Feature[] = ['RT60', 'LUFS', 'SC', 'RP'];

  // Keep the score rows and the selected-model summary in separate canvas columns.
  roundedRect(ctx, 42, 30, 650, 184, 12, C.white, C.border);
  label(ctx, '四个属性的 R²', 68, 56, C.text, 18);
  label(ctx, 'VCTK-Corpus · 线性读出视角', 68, 77, C.muted, 13);
  keys.forEach((key, i) => {
    const value = values[key];
    const y = 88 + i * 30;
    roundedRect(ctx, 64, y, 606, 25, 6, C.field, C.border);
    label(ctx, key, 84, y + 18, featureInfo[key].color, 15);
    const shown = value === null ? -0.2 : value;
    const color = shown < 0.05 ? C.red : shown > 0.8 ? C.green : C.blue;
    drawBar(ctx, 190, y + 2, 320, 21, shown, color);
  });

  roundedRect(ctx, 726, 30, 312, 184, 12, C.white, C.border);
  label(ctx, '当前模型', 752, 59, C.muted, 15);
  label(ctx, '模型选择', 752, 81, C.blue, 13);
  label(ctx, model, 752, 119, C.text, model.length > 11 ? 22 : 25);
  line(ctx, 752, 145, 1010, 145, C.border, 1);
  label(ctx, 'VCTK · R²', 752, 171, C.muted, 16);
  label(ctx, '切换上方按钮查看差异', 752, 195, C.muted, 13);
}

const raceRows: Record<TableKey, { label: string; value: number; color: string; detail: string }[]> = {
  'Table 1': [
    { label: 'SC Linear r', value: -0.29, color: C.red, detail: 'VCTK 线性方向反了' },
    { label: 'SC MLP R²', value: 0.82, color: C.green, detail: '非线性恢复' },
    { label: 'SC Kernel R²', value: 0.89, color: C.green, detail: '最好读出' },
  ],
  'Table 2': [
    { label: 'RT60 4.2k', value: 0.73, color: C.green, detail: '少量数据已稳' },
    { label: 'LUFS 8.4k', value: 0.34, color: C.orange, detail: '仍需更多样本' },
    { label: 'LUFS 210k', value: 0.89, color: C.green, detail: '接近饱和' },
  ],
  'Table 3': [
    { label: 'MS-CLAP23 LUFS', value: 0.93, color: C.green, detail: '响度保留' },
    { label: 'Wav2Vec2 LUFS', value: -0.5, color: C.red, detail: '振幅不变' },
    { label: 'MERT LUFS', value: -0.29, color: C.red, detail: '振幅不变' },
  ],
  'Table 4': [
    { label: 'anechoic', value: 0.08, color: C.blue, detail: '近零' },
    { label: 'moderate', value: 1.1, color: C.green, detail: '排序合理' },
    { label: 'high', value: 1.8, color: C.green, detail: '上界附近' },
  ],
};

function drawRace(ctx: CanvasRenderingContext2D, table: TableKey, started: boolean, start: number, time: number) {
  studioBase(ctx);
  const p = started ? clamp((time - start) / 2200, 0, 1) : 0;
  const rows = raceRows[table];
  label(ctx, table, 86, 56, C.orange, 25);
  rows.forEach((row, i) => {
    const y = 82 + i * 54;
    roundedRect(ctx, 92, y, 780, 36, 8, C.white, C.border);
    label(ctx, row.label.slice(0, 14), 118, y + 25, C.text, 16);
    const max = table === 'Table 4' ? 2 : 1;
    const width = clamp(Math.abs(row.value) / max, 0, 1) * 420 * p;
    roundedRect(ctx, 360, y + 8, width, 20, 6, row.color);
    label(ctx, row.value.toFixed(2), 798, y + 25, row.value < 0 ? C.red : C.text, 16);
  });
  roundedRect(ctx, 902, 82, 126, 90, 12, started && p >= 1 ? C.green : C.white, started && p >= 1 ? C.green : C.border);
  label(ctx, started && p >= 1 ? '完成' : '核验', 932, 132, started && p >= 1 ? C.white : C.muted, 22);
}

function feedbackFor(args: {
  moduleId: string;
  started: boolean;
  stage: Stage;
  feature: Feature;
  sc: number;
  probe: Probe;
  point: 'A' | 'B' | 'C';
  amount: number;
  invalid: boolean;
  metricStep: MetricStep;
  dataset: DatasetKey;
  projection: number;
  pair: PairKey;
  model: ModelKey;
  table: TableKey;
  raceStarted: boolean;
}) {
  const { moduleId } = args;
  if (moduleId === '1.1') {
    return args.started
      ? { cls: 'good', text: '任务分数能说明可用性，probe 才直接检验表示里的属性。' }
      : { cls: '', text: '先让两种问法从同一个音频条件出发。' };
  }
  if (moduleId === '2.1') {
    return { cls: args.stage === 'embedding' ? 'good' : '', text: stageInfo[args.stage].note };
  }
  if (moduleId === '3.1') {
    return { cls: '', text: featureInfo[args.feature].note };
  }
  if (moduleId === '3.2') {
    const edge = args.sc < 850 || args.sc > 4500;
    return {
      cls: edge ? 'warm' : '',
      text: edge ? '边界附近的对数间距变化很明显，不能把尺度变化误读为属性消失。' : '拖动时，两个目标仍描述同一谱属性，但坐标尺度不同。',
    };
  }
  if (moduleId === '4.1') {
    return { cls: args.probe === 'Linear' ? 'warm' : 'good', text: probeInfo[args.probe].note };
  }
  if (moduleId === '4.2') {
    const map = {
      A: '当前点接近两条读出路径，差距不明显。',
      B: '中段弯曲让直线产生明显残差。',
      C: '边界点的尺度偏差会放大 MAE，即使方向仍然正确。',
    };
    return { cls: args.point === 'B' ? 'bad' : '', text: map[args.point] };
  }
  if (moduleId === '5.1') {
    if (args.invalid) return { cls: 'bad', text: '同时改变两个属性会重新引入 pipeline confound。' };
    if (args.amount < 25) return { cls: '', text: '目标变化太小，probe 很难看到稳定方向。' };
    if (args.amount > 80) return { cls: 'warm', text: '强度很大仍然可以是有效增强，但不要解释成同时改变了所有属性。' };
    return { cls: 'good', text: '单因素变化覆盖了目标范围，其他属性保持在控制条件内。' };
  }
  if (moduleId === '6.1') {
    return [
      { cls: '', text: 'MAE 直接告诉你平均差了多少原单位，越低越好。' },
      { cls: 'good', text: 'R² 看解释方差，1 好，0 相当于预测均值，负值比均值还差。' },
      { cls: '', text: 'r 看线性方向，负值表示预测方向反了。' },
    ][args.metricStep];
  }
  if (moduleId === '7.1') {
    return { cls: '', text: datasets[args.dataset].note };
  }
  if (moduleId === '8.1') {
    const near = Math.abs(args.projection) < 0.72;
    const pairText = args.pair === 'music' ? '该音乐混音配对的 RT60 方向相似度为 0.86。' : 'NSynth 与 VCTK 的 RT60 方向相似度为 0.46，高于随机基线约 0.035。';
    return { cls: near ? 'good' : 'warm', text: `${near ? '投影沿着 RT60 的主要方向单调变化。' : '离开带状结构时，单点预测误差会变大。'}${pairText}` };
  }
  if (moduleId === '9.1') {
    const badLufs = (models[args.model].values.LUFS ?? -1) < 0.05;
    return { cls: badLufs ? 'bad' : 'good', text: models[args.model].note };
  }
  if (moduleId === '10.1') {
    if (!args.raceStarted) return { cls: '', text: '选择一张证据表，先确认它的 dataset、metric 和方向。' };
    const text = {
      'Table 1': 'SC 的非线性差距最大；这不是“信息不存在”的证据。',
      'Table 2': '数据效率依赖属性：RT60 早稳，LUFS 更吃样本。',
      'Table 3': '模型架构决定响度是否还留在表示里。',
      'Table 4': '文本侧是定性对应，存在边界外推和语义排序问题。',
    }[args.table];
    return { cls: args.table === 'Table 1' || args.table === 'Table 2' ? 'good' : 'warm', text };
  }
  return { cls: '', text: '选择一个状态，观察画面和反馈如何同步变化。' };
}

export const AudioLab: React.FC<WidgetProps> = ({ moduleId }) => {
  const [started, setStarted] = useState(false);
  const methodStartRef = useRef(0);
  const [stage, setStage] = useState<Stage>('raw');
  const [feature, setFeature] = useState<Feature>('RT60');
  const [sc, setSc] = useState(2200);
  const [probe, setProbe] = useState<Probe>('Linear');
  const [point, setPoint] = useState<'A' | 'B' | 'C'>('A');
  const [amount, setAmount] = useState(50);
  const [invalid, setInvalid] = useState(false);
  const [metricStep, setMetricStep] = useState<MetricStep>(0);
  const [dataset, setDataset] = useState<DatasetKey>('White Noise');
  const [projection, setProjection] = useState(0);
  const [pair, setPair] = useState<PairKey>('music');
  const [model, setModel] = useState<ModelKey>('LAION-CLAP');
  const [table, setTable] = useState<TableKey>('Table 1');
  const [raceStarted, setRaceStarted] = useState(false);
  const raceStartRef = useRef(0);

  const feedback = feedbackFor({
    moduleId,
    started,
    stage,
    feature,
    sc,
    probe,
    point,
    amount,
    invalid,
    metricStep,
    dataset,
    projection,
    pair,
    model,
    table,
    raceStarted,
  });

  const draw: DrawFn = (ctx, time) => {
    if (moduleId === '1.1') drawMethod(ctx, started, methodStartRef.current, time);
    else if (moduleId === '2.1') drawStage(ctx, stage);
    else if (moduleId === '3.1') drawFeature(ctx, feature, time);
    else if (moduleId === '3.2') drawScale(ctx, sc);
    else if (moduleId === '4.1') drawProbe(ctx, probe);
    else if (moduleId === '4.2') drawPoint(ctx, point);
    else if (moduleId === '5.1') drawAugment(ctx, amount, invalid);
    else if (moduleId === '6.1') drawMetric(ctx, metricStep);
    else if (moduleId === '7.1') drawDataset(ctx, dataset);
    else if (moduleId === '8.1') drawGeometry(ctx, projection, pair);
    else if (moduleId === '9.1') drawModels(ctx, model);
    else if (moduleId === '10.1') drawRace(ctx, table, raceStarted, raceStartRef.current, time);
    else studioBase(ctx);
  };

  const setScFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const n = pointerValue(e, 120, 760);
    setSc(Math.round((500 + n * 4500) / 10) * 10);
  };

  const setProjectionFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const n = pointerValue(e, 130, 690);
    setProjection(Number((-1 + n * 2).toFixed(2)));
  };

  const pointerHandlers =
    moduleId === '3.2'
      ? {
          onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setScFromPointer(e);
          },
          onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) setScFromPointer(e);
          },
          onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          },
        }
      : moduleId === '8.1'
        ? {
            onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setProjectionFromPointer(e);
            },
            onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) setProjectionFromPointer(e);
            },
            onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
            },
          }
        : {};

  const startMethod = () => {
    methodStartRef.current = performance.now();
    setStarted((value) => !value);
  };

  const startRace = () => {
    raceStartRef.current = performance.now();
    setRaceStarted(true);
  };

  const goHome = () => {
    const home = document.querySelector<HTMLButtonElement>('.slide-sidebar-item');
    home?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderControls = () => {
    if (moduleId === '1.1') {
      return (
        <div className="step-ctrl">
          <button className="tiny" type="button" onClick={startMethod}>
            {started ? '重置对照' : '开始对照'}
          </button>
          <span className="step-label">传统分数 vs probing 读出</span>
        </div>
      );
    }
    if (moduleId === '2.1') {
      return (
        <div className="chip-row">
          {(Object.keys(stageInfo) as Stage[]).map((key) => (
            <button key={key} className={`chip ${stage === key ? 'selected' : ''}`} type="button" onClick={() => setStage(key)}>
              {stageInfo[key].label}
            </button>
          ))}
        </div>
      );
    }
    if (moduleId === '3.1') {
      return (
        <div className="chip-row">
          {(['RT60', 'LUFS', 'SC', 'RP'] as Feature[]).map((key) => (
            <button key={key} className={`chip ${feature === key ? 'selected' : ''}`} type="button" onClick={() => setFeature(key)}>
              {key}
            </button>
          ))}
        </div>
      );
    }
    if (moduleId === '3.2') {
      return (
        <div className="ctrl">
          <label>
            SC <span className="val">{Math.round(sc)} Hz</span>
          </label>
          <input type="range" min={500} max={5000} step={10} value={sc} onChange={(e) => setSc(Number(e.target.value))} />
        </div>
      );
    }
    if (moduleId === '4.1') {
      return (
        <div className="chip-row">
          {(['Linear', 'MLP', 'Kernel'] as Probe[]).map((key) => (
            <button key={key} className={`chip ${probe === key ? 'selected' : ''}`} type="button" onClick={() => setProbe(key)}>
              {key}
            </button>
          ))}
        </div>
      );
    }
    if (moduleId === '4.2') {
      return (
        <div className="chip-row">
          {(['A', 'B', 'C'] as const).map((key) => (
            <button key={key} className={`chip ${point === key ? 'selected' : ''}`} type="button" onClick={() => setPoint(key)}>
              点 {key}
            </button>
          ))}
        </div>
      );
    }
    if (moduleId === '5.1') {
      return (
        <>
          <div className="ctrl">
            <label>
              目标强度 <span className="val">{amount}%</span>
            </label>
            <input type="range" min={0} max={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="chip-row">
            <button className={`chip ${invalid ? 'selected danger' : ''}`} type="button" onClick={() => setInvalid((v) => !v)}>
              {invalid ? '关闭共变示例' : '打开错误共变示例'}
            </button>
          </div>
        </>
      );
    }
    if (moduleId === '6.1') {
      return (
        <div className="step-ctrl">
          <button className="tiny ghost" type="button" disabled={metricStep === 0} onClick={() => setMetricStep((s) => Math.max(0, s - 1) as MetricStep)}>
            上一步
          </button>
          <span className="step-label">
            <b>{metricStep + 1}</b> / 3
          </span>
          <button className="tiny" type="button" disabled={metricStep === 2} onClick={() => setMetricStep((s) => Math.min(2, s + 1) as MetricStep)}>
            下一步
          </button>
        </div>
      );
    }
    if (moduleId === '7.1') {
      return (
        <div className="chip-row">
          {(Object.keys(datasets) as DatasetKey[]).map((key) => (
            <button key={key} className={`chip ${dataset === key ? 'selected' : ''}`} type="button" onClick={() => setDataset(key)}>
              {key}
            </button>
          ))}
        </div>
      );
    }
    if (moduleId === '8.1') {
      return (
        <>
          <div className="ctrl">
            <label>
              投影 p <span className="val">{projection.toFixed(2)}</span>
            </label>
            <input type="range" min={-1} max={1} step={0.01} value={projection} onChange={(e) => setProjection(Number(e.target.value))} />
          </div>
          <div className="chip-row">
            <button className={`chip ${pair === 'music' ? 'selected' : ''}`} type="button" onClick={() => setPair('music')}>
              MusDB18HQ ↔ SonicMaster
            </button>
            <button className={`chip ${pair === 'single' ? 'selected' : ''}`} type="button" onClick={() => setPair('single')}>
              NSynth ↔ VCTK-Corpus
            </button>
          </div>
        </>
      );
    }
    if (moduleId === '9.1') {
      return (
        <div className="chip-row audio-chip-wrap">
          {(Object.keys(models) as ModelKey[]).map((key) => (
            <button key={key} className={`chip ${model === key ? 'selected' : ''}`} type="button" onClick={() => setModel(key)}>
              {key}
            </button>
          ))}
        </div>
      );
    }
    if (moduleId === '10.1') {
      return (
        <>
          <div className="chip-row">
            {(['Table 1', 'Table 2', 'Table 3', 'Table 4'] as TableKey[]).map((key) => (
              <button
                key={key}
                className={`chip ${table === key ? 'selected' : ''}`}
                type="button"
                onClick={() => {
                  setTable(key);
                  setRaceStarted(false);
                }}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="step-ctrl">
            <button className="tiny" type="button" onClick={startRace}>
              {raceStarted ? '重新核验' : '开始核验'}
            </button>
            <button className="tiny ghost" type="button" onClick={goHome}>
              回到开头
            </button>
          </div>
        </>
      );
    }
    return null;
  };

  const renderReadout = () => {
    if (moduleId === '3.2') {
      const rp = 12 * Math.log2(sc / 440);
      return (
        <div className="audio-readout">
          <span>SC: {Math.round(sc)} Hz</span>
          <span>RP: {rp >= 0 ? '+' : ''}{rp.toFixed(1)} 半音</span>
          <span>公式来自论文 2.1 节</span>
        </div>
      );
    }
    if (moduleId === '4.1') {
      const info = probeInfo[probe];
      return (
        <div className="audio-readout">
          <span>{probe}</span>
          <span>{info.params}</span>
          <span>{info.score}</span>
        </div>
      );
    }
    if (moduleId === '5.1') {
      return (
        <div className="audio-readout">
          <span>RT60: {(amount / 50).toFixed(2)} s</span>
          <span>LUFS: {(-40 + amount * 0.3).toFixed(1)}</span>
          <span>{invalid ? '错误示例：两个属性共变' : '控制：一次只改变一个属性'}</span>
        </div>
      );
    }
    if (moduleId === '7.1') {
      const d = datasets[dataset];
      return (
        <div className="audio-readout">
          <span>{d.kind}</span>
          <span>{d.size} samples</span>
          <span>{d.result}</span>
        </div>
      );
    }
    if (moduleId === '9.1') {
      const values = models[model].values;
      return (
        <div className="audio-readout">
          {(['RT60', 'LUFS', 'SC', 'RP'] as Feature[]).map((key) => (
            <span key={key}>{key}: {values[key] === null ? '失败' : values[key]?.toFixed(2)}</span>
          ))}
        </div>
      );
    }
    if (moduleId === '10.1') {
      return (
        <div className="audio-evidence-list" aria-label="当前证据记录">
          {raceRows[table].map((row) => (
            <span key={row.label}>
              <b>{row.label}</b> {row.value.toFixed(2)} · {row.detail}
            </span>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="audio-widget">
      <PaperCanvas
        draw={draw}
        ariaLabel={`PaperSkill 交互模块 ${moduleId}`}
        onPointerDown={pointerHandlers.onPointerDown}
        onPointerMove={pointerHandlers.onPointerMove}
        onPointerUp={pointerHandlers.onPointerUp}
      />
      {renderControls()}
      {renderReadout()}
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default AudioLab;
