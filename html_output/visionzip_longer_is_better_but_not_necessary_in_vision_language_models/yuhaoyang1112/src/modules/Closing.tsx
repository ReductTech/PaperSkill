import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion } from '../components/motion';
import { useState } from 'react';
import { glossary, type TermKey } from '../data/glossary';
import { paper, pinned, repo, supplement, videos } from '../data/tutorial';
import visionZipCover from '../assets/videos/visionzip-video.webp';
import vitCover from '../assets/videos/vit-video.webp';
import './closing.css';

const cvpr = 'https://openaccess.thecvf.com/content/CVPR2025';
const commit = '8f86b55c6f000eb033e6912538af2dd7dcb30502';
const code = pinned + 'visionzip/';

const comparisons = [
  { name: 'FastV', stage: 2, where: '解码器浅层之后', basis: '按浅层注意力给视觉位置排序，保留高分位置。', fate: '低分位置退出后续层；此前的浅层已经看过全图。', cite: '图 5 · §4.1', url: 'https://arxiv.org/html/2403.06764v2#S4.SS1' },
  { name: 'VTW', stage: 2, where: '解码器的撤回层', basis: '在校准样本上比较输出分布，用 KL 散度选撤回层。', fate: '全部视觉位置在该层一并退出。后层依靠已吸收视觉信息的文本状态。', cite: '图 2 · §3', url: 'https://arxiv.org/html/2405.05803v2#S3' },
  { name: 'DivPrune', stage: 1, where: '投影后，进入 LLM 前', basis: '按特征的余弦距离，贪心选择彼此差异大的位置。', fate: '仅所选原位置进入 LLM，其余位置直接舍弃。', cite: '图 2 · 算法 1', url: cvpr + '/papers/Alvar_DivPrune_Diversity-based_Visual_Token_Pruning_for_Large_Multimodal_Models_CVPR_2025_paper.pdf#page=3' },
  { name: 'SparseVLM', stage: 2, where: '解码器多个层', basis: '让与图像相关的文本 token 充当评分员，逐层筛视觉位置。', fate: '从待剪池回收其中分数较高的一部分，聚类并重建为少量 token。', cite: '§3.2–3.3', url: 'https://arxiv.org/html/2410.04417v4#S3.SS2' },
  { name: 'VisionZip', stage: 0, where: '视觉塔出口，投影前', basis: '按视觉注意力选主导位置，按 key 相似度给其余位置分组。', fate: '主导特征直接保留，每组贡献一个上下文特征；两部分一起投影。', cite: '图 3 · 算法 1–2', url: paper + '#page=3' },
];

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="vz-cite" href={href} target="_blank" rel="noreferrer">{children}<span aria-hidden="true"> ↗</span></a>;
}

function MethodCard({ method, label }: { method: typeof comparisons[number]; label: string }) {
  const detail = useContentMotion<HTMLElement>(method.name);
  return <article ref={detail} className={'vz-method-card vz-stage-' + method.stage}>
    <header><span>{label}</span><h4>{method.name}</h4></header>
    <div className="vz-method-path" aria-label={'压缩位置：' + method.where}>
      {['视觉塔出口', '投影后', 'LLM 内部'].map((step, i) => <span key={step} className={method.stage === i ? 'active' : ''}>{step}</span>)}
    </div>
    <dl><dt>动手的位置</dt><dd>{method.where}</dd><dt>怎样选</dt><dd>{method.basis}</dd><dt>其余位置去了哪里</dt><dd>{method.fate}</dd></dl>
    <SourceLink href={method.url}>{method.cite}</SourceLink>
  </article>;
}

export function Compare() {
  const [selected, setSelected] = useState(0);
  const visionZip = comparisons[comparisons.length - 1];
  return <section className="vz-compare" id="module-7-1" aria-labelledby="vz-method-title">
    <h3 id="vz-method-title"><span className="vzs-lab-num">7.1</span>同一张图，在哪一步缩短？</h3>
    <p className="vz-compare-lead">选一篇对读。沿着视觉塔、投影器和语言模型往下看，留意其余位置是被舍弃、撤回还是归入代表。</p>
    <SegmentBar value={selected} className="vz-pick-bar" role="group" aria-label="与 VisionZip 对照的方法">
      {comparisons.slice(0, -1).map((m, i) => <button key={m.name} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)}>{m.name}</button>)}
    </SegmentBar>
    <div className="vz-method-pair" aria-live="polite">
      <MethodCard method={comparisons[selected]} label="所选论文"/>
      <MethodCard method={visionZip} label="本篇"/>
    </div>
    <details className="vz-end-evidence">
      <summary>出处与口径 · 怎样对照这张图</summary>
      <p>DivPrune 图 2 把选择画在 projector 之后。VisionZip 的 LLaVA 代码先在视觉塔内拼接两组特征，再投影。两者都缩短了语言模型第一层的输入。 <SourceLink href={code + 'clip_encoder.py#L66-L85'}>VisionZip 拼接位置</SourceLink></p>
      <p>VTW 为候选层打分。SparseVLM 从待剪位置中选一部分用于回收。VisionZip 从全部非主导位置里先抽代表，再把其余位置一一分给代表。 <SourceLink href="https://arxiv.org/html/2410.04417v4#S3.SS3">SparseVLM §3.3</SourceLink></p>
    </details>
  </section>;
}

const verdictLevels = [
  { name: '有直接证据', items: [
    { title: '64 档保住了多少表现？', detail: '表 1 中，LLaVA-1.5 7B 的免训练配置保留完整模型平均相对表现的 94.0%，微调投影器后为 95.2%。这两列汇总的是同一组 11 个基准。', cite: '表 1', url: paper + '#page=5', chapter: 4 },
    { title: '7.8 倍量的是哪段时间？', detail: '在单张 A800 80GB 上跑 POPE，LLaVA-NeXT 7B 从 2,880 个视觉 token 压到 160 个。首 token 延迟从 218 ms 降至 27.8 ms，整套评测从 2,293 秒降至 756 秒。论文分别报告 7.8 倍和 3.0 倍。', cite: '表 4', url: paper + '#page=7', chapter: 4 },
    { title: '54 为什么只选了 53 个 patch？', detail: '作者的 CLIP 参数入口先为 CLS 扣除一个名额。最终输出包括 53 个高分 patch、1 个 CLS 和 10 个上下文 token，共 64 个。', cite: '作者代码 · main.py 第 5–7 行', url: code + 'main.py#L5-L7', chapter: 3 },
    { title: '高分辨率图像只留 160 个位置，读文字掉了几分？', detail: 'LLaVA-NeXT 的免训练结果里，TextVQA 从 61.3 到 56.2，降了 5.1 分。同一行的 92.0% 是七项任务各自相对基线的平均表现。', cite: '表 2', url: paper + '#page=6', chapter: 5 },
    { title: '整段视频留下 136 个位置，哪个任务最接近原分？', detail: 'Video-LLaVA 同样取八帧，VisionZip 每帧留下 17 个位置。ActivityNet 从 43.1 到 43.0，最接近原分；TGIF 从 47.1 到 42.4。', cite: '表 3', url: paper + '#page=6', chapter: 6 },
  ] },
  { name: '有解释支持', items: [
    { title: '背景位置为何能携带主体信息？', detail: '图 6(b) 中，与人物有关的亮点落在路面。作者用跨位置的信息聚合解释这一现象。表 5 中，预先遮掉视觉注意力最高的 50 个位置后，再让 SparseVLM 筛选，得分也从 51.1 降到 46.4。', cite: '图 5–6、表 5', url: paper + '#page=7', chapter: 1 },
  ] },
  { name: '仍待验证', items: [
    { title: '同图追问很小的文字时，还能答对吗？', detail: '视觉侧选取独立于问题，因此同图可以复用视觉表示。§4.3 和图 7 给了多轮对话例子，读者无法从这组例子估计细粒度追问的总体成功率。', cite: '§4.3、图 7', url: paper + '#page=8', chapter: 1 },
    { title: '换设备、换输入长度后会快多少？', detail: '表 4 给定了模型、GPU、任务和视觉预算。若要把首 token 和整套评测的加速比用于另一种设备或配置，需要在新设置下各自计时。', cite: '表 4 的评测设置', url: paper + '#page=7', chapter: 4 },
  ] },
];

function Verdicts() {
  const [level, setLevel] = useState(0);
  const [selection, setSelection] = useState(0);
  const category = verdictLevels[level];
  const choice = category.items[selection];
  const detail = useContentMotion<HTMLElement>(choice.title);
  return <>
    <p className="vz-end-question">读完论文，哪些话可以直接引用，哪些仍需要实验？</p>
    <SegmentBar value={level} role="group" aria-label="结论等级" className="vz-pick-bar">{verdictLevels.map((c, i) =>
      <button type="button" key={c.name} aria-pressed={level === i} onClick={() => { setLevel(i); setSelection(0); }}>{c.name} · {c.items.length}</button>)}</SegmentBar>
    <div className="vz-answer-pair">
      <div role="group" aria-label="该等级的结论" className="vz-item-list">{category.items.map((item, i) =>
        <button type="button" key={item.title} aria-pressed={selection === i} onClick={() => setSelection(i)}>{item.title}</button>)}</div>
      <article ref={detail} aria-live="polite" className="vz-selected-detail"><h3>{choice.title}</h3><p>{choice.detail}</p>
        <div className="vz-detail-links"><SourceLink href={choice.url}>{choice.cite}</SourceLink><a href={'#chap-' + choice.chapter}>回到 §{choice.chapter} →</a></div>
      </article>
    </div>
  </>;
}

function Glossary() {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<TermKey>('patch');
  const terms = Object.keys(glossary) as TermKey[];
  const query = filter.trim().toLowerCase();
  const matches = terms.filter(key => Object.values(glossary[key]).join(' ').toLowerCase().includes(query));
  const active = matches.includes(selected) ? selected : matches[0];
  const item = active && glossary[active];
  const detail = useContentMotion<HTMLElement>(active ?? "");

  return <>
    <label className="vz-gloss-search"><span aria-hidden="true">⌕</span><input type="search" value={filter} onChange={e => setFilter(e.currentTarget.value)} placeholder="查找术语，如 CLS、余弦或预填充" aria-label="查找术语"/></label>
    {item ? <div className="vz-answer-pair glossary-pair">
      <div role="group" aria-label="术语词条" className="vz-term-choices">{matches.map(key =>
        <button type="button" key={key} aria-pressed={active === key} onClick={() => setSelected(key)}>{glossary[key].short}</button>)}</div>
      <article ref={detail} className="vz-selected-detail" aria-live="polite"><h3>{item.title}</h3><dl><dt>直觉</dt><dd>{item.meaning}</dd><dt>在 VisionZip 中</dt><dd>{item.role}</dd></dl></article>
    </div> : <p role="status" className="vz-empty">未找到匹配术语。<button type="button" onClick={() => setFilter('')}>显示全部</button></p>}
  </>;
}


const sources = [
  { name: 'CVPR 2025 正文', desc: '§2.4 解释投影层微调。表 1 至表 3 依次给出常规图像、高分辨率图像与视频的结果，表 4 记录耗时。', url: cvpr + '/html/Yang_VisionZip_Longer_is_Better_but_Not_Necessary_in_Vision_Language_CVPR_2025_paper.html' },
  { name: 'CVPR 补充材料', desc: '算法 3 给出无 CLS 的选择规则，表 6、7 列出两种图像模型的预算分配，图 8 展示同一段视频的两种取帧方式。', url: supplement },
  { name: '作者代码 · 固定版本', desc: '提交 8f86b55。main.py 第 5–7 行扣除 CLS 名额，clip_encoder.py 第 49–83 行完成选择、归组与拼接。', url: repo + '/tree/' + commit },
];

export function Closing() {
  return <div className="vz-ending">
    <section className="vz-endcard" id="closing" aria-labelledby="vz-verdict-title">
      <h2 id="vz-verdict-title">收束 · 结论分级</h2>
      <Verdicts/>
    </section>
    <section className="vz-endcard" id="glossary" aria-labelledby="vz-gloss-title">
      <h2 id="vz-gloss-title">术语表 <small>{Object.keys(glossary).length} 条</small></h2>
      <Glossary/>
    </section>
    <section className="vz-endcard" id="sources" aria-labelledby="vz-sources-title">
      <h2 id="vz-sources-title">来源与证据边界</h2>
      <ul className="vz-source-list">{sources.map(source => <li key={source.name}><SourceLink href={source.url}>{source.name}</SourceLink><p>{source.desc}</p></li>)}</ul>
      <details className="vz-end-evidence"><summary>出处与口径 · 从论文读到代码</summary><p>补充表 6 的 dominant=54 包含 CLS。<SourceLink href={code + 'main.py#L5-L7'}>参数入口</SourceLink>先减一，<SourceLink href={code + 'clip_encoder.py#L49-L57'}>选择代码</SourceLink>再把 CLS 放回，送出 53 个主导 patch 加 1 个 CLS。另有 10 个上下文 token。</p><p>SigLIP 的打分依据来自补充算法 3。归组演示采用固定 CLIP 实现第 66–83 行的规则。实验中的小图与可调分数用于跟踪运算；正文表格中的测量值来自作者评测。 <SourceLink href={supplement + '#page=2'}>补充算法 3</SourceLink> · <SourceLink href={code + 'clip_encoder.py#L66-L83'}>合并实现</SourceLink></p></details>
    </section>
    <section className="vz-endcard" id="videos" aria-labelledby="vz-videos-title">
      <h2 id="vz-videos-title">B 站延伸学习</h2>
      <div className="vz-video-stack">{videos.map((video, i) => <a className={'vz-video vz-video-' + i} href={'https://www.bilibili.com/video/' + video.bvid + '/'} key={video.bvid} target="_blank" rel="noreferrer">
        <div className="vz-video-cover" aria-hidden="true"><img src={i === 0 ? visionZipCover : vitCover} alt="" width="320" height="180" loading="lazy" /><span>▶ {video.duration}</span></div><div className="vz-video-text"><span className="vz-video-class">{video.scope}</span><h3>{video.title}</h3><span className="vz-byline">UP 主 · {video.up}</span><p>{video.note}</p></div><span className="vz-video-arrow" aria-hidden="true">↗</span>
      </a>)}</div>
    </section>
  </div>;
}
