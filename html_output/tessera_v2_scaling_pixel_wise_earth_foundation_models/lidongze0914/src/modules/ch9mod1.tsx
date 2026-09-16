import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const KS = [16, 32, 64, 128];
const COS_S = [0.842, 0.905, 0.956, NaN, NaN];
const COS_T = [0.684, 0.764, 0.863, NaN, NaN];

type Fb = { text: string; cls: '' | 'good' | 'bad' };
const FEEDBACK: Fb[] = [
  { text: '前 16 格经 h16 重建完整教师嵌入，余弦 0.842，高于教师坐标前缀的 0.684。', cls: '' },
  { text: '前缀变宽，重建更忠实：0.905、0.956；教师坐标前缀仍落后。', cls: '' },
  { text: '前缀变宽，重建更忠实：0.905、0.956；教师坐标前缀仍落后。', cls: '' },
  { text: '两者在 128 维收敛——学生前缀仍是对 t 的学习式压缩。', cls: '' },
  { text: '推理时丢弃全部头，直接取任意前缀；头只服务训练。', cls: 'good' },
];

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 20, W, 20);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 20);
  ctx.lineTo(W, H - 20);
  ctx.stroke();
}

function drawChart(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = 'rgba(39, 68, 110, 0.10)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#68778f';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
}

function drawTarget(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x + 5, y);
  ctx.lineTo(x, y + 13);
  ctx.lineTo(x - 5, y);
  ctx.closePath();
  ctx.fill();
}

function drawBeam(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: [string, string][], x: number, y: number) {
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  items.forEach(([color, label]) => {
    ctx.fillStyle = color;
    ctx.fillRect(cx, y - 6, 12, 12);
    ctx.fillStyle = '#21324a';
    ctx.fillText(label, cx + 18, y + 1);
    cx += 18 + ctx.measureText(label).width + 26;
  });
}

function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function render(ctx: CanvasRenderingContext2D, st: { step: number; k: number; cosS: number; cosT: number }) {
  clearScene(ctx);
  const discarded = st.step === 4;

  const bx0 = 780;
  const bx1 = 1040;
  const by = 96;
  const bh = 20;
  const bx = (v: number) => map(v, 0, 1.5, bx0, bx1);
  ctx.fillStyle = '#d7deea';
  ctx.fillRect(bx0, by, bx1 - bx0, bh);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(bx0, by, bx(1.2) - bx0, bh);
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx(0.6), by - 7);
  ctx.lineTo(bx(0.6), by + bh + 7);
  ctx.stroke();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx(1.2), by - 9);
  ctx.lineTo(bx(1.2), by + bh + 9);
  ctx.stroke();
  drawSceneLabel(ctx, '0.6', bx(0.6) - 13, by + bh + 28, '#21324a');
  drawSceneLabel(ctx, '1.2', bx(1.2) - 13, by - 16, '#21324a');

  drawChart(ctx, 630, 137, 34, '#27446e');
  drawTarget(ctx, 630, 137, '#228d5c');

  const kNow = Math.round(st.k);
  for (let i = 0; i < 128; i++) {
    const row = i < 64 ? 0 : 1;
    const col = i % 64;
    ctx.fillStyle = i < kNow ? '#228d5c' : '#d7deea';
    ctx.fillRect(40 + col * 4, 96 + row * 44, 3, 43);
  }

  if (discarded) {
    drawBeam(ctx, 298, 140, 748, 140, '#228d5c');
    drawTarget(ctx, 750, 140, '#228d5c');
  } else {
    drawBeam(ctx, 298, 140, 378, 140, '#27446e');
    drawBeam(ctx, 452, 140, 630, 137, '#27446e');
  }

  const hx = 414;
  const hy = 140;
  const hr = 36;
  if (discarded) {
    ctx.globalAlpha = 0.3;
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 3;
    hexPath(ctx, hx, hy, hr);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#f07e47';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy - 13);
    ctx.lineTo(hx + 13, hy + 13);
    ctx.moveTo(hx + 13, hy - 13);
    ctx.lineTo(hx - 13, hy + 13);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(39, 68, 110, 0.10)';
    hexPath(ctx, hx, hy, hr);
    ctx.fill();
    ctx.strokeStyle = '#27446e';
    ctx.lineWidth = 3;
    hexPath(ctx, hx, hy, hr);
    ctx.stroke();
  }
  ctx.fillStyle = discarded ? '#68778f' : '#27446e';
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(kNow), hx, hy);

  const rx = 560;
  const rw = 140;
  if (st.step <= 2) {
    ctx.fillStyle = '#d7deea';
    ctx.fillRect(rx, 198, rw, 10);
    ctx.fillStyle = '#228d5c';
    ctx.fillRect(rx, 198, map(st.cosS, 0.6, 1.0, 0, rw), 10);
    ctx.fillStyle = '#d7deea';
    ctx.fillRect(rx, 226, rw, 10);
    ctx.fillStyle = '#f07e47';
    ctx.fillRect(rx, 226, map(st.cosT, 0.6, 1.0, 0, rw), 10);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#21324a';
    ctx.fillText(st.cosS.toFixed(3), rx + rw + 8, 203);
    ctx.fillText(st.cosT.toFixed(3), rx + rw + 8, 231);
  } else {
    ctx.fillStyle = '#228d5c';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('收敛', rx + rw / 2, 214);
  }

  drawSceneLabel(ctx, '学生前缀', 40, 86, '#21324a');
  drawSceneLabel(ctx, '教师嵌入', 568, 94, '#21324a');
  drawLegend(
    ctx,
    [
      ['#228d5c', '学生重建'],
      ['#f07e47', '教师前缀'],
      ['#27446e', '冻结目标'],
    ],
    700,
    256
  );
}

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, k: 16, cosS: 0.842, cosT: 0.684 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Fb>(FEEDBACK[0]);

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
    const tick = () => {
      const st = stateRef.current;
      const targetK = st.step < 4 ? KS[st.step] : 128;
      st.k = lerp(st.k, targetK, 0.14);
      if (st.step <= 2) {
        st.cosS = lerp(st.cosS, COS_S[st.step], 0.14);
        st.cosT = lerp(st.cosT, COS_T[st.step], 0.14);
      }
      render(ctx, st);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (n: number) => {
    const s = clamp(n, 0, 4);
    if (s === step) return;
    stateRef.current.step = s;
    setStep(s);
    setFeedback(FEEDBACK[s]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(step - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(step + 1);
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <button onClick={() => go(step + 1)} disabled={step === 4}>
          {step === 4 ? '已完成' : '下一步'}
        </button>
        <label>
          步骤 <span className="val">第 {step + 1}/5 步</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
