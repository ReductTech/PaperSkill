import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { lerpColor, setupCanvas } from '../lib/canvasKit';

type SpectrumMode = 'learned' | 'short' | 'medium' | 'long';

const modes: Array<{ key: SpectrumMode; label: string }> = [
  { key: 'learned', label: '学习到的谱' },
  { key: 'short', label: '全短' },
  { key: 'medium', label: '全中' },
  { key: 'long', label: '全长' },
];

const layerProfiles: Record<number, number[]> = {
  4: [0.18, 0.3, 0.46, 0.62, 0.77, 0.9],
  11: [0.12, 0.28, 0.5, 0.69, 0.83, 0.95],
  17: [0.2, 0.36, 0.55, 0.74, 0.88, 0.97],
  23: [0.1, 0.25, 0.44, 0.7, 0.9, 0.985],
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

export const Chap05RetentionSpectrum: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [mode, setMode] = useState<SpectrumMode>('learned');
  const [layer, setLayer] = useState(11);
  const [channel, setChannel] = useState(3);
  const reducedMotion = useReducedMotion();

  const values = useMemo(() => {
    if (mode === 'learned') return layerProfiles[layer];
    const fixed = mode === 'short' ? 0.22 : mode === 'medium' ? 0.62 : 0.93;
    return Array.from({ length: 6 }, () => fixed);
  }, [layer, mode]);

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
    const height = 280;
    const ctx = setupCanvas(canvas, width, height);
    canvas.classList.add('is-ready');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e6eb';
    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const left = Math.max(22, width * 0.04);
    const right = Math.max(20, width * 0.04);
    const laneW = width - left - right;
    const startY = 44;
    const laneGap = 32;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillStyle = '#5e6978';
    ctx.fillText('短期', left + laneW * 0.06, 22);
    ctx.fillText('中期', left + laneW * 0.47, 22);
    ctx.fillText('长期', left + laneW * 0.88, 22);

    values.forEach((value, index) => {
      const y = startY + index * laneGap;
      const selected = index === channel;
      const endX = left + laneW * (0.12 + value * 0.82);
      ctx.strokeStyle = selected ? '#1455d9' : '#c0c8d2';
      ctx.lineWidth = selected ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(left + 38, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      ctx.fillStyle = lerpColor('#1455d9', '#7357c8', value);
      ctx.beginPath();
      ctx.arc(left + 20, y, selected ? 9 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#344054';
      ctx.font = `${selected ? 700 : 500} 12px system-ui, sans-serif`;
      ctx.fillText(`C${index + 1}`, left - 1, y + 4);
      ctx.fillStyle = selected ? '#1455d9' : '#5e6978';
      ctx.fillText(value < 0.4 ? '快速改写' : value < 0.8 ? '跨帧保持' : '长时基准', Math.min(endX + 8, width - 76), y + 4);
    });

    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('机制示意：轨迹长度只表达相对寿命，不是论文测得的逐通道数值', left, height - 14);
  }, [channel, values, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? '#1455d9' : '#c9d0d9'}`,
    background: active ? '#eaf0fb' : '#ffffff',
    color: active ? '#123f9e' : '#344054',
    borderRadius: 6,
    padding: '7px 10px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  const feedback = mode === 'learned'
    ? `第 ${layer} 层以多个寿命通道共同承担短、中、长证据；当前聚焦 C${channel + 1}。`
    : `当前把所有通道替换为${mode === 'short' ? '短' : mode === 'medium' ? '中' : '长'}寿命。原论文 Figure 6 报告：任一单一寿命带替换都会带来更高轨迹误差。`;

  return (
    <section aria-label={`交互模块 ${moduleId}：逐通道寿命谱`} style={{ display: 'grid', gap: 14 }}>
      <p style={{ margin: 0, color: '#5e6978', fontSize: 13 }}>
        上方原图来自原论文 Figure 6；下方只提供读图所需的机制示意，不补造论文未报告的逐通道测量。
      </p>
      <div ref={hostRef} style={{ width: '100%', height: 280, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} role="img" aria-label="六个通道具有短、中、长不同相对寿命的示意图" />
      </div>

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ marginBottom: 8, fontWeight: 700 }}>保留谱方案</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {modes.map((item) => (
            <button key={item.key} type="button" aria-pressed={mode === item.key} onClick={() => setMode(item.key)} style={buttonStyle(mode === item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ marginBottom: 8, fontWeight: 700 }}>论文插入线性层位置</legend>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {[4, 11, 17, 23].map((item) => (
              <button key={item} type="button" aria-pressed={layer === item} onClick={() => setLayer(item)} style={buttonStyle(layer === item)}>
                Layer {item}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ marginBottom: 8, fontWeight: 700 }}>聚焦概念通道</legend>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {Array.from({ length: 6 }, (_, index) => (
              <button key={index} type="button" aria-pressed={channel === index} onClick={() => setChannel(index)} style={buttonStyle(channel === index)}>
                C{index + 1}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <output aria-live="polite" style={{ minHeight: 52, padding: '10px 12px', border: '1px solid #b9c8e8', borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        {feedback}{reducedMotion ? ' 已按减少动态效果偏好直接切换状态。' : ''}
      </output>
    </section>
  );
};
