import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 380;

export const PathwayWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'label' | 'text' | 'story'>('label');
  const [fb, setFb] = useState({ text: '闭集分类：先看输出层如何限制类别。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    let raf: number | null = null;
    let t = 0;

    const box = (x: number, y: number, w: number, h: number, color: string, text: string, sub?: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText(text, x + 12, y + (sub ? h / 2 - 4 : h / 2 + 6));
      if (sub) {
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(sub, x + 12, y + h / 2 + 16);
      }
    };
    const arrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 7, y2 - 4);
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 7, y2 + 4);
      ctx.stroke();
    };
    const title = (text: string) => {
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 21px "Segoe UI", sans-serif';
      ctx.fillText(text, 50, 34);
    };

    const drawLabel = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      title('闭集分类：类别数 = 输出单元数');
      box(40, 70, 120, 64, '#27446e', '输入图像');
      arrow(160, 102, 200, 102);
      box(200, 70, 150, 64, '#27446e', '图像编码器', 'ResNet / ViT');
      arrow(350, 102, 390, 102);
      box(390, 70, 130, 64, '#27446e', '图像特征', 'd 维向量');
      arrow(520, 102, 560, 102);
      box(560, 70, 160, 64, '#c43f52', '线性分类头', '3 × d 权重');
      arrow(720, 102, 760, 102);
      const logits = [2.1, 1.6, 0.8];
      ['狗', '汽车', '鸟'].forEach((name, i) => {
        const y = 62 + i * 46;
        ctx.fillStyle = '#68778f';
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.fillText(name, 780, y + 22);
        ctx.fillStyle = '#d7deea';
        ctx.fillRect(830, y, 190, 30);
        ctx.fillStyle = i === 0 ? '#c43f52' : '#27446e';
        ctx.fillRect(830, y, 190 * (logits[i] / 2.1), 30);
        ctx.fillStyle = '#21324a';
        ctx.fillText(logits[i].toFixed(1), 1030, y + 22);
      });
      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('softmax 后：狗 0.45，汽车 0.35，鸟 0.20；argmax 取“狗”', 50, 250);
      ctx.fillStyle = '#c43f52';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('“望远镜”没有对应的权重行，模型只能把它归入最接近的“狗”', 50, 290);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('新增该类须扩充分类头为 4 × d，并补充该类标注样本', 50, 330);
    };

    const drawText = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      title('图文匹配：类别集合由候选文本给出');
      box(50, 70, 120, 60, '#27446e', '输入图像');
      arrow(170, 100, 210, 100);
      box(210, 70, 150, 60, '#27446e', '图像编码器', 'ResNet / ViT');
      arrow(360, 100, 400, 100);
      box(400, 70, 140, 60, '#27446e', '图像嵌入', 'd 维，已归一化');
      const items = [
        { t: '一张狗的照片', s: 0.12 },
        { t: '一张汽车的照片', s: 0.08 },
        { t: '一只鸟的照片', s: 0.15 },
        { t: '一张望远镜的照片', s: 0.82 },
      ];
      items.forEach((it, i) => {
        const y = 160 + i * 46;
        box(50, y, 300, 34, i === 3 ? '#228d5c' : '#27446e', it.t);
        ctx.fillStyle = i === 3 ? '#228d5c' : '#68778f';
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.fillText('cos ' + it.s.toFixed(2), 380, y + 24);
      });
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(470, 100);
      ctx.lineTo(520, 100);
      ctx.stroke();
      box(520, 70, 200, 60, '#228d5c', '文本编码器', '12 层 Transformer');
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText('四段候选文本分别编码为 4 个 d 维向量', 740, 96);
      ctx.fillStyle = '#228d5c';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('余弦最大：望远镜 0.82；argmax 即预测，输出层不变', 50, 340);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('类别名与描述在推理时给出，文本向量可预先计算并复用', 50, 372);
    };

    const drawStory = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      title('整体流程：两塔编码，顶部比较');
      const phase = (Math.sin(t) + 1) / 2;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 70);
      ctx.lineTo(300, 300);
      ctx.moveTo(780, 70);
      ctx.lineTo(780, 300);
      ctx.stroke();
      const stage = (x: number, y: number, w: number, text: string, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText(text, x + 10, y + 23);
      };
      stage(180, 300, 240, '图像输入', '#27446e');
      stage(180, 250, 240, '图像编码器', '#27446e');
      stage(180, 200, 240, '线性投影 + 归一化', '#27446e');
      stage(660, 300, 240, '候选文本', '#228d5c');
      stage(660, 250, 240, '文本编码器', '#228d5c');
      stage(660, 200, 240, '线性投影 + 归一化', '#228d5c');
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.arc(300, 285 - phase * 60, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(780, 285 - phase * 60, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 90);
      ctx.lineTo(780, 90);
      ctx.stroke();
      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('顶部：余弦相似度矩阵，取最大类别', 390, 72);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('两塔独立编码，最后才在嵌入空间相遇', 410, 350);
    };

    const draw = () => {
      if (mode === 'label') drawLabel();
      else if (mode === 'text') drawText();
      else drawStory();
      if (mode === 'story') {
        t += 0.04;
        raf = requestAnimationFrame(draw);
      }
    };

    if (mode === 'story') {
      const disconnect = observeCanvas(c, () => { if (!raf) draw(); }, () => { if (raf) cancelAnimationFrame(raf); raf = null; });
      return () => { if (raf) cancelAnimationFrame(raf); disconnect(); };
    }
    draw();
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [mode]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => { setMode('label'); setFb({ text: '闭集分类：输出单元固定，新概念没有权重行。', cls: 'bad' }); }}>只靠标签</button>
        <button onClick={() => { setMode('text'); setFb({ text: '图文匹配：类别由文本给出，取余弦最大。', cls: 'good' }); }}>一句话识别</button>
        <button onClick={() => { setMode('story'); setFb({ text: '整体流程：两塔编码后在顶部比较。', cls: '' }); }}>整体流程</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default PathwayWidget;
