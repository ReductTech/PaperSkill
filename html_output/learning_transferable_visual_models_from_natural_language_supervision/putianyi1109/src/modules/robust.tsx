import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 260;
const data = [
  { name: 'ImageNet', rn: 76.2, clip: 76.2, d: '0%' },
  { name: 'ImageNetV2', rn: 64.3, clip: 70.1, d: '+5.8%' },
  { name: 'ImageNet-R', rn: 37.7, clip: 88.9, d: '+51.2%' },
  { name: 'ObjectNet', rn: 32.6, clip: 72.3, d: '+39.7%' },
  { name: 'Sketch', rn: 25.2, clip: 60.2, d: '+35.0%' },
  { name: 'ImageNet-A', rn: 2.7, clip: 77.1, d: '+74.4%' },
];

export const RobustWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: '选一个分布偏移数据集，看同一个 ImageNet 分数下的差距。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H);
      c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    const row = data[idx];
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText(row.name + '：同 ImageNet 准确率下的表现', 60, 42);
    const bar = (y: number, label: string, v: number, color: string) => {
      ctx.fillStyle = '#68778f';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText(label, 60, y + 24);
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(220, y, 700, 34);
      ctx.fillStyle = color;
      ctx.fillRect(220, y, 700 * (v / 100), 34);
      ctx.fillStyle = '#21324a';
      ctx.fillText(v.toFixed(1) + '%', 940, y + 24);
    };
    bar(80, 'ResNet101', row.rn, '#c43f52');
    bar(140, '零样本 CLIP', row.clip, '#228d5c');
    ctx.fillStyle = '#21324a';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('分差 ' + row.d, 60, 230);
  }, [idx]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <select value={idx} onChange={(e) => {
          const v = Number(e.target.value);
          setIdx(v);
          setFb(v === 0
            ? { text: 'ImageNet 上两者同分，这是对照的基准。', cls: '' }
            : { text: '同 ImageNet 分数下，CLIP 在偏移集上高出一大截。', cls: 'good' });
        }}>
          {data.map((d, i) => <option key={d.name} value={i}>{d.name}</option>)}
        </select>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default RobustWidget;
