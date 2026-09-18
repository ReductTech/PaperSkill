import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 analogy — 六阶段循环：试运行 → 清洗 → 归因回滚 → 蒸馏 → 编辑 → 提交。
// 六个节点排在圆环上，高亮点顺时针绕行，经过的节点依次点亮。560x140, autoplay, 3.5s loop.

const W = 560;
const H = 140;
const LOOP = 3500;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  blue: '#27446e',
  green: '#228d5c',
};

const STAGES = ['试运行', '清洗', '归因回滚', '蒸馏', '编辑', '提交'];
const CX = 280;
const CY = 72;
const R = 46;
const NODE_R = 13;

function nodeAngle(i: number) {
  return -Math.PI / 2 + (i / STAGES.length) * Math.PI * 2;
}

export const AnaLogbookPen: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const t = (((now % LOOP) + LOOP) % LOOP) / LOOP;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 圆环轨道 + 顺时针方向箭头
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + ((i + 0.5) / 3) * Math.PI * 2;
        const ax = CX + Math.cos(a) * R;
        const ay = CY + Math.sin(a) * R;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = C.muted;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(4, 3);
        ctx.lineTo(-4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 高亮点当前角度（留 8% 首尾停顿感：线性即可，循环自然衔接）
      const orbit = -Math.PI / 2 + t * Math.PI * 2;

      // 尾迹弧
      ctx.strokeStyle = 'rgba(39,68,110,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(CX, CY, R, orbit - 0.6, orbit);
      ctx.stroke();

      // 节点：轨道点经过后点亮
      STAGES.forEach((label, i) => {
        const a = nodeAngle(i);
        const nx = CX + Math.cos(a) * R;
        const ny = CY + Math.sin(a) * R;
        // 已访问判定：轨道角（归一化到同一圈）越过节点角
        const visited = t * Math.PI * 2 >= (i / STAGES.length) * Math.PI * 2;
        const active =
          t * Math.PI * 2 >= (i / STAGES.length) * Math.PI * 2 &&
          t * Math.PI * 2 < ((i + 1) / STAGES.length) * Math.PI * 2;

        ctx.beginPath();
        ctx.arc(nx, ny, NODE_R, 0, Math.PI * 2);
        ctx.fillStyle = visited ? C.blue : C.panel;
        ctx.fill();
        ctx.lineWidth = active ? 3 : 2;
        ctx.strokeStyle = visited ? C.blue : C.muted;
        ctx.stroke();
        if (active) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 140);
          ctx.strokeStyle = `rgba(39,68,110,${0.25 + 0.3 * pulse})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(nx, ny, NODE_R + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        // 序号
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillStyle = visited ? '#ffffff' : C.muted;
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), nx, ny + 3.5);
        // 节点名：沿径向放外侧
        const lx = CX + Math.cos(a) * (R + NODE_R + 6);
        const ly = CY + Math.sin(a) * (R + NODE_R + 6);
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = visited ? C.text : C.muted;
        const cosA = Math.cos(a);
        if (Math.abs(cosA) < 0.35) ctx.textAlign = 'center';
        else ctx.textAlign = cosA > 0 ? 'left' : 'right';
        ctx.fillText(label, lx, ly + 4);
        ctx.textAlign = 'left';
      });

      // 高亮轨道点
      const ox = CX + Math.cos(orbit) * R;
      const oy = CY + Math.sin(orbit) * R;
      ctx.beginPath();
      ctx.arc(ox, oy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = C.green;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default AnaLogbookPen;
