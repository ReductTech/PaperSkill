// §3 两种合奏方式：拖动分割线，对比「压平表征」与「只学移调」。
import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  inset,
  label,
  bar,
  drawBox,
  drawNeck,
  drawWave,
  drawCapo,
  drawGrip,
} from './scene';

const W = 1080;
const H = 280;

const SPLIT_MIN = 0.28;
const SPLIT_MAX = 0.72;
const PANEL_TOP = 12;
const PANEL_H = 172;
const GRAB_RANGE = 24;

type Feedback = { text: string; cls: string };
type Side = 'left' | 'right';
type TransposeState = { split: number; drag: { active: boolean } };

const splitFeedback = (split: number): Feedback => {
  if (split < 0.4) return { text: '左边把新旋律压掉了，换来的只是对齐。', cls: 'bad' };
  if (split <= 0.6) return { text: '继续往右拖，看两种做法的差别。', cls: '' };
  return { text: '右边只做了一次移调，旧轨合上，新旋律还在。', cls: 'good' };
};

// 论文表 2：BYOL 列，CIFAR100 五任务类别增量，top-1。
const DATA_ROWS = [
  { name: 'POD', value: 57.9, color: C.muted },
  { name: 'Less-Forget', value: 58.6, color: C.muted },
  { name: 'CaSSLe', value: 62.2, color: C.green },
];
const DATA_MAX = 62.2;

/* 左右两半共用同一套布局：同样的琴颈、同样的两条波形基线，只有处理方式不同。 */
function drawPanel(
  ctx: CanvasRenderingContext2D,
  px: number,
  pw: number,
  side: Side,
  time: number
): void {
  const w = Math.max(64, pw);
  drawBox(ctx, px, PANEL_TOP, w, PANEL_H, C.white, C.border, 10);

  const nx = px + 18;
  const inner = Math.max(24, w - 36);
  drawNeck(ctx, nx, PANEL_TOP + 16, inner, 24);

  const x0 = nx + 6;
  const ww = Math.max(16, inner - 12);
  const base = time / 900;

  if (side === 'left') {
    // 直接压平新旧表征：新轨振幅被压低，与旧轨依旧错开相位。
    drawWave(ctx, x0, 100, ww, 9, base, C.muted);
    drawWave(ctx, x0, 138, ww, 3, base + 1.15, C.red);
    label(ctx, '压平', px + w - 20, PANEL_TOP + 64, 13, C.red, 'right');
  } else {
    // 只学一个移调映射：移调夹卡在琴颈上，两条波形缓慢趋于同相。
    const gapPhase = 0.3 * (0.5 + 0.5 * Math.sin(time / 2400));
    drawCapo(ctx, nx + inner * 0.5, PANEL_TOP + 28, 22, C.orange);
    drawWave(ctx, x0, 100, ww, 9, base, C.muted);
    drawWave(ctx, x0, 138, ww, 9, base + gapPhase, C.green);
    label(ctx, '移调', px + w - 20, PANEL_TOP + 64, 13, C.green, 'right');
  }
}

export const Ch3Transpose: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<TransposeState>({ split: 0.5, drag: { active: false } });
  const grabRef = useRef(0);
  const [split, setSplit] = useState(0.5);
  const [feedback, setFeedback] = useState<Feedback>(splitFeedback(0.5));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: TransposeState, time: number) => {
      clearScene(ctx, W, H);

      const splitX = clamp(s.split, SPLIT_MIN, SPLIT_MAX) * W;
      const leftW = Math.max(70, splitX - 28);
      const rightX = splitX + 16;
      const rightW = Math.max(70, W - 12 - rightX);

      drawPanel(ctx, 12, leftW, 'left', time);
      drawPanel(ctx, rightX, rightW, 'right', time);

      // 可拖动的分割线：虚线 + 手柄，按下时加粗并换成橙色。
      const lineColor = s.drag.active ? C.orange : C.dark;
      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = s.drag.active ? 4 : 3;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(splitX, 8);
      ctx.lineTo(splitX, 188);
      ctx.stroke();
      ctx.restore();
      drawGrip(ctx, splitX, 96, lineColor, s.drag.active ? 10 : 8);

      // 底部固定数据区：不随分割线变化。
      inset(ctx, 24, 196, 1032, 72);
      DATA_ROWS.forEach((row, i) => {
        const y = 204 + i * 20;
        label(ctx, row.name, 44, y + 7, 12, row.color === C.green ? C.green : C.ink);
        bar(ctx, 200, y, 700, 14, row.value, DATA_MAX, row.color, row.value.toFixed(1));
      });
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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

  const applySplit = (v: number, active: boolean) => {
    const next = clamp(v, SPLIT_MIN, SPLIT_MAX);
    stateRef.current = { split: next, drag: { active } };
    setSplit(next);
    setFeedback(splitFeedback(next));
  };

  const localX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) * W) / rect.width;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const x = localX(e.clientX);
    const cur = clamp(stateRef.current.split, SPLIT_MIN, SPLIT_MAX) * W;
    // 在分割线附近按下时保留抓取偏移；点在其他位置则直接移过去。
    grabRef.current = Math.abs(x - cur) < GRAB_RANGE ? cur - x : 0;
    applySplit((x + grabRef.current) / W, true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.drag.active) return;
    applySplit((localX(e.clientX) + grabRef.current) / W, true);
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.drag.active) return;
    stateRef.current = { split: stateRef.current.split, drag: { active: false } };
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* 指针已释放 */
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      />
      <div className="ctrl" style={{ opacity: 0.7 }}>
        <label>分割线</label>
        <input
          type="range"
          min={SPLIT_MIN}
          max={SPLIT_MAX}
          step={0.01}
          value={split}
          onChange={(e) => applySplit(Number(e.target.value), false)}
          aria-label="分割线位置"
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
