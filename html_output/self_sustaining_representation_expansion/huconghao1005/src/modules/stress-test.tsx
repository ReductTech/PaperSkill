import React, { useState } from 'react';
import { C, useScene, txt, line, rr, dot, ring } from './scene';

// 第1章：新同学压力测试
// 拖批次滑块：座位一批批被填满，最早那几批开始变红（认错），右侧是旧类认对率的下滑示意。

const W = 1000;
const H = 300;
const COLS = 10;
const ROWS = 5;
const PER_BATCH = 5;

const SX = 52;
const SY = 56;
const CELL = 44;

function oldAcc(n: number) {
  const k = n - 1;
  return Math.max(34, 95 - 3.6 * k - 0.12 * k * k);
}
function newAcc(n: number) {
  return 94 - 0.9 * (n - 1);
}

// 固定的"会认错"座位序号（避免每帧随机跳动）
const ROT = Array.from({ length: COLS * ROWS }, (_, i) => ((i * 37 + 11) % 100) / 100);

export default function StressTest() {
  const [batch, setBatch] = useState(2);
  const [touched, setTouched] = useState(false);

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = SX + col * CELL;
      const y = SY + row * CELL;
      const b = Math.floor(i / PER_BATCH) + 1;
      if (b > batch) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        rr(ctx, x + 12, y + 14, 20, 12, 3);
        ctx.strokeStyle = C.floorLine;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
        continue;
      }
      const isNew = b === batch && batch > 1;
      const risk = (batch - b) / 6 + ROT[i] * 0.35;
      const wrong = !isNew && risk > 0.72;
      const shirt = isNew ? C.novice : wrong ? C.red : C.old;
      const cx = x + 22;
      const baseY = y + 34;
      dot(ctx, cx, baseY - 18, 5.4, C.skin);
      ctx.beginPath();
      ctx.arc(cx, baseY - 20, 5.6, Math.PI, 0);
      ctx.fillStyle = C.hair;
      ctx.fill();
      rr(ctx, cx - 6.5, baseY - 12, 13, 11, 3);
      ctx.fillStyle = shirt;
      ctx.fill();
      rr(ctx, cx - 15, baseY - 2, 30, 5, 2);
      ctx.fillStyle = isNew ? C.noviceChip : C.deskTop;
      ctx.fill();
      if (isNew) ring(ctx, cx, baseY - 12, 15, C.orange, t);
      if (wrong) txt(ctx, '?', cx + 9, baseY - 21, 11, C.red, 'center', 700);
    }

    txt(ctx, '老同学', SX, SY - 16, 13, C.old, 'left', 700);
    txt(ctx, '新同学', SX + 82, SY - 16, 13, C.novice, 'left', 700);

    const gx = 590;
    const gy = 70;
    const gw = 350;
    const gh = 160;
    line(ctx, gx, gy + gh, gx + gw, gy + gh, C.line, 1.2);
    line(ctx, gx, gy, gx, gy + gh, C.line, 1.2);
    for (let i = 0; i <= 4; i++) {
      const y = gy + gh - (i / 4) * gh;
      line(ctx, gx - 4, y, gx, y, C.line, 1.2);
      txt(ctx, String(i * 25), gx - 10, y + 4, 10, C.muted, 'right', 500);
    }
    const pts: [number, number][] = [];
    for (let n = 1; n <= 10; n++) {
      const x = gx + ((n - 1) / 9) * (gw - 10);
      const y = gy + gh - (oldAcc(n) / 100) * gh;
      pts.push([x, y]);
    }
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
    const cx2 = pts[batch - 1][0];
    const cy2 = pts[batch - 1][1];
    line(ctx, cx2, gy, cx2, gy + gh, C.orange, 1.4, [4, 3]);
    dot(ctx, cx2, cy2, 5, C.orange);
    ring(ctx, cx2, cy2, 10, C.orange, t);
    txt(ctx, '旧类认对率', gx, gy - 12, 13, C.muted, 'left', 600);
    txt(ctx, '批次', gx + gw, gy + gh + 20, 12, C.muted, 'right', 500);
  });

  const oa = oldAcc(batch);
  const na = newAcc(batch);
  const seen = batch * PER_BATCH;
  const fb =
    batch <= 3
      ? {
          cls: 'good',
          text: `只学了 ${seen} 个类：老同学的座位基本没被动过，旧类认对率还有 ${oa.toFixed(1)}%。`,
        }
      : batch <= 6
      ? {
          cls: '',
          text: `已经 ${batch} 批：最早那几批座位开始出现问号，旧类认对率掉到 ${oa.toFixed(1)}%——每加一批，前面攒下的错误还会被下一批继续放大。`,
        }
      : {
          cls: 'bad',
          text: `第 ${batch} 批：旧类认对率只剩 ${oa.toFixed(1)}%。没有旧样本兜底，只拿新类微调，遗忘是按批次累积的，越往后越救不回来。`,
        };

  return (
    <div>
      <canvas ref={ref} />
      <div className="ctrl">
        <label>
          已学批次 <span className="val">{batch}</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={batch}
          onChange={(e) => {
            setBatch(Number(e.target.value));
            setTouched(true);
          }}
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">已见类别</div>
          <div className="v">{seen}</div>
        </div>
        <div className="metric">
          <div className="l">旧类认对率（示意）</div>
          <div className="v" style={{ color: oa > 80 ? C.green : oa > 60 ? C.orange : C.red }}>
            {oa.toFixed(1)}%
          </div>
        </div>
        <div className="metric">
          <div className="l">刚学的新类认对率（示意）</div>
          <div className="v" style={{ color: C.green }}>
            {na.toFixed(1)}%
          </div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>
        {touched ? fb.text : '拖动滑块，一批一批往后加：变红的座位就是被认错的老同学。'}
      </div>
    </div>
  );
}
