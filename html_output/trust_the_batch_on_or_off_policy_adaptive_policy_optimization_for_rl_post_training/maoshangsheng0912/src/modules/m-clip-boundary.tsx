import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 第 3 章模块 1：裁剪边界的实时滑块（P1）。
// 主体：一条 ρ 权重曲线。动词：被橙色滑块推动。目标：看被切掉的面积。
// 语义色：橙 = 用户推动的阈值；绿 = 被保留；红 = 被丢弃。
const W = 1080;
const H = 280;

export function MClipBoundary() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [clip, setClip] = useState(20); // 0.0 - 0.6 的裁剪上限，展示用 *100
  const clipRef = useRef(clip);
  const tRef = useRef(0);

  clipRef.current = clip;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;

    // ρ 分布（示意）：一批数据的比值集中区
    const density = (rho: number) => Math.exp(-Math.pow(rho - 1, 2) / 0.32);

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      const padL = 70;
      const padR = 60;
      const baseY = 226;
      const topY = 40;
      const plotW = W - padL - padR;

      // 坐标轴
      ctx.beginPath();
      ctx.moveTo(padL, topY);
      ctx.lineTo(padL, baseY);
      ctx.lineTo(W - padR, baseY);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('重要性采样比 ρ = π_θ / π_old', W / 2, baseY + 30);

      // ρ 刻度
      [0, 1, 2, 3].forEach((r) => {
        const x = padL + (r / 3) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY + 5);
        ctx.strokeStyle = '#d7deea';
        ctx.stroke();
        ctx.fillStyle = '#68778f';
        ctx.font = '500 11px ui-monospace, monospace';
        ctx.fillText(r.toFixed(1), x, baseY + 20);
      });

      const rhoToX = (rho: number) => padL + (rho / 3) * plotW;
      const dToY = (d: number) => baseY - d * 170;

      const cap = clipRef.current / 100 + 0.05; // 0.05 - 0.65

      // 分布曲线：被保留部分填绿，超出部分填红
      const steps = 240;
      // 绿色（保留）
      ctx.beginPath();
      ctx.moveTo(rhoToX(0), baseY);
      for (let i = 0; i <= steps; i++) {
        const rho = (i / steps) * cap;
        ctx.lineTo(rhoToX(rho), dToY(density(rho)));
      }
      ctx.lineTo(rhoToX(cap), baseY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34,141,92,0.24)';
      ctx.fill();

      // 红色（被切）
      ctx.beginPath();
      ctx.moveTo(rhoToX(cap), baseY);
      for (let i = 0; i <= steps; i++) {
        const rho = cap + (i / steps) * (3 - cap);
        ctx.lineTo(rhoToX(rho), dToY(density(rho)));
      }
      ctx.lineTo(rhoToX(3), baseY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(196,63,82,0.22)';
      ctx.fill();

      // 曲线本身
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const rho = (i / 300) * 3;
        const x = rhoToX(rho);
        const y = dToY(density(rho));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 阈值滑杆
      const capX = rhoToX(cap);
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(capX, topY);
      ctx.lineTo(capX, baseY);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // 滑杆把手
      ctx.beginPath();
      ctx.arc(capX, topY - 4, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#f07e47';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 唯一标签
      ctx.fillStyle = '#f07e47';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = capX > W - 200 ? 'right' : 'left';
      ctx.fillText(
        `裁剪阈值 ε = ${cap.toFixed(2)}`,
        capX > W - 200 ? capX - 14 : capX + 14,
        topY - 8
      );

      // 面积读数
      let green = 0;
      let red = 0;
      for (let i = 0; i <= steps; i++) {
        const rho = (i / steps) * 3;
        const d = density(rho);
        if (rho <= cap) green += d;
        else red += d;
      }
      const total = green + red;
      const pct = total > 0 ? green / total : 0;

      ctx.fillStyle = '#228d5c';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`保留梯度 ${Math.round(pct * 100)}%`, padL, topY + 4);

      // 图例（最多 3 项）
      const lx = W - padR - 12;
      const items = [
        { c: '#228d5c', s: '参与更新' },
        { c: '#c43f52', s: '被裁掉' },
      ];
      ctx.textAlign = 'right';
      ctx.font = '500 11px system-ui, sans-serif';
      items.forEach((it, i) => {
        const y = topY + 4 + i * 18;
        ctx.fillStyle = it.c;
        ctx.fillRect(lx - 92, y - 9, 10, 10);
        ctx.fillStyle = '#68778f';
        ctx.fillText(it.s, lx, y);
      });
    };

    const tick = () => {
      tRef.current += 1;
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const unobserve = observeCanvas(canvas, start, stop);
    render();
    return () => {
      unobserve();
      stop();
    };
  }, []);

  const cap = clip / 100 + 0.05;
  const biased = cap < 0.55;
  const lossy = cap > 0.85;
  const feedback = biased
    ? { cls: 'bad', text: '阈值太紧：右侧那一大片本来有效的梯度被一起裁掉，模型学得很慢，而且梯度方向被系统性地拉偏。' }
    : lossy
    ? { cls: '', text: '阈值很松：几乎所有样本都参与更新，单个高 ρ 样本的极端方差可以直达参数——这正是我们要防的事。' }
    : { cls: 'good', text: '阈值合适：主要质量落在保留区内，极端尾部被切掉。但请注意——这个“合适”是由 ρ 的分布形状决定的，而分布形状每一批都不同。' };

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-clip-boundary" width={W} height={H} />
      <div className="ctrl">
        <label>
          裁剪阈值 ε <span className="val">{cap.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={60}
          value={clip}
          onChange={(e) => setClip(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
}
