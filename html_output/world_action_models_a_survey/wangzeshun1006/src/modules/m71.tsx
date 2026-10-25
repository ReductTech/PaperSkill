import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawSurveyor,
  drawSheetLabel,
  drawLegend,
  ROUTE,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
  CONTOUR,
} from './chartkit';
import type { WidgetProps } from './registry';

// m71 — 绑定时机刻度。拖动滑块（5 个停点）或点刻度按钮：动作绑得越早，未来越被行动塑造，
// 控制权（蓝）与成本（橙）同时增加；紫色标记瓶颈化通道。示意刻度，不代表论文数值。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const STOPS = ['预测后解码', '生成中控制', '动作分支', '共享骨干', '每步注入'];
const BOTTLENECK = 2; // 两端之间的瓶颈标记

const FEEDBACK: string[] = [
  '预测后解码：只在整个未来画完之后才允许动手——最便宜、最模块化，可控性最晚到达。',
  '生成中控制：控制信号进入生成过程（如 This&That 的手势通道、ARDuP 的活跃区域）。',
  '动作分支：动作与视频各走一条支路，用桥接注意力或同步去噪相连（CoVAR、VAG）。',
  '共享骨干：基座预测与动作头共用同一骨干（UWM、F1、Motus）。',
  '每步注入：动作在每个去噪步都被写进潜在状态（AdaWorld 一线）。',
];

const TICK_X = [80, 300, 520, 740, 960];
const BAR_W = 880;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  color: string
): void {
  ctx.fillStyle = LINE;
  roundRect(ctx, x, y, BAR_W, 14, 7);
  ctx.fill();
  const w = clamp(value, 0, 1) * BAR_W;
  if (w > 2) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, 14, 7);
    ctx.fill();
  }
}

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bindRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const [binding, setBinding] = useState(1);
  const [feedback, setFeedback] = useState(FEEDBACK[1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number): void => {
      const b = bindRef.current;
      const frac = b / 4;
      clearField(ctx, W, H);

      // 上区：旅人能否在绘制过程中伸手改图
      drawSheet(ctx, 40, 26, 230, 84);
      drawContours(ctx, 40, 26, 230, 84, 13, CONTOUR, 3);
      drawSurveyor(ctx, 96, 116, 0.9, INK, 'draw');

      // 纸边
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(278, 38);
      ctx.lineTo(278, 112);
      ctx.stroke();

      // 旅人 + 伸出的手：越靠右伸得越进
      drawSurveyor(ctx, 936, 116, 0.85, INK, 'sight');
      const tip = 900 - b * 170;
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(908, 100);
      ctx.lineTo(tip, 100);
      ctx.stroke();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(tip, 100, 5, 0, Math.PI * 2);
      ctx.fill();
      if (tip < 278) {
        // 手已进入图幅：图上出现一笔现场改动
        ctx.strokeStyle = AUX;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tip, 92);
        ctx.quadraticCurveTo(tip - 20, 60 + 6 * Math.sin(now / 260), tip - 44, 88);
        ctx.stroke();
      }

      // 下区：控制权条（蓝）与成本条（橙）
      bar(ctx, 80, 158, frac, ROUTE);
      bar(ctx, 80, 180, frac, EMPH);

      // 刻度尺
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 210);
      ctx.lineTo(960, 210);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (let i = 0; i < 5; i++) {
        const tx = TICK_X[i];
        ctx.strokeStyle = i === b ? EMPH : LINE;
        ctx.lineWidth = i === b ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, 202);
        ctx.lineTo(tx, 218);
        ctx.stroke();
        ctx.fillStyle = i === b ? EMPH : MUTED;
        ctx.font = `14px ${FONT}`;
        ctx.fillText(STOPS[i], tx, 236);
      }

      // 瓶颈标记：两端之间的某格
      const bx = TICK_X[BOTTLENECK];
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = AUX;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, 150);
      ctx.lineTo(bx, 242);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = AUX;
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('瓶颈', bx + 7, 152);

      drawSheetLabel(ctx, '旅人', 936, 20, MUTED);
      drawLegend(
        ctx,
        [
          { color: ROUTE, text: '控制权' },
          { color: EMPH, text: '成本' },
          { color: AUX, text: '瓶颈' },
        ],
        80,
        262
      );
    };

    const tick = (): void => {
      render(performance.now());
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

  const set = (n: number): void => {
    const v = Math.round(clamp(n, 0, 4));
    bindRef.current = v;
    setBinding(v);
    setFeedback(FEEDBACK[v]);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    set(Number(e.target.value));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          绑定时机 <span className="val">{STOPS[binding]}</span>
        </label>
        <input type="range" min={0} max={4} step={1} value={binding} onChange={onChange} />
      </div>
      <div className="chip-row">
        {STOPS.map((label, i) => (
          <button
            key={label}
            className={'chip' + (binding === i ? ' selected on' : '')}
            onClick={() => set(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default M71;
