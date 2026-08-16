import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-ttt-loop — P2 step buttons k∈{0..4}, default 0. Left: a slope with a surveyor
// whose stride-fit improves with k (color red→blue→green). Right: a self-supervised
// loss polyline dropping one point per step. k=0 red "未校准：损失高"; k=4 green
// "已按本段地形校准：损失最低"; k=4 disables 下一步 with step-desc "已完成第 4 步更新". 560×240.

const W = 560;
const H = 240;

interface State {
  t: number;
  k: number; // 0..4
}

// self-supervised loss per step (lower better), one point per step
const LOSS = [1.0, 0.66, 0.42, 0.27, 0.18];

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

// small walking surveyor; phase drives leg swing
function drawSurveyor(ctx: CanvasRenderingContext2D, x: number, y: number, phase = 0, color = '#27446e') {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y - 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y - 2);
  ctx.stroke();
  const s = Math.sin(phase) * 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x - 4 - s, y + 8);
  ctx.moveTo(x, y - 2);
  ctx.lineTo(x + 4 + s, y + 8);
  ctx.stroke();
}

// stride-fit color: red (k=0) → blue (mid) → green (k=4)
function fitColor(fit: number): string {
  if (fit < 0.5) return lerpColor('#c43f52', '#27446e', fit / 0.5);
  return lerpColor('#27446e', '#228d5c', (fit - 0.5) / 0.5);
}

export const ModTttLoop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>({ t: 0, k: 0 });
  const rafRef = useRef<number | null>(null);
  const [k, setK] = useState(0);
  const [feedback, setFeedback] = useState({ text: '未校准：自监督损失高。点“下一步”开始测试时更新。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: State) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      const fit = s.k / 4; // stride-fit 0..1
      const col = fitColor(fit);

      // ---- title ----
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('一步步做测试时更新', 16, 26);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('更新步 k = ' + s.k, 16, 44);

      // ---- left: slope + surveyor with stride-fit ----
      const sx0 = 30;
      const sy0 = 200;
      const sx1 = 250;
      const sy1 = 90;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();

      // surveyor walks partway up the slope; stride markers show fit
      const walkPhase = s.t * 0.15;
      const pos = 0.55; // fixed position on slope
      const px = lerp(sx0, sx1, pos);
      const py = lerp(sy0, sy1, pos);
      drawSurveyor(ctx, px, py - 4, walkPhase, col);

      // stride-fit indicator: ideal stride vs actual. mismatch shrinks with k.
      const ideal = 26;
      const mismatch = lerp(16, 0, fit) * (0.6 + 0.4 * Math.sin(s.t * 0.1));
      const stride = ideal + (s.k < 4 ? mismatch : 0);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - stride / 2, py + 14);
      ctx.lineTo(px + stride / 2, py + 14);
      ctx.stroke();
      // ideal footprint markers
      ctx.fillStyle = '#68778f';
      ctx.beginPath();
      ctx.arc(px - ideal / 2, py + 14, 1.8, 0, Math.PI * 2);
      ctx.arc(px + ideal / 2, py + 14, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      const fitTxt = s.k === 0 ? '步幅失配' : s.k === 4 ? '步幅贴合坡度' : '步幅调整中';
      ctx.fillText(fitTxt, 40, 220);

      // ---- right: self-supervised loss polyline ----
      const ax = 320;
      const ay = 60;
      const aw = 210;
      const ah = 130;
      // axes
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax, ay + ah);
      ctx.lineTo(ax + aw, ay + ah);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('自监督损失 ℒ_ssl', ax, ay - 8);
      ctx.fillText('步 k →', ax + aw - 42, ay + ah + 16);

      // points for step 0..k
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= s.k; i++) {
        const x = ax + (aw / 4) * i;
        const y = ay + ah - LOSS[i] * (ah - 12) - 6;
        pts.push({ x, y });
      }
      // polyline
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      // points, last one emphasized
      pts.forEach((p, i) => {
        const last = i === s.k;
        ctx.fillStyle = last ? (s.k === 4 ? '#228d5c' : s.k === 0 ? '#c43f52' : '#27446e') : '#27446e';
        const rad = last ? 4 + 0.8 * Math.sin(s.t * 0.15) : 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, clamp(rad, 2, 6), 0, Math.PI * 2);
        ctx.fill();
      });
      // current loss readout
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('ℒ = ' + LOSS[s.k].toFixed(2), ax + aw - 66, ay + 14);
    };

    const tick = () => {
      stateRef.current.t += 1;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyK = (nk: number) => {
    const v = clamp(nk, 0, 4);
    stateRef.current.k = v;
    setK(v);
    if (v === 0) setFeedback({ text: '未校准：自监督损失高。', cls: 'bad' });
    else if (v === 4) setFeedback({ text: '已按本段地形校准：损失最低。', cls: 'good' });
    else setFeedback({ text: '更新中：损失下降。', cls: '' });
  };

  const stepDesc = k === 0 ? '起点：尚未更新' : `已完成第 ${k} 步更新`;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={k === 0} onClick={() => applyK(k - 1)}>
          上一步
        </button>
        <span className="step-label">
          更新步 <b>{k}</b> / 4
        </span>
        <button className="tiny" disabled={k === 4} onClick={() => applyK(k + 1)}>
          下一步
        </button>
        <button className="tiny ghost" onClick={() => applyK(0)}>
          重置
        </button>
      </div>
      <div className="step-desc">{stepDesc}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModTttLoop;
