import React, { useState } from 'react';

type Props = { chapterId: string; moduleId: string };
type Switches = { rephrase: boolean; recap: boolean; pseudo: boolean };

const ablations: Record<string, {label:string; map:number; ndcg:number; egoInter:number; egoIntra:number; egteaMean:number; egteaTop:number}> = {
  '000': {label:'仅原始标注',map:26.0,ndcg:28.8,egoInter:93.6,egoIntra:54.3,egteaMean:27.3,egteaTop:30.1},
  '100': {label:'仅加入 Rephraser',map:28.0,ndcg:30.1,egoInter:93.5,egoIntra:56.9,egteaMean:29.8,egteaTop:30.8},
  '010': {label:'仅加入 Recaption',map:27.1,ndcg:29.9,egoInter:93.2,egoIntra:59.2,egteaMean:26.8,egteaTop:31.2},
  '110': {label:'Rephraser + Recaption',map:29.7,ndcg:31.5,egoInter:93.6,egoIntra:58.3,egteaMean:29.4,egteaTop:36.6},
  '111': {label:'再加入 Pseudo Caption',map:29.9,ndcg:31.4,egoInter:93.6,egoIntra:59.1,egteaMean:31.1,egteaTop:36.0},
};
function Bar({ value, max=36, label }: {value:number;max?:number;label:string}) {
  return <div className="lv-bar-row"><span>{label}</span><div className="lv-bar-track"><div className="lv-bar-fill" style={{width:`${Math.max(0,Math.min(100,value/max*100))}%`}} /></div><strong>{value.toFixed(1)}</strong></div>;
}
function Evidence({ children }: {children:React.ReactNode}) { return <div className="lv-evidence">论文证据 · {children}</div>; }
function AblationLab() {
  const [s,setS]=useState<Switches>({rephrase:false,recap:false,pseudo:false});
  const key=`${Number(s.rephrase)}${Number(s.recap)}${Number(s.pseudo)}`;
  const row=ablations[key];
  return <div className="lv-lab">
    <div className="lv-controls">{([['rephrase','Rephraser'],['recap','Recaption'],['pseudo','Pseudo Caption']] as const).map(([k,label])=><label className="lv-check" key={k}><input type="checkbox" checked={s[k]} onChange={e=>setS({...s,[k]:e.target.checked})}/>{label}</label>)}</div>
    <div className="lv-flow"><span className="lv-flow-node">原始标注</span><span>＋</span><span className={s.rephrase?'lv-flow-node active':'lv-flow-node'}>文本改写</span><span>＋</span><span className={s.recap?'lv-flow-node active':'lv-flow-node'}>重述已有片段</span><span>＋</span><span className={s.pseudo?'lv-flow-node active':'lv-flow-node'}>补未标注片段</span></div>
    {row ? <><div className="lv-result"><b>{row.label}</b><span>EK-100 MIR · 零样本 · average mAP ↑</span></div><Bar value={row.map} label="表 8"/><div className="lv-small">同一行还报告 avg nDCG {row.ndcg.toFixed(1)}、EgoMCQ 与 EGTEA 指标；它们是不同任务，不能与 mAP 合并。</div><div className="lv-feedback good">这是表 8 中实际报告的组合。把指标固定，才能读出开关带来的差异。</div></> : <div className="lv-feedback warn">表 8 没有单独报告这个开关组合，因此这里不预测分数。请选择表中出现的组合。</div>}
    <Evidence>第 8 页，Table 8；EK-100 MIR zero-shot average mAP，越高越好。</Evidence>
  </div>;
}
const lmRows=[
  {id:'small-random',label:'GPT-2 · 随机初始化',value:24.3,detail:'文本解码器未使用 WebText 预训练。'},
  {id:'small-web',label:'GPT-2 · WebText 预训练',value:24.0,detail:'同一规模，但换成预训练初始权重。'},
  {id:'xl-web',label:'GPT-2 XL · WebText 预训练',value:26.2,detail:'更大的预训练语言模型在该表设置下最高。'}
];
function LmLab() {
  const [id,setId]=useState('small-random');const row=lmRows.find(x=>x.id===id)!;
  return <div className="lv-lab">
    <div className="lv-controls">{lmRows.map(x=><button className={id===x.id?'lv-option selected':'lv-option'} key={x.id} onClick={()=>setId(x.id)}>{x.label}</button>)}</div>
    <div className="lv-chart">{lmRows.map(x=><Bar key={x.id} value={x.value} max={30} label={x.label}/>)}</div>
    <div className="lv-feedback good"><b>{row.label}：{row.value.toFixed(1)} mAP。</b> {row.detail} 这张表同时改变了规模与初始化，不可只归因于一个因素。</div>
    <Evidence>第 8 页 Table 7a；EK-100 MIR zero-shot average mAP，越高越好。</Evidence>
  </div>;
}
const sampleRows=[{id:'beam',label:'Beam search · K=1',value:27.9},{id:'nucleus-1',label:'Nucleus · K=1',value:29.6},{id:'nucleus-10',label:'Nucleus · K=10',value:29.7}];
function SamplingLab(){
  const [id,setId]=useState('beam');const row=sampleRows.find(x=>x.id===id)!;
  return <div className="lv-lab">
    <div className="lv-controls">{sampleRows.map(x=><button className={id===x.id?'lv-option selected':'lv-option'} key={x.id} onClick={()=>setId(x.id)}>{x.label}</button>)}</div>
    <div className="lv-chart">{sampleRows.map(x=><Bar key={x.id} value={x.value} max={32} label={x.label}/>)}</div>
    <div className="lv-feedback good">当前选择 <b>{row.label}</b>，表 7b 报告 <b>{row.value.toFixed(1)} average mAP</b>。Nucleus 与 Beam 的差异只说明这组实验条件下的结果。</div>
    <Evidence>第 8 页 Table 7b；EK-100 MIR zero-shot average mAP；论文默认生成还采用 p=0.95。</Evidence>
  </div>;
}
function ControlRoom(){
  const [vision,setVision]=useState('TSF-L');
  const [lm,setLm]=useState('GPT-2 XL');
  const [sampling,setSampling]=useState('Nucleus');
  const [p,setP]=useState(0.95);
  const [k,setK]=useState(10);
  const [recap,setRecap]=useState(true);
  const [pseudo,setPseudo]=useState(true);
  const [filter,setFilter]=useState(true);
  const [threshold,setThreshold]=useState(0.5);
  const [rephrase,setRephrase]=useState(true);
  const [frames,setFrames]=useState(4);
  const [textLength,setTextLength]=useState(77);
  const sampleSupported=sampling==='Nucleus' && p===0.95 && k===10;
  const dataKey=`${Number(rephrase)}${Number(recap)}${Number(pseudo)}`;
  const ablation=ablations[dataKey];
  const paperFrame=frames===4;
  const normalized=vision==='TSF-L'&&lm==='GPT-2 XL'&&sampleSupported&&recap&&pseudo&&filter&&threshold===0.5&&rephrase&&paperFrame&&textLength===77;
  return <div className="lv-lab lv-controlroom">
    <div className="lv-controlgrid">
      <fieldset><legend>① Narrator 生成</legend>
        <label>视觉编码器<select value={vision} onChange={e=>setVision(e.target.value)}><option>TSF-B</option><option>TSF-L</option><option>TSF-L@HR</option></select></label>
        <label>语言模型<select value={lm} onChange={e=>setLm(e.target.value)}><option>GPT-2</option><option>GPT-2 XL</option></select></label>
        <label>采样<select value={sampling} onChange={e=>setSampling(e.target.value)}><option>Beam</option><option>Nucleus</option></select></label>
        <label>Top-p：{p.toFixed(2)}<input type="range" min="0.6" max="1" step="0.05" value={p} disabled={sampling!=='Nucleus'} onChange={e=>setP(Number(e.target.value))}/></label>
        <label>每片段候选 K：{k}<input type="range" min="1" max="10" step="1" value={k} onChange={e=>setK(Number(e.target.value))}/></label>
      </fieldset>
      <fieldset><legend>② 训练数据</legend>
        <label className="lv-check"><input type="checkbox" checked={recap} onChange={e=>setRecap(e.target.checked)}/>Recaption 已标注片段</label>
        <label className="lv-check"><input type="checkbox" checked={pseudo} onChange={e=>setPseudo(e.target.checked)}/>Pseudo Caption 空白片段</label>
        <label className="lv-check"><input type="checkbox" checked={filter} onChange={e=>setFilter(e.target.checked)}/>相似度过滤</label>
        <label>过滤阈值：{threshold.toFixed(2)}<input type="range" min="0" max="1" step="0.05" value={threshold} disabled={!filter} onChange={e=>setThreshold(Number(e.target.value))}/></label>
        <label className="lv-check"><input type="checkbox" checked={rephrase} onChange={e=>setRephrase(e.target.checked)}/>Rephraser 文本改写</label>
      </fieldset>
      <fieldset><legend>③ Dual Encoder</legend>
        <label>所处阶段 / 采样帧数<select value={frames} onChange={e=>setFrames(Number(e.target.value))}><option value={4}>预训练 · 4 帧</option><option value={16}>微调 · 16 帧</option></select></label>
        <label>文本上限：{textLength} token<input type="range" min="32" max="77" step="1" value={textLength} onChange={e=>setTextLength(Number(e.target.value))}/></label>
      </fieldset>
    </div>
    <div className="lv-flow" role="img" aria-label="LaViLa 数据与训练流程"><span className="lv-flow-node active">视频片段</span><b>→</b><span className="lv-flow-node active">Narrator 描述</span><b>→</b><span className={filter?'lv-flow-node active':'lv-flow-node'}>质量筛选</span><b>→</b><span className="lv-flow-node active">缓存视频—文本对</span><b>→</b><span className="lv-flow-node active">Dual Encoder</span></div>
    <div className="lv-result"><b>{normalized?'论文默认设置的教学重现':'当前是探索性配置'}</b><span>{ablation?`表 8 有对应的数据来源组合：${ablation.label}。`:'表 8 未单独报告该数据来源组合。'}</span></div>
    <div className="lv-feedback warn">{sampleSupported?'采样设置与论文默认 p=0.95、K=10 一致。':'当前采样参数不是论文默认的完整组合，不能推算性能。'} {filter?`相似度阈值 ${threshold.toFixed(2)}；论文实验为 0.50。`:'已关闭过滤；论文提醒密集伪描述可能包含低质量片段。'} {paperFrame?'当前为预训练 4 帧。':'当前为微调 16 帧。'}</div>
    <Evidence>§4.1 生成与过滤；§4.2 文本改写；§4.3 缓存训练；第 5 页实验配置；Tables 7–8。控制室不输出未经论文报告的联合预测分数。</Evidence>
  </div>;
}
export const Ch10Lab: React.FC<Props> = ({moduleId}) => {
  if(moduleId==='10.1') return <AblationLab/>;
  if(moduleId==='10.2') return <LmLab/>;
  if(moduleId==='10.3') return <SamplingLab/>;
  return <ControlRoom/>;
};
