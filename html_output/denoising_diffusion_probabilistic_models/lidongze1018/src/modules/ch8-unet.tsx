import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Module 8.1 — interactive U-Net diagram. Clicking an encoder/decoder/bottleneck/
// attention/skip node highlights it, lights its downstream path, and updates a
// fixed info area plus the feedback line.

const W = 1080;
const H = 280;

type NodeId = 'enc32' | 'enc16' | 'enc8' | 'bottleneck' | 'dec8' | 'dec16' | 'attn' | 'skip';
type BlockKey = 'enc32' | 'enc16' | 'enc8' | 'bottleneck' | 'dec8' | 'dec16' | 'out';

interface NodeDef {
  id: NodeId;
  name: string;
  shape: string;
  param: string;
  role: string;
}

const NODES: NodeDef[] = [
  {
    id: 'enc32',
    name: '编码器 32×32',
    shape: '32×32×C',
    param: '分辨率最高、通道最少；时间嵌入注入每个残差块。',
    role: '把输入逐步压缩，提取低层到中层特征。',
  },
  {
    id: 'enc16',
    name: '编码器 16×16',
    shape: '16×16×2C',
    param: '这一级通道翻倍，并在此加入自注意力。',
    role: '继续下采样，并在此做全局关联。',
  },
  {
    id: 'enc8',
    name: '编码器 8×8',
    shape: '8×8×2C',
    param: '分辨率继续降低，通道保持。',
    role: '进一步压缩，保留语义信息。',
  },
  {
    id: 'bottleneck',
    name: '瓶颈 4×4',
    shape: '4×4×2C',
    param: '分辨率最低、感受野最大。',
    role: '在最底层聚合全局信息。',
  },
  {
    id: 'dec8',
    name: '解码器 8×8',
    shape: '8×8×C',
    param: '与同级编码器通过跳连拼接。',
    role: '开始上采样，逐层恢复空间分辨率。',
  },
  {
    id: 'dec16',
    name: '解码器 16×16',
    shape: '16×16×2C',
    param: '与同级编码器通过跳连拼接。',
    role: '继续上采样，配合跳连恢复细节。',
  },
  {
    id: 'attn',
    name: '16×16 自注意力',
    shape: '16×16 自注意力',
    param: '在 16×16 分辨率上让任意两位置直接相连。',
    role: '让远距离位置直接交换信息。',
  },
  {
    id: 'skip',
    name: '跳连',
    shape: '编码器高分辨率细节→解码器',
    param: '本身不含参数，只把编码器特征拼接到解码器。',
    role: '把编码器的高分辨率细节直接送到解码器。',
  },
];

function nodeById(id: NodeId): NodeDef {
  const found = NODES.find((n) => n.id === id);
  return found ?? NODES[0];
}

const BLOCKS: Record<BlockKey, { x: number; y: number; w: number; h: number }> = {
  enc32: { x: 80, y: 52, w: 150, h: 42 },
  enc16: { x: 150, y: 122, w: 140, h: 42 },
  enc8: { x: 220, y: 192, w: 120, h: 42 },
  bottleneck: { x: 450, y: 208, w: 170, h: 42 },
  dec8: { x: 740, y: 192, w: 120, h: 42 },
  dec16: { x: 770, y: 122, w: 140, h: 42 },
  out: { x: 810, y: 52, w: 150, h: 42 },
};

const BLOCK_LABEL: Record<BlockKey, string> = {
  enc32: '编码 32×32',
  enc16: '编码 16×16',
  enc8: '编码 8×8',
  bottleneck: '瓶颈 4×4',
  dec8: '解码 8×8',
  dec16: '解码 16×16',
  out: '输出 x̂₀',
};

interface Conn {
  id: string;
  from: BlockKey;
  to: BlockKey;
  kind: 'enc' | 'dec';
}

const CONNS: Conn[] = [
  { id: 'c32_16', from: 'enc32', to: 'enc16', kind: 'enc' },
  { id: 'c16_8', from: 'enc16', to: 'enc8', kind: 'enc' },
  { id: 'c8_bn', from: 'enc8', to: 'bottleneck', kind: 'enc' },
  { id: 'cbn_d8', from: 'bottleneck', to: 'dec8', kind: 'dec' },
  { id: 'cd8_d16', from: 'dec8', to: 'dec16', kind: 'dec' },
  { id: 'cd16_out', from: 'dec16', to: 'out', kind: 'dec' },
];

interface SkipDef {
  id: string;
  from: BlockKey;
  to: BlockKey;
  cx: number;
  cy: number;
}

const SKIPS: SkipDef[] = [
  { id: 's32_out', from: 'enc32', to: 'out', cx: 520, cy: 24 },
  { id: 's16_d16', from: 'enc16', to: 'dec16', cx: 530, cy: 86 },
  { id: 's8_d8', from: 'enc8', to: 'dec8', cx: 540, cy: 258 },
];

const DOWNSTREAM: Record<NodeId, { nodes: BlockKey[]; conns: string[] }> = {
  enc32: {
    nodes: ['enc32', 'enc16', 'enc8', 'bottleneck', 'dec8', 'dec16', 'out'],
    conns: ['c32_16', 'c16_8', 'c8_bn', 'cbn_d8', 'cd8_d16', 'cd16_out'],
  },
  enc16: {
    nodes: ['enc16', 'enc8', 'bottleneck', 'dec8', 'dec16', 'out'],
    conns: ['c16_8', 'c8_bn', 'cbn_d8', 'cd8_d16', 'cd16_out'],
  },
  enc8: {
    nodes: ['enc8', 'bottleneck', 'dec8', 'dec16'],
    conns: ['c8_bn', 'cbn_d8', 'cd8_d16'],
  },
  bottleneck: {
    nodes: ['bottleneck', 'dec8', 'dec16'],
    conns: ['cbn_d8', 'cd8_d16'],
  },
  dec8: { nodes: ['dec8', 'dec16'], conns: ['cd8_d16'] },
  dec16: { nodes: ['dec16'], conns: [] },
  attn: {
    nodes: ['enc16', 'enc8', 'bottleneck', 'dec8', 'dec16'],
    conns: ['c16_8', 'c8_bn', 'cbn_d8', 'cd8_d16'],
  },
  skip: {
    nodes: ['enc32', 'enc16', 'enc8', 'dec8', 'dec16', 'out'],
    conns: ['s32_out', 's16_d16', 's8_d8'],
  },
};

const SKIP_HIT = { x: 24, y: 18, w: 120, h: 28 };
const ATTN_HIT = { x: 303, y: 126, w: 34, h: 34 };

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 16);
  ctx.lineTo(w, h - 16);
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function center(k: BlockKey): [number, number] {
  const b = BLOCKS[k];
  return [b.x + b.w / 2, b.y + b.h / 2];
}

function blockKind(k: BlockKey): 'enc' | 'dec' {
  return k === 'dec8' || k === 'dec16' || k === 'out' ? 'dec' : 'enc';
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; label: string }[],
  x: number,
  y: number
): void {
  ctx.font = '15px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  items.forEach((it, i) => {
    const yy = y + i * 22;
    ctx.fillStyle = it.color;
    ctx.fillRect(x, yy - 11, 14, 14);
    ctx.fillStyle = '#68778f';
    ctx.fillText(it.label, x + 22, yy);
  });
}

export const Ch8Unet: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ node: NodeId }>({ node: 'enc32' });
  const rafRef = useRef<number | null>(null);
  const [node, setNode] = useState<NodeId>('enc32');

  const cur = nodeById(node);
  let feedbackText = `选中的是 ${cur.name}：张量 ${cur.shape}，作用是 ${cur.role.replace(/。$/, '')}。`;
  if (node === 'attn') {
    feedbackText += ' 16×16 自注意力：让远距离位置直接交换信息。';
  }
  if (node === 'skip') {
    feedbackText += ' 跳连把编码器的高分辨率细节直接送到解码器。';
  }

  useEffect(() => {
    stateRef.current.node = node;
  }, [node]);

  const selectNode = (id: NodeId) => setNode(id);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawSkips = (active: boolean, activeConns: Set<string>) => {
      SKIPS.forEach((s) => {
        const a = center(s.from);
        const b = center(s.to);
        const on = active && activeConns.has(s.id);
        ctx.strokeStyle = on ? '#27446e' : '#d97706';
        ctx.lineWidth = on ? 4 : 2;
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo(s.cx, s.cy, b[0], b[1]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (!on) {
          const mx = 0.25 * a[0] + 0.5 * s.cx + 0.25 * b[0];
          const my = 0.25 * a[1] + 0.5 * s.cy + 0.25 * b[1];
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const render = (s: { node: NodeId }, time: number) => {
      clearScene(ctx, W, H);
      const ds = DOWNSTREAM[s.node];
      const activeNodes = new Set<BlockKey>(ds.nodes);
      const activeConns = new Set<string>(ds.conns);

      CONNS.forEach((c) => {
        const a = center(c.from);
        const b = center(c.to);
        ctx.strokeStyle = c.kind === 'enc' ? '#27446e' : '#228d5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      });
      drawSkips(false, activeConns);

      CONNS.forEach((c) => {
        if (!activeConns.has(c.id)) return;
        const a = center(c.from);
        const b = center(c.to);
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      });
      if (s.node === 'skip') drawSkips(true, activeConns);

      (Object.keys(BLOCKS) as BlockKey[]).forEach((k) => {
        const b = BLOCKS[k];
        const kind = blockKind(k);
        const isActive = activeNodes.has(k);
        ctx.fillStyle = kind === 'dec' ? '#e9f5ee' : '#eaf1fb';
        if (isActive) ctx.fillStyle = '#dbe7f7';
        roundRect(ctx, b.x, b.y, b.w, b.h, 8);
        ctx.fill();
        ctx.strokeStyle = kind === 'dec' ? '#228d5c' : '#27446e';
        ctx.lineWidth = 2;
        roundRect(ctx, b.x, b.y, b.w, b.h, 8);
        ctx.stroke();
        if (isActive) {
          const pulse = 3 + Math.sin(time / 300) * 1.5;
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = pulse;
          roundRect(ctx, b.x - 3, b.y - 3, b.w + 6, b.h + 6, 10);
          ctx.stroke();
        }
        ctx.fillStyle = kind === 'dec' ? '#228d5c' : '#27446e';
        ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(BLOCK_LABEL[k], b.x + b.w / 2, b.y + b.h / 2);
      });

      ctx.save();
      const attnOn = s.node === 'attn';
      ctx.translate(ATTN_HIT.x + ATTN_HIT.w / 2, ATTN_HIT.y + ATTN_HIT.h / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = attnOn ? '#27446e' : '#7c3aed';
      const half = ATTN_HIT.w / 2;
      ctx.fillRect(-half, -half, ATTN_HIT.w, ATTN_HIT.h);
      if (attnOn) {
        const pulse = 3 + Math.sin(time / 300) * 1.5;
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = pulse;
        ctx.strokeRect(-half - 3, -half - 3, ATTN_HIT.w + 6, ATTN_HIT.h + 6);
      }
      ctx.restore();
      ctx.fillStyle = attnOn ? '#27446e' : '#7c3aed';
      ctx.font = '700 14px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('自注意力', ATTN_HIT.x - 6, ATTN_HIT.y + ATTN_HIT.h + 18);

      const skipOn = s.node === 'skip';
      ctx.strokeStyle = skipOn ? '#27446e' : '#d97706';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      roundRect(ctx, SKIP_HIT.x, SKIP_HIT.y, SKIP_HIT.w, SKIP_HIT.h, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = skipOn ? '#27446e' : '#d97706';
      ctx.font = '700 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('跳连', SKIP_HIT.x + SKIP_HIT.w / 2, SKIP_HIT.y + SKIP_HIT.h / 2);

      drawSceneLabel(ctx, 'U-Net 骨干（结构示意）', 24, 262, '#21324a');
      drawLegend(
        ctx,
        [
          { color: '#27446e', label: '编码器' },
          { color: '#228d5c', label: '解码器' },
          { color: '#d97706', label: '跳连' },
        ],
        900,
        196
      );
    };

    const tick = () => {
      render(stateRef.current, performance.now());
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

  const hit = (x: number, y: number): NodeId | null => {
    if (x >= SKIP_HIT.x && x <= SKIP_HIT.x + SKIP_HIT.w && y >= SKIP_HIT.y && y <= SKIP_HIT.y + SKIP_HIT.h) {
      return 'skip';
    }
    if (x >= ATTN_HIT.x && x <= ATTN_HIT.x + ATTN_HIT.w && y >= ATTN_HIT.y && y <= ATTN_HIT.y + ATTN_HIT.h) {
      return 'attn';
    }
    const keys = Object.keys(BLOCKS) as BlockKey[];
    for (const k of keys) {
      const b = BLOCKS[k];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (k === 'out') return null;
        return k as NodeId;
      }
    }
    return null;
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = map(e.clientX - rect.left, 0, rect.width, 0, W);
    const y = map(e.clientY - rect.top, 0, rect.height, 0, H);
    const found = hit(x, y);
    if (found) setNode(found);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        {NODES.map((n) => (
          <button
            key={n.id}
            className={`chip ${n.id === node ? 'selected' : ''}`}
            onClick={() => selectNode(n.id)}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div className="hotspot-info">
        <b>{cur.name}</b>
        <br />
        张量形状：<code>{cur.shape}</code>
        <br />
        参数说明：{cur.param}
        <br />
        作用：{cur.role}
      </div>
      <div className="source-note">
        模型参数量（论文 Appendix B）：CIFAR10 型号约 35.7M；LSUN/CelebA-HQ 型号约 114M；更大的 LSUN Bedroom 变体约 256M。
        每个分辨率级含 2 个卷积残差块、参数在所有时间步之间共享。本图为按 Appendix B 绘制的<b>结构示意</b>，非逐层实现图。
      </div>
      <div className="feedback">{feedbackText}</div>
    </div>
  );
};

export default Ch8Unet;
