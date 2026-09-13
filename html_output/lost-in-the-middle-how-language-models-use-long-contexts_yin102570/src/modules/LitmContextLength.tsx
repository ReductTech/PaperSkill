import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 模块 5.1 —— P1 滑块 + 技术
// 上下文越长，模型整体利用能力越差（论文：长度增加，性能下降）。
const W = 720;
const H = 220;

export function LitmContextLength({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const [k, setK] = useState(4); // 千 token 量级 4..32
  const stateRef = useRef({ k });
  stateRef.current = { k };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      const { k } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1830';
      ctx.fillRect(0, 0, W, H);
      const padL = 56, padR = 24, padT = 30, padB = 44;
      const pw = W - padL - padR, ph = H - padT - padB;
      ctx.strokeStyle = '#5b6b8f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + ph);
      ctx.lineTo(padL + pw, padT + ph);
      ctx.stroke();
      ctx.fillStyle = '#9fb3d9';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('上下文长度（千 token）', padL + pw / 2, H - 10);
      ctx.save();
      ctx.translate(16, padT + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('平均性能', 0, 0);
      ctx.restore();
      // 下降曲线（随长度增大而降低，端点设 0.9->0.5）
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const N = 50;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const len = 4 + t * 28;
        const x = padL + ((len - 4) / 28) * pw;
        const perf = 0.9 - 0.4 * ((len - 4) / 28);
        const y = padT + (1 - perf) * ph;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 当前点
      const tnow = (k - 4) / 28;
      const perfNow = 0.9 - 0.4 * tnow;
      const cx = padL + tnow * pw;
      const cy = padT + (1 - perfNow) * ph;
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfe0ff';
      ctx.font = 'bold 18px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`≈ ${Math.round(perfNow * 100)}%`, cx + 12, cy - 8);
    };
    const start = () => { const loop = () => { draw(); reqRef.current = requestAnimationFrame(loop); }; loop(); };
    const stop = () => cancelAnimationFrame(reqRef.current);
    start();
    return () => stop();
  }, []);

  return (
    <div className="litm-widget">
      <canvas ref={canvasRef} className="litm-canvas" />
      <div className="litm-controls">
        <label>
          上下文长度：<b>{k}k tokens</b>
          <input type="range" min={4} max={32} step={1} value={k}
            onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <p className="litm-hint">
        把滑块往右拉（上下文变长）：平均性能一路下滑。论文发现——<strong>能装下 ≠ 能用得好</strong>，
        长上下文本身就会拖累模型对信息的利用。
      </p>
    </div>
  );
}
