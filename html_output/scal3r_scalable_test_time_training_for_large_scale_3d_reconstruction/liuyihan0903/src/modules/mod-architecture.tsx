import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 模块 8.1 —— 点击主干各站点：高亮该组件、点亮到它的入边通路并给出说明。
// P5 node click；GCM 节点恒以紫色 ×4 标注。canvas CSS 缩放，点击用比例换算逻辑坐标。
const W = 560;
const H = 280;

type NodeId = 'enc' | 'frame' | 'global' | 'gcm' | 'dec' | 'align';

interface NodeDef {
  id: NodeId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ArchState {
  t: number;
  sel: NodeId | null;
}

// two rows of 3 nodes so 6 fit at 560 wide with readable labels
const NW = 118;
const NH = 46;
const ROW1_Y = 70;
const ROW2_Y = 150;
const NODES: NodeDef[] = [
  { id: 'enc', label: 'Encoder', x: 24, y: ROW1_Y, w: NW, h: NH },
  { id: 'frame', label: 'Frame Attn', x: 221, y: ROW1_Y, w: NW, h: NH },
  { id: 'global', label: 'Global Attn', x: 418, y: ROW1_Y, w: NW, h: NH },
  { id: 'gcm', label: 'GCM ×4', x: 418, y: ROW2_Y, w: NW, h: NH },
  { id: 'dec', label: 'Decoder', x: 221, y: ROW2_Y, w: NW, h: NH },
  { id: 'align', label: 'Alignment', x: 24, y: ROW2_Y, w: NW, h: NH },
];

// pipeline order enc→frame→global→gcm→dec→align
const ORDER: NodeId[] = ['enc', 'frame', 'global', 'gcm', 'dec', 'align'];

const DESC: Record<NodeId, string> = {
  enc: '编码每帧为 token',
  frame: '帧内注意力',
  global: '跨帧全局注意力',
  gcm: '全局上下文记忆：×4，插在第 4/11/17/24 层后，+75.55M（nh=1, k=4）',
  dec: '解码相机位姿与深度/点图',
  align: '跨块对齐融合成全局重建',
};

function nodeById(id: NodeId): NodeDef {
  return NODES.find((n) => n.id === id) as NodeDef;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#eef3ea';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.7, w * 0.6, h * 0.82);
  ctx.quadraticCurveTo(w * 0.85, h * 0.9, w, h * 0.78);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

// arrow between two node edges
function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a = 6;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - a * Math.cos(ang - 0.5), y2 - a * Math.sin(ang - 0.5));
  ctx.lineTo(x2 - a * Math.cos(ang + 0.5), y2 - a * Math.sin(ang + 0.5));
  ctx.closePath();
  ctx.fill();
}

// connection points between consecutive nodes in ORDER; returns [from, to] edge points
function edgePoints(a: NodeDef, b: NodeDef): [number, number, number, number] {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  // same row → horizontal; different row → vertical
  if (a.y === b.y) {
    if (bc.x > ac.x) return [a.x + a.w, ac.y, b.x, bc.y];
    return [a.x, ac.y, b.x + b.w, bc.y];
  }
  // vertical link (global→gcm)
  if (bc.y > ac.y) return [ac.x, a.y + a.h, bc.x, b.y];
  return [ac.x, a.y, bc.x, b.y + b.h];
}

export const ModArchitecture: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ArchState>({ t: 0, sel: null });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<NodeId | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: ArchState) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Scal3R 主干流水线', 20, 30);

      // incoming edge to selected node (highlight in blue)
      const selIdx = s.sel ? ORDER.indexOf(s.sel) : -1;

      // draw arrows in ORDER
      for (let i = 0; i < ORDER.length - 1; i++) {
        const a = nodeById(ORDER[i]);
        const b = nodeById(ORDER[i + 1]);
        const [x1, y1, x2, y2] = edgePoints(a, b);
        // this edge feeds ORDER[i+1]; highlight if it is on path into selected
        const onPath = selIdx > 0 && i + 1 <= selIdx;
        arrow(ctx, x1, y1, x2, y2, onPath ? '#27446e' : '#c3ccd8', onPath ? 3 : 2);
      }

      // draw nodes
      for (const n of NODES) {
        const isGcm = n.id === 'gcm';
        const isSel = s.sel === n.id;
        // GCM idle pulse when nothing selected
        let pulse = 0;
        if (isGcm && !s.sel) pulse = 0.5 + 0.5 * Math.sin(s.t * 0.08);

        // body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(n.x, n.y, n.w, n.h);
        // border
        if (isSel) {
          ctx.strokeStyle = '#7c3aed';
          ctx.lineWidth = 3;
        } else if (isGcm) {
          ctx.strokeStyle = `rgba(124,58,237,${0.55 + 0.45 * pulse})`;
          ctx.lineWidth = 2 + pulse;
        } else {
          ctx.strokeStyle = '#9aa7b8';
          ctx.lineWidth = 1.5;
        }
        ctx.strokeRect(n.x, n.y, n.w, n.h);

        // label
        ctx.fillStyle = isGcm ? '#7c3aed' : isSel ? '#7c3aed' : '#21324a';
        ctx.font = isGcm
          ? 'bold 14px "Segoe UI", system-ui, sans-serif'
          : '14px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x + n.w / 2, n.y + n.h / 2 + 5);
        ctx.textAlign = 'left';
      }

      // hint when nothing selected
      if (!s.sel) {
        ctx.fillStyle = '#68778f';
        ctx.font = '12px "Segoe UI", system-ui, sans-serif';
        ctx.fillText('点击任意模块，查看它做什么', 20, H - 16);
      }
    };

    const tick = () => {
      stateRef.current.t += 1;
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

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rx = W / canvas.clientWidth;
    const ry = H / canvas.clientHeight;
    const x = e.nativeEvent.offsetX * rx;
    const y = e.nativeEvent.offsetY * ry;
    for (const n of NODES) {
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
        stateRef.current.sel = n.id;
        setSel(n.id);
        return;
      }
    }
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
      {sel ? (
        <div className="hotspot-info" style={{ color: sel === 'gcm' ? '#7c3aed' : '#27446e' }}>
          {DESC[sel]}
        </div>
      ) : (
        <div className="hotspot-info">点击流水线中的任一模块，查看它的作用与数据通路。</div>
      )}
    </div>
  );
};

export default ModArchitecture;
