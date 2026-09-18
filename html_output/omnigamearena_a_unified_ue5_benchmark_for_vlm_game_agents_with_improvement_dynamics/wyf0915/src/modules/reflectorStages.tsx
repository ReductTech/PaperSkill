import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 240;

const STAGES = [
  { key: 'explore', name: 'Explore 探索', color: '#27446e', desc: '用只读工具（list_dir / read_text / read_image / grep）查看本轮轨迹。' },
  { key: 'diagnose', name: 'Diagnose 诊断', color: '#f07e47', desc: '调用 submit_diagnosis 提交失败模式列表，把"原因"和"处方"分开。' },
  { key: 'validate', name: 'Validate 验证', color: '#7c3aed', desc: '调用 validate_skill 让独立 LLM 裁判拒绝"记忆地图/与诊断矛盾"的提案，最多 5 轮。' },
  { key: 'distill', name: 'Distill 蒸馏', color: '#228d5c', desc: '把通过验证的 m_{r+1} 定稿，并可选地把稳定观察写进经验笔记。' },
];

export const ReflectorStages: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState('explore');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (a: string) => {
      ctx.clearRect(0, 0, W, H);
      const cellW = (W - 80) / STAGES.length;
      const x0 = 40;
      const y0 = 40;
      const cellH = H - 100;
      STAGES.forEach((s, i) => {
        const x = x0 + i * cellW;
        const on = a === s.key;
        ctx.fillStyle = on ? s.color : '#f5f8f0';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = on ? 3 : 1;
        ctx.fillRect(x + 8, y0, cellW - 16, cellH);
        ctx.strokeRect(x + 8, y0, cellW - 16, cellH);
        ctx.fillStyle = on ? '#fff' : '#21324a';
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillText(s.name, x + 20, y0 + 32);
        ctx.font = '14px "Segoe UI", sans-serif';
        const lines = wrap(s.desc, 22);
        lines.forEach((line, li) => ctx.fillText(line, x + 20, y0 + 60 + li * 18));
        // arrow
        if (i < STAGES.length - 1) {
          ctx.strokeStyle = '#76906a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + cellW - 8, y0 + cellH / 2);
          ctx.lineTo(x + cellW + 8, y0 + cellH / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + cellW + 8, y0 + cellH / 2);
          ctx.lineTo(x + cellW + 2, y0 + cellH / 2 - 5);
          ctx.lineTo(x + cellW + 2, y0 + cellH / 2 + 5);
          ctx.closePath();
          ctx.fillStyle = '#76906a';
          ctx.fill();
        }
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const rafRef = { current: 0 };
    const tick = () => {
      render(active);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [active]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {STAGES.map((s) => (
          <button
            key={s.key}
            className={active === s.key ? 'on' : ''}
            style={{ borderColor: s.color }}
            onClick={() => setActive(s.key)}
          >
            {s.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <div className="feedback">{STAGES.find((s) => s.key === active)?.desc}</div>
    </div>
  );
};

function wrap(text: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i + n));
  return out;
}

export default ReflectorStages;
