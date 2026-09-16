import {useState} from 'react';
import {c78Data as d,c78SourceSnapshots,c78Q5Evidence,c78PaperRoot} from '../data/tutorial';
import {SourceEvidence,UnderstandingCheck,MechanismFeedback} from './LearningKit';
import './h1-learning789.css';
import './h1-c8-practice.css';
export const sourceSnapshots=c78SourceSnapshots;
export const q5Evidence=c78Q5Evidence;
type Action='old'|'actor'|'date'|'dateonly'|'unknown'|'submit';
type Practice={view:Action|null;read:string[];selected:string[];submitted:boolean};
export const emptyPractice:Practice={view:null,read:[],selected:[],submitted:false};
export function executePractice(p:Practice,a:Action):Practice{return {...p,view:a,read:a==='actor'||a==='date'?Array.from(new Set([...p.read,a])):p.read,submitted:a==='submit'};}
export function selectEvidence(p:Practice,key:string):Practice{if(!p.read.includes(key))return p;return {...p,submitted:false,selected:p.selected.includes(key)?p.selected.filter(x=>x!==key):[...p.selected,key]};}
export function practiceSupport(p:Practice){return {identity:p.read.includes('actor')&&p.selected.includes('actor'),date:p.read.includes('date')&&p.selected.includes('date')};}
export function C8(){
 const [index,setIndex]=useState(0),[evidence,setEvidence]=useState<'actor'|'date'|null>(null);const s=sourceSnapshots[index],actor=index>=2,date=index>=4;
 const choose=(i:number)=>{setIndex(i);setEvidence(null)};
 return <div className="h1-789 h1-case" onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation()}}>
 <p className="h1-case-question">Drew Gehling 为 Gord 配音的游戏，何时在 PlayStation 2 发行？</p><p>论文该次搜索共40轮。沿作者公开的7个节点，观察两段证据关系如何建立；节点之间未公开的操作保持空缺。</p>
 <div className="h1-case-timeline" aria-label="公开轨迹节点">{sourceSnapshots.map((v,i)=><button key={v.title} aria-pressed={index===i} onClick={()=>choose(i)}><small>原轮次 {v.turn}</small>{v.title}</button>)}</div>
 <div className="h1-789-choices"><button id="c8-prev" disabled={index===0} onClick={()=>choose(index-1)}>上一公开节点</button><button id="c8-next" className="h1-primary" disabled={index===6} onClick={()=>choose(index+1)}>下一公开节点</button><button id="c8-reset" onClick={()=>choose(0)}>从头查看</button></div>
 <div className="h1-case-chain" aria-label="人物、游戏、平台与日期的证据关系"><div data-supported={actor}><strong>Drew Gehling</strong><span>角色 Gord</span></div><div className="h1-case-link"><span>{actor?'演员原文支持 →':'关系待确认 ⇢'}</span><button disabled={!actor} onClick={()=>setEvidence(evidence==='actor'?null:'actor')}>查看人物依据</button></div><div data-supported={actor}><strong>Bully</strong><span>目标游戏</span></div><div className="h1-case-link"><span>{date?'发行列表支持 →':'发行依据待查 ⇢'}</span><button disabled={!date} onClick={()=>setEvidence(evidence==='date'?null:'date')}>查看日期依据</button></div><div data-supported={date}><strong>PlayStation 2</strong><span>{date?'2006年10月17日':'日期未知'}</span></div></div>
 {evidence&&<div className="h1-case-evidence"><h4>{evidence==='actor'?'演员资料的公开节选':'发行商列表的公开节选'}</h4><blockquote>{q5Evidence[evidence].text}</blockquote><p>这段文字支持：{q5Evidence[evidence].relation}。</p><p>来源记录：{q5Evidence[evidence].id}</p></div>}
 <div className="h1-case-record"><h4>原轮次 {s.turn} · {s.title}</h4><dl><dt>已有信息</dt><dd>{d.qObservation[index]}</dd><dt>模型动作</dt><dd><code>{d.qActions[index]}</code></dd><dt>公开返回</dt><dd>{d.qReturns[index]}</dd><dt>状态变化</dt><dd>{d.qDiffs[index]}</dd></dl></div>
 <MechanismFeedback tone={index===1||index===5?'warning':'info'}>{index===1?'模型在错误方向上搜索，但英文 Bully 页面仍保留为低重要性。这里的可恢复性来自已有资料仍可访问，不是模型已经判断正确。':index===2?'演员资料把人物、角色与游戏连起来，足以修正游戏方向；它还没有给出 PS2 发行日期。下一次搜索因此有了更明确的目标。':index===3?'判断修正后，精选也随之调整。原文公开英文 Bully 仍为低重要性，不能把它改绘成已被移除或已升为高重要性。':index===4?'人物关系和平台日期都已有公开片段。第10轮的5/30是一个独立中途快照，不能从上一个快照补造所有增删过程。':index===5?'核验动作已发生，但作者没有公布返回。上方文字证据仍可查看，核验状态保持未知，不能自动标记为通过。':index===6?'同一个日期还能命中无关新闻和电影。只匹配日期字符串不能完成身份、游戏与平台的关系核对。作者报告最后召回1.0，但没有公开完整最终精选。':'开始时问题给出人物、角色和平台。搜索出现候选游戏，还需要原文把这些约束连接起来。'}</MechanismFeedback>
 <SourceEvidence title={'核对当前公开片段与精选快照 · 原轮次 '+s.turn} href={c78PaperRoot+s.anchor}><p>{s.text}</p>{s.c.length>0?<ul>{s.c.map(v=><li key={v}>{v}</li>)}</ul>:<p>此节点没有公开完整精选列表。</p>}<p>{d.qBoundary}</p></SourceEvidence>
 <C8Practice/>
 <UnderstandingCheck question="第11轮调用了 verify，教程应该怎样显示结果？" options={['既然继续搜索，就标记核验通过','保持返回未知，并保留已公开的文本证据','把未知视为该发行日期错误']} answer={1} explanations={['继续搜索不能证明核验返回通过，原文没有公开这一结果。','正确。公开动作、公开证据与未公开返回要分别呈现。','没有返回是信息缺失，并不等于主张错误。']}/>
 </div>
}

function C8Practice(){
 const [practice,setPractice]=useState<Practice>({...emptyPractice});
 const support=practiceSupport(practice),active=practice.view==='actor'||practice.view==='date'?practice.view:null;
 const documents=[{key:'actor',label:'片段A：人物资料'},{key:'date',label:'片段B：发行列表'}] as const;
 return <details className="h1-789-details h1-c8-practice"><summary>独立练习：由你决定最后提交哪些证据</summary>
 <p>现在只使用两段公开文本，自行决定阅读顺序与最终选择。完成后点击“提交我的证据集合”，再检查它能否回答本章的问题。</p>
 <p className="h1-c8-practice-boundary">这是基于公开片段的教学练习，不是作者的原始操作记录，也没有执行搜索模型。练习的选择和重置不会改变上方的公开轨迹。</p>
 <div className="h1-c8-practice-work"><section><h4>可查看的文本片段</h4><div className="h1-789-choices" role="group" aria-label="独立练习阅读片段">{documents.map(doc=><button key={doc.key} aria-pressed={active===doc.key} onClick={()=>setPractice(p=>executePractice(p,doc.key))}>{doc.label} · {practice.read.includes(doc.key)?'已读':'未读'}</button>)}</div>
 <div className="h1-c8-practice-reader">{active?<><h4>{documents.find(doc=>doc.key===active)?.label}</h4><blockquote>{q5Evidence[active].text}</blockquote><p className="h1-c8-practice-source">原文记录：{q5Evidence[active].id}</p><button aria-pressed={practice.selected.includes(active)} onClick={()=>setPractice(p=>selectEvidence(p,active))}>{practice.selected.includes(active)?'从我的集合移出此片段':'把此片段加入我的集合'}</button></>:<p>任选一个片段查看内容。查看后，可以决定是否保留。</p>}</div></section>
 <section><h4>我的选择图</h4><p>实线连接已选片段，虚线表示尚未选入。</p><div className="h1-c8-selection-graph" aria-label={'练习已选'+practice.selected.length+'段文本'}>{documents.map(doc=><div className="h1-c8-selection-row" key={doc.key} data-selected={practice.selected.includes(doc.key)}><span>{doc.label}<small>{practice.read.includes(doc.key)?'已读':'未读'}</small></span><span className="h1-c8-selection-edge" aria-hidden="true"/><strong>{practice.selected.includes(doc.key)?'已选入':'未选入'}</strong></div>)}<div className="h1-c8-selection-target">我的证据集合：<strong>{practice.selected.length} 段</strong></div></div>
 <div className="h1-789-choices"><button className="h1-primary" onClick={()=>setPractice(p=>executePractice(p,'submit'))}>提交我的证据集合</button><button onClick={()=>setPractice({...emptyPractice})}>重置独立练习</button></div></section></div>
 {practice.submitted&&<MechanismFeedback tone={support.identity&&support.date?'success':'warning'}>{support.identity&&support.date?'两段公开文本合起来支持了完整关系：人物资料连接 Drew Gehling、Gord 与 Bully；发行列表连接 Bully、PlayStation 2 与2006年10月17日。这个判断来自片段内容，并不补造作者第11轮未公开的 verify 返回。':support.identity?'目前选择支持人物、角色与游戏的关系，但还缺少这个游戏在 PlayStation 2 上何时发行的依据。演员身份资料本身不能证明平台发行日期。':support.date?'目前选择给出了 Bully 在 PlayStation 2 的发行日期，但还没有证明它就是 Drew Gehling 为 Gord 配音的游戏。只有游戏与日期相符，还不能覆盖问题的人物约束。':'当前集合没有提供可用于回答的片段。需要让最终提交的文本共同覆盖问题中的人物、角色、游戏、平台和日期关系。'}</MechanismFeedback>}
 </details>
}
