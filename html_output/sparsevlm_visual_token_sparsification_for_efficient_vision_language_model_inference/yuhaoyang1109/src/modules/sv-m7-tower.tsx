import React, { useState } from 'react';
import { StageCanvas, TimeBar } from '../live/TimeBar';
import { useTimeline } from '../live/timeline';
import { txt, useStage, type Frame } from '../live/stage';
import { C, Feedback, Readout, Seg, SpeedSeg, Swatch, Tag, type Speed } from './sv-kit';
import { drawTower, layerParts } from './sv-draw';
import { KV_BYTES_PER_TOKEN_ALL_LAYERS, N_LAYERS, PRUNE_LAYERS, SCHEDULE, codeAvg, enterAvg, scheduleSteps, type Budget } from './sv-data';
import type { WidgetProps } from './registry';

// 7.1 32 层 token 塔：按代码常数逐层推算视觉 token 数（进入每层计算的数目），并列两种平均与 KV 估算。
// 时间轴进度 = 算到第几层；画面、读数和反馈由同一个进度与同一个档位驱动。

const SPEED_K: Record<Speed, number> = { slow: 0.6, mid: 1, fast: 1.7 };
const PHASES = [
  { at: 0, label: '第 0–2 层：满 576 个' },
  { at: 3 / 32, label: '第 3–6 层' },
  { at: 7 / 32, label: '第 7–15 层' },
  { at: 16 / 32, label: '第 16–31 层' },
];

export function SvTower(_: WidgetProps) {
  const [budget, setBudget] = useState<Budget>(192);
  const [speed, setSpeed] = useState<Speed>('mid');
  const tl = useTimeline(8, SPEED_K[speed]);
  const steps = scheduleSteps(SCHEDULE[budget]);
  const cAvg = codeAvg(steps);
  const eAvg = enterAvg(steps);
  const kvSparse = steps.reduce((a, s) => a + s.enter, 0) / (576 * N_LAYERS);
  const kvMB = (KV_BYTES_PER_TOKEN_ALL_LAYERS * 576) / 1e6;

  const draw = (f: Frame) => {
    const more = tl.tick(f.dt);
    paint(f, tl.pRef.current, steps);
    return more;
  };
  const stage = useStage({ heightOf: (w) => (w >= 560 ? 360 : 420), draw, live: tl.playing }, [budget, tl.playing ? -1 : tl.p, tl.playing]);
  React.useEffect(() => {
    if (stage.animate) tl.onVisible(true);
  }, [stage.animate]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = Math.min(N_LAYERS - 1, Math.floor(tl.p * N_LAYERS));
  const part = layerParts(steps, cur);
  const prune = steps.filter((s) => s.kept !== undefined);
  const fb =
    tl.p >= 0.999
      ? `32 层全部算完。代码记录的是每层“处理后”的数目，平均 ${cAvg.toFixed(1)}；按“进入每层计算”的数目平均是 ${eAvg.toFixed(1)}，差在第 2、6、15 层本身——它们计算时用的还是剪枝前的 token。`
      : PRUNE_LAYERS.includes(cur)
        ? `第 ${cur} 层是剪枝层：先用 ${part.total} 个视觉 token 完整算一遍，再按配额保留 ${steps[cur].kept} 个，加上回收合成的 ${steps[cur].clusters} 个，下一层只剩 ${steps[cur].after} 个。`
        : `第 ${cur} 层：进入计算的视觉 token 有 ${part.total} 个${part.merged ? `（其中 ${part.merged} 个是回收合成的）` : ''}。`;

  return (
    <div className="sv-live sv-mod">
      <div className="lv-split">
        <div className="sv-col">
          <StageCanvas s={stage} label={`${budget} 档 32 层视觉 token 数：${prune.map((s) => s.after).join(' → ')}；代码口径平均 ${cAvg.toFixed(1)}，进入计算平均 ${eAvg.toFixed(1)}`} />
          <TimeBar tl={tl} phases={PHASES} label="逐层进度" valueText={`第 ${cur} 层`} extra={<SpeedSeg value={speed} onChange={setSpeed} />} />
        </div>
        <div className="lv-side">
          <Seg label="档位" value={String(budget) as '192' | '128' | '64'} onChange={(v) => setBudget(Number(v) as Budget)} options={(['192', '128', '64'] as const).map((b) => ({ value: b, label: `“保留 ${b} 个”` }))} />
          <p className="sv-tw-seq">
            <span className="sv-k">逐层（剪枝后）</span>
            <b>{[576, ...prune.map((s) => s.after)].join(' → ')}</b>
          </p>
          <div className="sv-reads">
            <Readout label="代码口径平均" value={cAvg.toFixed(1)} tone="blue" sub="处理后计数，32 层平均" />
            <Readout label="进入计算的平均" value={eAvg.toFixed(1)} tone="amber" sub="决定 FLOPs 的口径" />
            <Readout label="视觉 KV（相对 576 × 32 层）" value={`${(kvSparse * 100).toFixed(1)}%`} sub={`原模型约 ${kvMB.toFixed(1)} MB`} />
          </div>
          <Feedback k={`${budget}-${tl.p >= 0.999 ? 'end' : cur}`}>{fb}</Feedback>
          <div className="sv-legend">
            <span>
              <Swatch color={C.vis} />
              保留的视觉 token
            </span>
            <span>
              <Swatch color={C.merged} />
              回收合成的 token
            </span>
            <span>
              <Swatch color={C.pruned} dashed />
              本层被删
            </span>
          </div>
          <p className="sv-small">
            <Tag kind="code" /> 剪枝层、配额、回收与簇数公式取自固定提交；逐层数目、平均与 KV 为本页推算 <Tag kind="extrap" />（每 token 每层 2 × 4096 × 2 字节）。论文 302.4 → 100.8 MB 相当于按“每层 192 个”算。
          </p>
        </div>
      </div>
    </div>
  );
}

function paint(f: Frame, p: number, steps: ReturnType<typeof scheduleSteps>) {
  const { ctx, w, h } = f;
  const upto = p * N_LAYERS;
  const top = 26;
  const towerH = h - top - 30;
  txt(ctx, '↑ 层号（第 0 层在最下面）', 34, 12, { size: 11.5, color: C.faint });
  drawTower(ctx, 4, top, w - 8, towerH, steps, { upto, labels: true, pruneLayers: PRUNE_LAYERS, focus: p < 0.999 ? Math.min(N_LAYERS - 1, Math.floor(upto)) : undefined, font: 12 });
  txt(ctx, '横条长度 ∝ 进入该层计算的视觉 token 数（满格 = 576）', 4, h - 12, { size: 11.5, color: C.faint });
}
