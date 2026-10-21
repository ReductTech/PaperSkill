import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10.1 同一套题，两种协议：五个数据集上的一次读片 / 证据寻求成对对照，
// 以及细粒度任务上与各自最强基线的对照。数字全部取自论文 p.10 Table 2 与 p.11 Table 3。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const ENV = '#b8c9a7';
const ENV_D = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';
const FONT_L = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
const FONT_S = '18px "Segoe UI", "Microsoft YaHei", sans-serif';

type View = 'overall' | 'fine';
type Pair = { name: string; base: number; alt: number };

// 总体诊断：一次读片协议（OP）→ 证据寻求协议（ES），三个肾癌数据集为平衡准确率，
// 前列腺与侵袭为普通准确率。全部越大越好。
const OVERALL: Pair[] = [
  { name: 'TCGA-RCC', base: 59.24, alt: 92.28 },
  { name: '西京-RCC', base: 71.84, alt: 97.13 },
  { name: '复旦-RCC', base: 52.29, alt: 91.79 },
  { name: 'TCGA-PRAD', base: 84.56, alt: 92.17 },
  { name: 'TCGA-Invasion', base: 69.57, alt: 81.64 },
];

// 细粒度任务：论文方法对各自任务上的最强对照。核分级为低级别 / 高级别二分准确率。
const FINE: Pair[] = [
  { name: '核分级 西京', base: 55.56, alt: 64.81 },
  { name: '核分级 复旦', base: 51.61, alt: 69.35 },
  { name: 'Gleason 合并', base: 25.57, alt: 40.72 },
  { name: '侵袭 F1', base: 57.04, alt: 71.50 },
];

const START_TEXT = '五个数据集、两套协议，先看整体。';
const FINE_TEXT = '核分级 64.81 / 69.35（西京 / 复旦），Gleason 合并评分 40.72，侵袭 F1 71.50。';
const OVERALL_TEXT = 'RCC 从 59.24 到 92.28；前列腺 84.56 到 92.17；侵袭 69.57 到 81.64。';
const FINE_HINT =
  '这里的 64.81 / 69.35 是「低级别 vs 高级别」的二分准确率，不是精确到 1–4 级的准确率。';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = ENV;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.globalAlpha = clamp(alpha + 0.35, 0, 1);
  ctx.strokeStyle = ENV_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted: boolean
) {
  ctx.save();
  ctx.font = muted ? FONT_S : FONT_L;
  ctx.fillStyle = muted ? MUTED : INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string; outline: boolean }[],
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = FONT_S;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.outline) {
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 2;
      roundRect(ctx, cx, y - 7, 14, 14, 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = it.color;
      roundRect(ctx, cx, y - 7, 14, 14, 4);
      ctx.fill();
    }
    ctx.fillStyle = MUTED;
    ctx.fillText(it.label, cx + 20, y);
    cx += 20 + ctx.measureText(it.label).width + 18;
  }
  ctx.restore();
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW: number,
  h: number,
  value: number,
  p: number,
  color: string
) {
  ctx.save();
  roundRect(ctx, x, y, maxW, h, h / 2);
  ctx.fillStyle = 'rgba(215, 222, 234, 0.5)';
  ctx.fill();
  ctx.restore();

  const w = (clamp(value, 0, 100) / 100) * maxW * clamp(p, 0, 1);
  if (w > 1) {
    ctx.save();
    roundRect(ctx, x, y, Math.max(w, h), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }
}

function drawBarNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW: number,
  h: number,
  value: number,
  p: number,
  color: string
) {
  const a = clamp((clamp(p, 0, 1) - 0.15) / 0.5, 0, 1);
  if (a <= 0.02) return;
  const w = (clamp(value, 0, 100) / 100) * maxW * clamp(p, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = FONT_S;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toFixed(2), x + w + 8, y + h / 2 + 1);
  ctx.restore();
}

function render(
  ctx: CanvasRenderingContext2D,
  s: { view: View; progress: number; narrow: boolean }
) {
  ctx.clearRect(0, 0, W, H);
  clearScene(ctx, W, H);
  drawBoard(ctx, 20, 8, 1040, 264, 0.14);

  const groups = s.view === 'overall' ? OVERALL : FINE;
  const n = groups.length;
  const narrow = s.narrow;
  const x0 = 160;
  const barMax = narrow ? 830 : 490;
  const axisTop = 42;
  const axisBottom = narrow ? 234 : 256;
  const top0 = 44;
  const blockH = 34;
  const barH = 15;
  const rowGap = 4;
  const pitch = n > 1 ? (axisBottom - top0 - blockH) / (n - 1) : 0;

  const pBase = clamp(s.progress, 0, 1);
  const pAlt = clamp((s.progress - 0.08) / 0.92, 0, 1);

  // 当前查看的一组：柔和的强调底 + 该组名字变橙
  const top0Focus = top0;
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = ORANGE;
  roundRect(ctx, x0 - 12, top0Focus - 5, barMax + 24, blockH + 10, 8);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = ORANGE;
  roundRect(ctx, x0 - 20, top0Focus - 2, 4, blockH + 4, 2);
  ctx.fill();
  ctx.restore();

  // 1. 数据集 / 任务名标签
  ctx.save();
  ctx.font = FONT_S;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const top = top0 + i * pitch;
    ctx.fillStyle = i === 0 ? ORANGE : INK;
    ctx.fillText(groups[i].name, x0 - 14, top + blockH / 2);
  }
  ctx.restore();

  // 2. 刻度线（0–100）
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  for (let k = 0; k <= 4; k++) {
    const gx = x0 + (barMax * k) / 4;
    ctx.beginPath();
    ctx.moveTo(gx, axisTop);
    ctx.lineTo(gx, axisBottom);
    ctx.stroke();
  }
  ctx.restore();

  // 3. 成对横条 + 条端裸数字
  for (let i = 0; i < n; i++) {
    const top = top0 + i * pitch;
    const yBase = top;
    const yAlt = top + barH + rowGap;
    drawBar(ctx, x0, yBase, barMax, barH, groups[i].base, pBase, BLUE);
    drawBar(ctx, x0, yAlt, barMax, barH, groups[i].alt, pAlt, GREEN);
    drawBarNumber(ctx, x0, yBase, barMax, barH, groups[i].base, pBase, BLUE);
    drawBarNumber(ctx, x0, yAlt, barMax, barH, groups[i].alt, pAlt, GREEN);
  }

  // 4. 协议说明与精确数值
  const focus = groups[0];
  const note = s.view === 'overall' ? '平衡准确率' : '低/高级别二分';
  const panelAlpha = clamp((s.progress - 0.5) / 0.5, 0, 1);

  if (!narrow) {
    ctx.save();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(716, 22);
    ctx.lineTo(716, 258);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = FONT_L;
    ctx.fillStyle = INK;
    ctx.fillText(focus.name, 748, 62);

    ctx.globalAlpha = panelAlpha;
    ctx.fillStyle = BLUE;
    roundRect(ctx, 748, 88, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = BLUE;
    ctx.fillText(focus.base.toFixed(2), 774, 96);

    ctx.fillStyle = GREEN;
    roundRect(ctx, 748, 132, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = GREEN;
    ctx.fillText(focus.alt.toFixed(2), 774, 140);

    ctx.font = FONT_S;
    ctx.fillStyle = MUTED;
    ctx.fillText(note, 748, 190);
    ctx.restore();
  } else {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = panelAlpha;
    ctx.fillStyle = BLUE;
    roundRect(ctx, 100, 251, 14, 14, 4);
    ctx.fill();
    ctx.font = FONT_L;
    ctx.fillStyle = BLUE;
    ctx.fillText(focus.base.toFixed(2), 126, 259);

    ctx.fillStyle = GREEN;
    roundRect(ctx, 236, 251, 14, 14, 4);
    ctx.fill();
    ctx.fillStyle = GREEN;
    ctx.fillText(focus.alt.toFixed(2), 262, 259);

    ctx.font = FONT_S;
    ctx.fillStyle = MUTED;
    ctx.fillText(note, 400, 259);
    ctx.restore();
  }

  // 5. 一个 3 项图例
  drawLegend(
    ctx,
    [
      { label: '对照', color: BLUE, outline: false },
      { label: '论文方法', color: GREEN, outline: false },
      { label: '当前查看', color: ORANGE, outline: true },
    ],
    narrow ? 100 : 748,
    narrow ? 24 : 30
  );
}

export const M101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const st = useRef({
    view: 'overall' as View,
    progress: 0,
    startAt: 0,
    running: false,
    settled: false,
    narrow: false,
  });
  const [view, setView] = useState<View>('overall');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState({ text: START_TEXT, cls: '' });

  useEffect(() => {
    const onResize = () => {
      st.current.narrow = window.innerWidth < 820;
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const now = performance.now();
      const s = st.current;
      if (s.running) {
        s.progress = clamp((now - s.startAt) / 1800, 0, 1);
        if (s.progress >= 1) {
          s.running = false;
          s.settled = true;
          setRunning(false);
          setDone(true);
          setFeedback(
            s.view === 'overall'
              ? { text: OVERALL_TEXT, cls: 'good' }
              : { text: FINE_TEXT, cls: 'good' }
          );
        }
      }
      render(ctx, { view: s.view, progress: s.progress, narrow: s.narrow });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    const s = st.current;
    s.progress = 0;
    s.running = true;
    s.settled = false;
    s.startAt = performance.now();
    setRunning(true);
    setDone(false);
  };

  const switchView = (v: View) => {
    const s = st.current;
    s.view = v;
    s.progress = 0;
    s.running = false;
    s.settled = false;
    setView(v);
    setRunning(false);
    setDone(false);
    setFeedback(v === 'fine' ? { text: FINE_HINT, cls: '' } : { text: START_TEXT, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button
          className={`chip ${view === 'overall' ? 'selected' : ''}`}
          onClick={() => switchView('overall')}
        >
          总体诊断
        </button>
        <button
          className={`chip ${view === 'fine' ? 'selected' : ''}`}
          onClick={() => switchView('fine')}
        >
          细粒度任务
        </button>
      </div>
      <div className="ctrl">
        <button className="tiny" onClick={onStart} disabled={running}>
          {done && !running ? '再看一次' : '开始比较'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M101;
