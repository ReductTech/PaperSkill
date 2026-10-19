import React, { useState } from 'react';
import { C, useScene, txt, line, rr, dot, bar, ring, drawDesk } from './scene';

// 第7章：分阶段加人
// 一次一批：每按一次「再来一批」，座位多一排，两条记忆曲线继续走。

const W = 1000;
const H = 300;
const COLS = 4;
const ROWS = 4;
const PER = 4;

const OURS = [95, 92.5, 90.5, 88.5, 87];
const FT = [95, 84, 74, 65, 58];

export default function StageProgress() {
  const [batch, setBatch] = useState(1);

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // 座位区
    const sx0 = 60;
    const sy0 = 56;
    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = sx0 + col * 62;
      const y = sy0 + row * 56;
      const b = Math.floor(i / PER) + 1;
      if (b > batch) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        rr(ctx, x + 8, y + 20, 26, 12, 3);
        ctx.strokeStyle = C.floorLine;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
        continue;
      }
      const fresh = b === batch;
      drawDesk(ctx, x - 2, y + 30, 34, 12, fresh ? C.noviceChip : C.deskTop);
      // 学生
      dot(ctx, x + 15, y + 16, 6, C.skin);
      ctx.beginPath();
      ctx.arc(x + 15, y + 14, 6.2, Math.PI, 0);
      ctx.fillStyle = C.hair;
      ctx.fill();
      rr(ctx, x + 8, y + 22, 14, 12, 3);
      ctx.fillStyle = fresh ? C.novice : C.old;
      ctx.fill();
      if (fresh) ring(ctx, x + 15, y + 22, 16, C.orange, t);
    }

    // 曲线
    const gx = 560;
    const gy = 56;
    const gw = 380;
    const gh = 190;
    line(ctx, gx, gy + gh, gx + gw, gy + gh, C.line, 1.2);
    line(ctx, gx, gy, gx, gy + gh, C.line, 1.2);
    [50, 70, 90].forEach((v) => {
      const y = gy + gh - ((v - 40) / 60) * gh;
      line(ctx, gx - 4, y, gx, y, C.line, 1.2);
      txt(ctx, String(v), gx - 8, y + 4, 10, C.muted, 'right', 500);
    });
    const px = (i: number) => gx + (i / 4) * (gw - 10);
    const py = (v: number) => gy + gh - ((v - 40) / 60) * gh;

    // 整条曲线淡淡地铺出来，方便看出全程走势
    [OURS, FT].forEach((arr, idx) => {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = idx === 0 ? C.green : C.red;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      arr.forEach((v, i) => {
        const x = px(i);
        const y = py(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    });

    const plot = (arr: number[], color: string, w: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      for (let i = 0; i < batch; i++) {
        const x = px(i);
        const y = py(arr[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < batch; i++) dot(ctx, px(i), py(arr[i]), 3.6, color);
    };
    plot(FT, C.red, 2);
    plot(OURS, C.green, 2.4);

    // 当前批次标记
    const cx = px(batch - 1);
    line(ctx, cx, gy, cx, gy + gh, C.orange, 1.2, [4, 3]);
    ring(ctx, cx, py(OURS[batch - 1]), 9, C.green, t);
    ring(ctx, cx, py(FT[batch - 1]), 9, C.red, t);

    line(ctx, gx + gw - 96, gy + 12, gx + gw - 80, gy + 12, C.green, 2.4);
    txt(ctx, '本文', gx + gw - 74, gy + 16, 12, C.green, 'left', 700);
    line(ctx, gx + gw - 96, gy + 32, gx + gw - 80, gy + 32, C.red, 2.4);
    txt(ctx, '微调', gx + gw - 74, gy + 36, 12, C.red, 'left', 700);
    txt(ctx, '批次', gx + gw, gy + gh + 20, 11, C.muted, 'right', 500);
  });

  const acc = OURS[batch - 1];
  const base = FT[batch - 1];
  const fb =
    batch === 1
      ? { cls: '', text: '第一批：5 个类，两个方法都从同一个起点出发。点「再来一批」继续。' }
      : batch < 5
      ? {
          cls: '',
          text: `第 ${batch} 批：本文旧类还有 ${acc.toFixed(0)}%，纯微调只剩 ${base.toFixed(0)}%。差别是每批的侧分支都被重参数化收进主干，下一批不必从零再扩。`,
        }
      : {
          cls: 'good',
          text: `5 批跑完：本文旧类 ${acc.toFixed(0)}%，纯微调 ${base.toFixed(0)}%。批次越多，纯微调的曲线越陡，因为每次优化只盯着新类；本文每批都保住了旧座位。`,
        };

  return (
    <div>
      <canvas ref={ref} />
      <div className="ctrl">
        <button className="tiny" onClick={() => setBatch((v) => Math.min(5, v + 1))} disabled={batch === 5}>
          {batch === 5 ? '已跑完 5 批' : '再来一批 →'}
        </button>
        <button className="tiny ghost" onClick={() => setBatch(1)}>
          重置
        </button>
        <span style={{ color: C.muted }}>每格 1 排座位（示意）· ResNet-18 · Adam 1e-3 · 100 epoch</span>
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前批次</div>
          <div className="v">{batch} / 5</div>
        </div>
        <div className="metric">
          <div className="l">已见类别</div>
          <div className="v">{batch * 5}</div>
        </div>
        <div className="metric">
          <div className="l">旧类认对率（示意）</div>
          <div className="v" style={{ color: C.green }}>{acc.toFixed(0)}%</div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}
