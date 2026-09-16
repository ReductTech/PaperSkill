import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 6.1: drag the kart along the track; the confidence view shows where the model
// is trustworthy (lots of collected data) and where it is not (never seen).
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'When should model-based rollouts be terminated due to data corruption?',
    zh: '论文引用 [8] 的核心问题之一：<b>什么时候必须停止信任模型的想象</b>——前提是先能判断「哪里不可信」。',
    locator: '先前工作 [8] §3',
    highlights: ['terminated due to data corruption'],
  },
  {
    en: 'a state-of-the-art uncertainty-aware model-based reinforcement learning (MBRL) framework',
    zh: '本文报告的 Infoprop Dyna 是<b>不确定性感知</b>的框架：它知道自己哪里不知道。',
    locator: 'Abstract · p.1',
    highlights: ['uncertainty-aware'],
  },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function kart(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, accent: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.ink;
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

function trackLoop(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.strokeStyle = C.track;
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 13, ry + 13, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 13, ry - 13, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function tpoint(cx: number, cy: number, rx: number, ry: number, t: number) {
  const a = t * Math.PI * 2 - Math.PI / 2;
  return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), ang: Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)) };
}

const CX = 300;
const CY = 150;
const RX = 200;
const RY = 92;

const density = (t: number) => Math.exp(-Math.pow((t - 0.55) / 0.13, 2)) * 0.95 + 0.05;

// deterministic data coverage points: dense cluster around t=0.55
const DATA_DOTS: number[] = [];
for (let i = 0; i < 60; i++) {
  const t = 0.55 + Math.sin(i * 12.9898) * 0.105;
  DATA_DOTS.push(((t % 1) + 1) % 1);
}

export const Ch6TrustMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 0.55, dragging: false });
  const [t, setT] = useState(0.55);
  const [feedback, setFeedback] = useState({
    text: '按住卡丁车沿赛道拖动：绿区是模型见过的数据，红区是从未见过的地方。',
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
    let raf: number | null = null;

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      trackLoop(ctx, CX, CY, RX, RY);

      // collected data coverage (dots along the track)
      ctx.fillStyle = C.muted;
      DATA_DOTS.forEach((dt) => {
        const p = tpoint(CX, CY, RX, RY, dt);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // current position and its confidence
      const dens = density(s.t);
      const color = dens >= 0.6 ? C.green : dens >= 0.3 ? C.orange : C.red;
      const kp = tpoint(CX, CY, RX, RY, s.t);
      kart(ctx, kp.x, kp.y, kp.ang, color);

      // prediction spread ellipse around the kart (grows in unfamiliar areas)
      const ryy = 10 + (1 - dens) * 44;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(kp.x, kp.y - 4, 20, ryy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // right inset: confidence view
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 660, 30, 396, 224, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('模型的可信度', 686, 62);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('当前区域的数据覆盖', 686, 96);
      // bar
      ctx.fillStyle = '#eef2f7';
      rr(ctx, 686, 110, 344, 18, 9);
      ctx.fill();
      ctx.fillStyle = color;
      rr(ctx, 686, 110, Math.max(8, 344 * dens), 18, 9);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.fillText(Math.round(dens * 100) + '%', 686, 176);
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = C.muted;
      const note =
        dens >= 0.6
          ? '这片区域模型见过很多数据：预测可信，可以放心想象。'
          : dens >= 0.3
          ? '数据一般：预测带着不确定，需要留心。'
          : '陌生区域：模型几乎没见过——它的想象不可信，这正是要跟踪不确定性的原因。';
      let line = '';
      let ly = 210;
      for (const ch of note) {
        line += ch;
        if (line.length >= 22) {
          ctx.fillText(line, 686, ly);
          line = '';
          ly += 22;
        }
      }
      if (line) ctx.fillText(line, 686, ly);
    };

    const tick = () => {
      render();
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

  const update = (v: number) => {
    stateRef.current.t = v;
    setT(v);
    const dens = density(v);
    if (dens >= 0.6)
      setFeedback({ text: '这片区域模型见过很多数据：预测可信，可以放心展开想象。', cls: 'good' });
    else if (dens >= 0.3)
      setFeedback({ text: '数据一般：预测带着不确定性，需要留心它可能不准确。', cls: '' });
    else
      setFeedback({
        text: '陌生区域：模型几乎没见过——预测不可信，这正是必须跟踪不确定性的原因。',
        cls: 'bad',
      });
  };

  const pointerToT = (clientX: number, clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.t;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const dx = (x - CX) / RX;
    const dy = (y - CY) / RY;
    let a = Math.atan2(dy, dx) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    return a / (Math.PI * 2);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    stateRef.current.dragging = true;
    update(pointerToT(e.clientX, e.clientY));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    update(pointerToT(e.clientX, e.clientY));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 0.02 : -0.02;
    update(clamp(stateRef.current.t + delta, 0, 0.999));
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          width={W}
          height={H}
          style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          tabIndex={0}
        />
        <div className="ctrl">
          <label>
            当前位置 <span className="val">{Math.round(t * 100)}%</span>
          </label>
          <span style={{ fontSize: 13, color: '#68778f' }}>提示：按住卡丁车沿赛道拖动（或使用方向键）</span>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch6TrustMap;
