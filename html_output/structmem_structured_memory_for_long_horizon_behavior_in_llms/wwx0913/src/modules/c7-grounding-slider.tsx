import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { COL, clearScene, drawAxisBox, fillRound, label, legend } from './sceneKit';
import type { WidgetProps } from './registry';

// §7 模块 7.1（P1 滑块 + 双端数值，1080×280）：约束强度与臆造链接。
// 滑块 0 → 1 只在 GPT 裁判（p.10 Table 7 Overall）的 0.61% / 7.45% 之间做连续插值；
// Qwen 与 DS 的两组数字只出现在 Canvas 下方 .metrics 的独立裁判区块里。

const W = 1080;
const H = 280;

const ERR_CONS = 0.61; // GPT 裁判，Constrained
const ERR_UNCONS = 7.45; // GPT 裁判，Unconstrained

interface JudgeRow {
  name: string;
  cons: string;
  uncons: string;
}

const JUDGES: JudgeRow[] = [
  { name: 'GPT 裁判', cons: '0.61', uncons: '7.45' },
  { name: 'Qwen 裁判', cons: '3.41', uncons: '20.00' },
  { name: 'DS 裁判', cons: '3.63', uncons: '15.14' },
];

function pickFeedback(strength: number): { text: string; cls: string } {
  if (strength > 0.75) {
    return { text: '约束完整：跨事件链接错误率 0.61%（GPT 裁判），这是论文的默认设置。', cls: 'good' };
  }
  if (strength > 0.25) {
    return { text: '约束被削弱，链接开始失去时间戳与具体依赖的支撑，错误率上升。', cls: '' };
  }
  return { text: '去掉时间戳引用与具体依赖后，错误率升到 7.45%（GPT 裁判）。', cls: 'bad' };
}

export const C7GroundingSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ strength: number }>({ strength: 1 });
  const [strength, setStrength] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>(pickFeedback(1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (s: { strength: number }) => {
      clearScene(ctx, W, H, true);

      const baseY = 220;
      const maxH = 150;
      const xCons = 200;
      const xUncons = 400;
      const bw = 90;

      // 左区：两条端点条形（只放 GPT 裁判的 0.61 与 7.45）
      drawAxisBox(ctx, 40, 40, 620, 200);
      const hCons = Math.max(4, (maxH * ERR_CONS) / ERR_UNCONS);
      fillRound(ctx, xCons, baseY - hCons, bw, hCons, 4, COL.green);
      fillRound(ctx, xUncons, baseY - maxH, bw, maxH, 4, COL.red);
      label(ctx, '0.61', xCons + bw / 2, baseY - hCons - 12, COL.ink, 'center', 20);
      label(ctx, '7.45', xUncons + bw / 2, baseY - maxH - 12, COL.ink, 'center', 20);

      // 当前强度对应的趋势参考线（只由 GPT 裁判两端做线性插值）
      const err = ERR_UNCONS + (ERR_CONS - ERR_UNCONS) * clamp(s.strength, 0, 1);
      const yErr = baseY - (maxH * err) / ERR_UNCONS;
      ctx.save();
      ctx.strokeStyle = COL.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, yErr);
      ctx.lineTo(630, yErr);
      ctx.stroke();
      ctx.restore();

      legend(
        ctx,
        [
          { c: COL.green, t: '有约束' },
          { c: COL.red, t: '无约束' },
          { c: COL.blue, t: '当前强度' },
        ],
        64,
        66
      );

      // 右区：0–1 刻度与游标
      drawAxisBox(ctx, 700, 40, 340, 200);
      const sx0 = 730;
      const sx1 = 1010;
      const sy = 140;
      ctx.save();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx0, sy);
      ctx.lineTo(sx1, sy);
      ctx.stroke();
      for (let i = 0; i <= 4; i += 1) {
        const tx = sx0 + ((sx1 - sx0) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(tx, sy - 6);
        ctx.lineTo(tx, sy + 6);
        ctx.stroke();
      }
      ctx.restore();
      label(ctx, '0', sx0, sy + 28, COL.muted, 'center', 16);
      label(ctx, '1', sx1, sy + 28, COL.muted, 'center', 16);
      const cx = sx0 + (sx1 - sx0) * clamp(s.strength, 0, 1);
      const cursorColor = s.strength >= 0.5 ? COL.green : COL.red;
      ctx.save();
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, sy - 52);
      ctx.lineTo(cx, sy + 52);
      ctx.stroke();
      ctx.fillStyle = cursorColor;
      ctx.beginPath();
      ctx.arc(cx, sy - 52, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 0, 1);
    stateRef.current.strength = v;
    setStrength(v);
    setFeedback(pickFeedback(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          约束强度 <span className="val">{strength.toFixed(2)}</span>
        </label>
        <input
          id="c7-strength"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={strength}
          onChange={onChange}
        />
      </div>
      <div className="metrics">
        {JUDGES.map((j) => (
          <div className="metric" key={j.name}>
            <div className="l">{j.name}（有约束 / 无约束）</div>
            <div className="v">
              {j.cons} / {j.uncons}
            </div>
          </div>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C7GroundingSlider;
