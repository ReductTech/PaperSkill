import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearCrag,
  drawSceneLabel,
  drawLegend,
  BAD,
  GUIDE,
  OK,
  AUX,
  HOLD,
  INK,
  LINE,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// m42 — 自由比特与 KL 平衡：两个仲裁器。三种配置切换，看动力学/表征两条 KL 的力量对比
// 与表征健康度（码位活跃数 → 简图清晰度）如何变化。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const BAR_X = 60;
const BAR_W = 280;
const DYN_Y = 76;
const REP_Y = 136;
const BAR_H = 26;
const SCALE_MAX = 2; // 0..2 nat 的示意刻度，1 nat 在中点
const THRESH_X = BAR_X + BAR_W * 0.5;
const CELL_X = 470;
const CELL_Y = 64;
const CELL_W = 28;
const CELL_GAP = 6;
const CELL_N = 8;

interface Target {
  dyn: number;
  rep: number;
  alive: number;
}

const TARGETS: Target[] = [
  { dyn: 1.55, rep: 1.45, alive: 2 },
  { dyn: 0.68, rep: 0.52, alive: 5 },
  { dyn: 0.68, rep: 0.52, alive: 5 },
];

const FEEDBACK: Array<{ text: string; cls: string }> = [
  {
    text: '没有自由比特：两条 KL 一起被压，表征开始坍塌——简图越来越糊，预测反而更难。',
    cls: 'bad',
  },
  { text: '1 nat 以下不再惩罚：该省的省，该学的学，两条 KL 谁也不压倒谁。', cls: '' },
  { text: '再给分布留 1% 的均匀底：任何时刻都不会变成确定分布，KL 不会再冲出尖刺。', cls: 'good' },
];

const TOKENS: string[][] = [
  ['无自由比特', 'KL ↑ 坍塌'],
  ['自由比特 1 nat', 'KL 平衡'],
  ['1% 均匀混合', '防尖刺'],
];

const CHIPS = ['不用自由比特', '自由比特 = 1 nat', '再加 1% 均匀混合'];

// 简图上的支点（卡片内绝对坐标）
const MAP_PTS: number[][] = [
  [488, 208],
  [520, 182],
  [556, 162],
  [596, 150],
  [636, 164],
  [664, 186],
];

function roundRect(
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

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  color: string
): void {
  ctx.fillStyle = LINE;
  roundRect(ctx, x, y, BAR_W, BAR_H, 7);
  ctx.fill();
  const w = clamp(value / SCALE_MAX, 0, 1) * BAR_W;
  if (w > 2) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, BAR_H, 7);
    ctx.fill();
  }
}

function drawToken(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  bold: boolean
): void {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

export const M42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<Target & { mode: number }>({
    ...TARGETS[1],
    mode: 1,
  });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState(1);
  const [feedback, setFeedback] = useState(FEEDBACK[1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const a = animRef.current;
      const tgt = TARGETS[a.mode];
      a.dyn += (tgt.dyn - a.dyn) * 0.12;
      a.rep += (tgt.rep - a.rep) * 0.12;
      a.alive += (tgt.alive - a.alive) * 0.09;

      clearCrag(ctx, W, H);

      // 两条 KL 计量条
      const dynOver = a.dyn > 1;
      const repOver = a.rep > 1;
      drawBar(ctx, BAR_X, DYN_Y, a.dyn, dynOver ? BAD : GUIDE);
      drawBar(ctx, BAR_X, REP_Y, a.rep, repOver ? BAD : AUX);

      // 阈值虚线（1 nat）
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(THRESH_X, 58);
      ctx.lineTo(THRESH_X, 176);
      ctx.stroke();
      ctx.restore();
      drawToken(ctx, '1 nat', THRESH_X + 6, 188, MUTED, 13, false);

      drawToken(ctx, '动力学', BAR_X + BAR_W + 10, DYN_Y + BAR_H / 2, dynOver ? BAD : GUIDE, 14, true);
      drawToken(ctx, '表征', BAR_X + BAR_W + 10, REP_Y + BAR_H / 2, repOver ? BAD : AUX, 14, true);

      // 表征健康度：8 格码位
      const alive = Math.round(clamp(a.alive, 0, CELL_N));
      for (let i = 0; i < CELL_N; i++) {
        const x = CELL_X + i * (CELL_W + CELL_GAP);
        ctx.fillStyle = i < alive ? OK : LINE;
        roundRect(ctx, x, CELL_Y, CELL_W, CELL_W, 5);
        ctx.fill();
      }

      // 简图轮廓：码位越少越糊
      const clarity = clamp((a.alive - 1) / 6, 0, 1);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 458, 110, 224, 122, 10);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, 458, 110, 224, 122, 10);
      ctx.clip();
      if (clarity < 0.95) {
        ctx.fillStyle = `rgba(245,248,240,${0.8 * (1 - clarity)})`;
        ctx.fillRect(458, 110, 224, 122);
      }
      ctx.globalAlpha = 0.2 + 0.8 * clarity;
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MAP_PTS[0][0], MAP_PTS[0][1]);
      for (let i = 1; i < MAP_PTS.length; i++) ctx.lineTo(MAP_PTS[i][0], MAP_PTS[i][1]);
      ctx.stroke();
      for (const p of MAP_PTS) {
        ctx.fillStyle = HOLD;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // mode 2 的防塌绿标
      if (a.mode === 2) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2;
        roundRect(ctx, THRESH_X - 36, 36, 128, 24, 7);
        ctx.fill();
        ctx.stroke();
        drawToken(ctx, '1% 均匀', THRESH_X - 26, 48, OK, 14, true);
      }

      drawSceneLabel(ctx, 'KL 计量', BAR_X, 46, MUTED);
      drawSceneLabel(ctx, '表征健康', CELL_X, 46, MUTED);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '动力学 KL' },
          { color: AUX, text: '表征 KL' },
        ],
        BAR_X,
        254
      );

      // 右侧固定说明（短标记，非散文）
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 760, 44, 240, 192, 10);
      ctx.fill();
      ctx.stroke();
      const tk = TOKENS[a.mode];
      drawToken(ctx, tk[0], 784, 104, INK, 16, true);
      drawToken(ctx, tk[1], 784, 148, MUTED, 15, false);
    };

    const tick = (): void => {
      render();
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

  const pick = (m: number): void => {
    animRef.current.mode = m;
    setMode(m);
    setFeedback(FEEDBACK[m]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CHIPS.map((label, i) => (
          <button
            key={label}
            className={'chip' + (mode === i ? ' selected on' : '')}
            onClick={() => pick(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M42;
