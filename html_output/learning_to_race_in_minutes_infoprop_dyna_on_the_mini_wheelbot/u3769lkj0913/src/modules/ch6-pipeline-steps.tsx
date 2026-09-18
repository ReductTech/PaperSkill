import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'Logged trajectories are transmitted via SSH to a local workstation, which handles bookkeeping. The dataset is then forwarded to a high-performance computing (HPC) cluster, where model learning and policy optimization are performed using a JAX-based implementation built on top of BRAX. Note that we do not use any simulation model throughout the training.',
    zh: '轨迹经 <b>SSH 传到本地工作站</b>记账，再转发到 <b>HPC 集群</b>（JAX/BRAX）做模型学习与策略优化；<b>全程不使用仿真模型</b>。',
    locator: '§III · p.2',
    highlights: ['SSH to a local workstation', 'HPC', 'we do not use any simulation model'],
  },
  {
    en: 'This pipeline enables training times that are comparable to real-world data collection times through massive parallelization on the HPC.',
    zh: '借助 HPC 的大规模并行，<b>训练耗时与真实数据采集耗时相当</b>。',
    locator: '§III · p.2',
    highlights: ['comparable to real-world data collection times', 'massive parallelization'],
  },
];

// Module 6.1: step through the 4-stage distributed training cycle. Left: track with
// the kart; right: three nodes (robot / workstation / HPC) with bidirectional arrows.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
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
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 12, ry + 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 12, ry - 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

interface NodePos {
  x: number;
  y: number;
  label: string;
}

const NODES: NodePos[] = [
  { x: 660, y: 140, label: '机器人' },
  { x: 830, y: 140, label: '工作站' },
  { x: 1000, y: 140, label: 'HPC 集群' },
];

const STAGES = [
  '①真实采集：在物理机器人上执行当前策略并记录轨迹。',
  '②回传：轨迹经 SSH 到本地工作站记账，再转发 HPC。',
  '③训练：HPC 上用 JAX/BRAX 实现做模型学习与策略优化，全程不用仿真模型。',
  '④部署：新策略参数回传部署到机器人，开始下一轮采集。',
];

export const Ch6PipelineSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STAGES[0], cls: '' });

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

      // Left: track
      trackLoop(ctx, 250, 150, 165, 82);

      // Active flow (collect: blue right arrows; deploy: green left arrows)
      const activeCollect = s.step === 1 || s.step === 2;
      const activeDeploy = s.step === 3;
      for (let i = 0; i < NODES.length - 1; i++) {
        const a = NODES[i];
        const b = NODES[i + 1];
        // top arrow (right, collect): highlighted progressively as data moves
        const collectSegment = activeCollect && i <= s.step - 1;
        ctx.strokeStyle = collectSegment ? C.blue : C.border;
        ctx.lineWidth = collectSegment ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x + 46, a.y - 34);
        ctx.lineTo(b.x - 46, b.y - 34);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(b.x - 46, b.y - 34);
        ctx.lineTo(b.x - 56, b.y - 40);
        ctx.lineTo(b.x - 56, b.y - 28);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle as string;
        ctx.fill();
        // bottom arrow (left, deploy)
        ctx.strokeStyle = activeDeploy ? C.green : C.border;
        ctx.lineWidth = activeDeploy ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x - 46, b.y + 34);
        ctx.lineTo(a.x + 46, a.y + 34);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x + 46, a.y + 34);
        ctx.lineTo(a.x + 56, a.y + 28);
        ctx.lineTo(a.x + 56, a.y + 40);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle as string;
        ctx.fill();
      }

      // Nodes
      NODES.forEach((n, i) => {
        const active = (s.step === 0 && i === 0) || (s.step === 1 && i === 1) || (s.step === 2 && i === 2) || (s.step === 3 && i === 0);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = active ? C.blue : C.border;
        ctx.lineWidth = active ? 3 : 1.5;
        rr(ctx, n.x - 46, n.y - 24, 92, 48, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? C.blue : C.muted;
        ctx.font = (active ? 'bold ' : '') + '14px "Segoe UI", sans-serif';
        const tw = ctx.measureText(n.label).width;
        ctx.fillText(n.label, n.x - tw / 2, n.y + 5);
      });

      // Kart: on track (steps 0,3) or beside the active node (steps 1,2)
      if (s.step === 0 || s.step === 3) {
        const tx = 250 + 165 * Math.cos(time * 0.9);
        const ty = 150 + 82 * Math.sin(time * 0.9);
        kart(ctx, tx, ty, time * 0.9 + Math.PI / 2, s.step === 3 ? C.green : C.blue);
      } else if (s.step === 1) {
        kart(ctx, 830, 230, 0, C.blue);
      } else {
        kart(ctx, 1000, 230, 0, C.blue);
      }
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
    const next = Math.max(0, Math.min(3, stateRef.current.step + delta));
    stateRef.current.step = next;
    setStep(next);
    setFeedback({ text: STAGES[next], cls: next === 3 ? 'good' : '' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="step-ctrl">
          <button onClick={() => go(-1)} disabled={step === 0}>
            上一步
          </button>
          <span className="feedback" style={{ marginTop: 0, minHeight: 0 }}>
            第 {step + 1} / 4 步
          </span>
          <button onClick={() => go(1)} disabled={step === 3}>
            下一步
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch6PipelineSteps;
