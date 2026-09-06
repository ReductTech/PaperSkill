import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, card, clearDesk, label, notebook } from './handbook-kit';

const W = 244, H = 130;
export const HandbookAnalogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0, active = false, started = performance.now();
    const ch = Number(chapterId.replace('chap-', '')) || 0;
    const draw = (now: number) => {
      const t = ((now - started) % 3000) / 3000; const wave = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
      clearDesk(ctx, W, H);
      if (chapterId === 'hero' && moduleId === 'old') {
        card(ctx, 38, 31, 168, 66, '隐藏提示词', C.red); ctx.fillStyle = 'rgba(33,50,74,.78)'; ctx.fillRect(47, 44, 150, 40); label(ctx, '来源与版本不可见', 122, 109, C.red, 'center');
      } else if (chapterId === 'hero') {
        notebook(ctx, 36, 24, 170, 78, C.green); ['能力','边界','来源','v2'].forEach((x,i)=>{ctx.fillStyle=[C.blue,C.purple,C.orange,C.green][i];ctx.fillRect(51+i*38,37,28,10);}); label(ctx,'可读 · 可改 · 可回滚',122,112,C.green,'center');
      } else {
        notebook(ctx, 52, 23, 144, 80, C.blue);
        const names = ['收录证据','打开 A/M/L','照亮页边','分开双轨','贴上预设','勾选阶段','修订版本','点击索引','锁定柜门','盖范围章'];
        const x = 38 + wave * 76;
        if ([1,5,9,10].includes(ch)) card(ctx, x, 47, 62, 28, ch===10?'分发表面':ch===9?'本地优先':'来源卡', ch===9?C.green:C.orange);
        else { ctx.strokeStyle = ch===7?C.red:C.blue; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x,42); ctx.lineTo(x+24,78); ctx.stroke(); ctx.fillStyle=ch===7?C.green:C.orange; ctx.beginPath(); ctx.arc(x+24,78,5,0,Math.PI*2); ctx.fill(); }
        label(ctx, names[ch-1] || '维护手册', 122, 113, ch===7?C.green:C.blue, 'center');
      }
      if (active) raf = requestAnimationFrame(draw); canvas.classList.add('is-ready');
    };
    const start=()=>{if(!active){active=true;started=performance.now();raf=requestAnimationFrame(draw);}};
    const stop=()=>{active=false;if(raf)cancelAnimationFrame(raf);}; const disconnect=observeCanvas(canvas,start,stop);
    return()=>{stop();disconnect();};
  }, [chapterId, moduleId]);
  return <canvas ref={ref} width={W} height={H} aria-label="可追溯目标人物技能工件动画" />;
};
export default HandbookAnalogy;
