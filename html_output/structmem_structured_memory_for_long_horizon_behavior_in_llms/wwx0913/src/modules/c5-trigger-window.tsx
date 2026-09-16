import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawAxisBox,
  drawArrow,
  drawPhoto,
  drawStamp,
  drawTag,
  fillRound,
  label,
  legend,
} from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 5.1：触发策略对比。三个 chip 切换时间轴上的合并标记与跨事件连接状态；
// 「从不合并」被显式画成红色散点的退化态，绝不静默处理。

const W = 1080;
const H = 280;

const WINDOW_HOURS = 1; // C11：论文的实现设置（默认时间窗 1 小时）
const COUNT_N = 5; // 仅用于画布节奏的示意档位，不是论文配置
const DEFAULT_K = 15;
const EVENT_COUNT = 12;

type Mode = 'window' | 'count' | 'never';
type FeedbackCls = '' | 'good' | 'bad';
interface Feedback {
  text: string;
  cls: FeedbackCls;
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'window', label: '按时间窗（默认 1 小时）' },
  { id: 'count', label: '每 N 条条目' },
  { id: 'never', label: '从不合并' },
];

const HOUR_X0 = 100;
const HOUR_STEP = 130;
const hourX = (h: number): number => HOUR_X0 + h * HOUR_STEP;

function eventXs(mode: Mode): number[] {
  const xs: number[] = [];
  if (mode === 'never') {
    // 退化态：事件点扁平散开，铺满整条时间轴
    for (let i = 0; i < EVENT_COUNT; i += 1) {
      xs.push(90 + (i * 540) / (EVENT_COUNT - 1));
    }
    return xs;
  }
  // 正常态：事件在每小时窗口内成批累积
  for (let h = 0; h < 4; h += 1) {
    for (let j = 0; j < 3; j += 1) {
      xs.push(hourX(h) + j * 16);
    }
  }
  return xs;
}

function mergeXs(mode: Mode): number[] {
  if (mode === 'window') return [hourX(1), hourX(2), hourX(3)];
  if (mode === 'count') {
    const xs = eventXs('count');
    return [xs[COUNT_N - 1], xs[2 * COUNT_N - 1]];
  }
  return [];
}

function feedbackFor(mode: Mode): Feedback {
  if (mode === 'window') {
    return {
      text: '按时间窗（默认 1 小时）：累计事件超过时间窗阈值后触发一次合成，合并在批次上进行（C11）。',
      cls: 'good',
    };
  }
  if (mode === 'count') {
    return {
      text: '每 N 条条目：触发只看条目数量、不看时间，节奏由发言密度决定。',
      cls: '',
    };
  }
  return {
    text: '从不合并：等价于 K = 0，退化为扁平记忆，没有任何跨事件连接（C18）。',
    cls: 'bad',
  };
}

export const C5TriggerWindow: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'window' });
  const [mode, setMode] = useState<Mode>('window');
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor('window'));

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
      const m = stateRef.current.mode;
      const degenerate = m === 'never';
      const hasCrossEvent = m !== 'never' && DEFAULT_K > 0;
      clearScene(ctx, W, H, true);

      // 左区：时间轴面板
      drawAxisBox(ctx, 40, 40, 660, 200);
      drawArrow(ctx, 90, 170, 650, 170, COL.route, 8);

      // 1 小时刻度竖线：仅时间窗模式高亮
      for (let h = 1; h <= 3; h += 1) {
        ctx.save();
        ctx.strokeStyle = m === 'window' ? COL.orange : COL.axis;
        ctx.lineWidth = m === 'window' ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(hourX(h), 118);
        ctx.lineTo(hourX(h), 176);
        ctx.stroke();
        ctx.restore();
      }

      // 事件点：正常 = 蓝色成批，退化 = 红色散开
      eventXs(m).forEach((x) => {
        drawTag(ctx, x - 7, 163, 14, 14, degenerate ? COL.red : COL.blue, true);
      });

      // 合并标记：绿色圆章，位置随模式变化
      const pulse = 1 + 0.06 * Math.sin(t / 420);
      mergeXs(m).forEach((x) => {
        drawStamp(ctx, x, 118, 11 * pulse, COL.green, true);
      });

      // 右区：跨事件连接状态
      drawAxisBox(ctx, 740, 40, 300, 200);
      fillRound(ctx, 780, 80, 220, 110, 12, hasCrossEvent ? COL.green : COL.red);
      drawAxisBox(ctx, 800, 100, 180, 70);
      drawPhoto(ctx, 815, 115, 44, 40, 0, COL.axis, COL.white);
      drawPhoto(ctx, 880, 115, 44, 40, 0, COL.axis, COL.white);
      if (hasCrossEvent) {
        drawArrow(ctx, 863, 135, 877, 135, COL.blue, 6);
      } else {
        ctx.save();
        ctx.strokeStyle = COL.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(866, 125);
        ctx.lineTo(878, 145);
        ctx.moveTo(878, 125);
        ctx.lineTo(866, 145);
        ctx.stroke();
        ctx.restore();
      }
      // “小结条”：叠在连接格上方
      drawStamp(ctx, 996, 66, 15, COL.orange, true);

      // 两个短标签
      label(ctx, `${WINDOW_HOURS} 小时`, hourX(1) + 8, 140, COL.ink);
      label(ctx, '跨事件', 752, 62, COL.ink);

      // 一个图例
      legend(
        ctx,
        [
          { c: COL.blue, t: '事件' },
          { c: COL.green, t: '触发' },
          { c: COL.red, t: '退化' },
        ],
        56,
        190
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

  const select = (next: Mode) => {
    stateRef.current.mode = next;
    setMode(next);
    setFeedback(feedbackFor(next));
  };

  const hasCrossEvent = mode !== 'never';
  const merges = mergeXs(mode).length;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip ${mode === m.id ? 'selected' : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => select(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">触发策略</div>
          <div className="v">{mode === 'window' ? '时间窗' : mode === 'count' ? '条目数' : '从不合并'}</div>
        </div>
        <div className="metric">
          <div className="l">触发次数</div>
          <div className="v">{merges}</div>
        </div>
        <div className="metric">
          <div className="l">跨事件连接</div>
          <div className="v">{hasCrossEvent ? '有' : '无'}</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default C5TriggerWindow;
