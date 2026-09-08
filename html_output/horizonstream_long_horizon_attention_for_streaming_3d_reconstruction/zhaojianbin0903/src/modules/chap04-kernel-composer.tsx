import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, lerpColor, setupCanvas } from '../lib/canvasKit';

type Focus = 'spatial' | 'time' | 'product';

const reliabilityLevels = [
  { label: '低', value: 0.3 },
  { label: '中', value: 0.65 },
  { label: '高', value: 0.95 },
];

const ages = [1, 10, 50, 100];

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

export const Chap04KernelComposer: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [reliability, setReliability] = useState(0.65);
  const [gamma, setGamma] = useState(0.95);
  const [age, setAge] = useState(10);
  const [focus, setFocus] = useState<Focus>('product');
  const reducedMotion = useReducedMotion();
  const [auto, setAuto] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const temporal = useMemo(() => Math.pow(gamma, age), [gamma, age]);
  const influence = reliability * temporal;

  useEffect(() => {
    if (!auto || reducedMotion) return;
    const focusOrder: Focus[] = ['spatial', 'time', 'product'];
    const gammaOrder = [0.72, 0.9, 0.97];
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % focusOrder.length;
      setFocus(focusOrder[index]);
      setReliability(reliabilityLevels[index].value);
      setGamma(gammaOrder[index]);
      setAge(ages[index]);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [auto, reducedMotion]);

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
    const height = 288;
    const ctx = setupCanvas(canvas, width, height);
    canvas.classList.add('is-ready');
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#e2e6eb';
    ctx.lineWidth = 1;
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

    const margin = Math.max(18, width * 0.035);
    const available = width - margin * 2;
    const cardW = Math.max(86, Math.min(176, available * 0.23));
    const gap = Math.max(12, Math.min(28, available * 0.035));
    const curveX = margin + cardW + gap;
    const curveW = Math.max(118, available - cardW * 2 - gap * 2);
    const finalX = curveX + curveW + gap;

    ctx.fillStyle = '#17202b';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText('K_spatial', margin, 28);
    ctx.fillText('K_time', curveX, 28);
    ctx.fillText('K(t,i)', finalX, 28);

    const cardY = 50;
    const cardH = 154;
    const reliabilityColor = lerpColor('#f1d7d5', '#1455d9', reliability);
    ctx.fillStyle = reliabilityColor;
    ctx.fillRect(margin, cardY, cardW, cardH);
    ctx.strokeStyle = focus === 'spatial' ? '#1455d9' : '#9ca9ba';
    ctx.lineWidth = focus === 'spatial' ? 3 : 1.5;
    ctx.strokeRect(margin + 1, cardY + 1, cardW - 2, cardH - 2);
    ctx.fillStyle = reliability > 0.55 ? '#ffffff' : '#6e2925';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(reliability.toFixed(2), margin + 14, cardY + 46);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('当前可信度', margin + 14, cardY + 70);
    ctx.fillStyle = '#17202b';
    ctx.fillText('清晰度印章', margin + 14, cardY + 128);

    const chartY = 52;
    const chartH = 150;
    ctx.strokeStyle = '#9ca9ba';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curveX, chartY);
    ctx.lineTo(curveX, chartY + chartH);
    ctx.lineTo(curveX + curveW, chartY + chartH);
    ctx.stroke();
    ctx.strokeStyle = focus === 'time' ? '#1455d9' : '#657286';
    ctx.lineWidth = focus === 'time' ? 3 : 2;
    ctx.beginPath();
    for (let p = 0; p <= 100; p += 2) {
      const x = curveX + (p / 100) * curveW;
      const y = chartY + chartH * (1 - Math.pow(gamma, p));
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const selectedX = curveX + (age / 100) * curveW;
    const selectedY = chartY + chartH * (1 - temporal);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#c66a16';
    ctx.beginPath();
    ctx.moveTo(selectedX, chartY);
    ctx.lineTo(selectedX, chartY + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c66a16';
    ctx.beginPath();
    ctx.arc(selectedX, selectedY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('0 帧', curveX, chartY + chartH + 20);
    ctx.fillText('100 帧', curveX + curveW - 42, chartY + chartH + 20);

    const barY = 66;
    const barH = 120;
    ctx.fillStyle = '#e4e8ed';
    ctx.fillRect(finalX, barY, cardW, barH);
    ctx.fillStyle = lerpColor('#f0d5d3', '#16875b', clamp(influence, 0, 1));
    const filledH = barH * clamp(influence, 0, 1);
    ctx.fillRect(finalX, barY + barH - filledH, cardW, filledH);
    ctx.strokeStyle = focus === 'product' ? '#16875b' : '#9ca9ba';
    ctx.lineWidth = focus === 'product' ? 3 : 1.5;
    ctx.strokeRect(finalX + 1, barY + 1, cardW - 2, barH - 2);
    ctx.fillStyle = '#17202b';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(influence.toFixed(3), finalX + 12, barY + barH + 38);

    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('机制示意，不是模型输出', margin, height - 14);
  }, [age, focus, gamma, influence, reliability, temporal, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? '#1455d9' : '#c9d0d9'}`,
    background: active ? '#eaf0fb' : '#ffffff',
    color: active ? '#123f9e' : '#344054',
    borderRadius: 6,
    padding: '7px 11px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  return (
    <section aria-label={`交互模块 ${moduleId}：影响核组合器`} style={{ display: 'grid', gap: 14 }}>
      <div ref={hostRef} style={{ width: '100%', height: 288, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} aria-label="空间可靠性、时间衰减曲线与最终影响的组合图" role="img" />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ marginBottom: 7, fontWeight: 700 }}>空间可靠性 K_spatial</legend>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {reliabilityLevels.map((item) => (
              <button key={item.label} type="button" aria-pressed={reliability === item.value} onClick={() => { setAuto(false); setReliability(item.value); }} style={buttonStyle(reliability === item.value)}>
                {item.label} · {item.value.toFixed(2)}
              </button>
            ))}
          </div>
        </fieldset>

        <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>
          逐通道保留率 γ：{gamma.toFixed(3)}
          <input aria-label="逐通道保留率 gamma" type="range" min="0.5" max="0.995" step="0.005" value={gamma} onChange={(event) => { setAuto(false); setGamma(Number(event.target.value)); }} />
        </label>

        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ marginBottom: 7, fontWeight: 700 }}>历史年龄 t−i</legend>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {ages.map((item) => (
              <button key={item} type="button" aria-pressed={age === item} onClick={() => { setAuto(false); setAge(item); }} style={buttonStyle(age === item)}>
                {item} 帧
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 700 }}>影响核分解：</span>
        {([
          ['spatial', '空间可信度'],
          ['time', '时间剩余量'],
          ['product', '最终影响'],
        ] as Array<[Focus, string]>).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={focus === key} onClick={() => { setAuto(false); setFocus(key); }} style={buttonStyle(focus === key)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" aria-pressed={auto} onClick={() => setAuto((value) => !value)} style={buttonStyle(auto)}>
          {auto ? '暂停自动演示' : '自动演示'}
        </button>
      </div>

      <output aria-live="polite" style={{ minHeight: 52, padding: '10px 12px', border: '1px solid #b9c8e8', borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        空间可靠性 <strong>{reliability.toFixed(2)}</strong> × 时间剩余量 <strong>{temporal.toFixed(3)}</strong> = 最终影响 <strong>{influence.toFixed(3)}</strong>。证据越老，γ 的微小差异越会被连乘放大。{reducedMotion ? ' 当前按“减少动态效果”偏好采用即时重绘。' : ''}
      </output>
    </section>
  );
};
