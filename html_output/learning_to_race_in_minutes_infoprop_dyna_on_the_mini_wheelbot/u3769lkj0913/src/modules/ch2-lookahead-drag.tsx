import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: "The agent observes the Wheelbot's physics state, as defined in the Mini Wheelbot paper [10], together with a local representation of the track given by the relative positions of the next 30 track points expressed in polar coordinates.",
    zh: '智能体观测车身物理状态，以及由<b>接下来 30 个赛道点的相对位置（极坐标）</b>给出的局部赛道表示。',
    locator: '§III Task · p.2',
    highlights: ['next 30 track points', 'polar coordinates'],
  },
  {
    en: 'The racing agent directly commands the motor torques.',
    zh: '竞速智能体<b>直接输出电机力矩</b>。',
    locator: '§III Task · p.2',
    highlights: ['directly commands the motor torques'],
  },
];

// Module 2.1: drag the blue lookahead flag along the centerline; the 30-point polar
// fan stretches with it. Right inset lists the observation composition.
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

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x + 13, y - 13);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const CX = 300;
const CY = 150;
const RX = 190;
const RY = 88;
const KART_T = 0.5;

export const Ch2LookaheadDrag: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ lookT: 0.5, dragging: false });
  const [lookT, setLookT] = useState(0.5);
  const [feedback, setFeedback] = useState({ text: '拖动蓝色前瞻点：前瞻覆盖到下一个弯时最有把握。', cls: '' });

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
      const k = tpoint(CX, CY, RX, RY, KART_T);
      // 30 dots from kart to lookahead flag
      const ahead = 0.05 + s.lookT * 0.45;
      ctx.fillStyle = C.blue;
      for (let i = 1; i <= 30; i++) {
        const t = KART_T + (ahead * i) / 30;
        const p = tpoint(CX, CY, RX, RY, t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      const f = tpoint(CX, CY, RX, RY, KART_T + ahead);
      flag(ctx, f.x, f.y, C.blue);
      kart(ctx, k.x, k.y, k.ang, C.blue);

      // Right inset: observation composition
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 660, 26, 396, 228, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('智能体的观测', 686, 60);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.fillText('· 车身物理状态（onboard 估计）', 686, 96);
      ctx.fillText('· 前方 30 个赛道点：极坐标 (r, θ)', 686, 126);
      ctx.fillStyle = C.blue;
      ctx.fillText('  当前弧长范围随拖拽伸缩', 686, 152);
      ctx.fillStyle = C.muted;
      ctx.fillText('· 动作输出：电机力矩', 686, 190);
      ctx.fillStyle = C.orange;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('前瞻比例 ' + (s.lookT * 100).toFixed(0) + '%', 686, 228);
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

  const updateFeedback = (v: number) => {
    if (v < 0.25) setFeedback({ text: '前瞻太近：高速时来不及规划入弯。', cls: 'bad' });
    else if (v <= 0.8) setFeedback({ text: '前瞻覆盖下一个弯：前方 30 个赛道点（极坐标）+ 车身物理状态。', cls: 'good' });
    else setFeedback({ text: '前瞻过远：局部表示更长，预测负担更重；论文取前方 30 点。', cls: '' });
  };

  const pointerToLookT = (clientX: number, clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.lookT;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const dx = (x - CX) / RX;
    const dy = (y - CY) / RY;
    let a = Math.atan2(dy, dx) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    let rel = a / (Math.PI * 2) - KART_T;
    if (rel < 0) rel += 1;
    return clamp((rel - 0.05) / 0.45, 0.05, 1);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    stateRef.current.dragging = true;
    const v = pointerToLookT(e.clientX, e.clientY);
    stateRef.current.lookT = v;
    setLookT(v);
    updateFeedback(v);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const v = pointerToLookT(e.clientX, e.clientY);
    stateRef.current.lookT = v;
    setLookT(v);
    updateFeedback(v);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 0.05 : -0.05;
    const v = clamp(stateRef.current.lookT + delta, 0.05, 1);
    stateRef.current.lookT = v;
    setLookT(v);
    updateFeedback(v);
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
            前瞻比例 <span className="val">{Math.round(lookT * 100)}%</span>
          </label>
          <span style={{ fontSize: 13, color: '#68778f' }}>提示：按住蓝色前瞻点并沿赛道拖动（或使用方向键）</span>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch2LookaheadDrag;
