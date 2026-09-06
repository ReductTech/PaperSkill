import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
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
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function drawStage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, sub: string, active: boolean, tint: string, stroke: string) {
  ctx.fillStyle = active ? tint : '#ffffff';
  rr(ctx, x, y, w, h, 7); ctx.fill();
  ctx.strokeStyle = active ? stroke : C.line; ctx.lineWidth = active ? 2.2 : 1.2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.fillText(label, x + w / 2, y + h - 22);
  ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText(sub, x + w / 2, y + h - 6);
  ctx.textAlign = 'left';
}

const W = 560;

const NODES = [
  { key: 'stem', label: 'Stem', sub: '输入 640²', role: '卷积快速下采样，把 640×640 图像压缩成初始特征。', shape: '→ ~320×320 特征（示意）' },
  { key: 'p2', label: 'C3k2 P2', sub: '大分辨率', role: 'CSP 块，保留细粒度细节，通道较浅。', shape: '~160×160 特征（示意）' },
  { key: 'p3', label: 'C3k2 P3', sub: '中分辨率', role: '又一个 CSP 块，感受野加深，通道变宽。', shape: '~80×80 特征（示意）' },
  { key: 'p4', label: 'C3k2 P4', sub: '较小', role: '第三个 CSP 块，逐步走向语义更强的表示。', shape: '~40×40 特征（示意）' },
  { key: 'p5', label: 'C3k2 P5', sub: '最小', role: '最深一层的 CSP 块，语义最强、空间最粗。', shape: '~20×20 特征（示意）' },
  { key: 'sppf', label: 'SPPF', sub: '多尺度池化', role: '空间金字塔池化，把不同尺度的感受野汇集到一起。', shape: '保持 ~20×20' },
  { key: 'c2psa', label: 'C2PSA', sub: 'PSA 自注意力', role: '不是 CSP 块——它是位置敏感自注意力（PSA）块，外壳沿用 CSP 拓扑，在主干末尾做全局聚合，是本论文要替换的对象。', shape: '→ 进入颈部' },
] as const;

const LX = 26, BW = 200, BH = 38, GAP = 4;
const Y0 = 14;
const BACKBONE_H = NODES.length * BH + (NODES.length - 1) * GAP;
const DX = 244, DY = Y0;
const DW = W - DX - 14;
const DH = BACKBONE_H;
const H = DY + DH + 16;

export const Yolo26M2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'c2psa' as string });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('c2psa');
  const [feedback, setFeedback] = useState({
    text: 'C2PSA 是位置敏感自注意力块，外壳沿用 CSP 拓扑、在主干末尾做全局聚合——它是这篇论文要替换的对象，不是 CSP 块本身。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { sel: string }) => {
      clearScene(ctx, W, H);
      // vertical backbone: stem on top, then P2..P5, SPPF, C2PSA
      let y0 = Y0;
      NODES.forEach((nd) => {
        const active = s.sel === nd.key;
        const tint = nd.key === 'c2psa' ? 'rgba(180,106,42,0.16)' : 'rgba(39,68,110,0.14)';
        const stroke = nd.key === 'c2psa' ? C.orange : C.blue;
        drawStage(ctx, LX, y0, BW, BH, nd.label, nd.sub, active, tint, stroke);
        y0 += BH + GAP;
      });
      // detail panel on the right
      const nd = NODES.find((d) => d.key === s.sel)!;
      ctx.fillStyle = '#ffffff'; rr(ctx, DX, DY, DW, DH, 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.blue; ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText(nd.label + (nd.sub ? ' · ' + nd.sub : ''), DX + 14, DY + 24);
      ctx.fillStyle = C.ink; ctx.font = '13px "Segoe UI", sans-serif';
      const lines = wrapLines(ctx, nd.role, DW - 28);
      const lh = 19;
      const roleTop = DY + 34;
      const roleBottom = DY + DH - 30;
      const yStart = roleTop + Math.max(0, (roleBottom - roleTop - lines.length * lh) / 2);
      lines.forEach((ln, i) => ctx.fillText(ln, DX + 14, yStart + i * lh));
      ctx.fillStyle = C.muted; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('张量：' + nd.shape, DX + 14, DY + DH - 16);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const select = (key: string) => {
    stateRef.current.sel = key; setSel(key);
    const nd = NODES.find((d) => d.key === key)!;
    setFeedback({
      text: `${nd.label}：${nd.role}`,
      cls: key === 'c2psa' ? '' : 'good',
    });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    let y0 = Y0;
    NODES.forEach((nd) => {
      if (mx >= LX && mx <= LX + BW && my >= y0 && my <= y0 + BH) select(nd.key);
      y0 += BH + GAP;
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
      <div className="chip-row">
        {NODES.map((nd) => (
          <button key={nd.key} className={`chip ${sel === nd.key ? 'selected' : ''}`} onClick={() => select(nd.key)}>
            {nd.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const chars = text.split('');
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
