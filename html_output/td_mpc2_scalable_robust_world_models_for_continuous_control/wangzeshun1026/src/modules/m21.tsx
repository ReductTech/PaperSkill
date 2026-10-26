import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawTable,
  drawBall,
  drawShot,
  drawPocket,
  drawSceneLabel,
  seeded,
  GUIDE,
  OK,
  BAD,
  INK,
  MUTED,
  LINE,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 2.1 重建 vs 隐式：同一段推演，左侧努力还原未来画面，右侧只预测回报。
const W = 1080;
const H = 280;

const LT = { x: 44, y: 62, w: 464, h: 156 };
const RT = { x: 572, y: 62, w: 464, h: 156 };

interface NoiseDot {
  x: number;
  y: number;
  r: number;
}

const NOISE: NoiseDot[] = (() => {
  const rnd = seeded(97);
  const out: NoiseDot[] = [];
  for (let i = 0; i < 80; i++) out.push({ x: rnd(), y: rnd(), r: 1 + rnd() * 2.6 });
  return out;
})();

const STEPS = [
  { label: 't+1', fb: { text: '第 1 步：两侧都还清楚，差别还不明显。继续往后推演。', cls: '' } },
  { label: 't+2', fb: { text: '第 2 步：重建开始发糊、冒出噪点；隐式回报仍然稳定。', cls: '' } },
  { label: 't+3', fb: { text: '第 3 步：重建已很难还原未来观测，回报预测依旧清楚。控制要的是后者。', cls: 'good' } },
];

function panelPoint(t: { x: number; y: number; w: number; h: number }, f: number): number[] {
  const x0 = t.x + t.w * 0.14;
  const y0 = t.y + t.h * 0.64;
  const x1 = t.x + t.w * 0.95;
  const y1 = t.y + t.h * 0.36;
  return [lerp(x0, x1, f), lerp(y0, y1, f)];
}

function render(ctx: CanvasRenderingContext2D, view: number): void {
  clearScene(ctx, W, H);
  drawTable(ctx, LT.x, LT.y, LT.w, LT.h);
  drawTable(ctx, RT.x, RT.y, RT.w, RT.h);

  const f = 0.18 + view * 0.15;
  const [lx, ly] = panelPoint(LT, f);
  const [rx, ry] = panelPoint(RT, f);

  // 左侧：重建的未来画面，步数越大越糊、噪点越多
  const badness = clamp(view / 2, 0, 1);
  if (badness > 0.02) {
    ctx.strokeStyle = BAD;
    ctx.globalAlpha = 0.22 + badness * 0.5;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.strokeRect(LT.x + 4, LT.y + 4, LT.w - 8, LT.h - 8);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    for (let k = 1; k <= 3; k++) {
      ctx.globalAlpha = 0.16 * view;
      drawBall(ctx, lx + k * view * 2.4, ly - k * view * 1.7, 8, MUTED, false);
      ctx.globalAlpha = 1;
    }

    const dots = Math.round(view * 34);
    ctx.fillStyle = MUTED;
    for (let i = 0; i < dots && i < NOISE.length; i++) {
      ctx.globalAlpha = 0.22 + 0.28 * badness;
      ctx.beginPath();
      ctx.arc(LT.x + NOISE[i].x * LT.w, LT.y + NOISE[i].y * LT.h, NOISE[i].r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  drawBall(ctx, lx, ly, 8, '#f3f0e4', true);
  drawPocket(ctx, LT.x + LT.w * 0.95, LT.y + LT.h * 0.36, 10);

  // 右侧：只画动作序列带来的结果与回报，不还原画面
  const [sx, sy] = panelPoint(RT, 0);
  drawShot(ctx, [[sx, sy], [rx, ry], [RT.x + RT.w * 0.95, RT.y + RT.h * 0.36]], GUIDE, 1.6, [6, 5]);
  drawBall(ctx, rx, ry, 8, '#f3f0e4', true);
  drawPocket(ctx, RT.x + RT.w * 0.95, RT.y + RT.h * 0.36, 10);

  // 隐状态占位格：稳定、不被步数扰动
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = GUIDE;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(RT.x + RT.w - 116 + i * 16, RT.y + 10, 11, 11);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(RT.x + RT.w - 116 + i * 16 + 0.5, RT.y + 10.5, 10, 10);
  }

  // 三个时间步的回报预测：高度保持一致
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = OK;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(RT.x + RT.w - 96 + i * 26, RT.y + RT.h - 54, 16, 34);
    ctx.globalAlpha = 1;
  }

  drawSceneLabel(ctx, '重建画面', 44, 46, INK);
  drawSceneLabel(ctx, '回报预测', 572, 46, INK);
}

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ target: 0, view: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(STEPS[0].fb);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const st = stateRef.current;
      st.view = lerp(st.view, st.target, 0.16);
      if (Math.abs(st.view - st.target) < 0.01) st.view = st.target;
      render(ctx, clamp(st.view, 0, 2));
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
    const v = Number(e.target.value);
    stateRef.current.target = v;
    setStep(v);
    setFeedback(STEPS[v].fb);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          推演步数 <span className="val">{STEPS[step].label}</span>
        </label>
        <input type="range" min={0} max={2} step={1} value={step} onChange={onChange} />
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M21;
