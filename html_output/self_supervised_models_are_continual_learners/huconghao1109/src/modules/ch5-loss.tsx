// §5 换一个校音法：旋转旋钮选择蒸馏目标，右侧给出趋势与真实结果。
import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, inset, label, bar, drawBox, drawKnob } from './scene';

const W = 1080;
const H = 280;

const KNOB = { cx: 190, cy: 142, r: 76 };
const TICKS = [-135, -45, 45, 135];

type Feedback = { text: string; cls: string };
type LossMode = 0 | 1 | 2 | 3;
type LossState = { angle: number; mode: LossMode; drag: { active: boolean } };

const MODE_NAMES = ['关掉蒸馏', '同一损失', '换一种损失', '加权重'];

const MODE_FEEDBACK: Record<LossMode, Feedback> = {
  0: { text: '关掉蒸馏就退回普通微调，旧任务很快被覆盖。', cls: 'bad' },
  1: { text: '同一损失换一对输入，不需要为新目标设计目标函数。', cls: 'good' },
  2: { text: '换成别的损失，三种方法都低于自己的损失。', cls: '' },
  3: { text: '多出一个要调的系数，论文没有做加权实验，表里都是不加权的数。', cls: 'bad' },
};

// 附录表 F：CIFAR100 两任务类别增量，top-1，列序 InfoNCE / 互相关 / MSE。
const COLS = ['InfoNCE', '互相关', 'MSE'];
const COL_X = [470, 660, 850];
const BAR_W = 120;
const TABLE_MAX = 70;
const ROWS = [
  { name: 'SimCLR', v: [61.8, 60.1, 61.3] },
  { name: 'Barlow Twins', v: [64.5, 67.2, 64.6] },
  { name: 'BYOL', v: [64.8, 65.8, 66.7] },
];

const nearestMode = (deg: number): LossMode => {
  let best: LossMode = 0;
  let bestGap = Infinity;
  TICKS.forEach((a, i) => {
    const gap = Math.abs(a - deg);
    if (gap < bestGap) {
      bestGap = gap;
      best = i as LossMode;
    }
  });
  return best;
};

export const Ch5Loss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<LossState>({ angle: -45, mode: 1, drag: { active: false } });
  const [mode, setMode] = useState<LossMode>(1);
  const [feedback, setFeedback] = useState<Feedback>(MODE_FEEDBACK[1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: LossState, time: number) => {
      clearScene(ctx, W, H);
      const accent = s.mode === 1 ? C.green : s.mode === 2 ? C.orange : C.red;

      // 左：可旋转的大旋钮，四个档位刻度。
      inset(ctx, 20, 14, 268, 252);
      label(ctx, MODE_NAMES[s.mode], KNOB.cx, 46, 14, accent, 'center');
      drawKnob(ctx, KNOB.cx, KNOB.cy, KNOB.r, (s.angle * Math.PI) / 180, TICKS.length, s.mode);
      label(ctx, '拖动', KNOB.cx, 250, 12, C.muted, 'center');

      // 右上：两条随训练推进的下降曲线，纯示意，不标任何数值。
      inset(ctx, 300, 14, 760, 112);
      const x0 = 330;
      const x1 = 1030;
      const yOf = (v: number) => 112 - 78 * clamp(v, 0.02, 1);

      const pairOf = (t: number): [number, number] => {
        const a = 1 - 0.72 * t;
        if (s.mode === 0) return [a, 1 - 0.2 * t];
        if (s.mode === 1) return [a, 1 - 0.7 * t];
        if (s.mode === 2) return [a, clamp(a + 0.22 * Math.sin(t * Math.PI * 3), 0.05, 1)];
        return [a, clamp(a + 0.1 + 0.06 * Math.sin(t * Math.PI * 4), 0.05, 1)];
      };

      const drawCurve = (idx: 0 | 1, color: string) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
          const t = i / 64;
          const px = x0 + (x1 - x0) * t;
          const py = yOf(pairOf(t)[idx]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      };
      drawCurve(0, C.blue);
      drawCurve(1, accent);

      const p = (time % 3200) / 3200;
      drawBox(ctx, x0 + (x1 - x0) * p - 3, yOf(pairOf(p)[1]) - 3, 6, 6, accent, undefined, 3);

      if (s.mode === 3) {
        // 多出来的权重系数。
        drawBox(ctx, 984, 30, 26, 26, C.orange, undefined, 13);
        label(ctx, 'w', 997, 43, 13, C.white, 'center');
      }

      // 右下：固定真实值。高亮按「每行自己的损失」走，也就是对角线，
      // 不能按整列高亮：Barlow 用 InfoNCE 只有 64.5，低于它自己的 67.2。
      inset(ctx, 300, 134, 760, 132);
      const dim = s.mode === 0 || s.mode === 3;
      const tone = (r: number, c: number): 0 | 1 | 2 => {
        if (s.mode === 1) return c === r ? 2 : 0;
        if (s.mode === 2) return c === r ? 0 : 1;
        return 0;
      };
      ctx.save();
      if (dim) ctx.globalAlpha = 0.42;
      for (let c = 0; c < 3; c++) {
        label(ctx, COLS[c], COL_X[c] + BAR_W / 2, 152, 12, C.muted, 'center');
      }
      for (let r = 0; r < 3; r++) {
        const by = 170 + r * 32;
        label(ctx, ROWS[r].name, 316, by + 8, 12, C.ink);
        for (let c = 0; c < 3; c++) {
          const t = tone(r, c);
          const color = t === 2 ? C.green : t === 1 ? C.orange : C.light;
          bar(
            ctx,
            COL_X[c],
            by,
            BAR_W,
            16,
            ROWS[r].v[c],
            TABLE_MAX,
            color,
            ROWS[r].v[c].toFixed(1)
          );
        }
      }
      ctx.restore();
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const applyAngle = (deg: number, active: boolean) => {
    const a = clamp(deg, -135, 135);
    const m = nearestMode(a);
    stateRef.current = { angle: a, mode: m, drag: { active } };
    setMode(m);
    setFeedback(MODE_FEEDBACK[m]);
  };

  const localPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * W) / rect.width,
      y: ((clientY - rect.top) * H) / rect.height,
    };
  };

  const angleAt = (clientX: number, clientY: number): number => {
    const p = localPoint(clientX, clientY);
    const deg = (Math.atan2(p.y - KNOB.cy, p.x - KNOB.cx) * 180) / Math.PI;
    return clamp(deg, -135, 135);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = localPoint(e.clientX, e.clientY);
    const dx = p.x - KNOB.cx;
    const dy = p.y - KNOB.cy;
    if (Math.hypot(dx, dy) > KNOB.r + 20) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    applyAngle(angleAt(e.clientX, e.clientY), true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.drag.active) return;
    applyAngle(angleAt(e.clientX, e.clientY), true);
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.drag.active) return;
    // 松手吸附到最近档位。
    const m = stateRef.current.mode;
    stateRef.current = { angle: TICKS[m], mode: m, drag: { active: false } };
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* 指针已释放 */
    }
  };

  const select = (m: LossMode) => {
    stateRef.current = { angle: TICKS[m], mode: m, drag: { active: false } };
    setMode(m);
    setFeedback(MODE_FEEDBACK[m]);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      />
      <div className="chip-row">
        {MODE_NAMES.map((name, i) => (
          <button
            key={name}
            className={`chip${mode === i ? ' selected' : ''}`}
            onClick={() => select(i as LossMode)}
            aria-pressed={mode === i}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
