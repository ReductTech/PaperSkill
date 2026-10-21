import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第8章：数据引擎三阶段时间轴（辅助人工 → 半自动 → 全自动）
const W = 1080;
const H = 300;
const STAGES = [
  { name: '辅助人工', stat: '4.3M 掩码 / 120k 图', note: '标注 34→14 秒 · 重训 6 次' },
  { name: '半自动', stat: '共 10.2M 掩码', note: '框检测预填 + 人工补标' },
  { name: '全自动', stat: '1.1B 掩码', note: '32×32 点阵 · 稳定掩码 · NMS' },
];

const STEP_FB = [
  { text: '阶段一 · 辅助人工：SAM 实时辅助标注，标注速度随模型提升而加快。', cls: '' },
  { text: '阶段二 · 半自动：检测器预填可靠掩码，人工只补标其余物体，提升多样性。', cls: '' },
  { text: '阶段三 · 全自动：32×32 点阵 + 歧义感知 + 稳定掩码 + NMS，产出 1.1B 掩码。', cls: 'good' },
];

export const Ch8DataEngine: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createLinearGradient(40, 20, W - 40, H - 20);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(40, 30, W - 80, H - 80);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 30, W - 80, H - 80);
      // 时间轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(140, 170);
      ctx.lineTo(W - 140, 170);
      ctx.stroke();
      const n = STAGES.length;
      const bw = (W - 260) / n;
      for (let i = 0; i < n; i++) {
        const x = 130 + i * bw;
        const active = i <= s.step;
        // 阶段节点
        ctx.fillStyle = active ? '#27446e' : '#b8c9a7';
        ctx.strokeStyle = '#d7deea';
        ctx.beginPath();
        ctx.arc(x + bw / 2, 170, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? '#228d5c' : '#eef3fb';
        ctx.strokeStyle = active ? '#228d5c' : '#d7deea';
        ctx.beginPath();
        ctx.roundRect(x, 70, bw - 20, 66, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(STAGES[i].name, x + (bw - 20) / 2, 92);
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(STAGES[i].stat, x + (bw - 20) / 2, 114);
        ctx.textAlign = 'left';
        // 掩码规模增长条（对数展示）
        const frac = i === 0 ? 0.02 : i === 1 ? 0.05 : 1;
        const bh = active ? 20 + frac * 90 : 10;
        ctx.fillStyle = active ? '#228d5c' : '#b8c9a7';
        ctx.fillRect(x + (bw - 20) / 2 - 30, 205 - bh, 60, bh);
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(STAGES[i].note, x, 245);
      }
      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('数据引擎：三阶段越走越自动', 260, 55);
    };
    const tick = () => {
      render(stateRef.current);
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

  const stepTo = (v: number) => {
    const n = Math.max(0, Math.min(STAGES.length - 1, v));
    stateRef.current.step = n;
    setStep(n);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="btn" onClick={() => stepTo(step - 1)} disabled={step === 0}>
          ← 上一阶段
        </button>
        <span className="val">
          阶段 {step + 1} / {STAGES.length}
        </span>
        <button
          className="btn on"
          onClick={() => stepTo(step + 1)}
          disabled={step === STAGES.length - 1}
        >
          下一阶段 →
        </button>
      </div>
      <div className={`feedback ${STEP_FB[step].cls}`}>{STEP_FB[step].text}</div>
    </div>
  );
};

export default Ch8DataEngine;
