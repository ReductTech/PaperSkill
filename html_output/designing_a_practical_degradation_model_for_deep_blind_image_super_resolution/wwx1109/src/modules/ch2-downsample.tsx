import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { downsample, drawImageTo, type DownMode, px } from './bsrganKit';

function createChart(w = 96, h = 72): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.fillStyle = '#f6f3ea';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, 6);
  ctx.lineTo(90, 66);
  ctx.stroke();
  ctx.strokeStyle = '#c43f52';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 4);
  ctx.lineTo(48, 68);
  ctx.stroke();
  ctx.strokeStyle = '#27446e';
  ctx.beginPath();
  ctx.moveTo(4, 36);
  ctx.lineTo(92, 36);
  ctx.stroke();
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      ctx.fillStyle = (x + y) % 2 ? '#21324a' : '#ffffff';
      ctx.fillRect(64 + x * 6, 44 + y * 6, 6, 6);
    }
  }
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(24, 22, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 48, 26, 16);
  return ctx.getImageData(0, 0, w, h);
}

const MODES: { id: DownMode; label: string; hint: string }[] = [
  { id: 'nearest', label: '最近邻', hint: '保留硬边，容易锯齿；未补偿时有左上偏移。' },
  { id: 'bilinear', label: '双线性', hint: '更平滑，但边缘会变软。' },
  { id: 'bicubic', label: '双三次', hint: '更锐，但可能出现振铃。' },
  { id: 'downup', label: '先下后上', hint: '先缩小再放大，LR 空间出现额外模糊。' },
];

export function Ch2Downsample(_props: WidgetProps) {
  const [mode, setMode] = useState<DownMode>('nearest');
  const [scale, setScale] = useState<2 | 4>(2);
  const [align, setAlign] = useState(false);
  const [a, setA] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chart = useMemo(() => createChart(), []);
  const lr = useMemo(() => downsample(chart, scale, mode, align, a), [chart, scale, mode, align, a]);
  useEffect(() => {
    if (canvasRef.current) drawImageTo(canvasRef.current, lr, false);
  }, [lr]);

  const offset = 0.5 * (scale - 1);
  const hint = MODES.find((m) => m.id === mode)?.hint || '';
  const feedback = mode === 'nearest' && !align
    ? `最近邻未补偿：几何上向左上偏移 ${px(offset)} px。打开“对齐补偿”会先做一次移位高斯预滤波。`
    : mode === 'nearest' && align
      ? '最近邻 + 对齐补偿：预滤波抑制混叠，采样位置回到像素中心。'
      : hint;

  return (
    <div className="bsr-ch2-downsample">
      <section className="bsr-grid-panel">
        <div className="bsr-panel-head"><span>分辨率测试卡</span><b>↓s = {scale}</b></div>
        <div className="bsr-grid-wrap">
          <canvas ref={canvasRef} className="bsr-image" aria-label="下采样后的测试卡像素网格" />
          <svg className="bsr-grid-overlay" viewBox={`0 0 ${lr.width} ${lr.height}`} preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: lr.width + 1 }, (_, i) => <line key={`v${i}`} x1={i} y1={0} x2={i} y2={lr.height} />)}
            {Array.from({ length: lr.height + 1 }, (_, i) => <line key={`h${i}`} x1={0} y1={i} x2={lr.width} y2={i} />)}
          </svg>
        </div>
        <p className="bsr-grid-caption">每个方格是一个 LR 像素；斜线、红十字和棋盘格用来观察重采样与对齐。</p>
      </section>
      <section className="bsr-down-controls">
        <div className="bsr-mode-grid" role="group" aria-label="下采样方式">
          {MODES.map((m) => (
            <button key={m.id} className={mode === m.id ? 'is-on' : ''} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="bsr-inline-row">
          <span>缩放</span>
          <button className={scale === 2 ? 'is-on' : ''} aria-pressed={scale === 2} onClick={() => setScale(2)}>s=2</button>
          <button className={scale === 4 ? 'is-on' : ''} aria-pressed={scale === 4} onClick={() => setScale(4)}>s=4</button>
        </div>
        {mode === 'nearest' && (
          <label className="bsr-check">
            <input type="checkbox" checked={align} onChange={(e) => setAlign(e.target.checked)} />
            对齐补偿（最近邻）
          </label>
        )}
        {mode === 'downup' && (
          <label className="bsr-slider">
            <span>上采样尺度 a</span><b>{a.toFixed(2)}</b>
            <input type="range" min="0.5" max={scale} step="0.25" value={a} onChange={(e) => setA(Number(e.target.value))} />
          </label>
        )}
        <div className="bsr-offset-card">
          <span>左上偏移</span>
          <b>{mode === 'nearest' && !align ? `${px(offset)} px` : mode === 'nearest' ? '已补偿' : '按像素中心采样'}</b>
          <em>0.5 × (s − 1)</em>
        </div>
        <p className={`bsr-feedback ${mode === 'nearest' && !align ? 'is-red' : 'is-blue'}`}>{feedback}</p>
        <p className="bsr-note">论文用平移高斯核补偿 0.5(s−1) 偏移（核宽 [0.1,0.6s]）；s=4 时另有 0.25 概率先做一次 ×2 双线性/双三次。本页为几何示教，四方式等概率。</p>
      </section>
    </div>
  );
}
