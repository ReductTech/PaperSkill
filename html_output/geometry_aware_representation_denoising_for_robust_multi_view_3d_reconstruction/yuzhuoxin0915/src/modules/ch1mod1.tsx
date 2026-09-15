import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 1 章 Module 1.1：模糊强度滑块 → 位姿 AUC5 数值条
// 输入图像占约 2/3 宽，位姿图缩小置于右侧。
// 自动/手动双模式：默认自动来回扫（观察模糊与位姿的因果），拖动滑块即切为手动。
const W = 1080;
const H = 280;
const OMEGA = 0.45; // 自动扫描角速度（rad/s），一个来回约 14 秒

const blurFeedback = (v: number) => {
  const auc = 87.2 * Math.pow(1 - v, 3) + 4.1 * (1 - Math.pow(1 - v, 3));
  return v < 0.3
    ? { text: `模糊较弱，位姿 AUC5 约 ${auc.toFixed(1)}，重建依然稳健。`, cls: 'good' }
    : v < 0.7
    ? { text: `模糊加剧，位姿 AUC5 约 ${auc.toFixed(1)}，精度开始下滑。`, cls: '' }
    : { text: `严重退化，位姿 AUC5 仅 ${auc.toFixed(1)}，重建几乎失效。`, cls: 'bad' };
};

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ blur: 0.5, auto: true, t0: performance.now(), lastUi: 0 });
  const rafRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [blur, setBlur] = useState(0.5);
  const [auto, setAuto] = useState(true);
  const [feedback, setFeedback] = useState({ text: '自动演示中：观察模糊从弱到强、位姿随之崩塌。也可拖动滑块手动查看。', cls: '' });

  // AUC5 从 87.20（清晰）降到 4.10（严重模糊），非线性衰减
  const aucAt = (b: number) => 87.2 * Math.pow(1 - b, 3) + 4.1 * (1 - Math.pow(1 - b, 3));

  useEffect(() => {
    const img = new Image();
    img.src = './images/analogy_blur_car.png';
    img.onload = () => { imgRef.current = img; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { blur: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 左：输入图像（占约 2/3 宽 = 720px）
      const px = 20, py = 30, pw = 700, ph = 200;
      ctx.fillStyle = '#e8efe0';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);

      // 绘制真实图片，用 canvas 模糊滤镜模拟运动模糊
      if (imgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py, pw, ph);
        ctx.clip();
        const iw = imgRef.current.width, ih = imgRef.current.height;
        const scale = Math.max(pw / iw, ph / ih);
        const sw = pw / scale, sh = ph / scale;
        const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
        // 根据模糊强度，叠加水平位移重影模拟运动模糊
        const blurPx = s.blur * 24;
        if (blurPx > 0.5) {
          ctx.globalAlpha = 1 - s.blur * 0.6;
          for (let k = -2; k <= 2; k++) {
            const off = k * blurPx * 0.5;
            ctx.globalAlpha = (s.blur * 0.35) / (Math.abs(k) + 1);
            ctx.drawImage(imgRef.current, sx, sy, sw, sh, px + off, py, pw, ph);
          }
          ctx.globalAlpha = 1 - s.blur * 0.55;
          ctx.drawImage(imgRef.current, sx, sy, sw, sh, px, py, pw, ph);
          ctx.globalAlpha = 1;
        } else {
          ctx.drawImage(imgRef.current, sx, sy, sw, sh, px, py, pw, ph);
        }
        ctx.restore();
      }
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('输入图像（运动模糊）', px + 12, py + ph + 22);

      // 右：位姿 AUC5 数值条（缩小置于右侧）
      const barX = 830, barW = 40, barMaxH = 160, barY = 50;
      const auc = aucAt(s.blur);
      const barH = map(auc, 0, 87.2, 0, barMaxH);
      const color = auc > 60 ? '#228d5c' : auc > 25 ? '#f07e47' : '#c43f52';
      ctx.fillStyle = '#e8efe0';
      ctx.fillRect(barX - 8, barY - 8, barW + 16, barMaxH + 16);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX - 8, barY - 8, barW + 16, barMaxH + 16);
      ctx.fillStyle = color;
      ctx.fillRect(barX, barY + (barMaxH - barH), barW, barH);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.fillText(auc.toFixed(1), barX - 4, barY + barMaxH + 38);
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText('位姿 AUC5', barX - 6, barY + barMaxH + 60);

      // 右下方说明
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('模糊越强 → 位姿越差', 780, 220);
    };

    const tick = () => {
      const s = stateRef.current;
      // 自动演示：模糊强度余弦来回扫，UI 节流刷新
      if (s.auto) {
        const now = performance.now();
        const tau = (now - s.t0) / 1000;
        s.blur = (1 - Math.cos(tau * OMEGA)) / 2;
        if (now - s.lastUi > 120) {
          s.lastUi = now;
          setBlur(s.blur);
          setFeedback(blurFeedback(s.blur));
        }
      }
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    const s = stateRef.current;
    if (s.auto) {
      s.auto = false;
      setAuto(false);
    }
    s.blur = v;
    setBlur(v);
    setFeedback(blurFeedback(v));
  };

  const toggleAuto = () => {
    const s = stateRef.current;
    const on = !s.auto;
    if (on) {
      // 保持相位连续：从当前模糊值反推时间起点，动画无缝衔接
      const v = Math.min(1, Math.max(0, s.blur));
      const tau = Math.acos(1 - 2 * v) / OMEGA;
      s.t0 = performance.now() - tau * 1000;
      setFeedback({ text: '自动演示已开启，模糊强度将来回扫描。', cls: '' });
    } else {
      setFeedback({ text: '已切换为手动模式，拖动滑块查看任意模糊强度。', cls: '' });
    }
    s.auto = on;
    setAuto(on);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${auto ? 'selected' : ''}`} onClick={toggleAuto}>
          {auto ? '自动演示：开' : '自动演示：关'}
        </button>
        <label>
          模糊强度 <span className="val">{Math.round(blur * 100)}%</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(blur * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
