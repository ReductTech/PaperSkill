import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', GREEN = '#228d5c', ORANGE = '#d97706';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea', DIM = '#c7cfda';

// 5 个 Key：未来查询命中次数决定是否保留
const KEYS = [
  { label: 'x=3', hits: 2 },
  { label: 'x+5', hits: 0 },
  { label: '=8', hits: 0 },
  { label: '×2', hits: 2 },
  { label: '=16', hits: 1 },
];
// 未来查询依次命中哪些 Key（按索引）
const QUERIES = [0, 3, 0, 3, 4];

// 第 2 章：理想压缩 —— 未来会被查询的 Key 留下，其余删掉。
export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 顶部标题带
      ctx.fillStyle = INK;
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('未来查询命中 → 保留', 10, 18);

      const queryDur = 0.7;
      const pruneStart = QUERIES.length * queryDur;
      const cycleLen = pruneStart + 1.1;
      const ct = t % cycleLen;

      // 已播放的未来查询数量
      let shown = Math.min(QUERIES.length, Math.floor(ct / queryDur) + 1);
      const activeQ = shown - 1;
      const inPrune = ct >= pruneStart;

      // 各 Key 命中次数
      const hitCount = new Array(KEYS.length).fill(0);
      for (let i = 0; i < shown; i++) hitCount[QUERIES[i]]++;

      // 命中次数 → 是否保留（剪枝后 hits>0 保留）
      const kept = hitCount.map((h) => h > 0);

      // 绘制 Key 卡片 + 命中柱
      const x0 = 26, gap = 46;
      KEYS.forEach((k, i) => {
        const x = x0 + i * gap;
        const isActive = !inPrune && i === QUERIES[activeQ];
        const fade = inPrune && !kept[i];
        ctx.globalAlpha = fade ? 0.35 : 1;
        // 卡片
        const cw = 36, chh = 24, cy = 40;
        ctx.fillStyle = inPrune ? (kept[i] ? '#eefaf1' : '#f1f3f6') : isActive ? BLUE : '#ffffff';
        ctx.strokeStyle = inPrune ? (kept[i] ? GREEN : LINE) : isActive ? BLUE : LINE;
        ctx.lineWidth = inPrune && kept[i] ? 2 : isActive ? 2 : 1;
        ctx.beginPath();
        const r = 6;
        ctx.moveTo(x - cw / 2 + r, cy);
        ctx.lineTo(x + cw / 2 - r, cy);
        ctx.arcTo(x + cw / 2, cy, x + cw / 2, cy + r, r);
        ctx.lineTo(x + cw / 2, cy + chh - r);
        ctx.arcTo(x + cw / 2, cy + chh, x + cw / 2 - r, cy + chh, r);
        ctx.lineTo(x - cw / 2 + r, cy + chh);
        ctx.arcTo(x - cw / 2, cy + chh, x - cw / 2, cy + chh - r, r);
        ctx.lineTo(x - cw / 2, cy + r);
        ctx.arcTo(x - cw / 2, cy, x - cw / 2 + r, cy, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isActive ? '#fff' : INK;
        ctx.font = '11px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(k.label, x, cy + 16);
        // 命中柱
        const bh = hitCount[i] * 7;
        ctx.fillStyle = inPrune && !kept[i] ? DIM : GREEN;
        ctx.fillRect(x - 6, 82 - bh, 12, bh);
        ctx.fillStyle = MUT;
        ctx.font = '10px ' + FONT;
        ctx.fillText(String(hitCount[i]), x, 96);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      });

      // 未来查询箭头（非剪枝阶段，指向当前命中的 Key）
      if (!inPrune) {
        const tx = x0 + QUERIES[activeQ] * gap;
        const ax = tx, ay = 26, bx = tx, by = 38;
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - 4, by - 7);
        ctx.lineTo(bx + 4, by - 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = ORANGE;
        ctx.font = 'bold 11px ' + FONT;
        ctx.fillText('Q' + (activeQ + 1), Math.max(8, tx - 10), 24);
      }

      // 底部说明带
      ctx.fillStyle = inPrune ? GREEN : MUT;
      ctx.font = '11px ' + FONT;
      ctx.fillText(inPrune ? '只保留未来会被查询的 Key' : '未来查询逐个命中 Key', 10, H - 8);
    };

    const tick = (ts: number) => {
      render(ts / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana2;