import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawSceneLabel,
  drawLegend,
  seeded,
  GUIDE,
  OK,
  BAD,
  EMPH,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// 模块 1.1 平均陷阱：单步回归的输出恒落在两条示教模式的正中间。
const W = 1080;
const H = 280;

const AX0 = 70;
const AX1 = 1010;
const AXIS_Y = 150;
const CL = 0.18; // 左侧示教模式中心
const CR = 0.82; // 右侧示教模式中心
const MEAN = 0.5; // 回归预测恒在两簇中点
const THRESH = 0.12;
const X_MIN = 0.08;
const X_MAX = 0.92;

const xOf = (v: number) => AX0 + v * (AX1 - AX0);

interface Dot {
  dx: number;
  dy: number;
}

function makeDots(seed: number): Dot[] {
  const rnd = seeded(seed);
  const out: Dot[] = [];
  for (let i = 0; i < 12; i++) out.push({ dx: (rnd() - 0.5) * 0.115, dy: (rnd() - 0.5) * 58 });
  return out;
}

const LEFT_DOTS = makeDots(11);
const RIGHT_DOTS = makeDots(29);

function feedbackFor(x: number): { text: string; cls: string } {
  const distL = Math.abs(x - CL);
  const distR = Math.abs(x - CR);
  if (distL > THRESH && distR > THRESH) {
    return { text: '两条示教都可行，回归却给出了两者之间的动作。', cls: 'bad' };
  }
  return { text: '这个状态下人类大多选了更近的一侧，但两条都是对的。', cls: '' };
}

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ startX: 0.5 });
  const [feedback, setFeedback] = useState(feedbackFor(0.5));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { startX: number }) => {
      clearScene(ctx, W, H);

      // 上方动作空间区与下方说明区的分隔
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 196);
      ctx.lineTo(1040, 196);
      ctx.stroke();

      // 动作轴
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(AX0, AXIS_Y);
      ctx.lineTo(AX1, AXIS_Y);
      ctx.stroke();

      // 两条示教动作簇：固定不动
      const cloud = (dots: Dot[], center: number) => {
        ctx.fillStyle = GUIDE;
        for (let i = 0; i < dots.length; i++) {
          ctx.beginPath();
          ctx.arc(xOf(center + dots[i].dx), 115 + dots[i].dy, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = GUIDE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xOf(center), 92);
        ctx.lineTo(xOf(center), AXIS_Y);
        ctx.stroke();
        // 模式中心：绿色小方标
        ctx.fillStyle = OK;
        ctx.fillRect(xOf(center) - 4.5, AXIS_Y - 4.5, 9, 9);
      };
      cloud(LEFT_DOTS, CL);
      cloud(RIGHT_DOTS, CR);

      // 回归预测：位置恒为两簇中点，红圈半径随离最近模式的距离增大
      const distL = Math.abs(s.startX - CL);
      const distR = Math.abs(s.startX - CR);
      const radius = clamp(8 + Math.min(distL, distR) * 64, 8, 40);
      const mx = xOf(MEAN);
      ctx.fillStyle = 'rgba(196,63,82,0.16)';
      ctx.beginPath();
      ctx.arc(mx, AXIS_Y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = BAD;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = BAD;
      ctx.beginPath();
      ctx.arc(mx, AXIS_Y, 4, 0, Math.PI * 2);
      ctx.fill();

      // 起点手柄（拖动对象）
      const hx = xOf(s.startX);
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, AXIS_Y);
      ctx.lineTo(hx, 163);
      ctx.stroke();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(hx, 171, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx, 171, 3, 0, Math.PI * 2);
      ctx.fill();

      // 至多 1 个标签 + 图例
      drawSceneLabel(ctx, '动作空间', 40, 34);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '示教动作' },
          { color: BAD, text: '回归预测' },
          { color: EMPH, text: '你的起点' },
        ],
        40,
        226
      );
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  const applyX = (v: number) => {
    const x = clamp(v, X_MIN, X_MAX);
    stateRef.current.startX = x;
    setFeedback(feedbackFor(x));
  };

  /** CSS 像素 → Canvas 归一化动作坐标 */
  const valueFromClientX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.startX;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return stateRef.current.startX;
    const nx = (clientX - rect.left) / rect.width;
    return (nx - AX0 / W) * (W / (AX1 - AX0));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* 指针已失效时忽略 */
      }
    }
    applyX(valueFromClientX(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0) return;
    applyX(valueFromClientX(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* 未捕获时忽略 */
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      applyX(stateRef.current.startX - 0.02);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      applyX(stateRef.current.startX + 0.02);
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M11;
