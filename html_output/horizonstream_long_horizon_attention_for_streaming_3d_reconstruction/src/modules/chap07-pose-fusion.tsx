import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';

type Mode = 'chain' | 'fusion' | 'loss';

const modeLabels: Record<Mode, string> = {
  chain: '顺序链式',
  fusion: '多 Token 融合',
  loss: '联合损失',
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

export const Chap07PoseFusion: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [mode, setMode] = useState<Mode>('chain');
  const [step, setStep] = useState(0);
  const reducedMotion = useReducedMotion();
  const maxStep = mode === 'loss' ? 2 : 4;

  useEffect(() => {
    setStep(0);
  }, [mode]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => setWidth(Math.max(260, Math.floor(host.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const feedback = useMemo(() => {
    if (mode === 'chain') return `链式第 ${step + 1} 段：每一段的小角度误差都会传给下一段，示意累计偏角为 ${(step * 1.8).toFixed(1)}°。`;
    if (mode === 'fusion') return step < 4 ? `已纳入 ${step + 1}/5 个局部位姿 Token；候选并行进入融合头，不需要只沿一条顺序链传递。` : '五个局部位姿 Token 已联合读取，输出一个窗口级共识位姿。';
    return step === 0 ? 'L_pose 监督相机位姿与局部相对几何。' : step === 1 ? 'L_depth 监督稠密深度，并与位姿共同约束三维结构。' : 'L_scale 只在样本具有度量标注时启用，避免把无尺度样本误当作真实尺度监督。';
  }, [mode, step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 318;
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

    const margin = Math.max(24, width * 0.06);
    ctx.fillStyle = '#17202b';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(modeLabels[mode], margin, 28);

    const drawCamera = (x: number, y: number, angle: number, color: string, active: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.globalAlpha = active ? 1 : 0.26;
      ctx.strokeStyle = color;
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.strokeRect(-12, -8, 24, 16);
      ctx.beginPath();
      ctx.moveTo(12, -6);
      ctx.lineTo(23, -12);
      ctx.lineTo(23, 12);
      ctx.lineTo(12, 6);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    if (mode === 'chain') {
      const startX = margin + 10;
      const routeW = width - margin * 2 - 20;
      const baseY = 158;
      ctx.strokeStyle = '#9ca9ba';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, baseY);
      ctx.lineTo(startX + routeW, baseY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#c43d37';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let index = 0; index < 5; index += 1) {
        const x = startX + (index / 4) * routeW;
        const y = baseY - (index * index * 4.2);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        drawCamera(x, y, index * 1.8, index <= step ? '#c43d37' : '#9ca9ba', index <= step);
      }
      ctx.stroke();
      ctx.fillStyle = '#5e6978';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('灰色虚线：参考方向', startX, 240);
      ctx.fillStyle = '#9e2c27';
      ctx.fillText('红线：逐段小误差累积（机制示意）', startX, 260);
    } else if (mode === 'fusion') {
      const centerX = width * 0.66;
      const centerY = 155;
      const tokenPositions = [
        [margin + 24, 72, -3],
        [margin + 24, 118, 2],
        [margin + 24, 164, -1],
        [margin + 24, 210, 4],
        [margin + 24, 256, 0],
      ];
      tokenPositions.forEach(([x, y, angle], index) => {
        const active = index <= step;
        drawCamera(x, y, angle, active ? '#1455d9' : '#9ca9ba', active);
        ctx.fillStyle = active ? '#1455d9' : '#8c97a5';
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillText(`P${index + 1}`, x + 30, y + 4);
        if (active) {
          ctx.strokeStyle = '#b4c8f2';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 45, y);
          ctx.lineTo(centerX - 28, centerY);
          ctx.stroke();
        }
      });
      ctx.fillStyle = '#eaf0fb';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1455d9';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawCamera(centerX, centerY, step >= 4 ? 0.4 : 2.2, '#16875b', true);
      ctx.fillStyle = '#126b49';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(step >= 4 ? '窗口共识位姿' : '正在聚合候选', centerX - 46, centerY + 80);
    } else {
      const losses = [
        { label: 'λ_pose L_pose', sub: '位姿与相对几何', color: '#1455d9' },
        { label: 'λ_depth L_depth', sub: '稠密深度', color: '#16875b' },
        { label: 'λ_scale L_scale', sub: '有度量标注时启用', color: '#7357c8' },
      ];
      const cardGap = 16;
      const cardW = (width - margin * 2 - cardGap * 2) / 3;
      losses.forEach((item, index) => {
        const x = margin + index * (cardW + cardGap);
        const active = index <= step;
        ctx.fillStyle = active ? `${item.color}18` : '#e7ebef';
        ctx.fillRect(x, 78, cardW, 116);
        ctx.strokeStyle = active ? item.color : '#b7c0cb';
        ctx.lineWidth = active ? 2.5 : 1;
        ctx.strokeRect(x, 78, cardW, 116);
        ctx.fillStyle = active ? item.color : '#657286';
        ctx.font = '700 14px system-ui, sans-serif';
        ctx.fillText(item.label, x + 10, 112);
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(item.sub, x + 10, 142);
        ctx.fillText(active ? '已加入目标' : '等待加入', x + 10, 172);
      });
      ctx.strokeStyle = '#657286';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, 232);
      ctx.lineTo(width - margin, 232);
      ctx.stroke();
      ctx.fillStyle = '#17202b';
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.fillText('L = λ_poseL_pose + λ_depthL_depth + λ_scaleL_scale', margin, 266);
    }

    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('机制示意，轨迹角度与候选值不是论文测量', margin, height - 14);
  }, [mode, step, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? '#1455d9' : '#c9d0d9'}`,
    background: active ? '#eaf0fb' : '#ffffff',
    color: active ? '#123f9e' : '#344054',
    borderRadius: 6,
    padding: '8px 11px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  return (
    <section aria-label={`交互模块 ${moduleId}：多 Token 位姿融合`} style={{ display: 'grid', gap: 14 }}>
      <div ref={hostRef} style={{ width: '100%', height: 318, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} role="img" aria-label={`${modeLabels[mode]}第 ${step + 1} 步示意`} />
      </div>

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ marginBottom: 8, fontWeight: 700 }}>选择观察模式</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.keys(modeLabels) as Mode[]).map((key) => (
            <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)} style={buttonStyle(mode === key)}>
              {modeLabels[key]}
            </button>
          ))}
        </div>
      </fieldset>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} style={buttonStyle(false)} aria-label="上一步">
          ← 上一步
        </button>
        <button type="button" onClick={() => setStep((value) => Math.min(maxStep, value + 1))} disabled={step === maxStep} style={buttonStyle(false)} aria-label="下一步">
          下一步 →
        </button>
        <span aria-live="polite" style={{ color: '#5e6978' }}>第 {step + 1}/{maxStep + 1} 步</span>
      </div>

      <output aria-live="polite" style={{ minHeight: 58, padding: '10px 12px', border: `1px solid ${mode === 'loss' ? '#7357c8' : mode === 'fusion' ? '#16875b' : '#c43d37'}`, borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        {feedback}{mode === 'fusion' ? ' 论文方法由多个局部位姿 Token 联合读出相对位姿。' : mode === 'chain' ? ' 该链式曲线用于说明顺序误差传播，不是对某个基线的数值复现。' : ''}{reducedMotion ? ' 已按减少动态效果偏好采用离散步骤。' : ''}
      </output>
    </section>
  );
};
