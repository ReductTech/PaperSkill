import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P4 chips — moduleId "9.1": V0-V5 acceptance for Claude (Secret Comm); "9.2": benign-tool control.
const W = 1080;
const H = 280;
const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const TEXT = '#21324a';
const MUTED = '#68778f';

const variants = [
  { key: 'V0', label: 'V0 基线', value: 0, note: '0%——基线拒绝' },
  { key: 'V1', label: 'V1 中性', value: 1.0, note: '100%——中性措辞翻转（绿）' },
  { key: 'V2', label: 'V2 去设计者', value: 0, note: '0%——单个措辞移除不足以翻转' },
  { key: 'V3', label: 'V3 去“不公平”', value: 0, note: '0%——仍是拒绝' },
  { key: 'V4', label: 'V4 显式伦理', value: 0, note: '0%——已有警示，再加伦理无新增效果' },
  { key: 'V5', label: 'V5 伦理+惩罚', value: 0, note: '0%——仍是拒绝' },
];

const benign = [
  { key: 'ba', label: '良性分析工具', value: 0, note: '0%——拒绝无害工具' },
  { key: 'bg', label: '良性指导工具', value: 0, note: '0%——拒绝无害工具' },
  { key: 'comm', label: '秘密通信', value: 1.0, note: '100%——却接受合谋工具（反差）' },
  { key: 'hint', label: '秘密提示', value: 0.49, note: '49%——仍高于良性工具' },
];

export const VariantChip: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isBenign = moduleId === '9.2';
  const items = isBenign ? benign : variants;
  const [key, setKey] = useState(items[0].key);
  const stateRef = useRef({ value: items[0].value });
  const [feedback, setFeedback] = useState({ text: isBenign ? '切换工具，观察接受率反差。' : '切换变体查看接受率。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { value: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const bh = s.value * H * 0.6;
      ctx.fillStyle = s.value >= 0.5 ? GREEN : RED;
      ctx.fillRect(W * 0.4, H * 0.85 - bh, 160, bh);
      ctx.fillStyle = TEXT;
      ctx.font = '26px "Segoe UI", sans-serif';
      ctx.fillText(Math.round(s.value * 100) + '%', W * 0.4 + 8, H * 0.85 - bh - 10);
      ctx.fillStyle = MUTED;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('接受率', W * 0.4, H * 0.92);
    };
    let rafId = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (it: { key: string; value: number; note: string }) => {
    setKey(it.key);
    stateRef.current.value = it.value;
    setFeedback({ text: it.note, cls: it.value >= 0.5 ? 'good' : 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#228d5c' }} />绿色＝接受率 ≥ 50%</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#c43f52' }} />红色＝接受率＜50%</span>
      </div>
      <div className="chip-row">
        {items.map((it) => (
          <button key={it.key} className={`chip ${key === it.key ? 'selected' : ''}`} onClick={() => select(it)}>
            {it.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default VariantChip;
