import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 模块 2.2「以画布为中心的创作循环」（1080×280，环状图 + 三个可点击环节）
// 命名区域：ring（x 40–620，圆心 330/150，半径 96 的三环节闭环）、info（x 700–1040，固定说明区）。
// 绘制顺序：clearScene → 虚线环 → 三条有向弧 → 环心画布 → 三个环节节点 → 流动光点 → 说明区。
// 三个环节的一句话职责严格对齐论文 Abstract / p.3 §1 第 5 段 / p.4 Figure 2 caption。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const GREEN = '#228d5c';
const INK = '#21324a';
const SUB = '#68778f';
const MUTED = '#a9b4c4';

const CX = 330;
const CY = 142;
const R = 84;
const NODE_R = 46;

type LoopId = 'state' | 'runtime' | 'bridge';

interface LoopDef {
  id: LoopId;
  name: string;
  /** 环上节点内的折行写法 */
  lines: string[];
  color: string;
  /** 环上位置（canvas 角度，度）。角度递增 = 顺时针。 */
  angle: number;
  /** 这一环做什么 —— 论文原意的一句话概述 */
  role: string;
  /** 它把什么交给下一环 */
  handoff: string;
}

// 环路方向：画布状态层 → 智能体运行时 → 协议桥 → 画布状态层
const LOOPS: LoopDef[] = [
  {
    id: 'state',
    name: '画布状态层',
    lines: ['画布', '状态层'],
    color: BLUE,
    angle: 150,
    role: '存储多模态产物、依赖、版本和用户选择',
    handoff: '把当前项目状态交给运行时读取',
  },
  {
    id: 'runtime',
    name: '智能体运行时',
    lines: ['智能体', '运行时'],
    color: BLUE,
    angle: 270,
    role: '规划、调用工具和技能，并更新画布产物',
    handoff: '把拟定的动作交给协议桥校验',
  },
  {
    id: 'bridge',
    name: '协议桥',
    lines: ['协议桥'],
    color: ORANGE,
    angle: 30,
    role: '验证授予的动作并控制画布读写',
    handoff: '把校验通过的变更写回画布状态层',
  },
];

const PROMPT = '点击环上的任意一环：看它做什么，又把什么交给下一环。';

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function posOf(deg: number): { x: number; y: number } {
  return { x: CX + R * Math.cos(rad(deg)), y: CY + R * Math.sin(rad(deg)) };
}

function loopOf(id: LoopId): LoopDef {
  return LOOPS.find((l) => l.id === id) ?? LOOPS[0];
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
  ctx.fillRect(0, 250, W, H - 250);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(W, 250);
  ctx.stroke();
}

/** 沿环画一条有向弧：从 a 到 b（角度递增方向），末端带箭头。 */
function drawArc(
  ctx: CanvasRenderingContext2D,
  a: number,
  b: number,
  color: string,
  width: number,
  alpha: number
): void {
  const r = R;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(CX, CY, r, rad(a), rad(b));
  ctx.stroke();

  // 箭头：落在 b 处，切线方向
  const tip = posOf(b);
  const tangent = rad(b + 90);
  const dirX = Math.cos(tangent);
  const dirY = Math.sin(tangent);
  const size = 9;
  ctx.beginPath();
  ctx.moveTo(tip.x + dirX * size, tip.y + dirY * size);
  ctx.lineTo(tip.x - dirY * size * 0.72 - dirX * size * 0.4, tip.y + dirX * size * 0.72 - dirY * size * 0.4);
  ctx.lineTo(tip.x + dirY * size * 0.72 - dirX * size * 0.4, tip.y - dirX * size * 0.72 - dirY * size * 0.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function render(
  ctx: CanvasRenderingContext2D,
  selected: LoopId | null,
  time: number,
  pulse: number
): void {
  clearScene(ctx);

  const active = selected ? loopOf(selected) : null;
  const activeIdx = selected ? LOOPS.findIndex((l) => l.id === selected) : -1;

  // 环的底衬
  ctx.save();
  ctx.strokeStyle = '#e3e8ef';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 三条有向弧：选中时把它出发的那条弧点亮
  const segs: [number, number][] = [
    [150, 270],
    [270, 390],
    [390, 510],
  ];
  segs.forEach(([a, b], i) => {
    const isOut = activeIdx === i;
    const dim = selected && !isOut;
    drawArc(
      ctx,
      a + 14,
      b - 14,
      isOut ? GREEN : dim ? MUTED : BLUE,
      isOut ? 7 : 4,
      isOut ? 1 : dim ? 0.28 : 0.62
    );
  });

  // 环心：画布
  ctx.save();
  roundRectPath(ctx, CX - 26, CY - 19, 52, 38, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = active ? GREEN : BLUE;
  ctx.lineWidth = active ? 3 : 2;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = active ? GREEN : INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('画布', CX, CY + 6);
  ctx.restore();

  // 沿环流动的光点
  const travel = ((time / 3600) % 1) * 360;
  const dot = posOf(travel);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(dot.x, dot.y, 5 + pulse * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 三个环节节点
  LOOPS.forEach((l) => {
    const p = posOf(l.angle);
    const isSel = selected === l.id;
    const isAny = selected !== null;
    ctx.save();
    ctx.globalAlpha = isSel || !isAny ? 1 : 0.42;
    ctx.beginPath();
    ctx.arc(p.x, p.y, NODE_R, 0, Math.PI * 2);
    ctx.fillStyle = isSel ? '#ffffff' : 'rgba(255,255,255,0.86)';
    ctx.fill();
    ctx.strokeStyle = l.color;
    ctx.lineWidth = isSel ? 5 : 2.5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = isSel || !isAny ? 1 : 0.5;
    ctx.fillStyle = l.color;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    if (l.lines.length === 1) {
      ctx.fillText(l.lines[0], p.x, p.y + 5);
    } else {
      ctx.fillText(l.lines[0], p.x, p.y - 2);
      ctx.fillText(l.lines[1], p.x, p.y + 17);
    }
    ctx.restore();
  });

  // 两个固定标签
  ctx.fillStyle = INK;
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('创作循环', 40, 26);
  ctx.fillText('当前环节', 700, 26);

  // 固定说明区
  ctx.save();
  roundRectPath(ctx, 700, 38, 340, 186, 8);
  ctx.fillStyle = 'rgba(230,234,217,0.6)';
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'left';
  if (!active) {
    ctx.fillStyle = SUB;
    ctx.font = '17px "Segoe UI", sans-serif';
    ctx.fillText('未选中', 722, 70);
    ctx.fillStyle = SUB;
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillText('点环上任意一环，', 722, 104);
    ctx.fillText('看它在循环里做什么。', 722, 126);
  } else {
    ctx.fillStyle = active.color;
    ctx.font = '700 20px "Segoe UI", sans-serif';
    ctx.fillText(active.name, 722, 70);

    ctx.fillStyle = SUB;
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('这一环做什么', 722, 100);
    ctx.fillStyle = INK;
    ctx.font = '16px "Segoe UI", sans-serif';
    // 职责按 15 字折行
    const chunks: string[] = [];
    for (let i = 0; i < active.role.length; i += 15) chunks.push(active.role.slice(i, i + 15));
    chunks.slice(0, 2).forEach((c, i) => ctx.fillText(c, 722, 124 + i * 22));

    ctx.fillStyle = SUB;
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('交给下一环', 722, 170 + (chunks.length > 2 ? 22 : 0));
    ctx.fillStyle = GREEN;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText(active.handoff, 722, 192 + (chunks.length > 2 ? 22 : 0));
  }
  ctx.restore();
}

export const Ch2Loop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const selRef = useRef<LoopId | null>(null);
  const [sel, setSel] = useState<LoopId | null>(null);
  const [feedback, setFeedback] = useState({ text: PROMPT, cls: '', color: '' });

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
      const pulse = (Math.sin(performance.now() / 420) + 1) / 2;
      render(ctx, selRef.current, performance.now(), pulse);
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

  const apply = (id: LoopId) => {
    const l = loopOf(id);
    selRef.current = id;
    setSel(id);
    setFeedback({ text: `${l.name}：${l.role}；${l.handoff}。`, cls: 'good', color: '' });
  };

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const pick = (x: number, y: number): LoopId | null => {
    let best: LoopId | null = null;
    let bestD = NODE_R + 6;
    LOOPS.forEach((l) => {
      const p = posOf(l.angle);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) {
        bestD = d;
        best = l.id;
      }
    });
    return best;
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const hit = pick(p.x, p.y);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = hit ? 'pointer' : 'default';
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const hit = pick(p.x, p.y);
    if (hit) apply(hit);
    else {
      selRef.current = null;
      setSel(null);
      setFeedback({ text: PROMPT, cls: '', color: '' });
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerMove={onMove}
        onPointerDown={onDown}
      />
      <div className="chip-row">
        {LOOPS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`chip ${sel === l.id ? 'selected' : ''}`}
            onClick={() => apply(l.id)}
          >
            {l.name}
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => {
            selRef.current = null;
            setSel(null);
            setFeedback({ text: PROMPT, cls: '', color: '' });
          }}
          style={sel === null ? { opacity: 0.55 } : undefined}
        >
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedback.color ? { color: feedback.color } : undefined}>
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch2Loop;
