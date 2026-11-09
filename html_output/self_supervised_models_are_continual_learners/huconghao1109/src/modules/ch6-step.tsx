import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawArrow, drawBox, drawNode, drawPlayhead, label } from './scene';
import type { NodeState } from './scene';

const W = 1080;
const H = 280;

/* 时间轴：0..4 连续位置，对应训练的五个阶段。 */
const AX0 = 120;
const AX1 = 960;
const AY = 248;

const xAt = (v: number): number => AX0 + ((AX1 - AX0) * clamp(v, 0, 4)) / 4;
const tAt = (x: number): number => clamp(((x - AX0) / (AX1 - AX0)) * 4, 0, 4);

const STEP_FB = [
  '两张增强视图就绪。',
  '当前编码器给出两个表征，先算本来的 SSL 损失。',
  '冻结编码器给出两个旧表征，不参与梯度。',
  '预测头把新表征投回旧空间，再算一次同一个损失。',
  '两项直接相加，没有系数。',
];

type StepState = { t: number; drag: { active: boolean } };

const stageOf = (t: number): number => clamp(Math.round(t) + 1, 1, 5);
const reveal = (t: number, k: number): number => clamp((t - (k - 1.6)) / 0.6, 0, 1);

/** 横向铺满的节点坐标：视图 → 当前编码器 → 损失/预测头 → 相加。 */
const G = {
  x1: { x: 40, y: 24, w: 120, h: 34 },
  x2: { x: 40, y: 92, w: 120, h: 34 },
  z1: { x: 230, y: 24, w: 110, h: 34 },
  z2: { x: 230, y: 92, w: 110, h: 34 },
  ls: { x: 370, y: 44, w: 100, h: 48 },
  g1: { x: 500, y: 24, w: 110, h: 34 },
  g2: { x: 500, y: 92, w: 110, h: 34 },
  ld: { x: 650, y: 44, w: 110, h: 48 },
  l: { x: 820, y: 44, w: 120, h: 48 },
  fb: { x: 230, y: 166, w: 110, h: 32 },
  zb1: { x: 390, y: 146, w: 100, h: 28 },
  zb2: { x: 390, y: 186, w: 100, h: 28 },
};

function polyArrow(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  width: number,
  head = true,
  dash: number[] = []
): void {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dash.length) ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();
  ctx.setLineDash([]);
  if (head) {
    const [x1, y1] = pts[pts.length - 2];
    const [x2, y2] = pts[pts.length - 1];
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(a - 0.42), y2 - 9 * Math.sin(a - 0.42));
    ctx.lineTo(x2 - 9 * Math.cos(a + 0.42), y2 - 9 * Math.sin(a + 0.42));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function renderTimeline(ctx: CanvasRenderingContext2D, s: StepState, time: number): void {
  clearScene(ctx, W, H);
  const t = clamp(s.t, 0, 4);
  const step = stageOf(t);
  const green = reveal(t, 5) > 0.55;
  const flow = green ? C.green : C.blue;
  const dist = green ? C.green : C.purple;
  const lw = (k: number): number => 2 + 1.1 * reveal(t, k);
  const fade = (k: number, fn: () => void): void => {
    const a = reveal(t, k);
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, a);
    fn();
    ctx.restore();
  };
  const nState = (): NodeState => (green ? 'success' : 'active');

  /* ---------------- 支路 ---------------- */
  fade(2, () => {
    drawArrow(ctx, 162, 41, 228, 41, flow, lw(2));
    drawArrow(ctx, 162, 109, 228, 109, flow, lw(2));
    drawArrow(ctx, 342, 41, 368, 62, flow, 2);
    drawArrow(ctx, 342, 109, 368, 82, flow, 2);
  });

  fade(4, () => {
    drawArrow(ctx, 342, 41, 498, 41, flow, lw(4));
    drawArrow(ctx, 342, 109, 498, 109, flow, lw(4));
    drawArrow(ctx, 612, 41, 648, 62, dist, lw(4));
    drawArrow(ctx, 612, 109, 648, 82, dist, lw(4));
  });

  // 冻结支路：复制 → 冻结 → 旧表征，灰色虚线，含 detach 断点。
  fade(3, () => {
    drawBox(ctx, 206, 138, 300, 92, C.white, C.border, 10);
    polyArrow(ctx, [[100, 126], [100, 182], [226, 182]], C.muted, 2, true, [6, 5]);
    ctx.save();
    ctx.fillStyle = C.bg;
    ctx.fillRect(140, 172, 22, 20);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(144, 188);
    ctx.lineTo(156, 176);
    ctx.moveTo(149, 190);
    ctx.lineTo(161, 178);
    ctx.stroke();
    ctx.restore();
    drawNode(ctx, G.fb.x, G.fb.y, G.fb.w, G.fb.h, 'f̄', 'frozen');
    drawNode(ctx, G.zb1.x, G.zb1.y, G.zb1.w, G.zb1.h, 'z̄1', 'frozen');
    drawNode(ctx, G.zb2.x, G.zb2.y, G.zb2.w, G.zb2.h, 'z̄2', 'frozen');
    drawArrow(ctx, 342, 176, 388, 162, C.muted, 2);
    drawArrow(ctx, 342, 190, 388, 200, C.muted, 2);
  });

  fade(4, () => {
    polyArrow(ctx, [[492, 160], [560, 160], [560, 120], [648, 120]], C.muted, 2, true);
    polyArrow(ctx, [[492, 200], [600, 200], [600, 126], [648, 126]], C.muted, 2, true);
  });

  // 两项直接相加，没有系数。L_SSL 的箭头从上方绕过 L_D，
  // 否则会被读成 L_SSL → L_D → L 的串联。
  fade(5, () => {
    polyArrow(ctx, [[474, 68], [474, 18], [786, 18], [786, 68]], C.green, 2.4, false);
    polyArrow(ctx, [[764, 68], [786, 68]], C.green, 2.4, false);
    drawArrow(ctx, 786, 68, 816, 68, C.green, 2.6);
    label(ctx, '+', 786, 94, 18, C.green, 'center');
  });

  /* ---------------- 节点 ---------------- */
  fade(1, () => {
    drawNode(ctx, G.x1.x, G.x1.y, G.x1.w, G.x1.h, 'x1', nState());
    drawNode(ctx, G.x2.x, G.x2.y, G.x2.w, G.x2.h, 'x2', nState());
  });
  fade(2, () => {
    drawNode(ctx, G.z1.x, G.z1.y, G.z1.w, G.z1.h, 'z1', nState());
    drawNode(ctx, G.z2.x, G.z2.y, G.z2.w, G.z2.h, 'z2', nState());
    drawNode(ctx, G.ls.x, G.ls.y, G.ls.w, G.ls.h, 'L_SSL', nState());
  });
  fade(4, () => {
    drawNode(ctx, G.g1.x, G.g1.y, G.g1.w, G.g1.h, 'g(z1)', nState());
    drawNode(ctx, G.g2.x, G.g2.y, G.g2.w, G.g2.h, 'g(z2)', nState());
    drawNode(ctx, G.ld.x, G.ld.y, G.ld.w, G.ld.h, 'L_D', nState());
    if (!green) drawBox(ctx, G.ld.x, G.ld.y, G.ld.w, G.ld.h, undefined, C.purple, 9);
  });
  fade(5, () => {
    drawNode(ctx, G.l.x, G.l.y, G.l.w, G.l.h, 'L', 'success');
  });

  /* ---------------- 时间轴 ---------------- */
  ctx.save();
  ctx.globalAlpha = 0.32;
  drawBox(ctx, AX0, AY - 3, AX1 - AX0, 6, C.light, undefined, 3);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.5;
  drawBox(ctx, AX0, AY - 3, Math.max(6, xAt(t) - AX0), 6, C.orange, undefined, 3);
  ctx.restore();
  label(ctx, '时间轴', 58, AY, 13, C.muted);

  for (let i = 0; i < 5; i++) {
    const x = xAt(i);
    const on = i + 1 <= step;
    ctx.save();
    ctx.fillStyle = on ? C.orange : C.white;
    ctx.strokeStyle = on ? C.orange : C.light;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, AY, on ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    label(ctx, String(i + 1), x, AY + 20, 11, on ? C.ink : C.muted, 'center');
  }

  const px = xAt(t);
  const pulse = 0.5 + 0.5 * Math.sin(time / 330);
  ctx.save();
  ctx.globalAlpha = s.drag.active ? 0.34 : 0.16;
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(px, 230, 8 + 4 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawPlayhead(ctx, px, 230, 262, C.orange);
  label(ctx, `${step} / 5`, 24, 14, 13, C.muted);
}

export const Ch6Step: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<StepState>({ t: 0, drag: { active: false } });
  const stepRef = useRef(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [t, setT] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEP_FB[0], cls: '' });

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
    const tick = (time: number) => {
      renderTimeline(ctx, stateRef.current, time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
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

  const commit = (v: number) => {
    const nt = clamp(v, 0, 4);
    stateRef.current = { t: nt, drag: stateRef.current.drag };
    setT(nt);
    const st = stageOf(nt);
    if (st !== stepRef.current) {
      stepRef.current = st;
      setFeedback({ text: STEP_FB[st - 1], cls: st === 5 ? 'good' : '' });
    }
  };

  const local = (el: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height),
    };
  };

  const endDrag = () => {
    if (!stateRef.current.drag.active) return;
    stateRef.current = { t: stateRef.current.t, drag: { active: false } };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const p = local(canvas, e.clientX, e.clientY);
    if (p.y < 214) return;
    canvas.setPointerCapture(e.pointerId);
    stateRef.current = { t: stateRef.current.t, drag: { active: true } };
    commit(tAt(p.x));
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.drag.active) return;
    const p = local(e.currentTarget, e.clientX, e.clientY);
    commit(tAt(p.x));
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.drag.active) return;
    const p = local(e.currentTarget, e.clientX, e.clientY);
    commit(tAt(p.x));
    endDrag();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 指针已被浏览器释放
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="训练五步示意图：拖动底部播放头推进阶段"
        style={{ touchAction: 'none', cursor: 'ew-resize' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onLostPointerCapture={endDrag}
      />
      <div className="ctrl" style={{ opacity: 0.72 }}>
        <label>
          时间轴 <span className="val">{t.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={4}
          step={0.01}
          value={t}
          onChange={(e) => commit(Number(e.target.value))}
          aria-label="训练阶段时间轴，0 到 4"
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
