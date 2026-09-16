import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { PALETTE, drawScene, drawLegend, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 8.2 耦合光谱（P4 chips）：完全解耦 / 专家耦合 / 完全统一三个位置，
// 光谱轴上橙色标记跳转，三根权衡条动画过渡（数值为综述定性讨论的示意）。

const W = 720;
const H = 280;

type Level = 'loose' | 'mid' | 'tight';

const LEVELS: { id: Level; label: string; x: number }[] = [
  { id: 'loose', label: '完全解耦', x: 150 },
  { id: 'mid', label: '专家耦合', x: 360 },
  { id: 'tight', label: '完全统一', x: 570 },
];

const DATA: Record<Level, { x: number; mod: number; joint: number; err: number; text: string; cls: string }> = {
  loose: {
    x: 150,
    mod: 0.9,
    joint: 0.25,
    err: 0.8,
    text: '解耦最灵活：坏了哪块换哪块，代价是两块之间对不齐。',
    cls: '',
  },
  mid: {
    x: 360,
    mod: 0.55,
    joint: 0.6,
    err: 0.45,
    text: '折中：交流足够深，又保住各自节奏。',
    cls: 'good',
  },
  tight: {
    x: 570,
    mod: 0.2,
    joint: 0.9,
    err: 0.3,
    text: '最一致：一套参数同吃预测与行动，但要小心一损俱损。',
    cls: '',
  },
};

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

export const M82CouplingSpectrum: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef<Level>('loose');
  const stateRef = useRef({ x: 150, mod: 0.9, joint: 0.25, err: 0.8 });
  const rafRef = useRef<number | null>(null);
  const [level, setLevel] = useState<Level>('loose');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      const AX_Y = 96;
      const AX_X0 = 120;
      const AX_X1 = 600;

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 30, [
        { color: PALETTE.green, text: '解耦' },
        { color: PALETTE.blue, text: '统一' },
      ]);

      // 两端示意小图标：两个独立小框 ↔ 一个大框
      ctx.save();
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = 1.8;
      roundRect(ctx, 44, 84, 26, 24, 4);
      ctx.stroke();
      roundRect(ctx, 74, 84, 26, 24, 4);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.blue;
      roundRect(ctx, 642, 84, 58, 24, 4);
      ctx.stroke();
      ctx.restore();

      // 光谱轴 + 三刻度
      ctx.save();
      ctx.strokeStyle = PALETTE.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(AX_X0, AX_Y);
      ctx.lineTo(AX_X1, AX_Y);
      ctx.stroke();
      ctx.restore();
      for (const lv of LEVELS) {
        ctx.save();
        ctx.strokeStyle = PALETTE.grid;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(lv.x, AX_Y - 7);
        ctx.lineTo(lv.x, AX_Y + 7);
        ctx.stroke();
        ctx.restore();
        drawSceneLabel(ctx, lv.x, AX_Y + 24, lv.label, {
          size: 12,
          align: 'center',
          color: lv.id === levelRef.current ? PALETTE.ink : PALETTE.muted,
        });
      }
      drawSceneLabel(ctx, 112, AX_Y - 20, '松', { size: 12, align: 'right' });
      drawSceneLabel(ctx, 608, AX_Y - 20, '紧', { size: 12 });

      // 当前位置标记（橙）
      ctx.save();
      ctx.fillStyle = PALETTE.orange;
      ctx.beginPath();
      ctx.arc(s.x, AX_Y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, s.x, AX_Y - 22, '当前', {
        size: 11,
        align: 'center',
        color: PALETTE.orange,
      });

      // 三根权衡条
      const bar = (y: number, frac: number, color: string, label: string) => {
        drawSceneLabel(ctx, 40, y + 7, label, { size: 12 });
        const bx = 112;
        const bw = 440;
        ctx.fillStyle = PALETTE.grid;
        ctx.fillRect(bx, y, bw, 12);
        ctx.fillStyle = color;
        ctx.fillRect(bx, y, bw * frac, 12);
        drawSceneLabel(ctx, bx + bw + 10, y + 7, frac.toFixed(2), { size: 12, color });
      };
      bar(158, s.mod, PALETTE.green, '模块化灵活性');
      bar(186, s.joint, PALETTE.blue, '联合一致性');
      bar(214, s.err, PALETTE.red, '误差累积风险');

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      const s = stateRef.current;
      const d = DATA[levelRef.current];
      s.x += (d.x - s.x) * 0.18;
      s.mod += (d.mod - s.mod) * 0.15;
      s.joint += (d.joint - s.joint) * 0.15;
      s.err += (d.err - s.err) * 0.15;
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="耦合程度">
        {LEVELS.map((lv) => (
          <button
            key={lv.id}
            className={`chip ${level === lv.id ? 'selected' : ''}`}
            aria-pressed={level === lv.id}
            onClick={() => {
              levelRef.current = lv.id;
              setLevel(lv.id);
            }}
          >
            {lv.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${DATA[level].cls}`}>{DATA[level].text}</div>
    </div>
  );
};

export default M82CouplingSpectrum;
