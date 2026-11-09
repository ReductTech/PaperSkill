import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 440;

export const ArchWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [path, setPath] = useState<'image' | 'text'>('image');
  const [fb, setFb] = useState({ text: '点“图像塔”或“文本塔”，查看每一层的职责。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 21px "Segoe UI", sans-serif';
    ctx.fillText('双塔架构：两塔独立编码，顶部晚融合', 50, 34);

    const stage = (x: number, y: number, w: number, text: string, active: boolean, color: string) => {
      ctx.fillStyle = active ? color : '#b8c9a7';
      ctx.fillRect(x, y, w, 34);
      ctx.fillStyle = '#ffffff';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText(text, x + 10, y + 22);
    };

    const imageStages = ['输入图像', 'ResNet50 或 ViT', '注意力池化', '线性投影 W_i', 'L2 归一化', 'I_e'];
    const textStages = ['文本', 'BPE 分词', '[SOS] … [EOS]', '12 层 Transformer', '[EOS] 激活 + LN', '线性投影 W_t + L2', 'T_e'];
    const startY = 60;
    imageStages.forEach((s, i) => {
      stage(60, startY + i * 46, 300, s, path === 'image', '#27446e');
    });
    textStages.forEach((s, i) => {
      stage(720, startY + i * 46, 300, s, path === 'text', '#228d5c');
    });

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(360, startY + 5 * 46 + 17);
    ctx.lineTo(520, 400);
    ctx.moveTo(720, startY + 6 * 46 + 17);
    ctx.lineTo(560, 400);
    ctx.stroke();
    ctx.fillStyle = '#21324a';
    ctx.fillRect(440, 400, 200, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillText('余弦相似度', 490, 421);

    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(390, 60, 300, 300);
    ctx.strokeStyle = '#d7deea';
    ctx.strokeRect(390, 60, 300, 300);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 17px "Segoe UI", sans-serif';
    ctx.fillText(path === 'image' ? '图像塔要点' : '文本塔要点', 410, 90);
    ctx.font = '15px "Segoe UI", sans-serif';
    const lines = path === 'image'
      ? [
          'ResNet50 为基线，吸收',
          'ResNetD 改进与抗混叠',
          'rect-2 模糊池化。',
          '注意力池化为单层多头',
          'QKV，query 以全局平均',
          '池化表示为条件。',
          'ViT 变体在 patch 与位置',
          '嵌入后加一层层归一化。',
          '输出经 W_i 投影到 d_e 维，',
          '再做 L2 归一化。',
        ]
      : [
          '12 层、宽 512、8 个注意力头。',
          '输入为小写 BPE 词元序列，',
          '首尾加 [SOS] 与 [EOS]。',
          '取最高层 [EOS] 处激活，',
          '经层归一化与 W_t 投影到',
          'd_e 维，再做 L2 归一化。',
          '掩码自注意力保留把语言',
          '建模作为辅助目标的可能，',
          '正文未展开。',
        ];
    lines.forEach((line, i) => {
      ctx.fillText(line, 410, 120 + i * 22);
    });

    ctx.fillStyle = '#68778f';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('两塔之间不设交叉注意力；融合只发生在最后的余弦比较', 60, 60 + 6 * 46 + 40);
  }, [path]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => { setPath('image'); setFb({ text: '图像塔：ResNetD、抗混叠池化、注意力池化，或 ViT。', cls: '' }); }}>图像塔</button>
        <button onClick={() => { setPath('text'); setFb({ text: '文本塔：12 层、宽 512、8 头，取 [EOS] 激活。', cls: '' }); }}>文本塔</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ArchWidget;
