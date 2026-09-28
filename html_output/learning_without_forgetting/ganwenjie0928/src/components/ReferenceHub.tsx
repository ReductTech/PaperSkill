import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  allKnowledgeCards, sourceCategories,
  type ClaimCard, type ConfusionCard, type DatasetCard, type EvidenceCard, type FormulaCard, type KnowledgeCard,
  type MethodCard, type PhaseCard, type SourceCategory, type SymbolCard,
} from '../data/knowledge';
import { evidence, evidenceById, termById, terms } from '../data/registry';
import { MathFormula } from './MathFormula';
import { InlineNotation } from './InlineNotation';

export type HubRequest = { termId?: string; evidenceId?: string; cardId?: string };
type RefKind = KnowledgeCard['kind'] | 'term' | 'paper source';
type RefField = { label: string; value: string };
type RefEntry = { id:string; kind:RefKind; title:string; summary:string; category:string; fields:RefField[]; scenes:string[]; related:string[]; evidenceIds:string[]; boundary?:string; keywords:string; formulaId?:string };

const kindLabels:Record<RefKind,string>={symbol:'符号',formula:'公式',dataset:'数据集',method:'方法',phase:'训练阶段',confusion:'常见误区',evidence:'论文证据',claim:'主张审计',term:'术语', 'paper source':'证据登记'};
const termAliases:Record<string,string>={
  theta_s:'symbol:theta_s', theta_o:'symbol:theta_o', theta_n:'symbol:theta_n', x_new:'symbol:x_new', y_old:'symbol:y_old', y_new:'symbol:y_new',
  temperature:'symbol:temperature', lambda_old:'symbol:lambda_old', shared_parameters:'symbol:theta_s', warm_up:'phase:warmup',
  joint_optimize:'phase:joint', joint_training:'method:joint_training',
};
const skippedDuplicateTerms=new Set(['shared_parameters','temperature','lambda_old','warm_up','joint_optimize','joint_training']);

function categoryForRegistry(value:string):string {
  const map:Record<string,string>={
    PAPER:'论文事实',Paper:'论文事实','Paper fact':'论文事实',PAPER_FACT:'论文事实',PAPER_RESULT:'实测结果','Measured result':'实测结果',
    AUTHOR_INTERPRETATION:'作者解释','Author interpretation':'作者解释',FUTURE_WORK:'未来工作',
    IMPLEMENTATION_MAPPING:'实现映射','Implementation mapping':'实现映射',GENERAL_BACKGROUND:'通用背景','General Background':'通用背景',
    TEACHING_TOY:'教学示例','Teaching Toy':'教学示例','Mechanism interpretation':'机制解读',
    'Our Mechanism Explanation':'机制解读','General ML Background':'通用背景','Implementation Note':'实现映射',
  };
  return map[value]||value.replace(/_/g,' ');
}

const titleTranslations:Record<string,string>={
  'Shared parameters':'共享参数','Old-task parameters':'旧任务参数','New-task parameters':'新任务参数','New-task input':'新任务输入',
  'New-task labels':'新任务标签','Recorded old-task response':'记录的旧任务响应','Student old-task response':'Student 的旧任务响应',
  Temperature:'温度','Old-response loss weight':'旧响应损失权重','Shared feature':'共享特征','Old-task logits':'旧任务 logits',
  'New-task objective':'新任务目标','Old-response preservation loss':'旧响应保持损失','Combined objective':'联合目标',
  'Temperature transform':'温度变换','Shared-parameter gradient composition':'共享参数的梯度合成',
  'Parameter-L2 preservation baseline':'参数 L2 保持基线','Response preservation on observed inputs':'在已观察输入上保持响应',
  'Plain SGD step':'普通 SGD 更新步','Feature Extraction':'特征提取','Fine-tuning':'微调','Fine-tune FC':'仅微调全连接层',
  'Joint Training':'联合训练','Learning without Forgetting':'Learning without Forgetting（LwF）','Parameter-L2 baseline':'参数 L2 基线',
  'Network Expansion':'网络扩展','Network Expansion + LwF':'网络扩展 + LwF','LwF response-loss variants':'LwF 响应损失变体',
  'Old model':'旧模型','Record responses':'记录响应','Warm-up':'预热阶段','Joint optimization':'联合优化',
  'Table 1 · 单次新任务比较':'表 1 · 单次新任务比较','Table 2 · 架构与训练消融':'表 2 · 架构与训练消融',
  'Figure 4 · 连续加入任务':'图 4 · 连续加入任务','Figure 7 · 目标与损失选择':'图 7 · 目标与损失选择',
  'Tracking appendix · MD-Net':'跟踪任务附录 · MD-Net',
  'LwF reduces forgetting relative to fine-tuning':'与微调相比，LwF 减少遗忘',
  'LwF retains more new-task plasticity than feature extraction':'与特征提取相比，LwF 保留更多新任务可塑性',
  'LwF is generally equivalent to joint training':'LwF 与联合训练总体相当',
  'Task mismatch can weaken response coverage':'任务不匹配可能削弱响应覆盖',
  'Response regularization beats the tested parameter-L2 baseline':'响应正则优于论文测试的参数 L2 基线',
  'Any response loss works identically':'任意响应损失都完全相同',
  'Warm-up is not crucial to LwF in the reported ablation':'论文消融中，预热阶段并非 LwF 的关键',
  'Sequential addition can still degrade old-task performance':'连续加入任务仍可能降低旧任务表现',
  'LwF eliminates catastrophic forgetting':'LwF 消除了灾难性遗忘','A KD loss is necessary for LwF':'LwF 必须使用知识蒸馏损失',
  'θ_o 是字母 o，不是数字 0':'θₒ 的下标是字母 o，不是数字 0',
  'Y_o 不是旧任务真实标签':'Yₒ 不是旧任务真实标签','backward 不直接更新参数':'backward 不直接更新参数',
  'freeze 不等于 detach':'冻结参数不等于 detach','λ_o=1 不等于 50/50':'λₒ = 1 不等于新旧任务各占一半',
  '响应保持不是全局函数不变':'响应保持不代表全局函数不变',
  '旧任务响应会随新阶段重算':'新任务到来时重算旧任务响应',
  'LwF adapts without old-task training data':'LwF 适配时不需要旧任务训练数据',
  'LwF works on foundation models':'论文检验了 LwF 是否适用于基础模型',
};
function displayTitle(value:string) { return titleTranslations[value]||value; }
function displaySymbol(value:string) {
  const labels:Record<string,string>={θ_s:'θₛ',θ_o:'θₒ',θ_n:'θₙ',X_n:'Xₙ',Y_o:'Yₒ',Y_n:'Yₙ',Ŷ_o:'Ŷₒ',Ŷ_n:'Ŷₙ',λ_o:'λₒ'};
  return labels[value]||value;
}
const evidenceGroupLabels:Record<string,string>={claims:'论文主张',architecture:'模型架构',formulas:'数学公式',results:'实验结果',implementation:'实现细节',background:'背景概念',teaching_toys:'教学示例'};
const verdictLabels:Record<string,string>={Supported:'有证据支持','Too strong':'表述过强','Not directly tested':'未直接检验'};

function entryFromKnowledge(card:KnowledgeCard):RefEntry {
  const title=card.kind==='symbol'?`${displaySymbol((card as SymbolCard).symbol)} · ${displayTitle(card.title)}`:displayTitle(card.title);
  const common={id:card.id,kind:card.kind,title,summary:card.summary,category:categoryForRegistry(card.category),scenes:card.scenes,related:card.related||[],evidenceIds:card.evidence||[],boundary:card.boundary,keywords:`${card.title} ${(card.kind==='symbol'?(card as SymbolCard).symbol:'')} ${card.summary} ${card.id}`};
  let fields:RefField[]=[];
  if(card.kind==='symbol') {const item=card as SymbolCard;fields=[['符号',item.symbol],['含义',item.summary],['来源分类',categoryForRegistry(item.category)],['运行时类型',item.runtimeType],['常见形状',item.typicalShape],['创建时机',item.createdWhen],['使用时机',item.usedWhen],['是否可训练',item.trainable],['梯度来源',item.gradientSources],['是否加入优化器',item.optimizerMembership],['常见混淆',item.commonConfusion]].map(([label,value])=>({label,value}));}
  if(card.kind==='formula') {const item=card as FormulaCard;fields=[{label:'表达式',value:item.expression},{label:'变量',value:item.variables.join(' · ')},{label:'含义',value:item.meaning},{label:'代码映射',value:item.codeMapping}];}
  if(card.kind==='dataset') {const item=card as DatasetCard;fields=[{label:'任务类型',value:item.taskType},{label:'输入类型',value:item.inputType},{label:'类别 / 标签',value:item.classes},{label:'在论文中的作用',value:item.paperRole},{label:'论文中的关系',value:item.paperRelation},{label:'重要性',value:item.whyItMatters},{label:'相关实验',value:item.experiments.join(' · ')}];}
  if(card.kind==='method') {const item=card as MethodCard;fields=[{label:'需要旧数据',value:item.oldDataRequired},{label:'需要旧标签',value:item.oldLabelsRequired},{label:'需要旧模型',value:item.oldModelRequired},{label:'共享参数可训练',value:item.sharedTrainable},{label:'新任务头可训练',value:item.newHeadTrainable},{label:'旧响应约束',value:item.oldResponseConstraint}];}
  if(card.kind==='phase') {const item=card as PhaseCard;fields=[{label:'共享参数 θₛ',value:item.thetaS},{label:'旧任务头 θₒ',value:item.thetaO},{label:'新任务头 θₙ',value:item.thetaN},{label:'主要操作',value:item.mainAction}];}
  if(card.kind==='confusion') {const item=card as ConfusionCard;fields=[{label:'问题',value:item.question},{label:'回答',value:item.answer}];}
  if(card.kind==='evidence') {const item=card as EvidenceCard;fields=[{label:'测量内容',value:item.measures},{label:'支持的结论',value:item.supports},{label:'不能证明什么',value:item.doesNotEstablish},{label:'论文位置',value:item.location}];}
  if(card.kind==='claim') {const item=card as ClaimCard;fields=[{label:'判断',value:verdictLabels[item.verdict]||item.verdict},{label:'支持证据',value:item.supportingEvidence.join(' · ')}];}
  const related=card.kind==='claim'?[...(card as ClaimCard).supportingEvidence,...(card.related||[])]:common.related;
  return {...common,fields,related,evidenceIds:[...new Set([...(card.evidence||[]),...(card.kind==='claim'?(card as ClaimCard).supportingEvidence:[])])],keywords:`${common.keywords} ${fields.map((field)=>field.value).join(' ')}`,formulaId:card.kind==='formula'?card.id:undefined};
}

const knowledgeEntries=allKnowledgeCards.map(entryFromKnowledge);
const termEntries=terms.filter((term)=>!skippedDuplicateTerms.has(term.id)).map((term)=>({
  id:`term:${term.id}`,kind:'term' as const,title:term.label,summary:term.definition,category:categoryForRegistry(term.source_category),
  fields:[{label:'完整名称',value:term.full_name},{label:'定义',value:term.definition},{label:'在本文中的作用',value:term.paper_role},{label:'容易混淆',value:term.confusion},{label:'前置概念',value:term.prerequisites.map((id)=>termById.get(id)?.label||id).join(' · ')||'无'}],
  scenes:[],related:term.prerequisites.map((id)=>`term:${id}`),evidenceIds:term.source_ref?[term.source_ref]:[],keywords:`${term.id} ${term.label} ${term.full_name} ${term.definition} ${term.paper_role} ${term.confusion}`,
}));
const paperSourceEntries=evidence.map((item)=>({
  id:`source:${item.id}`,kind:'paper source' as const,title:item.id,summary:item.text,category:categoryForRegistry(item.type),
  fields:[{label:'证据登记分组',value:evidenceGroupLabels[item.group]||item.group},{label:'证据类型',value:categoryForRegistry(item.type)},{label:'登记内容',value:item.text},{label:'论文位置',value:item.location||'未记录论文位置'}],
  scenes:knowledgeEntries.filter((entry)=>entry.evidenceIds.includes(item.id)).flatMap((entry)=>entry.scenes).filter((value,index,array)=>array.indexOf(value)===index),
  related:knowledgeEntries.filter((entry)=>entry.evidenceIds.includes(item.id)).map((entry)=>entry.id),evidenceIds:[],keywords:`${item.id} ${item.group} ${item.type} ${item.text} ${item.location}`,
}));
const allEntries:RefEntry[]=[...knowledgeEntries,...termEntries,...paperSourceEntries];
const entriesById=new Map(allEntries.map((entry)=>[entry.id,entry]));
const kindOrder:RefKind[]=['symbol','formula','dataset','method','phase','confusion','evidence','claim','term','paper source'];
const categoryLabels=[...sourceCategories.map(categoryForRegistry),'论文事实','实测结果','未来工作','作者解释','实现映射','教学示例','通用背景','机制解读'];
const categoryOptions=[...new Set([...categoryLabels,...allEntries.map((entry)=>entry.category)])];

function resolveRequest(request:HubRequest):string {
  const direct=request.cardId||request.evidenceId||request.termId||'symbol:theta_s';
  if(entriesById.has(direct)) return direct;
  if(request.termId && termAliases[request.termId] && entriesById.has(termAliases[request.termId])) return termAliases[request.termId];
  if(request.termId && entriesById.has(`term:${request.termId}`)) return `term:${request.termId}`;
  if(request.evidenceId && evidenceById.has(request.evidenceId)) return `source:${request.evidenceId}`;
  return 'symbol:theta_s';
}

function resolveRelatedId(id:string) {
  if(entriesById.has(id)) return id;
  if(entriesById.has(`source:${id}`)) return `source:${id}`;
  if(entriesById.has(`term:${id}`)) return `term:${id}`;
  if(termAliases[id]) return termAliases[id];
  const symbol=allKnowledgeCards.find((card)=>card.kind==='symbol'&&(card as SymbolCard).symbol===id);
  if(symbol) return symbol.id;
  return id;
}

export function ReferenceHub({request,onClose,priorityIds=[],onOpenScene}:{request:HubRequest|null;onClose:()=>void;priorityIds?:string[];onOpenScene?:(scene:string)=>void}) {
  const [selectedId,setSelectedId]=useState('symbol:theta_s');
  const [query,setQuery]=useState('');
  const [kindFilter,setKindFilter]=useState<RefKind|'all'>('all');
  const [categoryFilter,setCategoryFilter]=useState('all');
  const panelRef=useRef<HTMLElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const previousFocus=useRef<HTMLElement|null>(null);

  useEffect(()=>{
    if(!request) return;
    previousFocus.current=document.activeElement as HTMLElement|null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    setSelectedId(resolveRequest(request));setQuery('');setKindFilter('all');setCategoryFilter('all');
    requestAnimationFrame(()=>closeRef.current?.focus());
    return ()=>{document.body.style.overflow=previousOverflow;previousFocus.current?.focus();};
  },[request]);

  const filteredEntries=useMemo(()=>allEntries.filter((entry)=>{
    const matchesKind=kindFilter==='all'||entry.kind===kindFilter;
    const matchesCategory=categoryFilter==='all'||entry.category===categoryFilter;
    const needle=query.trim().toLowerCase();
    return matchesKind&&matchesCategory&&(!needle||`${entry.id} ${entry.kind} ${entry.category} ${entry.keywords} ${entry.fields.map((field)=>`${field.label} ${field.value}`).join(' ')}`.toLowerCase().includes(needle));
  }).sort((a,b)=>{
    const needle=query.trim().toLowerCase();
    if(needle){const rank=(entry:RefEntry)=>{const title=entry.title.toLowerCase();const id=entry.id.toLowerCase();return title===needle||id===needle?0:title.startsWith(needle)||id.startsWith(needle)?1:title.includes(needle)?2:3;};const ranked=rank(a)-rank(b);if(ranked)return ranked;}
    if(!needle){const priority=(entry:RefEntry)=>{const index=priorityIds.indexOf(entry.id);return index<0?Number.MAX_SAFE_INTEGER:index;};const ranked=priority(a)-priority(b);if(ranked)return ranked;}
    return kindOrder.indexOf(a.kind)-kindOrder.indexOf(b.kind)||a.title.localeCompare(b.title);
  }),[categoryFilter,kindFilter,priorityIds,query]);
  const grouped=useMemo(()=>groupedEntries(filteredEntries),[filteredEntries]);
  const selected=entriesById.get(selectedId);
  const selectEntry=useCallback((id:string)=>{const resolved=resolveRelatedId(id);if(entriesById.has(resolved)){setSelectedId(resolved);return;}if(/^(00|[A-J])$/.test(id)){if(onOpenScene)onOpenScene(id);else window.dispatchEvent(new CustomEvent('lwf:open-scene',{detail:id}));onClose();}},[onClose,onOpenScene]);

  useEffect(()=>{
    if(filteredEntries.length&&!filteredEntries.some((entry)=>entry.id===selectedId)) setSelectedId(filteredEntries[0].id);
  },[filteredEntries,selectedId]);

  if(!request) return null;
  const onDialogKeyDown=(event:React.KeyboardEvent<HTMLElement>)=>{
    if(event.key==='Escape'){event.stopPropagation();onClose();return;}
    if(event.key!=='Tab'||!panelRef.current)return;
    const focusable=[...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')];
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };

  return <div className="v2-drawer-backdrop v2-reference-backdrop" onPointerDown={(event)=>{if(event.target===event.currentTarget)onClose();}}>
    <aside ref={panelRef} className="v2-reference-drawer v2-reference-hub" role="dialog" aria-modal="true" aria-labelledby="v2-reference-title" onKeyDown={onDialogKeyDown}>
      <header className="v2-drawer-header"><div><span className="v2-eyebrow">论文知识索引</span><h2 id="v2-reference-title">参考资料库</h2><p>符号 · 公式 · 数据集 · 方法 · 阶段 · 误区 · 证据</p></div><button ref={closeRef} className="v2-icon-button" type="button" onClick={onClose} aria-label="关闭参考资料库">×</button></header>
      <label className="v2-reference-search"><span className="v2-sr-only">搜索参考资料</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="搜索 θₛ、Yₒ、温度、λₒ、MNIST、图 7、联合训练、反向传播或域差异…" /></label>
      <div className="v2-hub-filter-row"><label>内容类型<select value={kindFilter} onChange={(event)=>setKindFilter(event.target.value as RefKind|'all')}><option value="all">全部类型 · {allEntries.length}</option>{kindOrder.map((kind)=><option key={kind} value={kind}>{kindLabels[kind]}</option>)}</select></label><label>来源分类<select value={categoryFilter} onChange={(event)=>setCategoryFilter(event.target.value)}><option value="all">全部来源类别</option>{categoryOptions.map((category)=><option key={category} value={category}>{category}</option>)}</select></label><span>{filteredEntries.length} 条结果</span></div>
      <div className="v2-reference-columns v2-hub-columns">
        <nav className="v2-reference-list v2-hub-results" aria-label="分组参考条目">{grouped.map(([kind,entries])=><section key={kind} className="v2-hub-result-group"><h3>{kindLabels[kind]} · {entries.length}</h3>{entries.map((entry)=><button key={entry.id} type="button" className={entry.id===selectedId?'is-selected':''} onClick={()=>setSelectedId(entry.id)}><strong><InlineNotation text={entry.title} /></strong><small><InlineNotation text={entry.id} /> · {entry.category}</small></button>)}</section>)}{filteredEntries.length===0?<p className="v2-empty-state">没有匹配条目。</p>:null}</nav>
        {selected?<EntryDetails entry={selected} onSelect={selectEntry}/>:<p className="v2-empty-state">选择左侧条目查看定义与交叉引用。</p>}
      </div>
      <footer className="v2-drawer-footer">知识卡片、论文证据编号与术语说明均来自本项目的研究登记资料。</footer>
    </aside>
  </div>;
}

function groupedEntries(entries:RefEntry[]):[RefKind,RefEntry[]][] {const groups=new Map<RefKind,RefEntry[]>();for(const entry of entries){const current=groups.get(entry.kind)||[];current.push(entry);groups.set(entry.kind,current);}return [...groups.entries()];}
const EntryDetails=memo(function EntryDetails({entry,onSelect}:{entry:RefEntry;onSelect:(id:string)=>void}) {
  const relatedEntries=entry.related.map(resolveRelatedId).filter((id)=>entriesById.has(id)).filter((id,index,array)=>array.indexOf(id)===index);
  const sources=entry.evidenceIds.map(resolveRelatedId).filter((id)=>entriesById.has(id)).filter((id,index,array)=>array.indexOf(id)===index);
  return <article className="v2-reference-detail v2-hub-detail"><div className="v2-hub-entry-badges"><span className="v2-reference-category">{entry.category}</span><span className="v2-hub-kind">{kindLabels[entry.kind]}</span></div><h3><InlineNotation text={entry.title} /></h3><code className="v2-hub-id">{entry.id}</code><p className="v2-reference-fullname"><InlineNotation text={entry.summary} /></p><dl>{entry.fields.map((field)=><div key={field.label}><dt>{field.label}</dt><dd>{field.label==='表达式'&&entry.formulaId?<MathFormula id={entry.formulaId}/>:<InlineNotation text={field.value||'—'} />}</dd></div>)}{entry.scenes.length?<div><dt>关联章节</dt><dd className="v2-hub-chip-row">{entry.scenes.map((scene)=><button type="button" className="v2-hub-scene-link" key={scene} onClick={()=>onSelect(scene)}>第 {scene} 节</button>)}</dd></div>:null}{entry.boundary?<div><dt>适用边界</dt><dd><InlineNotation text={entry.boundary} /></dd></div>:null}</dl>
    {relatedEntries.length||sources.length?<section className="v2-hub-related"><strong>交叉引用</strong>{relatedEntries.length?<div className="v2-hub-related-row"><span className="v2-hub-related-label">相关知识</span><div className="v2-hub-related-links">{relatedEntries.map((id)=><button key={id} type="button" onClick={()=>onSelect(id)}><InlineNotation text={entriesById.get(id)?.title||id} /> ↗</button>)}</div></div>:null}{sources.length?<div className="v2-hub-related-row"><span className="v2-hub-related-label">证据记录</span><div className="v2-hub-related-links">{sources.map((id)=><button key={id} type="button" onClick={()=>onSelect(id)}><InlineNotation text={entriesById.get(id)?.title||id} /> ↗</button>)}</div></div>:null}</section>:null}
    <a className="v2-evidence-link" href="https://arxiv.org/abs/1606.09282" target="_blank" rel="noreferrer">打开 LwF 原论文 ↗</a>
  </article>;
});
