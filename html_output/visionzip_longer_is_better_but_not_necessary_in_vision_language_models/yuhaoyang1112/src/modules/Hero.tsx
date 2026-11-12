import { SegmentBar } from '../components/SegmentBar';
import { motionAllowed, useContentMotion } from '../components/motion';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Term } from '../components/Hint';
import { table1, type ResultBudget } from '../data/table1';
import { paper, pinned, repo, supplement } from '../data/tutorial';
import { Coast } from './Coast';
import './cover.css';

const authors = 'Senqiao Yang, Yukang Chen, Zhuotao Tian, Chengyao Wang, Jingyao Li, Bei Yu, Jiaya Jia';
const budgets: ResultBudget[] = [64, 128, 192];
// Supplementary Table 6 reports contextual positions for these three CLIP budgets.
const contextCounts: Record<ResultBudget, number> = { 64: 10, 128: 20, 192: 30 };

const routes = [
  { id: 'chap-2', label: '跟踪一个 patch', path: '§2 看打分、归组与输出' },
  { id: 'chap-3', label: '读作者代码', path: '§3 核对主导与上下文预算' },
  { id: 'chap-4', label: '核对实验结果', path: '§4–6 查精度、耗时、高分图与视频' },
];

function External({ href, children }: { href: string; children: string }) {
  return <a href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

function CoverFigure({ budget, onBudget }: { budget: ResultBudget; onBudget: (value: ResultBudget) => void }) {
  const [replay, setReplay] = useState(0);
  const plate = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (motionAllowed()) setReplay(n => n + 1);
    }, { threshold: .12 });
    if (plate.current) observer.observe(plate.current);
    return () => observer.disconnect();
  }, []);
  const readout = useContentMotion<HTMLDivElement>(budget);
  const contextual = contextCounts[budget];
  const dominant = budget - contextual - 1;
  const columns = budget === 64 ? 8 : 16;
  const groups = [
    { kind: 'cls', count: 1, term: 'CLS', label: 'CLS', note: '整张图的汇聚位置' },
    { kind: 'dom', count: dominant, term: '主导 token', label: '主导 patch', note: '直接保留隐藏特征' },
    { kind: 'ctx', count: contextual, term: '上下文代表', label: '上下文代表', note: '汇入同组 patch 的特征' },
  ] as const;
  return <figure ref={plate} className="vz-duel cover-plate" aria-label="CLIP 图像从 patch 到视觉输出的对照">
    <div className="vz-plate-tools">
      <SegmentBar value={budget} className="vz-budget-group" role="group" aria-label="封面视觉预算">
        <span>送入语言模型的预算</span>
        {budgets.map(n => <button type="button" key={n} aria-pressed={n === budget} onClick={() => onBudget(n)}>{n}</button>)}
      </SegmentBar>
      <button type="button" className="vz-cover-replay" aria-label="重播封面动画" onClick={() => setReplay(n => n + 1)}>↻ 重播</button>
    </div>
    <div className={'vz-duel-panes' + (replay ? ' is-playing' : '')} key={replay}>
      <div className="vz-duel-pane">
        <h3>视觉编码器输入 <span>24 × 24 个 patch</span></h3>
        <div className="vz-coast-frame"><Coast /><i className="vz-coast-grid" aria-hidden="true" /></div>
        <p>336 × 336 图像切成 576 块，CLIP 另加 1 个 CLS。</p>
      </div>
      <div className="vz-duel-pane vz-duel-out">
        <h3>VisionZip 输出 <span>{budget} 个视觉 token</span></h3>
        <div ref={readout} className="vz-token-readout">
          <div className="vz-token-grid" style={{'--columns': columns, '--rows': budget / columns} as CSSProperties} aria-hidden="true">
            {groups.flatMap(g => Array.from({length:g.count}, (_, i) => <i className={'vz-cell-' + g.kind} key={g.kind + i}/>))}
          </div>
          <ul className="vz-seq-legend">{groups.map(g => <li key={g.kind}>
            <i className={'vz-cell-' + g.kind} aria-hidden="true"/>
            <span><b>{g.count} 个 <Term name={g.term}>{g.label}</Term></b><small>{g.note}</small></span>
          </li>)}</ul>
        </div>
        <p>每格一个输出位置，按类型排布。<a href="#chap-3">去 §3 逐格点数 →</a></p>
      </div>
    </div>
    <figcaption>灯塔是教学插画。三档主导与上下文预算取自补充表 6；作者代码从主导预算中为 CLS 留出一位。 <External href={supplement + '#page=2'}>补充表 6</External> · <External href={pinned + 'visionzip/main.py#L5-L7'}>入口代码</External></figcaption>
  </figure>;
}

export default function Hero() {
  const [budget, setBudget] = useState<ResultBudget>(64);
  const scores = table1[budget];
  const cards = [
    { value: (budget / 576 * 100).toFixed(1) + '%', label: budget + ' 个输出占原始 576 个视觉位置的比例', source: '按预算计算', href: paper + '#page=5' },
    { value: scores.free.average.toFixed(1) + '%', label: budget + ' 档免训练，11 项基准相对完整模型的平均表现', source: '正文表 1', href: paper + '#page=5' },
    { value: scores.tuned.average.toFixed(1) + '%', label: budget + ' 档微调投影层后，相同 11 项基准的平均相对表现', source: '正文表 1 · ‡', href: paper + '#page=5' },
    { value: '7.8×', label: '另一组计时：LLaVA-NeXT 7B，160 档的预填充加速', source: '正文表 4 · A800', href: paper + '#page=7' },
  ];
  return <section id="top" aria-labelledby="cover-title" className="cover-card paper-cover">
    <header className="vz-cover-heading">
      <span className="vz-cover-kicker">INTERACTIVE TUTORIAL</span>
      <h1 id="cover-title" lang="en">VisionZip: Longer is Better but Not Necessary in Vision Language Models</h1>
      <p className="vz-cover-sub">一张图，怎样压成 64 个视觉 token？ · CVPR 2025</p>
      <p className="vz-cover-author" lang="en">{authors}</p>
      <p className="vz-cover-byline">香港中文大学 · 香港科技大学 · 哈尔滨工业大学（深圳） · <External href={paper}>论文原文</External> · <External href={repo}>作者代码</External></p>
      <p className="vz-cover-abstract">在 LLaVA-1.5 里，一张图原本要占语言模型的 576 个位置。VisionZip 在视觉编码器一侧先按注意力选出<Term name="主导 token"/>，再把其余 <Term name="patch"/> 的特征归入少数<Term name="上下文代表"/>。同一张图换个问题，这份压缩结果也能复用。</p>
      <div className="vz-cover-keywords" aria-label="论文关键词">
        {['视觉端压缩', '注意力打分', '特征归并', '多轮问答'].map(word => <span key={word}>{word}</span>)}
      </div>
    </header>
    <CoverFigure budget={budget} onBudget={setBudget} />
    <div className="vz-cover-stats" aria-live="polite">
      {cards.map(({value,label,source,href}) => <div key={source + href}><b>{value}</b><span>{label}</span><External href={href}>{source}</External></div>)}
    </div>
    <div className="vz-cover-routes"><span>按目的选一条路线</span>{routes.map(r => <a href={'#'+r.id} key={r.id}><b>{r.label}</b><small>{r.path}</small></a>)}</div>
    <div className="vz-cover-start"><a href="#chap-1">开始学习 §1 <span aria-hidden="true">→</span></a></div>
  </section>;
}
