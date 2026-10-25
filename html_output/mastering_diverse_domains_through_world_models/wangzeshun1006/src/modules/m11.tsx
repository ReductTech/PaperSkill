import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawHold,
  drawSceneLabel,
  drawLegend,
  seeded,
  HOLD,
  OK,
  BAD,
  EMPH,
  INK,
  MUTED,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// m11 — 换域就要重调：左侧专用算法旋钮组 vs 右侧 Dreamer 固定配置卡（P4 chips）。
const W = 1080;
const H = 280;

const WALL_X = 40;
const WALL_Y = 44;
const WALL_W = 290;
const WALL_H = 196;

const NAMES = ['控制', 'Atari', 'ProcGen', 'DMLab', 'Minecraft'];
const DOMAINS = NAMES.map((name, i) => ({
  name,
  text:
    i === 0
      ? '控制任务：专用方法各自标定奖励缩放与熵系数；Dreamer 用的是表 4 里那一套固定值。'
      : `切到 ${name}：专用方法又要重调一遍旋钮；Dreamer 的卡片没有变化。`,
}));

const TONES = ['#b8c9a7', '#b2c4a0', '#c0cfae', '#aec096', '#c6d3b4'];
const KX = [400, 462, 524, 586];
const KY = 150;
const KR = 22;
const KNAME = ['奖励缩放', '熵系数', '学习率', '折扣'];
const CARD_X = 710;
const CARD_Y = 44;
const CARD_W = 330;
const CARD_H = 196;
const ROWS: string[][] = [
  ['学习率', '4e-5'],
  ['批', '16×64'],
  ['熵', '3e-4'],
  ['折扣', '0.997'],
];

const TARGETS: number[][] = [];
for (let d = 0; d < 5; d++) {
  const r = seeded(200 + d * 31);
  const arr: number[] = [];
  for (let i = 0; i < 4; i++) arr.push((r() * 2 - 1) * 2.4);
  TARGETS.push(arr);
}

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
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const dRef = useRef(0);
  const selAtRef = useRef(0);
  const anglesRef = useRef<number[]>(TARGETS[0].slice());
  const prevAnglesRef = useRef<number[]>(TARGETS[0].slice());
  const [domain, setDomain] = useState(0);
  const [feedback, setFeedback] = useState({ text: DOMAINS[0].text, cls: 'good' });

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

    const holdRnd = seeded(41);
    const holds: number[][] = [];
    for (let i = 0; i < 6; i++) {
      holds.push([
        WALL_X + 24 + holdRnd() * (WALL_W - 48),
        WALL_Y + 26 + holdRnd() * (WALL_H - 52),
      ]);
    }

    const render = (now: number): void => {
      clearCrag(ctx, W, H);
      const dom = dRef.current;
      const since = now - selAtRef.current;
      const eased = easeOutCubic(clamp(since / 600, 0, 1));
      const flashOn = since < 900 ? Math.floor(since / 150) % 2 === 0 : true;

      // 左：领域墙（色调随 chip 变化）
      drawWall(ctx, WALL_X, WALL_Y, WALL_W, WALL_H, { color: TONES[dom], veins: 2 });
      for (let i = 0; i < holds.length; i++) {
        drawHold(ctx, holds[i][0], holds[i][1], i === dom + 1 ? 8 : 6, HOLD);
      }
      ctx.save();
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 2;
      ctx.strokeRect(WALL_X + 1, WALL_Y + 1, WALL_W - 2, WALL_H - 2);
      ctx.restore();

      // 中：专用算法 4 个旋钮（指针归零再重调 + 红色「重调」角标）
      for (let i = 0; i < 4; i++) {
        const cx = KX[i];
        const ang = lerp(prevAnglesRef.current[i], TARGETS[dom][i], eased);
        anglesRef.current[i] = ang;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, KY, KR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, KY);
        ctx.lineTo(cx + Math.cos(ang) * (KR - 6), KY + Math.sin(ang) * (KR - 6));
        ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(cx, KY, 3, 0, Math.PI * 2);
        ctx.fill();

        // 红色「重调」角标
        ctx.globalAlpha = flashOn ? 1 : 0.25;
        ctx.fillStyle = BAD;
        roundRect(ctx, cx + KR - 12, KY - KR - 8, 30, 15, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('重调', cx + KR + 3, KY - KR + 2);
        ctx.restore();

        ctx.fillStyle = MUTED;
        ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(KNAME[i], cx, KY + KR + 20);
      }

      // 右：Dreamer 固定配置卡（恒定）
      ctx.save();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 10);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = '600 16px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Dreamer 固定配置', CARD_X + 16, CARD_Y + 30);
      for (let i = 0; i < ROWS.length; i++) {
        const ry = CARD_Y + 66 + i * 32;
        ctx.fillStyle = MUTED;
        ctx.font = '14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(ROWS[i][0], CARD_X + 18, ry);
        ctx.fillStyle = INK;
        ctx.font = '600 15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillText(ROWS[i][1], CARD_X + 92, ry);
        // 绿色对勾
        ctx.fillStyle = OK;
        ctx.beginPath();
        ctx.arc(CARD_X + CARD_W - 30, ry - 5, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CARD_X + CARD_W - 34, ry - 5);
        ctx.lineTo(CARD_X + CARD_W - 31, ry - 2);
        ctx.lineTo(CARD_X + CARD_W - 25, ry - 9);
        ctx.stroke();
      }
      ctx.restore();

      drawSceneLabel(ctx, '专用算法', 380, 36, BAD);
      drawSceneLabel(ctx, '固定配置', CARD_X, 36, OK);
      drawLegend(
        ctx,
        [
          { color: BAD, text: '每域重调' },
          { color: OK, text: '一套固定' },
        ],
        380,
        268
      );
    };

    const tick = (): void => {
      render(performance.now());
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
    if (i === dRef.current) return;
    prevAnglesRef.current = anglesRef.current.slice();
    dRef.current = i;
    selAtRef.current = performance.now();
    setDomain(i);
    setFeedback({ text: DOMAINS[i].text, cls: i === 0 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {DOMAINS.map((d, i) => (
          <button
            key={d.name}
            className={'chip' + (domain === i ? ' selected on' : '')}
            onClick={() => pick(i)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M11;
