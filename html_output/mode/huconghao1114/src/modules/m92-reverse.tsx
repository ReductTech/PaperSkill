import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, easeOutCubic } from '../lib/canvasKit';
import { SC, clearStudio, label, barH } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 9.2 Bidirectional verifier (Table 1 + Table 10, Appendix F). One start
// button animates both panels from the zero-shot baseline at the same time.
const W = 1080;
const H = 280;

export const M92Reverse: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [runKey, setRunKey] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const D = 1600;

    const draw = (prog: number) => {
      clearStudio(ctx, W, H, 0.97);
      // center divider
      ctx.strokeStyle = SC.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(540, 24);
      ctx.lineTo(540, 224);
      ctx.stroke();
      // left panel: learning answers, testing generation (FID)
      label(ctx, '学答题 → 测出图', 270, 48, SC.ink, 14, 'center');
      const rows: Array<[string, number, string]> = [
        ['SeqLoRA', 56.12, SC.red],
        ['MoDE', 53.74, SC.green],
      ];
      rows.forEach(([name, v, color], i) => {
        const y = 70 + i * 46;
        const g = easeOutCubic(Math.min(1, Math.max(0, prog * 1.4 - i * 0.15)));
        label(ctx, name, 40, y + 15, SC.muted, 12);
        barH(ctx, 110, y, 340, ((v - 50) / 6) * g, 20, color);
        label(ctx, v.toFixed(2), 458, y + 15, color, 13);
      });
      const zx = 110 + ((52.13 - 50) / 6) * 340;
      ctx.strokeStyle = SC.ink;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(zx, 62);
      ctx.lineTo(zx, 162);
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, '零样本 52.13', zx - 30, 178, SC.muted, 10);
      // right panel: learning generation, testing understanding (Table 10)
      label(ctx, '学生成 → 测答题', 810, 48, SC.ink, 14, 'center');
      const groups: Array<[string, number, number, number]> = [
        ['ScienceQA', 45.81, 51.28, 51.52],
        ['TextVQA', 12.25, 23.44, 23.49],
        ['ImageNet', 0.0, 16.61, 16.53],
      ];
      groups.forEach(([name, lo, mo, zs], i) => {
        const y = 66 + i * 52;
        const gl = easeOutCubic(Math.min(1, Math.max(0, prog * 1.4 - i * 0.15)));
        label(ctx, name, 570, y + 12, SC.muted, 11);
        barH(ctx, 660, y, 180, (lo / 60) * gl, 14, SC.red);
        label(ctx, lo.toFixed(2), 846, y + 12, SC.red, 11);
        barH(ctx, 660, y + 18, 180, (mo / 60) * gl, 14, SC.green);
        label(ctx, mo.toFixed(2), 846, y + 30, SC.green, 11);
        // zero-shot tick
        const zxr = 660 + (zs / 60) * 180;
        ctx.strokeStyle = SC.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(zxr, y - 3);
        ctx.lineTo(zxr, y + 34);
        ctx.stroke();
      });
      label(ctx, '红=LoRA · 绿=MoDE · 竖线=零样本', 810, 226, SC.muted, 11, 'center');
    };

    const tick = () => {
      const prog = Math.min(1, (performance.now() - t0) / D);
      draw(started ? prog : 0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (started && prog < 1) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [runKey, started]);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <button
          className="chip"
          onClick={() => {
            setStarted(true);
            setRunKey((k) => k + 1);
          }}
        >
          同时开跑
        </button>
        <label>
          {started ? '已跑完一轮，可重放' : '先看零样本基线'}
        </label>
      </div>
      <div className={`feedback ${started ? 'good' : ''}`}>
        {started
          ? '左栏：学答题把 SeqLoRA 的 FID 推到 56.12，MoDE 守在 53.74；右栏：学生成把 LoRA 的 ImageNet 打到 0.00，MoDE 保住 16.61（零样本 16.53）——保护的是「没被训练的那个模态」，两个方向都成立（附录F）。'
          : '先看零样本基线，再按「同时开跑」：左栏对照表1，右栏对照表10（附录F 的反向实验）。'}
      </div>
    </div>
  );
};
export default M92Reverse;
