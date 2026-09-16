import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'Real-world data is collected by executing the current policy on the physical robot.',
    zh: '真实数据由<b>在物理机器人上执行当前策略</b>采集。',
    locator: '§III · p.2',
    highlights: ['executing the current policy on the physical robot'],
  },
  {
    en: 'Trained policy parameters are periodically saved, transferred back to the local workstation, and deployed on the robot for the next round of data collection and evaluation.',
    zh: '策略参数定期保存、<b>回传到工作站并部署上车</b>，进入<b>下一轮采集与评估</b>。',
    locator: '§III · p.2',
    highlights: ['transferred back', 'deployed on the robot', 'next round of data collection'],
  },
];

// Module 8.1: clickable three-node system map with flow chips. Nodes are also DOM
// buttons for keyboard access; the canvas highlights the selection and active path.
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

type NodeId = 'robot' | 'station' | 'hpc';
type Flow = 'collect' | 'deploy';

const NODES: { id: NodeId; x: number; label: string; detail: string }[] = [
  { id: 'robot', x: 170, label: '机器人', detail: '执行当前策略，记录真实轨迹。' },
  { id: 'station', x: 400, label: '工作站', detail: 'SSH 接收轨迹、记账，并转发到 HPC。' },
  { id: 'hpc', x: 630, label: 'HPC 集群', detail: 'JAX/BRAX 实现，大规模并行做模型学习与策略优化。' },
];

export const Ch8SystemMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ node: NodeId; flow: Flow }>({ node: 'robot', flow: 'collect' });
  const [node, setNode] = useState<NodeId>('robot');
  const [flow, setFlow] = useState<Flow>('collect');
  const [feedback, setFeedback] = useState({ text: '点击下方按钮选择组件，或用 chips 切换数据流向。', cls: '' });

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

      // arrows between nodes
      for (let i = 0; i < NODES.length - 1; i++) {
        const a = NODES[i];
        const b = NODES[i + 1];
        // top arrow: data up (collect)
        const topActive = s.flow === 'collect';
        ctx.strokeStyle = topActive ? C.blue : C.border;
        ctx.lineWidth = topActive ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x + 60, 96);
        ctx.lineTo(b.x - 60, 96);
        ctx.stroke();
        ctx.fillStyle = topActive ? C.blue : C.border;
        ctx.beginPath();
        ctx.moveTo(b.x - 60, 96);
        ctx.lineTo(b.x - 72, 90);
        ctx.lineTo(b.x - 72, 102);
        ctx.closePath();
        ctx.fill();
        // bottom arrow: parameters down (deploy)
        const botActive = s.flow === 'deploy';
        ctx.strokeStyle = botActive ? C.green : C.border;
        ctx.lineWidth = botActive ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x - 60, 184);
        ctx.lineTo(a.x + 60, 184);
        ctx.stroke();
        ctx.fillStyle = botActive ? C.green : C.border;
        ctx.beginPath();
        ctx.moveTo(a.x + 60, 184);
        ctx.lineTo(a.x + 72, 178);
        ctx.lineTo(a.x + 72, 190);
        ctx.closePath();
        ctx.fill();
      }

      // nodes
      NODES.forEach((n) => {
        const active = n.id === s.node;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = active ? C.blue : C.border;
        ctx.lineWidth = active ? 3.5 : 1.5;
        rr(ctx, n.x - 58, 116, 116, 48, 12);
        ctx.fill();
        ctx.stroke();
        if (active) {
          ctx.strokeStyle = 'rgba(39,68,110,0.35)';
          ctx.lineWidth = 1.5;
          rr(ctx, n.x - 64, 110, 128, 60, 15);
          ctx.stroke();
        }
        ctx.fillStyle = active ? C.blue : C.muted;
        ctx.font = (active ? 'bold ' : '') + '15px "Segoe UI", sans-serif';
        const tw = ctx.measureText(n.label).width;
        ctx.fillText(n.label, n.x - tw / 2, 146);
      });

      // detail inset
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 730, 40, 326, 200, 8);
      ctx.fill();
      ctx.stroke();
      const current = NODES.find((n) => n.id === s.node);
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(current ? current.label : '', 756, 82);
      ctx.fillStyle = C.muted;
      ctx.font = '14px "Segoe UI", sans-serif';
      const words = current ? current.detail : '';
      // simple manual wrap
      let line = '';
      let ly = 118;
      for (const ch of words) {
        line += ch;
        if (line.length >= 14) {
          ctx.fillText(line, 756, ly);
          line = '';
          ly += 26;
        }
      }
      if (line) ctx.fillText(line, 756, ly);
      ctx.fillStyle = s.flow === 'collect' ? C.blue : C.green;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(s.flow === 'collect' ? '轨迹数据 →（上行）' : '← 策略参数（下行）', 756, 214);
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

  const chooseNode = (n: NodeId) => {
    stateRef.current.node = n;
    setNode(n);
    const details: Record<NodeId, string> = {
      robot: '机器人：执行当前策略，记录真实轨迹。',
      station: '工作站：SSH 接收轨迹、记账，并转发到 HPC。',
      hpc: 'HPC 集群：JAX/BRAX 实现，大规模并行做模型学习与策略优化。',
    };
    setFeedback({ text: details[n], cls: '' });
  };

  const chooseFlow = (f: Flow) => {
    stateRef.current.flow = f;
    setFlow(f);
    setFeedback(
      f === 'collect'
        ? { text: '轨迹数据流向：机器人 → 工作站 → HPC。', cls: '' }
        : { text: '策略参数流向：HPC → 工作站 → 机器人。', cls: 'good' }
    );
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="chip-row">
          {NODES.map((n) => (
            <button key={n.id} className={`chip ${node === n.id ? 'selected' : ''}`} onClick={() => chooseNode(n.id)}>
              {n.label}
            </button>
          ))}
          <button className={`chip ${flow === 'collect' ? 'selected' : ''}`} onClick={() => chooseFlow('collect')}>
            采集循环（轨迹 →）
          </button>
          <button className={`chip ${flow === 'deploy' ? 'selected' : ''}`} onClick={() => chooseFlow('deploy')}>
            部署回传（← 参数）
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch8SystemMap;
