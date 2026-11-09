import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 520;
const classes = ['飞机', '汽车', '狗', '望远镜'];
const cos = [0.24, 0.18, 0.26, 0.62];
const prob = [0.23, 0.21, 0.23, 0.33];

export const ZeroShotWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [tpl, setTpl] = useState('A photo of a {label}.');
  const [fb, setFb] = useState({ text: '第 0 步：尚未生成候选文本。', cls: '' });

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
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText(text, x + 8, y + h / 2 + 5);
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
    ctx.fillText('零样本：类别名 → 候选文本 → 文本嵌入 → 余弦 → argmax', 36, 32);

    ctx.font = '15px "Segoe UI", sans-serif';
    ctx.fillStyle = '#68778f';
    ctx.fillText('K = 4 个类别', 36, 62);
    classes.forEach((name, i) => {
      ctx.fillStyle = '#27446e';
      ctx.fillRect(36 + i * 118, 72, 108, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, 48 + i * 118, 92);
    });

    if (step >= 1) {
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('模板：' + tpl.replace('{label}', '望远镜') + '（其余类别同模板）', 36, 132);
    } else {
      ctx.fillStyle = '#b8c9a7';
      ctx.fillText('模板：' + tpl, 36, 132);
    }

    box(36, 156, 190, 42, step >= 2 ? '#228d5c' : '#b8c9a7', '文本编码器');
    arrow(226, 177, 270, 177);
    ctx.fillStyle = '#21324a';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('K×d_e 权重矩阵 W', 280, 150);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(classes[i], 250, 190 + i * 30);
      for (let j = 0; j < 6; j++) {
        ctx.fillStyle = step >= 2 ? (j % 3 === 0 ? '#27446e' : '#68778f') : '#d7deea';
        ctx.fillRect(300 + j * 28, 172 + i * 30, 24, 24);
      }
    }

    ctx.fillStyle = '#21324a';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('图像侧', 560, 150);
    box(560, 162, 130, 42, '#27446e', '输入图像');
    arrow(690, 183, 730, 183);
    box(730, 162, 150, 42, '#27446e', '图像编码器');
    arrow(880, 183, 910, 183);
    for (let j = 0; j < 6; j++) {
      ctx.fillStyle = step >= 3 ? '#27446e' : '#d7deea';
      ctx.fillRect(910 + j * 24, 171, 20, 24);
    }
    ctx.fillStyle = '#68778f';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('I_e（1×d_e）', 910, 215);

    if (step >= 4) {
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('余弦得分与 softmax 概率', 560, 280);
      classes.forEach((name, i) => {
        const y = 300 + i * 42;
        ctx.fillStyle = '#68778f';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(name, 560, y + 18);
        ctx.fillStyle = '#d7deea';
        ctx.fillRect(630, y, 220, 26);
        ctx.fillStyle = i === 3 ? '#228d5c' : '#27446e';
        ctx.fillRect(630, y, 220 * (cos[i] / 0.7), 26);
        ctx.fillStyle = '#21324a';
        ctx.fillText('cos ' + cos[i].toFixed(2), 860, y + 18);
        ctx.fillText('p ' + prob[i].toFixed(2), 960, y + 18);
      });
      ctx.fillStyle = '#228d5c';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('argmax：望远镜', 560, 492);
    }

    ctx.fillStyle = '#68778f';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('W 由文本塔生成，无梯度更新；替换类别只需重新编码文本', 36, 500);
  }, [step, tpl]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <select value={tpl} onChange={(e) => { setTpl(e.target.value); setStep(0); setFb({ text: '模板已切换，重新推进。', cls: '' }); }}>
          <option value="A photo of a {label}.">A photo of a {'{label}'}.</option>
          <option value="A picture of a {label}.">A picture of a {'{label}'}.</option>
        </select>
        <button onClick={() => {
          const s = Math.min(4, step + 1);
          setStep(s);
          setFb(s === 1
            ? { text: '第 1 步：4 个类别名套入模板，得到 4 条候选文本。', cls: '' }
            : s === 2
            ? { text: '第 2 步：文本塔把 4 条候选编码为 K×d_e 权重矩阵。', cls: '' }
            : s === 3
            ? { text: '第 3 步：图像塔输出 I_e。', cls: '' }
            : { text: '第 4 步：I_e 与 W 各行算余弦，softmax 后 argmax 得望远镜。', cls: 'good' });
        }}>下一步</button>
        <button onClick={() => { setStep(0); setFb({ text: '已回到起点。', cls: '' }); }}>重来</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ZeroShotWidget;
