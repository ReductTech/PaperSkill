import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  inset,
  label,
  bar,
  drawArrow,
  drawNeck,
  drawGuitar,
  drawPitchMark,
  drawString,
  drawTape,
  drawGrip,
} from './scene';

const W = 1080;
const H = 280;

/* 三根弦的几何：弦端固定在 222..554，间距 34 保证命中区互不重叠 */
const STRING_X1 = 222;
const STRING_X2 = 554;
const STRING_Y = [90, 124, 158];
const MAX_TASKS = 5;

type Feedback = { text: string; cls: string };
type Pull = { active: boolean; x: number; y: number; idx: number };
type DriftState = { tasks: number; pull: Pull; ring: number };

/* ------------------------------------------------------------------ *
 * §1 顺序到来的数据为什么会走音 —— 拨弦（直接操纵）
 * ------------------------------------------------------------------ */

const driftFeedback = (t: number): Feedback => {
  if (t === 1) return { text: '两段还能对齐。', cls: '' };
  if (t <= 3) return { text: '新琴开始偏了，旧录音没变。', cls: '' };
  return { text: '偏差继续累积，旧任务的表征已经被改写。', cls: 'bad' };
};

export const Ch1Drift: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<DriftState>({
    tasks: 1,
    pull: { active: false, x: (STRING_X1 + STRING_X2) / 2, y: STRING_Y[1], idx: -1 },
    ring: 0,
  });
  const fbKeyRef = useRef('');
  const [tasks, setTasks] = useState(1);
  const [feedback, setFeedback] = useState<Feedback>(driftFeedback(1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = 0;

    const render = (s: DriftState, time: number) => {
      clearScene(ctx, W, H);
      const drift = (s.tasks - 1) / (MAX_TASKS - 1);
      const markColor = s.tasks === 1 ? C.blue : s.tasks <= 3 ? C.orange : C.red;

      // 目标刻度：音准标记相对它向右偏移，偏移量随任务数增长
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(300, 8);
      ctx.lineTo(300, 44);
      ctx.stroke();
      ctx.restore();
      drawPitchMark(ctx, 300 + drift * 150, 20, markColor);

      // 琴与琴颈
      drawGuitar(ctx, 12, 84, 210, 128, { active: true });
      drawNeck(ctx, 214, 74, 348, 100);

      // 三根弦：被拨的那根按下时跟着指针弯，松手后衰减振动
      for (let i = 0; i < STRING_Y.length; i++) {
        const y = STRING_Y[i];
        const plucked = s.pull.idx === i;
        let ctlX = (STRING_X1 + STRING_X2) / 2;
        let ctlY = y;
        if (plucked) {
          if (s.pull.active) {
            ctlX = s.pull.x;
            ctlY = s.pull.y;
          } else {
            const amp = clamp(s.pull.y - y, -60, 40) * 1.4;
            const elapsed = (1 - s.ring) * 900;
            ctlY = y + amp * Math.cos(elapsed / 34) * s.ring;
          }
        }
        const color = plucked && s.pull.active ? C.orange : i % 2 === 0 ? C.muted : C.dark;
        drawString(ctx, STRING_X1, STRING_X2, y, ctlX, ctlY, color, 2.5);
      }

      // 拖拽提示：弦中点的手柄 + 向下的短箭头（不写字）
      if (!s.pull.active) {
        const hx = (STRING_X1 + STRING_X2) / 2;
        const pulse = 1 + Math.sin(time / 420) * 0.12;
        drawGrip(ctx, hx, STRING_Y[0], C.orange, 7 * pulse);
        drawArrow(ctx, hx, STRING_Y[0] + 14, hx, STRING_Y[0] + 30, C.orange, 2, 8);
      }

      // 旧录音：位置恒定，不随拨弦移动
      drawTape(ctx, 236, 204, 320, 44, false);

      // 右区白底数据区：论文表 2 的真实数值，固定不变。
      // 三行是 SimCLR 的微调 / CaSSLe / 离线；少了 CaSSLe 就只剩一个「差很远」的印象。
      inset(ctx, 650, 28, 400, 224);
      label(ctx, 'SimCLR · CIFAR100', 678, 58, 12, C.muted);
      label(ctx, '微调', 678, 104, 13, C.muted);
      bar(ctx, 722, 92, 264, 24, 48.9, 65.8, C.red, '48.9');
      label(ctx, 'CaSSLe', 678, 144, 13, C.blue);
      bar(ctx, 722, 132, 264, 24, 58.3, 65.8, C.blue, '58.3');
      label(ctx, '离线', 678, 184, 13, C.muted);
      bar(ctx, 722, 172, 264, 24, 65.8, 65.8, C.wood, '65.8');
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      const dt = last ? Math.min(48, t - last) : 16;
      last = t;
      if (s.ring > 0) s.ring = Math.max(0, s.ring - dt / 900);
      render(s, t);
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

  const pushFeedback = (f: Feedback) => {
    const key = `${f.cls}|${f.text}`;
    if (fbKeyRef.current === key) return;
    fbKeyRef.current = key;
    setFeedback(f);
  };

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    const idx = STRING_Y.findIndex(
      (sy) => Math.abs(p.y - sy) < 16 && p.x >= STRING_X1 && p.x <= STRING_X2
    );
    if (idx < 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    stateRef.current.pull = {
      active: true,
      idx,
      x: clamp(p.x, STRING_X1 + 24, STRING_X2 - 24),
      y: STRING_Y[idx],
    };
    pushFeedback({ text: '按住往下拉，弦绷紧后松手。', cls: '' });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.pull.active) return;
    const p = toCanvas(e);
    const sy = STRING_Y[s.pull.idx];
    s.pull = {
      active: true,
      idx: s.pull.idx,
      x: clamp(p.x, STRING_X1 + 24, STRING_X2 - 24),
      y: clamp(p.y, sy - 60, sy + 40),
    };
    const depth = Math.abs(s.pull.y - sy);
    pushFeedback(
      depth < 12
        ? { text: '再往下拉一点，弦还没绷紧。', cls: '' }
        : { text: '松手让弦回弹，音准标记会再右移一格。', cls: '' }
    );
  };

  const endPluck = () => {
    const s = stateRef.current;
    if (!s.pull.active) return;
    const sy = STRING_Y[s.pull.idx];
    const amp = s.pull.y - sy;
    const next = Math.min(MAX_TASKS, s.tasks + 1);
    s.tasks = next;
    s.ring = 1;
    s.pull = {
      active: false,
      idx: s.pull.idx,
      x: s.pull.x,
      y: sy + (Math.abs(amp) < 14 ? 14 : amp),
    };
    setTasks(next);
    pushFeedback(driftFeedback(next));
  };

  const pluckByButton = () => {
    const s = stateRef.current;
    const next = Math.min(MAX_TASKS, s.tasks + 1);
    s.tasks = next;
    s.ring = 1;
    s.pull = {
      active: false,
      idx: 1,
      x: (STRING_X1 + STRING_X2) / 2,
      y: STRING_Y[1] + 26,
    };
    setTasks(next);
    pushFeedback(driftFeedback(next));
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
        onPointerUp={endPluck}
        onPointerCancel={endPluck}
        onLostPointerCapture={endPluck}
      />
      <div className="ctrl">
        <label>
          已到达任务数 <span className="val">{tasks}</span>
        </label>
        <button
          type="button"
          onClick={pluckByButton}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            color: C.muted,
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            cursor: 'pointer',
          }}
        >
          拨一下
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
