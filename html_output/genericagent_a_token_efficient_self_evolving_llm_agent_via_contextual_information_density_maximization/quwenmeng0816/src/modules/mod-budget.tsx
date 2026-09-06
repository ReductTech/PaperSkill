import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawPen, drawLabel, bar, drawInkPath, startLoop, type Pt } from './journalKit';

const W = 560;
const H = 260;
const WTOK = 30000;
const B = 3 * WTOK;

export const ModBudget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ cH: 60000 });
  const [cH, setCH] = useState(60000);
  const ratio = cH / B;
  const fb =
    cH > B
      ? { text: 'C_H > B，将触发更强压缩或按时间丢掉最旧消息。', cls: 'bad' }
      : ratio > 0.8
        ? { text: '接近预算，仍靠分层压缩维持密度。', cls: '' }
        : { text: '仍在预算内。注意 α≈3 对中文可能低估真实 token。', cls: 'good' };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx) => {
      const v = stateRef.current.cH;
      const fill = Math.min(1, v / 150000);
      const color = v > B ? C.red : v > 0.8 * B ? C.orange : C.green;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 20, 16, 200, 190, 0, 0.25);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.28;
      ctx.fillRect(40, 190 - fill * 150, 160, fill * 150);
      ctx.globalAlpha = 1;
      const by = 190 - (B / 150000) * 150;
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, by);
      ctx.lineTo(228, by);
      ctx.stroke();
      const trail: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        trail.push({ x: 70 + Math.sin(t * 8) * 5, y: 40 + t * fill * 130 });
      }
      drawInkPath(ctx, trail, 1, color, 2.6);
      drawPen(ctx, 70, 40 + fill * 130, -0.3, color);
      drawLabel(ctx, `C_H = ${v.toLocaleString()} 字符`, 250, 48, C.text, 14);
      drawLabel(ctx, `B = 3 × 30,000 = ${B.toLocaleString()}`, 250, 74, C.orange, 13);
      drawLabel(ctx, `比值 ${(v / B).toFixed(2)}`, 250, 100, color, 14);
      bar(ctx, 250, 120, 280, 18, Math.min(1, v / B), color);
      drawLabel(ctx, '橙色实线是预算。写过这条线就要整理。', 250, 168, C.muted, 12);
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          历史字符 C_H <span className="val">{cH.toLocaleString()}</span>
        </label>
        <input
          type="range"
          min={10000}
          max={150000}
          step={1000}
          value={cH}
          onChange={(e) => {
            const v = Number(e.target.value);
            stateRef.current.cH = v;
            setCH(v);
          }}
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
