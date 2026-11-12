import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion } from '../components/motion';
import { useRef, useState, type KeyboardEvent } from 'react';
import { pinned, supplement } from '../data/tutorial';
import { Term } from '../components/Hint';

const kinds = [
  { count: 1, key: 'cls', title: 'CLS', note: '从视觉序列索引 0 单独取出。入口给主导预算减 1，正是为这个位置留座。' },
  { count: 53, key: 'dom', title: '主导 patch', note: '取 CLS 对 576 个 patch 的注意力，跨头求和后选前 53 名。它们的隐藏特征按原序保留。' },
  { count: 10, key: 'ctx', title: '上下文 token', note: '余下 523 个 patch 中，10 个作代表，另外 513 个各归入一个代表。每个代表输出一个合并特征。' },
] as const;
const links = [
  ['入口预算','visionzip/main.py#L5-L7','把 dominant − 1 和 contextual 写入视觉塔的配置。'],
  ['挑出主导位置','visionzip/clip_encoder.py#L42-L57','读取倒数第二层，取 CLS 行，跨注意力头求和，再做 top-k；把索引 0 放回保留集合。'],
  ['归组与合并','visionzip/clip_encoder.py#L59-L83','过滤主导位置，归一化 key 后找最相似的代表；将归入成员的平均 hidden 加到代表特征上。'],
  ['送去投影','visionzip/llava_arch.py#L29-L37','压缩后的图像序列交给 mm_projector，映射到 LLM 的词嵌入空间。'],
];

export default function Budget() {
  const [selected, setSelected] = useState(1);
  const [cell, setCell] = useState<number | null>(null);
  const [tabStop, setTabStop] = useState(0);
  const grid = useRef<HTMLDivElement>(null);
  const navigate = (event: KeyboardEvent, i: number) => {
    const move: Record<string,number> = { ArrowLeft:i-1, ArrowRight:i+1, ArrowUp:i-8, ArrowDown:i+8, Home:0, End:63 };
    if (!(event.key in move)) return;
    event.preventDefault();
    grid.current?.querySelectorAll('button')[Math.max(0,Math.min(63,move[event.key]))]?.focus();
  };
  const detail = useContentMotion<HTMLDivElement>(cell === null ? 'kind-' + selected : 'cell-' + cell);
  const item = kinds[selected];
  return <div className="lesson-body">
    <p className="chapter-lead">在 LLaVA-1.5 的 CLIP 视觉塔里，336 × 336 的图像按 14 × 14 切块，得到 24 × 24 = 576 个 <Term name="patch"/>。编码器还带一个 <Term name="CLS"/>，所以可读到 577 个隐藏状态。现在给压缩后的视觉序列留 64 个位置。</p>
    <div className="code-call"><code>visionzip(model, <b>dominant=54</b>, <em>contextual=10</em>)</code><a href={supplement+'#page=2'} target="_blank" rel="noreferrer">补充表 6 ↗</a></div>
    <div className="budget-panel vzs-panel" id="module-3-1"><div className="panel-heading"><h3><span className="vzs-lab-num">3.1</span> 64 个位置，逐格点数</h3><span className="fine">每格 = 1 个输出 token</span></div>
      <div className="budget-layout"><div ref={grid} className="budget-mosaic" role="group" aria-label="64 个输出位置，可用方向键逐格查看">
        {Array.from({length:64},(_,i) => {
          const k = i === 0 ? 0 : i < 54 ? 1 : 2;
          const category = k === 2 ? '上下文代表（合并后的 token）' : kinds[k].title;
          const number = '输出序号 '+(i+1)+' / 64';
          return <button key={i} type="button" className={'budget-cell cell-'+kinds[k].key+(k===selected?' lit':'')}
            aria-label={number+'，'+category} aria-pressed={cell===i} data-hint-title={number} data-hint={category}
            tabIndex={tabStop===i?0:-1} onFocus={()=>setTabStop(i)} onKeyDown={e=>navigate(e,i)}
            onClick={()=>{setSelected(k);setCell(i);setTabStop(i);}}>{i+1}</button>;
        })}
      </div>
        <div className="budget-read"><SegmentBar value={selected} className="budget-kinds" role="group" aria-label="查看各类输出">{kinds.map((k,i) => <button key={k.key} onClick={() => {setSelected(i);setCell(null);}} aria-pressed={selected===i} className={'kind-'+k.key}><b>{k.count}</b>{k.title}</button>)}</SegmentBar>
          <div ref={detail} className="budget-feedback" aria-live="polite"><b>{cell===null ? item.count+' 个'+item.title : '第 '+(cell+1)+' 个输出 · '+item.title}</b><p>{item.note}</p></div></div>
      </div>
      <p className="fine">指向、点按或用方向键逐格查看。格内标的是一维输出序号，从 1 开始，每 8 格折一行。原图坐标取决于输入图像。</p>
    </div>
    <h3 className="vzs-subheading" id="module-3-2"><span className="vzs-lab-num">3.2</span> 把三种颜色对回代码</h3>
    <ol className="code-trail">{links.map(([label,url,desc]) => <li key={label}><div><b>{label}</b><a href={pinned+url} target="_blank" rel="noreferrer">{url.replace('visionzip/','').replace('#L', ' · L')} ↗</a></div><p>{desc}</p></li>)}</ol>
    <details className="source-fold"><summary>出处与口径</summary><p>64 是补充表 6 的预算档。固定提交 <code>8f86b55</code> 中函数签名的默认值是 191 和 30。这里跟踪的是单张固定分辨率图像、CLIP 视觉塔的张量路径；SigLIP 的序列没有这个 CLS。</p><p>取主导 patch 后还剩 576 − 53 = 523 个位置。代码按步长 ⌊523 / 10⌋ = 52，在过滤后的序列上取下标 0、52、…、468。后续分配比较的是特征方向，两块相距很远的区域也可能归入同一个代表。</p><a href={pinned+'visionzip/clip_encoder.py#L64-L83'} target="_blank" rel="noreferrer">核对代表抽取、计数与拼接 ↗</a></details>
  </div>;
}
