import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const OmniHero: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let raf = 0; let live = true; const ctx = setupCanvas(canvas, 420, 170);
    const tick = (t: number) => {
      ctx.clearRect(0, 0, 420, 170); ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, 0, 420, 170);
      const old = moduleId === 'old'; const baseY = 136;
      ctx.strokeStyle = '#cbd4df'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(26, baseY); ctx.lineTo(394, baseY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, 42); ctx.lineTo(26, baseY); ctx.stroke();
      const values = old ? [72, 54, 82, 61, 91, 48] : [72, 54, 82, 61, 91, 48];
      const scale = old ? (i: number) => (i % 2 ? .72 : 1) : () => 1;
      values.forEach((value, i) => {
        const x = 43 + i * 56; const h = value * scale(i) * .82; const color = old ? ['#bd4051', '#c47719', '#6756a3'][i % 3] : '#245d87';
        ctx.fillStyle = color; ctx.fillRect(x, baseY - h, 26, h);
        ctx.fillStyle = '#617187'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x + 13, 151);
      });
      ctx.fillStyle = old ? 'rgba(189,64,81,.08)' : 'rgba(39,129,95,.08)'; ctx.fillRect(26, 31, 368, 12);
      ctx.fillStyle = old ? '#bd4051' : '#27815f'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'left'; ctx.fillText(old ? '不同量程 / 切分 / 指标：差值没有单一含义' : '共同任务卡 / 接口 / 协议：差值可追溯', 28, 40);
      const scanX = 28 + ((t / 18) % 366); ctx.strokeStyle = old ? 'rgba(189,64,81,.45)' : 'rgba(39,129,95,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(scanX, 48); ctx.lineTo(scanX, 137); ctx.stroke();
      canvas.classList.add('is-ready'); if (live) raf = requestAnimationFrame(tick);
    };
    const stop = observeCanvas(canvas, () => { live = true; raf = requestAnimationFrame(tick); }, () => { live = false; cancelAnimationFrame(raf); });
    return () => { live = false; cancelAnimationFrame(raf); stop(); };
  }, [moduleId]);
  return <canvas ref={ref} width={420} height={170} aria-label={moduleId === 'old' ? '不一致评测导致柱状图失去可比性' : '统一评测口径让模型差异可解释'} />;
};
