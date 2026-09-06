import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §10.1 — P8 result race. Three markers advance along a trail toward a summit flag.
// Scal3R (blue) hugs a dashed ground-truth track and reaches first → flag turns gold.
// Progress driven by a frame counter; no Date.now/Math.random.

const W = 560;
const H = 240;

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.62, w * 0.6, h * 0.78);
  ctx.quadraticCurveTo(w * 0.85, h * 0.88, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.25, h * 0.8, w * 0.5, h * 0.88);
  ctx.quadraticCurveTo(w * 0.8, h * 0.96, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawTrail(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color = '#92400e', width = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

// summit triangle + flag (gold when reached)
function drawSummit(ctx: CanvasRenderingContext2D, x: number, y: number, reached = false) {
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x, y - 26);
  ctx.lineTo(x + 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y - 40);
  ctx.stroke();
  ctx.fillStyle = reached ? '#e0a712' : '#9aa7b8';
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.lineTo(x + 12, y - 36);
  ctx.lineTo(x, y - 32);
  ctx.closePath();
  ctx.fill();
}

// survey stake / camera marker used as a racing marker
function drawStake(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 14);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x + 9, y - 11);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fill();
}

interface Racer {
  name: string;
  color: string;
  speed: number; // relative progress rate
  yOff: number; // vertical offset from the GT track (0 = hugs truth)
}

interface State {
  t: number; // idle frame counter
  run: boolean;
  rt: number; // race frame counter
}

const RACERS: Racer[] = [
  { name: 'Scal3R', color: '#27446e', speed: 1.0, yOff: 0 },
  { name: 'VGGT-Long', color: '#9aa7b8', speed: 0.72, yOff: 12 },
  { name: 'FastVGGT', color: '#9aa7b8', speed: 0.6, yOff: -12 },
];

const DUR = 150; // frames to finish for the fastest racer

// map progress [0,1] to a point along the climbing trail
function trackPoint(p: number) {
  const x = 60 + p * 440;
  const y = 190 - easeOutCubic(clamp(p, 0, 1)) * 120;
  return { x, y };
}

export const ModRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({ t: 0, run: false, rt: 0 });
  const rafRef = useRef<number | null>(null);
  const [run, setRun] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '点“开始比拼”，看谁的漂移小、谁先登顶。',
    cls: '',
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

    // dashed ground-truth track = the ideal climbing curve
    const gtPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 40; i++) gtPts.push(trackPoint(i / 40));

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // brown climbing trail (base path)
      drawTrail(ctx, gtPts, '#92400e', 4);

      // dashed ground-truth track overlay
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      gtPts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y - 1) : ctx.moveTo(p.x, p.y - 1)));
      ctx.stroke();
      ctx.restore();

      // progress: while running advance rt; each racer's progress scales by speed
      const lead = clamp(s.rt / DUR, 0, 1); // Scal3R (speed 1)
      const reached = lead >= 1;

      const summit = trackPoint(1);
      drawSummit(ctx, summit.x, summit.y, reached);

      RACERS.forEach((r) => {
        const p = clamp(lead * r.speed, 0, 1);
        const pt = trackPoint(p);
        // baseline hugs GT (yOff 0); baselines drift off the dashed track
        const driftGrow = r.yOff * (0.3 + 0.7 * p);
        drawStake(ctx, pt.x, pt.y + driftGrow, r.color);
        // label near start column
      });

      // top ATE readout
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('相机位姿 ATE（越低越好）', 18, 24);
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#27446e';
      ctx.fillText('Scal3R  VKITTI2 ATE 0.85', 250, 24);

      // legend (colors + names)
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      RACERS.forEach((r, i) => {
        const lx = 18;
        const ly = 210 + i * 0; // single row
        ctx.fillStyle = r.color;
        ctx.fillRect(lx + i * 150, ly, 12, 12);
        ctx.fillStyle = '#21324a';
        ctx.fillText(r.name, lx + i * 150 + 16, ly + 10);
      });
    };

    const tick = () => {
      const s = stateRef.current;
      s.t += 1;
      if (s.run) {
        if (s.rt < DUR) {
          s.rt += 1;
          if (s.rt >= DUR) {
            s.run = false;
            setRun(false);
            setFeedback({
              text: 'Scal3R 最贴合真值、率先登顶（VKITTI2 ATE 0.85）',
              cls: 'good',
            });
          }
        }
      }
      render(s);
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

  const onStart = () => {
    if (stateRef.current.run) return;
    stateRef.current.rt = 0;
    stateRef.current.run = true;
    setRun(true);
    setFeedback({ text: '比拼中……', cls: '' });
  };

  const onReset = () => {
    stateRef.current.run = false;
    stateRef.current.rt = 0;
    setRun(false);
    setFeedback({ text: '点“开始比拼”，看谁的漂移小、谁先登顶。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className="tiny" disabled={run} onClick={onStart}>
          开始比拼
        </button>
        <button className="tiny ghost" onClick={onReset}>
          重置
        </button>
      </div>
      <div className={`feedback ${run ? '' : feedback.cls}`}>{run ? '比拼中……' : feedback.text}</div>
    </div>
  );
};

export default ModRace;
