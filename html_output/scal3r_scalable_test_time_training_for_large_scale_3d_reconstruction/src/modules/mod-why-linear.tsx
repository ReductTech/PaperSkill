import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 模块 2.2 —— 为什么分块能把「平方」变「线性」？
// 用注意力矩阵直观对比：一次全局点亮整块 N×N（亮格 ∝ N²），
// 分块只点亮对角线上 K 个 M×M 小块（亮格 = K·M² = N·M ∝ N）。
const W = 560;
const H = 268;
const N_MIN = 4;
const N_MAX = 16;
const M = 4; // 每块帧数（固定常数），正是「平方变线性」的关键

interface LinState {
  t: number;
  n: number;
}

// 分块方案的亮格总数：对角线上每个 M×M 块，末块按余数取实际大小。
function chunkCells(n: number): { cells: number; blocks: number[] } {
  const blocks: number[] = [];
  let cells = 0;
  for (let start = 0; start < n; start += M) {
    const size = Math.min(M, n - start);
    blocks.push(size);
    cells += size * size;
  }
  return { cells, blocks };
}

export const ModWhyLinear: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<LinState>({ t: 0, n: 12 });
  const rafRef = useRef<number | null>(null);
  const [n, setN] = useState(12);

  const { cells: chunk } = chunkCells(n);
  const full = n * n;
  const ratio = (full / chunk).toFixed(1);

  const [feedback, setFeedback] = useState({
    text: '拖动 N：左边亮格按 N² 疯涨，右边只沿对角线点亮几个小方块。',
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

    const gridSize = 150;
    const gy0 = 52;
    const leftX = 44;
    const rightX = W - 44 - gridSize;

    // 画一张注意力矩阵：nn×nn 的格子，litFn(r,c) 决定是否点亮。
    const drawGrid = (
      ox: number,
      nn: number,
      color: string,
      lit: (r: number, c: number) => boolean,
      pulse: number
    ) => {
      const cell = gridSize / nn;
      // 底板
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(ox, gy0, gridSize, gridSize);
      // 格子
      for (let r = 0; r < nn; r++) {
        for (let c = 0; c < nn; c++) {
          const x = ox + c * cell;
          const y = gy0 + r * cell;
          if (lit(r, c)) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.55 + pulse * 0.25;
            ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
            ctx.globalAlpha = 1;
          }
        }
      }
      // 外框
      ctx.strokeStyle = '#c7d0c0';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, gy0, gridSize, gridSize);
    };

    const render = (s: LinState) => {
      const nn = Math.round(s.n);
      const pulse = (Math.sin(s.t * 0.08) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 标题
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#c43f52';
      ctx.fillText('一次全局注意力', leftX, 34);
      ctx.fillStyle = '#27446e';
      ctx.fillText('分块注意力', rightX, 34);

      // 左：整块全亮 → N²
      drawGrid(leftX, nn, '#c43f52', () => true, pulse);
      // 右：只点亮对角线上的 M×M 块 → K·M²
      drawGrid(
        rightX,
        nn,
        '#27446e',
        (r, c) => Math.floor(r / M) === Math.floor(c / M),
        pulse
      );

      // 坐标轴意义标注
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#9aa7b8';
      ctx.fillText('每格 = 一对帧是否互相“看”', leftX, gy0 + gridSize + 18);

      // 中间箭头 + 关键点
      const midX = (leftX + gridSize + rightX) / 2;
      const midY = gy0 + gridSize / 2;
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(midX - 16, midY);
      ctx.lineTo(midX + 16, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX + 16, midY);
      ctx.lineTo(midX + 10, midY - 4);
      ctx.moveTo(midX + 16, midY);
      ctx.lineTo(midX + 10, midY + 4);
      ctx.stroke();
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#27446e';
      ctx.textAlign = 'center';
      ctx.fillText('每块只看', midX, midY - 26);
      ctx.fillText('本块 M 帧', midX, midY - 12);
      ctx.fillStyle = '#3a7d44';
      ctx.fillText(`M=${M} 固定`, midX, midY + 22);
      ctx.textAlign = 'left';

      // 底部读数
      const by = gy0 + gridSize + 40;
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#c43f52';
      const { cells: ck } = chunkCells(nn);
      ctx.fillText(`亮格 = N² = ${nn * nn}`, leftX, by);
      ctx.fillStyle = '#27446e';
      ctx.fillText(`亮格 = K·M² = ${ck}  ≈ N·M`, rightX - 8, by);
    };

    const tick = () => {
      stateRef.current.t += 1;
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

  const onN = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), N_MIN, N_MAX);
    stateRef.current.n = v;
    setN(v);
    const { cells: ck, blocks } = chunkCells(v);
    const K = blocks.length;
    setFeedback({
      text:
        `N=${v}：一次全局要算 N²=${v * v} 对；分块切成 ${K} 块（每块≤${M} 帧），` +
        `只算 ${K}×M²=${ck} 对——省约 ${(v * v / ck).toFixed(1)} 倍，且 N 越大差距越夸张。`,
      cls: v * v / ck >= 2 ? '' : 'bad',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          序列长度 N <span className="val">{n}</span>
        </label>
        <input type="range" min={N_MIN} max={N_MAX} value={n} onChange={onN} />
      </div>
      <div className="kpi-row">
        <span className="kpi red">一次全局 N² = {full}</span>
        <span className="kpi blue">分块 K·M² = {chunk}</span>
        <span className="kpi green">省 ≈ {ratio}×</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModWhyLinear;
