import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 250;

export const OverlapWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'median' | 'max'>('median');
  const [fb, setFb] = useState({ text: '论文只报告聚合值：中位 2.2%，最大提升 0.6%。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H);
      c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    const v = mode === 'median' ? 2.2 : 0.6;
    const label = mode === 'median' ? '重叠率中位数 2.2%' : '最大准确率提升 0.6%（Birdsnap）';
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText(label, 60, 50);
    ctx.fillStyle = '#d7deea';
    ctx.fillRect(60, 90, 900, 48);
    ctx.fillStyle = mode === 'median' ? '#f07e47' : '#27446e';
    ctx.fillRect(60, 90, 900 * (v / 5), 48);
    ctx.fillStyle = '#21324a';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText(mode === 'median' ? '35 个数据集的重叠中位数' : '检测到的最大提升，远小于数十个百分点的差距', 60, 190);
    ctx.fillStyle = '#68778f';
    ctx.font = '17px "Segoe UI", sans-serif';
    ctx.fillText('平均重叠 3.2%；总体准确率变化多 ≤0.1%', 60, 225);
  }, [mode]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => { setMode('median'); setFb({ text: '中位重叠 2.2%，量级很小。', cls: '' }); }}>看重叠中位数</button>
        <button onClick={() => { setMode('max'); setFb({ text: '最大提升仅 0.6%，解释不了数十个百分点的差距。', cls: 'good' }); }}>看最大提升</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default OverlapWidget;
