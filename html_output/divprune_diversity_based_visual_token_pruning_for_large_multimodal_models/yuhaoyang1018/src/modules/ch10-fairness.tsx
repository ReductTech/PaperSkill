import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useTween } from '../lib/hooks';
import { Feedback, Seg } from '../ui/kit';
import { FIG1_COLS, RESULT_TABLES, TABLE4 } from '../data/tutorial';
import { C, METHOD_COLOR } from '../lib/palette';

// 10.2 公平性检查：
//  A. 在 MMB/MMMU/POPE/SQA 四个共同数据集上，把 Table 1 的 FastV（K=3，之后约保留 1 个）、
//     Table 4 的随机（Layer 0 保留 56 个）和 DivPrune 放在一起。
//  B. Fig. 1 纵轴的平均方式：直接平均（论文口径）vs CIDEr 先除以原模型值（本页外推）。

const T1 = RESULT_TABLES[0];
const COLS4 = [
  { name: 'MMB', t1: 3, t4: 'mmb' as const },
  { name: 'MMMU', t1: 5, t4: 'mmmu' as const },
  { name: 'POPE', t1: 8, t4: 'pope' as const },
  { name: 'SQA', t1: 9, t4: 'sqa' as const },
];

function GBar({ v, color }: { v: number; color: string }) {
  const t = useTween(v, 380);
  return (
    <div className="gb">
      <div className="gb-fill" style={{ transform: `scaleY(${t / 100})`, background: color }} />
      <span className="gb-v">{t.toFixed(1)}</span>
    </div>
  );
}

export const Ch10Fairness: React.FC<WidgetProps> = () => {
  const [part, setPart] = useState<'a' | 'b'>('a');
  const [norm, setNorm] = useState(false);

  const orig = T1.rows[0];
  const fastv = T1.rows.find((r) => r.method === 'FastV')!;
  const ours = T1.rows.find((r) => r.method === 'DivPrune')!;
  const rand = TABLE4.find((r) => r.id === 'random')!;
  const series = [
    { name: '原模型', color: C.ink, desc: 'Table 1，100%', get: (c: (typeof COLS4)[number]) => orig.values[c.t1]! },
    { name: 'FastV', color: C.mustard, desc: 'Table 1，K = 3，之后约保留 1 个（15.69%）', get: (c: (typeof COLS4)[number]) => fastv.values[c.t1]! },
    { name: '随机', color: C.gray, desc: 'Table 4，Layer 0 随机保留 56 个', get: (c: (typeof COLS4)[number]) => rand[c.t4] },
    { name: 'DivPrune', color: C.verm, desc: 'Table 1 / 4，Layer 0 保留 56 个（15.63%）', get: (c: (typeof COLS4)[number]) => ours.values[c.t1]! },
  ];
  const avg = (f: (c: (typeof COLS4)[number]) => number) => COLS4.reduce((a, c) => a + f(c), 0) / COLS4.length;

  // B：Fig. 1 纵轴（COCO CIDEr、OKVQA、POPE、MMB 的平均；百分制分数 ÷ 100）
  const methods = T1.rows.filter((r) => ['原模型', 'M³•', 'DivPrune', 'FitPrune△', 'FastV', 'VTW'].includes(r.method));
  const cocoOrig = orig.values[0]!;
  const fig1 = methods
    .map((r) => {
      const [coco, okvqa, pope, mmb] = FIG1_COLS.map((i) => r.values[i]!);
      const c = norm ? coco / cocoOrig : coco;
      return { method: r.method, tflop: r.tflop, v: (c + okvqa / 100 + pope / 100 + mmb / 100) / 4 };
    })
    .sort((a, b) => b.v - a.v);

  return (
    <div className="w">
      <div className="ctl-row">
        <Seg label="检查项" options={[{ value: 'a', label: 'A · FastV 输在哪里' }, { value: 'b', label: 'B · Fig. 1 的平均方式' }]} value={part} onChange={setPart} />
      </div>
      {part === 'a' ? (
        <>
          <div className="gbars-wrap">
            <div className="gbars" role="img" aria-label="四个数据集上原模型、FastV、随机、DivPrune 的分数">
              {COLS4.map((c) => (
                <div className="gbars-group" key={c.name}>
                  <div className="gbars-bars">
                    {series.map((s) => (
                      <GBar key={s.name} v={s.get(c)} color={s.color} />
                    ))}
                  </div>
                  <div className="gbars-k">{c.name}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="cv-legend">
            {series.map((s) => (
              <span key={s.name}>
                <i className="dot" style={{ background: s.color }} />
                {s.name}：{s.desc}
              </span>
            ))}
          </div>
          <Feedback tone="warn">
            四个数据集平均：原模型 {avg(series[0].get).toFixed(2)}，FastV {avg(series[1].get).toFixed(2)}，随机 {avg(series[2].get).toFixed(2)}，DivPrune {avg(series[3].get).toFixed(2)}。
            “随机挑 56 个”已经比 FastV 高出 {(avg(series[2].get) - avg(series[1].get)).toFixed(1)} 分，而 DivPrune 相对随机只再高 {(avg(series[3].get) - avg(series[2].get)).toFixed(1)} 分。
            这些结果与“极端配置（第 3 层后几乎只留 1 个视觉 token）放大了 FastV 的差距”这一解释相符；但跨表、不同预算与保留数的比较，无法确定配置和“注意力打分”本身各自贡献了多少。
            注意：两组数字来自不同的表，FastV 与随机的 TFLOPs 也不完全相同（15.69% vs 与 DivPrune 相同的 15.63%），这里的比较只能作为提示（本页推断）。
          </Feedback>
        </>
      ) : (
        <>
          <div className="ctl-row">
            <Seg small label="平均方式" options={[{ value: 0, label: '论文口径：直接平均' }, { value: 1, label: 'CIDEr ÷ 原模型值（外推）' }]} value={norm ? 1 : 0} onChange={(v) => setNorm(v === 1)} />
          </div>
          <div className="rank">
            {fig1.map((r, i) => (
              <div className={`rank-row ${r.method === 'DivPrune' ? 'is-ours' : ''}`} key={r.method}>
                <span className="rank-i">{i + 1}</span>
                <span className="rank-k">
                  <i className="dot" style={{ background: METHOD_COLOR[r.method] ?? '#888' }} />
                  {r.method}
                  <small>{r.tflop}</small>
                </span>
                <div className="rank-track">
                  <div className="rank-fill" style={{ transform: `scaleX(${r.v / 0.85})`, background: METHOD_COLOR[r.method] ?? '#888' }} />
                </div>
                <span className="rank-v">{r.v.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <Feedback tone="info">
            {norm
              ? '把 COCO 的 CIDEr 先除以原模型值（1.10）再平均，所有方法的数值都下移一些，但排序不变：在 Table 1 这些点上，结论对平均方式不敏感。'
              : 'Fig. 1 的纵轴把 COCO CIDEr（可超过 1）与三个 0–1 分数直接平均，CIDEr 的权重偏大。按 Table 1 复算，原模型为 0.783、DivPrune 为 0.721，与图中原模型虚线（约 0.78）和 DivPrune 在约 15% 处的点（约 0.72）一致（目测读图）。'}
          </Feedback>
          <p className="w-note">数值按 Table 1（LLaVA 1.5-7B）计算；OKVQA、POPE、MMB 除以 100。FitPrune 与 M³ 分别使用校准集和微调。</p>
        </>
      )}
    </div>
  );
};

export default Ch10Fairness;
