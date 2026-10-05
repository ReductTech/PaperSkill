import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawPath,
  drawHand,
  drawScore,
  drawSceneLabel,
  drawLegend,
  seeded,
  EMPH,
  GUIDE,
  OK,
  BAD,
  DARK,
  LINE,
} from './musicKit';
import type { WidgetProps } from './registry';

// P1 滑块：τ ∈ [0,1] 是流时间。动作块在小节上从抖动的噪声收敛成一条平滑轨迹。
const W = 1080;
const H = 280;
const X0 = 130;
const X1 = 950;
const Y0 = 56;
const Y1 = 190;
const N = 26;

const tx = (u: number): number => lerp(X0 + 22, X1 - 22, u);
const ty = (u: number): number => 158 - u * 72 + Math.sin(u * Math.PI * 3) * 15;

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ tau: 0.45 });
  const rafRef = useRef<number | null>(null);
  const [tau, setTau] = useState(0.45);
  const [feedback, setFeedback] = useState({
    text: '拖动滑块改变流时间 τ：看动作如何从噪声收敛成一整块。',
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

    const rnd = seeded(17);
    const noise: number[][] = [];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const nx = clamp(tx(u) + (rnd() * 2 - 1) * 52, X0 + 10, X1 - 10);
      const ny = clamp(ty(u) + (rnd() * 2 - 1) * 54, Y0 + 10, Y1 - 10);
      noise.push([nx, ny]);
    }

    const render = (s: { tau: number }): void => {
      clearScene(ctx, W, H);
      const t = clamp(s.tau, 0, 1);

      // 小节框 + 拍线
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
      for (let i = 1; i < 4; i++) {
        const bx = lerp(X0, X1, i / 4);
        ctx.beginPath();
        ctx.moveTo(bx, Y0);
        ctx.lineTo(bx, Y1);
        ctx.stroke();
      }

      // 目标轨迹（虚线）与当前轨迹（实线）
      const target: number[][] = [];
      const cur: number[][] = [];
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        target.push([tx(u), ty(u)]);
        cur.push([lerp(noise[i][0], tx(u), t), lerp(noise[i][1], ty(u), t)]);
      }
      drawPath(ctx, target, GUIDE, 2, [7, 7]);
      if (t > 0.82) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        drawPath(ctx, cur, OK, 9);
        ctx.restore();
      }
      drawPath(ctx, cur, EMPH, 3.5);

      // 轨迹两端
      ctx.fillStyle = DARK;
      ctx.beginPath();
      ctx.arc(cur[0][0], cur[0][1], 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cur[N - 1][0], cur[N - 1][1], 4, 0, Math.PI * 2);
      ctx.fill();

      // 手停在轨迹末端：τ 足够大时转为可执行色
      drawHand(ctx, cur[N - 1][0], cur[N - 1][1] - 8, 0.6, t > 0.8 ? OK : EMPH);

      // 收敛进度
      drawScore(ctx, X0, Y1 + 14, X1 - X0, 10, 10, Math.round(t * 10), OK);

      drawSceneLabel(ctx, '噪声', X0, 40, BAD);
      drawSceneLabel(ctx, '动作块', X1 - 66, 40, OK);
      drawLegend(
        ctx,
        [
          { color: EMPH, text: '当前动作' },
          { color: GUIDE, text: '目标轨迹' },
        ],
        X0,
        232
      );
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.tau = v;
    setTau(v);
    if (v < 0.3) {
      setFeedback({ text: '流时间 τ 还很小：轨迹仍是噪声，这时的输出不能执行。', cls: 'bad' });
    } else if (v <= 0.8) {
      setFeedback({ text: '正在收敛：噪声一点一点被“流”向目标轨迹，动作逐渐显形。', cls: '' });
    } else {
      setFeedback({ text: '已经成形：轨迹平滑连续，可以作为一整块动作交给机器人执行。', cls: 'good' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          流时间 τ <span className="val">{tau.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(tau * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31;
