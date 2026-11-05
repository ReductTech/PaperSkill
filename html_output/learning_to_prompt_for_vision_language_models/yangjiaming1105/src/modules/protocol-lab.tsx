import React,{useState} from 'react';
import {Chips,Feedback} from './coop-kit';
import {SamplePortrait} from './learning-visuals';
const scenes=[
 {label:'狗的照片 → 狗的素描',d:true,n:false,copy:'适配时有狗的照片，测试时是狗的素描。类别仍然是狗，图像分布变了。'},
 {label:'猫狗照片 → 马的照片',d:false,n:true,copy:'本情境约定拍摄来源与风格保持一致，只把适配类别猫、狗换成马。马未参加当前适配。'},
 {label:'猫狗照片 → 马的素描',d:true,n:true,copy:'马未参加当前适配，图片又从照片换成素描。两个维度同时改变。'},
 {label:'狗的照片 → 另一张狗照片',d:false,n:false,copy:'测试集里另一张正常狗照片。它是新的图片，但没有特意改变类别集合或图像分布。'}
];
export const ProtocolLab:React.FC=()=>{
 const [index,setIndex]=useState(0),[domain,setDomain]=useState<boolean|null>(null),[novel,setNovel]=useState<boolean|null>(null),[reveal,setReveal]=useState(false);
 const scene=scenes[index];const correct=domain===scene.d&&novel===scene.n;
 const reset=(i=0)=>{setIndex(i);setDomain(null);setNovel(null);setReveal(false);};
 return <>
  <Chips label="选择情境" value={String(index)} options={scenes.map((s,i)=>({value:String(i),label:s.label}))} onChange={v=>reset(Number(v))}/>
  <div className="lv-stage lv-protocol-comparison" key={index}>
    <div className="lv-protocol-side lv-step-panel"><h4>适配时见过</h4><div className="lv-protocol-photos">{(index===1||index===2?[0,1]:[1]).map(kind=><SamplePortrait key={kind} kind={kind}/>)}</div><strong>{index===1||index===2?'猫、狗的照片':'狗的照片'}</strong></div>
    <div className="lv-protocol-arrow" aria-hidden="true">→</div>
    <div className="lv-protocol-side lv-step-panel"><h4>现在拿来测试</h4><div className={'lv-protocol-photos'+(scene.d?' lv-protocol-sketch':'')}><SamplePortrait kind={index===0||index===3?1:3}/></div><strong>{index===0?'狗的素描':index===1?'马的照片':index===2?'马的素描':'另一张狗照片'}</strong></div>
  </div>
  <p>{scene.label}。这些情境约定：除明确换成素描外，采集来源与画风保持一致；仅换类别时不额外引入域变化。“都是照片”本身不足以保证同分布。</p>
  <Chips label="是否特意改变图像分布？" value={domain===null?'':String(domain)} options={[{value:'true',label:'是，换了图像分布'},{value:'false',label:'否，仍是同类图像分布'}]} onChange={v=>{setDomain(v==='true');setReveal(false);}}/>
  <Chips label="是否出现未参加适配的类别？" value={novel===null?'':String(novel)} options={[{value:'true',label:'是，类别也变了'},{value:'false',label:'否，类别仍然兼容'}]} onChange={v=>{setNovel(v==='true');setReveal(false);}}/>
  <div className="ctrl"><button type="button" className="chip selected" disabled={domain===null||novel===null} onClick={()=>setReveal(true)}>检查我的判断</button><button type="button" className="chip" onClick={()=>reset()}>重新判断</button></div>
  <Feedback tone={reveal?(correct?'good':'bad'):'neutral'}>{reveal?`${correct?'判断正确。':'再分开看这两个问题。'}${scene.copy} 图像分布变化：${scene.d?'是':'否'}；适配新类别：${scene.n?'是':'否'}。${scene.d&&!scene.n?'这与本论文主文第4.2节所考察的域变化相对应。':scene.n?'这一情境含适配新类别，不能用主文第4.2节的结果直接作保证。':'仅仅是一张没参与训练的图片，还不足以称为新域或新类别。'}`:'分别判断“图片的样子变了吗”和“类别参加过适配吗”。先选两个答案，再检查判断；结果会告诉你它与论文实验的关系。'}</Feedback>
  <p>论文 p.8 §4.2 使用 ImageNet 与类别兼容的测试集或子集考察域泛化，不能据此证明对适配阶段未见类别的泛化。“未见类别”在这里相对于 CoOp 适配数据而言，不代表 CLIP 预训练从未见过。</p>
 </>;
};
