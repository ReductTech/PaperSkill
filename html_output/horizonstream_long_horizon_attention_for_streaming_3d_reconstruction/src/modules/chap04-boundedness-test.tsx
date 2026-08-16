import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, setupCanvas } from '../lib/canvasKit';

type Condition = 'bounded' | 'critical' | 'invalid';

const conditions: Record<Condition, { label: string; gamma: number; color: string; feedback: string }> = {
  bounded: { label: 'γ̄ < 1', gamma: 0.92, color: '#16875b', feedback: '满足条件：旧初始化影响指数衰减。' },
  critical: { label: 'γ̄ = 1', gamma: 1, color: '#c66a16', feedback: '临界情况：影响不会自动消失。' },
  invalid: { label: 'γ̄ > 1（仅反例）', gamma: 1.04, color: '#c43d37', feedback: '违反前提：论文的有界结论不适用。' },
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export const Chap04BoundednessTest: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [condition, setCondition] = useState<Condition>('bounded');
  const [step, setStep] = useState(20);
  const reducedMotion = useReducedMotion();
  const current = conditions[condition];
  const contribution = useMemo(() => Math.pow(current.gamma, step), [current.gamma, step]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => setWidth(Math.max(260, Math.floor(host.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 274;
    const ctx = setupCanvas(canvas, width, height);
    canvas.classList.add('is-ready');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#e2e6eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const left = Math.max(44, width * 0.09);
    const right = Math.max(24, width * 0.05);
    const top = 38;
    const bottom = 48;
    const chartW = width - left - right;
    const chartH = height - top - bottom;
    const maxValue = condition === 'invalid' ? Math.pow(1.04, 40) : 1.12;

    ctx.strokeStyle = '#7c8796';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + chartH);
    ctx.lineTo(left + chartW, top + chartH);
    ctx.stroke();

    ctx.strokeStyle = current.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t <= 40; t += 1) {
      const value = Math.pow(current.gamma, t);
      const x = left + (t / 40) * chartW;
      const y = top + chartH - (clamp(value, 0, maxValue) / maxValue) * chartH * 0.88;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const markerX = left + (step / 40) * chartW;
    const markerY = top + chartH - (clamp(contribution, 0, maxValue) / maxValue) * chartH * 0.88;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#657286';
    ctx.beginPath();
    ctx.moveTo(markerX, top);
    ctx.lineTo(markerX, top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = current.color;
    ctx.beginPath();
    ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#17202b';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(`初始状态贡献：${current.gamma.toFixed(2)}^t`, left, 24);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#5e6978';
    ctx.fillText('t=0', left - 8, top + chartH + 22);
    ctx.fillText('t=40', left + chartW - 28, top + chartH + 22);
    ctx.fillText('机制示意，不是模型输出', left, height - 9);

    if (condition === 'invalid') {
      ctx.fillStyle = '#fff2f1';
      ctx.fillRect(width - Math.min(248, width * 0.46) - 18, 14, Math.min(248, width * 0.46), 34);
      ctx.fillStyle = '#9e2c27';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText('γ>1 在 sigmoid 学习范围之外，仅用于反例', width - Math.min(248, width * 0.46) - 8, 35);
    }
  }, [condition, contribution, current.color, current.gamma, step, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? current.color : '#c9d0d9'}`,
    background: active ? `${current.color}14` : '#ffffff',
    color: active ? current.color : '#344054',
    borderRadius: 6,
    padding: '8px 11px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  return (
    <section aria-label={`交互模块 ${moduleId}：有界性条件测试`} style={{ display: 'grid', gap: 14 }}>
      <div ref={hostRef} style={{ width: '100%', height: 274, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} role="img" aria-label={`条件 ${current.label} 下初始状态贡献随时间变化的曲线`} />
      </div>

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ marginBottom: 8, fontWeight: 700 }}>选择保留率上界条件</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.keys(conditions) as Condition[]).map((key) => (
            <button key={key} type="button" aria-pressed={condition === key} onClick={() => setCondition(key)} style={buttonStyle(condition === key)}>
              {conditions[key].label}
            </button>
          ))}
        </div>
      </fieldset>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>时间步 t：{step}</span>
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 5))} disabled={step === 0} style={buttonStyle(false)} aria-label="时间步减少五步">
          −5
        </button>
        <button type="button" onClick={() => setStep((value) => Math.min(40, value + 5))} disabled={step === 40} style={buttonStyle(false)} aria-label="时间步增加五步">
          +5
        </button>
        <button type="button" onClick={() => setStep(0)} style={buttonStyle(step === 0)}>
          回到 t=0
        </button>
        <button type="button" onClick={() => setStep(40)} style={buttonStyle(step === 40)}>
          查看 t=40
        </button>
      </div>

      <output aria-live="polite" style={{ minHeight: 56, padding: '10px 12px', border: `1px solid ${current.color}`, borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        <strong>{current.feedback}</strong> 当前示例贡献为 {contribution.toFixed(3)}。{condition === 'bounded' ? '随着 t 增大，它会继续趋近于 0。' : condition === 'critical' ? '无论经过多少步，初始化残留都保持不变。' : '该曲线只用于说明一旦违反前提，推导就失去约束力。'}{reducedMotion ? ' 已按减少动态效果偏好即时切换。' : ''}
      </output>
    </section>
  );
};
