import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const DURATION = 2.4;
const LX0 = 120;
const LX1 = 520;
const RX0 = 620;
const RX1 = 1020;
const Y_BASE = 196;
const Y_TOP = 44;

const NAIVE_PROFILE: number[] = Array.from({ length: 128 }, (_, i) => {
  const saw = (i % 8) / 8;
  if (i < 16) return 1.5 + saw;
  if (i < 32) return 1.3 + saw * 0.3;
  if (i < 64) return 1.1 + saw * 0.2;
  return 0.95 + saw * 0.1;
});

const DISTILLED_PROFILE: number[] = Array.from(
  { length: 128 },
  (_, i) => 0.98 + ((i * 53) % 7) / 175
);

const HIST_LEFT = [34, 10, 20, 6, 22, 11, 32];
const HIST_RIGHT = [4, 9, 18, 23, 18, 9, 4];

type Fb = { text: string; cls: '' | 'good' | 'bad' };
const IDLE_LINE: Fb = {
  text: '按下开始：左侧朴素前缀-BT，右侧蒸馏，从同一基线同步播放。',
  cls: '',
};
const RUNNING_LINE: Fb = {
  text: '观察第 0–15 维：左侧 σd 已升到 1.5–2.5，边际出现双峰。',
  cls: '',
};
const DONE_LINES: Fb[] = [
  {
    text: '蒸馏 σd≈1、边际近高斯；朴素的阶梯正好落在 16/32/64，与梯度多重性 4/3/2/1 对应。',
    cls: 'good',
  },
  {
    text: '朴素 FIRST−RANDOM 差 0.059（0.441 对 0.382），是梯度失衡；蒸馏只差 0.014（0.486 对 0.472）。',
    cls: 'bad',
  },
];

type Phase = 'idle' | 'running' | 'done';

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 14, W, 14);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 14);
  ctx.lineTo(W, H - 14);
  ctx.stroke();
}

function axes(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, Y_BASE);
  ctx.lineTo(x1, Y_BASE);
  ctx.moveTo(x0, Y_BASE);
  ctx.lineTo(x0, Y_TOP);
  ctx.stroke();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  for (let v = 0.5; v <= 2.5; v += 0.5) {
    const y = map(v, 0, 2.8, Y_BASE, Y_TOP);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }
}

function drawProfile(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  profile: number[],
  progress: number,
  color: string
) {
  const n = Math.floor(progress * 128);
  if (n < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = map(i, 0, 127, x0, x1);
    const y = map(clamp(profile[i], 0, 2.8), 0, 2.8, Y_BASE, Y_TOP);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawHistogram(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  heights: number[],
  color: string,
  alpha: number
) {
  const bw = 54;
  const bh = 36;
  if (alpha <= 0.01) return;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(x, y, bw, bh);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, bw, bh);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  heights.forEach((v, i) => {
    ctx.fillRect(x + 3 + i * 7, y + bh - 3 - v * 0.75, 5, v * 0.75);
  });
  ctx.globalAlpha = 1;
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  value: number,
  color: string,
  growth: number,
  dim: number
) {
  const shown = value * growth;
  const h = clamp(map(shown, 0.36, 0.5, 4, 46), 0, 46);
  ctx.globalAlpha = dim;
  ctx.fillStyle = color;
  ctx.fillRect(x, 268 - h, 46, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#21324a';
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(shown.toFixed(3), x + 23, 266 - h - 5);
}

function render(
  ctx: CanvasRenderingContext2D,
  st: { phase: Phase; progress: number; doneAt: number },
  now: number
) {
  clearScene(ctx);
  axes(ctx, LX0, LX1);
  axes(ctx, RX0, RX1);

  const segs: [number, number][] = [
    [0, 15],
    [16, 31],
    [32, 63],
    [64, 127],
  ];
  const alphas = [0.12, 0.09, 0.06, 0.035];
  segs.forEach(([a, b], i) => {
    ctx.fillStyle = `rgba(196, 63, 82, ${alphas[i]})`;
    ctx.fillRect(
      map(a, 0, 127, LX0, LX1),
      Y_TOP,
      map(b, 0, 127, LX0, LX1) - map(a, 0, 127, LX0, LX1),
      Y_BASE - Y_TOP
    );
  });

  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LX0, map(1, 0, 2.8, Y_BASE, Y_TOP));
  ctx.lineTo(LX1, map(1, 0, 2.8, Y_BASE, Y_TOP));
  ctx.moveTo(RX0, map(1, 0, 2.8, Y_BASE, Y_TOP));
  ctx.lineTo(RX1, map(1, 0, 2.8, Y_BASE, Y_TOP));
  ctx.stroke();
  ctx.setLineDash([]);

  drawProfile(ctx, LX0, LX1, NAIVE_PROFILE, st.progress, '#c43f52');
  drawProfile(ctx, RX0, RX1, DISTILLED_PROFILE, st.progress, '#228d5c');

  const histX = [LX0 + 30, LX0 + 115, LX0 + 200];
  histX.forEach((x) => drawHistogram(ctx, x, 50, HIST_LEFT, '#c43f52', st.progress));
  const histXR = [RX0 + 30, RX0 + 115, RX0 + 200];
  histXR.forEach((x) => drawHistogram(ctx, x, 50, HIST_RIGHT, '#228d5c', st.progress));

  drawBar(ctx, 170, 0.441, '#c43f52', st.progress, 1);
  drawBar(ctx, 270, 0.382, '#c43f52', st.progress, 0.55);
  drawBar(ctx, 670, 0.486, '#228d5c', st.progress, 1);
  drawBar(ctx, 770, 0.472, '#228d5c', st.progress, 0.55);

  ctx.fillStyle = '#21324a';
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('σd', 62, 40);
  ctx.fillText('维度', 470, 216);
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillStyle = '#68778f';
  ctx.textAlign = 'right';
  ctx.fillText('1.0', 112, map(1, 0, 2.8, Y_BASE, Y_TOP) + 4);
  ctx.fillText('2.5', 112, map(2.5, 0, 2.8, Y_BASE, Y_TOP) + 4);
  ctx.textAlign = 'left';

  ctx.font = '16px "Segoe UI", sans-serif';
  let lx = 560;
  (
    [
      ['#c43f52', '朴素-BT'],
      ['#228d5c', '蒸馏'],
      ['#68778f', 'σd=1'],
    ] as [string, string][]
  ).forEach(([color, label]) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, 24, 12, 12);
    ctx.fillStyle = '#21324a';
    ctx.fillText(label, lx + 18, 35);
    lx += 20 + ctx.measureText(label).width + 24;
  });

  if (st.phase === 'done') {
    const flash = clamp(1 - (now - st.doneAt) / 900, 0, 1) * 0.9;
    if (flash > 0.01) {
      ctx.strokeStyle = '#c43f52';
      ctx.globalAlpha = flash;
      ctx.lineWidth = 4;
      ctx.strokeRect(42, 36, 518, 218);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = '#228d5c';
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3;
    ctx.strokeRect(600, 36, 440, 218);
    ctx.globalAlpha = 1;
  }
}

export const Ch9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ phase: Phase; progress: number; doneAt: number }>({
    phase: 'idle',
    progress: 0,
    doneAt: 0,
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [lines, setLines] = useState<Fb[]>([IDLE_LINE]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const st = stateRef.current;
      if (st.phase === 'running') {
        st.progress += dt / DURATION;
        if (st.progress >= 1) {
          st.progress = 1;
          st.phase = 'done';
          st.doneAt = now;
          setPhase('done');
          setLines(DONE_LINES);
        }
      }
      render(ctx, st, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
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

  const launch = () => {
    const st = stateRef.current;
    st.phase = 'running';
    st.progress = 0;
    st.doneAt = 0;
    setPhase('running');
    setLines([RUNNING_LINE]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={launch} disabled={phase === 'running'} aria-disabled={phase === 'running'}>
          {phase === 'idle' ? '开始对比' : phase === 'running' ? '对比中…' : '重新开始'}
        </button>
      </div>
      {lines.map((l, i) => (
        <div key={i} className={`feedback ${l.cls}`}>
          {l.text}
        </div>
      ))}
    </div>
  );
};

export default Ch9Mod2;
