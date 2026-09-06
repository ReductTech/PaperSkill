import React, { useRef, useState } from 'react';
import { clamp, lerp } from '../lib/canvasKit';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 240;

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tau, setTau] = useState(100);
  const [fb, setFb] = useState({ text: '拖动 τ：观察 Y_τ = (1−τ)Y₀ + τY₁ 的线性插值。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    const tauVal = tau / 100;
    ctx.fillStyle = C.red;
    ctx.fillRect(50, 70, 90, 120);
    ctx.fillStyle = C.blue;
    ctx.fillRect(190, 70, 90, 120);
    const mixX = lerp(140, 220, 1 - tauVal);
    ctx.fillStyle = C.green;
    ctx.fillRect(mixX, 70, 90, 120);
    ctx.fillStyle = C.text;
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText('Y₁ 噪声', 62, 58);
    ctx.fillText('Y₀ 目标', 202, 58);
    ctx.fillText(`Y_τ  τ=${tauVal.toFixed(2)}`, mixX - 4, 58);
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = C.muted;
    ctx.fillText('v_θ 预测速度场 → (Y₁ − Y₀)', 280, 130);
    for (let i = 0; i < 8; i++) {
      const h = clamp(1 - tauVal + Math.random() * 0.1, 0.1, 1) * 80;
      ctx.fillStyle = tauVal > 0.5 ? C.red : C.green;
      ctx.fillRect(300 + i * 28, 160 - h, 20, h);
    }
  }, [tau]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    setTau(n);
    setFb(n < 20
      ? { text: 'τ→0 接近干净动作 Y₀；推理从 τ=1 欧拉积分到 τ=0。', cls: 'good' }
      : n > 80 ? { text: 'τ→1 接近纯噪声；DiT 学习条件速度场。', cls: '' }
      : { text: '流匹配：高维动作生成 = 噪声到数据的连续变换。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>τ <span className="val">{(tau / 100).toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={tau} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch4Mod1;
