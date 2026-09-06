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
function arrowHead(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
  ctx.closePath(); ctx.fill();
}

const W = 560, H = 240;

type Pin = 'yolo8' | 'yolo11' | 'ours';
const PINS: Record<Pin, { name: string; sub: string; color: string; text: string; cls: string }> = {
  yolo8: {
    name: 'Mamba-YOLO',
    sub: '颈部 C2f（YOLOv8）',
    color: C.green,
    text: 'Mamba-YOLO 先把 SSM 塞进 YOLOv8：换掉颈部 PAFPN 里的 C2f 块。位置在颈部（特征融合），还没碰到主干末尾的全局聚合点。',
    cls: 'good',
  },
  yolo11: {
    name: 'YOLO11 后续',
    sub: '主干 C3k2',
    color: C.blue,
    text: '后续工作把目标转向 YOLO11，动的是主干里的 C3k2 块——仍是主干中段。C3k2 是局部卷积 + CSP 结构，不是全局自注意力。',
    cls: 'good',
  },
  ours: {
    name: '本文 MambaPSA',
    sub: '主干末尾 C2PSA',
    color: C.orange,
    text: '本文直接动 YOLO26 主干末尾的 C2PSA：保留 CSP 外壳、把 a 分支的自注意力换成 Mamba。这个位置此前无人尝试（YOLO26 是 NMS-free 框架）——Mamba 终于补到全局聚合这一步。',
    cls: '',
  },
};
const ORDER: Pin[] = ['yolo8', 'yolo11', 'ours'];

export const RwM2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ pin: Pin }>({ pin: 'ours' });
  const rafRef = useRef<number | null>(null);
  const [pin, setPin] = useState<Pin>('ours');
  const [feedback, setFeedback] = useState(PINS.ours);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { pin: Pin }, time: number) => {
      clearScene(ctx, W, H);
      const sel = s.pin;

      // ---------- 主干（竖塔） ----------
      const tx = 40, ty = 24, tw = 130, th = 150;
      const segs = ['Stem', 'C3k2', 'SPPF', 'C2PSA'];
      const segH = th / segs.length;
      ctx.fillStyle = '#ffffff'; rr(ctx, tx, ty, tw, th, 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.4; ctx.stroke();
      segs.forEach((name, i) => {
        const sy = ty + i * segH;
        if (name === 'C2PSA') {
          ctx.fillStyle = 'rgba(217,119,6,0.16)';
          rr(ctx, tx + 1, sy + 1, tw - 2, segH - 2, 6); ctx.fill();
        }
        ctx.strokeStyle = i === 0 ? 'transparent' : C.line; ctx.lineWidth = 1;
        if (i > 0) { ctx.beginPath(); ctx.moveTo(tx, sy); ctx.lineTo(tx + tw, sy); ctx.stroke(); }
        ctx.fillStyle = name === 'C2PSA' ? C.orange : C.ink;
        ctx.font = name === 'C2PSA' ? 'bold 12px "Segoe UI", sans-serif' : '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(name, tx + tw / 2, sy + segH / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      });
      ctx.fillStyle = C.muted; ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('主干 Backbone', tx, ty - 7);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('(YOLO26)', tx + 96, ty - 7);

      // ---------- 颈部 + 检测头 ----------
      ctx.fillStyle = '#ffffff'; rr(ctx, 216, 96, 168, 34, 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('颈部 PAFPN（含 C2f）', 300, 113);
      ctx.fillStyle = '#ffffff'; rr(ctx, 408, 96, 110, 34, 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('检测头（NMS-free）', 463, 113);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = C.muted; ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('颈部 Neck → 检测头', 216, 88);

      // 流向：主干末尾 → 颈部 → 检测头
      arrowHead(ctx, tx + tw, ty + segH * 3.2, 216, 113, C.muted);
      arrowHead(ctx, 384, 113, 408, 113, C.muted);

      // ---------- 三个集成点（pin） ----------
      const drawPin = (x: number, y: number, color: string, selected: boolean, tm: number) => {
        if (selected) {
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          const r = 8 + Math.sin(tm * 4) * 2;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
      };
      // 蓝：主干 C3k2（第 2 段） | 橙：主干末尾 C2PSA（第 4 段） | 绿：颈部 C2f
      drawPin(tx + tw, ty + segH * 1.5, C.blue, sel === 'yolo11', time);
      drawPin(tx + tw, ty + segH * 3.5, C.orange, sel === 'ours', time);
      drawPin(384, 96, C.green, sel === 'yolo8', time);

      // ---------- 底部图例 ----------
      const cols = [60, 228, 396];
      ORDER.forEach((k, i) => {
        const p = PINS[k];
        const x = cols[i];
        const selected = sel === k;
        if (selected) {
          ctx.fillStyle = p.color === C.orange ? 'rgba(217,119,6,0.13)' : p.color === C.blue ? 'rgba(39,68,110,0.13)' : 'rgba(34,141,92,0.13)';
          rr(ctx, x - 10, 196, 170, 36, 7); ctx.fill();
        }
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(x, 209, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = selected ? C.ink : C.muted;
        ctx.font = selected ? 'bold 12px "Segoe UI", sans-serif' : '11px "Segoe UI", sans-serif';
        ctx.fillText(p.name, x + 14, 206);
        ctx.fillStyle = C.ink; ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(p.sub, x + 14, 223);
      });
    };
    const tick = (tt: number) => {
      render(stateRef.current, tt / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const setState = (p: Pin) => {
    stateRef.current.pin = p;
    setPin(p);
    setFeedback(PINS[p]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ORDER.map((p) => (
          <button type="button" key={p} className={`chip ${pin === p ? 'selected' : ''}`} onClick={() => setState(p)}>
            {PINS[p].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
