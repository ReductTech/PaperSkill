import React, { useState } from 'react';
import { C, Feedback, Seg, Swatch, Tag, XScroll } from './sv-kit';
import { BENCHES, BUDGETS, METHODS, METHOD_VENUE, TABLE1, TABLE2, TABLE3, VANILLA, VIDEO_SETS, VZ_CITED, VZ_VANILLA, pctMismatch, type Budget, type Method } from './sv-data';
import type { WidgetProps } from './registry';

// 第 8 章的三个结果模块。数值全部取自 sv-data.ts（论文实测）；“本页复算”标记为公式外推。

const MCOLOR: Record<Method, string> = { ToMe: C.mToMe, FastV: C.mFastV, PDrop: C.mPDrop, SparseVLM: C.mSparse };
type Metric = 'avg' | (typeof BENCHES)[number];

// ---------------------------------------------------------------- 8.1 表 1
export function SvResults(_: WidgetProps) {
  const [budget, setBudget] = useState<Budget>(192);
  const [metric, setMetric] = useState<Metric>('avg');
  const [sel, setSel] = useState<Method>('SparseVLM');
  const rows = METHODS.map((m) => {
    const r = TABLE1[budget][m];
    const v = metric === 'avg' ? r.avg : r.pct[BENCHES.indexOf(metric)];
    return { m, v };
  });
  const lo = 40;
  const hi = 110;
  const best = Math.max(...rows.map((r) => r.v));
  const r = TABLE1[budget][sel];
  const bad = pctMismatch(budget, sel);
  const gapFastV = TABLE1[budget].SparseVLM.avg - TABLE1[budget].FastV.avg;

  return (
    <div className="sv-live sv-mod">
      <div className="sv-row">
        <span className="sv-k">档位</span>
        <Seg label="档位" value={String(budget) as '192' | '128' | '64'} onChange={(v) => setBudget(Number(v) as Budget)} options={BUDGETS.map((b) => ({ value: String(b) as '192' | '128' | '64', label: `保留 ${b}` }))} />
      </div>
      <div className="sv-row">
        <span className="sv-k">指标</span>
        <Seg label="指标" value={metric} onChange={setMetric} small options={[{ value: 'avg' as Metric, label: '8 项平均' }, ...BENCHES.map((b) => ({ value: b as Metric, label: b }))]} />
      </div>
      <div className="sv-ld">
        <div className="sv-col">
          <div className="sv-hbars" role="group" aria-label="四种方法（点按查看原始分数）">
            {rows.map(({ m, v }) => (
              <button key={m} type="button" className="sv-hbar" aria-pressed={sel === m} onClick={() => setSel(m)}>
                <span className="sv-hbar-k">
                  <i className="sv-dot" style={{ background: MCOLOR[m] }} />
                  {m}
                  <small>{METHOD_VENUE[m]}</small>
                </span>
                <span className="sv-hbar-track">
                  <span className="sv-hbar-fill" style={{ width: `${((Math.min(v, hi) - lo) / (hi - lo)) * 100}%`, background: MCOLOR[m] }} />
                  <span className="sv-hbar-ref" style={{ left: `${((100 - lo) / (hi - lo)) * 100}%` }} aria-hidden="true" />
                </span>
                <b className={v === best ? 'is-best' : ''}>{v.toFixed(1)}%</b>
              </button>
            ))}
          </div>
          <p className="sv-small">横轴 40%–110%，竖虚线 = 原模型（100%）。点任一方法看原始分数。</p>
          <Feedback k={`${budget}-${metric}`}>
            {metric === 'avg'
              ? `保留 ${budget} 个时，SparseVLM 的 8 项平均比 FastV 高 ${gapFastV.toFixed(1)} 个点${budget === 192 ? '，比 PDrop 高 3.2 个点' : ''}。`
              : `${metric}：最高的是 ${rows.find((x) => x.v === best)!.m}（${best.toFixed(1)}%）。单个基准上不到 1 个点的差距，论文未交代重复运行次数和方差，无法判断是否稳定。`}
          </Feedback>
        </div>
        <div className="sv-detail">
          <h5>
            {sel} · 保留 {budget} 个
          </h5>
          <table className="sv-table">
            <thead>
              <tr>
                <th>基准</th>
                <th>原始分数</th>
                <th>表中 %</th>
                <th>本页复算 %</th>
              </tr>
            </thead>
            <tbody>
              {BENCHES.map((b, i) => {
                const calc = (r.raw[i] / VANILLA.raw[i]) * 100;
                const mis = bad.some((x) => x.i === i);
                return (
                  <tr key={b} className={metric === b ? 'is-on' : ''}>
                    <td>{b}</td>
                    <td>{r.raw[i]}</td>
                    <td className={r.pct[i] > 100 ? 'is-flag' : ''}>{r.pct[i].toFixed(1)}</td>
                    <td className={mis ? 'is-flag' : ''}>{calc.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="sv-small">
            FLOPs {r.flops} T · 延迟 {r.lat} ms（原模型 {VANILLA.flops} T · {VANILLA.lat} ms）
          </p>
          {bad.length ? (
            <Feedback tone="warn" k={`${sel}${budget}`}>
              {bad.map((x) => `${BENCHES[x.i]}：${r.raw[x.i]} / ${VANILLA.raw[x.i]} = ${x.calc.toFixed(1)}%，表中 ${x.paper}%`).join('；')}。与本页复算不一致，原因未知。
            </Feedback>
          ) : (
            <Feedback tone="ok" k={`${sel}${budget}`}>
              这一行的百分比都能由原始分数复算（误差 ≤ 0.15 个点）。{r.pct.some((x) => x > 100) ? '超过 100% 的格子（琥珀色）表示高于原模型，论文未交代重复运行次数和方差，无法判断是否超出评测波动。' : ''}
            </Feedback>
          )}
        </div>
      </div>
      <p className="sv-small">
        <Tag kind="paper" /> 表 1（第 6 页），LLaVA-1.5；<Tag kind="extrap" /> 复算列 = 原始分数 / 原模型 × 100。
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- 8.2 版本对照
export function SvVersions(_: WidgetProps) {
  const [budget, setBudget] = useState<Budget>(192);
  const icml = TABLE1[budget].SparseVLM;
  const vz = VZ_CITED[budget];
  return (
    <div className="sv-live sv-mod">
      <div className="sv-row">
        <span className="sv-k">档位</span>
        <Seg label="档位" value={String(budget) as '192' | '128' | '64'} onChange={(v) => setBudget(Number(v) as Budget)} options={BUDGETS.map((b) => ({ value: String(b) as '192' | '128' | '64', label: `保留 ${b}` }))} />
      </div>
      <XScroll label="版本对照表">
        <table className="sv-table sv-vz">
          <thead>
            <tr>
              <th>基准</th>
              <th>ICML 正式版
                <br />
                原模型</th>
              <th>ICML 正式版
                <br />
                SparseVLM</th>
              <th>VisionZip 表 1
                <br />
                原模型</th>
              <th>VisionZip 表 1
                <br />
                SparseVLM(2024.10)</th>
            </tr>
          </thead>
          <tbody>
            {BENCHES.map((b, i) => {
              const diff = vz.raw[i] !== null && Math.abs((vz.raw[i] as number) - icml.raw[i]) >= 0.05;
              return (
                <tr key={b}>
                  <td>{b}</td>
                  <td>{VANILLA.raw[i]}</td>
                  <td className="is-icml">{icml.raw[i]}</td>
                  <td>{VZ_VANILLA[i]}</td>
                  <td className={diff ? 'is-flag' : ''}>{vz.raw[i] ?? '—'}</td>
                </tr>
              );
            })}
            <tr>
              <td>平均</td>
              <td>100%</td>
              <td className="is-icml">{icml.avg}%（8 列）</td>
              <td>100%</td>
              <td>{vz.avg}%（11 列）</td>
            </tr>
          </tbody>
        </table>
      </XScroll>
      <Feedback tone="warn" k={budget}>
        同一个方法、同一个档位，两边的分数不一样：VisionZip 引用的是 2024 年 10 月的早期版本。两边的平均分按不同的列计算，不能相减比较；引用 SparseVLM 时写明来自哪个版本。
      </Feedback>
      <p className="sv-small">
        <Tag kind="paper" /> 左两列：ICML 正式版表 1；右两列：VisionZip（CVPR 2025）表 1，只取两边都有的 8 列。琥珀色 = 与正式版不同。arXiv v1 的主表同样与正式版不同（例如 192 档 GQA 为 57.6）。
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- 8.3 其他模型
export function SvOthers(_: WidgetProps) {
  const [model, setModel] = useState<'qwen' | 'video'>('qwen');
  const [vm, setVm] = useState<'acc' | 'score'>('acc');
  return (
    <div className="sv-live sv-mod">
      <Seg
        label="模型"
        value={model}
        onChange={setModel}
        options={[
          { value: 'qwen', label: 'Qwen2-VL（表 2）' },
          { value: 'video', label: 'Video-LLaVA（表 3）' },
        ]}
      />
      {model === 'qwen' ? (
        <>
          <XScroll label="表 2">
            <table className="sv-table">
              <thead>
                <tr>
                  <th>视觉 token</th>
                  <th>MMB</th>
                  <th>POPE</th>
                  <th>TextVQA</th>
                  <th>平均</th>
                  <th>相对动态档</th>
                </tr>
              </thead>
              <tbody>
                {TABLE2.map((r) => (
                  <tr key={r.tokens}>
                    <td>{r.tokens}</td>
                    <td>{r.mmb}</td>
                    <td>{r.pope}</td>
                    <td>{r.vqa}</td>
                    <td>
                      <b>{r.avg}</b>
                    </td>
                    <td>{((r.avg / TABLE2[0].avg) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </XScroll>
          <Feedback k="qwen">
            从约 1320 个降到 600 个（去掉约 54.5%），平均分保持 98.1%（正文写 98.0%）；之后每少 100 个，平均分降约 0.7 个点。TextVQA 降得最多（84.3 → 77.1），读字需要细节。
          </Feedback>
          <p className="sv-small">
            <Tag kind="paper" /> 表 2（第 6 页）；<Tag kind="extrap" /> “相对动态档”为本页按表计算。固定提交中没有 Qwen2-VL 的实现，600 / 500 / 400 个怎样分到各层没有说明。
          </p>
        </>
      ) : (
        <>
          <Seg
            label="指标"
            value={vm}
            onChange={setVm}
            small
            options={[
              { value: 'acc', label: '准确率' },
              { value: 'score', label: 'GPT 评分' },
            ]}
          />
          <div className="sv-vid" role="img" aria-label={`Video-LLaVA 2048 → 194 个 token 的${vm === 'acc' ? '准确率' : 'GPT 评分'}`}>
            {VIDEO_SETS.map((d, i) => {
              const vals = [
                { k: '原模型 2048', v: vm === 'acc' ? TABLE3.base.acc[i] : TABLE3.base.score[i], c: C.mVanilla },
                { k: 'FastV 194', v: vm === 'acc' ? TABLE3.FastV.acc[i] : TABLE3.FastV.score[i], c: C.mFastV },
                { k: 'SparseVLM 194', v: vm === 'acc' ? TABLE3.SparseVLM.acc[i] : TABLE3.SparseVLM.score[i], c: C.mSparse },
              ];
              const max = vm === 'acc' ? 80 : 4.2;
              return (
                <div key={d} className="sv-vid-col">
                  <b>{d}</b>
                  {vals.map((x) => (
                    <div key={x.k} className="sv-vid-row">
                      <span>{x.k}</span>
                      <span className="sv-r-track">
                        <span className="sv-r-bar" style={{ width: `${(x.v / max) * 100}%`, background: x.c }} />
                      </span>
                      <b>{vm === 'acc' ? x.v.toFixed(1) : x.v.toFixed(2)}</b>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="sv-legend">
            <span>
              <Swatch color={C.mVanilla} />
              原模型（2048 个）
            </span>
            <span>
              <Swatch color={C.mFastV} />
              FastV（194 个）
            </span>
            <span>
              <Swatch color={C.mSparse} />
              SparseVLM（194 个）
            </span>
          </div>
          <Feedback k={`video-${vm}`}>
            {vm === 'acc'
              ? '平均准确率：原模型 47.9，SparseVLM 47.0（保持 95.0%），FastV 40.5（80.3%）。TGIF 掉得最多（18.9 → 14.9），ActivityNet 反而略高（45.1 > 43.6）。'
              : 'GPT 评分：SparseVLM 平均 3.40，只比原模型低 0.04；FastV 低 0.17。'}
          </Feedback>
          <p className="sv-small">
            <Tag kind="paper" /> 表 3（第 7 页）；每个基准只取前 1000 个样本（沿用 FastV 的设置），GPT 评分来自 Video-ChatGPT 的评测工具。视频代码在 video 分支 f05b898，只在第 1 层按 rank(P) 剪。
          </p>
        </>
      )}
    </div>
  );
}
