import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 360;

export const CompareWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'predict' | 'contrast'>('predict');
  const [fb, setFb] = useState({ text: '先看生成式：解码器逐词推进。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);
    const box = (x: number, y: number, w: number, h: number, color: string, text: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(text, x + 10, y + h / 2 + 6);
    };
    const arrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText(mode === 'predict' ? '生成式：解码器逐词预测描述' : '对比式：一次前向得到 N×N 矩阵', 40, 34);

    if (mode === 'predict') {
      box(40, 70, 140, 54, '#27446e', '输入图像');
      arrow(180, 97, 220, 97);
      box(220, 70, 170, 54, '#27446e', '图像编码器');
      arrow(390, 97, 430, 97);
      box(430, 70, 170, 54, '#c43f52', '文本解码器');
      arrow(600, 97, 640, 97);
      ['<sos>', '一只', '狗', '在', '草地'].forEach((tok, i) => {
        box(640 + i * 80, 70, 70, 40, i === 4 ? '#228d5c' : '#68778f', tok);
        if (i < 4) arrow(710 + i * 80, 90, 720 + i * 80, 90);
      });
      ctx.fillStyle = '#c43f52';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('每生成一个词都要再前向一次，序列越长步数越多', 40, 170);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('图 2：6300 万参数语言模型识别 ImageNet 类别的速度比词袋基线慢 3 倍（§2.2-1）', 40, 205);
    } else {
      box(40, 70, 140, 54, '#27446e', '输入图像');
      arrow(180, 97, 220, 97);
      box(220, 70, 170, 54, '#27446e', '图像编码器');
      box(40, 150, 140, 54, '#228d5c', '输入文本');
      arrow(180, 177, 220, 177);
      box(220, 150, 170, 54, '#228d5c', '文本编码器');
      arrow(390, 170, 430, 170);
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText('相似度矩阵', 440, 160);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillStyle = i === j ? '#228d5c' : '#d7deea';
          ctx.fillRect(440 + j * 26, 170 + i * 22, 22, 18);
        }
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('对角线为正样本，其余为负样本', 530, 190);
      ctx.fillStyle = '#228d5c';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('一次矩阵运算覆盖整批配对，效率再提升 4 倍（§2.2-2）', 40, 250);
    }
  }, [mode]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => { setMode('predict'); setFb({ text: '生成式逐词推进，序列越长步数越多。', cls: 'bad' }); }}>生成式</button>
        <button onClick={() => { setMode('contrast'); setFb({ text: '对比式一次矩阵覆盖整批，论文报告再快 4 倍。', cls: 'good' }); }}>对比式</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default CompareWidget;
