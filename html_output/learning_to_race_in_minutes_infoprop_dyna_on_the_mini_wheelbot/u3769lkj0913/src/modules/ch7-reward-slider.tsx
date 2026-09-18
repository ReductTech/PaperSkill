import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'The reward encourages faster velocities along the track, penalizes deviation from the track centerline, and assigns a terminal penalty for crashes or leaving the track.',
    zh: '奖励鼓励<b>更快速度</b>、惩罚<b>偏离中心线</b>，并对撞车或出界给予<b>终止惩罚</b>（论文未给出具体公式与权重）。',
    locator: '§III Task · p.2',
    highlights: ['faster velocities', 'deviation from the track centerline', 'terminal penalty'],
  },
];

// Module 7.1: penalty weight slider changes both the kart's line/speed on the track
// and the reward composition bars (speed reward / deviation penalty / terminal penalty).
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function kart(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, accent: string, danger: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = danger ? C.red : C.ink;
  ctx.lineWidth = 2;
  rr(ctx, -11, -6, 22, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.fillRect(-8, -9, 5, 3);
  ctx.fillRect(3, -9, 5, 3);
  ctx.fillRect(-8, 6, 5, 3);
  ctx.fillRect(3, 6, 5, 3);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(2, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export const Ch7RewardSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lambda: 0.5 });
  const [lambda, setLambda] = useState(0.5);
  const [feedback, setFeedback] = useState({ text: '拖动滑块调节偏离惩罚权重，观察 kart 行为与奖励构成。', cls: '' });

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
    let t0 = 0;

    const render = (time: number) => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // Left: straight track
      const tx = 30;
      const ty = 70;
      const tw = 560;
      const th = 130;
      ctx.fillStyle = C.track;
      rr(ctx, tx, ty, tw, th, 10);
      ctx.fill();
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2;
      rr(ctx, tx, ty, tw, th, 10);
      ctx.stroke();
      const cy = ty + th / 2;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(tx + 12, cy);
      ctx.lineTo(tx + tw - 12, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // kart lateral offset: small lambda pushes the kart past the boundary (out of track)
      const offset = (1 - s.lambda) * 82;
      const speed = 1 - 0.6 * s.lambda;
      const period = 4.2 - 1.6 * speed;
      const u = ((time * speed) % period) / period;
      const kx = tx + 24 + u * (tw - 48);
      const danger = offset > 56;
      const outOfTrack = offset > th / 2;
      // skid trail from the centerline out to the kart when it drifts
      if (danger) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(kx - 46, cy - 4);
        ctx.quadraticCurveTo(kx - 20, cy - offset * 0.72, kx, cy - offset);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      kart(ctx, kx, cy - offset, 0, danger ? C.red : s.lambda > 0.7 ? C.blue : C.green, danger);
      // terminal-penalty mark when the kart has fully left the track
      if (outOfTrack) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        const wx = kx + 18;
        const wy = cy - offset - 8;
        ctx.beginPath();
        ctx.moveTo(wx - 6, wy - 6);
        ctx.lineTo(wx + 6, wy + 6);
        ctx.moveTo(wx + 6, wy - 6);
        ctx.lineTo(wx - 6, wy + 6);
        ctx.stroke();
      }

      // Right: reward composition bars
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 650, 26, 406, 228, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('奖励构成', 676, 58);
      const bars = [
        { label: '速度奖励', v: 0.55 + 0.25 * (1 - s.lambda), color: C.green },
        { label: '偏离惩罚', v: 0.2 + 0.5 * s.lambda, color: C.orange },
        { label: '终止惩罚', v: 0.08 + 0.42 * Math.pow(1 - s.lambda, 2), color: C.red },
      ];
      bars.forEach((b, i) => {
        const by = 92 + i * 50;
        ctx.fillStyle = C.muted;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(b.label, 676, by + 4);
        ctx.fillStyle = '#eef2f7';
        rr(ctx, 780, by - 10, 240, 18, 9);
        ctx.fill();
        ctx.fillStyle = b.color;
        rr(ctx, 780, by - 10, Math.max(10, 240 * clamp(b.v, 0, 1)), 18, 9);
        ctx.fill();
        ctx.fillStyle = C.ink;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText((b.v * 100).toFixed(0) + '%', 1030, by + 4);
      });
    };

    const tick = (now: number) => {
      if (!t0) t0 = now;
      render((now - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.lambda = v;
    setLambda(v);
    if (v < 0.3)
      setFeedback({ text: '惩罚太轻：策略为速度抄近道，容易驶出赛道被终止。', cls: 'bad' });
    else if (v <= 0.7)
      setFeedback({ text: '权衡合理：沿赛道快速行驶且保持在中心线附近。', cls: 'good' });
    else setFeedback({ text: '惩罚过重：策略过于保守，速度上不去。', cls: '' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <label>
            偏离惩罚权重 λ <span className="val">{lambda.toFixed(2)}</span>
          </label>
          <input type="range" min={0} max={100} value={Math.round(lambda * 100)} onChange={onChange} />
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch7RewardSlider;
