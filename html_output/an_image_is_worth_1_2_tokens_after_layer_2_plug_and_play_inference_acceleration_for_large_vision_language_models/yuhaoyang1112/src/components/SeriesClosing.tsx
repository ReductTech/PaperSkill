import { SlidingChoices } from './SlidingChoices';
import { signalReading } from '../lib/controlMotion';
import { useLayoutEffect, useRef, useState } from 'react';
import { tutorial } from '../data/tutorial';
import { EVIDENCE, GLOSSARY, LINKS } from '../modules/glossary';
import { BiliVideos } from './BiliVideos';
import './seriesClosing.css';

const findings = [
  {
    title: '论文已验证',
    items: [
      { claim: '深层里，每个视觉 token 得到多少注意力？', basis: '在 LLaVA-1.5-7B 的 1,000 个图文样本中，深层的视觉 token 合计约分到 3% 的注意力；按每个位置平均，系统提示约为视觉 token 的 472 倍。', source: 'fig3', chapter: 3 },
      { claim: '从第 3 层起剪半，四项任务均分怎样变化？', basis: 'LLaVA-1.5-13B 取 K=2、R=50%：Table 1 的理论 FLOPs 从 154.6B 降至 84.6B，四项均分均为 73.6。单项分数仍有升降。', source: 'tab1', chapter: 6 },
      { claim: '13B 在哪次实测里追平了 7B 的速度？', basis: '单张 A40、A-OKVQA、K=0、R=50% 随机剪枝。13B 剪后单样本延迟为 0.341 秒，完整 7B 为 0.344 秒；两者分别占用 30G 和 19G 显存。', source: 'tab4', chapter: 9 },
    ],
  },
  {
    title: '有解释但未证实',
    items: [
      { claim: '高度关注的“锚点”存着视觉信息吗？', basis: '作者提出浅层会将图像与指令的信息汇集到少数位置。图 4 显示了深层对少数位置的高注意力；要确定哪些位置携带了视觉信息，还需直接检验隐藏特征及其因果作用。', source: 'sec34', chapter: 4 },
    ],
  },
  {
    title: '仍然未知',
    items: [
      { claim: '按注意力排序相对随机丢弃的优势有多稳定？', basis: '重训的 7B 模型在 Table 7 的四项任务上分别高 0.6、1.7、0.2、0.4 分。论文未给出随机对照的重复次数和方差。', source: 'tab7', chapter: 7 },
      { claim: 'K=0 掉分，能单独归因于剪得太早吗？', basis: '移到语言模型入口剪枝时，模型既少了看全图的机会，也没有上一层注意力可供排序。现有对照同时改变了这两个条件。', source: 'sec41', chapter: 5 },
    ],
  },
];

const retell = [
  ['K=2、R=50% 时，一张图在各层分别占多少位置？', '在 LLaVA-1.5 的 576 个视觉位置中，前两层都处理完整序列，实际缩短序列的实现从第 3 层起处理 288 个视觉位置。'],
  ['要查排序分数究竟取自哪一行，应该看哪里？', '对照正文 §4.1 和作者的剪枝代码。固定提交先对上一层各个注意力头求平均，然后取最后一个查询位置的一行，在视觉 token 范围内选 topk。'],
  ['怎样核对“理论计算量约为 55%”和“延迟追平 7B”这两句话？', '分开查表。前者见 Table 1 的 13B、K=2 注意力排序；后者见 Table 4 的 A40、K=0 随机筛选。两个报告值对应不同配置和指标。'],
];

const sources = [
  [LINKS.paper, 'ECCV 2024 正式论文', '图 3、4 查注意力分布，表 1 查理论计算量与任务分数，表 4 查实际延迟，表 7 查剪枝对照。'],
  [LINKS.supp, 'ECCV 补充材料', '图 7 给出逐层注意力图，附录 A 说明评测任务、提示词与评分口径。'],
  [LINKS.code, '作者代码 · 剪枝实现 L736–759', '固定提交 d1659729。沿查询位置、视觉片段、topk 和原始顺序，核对留下的 hidden states。'],
  [LINKS.readme, '作者仓库 · 同一提交的 README', '对照掩码评测、实际缩短序列的计时和后来加入的 KV Cache 实现。'],
  [LINKS.arxiv, 'arXiv:2403.06764', '预印本与版本历史。教程中的图、表、公式编号采用 ECCV 正式版。'],
];

function useReadingChange(selection: string) {
  const node = useRef<HTMLElement>(null);
  const previous = useRef(selection);
  useLayoutEffect(() => {
    if (previous.current !== selection && node.current) signalReading(node.current);
    previous.current = selection;
  }, [selection]);
  return node;
}

function ClosingVerdicts() {
  const [category, setCategory] = useState(0);
  const [selected, setSelected] = useState(0);
  const group = findings[category];
  const item = group.items[selected];
  const ref = EVIDENCE[item.source];
  const detail = useReadingChange(item.claim);
  return (
    <section className="chap fv-close" id="closing" aria-labelledby="closing-t">
      <h2 className="chap-title" id="closing-t"><span className="num">✦</span>收束：结论分级<span className="badge-tag">总结</span></h2>
      <div className="chap-bridge">
        <div className="cb-icon" aria-hidden="true">?</div>
        <div className="cb-body"><div className="cb-title">本节问题</div><div className="cb-text">第 2 层后能剪半，这句话在什么模型、哪几项实验里成立？</div></div>
      </div>
      <section className="module">
        <div className="module-head"><span className="num">✦</span><h4>结论分级：已验证 / 有解释但未证实 / 仍然未知</h4></div>
        <div className="module-body">
          <p className="module-desc">选一个问题，查看证据和适用条件，再回到对应章节核对。</p>
          <SlidingChoices className="fv-close-tabs" selected={category} label="结论等级">
            {findings.map((level, i) => (
              <button type="button" key={level.title} aria-pressed={i === category}
                onClick={() => { setCategory(i); setSelected(0); }}>
                {level.title}（{level.items.length}）
              </button>
            ))}
          </SlidingChoices>
          <div className="fv-close-panes">
            <div className="fv-close-choices" role="group" aria-label="结论条目">
              {group.items.map((claim, i) => <button type="button" key={claim.claim} aria-pressed={selected === i} onClick={() => setSelected(i)}>{claim.claim}</button>)}
            </div>
            <article ref={detail} className="fv-close-detail" aria-live="polite" aria-atomic="true">
              <h5>{item.claim}</h5>
              <p>{item.basis}</p>
              <div><a href={ref.href} target="_blank" rel="noreferrer">{ref.where} ↗</a><a href={'#chap-' + item.chapter}>去 §{item.chapter} 细看 →</a></div>
            </article>
          </div>
        </div>
      </section>
      <details className="v9-deep"><summary>复述练习：用自己的话讲一遍（3 问）</summary>
        {retell.map(([q, a], i) => <details className="fv-close-retell" key={q}><summary>{i + 1}. {q}</summary><p>{a}</p></details>)}
      </details>
    </section>
  );
}

const termKeys = Object.keys(GLOSSARY);

function ClosingGlossary() {
  const [selected, setSelected] = useState(termKeys[0]);
  const term = GLOSSARY[selected];
  const detail = useReadingChange(selected);
  return (
    <section className="chap fv-close" id="glossary" aria-labelledby="glossary-t">
      <h2 className="chap-title" id="glossary-t"><span className="num">✦</span>术语表<span className="badge-tag">{termKeys.length} 条</span></h2>
      <div className="fv-close-gloss">
        <div className="fv-gloss-terms" role="group" aria-label="选择术语">
          {termKeys.map((key) => (
            <button key={key} type="button" aria-pressed={selected === key}
              aria-controls="fv-gloss-detail" onClick={() => setSelected(key)}>{key}</button>
          ))}
        </div>
        <article ref={detail} id="fv-gloss-detail" className="fv-gloss-detail" aria-live="polite" aria-atomic="true">
          <h3>{term.name}</h3>
          <dl>
            <dt>直觉</dt><dd>{term.intuition}</dd>
            <dt>在本文中的作用</dt><dd>{term.role}</dd>
          </dl>
        </article>
      </div>
    </section>
  );
}

export default function SeriesClosing() {
  return (
    <>
      <ClosingVerdicts />
      <ClosingGlossary />
      <section className="chap fv-close" id="sources" aria-labelledby="sources-t">
        <h2 className="chap-title" id="sources-t"><span className="num">✦</span>来源与证据边界<span className="badge-tag">溯源</span></h2>
        <ul className="fv-close-sources">
          {sources.map(([url, title, note]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{title} ↗</a><span>{note}</span></li>)}
        </ul>
        <div className="v9-check"><b>数值口径</b>　热气球上的分数与保留位置用于演示排序。理论 FLOPs 可按 §4.2 的公式复算；比较耗时还要对齐硬件、缓存和计时范围。</div>
      </section>
      <BiliVideos items={tutorial.bilibili || []} />
    </>
  );
}
