import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';

interface HeadConfig {
  label: string;
  gate: number;
  quality: string;
  color: string;
  mapping: number[];
}

const heads: HeadConfig[] = [
  { label: 'H1', gate: 0.94, quality: '纹理清晰、对应一致', color: '#16875b', mapping: [0, 1, 2, 3] },
  { label: 'H2', gate: 0.76, quality: '局部遮挡，但整体一致', color: '#1455d9', mapping: [0, 1, 3, 2] },
  { label: 'H3', gate: 0.34, quality: '重复纹理造成交叉', color: '#c66a16', mapping: [2, 3, 0, 1] },
  { label: 'H4', gate: 0.16, quality: '模糊与外点较多', color: '#c43d37', mapping: [3, 0, 2, 1] },
];

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

export const Chap06HeadGate: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [headIndex, setHeadIndex] = useState(0);
  const [gated, setGated] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const reducedMotion = useReducedMotion();
  const [auto, setAuto] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const head = heads[headIndex];

  useEffect(() => {
    if (!auto || reducedMotion) return;
    const timer = window.setInterval(() => {
      setHeadIndex((value) => (value + 1) % heads.length);
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
    const height = 300;
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
    const gap = Math.max(56, width * 0.15);
    const frameW = (width - margin * 2 - gap) / 2;
    const frameH = 182;
    const frameY = 48;
    const leftX = margin;
    const rightX = margin + frameW + gap;

    const drawFrame = (x: number, label: string) => {
      ctx.fillStyle = '#edf1f4';
      ctx.fillRect(x, frameY, frameW, frameH);
      ctx.strokeStyle = '#9ca9ba';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, frameY, frameW, frameH);
      ctx.fillStyle = '#17202b';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(label, x + 10, frameY + 21);
      ctx.fillStyle = '#d9dfe6';
      ctx.fillRect(x + frameW * 0.12, frameY + frameH * 0.36, frameW * 0.76, frameH * 0.12);
      ctx.fillRect(x + frameW * 0.2, frameY + frameH * 0.58, frameW * 0.58, frameH * 0.2);
      ctx.strokeStyle = '#b7c0cb';
      ctx.beginPath();
      ctx.moveTo(x + frameW * 0.08, frameY + frameH * 0.86);
      ctx.lineTo(x + frameW * 0.92, frameY + frameH * 0.86);
      ctx.stroke();
    };
    drawFrame(leftX, '局部窗口 · t−1');
    drawFrame(rightX, '当前帧 · t');

    const leftPoints = [
      [0.2, 0.38], [0.72, 0.4], [0.32, 0.68], [0.76, 0.7],
    ];
    const rightPoints = [
      [0.23, 0.37], [0.7, 0.42], [0.34, 0.66], [0.73, 0.72],
    ];
    const toPoint = (frameX: number, point: number[]) => [frameX + point[0] * frameW, frameY + point[1] * frameH] as const;

    if (showLines) {
      leftPoints.forEach((point, index) => {
        const [x1, y1] = toPoint(leftX, point);
        const [x2, y2] = toPoint(rightX, rightPoints[head.mapping[index]]);
        const correct = head.mapping[index] === index;
        ctx.save();
        ctx.globalAlpha = gated ? Math.max(0.12, head.gate) : 0.9;
        ctx.strokeStyle = correct ? '#16875b' : '#c43d37';
        ctx.lineWidth = correct ? 2.5 : 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + gap * 0.35, y1, x2 - gap * 0.35, y2, x2, y2);
        ctx.stroke();
        ctx.restore();
      });
    }

    leftPoints.forEach((point, index) => {
      const [lx, ly] = toPoint(leftX, point);
      const [rx, ry] = toPoint(rightX, rightPoints[index]);
      ctx.fillStyle = '#1455d9';
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    const gateW = Math.min(180, width * 0.34);
    const gateX = width / 2 - gateW / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gateX, 12, gateW, 48);
    ctx.strokeStyle = head.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(gateX, 12, gateW, 48);
    ctx.fillStyle = head.color;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(`${head.label} · g_h=${head.gate.toFixed(2)}`, gateX + 10, 32);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(gated ? '门控已应用' : '门控已旁路', gateX + 10, 50);

    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('机制示意，不是模型输出', margin, height - 17);
  }, [gated, head, showLines, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? head.color : '#c9d0d9'}`,
    background: active ? `${head.color}14` : '#ffffff',
    color: active ? head.color : '#344054',
    borderRadius: 6,
    padding: '8px 11px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  return (
    <section aria-label={`交互模块 ${moduleId}：逐头可靠性门控`} style={{ display: 'grid', gap: 14 }}>
      <div ref={hostRef} style={{ width: '100%', height: 300, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} role="img" aria-label={`${head.label} 局部匹配线与可靠性门控示意`} />
      </div>

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ marginBottom: 8, fontWeight: 700 }}>逐头可靠性</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {heads.map((item, index) => (
            <button key={item.label} type="button" aria-pressed={headIndex === index} onClick={() => { setAuto(false); setHeadIndex(index); }} style={buttonStyle(headIndex === index)}>
              {item.label} · {item.quality}
            </button>
          ))}
        </div>
      </fieldset>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" aria-pressed={gated} onClick={() => { setAuto(false); setGated((value) => !value); }} style={buttonStyle(gated)}>
          {gated ? '✓ 已应用门控' : '应用门控'}
        </button>
        <button type="button" aria-pressed={showLines} onClick={() => { setAuto(false); setShowLines((value) => !value); }} style={buttonStyle(showLines)}>
          {showLines ? '隐藏匹配线' : '显示匹配线'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" aria-pressed={auto} onClick={() => setAuto((value) => !value)} style={buttonStyle(auto)}>
          {auto ? '暂停自动演示' : '自动演示'}
        </button>
      </div>

      <output aria-live="polite" style={{ minHeight: 58, padding: '10px 12px', border: `1px solid ${head.color}`, borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        <strong>{head.label}：</strong>{head.quality}。{gated ? `式（8）用 g_h=${head.gate.toFixed(2)} 缩放该头输出：低可靠头变淡，高可靠头保留。` : '门控关闭时，所有头无差别进入局部输出，错误匹配也可能被写进长期状态。'} 示例门值仅用于机制解释。{reducedMotion ? ' 已采用无过渡即时更新。' : ''}
      </output>
    </section>
  );
};
