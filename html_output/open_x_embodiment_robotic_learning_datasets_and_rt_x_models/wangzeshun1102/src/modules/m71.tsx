import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  BAD,
  OK,
  EMPH,
  MUTED,
  LINE,
} from './drivingKit';
import type { WidgetProps } from './registry';

// 7.1 容量 vs 数据量：拖动模型容量，看“吸收数据”的曲线在何处翻转。
// Table I（IRIS / WidowX）：RT-1 本体数据 40%，RT-1-X 混合数据 27%，RT-2-X (55B) 50%。

const W = 1080;
const H = 280;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const L = 120;
const R = 1010;
const T = 58;
const B = 224;

const xOf = (c: number) => L + (c / 100) * (R - L);
const yOf = (v: number) => B - (v / 100) * (B - T);

const FEEDBACK = (cap: number) => {
  if (cap < 45) {
    return {
      text:
        '容量不足：RT-1-X 在 IRIS(WidowX) 上只有 27%，低于只用本体数据训练的 RT-1（40%）。同样的架构吃不下大规模混合数据，反而欠拟合。',
      cls: 'bad',
    };
  }
  if (cap < 70) {
    return {
      text: '容量继续增加：模型开始能吸收更多跨本体数据，但还没到 Table I 里 55B 的 RT-2-X 水平。',
      cls: '',
    };
  }
  return {
    text: '容量足够大：55B 的 RT-2-X 在同一任务上达到 50%。跨本体数据这时才真正变成正迁移。',
    cls: 'good',
  };
};

export const M71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ cap: 24 });
  const [cap, setCap] = useState(24);
  const [feedback, setFeedback] = useState(FEEDBACK(24));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      clearScene(ctx, W, H);
      const current = stateRef.current.cap;

      // 网格与纵轴刻度
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.fillStyle = MUTED;
      ctx.font = '14px ' + FONT;
      ctx.textAlign = 'right';
      for (const v of [0, 25, 50, 75, 100]) {
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(R, y);
        ctx.stroke();
        ctx.fillText(v + '%', L - 12, y + 5);
      }

      // 坐标轴
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(L, T - 4);
      ctx.lineTo(L, B);
      ctx.lineTo(R, B);
      ctx.stroke();

      drawSceneLabel(ctx, '成功率', 24, 110, MUTED);
      drawSceneLabel(ctx, '模型容量', 890, 252, MUTED);

      // RT-1 的 40% 参考线
      const baseY = yOf(40);
      ctx.save();
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(L, baseY);
      ctx.lineTo(R, baseY);
      ctx.stroke();
      ctx.restore();

      // 当前容量带
      const cx = xOf(current);
      ctx.fillStyle = 'rgba(39, 68, 110, 0.07)';
      ctx.fillRect(cx - 32, T, 64, B - T);
      ctx.save();
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, T);
      ctx.lineTo(cx, B);
      ctx.stroke();
      ctx.restore();

      // Table I 的三根柱子（真实数值）
      const barW = 46;
      const bars = [
        { center: xOf(24) - 27, value: 40, color: GUIDE },
        { center: xOf(24) + 27, value: 27, color: BAD },
        { center: xOf(86), value: 50, color: OK },
      ];
      for (const bar of bars) {
        const y = yOf(bar.value);
        ctx.fillStyle = bar.color;
        ctx.fillRect(bar.center - barW / 2, y, barW, B - y);
        ctx.fillStyle = bar.color;
        ctx.font = 'bold 19px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(bar.value + '%', bar.center, y - 10);
      }

      // 高亮当前容量能用的“驾照档位”
      const pulse = 0.55 + 0.45 * Math.sin(now / 320);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 6]);
      if (current < 70) {
        ctx.strokeRect(xOf(24) - 70, yOf(40) - 38, 140, B - yOf(40) + 44);
      } else {
        ctx.strokeRect(xOf(86) - 50, yOf(50) - 38, 100, B - yOf(50) + 44);
      }
      ctx.restore();

      drawLegend(
        ctx,
        [
          { color: GUIDE, text: 'RT-1 本体 40%' },
          { color: BAD, text: 'RT-1-X 27%' },
          { color: OK, text: 'RT-2-X 55B 50%' },
        ],
        120,
        32
      );
    };

    const tick = (now: number) => {
      render(now);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 0, 100);
    stateRef.current.cap = v;
    setCap(v);
    setFeedback(FEEDBACK(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          模型容量 <span className="val">{cap}</span>
        </label>
        <input type="range" min={0} max={100} value={cap} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M71;
