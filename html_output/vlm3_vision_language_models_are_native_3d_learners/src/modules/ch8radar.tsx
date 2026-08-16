import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 320;

/** 四轴：均已转为「越高越好」的 0–1 归一化得分（对应由 EPE 反转） */
const AXES = [
  { key: 'depth', label: '深度δ1', tip: '越高越好' },
  { key: 'object', label: '物体Acc', tip: '越高越好' },
  { key: 'corr', label: '对应质量', tip: '由 EPE 反转' },
  { key: 'pose', label: '位姿AUC', tip: '越高越好' },
] as const;

type AxisKey = (typeof AXES)[number]['key'];
type SeriesId = 'vlm' | 'vlm3' | 'expert';

interface SeriesDef {
  id: SeriesId;
  name: string;
  color: string;
  /** 原始指标；object 对专家为 null（Table 2 无同协议） */
  raw: Record<AxisKey, number | null>;
}

const EPE_REF = 160; // 归一化参考（≈ Table 1 基线 VLM 量级）

function epeToScore(epe: number): number {
  return Math.max(0, Math.min(1, 1 - epe / EPE_REF));
}

function toScores(raw: Record<AxisKey, number | null>): (number | null)[] {
  return AXES.map((ax) => {
    const v = raw[ax.key];
    if (v == null) return null;
    if (ax.key === 'depth') return Math.max(0, Math.min(1, v));
    if (ax.key === 'object') return Math.max(0, Math.min(1, v / 100));
    if (ax.key === 'corr') return epeToScore(v);
    return Math.max(0, Math.min(1, v / 100));
  });
}

const SERIES: SeriesDef[] = [
  {
    id: 'vlm',
    name: '其他 VLM',
    color: '#c43f52',
    raw: { depth: 0.838, object: 89.8, corr: 153.28, pose: 5.4 },
  },
  {
    id: 'vlm3',
    name: 'VLM3',
    color: '#228d5c',
    raw: { depth: 0.904, object: 91.35, corr: 15.37, pose: 94.0 },
  },
  {
    id: 'expert',
    name: '专家模型',
    color: '#27446e',
    // 物体：Table 2 无同协议 Overall；对应取 UFM，位姿取 DA3-Giant，深度取 UnidepthV2
    raw: { depth: 0.903, object: null, corr: 7.89, pose: 94.7 },
  },
];

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

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

const EXPLAIN_ALL =
  '读图：越靠外圈越好。VLM3 四轴较饱满——深度与物体已超其他 VLM，位姿逼近专家；短板在对应轴（仍落后 UFM）。其他 VLM 在对应/位姿上明显收缩；专家模型在深度·对应·位姿外扩，物体轴因 Table 2 无同协议数字未画点。';

const EXPLAIN: Record<SeriesId, string> = {
  vlm: '其他 VLM：深度尚可（如 DepthLM），但对应 EPE 很高、位姿 AUC 很低，雷达在「对应质量 / 位姿」两轴靠近圆心——说明未专项训练时多视图几何很弱。',
  vlm3: 'VLM3：四轴整体外推，形状最接近「全能」。深度 δ1≈0.90、物体 Acc 领先；位姿与专家几乎重合；对应质量已远超基线 VLM，但未到 UFM 外圈。',
  expert: '专家模型：深度（UnidepthV2）与位姿（DA3）贴近外圈，对应（UFM）最强。物体轴无 Table 2 同协议点，故专家多边形在该方向缺一角——对比时勿把缺口当成「物体差」。',
};

function explainVisible(vis: Record<SeriesId, boolean>): { text: string; cls: string } {
  const on = (SERIES.map((s) => s.id) as SeriesId[]).filter((id) => vis[id]);
  if (on.length === 3) {
    return { text: EXPLAIN_ALL, cls: 'good' };
  }
  if (on.length === 1) {
    return { text: EXPLAIN[on[0]], cls: on[0] === 'vlm3' ? 'good' : 'warn' };
  }
  // 两两对比
  const set = new Set(on);
  if (set.has('vlm') && set.has('vlm3')) {
    return {
      text: 'VLM3 vs 其他 VLM：绿圈几乎包住红圈。提升最大的是对应与位姿两轴——从「接近圆心」拉到外圈，体现文本 SFT + 数据配比让标准 VLM 学会细粒度多视图 3D。',
      cls: 'good',
    };
  }
  if (set.has('vlm3') && set.has('expert')) {
    return {
      text: 'VLM3 vs 专家：深度、位姿两轴几乎贴合，说明标准 VLM 可追平专家；对应轴专家（UFM）仍更靠外——这是当前边界。物体轴仅 VLM3 有点，专家缺测。',
      cls: 'warn',
    };
  }
  return {
    text: '其他 VLM vs 专家：差距主要在对应与位姿。专家雷达外扩，基线 VLM 内侧收缩——侧面说明「无任务特定设计的普通 VLM」默认并不具备专家级 3D 几何能力。',
    cls: 'warn',
  };
}

export const Ch8Radar: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleRef = useRef<Record<SeriesId, boolean>>({
    vlm: true,
    vlm3: true,
    expert: true,
  });
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(visibleRef.current);
  const [feedback, setFeedback] = useState(() => explainVisible(visibleRef.current));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cx = W / 2;
    const cy = 148;
    const R = 96;
    const n = AXES.length;
    const angle0 = -Math.PI / 2; // 顶轴开始

    const axisAngle = (i: number) => angle0 + (i * 2 * Math.PI) / n;

    const render = () => {
      const vis = visibleRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      textAt(ctx, '三者总览 · 雷达对比', 16, 16, C.text, 14, 'left', 'top');
      textAt(ctx, 'Table 1 / Table 2 代表值归一化', W - 16, 16, C.muted, 10, 'right', 'top');

      // grid rings
      for (let ring = 1; ring <= 4; ring++) {
        const r = (R * ring) / 4;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const p = polar(cx, cy, r, axisAngle(i));
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // axes + labels
      AXES.forEach((ax, i) => {
        const a = axisAngle(i);
        const tip = polar(cx, cy, R, a);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();

        const lab = polar(cx, cy, R + 22, a);
        textAt(ctx, ax.label, lab.x, lab.y, C.text, 12, 'center', 'middle');
      });

      // series polygons
      SERIES.forEach((s) => {
        if (!vis[s.id]) return;
        const scores = toScores(s.raw);
        const pts: { x: number; y: number; ok: boolean }[] = scores.map((sc, i) => {
          if (sc == null) return { x: cx, y: cy, ok: false };
          const p = polar(cx, cy, R * sc, axisAngle(i));
          return { x: p.x, y: p.y, ok: true };
        });

        // fill path connecting only valid points in order (skip null by not including radius)
        ctx.beginPath();
        let started = false;
        pts.forEach((p) => {
          if (!p.ok) return;
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        });
        if (started) {
          ctx.closePath();
          ctx.fillStyle = s.color + '33';
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2.2;
          ctx.fill();
          ctx.stroke();
        }

        pts.forEach((p) => {
          if (!p.ok) return;
          ctx.beginPath();
          ctx.fillStyle = s.color;
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // raw value strip under radar
      textAt(ctx, '代表值（归一化前）', 16, 262, C.muted, 10, 'left', 'top');
      SERIES.forEach((s, si) => {
        const y = 278 + si * 12;
        const depth = s.raw.depth?.toFixed(3) ?? '—';
        const obj = s.raw.object != null ? s.raw.object.toFixed(1) : '—';
        const epe = s.raw.corr != null ? s.raw.corr.toFixed(1) : '—';
        const pose = s.raw.pose != null ? s.raw.pose.toFixed(1) : '—';
        textAt(
          ctx,
          `${s.name}: δ1 ${depth} · Acc ${obj} · EPE ${epe} · AUC ${pose}`,
          16,
          y,
          vis[s.id] ? s.color : C.muted,
          10,
          'left',
          'top',
        );
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

  const toggle = (id: SeriesId) => {
    const next = { ...visibleRef.current, [id]: !visibleRef.current[id] };
    // 至少保留一条
    if (!Object.values(next).some(Boolean)) return;
    visibleRef.current = next;
    setVisible(next);
    setFeedback(explainVisible(next));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {SERIES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${visible[s.id] ? 'on' : ''}`}
            onClick={() => toggle(s.id)}
            style={visible[s.id] ? { borderColor: s.color } : undefined}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Radar;
