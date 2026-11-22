import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawIndexCard,
  drawSlot,
  drawLabel,
  withAlpha,
  roundRect,
  pointerToCanvas,
  type Ctx,
} from './scene';

const W = 1080;
const H = 280;

const VALUES = ['景德镇', '乾隆六年', '缠枝纹', '瓷器', '很沉', '北京'];
const SLOT_NAMES = ['窑口', '底款', '纹样'];
const LEGAL: Record<number, string> = { 0: '景德镇', 1: '乾隆六年', 2: '缠枝纹' };

const valueRect = (i: number) => ({ x: 44 + i * 168, y: 226, w: 152, h: 32 });
const slotRect = (i: number) => ({ x: 452, y: 34 + i * 58, w: 560, h: 46 });

type State = {
  slots: (string | null)[];
  dragging: number;
  px: number;
  py: number;
  reject: number;
};

const inRect = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) =>
  p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({ slots: [null, null, null], dragging: -1, px: 0, py: 0, reject: -1 });
  const [feedback, setFeedback] = useState({ text: '三格都空着——先从下面拖一条线索进来。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: State, time: number) => {
      clearScene(ctx, W, H);

      drawIndexCard(ctx, 50, 38, 330, 132, { lines: 3, border: C.blue });
      drawLabel(ctx, 66, 62, '这件器物', C.ink, 13);

      ctx.save();
      ctx.strokeStyle = C.route;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(384, 104);
      ctx.lineTo(452, 104);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < 3; i++) {
        const r = slotRect(i);
        let st: 'idle' | 'valid' | 'reject' = 'idle';
        if (s.reject === i && time % 1 < 0.55) st = 'reject';
        else if (s.slots[i]) st = 'valid';
        drawSlot(ctx, r.x, r.y, r.w, r.h, st);
        drawLabel(ctx, r.x + 14, r.y + 24, SLOT_NAMES[i], C.muted, 12);
        if (s.slots[i]) {
          drawLabel(ctx, r.x + 76, r.y + 24, s.slots[i] as string, C.ink, 14);
          ctx.save();
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(r.x + 4, r.y + 6);
          ctx.lineTo(380, 76 + i * 40);
          ctx.stroke();
          ctx.restore();
        }
      }

      for (let i = 0; i < VALUES.length; i++) {
        const r = valueRect(i);
        const used = s.slots.indexOf(VALUES[i]) >= 0;
        const drag = s.dragging === i;
        ctx.save();
        ctx.globalAlpha = used ? 0.3 : 1;
        ctx.fillStyle = drag ? withAlpha(C.blue, 0.16) : C.card;
        roundRect(ctx, r.x, r.y, r.w, r.h, 5);
        ctx.fill();
        ctx.strokeStyle = drag ? C.blue : C.border;
        ctx.lineWidth = drag ? 2 : 1.2;
        roundRect(ctx, r.x, r.y, r.w, r.h, 5);
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, r.x + r.w / 2, r.y + r.h / 2, VALUES[i], used ? C.muted : C.ink, 13, 'center');
      }

      if (s.dragging >= 0) {
        const text = VALUES[s.dragging];
        const w = 152;
        const h = 32;
        ctx.save();
        ctx.fillStyle = withAlpha(C.card, 0.96);
        roundRect(ctx, s.px - w / 2, s.py - h / 2, w, h, 5);
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        roundRect(ctx, s.px - w / 2, s.py - h / 2, w, h, 5);
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, s.px, s.py, text, C.ink, 13, 'center');
      }
    };

    let raf = 0;
    const tick = (now: number) => {
      render(stateRef.current, now / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = pointerToCanvas(e, canvas, W, H);
    let hit = -1;
    for (let i = 0; i < VALUES.length; i++) {
      if (inRect(p, valueRect(i))) hit = i;
    }
    if (hit >= 0 && stateRef.current.slots.indexOf(VALUES[hit]) < 0) {
      stateRef.current.dragging = hit;
      stateRef.current.px = p.x;
      stateRef.current.py = p.y;
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    if (s.dragging < 0) return;
    const p = pointerToCanvas(e, canvas, W, H);
    s.px = p.x;
    s.py = p.y;
  };

  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    if (s.dragging < 0) return;
    const p = pointerToCanvas(e, canvas, W, H);
    const value = VALUES[s.dragging];
    s.dragging = -1;

    let slot = -1;
    for (let i = 0; i < 3; i++) {
      if (inRect(p, slotRect(i))) slot = i;
    }
    if (slot < 0) {
      setFeedback({ text: '松手在槽外——拖到虚线框里才算系上。', cls: '' });
      return;
    }
    if (LEGAL[slot] === value) {
      s.slots[slot] = value;
      const n = s.slots.filter(Boolean).length;
      if (n === 3) {
        setFeedback({
          text: '三条合法：这件器物—窑口—景德镇，这件器物—底款—乾隆六年，这件器物—纹样—缠枝纹。',
          cls: 'good',
        });
      } else {
        setFeedback({ text: `已经系上 ${n} 条。`, cls: '' });
      }
    } else {
      s.reject = slot;
      window.setTimeout(() => {
        if (stateRef.current.reject === slot) stateRef.current.reject = -1;
      }, 800);
      setFeedback({
        text: `“${value}”接不上这个槽——关系有类型，尾实体必须匹配。`,
        cls: 'bad',
      });
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        style={{ cursor: 'grab' }}
      />
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
