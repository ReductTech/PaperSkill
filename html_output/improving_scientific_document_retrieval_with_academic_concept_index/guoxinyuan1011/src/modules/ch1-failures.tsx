import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 1 章 · 事一：自由生成的两个病（幻觉越界 / 近义重复）
// 1080×340；自循环：依次出现 → 保持 → 内容淡出 → 重播。盘底与标签常驻。

const W = 1080;
const H = 340;

const BG = '#f5f8f0';
const MUTE = '#68778f';
const AXIS = '#d7deea';
const GREEN = '#228d5c';
const RED = '#c43f52';
const WATERMARK = '#9aa8bd';

const T_SHOW = 1500;
const T_HOLD = 900;
const T_FADE = 420;
const CYCLE = T_SHOW + T_HOLD + T_FADE;

// 左栏 5 个落点，索引 >= OUT_FROM 的越出文档边界
const LEFT_PTS: [number, number][] = [
  [250, 150],
  [300, 222],
  [350, 162],
  [432, 228],
  [496, 172],
];
const OUT_FROM = 3;

// 右栏 3 个概念位，每位叠 4 个近义重影
const RIGHT_POS: [number, number][] = [
  [640, 190],
  [790, 190],
  [940, 190],
];
const SHADOWS: [number, number][] = [
  [-6, -3],
  [-2, 3],
  [3, -2],
  [6, 3],
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: 'left' | 'right' | 'center' = 'left'
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function cross(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, elapsed: number): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const fade =
    elapsed > T_SHOW + T_HOLD ? clamp(1 - (elapsed - T_SHOW - T_HOLD) / T_FADE, 0, 1) : 1;

  // 中缝
  ctx.globalAlpha = 0.55 * fade;
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(540, 74);
  ctx.lineTo(540, 286);
  ctx.stroke();

  // ── 左栏：文档 + 越界 ──
  ctx.globalAlpha = fade;
  roundRect(ctx, 60, 120, 150, 130, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  label(ctx, '文档', 74, 146, MUTE, 15);

  const inside: [number, number][] = [
    [104, 190],
    [142, 212],
    [180, 178],
  ];
  inside.forEach(([x, y]) => {
    ctx.globalAlpha = 0.8 * fade;
    ctx.fillStyle = AXIS;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // 文档边界
  ctx.globalAlpha = 0.6 * fade;
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(380, 96);
  ctx.lineTo(380, 286);
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, '越界', 388, 92, RED, 14);

  LEFT_PTS.forEach(([tx, ty], i) => {
    const p = clamp((elapsed - i * 190) / 280, 0, 1);
    if (p <= 0) return;
    const e = easeOutCubic(p);
    const sx = 210;
    const sy = 185;
    const x = sx + (tx - sx) * e;
    const y = sy + (ty - sy) * e;
    const out = i >= OUT_FROM;
    ctx.globalAlpha = fade;
    ctx.fillStyle = out ? RED : GREEN;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    if (out && p > 0.72) {
      ctx.globalAlpha = fade * clamp((p - 0.72) / 0.28, 0, 1);
      cross(ctx, x, y, 6.5, '#ffffff');
    }
  });

  // ── 右栏：近义重复 ──
  RIGHT_POS.forEach(([cx, cy], gi) => {
    const p = clamp((elapsed - (860 + gi * 200)) / 320, 0, 1);
    if (p <= 0) return;
    const e = easeOutCubic(p);
    ctx.globalAlpha = 0.32 * fade * e;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = RED;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    SHADOWS.forEach(([ox, oy]) => {
      ctx.globalAlpha = 0.32 * fade * e;
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, 13, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.globalAlpha = 0.8;
  label(ctx, '机制示意', W - 24, H - 14, WATERMARK, 13, 'right');
  ctx.globalAlpha = 1;
}

export const Ch1Failures: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const fbRef = useRef({ text: '', cls: '' });
  const [fb, setFb] = useState({ text: '自由生成中…', cls: '' });

  const applyFb = (text: string, cls: string) => {
    if (fbRef.current.text === text && fbRef.current.cls === cls) return;
    fbRef.current = { text, cls };
    setFb({ text, cls });
  };

  const onReplay = () => {
    startRef.current = performance.now();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    startRef.current = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) % CYCLE;
      draw(ctx, elapsed);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (elapsed < T_SHOW) {
        applyFb('自由生成中：概念被逐个报出来——注意看它们落在哪。', '');
      } else {
        applyFb('左栏 2 个概念越出了文档边界（幻觉）；右栏同一个意思被 4 个近义表述反复报出（重复）。', 'bad');
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.7, color: MUTE }}>
          <b style={{ color: RED }}>幻觉</b>
          {' —— '}
          论文 §3.1 原话：结果可能包含
          <b style={{ color: '#21324a' }}>文档未覆盖</b>
          的概念。红点是模型报出、文档里其实没有的。
        </div>
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.7, color: MUTE }}>
          <b style={{ color: RED }}>重复</b>
          {' —— '}
          论文引言亦指出冗余：同一个意思被换成几个近义词反复报，彼此不区分。
        </div>
      </div>
      <div className="ctrl">
        <button type="button" onClick={onReplay}>
          重播
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
