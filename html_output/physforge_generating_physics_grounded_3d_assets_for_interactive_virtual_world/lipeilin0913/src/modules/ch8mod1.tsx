import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 Module 8.1 (P5 clickable hotspots, technical): five-node two-stage pipeline map.
const W = 1080;
const H = 280;

const NODES = [
  { id: 0, label: '图像/掩码编码', x: 40, color: '#27446e', info: '输入：图像 I 与可选掩码 M（转彩色图），由 Qwen2.5-VL 图像编码器处理为 2D 特征。' },
  { id: 1, label: '体素编码', x: 240, color: '#27446e', info: '输入：TRELLIS 一阶段体素 V；PartField 编码器 + 位置感知 3D 卷积下采样为 512 维体素嵌入。' },
  { id: 2, label: 'VLM 规划器', x: 440, color: '#27446e', info: '输出：层级物理蓝图——零件包围盒（每盒 6 token）、父节点、物理属性与关节类型。' },
  { id: 3, label: 'KVI 注入点', x: 660, color: '#7c3aed', info: '运动体素 z_k 在下采样之后、中部 Transformer 之前拼接进几何序列，并叠加关节类型嵌入 E_type。' },
  { id: 4, label: 'Flow Transformer', x: 860, color: '#228d5c', info: '输出：去噪后的几何、纹理与 8 维关节参数（原点/轴向/范围），由两个解码器分别落成网格与运动。' },
];
const NW = 170;
const NH = 74;
const NY = 60;

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ node: -1, changedAt: 0 });
  const rafRef = useRef<number | null>(null);
  const [node, setNode] = useState(-1);
  const [feedback, setFeedback] = useState({ text: '点击一个组件，查看它的输入与输出。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    // per-node / per-link activation levels, damped toward their targets so
    // selections highlight smoothly instead of snapping.
    const act = NODES.map(() => 0);
    const linkAct = [0, 0, 0, 0];
    let lastT: number | null = null;

    const render = (time: number) => {
      const dt = lastT === null ? 0 : Math.min((time - lastT) / 1000, 0.1);
      lastT = time;
      const k = 1 - Math.exp(-dt / 0.14);
      const sel = stateRef.current.node;
      for (let i = 0; i < NODES.length; i++) {
        const tgt = sel === i ? 1 : 0;
        act[i] += (tgt - act[i]) * k;
        if (Math.abs(act[i] - tgt) < 0.01) act[i] = tgt;
      }
      for (let i = 0; i < linkAct.length; i++) {
        const tgt = sel >= 0 && (i === sel || i + 1 === sel) ? 1 : 0;
        linkAct[i] += (tgt - linkAct[i]) * k;
        if (Math.abs(linkAct[i] - tgt) < 0.01) linkAct[i] = tgt;
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // links (with a data packet drifting along each one)
      for (let i = 0; i < NODES.length - 1; i++) {
        const a = linkAct[i];
        ctx.strokeStyle = lerpColor('#d7deea', '#27446e', a);
        ctx.lineWidth = lerp(2, 5, a);
        ctx.beginPath();
        ctx.moveTo(NODES[i].x + NW, NY + NH / 2);
        ctx.lineTo(NODES[i + 1].x, NY + NH / 2);
        ctx.stroke();
        const u = (time / 2400 + i * 0.25) % 1;
        const px = lerp(NODES[i].x + NW, NODES[i + 1].x, u);
        ctx.globalAlpha = 0.3 + 0.6 * a;
        ctx.fillStyle = a > 0.5 ? '#27446e' : '#68778f';
        ctx.beginPath();
        ctx.arc(px, NY + NH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // nodes
      for (const n of NODES) {
        const a = act[n.id];
        const ny = NY - 3 * a; // selected node lifts slightly
        ctx.fillStyle = lerpColor('#ffffff', n.color, a);
        ctx.strokeStyle = n.color;
        ctx.lineWidth = lerp(2, 4, a);
        if (a > 0.02) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 12 * a;
        }
        ctx.fillRect(n.x, ny, NW, NH);
        ctx.shadowBlur = 0;
        ctx.strokeRect(n.x, ny, NW, NH);
        ctx.fillStyle = lerpColor(n.color, '#ffffff', a);
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.fillText(n.label, n.x + 12, ny + 44);
      }
      // info strip
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.fillRect(40, 180, 990, 76);
      ctx.strokeRect(40, 180, 990, 76);
      const textA = easeOutCubic(clamp((time - stateRef.current.changedAt) / 250, 0, 1));
      ctx.globalAlpha = textA;
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      const text = sel >= 0 ? NODES[sel].info : '五个组件排成一条线：两个专家，一个接口。';
      ctx.fillText(text, 60, 226);
      ctx.globalAlpha = 1;
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      for (const n of NODES) {
        if (x >= n.x && x <= n.x + NW && y >= NY - 4 && y <= NY + NH) {
          select(n.id);
          return;
        }
      }
    };
    canvas.addEventListener('click', onClick);
    canvas.style.cursor = 'pointer';
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: number) => {
    stateRef.current.node = id;
    stateRef.current.changedAt = performance.now();
    setNode(id);
    if (id === 3) setFeedback({ text: '注入点在下采样之后——这是全图最关键的一刀。', cls: 'good' });
    else setFeedback({ text: NODES[id].info, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="架构组件">
        {NODES.map((n) => (
          <button key={n.id} className={`chip ${node === n.id ? 'selected' : ''}`} onClick={() => select(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
