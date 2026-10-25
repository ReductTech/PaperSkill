import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearCrag,
  drawWall,
  drawClimber,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  OK,
  BAD,
  AUX,
  MUTED,
} from './climbkit';
import type { WidgetProps } from './registry';

// m52 — 演员的节奏：奖励尺度滑块（1× → 100×，对数刻度）。
// 左「不归一化」随尺度失衡、转红；右「回报归一化」保持一致、平稳。

const W = 1080;
const H = 280;

const sliderToScale = (v: number): number => Math.pow(10, v / 50);
const scaleToSlider = (s: number): number => clamp(Math.round(Math.log10(s) * 50), 0, 100);

const F_ONE = { text: '奖励尺度 1×：回报本来就在 1 附近，两侧差别不大。', cls: '' };
const F_TEN = {
  text: '不归一化：回报幅度已经是熵项的十倍，探索被压扁——演员开始只顾眼前。',
  cls: 'bad',
};
const F_HUNDRED = {
  text: '不归一化：回报彻底淹没熵项，要么不敢动、要么乱动；归一化侧节奏依旧平稳。论文的做法是除以 5%–95% 分位范围，并给分母设下限 1，小回报不被放大。',
  cls: 'bad',
};

export const M52: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ scale: 1 });
  const rafRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);
  const [feedback, setFeedback] = useState(F_ONE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = (elapsed: number, s: { scale: number }): void => {
      clearCrag(ctx, W, H);
      drawWall(ctx, 300, 46, 150, 150);
      drawWall(ctx, 780, 46, 150, 150);

      const norm = clamp(Math.log10(s.scale) / 2, 0, 1);
      const imbalanced = norm > 0.15;
      const jit = imbalanced ? norm : 0;

      // 左：奖励—熵平衡条（回报随尺度拉长，熵条不动）
      const rewardLen = 50 + norm * 150;
      ctx.fillStyle = imbalanced ? BAD : MUTED;
      ctx.fillRect(70, 84, rewardLen, 14);
      ctx.fillStyle = AUX;
      ctx.fillRect(70, 112, 80, 14);

      // 右：归一化后两条保持相当
      ctx.fillStyle = OK;
      ctx.fillRect(560, 84, 100, 14);
      ctx.fillStyle = AUX;
      ctx.fillRect(560, 112, 80, 14);

      // 左攀岩者：失衡时要么僵住、要么乱抖
      const lx = 375 + (imbalanced ? Math.sin(elapsed / 110) * jit * 4 : 0);
      const ly = 150 + (imbalanced ? Math.sin(elapsed / 65) * jit * 7 : 0);
      drawClimber(ctx, lx, ly, 0.9, imbalanced ? BAD : GUIDE, imbalanced ? 'reach' : 'rest');

      // 右攀岩者：节奏平稳
      const ry = 150 + Math.sin(elapsed / 520) * 2;
      drawClimber(ctx, 855, ry, 0.9, OK, 'hang');

      drawSceneLabel(ctx, '不归一化', 70, 34, imbalanced ? BAD : MUTED);
      drawSceneLabel(ctx, '回报归一化', 560, 34, OK);
      drawLegend(
        ctx,
        [
          { color: imbalanced ? BAD : MUTED, text: '回报' },
          { color: AUX, text: '熵' },
        ],
        70,
        262
      );

      // 尺度差示意：失衡时在两条之间画一段红色张力线
      if (imbalanced) {
        ctx.save();
        ctx.strokeStyle = BAD;
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(70 + rewardLen, 91);
        ctx.lineTo(150, 119);
        ctx.stroke();
        ctx.restore();
      }
    };

    const tick = (): void => {
      render(performance.now() - t0, stateRef.current);
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
    const v = clamp(Number(e.target.value), 0, 100);
    const next = sliderToScale(v);
    stateRef.current.scale = next;
    setScale(next);
    if (next < 3.2) setFeedback(F_ONE);
    else if (next < 31.6) setFeedback(F_TEN);
    else setFeedback(F_HUNDRED);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          奖励尺度 <span className="val">{scale < 10 ? scale.toFixed(1) : scale.toFixed(0)}×</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={scaleToSlider(scale)}
          onChange={onChange}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M52;
