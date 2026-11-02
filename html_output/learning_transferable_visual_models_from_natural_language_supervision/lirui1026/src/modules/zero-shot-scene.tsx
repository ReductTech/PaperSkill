import React, { useState } from 'react';
import { C, Photo, Tag, Feedback, ToyNote, Term, Range, ProbBar, normalize, dot, softmax, vectors, names, subjects, deg, unit, useTween } from './ExhibitKit';
import './TransferScenes.css';

const pct=(v:number)=>(v*100).toFixed(1)+'%';
const argmax=(v:number[])=>v.indexOf(Math.max(...v));

export function ZeroShotScene(){
 const [photo,setPhoto]=useState(2);
 const [enabled,setEnabled]=useState([true,true,false,false]);
 const indices=enabled.map((x,i)=>x?i:-1).filter(i=>i>=0);
 const scores=indices.map(i=>dot(vectors[photo],vectors[i]));
 const probs=softmax(scores.map(x=>4*x));
 const winner=indices[argmax(probs)],correct=winner===photo;
 const toggle=(i:number)=>setEnabled(v=>v.filter(Boolean).length===1&&v[i]?v:v.map((x,j)=>j===i?!x:x));
 return <div className="clip-page tr-page tr-zero">
  <div className="tr-zero-main">
   <div className="tr-image-stage clip-paper">
    <Photo kind={subjects[photo]} style={{width:290,height:290}}/>
    <div className="tr-image-choices" aria-label="选择待分类图片">{subjects.map((s,i)=><button key={s} onClick={()=>setPhoto(i)} aria-label={'选择'+names[i]+'图片'} aria-pressed={photo===i} className={photo===i?'chosen':''}><Photo kind={s} style={{width:84,height:84}}/></button>)}</div>
    <p>预训练图像编码器保持固定</p>
   </div>
   <div className="tr-classifier">
    <h3>点展签，添加或移除候选类别</h3>
    <div className="tr-candidate-header"><span>类别描述</span><span>余弦相似度</span><span>候选内概率</span></div>
    {names.map((name,i)=>{const position=indices.indexOf(i),p=position>=0?probs[position]:0;return <div className={'tr-candidate-row '+(winner===i?'is-winner':'')} key={name}>
     <Tag selected={enabled[i]} disabled={enabled[i]&&indices.length===1} onClick={()=>toggle(i)}>{enabled[i]?'✓ ':'＋ '}{name}</Tag>
     <b>{dot(vectors[photo],vectors[i]).toFixed(3)}</b>
     <div className="tr-candidate-prob"><span style={{width:p*100+'%',background:winner===i?(correct?C.green:C.red):C.blue}}/><strong>{position>=0?pct(p):'未加入'}</strong></div>
    </div>})}
    <div className="tr-zero-rule"><Term meaning="u：当前图像的归一化向量。">u</Term>{' · '}<Term meaning="v_k：类别k的文字描述经过文本编码器与归一化得到的权重。">vₖ</Term>{' → '}<Term meaning="softmax：在当前候选类别内把缩放相似度归一化；本例尺度为4。">softmax</Term></div>
   </div>
  </div>
  <Feedback tone={correct?'green':'red'}>{correct?'现在预测为“'+names[winner]+'”：只改变候选文字，没有用目标任务标注样本重训编码器。':'图片是“'+names[photo]+'”，当前却只能选“'+names[winner]+'”。把正确类别展签加入候选，再看分类结果。'}</Feedback>
  <ToyNote/>
 </div>;
}

const promptChoices=[{name:'只给类别名',text:'crane',v:normalize([1,1])},{name:'加入鸟类上下文',text:'a photo of a crane bird.',v:normalize([.99,.14])},{name:'加入工程机械上下文',text:'a photo of a construction crane.',v:normalize([.14,.99])}];
export function PromptScene(){
 const [selected,setSelected]=useState(0),p=promptChoices[selected];
 const scores=[dot([1,0],p.v),dot([0,1],p.v)];
 const pointer=useTween(selected===1?-1:selected===2?1:0);
 return <div className="clip-page tr-page tr-prompt">
  <div className="tr-prompt-main">
   <div className={'tr-prompt-art '+(selected===1?'is-relevant':'')}><Photo kind="bird" style={{width:300,height:300}}/><h3>鹤 · 鸟类</h3><div className="clip-emphasis" style={{color:selected===1?C.green:C.blue}}>{scores[0].toFixed(3)}</div><p>与展签的余弦相似度</p></div>
   <div className="tr-prompt-center">
    <h3>同一个词，可以指不同事物</h3>
    {promptChoices.map((choice,i)=><button key={choice.name} className={'tr-prompt-label '+(selected===i?'selected':'')} aria-pressed={selected===i} onClick={()=>setSelected(i)}><span>{choice.name}</span><b>{choice.text}</b></button>)}
    <div className="tr-context-track" aria-label="文本表示偏向"><span>鸟类语义</span><span>机械语义</span><div className="tr-context-marker" style={{left:'calc(50% + '+(pointer*210)+'px)'}}/></div>
    <p>上下文改变文本向量，而非图片。</p>
   </div>
   <div className={'tr-prompt-art '+(selected===2?'is-relevant':'')}><Photo kind="crane" style={{width:300,height:300}}/><h3>起重机 · 机械</h3><div className="clip-emphasis" style={{color:selected===2?C.green:C.blue}}>{scores[1].toFixed(3)}</div><p>与展签的余弦相似度</p></div>
  </div>
  <Feedback tone={selected===0?'orange':'green'}>{selected===0?'只有“crane”时，本例的两种含义无法区分；给展签补上上下文。':selected===1?'加入“bird”后，文本方向靠近鸟类图像；类别语义变得明确。':'加入“construction”后，文本方向转向工程机械；同一个词获得不同分类权重。'}</Feedback>
  <ToyNote>论文使用 crane 说明歧义；图中向量与相似度为构造示例。</ToyNote>
 </div>;
}

const promptAngles=[-20,10,35];
const ensembleTexts=['a photo of a cat.','a close-up photo of a cat.','a photo of a small cat.'];
export function EnsembleScene(){
 const [selected,setSelected]=useState([true,false,false]);
 const count=selected.filter(Boolean).length;
 const mean=[0,0]; selected.forEach((on,i)=>{if(on){const v=unit(deg(promptAngles[i]));mean[0]+=v[0]/count;mean[1]+=v[1]/count;}});
 const averaged=normalize(mean),angle=Math.atan2(averaged[1],averaged[0]),similarity=dot(unit(deg(15)),averaged);
 const animatedAngle=useTween(angle),x=330+205*Math.cos(animatedAngle),y=230-205*Math.sin(animatedAngle);
 const toggle=(i:number)=>setSelected(v=>count===1&&v[i]?v:v.map((b,j)=>j===i?!b:b));
 return <div className="clip-page tr-page tr-ensemble">
  <div className="tr-ensemble-main">
   <div className="tr-ensemble-labels">
    <div className="tr-ensemble-sample"><Photo kind="cat" style={{width:145,height:145}}/><div><h3>给同一类别，多种描述</h3><p>将展签夹到作品架上</p></div></div>
    {ensembleTexts.map((text,i)=><button key={text} className={'tr-ensemble-tag '+(selected[i]?'selected':'')} aria-pressed={selected[i]} disabled={selected[i]&&count===1} onClick={()=>toggle(i)}><span className="tr-clip">{selected[i]?'✓':'＋'}</span><span>{text}</span></button>)}
    <p>已选 {count} 条；每条文本先单独编码。</p>
   </div>
   <div className="tr-ensemble-math clip-paper">
    <div className="tr-ensemble-plot">
     <svg viewBox="0 0 670 310" width="670" height="310" role="img" aria-label={'平均文本方向'+(angle*180/Math.PI).toFixed(1)+'度，图像方向15度'}>
      <path d="M330 230 L565 230 M330 230 V35" stroke={C.line} strokeWidth="3" fill="none"/>
      <path d="M523 300 A205 205 0 0 0 498 112" stroke="#dfd7c7" strokeWidth="3" fill="none"/>
      {promptAngles.map((a,i)=><g key={a} opacity={selected[i]?1:.22}><path d={'M330 230 L'+(330+205*Math.cos(deg(a)))+' '+(230-205*Math.sin(deg(a)))} stroke={C.blue} strokeWidth="3" strokeDasharray="8 7"/><circle cx={330+205*Math.cos(deg(a))} cy={230-205*Math.sin(deg(a))} r="10" fill={C.blue}/></g>)}
      <path d={'M330 230 L'+(330+215*Math.cos(deg(15)))+' '+(230-215*Math.sin(deg(15)))} stroke={C.orange} strokeWidth="6"/>
      <path d={'M330 230 L'+x+' '+y} stroke={C.green} strokeWidth="8"/>
      <circle cx={x} cy={y} r="14" fill={C.green}/>
      <text x="35" y="55" fontSize="28" fill={C.orange}>图像方向 15°</text><text x="35" y="100" fontSize="28" fill={C.green}>平均文本方向</text><text x="35" y="146" fontSize="44" fill={C.green}>{(angle*180/Math.PI).toFixed(1)}°</text>
     </svg>
    </div>
    <div className="tr-ensemble-formula"><Term meaning="v̄：所选文本向量的逐维平均，再做L2归一化。">v̄</Term>{' = '}<Term meaning="norm：L2归一化，把向量长度缩放为1。">norm</Term>{'('}<Term meaning="mean(v)：同一类别不同提示词的归一化文本向量平均，不是概率平均。">mean(v)</Term>{')'}</div>
    <div className="clip-spread"><span>与图像的余弦相似度</span><b className="clip-emphasis" style={{color:C.green}}>{similarity.toFixed(3)}</b></div>
   </div>
  </div>
  <Feedback tone="blue">{count===1?'当前只用一条提示；加入另一种描述，观察平均方向与相似度。':'在向量空间平均后，得到一个可缓存的类别权重；多加提示并不保证单调改善。'}</Feedback>
  <ToyNote>教学角度非模型输出；论文 ImageNet 使用 80 个模板，在单模板基础上再提高 3.5 个百分点。</ToyNote>
 </div>;
}

export function CandidateScene(){
 const [includeCorrect,setCorrect]=useState(false),[nuisance,setNuisance]=useState(false);
 const ids=[0,1,...(includeCorrect?[3]:[]),...(nuisance?[2]:[])];
 const scores=ids.map(i=>dot(vectors[3],vectors[i]));
 const probs=softmax(scores.map(x=>6*x)),win=argmax(probs),winner=ids[win];
 const maximum=probs[win],denominator=scores.reduce((s,x)=>s+Math.exp(6*x),0);
 const pointer=useTween(win);
 return <div className="clip-page tr-page tr-candidate">
  <div className="tr-candidate-main">
   <div className="tr-receipt">
    <div className="tr-receipt-photo"><Photo kind="bike" style={{width:300,height:300}}/><h3>送来的是：自行车</h3></div>
    <div className={'tr-stamp '+(includeCorrect?'correct':'wrong')}><span>候选中最高</span><b>{names[winner]}</b><strong>{pct(maximum)}</strong></div>
   </div>
   <div className="tr-candidate-work">
    <div className="tr-candidate-options"><Tag selected={includeCorrect} onClick={()=>setCorrect(v=>!v)}>{includeCorrect?'移除':'加入'}正确展签：自行车</Tag><Tag selected={nuisance} onClick={()=>setNuisance(v=>!v)}>{nuisance?'移除':'加入'}无关展签：帆船</Tag></div>
    <div className="tr-candidate-output">{ids.map((id,i)=><ProbBar key={id} label={names[id]} value={probs[i]} tone={i===win?(includeCorrect?'green':'red'):'blue'}/>)}<div className="tr-ranking-indicator" style={{top:16+pointer*51}}/></div>
    <div className="tr-candidate-explain"><p>图片和既有相似度都没有变。</p><p>当前归一化分母：<b>{denominator.toFixed(2)}</b></p><p><Term meaning="softmax：分母是当前候选的指数分数总和；候选变化时，概率即使相似度不变也会变化。">softmax</Term> 只保证候选概率之和为 1。</p></div>
   </div>
  </div>
  <Feedback tone={includeCorrect?'green':'red'}>{includeCorrect?'正确标签回到候选集，分类才有机会答对；增加其他候选仍会改变概率。':'即使最高概率达到 '+pct(maximum)+'，也没有“自行车”这个答案可选；高概率不是正确性保证。'}</Feedback>
  <ToyNote>构造示例，尺度为 6。候选内概率不能直接充当未知类别拒识或可靠置信度。</ToyNote>
 </div>;
}

export function CountingScene(){
 const [count,setCount]=useState(3),[aware,setAware]=useState(false);
 const image=aware?normalize([1,count]):[1,0];
 const labels=[1,2,3,4],texts=labels.map(n=>aware?normalize([1,n]):[1,0]);
 const scores=texts.map(t=>dot(image,t));
 const spread=Math.max(...scores)-Math.min(...scores);
 const quantity=useTween(aware?count:0);
 return <div className="clip-page tr-page tr-counting">
  <div className="tr-counting-main">
   <div className="tr-still-life clip-paper">
    <div className="tr-still-life-pictures"><div><Photo kind="apple" count={1} style={{width:220,height:220}}/><span>参考静物</span></div><div><Photo kind="apple" count={count} style={{width:250,height:250}}/><span>当前静物：{count} 个</span></div></div>
    <Range label="画面中苹果数量" value={count} min={1} max={4} onChange={setCount}/>
    <div className="tr-counting-strip"><span>“苹果”语义</span><i style={{width:150,background:C.blue}}/><span>数量信息</span><i style={{width:quantity*35,background:C.orange}}/></div>
   </div>
   <div className="tr-counting-evidence">
    <Tag selected={aware} onClick={()=>setAware(v=>!v)}>{aware?'关闭':'加入'}假设的计数维度</Tag>
    <h3>{aware?'假设：表示现在含有数量':'假设：只平均“苹果”语义'}</h3>
    {labels.map((n,i)=><div className="tr-counting-score" key={n}><span>“{n} 个苹果”</span><b style={{color:aware&&n===count?C.green:C.blue}}>{scores[i].toFixed(3)}</b><div><i style={{width:scores[i]*100+'%',background:aware&&n===count?C.green:C.blue}}/></div></div>)}
    <p>{aware?'相同数量的余弦相似度为 1。':'数量变化，但四个描述的相似度相同。'}</p>
   </div>
  </div>
  <Feedback tone={aware?'green':'orange'}>{aware?'这是假设增加信息后的对照，并非论文提出的改进，也不是 CLIP 实测预测。':'若表示没有保留数量，仅把展签写成“几个苹果”无法凭空补回信息。'}</Feedback>
  <p className="tr-counting-limit">论文也指出分布外泛化、社会偏见与验证集开发局限；实际应用需另行评估。<span className="tr-sr" data-spread>{spread.toFixed(6)}</span></p>
 </div>;
}
