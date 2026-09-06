import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

type Item = { name: string; v: number; note: string; hi?: boolean };

function textAt(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'center',
  baseline: CanvasTextBaseline = 'middle',
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function AblationChart({
  chapterId,
  moduleId,
  title,
  subtitle,
  source,
  items,
  defaultIdx,
}: {
  chapterId: string;
  moduleId: string;
  title: string;
  subtitle: string;
  source: string;
  items: Item[];
  defaultIdx: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(defaultIdx);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(defaultIdx);
  const [feedback, setFeedback] = useState({
    text: items[defaultIdx].note,
    cls: items[defaultIdx].hi ? 'good' : 'warn',
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

    const render = () => {
      const active = selRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      textAt(ctx, title, 16, 12, C.text, 14, 'left', 'top');
      textAt(ctx, subtitle, 16, 32, C.muted, 11, 'left', 'top');
      textAt(ctx, source, W - 16, 12, C.muted, 10, 'right', 'top');

      const labelX = 16;
      const barX0 = 118;
      const maxBarW = 360;
      const chartTop = 58;
      const chartBottom = 210;
      const chartH = chartBottom - chartTop;
      const barH = Math.min(34, (chartH - 8) / items.length * 0.7);
      const gap = (chartH - items.length * barH) / Math.max(1, items.length + 1);
      let y = chartTop + gap;

      // 严谨比例：δ1∈[0,1]，柱长 ∝ 数值本身（从 0 起算）
      const scaleMax = 1;

      // 参考竖线（仅穿过柱区，刻度数字画在柱下方，避免与标题重叠）
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      for (const tick of [0, 0.25, 0.5, 0.75, 1.0]) {
        const tx = barX0 + tick * maxBarW;
        ctx.beginPath();
        ctx.moveTo(tx, chartTop);
        ctx.lineTo(tx, chartBottom);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 基线
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(barX0, chartBottom);
      ctx.lineTo(barX0 + maxBarW, chartBottom);
      ctx.stroke();

      items.forEach((it, i) => {
        const bw = Math.max(2, (it.v / scaleMax) * maxBarW);
        const cy = y + barH / 2;
        const on = i === active;

        textAt(ctx, it.name, labelX, cy, C.text, 12, 'left', 'middle');

        ctx.fillStyle = it.hi ? C.green : i === 0 ? C.red : C.orange;
        if (on) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(barX0 - 2, y - 2, bw + 4, barH + 4);
        } else {
          ctx.globalAlpha = 0.78;
        }
        ctx.fillRect(barX0, y, bw, barH);
        ctx.globalAlpha = 1;

        // 数值画在柱内右侧，避免与轴刻度抢位
        const valX = bw > 56 ? barX0 + bw - 6 : barX0 + bw + 8;
        const valAlign: CanvasTextAlign = bw > 56 ? 'right' : 'left';
        const valColor = bw > 56 ? '#fff' : C.text;
        textAt(ctx, it.v.toFixed(3), valX, cy, valColor, 11, valAlign, 'middle');
        y += barH + gap;
      });

      // 横轴刻度：紧贴柱区下方
      for (const tick of [0, 0.25, 0.5, 0.75, 1.0]) {
        const tx = barX0 + tick * maxBarW;
        textAt(ctx, tick.toFixed(2), tx, chartBottom + 4, C.muted, 10, 'center', 'top');
      }
      textAt(ctx, 'δ1 ↑（0→1 绝对值比例）', W / 2, 248, C.muted, 11, 'center', 'middle');
    };

    const tick = () => {
      render();
      canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const d = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      d();
    };
  }, [title, subtitle, source, items]);

  const pick = (i: number) => {
    selRef.current = i;
    setSel(i);
    const it = items[i];
    setFeedback({
      text: it.note,
      cls: it.hi ? 'good' : 'warn',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {items.map((it, i) => (
          <button
            key={it.name}
            type="button"
            className={`chip ${sel === i ? 'on' : ''}`}
            onClick={() => pick(i)}
          >
            {it.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
}

/** 9.1 文本像素引用 vs 视觉提示 */
export const Ch9Ref: React.FC<WidgetProps> = (props) => (
  <AblationChart
    {...props}
    title="消融①：文本像素引用"
    subtitle="同数据同模型（8M samples + 1 QA）· 指点方式能否简化？"
    source="Table 3 · Left"
    defaultIdx={1}
    items={[
      {
        name: '视觉提示',
        v: 0.849,
        note: 'DepthLM 式视觉标记：在图上渲染 marker。δ1=0.849。有效，但同图多问需复制多张图，难扩展到「输出也是像素」的任务。',
      },
      {
        name: '文本引用',
        v: 0.853,
        hi: true,
        note: 'VLM3 文本坐标 [0,2000)：δ1=0.853，与视觉提示相当甚至略优——说明指点可简化为纯文本，且更易同图打包多 QA。',
      },
    ]}
  />
);

/** 9.2 数据配比 */
export const Ch9Mix: React.FC<WidgetProps> = (props) => (
  <AblationChart
    {...props}
    title="消融②：数据配比"
    subtitle="32M samples + 10 QA · 多源混合时权重几乎决定上限"
    source="Table 3 · Mid"
    defaultIdx={2}
    items={[
      {
        name: '均匀',
        v: 0.842,
        note: '均匀权重：δ1=0.842，甚至差于更小规模的文本引用实验——盲目放大 + 均匀抽样会过拟合小/易学子集。',
      },
      {
        name: 'size-based',
        v: 0.884,
        note: '按数据集体量加权：δ1=0.884，是合理基线，说明「规模感知」的配比是放大训练的关键一步。',
      },
      {
        name: 'VLM3',
        v: 0.904,
        hi: true,
        note: 'VLM3 配比：进一步压低易过拟合小集权重，δ1=0.904。配比调优仍有很大空间，几乎决定性能上限。',
      },
    ]}
  />
);

/** 9.3 模型与数据规模：上→下按数据规模从小到大，同规模内按模型从小到大 */
export const Ch9Size: React.FC<WidgetProps> = (props) => (
  <AblationChart
    {...props}
    title="消融③：模型与数据规模"
    subtitle="更大模型未必更好；当前数据规模下 4B 可够用"
    source="Table 3 · Right"
    defaultIdx={0}
    items={[
      {
        name: '4B·32M',
        v: 0.904,
        hi: true,
        note: '4B @ 32M+10QA + VLM3 配比：δ1=0.904 最优。结论：在约千万级图像规模下，配比与数据质量优先于盲目放大模型。',
      },
      {
        name: '8B·32M',
        v: 0.880,
        note: '8B @ 32M+10QA：δ1=0.880，仍不及精心配比的 4B。放大参数不是此时的最优杠杆。',
      },
      {
        name: '32B·32M',
        v: 0.873,
        note: '32B @ 32M+10QA：δ1=0.873，低于 4B 同数据——更大模型在当前数据量下更易过拟合。',
      },
      {
        name: '4B·64M',
        v: 0.880,
        note: '4B 加长到 64M+10QA：δ1 反而降到 0.880——即便小模型，过长训练也会过拟合。',
      },
    ]}
  />
);

/** 兼容旧注册名（若仍被引用） */
export const Ch9Analysis = Ch9Ref;

export default Ch9Ref;
