import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel } from './kit-p3';
import type { WidgetProps } from './registry';

// Ch8 M8.1: interactive architecture map — click stage/shortcut, switch variant (P5 + P4).
const W = 560;
const H = 240;

const VARIANTS = [
  { id: 'plain34', label: 'plain-34', blocks: [0, 0, 0, 0], flops: '3.6 BFLOPs', shortcut: '无' },
  { id: 'res34', label: 'ResNet-34', blocks: [3, 4, 6, 3], flops: '3.6 BFLOPs', shortcut: '恒等 + 补零/投影' },
  { id: 'res50', label: 'ResNet-50', blocks: [3, 4, 6, 3], flops: '3.8 BFLOPs', shortcut: 'Bottleneck' },
  { id: 'res101', label: 'ResNet-101', blocks: [3, 4, 23, 3], flops: '7.6 BFLOPs', shortcut: 'Bottleneck' },
  { id: 'res152', label: 'ResNet-152', blocks: [3, 8, 36, 3], flops: '11.3 BFLOPs', shortcut: 'Bottleneck' },
];

const NODES = [
  { id: 'conv1', label: 'conv1', size: '112×112×64' },
  { id: 'conv2_x', label: 'conv2_x', size: '56×56×64' },
  { id: 'conv3_x', label: 'conv3_x', size: '28×28×128' },
  { id: 'conv4_x', label: 'conv4_x', size: '14×14×256' },
  { id: 'conv5_x', label: 'conv5_x', size: '7×7×512' },
  { id: 'fc', label: 'GAP+fc', size: '1000' },
];

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ variant: 'res34', node: 'conv4_x' as string | null });
  const rafRef = useRef<number | null>(null);
  const [variant, setVariant] = useState('res34');
  const [node, setNode] = useState<string>('conv4_x');

  const hitAreas = useRef<{ id: string; x: number; y: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { variant: string; node: string | null }) => {
      clearScene(ctx, W, H);
      const v = VARIANTS.find((x) => x.id === s.variant) || VARIANTS[1];
      // vertical backbone
      const x = 90;
      const y0 = 52;
      const gap = 27;
      hitAreas.current = [];
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const y = y0 + i * gap;
        const active = s.node === n.id;
        const isRes = v.id.startsWith('res');
        ctx.strokeStyle = active ? C.blue : C.border;
        ctx.fillStyle = active ? 'rgba(39,68,110,0.14)' : C.white;
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.fillRect(x - 55, y - 11, 110, 22);
        ctx.strokeRect(x - 55, y - 11, 110, 22);
        ctx.fillStyle = active ? C.blue : C.ink;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${n.label} · ${n.size}`, x, y + 4);
        // shortcut side line for residual variants
        if (isRes && i > 0) {
          const py = y0 + (i - 1) * gap;
          ctx.strokeStyle = v.id === 'plain34' ? C.border : i === 2 || i === 4 ? C.orange : C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 58, py);
          ctx.lineTo(x + 58, y);
          ctx.stroke();
        }
        hitAreas.current.push({ id: n.id, x, y });
      }
      // detail panel
      const nd = NODES.find((n) => n.id === s.node) || NODES[0];
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(250, 40, 280, 170);
      ctx.strokeRect(250, 40, 280, 170);
      drawSceneLabel(ctx, `选中：${nd.label}`, 266, 54, C.blue);
      drawSceneLabel(ctx, `输出 ${nd.size}`, 266, 80, C.ink);
      const blockIdx = NODES.indexOf(nd);
      const blocks = v.blocks[blockIdx] || 0;
      drawSceneLabel(ctx, blocks > 0 ? `堆叠 ${blocks} 个残差块` : '入口卷积 / 池化', 266, 104, C.muted);
      drawSceneLabel(ctx, `变体：${v.label}`, 266, 134, C.ink);
      drawSceneLabel(ctx, `算力 ${v.flops}`, 266, 158, C.orange);
      drawSceneLabel(ctx, `捷径 ${v.shortcut}`, 266, 182, C.purple);
      drawSceneLabel(ctx, '点击节点 / 切换变体', 16, 24, C.muted);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    for (const h of hitAreas.current) {
      if (Math.abs(px - h.x) <= 60 && Math.abs(py - h.y) <= 12) {
        stateRef.current.node = h.id;
        setNode(h.id);
        return;
      }
    }
  };

  const pickVariant = (id: string) => {
    stateRef.current.variant = id;
    setVariant(id);
  };

  const v = VARIANTS.find((x) => x.id === variant) || VARIANTS[1];
  const nd = NODES.find((n) => n.id === node) || NODES[0];
  const blockIdx = NODES.indexOf(nd);
  const blocks = v.blocks[blockIdx] || 0;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
      <div className="ctrl">
        {VARIANTS.map((x) => (
          <button key={x.id} className={`chip ${x.id === variant ? 'active' : ''}`} onClick={() => pickVariant(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="feedback">
        {v.id === 'res152'
          ? 'ResNet-152：11.3 BFLOPs，仍低于 VGG-19（19.6）——深度红利在可控算力内。'
          : `${nd.label}（${v.label}）：输出 ${nd.size}，${blocks > 0 ? `堆叠 ${blocks} 个残差块` : '入口卷积/池化'}；${v.label} 共 ${v.flops}。`}
      </div>
    </div>
  );
};

export default Ch8Mod1;
