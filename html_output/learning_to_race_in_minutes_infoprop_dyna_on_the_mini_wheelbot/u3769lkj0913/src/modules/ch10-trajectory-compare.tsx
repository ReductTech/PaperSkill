import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'Apart from sticking more closely to the track centerline, the racing agent completes more than three times the number of laps as the AMPC agent.',
    zh: '除了更贴近中心线，竞速智能体的<b>圈数超过 AMPC 3 倍</b>。',
    locator: '§IV · p.2',
    highlights: ['sticking more closely to the track centerline', 'more than three times the number of laps'],
  },
  {
    en: 'Trajectory from the AMPC (left) and final racing agent (right).',
    zh: '图 3：左侧为 AMPC 轨迹、右侧为最终竞速智能体轨迹（论文原图显示在模块下方）。',
    locator: 'Figure 3 caption · p.2',
    highlights: ['AMPC', 'final racing agent'],
  },
];

// Module 10.2: switch between the AMPC trajectory, the racing-agent trajectory, or an
// overlay. The paper's original Figure 3 is shown below the canvas via the module figure.
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

type View = 'ampc' | 'racing' | 'both';

const VIEWS: Record<View, { label: string; color: string; note: string; speed: string; length: string }> = {
  ampc: { label: 'AMPC', color: C.orange, note: '走线保守、偏离中心线', speed: '0.15 m/s', length: '14.26 m' },
  racing: { label: '竞速智能体', color: C.green, note: '贴近中心线、多圈积累', speed: '0.5 m/s', length: '38.81 m' },
  both: { label: '叠加对比', color: C.blue, note: '竞速智能体更贴线（作者解释：受控打滑过弯）', speed: '0.5 vs 0.15', length: '38.81 vs 14.26 m' },
};

const CX = 360;
const CY = 140;
const RX = 270;
const RY = 105;

export const Ch10TrajectoryCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ view: View }>({ view: 'both' });
  const [view, setView] = useState<View>('both');
  const [feedback, setFeedback] = useState({ text: '切换视图，对照两种走线形态。', cls: '' });

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

      // track band + boundary dots + centerline
      ctx.strokeStyle = C.track;
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = C.red;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        for (const r of [1, -1]) {
          ctx.beginPath();
          ctx.arc(CX + (RX + r * 30) * Math.cos(a), CY + (RY + r * 30) * Math.sin(a), 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // AMPC trajectory (orange, wobbly single lap)
      if (s.view === 'ampc' || s.view === 'both') {
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = s.view === 'both' ? 0.75 : 1;
        ctx.beginPath();
        for (let i = 0; i <= 90; i++) {
          const u = i / 90;
          const a = u * Math.PI * 2 - Math.PI / 2;
          const wob = Math.sin(u * Math.PI * 2 * 2.4 + 0.8) * 24;
          const px = CX + (RX + wob) * Math.cos(a);
          const py = CY + (RY + wob) * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // racing trajectory (green, three tight laps)
      if (s.view === 'racing' || s.view === 'both') {
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = s.view === 'both' ? 0.9 : 1;
        for (let lap = 0; lap < 3; lap++) {
          const off = lap * 3.5;
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) {
            const u = i / 80;
            const a = u * Math.PI * 2 - Math.PI / 2;
            const wob = Math.sin(u * Math.PI * 2 * 3 + lap) * 4;
            const px = CX + (RX + off + wob) * Math.cos(a);
            const py = CY + (RY + off + wob) * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // independent moving markers: each view follows its own trajectory
      const u = (time * 0.22) % 1;
      const a = u * Math.PI * 2 - Math.PI / 2;
      if (s.view === 'ampc' || s.view === 'both') {
        const wobAmpc = Math.sin(u * Math.PI * 2 * 2.4 + 0.8) * 24;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(CX + (RX + wobAmpc) * Math.cos(a), CY + (RY + wobAmpc) * Math.sin(a), 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.view === 'racing' || s.view === 'both') {
        const wobRacing = Math.sin(u * Math.PI * 2 * 3) * 4;
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(CX + (RX + wobRacing) * Math.cos(a), CY + (RY + wobRacing) * Math.sin(a), 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // inset with values
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 740, 40, 316, 200, 8);
      ctx.fill();
      ctx.stroke();
      const v = VIEWS[s.view];
      ctx.fillStyle = v.color;
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText(v.label, 766, 84);
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('平均速度 ' + v.speed, 766, 126);
      ctx.fillText('轨迹长度 ' + v.length, 766, 158);
      ctx.fillStyle = C.muted;
      ctx.font = '14px "Segoe UI", sans-serif';
      const words = v.note;
      let line = '';
      let ly = 196;
      for (const ch of words) {
        line += ch;
        if (line.length >= 15) {
          ctx.fillText(line, 766, ly);
          line = '';
          ly += 24;
        }
      }
      if (line) ctx.fillText(line, 766, ly);
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

  const choose = (v: View) => {
    stateRef.current.view = v;
    setView(v);
    if (v === 'ampc') setFeedback({ text: 'AMPC：平均 0.15 m/s，轨迹长度 14.26 m，走线保守。', cls: '' });
    else if (v === 'racing')
      setFeedback({ text: '竞速智能体：平均 0.5 m/s，轨迹长度 38.81 m，贴近中心线。', cls: 'good' });
    else
      setFeedback({
        text: '叠加：竞速智能体更贴中心线，并利用受控打滑过高速弯（作者解释）。',
        cls: '',
      });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="chip-row">
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <button key={v} className={`chip ${view === v ? 'selected' : ''}`} onClick={() => choose(v)}>
              {VIEWS[v].label}
            </button>
          ))}
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch10TrajectoryCompare;
