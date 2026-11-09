import React, { useMemo, useState } from 'react';
import { C, Feedback, Range, Readout, Seg, Swatch, Tag, XScroll } from './sv-kit';
import { SCHEDULE, scheduleSteps, type Budget } from './sv-data';
import { rng } from '../live/stage';
import type { WidgetProps } from './registry';

// 5.1 秩实验台：构造一个 Lt × 576 的示意打分矩阵 P（列从若干个“不同图样”中取），用高斯消元求秩，
// 按 Eq. (7) 算删除个数 N = λ·(Lv − rank(P))。再对照图像版代码的固定配额与视频分支的“保留 rank(P) 个”。

const LV = 576;

/** 高斯消元求秩（部分主元，容差 1e-9） */
export function matRank(m: number[][]): number {
  const a = m.map((r) => r.slice());
  const rows = a.length;
  const cols = a[0]?.length ?? 0;
  let rank = 0;
  for (let c = 0; c < cols && rank < rows; c++) {
    let piv = rank;
    for (let r = rank + 1; r < rows; r++) if (Math.abs(a[r][c]) > Math.abs(a[piv][c])) piv = r;
    if (Math.abs(a[piv][c]) < 1e-9) continue;
    [a[rank], a[piv]] = [a[piv], a[rank]];
    for (let r = 0; r < rows; r++) {
      if (r === rank) continue;
      const f = a[r][c] / a[rank][c];
      if (f !== 0) for (let k = c; k < cols; k++) a[r][k] -= f * a[rank][k];
    }
    rank++;
  }
  return rank;
}

function buildP(lt: number, distinct: number) {
  const rand = rng(7 + lt * 101 + distinct);
  const base = Array.from({ length: distinct }, () => Array.from({ length: lt }, () => rand() + 0.05));
  // 第 j 列取第 (j mod distinct) 个图样
  return Array.from({ length: lt }, (_, i) => Array.from({ length: LV }, (_, j) => base[j % distinct][i]));
}

type Mode = 'paper' | 'code' | 'video';

export function SvRank(_: WidgetProps) {
  const [mode, setMode] = useState<Mode>('paper');
  const [lt, setLt] = useState(12);
  const [distinct, setDistinct] = useState(40);
  const [lam, setLam] = useState(0.5);
  const [budget, setBudget] = useState<Budget>(192);
  const rank = useMemo(() => matRank(buildP(lt, distinct)), [lt, distinct]);
  const N = Math.round(lam * (LV - rank));
  const keptPaper = LV - N;
  const steps = scheduleSteps(SCHEDULE[budget]);
  const firstPrune = steps[2];

  const kept = mode === 'paper' ? keptPaper : mode === 'video' ? rank : firstPrune.kept!;
  const tone = mode === 'paper' ? (keptPaper < 120 ? 'warn' : 'info') : mode === 'video' ? 'warn' : 'info';

  return (
    <div className="sv-live sv-mod">
      <Seg
        label="决定删多少的方式"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'paper', label: '论文 Eq. (7)' },
          { value: 'code', label: '图像版代码（734d900）' },
          { value: 'video', label: '视频分支（f05b898）' },
        ]}
      />
      <div className="lv-split">
        <div className="sv-col">
          <div className="sv-rk-bar" role="img" aria-label={`576 个视觉 token 中保留 ${kept} 个`}>
            <span className="sv-rk-kept" style={{ width: `${(kept / LV) * 100}%` }} />
            {mode !== 'code' ? <span className="sv-rk-rank" style={{ left: `${(Math.min(rank, LV) / LV) * 100}%` }} title="rank(P)" /> : null}
          </div>
          <div className="sv-legend">
            <span>
              <Swatch color={C.vis} />
              保留 {kept} 个
            </span>
            <span>
              <Swatch color={C.pruned} dashed />
              删除 {LV - kept} 个
            </span>
            {mode !== 'code' ? <span>竖线 = rank(P) = {rank}</span> : <span>（第 2 层）</span>}
          </div>
          {mode !== 'code' ? (
            <>
              <Range label="评分员个数 Lt（P 的行数）" value={lt} min={2} max={40} onChange={setLt} />
              <Range label="视觉 token 里的不同图样数（越少越冗余）" value={distinct} min={1} max={80} onChange={setDistinct} />
              {mode === 'paper' ? <Range label="缩放系数 λ（论文未给取值）" value={lam} min={0} max={1} step={0.01} onChange={setLam} display={lam.toFixed(2)} /> : null}
            </>
          ) : (
            <>
              <Seg label="档位" value={String(budget) as '192' | '128' | '64'} onChange={(v) => setBudget(Number(v) as Budget)} options={(['192', '128', '64'] as const).map((b) => ({ value: b, label: `${b} 档` }))} />
              <XScroll label="三个剪枝层">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>剪枝层</th>
                    <th>进入</th>
                    <th>配额 k</th>
                    <th>删除</th>
                    <th>合并 token</th>
                    <th>之后</th>
                  </tr>
                </thead>
                <tbody>
                  {steps
                    .filter((s) => s.kept !== undefined)
                    .map((s) => (
                      <tr key={s.layer}>
                        <td>第 {s.layer} 层</td>
                        <td>{s.enter}</td>
                        <td>{s.kept}</td>
                        <td>{s.deleted}</td>
                        <td>{s.clusters}</td>
                        <td>{s.after}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </XScroll>
            </>
          )}
        </div>
        <div className="lv-side">
          <div className="sv-reads">
            {mode !== 'code' ? <Readout label="rank(P)" value={rank} tone="rater" sub={`上界 min(Lt, Lv) = ${Math.min(lt, LV)}`} /> : null}
            {mode === 'paper' ? <Readout label="Lv − rank(P)" value={LV - rank} /> : null}
            {mode === 'paper' ? <Readout label="Eq. (7) 删除 N" value={N} tone={keptPaper < 120 ? 'amber' : 'blue'} /> : null}
            <Readout label={mode === 'code' ? '第 2 层保留（配额）' : '保留'} value={kept} tone="vis" />
            {mode === 'code' ? <Readout label="32 层平均（代码口径）" value={(steps.reduce((a, x) => a + x.after, 0) / 32).toFixed(1)} /> : null}
          </div>
          <Feedback tone={tone} k={`${mode}-${rank >= lt}`}>
            {mode === 'paper'
              ? rank >= Math.min(lt, distinct)
                ? `rank(P) = ${rank}，被评分员个数（${lt}）和图样数（${distinct}）中较小的那个卡住。此时 Eq. (7) 删除 ${N} 个，约占 ${Math.round((N / LV) * 100)}%；删多少由 λ 决定，应结合目标预算选择。`
                : `rank(P) = ${rank}。`
              : mode === 'code'
                ? `图像版代码不求秩：三层按写死的配额保留（${SCHEDULE[budget].join(' / ')}），再加回收合成的 token。“自适应”在这里不成立。`
                : `视频分支保留 rank(P) = ${rank} 个（相当于 λ = 1），只在第 1 层剪；保留数不会超过评分员个数，之后再加回收合成的 token。`}
          </Feedback>
          <p className="sv-small">
            {mode === 'code' ? (
              <>
                <Tag kind="code" /> 配额取自 score.py 第 5–9 行，层号从 0 起计；删除数、合并 token 数按代码公式推算 <Tag kind="extrap" />。
              </>
            ) : (
              <>
                <Tag kind="demo" /> P 为示意矩阵（每列从若干个随机图样中取）；秩用高斯消元真实计算 <Tag kind="extrap" />。
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
