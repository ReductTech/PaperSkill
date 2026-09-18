import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 9 章 Module 9.1：插层位置 → 特征相似度曲线（混合视图，P6 拖拽/滑块）
const W = 1080;
const H = 280;

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ layer: 18 });
  const rafRef = useRef<number | null>(null);
  const [layer, setLayer] = useState(18);
  const [feedback, setFeedback] = useState({ text: '拖动滑块选择插入层，观察特征相似度曲线。', cls: '' });

  // 模拟跨层相似度：退化（红）随层数下降；恢复（蓝）在插层后保持
  const simAt = (l: number, k: number, isClean: boolean) => {
    if (isClean) return 1.0; // 干净表示恒为 1（参考）
    // 退化：随层数下降
    const deg = 1.0 - (l / 40) * 0.5;
    // 恢复：插层前退化，插层后回升并保持
    const res = l < k ? 1.0 - (l / 40) * 0.5 : 0.85 + (k / 40) * 0.1;
    return isClean ? 1.0 : l < k ? deg : res;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { layer: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const ax = 80, ay = 230, aw = 920, ah = 170;
      // 轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + aw, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax, ay - ah);
      ctx.stroke();
      // 轴标签
      ctx.fillStyle = '#68778f';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('相似度 1.0', ax + 6, ay - ah + 14);
      ctx.fillText('层 0', ax - 6, ay + 20);
      ctx.fillText('层 40', ax + aw - 30, ay + 20);
      // 干净参考线（绿虚线）
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ax, ay - ah);
      ctx.lineTo(ax + aw, ay - ah);
      ctx.stroke();
      ctx.setLineDash([]);
      // 退化曲线（红）
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let l = 0; l <= 40; l++) {
        const x = ax + (l / 40) * aw;
        const y = ay - simAt(l, s.layer, false) * ah;
        if (l === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 恢复曲线（蓝）
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let l = 0; l <= 40; l++) {
        const x = ax + (l / 40) * aw;
        const y = ay - simAt(l, s.layer, false) * ah;
        // 恢复曲线：插层前=退化，插层后回升
        const simRes = l < s.layer ? simAt(l, s.layer, false) : Math.min(1, 0.85 + (s.layer / 40) * 0.12);
        const yy = ay - simRes * ah;
        if (l === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      // 插层位置竖线
      const kx = ax + (s.layer / 40) * aw;
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(kx, ay);
      ctx.lineTo(kx, ay - ah);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f07e47';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('插层 K=' + s.layer, kx - 40, ay - ah + 30);
      // 图例
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(ax + 10, ay + 30, 20, 6);
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('退化表示', ax + 36, ay + 38);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(ax + 140, ay + 30, 20, 6);
      ctx.fillStyle = '#68778f';
      ctx.fillText('恢复表示', ax + 166, ay + 38);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.layer = v;
    setLayer(v);
    setFeedback(
      v < 10
        ? { text: `插入层 K=${v}：去噪太早，恢复表示在深层仍会轻微漂移。`, cls: '' }
        : v < 25
        ? { text: `插入层 K=${v}：在退化传播前纠正，恢复表示保持接近干净（论文选 K=18）。`, cls: 'good' }
        : { text: `插入层 K=${v}：去噪太晚，退化已累积，恢复效果下降。`, cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          插入层 K <span className="val">{layer}</span>
        </label>
        <input type="range" min={1} max={40} value={layer} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
