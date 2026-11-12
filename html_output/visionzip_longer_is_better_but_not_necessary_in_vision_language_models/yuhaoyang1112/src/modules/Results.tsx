import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion } from '../components/motion';
import { useState } from 'react';
import { Term } from '../components/Hint';
import { benchmarks, table1, type ResultBudget } from '../data/table1';
import ProjectorLesson from './ProjectorLesson';
import './results.css';

const paper = 'https://openaccess.thecvf.com/content/CVPR2025/papers/Yang_VisionZip_Longer_is_Better_but_Not_Necessary_in_Vision_Language_CVPR_2025_paper.pdf';
const supplement = 'https://openaccess.thecvf.com/content/CVPR2025/supplemental/Yang_VisionZip_Longer_is_CVPR_2025_supplemental.pdf';

function Citation({ href, children }: { href: string; children: string }) {
  return <a className="vz-results-cite" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

function formatRaw(score: number, benchmark: string) {
  return benchmark === 'MME' ? String(score) : score.toFixed(1);
}

export default function Results() {
  const [budget, setBudget] = useState<ResultBudget>(64);
  const [tuned, setTuned] = useState(false);
  const [index, setIndex] = useState(0);
  const feedback = useContentMotion<HTMLDivElement>(budget + '/' + tuned + '/' + index);
  const benchmark = benchmarks[index];
  const scores = table1[budget];
  const selected = tuned ? scores.tuned : scores.free;
  const raw = (value: number) => formatRaw(value, benchmark.name);
  const method = tuned ? '投影层微调' : '免训练';
  const printedRatio = selected.percent[index].toFixed(1);
  const calculatedRatio = (100 * selected.raw[index] / benchmark.baseline).toFixed(1);
  const mmvetIndex = benchmarks.findIndex(entry => entry.name === 'MMVet');
  const showMmvet = () => {
    setIndex(mmvetIndex);
    setBudget(64);
  };
  const rows = [
    { label: '完整模型', raw: benchmark.baseline, percent: 100, average: 100, active: false },
    ...([
      ['fast', 'FastV'], ['sparse', 'SparseVLM'], ['free', 'VisionZip'], ['tuned', 'VisionZip ‡'],
    ] as const).map(([key, label]) => ({
      label, raw: scores[key].raw[index], percent: scores[key].percent[index],
      average: scores[key].average, active: scores[key] === selected,
    })),
  ];

  return (
    <div className="vz-results">
      <section className="vz-results-panel vzs-panel" id="module-4-1">
        <div className="vz-results-heading">
          <h3><span className="vzs-lab-num">4.1</span> 留下多少 token，还能保住多少分？</h3>
          <Citation href={paper + '#page=5'}>正文表 1</Citation>
        </div>
        <p>LLaVA-1.5 7B 原本把 576 个视觉 token 交给语言模型。表 1 对比了直接压缩和只微调<Term name="投影层">投影层</Term>两种做法。选择一个基准，看这个任务的得分怎样变化，再与 11 项的平均表现对照。</p>
        <div className="vz-results-controls">
          <div role="group" aria-label="表 1 的视觉预算"><span className="vz-choice-title">保留数量</span>
            <SegmentBar value={budget} className="vz-choice-line">{([64, 128, 192] as const).map(n =>
              <button type="button" key={n} aria-pressed={n === budget} onClick={() => setBudget(n)}>{n}</button>
            )}</SegmentBar>
          </div>
          <div role="group" aria-label="VisionZip 训练设置"><span className="vz-choice-title">VisionZip 设置</span>
            <SegmentBar value={tuned} className="vz-choice-line">
              <button type="button" aria-pressed={!tuned} onClick={() => setTuned(false)}>免训练</button>
              <button type="button" aria-pressed={tuned} onClick={() => setTuned(true)}>微调投影层 ‡</button>
            </SegmentBar>
          </div>
          <label className="vz-benchmark-label"><span className="vz-choice-title">查看基准</span>
            <select aria-label="查看基准" value={index} onChange={event => setIndex(Number(event.currentTarget.value))}>
              {benchmarks.map((entry, i) => <option key={entry.name} value={i}>{entry.name}{entry.column ? '（' + entry.column + '）' : ''}</option>)}
            </select>
          </label>
        </div>
        <figure className="vz-results-plot">
          <figcaption><b>{benchmark.name} 单项与整表平均</b><small>原版 576 个 · 压缩后 {budget} 个</small></figcaption>
          <table className="vz-score-table" aria-label={benchmark.name + ' 原始分、单项保留率与 11 项平均保留率'}>
            <thead><tr><th scope="col">方法</th><th scope="col">原始分</th><th scope="col">单项保留率</th><th scope="col">11 项 Avg.</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.label} className={row.active ? 'vz-current-method' : ''}>
              <th scope="row">{row.label}</th><td>{raw(row.raw)}</td><td>{row.percent.toFixed(1)}%</td>
              <td><div className="vz-average-cell"><span className="vz-average-rail" aria-hidden="true"><i style={{width:'100%', transform: 'scaleX(' + row.average / 100 + ')'}} /></span><span>{row.average.toFixed(1)}%</span></div></td>
            </tr>)}</tbody>
          </table>
        </figure>
        <div ref={feedback} className="vz-results-feedback" aria-live="polite">
          <strong>{method} · {benchmark.name} · 保留 {budget} / 576</strong>
          <span>用原始分复算，{raw(selected.raw[index])} ÷ {raw(benchmark.baseline)} × 100% ≈ <b>{calculatedRatio}%</b>。{calculatedRatio !== printedRatio ? '表 1 下行报告 ' + printedRatio + '%。' : '这就是表 1 下行的单项保留率。'} 同一行最右侧的 <b>{selected.average.toFixed(1)}%</b> 汇总了 11 项基准。</span>
          {budget === 128 && !tuned && benchmark.name === 'LLaVA-Bench' && <span>这格在原表中有出入：印刷的原始分复算为 97.0%，下行印为 97.6%。论文没有说明原因，此处同时保留两个读数。</span>}
        </div>
        <div className="vz-results-example">
          <b>微调后，单项和平均会一起涨吗？</b>
          <p>{budget === 64 && index === mmvetIndex
            ? '这里恰好相反。MMVet 从免训练的 31.7 分降至微调后的 30.2 分，保留率从 101.9% 降到 97.1%。同一预算下，11 项 Avg. 却从 94.0% 升到 95.2%。'
            : <>在 {budget} 个 token 下，微调前后的 {benchmark.name} 原始分是 {raw(scores.free.raw[index])} → {raw(scores.tuned.raw[index])}，11 项 Avg. 是 {scores.free.average.toFixed(1)}% → {scores.tuned.average.toFixed(1)}%。<button type="button" onClick={showMmvet}>看 64 个 token 时的 MMVet ↗</button></>}</p>
        </div>
        <p className="vz-results-note">{tuned
          ? '‡ 表示只更新投影层的权重。'
          : '免训练模式沿用原模型全部权重。表中的 ‡ 表示另做过投影层微调。'} <a href="#module-4-3" className="vz-results-cite">到 4.3 看为什么只调这一层 →</a></p>
      </section>

      <section className="vz-results-panel vzs-panel" id="module-4-2">
        <div className="vz-results-heading"><h3><span className="vzs-lab-num">4.2</span> 约 8 倍，计时到哪里？</h3><Citation href={paper + '#page=7'}>正文表 4</Citation></div>
        <p>这次换成 LLaVA-NeXT 7B。作者在单张 A800 80GB 上运行 POPE，把原模型的 2,880 个视觉 token 压到 160 个。表中分别记录了 <Term name="prefill">prefill</Term> 的首 token 延迟，以及整套测试的总耗时。</p>
        <div className="vz-timing-list">
          <div className="vz-timing-row">
            <div className="vz-timing-label"><b>生成首个 token</b><span>预填充延迟 · 毫秒</span></div>
            <div className="vz-timing-measure"><span>218 <small>ms</small></span><i aria-hidden="true">→</i><b>27.8 <small>ms</small></b></div>
            <strong className="vz-timing-ratio">7.8×</strong>
          </div>
          <div className="vz-timing-row">
            <div className="vz-timing-label"><b>跑完整套 POPE</b><span>实际总耗时 · 秒</span></div>
            <div className="vz-timing-measure"><span>2,293 <small>s</small></span><i aria-hidden="true">→</i><b>756 <small>s</small></b></div>
            <strong className="vz-timing-ratio">3.0×</strong>
          </div>
        </div>
        <p className="vz-results-note">两行都用未压缩模型的时间除以 VisionZip 的时间。首 token 之后还要逐个生成回答，整套测试又包含视觉编码等环节，因此两次计时给出不同倍数。</p>
      </section>

      <ProjectorLesson budget={budget} />

      <details className="vz-results-evidence">
        <summary>出处与口径</summary>
        <div>
          <h4>读表时认准同一条基线</h4>
          <p>表 1 在每个方法下排两行，上行给原始分，下行给同基准相对完整模型的分数，最后一列 Avg. 汇总 11 项相对分数。完整模型在 GQA 上得 61.9，在 MME 上得 1862，各自除以自己的基线后才求均值。一项高于 100% 表示它超过了同模型的原版得分。 <Citation href={paper + '#page=5'}>表 1</Citation></p>
          <p>图表逐格抄录正式 PDF。算式使用论文公布的原始分并四舍五入到一位小数，原分和百分比的显示精度会影响复算。保留 128 个 token 时，免训练的 LLaVA-Bench 原分 64.8 除以 66.8 得约 97.0%，表内却印为 97.6%。各项与 Avg. 都沿用作者报告值。FastV 和 SparseVLM 在语言模型内部删减，比较成本时还要算入它们在浅层处理的视觉位置。</p>
          <h4>另一台秒表测的是 TextVQA</h4>
          <p>补充表 19 报告整套 TextVQA 的实际测试时间。LLaVA-NeXT 13B 从原版的 2,880 个 token、2,506 秒，变为保留 640 个、1,219 秒。未压缩的 NeXT 7B 用了 1,598 秒。这是“压缩后的 13B 快过原版 7B”的一组具体比较。 <Citation href={supplement + '#page=9'}>补充表 19</Citation></p>
          <p><a className="vz-results-cite" href="#table-5">回到第 1 章，动手对比表 5 的候选位置 →</a></p>
        </div>
      </details>
    </div>
  );
}
