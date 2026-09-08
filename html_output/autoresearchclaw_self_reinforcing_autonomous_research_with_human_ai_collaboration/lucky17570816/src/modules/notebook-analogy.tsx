import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const scenes: Record<string, { label: string; color: string; target: string }> = {
  'chap-1': { label: '画出闭环', color: '#c43f52', target: '↻' }, 'chap-2': { label: '扫读三相', color: '#27446e', target: '三相' },
  'chap-3': { label: '写下反例', color: '#d97706', target: '?' }, 'chap-4': { label: '擦去错误', color: '#c43f52', target: '修' },
  'chap-5': { label: '盖上印章', color: '#228d5c', target: '✓' }, 'chap-6': { label: '夹住关键页', color: '#d97706', target: '!' },
  'chap-7': { label: '标亮教训', color: '#7c3aed', target: '30d' }, 'chap-8': { label: '对齐边框', color: '#27446e', target: '五机制' },
  'chap-9': { label: '校对协议', color: '#d97706', target: '表' }, 'chap-10': { label: '画下边界', color: '#228d5c', target: '证据' },
};
export function NotebookAnalogy({ chapterId }: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const scene = scenes[chapterId] || scenes['chap-1'];
    const ctx = setupCanvas(canvas, 244, 130); let raf = 0; let visible = false;
    const draw = (time: number) => { const t = (time % 3000) / 3000;
      ctx.clearRect(0,0,244,130); ctx.fillStyle='#f5f8f0'; ctx.fillRect(0,0,244,130);
      ctx.fillStyle='#fffdf8'; ctx.fillRect(16,12,212,106); ctx.strokeStyle='#b8c9a7'; ctx.lineWidth=2; ctx.strokeRect(16,12,212,106);
      ctx.strokeStyle='#d7deea'; ctx.lineWidth=1; for(let y=38;y<110;y+=17){ctx.beginPath();ctx.moveTo(32,y);ctx.lineTo(210,y);ctx.stroke();}
      ctx.fillStyle='#21324a'; ctx.font='12px sans-serif'; ctx.fillText(scene.label,28,29);
      ctx.fillStyle=scene.color; ctx.font='bold 15px sans-serif'; ctx.fillText(scene.target,173,30);
      const x=32+t*145; ctx.strokeStyle=scene.color; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath();ctx.moveTo(x,83);ctx.lineTo(x+20,72);ctx.stroke();
      ctx.fillStyle=scene.color;ctx.beginPath();ctx.arc(x+22,70,4,0,Math.PI*2);ctx.fill();
      if(visible) raf=requestAnimationFrame(draw);
    }; const stop=()=>{visible=false;cancelAnimationFrame(raf)}; const start=()=>{if(!visible){visible=true;raf=requestAnimationFrame(draw)}};
    const disconnect=observeCanvas(canvas,start,stop);start();return()=>{stop();disconnect()};
  },[chapterId]);
  return <canvas ref={ref} className="arc-canvas" aria-label="研究笔记动画" />;
}