// mod-7-1 (P2): step through training checkpoints; three loss curves + lr schedule.
import React, { useRef, useState, useEffect } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { palette, clearScene } from './carpentry-kit';

const W = 1080, H = 280;
const CKPTS = [
  { iter: '0', focal: 1.0, iou: 1.0, bce: 1.0, lr: '0.01', fb: '训练开始：三个损失都很高，框画得不准。' },
  { iter: '30K', focal: 0.45, iou: 0.52, bce: 0.4, lr: '0.01', fb: '30K：三个损失明显下降，框越画越正。' },
  { iter: '60K', focal: 0.28, iou: 0.33, bce: 0.24, lr: '0.001', fb: '60K：学习率降为 1/10，曲线继续走低。' },
  { iter: '90K', focal: 0.2, iou: 0.24, bce: 0.18, lr: '0.0001', fb: '90K 完成：分类准、框正、点位稳。（80K 时学习率再降为 1/10）' },
];
const CURVES = [
  { key: 'focal', label: 'focal（分类）', color: '#27446e' },
  { key: 'iou', label: 'IoU（回归）', color: '#228d5c' },
  { key: 'bce', label: 'BCE（中心性）', color: '#7c3aed' },
] as const;

function drawCkpt(canvas: HTMLCanvasElement, ckpt: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  clearScene(ctx, W, H);
  const gx0 = 90, gx1 = 700, gy0 = 40, gy1 = 230;
  ctx.strokeStyle = palette.techBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText('损失（示意）', gx0, 30);
  // lr drop markers at 60K/80K
  const xAt = (i: number) => gx0 + ((i + 0.5) / 4) * (gx1 - gx0);
  [2, 2.67].forEach((fi) => {
    const x = gx0 + (fi / 4) * (gx1 - gx0);
    ctx.strokeStyle = palette.emphasis;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x, gy0);
    ctx.lineTo(x, gy1);
    ctx.stroke();
    ctx.setLineDash([]);
  });
  CURVES.forEach((c) => {
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= ckpt; i++) {
      const v = CKPTS[i][c.key] as number;
      const x = xAt(i);
      const y = gy1 - v * (gy1 - gy0 - 20);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const v = CKPTS[ckpt][c.key] as number;
    const x = xAt(ckpt);
    const y = gy1 - v * (gy1 - gy0 - 20);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  // x labels
  ctx.fillStyle = palette.inkMuted;
  CKPTS.forEach((c, i) => {
    ctx.fillText(c.iter, xAt(i) - 8, gy1 + 20);
  });
  // legend + lr panel
  CURVES.forEach((c, i) => {
    ctx.fillStyle = c.color;
    ctx.fillRect(760, 60 + i * 26, 14, 14);
    ctx.fillStyle = palette.ink;
    ctx.font = '14px sans-serif';
    ctx.fillText(c.label, 782, 72 + i * 26);
  });
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText('学习率', 760, 170);
  ctx.fillStyle = palette.ink;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(CKPTS[ckpt].lr, 760, 200);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '12px sans-serif';
  ctx.fillText('60K/80K 各降为 1/10', 760, 222);
  if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}

export const Mod71: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [ckpt, setCkpt] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    setupCanvas(canvas, W, H);
    drawCkpt(canvas, 0);
    const disconnect = observeCanvas(canvas, () => drawCkpt(canvas, ckpt), () => {});
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) drawCkpt(canvas, ckpt);
  }, [ckpt]);

  const tone = ckpt === 0 ? 'bad' : ckpt === 3 ? 'good' : 'mid';
  return (
    <div>
      <canvas ref={ref} aria-label="训练损失曲线" />
      <div className="controls">
        <button type="button" onClick={() => setCkpt((c) => Math.max(0, c - 1))} disabled={ckpt === 0}>
          上一步
        </button>
        <span className="val">迭代 {CKPTS[ckpt].iter}</span>
        <button type="button" onClick={() => setCkpt((c) => Math.min(3, c + 1))} disabled={ckpt === 3}>
          下一步
        </button>
        <button type="button" onClick={() => setCkpt(0)}>
          重置
        </button>
      </div>
      <div className={`feedback ${tone}`}>{CKPTS[ckpt].fb}</div>
    </div>
  );
};
