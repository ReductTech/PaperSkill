import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, label, barH } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 4.2 Step-size knob. Fixed conflict angle 120 deg (cos=-0.5);
// first = eta*0.5 grows linearly, second = eta^2*lambda_max/2 (lambda_max=2 demo)
// grows quadratically. Slider is logarithmic in [0.001, 0.5].
const W = 1080;
const H = 280;
const MAX = 0.25;

function sliderToEta(v: number): number {
  const lo = Math.log10(0.001);
  const hi = Math.log10(0.5);
  return Math.pow(10, lo + (hi - lo) * (v / 1000));
}

export const M42Eta: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [slider, setSlider] = useState(() => Math.round(((Math.log10(0.1) - Math.log10(0.001)) / (Math.log10(0.5) - Math.log10(0.001))) * 1000));
  const eta = sliderToEta(slider);

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
    const first = eta * 0.5;
    const second = eta * eta;
    // left: big bare numbers
    label(ctx, `η = ${eta.toFixed(3)}`, 60, 92, SC.ink, 26);
    label(ctx, 'cos = −0.5（冲突）', 60, 124, SC.red, 13);
    label(ctx, '一阶 ∝ η', 60, 168, SC.red, 12);
    label(ctx, '二阶 ∝ η²', 60, 196, SC.orange, 12);
    // right: two bars with a shared 0.25 scale
    const bx = 480;
    label(ctx, '一阶项', bx, 76, SC.muted, 12);
    barH(ctx, bx + 60, 62, 380, first / MAX, 24, SC.red);
    label(ctx, first.toFixed(3), bx + 448, 80, SC.red, 14);
    label(ctx, '二阶项', bx, 146, SC.muted, 12);
    barH(ctx, bx + 60, 132, 380, second / MAX, 24, SC.orange);
    label(ctx, second.toFixed(3), bx + 448, 150, SC.orange, 14);
    // scale ticks
    [0.05, 0.1, 0.15, 0.2, 0.25].forEach((v) => {
      const x = bx + 60 + (v / MAX) * 380;
      ctx.strokeStyle = SC.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 168);
      ctx.lineTo(x, 178);
      ctx.stroke();
      label(ctx, v.toFixed(2), x, 192, SC.muted, 9, 'center');
    });
    // ratio readout
    const ratio = first > 0 ? second / first : 0;
    label(ctx, `二阶 / 一阶 = ${ratio.toFixed(2)}`, bx + 60, 236, ratio > 0.8 ? SC.red : SC.muted, 13);
  }, [eta]);

  let fb: { text: string; cls: string };
  if (eta <= 0.05) {
    fb = { text: `η=${eta.toFixed(3)}：一阶干扰 ${(eta * 0.5).toFixed(3)} 主导——调小 η 消不掉它，归零要靠解耦（§5）。`, cls: '' };
  } else if (eta < 0.3) {
    fb = { text: `η=${eta.toFixed(3)}：一阶 ${(eta * 0.5).toFixed(3)}，二阶 ${(eta * eta).toFixed(3)}——小步长下二阶仍可忽略。`, cls: '' };
  } else {
    fb = { text: `η=${eta.toFixed(3)}：二阶 ${(eta * eta).toFixed(3)} 开始追平一阶 ${(eta * 0.5).toFixed(3)}——大步长连二阶都危险。`, cls: 'bad' };
  }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <label>
          学习率 η <span className="val">{eta.toFixed(3)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1000}
          value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M42Eta;
