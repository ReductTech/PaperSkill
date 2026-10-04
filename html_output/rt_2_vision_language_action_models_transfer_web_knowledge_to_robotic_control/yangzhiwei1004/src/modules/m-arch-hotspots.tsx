import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: mathematical/technical (architecture diagram).
// m-arch-hotspots — chapter 8 interactive architecture module (P5 + P4).
// Learner clicks one of five pipeline nodes (ViT -> LLM -> tokens -> detokenize
// -> action) and switches the variant (PaLI-X 5B / 55B / PaLM-E 12B). The
// clicked node highlights and its upstream path turns blue, downstream purple.
// A stable DOM info region below the canvas shows the node's role; the detail
// area does not move when another node is picked. Evidence: page 2 Fig 1;
// page 7 §4 (instances); page 6 §3.2 (token binding).
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0', counter: '#e7e3d8', counterEdge: '#cfc8b6', envLight: '#b8c9a7',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

type Node = 'vit' | 'llm' | 'tokens' | 'detok' | 'action';
type Variant = 'palix5b' | 'palix55b' | 'palme12b';

const NODES: { id: Node; label: string; x: number; w: number }[] = [
  { id: 'vit', label: '视觉编码器', x: 40, w: 120 },
  { id: 'llm', label: 'LLM 骨干', x: 190, w: 120 },
  { id: 'tokens', label: 'token 序列', x: 340, w: 120 },
  { id: 'detok', label: '反 token 化', x: 490, w: 110 },
  { id: 'action', label: '动作输出', x: 630, w: 70 },
];

const VARIANT_LABEL: Record<Variant, string> = {
  palix5b: 'PaLI-X 5B',
  palix55b: 'PaLI-X 55B',
  palme12b: 'PaLM-E 12B',
};

const INFO: Record<Node, string> = {
  vit: '视觉编码器把画面切成 patch；这里的参数本身看不到语言知识。',
  llm: 'LLM 骨干把图像 token 与指令 token 一起读，再自回归地写下去。',
  tokens: '写出来的是一串文本 token，其中一部分被预留为动作 token。',
  detok: '反 token 化把这串文本变回 7 维动作。',
  action: '动作经云端下发，进入下一次闭环。',
};

export const MArchHotspots: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const node = useRef<Node | null>(null);
  const variant = useRef<Variant>('palix5b');
  const [nodeUi, setNodeUi] = useState<Node | null>(null);
  const [variantUi, setVariantUi] = useState<Variant>('palix5b');
  const [fb, setFb] = useState({ text: '点击架构中的任一节点，看它和下游路径如何变化。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, w, 26);
    ctx.globalAlpha = 1;

    const idx = node.current ? NODES.findIndex((n) => n.id === node.current) : -1;
    const cy = 150;
    // connections
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i];
      const b = NODES[i + 1];
      const active = idx >= 0 && i < idx;
      const downstream = idx >= 0 && i >= idx;
      ctx.strokeStyle = active ? C.blue : downstream ? C.purple : C.axis;
      ctx.lineWidth = active || downstream ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(a.x + a.w, cy);
      ctx.lineTo(b.x, cy);
      ctx.stroke();
    }
    // nodes
    NODES.forEach((n) => {
      const on = node.current === n.id;
      ctx.fillStyle = on ? '#eaf1fb' : '#f7f9fc';
      ctx.strokeStyle = on ? C.blue : C.axis;
      ctx.lineWidth = on ? 3 : 1.6;
      ctx.beginPath();
      ctx.roundRect(n.x, cy - 34, n.w, 68, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = on ? C.blue : C.ink;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(n.label, n.x + 10, cy + 4);
      if (on) {
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x + n.w - 10, cy - 24, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    // variant tag on the LLM node
    const llm = NODES[1];
    ctx.fillStyle = C.purple;
    ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(VARIANT_LABEL[variant.current], llm.x + 10, cy + 22);
    ctx.fillStyle = C.muted;
    ctx.fillText('输入：图像 + 指令', 40, 60);
    ctx.fillText('输出：动作 token', 340, 268);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (n: Node) => {
    node.current = n;
    setNodeUi(n);
    setFb(
      n === 'detok' || n === 'action'
        ? { text: INFO[n], cls: 'good' }
        : { text: INFO[n], cls: '' }
    );
  };
  const clear = () => {
    node.current = null;
    setNodeUi(null);
    setFb({ text: '已清除选择，可重新点击任一节点。', cls: '' });
  };
  const chooseVariant = (v: Variant) => {
    variant.current = v;
    setVariantUi(v);
  };

  const hit = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const found = NODES.find((n) => x >= n.x && x <= n.x + n.w && Math.abs(y - 150) <= 40);
    if (found) pick(found.id);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-m-arch-hotspots`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="点击架构节点查看路径"
        style={{ cursor: 'pointer' }}
        onClick={(e) => hit(e.clientX, e.clientY)}
      />
      <div className="chip-row">
        {(Object.keys(VARIANT_LABEL) as Variant[]).map((v) => (
          <button
            key={v}
            type="button"
            className={`chip ${variantUi === v ? 'selected' : ''}`}
            onClick={() => chooseVariant(v)}
          >
            {VARIANT_LABEL[v]}
          </button>
        ))}
      </div>
      {/* keyboard-equivalent controls for the canvas hotspots */}
      <div className="chip-row" role="group" aria-label="选择架构节点">
        {NODES.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`chip ${nodeUi === n.id ? 'selected' : ''}`}
            onClick={() => pick(n.id)}
          >
            {n.label}
          </button>
        ))}
        <button type="button" className="chip" onClick={clear}>
          清除选择
        </button>
      </div>
      <div className="hotspot-info">{nodeUi ? INFO[nodeUi] : '选定一个节点后，这里显示它在整条路径中的作用。'}</div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MArchHotspots;
