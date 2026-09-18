import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// m9-2 — 三阶段激活（1080×280，P2 单步按钮）。
// 「上一阶段 / 下一阶段 / 重置」在 Stage 1–3 之间切换：阶段卡高亮、
// 5×3 激活矩阵的当前列底色与格内状态同步更新。

const W = 1080;
const H = 280;

const SCENE_BG = '#f5f8f0';
const C_WARP = '#b8c9a7';
const C_WARP_DEEP = '#76906a';
const C_LOOM = '#92400e';
const C_WEAVE = '#27446e';
const C_CROSS = '#7c3aed';
const C_SHUTTLE = '#f07e47';
const C_DONE = '#228d5c';
const C_BAD = '#c43f52';
const C_INSET = '#ffffff';
const C_MUTED = '#68778f';
const C_AXIS = '#d7deea';
const C_LABEL = '#21324a';

type XY = [number, number];
type WarpMark = 'normal' | 'dim' | 'broken';
type WarpState = (i: number) => WarpMark;

// ── Reusable Canvas drawing kit (defined locally in every widget file) ──────────

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
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = SCENE_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C_AXIS;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C_WARP;
  ctx.lineWidth = 1.5;
  for (let x = 60; x <= w - 60; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  }
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: WarpState
): void {
  ctx.strokeStyle = C_LOOM;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 12, w - 28, h - 24);
  if (warpCount <= 0) return;
  const from = 60;
  const to = w - 60;
  const step = warpCount > 1 ? (to - from) / (warpCount - 1) : 0;
  for (let i = 0; i < warpCount; i++) {
    const x = from + i * step;
    const st = warpState ? warpState(i) : 'normal';
    ctx.strokeStyle = st === 'broken' ? C_BAD : st === 'dim' ? C_AXIS : C_WARP;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
    if (st === 'broken') {
      ctx.strokeStyle = C_BAD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 6, h / 2);
      ctx.lineTo(x + 6, h / 2);
      ctx.stroke();
    }
  }
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string,
  flip = false
): void {
  const bw = 46 * scale;
  const bh = 18 * scale;
  const dir = flip ? -1 : 1;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - dir * bw * 2.4, y);
  ctx.lineTo(x - dir * bw * 0.5, y);
  ctx.stroke();
  roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 6 * scale);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dir * bw * 0.5, y - bh / 2);
  ctx.lineTo(x + dir * (bw * 0.5 + 9 * scale), y);
  ctx.lineTo(x + dir * bw * 0.5, y + bh / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: XY[],
  stateColor: string,
  width: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'corner' | 'band'
): void {
  ctx.strokeStyle = C_DONE;
  ctx.lineWidth = 2.5;
  if (mode === 'band') {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - w, y - w);
    ctx.lineTo(x, y - w);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'label' | 'muted'
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = variant === 'muted' ? C_MUTED : C_LABEL;
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: { color: string; text: string }[]
): void {
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 10, 12, 12);
    ctx.fillStyle = C_MUTED;
    ctx.fillText(it.text, cx + 17, y);
    cx += 17 + ctx.measureText(it.text).width + 22;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: XY,
  to: XY,
  color: string,
  width: number,
  dashed: boolean
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): void {
  ctx.fillStyle = C_INSET;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C_AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = C_LABEL;
    ctx.fillText(title, x + 10, y + 20);
  }
}

// ── Widget ─────────────────────────────────────────────────────────────────────

type PartState = 'train' | 'frozen' | 'off';

const PARTS = ['VLM', '适配器', '浅层块', '深层流', '跳跃连接'];
const CELL_TEXT: Record<PartState, string> = { train: '训练', frozen: '冻结', off: '未激活' };

// 五个部件在三阶段里的状态
const MATRIX: Record<number, PartState[]> = {
  1: ['frozen', 'off', 'train', 'train', 'off'],
  2: ['frozen', 'train', 'frozen', 'frozen', 'off'],
  3: ['frozen', 'train', 'train', 'train', 'train'],
};

const STAGE_LOSS: Record<number, string> = {
  1: 'L_NF',
  2: 'L_NTP',
  3: 'L_NF + λ · L_NTP',
};

const STAGE_DATA: Record<number, string> = {
  1: '约 800M 文生图样本',
  2: '约 200M 图文样本',
  3: '约 80M 混合样本',
};

function feedbackFor(stage: number): { text: string; cls: string } {
  if (stage === 1) {
    return {
      text: 'Stage 1：冻结 VLM，只训练深层流与浅层块，目标是文生图的流似然。',
      cls: '',
    };
  }
  if (stage === 2) {
    return {
      text: 'Stage 2：冻结浅层块与 VLM，只训练把 u 映射进 VLM 表示空间的适配器，用下一 token 预测损失。',
      cls: '',
    };
  }
  return {
    text: 'Stage 3：打开垂直跳跃连接，在理解/生成/编辑/交错数据上联合优化；因为两条投影零初始化，训练从前面阶段的预训练行为平滑出发。',
    cls: 'good',
  };
}

export const M92: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 1 });
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState(1);
  const [feedback, setFeedback] = useState(feedbackFor(1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { stage: number }) => {
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, 0);

      // ---- 左：阶段流程卡 ----
      const cardX = 40;
      const cardW = 340;
      const cardH = 56;
      const cardTop = 40;
      const cardGap = 14;
      for (let i = 0; i < 3; i += 1) {
        const y = cardTop + i * (cardH + cardGap);
        const isCur = i + 1 === s.stage;
        const isDone = i + 1 < s.stage;

        ctx.fillStyle = C_INSET;
        ctx.fillRect(cardX, y, cardW, cardH);
        ctx.strokeStyle = isCur ? C_SHUTTLE : C_AXIS;
        ctx.lineWidth = isCur ? 2.5 : 1;
        ctx.strokeRect(cardX + 0.5, y + 0.5, cardW - 1, cardH - 1);

        if (isDone) {
          ctx.fillStyle = C_DONE;
          ctx.fillRect(cardX + 1, y + 1, 6, cardH - 2);
        }

        ctx.textAlign = 'left';
        ctx.font = 'bold 14px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = isCur ? C_LABEL : C_MUTED;
        ctx.fillText(`Stage ${i + 1}`, cardX + 18, y + 24);
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = C_MUTED;
        ctx.fillText(STAGE_LOSS[i + 1], cardX + 18, y + 44);

        // 连接箭头
        if (i < 2) {
          const ax = cardX + cardW / 2;
          const ay0 = y + cardH;
          const ay1 = y + cardH + cardGap;
          drawThread(ctx, [ax, ay0 + 1], [ax, ay1 - 3], C_AXIS, 1.5, false);
          ctx.fillStyle = C_AXIS;
          ctx.beginPath();
          ctx.moveTo(ax, ay1);
          ctx.lineTo(ax - 5, ay1 - 6);
          ctx.lineTo(ax + 5, ay1 - 6);
          ctx.closePath();
          ctx.fill();
        }
      }

      // ---- 右：激活状态矩阵 ----
      drawInsetFrame(ctx, 450, 40, 600, 200, '');
      const labelX = 466;
      const colW = 150;
      const colX0 = 600;
      const headerTop = 40;
      const rowsTop = 64;
      const rowH = 35;
      const cellW = 128;
      const cellH = 28;

      // 当前阶段所在整列加一层浅色底
      const curCol = s.stage - 1;
      ctx.fillStyle = 'rgba(240,126,71,0.10)';
      ctx.fillRect(colX0 + curCol * colW, headerTop, colW, rowsTop + 5 * rowH - headerTop);

      // 表头
      ctx.textAlign = 'center';
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C_MUTED;
      for (let c = 0; c < 3; c += 1) {
        const cx = colX0 + c * colW + colW / 2;
        ctx.fillText(`Stage ${c + 1}`, cx, headerTop + 18);
      }

      // 行
      for (let r = 0; r < PARTS.length; r += 1) {
        const cy = rowsTop + r * rowH + rowH / 2;
        ctx.textAlign = 'left';
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = C_LABEL;
        ctx.fillText(PARTS[r], labelX, cy + 4);

        for (let c = 0; c < 3; c += 1) {
          const st = MATRIX[c + 1][r];
          const cx = colX0 + c * colW + colW / 2;
          const fill = st === 'train' ? C_WEAVE : st === 'frozen' ? C_WARP : C_AXIS;
          ctx.fillStyle = fill;
          ctx.fillRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH);
          ctx.strokeStyle = C_AXIS;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - cellW / 2 + 0.5, cy - cellH / 2 + 0.5, cellW - 1, cellH - 1);
          ctx.textAlign = 'center';
          ctx.fillStyle = st === 'train' ? '#ffffff' : C_LABEL;
          ctx.fillText(CELL_TEXT[st], cx, cy + 4);
        }
      }
      ctx.textAlign = 'left';

      drawSceneLabel(ctx, 40, 34, '阶段流程', 'muted');
      drawSceneLabel(ctx, 452, 34, '激活矩阵', 'muted');

      drawLegend(ctx, 452, 272, [
        { color: C_WEAVE, text: '训练' },
        { color: C_WARP, text: '冻结' },
        { color: C_AXIS, text: '未激活' },
      ]);
    };

    const tick = () => {
      render(stateRef.current);
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

  const apply = (next: number) => {
    const s = clamp(Math.round(next), 1, 3);
    stateRef.current.stage = s;
    setStage(s);
    setFeedback(feedbackFor(s));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => apply(stage - 1)}
          disabled={stage === 1}
        >
          上一阶段
        </button>
        <button
          type="button"
          className="tiny"
          onClick={() => apply(stage + 1)}
          disabled={stage === 3}
        >
          下一阶段
        </button>
        <button type="button" className="tiny ghost" onClick={() => apply(1)}>
          重置
        </button>
        <span style={{ color: 'var(--slate)' }}>Stage {stage} / 3</span>
        <span style={{ color: 'var(--slate-2)' }}>{STAGE_DATA[stage]}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M92;
