import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 3.1: drag the real-interaction budget; the cost curve climbs linearly while
// the policy performance improves only slowly — the sample-efficiency problem.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'but conventional RL methods suffer from poor sample efficiency, limiting their practical applicability.',
    zh: '传统强化学习方法的<b>样本效率很低</b>，限制了它们在真实场景中的可用性。',
    locator: '§I · p.1',
    highlights: ['poor sample efficiency', 'limiting their practical applicability'],
  },
  {
    en: 'As a result, many successful approaches rely on carefully designed physics-based simulators and extensive domain randomization to enable sim-to-real transfer within reasonable wall-clock time [2], [3], [4].',
    zh: '因此许多成功方案转向仿真器与域随机化——正是因为<b>真实数据太贵</b>，业界才需要那么多替代手段。',
    locator: '§I · p.1',
    highlights: ['carefully designed physics-based simulators', 'within reasonable wall-clock time'],
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

const GX = 60;
const GY = 30;
const GW = 700;
const GH = 210;

const cost = (s: number) => s / 100; // normalized cost
const perf = (s: number) => 1 - Math.exp(-s / 55); // slow-rising performance

export const Ch3DataCost: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ steps: 20 });
  const [steps, setSteps] = useState(20);
  const [feedback, setFeedback] = useState({
    text: '拖动滑块增加「真实交互步数」，观察成本（红）与策略水平（蓝）两条曲线的速度差异。',
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
      const s = stateRef.current.steps;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // chart panel
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, GX - 16, GY - 16, GW + 32, GH + 56, 8);
      ctx.fill();
      ctx.stroke();

      const x = (v: number) => GX + (GW * v) / 100;
      const y = (v: number) => GY + GH - v * GH;

      // cost curve (linear climb)
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x(0), y(cost(0)));
      ctx.lineTo(x(100), y(cost(100)));
      ctx.stroke();

      // performance curve (slow)
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const px = x(i);
        const py = y(perf(i));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // current position markers + vertical guide
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x(s), GY);
      ctx.lineTo(x(s), GY + GH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(x(s), y(cost(s)), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(x(s), y(perf(s)), 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('真实交互步数（×1000 步）', GX + GW - 190, GY + GH + 30);
      ctx.fillText('成本 / 策略水平', GX - 10, GY - 2);

      // right inset: two meters
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 860, 30, 200, 224, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('当前状态', 882, 62);

      const meters = [
        { label: '数据成本', v: cost(s), color: C.red },
        { label: '策略水平', v: perf(s), color: C.blue },
      ];
      meters.forEach((m, i) => {
        const by = 104 + i * 78;
        ctx.fillStyle = C.muted;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(m.label, 882, by - 10);
        ctx.fillStyle = '#eef2f7';
        rr(ctx, 882, by, 156, 16, 8);
        ctx.fill();
        ctx.fillStyle = m.color;
        rr(ctx, 882, by, Math.max(6, 156 * clamp(m.v, 0, 1)), 16, 8);
        ctx.fill();
        ctx.fillStyle = m.color;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText(Math.round(m.v * 100) + '', 882, by + 38);
      });

      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('红：真实世界付出的代价', 882, 226);
      ctx.fillText('蓝：换来的策略水平', 882, 244);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 0, 100);
    stateRef.current.steps = v;
    setSteps(v);
    if (v < 20) setFeedback({ text: '数据还很少：策略水平很低——传统 RL 需要不断试错才能进步。', cls: '' });
    else if (v <= 60)
      setFeedback({ text: '成本持续攀升，但策略水平提升缓慢——这就是「样本效率」问题。', cls: 'bad' });
    else
      setFeedback({
        text: '即使投入大量真实数据，收益仍在放缓；真机时间、磨损与安全风险都在累积。',
        cls: 'bad',
      });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <label>
            真实交互步数 <span className="val">{steps * 1000}</span>
          </label>
          <input type="range" min={0} max={100} value={steps} onChange={onChange} />
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch3DataCost;
