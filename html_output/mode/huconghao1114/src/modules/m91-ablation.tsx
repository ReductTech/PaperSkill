import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, label, lamp, barH, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 9.1 Component switchboard. Verified data: Table 3 (Chameleon baseline /
// +T-MoE only / +MoDE w/o KD / +MoDE) and Table 9 (Decoupled LoRA).
const W = 1080;
const H = 280;

type Cfg = 'seq' | 'dec' | 'tmoe' | 'nokd' | 'full';
const CFGS: Array<{ key: Cfg; label: string; lamps: [boolean, boolean, boolean]; acc: number; fgt: number; fid: number; note: string; cls: string }> = [
  { key: 'seq', label: '朴素 SeqLoRA', lamps: [false, false, false], acc: 28.43, fgt: 35.33, fid: 56.12, note: '朴素 SeqLoRA：全部共用，Fgt 35.33 最高、FID 56.12——三项垫底（表1）。', cls: 'bad' },
  { key: 'dec', label: '仅解耦', lamps: [true, false, false], acc: 30.59, fgt: 32.79, fid: 54.74, note: '仅解耦（表9）：ACC +2.16、FID −1.38——跨块冲突消失，块内漂移还在。', cls: '' },
  { key: 'tmoe', label: '仅 T-MoE', lamps: [false, true, false], acc: 33.03, fgt: 28.65, fid: 51.28, note: '仅 T-MoE：完全不碰视觉，FID 51.28 反而最好看，但理解只有 33.03（表3）。', cls: '' },
  { key: 'nokd', label: 'MoDE w/o KD', lamps: [true, true, false], acc: 33.07, fgt: 26.49, fid: 54.61, note: 'MoDE w/o KD：解耦+路由都在、不锚定：FID 恶化到 54.61——蒸馏是唯一为生成付账的组件（表3）。', cls: 'bad' },
  { key: 'full', label: '完整 MoDE', lamps: [true, true, true], acc: 33.47, fgt: 25.99, fid: 53.74, note: '完整 MoDE：33.47 / 25.99 / 53.74——三件套缺一不可（表3）。', cls: 'good' },
];

export const M91Ablation: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cfg, setCfg] = useState<Cfg>('seq');
  const idx = CFGS.findIndex((c) => c.key === cfg);
  const cur = CFGS[idx];

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
    clearStudio(ctx, W, H, 0.96);
    // lamp panel: decouple / route / distill
    label(ctx, '解耦', 90, 232, cur.lamps[0] ? SC.green : SC.muted, 12, 'center');
    label(ctx, '路由', 210, 232, cur.lamps[1] ? SC.purple : SC.muted, 12, 'center');
    label(ctx, '蒸馏', 330, 232, cur.lamps[2] ? SC.orange : SC.muted, 12, 'center');
    lamp(ctx, 90, 196, 14, cur.lamps[0], SC.green);
    lamp(ctx, 210, 196, 14, cur.lamps[1], SC.purple);
    lamp(ctx, 330, 196, 14, cur.lamps[2], SC.orange);
    // metric bars
    const bx = 460;
    label(ctx, 'ACC', bx, 74, SC.muted, 12);
    barH(ctx, bx + 40, 60, 380, (cur.acc - 26) / 8, 22, cur.key === 'full' ? SC.green : SC.blue);
    label(ctx, cur.acc.toFixed(2), bx + 428, 77, SC.ink, 13);
    label(ctx, 'Fgt', bx, 134, SC.muted, 12);
    barH(ctx, bx + 40, 120, 380, cur.fgt / 36, 22, cur.fgt > 28 ? SC.red : SC.green);
    label(ctx, cur.fgt.toFixed(2), bx + 428, 137, cur.fgt > 28 ? SC.red : SC.green, 13);
    label(ctx, 'FID', bx, 194, SC.muted, 12);
    const fidColor = cur.fid <= 53 ? SC.green : cur.fid <= 55 ? SC.orange : SC.red;
    barH(ctx, bx + 40, 180, 380, (cur.fid - 50) / 16, 22, fidColor);
    label(ctx, cur.fid.toFixed(2), bx + 428, 197, fidColor, 13);
    // zero-shot FID reference tick (52.13)
    const zx = bx + 40 + ((52.13 - 50) / 16) * 380;
    ctx.strokeStyle = SC.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(zx, 172);
    ctx.lineTo(zx, 206);
    ctx.stroke();
  }, [cur]);

  return (
    <div>
      <div className="chip-row">
        {CFGS.map((c) => (
          <button key={c.key} className={`chip ${cfg === c.key ? 'selected' : ''}`} onClick={() => setCfg(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className={`feedback ${cur.cls}`}>{cur.note}</div>
    </div>
  );
};
export default M91Ablation;
