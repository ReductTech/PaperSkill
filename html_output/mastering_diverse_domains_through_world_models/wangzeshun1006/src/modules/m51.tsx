import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearCrag,
  drawHold,
  drawWall,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  EMPH,
  AUX,
  MUTED,
  LINE,
} from './climbkit';
import type { WidgetProps } from './registry';

// m51 — λ-回报：从 t = 15 的末端一步步往 t = 1 折回来。
// 上区：15 步路线条；下区：奖励条（橙）/ 价值标记（紫）/ λ-回报折线（绿）。

const W = 1080;
const H = 280;
const N = 15;
const GAMMA = 0.997;
const LAMBDA = 0.95;

// 示意奖励：两个稀疏 +1 与一个中途 0（其余为 0）
const REWARD: number[] = [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0];
// 示意价值：随步数缓升
const VALUE: number[] = REWARD.map((_, i) => 0.1 * (i + 1));

// R[14] = v（末端无未来）；向前逐步自举
const RETURNV: number[] = new Array(N).fill(0);
RETURNV[N - 1] = VALUE[N - 1];
for (let i = N - 2; i >= 0; i--) {
  RETURNV[i] = REWARD[i] + GAMMA * ((1 - LAMBDA) * VALUE[i] + LAMBDA * RETURNV[i + 1]);
}
const RMAX = Math.max(...RETURNV) * 1.05;

const X_L = 70;
const X_R = 1010;
const stepX = (i: number): number => lerp(X_L, X_R, i / (N - 1));
const routeY = (i: number): number => lerp(66, 42, i / (N - 1));

const F_END = { text: '从末端开始：尽头没有未来可看，R 只能等于评论家的估值 v。', cls: '' };
const F_MID = {
  text: 'R = 这一步的真实奖励 + γ 乘上“估值与后续回报的折中”；λ 越大越看重后续，越小越依赖估值。',
  cls: '',
};
const F_START = {
  text: '回到起点，整条想象轨迹压成一个训练目标——这就是评论家要逼近的 λ-回报。',
  cls: 'good',
};
const F_RESET = {
  text: '回到末端重新折一次；λ = 0.95、γ = 0.997 是论文里跨域固定的取值。',
  cls: '',
};

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: N });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(N);
  const [feedback, setFeedback] = useState(F_END);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { step: number }): void => {
      clearCrag(ctx, W, H);
      drawWall(ctx, 44, 22, 992, 84);

      const cur = clamp(s.step, 1, N);
      const curIdx = cur - 1;

      // 上区：路线条 + 15 个步点
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(stepX(0), routeY(0));
      ctx.lineTo(stepX(N - 1), routeY(N - 1));
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < N; i++) {
        if (i === curIdx) {
          drawHold(ctx, stepX(i), routeY(i), 6, EMPH, true);
        } else if (i < curIdx) {
          drawHold(ctx, stepX(i), routeY(i), 5, GUIDE, false);
        } else {
          drawHold(ctx, stepX(i), routeY(i), 4.5, MUTED, false);
        }
      }

      // 当前步的小箭头：← 向回折
      const ax = stepX(curIdx);
      const ay = routeY(curIdx) + 22;
      ctx.save();
      ctx.strokeStyle = EMPH;
      ctx.fillStyle = EMPH;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax - 16, ay);
      ctx.lineTo(ax - 2, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax - 18, ay);
      ctx.lineTo(ax - 10, ay - 4);
      ctx.lineTo(ax - 10, ay + 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 下区：奖励条（橙）
      const rewardBase = 176;
      for (let i = 0; i < N; i++) {
        const h = REWARD[i] * 26;
        ctx.fillStyle = i <= curIdx ? EMPH : LINE;
        ctx.fillRect(stepX(i) - 4, rewardBase - h, 8, Math.max(h, 1));
      }

      // 下区：价值标记（紫）
      const valueBase = 210;
      for (let i = 0; i < N; i++) {
        const h = (VALUE[i] / 1.5) * 26;
        ctx.fillStyle = i <= curIdx ? AUX : LINE;
        ctx.fillRect(stepX(i) - 3, valueBase - h, 6, 6);
      }

      // 下区：λ-回报折线（绿），从右向左逐步长出
      const rBottom = 252;
      const rTop = 216;
      const ry = (i: number): number => rBottom - (RETURNV[i] / RMAX) * (rBottom - rTop);
      ctx.save();
      ctx.strokeStyle = OK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = curIdx; i < N; i++) {
        if (i === curIdx) ctx.moveTo(stepX(i), ry(i));
        else ctx.lineTo(stepX(i), ry(i));
      }
      ctx.stroke();
      ctx.restore();
      for (let i = curIdx; i < N; i++) {
        ctx.fillStyle = OK;
        ctx.beginPath();
        ctx.arc(stepX(i), ry(i), 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 当前 R 值：裸数字
      ctx.save();
      ctx.fillStyle = OK;
      ctx.font = '16px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(RETURNV[curIdx].toFixed(2), stepX(curIdx) + 6, ry(curIdx) - 6);
      ctx.restore();

      drawSceneLabel(ctx, '从末端折回', 70, 34, MUTED);
      drawLegend(
        ctx,
        [
          { color: EMPH, text: '奖励' },
          { color: AUX, text: '价值' },
          { color: OK, text: 'λ-回报' },
        ],
        70,
        128
      );
      // 起点 / 末端的小标注用裸数字表示步号
      ctx.save();
      ctx.fillStyle = MUTED;
      ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1', stepX(0), 92);
      ctx.fillText('15', stepX(N - 1), 92);
      ctx.restore();
    };

    const tick = (): void => {
      render(stateRef.current);
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

  const onBack = (): void => {
    if (stateRef.current.step <= 1) return;
    const ns = stateRef.current.step - 1;
    stateRef.current.step = ns;
    setStep(ns);
    setFeedback(ns === 1 ? F_START : F_MID);
  };

  const onReset = (): void => {
    stateRef.current.step = N;
    setStep(N);
    setFeedback(F_RESET);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          className="chip"
          onClick={onBack}
          disabled={step <= 1}
          style={{ opacity: step <= 1 ? 0.5 : 1, cursor: step <= 1 ? 'not-allowed' : 'pointer' }}
        >
          往回折一步
        </button>
        <button className="chip" onClick={onReset}>
          回到末端
        </button>
        <span className="val">t = {step}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51;
