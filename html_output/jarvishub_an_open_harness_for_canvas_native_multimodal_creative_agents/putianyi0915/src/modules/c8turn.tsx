import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 模块 8.2「一轮是怎么走完的」（1080×280，五环节步进）
// 命名区域：arch（x 40–700，与 8.1 相同的三层架构，尺寸与位置保持一致）、
// updates（x 730–1040，被更新分量清单）。
// 绘制顺序：clearScene → 桌面带 → 三层架构 → 当前环节高亮的层与路径 → 更新分量清单
// → drawLabel（2 个）→ drawLegend（3 项）。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const INK = '#21324a';
const SUB = '#68778f';

const LAYER_X = 40;
const LAYER_W = 660;
const LAYER_H = 50;
// 与 c8arch 保持完全一致的三层坐标，避免切模块时架构图跳动
const Y_RUNTIME = 46;
const Y_BRIDGE = 108;
const Y_STATE = 170;
const SPINE_LEFT = 320;
const SPINE_RIGHT = 400;
const GROUND_Y = 272;

const UPD_X = 730;
const UPD_W = 310;
const UPD_Y0 = 70;
const UPD_ROW_H = 24;
const UPD_ROW_GAP = 6;

type LayerId = 'state' | 'bridge' | 'runtime';

interface LayerDef {
  id: LayerId;
  name: string;
  color: string;
}

const LAYERS: LayerDef[] = [
  { id: 'state', name: '画布状态层', color: BLUE },
  { id: 'bridge', name: '协议桥', color: ORANGE },
  { id: 'runtime', name: '智能体运行时', color: BLUE },
];

const STEP_NAMES = ['观测', '决策', '执行', '写回', '记录'];

/** 每个环节走到时被更新的分量（用于清单逐条变绿）。 */
const STEP_UPDATED: string[][] = [
  [],
  ['M'],
  ['X'],
  ['G', 'U', 'L'],
  ['TAU'],
];

/** 每个环节高亮的层。 */
const STEP_FOCUS: LayerId[][] = [
  ['state'],
  ['runtime'],
  ['runtime'],
  ['bridge'],
  ['state', 'bridge', 'runtime'],
];

/** 每个环节点亮的活跃路径。 */
const STEP_PATH: LayerId[][] = [
  ['state'],
  ['state', 'bridge', 'runtime'],
  ['bridge', 'runtime'],
  ['state', 'bridge'],
  ['state', 'bridge', 'runtime'],
];

const STEP_FEEDBACK: { text: string; cls: string; color: string }[] = [
  { text: '观测：运行时先读当前画布，确认有哪些产物与未完成节点。', cls: '', color: BLUE },
  { text: '决策：在能力清单与执行授权内选出这一轮的动作。', cls: '', color: BLUE },
  { text: '执行：调用对应工具族，拿到可检视的产物或观测。', cls: '', color: ORANGE },
  { text: '写回：把被接受的动作与证据提交给协议桥，落到画布上。', cls: 'good', color: GREEN },
  { text: '记录：把请求、动作、观测、反馈与检查点写进轨迹，本轮完成。', cls: 'good', color: GREEN },
];

const UPD_ITEMS: { id: string; label: string }[] = [
  { id: 'G', label: 'G\u209c 产物图' },
  { id: 'X', label: 'X\u209c 可编辑内容' },
  { id: 'M', label: 'M\u209c 溯源与元数据' },
  { id: 'U', label: 'U\u209c 交互记录' },
  { id: 'L', label: 'L\u209c 空间布局' },
  { id: 'TAU', label: 'τ 轨迹记录' },
];

function layerY(id: LayerId): number {
  if (id === 'runtime') return Y_RUNTIME;
  if (id === 'bridge') return Y_BRIDGE;
  return Y_STATE;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const items = [
    { color: BLUE, text: '当前环节' },
    { color: ORANGE, text: '已处理环节' },
    { color: PURPLE, text: '轨迹记录' },
  ];
  let cx = x;
  ctx.save();
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 11, 16, 12);
    ctx.fillStyle = SUB;
    ctx.fillText(it.text, cx + 22, y);
    cx += 22 + it.text.length * 16 + 20;
  });
  ctx.restore();
}

function drawKnit(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy - 8);
  ctx.quadraticCurveTo(cx - 3, cy + 6, cx, cy + 9);
  ctx.quadraticCurveTo(cx + 3, cy + 6, cx + 9, cy - 8);
  ctx.stroke();
  ctx.restore();
}

function drawArrowV(
  ctx: CanvasRenderingContext2D,
  x: number,
  yFrom: number,
  yTo: number,
  lit: boolean
): void {
  const color = lit ? BLUE : LINE;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lit ? 3.5 : 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, yFrom);
  ctx.lineTo(x, yTo);
  ctx.stroke();
  const dir = yTo > yFrom ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(x, yTo);
  ctx.lineTo(x - 6, yTo - 9 * dir);
  ctx.lineTo(x + 6, yTo - 9 * dir);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, step: number, dstep: number, time: number): void {
  clearScene(ctx);

  const focus = STEP_FOCUS[step - 1];
  const path = STEP_PATH[step - 1];
  const litGap1 = path.indexOf('state') >= 0 && path.indexOf('bridge') >= 0;
  const litGap2 = path.indexOf('bridge') >= 0 && path.indexOf('runtime') >= 0;
  const pulse = 0.5 + 0.5 * Math.sin(time / 300);
  const frac = clamp(dstep - (step - 1), 0, 1);

  // 顶部：已处理环节留下的橙色步骤标记
  for (let i = 0; i < 5; i++) {
    const x = LAYER_X + i * 28;
    const done = i < step - 1;
    const now = i === step - 1;
    ctx.save();
    ctx.fillStyle = done ? ORANGE : now ? BLUE : 'rgba(215,222,234,0.7)';
    roundRectPath(ctx, x, 30, now ? lerp(10, 18, frac) : 18, 10, 3);
    ctx.fill();
    if (now) {
      ctx.strokeStyle = BLUE;
      ctx.globalAlpha = 0.35 * pulse;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 3, 27, 24, 16);
    }
    ctx.restore();
  }

  // 三层架构（与 8.1 相同的尺寸与位置）
  LAYERS.forEach((def) => {
    const y = layerY(def.id);
    const focused = focus.indexOf(def.id) >= 0;
    const inPath = path.indexOf(def.id) >= 0;
    ctx.save();
    ctx.fillStyle = focused ? 'rgba(39,68,110,0.10)' : inPath ? 'rgba(39,68,110,0.05)' : '#ffffff';
    roundRectPath(ctx, LAYER_X, y, LAYER_W, LAYER_H, 8);
    ctx.fill();
    ctx.strokeStyle = focused || inPath ? def.color : LINE;
    ctx.lineWidth = focused ? 4 : inPath ? 2.5 : 2;
    ctx.stroke();
    ctx.restore();

    drawKnit(ctx, LAYER_X + 26, y + LAYER_H / 2, focused || inPath ? def.color : LINE);

    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillStyle = focused || inPath ? def.color : INK;
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText(def.name, LAYER_X + 48, y + 32);
    ctx.restore();
  });

  drawArrowV(ctx, SPINE_LEFT, Y_BRIDGE + LAYER_H, Y_STATE, litGap1);
  drawArrowV(ctx, SPINE_RIGHT, Y_STATE, Y_BRIDGE + LAYER_H, litGap1);
  drawArrowV(ctx, SPINE_LEFT, Y_RUNTIME + LAYER_H, Y_BRIDGE, litGap2);
  drawArrowV(ctx, SPINE_RIGHT, Y_BRIDGE, Y_RUNTIME + LAYER_H, litGap2);

  // 第 5 环节：轨迹记录横跨三层
  if (step === 5) {
    LAYERS.forEach((def) => {
      const y = layerY(def.id);
      ctx.save();
      ctx.fillStyle = PURPLE;
      roundRectPath(ctx, LAYER_X + LAYER_W + 12, y + LAYER_H / 2 - 6, 12, 12, 3);
      ctx.fill();
      ctx.restore();
    });
    ctx.save();
    ctx.fillStyle = PURPLE;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('本轮已写入轨迹', 500, 38);
    ctx.restore();
  }

  // 被更新分量清单
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  roundRectPath(
    ctx,
    UPD_X,
    UPD_Y0 - 8,
    UPD_W,
    UPD_ITEMS.length * (UPD_ROW_H + UPD_ROW_GAP) + 8,
    8
  );
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const updated = STEP_UPDATED[step - 1];
  UPD_ITEMS.forEach((item, i) => {
    const y = UPD_Y0 + i * (UPD_ROW_H + UPD_ROW_GAP);
    const hit = updated.indexOf(item.id) >= 0;
    ctx.save();
    ctx.fillStyle = hit ? 'rgba(34,141,92,0.12)' : 'rgba(245,248,240,0.85)';
    roundRectPath(ctx, UPD_X + 8, y, UPD_W - 16, UPD_ROW_H, 5);
    ctx.fill();
    ctx.strokeStyle = hit ? GREEN : LINE;
    ctx.lineWidth = hit ? 2 : 1;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillStyle = hit ? GREEN : SUB;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillText(item.label, UPD_X + 20, y + 17);
    ctx.textAlign = 'right';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(hit ? '已更新' : '未更新', UPD_X + UPD_W - 20, y + 17);
    ctx.restore();
  });

  drawLabel(ctx, '三层架构', LAYER_X, 22, INK);
  drawLabel(ctx, '被更新的分量', UPD_X, 22, INK);
  drawLegend(ctx, LAYER_X, 274);
}

export const Ch8Turn: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRef = useRef<number>(1);
  const animRef = useRef<{ from: number; start: number }>({ from: 1, start: -1e9 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      const easeT = clamp((performance.now() - animRef.current.start) / 280, 0, 1);
      const dstep = lerp(animRef.current.from, stepRef.current, easeOutCubic(easeT));
      render(ctx, stepRef.current, dstep, performance.now());
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

  const move = (next: number) => {
    const target = clamp(next, 1, 5);
    if (target === stepRef.current) return;
    animRef.current = { from: stepRef.current, start: performance.now() };
    stepRef.current = target;
    setStep(target);
  };

  const fb = STEP_FEEDBACK[step - 1];
  const atEnd = step === 5;
  const updatedCount = STEP_UPDATED[step - 1].length;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => move(step - 1)}
          disabled={step === 1}
        >
          上一步
        </button>
        <span className="step-label">
          第 <b>{step}</b> / 5 环节 · {STEP_NAMES[step - 1]}
        </span>
        <button
          type="button"
          className="tiny"
          onClick={() => move(step + 1)}
          disabled={atEnd}
          style={atEnd ? { background: GREEN, borderColor: GREEN, color: '#fff', opacity: 1 } : undefined}
        >
          {atEnd ? '已完成' : '下一步'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => move(1)} disabled={step === 1}>
          重置
        </button>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前环节</div>
          <div className="v">{STEP_NAMES[step - 1]}</div>
        </div>
        <div className="metric">
          <div className="l">已更新分量</div>
          <div className="v">{updatedCount} 项</div>
        </div>
        <div className="metric">
          <div className="l">轨迹记录</div>
          <div className="v">{step === 5 ? '已写入' : '未写入'}</div>
        </div>
      </div>
      <div
        className={`feedback ${fb.cls}`}
        style={fb.cls === 'good' ? undefined : { color: fb.color, borderLeftColor: fb.color }}
      >
        {fb.text}
      </div>
    </div>
  );
};

export default Ch8Turn;
