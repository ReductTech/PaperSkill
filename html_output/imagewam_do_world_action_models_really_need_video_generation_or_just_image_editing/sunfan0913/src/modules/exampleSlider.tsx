import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// The hero uses two different visual modes: full future-frame reconstruction
// versus compact change features for action prediction.

const W = 1080;
const H = 280;

export const ExampleSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ value: 0.5 });
  const rafRef = useRef<number | null>(null);
  const [value, setValue] = useState(0.5);
  const [feedback, setFeedback] = useState({ text: '拖动滑块，观察数值如何改变画面。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { value: number }) => {
      ctx.clearRect(0, 0, W, H);
      const progress = clamp(s.value, 0, 1);
      ctx.font = '600 28px Arial, "Segoe UI", sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.fillText('变化进度 ' + s.value.toFixed(2), 40, 32);

      if (moduleId === 'old') {
        // Video-style modeling spends the budget reconstructing several future frames.
        const frameCount = 3;
        const frameWidth = 290;
        for (let i = 0; i < frameCount; i += 1) {
          const x = 34 + i * 340;
          const shift = progress * 42 + i * 8;
          ctx.fillStyle = '#e8f0f8';
          ctx.fillRect(x, 62, frameWidth, 158);
          ctx.strokeStyle = '#b8cbdc';
          ctx.strokeRect(x, 62, frameWidth, 158);
          ctx.fillStyle = '#b9cad9';
          ctx.fillRect(x + 22, 148, 72, 50);
          ctx.fillStyle = '#9fb7ca';
          ctx.beginPath();
          ctx.arc(x + 190 + shift, 126, 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#809ab0';
          ctx.fillRect(x + 116 + shift, 176, 54, 22);
          ctx.fillStyle = '#607b92';
          ctx.font = '18px Arial, "Segoe UI", sans-serif';
          ctx.fillText('未来帧 ' + (i + 1), x + 18, 248);
          if (i < frameCount - 1) {
            ctx.fillStyle = '#7892aa';
            ctx.fillText('→', x + frameWidth + 18, 145);
          }
        }
        ctx.fillStyle = '#a33e4d';
        ctx.font = '600 19px Arial, "Segoe UI", sans-serif';
        ctx.fillText('重建整段未来视觉轨迹', 690, 285);
      } else {
        // Image-editing style modeling keeps the current scene and isolates the changed region.
        ctx.fillStyle = '#e8f6ef';
        ctx.fillRect(34, 62, 420, 158);
        ctx.strokeStyle = '#9dd4bb';
        ctx.strokeRect(34, 62, 420, 158);
        ctx.fillStyle = '#b9cad9';
        ctx.fillRect(72, 148, 88, 50);
        ctx.fillStyle = '#9fb7ca';
        ctx.beginPath();
        ctx.arc(245, 130, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 143, 61, 0.78)';
        ctx.fillRect(254 + progress * 105, 171, 72, 30);
        ctx.strokeStyle = '#ff8f3d';
        ctx.lineWidth = 4;
        ctx.strokeRect(246 + progress * 105, 163, 88, 46);
        ctx.fillStyle = '#276a4d';
        ctx.font = '18px Arial, "Segoe UI", sans-serif';
        ctx.fillText('只标出动作相关变化', 88, 248);
        const nodeX = [580, 690, 800];
        nodeX.forEach((x, index) => {
          ctx.fillStyle = index === 2 ? '#ff8f3d' : '#2eb67d';
          ctx.beginPath();
          ctx.arc(x, 130 + (index === 1 ? progress * 34 : 0), 12, 0, Math.PI * 2);
          ctx.fill();
          if (index > 0) {
            ctx.strokeStyle = '#62b58e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(nodeX[index - 1] + 12, 130);
            ctx.lineTo(x - 12, 130 + (index === 1 ? progress * 34 : 0));
            ctx.stroke();
          }
        });
        ctx.fillStyle = '#2f6fed';
        ctx.font = '600 19px Arial, "Segoe UI", sans-serif';
        ctx.fillText('变化特征 → 动作', 860, 136);
        ctx.fillStyle = '#276a4d';
        ctx.font = '18px Arial, "Segoe UI", sans-serif';
        ctx.fillText('紧凑上下文', 580, 210);
      }
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.value = v;
    setValue(v);
    setFeedback(
      v > 0.7
        ? { text: '数值较高，更接近目标状态。', cls: 'good' }
        : v < 0.3
        ? { text: '数值偏低，偏离了目标。', cls: 'bad' }
        : { text: '处于中间区间，继续探索。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          {moduleId === 'old' ? '未来帧重建进度' : '变化特征提取进度'} <span className="val">{value.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ExampleSlider;
