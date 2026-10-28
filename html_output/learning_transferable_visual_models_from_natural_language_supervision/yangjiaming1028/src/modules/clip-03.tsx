import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { WidgetProps } from './registry';
import { SceneArt, type SceneKind } from '../components/SceneArt';
import './pair-explorer.css';

const samples: { name: string; kind: SceneKind; caption: string }[] = [
  { name:'猫', kind:'cat', caption:'一只橘猫坐在窗边的扶手椅上。' },
  { name:'狗', kind:'dog', caption:'一只金色的狗在草地上休息。' },
  { name:'汽车', kind:'car', caption:'一辆汽车行驶在山间公路上。' },
];
const scores = [[0.82,0.33,0.08],[0.25,0.86,0.06],[0.07,0.12,0.90]];

export function Clip03({ chapterId, moduleId }: WidgetProps) {
  const [view,setView] = useState<'pair'|'matrix'>('pair');
  const [image,setImage] = useState(0);
  const [answers,setAnswers] = useState<(number|null)[]>([null,null,null]);
  const [cell,setCell] = useState<[number,number]>([0,0]);
  const [direction,setDirection] = useState<'row'|'column'>('row');
  const stageRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);
  const answer = answers[image];
  const matched = answer === image;
  const scope = direction === 'row' ? cell[0] : cell[1];
  const candidate = direction === 'row' ? cell[1] : cell[0];
  const chooseCandidate = (index:number) => setCell(direction === 'row' ? [scope,index] : [index,scope]);
  const enterMatrix = () => { if(view==='matrix') return; setCell([image,answer ?? image]); pendingFocus.current=true; setView('matrix'); };
  useEffect(()=>{
    if (!pendingFocus.current) return;
    pendingFocus.current=false;
    stageRef.current?.focus({preventScroll:true});
    stageRef.current?.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  },[view]);

  return <div className="clip-lab pair-explorer" id={'matching-'+chapterId+'-'+moduleId}>
    <nav className="m3-steps" aria-label="配对实验步骤">
      <button type="button" aria-pressed={view==='pair'} onClick={()=>setView('pair')}><span>01</span><b>认识原始配对</b></button>
      <i aria-hidden="true">→</i>
      <button type="button" aria-pressed={view==='matrix'} onClick={enterMatrix}><span>02</span><b>看整批如何比较</b></button>
    </nav>
    <div ref={stageRef} className="m3-stage" tabIndex={-1}>
    {view==='pair' ? <>
      <div className="m3-intro"><h3>这张图片，对应哪段描述？</h3><p>先点一段描述，看看什么叫“原始配对”。真实训练直接使用数据中已有的图文对，不需要你逐一做这道题。</p></div>
      <div className="m3-choice-workbench">
        <section className="m3-picture-panel" aria-label="当前图片与即时反馈">
          <div className="m3-samples" role="group" aria-label="选择示例图片">{samples.map((sample,i)=><button key={sample.kind} type="button" aria-label={`选择图片 ${i+1}：${sample.name}`} aria-pressed={image===i} onClick={()=>setImage(i)}><span>I{i+1}</span>{sample.name}</button>)}</div>
          <div className="m3-photo" key={image}><SceneArt kind={samples[image].kind}/><span>图片 I{image+1}</span></div>
          <div className={'m3-immediate'+(answer===null?'':matched?' is-match':' is-other')} role="status" aria-atomic="true">
            <span className="m3-pair-symbol" aria-hidden="true">{answer===null?'?':matched?'✓':'↔'}</span>
            <div><strong>{answer===null?'先选择一段描述':matched?'找到了原始配对':'这是批内非配对'}</strong><p>{answer===null?'点选后，图片与文字的关系会显示在这里。':matched?`图片 I${image+1} 与文字 T${answer+1} 原本属于同一对。`:`图片是${samples[image].name}，文字描述${samples[answer].name}；它们不是数据中的原始配对。`}</p></div>
          </div>
        </section>
        <section className="m3-description-panel" aria-label="为当前图片选择描述">
          <div className="m3-control-heading"><h4>点击一段描述</h4><span>为图片 I{image+1} 选择</span></div>
          <div className="m3-options" role="group" aria-label="候选描述">{samples.map((sample,i)=><button className={'m3-option'+(answer===i?' is-chosen':'')} key={sample.kind} type="button" aria-label={`选择文字 T${i+1}：${sample.caption}`} aria-pressed={answer===i} onClick={()=>setAnswers(old=>old.map((value,j)=>j===image?i:value))}><span>T{i+1}</span><strong>{sample.caption}</strong><i aria-hidden="true">{answer===i?'✓':'↗'}</i></button>)}</div>
          <div className="m3-why" aria-live="polite"><b>{answer===null?'找到原配之后，还要做什么？':'不只看这一对，还要与其他候选比较。'}</b><p>训练希望原始配对比另外两段描述得到更高的分数。这样，“更相似”才有比较对象。</p></div>
          <button className="m3-primary" type="button" onClick={enterMatrix}>看 3 对图文如何比较 <span aria-hidden="true">→</span></button>
        </section>
      </div>
    </> : <>
      <div className="m3-intro"><h3>原配只有 3 对，比较却有 9 次</h3><p>每张图片都与 3 段文字比较。点击格子，查看一个具体组合；切换方向，还能看文字怎样寻找图片。</p></div>
      <div className="m3-comparison-tools">
        <div className="m3-direction" role="group" aria-label="选择比较方向"><button type="button" aria-pressed={direction==='row'} onClick={()=>setDirection('row')}>图片找文字</button><button type="button" aria-pressed={direction==='column'} onClick={()=>setDirection('column')}>文字找图片</button></div>
        <label>{direction==='row'?'固定图片':'固定文字'}<select aria-label={direction==='row'?'固定图片':'固定文字'} value={scope} onChange={e=>setCell(direction==='row'?[Number(e.target.value),cell[1]]:[cell[0],Number(e.target.value)])}>{samples.map((sample,i)=><option key={sample.kind} value={i}>{direction==='row'?'I':'T'}{i+1} · {sample.name}</option>)}</select></label>
      </div>
      <div className="m3-matrix-workbench">
        <section className="m3-matrix-panel" aria-label="三对图文的九次比较">
          <div className="m3-matrix-title"><b>点一个格子，看对应图文</b><span>示例相似度</span></div>
          <div className="m3-grid" role="group" aria-label="图文相似度矩阵"><span className="m3-axis m3-origin"><span>文 →</span><span>图 ↓</span></span>{samples.map((sample,j)=><span key={j} className="m3-axis"><b>T{j+1}</b>{sample.name}</span>)}{samples.map((sample,i)=><div key={i} className="m3-grid-row"><span className="m3-axis"><b>I{i+1}</b>{sample.name}</span>{scores[i].map((value,j)=><button key={j} type="button" className={'m3-cell'+(i===j?' is-pair':'')+((direction==='row'?cell[0]===i:cell[1]===j)?' in-scope':'')} aria-label={`图片 I${i+1} ${samples[i].name}与文字 T${j+1} ${samples[j].name}，相似度${value.toFixed(2)}，${i===j?'原始配对':'批内非配对'}`} aria-pressed={cell[0]===i&&cell[1]===j} style={{'--score':value} as CSSProperties} onClick={()=>setCell([i,j])}><strong>{value.toFixed(2)}</strong><small>{i===j?'原配':'非配对'}</small></button>)}</div>)}</div>
          <div className={'m3-cell-readout'+(cell[0]===cell[1]?' is-pair':'')} role="status"><span>I{cell[0]+1} · {samples[cell[0]].name} <i>×</i> T{cell[1]+1} · {samples[cell[1]].name}</span><b>{scores[cell[0]][cell[1]].toFixed(2)}</b><small>{cell[0]===cell[1]?'原始配对':'批内非配对'}</small></div>
          <div className="m3-counts"><span><b>3</b> 原始配对</span><i>+</i><span><b>6</b> 批内非配对</span><i>=</i><span><b>9</b> 次比较</span></div>
        </section>
        <section className="m3-relative-panel" aria-label="当前行或列的候选比较">
          <div className="m3-source">{direction==='row'?<SceneArt kind={samples[scope].kind}/>:<span className="m3-text-source">T{scope+1}</span>}<div><small>{direction==='row'?'固定一张图片，比较这一行':'固定一段文字，比较这一列'}</small><h4>{direction==='row'?`${samples[scope].name}图片 I${scope+1}`:samples[scope].caption}</h4></div></div>
          <div className="m3-branches" key={direction+'-'+scope}><svg className="m3-links" viewBox="0 0 40 210" preserveAspectRatio="none" aria-hidden="true"><path d="M3 105H12V35H37M12 105H37M12 105V175H37"/><path className="m3-trace" pathLength="1" d="M3 105H12V35H37M12 105H37M12 105V175H37"/></svg><div className="m3-candidates" role="group" aria-label="比较三个候选">{samples.map((sample,index)=>{const score=direction==='row'?scores[scope][index]:scores[index][scope];return <button className="m3-candidate" key={index} type="button" aria-label={`比较候选：${sample.name}${direction==='row'?'文字':'图片'}，相似度${score.toFixed(2)}`} aria-pressed={candidate===index} onClick={()=>chooseCandidate(index)} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(index+(['ArrowLeft','ArrowUp'].includes(event.key)?2:1))%3;chooseCandidate(next);(event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();}}><span>{direction==='row'?'T':'I'}{index+1} · {sample.name}{index===scope&&<small>原始配对</small>}</span><b>{score.toFixed(2)}</b><i aria-hidden="true"><span style={{width:`${score*100}%`}}/></i></button>})}</div></div>
          <div className="m3-learning-point"><b>训练希望：原配比同行、同列的其他候选得分更高。</b><p>这里只展示比较方式；具体怎样把分数变成损失，会在第 7 章拆开看。</p></div>
        </section>
      </div>
      <p className="m3-boundary">分数是预先设定的教学示例，不来自你刚才的选择，也不会因点击而训练模型。真实数据中，非配对图注也可能描述相似内容。</p>
    </>}
    </div>
  </div>;
}
export default Clip03;
