import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'However, most recent advances rely on carefully designed physics-based simulators and domain randomization to achieve successful sim-to-real transfer within reasonable wall-clock time.',
    zh: '<b>大多数近期进展依赖精心设计的物理仿真器与域随机化</b>，才能在可接受的墙钟时间内完成 sim-to-real 迁移。',
    locator: 'Abstract · p.1',
    highlights: ['physics-based simulators and domain randomization', 'sim-to-real transfer'],
  },
  {
    en: 'Small differences in actuation can rapidly lead to qualitatively different system behaviors.',
    zh: '<b>微小的驱动差异</b>就能迅速导致<b>性质完全不同</b>的行为——平台高度敏感。',
    locator: '§II · p.1',
    highlights: ['Small differences in actuation', 'qualitatively different'],
  },
];

// Module 1.1: sensitivity slider + method toggle. Left: kart wobbles more as dynamics
// get sensitive; right: sim-vs-real deployment success curves with the current point.
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

export const Ch1StressRepair: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sensitivity: 0.35, method: 'sim' as 'sim' | 'real' });
  const [sensitivity, setSensitivity] = useState(0.35);
  const [method, setMethod] = useState<'sim' | 'real'>('sim');
  const [feedback, setFeedback] = useState({ text: '拖动滑块提高动力学敏感度，观察仿真路线何时失灵。', cls: '' });

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

      // Left: track with wobbling kart
      trackLoop(ctx, 300, 150, 190, 88);
      const base = tpoint(300, 150, 190, 88, (time * 0.12) % 1);
      const amp = s.sensitivity * (s.method === 'sim' ? 15 : 4);
      const wob = Math.sin(time * 6) * amp;
      const ang = Math.cos(time * 6) * 0.12 * (amp / 15);
      kart(ctx, base.x, base.y + wob, base.ang + ang, s.method === 'sim' ? C.red : C.green);

      // Right: success curves inset
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 660, 26, 396, 228, 8);
      ctx.fill();
      ctx.stroke();
      // axes
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(696, 224);
      ctx.lineTo(1030, 224);
      ctx.moveTo(696, 224);
      ctx.lineTo(696, 46);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('敏感度', 990, 244);
      ctx.fillText('部署成功率', 700, 44);

      const curveY = (x: number, kind: 'sim' | 'real') => {
        const v = kind === 'sim' ? 0.9 - 0.85 * Math.pow(x, 1.6) : 0.86 - 0.1 * x;
        return 224 - v * 168;
      };
      // sim curve (red)
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = s.method === 'sim' ? 1 : 0.35;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const x = i / 50;
        const px = 696 + x * 334;
        if (i === 0) ctx.moveTo(px, curveY(x, 'sim'));
        else ctx.lineTo(px, curveY(x, 'sim'));
      }
      ctx.stroke();
      // real curve (green)
      ctx.strokeStyle = C.green;
      ctx.globalAlpha = s.method === 'real' ? 1 : 0.35;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const x = i / 50;
        const px = 696 + x * 334;
        if (i === 0) ctx.moveTo(px, curveY(x, 'real'));
        else ctx.lineTo(px, curveY(x, 'real'));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      // current point
      const cxp = 696 + s.sensitivity * 334;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(cxp, curveY(s.sensitivity, s.method), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
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

  const updateFeedback = (sens: number, m: 'sim' | 'real') => {
    if (m === 'real') {
      setFeedback({ text: '直接从真实交互学习：不依赖仿真模型，表现保持稳定。', cls: 'good' });
    } else if (sens < 0.33) {
      setFeedback({ text: '敏感度较低时，仿真迁移尚可使用。', cls: '' });
    } else if (sens < 0.66) {
      setFeedback({ text: '敏感度升高，仿真与现实的差距开始显现。', cls: '' });
    } else {
      setFeedback({ text: '高敏感动力学下，仿真训练的策略在现实上频繁失效。', cls: 'bad' });
    }
  };

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.sensitivity = v;
    setSensitivity(v);
    updateFeedback(v, stateRef.current.method);
  };

  const toggleMethod = () => {
    const m = stateRef.current.method === 'sim' ? 'real' : 'sim';
    stateRef.current.method = m;
    setMethod(m);
    updateFeedback(stateRef.current.sensitivity, m);
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <label>
            动力学敏感度 <span className="val">{Math.round(sensitivity * 100)}%</span>
          </label>
          <input type="range" min={0} max={100} value={Math.round(sensitivity * 100)} onChange={onSlider} />
          <button onClick={toggleMethod}>{method === 'sim' ? '当前：仿真训练后部署' : '当前：真实交互学习'}</button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch1StressRepair;
