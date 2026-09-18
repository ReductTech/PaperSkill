import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 8 章 Module 8.2：帧级 vs 全局注意力（技术视图，P4 芯片）
// 补充原理性解释，用清晰的三视角 token 网格展示两种注意力作用范围。
const W = 1080;
const H = 300;

export const Ch8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'global' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState('global');
  const [feedback, setFeedback] = useState({ text: '切换注意力类型，观察作用范围。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { mode: string }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('三个视角的特征 token 网格', 80, 34);

      // 画 3 个视角（3 列）
      const cols = 3;
      const colW = 300;
      for (let v = 0; v < cols; v++) {
        const cx = 80 + v * colW;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, 48, 240, 180);
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, 48, 240, 180);
        ctx.fillStyle = '#68778f';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('视角 ' + (v + 1), cx + 10, 70);
        // 每个视角内的 token 点（3×4 网格）
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) {
            const px = cx + 55 + c * 50, py = 95 + r * 48;
            ctx.fillStyle = '#b8c9a7';
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (s.mode === 'frame') {
        // 帧级：只在本视角内连线（展示局部聚合）
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 2.5;
        for (let v = 0; v < cols; v++) {
          const cx = 80 + v * colW;
          // 同一视角内 token 互相连线（局部注意力）
          ctx.beginPath();
          ctx.moveTo(cx + 55, 95);
          ctx.lineTo(cx + 155, 95);
          ctx.lineTo(cx + 155, 191);
          ctx.lineTo(cx + 105, 191);
          ctx.stroke();
        }
        // 原理说明
        ctx.fillStyle = '#68778f';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('帧级注意力：每个视角内部单独聚合，提取局部空间结构（纹理、边缘）。', 80, 260);
        ctx.fillText('视角之间互不通信，无法利用跨视角对应信息。', 80, 284);
      } else {
        // 全局：跨视角连线（展示跨视角对应）
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2.5;
        for (let v = 0; v < cols - 1; v++) {
          const x1 = 80 + v * colW + 155, x2 = 80 + (v + 1) * colW + 55;
          // 跨视角对应 token 连线
          ctx.beginPath();
          ctx.moveTo(x1, 143);
          ctx.lineTo(x2, 143);
          ctx.stroke();
        }
        // 高亮跨视角对应点
        for (let v = 0; v < cols; v++) {
          const cx = 80 + v * colW;
          ctx.fillStyle = '#228d5c';
          ctx.beginPath();
          ctx.arc(cx + 155, 143, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        // 原理说明
        ctx.fillStyle = '#68778f';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('全局注意力：跨视角 token 互相通信，建立几何对应关系，强制多视角一致性。', 80, 260);
        ctx.fillText('这正是 GARD 去噪器实现跨视角建模的关键设计。', 80, 284);
      }
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

  const select = (m: string) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback(
      m === 'frame'
        ? { text: '帧级注意力：在每个视角内部聚合局部空间结构，视角间互不通信。', cls: '' }
        : { text: '全局注意力：跨视角聚合，利用对应关系强制几何一致性——GARD 的关键设计。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'frame' ? 'selected' : ''}`} onClick={() => select('frame')}>帧级注意力</button>
        <button className={`chip ${mode === 'global' ? 'selected' : ''}`} onClick={() => select('global')}>全局注意力</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod2;
