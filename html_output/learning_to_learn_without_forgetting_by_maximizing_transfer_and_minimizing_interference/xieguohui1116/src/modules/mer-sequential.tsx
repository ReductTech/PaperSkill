import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const W = 820;
const H = 560;
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';
const BG = '#f5f8f0';

function onlineAcc(i: number, t: number) {
  if (i > t) return 0;
  return 88 * Math.exp(-(t - i) * 0.22);
}
function merAcc(i: number, t: number) {
  if (i > t) return 0;
  return 88 * Math.exp(-(t - i) * 0.03);
}

export function MerSequential() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [t, setT] = useState(8);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const padL = 60, padR = 30, padT = 30, padB = 50;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const x = (i: number) => padL + (i / 19) * plotW;
    const y = (v: number) => padT + (1 - v / 100) * plotH;

    // axes
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = '18px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('任务 1', padL - 8, padT + plotH + 26);
    ctx.fillText('任务 20', padL + plotW - 60, padT + plotH + 26);
    ctx.fillText('准确率 %', 10, padT + plotH / 2);
    for (let g = 0; g <= 100; g += 25) {
      ctx.fillText(String(g), padL - 34, y(g) + 6);
      ctx.strokeStyle = '#eef2f7';
      ctx.beginPath();
      ctx.moveTo(padL, y(g));
      ctx.lineTo(padL + plotW, y(g));
      ctx.stroke();
      ctx.strokeStyle = LINE;
    }

    // bars per task for online (red) and mer (green)
    const bw = Math.min(24, plotW / 20 / 2);
    for (let i = 0; i < 20; i++) {
      const o = onlineAcc(i, t);
      const m = merAcc(i, t);
      if (o > 0) {
        ctx.fillStyle = RED;
        ctx.fillRect(x(i) - bw - 2, y(o), bw, padT + plotH - y(o));
      }
      if (m > 0) {
        ctx.fillStyle = GREEN;
        ctx.fillRect(x(i) + 2, y(m), bw, padT + plotH - y(m));
      }
    }

    // current task marker
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(x(t), padT + plotH + 14, 7, 0, Math.PI * 2);
    ctx.fill();

    // legend
    ctx.fillStyle = RED;
    ctx.fillRect(padL + 8, padT + 10, 16, 16);
    ctx.fillStyle = INK;
    ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('在线 SGD（只学新任务）', padL + 32, padT + 24);
    ctx.fillStyle = GREEN;
    ctx.fillRect(padL + 8, padT + 36, 16, 16);
    ctx.fillStyle = INK;
    ctx.fillText('MER（回放 + 对齐）', padL + 32, padT + 50);
  }, [t]);

  const worst = Math.max(0, Math.round(onlineAcc(Math.max(0, t - 8), t)));
  const merSame = Math.round(merAcc(Math.max(0, t - 8), t));

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%', alignItems: 'center' }}>
      <canvas ref={ref} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, color: INK, fontWeight: 700, lineHeight: 1.3 }}>学完第 {t + 1} 个任务后回头看</div>
        <p style={{ fontSize: 28, color: MUTED, margin: 0, lineHeight: 1.5 }}>
          每根柱是「该任务此刻的准确率」。在线学习刚学完一个任务时最高，越往后越被覆盖。
        </p>
        <label style={{ fontSize: 26, color: INK }}>训练进度（任务 {t + 1} / 20）
          <input type="range" min={0} max={19} value={t} onChange={e => setT(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
        </label>
        <div style={{ fontSize: 28, lineHeight: 1.4, color: INK, background: '#fff', border: '1px solid #d7deea', borderRadius: 12, padding: 14 }}>
          学完第 {t + 1} 个任务时，第 {Math.max(1, t - 7)} 个任务：在线学习只剩约 <b style={{ color: RED }}>{worst}%</b>，MER 仍保持约 <b style={{ color: GREEN }}>{merSame}%</b>。
        </div>
      </div>
    </div>
  );
}
