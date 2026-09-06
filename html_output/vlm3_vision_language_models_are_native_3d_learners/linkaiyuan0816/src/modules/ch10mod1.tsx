import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 280;

type Metric = 'depth' | 'object' | 'corr' | 'pose';
type GroupId = 'vlm' | 'vlm3' | 'expert';

interface BarItem {
  name: string;
  value: number;
  group: GroupId;
}

/** 同类模型用相近色；不同类用不同色系 */
const GROUP_COLORS: Record<GroupId, string[]> = {
  vlm: ['#c43f52', '#d97706', '#e8a070', '#b45309'],
  vlm3: ['#228d5c', '#34a574'],
  expert: ['#27446e', '#4a6fa5', '#7c3aed', '#5b8def'],
};

const GROUP_LABEL: Record<GroupId, string> = {
  vlm: '其他 VLM',
  vlm3: 'VLM3',
  expert: '专家模型',
};

/** 数值摘自论文 Table 1 / Table 2 平均值（或 Overall） */
const DATA: Record<Metric, {
  title: string;
  unit: string;
  higherBetter: boolean;
  source: string;
  note: string;
  items: BarItem[];
}> = {
  depth: {
    title: '度量深度 · 平均 δ1',
    unit: '越高越好',
    higherBetter: true,
    source: 'Table 1（VLM）/ Table 2（专家·五数据集均）',
    note: 'DepthLM-7B→VLM3-4B：0.838→0.904；专家侧 UnidepthV2 均≈0.90，与 VLM3 接近。',
    items: [
      { name: 'GPT-5', value: 0.370, group: 'vlm' },
      { name: 'Seed1.5', value: 0.400, group: 'vlm' },
      { name: 'DepthLM', value: 0.838, group: 'vlm' },
      { name: 'VLM3', value: 0.904, group: 'vlm3' },
      { name: 'DepthPro', value: 0.583, group: 'expert' },
      { name: 'UniV2', value: 0.903, group: 'expert' },
    ],
  },
  object: {
    title: '物体级 · 定性 Overall Acc',
    unit: '越高越好 · SpatialRGPT-Bench',
    higherBetter: true,
    source: 'Table 1 Overall Acc（定性）',
    note: '定性 Acc：SpatialRGPT-8B 89.80→VLM3 91.35；定量 Overall Acc/AbsRel 58.33/0.37→58.51/0.35（此处柱图仅定性）。',
    items: [
      { name: 'Qwen4B', value: 75.0, group: 'vlm' },
      { name: 'Qwen32B', value: 76.98, group: 'vlm' },
      { name: 'SRGPT', value: 89.80, group: 'vlm' },
      { name: 'VLM3', value: 91.35, group: 'vlm3' },
    ],
  },
  corr: {
    title: '像素对应 · 平均 EPE',
    unit: '越低越好（柱越高误差越大）',
    higherBetter: false,
    source: 'Table 1（VLM）/ Table 2（专家）',
    note: 'VLM 基线约 153→VLM3 15.37（降一个数量级）；优于 DKM/RoMa，仍落后 UFM 7.89。',
    items: [
      { name: 'Qwen4B', value: 153.28, group: 'vlm' },
      { name: 'Qwen32B', value: 160.27, group: 'vlm' },
      { name: 'VLM3', value: 15.37, group: 'vlm3' },
      { name: 'DKM', value: 41.30, group: 'expert' },
      { name: 'RoMa', value: 21.88, group: 'expert' },
      { name: 'UFM', value: 7.89, group: 'expert' },
    ],
  },
  pose: {
    title: '相机位姿 · 平均 AUC@30°',
    unit: '越高越好',
    higherBetter: true,
    source: 'Table 1（VLM）/ Table 2（专家）',
    note: '基线 VLM≈5–8 → VLM3 94.0，接近 DA3-Giant 94.7，超过 VGGT 88.0。',
    items: [
      { name: 'Qwen4B', value: 5.4, group: 'vlm' },
      { name: 'Qwen32B', value: 7.8, group: 'vlm' },
      { name: 'VLM3', value: 94.0, group: 'vlm3' },
      { name: 'MapAny', value: 80.8, group: 'expert' },
      { name: 'VGGT', value: 88.0, group: 'expert' },
      { name: 'DA3', value: 94.7, group: 'expert' },
    ],
  },
};

function colorOf(item: BarItem, indexInGroup: number): string {
  const palette = GROUP_COLORS[item.group];
  return palette[indexInGroup % palette.length];
}

function formatVal(v: number): string {
  if (v >= 100) return v.toFixed(0);
  if (v >= 10) return v.toFixed(1);
  if (v >= 1) return v.toFixed(1);
  return v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

/** VLM3 是否在该项展示结果中最优（EPE 越低越好，其余越高越好） */
function vlm3IsBest(m: Metric): boolean {
  const cfg = DATA[m];
  const ours = cfg.items.find((it) => it.group === 'vlm3');
  if (!ours) return false;
  if (cfg.higherBetter) {
    return cfg.items.every((it) => it.value <= ours.value);
  }
  return cfg.items.every((it) => it.value >= ours.value);
}

function feedbackCls(m: Metric): string {
  return vlm3IsBest(m) ? 'good' : 'warn';
}

/** 居中文字，画完恢复默认对齐，避免错位累积 */
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

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ metric: Metric }>({ metric: 'depth' });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('depth');
  const [feedback, setFeedback] = useState({
    text: DATA.depth.note,
    cls: feedbackCls('depth'),
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const m = stateRef.current.metric;
      const cfg = DATA[m];
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      textAt(ctx, cfg.title, 16, 18, C.text, 14, 'left', 'top');
      textAt(ctx, cfg.unit, 16, 38, C.muted, 11, 'left', 'top');
      textAt(ctx, cfg.source, W - 16, 18, C.muted, 10, 'right', 'top');

      const order: GroupId[] = [];
      cfg.items.forEach((it) => {
        if (!order.includes(it.group)) order.push(it.group);
      });

      const groups = order.map((g) => ({
        id: g,
        items: cfg.items.filter((it) => it.group === g),
      }));

      const barW = 40;
      const gapIn = 10;
      const gapGroup = 36;
      const totalBars = cfg.items.length;
      const totalW =
        totalBars * barW +
        (totalBars - groups.length) * gapIn +
        (groups.length - 1) * gapGroup;

      // 自上而下：柱 → 分组细线 → 模型名 → 分组名 → 图例（互不重叠）
      const chartTop = 52;
      const baseY = 176;
      const maxH = baseY - chartTop - 16;
      const ruleY = baseY + 5;       // 细横线紧贴柱底下方
      const nameY = baseY + 14;      // 模型名在细线之下
      const groupY = baseY + 36;     // 分组名再下移，避开细线
      const legendY = 262;

      let x = Math.max(20, (W - totalW) / 2);
      const maxV = Math.max(...cfg.items.map((it) => it.value));

      groups.forEach((g) => {
        const gStart = x;
        g.items.forEach((it, i) => {
          const t = maxV <= 0 ? 0 : it.value / maxV;
          const h = Math.max(6, t * maxH);
          const cx = x + barW / 2;

          ctx.fillStyle = colorOf(it, i);
          ctx.fillRect(x, baseY - h, barW, h);

          // 数值：贴在柱顶上方，避免落入柱内或压线
          textAt(ctx, formatVal(it.value), cx, baseY - h - 4, C.text, 11, 'center', 'bottom');
          // 模型名：细横线下方
          textAt(ctx, it.name, cx, nameY, C.text, 10, 'center', 'top');

          x += barW + gapIn;
        });
        x -= gapIn;
        const gEnd = x;
        const mid = (gStart + gEnd) / 2;

        // 分组细线：只画在柱底与模型名之间，不穿过文字
        ctx.strokeStyle = GROUP_COLORS[g.id][0];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gStart, ruleY);
        ctx.lineTo(gEnd, ruleY);
        ctx.stroke();

        textAt(ctx, GROUP_LABEL[g.id], mid, groupY, C.muted, 10, 'center', 'top');

        x += gapGroup;
      });

      // 图例：色块与文字垂直居中对齐
      let lx = 24;
      order.forEach((g) => {
        ctx.fillStyle = GROUP_COLORS[g][0];
        ctx.fillRect(lx, legendY - 6, 12, 12);
        textAt(ctx, GROUP_LABEL[g], lx + 18, legendY, C.text, 11, 'left', 'middle');
        lx += 110;
      });
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
  }, []);

  const pick = (m: Metric) => {
    stateRef.current.metric = m;
    setMetric(m);
    setFeedback({
      text: DATA[m].note,
      cls: feedbackCls(m),
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {([['depth', '深度δ1'], ['object', '物体Acc'], ['corr', '对应EPE'], ['pose', '位姿AUC']] as [Metric, string][]).map(([k, n]) => (
          <button
            key={k}
            type="button"
            className={`chip ${metric === k ? 'on' : ''}`}
            onClick={() => pick(k)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch10Mod1;
