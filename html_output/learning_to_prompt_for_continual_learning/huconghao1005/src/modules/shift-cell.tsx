import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  LP_LW_EMPH,
  lpFont,
  drawField,
  drawTypeCase,
  drawTag,
  drawLink,
  drawLabel,
  drawLegend,
  drawMeter,
} from './letterpressKit';

// 第 8 章「挪格」· 挪格（P4 拖拽格子）
// 主导操作：拖着字条格子在格轨上换位置；打开频率惩罚看分布被压平。
// 规则：越靠前的格子被数到的次数越多；惩罚把冷门格子往前挪，让分布变平。

const W_FULL = 1080;
const H_FULL = 380;
const W_ANA = 560;
const H_ANA = 140;

const CELLS = 6;
const RAIL_X = 40;
const CELL_W = 110;
const CELL_H = 96;
const SLOT_GAP = 24;
const SLOT_W = CELL_W + SLOT_GAP;
const RAIL_Y = 218;
const RAIL_H = CELL_H;

/** 官方默认顺序：格子 0..5。 */
const DEFAULT_ORDER = [0, 1, 2, 3, 4, 5];

/** 位置带来的天生偏斜：越靠前被选中越多。 */
const BASE_USAGE = [22, 15, 9, 5, 3, 1];

function slotX(i: number): number {
  return RAIL_X + i * SLOT_W;
}

/** 当前每格被数到的次数：位置越靠前越多；惩罚把分布往平均值压。 */
function usageByOrder(order: number[], penaltyOn: boolean, penaltyStrength: number): number[] {
  const avg = BASE_USAGE.reduce((a, b) => a + b, 0) / BASE_USAGE.length;
  const usage = new Array<number>(CELLS).fill(0);
  for (let i = 0; i < order.length; i++) {
    const k = order[i];
    if (k < 0 || k >= CELLS) continue;
    const base = BASE_USAGE[i % BASE_USAGE.length];
    usage[k] = penaltyOn ? lerp(base, avg, penaltyStrength) : base;
  }
  return usage;
}

function statsOf(usage: number[]) {
  const total = usage.reduce((a, b) => a + b, 0);
  const avg = total / usage.length;
  let varSum = 0;
  for (const u of usage) varSum += (u - avg) * (u - avg);
  const sd = Math.sqrt(varSum / usage.length);
  const empty = usage.filter((u) => u < 0.6).length;
  const top = Math.max(...usage);
  return { total, avg, sd, spread: sd / Math.max(0.0001, avg), empty, top };
}

/** 带缺口的环形量表：弧长 = 被数到的次数。 */
function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  value: number,
  maxValue: number,
  color: string,
  emphasis: boolean
) {
  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  ctx.save();
  ctx.lineCap = 'round';
  // 轨道
  ctx.strokeStyle = LP.axis;
  ctx.lineWidth = emphasis ? 7 : 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + sweep);
  ctx.stroke();
  // 已用弧长
  const t = clamp(value / Math.max(0.0001, maxValue), 0, 1);
  if (t > 0.001) {
    ctx.strokeStyle = color;
    ctx.lineWidth = emphasis ? 7 : 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + sweep * t);
    ctx.stroke();
  }
  // 次数（裸数字）
  ctx.fillStyle = LP.ink;
  ctx.font = lpFont(13, 700);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.round(value)), cx, cy - 3);
  ctx.restore();
}

/** 一格字条：一层抽屉 + 一叠纸。冷门格子加紫描边。 */
function drawCellFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  index: number,
  options: { picked: boolean; neglected: boolean; lift: number; highlight: boolean }
) {
  ctx.save();
  if (options.neglected) {
    ctx.strokeStyle = LP.aux;
    ctx.lineWidth = LP_LW_EMPH;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.rect(x - 4, y - 4 - options.lift, w + 8, h + 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  drawTypeCase(ctx, x, y - options.lift, w, h, {
    cols: 3,
    rows: 2,
    fill: options.highlight ? LP.accent : options.neglected ? LP.aux : LP.light,
    cellText: (r, c) => (r === 0 && c === 0 ? `P${index}` : ''),
    gap: 4,
    radius: 4,
  });
  ctx.strokeStyle = options.picked ? LP.guide : LP.dark;
  ctx.lineWidth = options.picked ? LP_LW_EMPH : LP_LW;
  ctx.beginPath();
  ctx.rect(x, y - options.lift, w, h);
  ctx.stroke();
  ctx.restore();
}

/** 常驻的拖拽把手。 */
function drawGrip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = LP.muted;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.beginPath();
      ctx.arc(x + w / 2 - 5 + j * 10, y + i * 6, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function ShiftCellInner({ chapterId, moduleId }: WidgetProps) {
  const isAna = moduleId === 'ana';
  const W = isAna ? W_ANA : W_FULL;
  const H = isAna ? H_ANA : H_FULL;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [order, setOrder] = useState<number[]>(DEFAULT_ORDER.slice());
  const [penaltyOn, setPenaltyOn] = useState(false);
  const [feedback, setFeedback] = useState({ text: '拖动格子，或者打开频率惩罚。', cls: '' });

  const orderRef = useRef<number[]>(DEFAULT_ORDER.slice());
  const posRef = useRef<number[]>(new Array(CELLS).fill(0).map((_, i) => slotX(i)));
  const dragRef = useRef({ index: -1, x: 0, active: false });
  const penaltyRef = useRef({ on: false, strength: 0 });
  const animRef = useRef({ ana: isAna, raf: null as number | null, phase: 0 });

  useEffect(() => {
    orderRef.current = order;
    // 换顺序时给「挪格」一个目标位置；动画在渲染循环里追。
  }, [order]);

  useEffect(() => {
    penaltyRef.current.on = penaltyOn;
  }, [penaltyOn]);

  useEffect(() => {
    animRef.current.ana = isAna;
  }, [isAna]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const a = animRef.current;
      a.phase += 0.02;

      // 惩罚强度的平滑推进：打开后 rings 从尖变平是动画的
      const targetStrength = penaltyRef.current.on ? 1 : 0;
      penaltyRef.current.strength = lerp(penaltyRef.current.strength, targetStrength, 0.08);
      const strength = penaltyRef.current.strength;

      const ord = orderRef.current;
      const usage = usageByOrder(ord, strength > 0.02, strength);
      const stats = statsOf(usage);
      const maxUsage = Math.max(1, ...usage);
      const neglected = usage.map((u) => u < stats.avg * 0.45);

      ctx.clearRect(0, 0, W, H);
      drawField(ctx, 0, 0, W, H);

      if (a.ana) {
        // 类比卡：一条格轨，冷门格子被推进来，分布自己变平
        const n = 4;
        const cw = 76;
        const gap = 22;
        const railY = 62;
        const auto = 0.5 + 0.5 * Math.sin(a.phase * 0.8);
        for (let i = 0; i < n; i++) {
          const push = (n - 1 - i) * auto * 16;
          const x = 26 + i * (cw + gap) - push;
          const hot = i < 2;
          drawTypeCase(ctx, x, railY, cw, 56, {
            cols: 3,
            rows: 2,
            fill: hot ? LP.accent : LP.light,
            gap: 4,
            radius: 4,
          });
          ctx.save();
          ctx.strokeStyle = hot ? LP.success : LP.aux;
          ctx.lineWidth = LP_LW;
          ctx.beginPath();
          ctx.rect(x, railY, cw, 56);
          ctx.stroke();
          ctx.restore();
          // 环形量表
          const r = 12;
          const cx = x + cw / 2;
          const cy = railY + 56 + 20;
          ctx.save();
          ctx.strokeStyle = LP.axis;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
          ctx.stroke();
          ctx.strokeStyle = LP.accent;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * (hot ? 0.85 - auto * 0.4 : 0.2 + auto * 0.4));
          ctx.stroke();
          ctx.restore();
        }
        drawLabel(ctx, '挪格子', 16, 26, { size: 12, color: LP.muted, weight: 600 });
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        return;
      }

      // ---- 格轨底座
      ctx.save();
      ctx.fillStyle = 'rgba(232,228,216,0.45)';
      ctx.beginPath();
      ctx.rect(RAIL_X - 14, RAIL_Y + RAIL_H - 12, CELLS * SLOT_W + 6, 24);
      ctx.fill();
      ctx.fillStyle = LP.support;
      ctx.beginPath();
      ctx.rect(RAIL_X - 14, RAIL_Y + RAIL_H + 8, CELLS * SLOT_W + 6, 5);
      ctx.fill();
      ctx.restore();

      // ---- 目标位置
      const targets = new Array<number>(CELLS).fill(0);
      for (let slot = 0; slot < ord.length; slot++) {
        targets[ord[slot]] = slotX(slot);
      }

      // ---- 平滑挪动（挪格动作本身）
      const drag = dragRef.current;
      const pos = posRef.current;
      for (let k = 0; k < CELLS; k++) {
        const goal = drag.active && drag.index === k ? drag.x - CELL_W / 2 : targets[k];
        if (!isFinite(pos[k])) pos[k] = goal;
        pos[k] = lerp(pos[k], goal, drag.active && drag.index === k ? 0.4 : 0.14);
      }

      // ---- 落点提示：拖动时显示会插到哪一格
      if (drag.active) {
        const center = pos[drag.index] + CELL_W / 2;
        let near = 0;
        let best = Number.POSITIVE_INFINITY;
        for (let i = 0; i < CELLS; i++) {
          const d = Math.abs(slotX(i) + CELL_W / 2 - center);
          if (d < best) {
            best = d;
            near = i;
          }
        }
        ctx.save();
        ctx.strokeStyle = LP.guide;
        ctx.lineWidth = LP_LW;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(slotX(near) - 6, RAIL_Y - 16);
        ctx.lineTo(slotX(near) + CELL_W + 6, RAIL_Y - 16);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ---- 格子上方的环形量表
      for (let k = 0; k < CELLS; k++) {
        const i = ord.indexOf(k);
        const cx = pos[k] + CELL_W / 2;
        const hot = i === 0;
        drawRing(ctx, cx, RAIL_Y - 52, 22, usage[k], maxUsage, LP.accent, hot);
      }

      // ---- 格子本体（按 k 顺序画，拖动中的最后画）
      const drawOne = (k: number) => {
        const i = ord.indexOf(k);
        const picked = drag.active && drag.index === k;
        drawCellFace(ctx, pos[k], RAIL_Y, CELL_W, CELL_H, k, {
          picked,
          neglected: neglected[k] && strength > 0.5,
          lift: picked ? 8 : 0,
          highlight: i === 0,
        });
        drawGrip(ctx, pos[k], RAIL_Y + CELL_H - 16 - (picked ? 8 : 0), CELL_W, picked ? 1 : 0.55);
      };
      for (let k = 0; k < CELLS; k++) if (!(drag.active && drag.index === k)) drawOne(k);
      if (drag.active && drag.index >= 0) drawOne(drag.index);

      // ---- 选中标记：被数到最多的那一格
      const topCell = usage.indexOf(Math.max(...usage));
      const topIdx = ord.indexOf(topCell);
      if (topIdx >= 0) {
        drawTag(ctx, pos[topCell] + CELL_W / 2 - 34, RAIL_Y - 104, 68, 24, {
          text: '被选自',
          fill: LP.bg,
          hit: strength < 0.5,
          emphasis: strength >= 0.5,
        });
        drawLink(ctx, pos[topCell] + CELL_W / 2, RAIL_Y - 80, pos[topCell] + CELL_W / 2, RAIL_Y - 8, {
          color: strength < 0.5 ? LP.accent : LP.success,
          dashed: strength >= 0.5,
          width: LP_LW,
          arrow: true,
        });
      }

      // ---- 右侧读数台
      const px = 940;
      const pw = 108;
      ctx.save();
      ctx.fillStyle = 'rgba(232,228,216,0.55)';
      ctx.beginPath();
      ctx.rect(px - 14, 84, pw + 34, 250);
      ctx.fill();
      ctx.strokeStyle = LP.axis;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = LP.ink;
      ctx.font = lpFont(13, 700);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('分布读数', px - 4, 104);
      ctx.restore();

      const rows: Array<{ label: string; value: string; meter: number; color: string }> = [
        { label: '集中度', value: `${(stats.spread * 100).toFixed(0)}%`, meter: clamp(stats.spread / 0.9, 0, 1), color: LP.accent },
        { label: '空置格', value: String(stats.empty), meter: clamp(stats.empty / CELLS, 0, 1), color: LP.failure },
        { label: '平的度', value: `${(100 - clamp(stats.spread / 0.9, 0, 1) * 100).toFixed(0)}%`, meter: 1 - clamp(stats.spread / 0.9, 0, 1), color: LP.success },
        { label: '被数次数', value: String(Math.round(stats.total)), meter: 1, color: LP.guide },
      ];
      rows.forEach((row, i) => {
        const y = 146 + i * 48;
        ctx.save();
        ctx.fillStyle = LP.muted;
        ctx.font = lpFont(12, 500);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(row.label, px - 4, y);
        ctx.fillStyle = LP.ink;
        ctx.font = lpFont(15, 700);
        ctx.textAlign = 'right';
        ctx.fillText(row.value, px + pw - 2, y);
        ctx.restore();
        drawMeter(ctx, px - 4, y + 12, pw - 6, 8, row.meter, row.color);
      });

      // ---- 只在训练时用
      ctx.save();
      ctx.fillStyle = LP.muted;
      ctx.font = lpFont(12, 500);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('h 只在训练时用；推理时关掉，格子回到原始顺序。', RAIL_X + (CELLS * SLOT_W) / 2, RAIL_Y + RAIL_H + 26);
      ctx.restore();

      // ---- 图例（≤3 项）
      drawLegend(
        ctx,
        [
          { label: '被选中', color: LP.accent },
          { label: '冷门格', color: LP.aux },
          { label: '平分布', color: LP.success },
        ],
        46,
        H - 22,
        { size: 12 }
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    let live = false;
    const tick = () => {
      if (!live) return;
      render();
      animRef.current.raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (live) return;
      live = true;
      animRef.current.raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      live = false;
      if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H]);

  // ---- 拖拽（pointer events，落在 canvas 坐标系里）
  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / Math.max(1, rect.width);
    const scaleY = H / Math.max(1, rect.height);
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const hitCell = (x: number, y: number): number => {
    if (y < RAIL_Y - 24 || y > RAIL_Y + CELL_H + 14) return -1;
    let best = -1;
    let bestD = Number.POSITIVE_INFINITY;
    const pos = posRef.current;
    for (let k = 0; k < CELLS; k++) {
      const d = Math.abs(pos[k] + CELL_W / 2 - x);
      if (d < CELL_W / 2 + 8 && d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    const { x, y } = canvasPoint(e);
    const k = hitCell(x, y);
    if (k < 0) return;
    dragRef.current = { index: k, x, active: true };
    setFocusIdx(k);
    canvasRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.index < 0) return;
    const { x } = canvasPoint(e);
    drag.x = x;
    // 落点决定顺序：拖到哪一格，就插到那一格
    const center = x;
    let near = 0;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < CELLS; i++) {
      const d = Math.abs(slotX(i) + CELL_W / 2 - center);
      if (d < best) {
        best = d;
        near = i;
      }
    }
    setOrder((prev) => {
      const from = prev.indexOf(drag.index);
      if (from < 0 || from === near) return prev;
      const next = prev.slice();
      next.splice(from, 1);
      next.splice(clamp(near, 0, next.length), 0, drag.index);
      return next;
    });
  };

  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    drag.index = -1;
    const ord = orderRef.current;
    const usage = usageByOrder(ord, penaltyRef.current.strength > 0.02, penaltyRef.current.strength);
    const stats = statsOf(usage);
    setFeedback({
      text: `顺序已改：第一格现在是被数到最多的那一个。空置 ${stats.empty} 格，集中度 ${(stats.spread * 100).toFixed(0)}%。`,
      cls: '',
    });
  };

  // ---- 键盘回退：选中一格后左右键挪位
  const [focusIdx, setFocusIdx] = useState(0);
  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (isAna) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      setOrder((prev) => {
        const from = prev.indexOf(focusIdx);
        const to = clamp(from + dir, 0, prev.length - 1);
        if (from < 0 || from === to) return prev;
        const next = prev.slice();
        next.splice(from, 1);
        next.splice(to, 0, focusIdx);
        return next;
      });
    }
  };

  const togglePenalty = () => {
    const next = !penaltyOn;
    setPenaltyOn(next);
    if (next) {
      setFeedback({
        text: '分布变平了；去掉这一项会从 81.14 掉到 62.26。',
        cls: 'good',
      });
    } else {
      setFeedback({
        text: '关掉惩罚，冷门格子会被冷落——这是按公式的预期；能对上的是：去掉多样化选择，5-datasets 从 81.14 掉到 62.26。',
        cls: 'warn',
      });
    }
  };

  const resetOrder = () => {
    setOrder(DEFAULT_ORDER.slice());
    setPenaltyOn(false);
    setFeedback({ text: '拖动格子，或者打开频率惩罚。', cls: '' });
  };

  const usage = usageByOrder(order, penaltyOn, penaltyOn ? 1 : 0);
  const stats = statsOf(usage);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={isAna ? -1 : 0}
        style={isAna ? undefined : { touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onKeyDown={onKeyDown}
        aria-label="调料池的格轨：拖动格子换位置，越靠前被数到越多"
      />
      {!isAna && (
        <>
          <div className="ctrl">
            <label>频率惩罚 h</label>
            <button type="button" className={`chip${penaltyOn ? ' selected' : ''}`} onClick={togglePenalty}>
              {penaltyOn ? '已打开' : '应用频率惩罚'}
            </button>
            <button type="button" className="tiny ghost" onClick={resetOrder}>
              重置顺序
            </button>
            <span className="val">{penaltyOn ? 'on' : 'off'}</span>
          </div>
          <div className="metrics">
            <div className="metric">
              <div className="l">集中度</div>
              <div className="v">{(stats.spread * 100).toFixed(0)}%</div>
            </div>
            <div className="metric">
              <div className="l">空置格</div>
              <div className="v">{stats.empty}</div>
            </div>
            <div className="metric">
              <div className="l">被数次数合计</div>
              <div className="v">{Math.round(stats.total)}</div>
            </div>
          </div>
          <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
        </>
      )}
    </div>
  );
}

export const ShiftCell: React.FC<WidgetProps> = (props) => <ShiftCellInner {...props} />;

export default ShiftCell;
