import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawPaper, drawInkStroke, COLORS, drawSubText } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
const MODES = [
  { name: 'MSE 像素重建', desc: 'L<sub>pix</sub> = (1/3HW)‖Î − I‖<sub>2</sub><sup>2</sup>，直接最小化像素差异', color: COLORS.blue },
  { name: '结构感知重建', desc: 'L<sub>rec</sub> = L<sub>pix</sub> + α·L<sub>struct</sub>，额外匹配边缘和距离变换 (α=0.5)', color: COLORS.green },
];
export const Mod4_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState(0);
  const sRef = useRef(0);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => { t += 0.02;
      clearScene(ctx, W, H);
      const m = MODES[sRef.current];
      // Original stroke
      drawPaper(ctx, 40, 40, 200, 200);
      drawInkStroke(ctx, [{x:70,y:80},{x:210,y:80}], 5, COLORS.ink, 0.9);
      drawInkStroke(ctx, [{x:140,y:80},{x:140,y:200}], 5, COLORS.ink, 0.9);
      drawInkStroke(ctx, [{x:140,y:130},{x:90,y:200}], 4, COLORS.ink, 0.85);
      drawInkStroke(ctx, [{x:140,y:130},{x:190,y:200}], 4, COLORS.ink, 0.85);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('原始笔画', 100, 255);
      // Arrow
      ctx.fillStyle = COLORS.ink; ctx.font = '20px sans-serif';
      ctx.fillText('→', 260, 140);
      // Reconstructed
      drawPaper(ctx, 300, 40, 200, 200);
      if (sRef.current === 0) {
        // MSE: slightly blurry edges
        drawInkStroke(ctx, [{x:330,y:80},{x:470,y:80}], 7, COLORS.ink, 0.7 + Math.sin(t) * 0.05);
        drawInkStroke(ctx, [{x:400,y:80},{x:400,y:200}], 7, COLORS.ink, 0.65);
        drawInkStroke(ctx, [{x:400,y:130},{x:350,y:200}], 6, COLORS.ink, 0.6);
        drawInkStroke(ctx, [{x:400,y:130},{x:450,y:200}], 6, COLORS.ink, 0.6);
      } else {
        // Structure-aware: sharp edges
        drawInkStroke(ctx, [{x:330,y:80},{x:470,y:80}], 5, COLORS.ink, 0.9);
        drawInkStroke(ctx, [{x:400,y:80},{x:400,y:200}], 5, COLORS.ink, 0.88);
        drawInkStroke(ctx, [{x:400,y:130},{x:350,y:200}], 4, COLORS.ink, 0.85);
        drawInkStroke(ctx, [{x:400,y:130},{x:450,y:200}], 4, COLORS.ink, 0.85);
        // Edge highlight
        ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 1;
        ctx.strokeRect(328, 78, 144, 5);
        ctx.strokeRect(398, 78, 5, 124);
      }
      ctx.fillStyle = m.color; ctx.font = '12px sans-serif';
      ctx.fillText('重建结果', 360, 255);
      // Edge comparison inset
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('边缘保留对比', 560, 50);
      ctx.strokeStyle = COLORS.border; ctx.strokeRect(560, 65, 200, 100);
      if (sRef.current === 0) {
        ctx.fillStyle = COLORS.red; ctx.font = '14px sans-serif';
        ctx.fillText('边缘模糊 (MSE)', 590, 100);
        ctx.fillText('笔画宽度偏差: +40%', 580, 125);
        ctx.fillText('交叉点粘连', 580, 150);
      } else {
        ctx.fillStyle = COLORS.green; ctx.font = '14px sans-serif';
        ctx.fillText('边缘清晰 (结构感知)', 575, 100);
        ctx.fillText('笔画宽度偏差: +5%', 580, 125);
        ctx.fillText('交叉点可分', 580, 150);
      }
      // Formula
      drawSubText(ctx, sRef.current === 0 ? 'L_rec = L_pix (MSE)' : 'L_rec = L_pix + 0.5×L_struct', 560, 200, 14, COLORS.ink);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      drawSubText(ctx, 'L_struct = 距离变换L1 + 软边缘图L1 (β=0.25)', 560, 225, 12, COLORS.inkLight, 'sans-serif');
      ctx.fillText('结构感知损失仅用于文档理解实验', 560, 245);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl">
      {MODES.map((m, i) => (<button key={i} className={mode === i ? 'chip selected' : 'chip'} onClick={() => { sRef.current = i; setMode(i); }}>{m.name}</button>))}
    </div>
    <div className={`feedback ${mode === 1 ? 'good' : ''}`} dangerouslySetInnerHTML={{ __html: MODES[mode].desc + '。切换两种重建策略，观察笔画边缘和交叉点的保留差异。' }} /></div>);
};
export default Mod4_2;
