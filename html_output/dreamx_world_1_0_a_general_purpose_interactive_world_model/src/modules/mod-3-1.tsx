import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 250;

// §3.1 PRoPE：相机几何进入注意力并指导生成画面的过程动画。
// 三段链路：相机轨迹（左）→ 几何包飞入自注意力的每个 token（中）→ 生成画面视线跟随（右）。
// chip 切换「无相机条件」作对照：几何包中途消散，画面视线偏离应到位置。

export const Mod31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [injected, setInjected] = useState(true);
  const injRef = useRef(true);
  injRef.current = injected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    // camera trajectory inside the left panel
    const path = (t: number): [number, number] => [
      40 + t * 110,
      150 - Math.sin(t * Math.PI) * 55 - t * 20,
    ];

    const TOKENS = 8;
    const tokX = (i: number) => 200 + i * 20;
    const TOK_Y = 120;
    const flash = new Array<number>(TOKENS).fill(0); // last-arrival timestamp per token

    const drawPacket = (x: number, y: number, alpha: number) => {
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = K.C.aux;
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, y); ctx.lineTo(x + 2.5, y);
      ctx.moveTo(x, y - 2.5); ctx.lineTo(x, y + 2.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      const inj = injRef.current;
      const t = (now - t0) / 1000;
      const loop = (t / 6) % 1; // car loops the trajectory every 6s
      K.clearScene(ctx, W, H);

      // ---- left: prescribed camera trajectory ----
      K.drawPanel(ctx, 16, 14, 150, 200, K.C.guide);
      ctx.save();
      ctx.beginPath();
      ctx.rect(18, 16, 146, 196);
      ctx.clip();
      ctx.strokeStyle = K.C.muted;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const [sx, sy] = path(0);
      ctx.moveTo(sx, sy);
      for (let i = 1; i <= 24; i++) {
        const [x, y] = path(i / 24);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      K.drawLabel(ctx, '相机轨迹', 26, 34, K.C.ink, 12);
      const [cx, cy] = path(loop);
      K.drawCar(ctx, cx, cy, 0.8, K.C.guide);
      ctx.restore();

      // ---- middle: self-attention strip ----
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(182, 60, 184, 130, 6);
      ctx.fill();
      ctx.stroke();
      K.drawLabel(ctx, '自注意力', 192, 80, K.C.ink, 12);
      K.drawLabel(ctx, inj ? '每个 token 都拿到相机几何' : 'token 拿不到相机条件', 192, 96, inj ? K.C.guide : K.C.bad, 10);
      for (let i = 0; i < TOKENS; i++) {
        const dt = now - flash[i];
        const lit = inj && dt < 1400;
        const glow = lit ? 1 - dt / 1400 : 0;
        ctx.fillStyle = lit ? `rgba(39,68,110,${0.25 + 0.55 * glow})` : '#fff';
        ctx.strokeStyle = lit ? K.C.guide : K.C.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(tokX(i), TOK_Y - 9, 16, 18, 3);
        ctx.fill();
        ctx.stroke();
      }

      // geometry packet: car → one token at a time (fades out mid-way when off)
      const period = 0.9;
      const idx = Math.floor(t / period) % TOKENS;
      const p = (t / period) % 1;
      const tx = tokX(idx) + 8;
      const px = cx + (tx - cx) * p;
      const py = cy + (TOK_Y - cy) * p;
      if (inj) {
        drawPacket(px, py, 1);
        if (p > 0.94) flash[idx] = now;
      } else {
        drawPacket(px, py, Math.max(0, 1 - p * 1.3));
      }

      // arrow: conditioned features → generated view
      ctx.strokeStyle = inj ? K.C.guide : K.C.axis;
      ctx.fillStyle = inj ? K.C.guide : K.C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(368, TOK_Y);
      ctx.lineTo(384, TOK_Y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(384, TOK_Y - 4);
      ctx.lineTo(384, TOK_Y + 4);
      ctx.lineTo(390, TOK_Y);
      ctx.closePath();
      ctx.fill();

      // ---- right: generated view, parallax follows the camera only when conditioned ----
      K.drawPanel(ctx, 390, 14, 154, 200, inj ? K.C.good : K.C.emph);
      ctx.save();
      ctx.beginPath();
      ctx.rect(392, 16, 150, 176);
      ctx.clip();
      K.drawLabel(ctx, '生成画面', 400, 34, K.C.ink, 12);
      const targetShift = (loop - 0.5) * 70;
      const shift = inj ? targetShift : targetShift * 0.25 + Math.sin(t * 2.2) * 22;
      ctx.strokeStyle = K.C.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(392, 172);
      ctx.lineTo(542, 172);
      ctx.stroke();
      K.drawHouse(ctx, 440 + shift, 160, 1.0, K.C.depth);
      K.drawHouse(ctx, 492 + shift * 0.6, 166, 0.8, K.C.ground);
      K.drawTree(ctx, 522 + shift * 1.3, 164, 1);
      // guidance gauge: where the view should be vs where it is
      const gx0 = 402, gx1 = 532, gy = 186;
      ctx.strokeStyle = K.C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx0, gy);
      ctx.lineTo(gx1, gy);
      ctx.stroke();
      const targetX = gx0 + loop * (gx1 - gx0);
      const actualX = gx0 + (shift / 70 + 0.5) * (gx1 - gx0);
      ctx.strokeStyle = K.C.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(targetX, gy - 6); ctx.lineTo(targetX + 5, gy);
      ctx.lineTo(targetX, gy + 6); ctx.lineTo(targetX - 5, gy);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = inj ? K.C.good : K.C.bad;
      ctx.beginPath();
      ctx.arc(actualX, gy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      K.drawLabel(ctx, '◇ 应到位置  ● 实际视线', 392, 234, K.C.muted, 10);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <div className="ctrl">
        <button className={`chip ${injected ? 'active' : ''}`} onClick={() => setInjected(true)}>
          注入相机几何（PRoPE）
        </button>
        <button className={`chip ${!injected ? 'active' : ''}`} onClick={() => setInjected(false)}>
          无相机条件
        </button>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`feedback ${injected ? 'good' : 'bad'}`}>
        {injected
          ? '几何包不断从相机轨迹飞入注意力的每个 token（紫包 + 蓝闪），右侧画面的实际视线与「应到位置」重合——相机几何在每次注意力计算里都在场（绿）。'
          : '几何包中途消散，token 拿不到相机条件：实际视线偏离「应到位置」（红）——生成的视频不再听相机指挥。'}
      </div>
    </div>
  );
};

export default Mod31;
