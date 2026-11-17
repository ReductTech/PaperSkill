import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const W = 620;
const H = 560;
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';
const BG = '#f5f8f0';

const STEPS = [
  { code: '采样当前样本 (x, y)', desc: '从任务流里拿到新样本。' },
  { code: '抽 s 个批次：每批 = (x,y) + k−1 个记忆样本', desc: '当前样本总在场，其余从记忆里随机抽。' },
  { code: '批内逐样本 SGD（学习率 α，批大小 1）', desc: '每批里每个样本单独做一步梯度下降。' },
  { code: '批内 Reptile 元更新（β）', desc: '批内折返一次，浮现批内的对齐项。' },
  { code: '批间 Reptile 元更新（γ）', desc: 's 个批次之间再折返一次；γ=1 时等价于一次大 Reptile。' },
  { code: '蓄水池采样更新记忆 M', desc: '按 Algorithm R 决定新样本是否进记忆。' },
  { code: '进入下一个样本（循环）', desc: '整个过程对每个到来样本重复。' },
];

export function MerAlgorithm() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // memory buffer
    const slotW = 84, slotH = 96, gap = 14, x0 = 40, y0 = 60;
    for (let k = 0; k < 5; k++) {
      const x = x0 + k * (slotW + gap);
      ctx.fillStyle = step >= 1 ? '#fff' : '#f1f4f8';
      ctx.fillRect(x, y0, slotW, slotH);
      ctx.strokeStyle = step >= 1 && k < 4 ? BLUE : LINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y0, slotW, slotH);
      ctx.fillStyle = MUTED;
      ctx.font = '18px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(k < 4 ? `旧样本 ${k}` : '空', x + 12, y0 + slotH / 2);
    }
    // current sample
    ctx.fillStyle = step >= 0 ? ORANGE : '#f1f4f8';
    ctx.fillRect(x0, y0 + slotH + 30, slotW + 20, 44);
    ctx.fillStyle = INK;
    ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('当前 (x,y)', x0 + 10, y0 + slotH + 60);

    // alignment arrows
    const ax = 320, ay = 400;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + 90, ay - 40);
    ctx.stroke();
    ctx.fillStyle = BLUE;
    ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('记忆梯度', ax + 96, ay - 44);
    const ang = step >= 4 ? -20 : step >= 3 ? 25 : 65; // 角度随对齐逐步减小
    const rad = (ang * Math.PI) / 180;
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + 90 * Math.cos(rad), ay - 90 * Math.sin(rad));
    ctx.stroke();
    ctx.fillStyle = ORANGE;
    ctx.fillText('新梯度', ax + 90 * Math.cos(rad) + 8, ay - 90 * Math.sin(rad) + 8);
    ctx.fillStyle = INK;
    ctx.font = '22px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(step >= 4 ? '对齐后：夹角很小' : '对齐前：夹角较大', ax, ay + 40);
  }, [step]);

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%', alignItems: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{
            fontSize: 24, padding: '8px 14px', borderRadius: 10, fontFamily: 'Consolas, monospace',
            background: i === step ? '#fff3e0' : 'transparent', color: i === step ? INK : MUTED,
            border: i === step ? `2px solid ${ORANGE}` : '1px solid transparent', fontWeight: i === step ? 700 : 400,
          }}>
            {i + 1}. {s.code}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 300 }}>
        <canvas ref={ref} />
        <div style={{ fontSize: 26, color: INK, background: '#fff', border: '1px solid #d7deea', borderRadius: 12, padding: 12 }}>{STEPS[step].desc}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setStep(Math.min(6, step + 1))} disabled={step >= 6}
            style={{ fontSize: 24, padding: '10px 18px', borderRadius: 10, background: ORANGE, color: '#fff', border: 'none', cursor: step >= 6 ? 'default' : 'pointer', opacity: step >= 6 ? 0.5 : 1, fontWeight: 700 }}>下一步</button>
          <button onClick={() => setStep(0)} style={{ fontSize: 24, padding: '10px 18px', borderRadius: 10, background: '#fff', color: INK, border: '1px solid #9fb0c8', cursor: 'pointer' }}>重来</button>
        </div>
      </div>
    </div>
  );
}
