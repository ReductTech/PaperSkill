import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const STEPS = [
  { name: '分析变换', desc: 'g_a 把像素 x 压成隐变量 y：能量集中到少数系数。', hi: 1 },
  { name: '量化', desc: 'round 把 y 取整成 ŷ：这一步丢掉信息，是有损的根源。', hi: 2 },
  { name: '合成变换', desc: 'g_s 把 ŷ 重建回 x̂：草图重新长成图像。', hi: 3 },
];

export const ModTransform: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const raf = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: STEPS[0].desc, cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }
    const nodes = [
      { x: 150, y: 140, label: 'x', sub: '像素' },
      { x: 430, y: 140, label: 'y', sub: '隐变量' },
      { x: 700, y: 140, label: 'ŷ', sub: '量化后' },
      { x: 930, y: 140, label: 'x̂', sub: '重建' },
    ];

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // arrows between nodes
      for (let i = 0; i < 3; i += 1) {
        const active = i === s.step;
        ctx.strokeStyle = active ? '#27446e' : '#d7deea';
        ctx.lineWidth = active ? 5 : 3;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x + 66, nodes[i].y);
        ctx.lineTo(nodes[i + 1].x - 66, nodes[i + 1].y);
        ctx.stroke();
      }

      // nodes
      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        const active = i === STEPS[stateRef.current.step].hi;
        ctx.fillStyle = active ? '#27446e' : '#b8c9a7';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = '26px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + 9);
      }
    };

    const tick = () => {
      render();
      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (dir: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, step + dir));
    stateRef.current.step = next;
    setStep(next);
    setFb({ text: `第 ${next + 1}/${STEPS.length} 步 · ${STEPS[next].name}：${STEPS[next].desc}`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(-1)} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步 · {STEPS[step].name}
        </span>
        <button className="tiny" onClick={() => go(1)} disabled={step === STEPS.length - 1}>
          {step === STEPS.length - 1 ? '已完成' : '下一步'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModTransform;
