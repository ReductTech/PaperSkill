import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeSpring } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  LP_LW_EMPH,
  lpFont,
  lpRoundRect,
  drawField,
  drawStick,
  drawSort,
  drawLabel,
} from './letterpressKit';

// chap-5 / 5.2 忘了任务身份也没关系 — 主导操作 P6 开关（一个二值开关）。
// 同一份原稿走两条路：告诉题号（旧法，红框，硬编码的版头）／不给题号（L2P，绿框，自己挑）。

const WD = 1080;
const HD = 380;
const WA = 560;
const HA = 140;

// 「告诉题号」时那张写死的版头：按任务号硬查表，跟原稿长什么样无关。
const FIXED: number[][] = [
  [0, 1, 2, 3, 4],
  [2, 3, 4, 5, 6],
  [4, 5, 6, 7, 8],
  [6, 7, 8, 9, 10],
  [8, 9, 10, 11, 12],
];
// 「不给题号」时版头由 q(x) 自己比出来：换一份原稿就换一批（这里用一份固定原稿演示）。
const CHOSEN = [0, 1, 2, 5, 10];

interface St {
  give: boolean;
  anim: number;
}

export const TaskIdToggle: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? WA : WD;
  const H = isAna ? HA : HD;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<St>({ give: false, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [give, setGive] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '切换一下，看同一份食材会挑到什么。',
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

    const HEAD_W = 420;
    const HEAD_H = 150;
    const LEFTX = 60;
    const RIGHTX = 600;

    const renderAna = (s: St, t: number) => {
      const phase = easeSpring((t / 1600) % 1);
      const hard = phase > 0.5;
      drawField(ctx, 0, 0, W, H);
      drawSort(ctx, 60, 40, 48, 56, { face: '食材', emphasis: !hard });
      drawStick(ctx, 200, 44, 250, 48, {
        slots: 5,
        lit: hard ? [0, 1] : [2, 3],
        dim: hard,
      });
      drawLabel(ctx, hard ? '题号' : '自己挑', 470, 72, {
        size: 13,
        color: hard ? LP.failure : LP.success,
      });
    };

    const renderNormal = (s: St) => {
      drawField(ctx, 0, 0, W, H);
      const slide = s.anim * 12; // 两框交叉淡入的位移

      // ---- 食材（两张版框共用同一份输入）
      drawLabel(ctx, '食材', 46, 56, { size: 13, color: LP.ink });
      ctx.save();
      ctx.fillStyle = '#fffefb';
      ctx.strokeStyle = LP.guide;
      ctx.lineWidth = LP_LW;
      lpRoundRect(ctx, 90, 34, 56, 44, 4, true, true);
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(98, 34 + i * 9);
        ctx.lineTo(138, 34 + i * 9);
        ctx.stroke();
      }
      ctx.restore();

      // ---- 左框：旧法（红）／右框：L2P（绿）
      const left = { x: LEFTX, y: 110 - slide, w: HEAD_W, h: HEAD_H };
      const right = { x: RIGHTX + slide, y: 110 - slide, w: HEAD_W, h: HEAD_H };

      // 先画不活跃的那个（60% 透明），活跃的用 3px 描边
      const boxes = [
        { b: left, on: s.give, color: LP.failure, tag: 'task-IL' },
        { b: right, on: !s.give, color: LP.success, tag: 'class-IL' },
      ];
      boxes.forEach(({ b, on, color, tag }) => {
        ctx.save();
        ctx.globalAlpha = on ? 1 : 0.5;
        ctx.fillStyle = '#fffefb';
        ctx.strokeStyle = color;
        ctx.lineWidth = on ? LP_LW_EMPH : LP_LW;
        lpRoundRect(ctx, b.x, b.y, b.w, b.h, 8, true, true);
        drawLabel(ctx, tag, b.x + 12, b.y + 24, { size: 13, weight: 700, color });
        ctx.restore();
      });

      // ---- 左框内容：写死的版头（跟原稿长什么样无关）
      const task = 1;
      const fixedRow = FIXED[clamp(task - 1, 0, FIXED.length - 1)];
      drawStick(ctx, left.x + 16, left.y + 44, left.w - 32, 62, {
        slots: fixedRow.length,
        faces: fixedRow.map((m) => `k${m + 1}`),
        lit: [],
        dim: true,
      });
      drawLabel(ctx, `硬查表 t${task}`, left.x + 16, left.y + 128, {
        size: 12,
        color: LP.failure,
      });

      // ---- 右框内容：由 q(x) 自己挑出来的版头
      const chosen = CHOSEN;
      drawStick(ctx, right.x + 16, right.y + 44, right.w - 32, 62, {
        slots: chosen.length,
        faces: chosen.map((m) => `k${m + 1}`),
        lit: [0, 1, 2],
      });
      drawLabel(ctx, '按输入挑', right.x + 16, right.y + 128, {
        size: 12,
        color: LP.success,
      });

      // ---- 两张原稿（同一份输入）各自挑的字条，落在两个框之间的对照
      drawSort(ctx, left.x + 20, left.y + 168, 40, 46, {
        face: '稿',
        fill: LP.dark,
        alpha: 0.45,
      });
      drawSort(ctx, right.x + 20, right.y + 168, 40, 46, {
        face: '稿',
        fill: LP.support,
        emphasis: !s.give,
      });

      // ---- 下方设定标签
      const lineY = 330;
      ctx.save();
      ctx.fillStyle = '#efece2';
      ctx.strokeStyle = s.give ? LP.failure : LP.success;
      ctx.lineWidth = LP_LW;
      lpRoundRect(ctx, 60, lineY, 960, 34, 6, true, true);
      ctx.font = lpFont(14, 500);
      ctx.fillStyle = LP.ink;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        s.give ? '测试时告诉你题号：模型按题号挂上一套固定调料' : '测试时不给题号：每份食材拿自己的摘要去选料',
        74,
        lineY + 17
      );
      ctx.restore();
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      s.anim = easeSpring((t / 900) % 1);
      if (isAna) renderAna(s, t);
      else renderNormal(s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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
  }, [W, H, isAna]);

  const toggle = () => {
    const next = !stateRef.current.give;
    stateRef.current = { ...stateRef.current, give: next };
    setGive(next);
    setFeedback(
      next
        ? {
            text: '这是 task-IL：测试时要告诉你题号；这类方法不适用于更一般的设定。',
            cls: 'bad',
          }
        : {
            text: '这是 class-IL：题号未知，靠输入自己找——L2P 的战场在这里。',
            cls: 'good',
          }
    );
  };

  if (isAna) {
    return (
      <div>
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
    );
  }

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          测试时告知任务号 <span className="val">{give ? '是' : '否'}</span>
        </label>
        <button className={`tiny${give ? '' : ' ghost'}`} aria-pressed={give} onClick={toggle}>
          {give ? '改回不给题号' : '告诉它这是第几个任务'}
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="l">设定</span>
          <span className="v">{give ? 'task-IL' : 'class-IL'}</span>
        </div>
        <div className="metric">
          <span className="l">调料来源</span>
          <span className="v">{give ? '硬查表' : 'q(x) 比出来'}</span>
        </div>
        <div className="metric">
          <span className="l">需要题号</span>
          <span className="v">{give ? '需要' : '不需要'}</span>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default TaskIdToggle;
