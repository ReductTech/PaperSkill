import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const W = 800;
const H = 560;
const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

const m1 = { x: 190, y: 170 };
const m2 = { x: 540, y: 380 };
const th0 = { x: 370, y: 285 };
const lr = 0.55, beta = 0.8;

export function MerReptile() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  const th1 = { x: th0.x + lr * (m1.x - th0.x), y: th0.y + lr * (m1.y - th0.y) };
  const th2 = { x: th1.x + lr * (m2.x - th1.x), y: th1.y + lr * (m2.y - th1.y) };
  const thm = { x: th0.x + beta * (th2.x - th0.x), y: th0.y + beta * (th2.y - th0.y) };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    // loss landscape: two wells
    const g1 = ctx.createRadialGradient(m1.x, m1.y, 10, m1.x, m1.y, 200);
    g1.addColorStop(0, '#f3d7dc');
    g1.addColorStop(1, '#f5f8f0');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(m2.x, m2.y, 10, m2.x, m2.y, 200);
    g2.addColorStop(0, '#fbe7d4');
    g2.addColorStop(1, 'rgba(245,248,240,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = MUTED;
    ctx.font = '22px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('L(B₁) 低点', m1.x - 40, m1.y - 16);
    ctx.fillText('L(B₂) 低点', m2.x - 40, m2.y - 16);
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(m1.x, m1.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(m2.x, m2.y, 6, 0, Math.PI * 2);
    ctx.fill();

    const point = (p: { x: number; y: number }, color: string, r: number, label: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = 'bold 22px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(label, p.x + 12, p.y - 10);
    };
    const arrow = (a: { x: number; y: number }, b: { x: number; y: number }, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    point(th0, BLUE, 8, 'θ₀');
    if (step >= 1) { arrow(th0, th1, BLUE); point(th1, BLUE, 7, 'θ₁'); }
    if (step >= 2) { arrow(th1, th2, ORANGE); point(th2, ORANGE, 7, 'θ₂'); }
    if (step >= 3) { arrow(th0, thm, GREEN); point(thm, GREEN, 9, 'θₘ'); }
  }, [step]);

  const stages = [
    '起点 θ₀：本轮从这里开始',
    '第 1 步 SGD 朝 L(B₁) 下降',
    '第 2 步 SGD 朝 L(B₂) 下降',
    `元更新：θₘ = θ₀ + β(θ₂−θ₀)，β=${beta}，折返一步`,
  ];

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%', alignItems: 'center' }}>
      <canvas ref={ref} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, color: INK, fontWeight: 700 }}>Reptile：走几步，再折返</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setStep(Math.min(3, step + 1))} disabled={step >= 3}
            style={{ fontSize: 24, padding: '12px 20px', borderRadius: 10, background: ORANGE, color: '#fff', border: 'none', cursor: step >= 3 ? 'default' : 'pointer', opacity: step >= 3 ? 0.5 : 1, fontWeight: 700 }}>下一步</button>
          <button onClick={() => setStep(0)} style={{ fontSize: 24, padding: '12px 20px', borderRadius: 10, background: '#fff', color: INK, border: '1px solid #9fb0c8', cursor: 'pointer' }}>重来</button>
        </div>
        <div style={{ fontSize: 26, color: INK, background: '#fff', border: '1px solid #d7deea', borderRadius: 12, padding: 12 }}>{stages[step]}</div>
        <div style={{ fontSize: 28, color: MUTED, lineHeight: 1.5 }}>
          折返不是回到 θ₀，而是沿「总位移方向」挪一点。一阶展开后，这个更新等价于最小化
          <span style={{ fontFamily: 'Consolas, monospace', color: INK }}> ∑ᵢ 2L(Bᵢ) − α∑<sub>i&lt;j</sub> ∇L(Bᵢ)·∇L(Bⱼ)</span>
          ——前面是普通损失，后面是<b style={{ color: GREEN }}>梯度点积（对齐）项</b>。
        </div>
      </div>
    </div>
  );
}
