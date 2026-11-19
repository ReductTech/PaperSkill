import {useState} from 'react';
import {Feedback,Range,fmt,Term} from './camf-kit';
const tasks=[{name:'伪装目标 COS',source:'DUTS',result:'CAMO .729 · COD10K .717',text:'DUTS 显著性标注训练，不用伪装标注。'},{name:'水下分割',source:'DUTS',result:'MAS3K .803 · RMAS .618',text:'论文直接使用 DUTS 训练模型。'},{name:'息肉分割',source:'COS',result:'Kvasir .426 · ETIS .330',text:'这里指 COS 模型迁移到息肉，不是未用过伪装标注。'}];
export function BoundaryScene(){
  const [task,setTask]=useState(1);
  const [source,setSource]=useState('DUTS');
  const [angle,setAngle]=useState(30);
  const current=tasks[task],valid=current.source===source;
  return <div className="camf-page"><div className="camf-split"><section className="camf-stack"><h3>为目标任务选择模型来源</h3><label>目标 <select aria-label="迁移任务" value={task} onChange={event=>setTask(Number(event.target.value))}>{tasks.map((item,index)=><option key={item.name} value={index}>{item.name}</option>)}</select></label><fieldset className="camf-source"><legend>训练来源</legend>{['DUTS','COS'].map(item=><label className="camf-check" key={item}><input type="radio" name="source" value={item} checked={source===item} onChange={()=>setSource(item)}/>{item==='DUTS'?'DUTS 显著性标注':'CAMO + COD10K 伪装标注'}</label>)}</fieldset><div className="camf-stamp" style={{color:valid?'var(--green)':'var(--red)'}}>{valid?'有匹配的论文协议':'没有这里引用的匹配实验'}</div><p>{valid?current.result+'，Fᵂβ ↑':'不移植其他来源模型的分数。'}</p></section><section className="camf-stack"><h3>把码本机制再用一次</h3><div className="camf-practice-card"><p>语义练习卡</p><div className="camf-equation"><Term meaning="Lq：合成单位向量的单尺度余弦损失，与左侧实测成绩无因果联动">Lq</Term> = {fmt(1-Math.cos((angle-30)*Math.PI/180))}</div><div className="camf-needle" style={{transform:`rotate(${angle-30}deg)`}}/></div><Range label="合成 query 角度" value={angle} min={0} max={180} onChange={setAngle}/><p>角度只改变教学损失，不改变论文分数。新任务仍需验证泛化。</p></section></div><Feedback tone={valid?'green':'red'}>{valid?current.text:`当前是 ${source} 模型，但所引 ${current.name} 迁移来自 ${current.source}。`} OVCamo 仅验证二值掩码，不等于开放词汇识别。</Feedback></div>;
}
