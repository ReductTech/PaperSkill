import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 270;
const STEPS = [
  { en: 'Observe', zh: '观察', note: '读取树、当前最佳制品、活动前沿、最新证据与祖先洞见。' },
  { en: 'Ideate', zh: '构思', note: '在已验证洞见、负向约束和未解问题下生成待执行子假设。' },
  { en: 'Select', zh: '选择', note: '结合预期效用、祖先与兄弟节点证据控制前沿；论文没有规定一个固定的数值排名公式。' },
  { en: 'Dispatch', zh: '派发', note: '把固定假设交给隔离执行器。' },
  { en: 'Backpropagate', zh: '回传', note: '写回开发分数、事实、洞见与分支引用，并沿祖先路径抽象洞见。' },
  { en: 'Decide', zh: '决策', note: '在当前批次 L 中先按开发分数选 n† = argmax sₙ，再只对该候选打开 Etest；随后合并、剪枝、继续或停止。' },
] as const;

export const HtrSixStepCycle: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = () => {
      const active = stateRef.current.step;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(56, 206);
      ctx.bezierCurveTo(132, 148, 194, 195, 264, 122);
      ctx.bezierCurveTo(330, 53, 408, 99, 502, 48);
      ctx.stroke();

      STEPS.forEach((item, index) => {
        const x = 48 + index * 93;
        const y = 218 - index * 30 + (index % 2 ? 13 : 0);
        const complete = index < active;
        const selected = index === active;
        ctx.beginPath();
        ctx.arc(x, y, selected ? 19 : 15, 0, Math.PI * 2);
        ctx.fillStyle = selected ? '#27446e' : complete ? '#228d5c' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = selected ? '#27446e' : complete ? '#228d5c' : '#76906a';
        ctx.lineWidth = selected ? 5 : 2;
        ctx.stroke();
        ctx.fillStyle = selected || complete ? '#ffffff' : '#21324a';
        ctx.font = '700 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(index + 1), x, y + 5);
        ctx.fillStyle = selected ? '#27446e' : '#21324a';
        ctx.font = selected ? '700 13px "Segoe UI", sans-serif' : '12px "Segoe UI", sans-serif';
        ctx.fillText(item.zh, x, y + 38);
      });

      const evidence = clamp(active / (STEPS.length - 1), 0, 1);
      ctx.fillStyle = '#e5ebe0';
      ctx.fillRect(34, 24, 344, 16);
      ctx.fillStyle = active === 5 ? '#228d5c' : '#27446e';
      ctx.fillRect(34, 24, 344 * evidence, 16);
      ctx.fillStyle = '#21324a';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`流程进度 ${active + 1}/6 · 工作树 ${active >= 3 ? 1 : 0} · 证据 ${active >= 4 ? 1 : 0}`, 34, 60);

      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('持久假设树是权威状态，不依赖被压缩的临时对话历史。', 34, 84);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chooseStep = (next: number) => {
    const safe = clamp(next, 0, STEPS.length - 1);
    stateRef.current.step = safe;
    setStep(safe);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`htr-gate-status ${step === 5 ? 'is-open' : 'is-locked'}`} aria-live="polite">
        <span className="htr-gate-dot" aria-hidden="true" />
        <strong>{step === 5 ? 'Etest OPEN' : 'Etest LOCKED'}</strong>
        <span>{step === 5 ? '仅对选定合并候选开放' : '探索阶段不可见，不参与假设生成与选择'}</span>
      </div>
      <div className="ctrl" role="group" aria-label="HTR 六步循环">
        {STEPS.map((item, index) => (
          <button key={item.en} type="button" aria-pressed={step === index} onClick={() => chooseStep(index)}>
            {index + 1}. {item.zh}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button type="button" onClick={() => chooseStep(step - 1)} disabled={step === 0}>上一步</button>
        <button type="button" onClick={() => chooseStep(step + 1)} disabled={step === STEPS.length - 1}>下一步</button>
      </div>
      <div className={`feedback ${step === 5 ? 'good' : ''}`} aria-live="polite">
        <strong>{STEPS[step].en} · {STEPS[step].zh}：</strong>{STEPS[step].note}
      </div>
      <p style={{ color: '#21324a', marginBottom: 0 }}>公式描述产物层面的最终目标；Algorithm 1 并不会在探索中对所有候选反复查询 Etest。</p>
    </div>
  );
};

export default HtrSixStepCycle;
