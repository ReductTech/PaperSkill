import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P1 滑块 + P4 chips（hybrid）：左 560px 生活场景（锚点三角+攀岩者 x=120+δ·340，绳子厚度/张力脉冲 ∝ F 档位×δ）；
// 右 440px 白色内嵌图（#d7deea 边框）：惩罚曲线 y=(λ/2)·F·δ²（λ=1），当前点用裸数字标惩罚值（2 位小数）。
const W = 1080;
const H = 280;
const LEFT_W = 560;

const COL = {
  bg: '#f5f8f0',
  rockLight: '#b8c9a7',
  rockDark: '#76906a',
  rope: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  ink: '#21324a',
  muted: '#68778f',
};

interface S {
  delta: number;
  fLevel: number;
}

const F_LEVELS: { label: string; value: number }[] = [
  { label: '不重要 F=0.2', value: 0.2 },
  { label: '一般 F=1', value: 1 },
  { label: '重要 F=4', value: 4 },
];

function feedbackFor(delta: number, f: number): { text: string; cls: string } {
  if (delta < 0.15) {
    return { text: '偏离很小，弹簧几乎不发力——权重还能自由探索。', cls: '' };
  }
  if (delta <= 0.6) {
    return { text: '偏离变大，回拉力按平方增长：优化器感受到越来越强的召回。', cls: '' };
  }
  if (f === 0.2) {
    return { text: '不重要权重弹簧太软，拉不住。', cls: 'bad' };
  }
  if (f === 4) {
    return { text: '偏离太大，回拉力巨大：重要权重基本被锁在旧解附近。', cls: 'good' };
  }
  return { text: '偏离太大，回拉力巨大：重要权重基本被锁在旧解附近。', cls: '' };
}

function drawClimberLean(
  ctx: CanvasRenderingContext2D,
  footX: number,
  footY: number,
  color: string,
  lean: number,
  handX: number,
  handY: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hipY = footY - 48;
  const shY = hipY - 28;
  const shX = footX - lean;
  ctx.beginPath(); // legs
  ctx.moveTo(footX - 9, footY);
  ctx.lineTo(footX, hipY);
  ctx.lineTo(footX + 9, footY);
  ctx.stroke();
  ctx.beginPath(); // torso（随拉力后仰）
  ctx.moveTo(footX, hipY);
  ctx.lineTo(shX, shY);
  ctx.stroke();
  ctx.beginPath(); // arm 抓住绳子
  ctx.moveTo(shX, shY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  ctx.beginPath(); // head
  ctx.arc(shX - 6, shY - 12, 8, 0, Math.PI * 2);
  ctx.fill();
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<S>({ delta: 0.3, fLevel: 4 });
  const [delta, setDelta] = useState(0.3);
  const [fLevel, setFLevel] = useState(4);
  const [feedback, setFeedback] = useState({
    text: '先拖远一点，再换个刚度的权重试试。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: S, tSec: number) => {
      const delta = s.delta;
      const f = s.fLevel;
      const pull = f * delta; // 0..4

      // ---- 左：生活场景 ----
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, LEFT_W, H);
      ctx.fillStyle = COL.rockLight;
      ctx.fillRect(0, 48, LEFT_W, H - 48);
      ctx.strokeStyle = COL.rockDark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(LEFT_W, 48);
      ctx.stroke();

      const ax = 64;
      const ay = 168;
      const cx = 120 + delta * 340;
      const cy = 158;
      // 绳子：厚度/张力脉冲 ∝ F 档位×δ
      const sag = clamp(64 - 52 * (pull / 4), 6, 64);
      const pulse = Math.sin(tSec * 8) * (0.8 + 7 * (pull / 4));
      const midY = lerp(ay, cy, 0.5) + sag + pulse;
      ctx.strokeStyle = COL.rope;
      ctx.lineWidth = 3 + 9 * (pull / 4);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + cx) / 2, midY, cx, cy);
      ctx.stroke();

      // 锚点三角 + 绿环
      ctx.fillStyle = COL.ink;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 12);
      ctx.lineTo(ax - 7, ay + 2);
      ctx.lineTo(ax + 7, ay + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ax, ay, 11, 0, Math.PI * 2);
      ctx.stroke();

      // 攀岩者：拉力越大后仰越明显
      drawClimberLean(ctx, cx + 18, 212, COL.blue, (pull / 4) * 26, cx - 4, cy - 4);

      // ---- 右：白色内嵌图（440px，#d7deea 边框）----
      const px0 = 600;
      const py0 = 16;
      const pw = 440;
      const ph = 248;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px0, py0, pw, ph);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(px0, py0, pw, ph);

      const gx0 = 640;
      const gy0 = 48;
      const gw = 376;
      const gh = 192; // 惩罚轴 0..2（F=4、δ=1 时最大 = 2）
      const yOf = (pen: number) => gy0 + gh - (pen / 2) * gh;
      const xOf = (d: number) => gx0 + d * gw;

      // 网格线（惩罚 0.5 / 1 / 1.5）
      ctx.strokeStyle = '#e6ebf2';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      for (const pv of [0.5, 1, 1.5]) {
        const gy = yOf(pv);
        ctx.beginPath();
        ctx.moveTo(gx0, gy);
        ctx.lineTo(gx0 + gw, gy);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 坐标轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx0, gy0);
      ctx.lineTo(gx0, gy0 + gh);
      ctx.lineTo(gx0 + gw, gy0 + gh);
      ctx.stroke();

      // 惩罚曲线 y = F·δ²/2
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const d = i / 40;
        const pen = (f * d * d) / 2;
        const px = xOf(d);
        const py = yOf(pen);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 当前点 + 裸数字（惩罚值，2 位小数）
      const penNow = (f * delta * delta) / 2;
      const cpx = xOf(delta);
      const cpy = yOf(penNow);
      ctx.fillStyle = COL.blue;
      ctx.beginPath();
      ctx.arc(cpx, cpy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = COL.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(penNow.toFixed(2), cpx, cpy - 14);

      // 图例（1 项）
      ctx.textAlign = 'left';
      ctx.strokeStyle = COL.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx0, 30);
      ctx.lineTo(gx0 + 22, 30);
      ctx.stroke();
      ctx.fillStyle = COL.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('惩罚=λFδ²/2', gx0 + 30, 30);

      // 横轴刻度 0 / 1 与标签 δ
      ctx.fillStyle = COL.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0', gx0, gy0 + gh + 16);
      ctx.fillText('1', gx0 + gw, gy0 + gh + 16);
      ctx.fillText('δ', gx0 + gw + 18, gy0 + gh + 16);
      ctx.textAlign = 'left';
    };

    const tick = (now: number) => {
      render(stateRef.current, now / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onDelta = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.delta = v;
    setDelta(v);
    setFeedback(feedbackFor(v, stateRef.current.fLevel));
  };

  const onF = (f: number) => {
    stateRef.current.fLevel = f;
    setFLevel(f);
    setFeedback(feedbackFor(stateRef.current.delta, f));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          偏离距离 δ <span className="val">{delta.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(delta * 100)}
          onChange={onDelta}
        />
      </div>
      <div className="chip-row">
        {F_LEVELS.map((f) => (
          <button
            key={f.value}
            className={`chip${fLevel === f.value ? ' selected' : ''}`}
            onClick={() => onF(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
