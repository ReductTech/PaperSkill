import React, { useRef, useState } from 'react';
import { C, useScene, txt, line, rr, dot, ring, bar, clamp, smooth, drawStudent, drawDesk } from './scene';

// 第3章：两种排座方案同时开跑
// 左：把整个班级重新排一遍（微调基线）；右：老座位冻结，只在后面加新座位（DSR）。

const W = 1000;
const H = 300;
const L = { x: 40, y: 46, w: 440, h: 200 };
const R = { x: 520, y: 46, w: 440, h: 200 };

function seatGrid(panel: { x: number; y: number; w: number; h: number }) {
  const out: [number, number][] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      out.push([panel.x + 52 + c * 78, panel.y + 58 + r * 58]);
    }
  }
  return out;
}
const LEFT_SEATS = seatGrid(L);
const RIGHT_SEATS = seatGrid(R);

export default function CompareMethods() {
  const startRef = useRef(0);
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle');
  const timer = useRef<number | null>(null);

  const run = () => {
    startRef.current = performance.now();
    setPhase('run');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase('done'), 3700);
  };

  const ref = useScene(W, H, (ctx, t) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    const p =
      phase === 'idle' ? 0 : clamp((performance.now() - startRef.current) / 3400, 0, 1);
    const e = smooth(p);

    // 两块面板
    [L, R].forEach((panel, i) => {
      rr(ctx, panel.x, panel.y, panel.w, panel.h, 8);
      ctx.fillStyle = '#fdfbf6';
      ctx.fill();
      ctx.strokeStyle = i === 0 ? 'rgba(196,63,82,0.35)' : 'rgba(34,141,92,0.4)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });
    txt(ctx, '重排全班', L.x + 16, L.y - 10, 13, C.red, 'left', 700);
    txt(ctx, '加新座位', R.x + 16, R.y - 10, 13, C.green, 'left', 700);

    // 左：老座位被挤乱
    LEFT_SEATS.forEach(([x, y], i) => {
      const ang = (i * 1.7 + 0.6) * Math.PI;
      const dx = Math.cos(ang) * 16 * e * (0.5 + (i % 3) * 0.3);
      const dy = Math.sin(ang) * 10 * e * (0.4 + (i % 4) * 0.25);
      const hurt = e > 0.45 && i % 3 !== 0;
      drawDesk(ctx, x + dx - 13, y + dy - 8, 26, 12, hurt ? '#e6c0c0' : C.deskTop);
      drawStudent(ctx, x + dx, y + dy, 15, hurt ? C.red : C.old, { mood: hurt ? -1 : 0 });
    });
    if (e > 0.5) {
      ctx.save();
      ctx.globalAlpha = (e - 0.5) * 1.6;
      line(ctx, L.x + 20, L.y + 150, L.x + L.w - 20, L.y + 120, C.red, 1.6, [6, 5]);
      ctx.restore();
    }

    // 右：老座位冻结 + 新座位
    RIGHT_SEATS.forEach(([x, y]) => {
      drawDesk(ctx, x - 13, y - 8, 26, 12);
      drawStudent(ctx, x, y, 15, C.old);
    });
    // 锁
    const lockX = R.x + 26;
    const lockY = R.y + 22;
    ctx.fillStyle = C.woodDark;
    rr(ctx, lockX, lockY, 12, 10, 2);
    ctx.fill();
    ctx.strokeStyle = C.woodDark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(lockX + 6, lockY, 4, Math.PI, 0);
    ctx.stroke();
    // 新座位出现在后排
    const add = clamp((e - 0.15) / 0.7, 0, 1);
    if (add > 0) {
      for (let i = 0; i < 3; i++) {
        const x = R.x + 300;
        const y = R.y + 58 + i * 58;
        ctx.save();
        ctx.globalAlpha = add;
        drawDesk(ctx, x - 15, y - 8, 30, 13, C.noviceChip);
        drawStudent(ctx, x, y, 15, C.green);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = add * 0.9;
      line(ctx, R.x + 232, R.y + 100, R.x + 286, R.y + 100, C.green, 1.8, [5, 4]);
      ctx.restore();
    }

    // 底部两条准确率指示
    const oldL = 88 - 36 * e;
    const oldR = 88 - 3 * e;
    const y0 = H - 34;
    txt(ctx, '旧类', L.x, y0 - 8, 12, C.muted, 'left', 600);
    bar(ctx, L.x + 34, y0 - 18, 3.0 * oldL, 10, oldL > 70 ? C.green : C.red);
    txt(ctx, oldL.toFixed(0) + '%', L.x + 40 + 3.0 * oldL, y0 - 8, 12, C.ink, 'left', 700);

    txt(ctx, '旧类', R.x, y0 - 8, 12, C.muted, 'left', 600);
    bar(ctx, R.x + 34, y0 - 18, 3.0 * oldR, 10, oldR > 70 ? C.green : C.red);
    txt(ctx, oldR.toFixed(0) + '%', R.x + 40 + 3.0 * oldR, y0 - 8, 12, C.ink, 'left', 700);

    if (phase === 'run') ring(ctx, L.x + L.w - 24, L.y + 20, 8, C.red, t);
  });

  const fb =
    phase === 'idle'
      ? { cls: '', text: '点「同时开始」，两边从同一批新同学、同一个起点开跑。' }
      : phase === 'run'
      ? { cls: '', text: '左边正在把全班重新排一遍；右边原座位锁死，只让新同学走侧分支……' }
      : {
          cls: 'good',
          text: '同样是学一批新同学：左图为了腾地方把老座位推乱了，旧类认对率掉到 52%；右图冻结主干、只加侧分支，老座位一个没动，旧类还留在 85%。论文选右边这条路。',
        };

  return (
    <div>
      <canvas ref={ref} />
      <div className="ctrl">
        <button className="tiny" onClick={run} disabled={phase === 'run'}>
          {phase === 'done' ? '再跑一次' : '同时开始'}
        </button>
        <button
          className="tiny ghost"
          onClick={() => {
            if (timer.current) window.clearTimeout(timer.current);
            setPhase('idle');
          }}
        >
          重置
        </button>
        <span style={{ color: C.muted }}>
          同样的新同学 · 同样的训练轮数 · 只是结构策略不同
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
}
