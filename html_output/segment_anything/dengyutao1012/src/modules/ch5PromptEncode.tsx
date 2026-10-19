import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第5章：提示类型 → 编码方式（稀疏 vs 稠密）
const W = 1080;
const H = 300;

const PROMPTS = [
  { key: 'point', label: '点', path: '位置编码（稀疏）' },
  { key: 'box', label: '框', path: '位置编码（稀疏）' },
  { key: 'text', label: '文字', path: 'CLIP 文本编码器' },
  { key: 'mask', label: '掩码', path: '卷积（稠密，加到图像嵌入）' },
];

const FB: Record<string, { text: string; cls: string }> = {
  point: { text: '点 / 框提示：用位置编码 + 每种提示的可学习嵌入。', cls: 'good' },
  box: { text: '点 / 框提示：用位置编码 + 每种提示的可学习嵌入。', cls: 'good' },
  text: { text: '自由文本：用现成的 CLIP 文本编码器得到嵌入。', cls: 'good' },
  mask: { text: '掩码（稠密）提示：用卷积编码，逐元素加到图像嵌入。', cls: 'good' },
};

export const Ch5PromptEncode: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ active: 'point' });
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState('point');
  const [feedback, setFeedback] = useState(FB.point);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { active: string }) => {
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createLinearGradient(40, 20, W - 40, H - 20);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(40, 30, W - 80, H - 60);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 30, W - 80, H - 60);
      // 提示按钮列
      const py = 70;
      PROMPTS.forEach((p, i) => {
        const y = py + i * 46;
        const on = s.active === p.key;
        ctx.fillStyle = on ? '#f07e47' : '#eef3fb';
        ctx.strokeStyle = on ? '#f07e47' : '#d7deea';
        ctx.beginPath();
        ctx.roundRect(80, y, 120, 34, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = on ? '#ffffff' : '#21324a';
        ctx.font = '17px "Segoe UI", sans-serif';
        ctx.fillText(p.label, 90, y + 24);
      });
      // 编码框（右侧）
      const cur = PROMPTS.find((p) => p.key === s.active)!;
      ctx.fillStyle = '#27446e';
      ctx.beginPath();
      ctx.roundRect(340, 90, 460, 90, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText(cur.path, 360, 130);
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(
        cur.key === 'mask' ? '逐元素加到图像嵌入' : '进入提示嵌入 → 掩码解码器',
        360,
        158
      );
      // 连接线
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(200, 87 + PROMPTS.findIndex((p) => p.key === s.active) * 46);
      ctx.lineTo(340, 135);
      ctx.stroke();
      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('提示类型', 90, 50);
      ctx.fillText('编码路径', 350, 60);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (k: string) => {
    stateRef.current.active = k;
    setActive(k);
    setFeedback(FB[k]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {PROMPTS.map((p) => (
          <button
            key={p.key}
            className={active === p.key ? 'btn on' : 'btn'}
            onClick={() => choose(p.key)}
          >
            {p.label} 提示
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5PromptEncode;
