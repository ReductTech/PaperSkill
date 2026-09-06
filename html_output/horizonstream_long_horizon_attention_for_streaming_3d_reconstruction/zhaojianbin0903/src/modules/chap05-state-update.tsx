import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, lerpColor, setupCanvas } from '../lib/canvasKit';

type Channel = 'short' | 'medium' | 'long';

const stages = [
  { title: '准备旧状态', detail: 'S_(t−1) 已包含此前跨窗口几何证据。' },
  { title: '衰减旧状态', detail: 'diag(γ_t) 按通道缩放旧状态，不同信息以不同速度淡出。' },
  { title: '写入当前证据', detail: 'φ(k_t)ṽ_tᵀ 形成低秩写入，把当前帧几何加入固定矩阵。' },
  { title: '由查询读取', detail: 'q_tᵀS_t 从更新后的状态中读出当前所需的跨窗口信息。' },
];

const channels: Record<Channel, { label: string; gamma: number; color: string }> = {
  short: { label: '短期', gamma: 0.55, color: '#1455d9' },
  medium: { label: '中期', gamma: 0.82, color: '#16875b' },
  long: { label: '长期', gamma: 0.97, color: '#7357c8' },
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

export const Chap05StateUpdate: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [stage, setStage] = useState(0);
  const [channel, setChannel] = useState<Channel>('medium');
  const [auto, setAuto] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const reducedMotion = useReducedMotion();
  const selected = channels[channel];

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
    if (!auto || reducedMotion) return;
    const timer = window.setInterval(() => {
      setStage((value) => (value + 1) % stages.length);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [auto, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 310;
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

    const matrixSize = Math.min(240, width * 0.47);
    const cell = matrixSize / 6;
    const matrixX = Math.max(18, width * 0.07);
    const matrixY = 42;
    ctx.fillStyle = '#17202b';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(stage === 0 ? 'S_(t−1)' : 'S_t（固定 6×6 外框）', matrixX, 25);

    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const oldValue = 0.18 + 0.72 * Math.abs(Math.sin((row + 1) * (col + 2) * 0.73));
        const decayed = stage >= 1 ? oldValue * selected.gamma : oldValue;
        const write = stage >= 2 ? Math.max(0, 0.88 - Math.abs(row - 2) * 0.18 - Math.abs(col - 3) * 0.16) : 0;
        const combined = clamp(decayed * 0.78 + write * 0.5, 0, 1);
        const value = stage >= 2 ? combined : decayed;
        ctx.fillStyle = lerpColor('#eef1f4', selected.color, value);
        ctx.fillRect(matrixX + col * cell + 2, matrixY + row * cell + 2, cell - 4, cell - 4);
        ctx.strokeStyle = '#cbd2db';
        ctx.lineWidth = 1;
        ctx.strokeRect(matrixX + col * cell, matrixY + row * cell, cell, cell);
      }
    }
    ctx.strokeStyle = '#657286';
    ctx.lineWidth = 2;
    ctx.strokeRect(matrixX, matrixY, matrixSize, matrixSize);

    const infoX = matrixX + matrixSize + Math.max(28, width * 0.07);
    const infoW = Math.max(120, width - infoX - 22);
    const labels = ['旧状态', '逐通道衰减', '低秩写入', '查询读取'];
    labels.forEach((label, index) => {
      const y = 55 + index * 54;
      const active = stage === index;
      const done = stage > index;
      ctx.fillStyle = active ? selected.color : done ? '#d8e8e1' : '#e7ebef';
      ctx.fillRect(infoX, y, Math.min(infoW, 230), 34);
      ctx.fillStyle = active ? '#ffffff' : '#344054';
      ctx.font = `${active ? 700 : 600} 12px system-ui, sans-serif`;
      ctx.fillText(`${index + 1}. ${label}`, infoX + 10, y + 22);
      if (index < labels.length - 1) {
        ctx.strokeStyle = '#9ca9ba';
        ctx.beginPath();
        ctx.moveTo(infoX + 16, y + 35);
        ctx.lineTo(infoX + 16, y + 52);
        ctx.stroke();
      }
    });

    if (stage === 3) {
      ctx.strokeStyle = '#c66a16';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(infoX - 8, 55 + 3 * 54 + 17);
      ctx.lineTo(matrixX + matrixSize, matrixY + matrixSize * 0.5);
      ctx.stroke();
      ctx.fillStyle = '#c66a16';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillText('q_t', infoX - 2, 55 + 3 * 54 + 13);
    }

    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`当前聚焦：${selected.label}通道，示意 γ=${selected.gamma.toFixed(2)}`, matrixX, height - 16);
  }, [selected, stage, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? selected.color : '#c9d0d9'}`,
    background: active ? `${selected.color}14` : '#ffffff',
    color: active ? selected.color : '#344054',
    borderRadius: 6,
    padding: '7px 10px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  const advance = () => { setAuto(false); setStage((value) => Math.min(stages.length - 1, value + 1)); };

  return (
    <section aria-label={`交互模块 ${moduleId}：递归状态更新`} style={{ display: 'grid', gap: 14 }}>
      <div ref={hostRef} style={{ width: '100%', height: 310, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} role="img" aria-label={`固定状态更新第 ${stage + 1} 步：${stages[stage].title}`} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => { setAuto(false); setStage((value) => Math.max(0, value - 1)); }} disabled={stage === 0} style={buttonStyle(false)} aria-label="上一步">
          ← 上一步
        </button>
        <button type="button" onClick={advance} disabled={stage === stages.length - 1} style={buttonStyle(false)} aria-label="下一步">
          下一步 →
        </button>
        <button type="button" onClick={() => { setStage(0); setAuto(false); }} style={buttonStyle(stage === 0)}>
          重置
        </button>
        <button
          type="button"
          aria-pressed={auto}
          onClick={() => {
            if (reducedMotion) advance();
            else setAuto((value) => !value);
          }}
          style={buttonStyle(auto)}
        >
          {reducedMotion ? '减少动态：单步推进' : auto ? '暂停自动' : '自动演示'}
        </button>
        <span aria-live="polite" style={{ color: '#5e6978' }}>第 {stage + 1}/4 步</span>
      </div>

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ marginBottom: 8, fontWeight: 700 }}>多时间尺度通道</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.keys(channels) as Channel[]).map((key) => (
            <button key={key} type="button" aria-pressed={channel === key} onClick={() => { setAuto(false); setChannel(key); }} style={buttonStyle(channel === key)}>
            {channels[key].label}
            </button>
          ))}
        </div>
      </fieldset>

      <output aria-live="polite" style={{ minHeight: 56, padding: '10px 12px', border: `1px solid ${selected.color}`, borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        <strong>{stages[stage].title}：</strong>{stages[stage].detail} 固定的外框强调状态尺寸不随序列长度增长；颜色和 6×6 网格均为机制示意。
      </output>
    </section>
  );
};
