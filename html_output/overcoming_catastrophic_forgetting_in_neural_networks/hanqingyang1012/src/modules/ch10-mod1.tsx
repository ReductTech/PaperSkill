import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 10.1 结果赛跑（排列 MNIST，论文定性关系的方向性示意）：一条共享轴
// 「旧任务平均保持率」，三条水平进度条：普通SGD → 0.10（红，随机水平）、
// SGD+dropout → 0.45（橙，带向下箭头：随任务数下滑）、EWC → 0.98（绿，
// 条端画 🏆 小图标）。点「开始对比」错峰生长（0–0.4 / 0.2–0.6 / 0.4–0.8 s，
// easeOut），保持最终态 2 s，可重放；动画期间按钮禁用。

const W = 1080;
const H = 280;
const AX = 250; // 轴起点 x
const AXE = 1000; // 轴终点 x
const AY = 232; // 轴 y

const RED = '#c43f52';
const ORANGE = '#f07e47';
const GREEN = '#228d5c';
const DARK = '#21324a';
const MUTED = '#68778f';
const TRACK = '#d7deea';

const xOf = (v: number): number => AX + v * (AXE - AX);

interface BarSpec {
  label: string;
  final: number;
  color: string;
  start: number; // 起跑时间（s）
}

const BARS: BarSpec[] = [
  { label: '普通SGD', final: 0.1, color: RED, start: 0 },
  { label: 'SGD+dropout', final: 0.45, color: ORANGE, start: 0.2 },
  { label: 'EWC', final: 0.98, color: GREEN, start: 0.4 },
];
const ROW_Y = [88, 140, 192];
const ROW_H = 30;
const GROW = 0.4; // 每条生长时长（s）
const TOTAL = 0.8 + 2; // 生长 0.8 s + 保持最终态 2 s

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ raceStart: -1, endNotified: false });
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '点「开始对比」，看三条进度条跑起来。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: typeof stateRef.current, now: number): void => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 轴标签（1 个，8 字）
      ctx.fillStyle = DARK;
      ctx.font = '600 16px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('旧任务平均保持率', 24, 30);

      // 共享轴 + 刻度（裸数字）
      ctx.strokeStyle = TRACK;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(AX, AY);
      ctx.lineTo(AXE, AY);
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('0', AX, AY + 8);
      ctx.fillText('0.5', xOf(0.5), AY + 8);
      ctx.fillText('1.0', xOf(1), AY + 8);

      const raceT = s.raceStart >= 0 ? (now - s.raceStart) / 1000 : -1;

      // 轨道
      BARS.forEach((b, i) => {
        ctx.fillStyle = TRACK;
        roundRectPath(ctx, AX, ROW_Y[i], AXE - AX, ROW_H, 8);
        ctx.fill();
      });

      // 进度条（错峰生长，easeOut）
      BARS.forEach((b, i) => {
        let v = 0;
        let done = false;
        if (raceT >= 0) {
          const p = clamp((raceT - b.start) / GROW, 0, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          v = b.final * ease;
          done = p >= 1;
        }
        if (v > 0.002) {
          const xEnd = xOf(v);
          ctx.fillStyle = b.color;
          roundRectPath(ctx, AX, ROW_Y[i], xEnd - AX, ROW_H, 8);
          ctx.fill();
          // 裸数字（条端，白底保证可读）
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillRect(xEnd + 4, ROW_Y[i] + ROW_H / 2 - 11, 44, 22);
          ctx.font = '600 16px "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = b.color;
          ctx.fillText(v.toFixed(2), xEnd + 10, ROW_Y[i] + ROW_H / 2 + 1);
        }
        if (done) {
          if (i === 1) {
            // SGD+dropout：向下箭头标记（随任务数下滑）
            ctx.fillStyle = ORANGE;
            ctx.beginPath();
            const ax = xOf(b.final) + 58;
            const ay = ROW_Y[i] + ROW_H + 16;
            ctx.moveTo(ax - 6, ay - 10);
            ctx.lineTo(ax + 6, ay - 10);
            ctx.lineTo(ax, ay);
            ctx.closePath();
            ctx.fill();
          }
          if (i === 2) {
            // EWC：冠军小奖杯（canvas 内小图标，仅画在 EWC 条上）
            ctx.font = '22px "Segoe UI", "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏆', xOf(b.final) + 66, ROW_Y[i] + ROW_H / 2 + 1);
          }
        }
      });

      // 图例（3 项）
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      BARS.forEach((b, i) => {
        const lx = 828;
        const ly = 22 + i * 22;
        ctx.fillStyle = b.color;
        roundRectPath(ctx, lx, ly - 6, 14, 9, 2);
        ctx.fill();
        ctx.fillStyle = DARK;
        ctx.fillText(b.label, lx + 20, ly - 1);
      });
    };

    const tick = (): void => {
      const s = stateRef.current;
      const now = performance.now();
      if (s.raceStart >= 0) {
        const raceT = (now - s.raceStart) / 1000;
        if (raceT >= TOTAL && !s.endNotified) {
          s.endNotified = true;
          setRunning(false);
          setFeedback({
            text: '普通 SGD 掉到随机水平；dropout 撑不住更多任务；EWC 守住旧任务并接近单任务水平。',
            cls: 'good',
          });
        }
      }
      render(s, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startRace = (): void => {
    const s = stateRef.current;
    if (s.raceStart >= 0) {
      const raceT = (performance.now() - s.raceStart) / 1000;
      if (raceT < TOTAL) return; // 进行中（含保持期）不可重放
    }
    s.raceStart = performance.now();
    s.endNotified = false;
    setRunning(true);
    setFeedback({ text: '三条记录从同一基线出发……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button className="chip" onClick={startRace} disabled={running}>
            开始对比
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
