import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.1：同一批余弦邻居，换一把尺子就换一个结论。
// L1 尺子（子领域）下 10 篇全算同社区；L2 尺子（议程）下只剩 1 篇。
// 例子取自论文 Appendix D：Herbig Ae/Be 前主序星里，UV 光谱 / X 射线 / Brackett 近红外 /
// 干涉是四条互不重叠的议程，但它们共处同一个 L1 子领域。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', purple: '#7c3aed', border: '#d7deea',
  text: '#21324a', muted: '#68778f', empty: '#c8d2e0',
};

const N = 10;
// L2 判定：10 篇邻居里只有 1 篇与查询处在同一条议程（论文 Appendix D 的 Physics 例）。
const L2_SAME = [true, false, false, false, false, false, false, false, false, false];

const MODES = [
  {
    name: 'L1 子领域尺子',
    hit: 10,
    fb: '按 <b>L1 子领域</b>判：10 篇邻居全都在 Herbig Ae/Be 这个子领域里——<b>10/10</b> 看着毫无问题。',
    cls: 'good' as const,
  },
  {
    name: 'L2 议程尺子',
    hit: 1,
    fb: '按 <b>L2 议程</b>判：10 篇里只有 <b>1</b> 篇真在 UV 光谱这条议程上——连最近的邻居都不保险。',
    cls: 'bad' as const,
  },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string, on: boolean) {
  ctx.font = '700 14px "Segoe UI", "Microsoft YaHei", sans-serif';
  const w = ctx.measureText(label).width + 20;
  ctx.globalAlpha = on ? 1 : 0.34;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 10, y + 19);
  ctx.globalAlpha = 1;
  return w;
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: { color: string; label: string }[]) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 9, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 15, y);
    cx += 15 + ctx.measureText(it.label).width + 18;
  }
}

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 0, revealStart: 0 });
  const [mode, setMode] = useState(0);
  const [fb, setFb] = useState({ text: MODES[0].fb, cls: MODES[0].cls as string });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    stateRef.current.revealStart = t0;

    const render = (now: number) => {
      const s = stateRef.current;
      const reveal = clamp((now - s.revealStart) / 760, 0, 1);
      const shown = Math.round(reveal * N);
      const onL1 = s.mode === 0;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // ---- 顶部：10 篇邻居同处一个子领域 ----
      const x0 = 24;
      const cw = 84;
      const gap = 16;
      const yC = 62;
      const ch = 96;

      ctx.textAlign = 'left';
      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('余弦邻居', x0, 30);

      // 括号：全部落在同一个 L1 子领域
      const braceY = 42;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x0 + 4, braceY + 8);
      ctx.lineTo(x0 + 4, braceY);
      ctx.lineTo(x0 + N * cw + (N - 1) * gap - 4, braceY);
      ctx.lineTo(x0 + N * cw + (N - 1) * gap - 4, braceY + 8);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = '600 12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('同一子领域', x0 + 4, braceY - 4);

      // ---- 10 张邻居卡 ----
      for (let i = 0; i < N; i++) {
        const x = x0 + i * (cw + gap);
        const revealed = i < shown;
        const same = onL1 ? true : L2_SAME[i];
        const face = !revealed ? C.empty : same ? C.green : C.red;
        ctx.globalAlpha = revealed ? 1 : 0.5;
        ctx.fillStyle = face;
        roundRect(ctx, x, yC, cw, ch, 4);
        ctx.fill();
        if (revealed) {
          // 卡面留一条白脊线，避免纯色块
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(x + 10, yC + 12, cw - 20, 5);
          ctx.fillRect(x + 10, yC + 24, cw - 34, 5);
        }
        ctx.globalAlpha = 1;
      }

      // 扫描尺（唯一运动主体）
      const rx = x0 + reveal * (N * cw + (N - 1) * gap);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(rx, yC - 10);
      ctx.lineTo(rx, yC + ch + 10);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      for (let n = 0; n < 6; n++) {
        const ty = yC + 4 + n * 18;
        ctx.beginPath();
        ctx.moveTo(rx - 6, ty);
        ctx.lineTo(rx + 6, ty);
        ctx.stroke();
      }

      // ---- 两把尺子的读数 ----
      let cx = x0;
      cx += chip(ctx, cx, 180, 'L1 10/10', C.green, onL1) + 12;
      chip(ctx, cx, 180, 'L2 1/10', C.red, !onL1);

      drawLegend(ctx, x0, 244, [
        { color: C.green, label: '同社区' },
        { color: C.red, label: '不同社区' },
      ]);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    );
    return () => {
      if (raf) cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  const go = (n: number) => {
    stateRef.current.mode = n;
    stateRef.current.revealStart = performance.now();
    setMode(n);
    setFb({ text: MODES[n].fb, cls: MODES[n].cls });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label={`同一批 10 篇余弦邻居：按 L1 子领域判有 10 篇同社区，按 L2 议程判只剩 1 篇`}
      />
      <div className="step-ctrl">
        {MODES.map((m, i) => (
          <button key={m.name} className={i === mode ? 'tiny' : 'tiny ghost'} onClick={() => go(i)}>
            {m.name}
          </button>
        ))}
      </div>
      <div className="step-desc">
        这批邻居出自论文 Appendix D 的实测例子：查询是 Herbig Ae/Be 前主序星的 UV 光谱研究，
        10 篇邻居全都是 Herbig Ae/Be 论文，但另外 9 篇分别落在 X 射线、Brackett 近红外、干涉与 SED 建模四条议程上。
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M11;
