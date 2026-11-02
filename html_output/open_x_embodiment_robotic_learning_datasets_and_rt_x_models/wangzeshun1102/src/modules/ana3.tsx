import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawDriver,
  drawLegend,
  drawSceneLabel,
  drawVehicle,
  GUIDE,
  LINE,
  MUTED,
  OK,
  PAINT,
} from './drivingKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const DURATION = 3000;

const PHASE_TEXT = [
  '打开这本通用驾照，翻到准驾车型列表。',
  '一页一页登记：22 种机器人本体都在册。',
  '一本证覆盖 22 种本体——这就是 Open X-Embodiment 的数据版图。',
];

const KINDS = ['sedan', 'truck', 'van', 'bus', 'moto'];

export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = (now: number) => {
      const t = ((now - t0) % DURATION) / DURATION;
      const nextPhase = t < 0.22 ? 0 : t < 0.9 ? 1 : 2;
      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
      }

      clearScene(ctx, W, H);

      const openP = clamp(t / 0.22, 0, 1);
      const ease = 1 - Math.pow(1 - openP, 3);
      const bookW = lerp(60, 360, ease);
      const bookH = lerp(46, 96, ease);
      const bx = 280 - bookW / 2;
      const by = 76 - bookH / 2;

      // 驾照本
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, bookW, bookH);
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, bookW - 2, bookH - 2);

      // 中缝
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(280, by + 4);
      ctx.lineTo(280, by + bookH - 4);
      ctx.stroke();

      // 左页：司机照片 + 档案线
      if (ease > 0.85) {
        const la = clamp((ease - 0.85) / 0.15, 0, 1);
        ctx.globalAlpha = la;
        drawDriver(ctx, bx + 46, by + 46, 1.1, GUIDE);
        ctx.fillStyle = LINE;
        ctx.fillRect(bx + 76, by + 30, 70, 4);
        ctx.fillRect(bx + 76, by + 42, 54, 4);
        ctx.fillRect(bx + 20, by + 66, 126, 4);
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx + 128, by + 74, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + 122, by + 74);
        ctx.lineTo(bx + 127, by + 80);
        ctx.lineTo(bx + 135, by + 68);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 右页：准驾车型 22 格
      if (ease > 0.8) {
        const appear = Math.floor(clamp((t - 0.22) / 0.55, 0, 1) * 22);
        const x0 = 288;
        const y0 = by + 8;
        const cellW = clamp((bx + bookW - 10 - x0) / 6, 18, 27);
        const cellH = (bookH - 16) / 4;
        const vs = clamp(cellW / 100, 0.2, 0.3);
        for (let i = 0; i < 22; i++) {
          const col = i % 6;
          const row = Math.floor(i / 6);
          const cx = x0 + col * cellW + cellW / 2;
          const cy = y0 + row * cellH + cellH - 4;
          const filled = i < appear;
          drawVehicle(ctx, cx, cy, KINDS[i % KINDS.length], vs, filled ? OK : MUTED);
        }
        if (appear >= 22) {
          ctx.strokeStyle = OK;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(bx + bookW - 38, by + bookH - 22);
          ctx.lineTo(bx + bookW - 30, by + bookH - 13);
          ctx.lineTo(bx + bookW - 14, by + bookH - 32);
          ctx.stroke();
        }
      }

      // 封面：翻开前遮住内页
      if (ease < 0.72) {
        const coverA = clamp(1 - ease / 0.72, 0, 1);
        ctx.globalAlpha = coverA;
        ctx.fillStyle = PAINT;
        ctx.fillRect(bx, by, bookW, bookH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(280, 76, Math.min(bookW, bookH) * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(280 - 18, 72, 36, 3);
        ctx.fillRect(280 - 12, 80, 24, 3);
        ctx.globalAlpha = 1;
      }

      // 标签（最多两个）
      drawSceneLabel(ctx, '准驾车型', 20, 26, PAINT);
      ctx.globalAlpha = clamp((t - 0.7) / 0.2, 0, 1);
      drawSceneLabel(ctx, '22 种本体', 430, 26, OK);
      ctx.globalAlpha = 1;

      // 图例（两项）
      drawLegend(
        ctx,
        [
          { color: OK, text: '已收录' },
          { color: MUTED, text: '待收录' },
        ],
        220,
        24
      );
    };

    const tick = () => {
      render(performance.now());
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={'feedback ' + (phase === 2 ? 'good' : '')}>{PHASE_TEXT[phase]}</div>
    </div>
  );
};

export default Ana3;
