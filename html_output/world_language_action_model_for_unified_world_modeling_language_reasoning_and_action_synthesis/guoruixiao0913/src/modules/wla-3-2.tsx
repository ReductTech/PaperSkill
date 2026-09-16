import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  AUX,
  BORDER,
  GUIDE,
  SUCCESS,
  TEXT_MUTED,
  clearScene,
  drawSceneLabel,
  drawTable,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 模块 3.2：时间轴式结构图。蓝色窗口随时间前移，走过的那一格并入紫色记忆条。
// step 0→4 由「上一杆」/「下一杆」推进；到 4 时「下一杆」禁用并改为「已完成」。

const W = 1080;
const H = 280;
const CELLS = 5;
const TL_X0 = 80;
const TL_X1 = 1000;
const TL_TOP = 110;
const TL_BOTTOM = 165;
const MEM_TOP = 205;
const MEM_BOTTOM = 235;
const CELL_W = (TL_X1 - TL_X0) / CELLS;
const PAD = 6;

const FEEDBACK_IDLE = '窗口只覆盖眼前这两段子任务。';
const FEEDBACK_MOVING = '窗口前移一格，刚走过的那一段已经写进记忆。';
const FEEDBACK_DONE = '子任务全部写进记忆：长时程任务靠这条痕迹判断做到哪一步了。';

function judge(step: number) {
  if (step === 0) return { text: FEEDBACK_IDLE, cls: '' };
  if (step >= CELLS - 1) return { text: FEEDBACK_DONE, cls: 'good' };
  return { text: FEEDBACK_MOVING, cls: '' };
}

export const Wla32: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(judge(0));

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
      const current = stateRef.current.step;
      const windowStart = current;
      const windowEnd = Math.min(current + 1, CELLS - 1);

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [], bandTop: 16, bandBottom: 30 });

      // 时间轴：已完成格填绿，未完成格灰虚线
      for (let i = 0; i < CELLS; i += 1) {
        const x = TL_X0 + i * CELL_W + PAD;
        const cw = CELL_W - PAD * 2;
        if (i < current) {
          ctx.fillStyle = SUCCESS;
          ctx.fillRect(x, TL_TOP, cw, TL_BOTTOM - TL_TOP);
        } else {
          ctx.save();
          ctx.strokeStyle = BORDER;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 5]);
          ctx.strokeRect(x, TL_TOP, cw, TL_BOTTOM - TL_TOP);
          ctx.restore();
        }
      }

      // 当前窗口框：蓝底 + 蓝描边
      const wx = TL_X0 + windowStart * CELL_W + PAD;
      const ww = (windowEnd - windowStart + 1) * CELL_W - PAD * 2;
      const wTop = TL_TOP - 8;
      const wH = TL_BOTTOM - TL_TOP + 16;
      ctx.fillStyle = 'rgba(39, 68, 110, 0.14)';
      ctx.fillRect(wx, wTop, ww, wH);
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      ctx.strokeRect(wx, wTop, ww, wH);

      // 记忆条：已追加的子任务为紫色细块
      ctx.save();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(TL_X0, MEM_TOP, TL_X1 - TL_X0, MEM_BOTTOM - MEM_TOP);
      ctx.restore();
      ctx.fillStyle = AUX;
      for (let i = 0; i < current; i += 1) {
        ctx.fillRect(
          TL_X0 + i * CELL_W + PAD,
          MEM_TOP + 5,
          CELL_W - PAD * 2,
          MEM_BOTTOM - MEM_TOP - 10,
        );
      }

      drawSceneLabel(ctx, '子任务窗口', TL_X0, 92, { color: TEXT_MUTED });
      drawSceneLabel(ctx, '记忆', TL_X0, 252, { color: TEXT_MUTED });
    };

    const tick = () => {
      render();
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
  }, []);

  const go = (next: number) => {
    const value = Math.max(0, Math.min(CELLS - 1, next));
    stateRef.current.step = value;
    setStep(value);
    setFeedback(judge(value));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        data-step={step}
      />
      <div className="step-ctrl">
        <span className="step-label">
          第 <b>{step + 1}</b> / {CELLS} 步
        </span>
        <button type="button" className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          上一杆
        </button>
        <button
          type="button"
          className="tiny"
          onClick={() => go(step + 1)}
          disabled={step === CELLS - 1}
        >
          {step === CELLS - 1 ? '已完成' : '下一杆'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla32;
