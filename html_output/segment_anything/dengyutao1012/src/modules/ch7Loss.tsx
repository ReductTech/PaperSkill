import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第7章：focal / dice 损失权重 → 左：focal 曲线（难/易样本）；右：dice 重叠可视化
const W = 1080;
const H = 360;

export const Ch7Loss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ w: 50 });
  const rafRef = useRef<number | null>(null);
  const [w, setW] = useState(50);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 两圆重叠面积（半径 r，圆心距 d）
    const overlapArea = (r: number, d: number) => {
      if (d >= 2 * r) return 0;
      if (d <= 0) return Math.PI * r * r;
      return (
        2 * r * r * Math.acos(d / (2 * r)) - 0.5 * d * Math.sqrt(4 * r * r - d * d)
      );
    };

    const render = (s: { w: number }) => {
      ctx.clearRect(0, 0, W, H);
      // 背景
      const bgGrad = ctx.createLinearGradient(40, 20, W - 40, H - 20);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.roundRect(30, 22, W - 60, H - 44, 14);
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.stroke();

      const t = s.w / 100;
      const alpha = t; // dice 权重
      const beta = 1 - t; // focal 权重

      // —— 顶部公式条 ——
      const fBox = { x: 60, y: 34, w: W - 120, h: 40 };
      ctx.fillStyle = 'rgba(39,68,110,0.08)';
      ctx.beginPath();
      ctx.roundRect(fBox.x, fBox.y, fBox.w, fBox.h, 10);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `L = α·Focal + β·Dice   （α = dice ${Math.round(alpha * 100)}% ，β = focal ${Math.round(beta * 100)}%）`,
        W / 2,
        fBox.y + 26
      );
      ctx.textAlign = 'left';

      // —— 左面板：focal loss 曲线 ——
      const px0 = 90,
        px1 = 500,
        py0 = 120,
        py1 = 300;
      // 坐标轴与网格
      ctx.strokeStyle = '#d9e0ea';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= 4; gx++) {
        const x = px0 + ((px1 - px0) * gx) / 4;
        ctx.beginPath();
        ctx.moveTo(x, py0);
        ctx.lineTo(x, py1);
        ctx.stroke();
      }
      for (let gy = 0; gy <= 3; gy++) {
        const y = py1 - ((py1 - py0) * gy) / 3;
        ctx.beginPath();
        ctx.moveTo(px0, y);
        ctx.lineTo(px1, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(px0, py1);
      ctx.lineTo(px1, py1);
      ctx.stroke();
      // 轴标签
      ctx.fillStyle = '#7a8798';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('易样本 →', px0, py1 + 20);
      ctx.fillText('← 难样本', px0 + 16, py1 - 2);
      ctx.save();
      ctx.translate(px0 - 12, py0 + 12);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('损失 ↑', 0, 0);
      ctx.restore();

      // focal 曲线：CE (γ=0) 与 focal (γ=2)
      const plot = (p: number) => px0 + (px1 - px0) * ((p - 0.05) / 0.95);
      const pY = (loss: number) => py1 - ((py1 - py0) * Math.min(loss, 3)) / 3;
      // CE
      ctx.strokeStyle = '#c8c3c3';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let p = 0.05; p <= 1.0001; p += 0.01) {
        const loss = -Math.log(p);
        const x = plot(p),
          y = pY(loss);
        if (p === 0.05) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // focal γ=2
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let p = 0.05; p <= 1.0001; p += 0.01) {
        const loss = -(1 - p) * (1 - p) * Math.log(p);
        const x = plot(p),
          y = pY(loss);
        if (p === 0.05) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 难/易样本标注
      ctx.fillStyle = '#b07c2e';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('难样本(低置信) 损失被压低', px0 + 30, py1 - 150);
      ctx.fillStyle = '#2e86b0';
      ctx.fillText('易样本(高置信) 损失≈0', px1 - 150, py0 + 18);
      // 图例
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#c8c3c3';
      ctx.fillText('── CE（γ=0）', px0, py0 - 8);
      ctx.fillStyle = '#228d5c';
      ctx.fillText('── Focal（γ=2）', px0 + 150, py0 - 8);
      // 面板标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('① focal loss：难/易样本的损失', px0, py0 - 34);

      // —— 右面板：dice 重叠 ——
      const cx = 800,
        cy = 205,
        r = 62;
      const gap = (1 - t) * 90;
      const ov = overlapArea(r, gap);
      const areaC = Math.PI * r * r;
      const dice = (2 * ov) / (2 * areaC - ov);
      const iou = ov / (2 * areaC - ov);
      // 真值圆（绿轮廓）
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 4;
      ctx.stroke();
      // 预测圆（蓝色半透明，随 dice 权重与真值对齐）
      ctx.fillStyle = 'rgba(39,68,110,0.45)';
      ctx.beginPath();
      ctx.arc(cx - gap, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 3;
      ctx.stroke();
      // 标签
      ctx.fillStyle = '#228d5c';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('真值 gt', cx + 18, cy - r - 12);
      ctx.fillStyle = '#27446e';
      ctx.fillText('预测 pred', cx - gap - r - 6, cy - r - 6);
      // 数据卡
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cx - 150, cy + r + 10, 300, 52, 10);
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Dice ≈ ${(dice * 100).toFixed(1)}%   IoU ≈ ${(iou * 100).toFixed(1)}%`, cx, cy + r + 34);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#7a8798';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('权重越高 → 预测与真值越贴合（Dice/IoU 越高）', cx, cy + r + 8);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('② dice loss：预测与真值的重叠度', cx - 210, 86);

      // —— 底部权重条 ——
      const bx = 60,
        by = H - 46,
        bw = W - 120;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, 30, 8);
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.stroke();
      // dice 段（橙）左，focal 段（绿）右
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(bx, by, bw * alpha, 30);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(bx + bw * alpha, by, bw * (1 - alpha), 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(`dice ${Math.round(alpha * 100)}%`, bx + 10, by + 20);
      ctx.fillText(`focal ${Math.round(beta * 100)}%`, bx + bw * alpha + 10, by + 20);
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
    const v = Number(e.target.value);
    stateRef.current.w = v;
    setW(v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          dice 相对权重 <span className="val">{w}%</span>
        </label>
        <input type="range" min={0} max={100} value={w} onChange={onChange} />
      </div>
      <div className="feedback">
        拖动滑块：左侧 focal 曲线决定「难样本被压多少」，右侧 dice 决定「预测与真值的贴合度」——α（dice）越高，边界越贴真值、Dice/IoU 越高；β（focal）越高，越聚焦难样本。二者线性组合共同监督训练。
      </div>
    </div>
  );
};

export default Ch7Loss;
