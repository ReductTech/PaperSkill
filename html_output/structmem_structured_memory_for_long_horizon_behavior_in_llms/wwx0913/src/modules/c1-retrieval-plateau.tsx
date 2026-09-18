import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { COL, clearScene, drawAxisBox, drawCurve, legend, label, fillRound } from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 1.1：扁平检索的取用上限。单一滑块驱动曲线游标、条目卡片堆、数值与反馈。

const W = 1080;
const H = 280;
const PLATEAU = 60;

const X0 = 40;
const X1 = 640;
const BASE = 240;
const TOP = 55;

function relative(k: number): number {
  if (k <= PLATEAU) {
    const r = k / PLATEAU;
    return 0.14 + 0.66 * Math.pow(r, 0.62);
  }
  return 0.8;
}

const yOf = (v: number): number => BASE - v * (BASE - TOP);

export const C1RetrievalPlateau: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ k: 10 });
  const [k, setK] = useState(10);
  const [feedback, setFeedback] = useState({
    text: '还在上升：取回更多条目确实补充了覆盖度。',
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
    let raf: number | null = null;

    const render = () => {
      const cur = stateRef.current.k;
      clearScene(ctx, W, H, true);

      // 左区：曲线面板
      drawAxisBox(ctx, X0, 40, X1 - X0, 200);

      // 曲线：0 → 100
      const pts: { x: number; y: number }[] = [];
      for (let v = 0; v <= 100; v += 5) {
        const x = X0 + ((X1 - X0) * v) / 100;
        pts.push({ x, y: yOf(relative(v)) });
      }
      const xPlateau = X0 + ((X1 - X0) * PLATEAU) / 100;
      drawCurve(ctx, pts.filter((p) => p.x <= xPlateau), COL.blue, 3);
      drawCurve(ctx, pts.filter((p) => p.x >= xPlateau), COL.muted, 3);

      // 平台虚线
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0, yOf(0.8));
      ctx.lineTo(X1, yOf(0.8));
      ctx.stroke();
      ctx.restore();

      // 阈值竖线（橙，学习者关注点）
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xPlateau, 40);
      ctx.lineTo(xPlateau, BASE);
      ctx.stroke();

      // 游标
      const cx = X0 + ((X1 - X0) * cur) / 100;
      const cy = yOf(relative(cur));
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = cur < PLATEAU ? COL.blue : COL.green;
      ctx.fill();
      ctx.strokeStyle = COL.white;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 右区：条目卡片堆
      const cards = Math.min(5, Math.ceil(cur / 20));
      for (let i = 0; i < 5; i += 1) {
        const cx2 = 700 + i * 70;
        const active = i < cards;
        const color = !active ? COL.axis : cur < PLATEAU ? COL.blue : COL.muted;
        fillRound(ctx, cx2, 120, 58, 74, 6, active ? COL.white : 'rgba(215,222,234,0.25)');
        ctx.strokeStyle = color;
        ctx.lineWidth = active ? 3 : 1;
        ctx.beginPath();
        ctx.rect(cx2, 120, 58, 74);
        ctx.stroke();
        ctx.fillStyle = active ? color : COL.axis;
        ctx.fillRect(cx2 + 8, 132, 42, 4);
        ctx.fillRect(cx2 + 8, 144, 30, 4);
      }

      label(ctx, '60 条', xPlateau + 8, 34, COL.orange, 'left', 20);
      legend(
        ctx,
        [
          { c: COL.blue, t: '上升段' },
          { c: COL.green, t: '峰值区间' },
          { c: COL.muted, t: '平台段' },
        ],
        X0 + 4,
        268
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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
    const v = clamp(Number(e.target.value), 0, 100);
    stateRef.current.k = v;
    setK(v);
    if (v < PLATEAU) {
      setFeedback({ text: '还在上升：取回更多条目确实补充了覆盖度。', cls: '' });
    } else if (v <= 75) {
      setFeedback({
        text: '已到平台：论文报告扁平检索在 60 条附近达到峰值，此后不再提升。',
        cls: 'good',
      });
    } else {
      setFeedback({ text: '继续加条目不再有效：瓶颈是知识推理，不是覆盖度。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label htmlFor="c1-k">
          取回条目数 <span className="val">{k}</span>
        </label>
        <input
          id="c1-k"
          type="range"
          min={0}
          max={100}
          step={5}
          value={k}
          onChange={onChange}
          aria-label="取回条目数"
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">取回条目数</div>
          <div className="v">{k}</div>
        </div>
        <div className="metric">
          <div className="l">进入平台的阈值</div>
          <div className="v">60</div>
        </div>
        <div className="metric">
          <div className="l">当前阶段</div>
          <div className="v">{k < PLATEAU ? '上升' : k <= 75 ? '峰值' : '平台'}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C1RetrievalPlateau;
