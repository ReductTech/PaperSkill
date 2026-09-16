import React, { useEffect, useRef, useState } from 'react';
import { clamp, map, observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  BORDER,
  EMPHASIS,
  FAIL,
  GUIDE,
  SUCCESS,
  TEXT_MUTED,
  clearScene,
  drawAimLine,
  drawBall,
  drawSceneLabel,
  drawTable,
  drawTargetSpot,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 模块 4.1：拖动力度滑块改变母球停点；台面给出停点与目标环，右侧小图给出力度-距离关系。
// 力度-距离是台球常识示意，论文没有测量它，因此 Canvas 上不标数值。

const W = 1080;
const H = 280;
const BAND_TOP = 70;
const BAND_BOTTOM = 210;
const MID_Y = 140;
const CUE_X = 200;
const TARGET_X = 780;
const TOL = 24;
/** 力度 0 时的停点位置，以及每 1 点力度推进的距离。 */
const STOP_BASE = 300;
const STOP_PER_POWER = 7.2;
const CURVE = { x: 830, y: 165, w: 210, h: 85 };

const FEEDBACK_IDLE = '拖动力度，让母球停在橙色圆环里。';
const FEEDBACK_SHORT = '停短了：母球留在目标点前面，下一杆角度变难。';
const FEEDBACK_LONG = '停长了：母球越过目标点，容易贴库。';
const FEEDBACK_HIT = '停在目标环内，下一杆顺。';

const stopXOf = (power: number) => STOP_BASE + STOP_PER_POWER * power;

function judge(power: number, touched: boolean) {
  if (!touched) return { text: FEEDBACK_IDLE, cls: '' };
  const stopX = stopXOf(power);
  if (Math.abs(stopX - TARGET_X) <= TOL) return { text: FEEDBACK_HIT, cls: 'good' };
  return stopX < TARGET_X
    ? { text: FEEDBACK_SHORT, cls: 'bad' }
    : { text: FEEDBACK_LONG, cls: 'bad' };
}

export const Wla41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ power: 50, touched: false });
  const [power, setPower] = useState(50);
  const [feedback, setFeedback] = useState(judge(50, false));

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
      const p = stateRef.current.power;
      const stopX = stopXOf(p);
      const onTarget = Math.abs(stopX - TARGET_X) <= TOL;
      const spotColor = onTarget ? SUCCESS : FAIL;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [1000], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });
      drawAimLine(ctx, CUE_X, MID_Y, stopX, MID_Y, { dashed: true });
      drawTargetSpot(ctx, TARGET_X, MID_Y, 22, onTarget ? 'hit' : 'idle');
      drawBall(ctx, CUE_X, MID_Y, 10, GUIDE);
      // 停点球：命中时绿球落在绿色目标环内；未命中时红球带红环
      drawBall(ctx, stopX, MID_Y, 10, spotColor, onTarget ? {} : { ring: FAIL });

      // 力度-距离小图（示意，不标数值）
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(CURVE.x, CURVE.y, CURVE.w, CURVE.h);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(CURVE.x, CURVE.y, CURVE.w, CURVE.h);
      const x0 = CURVE.x + 14;
      const x1 = CURVE.x + CURVE.w - 14;
      const y0 = CURVE.y + CURVE.h - 12;
      const y1 = CURVE.y + 18;
      ctx.strokeStyle = BORDER;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y0);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y1);
      ctx.stroke();
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      // 当前点
      const mx = map(p, 0, 100, x0, x1);
      const my = map(p, 0, 100, y0, y1);
      ctx.strokeStyle = EMPHASIS;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - 7, my);
      ctx.lineTo(mx + 7, my);
      ctx.moveTo(mx, my - 7);
      ctx.lineTo(mx, my + 7);
      ctx.stroke();
      ctx.restore();

      drawSceneLabel(ctx, '目标停球点', TARGET_X, 34, { align: 'center' });
      drawSceneLabel(ctx, '力度', CURVE.x + 14, CURVE.y + CURVE.h + 14, { color: TEXT_MUTED });
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clamp(Number(e.target.value), 0, 100);
    stateRef.current.power = value;
    stateRef.current.touched = true;
    setPower(value);
    setFeedback(judge(value, true));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        data-power={power}
      />
      <div className="ctrl">
        <label htmlFor={`power-${chapterId}-${moduleId}`}>
          出杆力度 <span className="val">{power}</span>
        </label>
        <input
          id={`power-${chapterId}-${moduleId}`}
          type="range"
          min={0}
          max={100}
          step={5}
          value={power}
          onChange={onChange}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla41;
