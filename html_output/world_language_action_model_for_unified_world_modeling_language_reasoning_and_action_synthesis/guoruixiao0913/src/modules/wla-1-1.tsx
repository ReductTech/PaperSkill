import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawBall,
  drawAimLine,
  drawTargetSpot,
  drawSceneLabel,
  GUIDE,
  FELT_DARK,
  FAIL,
  SUCCESS,
  EMPHASIS,
  BORDER,
} from './billiardsKit';

// §1 模块 1.1（1080×280）— 台面越长，「只看画面」越容易失位。
// 唯一主导操作：拖动「任务长度」滑块（1–6 杆），再用「加入语言意图」按钮切换打法。
// 两个控件都在输入时立刻同时更新 Canvas、失位条与反馈句。

const W = 1080;
const H = 280;
const BAND_TOP = 70;
const BAND_BOTTOM = 210;
const MID = (BAND_TOP + BAND_BOTTOM) / 2;
const CUE_START = 110;
const POCKET_X = 975;
const PER_SHOT_PX = 32;
const BAR_X = 60;
const BAR_Y = 238;
const BAR_W = 260;
const BAR_H = 18;

interface Scene {
  horizon: number;
  useIntention: boolean;
}

/** 失位量：单位为「袋口宽度」，1 表示刚好偏出一个袋口宽。 */
function driftOf(s: Scene): number {
  return s.useIntention ? 0.3 * s.horizon : 1.25 * s.horizon;
}

/** 失位条长度：drift = 1.25（初始局面）为空，drift = 7.5（最长局面）满格。 */
function barOf(drift: number): number {
  return clamp(map(drift, 1.25, 7.5, 0, BAR_W), 0, BAR_W);
}

function feedbackOf(s: Scene): { text: string; cls: string } {
  if (!s.useIntention && s.horizon === 1) {
    return { text: "只有一杆时，'只看画面'也够用。", cls: '' };
  }
  if (!s.useIntention) {
    return {
      text: `到第 ${s.horizon} 杆，靶球已经漂出袋口一个身位以上，只对齐画面救不回来。`,
      cls: 'bad',
    };
  }
  if (s.horizon >= 2) {
    return { text: '先说出这一杆要做什么，长局面里落点仍然停在目标环内。', cls: 'good' };
  }
  return { text: '一杆的局面两种打法都行，但意图已经写清楚了。', cls: 'good' };
}

export const Wla11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Scene>({ horizon: 1, useIntention: false });
  const rafRef = useRef<number | null>(null);
  const [horizon, setHorizon] = useState(1);
  const [useIntention, setUseIntention] = useState(false);
  const [feedback, setFeedback] = useState(feedbackOf({ horizon: 1, useIntention: false }));

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
      const s = stateRef.current;
      const drift = driftOf(s);
      const bar = barOf(drift);
      // 未加意图时，每多一杆靶球就多漂出 32 px；加了意图则停在袋口内。
      const offset = s.useIntention ? 0 : PER_SHOT_PX * (s.horizon - 1);
      const targetX = POCKET_X - offset;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [POCKET_X], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });

      // 失位轨迹：红虚线，只在「只看画面」时出现。
      if (!s.useIntention) {
        drawAimLine(ctx, CUE_START, MID, targetX, MID, { color: FAIL, dashed: true });
      } else {
        // 当前轨迹：蓝实线，指向袋口。
        drawAimLine(ctx, CUE_START, MID, targetX, MID, { color: GUIDE, width: 2 });
      }
      // 落点：加意图后转绿。
      drawTargetSpot(ctx, POCKET_X, MID, 14, s.useIntention ? 'hit' : 'miss');
      // 失位条：空槽为浅蓝，填充色随打法变化。
      ctx.fillStyle = BORDER;
      ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);
      if (bar > 0) {
        ctx.fillStyle = s.useIntention ? SUCCESS : FAIL;
        ctx.fillRect(BAR_X, BAR_Y, bar, BAR_H);
      }
      // 靶球：漂出袋口时套橙色虚线环。
      drawBall(ctx, targetX, MID, 9, FELT_DARK, offset > 0 ? { ring: EMPHASIS, dashed: true } : {});
      // 母球停在左侧出发位。
      drawBall(ctx, CUE_START, MID, 10, GUIDE);

      drawSceneLabel(ctx, '瞄准线', 84, 40);
      drawSceneLabel(ctx, '目标袋口', POCKET_X, 250, { align: 'center' });
    };

    const tick = () => {
      render();
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

  const onHorizon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Math.round(Number(e.target.value)), 1, 6);
    stateRef.current = { ...stateRef.current, horizon: v };
    setHorizon(v);
    setFeedback(feedbackOf(stateRef.current));
  };

  const onToggleIntention = () => {
    stateRef.current = { ...stateRef.current, useIntention: !stateRef.current.useIntention };
    setUseIntention(stateRef.current.useIntention);
    setFeedback(feedbackOf(stateRef.current));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          任务长度 <span className="val">{horizon}</span>
        </label>
        <input type="range" min={1} max={6} step={1} value={horizon} onChange={onHorizon} />
        <button
          type="button"
          className={useIntention ? 'tiny' : 'tiny ghost'}
          aria-pressed={useIntention}
          onClick={onToggleIntention}
        >
          加入语言意图
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla11;
