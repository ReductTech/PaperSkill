import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 400;

export const EmbedWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(60);
  const [fb, setFb] = useState({ text: '拖动角度，观察余弦相似度随夹角变化。', cls: '' });

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
    ctx.fillText('图像塔', 40, 30);
    ctx.fillText('文本塔', 40, 130);

    const imageStages = ['输入图像', 'ResNet / ViT', '线性投影 W_i', 'L2 归一化', 'I_e'];
    const textStages = ['一句话', '12 层 Transformer', '取 [EOS]', 'W_t + L2', 'T_e'];
    imageStages.forEach((s, i) => {
      box(40 + i * 190, 44, 170, 40, i === 4 ? '#228d5c' : '#27446e', s);
      if (i < 4) arrow(40 + i * 190 + 170, 64, 40 + (i + 1) * 190, 64);
    });
    textStages.forEach((s, i) => {
      box(40 + i * 190, 144, 170, 40, i === 4 ? '#228d5c' : '#27446e', s);
      if (i < 4) arrow(40 + i * 190 + 170, 164, 40 + (i + 1) * 190, 164);
    });

    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 200);
    ctx.lineTo(1020, 200);
    ctx.stroke();

    const cx = 250;
    const cy = 310;
    const r = 78;
    ctx.strokeStyle = '#d7deea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    const rad = (angle * Math.PI) / 180;
    const ix = cx + r;
    const iy = cy;
    const tx = cx + r * Math.cos(rad);
    const ty = cy - r * Math.sin(rad);
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ix, iy);
    ctx.stroke();
    ctx.strokeStyle = '#228d5c';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.fillStyle = '#27446e';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('I_e', ix + 8, iy + 6);
    ctx.fillStyle = '#228d5c';
    ctx.fillText('T_e', tx + 8, ty - 6);
    ctx.strokeStyle = '#f07e47';
    ctx.beginPath();
    ctx.arc(cx, cy, 40, -rad, 0);
    ctx.stroke();
    ctx.fillStyle = '#f07e47';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('θ = ' + angle + '°', cx - 20, cy - 50);

    const cos = Math.cos(rad);
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('cos(I_e, T_e) = ' + cos.toFixed(3), 430, 260);
    ctx.font = '17px "Segoe UI", sans-serif';
    ctx.fillStyle = '#68778f';
    ctx.fillText('两向量均已 L2 归一化，点积等于余弦', 430, 295);
    ctx.fillText('取值范围 [−1, 1]：1 同向，0 正交，−1 反向', 430, 325);
    ctx.fillStyle = '#21324a';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('cos(I, T) = (I · T) / (‖I‖ · ‖T‖)', 430, 360);
  }, [angle]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setAngle(v);
    const cos = Math.cos((v * Math.PI) / 180);
    setFb(cos > 0.7
      ? { text: '夹角小、余弦高：图像与文本方向接近，属于高相似配对。', cls: 'good' }
      : cos < 0.3
      ? { text: '夹角大、余弦低：方向差异明显，相似度低。', cls: 'bad' }
      : { text: '夹角中等：余弦处于中间区间，需要更多训练信号区分。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>夹角 θ <span className="val">{angle}°</span></label>
        <input type="range" min={0} max={180} value={angle} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default EmbedWidget;
