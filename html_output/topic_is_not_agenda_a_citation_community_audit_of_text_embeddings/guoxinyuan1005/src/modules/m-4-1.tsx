import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 4.1：点击八个域之一（或「域均值」），看该域四个模型的 L1（细描边柱）与
// L2（实心红柱）同社区率，以及两级之间的落差。数值取自论文 Table 2。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', red: '#c43f52',
  green: '#228d5c', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

const MODELS = ['Gemini', 'Qwen3-8B', 'Qwen3-0.6B', 'SPECTER2'];
const DOMS: { name: string; full: string; l1: number[]; l2: number[] }[] = [
  { name: '生物', full: 'Biology', l1: [46.4, 46.7, 41.5, 38.7], l2: [18.0, 18.2, 15.1, 12.3] },
  { name: '生医', full: 'Biomedical', l1: [31.8, 31.9, 27.5, 25.8], l2: [11.5, 11.6, 9.4, 8.1] },
  { name: '化学', full: 'Chemistry', l1: [45.7, 44.7, 40.0, 36.2], l2: [14.6, 14.4, 11.5, 9.1] },
  { name: '计算', full: 'CS', l1: [57.9, 57.1, 53.8, 54.3], l2: [27.3, 27.8, 25.0, 23.4] },
  { name: '工程', full: 'Engineering', l1: [54.0, 53.2, 48.4, 45.5], l2: [19.2, 19.4, 16.3, 13.8] },
  { name: '环境', full: 'Env./Earth', l1: [58.6, 58.9, 55.3, 51.2], l2: [24.4, 24.4, 21.1, 17.5] },
  { name: '材料', full: 'Materials', l1: [57.0, 56.1, 50.3, 47.0], l2: [21.3, 20.8, 17.2, 14.5] },
  { name: '物理', full: 'Physics', l1: [68.1, 66.8, 61.4, 59.3], l2: [32.2, 32.2, 26.9, 22.6] },
];
const MEAN = { l1: [52.4, 51.9, 47.3, 44.7], l2: [21.0, 21.1, 17.8, 15.2] };

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ dom: 0 });
  const [dom, setDom] = useState(0);

  const cur = DOMS[dom];
  const l1 = cur.l1;
  const l2 = cur.l2;
  const drop = Math.round(avg(l1) - avg(l2));
  const domMeanL1 = Math.round(avg(l1));
  const domMeanL2 = Math.round(avg(l2));

  const fbText = (): string => {
    if (cur.full === 'Physics')
      return 'Physics 是最好的一域：L1 均值 <b>64%</b>、L2 只剩 <b>28%</b>（Gemini <b>32.2%</b>）——落差 <b>35</b> 个百分点，全表最大。';
    if (cur.full === 'Biomedical')
      return 'Biomedical 最差：L1 只有 <b>29%</b>、L2 掉到 <b>8–12%</b>；论文把机制解释为 inhibitor/receptor/pathway 这类高层词被不同议程反复复用。';
    if (cur.full === 'CS')
      return 'CS 介于两者之间：L2 <b>25–28%</b>；这里是唯一 SPECTER2（L1 <b>54.3%</b>）略高于 Qwen3-0.6B（<b>53.8%</b>）的格子。';
    return `${cur.full}：L1 均值 <b>${domMeanL1}%</b>、L2 只剩 <b>${domMeanL2}%</b>——落差 <b>${drop}</b> 个百分点；四个模型都没有例外。`;
  };

  const [fb, setFb] = useState({ text: fbText(), cls: 'bad' });

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

    const render = () => {
      const i = stateRef.current.dom;
      const d = DOMS[i];
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      // 左：八域方阵（点击热区，仅用色块与描边表示选中）
      const bx = 30;
      const by = 56;
      const bw = 88;
      const bh = 56;
      for (let n = 0; n < 8; n++) {
        const r = Math.floor(n / 4);
        const c = n % 4;
        const x = bx + c * 100;
        const y = by + r * 92;
        const sel = n === i;
        ctx.fillStyle = sel ? C.blue : 'rgba(39,68,110,0.06)';
        roundRect(ctx, x, y, bw, bh, 6);
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = sel ? 3.2 : 1.6;
        roundRect(ctx, x, y, bw, bh, 6);
        ctx.stroke();
        ctx.fillStyle = sel ? '#fff' : C.muted;
        ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(DOMS[n].name, x + bw / 2, y + bh / 2 + 5);
      }

      // 右：成对柱状
      const px = 470;
      const pw = 580;
      const axisY = 226;
      const topY = 54;
      const yv = (v: number) => axisY - (v / 80) * (axisY - topY);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      for (const g of [20, 40, 60, 80]) {
        ctx.beginPath();
        ctx.moveTo(px, yv(g));
        ctx.lineTo(px + pw, yv(g));
        ctx.stroke();
      }
      ctx.strokeStyle = C.muted;
      ctx.beginPath();
      ctx.moveTo(px, axisY);
      ctx.lineTo(px + pw, axisY);
      ctx.stroke();

      for (let m = 0; m < 4; m++) {
        const gx = px + 26 + m * 138;
        const b1 = gx;
        const b2 = gx + 50;
        // L1：细描边 + 浅填充
        ctx.fillStyle = 'rgba(39,68,110,0.14)';
        roundRect(ctx, b1, yv(d.l1[m]), 40, axisY - yv(d.l1[m]), 3);
        ctx.fill();
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.6;
        roundRect(ctx, b1, yv(d.l1[m]), 40, axisY - yv(d.l1[m]), 3);
        ctx.stroke();
        // L2：实心红
        ctx.fillStyle = C.red;
        roundRect(ctx, b2, yv(d.l2[m]), 40, axisY - yv(d.l2[m]), 3);
        ctx.fill();
        // 落差箭头
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 1.6;
        const ax = b2 + 52;
        ctx.beginPath();
        ctx.moveTo(ax, yv(d.l1[m]));
        ctx.lineTo(ax, yv(d.l2[m]));
        ctx.stroke();
        ctx.fillStyle = C.red;
        ctx.font = '700 13px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(String(Math.round(d.l1[m] - d.l2[m])), ax + 4, (yv(d.l1[m]) + yv(d.l2[m])) / 2 + 5);
      }

      ctx.fillStyle = C.text;
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('八域', 26, 30);
      ctx.fillText('同社区率%', px, 30);

      // 图例（2 项）
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      let lx = px + 150;
      const items = [
        { color: C.blue, outline: true, label: 'L1 子领域' },
        { color: C.red, outline: false, label: 'L2 议程' },
      ];
      for (const it of items) {
        if (it.outline) {
          ctx.fillStyle = 'rgba(39,68,110,0.14)';
          ctx.fillRect(lx, 18, 12, 12);
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 1.6;
          ctx.strokeRect(lx, 18, 12, 12);
        } else {
          ctx.fillStyle = it.color;
          ctx.fillRect(lx, 18, 12, 12);
        }
        ctx.fillStyle = C.muted;
        ctx.fillText(it.label, lx + 17, 28);
        lx += 17 + ctx.measureText(it.label).width + 16;
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

    // 画布点击热区：把点击位置映射到八个域方块
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      for (let n = 0; n < 8; n++) {
        const r = Math.floor(n / 4);
        const c = n % 4;
        const zx = 30 + c * 100;
        const zy = 56 + r * 92;
        if (x >= zx && x <= zx + 88 && y >= zy && y <= zy + 56) {
          pick(n);
          return;
        }
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      disconnect();
    };
  }, []);

  const pick = (n: number) => {
    stateRef.current.dom = n;
    setDom(n);
    setFb({ text: fbFor(n), cls: 'bad' });
  };

  const fbFor = (n: number) => {
    const d = DOMS[n];
    if (d.full === 'Physics')
      return 'Physics 是最好的一域：L1 均值 <b>64%</b>、L2 只剩 <b>28%</b>（Gemini <b>32.2%</b>）——落差 <b>35</b> 个百分点，全表最大。';
    if (d.full === 'Biomedical')
      return 'Biomedical 最差：L1 只有 <b>29%</b>、L2 掉到 <b>8–12%</b>；论文把机制解释为 inhibitor/receptor/pathway 这类高层词被不同议程反复复用。';
    if (d.full === 'CS')
      return 'CS 介于两者之间：L2 <b>25–28%</b>；这里是唯一 SPECTER2（L1 <b>54.3%</b>）略高于 Qwen3-0.6B（<b>53.8%</b>）的格子。';
    return `${d.full}：L1 均值 <b>${Math.round(avg(d.l1))}%</b>、L2 只剩 <b>${Math.round(avg(d.l2))}%</b>——落差 <b>${Math.round(avg(d.l1) - avg(d.l2))}</b> 个百分点；四个模型都没有例外。`;
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label={`${cur.full} 域四个模型的 L1/L2 top-10 同社区率，落差约 ${drop} 个百分点`}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        {DOMS.map((d, i) => (
          <button
            key={d.full}
            className={`chip ${dom === i ? 'selected' : ''}`}
            aria-pressed={dom === i}
            onClick={() => pick(i)}
          >
            {d.full}
          </button>
        ))}
      </div>
      <div className="metrics">
        {MODELS.map((m, i) => (
          <div className="metric" key={m}>
            <div className="l">{m}</div>
            <div className="v">
              {l1[i].toFixed(1)} / {l2[i].toFixed(1)}
            </div>
          </div>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default M41;
