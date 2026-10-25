import {concepts} from '../data/knowledgeBase';
import {conceptChapters} from '../data/knowledgeUnlocks';
import ConceptSketch from './ConceptSketch';
export default function FinalKnowledgeReview({unlocked}:{unlocked:string[]}){return <div className="final-concepts"><p>已解锁 {unlocked.length} / 13 个概念。解锁来自实际探索和阅读，不由打开章节触发。重置本章会重新锁定该章相关概念。</p>{concepts.map(([name,analogy,_from,_to,technical],i)=>unlocked.includes(name)?<details key={name}><summary>{name} · 已解锁</summary><p><strong>生活类比：</strong>{analogy}</p><ConceptSketch name={name}/><details><summary>展开技术解释</summary><p>{technical}</p></details></details>:<p className="knowledge-locked" key={name}>○ 探索主题 {i+1} · 尚未解锁<span>完成 ACT {conceptChapters[name]} 中的相关观察后可查阅</span></p>)}</div>;}
