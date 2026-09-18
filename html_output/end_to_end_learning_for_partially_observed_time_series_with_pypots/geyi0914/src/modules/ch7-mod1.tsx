import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 Module 7.1 — 只在该算的地方算：拖动评分区间，看误差分母怎么变。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BORDER = '#d7deea';

const AXIS_X = 90;
const AXIS_W = 900;
const STEPS = 48;

const KIND: ("observed" | "artificial" | "natural")[] = Array.from({ length: STEPS }, (_, i) => {
  if (i % 6 === 2 || i % 9 === 4) return 'artificial';
  if (i % 5 === 3) return 'natural';
  return 'observed';
});

const ART_INDICES = KIND.map((k, i) => (k === 'artificial' ? i : -1)).filter((i) => i >= 0);
const DEFAULT_START = ART_INDICES[0] / STEPS;
const DEFAULT_END = (ART_INDICES[ART_INDICES.length - 1] + 1) / STEPS;

export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ start: DEFAULT_START, end: DEFAULT_END });
  const draggingRef = useRef<'left' | 'right' | null>(null);
  const rafRef = useRef<number | null>(null);
  const [band, setBand] = useState({ start: DEFAULT_START, end: DEFAULT_END });
  const [feedback, setFeedback] = useState({
    text: '正确口径：只在人工缺失位置评分，这些位置有真值。',
    cls: 'good',
  });

  const judge = (start: number, end: number) => {
    const lo = Math.floor(start * STEPS);
    const hi = Math.ceil(end * STEPS);
    const inside = KIND.slice(lo, hi);
    const art = inside.filter((k) => k === 'artificial').length;
    const nat = inside.filter((k) => k === 'natural').length;
    const obs = inside.filter((k) => k === 'observed').length;
    const exact =
      Math.abs(start - DEFAULT_START) < 0.03 && Math.abs(end - DEFAULT_END) < 0.03;
    const tally = `当前区间里有真值 ${art} 个、无真值 ${nat} 个、已观测 ${obs} 个。`;
    if (exact)
      setFeedback({
        text: `正确口径：只在人工缺失位置评分，这些位置有真值。${tally}`,
        cls: 'good',
      });
    else if (nat > obs && nat > 0)
      setFeedback({
        text: `口径错了：天然缺失没有真值，把它算进分母只会让指标被稀释甚至算不出来。${tally}`,
        cls: 'bad',
      });
    else if (obs > art && obs > 0)
      setFeedback({
        text: `口径错了：已观测位置模型本来就看得见，在它们上面算误差几乎必然偏小，会高估插补能力。${tally}`,
        cls: 'bad',
      });
    else
      setFeedback({
        text: `口径偏窄：样本变少，统计噪声变大，但每个位置仍有真值。${tally}`,
        cls: '',
      });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { start: number; end: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 246, W, 20);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 246);
      ctx.lineTo(W, 246);
      ctx.stroke();

      // time axis
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(AXIS_X, 92);
      ctx.lineTo(AXIS_X + AXIS_W, 92);
      ctx.stroke();

      // three-state strip
      const sw = AXIS_W / STEPS;
      for (let i = 0; i < STEPS; i++) {
        const k = KIND[i];
        ctx.fillStyle = k === 'natural' ? RED : k === 'artificial' ? '#f07e47' : BLUE;
        ctx.fillRect(AXIS_X + i * sw, 100, Math.max(1, sw - 1), 22);
      }

      // scoring band
      const bx = AXIS_X + s.start * AXIS_W;
      const bw = Math.max(2, (s.end - s.start) * AXIS_W);
      ctx.fillStyle = 'rgba(34,141,92,0.25)';
      ctx.fillRect(bx, 100, bw, 22);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, 100, bw, 22);

      // handles
      [bx, bx + bw].forEach((hx) => {
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(hx, 140, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#21324a';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // stats inset
      const lo = Math.floor(s.start * STEPS);
      const hi = Math.ceil(s.end * STEPS);
      const inside = KIND.slice(lo, hi);
      const art = inside.filter((k) => k === 'artificial').length;
      const nat = inside.filter((k) => k === 'natural').length;
      const obs = inside.filter((k) => k === 'observed').length;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(90, 168, 900, 62);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(90, 168, 900, 62);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 17px "Segoe UI", sans-serif';
      ctx.fillText('分母', 110, 206);
      ctx.fillText(`${art + nat}`, 230, 206);
      // hatched region marking wrong inclusions
      if (nat > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(90, 168, 900, 62);
        ctx.clip();
        ctx.strokeStyle = 'rgba(196,63,82,0.35)';
        ctx.lineWidth = 1;
        for (let x = 90; x < 990 + 40; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x, 230);
          ctx.lineTo(x + 26, 168);
          ctx.stroke();
        }
        ctx.restore();
      }

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('时间轴', 90, 66);
      ctx.fillText('评分区间', 180, 66);
    };

    const tick = () => {
      render(stateRef.current);
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

  const update = (start: number, end: number) => {
    const s = clamp(start, 0, 0.98);
    const e = clamp(end, s + 0.02, 1);
    stateRef.current.start = s;
    stateRef.current.end = e;
    setBand({ start: s, end: e });
    judge(s, e);
  };

  const pointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    return clamp((x - AXIS_X) / AXIS_W, 0, 1);
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const v = pointer(e);
    const s = stateRef.current;
    draggingRef.current = Math.abs(v - s.start) <= Math.abs(v - s.end) ? 'left' : 'right';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* best-effort */
    }
    onMove(e);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const mode = draggingRef.current;
    if (!mode) return;
    const v = pointer(e);
    const s = stateRef.current;
    if (mode === 'left') update(Math.min(v, s.end - 0.02), s.end);
    else update(s.start, Math.max(v, s.start + 0.02));
  };
  const onUp = () => {
    draggingRef.current = null;
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <div className="ctrl">
        <label>
          评分区间 <span className="val">{Math.round(band.start * 100)}–{Math.round(band.end * 100)}%</span>
        </label>
        <button className="tiny" type="button" onClick={() => update(DEFAULT_START, DEFAULT_END)}>
          恢复正确口径
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
