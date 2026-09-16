import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  AUX,
  BORDER,
  EMPHASIS,
  GUIDE,
  TEXT_MUTED,
  clearScene,
  drawAimLine,
  drawSceneLabel,
  drawTable,
} from './billiardsKit';

// §5 module 5.1 — 元查询面板 (1080x280).
// Left: four context rows. Middle: the autoregressive backbone with six
// meta-query dots on its lower edge. Right: the two experts (world expert in
// purple, action expert in blue) and the action-chunk output.
// One dominant operation: pick a meta-query (click/drag on the Canvas or use the
// six keyboard-reachable buttons), plus one switch that drops the world expert.

const W = 1080;
const H = 280;

const CONTEXT_NAMES = ['指令', '历史', '子任务', '记忆'];
const BAR_X = 40;
const BAR_W = 166;
const BAR_H = 28;
const barY = (i: number) => 72 + i * 36;
const BAR_CY = [86, 122, 158, 194];

/** which two context bars each meta-query aggregates */
const QUERY_AGG: number[][] = [
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
  [0, 1],
  [2, 3],
];

const DOT_Y = 205;
const DOT_X0 = 300;
const DOT_STEP = 64;
const dotX = (i: number) => DOT_X0 + i * DOT_STEP;

const BACKBONE = { x: 262, y: 50, w: 398, h: 140 };
const WORLD_NODE = { x: 700, y: 46, w: 180, h: 48 };
const ACTION_NODE = { x: 700, y: 158, w: 180, h: 48 };
const OUT_NODE = { x: 900, y: 158, w: 140, h: 48 };
const JUNCTION = { x: 682, y: 120 };
const WORLD_CY = WORLD_NODE.y + WORLD_NODE.h / 2;
const ACTION_CY = ACTION_NODE.y + ACTION_NODE.h / 2;

const DROP_FEEDBACK = '世界专家在推理时可整体丢弃：只剩约 2B 激活参数，动作仍由 h_t 与 q_t 生成。';
const KEEP_FEEDBACK = '世界专家在线：训练时它通过共享参数，把物理动力学的信息压进 h_t。';

const queryFeedback = (i: number) =>
  `这枚元查询把「${CONTEXT_NAMES[QUERY_AGG[i][0]]}」和「${
    CONTEXT_NAMES[QUERY_AGG[i][1]]
  }」的信息汇总进 h_t；64 枚元查询各管一部分上下文。`;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function polyline(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  dashed: boolean,
  width: number,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  points.forEach(([px, py], i) => {
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();
}

/** right-pointing arrow head, used where an edge meets a node */
function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 9, y - 6);
  ctx.lineTo(x - 9, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Wla51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const stateRef = useRef({ query: 0, worldExpertOff: false });
  const [query, setQuery] = useState(0);
  const [worldExpertOff, setWorldExpertOff] = useState(false);
  const [feedback, setFeedback] = useState({ text: queryFeedback(0), cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (elapsed: number) => {
      const state = stateRef.current;
      const worldColor = state.worldExpertOff ? TEXT_MUTED : AUX;
      const pulse = (elapsed % 3000) / 3000;

      clearScene(ctx, W, H);
      drawTable(ctx, W, H, { pockets: [] });

      // A. the four context rows
      for (let i = 0; i < CONTEXT_NAMES.length; i++) {
        const active = QUERY_AGG[state.query].indexOf(i) !== -1;
        const y = barY(i);
        ctx.save();
        ctx.fillStyle = active ? 'rgba(39, 68, 110, 0.14)' : '#ffffff';
        ctx.strokeStyle = active ? GUIDE : BORDER;
        ctx.lineWidth = active ? 2 : 1.5;
        roundRectPath(ctx, BAR_X, y, BAR_W, BAR_H, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? GUIDE : TEXT_MUTED;
        ctx.fillRect(BAR_X + 9, y + 9, 6, BAR_H - 18);
        ctx.restore();
      }

      // B. the autoregressive backbone
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      roundRectPath(ctx, BACKBONE.x, BACKBONE.y, BACKBONE.w, BACKBONE.h, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // six meta-query dots along the lower edge
      for (let i = 0; i < QUERY_AGG.length; i++) {
        const x = dotX(i);
        const sel = i === state.query;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, DOT_Y, 10, 0, Math.PI * 2);
        ctx.fillStyle = sel ? 'rgba(240, 126, 71, 0.22)' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = sel ? EMPHASIS : GUIDE;
        ctx.lineWidth = sel ? 2.5 : 1.5;
        ctx.stroke();
        if (sel) {
          ctx.beginPath();
          ctx.arc(x, DOT_Y, 14, 0, Math.PI * 2);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // h_t leaves the backbone and feeds both experts
      polyline(
        ctx,
        [
          [BACKBONE.x + BACKBONE.w, JUNCTION.y],
          [JUNCTION.x, JUNCTION.y],
        ],
        GUIDE,
        false,
        2,
      );
      polyline(
        ctx,
        [
          [JUNCTION.x, JUNCTION.y],
          [JUNCTION.x, WORLD_CY],
          [WORLD_NODE.x, WORLD_CY],
        ],
        worldColor,
        state.worldExpertOff,
        2,
      );
      polyline(
        ctx,
        [
          [JUNCTION.x, JUNCTION.y],
          [JUNCTION.x, ACTION_CY],
          [ACTION_NODE.x, ACTION_CY],
        ],
        GUIDE,
        false,
        2,
      );

      // a pulse travelling down each live edge (never resets learner state)
      ctx.save();
      ctx.fillStyle = GUIDE;
      ctx.beginPath();
      ctx.arc(JUNCTION.x, lerp(JUNCTION.y, ACTION_CY, pulse), 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (!state.worldExpertOff) {
        ctx.fillStyle = AUX;
        ctx.beginPath();
        ctx.arc(JUNCTION.x, lerp(JUNCTION.y, WORLD_CY, pulse), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // world expert (auxiliary mechanism) — purple solid, or grey dashed once dropped
      ctx.save();
      ctx.fillStyle = state.worldExpertOff ? 'rgba(104, 119, 143, 0.10)' : 'rgba(124, 58, 237, 0.14)';
      ctx.strokeStyle = worldColor;
      ctx.lineWidth = 2;
      if (state.worldExpertOff) ctx.setLineDash([6, 5]);
      roundRectPath(ctx, WORLD_NODE.x, WORLD_NODE.y, WORLD_NODE.w, WORLD_NODE.h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // action expert (current path)
      ctx.save();
      ctx.fillStyle = 'rgba(39, 68, 110, 0.12)';
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      roundRectPath(ctx, ACTION_NODE.x, ACTION_NODE.y, ACTION_NODE.w, ACTION_NODE.h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // action-chunk output
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      roundRectPath(ctx, OUT_NODE.x, OUT_NODE.y, OUT_NODE.w, OUT_NODE.h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      arrowHead(ctx, WORLD_NODE.x, WORLD_CY, worldColor);
      arrowHead(ctx, ACTION_NODE.x, ACTION_CY, GUIDE);
      arrowHead(ctx, OUT_NODE.x, ACTION_CY, GUIDE);

      // h_t junction marker
      ctx.save();
      ctx.fillStyle = GUIDE;
      ctx.beginPath();
      ctx.arc(JUNCTION.x, JUNCTION.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // the selected meta-query pulls its two context rows into h_t
      QUERY_AGG[state.query].forEach((bar) => {
        drawAimLine(ctx, dotX(state.query), DOT_Y, BAR_X + BAR_W, BAR_CY[bar], {
          color: GUIDE,
          dashed: true,
          width: 1,
        });
      });

      drawSceneLabel(ctx, 'h_t', JUNCTION.x + 10, JUNCTION.y + 18, {
        color: TEXT_MUTED,
        size: 12,
      });
      drawSceneLabel(ctx, '元查询', DOT_X0, 232, { color: TEXT_MUTED, size: 12 });

      // dropping the world expert leaves ~2B active parameters
      if (state.worldExpertOff) {
        drawSceneLabel(ctx, '2.0', 44, 22, { color: EMPHASIS, size: 13 });
      }
    };

    const tick = (now: number) => {
      render(now);
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

  const select = (i: number) => {
    stateRef.current.query = i;
    setQuery(i);
    setFeedback({ text: queryFeedback(i), cls: '' });
  };

  /** nearest dot under the pointer, clamped to the dot row */
  const queryAt = (e: React.PointerEvent<HTMLCanvasElement>): number => {
    const canvas = canvasRef.current;
    if (!canvas) return query;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return query;
    // canvas.width is W * devicePixelRatio; divide that ratio back out so the
    // hit test lives in the widget's W x H drawing space.
    const scale = canvas.width / rect.width / (window.devicePixelRatio || 1);
    const x = clamp((e.clientX - rect.left) * scale, DOT_X0, dotX(QUERY_AGG.length - 1));
    return Math.round((x - DOT_X0) / DOT_STEP);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    select(queryAt(e));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    select(queryAt(e));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const toggleWorldExpert = () => {
    const next = !worldExpertOff;
    stateRef.current.worldExpertOff = next;
    setWorldExpertOff(next);
    setFeedback(next ? { text: DROP_FEEDBACK, cls: 'good' } : { text: KEEP_FEEDBACK, cls: '' });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="chip-row">
        {QUERY_AGG.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`chip${query === i ? ' selected' : ''}`}
            aria-pressed={query === i}
            onClick={() => select(i)}
          >
            元查询 {i + 1}
          </button>
        ))}
      </div>

      <div className="step-ctrl">
        <button
          type="button"
          className={`tiny${worldExpertOff ? '' : ' ghost'}`}
          aria-pressed={worldExpertOff}
          onClick={toggleWorldExpert}
        >
          推理时丢掉世界专家
        </button>
        <span className="step-label">
          当前元查询 <b>{query + 1}</b> / 6
        </span>
      </div>

      <div className="step-desc">
        上下文条自上而下依次是：{CONTEXT_NAMES.join(' / ')}
        ；蓝虚线把这枚元查询用到的两条接到 h_t 上。
      </div>

      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla51;
