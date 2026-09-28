import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 类比卡 2：两支方向相反的箭（引 / 被引）→ 箭头褪去，只剩「离得近」与名次刻度。
const W = 560, H = 140;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', blue: '#27446e', red: '#c43f52', text: '#21324a', muted: '#68778f' };

export const Ana2: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const qx = 92, qy = 70;
    const A = { x: 214, y: 38 };   // q 引用它
    const B = { x: 214, y: 102 };  // 它引用 q
    const head = (x: number, y: number, ang: number, color: string, alpha: number) => {
      if (alpha <= 0.02) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 11 * Math.cos(ang - 0.42), y - 11 * Math.sin(ang - 0.42));
      ctx.lineTo(x - 11 * Math.cos(ang + 0.42), y - 11 * Math.sin(ang + 0.42));
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    let raf = 0; let t0 = performance.now();
    const tick = (now: number) => {
      const t = ((now - t0) / 3800) % 1;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.86, W, H * 0.14);
      const fade = Math.min(1, Math.max(0, (t - 0.32) / 0.24));   // 有向 → 无向
      const bars = Math.min(1, Math.max(0, (t - 0.60) / 0.26));   // 名次刻度浮现

      // 两条边：q→A（引）与 B→q（被引）
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(A.x, A.y); ctx.stroke();
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(qx, qy); ctx.stroke();
      // 箭头随对称化褪去
      const angA = Math.atan2(A.y - qy, A.x - qx);
      const angQ = Math.atan2(qy - B.y, qx - B.x);
      head(A.x - 3, A.y, angA, C.green, 1 - fade);
      head(qx + 3, qy, angQ, C.blue, 1 - fade);

      // 节点
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(qx, qy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(A.x, A.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(B.x, B.y, 6, 0, Math.PI * 2); ctx.fill();

      // 标签一：方向 → 邻居（放在两支箭头之间）
      ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = fade > 0.5 ? C.text : C.muted;
      ctx.fillText(fade > 0.5 ? '都算邻居' : '引 / 被引', 214, 70);

      // 名次刻度（越靠左越近）
      if (bars > 0.01) {
        const x0 = 310, dx = 36, y = 70;
        ctx.globalAlpha = bars;
        for (let i = 0; i < 6; i++) {
          const x = x0 + i * dx;
          const col = i < 2 ? C.green : i < 4 ? C.red : C.muted;
          ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
          if (i < 2 || i >= 4) { ctx.fillStyle = col; ctx.fill(); }
          else { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke(); }
        }
        ctx.strokeStyle = C.border; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 - 14, y); ctx.lineTo(x0 + 5 * dx + 14, y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = C.muted;
        ctx.fillText('名次', x0 + 2.5 * dx, 108);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(tick); } }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);
  return <canvas ref={ref} width={W} height={H} />;
};
export default Ana2;
