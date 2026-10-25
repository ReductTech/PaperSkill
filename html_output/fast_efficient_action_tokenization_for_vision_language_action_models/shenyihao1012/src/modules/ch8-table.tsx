import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawLegend, drawValueChip } from './packKit';
import type { WidgetProps } from './registry';

// Module 8.1 (bar chips) — Table I as horizontal paired bars: naive (red) vs
// FAST (green) token counts per 1-second chunk, with token-count chips,
// compression-ratio badges and the dashed 「每臂 ~30 token」 annotation line.
const W = 1080;
const H = 340;

type ViewKey = 'bridge' | 'droid' | 'bussing' | 'shirt' | 'all';

interface RowDef {
  key: Exclude<ViewKey, 'all'>;
  chip: string;
  name: string;
  dim: number;
  hz: number;
  naive: number;
  fast: number;
  ratio: string;
  fb: { text: string; cls: string };
}

const ROWS: RowDef[] = [
  {
    key: 'bridge',
    chip: 'BridgeV2 5Hz',
    name: 'BridgeV2',
    dim: 7,
    hz: 5,
    naive: 35,
    fast: 20,
    ratio: '1.75×',
    fb: { text: '5Hz 低频会场：35→20（1.75×）——频率低、冗余少，压得也相对少。', cls: '' },
  },
  {
    key: 'droid',
    chip: 'DROID 15Hz',
    name: 'DROID',
    dim: 7,
    hz: 15,
    naive: 105,
    fast: 29,
    ratio: '3.6×',
    fb: { text: '15Hz：105→29（3.6×）——频率上来，压缩比跟着上来。', cls: '' },
  },
  {
    key: 'bussing',
    chip: 'Bussing 20Hz',
    name: 'Bussing',
    dim: 7,
    hz: 20,
    naive: 140,
    fast: 28,
    ratio: '5.0×',
    fb: { text: '20Hz：140→28（5.0×）——硬塞已 140 个 token，FAST 反而更省。', cls: '' },
  },
  {
    key: 'shirt',
    chip: 'ShirtFold 50Hz',
    name: 'ShirtFold',
    dim: 14,
    hz: 50,
    naive: 700,
    fast: 53,
    ratio: '13.2×',
    fb: {
      text: '700 个冗余 token 压到 53——13.2×；且每臂恒约 30 token：<b>符号数反映的是动作复杂度，不是频率</b>。',
      cls: 'good',
    },
  },
];

const ALL_FB = {
  text: '四个会场连成一条规律：<b>频率越高压得越狠</b>（1.75×→13.2×）；FAST 的柱子始终贴着 ~30 token 线。',
  cls: 'good',
};

const X0 = 150;
const X1 = 880;
const MAXT = 700;
const tx = (v: number): number => X0 + (v / MAXT) * (X1 - X0);

const FONT_CN = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

function drawCommon(ctx: CanvasRenderingContext2D): void {
  // dashed 「每臂 ~30 token」 annotation line
  const lx = tx(30);
  ctx.save();
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 1.75;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(lx, 56);
  ctx.lineTo(lx, H - 26);
  ctx.stroke();
  ctx.restore();
  drawSceneLabel(ctx, '每臂 ~30 token', lx + 8, 46, { color: C.purple });
  drawLegend(ctx, [['naive（硬塞）', C.red], ['FAST', C.green]], 40, 26);
}

function drawSingle(ctx: CanvasRenderingContext2D, row: RowDef, g: number): void {
  ctx.save();
  ctx.fillStyle = C.text;
  ctx.font = `15px ${FONT_CN}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${row.name} · ${row.dim} 维 · ${row.hz}Hz · 1 秒块`, X0, 88);
  ctx.restore();

  const bar = (y: number, h: number, tokens: number, color: string, label: string): void => {
    const w = Math.max(4, (tx(tokens) - X0) * g);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.roundRect(X0, y, w, h, 5);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (w > 120) {
      ctx.fillStyle = C.white;
      ctx.font = `12px ${FONT_CN}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, X0 + 12, y + h / 2);
    }
    ctx.restore();
    if (g > 0.99) drawValueChip(ctx, X0 + w + 34, y + h / 2, String(tokens), color);
  };
  bar(108, 44, row.naive, C.red, 'naive（硬塞 H×D）');
  bar(168, 44, row.fast, C.green, 'FAST');

  // compression-ratio badge
  ctx.save();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.roundRect(946, 116, 112, 66, 10);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.font = 'bold 26px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(row.ratio, 1002, 142);
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText('压缩比', 1002, 168);
  ctx.restore();
}

function drawAll(ctx: CanvasRenderingContext2D, g: number): void {
  ROWS.forEach((row, i) => {
    const gy = 70 + i * 64;
    ctx.save();
    ctx.fillStyle = C.text;
    ctx.font = `12.5px ${FONT_CN}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.name, X0 - 14, gy + 10);
    ctx.fillStyle = C.muted;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText(`${row.hz}Hz`, X0 - 14, gy + 31);
    ctx.restore();

    const bar = (y: number, tokens: number, color: string): void => {
      const w = Math.max(3, (tx(tokens) - X0) * g);
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.roundRect(X0, y, w, 18, 4);
      ctx.fill();
      ctx.restore();
      if (g > 0.99) drawValueChip(ctx, X0 + w + 30, y + 9, String(tokens), color);
    };
    bar(gy, row.naive, C.red);
    bar(gy + 24, row.fast, C.green);

    ctx.save();
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.roundRect(954, gy + 9, 102, 34, 8);
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.font = 'bold 19px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(row.ratio, 1005, gy + 26);
    ctx.restore();
  });
}

function drawView(ctx: CanvasRenderingContext2D, view: ViewKey, g: number): void {
  ctx.clearRect(0, 0, W, H);
  drawSceneBg(ctx, W, H, { ground: false });
  if (view === 'all') drawAll(ctx, g);
  else drawSingle(ctx, ROWS.find((r) => r.key === view) ?? ROWS[0], g);
  drawCommon(ctx);
}

export const Ch8Table: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ view: ViewKey; start: number }>({ view: 'bridge', start: 0 });
  const [view, setView] = useState<ViewKey>('bridge');
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>(ROWS[0].fb);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = () => {
      const s = stateRef.current;
      const g = easeOutCubic(clamp((performance.now() - s.start) / 650, 0, 1));
      drawView(ctx, s.view, g);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (v: ViewKey) => {
    stateRef.current = { view: v, start: performance.now() };
    setView(v);
    setFeedback(v === 'all' ? ALL_FB : (ROWS.find((r) => r.key === v) ?? ROWS[0]).fb);
  };

  const chips: { key: ViewKey; label: string }[] = [
    ...ROWS.map((r) => ({ key: r.key as ViewKey, label: r.chip })),
    { key: 'all' as ViewKey, label: '全部' },
  ];

  return (
    <div>
      <div className="chip-row">
        {chips.map((c) => (
          <button
            key={c.key}
            className={`chip${view === c.key ? ' selected' : ''}`}
            onClick={() => select(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-desc">1 秒块 · 可比重建精度 · token 数越少越好</div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch8Table;
