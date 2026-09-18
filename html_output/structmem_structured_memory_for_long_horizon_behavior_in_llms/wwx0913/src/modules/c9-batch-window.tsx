import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { COL, clearScene, drawAxisBox, drawBars, drawStamp, drawTag, roundRect, label, legend } from './sceneKit';
import type { WidgetProps } from './registry';

// §9.1 拖动批量窗口，观察开销（P6）：指针拖动 + setPointerCapture，
// 12 个吸附位、窗口宽度恒定 220（只移动位置）；成本数值全部来自 Table 1（↓ 越低越好），
// 中间位是两端实测值之间的线性插值，必须在界面上标为“示意插值”。

const W = 1080;
const H = 280;

const SNAP = 12;
const WIN_W = 220;
const WIN_X0 = 48;
const WIN_X1 = 1032;
const STEP = (WIN_X1 - WIN_X0 - WIN_W) / (SNAP - 1);
const BEST_INDEX = 7;

const EVENT_X: number[] = [
  58, 106, 156, 208, 262, 318,
  556, 572, 588, 604,
  646, 700, 754, 808, 862,
  906, 922, 938, 954,
  976, 992, 1008, 1024, 1036,
];

// 由 EVENT_X 的局部密度预先算好的聚集度：默认位最散乱，吸附位 7 罩住最紧的事件簇。
const LOCALITY: number[] = [0.15, 0.24, 0.34, 0.46, 0.58, 0.72, 0.88, 1, 0.86, 0.68, 0.52, 0.38];

interface CostRow {
  tokenM: number;
  calls: number;
  sec: number;
}

// Table 1 构建开销（↓ 越低越好），全部为论文实测读数。
const COST: Record<string, CostRow> = {
  struct: { tokenM: 1.937, calls: 1056, sec: 22854 },
  mem0g: { tokenM: 35.825, calls: 53514, sec: 115670 },
  lightrag: { tokenM: 11.931, calls: 13576, sec: 60469 },
  mem0: { tokenM: 12.196, calls: 9181, sec: 30057 },
  minirag: { tokenM: 10.103, calls: 2508, sec: 2566 },
};

const MAX_TOKEN = 35.825;
const MAX_SEC = 115670;
const PANEL_Y = 146;
const PANEL_H = 80;
const BASE_Y = 218;
const BAR_W = 60;
const BAR_H = 72;

interface Feedback {
  text: string;
  cls: string;
}

const FEEDBACK_SUCCESS: Feedback = {
  text: '窗口罩住时间局部的事件簇：构建 1.937M 词元、1056 次调用、22854 秒，就是 Table 1 里 StructMem 的实测开销。但运行时间不是全表最低——MiniRAG 只用了 2566 秒，比 22854 秒少。',
  cls: 'good',
};

function feedbackFor(idx: number): Feedback {
  const locality = LOCALITY[idx];
  if (idx === BEST_INDEX || locality >= 0.9) return FEEDBACK_SUCCESS;
  if (locality >= 0.5) {
    return {
      text: '窗口开始罩住一段时间相近的事件：一次合成覆盖更多条目，开销随之下降。',
      cls: '',
    };
  }
  return {
    text: '窗口落在散乱区：事件之间时间跨度大，批量合并退化成接近逐事件维护的开销。',
    cls: 'bad',
  };
}

function barTop(v: number, max: number): number {
  const ratio = clamp(v / max, 0, 1);
  return BASE_Y - Math.max(2, ratio * BAR_H);
}

export const C9BatchWindow: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ dragging: boolean }>({ dragging: false });
  const stateRef = useRef<{ winIndex: number }>({ winIndex: 0 });
  const [winIndex, setWinIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor(0));

  const locality = LOCALITY[winIndex];
  const t = 1 - locality;
  const liveToken = lerp(COST.struct.tokenM, COST.mem0g.tokenM, t);
  const liveCalls = Math.round(lerp(COST.struct.calls, COST.mem0g.calls, t));
  const liveSec = Math.round(lerp(COST.struct.sec, COST.mem0g.sec, t));

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
      const idx = stateRef.current.winIndex;
      const loc = LOCALITY[idx];
      const mix = 1 - loc;
      const token = lerp(COST.struct.tokenM, COST.mem0g.tokenM, mix);
      const sec = lerp(COST.struct.sec, COST.mem0g.sec, mix);
      const wx = WIN_X0 + idx * STEP;

      clearScene(ctx, W, H, true);

      // 下区：两个成本面板（token / 运行时间）
      drawAxisBox(ctx, 40, PANEL_Y, 430, PANEL_H);
      drawAxisBox(ctx, 540, PANEL_Y, 430, PANEL_H);

      const tokenBars: number[] = [125, 225, 325];
      const timeBars: number[] = [625, 725, 825];
      const tokenValues: number[] = [token, COST.mem0g.tokenM, COST.minirag.tokenM];
      const tokenColors: string[] = [COL.blue, COL.red, COL.axis];
      const timeValues: number[] = [sec, COST.mem0g.sec, COST.minirag.sec];

      tokenBars.forEach((bx: number, i: number) => {
        drawBars(ctx, [{ v: tokenValues[i], c: tokenColors[i] }], bx, PANEL_Y, BAR_W, BAR_H, MAX_TOKEN);
      });
      timeBars.forEach((bx: number, i: number) => {
        drawBars(ctx, [{ v: timeValues[i], c: tokenColors[i] }], bx, PANEL_Y, BAR_W, BAR_H, MAX_SEC);
      });

      // MiniRAG 柱的灰色描边
      ctx.strokeStyle = COL.muted;
      ctx.lineWidth = 1;
      ctx.strokeRect(325, barTop(COST.minirag.tokenM, MAX_TOKEN), BAR_W, BASE_Y - barTop(COST.minirag.tokenM, MAX_TOKEN));
      ctx.strokeRect(825, barTop(COST.minirag.sec, MAX_SEC), BAR_W, BASE_Y - barTop(COST.minirag.sec, MAX_SEC));

      // 6 个柱顶裸数字
      tokenBars.forEach((bx: number, i: number) => {
        label(ctx, tokenValues[i].toFixed(2), bx + BAR_W / 2, barTop(tokenValues[i], MAX_TOKEN) - 6, COL.ink, 'center', 16);
      });
      timeBars.forEach((bx: number, i: number) => {
        label(
          ctx,
          String(Math.round(timeValues[i])),
          bx + BAR_W / 2,
          barTop(timeValues[i], MAX_SEC) - 6,
          COL.ink,
          'center',
          16
        );
      });

      // 2 个短标签
      label(ctx, '构建词元', 48, 170, COL.ink, 'left', 20);
      label(ctx, '运行时间', 548, 170, COL.ink, 'left', 20);

      // 上区：时间轴与 24 个事件刻度
      drawAxisBox(ctx, 40, 30, 1000, 96);
      EVENT_X.forEach((ex: number) => {
        drawStamp(ctx, ex, 78, 4, COL.muted, false);
      });

      // 两处时间聚集的紫色洗色带
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = COL.purple;
      ctx.fillRect(536, 34, 96, 88);
      ctx.fillRect(890, 34, 96, 88);
      ctx.restore();

      // 窗口罩色、描边与把手
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = COL.orange;
      ctx.fillRect(wx, 36, WIN_W, 84);
      ctx.restore();
      if (loc >= 0.9) {
        ctx.save();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = COL.green;
        ctx.fillRect(wx, 36, WIN_W, 84);
        ctx.restore();
      }
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      roundRect(ctx, wx, 36, WIN_W, 84, 10);
      ctx.stroke();
      drawTag(ctx, wx + 4, 26, 18, 26, COL.orange, true);

      // 窗口内的事件刻度变蓝（聚集时变绿）
      EVENT_X.forEach((ex: number) => {
        if (ex >= wx && ex <= wx + WIN_W) {
          drawStamp(ctx, ex, 78, 5, loc >= 0.9 ? COL.green : COL.blue, true);
        }
      });

      // 1 个图例（3 项）
      legend(
        ctx,
        [
          { c: COL.blue, t: '当前窗口' },
          { c: COL.red, t: 'Mem0g' },
          { c: COL.axis, t: 'MiniRAG' },
        ],
        984,
        158
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

  const applyIndex = (idx: number): void => {
    const next = clamp(idx, 0, SNAP - 1);
    if (next === stateRef.current.winIndex) return;
    stateRef.current.winIndex = next;
    setWinIndex(next);
    setFeedback(feedbackFor(next));
  };

  const indexFromClientX = (clientX: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.winIndex;
    const r = canvas.getBoundingClientRect();
    const x = ((clientX - r.left) * W) / r.width;
    return clamp(Math.round((x - WIN_X0 - WIN_W / 2) / STEP), 0, SNAP - 1);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    dragRef.current.dragging = true;
    applyIndex(indexFromClientX(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!dragRef.current.dragging) return;
    applyIndex(indexFromClientX(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    dragRef.current.dragging = false;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };

  const onHandleKey = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const unit = e.shiftKey ? 3 : 1;
    const delta = e.key === 'ArrowLeft' ? -unit : unit;
    applyIndex(stateRef.current.winIndex + delta);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          批量窗口 <span className="val">{winIndex + 1} / {SNAP}</span>
        </label>
        <button
          type="button"
          className="tiny"
          aria-label="批量窗口位置"
          aria-valuemin={1}
          aria-valuemax={SNAP}
          aria-valuenow={winIndex + 1}
          onKeyDown={onHandleKey}
          onClick={() => applyIndex((winIndex + 1) % SNAP)}
        >
          批量窗口
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前窗口开销（示意插值）</div>
          <div className="v">{liveToken.toFixed(2)}M</div>
          <div className="l">{liveCalls} 次 · {liveSec} s</div>
        </div>
        <div className="metric">
          <div className="l">StructMem（Table 1 实测）</div>
          <div className="v">1.937M</div>
          <div className="l">1056 次 · 22854 s</div>
        </div>
        <div className="metric">
          <div className="l">Mem0g（Table 1 实测）</div>
          <div className="v">35.825M</div>
          <div className="l">53514 次 · 115670 s</div>
        </div>
        <div className="metric">
          <div className="l">LightRAG（Table 1 实测）</div>
          <div className="v">11.931M</div>
          <div className="l">13576 次 · 60469 s</div>
        </div>
        <div className="metric">
          <div className="l">Mem0（Table 1 实测）</div>
          <div className="v">12.196M</div>
          <div className="l">9181 次 · 30057 s</div>
        </div>
        <div className="metric">
          <div className="l">MiniRAG（Table 1 实测）</div>
          <div className="v">10.103M</div>
          <div className="l">2508 次 · 2566 s</div>
        </div>
        <div className="metric">
          <div className="l">注：示意插值</div>
          <div className="v">非论文测量</div>
          <div className="l">
            当前窗口开销只在最优吸附位等于 StructMem 的实测值 1.937M / 1056 / 22854，在散乱端等于 Mem0g 的实测值
            35.825M / 53514 / 115670；中间位是这两个实测端点之间的线性插值，不是论文数据。窗口宽度恒定
            220，本模块只拖动窗口位置。构建开销方向为 ↓ 越低越好，且运行时间并非全表最低：MiniRAG 只用 2566 s，低于
            StructMem 的 22854 s。
          </div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C9BatchWindow;
