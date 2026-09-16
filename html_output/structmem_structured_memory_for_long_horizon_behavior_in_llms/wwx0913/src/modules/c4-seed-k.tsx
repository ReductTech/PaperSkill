import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawAxisBox,
  drawArrow,
  drawCurve,
  drawPhoto,
  drawStamp,
  label,
  legend,
} from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 4.1：语义种子数量 K。唯一滑块（0 / 5 / 10 / 15 / 20）驱动曲线游标、
// 种子卡堆、重建事件、DOM 读数与反馈条。

const W = 1080;
const H = 280;

type KValue = 0 | 5 | 10 | 15 | 20;
type FeedbackCls = '' | 'good' | 'bad';
interface Feedback {
  text: string;
  cls: FeedbackCls;
}

const K_STEPS: KValue[] = [0, 5, 10, 15, 20];
const DEFAULT_K: KValue = 15;
const PLATEAU_VALUE = 75.71; // C18 读图平台值（K = 0）
const PEAK_VALUE = 76.82; // C18 读图峰值，与 C14 综合分一致

// 归一化相对有效性：只用于画布纵坐标，论文没有报告 K = 5 / 10 / 20 的数值。
const REL: Record<KValue, number> = { 0: 0, 5: 0.42, 10: 0.68, 15: 1, 20: 1 };

const PLOT_X0 = 70;
const PLOT_X1 = 610;
const PLOT_TOP = 70;
const PLOT_BASE = 215;

const SEED_X = 680;
const SEED_W = 360;

const SEED_SLOTS: { x: number; y: number; tilt: number }[] = [
  { x: 700, y: 70, tilt: -0.03 },
  { x: 790, y: 86, tilt: 0.02 },
  { x: 880, y: 70, tilt: -0.02 },
];

const REBUILD_SLOTS: { x: number; y: number }[] = [
  { x: 712, y: 130 },
  { x: 802, y: 136 },
];

function toK(v: number): KValue {
  const r = Math.round(v / 5) * 5;
  if (r <= 0) return 0;
  if (r <= 5) return 5;
  if (r <= 10) return 10;
  if (r <= 15) return 15;
  return 20;
}

function kx(k: number): number {
  return PLOT_X0 + ((PLOT_X1 - PLOT_X0) * k) / 20;
}

function vy(rel: number): number {
  return PLOT_BASE - rel * (PLOT_BASE - PLOT_TOP);
}

function feedbackFor(k: KValue): Feedback {
  if (k === 0) {
    return {
      text: 'K = 0：没有语义种子，也就没有事件重建，合并退化为扁平记忆，有效性回到约 75.7 的平台（C18）。',
      cls: 'bad',
    };
  }
  if (k === 5 || k === 10) {
    return {
      text: 'K > 0：跨事件合成开始起作用，曲线随 K 上升，收益来自事件之间的关系（C18）。',
      cls: 'good',
    };
  }
  if (k === 15) {
    return {
      text: 'K = 15 是论文的默认设置，曲线在此附近达到读图峰值约 76.8（C11、C18）。',
      cls: 'good',
    };
  }
  return {
    text: 'K = 20：论文默认取 15，这里只用于观察曲线的读图趋势，默认配置仍是 K = 15（C11）。',
    cls: '',
  };
}

function phaseOf(k: KValue): string {
  if (k === 0) return '平台';
  if (k < DEFAULT_K) return '上升';
  if (k === DEFAULT_K) return '默认';
  return '超出默认';
}

export const C4SeedK: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ k: KValue }>({ k: DEFAULT_K });
  const [k, setK] = useState<KValue>(DEFAULT_K);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor(DEFAULT_K));

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

    const render = (t: number) => {
      const cur = stateRef.current.k;
      const rel = REL[cur];
      clearScene(ctx, W, H, true);

      // 左区：曲线面板
      drawAxisBox(ctx, 40, 40, 600, 200);

      // K = 0 处的扁平平台虚线
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PLOT_X0, vy(0));
      ctx.lineTo(PLOT_X1, vy(0));
      ctx.stroke();
      ctx.restore();

      // 五个采样点折线（K = 0 / 5 / 10 / 15 / 20）
      const pts = K_STEPS.map((s) => ({ x: kx(s), y: vy(REL[s]) }));
      drawCurve(ctx, pts, COL.blue, 2);

      // K = 0 采样点：红色空心日期章（回到扁平平台）
      drawStamp(ctx, kx(0), vy(0), 12, COL.red, false);

      // 默认值竖线 K = 15（橙色）+ 轴到曲线的短引线
      const xd = kx(DEFAULT_K);
      ctx.save();
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xd, PLOT_BASE);
      ctx.lineTo(xd, vy(REL[DEFAULT_K]));
      ctx.stroke();
      ctx.restore();
      drawArrow(ctx, xd, PLOT_BASE + 10, xd, vy(REL[DEFAULT_K]), COL.orange, 7);

      // 游标圆点（当前 K）
      const pulse = 1 + 0.12 * Math.sin(t / 380);
      ctx.beginPath();
      ctx.arc(kx(cur), vy(rel), 7 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = COL.blue;
      ctx.fill();
      ctx.strokeStyle = COL.white;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 右区：语义种子卡堆与同时间戳的重建事件
      drawAxisBox(ctx, SEED_X, 40, SEED_W, 200);
      const seedCount = cur === 0 ? 0 : Math.min(3, Math.ceil(cur / 5));
      const showRebuild = cur !== 0;
      if (showRebuild) {
        REBUILD_SLOTS.forEach((s) => {
          drawPhoto(ctx, s.x, s.y, 88, 52, 0.03, COL.purple, COL.white);
        });
      }
      SEED_SLOTS.slice(0, seedCount).forEach((s) => {
        drawPhoto(ctx, s.x, s.y, 88, 60, s.tilt, COL.axis, COL.white);
        drawStamp(ctx, s.x + 70, s.y + 46, 9, COL.orange, true);
      });

      // 两个短标签：裸数字
      label(ctx, String(PLATEAU_VALUE), PLOT_X0 + 4, vy(0) - 8, COL.ink);
      label(ctx, String(PEAK_VALUE), kx(DEFAULT_K) + 12, vy(1) - 12, COL.ink);

      // 一个图例
      legend(
        ctx,
        [
          { c: COL.axis, t: '扁平平台' },
          { c: COL.blue, t: '随 K 上升' },
          { c: COL.orange, t: '默认 K=15' },
        ],
        56,
        66
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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
    const next = toK(Number(e.target.value));
    stateRef.current.k = next;
    setK(next);
    setFeedback(feedbackFor(next));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label htmlFor="c4-k">
          语义种子数 K <span className="val" aria-live="polite">{k}</span>
        </label>
        <input
          id="c4-k"
          type="range"
          min={0}
          max={20}
          step={5}
          value={k}
          onChange={onChange}
          aria-label="语义种子数 K"
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">语义种子数 K</div>
          <div className="v">{k}</div>
        </div>
        <div className="metric">
          <div className="l">取回的语义种子 S_k</div>
          <div className="v">{k}</div>
        </div>
        <div className="metric">
          <div className="l">重建事件数</div>
          <div className="v">{k === 0 ? 0 : k}</div>
        </div>
        <div className="metric">
          <div className="l">当前区间</div>
          <div className="v">{phaseOf(k)}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default C4SeedK;
