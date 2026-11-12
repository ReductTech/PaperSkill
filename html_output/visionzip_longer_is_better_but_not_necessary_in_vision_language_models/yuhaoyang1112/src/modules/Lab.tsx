import { SegmentBar } from '../components/SegmentBar';
import { useContentMotion, motionAllowed } from '../components/motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Hint, Term } from '../components/Hint';
import { Coast } from './Coast';
import LabFormula from './LabFormula';
import { allocation, COLS, hidden, keySimilarity, PATCHES, position, ROWS } from './labModel';
import type { Encoder } from './labModel';
import './lab.css';

const base = 'https://github.com/JIA-Lab-research/VisionZip/blob/8f86b55c6f000eb033e6912538af2dd7dcb30502/visionzip/';
const supp = 'https://openaccess.thecvf.com/content/CVPR2025/supplemental/Yang_VisionZip_Longer_is_CVPR_2025_supplemental.pdf';
const paper = 'https://openaccess.thecvf.com/content/CVPR2025/html/Yang_VisionZip_Longer_is_Better_but_Not_Necessary_in_Vision_Language_CVPR_2025_paper.html';
const stages = ['主导筛选', '上下文归并', '送入 LLM'];
const vector = (v: number[]) => `[${v.map(x => +x.toFixed(2)).join(', ')}]`;
function Source({ href, children }: { href: string; children: string }) {
  return <a href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}
function describePatch(model: ReturnType<typeof allocation>, stage: number, i: number) {
  const g = model.groupOf[i];
  const group = model.groups[g];
  const representative = group?.target === i;
  const role = group ? representative ? `G${g + 1} 的代表` : `G${g + 1} 的贡献位置` : '主导 patch';
  const rank = model.ranked.indexOf(i) + 1;
  const score = model.scores[i].toFixed(3);
  if (stage === 0) return { title: group ? '进入剩余位置' : role, text: `接收分数 ${score}，第 ${rank}/${PATCHES} 名；${group ? '未入选前 ' + model.dominant.length + '，留待归并。' : '入选主导位置，保留原隐藏特征。'}` };
  if (!group) return { title: role, text: stage === 1 ? `排名第 ${rank}，直接保留，跳过分组。` : `以自身隐藏特征 ${vector(hidden[i])} 单独占一个输出位置。` };
  if (stage === 1) return { title: role, text: representative ? `均匀采样选中了此处；另有 ${group.donors.length} 个位置贡献给它。` : `分给以 ${position(group.target)} 为代表的 G${g + 1}，与代表的 key 余弦相似度为 ${keySimilarity(i, group.target).toFixed(3)}。` };
  return { title: role, text: `${representative ? '代表本身的特征' : '这个位置贡献的特征'}进入 G${g + 1} 的上下文特征 ${vector(group.vector)}，经投影进入 LLM。` };
}
function Arithmetic({ encoder }: { encoder: Encoder }) {
  const clip = encoder === 'CLIP';
  const [answer, setAnswer] = useState<number | null>(null);
  const cols = clip ? ['CLS', 'P1', 'P2', 'P3'] : ['P1', 'P2', 'P3'];
  const rows = clip
    ? [[.1, .4, .35, .15], [.1, .3, .15, .45]]
    : [[.2, .6, .2], [.1, .4, .5], [.3, .5, .2]];
  return <details className="vzlab-calc" id="module-2-2">
    <summary>2.2　手算一次 · 此刻的 {encoder} 怎么选？</summary>
    <p>{clip ? '下面是两个注意力头各自的 CLS 行。先略过 CLS 自身这一列，再把每个 patch 收到的两项相加。' :
      '这个矩阵已经跨头平均。每行表示一个查询位置，各行合计为 1。比较三个候选位置各自收到的列均值。'}</p>
    <table className="vzlab-matrix"><caption>独立的三位置教学示意，数值为人工设定</caption>
      <thead><tr><th scope="col">{clip ? 'CLS 查询' : '查询 ＼ 接收'}</th>{cols.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{rows.map((row, r) => <tr key={r}><th scope="row">{clip ? `头 ${r + 1}` : `P${r + 1}`}</th>
        {row.map((x, i) => <td key={i}>{x.toFixed(2)}</td>)}</tr>)}</tbody>
    </table>
    <div className="vzlab-quiz"><span>仅选一个主导 patch，你选谁？</span>
      <SegmentBar value={answer} role="group" aria-label="手算预测">{[1, 2, 3].map(n => <button type="button" key={n} aria-pressed={answer === n} onClick={() => setAnswer(n)}>P{n}</button>)}</SegmentBar>
    </div>
    {answer !== null && <div role="status" className="vzlab-solution">
      <b>{answer === (clip ? 1 : 2) ? '选对了。' : '再看看同一列。'}</b>
      {clip ? 'P1 得 0.40 + 0.30 = 0.70，超过 P2 的 0.50 与 P3 的 0.60。' :
        'P2 的列均值为 (0.60 + 0.40 + 0.50) / 3 = 0.50；P1 为 0.20，P3 为 0.30。'}
    </div>}
  </details>;
}

export default function Lab() {
  const [encoder, setEncoder] = useState<Encoder>('CLIP');
  const [budget, setBudget] = useState(9);
  const [contextual, setContextual] = useState(3);
  const [stage, setStage] = useState(0);
  const [pinned, setPinned] = useState(2); // A3 starts as a worked example.
  const [preview, setPreview] = useState<number | null>(null);
  // CLS has no grid coordinate; inspecting it must preserve the pinned patch.
  const [inspectCls, setInspectCls] = useState(false);
  const [playback, setPlayback] = useState<'idle' | 'playing' | 'paused'>('idle');
  const workbench = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    if (workbench.current) observer.observe(workbench.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (playback !== 'playing') return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const finishIfHidden = () => {
      if (!motionAllowed()) { setStage(2); setPlayback('idle'); }
    };
    finishIfHidden();
    document.addEventListener('visibilitychange', finishIfHidden);
    media.addEventListener('change', finishIfHidden);
    let timer: number | undefined;
    if (motionAllowed() && onScreen) {
      timer = window.setTimeout(() => {
        setStage(stage + 1);
        if (stage === 1) setPlayback('idle');
      }, 1500);
    }
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', finishIfHidden);
      media.removeEventListener('change', finishIfHidden);
    };
  }, [playback, stage, onScreen]);
  const stop = () => setPlayback('idle');
  const inspection = useContentMotion<HTMLDivElement>(encoder + '/' + stage + '/' + pinned, budget + '/' + contextual);
  const model = useMemo(() => allocation(encoder, budget, contextual), [encoder, budget, contextual]);
  const selected = preview ?? pinned;
  const groupNo = model.groupOf[selected];
  const group = model.groups[groupNo];
  const pos = position(selected);
  const showCls = inspectCls && stage === 2 && encoder === 'CLIP' && preview === null;
  const resetInspection = () => { stop(); setPreview(null); setInspectCls(false); };
  const go = (n: number) => { resetInspection(); setStage(n); };
  const pin = (i: number) => {
    resetInspection();
    setPinned(i);
  };
  const replay = () => {
    if (playback === 'playing') { setPlayback('paused'); return; }
    setPreview(null);
    setInspectCls(false);
    if (!motionAllowed()) { setStage(2); setPlayback('idle'); return; }
    if (playback !== 'paused') setStage(0);
    setPlayback('playing');
  };
  const playLabel = playback === 'playing' ? '暂停' : playback === 'paused' ? '继续' : '重播';
  const clip = encoder === 'CLIP';
  return <div className="vzlab vzs-lab" id="module-2-1" data-lab data-encoder={encoder} data-stage={stage + 1}
      data-pinned={position(pinned)} data-inspected={showCls ? 'CLS' : pos}
      data-budget={budget} data-dominant={model.dominant.length} data-contextual={contextual}>
    <div className="vzlab-top">
      <h3><span className="vzs-lab-num">2.1</span> 追踪灯塔图上的一个 patch</h3>
      <SegmentBar value={encoder} className="vzlab-switch" role="group" aria-label="视觉编码器">
        {(['CLIP', 'SigLIP'] as const).map(m => <button key={m} type="button"
          aria-pressed={encoder === m} onClick={() => { resetInspection(); setEncoder(m); }}>{m}</button>)}
      </SegmentBar>
    </div>
    <p className="vzs-lab-context">这里用 4 × 6 个图块和教学数据追踪每个位置。<a href="#chap-3">到第 3 章核对论文的 576 → 64 配置。</a></p>
    <div className="vzlab-controls">
      <label className="vzlab-budget">
        <span>输出预算 <strong>{budget}</strong></span>
        <input aria-label="输出预算" type="range" min={6} max={16} step={1} value={budget}
          onChange={e => { resetInspection(); setBudget(Number(e.currentTarget.value)); }}/>
      </label>
      <label className="vzlab-context-budget"><span>上下文名额</span>
        <select aria-label="上下文名额" value={contextual} onChange={e => { resetInspection(); setContextual(Number(e.currentTarget.value)); }}>
          {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
    </div>
    <div className="vzlab-stagebar">
      <SegmentBar value={stage} className="vzlab-steps" aria-label="实验步骤" role="group">{stages.map((s, i) =>
        <button key={s} type="button" aria-pressed={stage === i} onClick={() => go(i)}><b>{i + 1}</b>{s}</button>
      )}</SegmentBar>
      <button type="button" onClick={replay} className="vzlab-replay" aria-label={playLabel + '三个步骤'}>
        <span aria-hidden="true">{playback === 'playing' ? 'Ⅱ' : playback === 'paused' ? '▸' : '↻'}</span> {playLabel}</button>
    </div>
    <div ref={workbench} className="vzlab-workbench">
      <figure className="vzlab-view">
        <div className="vzlab-photo" data-patch-grid aria-label="海岸图，四行六列">
          <Coast/>
          <div className="vzlab-grid">
            {model.scores.map((score, i) => {
              const dominant = model.dominant.includes(i);
              const g = model.groupOf[i];
              const target = g >= 0 && model.groups[g].target === i;
              const highlight = stage === 1 && g >= 0 && g === groupNo;
              const isSelected = !showCls && selected === i;
              const hint = describePatch(model, stage, i);
              return <button type="button" key={i} data-position={position(i)} data-kind={dominant ? 'dominant' : target ? 'target' : 'donor'}
                data-group={g + 1} data-hint-title={`${position(i)} · ${hint.title}`} data-hint={hint.text}
                aria-label={`${position(i)}，${hint.title}，评分 ${score.toFixed(3)}`}
                className={['vzlab-patch', dominant ? 'is-dom' : '', target && stage > 0 ? 'is-target' : '',
                  highlight ? 'is-member' : '', isSelected ? 'is-selected' : '', i === pinned ? 'is-pinned' : ''].filter(Boolean).join(' ')}
                aria-pressed={i === pinned} onClick={() => pin(i)}
                onPointerEnter={e => { if (e.pointerType !== 'touch') setPreview(i); }}
                onPointerLeave={() => setPreview(prev => prev === i ? null : prev)}
                onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setPreview(i); }}
                onBlur={() => setPreview(prev => prev === i ? null : prev)}
                onKeyDown={e => { if (e.key === 'Escape') setPreview(null); }}>
                <span>{position(i)}</span>
                {stage > 0 && target && <b>G{g + 1}</b>}
              </button>;
            })}
          </div>
          <span className="vzlab-pin-layer" aria-hidden="true" style={{
            width: (100 / COLS) + '%', height: (100 / ROWS) + '%',
            transform: 'translate(' + (pinned % COLS) * 100 + '%, ' + Math.floor(pinned / COLS) * 100 + '%)',
          }}/>
          {stage === 1 && group && <svg className="vzlab-traces" viewBox="0 0 600 400" aria-hidden="true">
            {group.donors.map(i => <line key={i} className={selected === i ? 'from-current' : undefined} x1={((i % COLS) + .5) * 100} y1={(Math.floor(i / COLS) + .5) * 100}
              x2={((group.target % COLS) + .5) * 100} y2={(Math.floor(group.target / COLS) + .5) * 100}/>)}
          </svg>}
        </div>
        <div className="vzlab-legend">
          <span><i className="vzlab-pin-icon"/><Hint text="点一个格子固定追踪；悬停或用 Tab 临时查看另一个格子。移开后回到固定位置。">固定坐标</Hint></span><span><i className="vzlab-du"/><Term name="主导 token">主导 patch</Term></span>
          {stage > 0 && <><span><i className="vzlab-cu"/><Term name="上下文代表"/></span>
            {stage === 1 && <span><i className="vzlab-line"/>同组贡献</span>}</>}
          {stage === 0 && <span><i className="vzlab-blank"/>剩余位置</span>}
        </div>
        <figcaption className="vzlab-scale">这里的 4×6 格、默认输出 9 个，是可手算的教学示意；真实 CLIP 配置的 576 个 <Term name="patch"/> 与 64 个输出见<a href="#chap-3">第 3 章</a>。</figcaption>
      </figure>
      <div ref={inspection} className="vzlab-inspect" aria-live="polite" aria-atomic="true">
        <div className="vzlab-tracking"><b>固定 {position(pinned)}</b>
          {preview !== null && preview !== pinned && <span>临时查看 {pos}</span>}
          {showCls && <span>查看 CLS 输出</span>}
        </div>
        {stage === 0 ? <>
          <h4>{pos}{group ? ' 留待归并' : ' 入选主导 patch'}</h4>
          <p>{clip ? <>把每个头的 <Hint text="CLIP 的全局查询位置。取它发出的这一行，再读每个 patch 对应的列。">CLS 行</Hint>相加，</> : <>跨头平均后，读每个 patch 收到注意力的<Hint text="固定一列、沿所有查询行求平均。所得分数表示这列对应的位置平均收到多少注意力。">列均值</Hint>，</>}
            取前 <b>{model.dominant.length}</b> 名。{group ? `${pos} 进入剩余位置集合。` : `${pos} 将直接保留自己的隐藏特征。`}</p>
          <div className="vzlab-reading"><b>{pos}</b><span>分数 <strong>{model.scores[selected].toFixed(3)}</strong></span><span>排名 <strong>{model.ranked.indexOf(selected) + 1} / {PATCHES}</strong></span></div>
        </> : stage === 1 ? <>
          <h4>{pos}{!group ? ' 跳过归并' : selected === group.target ? ` 是 G${groupNo + 1} 的代表` : ` 归入 G${groupNo + 1}`}</h4>
          {!group ? <p><b>{pos}</b> 已作为主导 patch 单独保留，不参加上下文归并。</p> : <>
            {selected === group.target ? <p><b>{pos}</b> 由均匀采样选为 <b>G{groupNo + 1}</b> 的代表。{group.donors.length ? `另有 ${group.donors.length} 个位置贡献给它。` : '本组没有其他贡献位置，输出只保留代表自身。'}</p> :
              <p><b>{pos}</b> 是贡献位置，归入以 <b>{position(group.target)}</b> 为代表的 <b>G{groupNo + 1}</b>。它与代表的 <Term name="key">key</Term> 余弦相似度为 <b>{keySimilarity(selected, group.target).toFixed(3)}</b>，在候选代表中最高。</p>}
            <div className="vzlab-members" data-donors><b>给 {position(group.target)} 贡献的位置</b>{group.donors.length ? group.donors.map(i => <span key={i} className={i === selected ? 'active' : undefined}>{position(i)}</span>) : <span>0 个</span>}</div>
          </>}
          <div className="vzlab-groupbuttons" role="group" aria-label="选择上下文代表">{model.groups.map((g, i) =>
            <button type="button" aria-pressed={i === groupNo} key={g.target} aria-label={`追踪 G${i + 1} 的代表 ${position(g.target)}`} onClick={() => pin(g.target)}>G{i + 1}</button>
          )}</div>
        </> : <>
          <h4>{showCls ? 'CLS 单独进入输出' : group ? `${pos} 随 G${groupNo + 1} 进入输出` : `${pos} 直接进入输出`}</h4>
          {showCls ? <p><b>CLS</b> 是全局 token，独占第一个视觉位置。它没有对应的图像格子；图上仍固定着 <b>{position(pinned)}</b>。</p> :
            !group ? <p><b>{pos}</b> 是主导 patch，以自己的<Term name="隐藏特征"/> <strong>{vector(hidden[selected])}</strong> 单独进入输出序列。</p> : <>
              {selected === group.target ? <p><b>{pos}</b> 是 <b>G{groupNo + 1}</b> 的代表。{group.donors.length ? `它加上其他 ${group.donors.length} 个组员的平均隐藏特征，生成一个上下文 token。` : '本组没有其他组员，增量为零，输出等于代表的隐藏特征。'}</p> :
                <p><b>{pos}</b> → 归入以 <b>{position(group.target)}</b> 为代表的 <b>G{groupNo + 1}</b> → 以 <b>G{groupNo + 1}</b> 的上下文特征进入输出。{pos} 的隐藏特征 {vector(hidden[selected])} 参与了组员均值。</p>}
              <div className="vzlab-merged"><small>代表 ＋ 贡献者均值</small>G{groupNo + 1} = {vector(hidden[group.target])} + {vector(group.vector.map((x, d) => x - hidden[group.target][d]))} = {vector(group.vector)}</div>
            </>}
        </>}
        <div className="vzlab-ref">{stage === 0
          ? clip ? <Source href={base + 'clip_encoder.py#L43-L57'}>CLIP 打分与筛选 · L43–57</Source> : <Source href={supp + '#page=2'}>SigLIP 打分 · 补充算法 3</Source>
          : stage === 1 ? <Source href={base + 'clip_encoder.py#L64-L75'}>代表采样与分配 · L64–75</Source> : <Source href={base + 'clip_encoder.py#L75-L83'}>合并与拼接 · L75–83</Source>}</div>
      </div>
    <div className="vzlab-output" aria-label="最终视觉序列">
      <div className="vzlab-output-head"><b>经<Term name="投影层"/>进入 LLM</b>
        <span>{clip ? '1 CLS ＋ ' : ''}{model.dominant.length} 主导 ＋ {contextual} 上下文 ＝ <strong>{budget}</strong></span>
      </div>
      <div className="vzlab-tokens">
        {clip && <button type="button" className="vzlab-cls" aria-label="查看 CLS 特征" aria-pressed={showCls}
          onClick={() => { go(2); setInspectCls(true); }}>CLS</button>}
        {model.dominant.map(i => <button type="button" key={i} className="vzlab-outdom"
          aria-label={`查看主导特征 ${position(i)}`} aria-pressed={!showCls && selected === i}
          onClick={() => { pin(i); setStage(2); }}>{position(i)}</button>)}
        {model.groups.map((g, i) => <button type="button" key={g.target} className="vzlab-outctx"
          aria-label={`查看上下文特征 G${i + 1}`} aria-pressed={!showCls && groupNo === i}
          onClick={() => { pin(model.groupOf[pinned] === i ? pinned : g.target); setStage(2); }}>G{i + 1}</button>)}
      </div>
    </div>
    </div>
    <div className="vzlab-explain">
      <LabFormula stage={stage} clip={clip} pinned={pinned}/>
      {stage === 1 && <p>取出 {model.dominant.length} 个主导 patch 后，{model.remaining.length} 个剩余位置按原图顺序排列。从第一个起，以 {model.stride} 为步长，共取 {contextual} 个代表。</p>}
      {stage === 2 && <p>代表自身的特征单独相加。其余成员一起求均值；没有成员时，增量为零。投影器把拼好的序列映射到语言模型的输入空间。</p>}
    </div>
    <Arithmetic key={encoder} encoder={encoder}/>
    <details className="vzlab-calc vzlab-source"><summary>出处与口径</summary>
      <p>这张插画固定为 {ROWS}×{COLS} 个 patch。评分来自两头教学注意力，分组使用合成三维 <Term name="key">key</Term>，实际聚合的是另设的二维<Term name="隐藏特征"/>。每次改预算都重新筛选、抽代表和分配。整数名额和坐标只服务于这个实验。</p>
      <p>CLIP 从倒数第二层取出注意力和隐藏状态，跨头平均的 key 来自同一层。注意力图中的发出方在行、接收方在列。SigLIP 的打分遵循补充算法 3；本实验用相同归并步骤接上它的打分结果。</p>
      <div className="vzlab-ref"><Source href={paper}>正文 §2.3 · 算法 1、2</Source><Source href={supp}>补充 §A.2 · 算法 3</Source><Source href={base + 'utils.py#L89'}>key 的来源 · utils.py L89</Source><Source href={base + 'clip_encoder.py#L42-L85'}>CLIP 选择与归并</Source></div>
    </details>
  </div>;
}
