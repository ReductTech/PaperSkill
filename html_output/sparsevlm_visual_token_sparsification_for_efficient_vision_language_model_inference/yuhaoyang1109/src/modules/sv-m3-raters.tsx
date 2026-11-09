import React, { useState } from 'react';
import { C, Feedback, Readout, Seg, Swatch, Tag } from './sv-kit';
import { FIG5 } from './sv-data';
import type { WidgetProps } from './registry';

// 3.1 评分员选择：每个文本 token 的相关度 r（教学示意）与均值线；高于均值的成为评分员。
// 下半部分是图 5 的实测值（论文实测），打分来源的选中项与上半部分的高亮由同一个状态驱动。

export type QKey = 'sign' | 'bus' | 'fridge' | 'pill';
export const RATER_QS: { value: QKey; label: string; zh: string; toks: [string, number][] }[] = [
  {
    value: 'sign',
    label: 'blue sign',
    zh: '这块蓝色牌子上写了什么？',
    toks: [['What', 0.42], ['is', 0.22], ['written', 0.86], ['on', 0.18], ['this', 0.36], ['blue', 1.28], ['sign', 1.46], ['?', 0.2], ['ASSISTANT', 0.3], [':', 0.12]],
  },
  {
    value: 'bus',
    label: 'how many buses',
    zh: '图里有几辆公交车？',
    toks: [['How', 0.44], ['many', 0.7], ['buses', 1.58], ['are', 0.24], ['there', 0.3], ['in', 0.18], ['the', 0.2], ['image', 0.9], ['?', 0.18], ['ASSISTANT', 0.3], [':', 0.12]],
  },
  {
    value: 'fridge',
    label: 'sticker on fridge',
    zh: '冰箱上那张黄色贴纸顶部写了什么？',
    toks: [['What', 0.4], ['is', 0.2], ['written', 0.8], ['on', 0.16], ['the', 0.2], ['top', 0.62], ['of', 0.14], ['the', 0.2], ['yellow', 1.12], ['sticker', 1.34], ['on', 0.16], ['the', 0.2], ['fridge', 1.4], ['?', 0.18], ['ASSISTANT', 0.3], [':', 0.12]],
  },
  {
    value: 'pill',
    label: 'Tylenol / Advil',
    zh: '这瓶药是 Tylenol、Advil 还是 ibuprofen？',
    toks: [['Is', 0.24], ['this', 0.36], ['Tylenol', 1.22], [',', 0.1], ['Advil', 1.36], [',', 0.1], ['or', 0.16], ['ibuprofen', 1.08], ['?', 0.18], ['ASSISTANT', 0.3], [':', 0.12]],
  },
];

type Src = 'all' | 'text' | 'raters';
const SRC_LABEL: Record<Src, string> = { all: '全部 token', text: '全部文本', raters: '评分员' };

export function SvRaters(_: WidgetProps) {
  const [q, setQ] = useState<QKey>('sign');
  const [src, setSrc] = useState<Src>('raters');
  const cur = RATER_QS.find((x) => x.value === q)!;
  const vals = cur.toks.map((t) => t[1]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const max = Math.max(...vals) * 1.08;
  const raters = cur.toks.filter((t) => t[1] > mean);
  const used = (r: number) => (src === 'raters' ? r > mean : true);

  return (
    <div className="sv-live sv-mod">
      <div className="lv-split is-wide-side">
        <div className="sv-col">
          <div className="sv-r-q">
            <span className="sv-k">问题</span> {cur.zh}
          </div>
          <div className="sv-r-chart" role="img" aria-label={`每个文本 token 的相关度 r，均值 ${mean.toFixed(2)}，评分员：${raters.map((t) => t[0]).join('、')}`}>
            {cur.toks.map(([tok, r], i) => {
              const isR = r > mean;
              const on = used(r);
              return (
                <div className="sv-r-row" key={i}>
                  <span className={`sv-r-tok ${isR ? 'is-rater' : ''}`}>{tok}</span>
                  <span className="sv-r-track">
                    <span className="sv-r-bar" style={{ width: `${(r / max) * 100}%`, background: isR ? C.rater : C.text, opacity: on ? 1 : 0.35 }} />
                    <span className="sv-r-mean" style={{ left: `${(mean / max) * 100}%` }} aria-hidden="true" />
                  </span>
                </div>
              );
            })}
            <div className="sv-r-row">
              <span />
              <span className="sv-r-axis">
                <span style={{ left: `${(mean / max) * 100}%` }}>均值 m = {mean.toFixed(2)}</span>
              </span>
            </div>
          </div>
          <div className="sv-legend">
            <span>
              <Swatch color={C.rater} />
              评分员（r &gt; 均值）
            </span>
            <span>
              <Swatch color={C.text} />
              其他文本 token
            </span>
            <span>竖线 = 均值 m</span>
          </div>
        </div>
        <div className="lv-side">
          <span className="sv-k">换一个问题</span>
          <Seg label="示例问题" value={q} onChange={setQ} options={RATER_QS.map((x) => ({ value: x.value, label: x.label }))} />
          <div className="sv-reads">
            <Readout label="候选文本 token" value={cur.toks.length} />
            <Readout label="评分员" value={raters.length} tone="rater" sub={raters.map((t) => t[0]).join(' · ')} />
          </div>
          <Feedback k={q}>
            介词、冠词、问号和模板里的“ASSISTANT:”相关度都低于均值，不参与打分；剩下的 {raters.length} 个词决定哪些图块被留下。
          </Feedback>
          <p className="sv-small">
            <Tag kind="demo" /> 例句仿照论文图 3 的四类基准问题，r 的数值为示意；规则“r 高于均值才入选”与代码一致 <Tag kind="code" />。
          </p>
        </div>
      </div>

      <div className="sv-r-fig5">
        <div className="sv-row">
          <span className="sv-k">打分来源</span>
          <Seg label="打分来源" value={src} onChange={setSrc} tone="green" options={(['all', 'text', 'raters'] as Src[]).map((s) => ({ value: s, label: SRC_LABEL[s] }))} />
        </div>
        <div className="sv-r-fig5-grid">
          {(['TextVQA', 'POPE'] as const).map((b) => {
            const d = FIG5[b];
            const lo = b === 'TextVQA' ? 52 : 60;
            const hi = b === 'TextVQA' ? 54 : 80;
            return (
              <div key={b} className="sv-r-fig5-col">
                <b>{b}</b>
                {(['all', 'text', 'raters'] as Src[]).map((s) => (
                  <div className={`sv-r-fig5-row ${s === src ? 'is-on' : ''}`} key={s}>
                    <span>{SRC_LABEL[s]}</span>
                    <span className="sv-r-track">
                      <span className="sv-r-bar" style={{ width: `${((d[s] - lo) / (hi - lo)) * 100}%`, background: s === src ? C.green : C.line2 }} />
                    </span>
                    <b className="sv-nowrap">{d[s].toFixed(1)}</b>
                  </div>
                ))}
                <span className="sv-small">
                  横轴从 {lo} 到 {hi}（不从 0 开始，便于看清差距）
                </span>
              </div>
            );
          })}
        </div>
        <Feedback tone={src === 'raters' ? 'ok' : 'info'} k={src}>
          {src === 'all'
            ? '用全部 token（含视觉、系统 token）的注意力打分：POPE 只有 66.1，比评分员低 11.4 个点。'
            : src === 'text'
              ? '用全部文本 token 打分：TextVQA 53.0、POPE 74.8；比全部 token 好，但仍低于只用评分员。'
              : '只用评分员打分：TextVQA 53.4、POPE 77.5，三种来源里最高（64 个 token；论文未交代重复运行次数和方差）。'}
        </Feedback>
        <p className="sv-small">
          <Tag kind="paper" /> 图 5（第 7 页），LLaVA-7B、保留 64 个 token；数值为柱状图标签读数，TextVQA“全部文本”一栏按标签位置读作 53.0。
        </p>
      </div>
    </div>
  );
}
