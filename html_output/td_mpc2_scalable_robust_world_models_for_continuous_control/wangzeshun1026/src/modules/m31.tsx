import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawSceneLabel,
  drawLegend,
  GUIDE,
  EMPH,
  AUX,
  INK,
  LINE,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 3.1 可点击架构图：五个节点，右侧固定详情区显示每个部件的输入与输出。
const W = 1080;
const H = 280;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface NodeDef {
  chip: string;
  inp: string;
  out: string;
  formula: string;
  note: string;
  fb: { text: string; cls: string };
  box: Box;
}

const NODES: NodeDef[] = [
  {
    chip: '编码器',
    inp: '观测 s + 任务嵌入 e',
    out: '隐状态 z（5M 版 512 维）',
    formula: 'z = h(s, e)',
    note: '不解码回观测，只保留对控制有用的部分。',
    fb: { text: '编码器把观测和 96 维任务嵌入压成隐状态 z，不还原画面。', cls: '' },
    box: { x: 92, y: 88, w: 132, h: 96 },
  },
  {
    chip: '隐动力学',
    inp: 'z + a + e',
    out: '下一步隐状态 z′',
    formula: 'z′ = d(z, a, e)',
    note: '规划时在隐空间里前推，不必生成未来画面。',
    fb: { text: '隐动力学在隐空间前推一步：z′ = d(z,a,e)。规划靠它试算，不用生成画面。', cls: '' },
    box: { x: 372, y: 16, w: 196, h: 54 },
  },
  {
    chip: '奖励',
    inp: 'z + a + e',
    out: '奖励预测 r̂',
    formula: 'r̂ = R(z, a, e)',
    note: '给每条候选动作序列打分。',
    fb: { text: '奖励头直接预测 r̂ = R(z,a,e)，为候选动作序列打分。', cls: '' },
    box: { x: 372, y: 80, w: 196, h: 54 },
  },
  {
    chip: '价值',
    inp: 'z + a + e',
    out: '终端价值 q̂',
    formula: 'q̂ = Q(z, a, e)',
    note: '5M 版集成 5 个 Q 函数，dropout 1%。',
    fb: { text: '价值头预测 q̂ = Q(z,a,e)；5M 版用 5 个 Q 函数，dropout 1%。', cls: '' },
    box: { x: 372, y: 144, w: 196, h: 54 },
  },
  {
    chip: '策略先验',
    inp: '隐状态 z + 任务嵌入 e',
    out: '候选动作分布',
    formula: '',
    note: '规划时从策略先验采样 24 条。',
    fb: { text: '策略先验提供候选动作；规划时从中采样 24 条。', cls: '' },
    box: { x: 372, y: 208, w: 196, h: 54 },
  },
];

const HUB = { x: 300, y: 136, r: 18 };

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(a - 0.42), y2 - 8 * Math.sin(a - 0.42));
  ctx.lineTo(x2 - 8 * Math.cos(a + 0.42), y2 - 8 * Math.sin(a + 0.42));
  ctx.closePath();
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? 11 : 4.5;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawIcon(ctx: CanvasRenderingContext2D, i: number, cx: number, cy: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (i === 0) {
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy - 6);
    ctx.lineTo(cx - 11, cy + 6);
    ctx.moveTo(cx - 4, cy - 11);
    ctx.lineTo(cx - 4, cy + 11);
    ctx.moveTo(cx + 3, cy - 8);
    ctx.lineTo(cx + 3, cy + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 11, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (i === 1) {
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy);
    ctx.lineTo(cx + 9, cy);
    ctx.moveTo(cx + 2, cy - 6);
    ctx.lineTo(cx + 9, cy);
    ctx.lineTo(cx + 2, cy + 6);
    ctx.stroke();
  } else if (i === 2) {
    star(ctx, cx, cy, color);
  } else if (i === 3) {
    ctx.fillRect(cx - 11, cy - 8, 22, 4);
    ctx.fillRect(cx - 11, cy - 2, 16, 4);
    ctx.fillRect(cx - 11, cy + 4, 10, 4);
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 8);
    ctx.lineTo(cx + 10, cy - 8);
    ctx.moveTo(cx - 10, cy + 8);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx - 10, cy + 8);
    ctx.lineTo(cx + 10, cy + 8);
    ctx.stroke();
  }
}

function render(ctx: CanvasRenderingContext2D, sel: number, now: number): void {
  clearScene(ctx, W, H);

  // 动作作为共享输入：一条虚线总线接到三个头
  const aX = 332;
  const aY = 244;
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = EMPH;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(aX + 8, aY - 5);
  ctx.lineTo(352, 190);
  ctx.moveTo(352, 190);
  ctx.lineTo(352, 62);
  ctx.stroke();
  for (const cy of [62, 126, 190]) {
    ctx.beginPath();
    ctx.moveTo(352, cy);
    ctx.lineTo(366, cy);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // 主路径
  const encCy = NODES[0].box.y + NODES[0].box.h / 2;
  arrow(ctx, NODES[0].box.x + NODES[0].box.w, encCy, HUB.x - HUB.r, HUB.y, sel === 0 ? EMPH : GUIDE, sel === 0 ? 2.5 : 1.6);
  for (let i = 1; i < NODES.length; i++) {
    const b = NODES[i].box;
    arrow(ctx, HUB.x + HUB.r, HUB.y, b.x - 4, b.y + b.h / 2, sel === i ? EMPH : GUIDE, sel === i ? 2.5 : 1.6);
  }

  // 五个节点
  for (let i = 0; i < NODES.length; i++) {
    const b = NODES[i].box;
    if (sel === i) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 260);
      ctx.strokeStyle = 'rgba(240,126,71,' + (0.18 + 0.25 * pulse) + ')';
      ctx.lineWidth = 7;
      ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
    }
    ctx.fillStyle = i === sel ? 'rgba(240,126,71,0.07)' : 'rgba(255,255,255,0.72)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = i === sel ? EMPH : LINE;
    ctx.lineWidth = i === sel ? 2.4 : 1.4;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

    drawIcon(ctx, i, b.x + 24, b.y + b.h / 2, i === sel ? EMPH : INK);
    if (i === sel) {
      drawSceneLabel(ctx, NODES[i].chip, b.x + 46, b.y + b.h / 2 + 6, EMPH);
    }
  }

  // 输入 token：状态 s、任务 e
  ctx.fillStyle = GUIDE;
  ctx.fillRect(40, 96, 26, 22);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(43, 99, 20, 16);

  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = AUX;
    ctx.globalAlpha = i === 2 ? 1 : 0.55;
    ctx.fillRect(40, 156 + i * 11, 26, 8);
    ctx.globalAlpha = 1;
  }

  // 动作 token
  ctx.fillStyle = EMPH;
  ctx.beginPath();
  ctx.arc(aX, aY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(aX - 2, aY - 2, 2.4, 0, Math.PI * 2);
  ctx.fill();

  arrow(ctx, 66, 107, NODES[0].box.x - 2, NODES[0].box.y + 26, GUIDE, 1.4);
  arrow(ctx, 66, 171, NODES[0].box.x - 2, NODES[0].box.y + 64, GUIDE, 1.4);

  // 隐状态枢纽
  ctx.fillStyle = 'rgba(39,68,110,0.12)';
  ctx.strokeStyle = GUIDE;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(HUB.x, HUB.y, HUB.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GUIDE;
  ctx.beginPath();
  ctx.arc(HUB.x, HUB.y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  drawSceneLabel(ctx, '隐状态 z', 246, 92, GUIDE);
  drawLegend(
    ctx,
    [
      { color: GUIDE, text: '状态 s' },
      { color: EMPH, text: '动作 a' },
      { color: AUX, text: '任务 e' },
    ],
    40,
    274
  );
}

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ sel: 0 });
  const [sel, setSel] = useState(0);
  const [feedback, setFeedback] = useState(NODES[0].fb);

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
      const now = performance.now();
      render(ctx, clamp(stateRef.current.sel, 0, NODES.length - 1), now);
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
    stateRef.current.sel = i;
    setSel(i);
    setFeedback(NODES[i].fb);
  };

  const hitNode = (e: React.MouseEvent<HTMLCanvasElement>): number => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return NODES.findIndex(
      (n) => x >= n.box.x && x <= n.box.x + n.box.w && y >= n.box.y && y <= n.box.y + n.box.h
    );
  };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.cursor = hitNode(e) >= 0 ? 'pointer' : 'default';
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const i = hitNode(e);
    if (i >= 0) select(i);
  };

  const node = NODES[sel];

  return (
    <div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          <canvas
            id={`cv-${chapterId}-${moduleId}`}
            ref={canvasRef}
            width={W}
            height={H}
            onClick={onClick}
            onMouseMove={onMove}
            onMouseLeave={() => {
              const canvas = canvasRef.current;
              if (canvas) canvas.style.cursor = 'default';
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '1.6%',
              top: '6%',
              width: '24%',
              height: '88%',
              overflow: 'auto',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.94)',
              border: '1px solid #d7deea',
              borderLeft: '3px solid #f07e47',
              borderRadius: 8,
              color: '#21324a',
              fontSize: 'clamp(9px, 1.15vw, 14px)',
              lineHeight: 1.6,
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 700, color: '#f07e47', borderBottom: '1px solid #eef1f6', paddingBottom: 4, marginBottom: 6 }}>
              {node.chip}
            </div>
            <div>
              <span style={{ color: '#68778f' }}>输入 </span>
              {node.inp}
            </div>
            <div style={{ color: '#f07e47', lineHeight: 1.1 }}>↓</div>
            <div>
              <span style={{ color: '#68778f' }}>输出 </span>
              {node.out}
            </div>
            {node.formula ? (
              <div style={{ marginTop: 4, color: '#27446e', fontFamily: 'ui-monospace, Consolas, monospace' }}>
                {node.formula}
              </div>
            ) : null}
            <div style={{ marginTop: 6, color: '#68778f' }}>{node.note}</div>
          </div>
        </div>
      </div>
      <div className="chip-row" style={{ marginTop: 12 }}>
        {NODES.map((n, i) => (
          <button
            key={n.chip}
            className={'chip' + (sel === i ? ' selected' : '')}
            onClick={() => select(i)}
          >
            {n.chip}
          </button>
        ))}
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M31;
