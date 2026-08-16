import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4 Module 1 —— 系统三件套：Student / Teacher / Frozen Corner Detector
// 点击三个框，高亮并显示各自职责：谁被更新、谁是 EMA、谁冻结。
const W = 560;
const H = 260;

type Which = 'student' | 'teacher' | 'corner';

const INFO: Record<Which, { title: string; role: string; train: string; out: string }> = {
  student: {
    title: 'Student ViT',
    role: '真正被梯度更新的主模型',
    train: '✅ 反向传播更新 backbone + 各 head',
    out: '输出：语义特征 + 边界几何，供 loss 反向传播',
  },
  teacher: {
    title: 'Teacher ViT',
    role: 'Student 的 EMA 副本（历史平均）',
    train: '❌ 无梯度；每次迭代后 θ̄ ← λθ̄ + (1−λ)θ',
    out: '输出：在线预测边界场（造伪标签的目标）',
  },
  corner: {
    title: 'Frozen Corner Detector',
    role: '单 block 小 ViT，完全冻结',
    train: '❌ 不参与训练，只在前向找角点',
    out: '输出：稀疏角点 C₁…Cₘ，给解码做锚点',
  },
};

export const M44Sys: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<Which>('student');
  const [feedback, setFeedback] = useState({
    text: '点击三个框，看系统三件套各自干什么：谁被更新、谁是 EMA、谁冻结。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (w: Which) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // RGB image 输入
      const imgX = (W - 120) / 2;
      ctx.fillStyle = '#21324a';
      ctx.fillRect(imgX, 12, 120, 34);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('RGB image', imgX + 18, 35);

      // 三列
      const cols: Array<{ id: Which; x: number; label: string; color: string }> = [
        { id: 'student', x: 24, label: 'Student', color: '#27446e' },
        { id: 'teacher', x: 205, label: 'Teacher', color: '#7c3aed' },
        { id: 'corner', x: 386, label: 'Corner Det', color: '#228d5c' },
      ];
      const bw = 150;
      const by = 66;
      const bh = 92;
      cols.forEach((c) => {
        const active = w === c.id;
        ctx.fillStyle = active ? c.color : '#ffffff';
        ctx.fillRect(c.x, by, bw, bh);
        ctx.strokeStyle = active ? c.color : '#9fb0c8';
        ctx.lineWidth = active ? 3 : 1.6;
        ctx.strokeRect(c.x, by, bw, bh);
        ctx.fillStyle = active ? '#fff' : c.color;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(c.label, c.x + 22, by + 40);
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = active ? '#f0f0f0' : '#667';
        ctx.fillText(active ? '正在看它' : '点击查看', c.x + 22, by + 62);
      });

      // 从 RGB 分出三条箭头
      ctx.strokeStyle = '#9fb0c8';
      ctx.lineWidth = 1.4;
      const fromY = 46;
      const toY = by;
      cols.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(imgX + 60, fromY);
        ctx.lineTo(c.x + bw / 2, toY);
        ctx.stroke();
      });

      // 底部说明卡
      const info = INFO[w];
      const cx = 24;
      const cy = by + bh + 16;
      const cw2 = W - 48;
      const ch2 = 86;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7e0ea';
      ctx.fillRect(cx, cy, cw2, ch2);
      ctx.strokeRect(cx, cy, cw2, ch2);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(info.title + ' —— ' + info.role, cx + 14, cy + 24);
      ctx.fillStyle = '#333';
      ctx.font = '12.5px "Segoe UI", sans-serif';
      ctx.fillText(info.train, cx + 14, cy + 46);
      ctx.fillStyle = '#556';
      ctx.fillText(info.out, cx + 14, cy + 68);
    };
    const start = () => {
      render(sel);
    };
    const stop = () => {};
    const disconnect = observeCanvas(canvas, start, stop);
    return () => disconnect();
  }, [sel]);

  return (
    <div className="widget">
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="widget-controls">
        <button onClick={() => { setSel('student'); setFeedback({ text: 'Student 是真正学习的那一个：一次迭代里只有它被梯度更新。', cls: 'ok' }); }}>Student</button>
        <button onClick={() => { setSel('teacher'); setFeedback({ text: 'Teacher 是 EMA 副本：不参与梯度，只负责在线造边界目标（出题）。', cls: 'ok' }); }}>Teacher</button>
        <button onClick={() => { setSel('corner'); setFeedback({ text: 'Frozen Corner Detector：冻结的小 ViT，只找稀疏角点，给解码当锚点。', cls: 'ok' }); }}>Corner Detector</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
