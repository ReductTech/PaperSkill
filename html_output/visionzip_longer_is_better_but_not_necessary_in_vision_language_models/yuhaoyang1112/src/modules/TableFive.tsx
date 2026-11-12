import { useId, useState } from 'react';
import { Term } from '../components/Hint';
import { paper } from '../data/tutorial';
import layer10 from '../assets/evidence/fig5-layer-10.jpg';
import layer12 from '../assets/evidence/fig5-layer-12.jpg';
import layer23 from '../assets/evidence/fig5-layer-23.jpg';
import layer24 from '../assets/evidence/fig5-layer-24.jpg';
import person from '../assets/evidence/fig6b-person.jpg';
import './table-five.css';

const layers = [
  { number: 10, image: layer10, note: '注意力较分散' },
  { number: 12, image: layer12, note: '少数亮点出现' },
  { number: 23, image: layer23, note: '倒数第二层，最集中' },
  { number: 24, image: layer24, note: '最后一层再度分散' },
];

const routes = [
  { label: '完整候选池', pool: 576, result: '51.1', delta: '基线' },
  { label: '遮掉注意力最高的 50 个', pool: 526, result: '46.4', delta: '−4.7 分' },
  { label: '先由 VisionZip 预选', pool: 128, result: '52.5', delta: '+1.4 分' },
] as const;

function PaperRef({children, page = 7}: {children: string; page?: number}) {
  return <a className="ref t5-reference" href={paper + '#page=' + page} target="_blank" rel="noreferrer">{children} ↗</a>;
}

export function TableFive() {
  const name = useId();
  const [guess, setGuess] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  function reset() {
    setGuess(null);
    setRevealed(false);
  }
  return <section id="table-5" className="t5-section" aria-labelledby="t5-title">
    <h3 id="t5-title" className="vzs-subheading"><span className="vzs-lab-num">1.2</span> 图块的位置，决定它携带什么吗？</h3>
    <p>回到论文里的一张街景。盯住出租车旁的人，再沿着同一张图走过四层。第 10 层的亮处分布在许多位置，第 12 层开始聚拢；第 23 层只剩少数特别亮的格子，到了最后一层又有所分散。VisionZip 在这条 CLIP 路径取倒数第二层。</p>
    <figure className="t5-layers">
      <figcaption><b>同一张街景，四层注意力</b><PaperRef>正文图 5 原图节选</PaperRef></figcaption>
      <div className="t5-layer-strip">{layers.map(layer => <div key={layer.number} className={layer.number === 23 ? 't5-picked' : ''}>
        <img src={layer.image} width="227" height="165" alt={'第 ' + layer.number + ' 层街景热图，' + layer.note} loading="lazy" />
        <div><b>第 {layer.number} 层</b><span>{layer.note}</span></div>
      </div>)}</div>
    </figure>
    <figure className="t5-man">
      <img src={person} width="382" height="282" alt="原图中人物胸前有一个红点，人物脚边左下的路面有被红圈标出的黄色高响应位置。" loading="lazy" />
      <figcaption><b>与人物相关的位置，为何亮在路上？</b><p>图 6(b) 的红点标出人物，红圈却画在左下角的路面。作者把这里的亮点解释为汇集了人物信息的代理位置。经过多层自注意力，一个位置的<Term name="隐藏特征">隐藏特征</Term>已经可以含有别处的信息。</p><PaperRef>正文图 6(b) 原图节选</PaperRef></figcaption>
    </figure>
    <div className={'t5-test' + (revealed ? ' t5-open' : '')}>
      <div className="t5-test-head"><span>TextVQA · SparseVLM</span><PaperRef>正文表 5</PaperRef></div>
      <h4>遮掉注意力最高的 50 个位置，得分会怎样？</h4>
      <p>三路都交给 SparseVLM 筛到 64 个。相比完整候选池，你预测先遮掉这 50 个位置后，TextVQA 的准确率会下降、接近原值，还是上升？</p>
      <fieldset className="t5-predict" disabled={revealed}><legend className="t5-visually-hidden">预测遮掉 50 个高分位置后的准确率变化</legend>
        {['下降','接近原值','上升'].map(choice => <label key={choice} className={guess === choice ? 't5-guess' : ''}>
          <input type="radio" name={name} value={choice} checked={guess === choice} onChange={() => setGuess(choice)} />{choice}
        </label>)}
      </fieldset>
      <div role="group" aria-label="三种候选池经过筛选后的准确率">
        <div aria-hidden="true" className="t5-column-head"><span>怎样准备候选</span><span>候选 → 最终</span><span>准确率</span></div>
        {routes.map((route, i) => <div key={route.pool} className={'t5-line' + (revealed ? ' t5-line-' + i : '')}>
          <span className="t5-route-label"><b>{route.label}</b></span>
          <span className="t5-counts" aria-label={route.pool + ' 个候选筛到 64 个'}><b>{route.pool}</b><i aria-hidden="true">→</i><b>64</b></span>
          <span className="t5-number">{revealed ? <><strong>{route.result}</strong><small>{route.delta}</small></> : <span aria-label="等待揭晓">?</span>}</span>
        </div>)}
      </div>
      <div className="t5-foot">
        {revealed ? <button type="button" className="t5-retry" onClick={reset}>再猜一次</button> : <button type="button" onClick={() => setRevealed(true)} disabled={guess === null}>揭晓表 5 <span aria-hidden="true">→</span></button>}
        <span aria-live="polite">{revealed ? (guess === '下降' ? '猜中了。' : '实际结果是下降。') + '遮掉 50 个高分位置后，从 51.1 降至 46.4。' : guess !== null ? '已选好，可以揭晓。' : '先选一个方向。'}</span>
      </div>
      {revealed && <p className="t5-meaning">改变的是<b>候选池</b>，最终预算始终是 <b>64</b>。128 个预选候选也能得到 52.5，说明这项任务受候选里有哪些信息影响。单凭这三行，还无法判断某个位置具体储存了哪些细节。</p>}
    </div>
    <details className="source-fold"><summary>出处与口径 · 这三行能说明什么？</summary><p>表 5 比较 TextVQA 同一最终预算下的候选池。基线为 51.1，屏蔽视觉侧最高分的 50 个位置后降到 46.4，先用 VisionZip 选出 128 个候选则达到 52.5。页面用原始分数相减得到 −4.7 和 +1.4 分，原表的 Δ 列以基线作分母，写作 −9.2% 和 +2.7%。</p><p>这组对照支持“候选里有哪些位置会影响结果”。图 5、6 是同一张街景的可视化，表 5 是整个评测的结果。这个实验既没有逐个标注代理位置存了什么，也没有把上下文合并的贡献单独测出来。</p><PaperRef page={8}>正文 §4.2 · 三条路线的设置</PaperRef></details>
  </section>;
}
