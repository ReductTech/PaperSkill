import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 模块 8.2 —— P8 结果对比（混合：技术 + 生活）
// 对比三种用法在"关键信息在中间"时的答卷正确率。
const W = 720;
const H = 260;

const METHODS = [
  { name: '直接丢长上下文', v: 0.42, color: '#ff6b6b' },
  { name: '检索+随机拼', v: 0.58, color: '#ffd166' },
  { name: '检索+首尾摆放', v: 0.88, color: '#52e0a0' },
];

export function LitmMethodsCompare({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const [t, setT] = useState(0); // 0..1 动画进度

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    let raf = 0;
    const animate = () => {
      setT((prev) => (prev >= 1 ? 1 : prev + 0.02));
      raf = requestAnimationFrame(animate);
    };
    const start = () => { setT(0); animate(); };
    const stop = () => cancelAnimationFrame(raf);
    start();
    return () => stop();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0f1830';
    ctx.fillRect(0, 0, W, H);
    const baseY = H - 40;
    const maxH = 160;
    const bw = (W - 80) / METHODS.length;
    METHODS.forEach((m, i) => {
      const x = 40 + i * bw;
      const h = maxH * m.v * t;
      ctx.fillStyle = m.color;
      ctx.fillRect(x + 10, baseY - h, bw - 20, h);
      ctx.fillStyle = '#cfe0ff';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(m.name, x + bw / 2, baseY + 16);
      ctx.fillStyle = m.color;
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(`${Math.round(m.v * 100 * t)}%`, x + bw / 2, baseY - h - 8);
    });
    ctx.fillStyle = '#9fb3d9';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('（模拟：关键信息位于上下文正中间时的答对率）', W / 2, 24);
  }, [t]);

  return (
    <div className="litm-widget">
      <canvas ref={canvasRef} className="litm-canvas" />
      <p className="litm-hint">
        柱状图会自己长出来：当关键信息卡在<strong>中间</strong>时，直接把整本书丢给模型最吃亏；
        <strong>先检索、再把关键段落摆到首尾</strong>，正确率明显更高——这是论文给实践者的核心建议。
      </p>
    </div>
  );
}
