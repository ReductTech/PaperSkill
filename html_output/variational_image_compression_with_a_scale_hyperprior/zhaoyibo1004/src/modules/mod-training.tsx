import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const LOSS = [2.4, 1.7, 1.2, 0.9, 0.7, 0.55, 0.46];
const NOTES = [
  '第 0 轮：模型刚开始训练，重建草图模糊，损失很高。',
  '第 1 轮：分析/合成变换开始学会压缩，损失快速下降。',
  '第 2 轮：草图渐渐成形，失真项开始收敛。',
  '第 3 轮：超先验学会预测尺度，码率项进一步下降。',
  '第 4 轮：重建更清晰，损失进入缓降区间。',
  '第 5 轮：细节逐渐稳定，码率与失真趋于平衡。',
  '第 6 轮：训练接近收敛，重建清晰且码率很低。',
];

export const ModTraining: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ iter: 0 });
  const raf = useRef<number | null>(null);
  const [iter, setIter] = useState(0);
  const [fb, setFb] = useState({ text: NOTES[0], cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // loss curve
      const left = 80;
      const right = 520;
      const top = 30;
      const bottom = H - 50;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();

      const px = (i: number) => left + (i / (LOSS.length - 1)) * (right - left);
      const py = (v: number) => top + (v / 2.6) * (bottom - top);

      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= s.iter; i += 1) {
        const x = px(i);
        const y = py(LOSS[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i <= s.iter; i += 1) {
        ctx.fillStyle = i === s.iter ? '#f07e47' : '#27446e';
        ctx.beginPath();
        ctx.arc(px(i), py(LOSS[i]), i === s.iter ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // reconstruction sketch (right): sharpens with iter
      const q = s.iter / (LOSS.length - 1);
      const amp = 30 - q * 22;
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(640, 40, 360, 180);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 640; x <= 1000; x += 4) {
        const y = 130 + Math.sin(x * 0.03) * amp;
        if (x === 640) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#27446e';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('重建草图', 820, 40);
    };

    const tick = () => {
      render();
      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (dir: number) => {
    const next = Math.max(0, Math.min(LOSS.length - 1, iter + dir));
    stateRef.current.iter = next;
    setIter(next);
    setFb({ text: NOTES[next], cls: next >= 4 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(-1)} disabled={iter === 0}>
          上一轮
        </button>
        <span className="step-label">
          迭代 <b>{iter}</b> / {LOSS.length - 1} · 损失 {LOSS[iter].toFixed(2)}
        </span>
        <button className="tiny" onClick={() => go(1)} disabled={iter === LOSS.length - 1}>
          {iter === LOSS.length - 1 ? '已收敛' : '下一轮'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModTraining;
