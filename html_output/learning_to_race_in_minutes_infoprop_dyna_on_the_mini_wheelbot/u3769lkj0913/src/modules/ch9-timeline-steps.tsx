import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'The real-world dataset is warm-started using trajectories collected by manually driving the robot around the track with an approximate model predictive controller (AMPC) and a joystick interface. This provides an initial one minute of safe and informative transitions before fully autonomous learning begins.',
    zh: '用 <b>AMPC + 手柄</b>手动驾驶的轨迹<b>热启动</b>数据集，先获得<b>约 1 分钟安全且有信息量的转移</b>，再开始完全自主的学习。',
    locator: '§III Initialization · p.2',
    highlights: ['warm-started', 'AMPC', 'one minute of safe and informative transitions'],
  },
  {
    en: 'the agent gradually learns to turn and negotiate corners within the first five minutes ... After experiencing six minutes of real interactions, the agent successfully completes its first lap of the track ... Starting from nine minutes, the agent masters the track, achieving peak performance after 11 minutes of real world experience.',
    zh: '<b>5 分钟</b>学会过弯、<b>6 分钟</b>首圈、<b>9 分钟</b>掌握赛道、<b>11 分钟</b>达到峰值表现。',
    locator: '§IV · p.2',
    highlights: ['first five minutes', 'six minutes', 'nine minutes', '11 minutes'],
  },
];

// Module 9.1: step through 6 training milestones; the kart's trajectory tightens onto
// the centerline and its color moves red -> orange -> green.
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

const MILESTONES = ['0–1 分钟', '约 5 分钟', '约 6 分钟', '7–8 分钟', '9 分钟起', '11 分钟'];
const DEVIATIONS = [34, 24, 16, 10, 4, 2];
const MILE_TEXT = [
  '0–1 分钟：AMPC 手柄示范，提供安全且有信息量的初始转移。',
  '约 5 分钟：逐渐学会转弯、通过弯角。',
  '约 6 分钟：完成第一圈。',
  '7–8 分钟：能连续多圈，但高曲率段仍保守、有摇晃。',
  '9 分钟起：掌握赛道。',
  '11 分钟：达到峰值表现。',
];

export const Ch9TimelineSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: MILE_TEXT[0], cls: '' });

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

    const render = (time: number) => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      const cx = 320;
      const cy = 140;
      const rx = 250;
      const ry = 100;
      trackLoop(ctx, cx, cy, rx, ry);

      // trajectory ring with deviation amplitude & color per milestone
      const dev = DEVIATIONS[s.step];
      const color = s.step <= 1 ? C.red : s.step <= 3 ? C.orange : C.green;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) {
        const u = i / 90;
        const a = u * Math.PI * 2 - Math.PI / 2;
        const wob = Math.sin(u * Math.PI * 2 * 3 + 1.2) * dev;
        const px = cx + (rx + wob) * Math.cos(a);
        const py = cy + (ry + wob) * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // kart on the trajectory
      const a = time * 0.6 - Math.PI / 2;
      const wob = Math.sin(((time * 0.6) / (Math.PI * 2)) % 1 * Math.PI * 2 * 3 + 1.2) * dev;
      kart(ctx, cx + (rx + wob) * Math.cos(a), cy + (ry + wob) * Math.sin(a), a + Math.PI / 2, color);

      // milestone board
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 700, 50, 340, 180, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('训练里程碑', 726, 84);
      ctx.fillStyle = color;
      ctx.font = 'bold 34px "Segoe UI", sans-serif';
      ctx.fillText(MILESTONES[s.step], 726, 136);
      ctx.fillStyle = C.ink;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('走线偏离：' + dev + ' px', 726, 176);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('偏离越小 = 越贴近中心线', 726, 204);
    };

    const tick = (now: number) => {
      render(now / 1000);
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

  const go = (delta: number) => {
    const next = Math.max(0, Math.min(5, stateRef.current.step + delta));
    stateRef.current.step = next;
    setStep(next);
    setFeedback({ text: MILE_TEXT[next], cls: next >= 4 ? 'good' : next === 3 ? '' : '' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="step-ctrl">
          <button onClick={() => go(-1)} disabled={step === 0}>
            上一里程碑
          </button>
          <span className="feedback" style={{ marginTop: 0, minHeight: 0 }}>
            第 {step + 1} / 6 个里程碑
          </span>
          <button onClick={() => go(1)} disabled={step === 5}>
            下一里程碑
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch9TimelineSteps;
