import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 / 模块 2.1：快照里到底存了什么。
// 唯一主操作：点三张样本卡之一。左侧照片卡换剪影，右侧 8 条旧类概率与
// 风味卡上的三条记录同时缓动（320ms）—— 存下来的只是一整行输出，没有图片和标签。
const W = 1080;
const H = 280;

type Sample = 'bird' | 'indoor' | 'street';

const ORDER: Sample[] = ['bird', 'indoor', 'street'];
const NAME: Record<Sample, string> = { bird: '鸟', indoor: '室内', street: '街景' };

// 8 个旧类概率（示意值，每行和为 1）。真实网络是 1000 列，这里只画前 8 列。
const PROBS: Record<Sample, number[]> = {
  bird: [0.42, 0.21, 0.11, 0.09, 0.07, 0.05, 0.03, 0.02],
  indoor: [0.28, 0.19, 0.15, 0.12, 0.1, 0.07, 0.05, 0.04],
  street: [0.19, 0.17, 0.15, 0.14, 0.12, 0.1, 0.08, 0.05],
};

const FEEDBACK: Record<Sample, { text: string; cls: string }> = {
  bird: {
    text: '同一张鸟图，旧网络仍给出 1000 个旧类概率；这一整行存下来，就是快照（数值为示意）。',
    cls: '',
  },
  indoor: {
    text: '换成室内图，分布变了，但存下来的仍然只是一行概率 —— 不需要任何旧标签（数值为示意）。',
    cls: '',
  },
  street: {
    text: '新任务的图片越接近旧任务，快照越「有话说」；差得越远，这一行越像噪声（数值为示意）。',
    cls: '',
  },
};

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  deep: '#7a4a22',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#f07e47',
  tea: '#a9713a',
  axis: '#d7deea',
  ink: '#21324a',
  track: 'rgba(255,255,255,0.78)',
  card: '#ffffff',
};

// 概率条与照片卡的坐标
const BX = 360;
const BW = 360;
const PMAX = 0.45;
const ROW_Y = 54;
const ROW_H = 14;
const ROW_GAP = 22;

// 风味卡三条记录的参考满格：0.68 这一格对外概率（示意）
const CARD_FULL = 0.68;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function scene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // 茶桌
  ctx.fillStyle = C.table;
  ctx.fillRect(0, 250, W, 30);
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.lineTo(W, 250);
  ctx.stroke();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 278);
  ctx.lineTo(W, 278);
  ctx.stroke();
}

function birdSilhouette(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(39,68,110,0.72)';
  ctx.beginPath();
  ctx.ellipse(150, 150, 40, 27, -0.14, 0, Math.PI * 2);
  ctx.fill();
  // 尾
  ctx.beginPath();
  ctx.moveTo(112, 142);
  ctx.lineTo(84, 128);
  ctx.lineTo(92, 158);
  ctx.closePath();
  ctx.fill();
  // 头
  ctx.beginPath();
  ctx.arc(192, 124, 15, 0, Math.PI * 2);
  ctx.fill();
  // 喙
  ctx.beginPath();
  ctx.moveTo(206, 120);
  ctx.lineTo(226, 126);
  ctx.lineTo(206, 133);
  ctx.closePath();
  ctx.fill();
  // 腿
  ctx.strokeStyle = 'rgba(39,68,110,0.72)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(142, 172);
  ctx.lineTo(142, 196);
  ctx.moveTo(168, 174);
  ctx.lineTo(168, 196);
  ctx.stroke();
  // 眼
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(196, 119, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

function indoorSilhouette(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(39,68,110,0.72)';
  ctx.lineWidth = 3;
  ctx.strokeRect(72, 74, 84, 64);
  ctx.beginPath();
  ctx.moveTo(114, 74);
  ctx.lineTo(114, 138);
  ctx.moveTo(72, 106);
  ctx.lineTo(156, 106);
  ctx.stroke();
  ctx.fillStyle = 'rgba(39,68,110,0.72)';
  ctx.fillRect(158, 166, 104, 9);
  ctx.fillRect(166, 175, 8, 28);
  ctx.fillRect(248, 175, 8, 28);
}

function streetSilhouette(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(39,68,110,0.72)';
  ctx.fillRect(64, 100, 42, 96);
  ctx.fillRect(112, 68, 44, 128);
  ctx.fillRect(162, 120, 38, 76);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.fillRect(118 + c * 18, 78 + r * 22, 10, 11);
    }
  }
  for (let r = 0; r < 4; r++) {
    ctx.fillRect(72, 110 + r * 20, 9, 10);
  }
  ctx.strokeStyle = 'rgba(39,68,110,0.72)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, 202);
  ctx.lineTo(262, 202);
  ctx.stroke();
}

function photoCard(ctx: CanvasRenderingContext2D, sample: Sample, hl: number) {
  const x = 40;
  const y = 54;
  const w = 240;
  const h = 168;
  ctx.fillStyle = C.card;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.save();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  if (sample === 'bird') birdSilhouette(ctx);
  else if (sample === 'indoor') indoorSilhouette(ctx);
  else streetSilhouette(ctx);
  ctx.restore();
  // 选中卡：2px 绿描边，切换时淡入
  roundRect(ctx, x, y, w, h, 10);
  ctx.strokeStyle = lerpColor(C.axis, C.green, clamp(hl, 0, 1));
  ctx.lineWidth = 2;
  ctx.stroke();
}

function probBars(ctx: CanvasRenderingContext2D, probs: number[]) {
  const top = probs.reduce((best, v, i) => (v > probs[best] ? i : best), 0);
  for (let i = 0; i < probs.length; i++) {
    const y = ROW_Y + i * ROW_GAP;
    const w = BW * clamp(probs[i] / PMAX, 0, 1);
    roundRect(ctx, BX, y, BW, ROW_H, ROW_H / 2);
    ctx.fillStyle = C.track;
    ctx.fill();
    roundRect(ctx, BX, y, Math.max(4, w), ROW_H, ROW_H / 2);
    ctx.fillStyle = i === top ? C.orange : C.blue;
    ctx.fill();
    if (i < 3) {
      // 只写前三条的两位小数
      ctx.fillStyle = C.ink;
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(probs[i].toFixed(2), BX + Math.max(4, w) + 8, y + 12);
    }
  }
}

function flavourCard(ctx: CanvasRenderingContext2D, probs: number[]) {
  const x = 800;
  const y = 54;
  const w = 232;
  const h = 168;
  ctx.fillStyle = C.card;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();
  const base = 196;
  const maxH = 118;
  const colors = [C.blue, C.tea, C.tea];
  for (let i = 0; i < 3; i++) {
    const bh = maxH * clamp(probs[i] / CARD_FULL, 0.06, 1);
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = 0.88;
    ctx.fillRect(828 + i * 60, base - bh, 26, bh);
    ctx.globalAlpha = 1;
  }
  // 卡纸的下沿
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(816, base);
  ctx.lineTo(1016, base);
  ctx.stroke();
}

function render(
  ctx: CanvasRenderingContext2D,
  s: { sample: Sample; probs: number[]; hl: number }
) {
  scene(ctx);
  photoCard(ctx, s.sample, s.hl);
  probBars(ctx, s.probs);
  flavourCard(ctx, s.probs);
  // canvas 内文字共两处
  ctx.font = '15px "Segoe UI", system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.blue;
  ctx.textAlign = 'left';
  ctx.fillText('旧类概率', BX, 40);
  ctx.fillStyle = C.tea;
  ctx.textAlign = 'right';
  ctx.fillText('示意', 1032, 40);
  ctx.textAlign = 'left';
}

export const M2Snapshot: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfg = useRef({
    sample: 'bird' as Sample,
    from: PROBS.bird.slice(),
    to: PROBS.bird.slice(),
    t0: 0,
    dur: 0,
  });
  const [sample, setSample] = useState<Sample>('bird');
  const [feedback, setFeedback] = useState(FEEDBACK.bird);

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

    const tick = (now: number) => {
      const s = cfg.current;
      const p = s.dur > 0 ? clamp((now - s.t0) / s.dur, 0, 1) : 1;
      const k = easeOutCubic(p);
      const probs = s.from.map((v, i) => v + (s.to[i] - v) * k);
      render(ctx, { sample: s.sample, probs, hl: k });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (s2: Sample) => {
    const s = cfg.current;
    const now = performance.now();
    const p = s.dur > 0 ? clamp((now - s.t0) / s.dur, 0, 1) : 1;
    const k = easeOutCubic(p);
    s.from = s.from.map((v, i) => v + (s.to[i] - v) * k);
    s.to = PROBS[s2].slice();
    s.t0 = now;
    s.dur = 320;
    s.sample = s2;
    setSample(s2);
    setFeedback(FEEDBACK[s2]);
  };

  return (
    <div>
      <div className="chip-row">
        {ORDER.map((s) => (
          <button
            key={s}
            className={'chip' + (sample === s ? ' selected' : '')}
            aria-pressed={sample === s}
            onClick={() => pick(s)}
          >
            {NAME[s]}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M2Snapshot;
