import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, label, barH, mix, roundRect, print } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 3.1 Evidence desk. Verified data: Figure 2 car-column CLIP scores
// 0.3422 / 0.3289 / 0.2749 / 0.1458 (pretrained -> VQA task #3).
// The 0.15 reference line is a teaching device, not a paper threshold.
const W = 1080;
const H = 280;
const CLIP = [0.3422, 0.3289, 0.2749, 0.1458];
const STAGES = ['预训练底片', '学完 VQA #1', '学完 VQA #2', '学完 VQA #3'];
const SHORT = ['预训练', 'VQA #1', 'VQA #2', 'VQA #3'];
const SHIFT = [0, 0.18, 0.5, 0.85];
const NOTES = [
  { text: '预训练底片：car 画得又对又像，CLIP 0.3422。', cls: 'good' },
  { text: '学完 VQA #1：略微走样，CLIP 0.3289（−0.0133）——幅度还小。', cls: '' },
  { text: '学完 VQA #2：退化加速，CLIP 0.2749（−0.0673），仍在参考线上方。', cls: '' },
  { text: '学完 VQA #3：提示还是 "A photo of a car"，画出来的却是建筑，CLIP 0.1458（图2）。', cls: 'bad' },
];

export const M31Degrade: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);

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
    clearStudio(ctx, W, H, 0.95);
    // light box: four prints that degrade task by task
    ctx.fillStyle = mix(SC.ground, SC.paper, 0.5);
    roundRect(ctx, 24, 24, 636, 216, 6);
    ctx.fill();
    ctx.strokeStyle = stage >= 3 ? SC.red : stage === 0 ? SC.green : SC.shade;
    ctx.lineWidth = 3;
    ctx.stroke();
    SHORT.forEach((name, i) => {
      const px = 52 + i * 150;
      const py = 44;
      const active = i === stage;
      print(ctx, px, py, 128, 96, SC.green, SHIFT[i]);
      if (active) {
        ctx.strokeStyle = SC.blue;
        ctx.lineWidth = 3;
        ctx.strokeRect(px - 6, py - 6, 140, 108);
      }
      label(ctx, name, px + 64, py + 118, active ? SC.ink : SC.muted, 11, 'center');
    });
    label(ctx, '样片随任务逐渐偏色（原片对照上方图2）', 342, 226, SC.muted, 11, 'center');
    // right: CLIP mini bars for the car prompt
    const bx = 690;
    label(ctx, 'car 的 CLIP 分', bx + 130, 44, SC.ink, 13, 'center');
    CLIP.forEach((v, i) => {
      const y = 66 + i * 52;
      const active = i === stage;
      const color = v < 0.15 ? SC.red : active ? SC.blue : SC.shade;
      label(ctx, STAGES[i].replace('学完 ', ''), bx, y + 16, active ? SC.ink : SC.muted, 11);
      barH(ctx, bx + 96, y, 150, v / 0.4, 18, color);
      label(ctx, v.toFixed(4), bx + 256, y + 15, active ? SC.ink : SC.muted, 12);
      if (active) {
        ctx.strokeStyle = SC.blue;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 90, y - 5, 226, 28);
      }
    });
    // teaching reference line at 0.15
    const tx = bx + 96 + (0.15 / 0.4) * 150;
    ctx.strokeStyle = SC.red;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(tx, 58);
    ctx.lineTo(tx, 246);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, '参考线 0.15', tx - 26, 262, SC.red, 10);
  }, [stage]);

  return (
    <div>
      <div className="chip-row">
        {STAGES.map((s, i) => (
          <button key={s} className={`chip ${stage === i ? 'selected' : ''}`} onClick={() => setStage(i)}>
            {s}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className={`feedback ${NOTES[stage].cls}`}>{NOTES[stage].text}</div>
    </div>
  );
};
export default M31Degrade;
