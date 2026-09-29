import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel, drawValueChip } from './potteryKit';
import type { WidgetProps } from './registry';

// Module 10.1 — 出窑评分板 (bar chips over one canvas). Four evidence
// panels; the parameter panel is annotated 规模·非优劣 (scale, not a quality
// ranking) to keep the direction honest. Numbers are the paper's verified
// values (3.3B / 7B / 0.093B, H=50 vs none, 50Hz vs 2-10Hz, all master tasks
// above half of the maximum score).
const W = 1080;
const H = 300;
const X0 = 244;
const BAR_MAX = 620;

interface EvRow {
  name: string;
  frac: number; // drawn bar fraction
  color: string;
  chip: string;
  chipColor?: string;
  note?: string;
}
interface EvPanel {
  chip: string;
  dir: string;
  outline: boolean; // outline the green winner bar
  hero?: boolean; // single thick bar with the 50% threshold
  rows: EvRow[];
  feedback: { text: string; cls: string };
}

const PANELS: EvPanel[] = [
  {
    chip: '参数构成',
    dir: '规模·非优劣',
    outline: false,
    rows: [
      { name: 'π0', frac: 3.3 / 7, color: C.green, chip: '3.3B', note: '3B 掌眼 + 300M 巧手' },
      { name: 'OpenVLA', frac: 1, color: C.red, chip: '7B', note: '自回归离散化' },
      { name: 'Octo', frac: 0.093 / 7, color: C.muted, chip: '0.093B', note: '93M' },
    ],
    feedback: {
      text: '3.3B = 3B 掌眼 + 300M 巧手：比 OpenVLA 的 7B 更小却更灵——但参数只示规模，不直接论优劣。',
      cls: '',
    },
  },
  {
    chip: '动作块长度',
    dir: '越长越好',
    outline: true,
    rows: [
      { name: 'π0', frac: 1, color: C.green, chip: '50', note: 'H=50·连续动作块' },
      { name: 'OpenVLA', frac: 0, color: C.red, chip: '无', note: '无动作块·高频难' },
    ],
    feedback: {
      text: 'H=50 一次拉出一整段连续动作；OpenVLA 自回归离散化、没有动作块——高频灵巧之痛。',
      cls: 'good',
    },
  },
  {
    chip: '控制频率',
    dir: '越高越好',
    outline: true,
    rows: [
      { name: 'π0 控制', frac: 1, color: C.green, chip: '50Hz', note: '开环执行' },
      { name: '开源数据', frac: 6 / 50, color: C.red, chip: '2-10Hz', note: 'OXE/Bridge/DROID' },
    ],
    feedback: {
      text: 'π0 把控制推到 50Hz；开源数据只有 2-10Hz——高频手法只能靠自有一万小时来补。',
      cls: 'good',
    },
  },
  {
    chip: '大师任务',
    dir: '均过最大分一半',
    outline: true,
    hero: true,
    rows: [
      { name: 'π0·完整配方', frac: 0.86, color: C.green, chip: '>50%', note: '七项全过半·全场最佳' },
    ],
    feedback: {
      text: '七项 5-20 分钟大师任务全部超过最大分一半（10 trials）——长程灵巧的门槛跨过去了。',
      cls: 'good',
    },
  },
];

export const Ch10Evidence: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef(0);
  const curRef = useRef<number[]>([]);
  const [panel, setPanel] = useState(0);
  const [fb, setFb] = useState(PANELS[0].feedback);

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

    const axisText = (
      text: string,
      x: number,
      y: number,
      opts?: { align?: CanvasTextAlign; color?: string; size?: number }
    ) => {
      ctx.save();
      ctx.fillStyle = opts?.color ?? C.text;
      ctx.font = `${opts?.size ?? 13}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = opts?.align ?? 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    const render = () => {
      const p = PANELS[panelRef.current];
      const cur = curRef.current;
      while (cur.length < p.rows.length) cur.push(0);
      cur.length = p.rows.length;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawSceneLabel(ctx, p.chip, 20, 26, { color: C.text });
      drawSceneLabel(ctx, p.dir, W - 20, 26, { color: C.muted, align: 'right' });

      const rowH = p.hero ? 110 : 56;
      const barH = p.hero ? 34 : 20;
      const y0 = 78;

      // the orange 50% threshold line for the master-task hero bar
      if (p.hero) {
        const tx = X0 + 0.5 * BAR_MAX;
        ctx.save();
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(tx, y0 - 18);
        ctx.lineTo(tx, y0 + barH + 10);
        ctx.stroke();
        ctx.restore();
        drawValueChip(ctx, tx, y0 - 30, '50%', C.orange);
      }

      p.rows.forEach((row, i) => {
        cur[i] += (row.frac - cur[i]) * 0.12;
        const rowY = y0 + i * rowH + barH / 2;
        const bw = Math.max(3, cur[i] * BAR_MAX);
        ctx.fillStyle = '#e8edf4';
        ctx.beginPath();
        ctx.roundRect(X0, rowY - barH / 2, BAR_MAX, barH, 5);
        ctx.fill();
        ctx.fillStyle = row.color;
        ctx.beginPath();
        ctx.roundRect(X0, rowY - barH / 2, bw, barH, 5);
        ctx.fill();
        if (p.outline && row.color === C.green) {
          ctx.strokeStyle = C.deep;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(X0, rowY - barH / 2, bw, barH, 5);
          ctx.stroke();
        }
        axisText(row.name, X0 - 14, rowY, { align: 'right' });
        drawValueChip(ctx, X0 + bw + 44, rowY, row.chip, row.chipColor ?? row.color);
        if (row.note) {
          ctx.save();
          ctx.globalAlpha = clamp(cur[i] * 2.4, 0, 1) * 0.95;
          axisText(row.note, X0 + bw + 96, rowY, { color: C.muted, size: 11 });
          ctx.restore();
        }
      });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number) => {
    panelRef.current = i;
    curRef.current = curRef.current.map(() => 0);
    setPanel(i);
    setFb(PANELS[i].feedback);
  };

  return (
    <div>
      <div className="chip-row">
        {PANELS.map((p, i) => (
          <button
            key={p.chip}
            className={`chip${i === panel ? ' selected' : ''}`}
            onClick={() => select(i)}
          >
            {p.chip}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch10Evidence;
