import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearScene,
  drawPath,
  drawSceneLabel,
  drawLegend,
  seeded,
  EMPH,
  GUIDE,
  INK,
  DARK,
  AUX,
  LINE,
} from './musicKit';
import type { WidgetProps } from './registry';

// P6 拖动：切换「当前本体」（单臂 / 双臂 / 移动操作臂），
// 同一套权重输出的动作维度与形态随之改变。
const W = 1080;
const H = 280;

const INFO: { name: string; text: string }[] = [
  {
    name: '单臂',
    text: '单臂构型：一条手臂完成任务，策略输出的动作只覆盖这一条手臂的关节与夹爪。',
  },
  {
    name: '双臂',
    text: '双臂构型：两条手臂同时工作，动作输出要同时覆盖两侧手臂，并保持两者协调。',
  },
  {
    name: '移动操作臂',
    text: '移动操作臂：底盘 + 手臂，动作输出还要包含底盘移动，形态与前两者都不同。',
  },
];
const MIXED = '把 7 种机器人构型的数据混在一起训练，同一套权重才能换一种本体直接输出动作。';

const drawArm = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  a1: number,
  a2: number
): void => {
  const L1 = 52;
  const L2 = 44;
  const th1 = -Math.PI / 2 + dir * (0.45 + a1 * 0.13);
  const ex = x + Math.cos(th1) * L1;
  const ey = y + Math.sin(th1) * L1;
  const th2 = th1 + dir * (0.7 + a2 * 0.16);
  const wx = ex + Math.cos(th2) * L2;
  const wy = ey + Math.sin(th2) * L2;
  ctx.strokeStyle = EMPH;
  ctx.lineCap = 'round';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(wx, wy);
  ctx.stroke();
  // 夹爪
  const gx = Math.cos(th2) * 13;
  const gy = Math.sin(th2) * 13;
  const px = -Math.sin(th2) * 9;
  const py = Math.cos(th2) * 9;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.lineTo(wx + gx, wy + gy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx + px, wy + py);
  ctx.lineTo(wx + gx + px, wy + gy + py);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx - px, wy - py);
  ctx.lineTo(wx + gx - px, wy + gy - py);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();
};

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(0);
  const selAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);
  const [feedback, setFeedback] = useState({ text: INFO[0].text + ' ' + MIXED, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    selAtRef.current = performance.now();

    const rnd = seeded(53);
    const barH: number[] = [];
    for (let i = 0; i < 12; i++) barH.push(34 + rnd() * 56);

    const render = (now: number): void => {
      clearScene(ctx, W, H);
      const kind = selRef.current;
      const osc = Math.sin(now / 720);
      const osc2 = Math.sin(now / 540 + 1.1);
      const cx = 460;

      // 策略：同一套权重
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(56, 70, 168, 108);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.strokeRect(56, 70, 168, 108);
      ctx.fillStyle = GUIDE;
      for (let i = 0; i < 4; i++) ctx.fillRect(74, 92 + i * 20, 132 - i * 18, 8);

      // 箭头：策略 → 本体 → 动作
      drawPath(ctx, [[232, 124], [322, 124]], GUIDE, 4);
      ctx.fillStyle = GUIDE;
      ctx.beginPath();
      ctx.moveTo(330, 124);
      ctx.lineTo(316, 117);
      ctx.lineTo(316, 131);
      ctx.closePath();
      ctx.fill();

      // 本体
      ctx.lineCap = 'round';
      if (kind === 2) {
        ctx.fillStyle = DARK;
        ctx.fillRect(cx - 62, 196, 124, 22);
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(cx - 38, 225, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 38, 225, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = AUX;
        ctx.beginPath();
        ctx.arc(cx - 38, 225, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 38, 225, 4, 0, Math.PI * 2);
        ctx.fill();
        drawArm(ctx, cx, 196, 1, osc, osc2);
      } else if (kind === 1) {
        ctx.fillStyle = DARK;
        ctx.fillRect(cx - 46, 210, 92, 25);
        drawArm(ctx, cx - 28, 210, -1, osc, osc2);
        drawArm(ctx, cx + 28, 210, 1, -osc, -osc2);
      } else {
        ctx.fillStyle = DARK;
        ctx.fillRect(cx - 30, 210, 60, 25);
        drawArm(ctx, cx, 210, 1, osc, osc2);
      }

      // 箭头：本体 → 动作输出
      drawPath(ctx, [[618, 124], [726, 124]], GUIDE, 4);
      ctx.fillStyle = GUIDE;
      ctx.beginPath();
      ctx.moveTo(734, 124);
      ctx.lineTo(720, 117);
      ctx.lineTo(720, 131);
      ctx.closePath();
      ctx.fill();

      // 动作输出：维度与形态随本体改变
      const n = kind === 0 ? 4 : kind === 1 ? 8 : 10;
      const bx = 768;
      const bw = (250 - (n - 1) * 6) / n;
      const since = now - selAtRef.current;
      ctx.fillStyle = LINE;
      ctx.fillRect(bx - 6, 200, 262, 2);
      for (let i = 0; i < n; i++) {
        const g = clamp((since - i * 45) / 320, 0, 1);
        const hh = barH[i % 12] * easeOutCubic(g);
        ctx.fillStyle = GUIDE;
        ctx.fillRect(bx + i * (bw + 6), 200 - hh, bw, hh);
      }
      ctx.fillStyle = DARK;
      ctx.fillRect(1016, 108, 4, 92);

      drawSceneLabel(ctx, '同一套权重', 66, 56, INK);
      drawSceneLabel(ctx, INFO[kind].name, 400, 56, EMPH);
      drawLegend(
        ctx,
        [
          { color: EMPH, text: '当前本体' },
          { color: GUIDE, text: '动作输出' },
        ],
        56,
        268
      );
    };

    const tick = (now: number): void => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (i: number): void => {
    const n = Math.round(clamp(i, 0, 2));
    selRef.current = n;
    selAtRef.current = performance.now();
    setSel(n);
    setFeedback({ text: INFO[n].text + ' ' + MIXED, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          当前本体 <span className="val">{INFO[sel].name}</span>
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={sel}
          onChange={(e) => pick(Number(e.target.value))}
        />
      </div>
      <div className="chip-row">
        {INFO.map((it, i) => (
          <button key={it.name} className={'chip' + (i === sel ? ' selected' : '')} onClick={() => pick(i)}>
            {it.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41;
