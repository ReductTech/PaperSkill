import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawTable,
  drawBall,
  drawShot,
  drawPocket,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  AUX,
  MUTED,
} from './billiardsKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const TABLE_Y = 62;
const TABLE_W = 480;
const TABLE_H = 140;
const MID_Y = TABLE_Y + TABLE_H / 2;
const BALL = '#f6f1e3';

const L_TABLE_X = 40;
const R_TABLE_X = 560;
const L_BALL: [number, number] = [100, MID_Y];
const L_POCKET: [number, number] = [500, MID_Y];
const R_BALL: [number, number] = [620, MID_Y];
const R_POCKET: [number, number] = [1020, MID_Y];
const SPREAD = 0.16;

function fan(
  bx: number,
  by: number,
  px: number,
  py: number,
  n: number,
  spread: number
): number[][][] {
  const a0 = Math.atan2(py - by, px - bx);
  const len = Math.hypot(px - bx, py - by);
  const out: number[][][] = [];
  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
    const a = a0 + off;
    out.push([
      [bx, by],
      [bx + Math.cos(a) * len, by + Math.sin(a) * len],
    ]);
  }
  return out;
}

function fanKinked(bx: number, by: number, px: number, py: number): number[][][] {
  const straight = fan(bx, by, px, py, 5, SPREAD);
  return straight.map((path, i) => {
    const ex = path[1][0];
    const ey = path[1][1];
    const mx = (bx + ex) / 2;
    const my = (by + ey) / 2 + (i - 2) * 7;
    return [[bx, by], [mx, my], [ex, ey]];
  });
}

function feedbackFor(step: number): string {
  if (step < 33) {
    return '同一张球台、同一个局面：DreamerV3 先把观测压进生成式世界模型；TD-MPC2 直接编码成隐状态 z，不还原画面。';
  }
  if (step < 66) {
    return 'DreamerV3 要重建观测，并在想象里推演策略；TD-MPC2 不重建，只在隐空间里采样一批动作序列。';
  }
  return '两者都输出动作。DreamerV3 的策略在训练时靠重建与想象练好，决策时直接出杆；TD-MPC2 在每次决策时现场挑精英，规划完只执行第一个动作，再重新来。';
}

export const M81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ step: 40 });
  const [step, setStep] = useState(40);

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
      const s = clamp(stateRef.current.step / 100, 0, 1);
      const u = clamp((s - 0.66) / 0.3, 0, 1);
      const e = u * u * (3 - 2 * u);

      clearScene(ctx, W, H);
      drawTable(ctx, L_TABLE_X, TABLE_Y, TABLE_W, TABLE_H);
      drawTable(ctx, R_TABLE_X, TABLE_Y, TABLE_W, TABLE_H);

      // 左：DreamerV3 —— 先读入观测，再重建
      if (s < 0.33) {
        for (let i = 0; i < 3; i++) {
          const phase = (s / 0.33 + i / 3) % 1;
          ctx.globalAlpha = 0.4 * (1 - phase);
          ctx.strokeStyle = GUIDE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(L_BALL[0], L_BALL[1], 8 + phase * 70, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = AUX;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 6; c++) {
            ctx.fillRect(300 + c * 14, 92 + r * 14, 12, 12);
          }
        }
        ctx.globalAlpha = 1;
      }

      const leftPaths = fanKinked(L_BALL[0], L_BALL[1], L_POCKET[0], L_POCKET[1]);
      if (s >= 0.33) {
        for (let i = 0; i < leftPaths.length; i++) {
          const best = i === 2;
          drawShot(
            ctx,
            leftPaths[i],
            best && s >= 0.55 ? OK : s >= 0.55 ? MUTED : AUX,
            best && s >= 0.55 ? 2.4 : 1.4,
            [5, 5]
          );
        }
      }

      // 右：TD-MPC2 —— 直接编码，在隐空间采样
      if (s < 0.33) {
        for (let i = 0; i < 3; i++) {
          const phase = (s / 0.33 + i / 3) % 1;
          ctx.globalAlpha = 0.4 * phase;
          ctx.strokeStyle = AUX;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(R_BALL[0], R_BALL[1], 8 + (1 - phase) * 70, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      const rightPaths = fan(R_BALL[0], R_BALL[1], R_POCKET[0], R_POCKET[1], 5, SPREAD);
      if (s >= 0.33) {
        for (let i = 0; i < rightPaths.length; i++) {
          const best = i === 2;
          drawShot(
            ctx,
            rightPaths[i],
            best && s >= 0.55 ? OK : s >= 0.55 ? MUTED : GUIDE,
            best && s >= 0.55 ? 2.4 : 1.4,
            [5, 5]
          );
        }
      }

      // 执行阶段：两侧同时出杆
      if (s >= 0.66) {
        const lb: [number, number] = [
          lerp(L_BALL[0], L_POCKET[0], e),
          lerp(L_BALL[1], L_POCKET[1], e),
        ];
        drawShot(ctx, [L_BALL, lb], OK, 3);
        if (u < 0.98) drawBall(ctx, lb[0], lb[1], 8 * (1 - clamp((u - 0.85) / 0.13, 0, 1) * 0.8), BALL, true);

        const rb: [number, number] = [
          lerp(R_BALL[0], R_POCKET[0], e),
          lerp(R_BALL[1], R_POCKET[1], e),
        ];
        drawShot(ctx, [R_BALL, rb], OK, 3);
        if (u < 0.98) drawBall(ctx, rb[0], rb[1], 8 * (1 - clamp((u - 0.85) / 0.13, 0, 1) * 0.8), BALL, true);
      } else {
        drawBall(ctx, L_BALL[0], L_BALL[1], 8, BALL, true);
        drawBall(ctx, R_BALL[0], R_BALL[1], 8, BALL, true);
      }

      drawPocket(ctx, L_POCKET[0], L_POCKET[1], 9);
      drawPocket(ctx, R_POCKET[0], R_POCKET[1], 9);

      drawSceneLabel(ctx, '重建再想象', L_TABLE_X, 38);
      drawSceneLabel(ctx, '隐空间规划', R_TABLE_X, 38);
      drawLegend(
        ctx,
        [
          { color: AUX, text: '想象' },
          { color: GUIDE, text: '采样' },
          { color: OK, text: '执行' },
        ],
        40,
        252
      );
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.step = v;
    setStep(v);
  };

  const fb = feedbackFor(step);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          推演进度 <span className="val">{step}%</span>
        </label>
        <input type="range" min={0} max={100} value={step} onChange={onChange} />
      </div>
      <div className={'feedback ' + (step >= 90 ? 'good' : '')}>{fb}</div>
    </div>
  );
};

export default M81;
