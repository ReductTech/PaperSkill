import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 模块 8.1「点击每一层看它负责什么」（1080×280，点击图层 + 两个变体 chip）
// 命名区域：arch（x 40–760，三层矩形自下而上：画布状态层 / 协议桥 / 智能体运行时）、
// io（x 790–1040，固定输入输出面板）、trail（traced 变体下 x 40–700，三层「下方」的一条虚线证据带）。
// 绘制顺序：clearScene → 桌面带 → 三层底板 → 活跃路径连线 → 选中层高亮 → 轨迹虚线带
// → 输入输出面板 → drawLabel（2 个）→ drawLegend（3 项）。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const YARN = '#b8c9a7';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const PURPLE = '#7c3aed';
const INK = '#21324a';
const SUB = '#68778f';

const LAYER_X = 40;
const LAYER_W = 660;
const LAYER_H = 50;
const Y_RUNTIME = 46;
const Y_BRIDGE = 108;
const Y_STATE = 170;
const SPINE_LEFT = 320;
const SPINE_RIGHT = 400;
const GROUND_Y = 258;

// 论文 Figure 2 把轨迹、评估器、人工编辑与检查点记为三层之下的一条证据带，
// 因此这里的轨迹记录带画在三层下方，而不是上方；它也不构成第四个核心层。
const TRAIL_Y = 228;
const TRAIL_H = 22;

const IO_X = 790;
const IO_W = 250;

type LayerId = 'state' | 'bridge' | 'runtime';
type Variant = 'base' | 'traced';

interface LayerDef {
  id: LayerId;
  name: string;
  color: string;
  duty: string;
  input: string;
  output: string;
  sentence: string;
  feedbackColor: string;
}

const LAYERS: LayerDef[] = [
  {
    id: 'state',
    name: '画布状态层',
    color: BLUE,
    duty: '存什么',
    input: '被接受的动作与证据',
    output: '更新后的画布状态',
    sentence: '画布状态层：保存节点、属性、布局、版本与依赖，是项目材料所在之处。',
    feedbackColor: BLUE,
  },
  {
    id: 'bridge',
    name: '协议桥',
    color: ORANGE,
    duty: '能不能改',
    input: '智能体的读写请求',
    output: '经校验的变更与日志',
    sentence: '协议桥：检查智能体的读写——权限、操作格式、校验与日志都在这里。',
    feedbackColor: ORANGE,
  },
  {
    id: 'runtime',
    name: '智能体运行时',
    color: BLUE,
    duty: '怎么改',
    input: '当前请求与画布状态',
    output: '获授权动作与工具调用',
    sentence: '智能体运行时：选择获授权动作、调用工具、同步状态并记录轨迹。',
    feedbackColor: BLUE,
  },
];

const DEFAULT_FEEDBACK = '点击任意一层，查看它在一次创作里负责什么。';
const TRACED_FEEDBACK = '加入轨迹记录后，请求、动作、观测、反馈与检查点都可被检视和恢复。';

const VARIANTS: { id: Variant; name: string }[] = [
  { id: 'base', name: '基础三层' },
  { id: 'traced', name: '三层 + 轨迹记录' },
];

interface ArchState {
  layer: LayerId | null;
  variant: Variant;
  hover: LayerId | null;
}

function layerY(id: LayerId): number {
  if (id === 'runtime') return Y_RUNTIME;
  if (id === 'bridge') return Y_BRIDGE;
  return Y_STATE;
}

function activePathOf(layer: LayerId | null): LayerId[] {
  if (layer === 'state') return ['state', 'bridge'];
  if (layer === 'bridge') return ['state', 'bridge', 'runtime'];
  if (layer === 'runtime') return ['bridge', 'runtime'];
  return [];
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
    { color: BLUE, text: '画布状态层' },
    { color: ORANGE, text: '协议桥' },
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

/** 线圈图标：织片的最小单位，画在三层底板的左侧。 */
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

/** 活跃路径上的竖直连线，带方向箭头。 */
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxChars: number,
  lineHeight: number,
  maxLines: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let line = '';
  let row = 0;
  for (let i = 0; i < text.length; i++) {
    line += text[i];
    if (line.length >= maxChars || i === text.length - 1) {
      if (row >= maxLines) break;
      ctx.fillText(line, x, y + row * lineHeight);
      row += 1;
      line = '';
    }
  }
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, s: ArchState, time: number): void {
  clearScene(ctx);

  const path = activePathOf(s.layer);
  const litGap1 = path.indexOf('state') >= 0 && path.indexOf('bridge') >= 0;
  const litGap2 = path.indexOf('bridge') >= 0 && path.indexOf('runtime') >= 0;

  // 三层底板（自下而上：画布状态层 → 协议桥 → 智能体运行时）
  const order: LayerId[] = ['state', 'bridge', 'runtime'];
  order.forEach((id) => {
    const def = LAYERS.find((l) => l.id === id);
    if (!def) return;
    const y = layerY(id);
    const selected = s.layer === id;
    const hovered = s.hover === id;
    const inPath = path.indexOf(id) >= 0;

    ctx.save();
    if (selected) {
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
    } else if (inPath) {
      ctx.fillStyle = 'rgba(39,68,110,0.05)';
    } else if (hovered) {
      ctx.fillStyle = 'rgba(184,201,167,0.22)';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    roundRectPath(ctx, LAYER_X, y, LAYER_W, LAYER_H, 8);
    ctx.fill();
    ctx.strokeStyle = selected ? def.color : inPath ? def.color : hovered ? YARN : LINE;
    ctx.lineWidth = selected ? 4 : inPath ? 2.5 : 2;
    ctx.stroke();
    ctx.restore();

    drawKnit(ctx, LAYER_X + 26, y + LAYER_H / 2, selected || inPath ? def.color : LINE);

    ctx.save();
    ctx.textAlign = 'left';
    ctx.fillStyle = selected || inPath ? def.color : INK;
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText(def.name, LAYER_X + 48, y + 32);
    ctx.textAlign = 'right';
    ctx.fillStyle = SUB;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillText(def.duty, LAYER_X + LAYER_W - 18, y + 31);
    ctx.restore();
  });

  // 活跃路径连线：左侧写回（向下）、右侧读取（向上）
  drawArrowV(ctx, SPINE_LEFT, Y_BRIDGE + LAYER_H, Y_STATE, litGap1);
  drawArrowV(ctx, SPINE_RIGHT, Y_STATE, Y_BRIDGE + LAYER_H, litGap1);
  drawArrowV(ctx, SPINE_LEFT, Y_RUNTIME + LAYER_H, Y_BRIDGE, litGap2);
  drawArrowV(ctx, SPINE_RIGHT, Y_BRIDGE, Y_RUNTIME + LAYER_H, litGap2);

  // 轨迹虚线带（仅在 traced 变体下出现）
  if (s.variant === 'traced') {
    ctx.save();
    ctx.fillStyle = 'rgba(124,58,237,0.08)';
    roundRectPath(ctx, LAYER_X, TRAIL_Y, LAYER_W, TRAIL_H, 6);
    ctx.fill();
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -((time / 70) % 12);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = PURPLE;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('轨迹记录：请求 / 动作 / 观测 / 反馈 / 检查点', LAYER_X + 12, TRAIL_Y + 18);
    ctx.restore();

    (['state', 'bridge', 'runtime'] as LayerId[]).forEach((id) => {
      const y = layerY(id);
      ctx.save();
      ctx.fillStyle = PURPLE;
      roundRectPath(ctx, LAYER_X + LAYER_W + 12, y + LAYER_H / 2 - 6, 12, 12, 3);
      ctx.fill();
      ctx.restore();
    });
  }

  // 固定输入输出面板
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  roundRectPath(ctx, IO_X, Y_RUNTIME, IO_W, Y_STATE + LAYER_H - Y_RUNTIME, 8);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const current = s.layer ? LAYERS.find((l) => l.id === s.layer) ?? null : null;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = current ? current.color : SUB;
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.fillText(current ? current.name : '请选择一层', IO_X + 16, Y_RUNTIME + 32);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(IO_X + 16, Y_RUNTIME + 44);
  ctx.lineTo(IO_X + IO_W - 16, Y_RUNTIME + 44);
  ctx.stroke();
  ctx.restore();

  if (!current) {
    wrapText(ctx, '点击任意一层，查看它的输入与输出。', IO_X + 16, Y_RUNTIME + 78, 15, 22, 3, SUB);
  } else {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = SUB;
    ctx.fillText('输入', IO_X + 16, Y_RUNTIME + 72);
    ctx.fillText('输出', IO_X + 16, Y_RUNTIME + 134);
    ctx.restore();
    wrapText(ctx, current.input, IO_X + 16, Y_RUNTIME + 94, 15, 21, 2, INK);
    wrapText(ctx, current.output, IO_X + 16, Y_RUNTIME + 156, 15, 21, 2, INK);
  }

  drawLabel(ctx, '三层架构', LAYER_X, 22, INK);
  drawLabel(ctx, '输入 / 输出', IO_X, 22, INK);
  drawLegend(ctx, LAYER_X, 272);
}

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ArchState>({ layer: null, variant: 'base', hover: null });
  const rafRef = useRef<number | null>(null);
  const [layer, setLayer] = useState<LayerId | null>(null);
  const [variant, setVariant] = useState<Variant>('base');
  const [feedback, setFeedback] = useState<{ text: string; cls: string; color: string }>({
    text: DEFAULT_FEEDBACK,
    cls: '',
    color: '',
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

    const tick = () => {
      render(ctx, stateRef.current, performance.now());
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

  const selectLayer = (id: LayerId) => {
    const def = LAYERS.find((l) => l.id === id);
    if (!def) return;
    stateRef.current.layer = id;
    setLayer(id);
    setFeedback({ text: def.sentence, cls: '', color: def.feedbackColor });
  };

  const selectVariant = (v: Variant) => {
    stateRef.current.variant = v;
    setVariant(v);
    if (v === 'traced') {
      setFeedback({ text: TRACED_FEEDBACK, cls: '', color: PURPLE });
      return;
    }
    const cur = stateRef.current.layer;
    const def = cur ? LAYERS.find((l) => l.id === cur) ?? null : null;
    if (def) {
      setFeedback({ text: def.sentence, cls: '', color: def.feedbackColor });
    } else {
      setFeedback({ text: DEFAULT_FEEDBACK, cls: '', color: '' });
    }
  };

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const layerAt = (x: number, y: number): LayerId | null => {
    for (const def of LAYERS) {
      const ly = layerY(def.id);
      if (x >= LAYER_X && x <= LAYER_X + LAYER_W && y >= ly && y <= ly + LAYER_H) return def.id;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const id = layerAt(p.x, p.y);
    if (id) selectLayer(id);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    stateRef.current.hover = layerAt(p.x, p.y);
  };

  const onPointerLeave = () => {
    stateRef.current.hover = null;
  };

  const current = layer ? LAYERS.find((l) => l.id === layer) ?? null : null;
  const pathLength = activePathOf(layer).length;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      />
      <div className="chip-row">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`chip${layer === l.id ? ' selected' : ''}`}
            onClick={() => selectLayer(l.id)}
          >
            {l.name}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`chip${variant === v.id ? ' selected' : ''}`}
            onClick={() => selectVariant(v.id)}
          >
            {v.name}
          </button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前图层</div>
          <div className="v">{current ? current.name : '未选中'}</div>
        </div>
        <div className="metric">
          <div className="l">变体</div>
          <div className="v">{variant === 'traced' ? '三层 + 轨迹' : '基础三层'}</div>
        </div>
        <div className="metric">
          <div className="l">活跃路径</div>
          <div className="v">{pathLength} / 3 层</div>
        </div>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        style={feedback.color ? { color: feedback.color, borderLeftColor: feedback.color } : undefined}
      >
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch8Arch;
