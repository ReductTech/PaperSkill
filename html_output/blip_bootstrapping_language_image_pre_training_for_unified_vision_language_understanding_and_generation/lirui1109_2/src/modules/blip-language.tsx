import React, { useState } from 'react';
import { Photo, FormulaTerm, Feedback, useTween } from './blip-kit';

function nextOptions(prefix:number[]) {
  if(!prefix.length) return [{word:'游客',prob:.8},{word:'孩子',prob:.2}];
  if(prefix.length===1) {
    const p=prefix[0]===0?.75:.6;
    return [{word:'撑着',prob:p},{word:'拿着',prob:1-p}];
  }
  const p=prefix[0]===0?(prefix[1]===0?.9:.65):(prefix[1]===0?.8:.55);
  return [{word:'红伞',prob:p},{word:'蓝伞',prob:1-p}];
}

export function BlipLanguage() {
  const [choices,setChoices]=useState<number[]>([]);
  const step=choices.length;
  const selected=choices.map((choice,index)=>nextOptions(choices.slice(0,index))[choice]);
  const candidates=nextOptions(choices);
  const probability=selected.reduce((value,item)=>value*item.prob,1);
  const pen=useTween(step,450);
  const choose=(index:number)=>{ if(step<3) setChoices(current=>[...current,index]); };
  const erase=()=>setChoices(current=>current.slice(0,-1));
  return <div className="blip-page" style={{position:'relative',width:'100%',height:'100%',fontSize:'var(--ppt-body-text)',color:'#21324a'}}>
    <div style={{position:'absolute',left:0,top:0,width:1000,height:224,background:'#f7f0df',borderRadius:22,padding:'24px 28px',boxSizing:'border-box'}}>
      <div style={{display:'flex',gap:18,alignItems:'center',height:82}}><span style={{fontWeight:750,color:'#27446e'}}>[Decode]</span>{[0,1,2].map(index=><div key={index} style={{width:207,height:76,display:'grid',placeItems:'center',borderBottom:`4px solid ${index<step?'#228d5c':'#c5bcaa'}`,background:index<step?'#fffdf6':'transparent',fontSize:'var(--ppt-body-heading)',fontWeight:750,color:index<step?'#21324a':'#9d9b90'}}>{index<step?selected[index].word:'待生成'}</div>)}</div>
      <svg style={{position:'absolute',left:195+217*pen,top:104,width:54,height:56,pointerEvents:'none'}} viewBox="0 0 54 56" aria-hidden="true"><path d="M5 48 L15 21 L35 1 L49 15 L28 36 Z" fill="#f07e47" stroke="#92400e" strokeWidth="3"/><path d="M5 48 L15 21 L28 36 Z" fill="#e8d6a7"/><path d="M5 48 L10 34 L18 42 Z" fill="#21324a"/></svg>
      <div style={{position:'absolute',left:28,right:28,bottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>可用文本前缀：{step} 个已选词</span><button type="button" className="blip-control" disabled={!step} onClick={erase} style={{border:'2px solid #c9bdab',borderRadius:10,background:'#fffdf6',padding:'7px 20px',fontSize:'var(--ppt-body-text)',color:'#27446e',cursor:step?'pointer':'default'}}>取回最后一个词</button></div>
    </div>
    <div style={{position:'absolute',left:1040,right:0,top:0}}><Photo kind="umbrella" accent="#c43f52" width={420} height={220}/></div>
    <div style={{position:'absolute',left:0,top:250,width:1000}}>
      {step<3 ? <div style={{display:'flex',gap:22}}>{candidates.map((option,index)=><button key={option.word} type="button" className="blip-control" onClick={()=>choose(index)} style={{flex:1,border:'3px solid #27446e',background:'#edf2f7',borderRadius:14,padding:'19px 24px',fontSize:'var(--ppt-body-heading)',fontWeight:750,color:'#27446e',cursor:'pointer'}}>贴入“{option.word}” · {option.prob.toFixed(2)}</button>)}</div> : <div style={{height:86,display:'flex',alignItems:'center',fontSize:'var(--ppt-body-heading)',fontWeight:750,color:choices[2]===0?'#228d5c':'#c43f52'}}>说明已完成：{selected.map(item=>item.word).join('')}</div>}
      <div style={{marginTop:28,fontSize:'var(--ppt-body-heading)',lineHeight:1.5}}><FormulaTerm meaning="P(T|I)：给定图像I时，整条文本T的教学链概率；本页概率为人工设定。">P(T | I)</FormulaTerm>{' = '}<FormulaTerm meaning="乘积项：每一步在图像I和已选前缀t_<k条件下，为下一个词t_k分配的概率。">{'∏ₖ P(tₖ | I, t<k)'}</FormulaTerm></div>
      <p style={{fontSize:'var(--ppt-body-emphasis)',fontWeight:800,margin:'14px 0 0',color:'#27446e'}}>{choices.length?selected.map(item=>item.prob.toFixed(2)).join(' × '):'空前缀'} = {probability.toFixed(4)}</p>
    </div>
    <div style={{position:'absolute',left:1040,right:0,top:256,lineHeight:1.5}}><p style={{margin:'0 0 22px'}}>选一个词，下一步只能使用已选前缀与图像。</p><p style={{margin:0}}>这组小词表与概率是教学设定，不是 BLIP 的生成结果。</p></div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,minHeight:94}}><Feedback tone={step===3?(choices[2]===0?'green':'red'):'blue'}>{step===3?(choices[2]===0?'链概率由各步条件概率相乘；高概率不等于内容一定真实，生成文字仍要校验。':'说明写成了蓝伞，与图中的红伞不符；能生成完整句子，不等于视觉事实正确。'):`当前只使用${step ? '“'+selected.map(item=>item.word).join('')+'”' : '起始标记'}和图像；尚未选择的词不作为当前输入。`}</Feedback></div>
  </div>;
}
