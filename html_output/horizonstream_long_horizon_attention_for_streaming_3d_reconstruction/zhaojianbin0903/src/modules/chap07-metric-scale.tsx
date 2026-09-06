import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';

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

export const Chap07MetricScale: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [scale, setScale] = useState(1.25);
  const [applyMrt, setApplyMrt] = useState(true);
  const [showUnits, setShowUnits] = useState(true);
  const [separateScale, setSeparateScale] = useState(false);
  const reducedMotion = useReducedMotion();
  const [auto, setAuto] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const rawTranslation = 2.4;
  const rawDepth = 5;
  const translation = applyMrt ? rawTranslation * scale : rawTranslation;
  const depthScale = separateScale && applyMrt ? scale * 0.72 : scale;
  const depth = applyMrt ? rawDepth * depthScale : rawDepth;

  useEffect(() => {
    if (!auto || reducedMotion) return;
    const states = [
      { applyMrt: false, separateScale: false, scale: 1.25 },
      { applyMrt: true, separateScale: false, scale: 1.25 },
      { applyMrt: true, separateScale: true, scale: 1.25 },
    ];
    let index = 1;
    const timer = window.setInterval(() => {
      index = (index + 1) % states.length;
      const state = states[index];
      setApplyMrt(state.applyMrt);
      setSeparateScale(state.separateScale);
      setScale(state.scale);
    }, 2400);
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
    const height = 304;
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

    const margin = Math.max(18, width * 0.04);
    const rulerGap = Math.max(24, width * 0.06);
    const rulerW = (width - margin * 2 - rulerGap) / 2;
    const leftX = margin;
    const rightX = margin + rulerW + rulerGap;
    const cardW = Math.min(250, width * 0.48);
    const cardX = width / 2 - cardW / 2;

    ctx.fillStyle = '#f0eefa';
    ctx.fillRect(cardX, 18, cardW, 60);
    ctx.strokeStyle = '#7357c8';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, 18, cardW, 60);
    ctx.fillStyle = '#5b439e';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText('MRT 标定卡', cardX + 12, 42);
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(applyMrt ? `ŝ = ${scale.toFixed(2)}（正尺度）` : '尚未应用尺度', cardX + 12, 63);

    const drawRuler = (x: number, label: string, raw: number, output: number, color: string, unit: string) => {
      const y = 116;
      const barH = 42;
      const normalized = Math.min(1, output / 10);
      ctx.fillStyle = '#e5e9ee';
      ctx.fillRect(x, y, rulerW, barH);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, rulerW * normalized, barH);
      ctx.strokeStyle = '#9ca9ba';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, rulerW, barH);
      ctx.fillStyle = '#17202b';
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.fillText(label, x, y - 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillText(`${output.toFixed(2)}${showUnits ? ` ${unit}` : ''}`, x + 10, y + 27);
      ctx.fillStyle = '#5e6978';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`原始读出 ${raw.toFixed(2)}${showUnits ? ` ${unit}` : ''}`, x, y + 64);
      if (showUnits) {
        ctx.strokeStyle = '#657286';
        for (let tick = 0; tick <= 10; tick += 1) {
          const tx = x + (tick / 10) * rulerW;
          ctx.beginPath();
          ctx.moveTo(tx, y + barH + 2);
          ctx.lineTo(tx, y + barH + (tick % 5 === 0 ? 10 : 6));
          ctx.stroke();
        }
      }
    };
    drawRuler(leftX, '平移 t̂', rawTranslation, translation, '#1455d9', 'm');
    drawRuler(rightX, '深度 D̂', rawDepth, depth, separateScale && applyMrt ? '#c43d37' : '#7357c8', 'm');

    ctx.strokeStyle = '#7357c8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + cardW * 0.35, 78);
    ctx.lineTo(leftX + rulerW * 0.5, 106);
    ctx.moveTo(cardX + cardW * 0.65, 78);
    ctx.lineTo(rightX + rulerW * 0.5, 106);
    ctx.stroke();

    const noteY = 222;
    ctx.fillStyle = separateScale && applyMrt ? '#fff0ef' : '#eaf5f0';
    ctx.fillRect(margin, noteY, width - margin * 2, 46);
    ctx.fillStyle = separateScale && applyMrt ? '#9e2c27' : '#126b49';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(
      separateScale && applyMrt ? '两把尺发生冲突：平移与深度不再共享同一几何尺度' : applyMrt ? '同一 ŝ 同时乘到平移和深度，单位基准保持一致' : '当前显示原始平移与原始深度，尚未进行度量校准',
      margin + 10,
      noteY + 28
    );
    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('机制示意，数值不是论文模型输出', margin, height - 13);
  }, [applyMrt, depth, scale, separateScale, showUnits, translation, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? '#7357c8' : '#c9d0d9'}`,
    background: active ? '#f0eefa' : '#ffffff',
    color: active ? '#5b439e' : '#344054',
    borderRadius: 6,
    padding: '8px 11px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  return (
    <section aria-label={`交互模块 ${moduleId}：MRT 统一尺度`} style={{ display: 'grid', gap: 14 }}>
      <div ref={hostRef} style={{ width: '100%', height: 304, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} role="img" aria-label="同一 MRT 正尺度同时校准平移与深度的示意图" />
      </div>

      <label style={{ display: 'grid', gap: 7, fontWeight: 700 }}>
        概念尺度 ŝ：{scale.toFixed(2)}
          <input aria-label="MRT 概念尺度" type="range" min="0.5" max="2" step="0.05" value={scale} onChange={(event) => { setAuto(false); setScale(Number(event.target.value)); }} />
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" aria-pressed={!applyMrt} onClick={() => { setAuto(false); setApplyMrt(false); setSeparateScale(false); }} style={buttonStyle(!applyMrt)}>
          原始读出
        </button>
        <button type="button" aria-pressed={applyMrt && !separateScale} onClick={() => { setAuto(false); setApplyMrt(true); setSeparateScale(false); }} style={buttonStyle(applyMrt && !separateScale)}>
          应用 MRT
        </button>
        <button type="button" aria-pressed={separateScale} onClick={() => { setAuto(false); setApplyMrt(true); setSeparateScale((value) => !value); }} style={{ ...buttonStyle(separateScale), borderColor: separateScale ? '#c43d37' : '#c9d0d9', color: separateScale ? '#9e2c27' : '#344054' }}>
          两把尺（反例）
        </button>
        <button type="button" aria-pressed={showUnits} onClick={() => { setAuto(false); setShowUnits((value) => !value); }} style={buttonStyle(showUnits)}>
          {showUnits ? '隐藏单位参照' : '显示单位参照'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" aria-pressed={auto} onClick={() => setAuto((value) => !value)} style={buttonStyle(auto)}>
          {auto ? '暂停自动演示' : '自动演示'}
        </button>
      </div>

      <output aria-live="polite" style={{ minHeight: 62, padding: '10px 12px', border: `1px solid ${separateScale ? '#c43d37' : '#7357c8'}`, borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        {applyMrt ? (
          separateScale
            ? '反例中深度被故意乘了不同尺度，因此位移和深度不再对应同一个三维世界。HorizonStream 的 MRT 不这样做。'
            : `t̂=${scale.toFixed(2)}×${rawTranslation.toFixed(2)}=${translation.toFixed(2)}，D̂=${scale.toFixed(2)}×${rawDepth.toFixed(2)}=${depth.toFixed(2)}。同一个 ŝ 同时校准两者。`
        ) : '原始读出 t̂_raw 与 D̂_raw 还没有统一到度量尺度。'} `exp(g(z_metric))` 保证 ŝ 始终为正。{reducedMotion ? ' 已按减少动态效果偏好即时重绘。' : ''}
      </output>
    </section>
  );
};
