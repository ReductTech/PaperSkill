import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 380;
const models = ['RN50', 'RN101', 'RN50x4', 'RN50x16', 'RN50x64', 'ViT-B/32', 'ViT-B/16', 'ViT-L/14@336'];
const scores = [60, 64, 68, 73, 77, 72, 76, 80];
const costs = ['未单列', '未单列', '≈4× RN50 算力', '≈16× RN50 算力', '592 块 V100，18 天', '未单列', '未单列', '256 块 V100，12 天'];

export const ScaleWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: '拖动滑块，查看模型族与训练成本。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('模型族：分数为示意，成本以论文为准', 40, 32);

    models.forEach((name, i) => {
      const y = 55 + i * 34;
      ctx.fillStyle = i === idx ? '#f07e47' : '#d7deea';
      ctx.fillRect(40, y, 150, 28);
      ctx.fillStyle = i === idx ? '#ffffff' : '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText(name, 50, y + 20);
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(210, y, 260, 28);
      ctx.fillStyle = i === idx ? '#27446e' : '#68778f';
      ctx.fillRect(210, y, 260 * (scores[i] / 100), 28);
      ctx.fillStyle = '#21324a';
      ctx.fillText(scores[i] + '（示意）', 480, y + 20);
    });

    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText('当前模型：' + models[idx], 620, 80);
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('训练成本：' + costs[idx], 620, 115);
    ctx.fillText('图像侧缩放：宽度、深度、分辨率同时增加', 620, 160);
    ctx.fillText('文本侧缩放：只扩宽，不加深度（§2.3-3）', 620, 190);
    ctx.fillStyle = '#c43f52';
    ctx.fillText('总体 SOTA 估计还需约 1000 倍算力（§6-1）', 620, 230);
  }, [idx]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>模型 <span className="val">{models[idx]}</span></label>
        <input type="range" min={0} max={models.length - 1} value={idx}
          onChange={(e) => {
            const v = Number(e.target.value);
            setIdx(v);
            setFb(v >= 4
              ? { text: '规模增大，分数上升，训练成本也显著增加。', cls: 'good' }
              : { text: '较小模型成本低，分数尚未到顶。', cls: '' });
          }} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ScaleWidget;
