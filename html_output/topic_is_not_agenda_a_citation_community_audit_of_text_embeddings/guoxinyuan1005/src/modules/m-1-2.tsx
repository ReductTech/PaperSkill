import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.2：拖动「邻居排名 k」滑块，看抽出的 k 册邻居书里有几册与查询同议程，
// 右侧内嵌论文报告的 L2 同率三点（36–44% / 15–21% / 5–9%）与 L1 曲线作对照。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', shelf: '#92400e', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', purple: '#7c3aed', border: '#d7deea',
  text: '#21324a', muted: '#68778f',
};

const K = [2, 10, 100];
const HIT = [0.4, 0.19, 0.07];
const HIT_TEXT = ['36–44%', '15–21%', '5–9%'];
// 论文报告的 L1 同率锚点（k=2 时 61–68%，k=10 时四模型均值 44.7–52.4%）；k=100 段论文未给正文数值，仅作平滑过渡。
const L1 = [0.645, 0.485, 0.3];

const FB = [
  { text: '最近的这一篇也有 <b>56–64%</b> 的概率不在同一议程——连第一名都不保险。', cls: 'bad' },
  { text: '10 篇里只有 <b>1.9</b> 篇同一议程（<b>15–21%</b>）：每 10 篇有 8 篇离题。', cls: 'bad' },
  { text: '拉深到 100 篇只剩 <b>5–9%</b>：加深检索只会更散，问题不在排序深度。', cls: 'bad' },
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

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: { color: string; label: string; line?: boolean }[]) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const it of items) {
    if (it.line) {
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx, y - 3);
      ctx.lineTo(cx + 11, y - 3);
      ctx.stroke();
    } else {
      ctx.fillStyle = it.color;
      ctx.fillRect(cx, y - 8, 10, 10);
    }
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 16, y + 1);
    cx += 16 + ctx.measureText(it.label).width + 16;
  }
}

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ kIdx: 1 });
  const [kIdx, setKIdx] = useState(1);
  const [fb, setFb] = useState({ text: FB[1].text, cls: FB[1].cls });

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

    const render = (now: number) => {
      const s = stateRef.current;
      const i = s.kIdx;
      const k = K[i];
      const hit = HIT[i];
      const count = Math.max(1, Math.round(k * hit));

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // ---- 左区：抽样条带 ----
      const yBase = 232;
      ctx.strokeStyle = C.shelf;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(24, yBase + 2);
      ctx.lineTo(630, yBase + 2);
      ctx.stroke();

      const qw = 22;
      const qh = 96;
      ctx.fillStyle = C.blue;
      roundRect(ctx, 40, yBase - qh, qw, qh, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(40 + qw / 2 - 3, yBase - qh + 8, 6, 11);

      if (i === 2) {
        // k=100：100 根细线
        const lw = 2;
        const lg = 2.4;
        for (let n = 0; n < 100; n++) {
          const x = 150 + n * (lw + lg);
          ctx.fillStyle = n < count ? C.green : C.red;
          ctx.fillRect(x, yBase - 78, lw, 78);
        }
      } else {
        const bw = i === 0 ? 44 : 22;
        const gap = i === 0 ? 24 : 14;
        const x0 = 160;
        for (let n = 0; n < k; n++) {
          const x = x0 + n * (bw + gap);
          ctx.fillStyle = n < count ? C.green : C.red;
          roundRect(ctx, x, yBase - 82, bw, 82, 3);
          ctx.fill();
        }
      }

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('抽样条带', 24, 30);

      // ---- 右区：L2 / L1 曲线内嵌 ----
      const px = 676;
      const py = 44;
      const pw = 372;
      const ph = 196;
      ctx.fillStyle = '#fff';
      roundRect(ctx, px, py, pw, ph, 6);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.6;
      roundRect(ctx, px, py, pw, ph, 6);
      ctx.stroke();

      const axisY = py + ph - 26;
      const pxk = (kk: number) => px + 34 + ((Math.log10(kk) - Math.log10(2)) / (2 - Math.log10(2))) * (pw - 66);
      const pyv = (v: number) => axisY - clamp(v, 0, 0.7) / 0.7 * (ph - 48);

      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      for (const g of [0.2, 0.4, 0.6]) {
        ctx.beginPath();
        ctx.moveTo(px + 30, pyv(g));
        ctx.lineTo(px + pw - 16, pyv(g));
        ctx.stroke();
      }
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(px + 30, axisY);
      ctx.lineTo(px + pw - 16, axisY);
      ctx.stroke();
      ctx.font = '11px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.muted;
      for (const kk of K) {
        ctx.textAlign = 'center';
        ctx.fillText(String(kk), pxk(kk), axisY + 15);
      }

      const pts = (vals: number[]) => vals.map((v, idx) => ({ x: pxk(K[idx]), y: pyv(v) }));
      // L1（粗虚线）
      const p1 = pts(L1);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(p1[0].x, p1[0].y);
      for (let n = 1; n < p1.length; n++) {
        const a = p1[n - 1];
        const b = p1[n];
        ctx.bezierCurveTo(a.x + 40, a.y, b.x - 40, b.y, b.x, b.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // L2（实线）
      const p2 = pts(HIT);
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(p2[0].x, p2[0].y);
      for (let n = 1; n < p2.length; n++) {
        const a = p2[n - 1];
        const b = p2[n];
        ctx.bezierCurveTo(a.x + 40, a.y, b.x - 40, b.y, b.x, b.y);
      }
      ctx.stroke();

      // 当前 k 竖线 + 圆点
      const cx = pxk(k);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, py + 14);
      ctx.lineTo(cx, axisY);
      ctx.stroke();
      ctx.setLineDash([]);
      const pulse = 1 + 0.12 * Math.sin((now - t0) / 320);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(cx, pyv(hit), 6 * pulse, 0, Math.PI * 2);
      ctx.fill();
      // L1 只在论文给出正文数值的两档画点（k=2、k=10）；k=100 段论文未报数，曲线仅作过渡。
      if (i < 2) {
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(cx, pyv(L1[i]), 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 数值胶囊：裸数字
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.6;
      roundRect(ctx, px + 20, py + 12, 96, 30, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.red;
      ctx.font = '700 15px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(count + '/' + k, px + 68, py + 33);

      ctx.textAlign = 'left';
      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('L2 同率', px + 130, py + 32);
      drawLegend(ctx, px + 130, py + ph - 12, [
        { color: C.green, label: '同议程' },
        { color: C.red, label: '不同议程' },
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const i = clamp(Number(e.target.value), 0, 2);
    stateRef.current.kIdx = i;
    setKIdx(i);
    setFb({ text: FB[i].text, cls: FB[i].cls });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label={`当前查看前 ${K[kIdx]} 名邻居，其中约 ${Math.max(1, Math.round(K[kIdx] * HIT[kIdx]))} 篇与查询同议程（${HIT_TEXT[kIdx]}）`}
      />
      <div className="ctrl">
        <label>
          邻居排名 k<span className="val">{K[kIdx]}</span>
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={kIdx}
          onChange={onChange}
          aria-label="邻居排名 k，三档：2、10、100"
        />
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M12;
