import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawDog, drawSofa, drawTracker, drawTrail, drawTimeCard } from './dogKit';
import type { Pt } from './dogKit';
import type { WidgetProps } from './registry';

// Module 3.1 谁是谁？亲手连一次 — two synchronized frame halves (t₀ / t₁);
// drag the green dot from the frame-1 dog nose onto what you believe is the same
// physical point in frame 2. Hit zones: dog nose (correct), cat (wrong), rest (wrong).
const W = 1080;
const H = 280;
const PANEL_L = { x: 6, y: 8, w: 520, h: 264 };
const PANEL_R = { x: 554, y: 8, w: 520, h: 264 };

const NOSE0: Pt = { x: 213, y: 207 }; // dog nose in the t₀ panel
const NOSE1: Pt = { x: 843, y: 207 }; // dog nose in the t₁ panel (dog moved right)
const CAT1: Pt = { x: 1022, y: 178 }; // cat head peeking behind the sofa in t₁
const OLD1: Pt = { x: 761, y: 207 }; // where the nose used to be, in t₁ coords
const HIT = 30;

type Zone = 'nose' | 'cat' | 'bg' | null;

interface MatchState {
  dot: Pt;
  zone: Zone;
  streak: number;
  total: number;
  anim: { type: 'pulse' | 'shake' | null; start: number };
}

export const Ch3Match: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MatchState>({ dot: { ...NOSE0 }, zone: null, streak: 0, total: 0, anim: { type: null, start: 0 } });
  const rafRef = useRef<number | null>(null);
  const dropRef = useRef<(zone: Exclude<Zone, null>) => void>(() => {});
  const [feedback, setFeedback] = useState({ text: '把绿点拖到下一帧的同一物理点上。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawCat = (x: number, y: number) => {
      ctx.fillStyle = C.muted;
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      [
        [-8, -5, -11, -15, -2, -10],
        [8, -5, 11, -15, 2, -10],
      ].forEach(([x1, y1, x2, y2, x3, y3]) => {
        ctx.beginPath();
        ctx.moveTo(x + x1, y + y1);
        ctx.lineTo(x + x2, y + y2);
        ctx.lineTo(x + x3, y + y3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.white;
      ctx.beginPath();
      ctx.arc(x - 3.5, y - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 3.5, y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const faintRing = (p: Pt, r: number) => {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const panel = (p: { x: number; y: number; w: number; h: number }) => {
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 8);
      ctx.fill();
      ctx.stroke();
    };

    const render = (s: MatchState, now: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      panel(PANEL_L);
      panel(PANEL_R);
      // connecting arrow between the two frames
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(532, 140);
      ctx.lineTo(548, 140);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(552, 140);
      ctx.lineTo(544, 136);
      ctx.lineTo(544, 144);
      ctx.closePath();
      ctx.fill();
      // ---- t₀ panel ----
      drawTimeCard(ctx, PANEL_L.x + 46, 32, 't₀');
      drawSofa(ctx, PANEL_L.x + 414, 242, 0.85);
      drawDog(ctx, PANEL_L.x + 184, 234, 1);
      // ---- t₁ panel ----
      drawTimeCard(ctx, PANEL_R.x + 46, 32, 't₁');
      drawCat(CAT1.x, CAT1.y);
      drawSofa(ctx, PANEL_R.x + 436, 242, 0.85);
      drawDog(ctx, PANEL_R.x + 266, 234, 1);
      faintRing(OLD1, 9); // the old nose spot is a tempting wrong target
      // counter (bare numbers)
      ctx.fillStyle = s.streak > 0 ? C.green : C.muted;
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`连对 ${s.streak}/${s.total}`, PANEL_R.x + PANEL_R.w - 12, 32);
      // carry line from the frame-1 nose to the dot
      if (Math.hypot(s.dot.x - NOSE0.x, s.dot.y - NOSE0.y) > 6) {
        drawTrail(ctx, [NOSE0, s.dot], C.green);
        faintRing(NOSE0, 6);
      }
      // the dot itself (red when the last drop was wrong)
      let dx = s.dot.x;
      const dt = now - s.anim.start;
      if (s.anim.type === 'shake' && dt < 400) dx += Math.sin(dt * 0.09) * 4;
      if (s.zone === 'cat' || s.zone === 'bg') {
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(dx, s.dot.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.white;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dx, s.dot.y, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        drawTracker(ctx, dx, s.dot.y, 6);
      }
      if (s.anim.type === 'pulse' && dt < 600) {
        const p = dt / 600;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dx, s.dot.y, 8 + p * 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const tick = (ms: number) => {
      render(stateRef.current, ms);
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

    const toCanvas = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (W / r.width),
        y: (e.clientY - r.top) * (H / r.height),
      };
    };

    const testDrop = (p: Pt) => {
      const s = stateRef.current;
      s.total += 1;
      s.anim.start = performance.now();
      if (Math.hypot(p.x - NOSE1.x, p.y - NOSE1.y) <= HIT) {
        s.dot = { ...NOSE1 };
        s.zone = 'nose';
        s.streak += 1;
        s.anim.type = 'pulse';
        setFeedback({ text: '答对：这就是对应关系——同一个物理点。', cls: 'good' });
      } else if (Math.hypot(p.x - CAT1.x, p.y - CAT1.y) <= HIT) {
        s.dot = { ...CAT1 };
        s.zone = 'cat';
        s.streak = 0;
        s.anim.type = 'shake';
        setFeedback({ text: '猫是新进画面的点，第一帧里根本没有它。', cls: 'bad' });
      } else {
        s.dot = { x: clamp(p.x, PANEL_R.x + 14, PANEL_R.x + PANEL_R.w - 14), y: clamp(p.y, PANEL_R.y + 14, PANEL_R.y + PANEL_R.h - 14) };
        s.zone = 'bg';
        s.streak = 0;
        s.anim.type = null;
        setFeedback({ text: '位置对了还不够——必须是同一个物理点。', cls: 'bad' });
      }
    };

    let dragging = false;
    const onDown = (e: PointerEvent) => {
      const p = toCanvas(e);
      const s = stateRef.current;
      if (Math.hypot(p.x - s.dot.x, p.y - s.dot.y) <= 26) {
        dragging = true;
        s.zone = null;
        s.anim.type = null;
        canvas.setPointerCapture(e.pointerId);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const p = toCanvas(e);
      const s = stateRef.current;
      s.dot = { x: clamp(p.x, 14, W - 14), y: clamp(p.y, 14, H - 14) };
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const p = toCanvas(e);
      if (p.x > PANEL_R.x) testDrop(p);
    };
    const onCancel = () => {
      dragging = false;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);

    const dropZone = (zone: Exclude<Zone, null>) => {
      if (zone === 'nose') testDrop(NOSE1);
      else if (zone === 'cat') testDrop(CAT1);
      else testDrop({ x: 700, y: 120 });
    };
    dropRef.current = dropZone;

    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  const dropZone = (zone: Exclude<Zone, null>) => dropRef.current(zone);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ touchAction: 'none' }} />
      <div className="ctrl">
        <span>键盘选择落点：</span>
        <button type="button" className="chip" onClick={() => dropZone('nose')}>
          狗鼻
        </button>
        <button type="button" className="chip" onClick={() => dropZone('cat')}>
          猫头
        </button>
        <button type="button" className="chip" onClick={() => dropZone('bg')}>
          背景
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Match;
