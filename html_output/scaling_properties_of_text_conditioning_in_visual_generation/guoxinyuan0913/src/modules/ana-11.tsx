import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 580, H = 168;

// §11 类比：三个镜头收束全程（缩略图版总结：两条缩放律 + 双轴干预）
export const Ana11: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = '100%';
    canvas.style.maxWidth = W + 'px';
    canvas.style.height = 'auto';
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const phase = Math.floor(t * 0.7) % 3; // 依次点亮三个镜头
      ctx.font = '600 12px "Microsoft YaHei", sans-serif';

      // ── 镜头①：GPG 线性 ──
      const p1 = phase === 0;
      ctx.fillStyle = p1 ? C.blue : C.muted;
      ctx.fillText('① GPG ↗ 损失 ↘ 线性', 14, 20);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.strokeRect(24, 32, 150, 74);
      ctx.beginPath(); ctx.moveTo(24, 32); ctx.lineTo(24, 106); ctx.lineTo(174, 106); ctx.stroke();
      ctx.strokeStyle = p1 ? C.orange : C.border; ctx.lineWidth = p1 ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(40, 46); ctx.lineTo(160, 96); ctx.stroke();
      if (p1) {
        const k = (t * 0.7) % 1;
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(40 + 120 * k, 46 + 50 * k, 4, 0, Math.PI * 2); ctx.fill();
      }

      // ── 镜头②：ED 幂律 ──
      const p2 = phase === 1;
      ctx.fillStyle = p2 ? C.blue : C.muted;
      ctx.fillText('② ED ↗ 损失 ↘ 幂律', 208, 20);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.strokeRect(218, 32, 150, 74);
      ctx.beginPath(); ctx.moveTo(218, 32); ctx.lineTo(218, 106); ctx.lineTo(368, 106); ctx.stroke();
      ctx.strokeStyle = p2 ? C.orange : C.border; ctx.lineWidth = p2 ? 2.5 : 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 30; i++) {
        const x = 234 + i * 4.2;
        const y = 48 + 58 * Math.pow(i / 30, 0.55); // 幂律凸形：高位急降后趋平
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (p2) {
        const k = (t * 0.7) % 1;
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(234 + 126 * k, 48 + 58 * Math.pow(k, 0.55), 4, 0, Math.PI * 2); ctx.fill();
      }

      // ── 镜头③：双轴干预 ──
      const p3 = phase === 2;
      ctx.fillStyle = p3 ? C.blue : C.muted;
      ctx.fillText('③ 两个干预，各对一轴', 412, 20);
      const chip = (y: number, txt: string, on: boolean) => {
        ctx.fillStyle = on ? 'rgba(240,126,71,0.16)' : C.sheet;
        ctx.strokeStyle = on ? C.orange : C.border; ctx.lineWidth = on ? 2 : 1;
        ctx.beginPath(); ctx.roundRect(412, y, 158, 30, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.fillText(txt, 424, y + 19);
        ctx.font = '600 12px "Microsoft YaHei", sans-serif';
      };
      chip(36, 'SP → 可扩散性 ↑', p3);
      chip(76, 'LLM 提示器 → 可提示性 ↑', p3);
      ctx.fillStyle = C.green; ctx.font = '800 15px "Microsoft YaHei", sans-serif';
      ctx.fillText('72.5 vs 56.2', 428, 134);
      ctx.fillStyle = C.muted; ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('GenEval2：SP vs 匹配 NL', 412, 152);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" />;
};
