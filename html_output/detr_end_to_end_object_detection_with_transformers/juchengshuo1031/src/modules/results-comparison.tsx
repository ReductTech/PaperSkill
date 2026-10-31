import React, {useState} from 'react';
const ink='#21324a', blue='#27446e', green='#228d5c', muted='#68778f';
const root:React.CSSProperties={width:1472,height:622,color:ink,fontSize:28,boxSizing:'border-box',fontFamily:'inherit'};
export function ResultsComparison(){
 const [metric,setMetric]=useState<'AP'|'APS'|'APL'>('AP');
 const data={AP:[42,42],APS:[26.6,20.5],APL:[53.4,61.1]}[metric];
 return <div style={root}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:74}}><span>COCO 2017 val · ResNet-50 · bbox AP（越高越好）</span><div style={{display:'flex',gap:12}}>{(['AP','APS','APL'] as const).map(m=><button key={m} onClick={()=>setMetric(m)} aria-pressed={metric===m} style={{fontSize:28,padding:'10px 20px',border:'1px solid #d7deea',borderRadius:10,color:metric===m?'white':ink,background:metric===m?blue:'white'}}>{m==='AP'?'总体 AP':m==='APS'?'小目标 AP':'大目标 AP'}</button>)}</div></div>
  <svg width="1472" height="330" viewBox="0 0 1472 330" role="img" aria-label={'Faster R-CNN-FPN+ '+data[0]+'，DETR '+data[1]}>
   {[0,20,40,60].map(n=><g key={n}><line x1={410+n*14} y1="35" x2={410+n*14} y2="265" stroke="#d7deea"/><text x={410+n*14} y="310" textAnchor="middle" fill={muted} fontSize="28">{n}</text></g>)}
   {['Faster R-CNN-FPN+','DETR'].map((name,i)=><g key={name}><text x="0" y={100+i*120} fill={ink} fontSize="34">{name}</text><rect x="410" y={58+i*120} width={data[i]*14} height="65" rx="6" fill={i?green:blue}/><text x={430+data[i]*14} y={101+i*120} fontSize="44" fill={ink}>{data[i].toFixed(1)}</text></g>)}
  </svg>
  <p style={{fontSize:34,margin:'8px 0 20px',color:metric==='APS'?'#c43f52':green}}>{metric==='AP'?'总体 AP 相同，优势与短板需要按目标尺度拆开看。':metric==='APS'?'DETR 的小目标表现弱于增强 Faster R-CNN 基线。':'DETR 在大目标上的 AP 高于增强 Faster R-CNN 基线。'}</p>
  <div style={{borderTop:'2px solid #d7deea',paddingTop:18,lineHeight:1.5}}>Table 1：最终训练 epoch 的验证结果。DETR 训练 500 epochs；<br/>“+”基线使用 GIoU、随机裁剪和 9×（109 epochs）训练，并非相同训练预算。</div>
 </div>
}
export function LossAblation(){
 const rows=[['分类 + L1',35.8],['分类 + GIoU',39.9],['分类 + L1 + GIoU',40.6]] as const;
 return <div style={root}><div style={{fontSize:34,height:64}}>三项集合损失共同构成基线</div><svg width="1472" height="340" viewBox="0 0 1472 340" role="img" aria-label="损失消融：35.8、39.9、40.6 AP">
 {[0,20,40].map(n=><g key={n}><line x1={420+n*21} y1="8" x2={420+n*21} y2="285" stroke="#d7deea"/><text x={420+n*21} y="330" fill={muted} fontSize="28" textAnchor="middle">{n}</text></g>)}
 {rows.map(([label,n],i)=><g key={label}><text x="0" y={58+i*95} fontSize="34" fill={ink}>{label}</text><rect x="420" y={18+i*95} width={n*21} height="60" rx="6" fill={i===2?green:blue}/><text x={440+n*21} y={60+i*95} fontSize="44" fill={ink}>{n.toFixed(1)}</text></g>)}
 </svg><p style={{fontSize:34,margin:'10px 0 18px'}}>仅保留 L1 框损失的效果较差；与 GIoU 联合使用更好。</p><div style={{borderTop:'2px solid #d7deea',paddingTop:18,lineHeight:1.5}}>Table 4 · COCO 2017 val · bbox AP，越高越好。<br/>300 epochs 消融实验，报告最后 10 个 epochs 验证结果的中位数。不能与上一页的 500 epochs 结果直接混用。</div></div>
}
export function Limitations(){
 return <div style={{...root,display:'grid',gridTemplateColumns:'1fr 1fr',gap:54}}>
 <section><h3 style={{fontSize:34,margin:'0 0 22px'}}>长训练周期</h3><div style={{fontSize:44,color:blue,marginBottom:10}}>500 epochs</div><p style={{lineHeight:1.5,margin:'0 0 24px'}}>DETR 与 Faster R-CNN 对比时使用的训练长度；在第 400 epoch 降低学习率。</p><svg width="690" height="145" viewBox="0 0 690 145" role="img" aria-label="训练长度：DETR 500 epochs，Faster R-CNN增强基线109 epochs"><text x="0" y="31" fontSize="28" fill={ink}>DETR</text><rect x="180" y="5" width="500" height="36" fill={blue}/><text x="0" y="101" fontSize="28" fill={ink}>增强基线</text><rect x="180" y="75" width="109" height="36" fill="#76906a"/><text x="305" y="103" fontSize="28" fill={ink}>109 epochs</text></svg><p style={{lineHeight:1.5,margin:'18px 0'}}>结构简洁并不意味着快速收敛。训练与优化仍是原论文明确提出的挑战。</p></section>
 <section style={{borderLeft:'2px solid #d7deea',paddingLeft:44}}><h3 style={{fontSize:34,margin:'0 0 22px'}}>小目标仍是短板</h3><div style={{display:'flex',gap:50,marginBottom:26}}><div><span style={{fontSize:44,color:'#c43f52'}}>20.5</span><br/>DETR APₛ</div><div><span style={{fontSize:44,color:blue}}>26.6</span><br/>FPN+ APₛ</div></div><p style={{lineHeight:1.5,margin:'0 0 24px'}}>COCO 2017 val，ResNet-50，Table 1。总体 AP 相同不代表各个尺度同样有效。</p><div style={{background:'#f5f8f0',padding:24,borderRadius:16,lineHeight:1.5}}>DC5 提高特征分辨率，改善小目标表现，但增加计算成本；它没有消除原论文中的小目标差距。</div></section>
 </div>
}
