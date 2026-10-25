import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheetLabel,
  drawLegend,
  ROUTE,
  OK,
  INK,
  MUTED,
  LINE,
} from './chartkit';
import type { WidgetProps } from './registry';

// m11 — 五种模型，一次看清边界（P4，五个 chip）。
// 判定标准只有一条：预测的未来有没有留在行动路径里。

const W = 1080;
const H = 280;

const NOTE_X = 60;
const NOTE_W = 190;
const NOTE_H = 70;
const NOTE1_Y = 64;
const NOTE2_Y = 148;

const FUT_X = 340;
const FUT_Y = 64;
const FUT_W = 270;
const FUT_H = 150;

const ACT_X = 712;
const ACT_Y = 120;
const ACT_W = 118;
const ACT_H = 60;

const GROUP_X = 326;
const GROUP_Y = 52;
const GROUP_W = 520;
const GROUP_H = 174;

const ARROW_Y = 150;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

type FutureState = 'empty' | 'grid' | 'video' | 'joint';
type Anchor = 'task' | 'fut' | 'act';

interface ArrowSpec {
  from: Anchor;
  to: Anchor;
}

interface KindDef {
  name: string;
  future: FutureState;
  arrows: ArrowSpec[];
  promptOnly: boolean;
  actionAbsent: boolean;
  joint: boolean;
  badgeText: string;
  badgeOk: boolean;
  feedback: string;
}

const KINDS: KindDef[] = [
  {
    name: '视觉-语言-动作模型',
    future: 'empty',
    arrows: [{ from: 'task', to: 'act' }],
    promptOnly: false,
    actionAbsent: false,
    joint: false,
    badgeText: '不是 WAM',
    badgeOk: false,
    feedback: '直接从当前观测出动作，不预测自己干预后的世界——不是 WAM。',
  },
  {
    name: '世界模型',
    future: 'grid',
    arrows: [
      { from: 'task', to: 'fut' },
      { from: 'act', to: 'fut' },
    ],
    promptOnly: false,
    actionAbsent: false,
    joint: false,
    badgeText: '还不是 WAM',
    badgeOk: false,
    feedback: '预测未来，但未来没有进入行动路径——还不是 WAM。',
  },
  {
    name: '视频生成模型',
    future: 'video',
    arrows: [{ from: 'task', to: 'fut' }],
    promptOnly: true,
    actionAbsent: true,
    joint: false,
    badgeText: '不是 WAM',
    badgeOk: false,
    feedback: '生成视频，条件里没有动作，也不产生动作——不是 WAM。',
  },
  {
    name: '视频世界模型',
    future: 'video',
    arrows: [
      { from: 'task', to: 'fut' },
      { from: 'act', to: 'fut' },
    ],
    promptOnly: false,
    actionAbsent: false,
    joint: false,
    badgeText: '看是否用于动作',
    badgeOk: false,
    feedback: '条件里有动作、输出是未来观测；只看它是否把这个未来用于动作。',
  },
  {
    name: '世界动作模型',
    future: 'joint',
    arrows: [{ from: 'task', to: 'fut' }],
    promptOnly: false,
    actionAbsent: false,
    joint: true,
    badgeText: '判定通过',
    badgeOk: true,
    feedback: '预测的未来留在行动路径里：产生、评分、验证或训练动作——判定通过。',
  },
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
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function dashedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  ctx.restore();
}

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  size: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(ang - 0.42), y - size * Math.sin(ang - 0.42));
  ctx.lineTo(x - size * Math.cos(ang + 0.42), y - size * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  alpha: number,
  both?: boolean
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1 + Math.cos(ang) * 4, y1 + Math.sin(ang) * 4);
  ctx.lineTo(x2 - Math.cos(ang) * 4, y2 - Math.sin(ang) * 4);
  ctx.stroke();
  arrowHead(ctx, x2, y2, ang, 10);
  if (both) arrowHead(ctx, x1, y1, ang + Math.PI, 10);
  ctx.restore();
}

function anchorPoint(a: Anchor): number[] {
  if (a === 'task') return [NOTE_X + NOTE_W, ARROW_Y];
  if (a === 'fut') return [FUT_X, ARROW_Y - 11];
  return [ACT_X, ARROW_Y];
}

function drawNote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sym: string,
  color: string,
  enabled: boolean
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, NOTE_W, NOTE_H, 10);
  ctx.fill();
  ctx.strokeStyle = enabled ? color : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = enabled ? color : MUTED;
  ctx.font = '600 26px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sym, x + NOTE_W / 2, y + NOTE_H / 2 + 2);
  ctx.restore();
}

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const kindRef = useRef(0);
  const selAtRef = useRef(0);
  const [modelKind, setModelKind] = useState(0);
  const [feedback, setFeedback] = useState({ text: KINDS[0].feedback, cls: '' });

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

    const render = (now: number): void => {
      const cfg = KINDS[kindRef.current];
      const since = now - selAtRef.current;
      const accent = cfg.joint ? OK : ROUTE;

      clearField(ctx, W, H);

      // 观测 / 指令便签
      drawNote(ctx, NOTE_X, NOTE1_Y, cfg.promptOnly ? 'prompt' : 'o', ROUTE, true);
      drawNote(ctx, NOTE_X, NOTE2_Y, 'l', ROUTE, true);

      // 未来画框
      if (cfg.future === 'empty') {
        dashedRect(ctx, FUT_X, FUT_Y, FUT_W, FUT_H, LINE);
        ctx.save();
        ctx.fillStyle = MUTED;
        ctx.font = '600 30px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('o′', FUT_X + FUT_W / 2, FUT_Y + FUT_H / 2);
        ctx.restore();
      } else {
        const fc = cfg.joint ? OK : ROUTE;
        ctx.save();
        if (cfg.joint) {
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = OK;
          roundRect(ctx, FUT_X, FUT_Y, FUT_W, FUT_H, 10);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = fc;
        ctx.lineWidth = 2.5;
        roundRect(ctx, FUT_X, FUT_Y, FUT_W, FUT_H, 10);
        ctx.stroke();
        ctx.fillStyle = fc;
        ctx.font = '600 30px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('o′', FUT_X + FUT_W / 2, FUT_Y + 34);
        ctx.restore();

        // 基座形态：token 格 / 视频帧
        ctx.save();
        ctx.strokeStyle = fc;
        ctx.fillStyle = fc;
        if (cfg.future === 'grid' || cfg.future === 'joint') {
          ctx.lineWidth = 1.4;
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 6; c++) {
              const gx = FUT_X + 46 + c * 30;
              const gy = FUT_Y + 78 + r * 22;
              ctx.globalAlpha = 0.55;
              ctx.strokeRect(gx, gy, 16, 12);
            }
          }
        } else {
          ctx.lineWidth = 2;
          const vx = FUT_X + FUT_W / 2 - 34;
          const vy = FUT_Y + 74;
          ctx.strokeRect(vx, vy, 68, 46);
          ctx.beginPath();
          ctx.moveTo(vx + 28, vy + 14);
          ctx.lineTo(vx + 28, vy + 32);
          ctx.lineTo(vx + 44, vy + 23);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 动作口
      if (cfg.actionAbsent) {
        dashedRect(ctx, ACT_X, ACT_Y, ACT_W, ACT_H, LINE);
        ctx.save();
        ctx.fillStyle = MUTED;
        ctx.font = '600 24px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('a', ACT_X + ACT_W / 2, ACT_Y + ACT_H / 2);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, ACT_X, ACT_Y, ACT_W, ACT_H, 10);
        ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.font = '600 26px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('a', ACT_X + ACT_W / 2, ACT_Y + ACT_H / 2 + 1);
        ctx.restore();
      }
      // 箭头：按选中后依次淡入
      let ai = 0;
      for (const ar of cfg.arrows) {
        const p1 = anchorPoint(ar.from);
        const p2 = anchorPoint(ar.to);
        const a = clamp((since - ai * 120) / 320, 0, 1);
        arrow(ctx, p1[0], p1[1], p2[0], p2[1], ROUTE, 2.5, a);
        ai += 1;
      }

      // WAM：未来与动作同框（联合），绿色判定
      if (cfg.joint) {
        ctx.save();
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        roundRect(ctx, GROUP_X, GROUP_Y, GROUP_W, GROUP_H, 14);
        ctx.stroke();
        ctx.restore();
        // 联合双箭头：未来与动作互相绑定
        const a = clamp((since - 120) / 320, 0, 1);
        arrow(ctx, FUT_X + FUT_W, ARROW_Y, ACT_X, ARROW_Y, OK, 3, a, true);
        // 绿勾
        ctx.save();
        ctx.globalAlpha = clamp((since - 260) / 280, 0, 1);
        ctx.fillStyle = OK;
        ctx.beginPath();
        ctx.arc(GROUP_X + GROUP_W - 20, GROUP_Y + 20, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(GROUP_X + GROUP_W - 26, GROUP_Y + 20);
        ctx.lineTo(GROUP_X + GROUP_W - 21, GROUP_Y + 25);
        ctx.lineTo(GROUP_X + GROUP_W - 13, GROUP_Y + 14);
        ctx.stroke();
        ctx.restore();
      }

      // 底部判定条
      ctx.save();
      ctx.fillStyle = cfg.badgeOk ? OK : '#eef1f6';
      roundRect(ctx, 60, 240, 960, 30, 8);
      ctx.fill();
      ctx.strokeStyle = cfg.badgeOk ? OK : LINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = cfg.badgeOk ? '#ffffff' : MUTED;
      ctx.font = '600 16px ' + FONT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(cfg.badgeText, 82, 256);
      // 判定记号：绿勾 / 灰问号
      ctx.beginPath();
      if (cfg.badgeOk) {
        ctx.fillStyle = '#ffffff';
        ctx.arc(68, 255, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(63, 255);
        ctx.lineTo(67, 259);
        ctx.lineTo(74, 250);
        ctx.stroke();
      } else {
        ctx.fillStyle = MUTED;
        ctx.arc(68, 255, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 68, 256);
      }
      ctx.restore();

      drawSheetLabel(ctx, '五种模型', 40, 44, INK);
      drawLegend(
        ctx,
        [
          { color: ROUTE, text: '观测/指令→未来' },
          { color: OK, text: '进入行动路径' },
          { color: LINE, text: '未接入' },
        ],
        700,
        44
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
    if (i === kindRef.current) return;
    kindRef.current = i;
    selAtRef.current = performance.now();
    setModelKind(i);
    setFeedback({ text: KINDS[i].feedback, cls: KINDS[i].joint ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {KINDS.map((k, i) => (
          <button
            key={k.name}
            className={'chip' + (modelKind === i ? ' selected on' : '')}
            onClick={() => pick(i)}
          >
            {k.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M11;
