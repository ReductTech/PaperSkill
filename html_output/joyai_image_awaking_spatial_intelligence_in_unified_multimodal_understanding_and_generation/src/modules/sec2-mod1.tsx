import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 480, H = 240;
const BG = '#fffaf1', INK = '#222222', MUTED = '#666666', GREEN = '#33a9d6', ORANGE = '#ff3366';

const STEP_TEXTS = [
  '输入图像，MLLM 解析空间语义',
  '语义作为条件，驱动 MMDiT 生成',
  '生成路径输出图像；TwNV 则由空间编辑器合成新视角',
  'Reasoner 联合原图与新视角再次判断',
];

// P2 步进：双向循环的 4 个步骤。纯 Canvas + 步进控件。
export const Sec2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const lx = 150, rx = 330, cy = 120, R = 46;

    // 三角形箭头头
    const arrowHead = (x: number, y: number, ang: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -5);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const node = (x: number, y: number, label: string, color: string, active: boolean) => {
      ctx.fillStyle = active ? color : '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = active ? '#ffffff' : color;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      const s = stateRef.current.step;

      // 标题
      ctx.fillStyle = INK; ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('语义条件与新视角求证', W / 2, 28);

      // 步骤 0：输入箭头进入 理解
      if (s === 0) {
        ctx.strokeStyle = MUTED; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(lx - R - 6, cy); ctx.stroke();
        arrowHead(lx - R - 6, cy, 0, MUTED);
        ctx.fillStyle = MUTED; ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('输入', (40 + lx - R) / 2, cy - 10);
      }

      // 步骤 1：理解 -> 生成（橙色，脉冲点）
      if (s === 1) {
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(lx + R + 6, cy - 8); ctx.lineTo(rx - R - 6, cy - 8); ctx.stroke();
        arrowHead(rx - R - 6, cy - 8, 0, ORANGE);
        const p = (t / 900) % 1;
        const px = (lx + R + 6) + ((rx - R - 6) - (lx + R + 6)) * p;
        ctx.fillStyle = ORANGE;
        ctx.beginPath(); ctx.arc(px, cy - 8, 5, 0, Math.PI * 2); ctx.fill();
      }

      // 步骤 2：生成发出图像（小方块）
      if (s === 2) {
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(rx + R + 6, cy); ctx.lineTo(440 - 18, cy); ctx.stroke();
        arrowHead(440 - 18, cy, 0, ORANGE);
        const bob = Math.sin(t / 300) * 3;
        ctx.fillStyle = ORANGE;
        ctx.fillRect(440 - 34, cy - 16 + bob, 28, 28);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.strokeRect(440 - 34, cy - 16 + bob, 28, 28);
      }

      // 步骤 3：TwNV 推理时，新视角作为 Reasoner 的补充输入。
      if (s === 3) {
        ctx.strokeStyle = GREEN; ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(rx, cy + R + 6);
        ctx.quadraticCurveTo(W / 2, cy + 90, lx, cy + R + 6);
        ctx.stroke();
        ctx.setLineDash([]);
        arrowHead(lx, cy + R + 6, -Math.PI / 2 - 0.5, GREEN);
        ctx.fillStyle = GREEN; ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('补充证据', W / 2, cy + 92);
      }

      // 两个节点（激活态高亮）
      node(lx, cy, '理解', GREEN, s === 0 || s === 3);
      node(rx, cy, '生成', ORANGE, s === 1 || s === 2);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const advance = () => {
    const next = (stateRef.current.step + 1) % 4;
    stateRef.current.step = next;
    setStep(next);
  };
  const reset = () => {
    stateRef.current.step = 0;
    setStep(0);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={advance}>下一步</button>
        <button className="tiny ghost" onClick={reset}>重置</button>
        <div className="step-label">步骤 <b>{step + 1}</b>/4</div>
      </div>
      <div className="feedback">{STEP_TEXTS[step]}</div>
    </div>
  );
};

export default Sec2Mod1;
