import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawFlag,
  drawSceneLabel,
  GUIDE,
  OK,
  EMPH,
  INK,
  MUTED,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// m61 — symlog：两把尺子。拖动橙色手柄（−1000 … +1000），
// 上区是岩壁剖面的高度标记；下区是原始数轴、symlog 刻度尺与 symlog 曲线。

const W = 1080;
const H = 280;
const VMIN = -1000;
const VMAX = 1000;
const X0 = 90;
const X1 = 660;
const RAW_Y = 150;
const SYM_Y = 215;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const symlog = (x: number): number => Math.sign(x) * Math.log(Math.abs(x) + 1);
const S_MAX = symlog(VMAX);
const rawX = (v: number): number => lerp(X0, X1, (v - VMIN) / (VMAX - VMIN));
const symX = (v: number): number => lerp(X0, X1, (symlog(v) / S_MAX + 1) / 2);

const ORDERS = [-1000, -100, -10, -1, 0, 1, 10, 100, 1000];

const fbFor = (v: number): { text: string; cls: string } => {
  const a = Math.abs(v);
  if (a <= 1) {
    return { text: '原点附近 symlog ≈ 恒等：小数值几乎不被改动。', cls: '' };
  }
  if (a <= 100) {
    return { text: '开始压缩：100 被压到很小的位置，但符号与大小顺序都保留。', cls: 'good' };
  }
  return { text: '大数值被压进有限的刻度里——两个尺子的差距在这里最明显。', cls: '' };
};

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const valueRef = useRef({ value: 10 });
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [value, setValue] = useState(10);
  const [feedback, setFeedback] = useState(fbFor(10));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { value: number }): void => {
      clearCrag(ctx, W, H);

      // 上区：岩壁剖面 + 高度标记
      drawWall(ctx, 60, 28, 960, 78);
      const yFlag = lerp(96, 40, (s.value - VMIN) / (VMAX - VMIN));
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(520, 28);
      ctx.lineTo(520, 106);
      ctx.stroke();
      ctx.restore();
      drawFlag(ctx, 520, yFlag, EMPH);

      // 中区：原始数轴（线性）
      ctx.save();
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(X0, RAW_Y);
      ctx.lineTo(X1, RAW_Y);
      ctx.stroke();
      ctx.restore();
      [VMIN, 0, VMAX].forEach((v) => {
        ctx.save();
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rawX(v), RAW_Y - 6);
        ctx.lineTo(rawX(v), RAW_Y + 6);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.font = '14px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(String(v), rawX(v), RAW_Y + 22);
        ctx.restore();
      });

      // 中区：橙色手柄 + 裸数字
      ctx.save();
      ctx.beginPath();
      ctx.arc(rawX(s.value), RAW_Y, 9, 0, Math.PI * 2);
      ctx.fillStyle = EMPH;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = '16px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(String(s.value), rawX(s.value), RAW_Y - 14);
      ctx.restore();
      drawSceneLabel(ctx, '原始数轴', X0, 128, MUTED);

      // 下区：symlog 刻度尺（数量级近似等距）
      ctx.save();
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(X0, SYM_Y);
      ctx.lineTo(X1, SYM_Y);
      ctx.stroke();
      ctx.restore();
      ORDERS.forEach((v) => {
        ctx.save();
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(symX(v), SYM_Y - 6);
        ctx.lineTo(symX(v), SYM_Y + 6);
        ctx.stroke();
        ctx.fillStyle = MUTED;
        ctx.font = '12px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(String(v), symX(v), SYM_Y + 22);
        ctx.restore();
      });
      ctx.save();
      ctx.beginPath();
      ctx.arc(symX(s.value), SYM_Y, 8, 0, Math.PI * 2);
      ctx.fillStyle = EMPH;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, 'symlog 尺', X0, 196, MUTED);

      // 右下角：symlog 曲线与当前点
      const cx0 = 740;
      const cx1 = 1020;
      const yTop = 196;
      const yBot = 250;
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx0, yBot);
      ctx.lineTo(cx1, yBot);
      ctx.moveTo(880, yTop);
      ctx.lineTo(880, yBot + 4);
      ctx.stroke();

      const curveY = (v: number): number =>
        yBot - ((symlog(v) / S_MAX + 1) / 2) * (yBot - yTop);
      ctx.strokeStyle = OK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let v = VMIN; v <= VMAX; v += 20) {
        const px = lerp(cx0, cx1, (v - VMIN) / (VMAX - VMIN));
        const py = curveY(v);
        if (v === VMIN) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const px = lerp(cx0, cx1, (s.value - VMIN) / (VMAX - VMIN));
      const py = curveY(s.value);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = EMPH;
      ctx.fill();
      ctx.restore();
    };

    const tick = (): void => {
      render(valueRef.current);
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

  const apply = (v: number): void => {
    const next = clamp(Math.round(v), VMIN, VMAX);
    valueRef.current.value = next;
    setValue(next);
    setFeedback(fbFor(next));
  };

  const canvasToValue = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return valueRef.current.value;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return valueRef.current.value;
    const px = (clientX - rect.left) * (W / rect.width);
    const v = VMIN + ((px - X0) / (X1 - X0)) * (VMAX - VMIN);
    return clamp(v, VMIN, VMAX);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no capture available */
    }
    apply(canvasToValue(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!draggingRef.current) return;
    apply(canvasToValue(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* nothing to release */
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: 'ew-resize' }}
      />
      <div className="ctrl">
        <button className="chip" onClick={() => apply(valueRef.current.value - 50)}>
          −50
        </button>
        <button className="chip" onClick={() => apply(valueRef.current.value - 1)}>
          −1
        </button>
        <button className="chip" onClick={() => apply(valueRef.current.value + 1)}>
          +1
        </button>
        <button className="chip" onClick={() => apply(valueRef.current.value + 50)}>
          +50
        </button>
        <span className="val">数值 {value}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M61;
