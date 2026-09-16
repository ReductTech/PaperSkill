import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
const NODES = [
  { id: 'input', name: '文档图像', x: 40, y: 120, w: 130, h: 50, desc: '输入文档图像，动态分辨率训练', type: 'input' },
  { id: 'encoder', name: '视觉编码器', x: 210, y: 100, w: 160, h: 90, desc: 'ViT-S(28M) / ViT-B(113M) / ViTAEv2-S(21M)', type: 'encoder' },
  { id: 'feat', name: '视觉特征 z', x: 410, y: 110, w: 130, h: 70, desc: '共享视觉表征，服务两个解码器', type: 'feature' },
  { id: 'vdec', name: '视觉解码器', x: 580, y: 45, w: 170, h: 65, desc: '上采样+Conv，重建图像（仅预训练）', type: 'vdec' },
  { id: 'tdec', name: '文本解码器', x: 580, y: 170, w: 170, h: 65, desc: 'Transformer，自回归生成文本（仅预训练）', type: 'tdec' },
  { id: 'output', name: '预训练目标', x: 800, y: 105, w: 160, h: 75, desc: '文本+重建联合损失，λ=1.0', type: 'output' },
];
const NODE_COLORS: Record<string, { fill: string; stroke: string }> = {
  input:   { fill: 'rgba(107,114,128,0.10)', stroke: '#6b7280' },
  encoder: { fill: 'rgba(74,85,104,0.10)',  stroke: '#4a5568' },
  feature: { fill: 'rgba(194,106,78,0.10)',  stroke: '#c26a4e' },
  vdec:    { fill: 'rgba(90,138,110,0.10)',  stroke: '#5a8a6e' },
  tdec:    { fill: 'rgba(124,106,158,0.10)', stroke: '#7c6a9e' },
  output:  { fill: 'rgba(184,92,92,0.10)',   stroke: '#b85c5c' },
};
const EDGES = [
  { from: 'input', to: 'encoder' },
  { from: 'encoder', to: 'feat' },
  { from: 'feat', to: 'vdec' },
  { from: 'feat', to: 'tdec' },
  { from: 'vdec', to: 'output' },
  { from: 'tdec', to: 'output' },
];

interface Dot {
  edgeIdx: number;
  t: number;
  speed: number;
}

export const Mod8_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState('encoder');
  const sRef = useRef('encoder');
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    let time = 0;
    // One flowing dot per edge (archify-style trace)
    const dots: Dot[] = EDGES.map((_, idx) => ({
      edgeIdx: idx,
      t: Math.random(),
      speed: 0.006 + Math.random() * 0.003,
    }));

    const getEdgePoints = (edgeIdx: number) => {
      const e = EDGES[edgeIdx];
      const f = NODES.find(n => n.id === e.from)!;
      const t = NODES.find(n => n.id === e.to)!;
      return {
        x1: f.x + f.w, y1: f.y + f.h / 2,
        x2: t.x, y2: t.y + t.h / 2,
      };
    };

    const tick = () => {
      time += 1;
      clearScene(ctx, W, H);
      const active = sRef.current;

      // Draw edges
      EDGES.forEach((e, idx) => {
        const { x1, y1, x2, y2 } = getEdgePoints(idx);
        const isActive = e.from === active || e.to === active;
        const f = NODES.find(n => n.id === e.from)!;
        const color = NODE_COLORS[f.type].stroke;
        // Base line
        ctx.strokeStyle = isActive ? color : '#cbd5e1';
        ctx.lineWidth = isActive ? 2 : 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const ax = x2 - 2, ay = y2;
        ctx.fillStyle = isActive ? color : '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 8, ay - 5);
        ctx.lineTo(ax - 8, ay + 5);
        ctx.closePath();
        ctx.fill();
      });

      // Flowing dots (archify trace style)
      dots.forEach(d => {
        d.t += d.speed;
        if (d.t > 1) d.t = 0;
        const { x1, y1, x2, y2 } = getEdgePoints(d.edgeIdx);
        const e = EDGES[d.edgeIdx];
        const isActive = e.from === active || e.to === active;
        const f = NODES.find(n => n.id === e.from)!;
        const color = NODE_COLORS[f.type].stroke;
        const x = x1 + (x2 - x1) * d.t;
        const y = y1 + (y2 - y1) * d.t;
        // Dot with subtle trail
        ctx.fillStyle = isActive ? color : '#94a3b8';
        ctx.beginPath();
        ctx.arc(x, y, isActive ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, isActive ? 1.5 : 1, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes (archify-style: fill + stroke)
      NODES.forEach(n => {
        const isSel = n.id === active;
        const colors = NODE_COLORS[n.type];
        const pulse = isSel ? Math.sin(time * 0.06) * 0.3 + 0.7 : 1;
        // Node background
        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = isSel ? 2.5 : 1.5;
        ctx.globalAlpha = isSel ? 0.5 + pulse * 0.5 : 1;
        roundRect(ctx, n.x, n.y, n.w, n.h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Node name
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(n.name, n.x + 12, n.y + 22);
        // Node desc (auto-wrap within node)
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        const maxWidth = n.w - 24;
        const words = n.desc.split('');
        let line = '';
        let lineY = n.y + 38;
        for (let wi = 0; wi < words.length; wi++) {
          const testLine = line + words[wi];
          if (ctx.measureText(testLine).width > maxWidth && line !== '') {
            ctx.fillText(line, n.x + 12, lineY);
            line = words[wi];
            lineY += 13;
            if (lineY > n.y + n.h - 8) break;
          } else {
            line = testLine;
          }
        }
        if (lineY <= n.y + n.h - 8) {
          ctx.fillText(line, n.x + 12, lineY);
        }
        // Type indicator dot
        ctx.fillStyle = colors.stroke;
        ctx.beginPath();
        ctx.arc(n.x + n.w - 12, n.y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Detail panel
      const node = NODES.find(n => n.id === active)!;
      const colors = NODE_COLORS[node.type];
      ctx.fillStyle = colors.stroke;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(node.name, 40, 245);
      ctx.fillStyle = '#475569';
      ctx.font = '13px sans-serif';
      ctx.fillText(node.desc, 40, 268);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    NODES.forEach(n => {
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
        sRef.current = n.id; setSel(n.id);
      }
    });
  };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} onClick={onClick} style={{ cursor: 'pointer' }} />
    <div className="feedback">点击架构图中的组件，查看其作用和参数。三个编码器变体（S/B/AS）共享相同的预训练目标和架构范式。</div></div>);
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
export default Mod8_1;