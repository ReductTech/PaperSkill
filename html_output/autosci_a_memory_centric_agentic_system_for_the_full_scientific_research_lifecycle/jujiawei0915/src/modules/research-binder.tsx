import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';

const actions: Record<string, string> = {
  'chap-1': '夹回散落片段', 'chap-2': '分开两类页', 'chap-3': '画出证据连线', 'chap-4': '归档验证发现', 'chap-5': '盖上写入状态章',
  'chap-6': '插入阶段书签', 'chap-7': '合页后从书签恢复', 'chap-8': '展开页边协作图', 'chap-9': '留下版本修订注记', 'chap-10': '并排查看证据与边界'
};

export const ResearchBinderAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const label = actions[chapterId] || '翻开研究活页册';
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, 540, 132); } catch { return; }
    ctx.clearRect(0, 0, 540, 132);
    ctx.fillStyle = '#e9dfc9'; ctx.fillRect(44, 20, 452, 96);
    ctx.fillStyle = '#0d4f55'; ctx.fillRect(48, 22, 10, 92);
    ctx.fillStyle = '#fffdf7'; ctx.fillRect(62, 26, 205, 84); ctx.fillRect(272, 26, 205, 84);
    ctx.strokeStyle = '#d0c5b0'; ctx.strokeRect(62, 26, 205, 84); ctx.strokeRect(272, 26, 205, 84);
    ctx.strokeStyle = open ? '#47d6c7' : '#b4a88d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(95, 77); ctx.lineTo(open ? 430 : 235, 77); ctx.stroke();
    ctx.fillStyle = '#164b58'; ctx.font = '600 15px Segoe UI'; ctx.fillText(open ? '已建立可追溯连接' : '等待一次操作', 83, 58);
    ctx.fillStyle = '#7f6c55'; ctx.font = '13px Segoe UI'; ctx.fillText(label, 83, 98);
    canvas.classList.add('is-ready');
  }, [label, open]);
  return <div className="binder-scene"><canvas ref={canvasRef} width="540" height="132" aria-label={`研究活页册：${label}`} /><button onClick={() => setOpen(!open)}>{open ? '收起本页连线' : `执行：${label}`}</button></div>;
};
