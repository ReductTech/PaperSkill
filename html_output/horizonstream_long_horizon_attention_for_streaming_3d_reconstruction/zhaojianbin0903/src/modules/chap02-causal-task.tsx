import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
const H = 270;
type OutputKind = 'pose' | 'depth' | 'cloud';

const steps = [
  '读取当前 RGB 帧；未来观测被遮蔽。',
  '把当前图像编码成用于匹配和重建的几何证据。',
  '用当前证据更新固定大小的持久状态 S_t。',
  '从当前表示读出位姿与稠密深度，并定位三维点。',
];

function drawAxes(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const axes = [
    { dx: 34, dy: 0, c: '#c43d37', label: 'x' },
    { dx: 0, dy: -34, c: '#16875b', label: 'y' },
    { dx: 22, dy: 22, c: '#1455d9', label: 'z' },
  ];
  axes.forEach((axis) => {
    ctx.strokeStyle = axis.c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + axis.dx, y + axis.dy);
    ctx.stroke();
    ctx.fillStyle = axis.c;
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillText(axis.label, x + axis.dx + 3, y + axis.dy + 3);
  });
}

export const Chap02CausalTask: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [output, setOutput] = useState<OutputKind>('pose');
  const [showStateSize, setShowStateSize] = useState(true);
  const [auto, setAuto] = useState(false);
  const [visible, setVisible] = useState(true);
  const [overrideFeedback, setOverrideFeedback] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible || reducedMotion) return;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % steps.length);
      setOverrideFeedback('');
    }, 1300);
    return () => window.clearInterval(timer);
  }, [auto, visible, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(94,105,120,0.12)';
    for (let x = 12; x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 12; y < H; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const frameLabels = ['t−2', 't−1', 't', 't+1', 't+2'];
    frameLabels.forEach((label, index) => {
      const x = 24 + index * 60;
      const isFuture = index > 2;
      const isCurrent = index === 2;
      ctx.fillStyle = isCurrent ? '#1455d9' : isFuture ? '#f1f3f5' : '#dfe4ea';
      ctx.strokeStyle = isCurrent && step === 0 ? '#c66a16' : '#9ca9ba';
      ctx.lineWidth = isCurrent && step === 0 ? 3 : 1;
      ctx.fillRect(x, 36, 48, 56);
      ctx.strokeRect(x, 36, 48, 56);
      if (isFuture) {
        ctx.strokeStyle = '#c3cad3';
        for (let s = -4; s < 48; s += 9) {
          ctx.beginPath();
          ctx.moveTo(x + Math.max(0, s), 92);
          ctx.lineTo(x + Math.min(48, s + 22), 36);
          ctx.stroke();
        }
      }
      ctx.fillStyle = isCurrent ? '#ffffff' : '#5e6978';
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText(label, x + 14, 67);
    });
    ctx.fillStyle = '#5e6978';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('过去', 29, 111);
    ctx.fillStyle = '#1455d9';
    ctx.fillText('当前', 151, 111);
    ctx.fillStyle = '#9ca9ba';
    ctx.fillText('未来不可用', 211, 111);

    ctx.strokeStyle = step === 1 ? '#c66a16' : '#9ca9ba';
    ctx.lineWidth = step === 1 ? 3 : 1.5;
    ctx.strokeRect(325, 44, 88, 77);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        ctx.fillStyle = ['#1455d9', '#16875b', '#7357c8'][(row + col) % 3];
        ctx.globalAlpha = step >= 1 ? 0.85 : 0.18;
        ctx.fillRect(337 + col * 17, 57 + row * 18, 10, 10);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#17202b';
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('编码证据', 343, 139);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = step === 2 ? '#c66a16' : '#1455d9';
    ctx.lineWidth = step === 2 ? 4 : 2;
    ctx.fillRect(458, 35, 142, 96);
    ctx.strokeRect(458, 35, 142, 96);
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const active = (row * 3 + col + step) % 7 < 3;
        ctx.fillStyle = active ? '#1455d9' : '#d5dbe3';
        ctx.globalAlpha = step >= 2 ? 0.85 : 0.38;
        ctx.fillRect(469 + col * 15, 47 + row * 14, 9, 8);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#17202b';
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('固定持久状态 S_t', 473, 151);
    if (showStateSize) {
      ctx.fillStyle = '#1455d9';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('边界固定：大小不随帧数增长', 455, 171);
    }

    ctx.strokeStyle = '#9ca9ba';
    ctx.lineWidth = 2;
    [[300, 64, 321, 64], [416, 83, 454, 83], [604, 83, 630, 83]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = step === 3 ? '#16875b' : '#9ca9ba';
    ctx.lineWidth = step === 3 ? 4 : 1.5;
    ctx.fillRect(634, 35, 102, 124);
    ctx.strokeRect(634, 35, 102, 124);
    if (output === 'pose') {
      drawAxes(ctx, 673, 104);
    } else if (output === 'depth') {
      ['#dbe8ff', '#a8c6ff', '#5d91ed', '#1455d9'].forEach((color, index) => {
        ctx.fillStyle = color;
        ctx.fillRect(649 + index * 17, 58 + index * 10, 54 - index * 8, 13);
      });
    } else {
      for (let index = 0; index < 38; index += 1) {
        ctx.fillStyle = index % 4 === 0 ? '#16875b' : '#1455d9';
        const x = 648 + ((index * 29) % 75);
        const y = 49 + ((index * 17) % 91);
        ctx.fillRect(x, y, 3, 3);
      }
    }
    ctx.fillStyle = '#17202b';
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText(output === 'pose' ? '当前位姿' : output === 'depth' ? '稠密深度' : '当前点云', 653, 181);

    ctx.fillStyle = '#17202b';
    ctx.font = '700 13px "Segoe UI", sans-serif';
    const labels = ['① 当前帧', '② 编码', '③ 更新 S_t', '④ 读出'];
    labels.forEach((label, index) => {
      ctx.fillStyle = index === step ? '#c66a16' : '#758195';
      ctx.fillText(label, 40 + index * 175, 229);
    });
    ctx.fillStyle = '#758195';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('机制示意，不是模型输出', 578, 254);
    canvas.classList.add('is-ready');
  }, [step, output, showStateSize]);

  const selectFrame = (index: number) => {
    setAuto(false);
    if (index > 2) {
      setOverrideFeedback('流式因果设置：未来观测不可用。当前帧不能读取 t+1 或 t+2。');
      return;
    }
    setStep(index === 2 ? 0 : 1);
    setOverrideFeedback(index === 2 ? steps[0] : '过去帧可以通过持久状态影响当前，但不会直接读取未来。');
  };

  const moveStep = (delta: number) => {
    setAuto(false);
    setOverrideFeedback('');
    setStep((current) => Math.max(0, Math.min(steps.length - 1, current + delta)));
  };

  const selectOutput = (next: OutputKind) => {
    setOutput(next);
    setStep(3);
    setAuto(false);
    setOverrideFeedback(
      next === 'pose'
        ? '位姿给出相机在统一坐标系中的位置与朝向。'
        : next === 'depth'
          ? '稠密深度给出每个像素沿相机射线的距离。'
          : '位姿负责坐标变换，深度负责沿射线定位；二者共同得到三维点。'
    );
  };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择可读取的帧">
        {['t−2', 't−1', 't', 't+1', 't+2'].map((label, index) => (
          <button
            key={label}
            type="button"
            className={`chip ${index === 2 && step === 0 ? 'selected' : ''}`}
            onClick={() => selectFrame(index)}
            aria-label={index > 2 ? `尝试读取未来帧 ${label}` : `读取帧 ${label}`}
          >
            {label}{index > 2 ? ' · 不可用' : ''}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`流式三维重建因果闭环，当前步骤 ${step + 1}：${steps[step]}`}
      />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => moveStep(-1)} disabled={step === 0} aria-label="上一步">
          上一步
        </button>
        <span className="step-label">步骤 <b>{step + 1}</b> / {steps.length}</span>
        <button type="button" className="tiny" onClick={() => moveStep(1)} disabled={step === steps.length - 1} aria-label="下一步">
          下一步
        </button>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => { setStep(0); setAuto(false); setOverrideFeedback('已重置到当前帧输入。'); }}
        >
          重置
        </button>
        <button
          type="button"
          className="tiny ghost"
          disabled={reducedMotion}
          title={reducedMotion ? '系统已启用减少动态效果，请使用手动步进。' : '自动演示四个步骤'}
          aria-pressed={auto}
          onClick={() => { setAuto((value) => !value); setOverrideFeedback(''); }}
        >
          {auto ? '停止自动' : '自动演示'}
        </button>
      </div>
      <div className="ctrl">
        <span style={{ color: '#5e6978', fontWeight: 700 }}>读出视图</span>
        {([
          ['pose', '位姿'],
          ['depth', '稠密深度'],
          ['cloud', '点云'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip ${output === key ? 'selected' : ''}`}
            aria-pressed={output === key}
            onClick={() => selectOutput(key)}
          >
            {label}
          </button>
        ))}
        <label style={{ marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={showStateSize}
            onChange={(event) => setShowStateSize(event.target.checked)}
          />
          显示状态尺寸说明
        </label>
      </div>
      <div className="feedback good" aria-live="polite">{overrideFeedback || steps[step]}</div>
    </div>
  );
};

export default Chap02CausalTask;
