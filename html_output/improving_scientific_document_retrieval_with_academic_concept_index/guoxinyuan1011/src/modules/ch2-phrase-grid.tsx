import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.2（短语侧 · 方案乙「100 格点阵」）
// 骨架：上 = 该短语在本文的详细度 exp(BM25(p,d))；下 = 同类 100 篇的相似度和（点阵示意：一格一篇，亮 = 该篇写到它）。
// 读法：两条上条差不多长，差异全在下段 —— 分母大 = 大家都在写 → 比值被压低 → 落选。
// 自包含：只 import react 与 ../lib/canvasKit，export React.FC<WidgetProps>。

const W = 1080;
const H = 450;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

const CELL = 15;
const GAP = 3;
const COLS_N = 10;
const ROWS_N = 10;
const GRID_W = COLS_N * (CELL + GAP) - GAP; // 177
const GRID_Y = 194;
const GRID_H = ROWS_N * (CELL + GAP) - GAP;

interface ColSpec {
  cx: number;
  en: string;
  zh: string;
  note: string;
  shot: number; // 本文详细度（机制示意）
  denomSum: number; // 同类 100 篇的能量和（机制示意）
  hits: number; // 100 篇里写到此短语的篇数
  ratio: number; // exp / (1 + Σ)
  verdict: string;
  color: string;
  barColor: string;
  seed: number;
}

const COLS: ColSpec[] = [
  {
    cx: 285,
    en: 'user-item interaction',
    zh: '「用户–物品交互」',
    note: '推荐系统的基础设定：谁点了什么、打了多少分 —— 同类论文几乎人人都写',
    shot: 38,
    denomSum: 920,
    hits: 87,
    ratio: 0.04,
    verdict: '落选',
    color: '#c43f52',
    barColor: '#f07e47',
    seed: 20260411,
  },
  {
    cx: 795,
    en: 'playlist continuation',
    zh: '「播放列表续接」',
    note: '预测歌单里下一首的具体任务 —— 只有做这个任务的文档才写',
    shot: 35,
    denomSum: 56,
    hits: 6,
    ratio: 0.61,
    verdict: '入选',
    color: '#228d5c',
    barColor: '#f07e47',
    seed: 99173,
  },
];

// 确定性伪随机：Fisher–Yates 洗牌 0..99，取前 count 格点亮。
// 固定（不随重绘抖动），且结构上必定终止 —— 不能用「随机取格直到凑够」那种写法：
// 取模乘法一旦超出 float64 精度就会丢低位、序列退化，循环可能永远凑不满。
function makeHits(count: number, seed: number): boolean[] {
  const total = COLS_N * ROWS_N;
  const idx: number[] = new Array(total);
  for (let i = 0; i < total; i++) idx[i] = i;

  let s = seed >>> 0 || 1;
  const nextU32 = (): number => {
    // 32 位 xorshift，全程位运算（不产生 > 2^53 的中间量）
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s;
  };

  for (let i = total - 1; i > 0; i--) {
    const j = nextU32() % (i + 1);
    const tmp = idx[i];
    idx[i] = idx[j];
    idx[j] = tmp;
  }

  const lit = new Array(total).fill(false);
  for (let k = 0; k < Math.min(count, total); k++) lit[idx[k]] = true;
  return lit;
}

const HITS = COLS.map((c) => makeHits(c.hits, c.seed));

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left',
  bold = false
) {
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = `${bold ? '600 ' : ''}${size}px ${SANS}`;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

const SCAN_MS = 2800;
const HOLD_MS = 1600;
const CYCLE = SCAN_MS + HOLD_MS;

export const Ch2PhraseGrid: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = performance.now();
    let wasDone = false;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 90);
      last = now;
      phaseRef.current = (phaseRef.current + dt) % CYCLE;
      const t = clamp(phaseRef.current / SCAN_MS, 0, 1);
      const reached = Math.floor(t * 100 + 0.0001);
      const isDone = phaseRef.current >= SCAN_MS;
      if (isDone !== wasDone) {
        wasDone = isDone;
        setDone(isDone);
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';

      COLS.forEach((col, ci) => {
        const left = col.cx - 220;
        const right = col.cx + 220;

        // 列头
        text(ctx, col.en, col.cx, 36, '#21324a', 17, 'center', true);
        text(ctx, col.zh, col.cx, 58, '#5c5a52', 13.5, 'center');
        text(ctx, col.note, col.cx, 80, '#8a8780', 13, 'center');

        // 上段：本文详细度
        text(ctx, '本文详细度', left, 112, '#5c5a52', 13.5);
        text(ctx, 'exp(BM25(p,d))', left + 74, 112, '#9aa3ae', 12.5);
        const shotW = (col.shot / 50) * 300;
        roundRect(ctx, left, 120, 300, 18, 5);
        ctx.fillStyle = '#eef1ec';
        ctx.fill();
        roundRect(ctx, left, 120, shotW, 18, 5);
        ctx.fillStyle = col.barColor;
        ctx.fill();
        text(ctx, String(col.shot), left + 310, 134, '#b4602f', 15, 'left', true);

        // 分隔线
        ctx.strokeStyle = '#dfe5ee';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left, 154);
        ctx.lineTo(right, 154);
        ctx.stroke();

        // 下段：同类 100 篇的相似度和
        text(ctx, '同类 100 篇的相似度和', left, 178, '#5c5a52', 13.5);
        text(ctx, '亮格 = 该篇写到了它', left + 150, 178, '#9aa3ae', 12.5);
        text(
          ctx,
          `${phaseRef.current >= SCAN_MS ? col.hits : Math.round((col.hits * reached) / 100)} / 100 篇`,
          right,
          178,
          col.color,
          14,
          'right',
          true
        );

        // 点阵
        const gx = col.cx - GRID_W / 2;
        const lit = HITS[ci];
        for (let i = 0; i < COLS_N * ROWS_N; i++) {
          const r = Math.floor(i / COLS_N);
          const c = i % COLS_N;
          const x = gx + c * (CELL + GAP);
          const y = GRID_Y + r * (CELL + GAP);
          const on = i < reached && lit[i];
          roundRect(ctx, x, y, CELL, CELL, 3);
          if (on) {
            ctx.fillStyle = col.color;
            ctx.fill();
          } else {
            ctx.fillStyle = i < reached ? '#e9edf3' : '#f2f5f8';
            ctx.fill();
            ctx.strokeStyle = '#e2e8ef';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 扫描线
        if (!isDone) {
          const sy = GRID_Y + t * GRID_H;
          ctx.strokeStyle = 'rgba(240, 126, 71, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx - 8, sy);
          ctx.lineTo(gx + GRID_W + 8, sy);
          ctx.stroke();
        }

        // 比值行
        text(
          ctx,
          `${col.shot} ÷ (1 + ${col.denomSum}) ≈ ${col.ratio.toFixed(2)}`,
          left,
          404,
          '#5c5a52',
          15
        );
        const badgeX = left + 240;
        roundRect(ctx, badgeX, 390, 62, 22, 6);
        ctx.fillStyle = col.color;
        ctx.fill();
        text(ctx, col.verdict, badgeX + 31, 406, '#ffffff', 14, 'center', true);
        text(
          ctx,
          col.hits >= 50 ? '分母大：同类都在写它' : '分母小：只有你在写它',
          badgeX + 74,
          406,
          '#8a8780',
          13
        );
      });

      // 脚注
      text(
        ctx,
        '点阵每格 = 一篇同类文档（|D_d| = 100，按核心主题的 Jaccard 相似度检索得到）；比值为机制示意，非论文实测。',
        W / 2,
        436,
        '#8a8780',
        12.5,
        'center'
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onReplay = () => {
    phaseRef.current = 0;
    setDone(false);
  };

  const fb = done
    ? '扫完 100 篇：「用户–物品交互」87 篇写过它 → 分母大 → 0.04 落选；「播放列表续接」6 篇 → 分母小 → 0.61 入选。'
    : '正在翻同类文档……';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onReplay}>
          重新扫描
        </button>
      </div>
      <div className={`feedback ${done ? 'good' : ''}`}>{fb}</div>
    </div>
  );
};
