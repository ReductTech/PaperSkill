import React, { useState } from 'react';
import { Photo, FormulaTerm, Feedback, useTween } from './blip-kit';

export function BlipContrastive() {
  const [score, setScore] = useState(.4);
  const tau=.2;
  const scores=[score,.6,.2];
  const weights=scores.map(value=>Math.exp(value/tau));
  const total=weights.reduce((a,b)=>a+b,0);
  const probabilities=weights.map(value=>value/total);
  const lens=useTween(score,350);
  const labels=['蛋糕与奶油','面包房与招牌','海边的日落'];
  return <div className="blip-page" style={{position:'relative',width:'100%',height:'100%',fontSize:'var(--ppt-body-text)',color:'#21324a'}}>
    <div style={{position:'absolute',left:0,top:0,width:724,height:492,background:'#f4eee1',borderRadius:24}}>
      <div style={{position:'absolute',left:26,top:12}}><Photo kind="cake" width={400} height={226}/></div>
      <svg style={{position:'absolute',left:20+236*lens,top:64,width:150,height:150,pointerEvents:'none'}} viewBox="0 0 150 150" aria-hidden="true"><circle cx="58" cy="58" r="45" fill="#d4e6f44d" stroke="#92400e" strokeWidth="9"/><path d="M91 91 L139 139" stroke="#92400e" strokeWidth="18" strokeLinecap="round"/></svg>
      <div style={{position:'absolute',left:440,top:26,width:250,lineHeight:1.5}}>相册检索先比较<br/><strong>全局图文表征</strong></div>
      <div style={{position:'absolute',left:32,right:32,top:264,display:'grid',gap:12}}>{labels.map((label,index)=><div key={label} style={{display:'flex',justifyContent:'space-between',background:index===0 ? '#e5edf6' : '#fffdf8',border:`2px solid ${index===0?'#27446e':'#ded7c9'}`,borderRadius:12,padding:'10px 18px',fontWeight:index===0?750:500}}><span>{label}</span><span>相似度 {scores[index].toFixed(2)}</span></div>)}</div>
    </div>
    <div style={{position:'absolute',left:770,right:0,top:0}}>
      <div style={{fontSize:'var(--ppt-body-heading)',fontWeight:750,marginBottom:12}}>正对要胜过其他候选</div>
      <label style={{display:'block',marginBottom:22,lineHeight:1.6}}>蛋糕描述的相似度 <b style={{color:'#f07e47'}}>{score.toFixed(2)}</b><input aria-label="蛋糕描述的相似度" type="range" min="0" max="1" step="0.05" value={score} onInput={event=>setScore(Number(event.currentTarget.value))} style={{display:'block',width:'100%',height:34,accentColor:'#f07e47'}}/></label>
      <div aria-label="三个候选的归一化概率">{labels.map((label,index)=><div key={label} style={{height:58}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span>{label}</span><strong>{(probabilities[index]*100).toFixed(1)}%</strong></div><div style={{height:10,borderRadius:6,background:'#e7e8e5'}}><div style={{height:'100%',width:`${probabilities[index]*100}%`,borderRadius:6,background:index===0?'#228d5c':'#27446e',transition:'width 250ms ease'}}/></div></div>)}</div>
      <div style={{marginTop:16,fontSize:'var(--ppt-body-heading)',whiteSpace:'nowrap'}}>
        <FormulaTerm meaning="P_i：第i个候选在这组三个候选中的教学归一化概率。">Pᵢ</FormulaTerm>{' = exp('}<FormulaTerm meaning="s_i：当前图像与第i条候选描述的教学相似度，无量纲。">sᵢ</FormulaTerm>{' / '}<FormulaTerm meaning="τ：softmax温度，本例固定为0.2；不是论文结果数据。">τ</FormulaTerm>{') / '}<FormulaTerm meaning="分母：对三个候选的exp(s_j/τ)求和，确保概率总和为1。">Σⱼ exp(sⱼ / τ)</FormulaTerm>
      </div>
      <p style={{margin:'12px 0 0',lineHeight:1.45}}>教学计算，非 BLIP 推理。原模型还用动量编码器的软目标处理潜在正例。</p>
    </div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,minHeight:94}}><Feedback tone={score>.6?'green':score<.3?'red':'blue'}>{score>.6 ? `蛋糕描述现在排第一，归一化概率为 ${(probabilities[0]*100).toFixed(1)}%。` : `蛋糕描述的归一化概率为 ${(probabilities[0]*100).toFixed(1)}%；它取决于与其他候选的相对差距。`}</Feedback></div>
  </div>;
}
