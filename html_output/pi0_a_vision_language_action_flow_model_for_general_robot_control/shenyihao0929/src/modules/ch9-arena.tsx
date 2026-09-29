import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawPotter,
  drawWheel,
  drawLegend,
  drawSceneLabel,
  drawValueChip,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Module 9.1 — 三块比武牌 (P4: chips + horizontal bar panels).
// Three arenas, one canvas: 开箱五任务 / 语言跟随 / 微调新活. Bar heights are
// QUALITATIVE (示意) — only the verified orderings from the paper are drawn:
// π0 700k > parity 160k > baselines; π0-small also beats OpenVLA/Octo; π0 rises
// flat→human→HL while π0-small stays flat; pretrained π0 leads its own
// from-scratch version by up to 2×. Exact scores live in paper figures 7/9/11.
const W = 1080;
const H = 520;
const X0 = 244; // bar origin
const BAR_MAX = 620;
const ROW_H = 34;
const GROUP_H = 20;
const PI0_SOFT = 'rgba(34, 141, 92, 0.5)';

interface ArenaRow {
  name: string;
  val: number; // qualitative, 示意 only
  color: string;
  note?: string;
  group?: string;
  chip?: string;
}
interface ArenaPanel {
  chip: string;
  dir: string;
  rows: ArenaRow[];
  vignette?: 'arena' | 'listen';
  feedback: { text: string; cls: string };
}

const PANELS: ArenaPanel[] = [
  {
    chip: '开箱五任务',
    dir: '分数越高越好',
    vignette: 'arena',
    rows: [
      { name: 'π0 · 700k', val: 0.97, color: C.green, note: '全胜·两项近满分' },
      { name: 'π0 · 160k', val: 0.86, color: C.green, note: '算力对齐·仍全胜基线' },
      { name: 'π0-small', val: 0.82, color: PI0_SOFT, note: '470M 也胜基线' },
      { name: 'OpenVLA·UR5e', val: 0.34, color: C.red, note: '仅 UR5e 数据' },
      { name: 'OpenVLA', val: 0.27, color: C.red, note: '无动作块之痛' },
      { name: 'Octo', val: 0.21, color: C.red, note: '93M·容量小' },
    ],
    feedback: {
      text: '连只练 160k 步的算力对齐版都全胜——架构+流匹配的红利，不是靠熬步数。',
      cls: 'good',
    },
  },
  {
    chip: '语言跟随',
    dir: '分数越高越好',
    vignette: 'listen',
    rows: [
      { name: 'π0', val: 0.6, color: C.green, group: 'flat' },
      { name: 'π0-small', val: 0.38, color: PI0_SOFT, group: 'flat' },
      { name: 'π0', val: 0.72, color: C.green, group: 'human', note: '中步指令加分' },
      { name: 'π0-small', val: 0.4, color: PI0_SOFT, group: 'human' },
      { name: 'π0', val: 0.84, color: C.green, group: 'HL', note: '掌眼拆单再加分' },
      { name: 'π0-small', val: 0.4, color: PI0_SOFT, group: 'HL', note: '高层无益' },
    ],
    feedback: {
      text: '掌眼的价值：π0 从 flat 到 human 再到 HL 逐档上行；π0-small 语言太弱，高层指导几乎不得益。',
      cls: '',
    },
  },
  {
    chip: '微调新活',
    dir: '分数越高越好',
    rows: [
      { name: 'π0 预训练', val: 0.62, color: C.green, group: '1 小时', chip: '至2×' },
      { name: 'π0 从零', val: 0.34, color: PI0_SOFT, group: '1 小时' },
      { name: 'π0 预训练', val: 0.74, color: C.green, group: '5 小时' },
      { name: 'π0 从零', val: 0.46, color: PI0_SOFT, group: '5 小时' },
      { name: 'π0 预训练', val: 0.84, color: C.green, group: '10 小时' },
      { name: 'π0 从零', val: 0.58, color: PI0_SOFT, group: '10 小时' },
      { name: 'ACT', val: 0.3, color: C.red, group: '基线', note: '从零训练' },
      { name: 'DP', val: 0.22, color: C.red, group: '基线', note: '从零训练' },
      { name: 'OpenVLA', val: 0.18, color: C.red, group: '基线', note: '微调公版' },
      { name: 'Octo', val: 0.14, color: C.red, group: '基线', note: '微调公版' },
    ],
    feedback: {
      text: '一小时数据也领先：预训练起步的 π0 常胜自身从零版最多 2×，越接近预训练数据收益越大。',
      cls: 'good',
    },
  },
];

export const Ch9Arena: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (ms: number) => {
      const p = PANELS[panelRef.current];
      const cur = curRef.current;
      while (cur.length < p.rows.length) cur.push(0);
      cur.length = p.rows.length;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      drawSceneLabel(ctx, p.chip, 20, 26, { color: C.text });
      drawSceneLabel(ctx, p.dir, W - 20, 26, { color: C.muted, align: 'right' });

      let y = 58;
      let prevGroup: string | undefined;
      p.rows.forEach((row, i) => {
        if (row.group && row.group !== prevGroup) {
          axisText(row.group, X0, y + 1, { color: C.muted, size: 12 });
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(X0, y + 10);
          ctx.lineTo(X0 + BAR_MAX, y + 10);
          ctx.stroke();
          y += GROUP_H;
        }
        prevGroup = row.group;
        const rowY = y + ROW_H / 2 - 4;
        cur[i] += (row.val - cur[i]) * 0.12;
        const bw = Math.max(2, cur[i] * BAR_MAX);
        // track
        ctx.fillStyle = '#e8edf4';
        ctx.beginPath();
        ctx.roundRect(X0, rowY - 9, BAR_MAX, 18, 4);
        ctx.fill();
        // bar
        ctx.fillStyle = row.color;
        ctx.beginPath();
        ctx.roundRect(X0, rowY - 9, bw, 18, 4);
        ctx.fill();
        if (row.color === C.green) {
          ctx.strokeStyle = C.deep;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.roundRect(X0, rowY - 9, bw, 18, 4);
          ctx.stroke();
        }
        // method name on the axis
        axisText(row.name, X0 - 14, rowY, { align: 'right' });
        // short note after the bar end, fading in
        if (row.note) {
          ctx.save();
          ctx.globalAlpha = clamp(cur[i] * 2.2, 0, 1) * 0.95;
          axisText(row.note, X0 + bw + 12, rowY, { color: C.muted, size: 11 });
          ctx.restore();
        }
        if (row.chip) {
          drawValueChip(ctx, X0 + bw + 72, rowY, row.chip, C.orange);
        }
        y += ROW_H;
      });

      // decorative studio corner when there is room (开箱 / 语言 panels)
      if (p.vignette && y < H - 130) {
        drawWheel(ctx, W - 118, H - 92, 36, { spin: ms / 520 });
        drawPotter(ctx, W - 186, H - 34, 1.4, {
          mode: p.vignette === 'listen' ? 'eye' : 'shape',
          t: ms / 420,
        });
      }
      drawLegend(
        ctx,
        [
          ['π0 系', C.green],
          ['基线', C.red],
        ],
        20,
        H - 16
      );
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
      <div className="step-desc">
        归一化任务进度 · 10 episodes/trials · 柱高为示意，结论以论文图 7/9/11 为准
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch9Arena;
