import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch6 Module 6.1 (P2): step through the five-stage end-to-end pipeline —
// input -> backbone -> neck (+attention) -> dual heads -> topk filter -> output.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const STEPS = [
  { name: '输入图像', shape: '640×640×3', desc: '输入图像缩放到 640×640。', cls: '' },
  { name: '骨干网络', shape: 'P3 / P4 / P5', desc: '骨干网络提取三级特征。', cls: '' },
  { name: '颈部', shape: '融合 + 注意力', desc: '颈部融合多尺度特征并加一层注意力。', cls: '' },
  { name: '双头并行', shape: '密集 + 稀疏', desc: '双头并行：一对多头密集预测，一对一头稀疏预测。', cls: '' },
  { name: 'topk 过滤', shape: 'top-300', desc: '训练分配 topk=7→1 保证唯一匹配；推理一次 top-300 选择输出，免 NMS。', cls: '' },
  { name: '输出', shape: '(N, 300, 6)', desc: '直接输出检测结果——没有 NMS 检查站。', cls: 'good' },
];

export const Ch6Pipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const st = stateRef.current.step;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // route nodes
      const nodes = STEPS.map((s, i) => ({ ...s, x: 90 + i * 180 }));
      // connections
      for (let i = 0; i < nodes.length - 1; i++) {
        ctx.strokeStyle = i < st ? C.green : '#cdd6e4';
        ctx.lineWidth = i < st ? 5 : 3;
        ctx.beginPath(); ctx.moveTo(nodes[i].x + 34, 90); ctx.lineTo(nodes[i + 1].x - 34, 90); ctx.stroke();
      }
      nodes.forEach((n, i) => {
        const done = i < st;
        const cur = i === st;
        ctx.fillStyle = done ? C.green : cur ? C.blue : '#e8edf5';
        ctx.beginPath(); ctx.arc(n.x, 90, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = done || cur ? '#fff' : C.muted;
        ctx.font = '13px sans-serif';
        ctx.fillText(n.name, n.x - ctx.measureText(n.name).width / 2, 95);
        ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
        ctx.fillText(n.shape, n.x - ctx.measureText(n.shape).width / 2, 142);
      });
      // rider icon positioned at current node
      const cx = nodes[st].x; const cy = 46;
      ctx.strokeStyle = C.route; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx - 8, cy + 8, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 9, cy + 8, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 8); ctx.lineTo(cx - 1, cy - 1); ctx.lineTo(cx + 9, cy + 8); ctx.lineTo(cx - 8, cy + 8);
      ctx.stroke();
      ctx.fillStyle = C.route;
      ctx.beginPath(); ctx.arc(cx, cy - 6, 3.5, 0, Math.PI * 2); ctx.fill();
      // bottom inset
      ctx.fillStyle = '#fff'; ctx.fillRect(60, 176, 960, 84);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(60, 176, 960, 84);
      const s = STEPS[st];
      ctx.fillStyle = st === 5 ? C.green : C.blue; ctx.font = '17px sans-serif';
      ctx.fillText(`第 ${st} 步 · ${s.name}`, 84, 210);
      ctx.fillStyle = C.text; ctx.font = '15px sans-serif';
      ctx.fillText(s.desc, 84, 240);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (v: number) => {
    const nv = Math.max(0, Math.min(5, v));
    stateRef.current.step = nv;
    setStep(nv);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => go(step - 1)} disabled={step === 0}>上一步</button>
        <button onClick={() => go(step + 1)} disabled={step === 5}>下一步</button>
        <button onClick={() => go(0)}>重置</button>
      </div>
      <div className={`feedback ${STEPS[step].cls}`}>{STEPS[step].desc}</div>
    </div>
  );
};

export default Ch6Pipeline;
