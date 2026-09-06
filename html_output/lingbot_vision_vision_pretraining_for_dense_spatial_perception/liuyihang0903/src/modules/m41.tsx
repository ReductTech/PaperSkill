import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4 Module 1：同一个 Student，三条监督流（P5 点击）
const W = 560;
const H = 220;

type Branch = 'cls' | 'mask' | 'boundary';

const INFO: Record<Branch, { label: string; loss: string; note: string }> = {
  cls: { label: 'CLS → L_DINO', loss: '整图语义：CLS 汇总整图“是什么”', note: '整图语义蒸馏：class token 汇总全局“是什么”。' },
  mask: { label: '掩码 patch → L_iBOT', loss: '局部语义：掩码 token 凭上下文恢复“局部是什么”', note: '局部语义重建：掩码 token 凭上下文恢复表示。' },
  boundary: { label: '边界区域 → L_bnd', loss: '几何：边界 token 学习“边界结构在哪”', note: '几何分类：边界 token 额外学习边界结构（双重之一）。' },
};

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [branch, setBranch] = useState<Branch>('cls');
  const [feedback, setFeedback] = useState({
    text: '点击 Student ViT 的三个出口，看每条监督流的去向。',
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
    const render = (b: Branch) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // Student ViT 主干
      const bx = 60;
      const by = 40;
      ctx.fillStyle = '#27446e';
      ctx.fillRect(bx, by, 170, 140);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('Student ViT', bx + 30, by + 75);

      // 三个出口节点
      const nodes: Array<{ id: Branch; x: number; y: number; label: string }> = [
        { id: 'cls', x: 320, y: 55, label: 'CLS' },
        { id: 'mask', x: 320, y: 110, label: 'Masked Patch' },
        { id: 'boundary', x: 320, y: 165, label: 'Boundary' },
      ];
      nodes.forEach((n) => {
        const active = b === n.id;
        ctx.fillStyle = active ? (n.id === 'boundary' ? '#7c3aed' : '#d97706') : '#ffffff';
        ctx.fillRect(n.x - 80, n.y - 18, 160, 36);
        ctx.strokeStyle = active ? (n.id === 'boundary' ? '#7c3aed' : '#d97706') : '#9fb0c8';
        ctx.lineWidth = active ? 3 : 1.6;
        ctx.strokeRect(n.x - 80, n.y - 18, 160, 36);
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText(n.label, n.x - 50, n.y + 5);
        // 连线
        ctx.strokeStyle = active ? '#d97706' : '#d7deea';
        ctx.lineWidth = active ? 2.4 : 1.2;
        ctx.beginPath();
        ctx.moveTo(bx + 170, n.y);
        ctx.lineTo(n.x - 80, n.y);
        ctx.stroke();
      });

      // 损失标签
      const info = INFO[branch];
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(info.label, 320, 210);
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(info.loss, 40, 210);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef<Branch>('cls');
  stateRef.current = branch;

  const setBranchState = (b: Branch) => {
    stateRef.current = b;
    setBranch(b);
    setFeedback({ text: INFO[b].note, cls: b === 'boundary' ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${branch === 'cls' ? 'active' : ''}`} onClick={() => setBranchState('cls')}>
          CLS
        </button>
        <button className={`chip ${branch === 'mask' ? 'active' : ''}`} onClick={() => setBranchState('mask')}>
          Masked Patch
        </button>
        <button className={`chip ${branch === 'boundary' ? 'active' : ''}`} onClick={() => setBranchState('boundary')}>
          Boundary
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M41;
