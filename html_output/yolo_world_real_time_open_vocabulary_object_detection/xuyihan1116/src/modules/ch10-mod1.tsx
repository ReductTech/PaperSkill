import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { COLORS, clearScene, drawLabel, drawLegend, useCanvas, clamp } from '../lib/classKit';

// Module 10.1 — results on three fronts.
// One dominant operation: pick a benchmark chip, then press 开始比较; two bars run from
// the same start line. The table repeats the verified numbers; the .hotspot-info panel
// carries the three boundary notes that must be read with them.

const W = 1080;
const H = 280;

type Bench = 'lvis' | 'coco' | 'encoder';

interface Res {
  ours: number;
  rival: number;
  max: number;
  label: string;
}

const RES: Record<Bench, Res> = {
  lvis: { ours: 35.4, rival: 25.6, max: 45, label: 'LVIS 零样本 AP（本方法 L vs Grounding DINO-T）' },
  coco: { ours: 44.4, rival: 42.8, max: 55, label: 'COCO 零样本 AP（L 型号 vs M 型号）' },
  encoder: { ours: 22.4, rival: 18.3, max: 30, label: 'LVIS 零样本 AP（CLIP 冻结 vs BERT 微调）' },
};

const BENCHES: Array<{ id: Bench; text: string }> = [
  { id: 'lvis', text: 'LVIS' },
  { id: 'coco', text: 'COCO' },
  { id: 'encoder', text: '编码器' },
];

const X0 = 76;
const TRACK_W = 860;
const BAR_H = 34;
const ROWS = [
  { y: 96, key: 'ours' as const },
  { y: 160, key: 'rival' as const },
];

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [bench, setBench] = useState<Bench>('lvis');
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const stateRef = useRef<{ bench: Bench; startedAt: number }>({ bench: 'lvis', startedAt: 0 });

  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setTimeout(() => setPhase('done'), 2050);
    return () => window.clearTimeout(id);
  }, [phase]);

  const draw = (
    ctx: CanvasRenderingContext2D,
    time: number,
    s: { bench: Bench; startedAt: number }
  ): void => {
    clearScene(ctx, W, H);
    const res = RES[s.bench];
    const p = s.startedAt > 0 ? clamp((time - s.startedAt) / 2000, 0, 1) : 0;
    const eased = 1 - Math.pow(1 - p, 3);

    // the single axis both bars run on
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X0, 78);
    ctx.lineTo(X0, 214);
    ctx.stroke();
    for (let i = 0; i <= 2; i += 1) {
      const tx = X0 + (TRACK_W / 2) * i;
      ctx.beginPath();
      ctx.moveTo(tx, 208);
      ctx.lineTo(tx, 218);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < ROWS.length; i += 1) {
      const row = ROWS[i];
      const value = row.key === 'ours' ? res.ours : res.rival;
      const full = TRACK_W * (value / res.max);
      const len = full * eased;

      // empty track
      ctx.save();
      ctx.strokeStyle = COLORS.axis;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(X0, row.y, TRACK_W, BAR_H);
      ctx.restore();

      // the bar
      ctx.beginPath();
      ctx.rect(X0, row.y, Math.max(0, len), BAR_H);
      ctx.fillStyle = row.key === 'ours' ? COLORS.fast : COLORS.muted;
      ctx.fill();

      // lead marker only when this method really is ahead
      const lead = eased >= 0.999 && res.ours > res.rival;
      if (row.key === 'ours' && lead) {
        const ex = X0 + len;
        ctx.save();
        ctx.strokeStyle = COLORS.book;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex + 6, row.y + BAR_H / 2 - 7);
        ctx.lineTo(ex + 14, row.y + BAR_H / 2);
        ctx.lineTo(ex + 6, row.y + BAR_H / 2 + 7);
        ctx.stroke();
        ctx.restore();
      }

      if (eased >= 0.999) {
        const offset = row.key === 'ours' && lead ? 22 : 10;
        drawLabel(ctx, value.toFixed(1), X0 + len + offset, row.y + BAR_H / 2 + 6, {
          color: row.key === 'ours' ? COLORS.fast : COLORS.chalkDim,
          size: 16,
        });
      }
    }

    drawLegend(ctx, X0, 250, [
      { color: COLORS.fast, text: '本方法' },
      { color: COLORS.muted, text: '对照' },
      { color: COLORS.book, text: '领先' },
    ]);
  };

  const { ref } = useCanvas<{ bench: Bench; startedAt: number }>(draw, W, H, stateRef);

  const pick = (b: Bench): void => {
    if (b === bench) return;
    stateRef.current.bench = b;
    stateRef.current.startedAt = 0;
    setBench(b);
    setPhase('idle');
  };

  const start = (): void => {
    if (phase === 'running') return;
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stateRef.current.bench = bench;
    stateRef.current.startedAt = reduce ? performance.now() - 3000 : performance.now();
    setPhase(reduce ? 'done' : 'running');
  };

  const res = RES[bench];
  const fb =
    phase === 'idle'
      ? { text: '选一组结果，按下开始。', cls: '' }
      : phase === 'running'
      ? { text: '开始比较：两条从同一起点出发，谁先到谁就领先。', cls: '' }
      : { text: `${res.label}：本方法 ${res.ours}，对照 ${res.rival}。`, cls: 'good' };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        aria-label="选择基准后按下开始比较，两条结果条从同一起点跑出"
      />
      <div className="ctrl">
        {BENCHES.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`chip${bench === b.id ? ' selected' : ''}`}
            onClick={() => pick(b.id)}
          >
            {b.text}
          </button>
        ))}
        <button type="button" className="tiny" onClick={start} disabled={phase === 'running'}>
          开始比较
        </button>
        <span className="val">
          本方法 {res.ours} / 对照 {res.rival}
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <table className="paper">
        <thead>
          <tr>
            <th>基准</th>
            <th>本方法</th>
            <th>对照</th>
            <th>口径</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>LVIS 零样本 AP</td>
            <td>35.4</td>
            <td>25.6</td>
            <td>L 型号 vs Grounding DINO-T（V100，无 TensorRT）</td>
          </tr>
          <tr>
            <td>COCO 零样本 AP</td>
            <td>44.4</td>
            <td>42.8</td>
            <td>L 型号 vs M 型号（均未在 COCO 上微调）</td>
          </tr>
          <tr>
            <td>文本编码器（LVIS 零样本 AP）</td>
            <td>22.4</td>
            <td>18.3</td>
            <td>CLIP 冻结 vs BERT 微调</td>
          </tr>
        </tbody>
      </table>
      <div className="hotspot-info">
        <p>
          <b>要注意三件事</b>：
        </p>
        <p>① 表里的帧率是 V100 上不带 TensorRT 的整机速度，括号里是未重参数化的原始模型；</p>
        <p>
          ② CC3M† 是指用 GLIP+CLIP+NMS 过滤后的 24.6 万图 / 82.1 万伪框，不是原始 CC3M；
        </p>
        <p>③ COCO 53.3 与 LVIS 34.1 都是微调后的封闭集成绩，不能和零样本混着读。</p>
      </div>
      <div className="hotspot-info">
        <div>
          <b>同一批实验里的其他已验证数字</b>
        </div>
        <div>
          零样本 COCO 三个型号：S 是 37.6 AP、M 是 42.8 AP、L 是 44.4 AP（AP50/AP75 分别为 52.3/40.7、58.3/46.4、59.8/48.3）。
          零样本 LVIS 上横向比：Grounding DINO-T 是 25.6 AP / 1.5 FPS，DetCLIP-T 是 34.4 AP，本方法 L 型号用 52 FPS 到 35.4 AP。
          微调后：COCO 53.3 AP，LVIS 只训 base 类别是 34.1 AP（罕见类 20.4）。
        </div>
      </div>
    </div>
  );
};

export default Ch10Mod1;
