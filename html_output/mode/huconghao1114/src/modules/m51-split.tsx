import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, board, slip, filmChip, arrowLine, label, barH, lamp, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 5.1 Split-plan selector. Verified data: Table 1 (SeqLoRA / MoELoRA /
// MoDE) and Table 9 (Decoupled LoRA). Left shows the parameter-block sketch and
// whether the first-order conflict exists; right shows three verified metrics.
const W = 1080;
const H = 280;

type Plan = 'seq' | 'moelora' | 'decoupled' | 'mode';
const PLANS: Array<{ key: Plan; label: string }> = [
  { key: 'seq', label: '共用单盘 SeqLoRA' },
  { key: 'moelora', label: '共用多专家 MoE-LoRA' },
  { key: 'decoupled', label: '解耦双盘（无蒸馏）' },
  { key: 'mode', label: '完整 MoDE' },
];
const DATA: Record<Plan, { fid: number; acc: number; fgt: number; conflict: boolean; note: string; cls: string }> = {
  seq: { fid: 56.12, acc: 28.43, fgt: 35.33, conflict: true, note: '共用单盘：答题与出图在同组参数上拉扯（表1）。', cls: 'bad' },
  moelora: { fid: 65.16, acc: 33.01, fgt: 30.77, conflict: true, note: '共用多专家：共享面更大，FID 反而恶化到 65.16（表1）。', cls: 'bad' },
  decoupled: { fid: 54.74, acc: 30.59, fgt: 32.79, conflict: false, note: '解耦双盘但不蒸馏（表9）：跨块冲突消失，块内漂移还在。', cls: '' },
  mode: { fid: 53.74, acc: 33.47, fgt: 25.99, conflict: false, note: '完整 MoDE（解耦+路由+蒸馏）：三条线都不落后（表1）。', cls: 'good' },
};

function drawBlocks(ctx: CanvasRenderingContext2D, plan: Plan) {
  const x = 40;
  const y = 56;
  const conflict = DATA[plan].conflict;
  if (plan === 'seq') {
    board(ctx, x, y, 200, 120);
    slip(ctx, x + 16, y + 26, 60, 40, SC.blue);
    filmChip(ctx, x + 110, y + 26, 44, SC.green);
    arrowLine(ctx, x + 46, y + 66, x + 100, y + 96, SC.blue, 2);
    arrowLine(ctx, x + 130, y + 70, x + 80, y + 100, SC.green, 2);
  } else if (plan === 'moelora') {
    board(ctx, x, y, 200, 120, '');
    for (let i = 0; i < 4; i++) {
      const wx = x + 14 + (i % 2) * 92;
      const wy = y + 22 + Math.floor(i / 2) * 44;
      ctx.fillStyle = mix(SC.purple, SC.bg, 0.65);
      ctx.fillRect(wx, wy, 78, 34);
      ctx.strokeStyle = SC.shade;
      ctx.strokeRect(wx, wy, 78, 34);
    }
    slip(ctx, x + 20, y + 74, 46, 28, SC.blue);
    filmChip(ctx, x + 128, y + 74, 34, SC.green);
  } else {
    const gap = plan === 'mode' ? 0 : 26;
    board(ctx, x, y, 128, 120);
    ctx.fillStyle = mix(SC.blue, SC.bg, 0.3);
    ctx.fillRect(x + 18, y + 36, 92, 48);
    board(ctx, x + 128 + 26 + gap, y, 128, 120);
    ctx.fillStyle = mix(SC.green, SC.bg, 0.3);
    ctx.fillRect(x + 128 + 26 + gap + 18, y + 36, 92, 48);
    slip(ctx, x + 30, y + 44, 56, 30, SC.blue);
    filmChip(ctx, x + 128 + 26 + gap + 32, y + 44, 36, SC.green);
  }
  lamp(ctx, x + 100, 210, 12, !conflict, conflict ? SC.red : SC.green);
  label(ctx, conflict ? '一阶冲突：有' : '一阶冲突：无', x + 122, 215, conflict ? SC.red : SC.green, 13);
}

export const M51Split: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [plan, setPlan] = useState<Plan>('seq');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.classList.add('is-ready');
    const d = DATA[plan];
    clearStudio(ctx, W, H, 0.96);
    drawBlocks(ctx, plan);
    // right: three verified metric bars
    const bx = 480;
    label(ctx, 'FID', bx, 76, SC.muted, 12);
    barH(ctx, bx + 40, 62, 340, (d.fid - 50) / 16, 22, d.fid > 54 ? SC.red : SC.green);
    label(ctx, d.fid.toFixed(2), bx + 388, 79, d.fid > 54 ? SC.red : SC.green, 13);
    label(ctx, 'ACC', bx, 136, SC.muted, 12);
    barH(ctx, bx + 40, 122, 340, (d.acc - 20) / 16, 22, SC.blue);
    label(ctx, d.acc.toFixed(2), bx + 388, 139, SC.blue, 13);
    label(ctx, 'Fgt', bx, 196, SC.muted, 12);
    barH(ctx, bx + 40, 182, 340, d.fgt / 36, 22, d.fgt > 28 ? SC.red : SC.green);
    label(ctx, d.fgt.toFixed(2), bx + 388, 199, d.fgt > 28 ? SC.red : SC.green, 13);
    // zero-shot FID reference tick at 52.13
    const zx = bx + 40 + ((52.13 - 50) / 16) * 340;
    ctx.strokeStyle = SC.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(zx, 54);
    ctx.lineTo(zx, 90);
    ctx.stroke();
    label(ctx, '零样本', zx - 22, 48, SC.muted, 10);
  }, [plan]);

  return (
    <div>
      <div className="chip-row">
        {PLANS.map((p) => (
          <button key={p.key} className={`chip ${plan === p.key ? 'selected' : ''}`} onClick={() => setPlan(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className={`feedback ${DATA[plan].cls}`}>{DATA[plan].note}</div>
    </div>
  );
};
export default M51Split;
