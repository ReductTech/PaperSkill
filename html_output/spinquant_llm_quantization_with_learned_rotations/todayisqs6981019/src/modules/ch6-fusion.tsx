import React, { useRef, useState } from 'react';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, rrect, text } from './kit';

const W = 720;
const H = 260;
const DUR = 3000;

const COLS = [
  { x: 44, title: '运行时', color: C.blue, hasR: true },
  { x: 384, title: '融合后', color: C.green, hasR: false },
];
const COLW = 292;
const MIDY = 104;

// 列内管线：X → (R) → W1 → W2 → 输出读数
function stationX(col: { x: number }, i: number): number {
  return col.x + 16 + i * 78;
}

// ch6-fusion：P3 同步对比——两列共用同一时间基准，输出差恒 0
export const Ch6Fusion: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const t0 = useRef(0);
  const timer = useRef<number | null>(null);

  const start = () => {
    if (running) return;
    t0.current = performance.now();
    setDone(false);
    setRunning(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, DUR);
  };

  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    grid(ctx, 20, 16, 680, 168, 26);

    const p = running ? Math.min(1, (performance.now() - t0.current) / DUR) : done ? 1 : 0;

    for (const col of COLS) {
      // 列框
      ctx.strokeStyle = col.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.roundRect(col.x, 32, COLW, 146, 10);
      ctx.stroke();
      text(ctx, col.title, col.x + 12, 50, col.color, 14);

      // 管线
      const nSt = 3;
      for (let i = 0; i < nSt; i++) {
        const sx = stationX(col, i);
        const hot = col.hasR && i === 0;
        rrect(ctx, sx, MIDY - 17, 58, 34, C.white, col.color, 1.5, 7);
        text(ctx, hot ? 'X·R' : i === 1 ? 'W₁' : 'W₂', sx + 29, MIDY + 0.5, col.color, 13, 'center');
        if (i < nSt - 1) {
          ctx.strokeStyle = C.light;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx + 58, MIDY);
          ctx.lineTo(sx + 72, MIDY);
          ctx.stroke();
        }
      }
      text(ctx, '→', col.x + COLW - 22, MIDY + 0.5, C.muted, 15, 'center');

      // 运行时列的旋转徽标
      if (col.hasR) {
        const bx = col.x + 8;
        const by = MIDY - 46;
        ctx.strokeStyle = running ? C.orange : C.axis;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, by - 11, 34, 20, 5);
        ctx.stroke();
        text(ctx, 'R', bx + 17, by - 0.5, running ? C.orange : C.muted, 12, 'center');
      }

      // token 方块流（同相位）
      const x0 = col.x + 8;
      const x1 = col.x + COLW - 8;
      for (let i = 0; i < 6; i++) {
        const ph = (p * 2.2 + i * 0.17) % 1;
        const tx = x0 + (x1 - x0) * ph;
        if (p <= 0) break;
        const passR = col.hasR && Math.abs(tx - (col.x + 45)) < 10;
        ctx.fillStyle = passR ? C.orange : col.color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(tx - 6, MIDY - 44, 12, 12, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 输出读数（列内右下，避开 token 流与角标文字）
      text(ctx, '输出', col.x + COLW - 92, MIDY + 43, C.muted, 11, 'right');
      rrect(ctx, col.x + COLW - 84, MIDY + 30, 72, 26, C.white, C.axis, 1.5, 6);
      text(ctx, p > 0 ? '0.3187' : '—', col.x + COLW - 48, MIDY + 43, p > 0 ? col.color : C.muted, 13, 'center');
    }

    // 底部读数条
    rrect(ctx, 44, 196, 632, 52, C.white, C.axis, 1.5, 9);
    text(ctx, '输出差', 62, 214, C.muted, 12);
    text(ctx, p > 0 ? '0.000' : '—', 128, 214, p > 0 ? C.green : C.muted, 16);
    text(ctx, '延迟（相对）', 62, 234, C.muted, 12);
    const lw = 120 + (p > 0 ? 34 : 0);
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.roundRect(150, 228, Math.max(2, lw * (p > 0 ? 1 : 0)), 11, 4);
    ctx.fill();
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.roundRect(150 + lw + 14, 228, Math.max(2, 120 * (p > 0 ? 1 : 0)), 11, 4);
    ctx.fill();
    if (p > 0) {
      text(ctx, '左 +1 算子', 156 + lw, 222, C.blue, 11);
      text(ctx, '右列零新增', 164 + 2 * lw, 222, C.green, 11);
    }
    text(ctx, `t = ${(p * 3).toFixed(1)}s / 3s`, 660, 214, C.muted, 12, 'right');
    if (running) {
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(44, 196, 3 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  const fb = running
    ? { text: '两列同步运行，注意输出读数', cls: '' }
    : done
    ? { text: '输出差 0.000，右列少一个算子——融合零开销', cls: 'good' }
    : { text: '两列待命：左列入口多一个旋转节点，右列没有', cls: '' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" disabled={running} onClick={start}>
          {running ? '运行中…' : done ? '重播' : '同时启动'}
        </button>
        <span className="val">{running ? `${((performance.now() - t0.current) / 1000).toFixed(1)}s` : done ? '已完成' : '待启动'}</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <p className="sq-note">
        <b>读图方式：</b>两列 token 方块共用同一开始时间戳，右列只是把 R 预先乘进 W（W̃ = Rᵀ·W），
        输出与左列逐位相同。「融合后无新参数、无需改前向」来自论文 §3.1（html#S3.F5）；
        「融合发生在 QuantizeLinear.forward 运行时、eval 需 --rotate」为源码核实口径。
      </p>
    </div>
  );
};

export default Ch6Fusion;
