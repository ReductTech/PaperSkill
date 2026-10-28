import React, { useState } from 'react';
import { C, Street, Person, Range, Feedback } from './FpnKit';
import { SymbolHint } from '../components/SymbolHint';

const anchorSides = [32,64,128,256,512];
function squareIoU(anchor:number,target:number,offset:number){
  const ix=Math.max(0,Math.min(anchor/2,offset+target/2)-Math.max(-anchor/2,offset-target/2));
  const iy=Math.min(anchor,target);
  const intersection=ix*iy;
  return intersection/(anchor*anchor+target*target-intersection);
}

export function FpnRpn(){
  const [target,setTarget]=useState(96);
  const [offset,setOffset]=useState(0);
  const [selected,setSelected]=useState(2);
  const overlaps=anchorSides.map(a=>squareIoU(a,target,offset));
  const best=Math.max(...overlaps);
  const labels=overlaps.map(v=>v>.7||Math.abs(v-best)<1e-12?'正':v<.3?'负':'忽略');
  const positives=labels.filter(v=>v==='正').length;
  const a=anchorSides[selected],iou=overlaps[selected];
  const color=labels[selected]==='正'?C.green:labels[selected]==='负'?C.red:C.orange;
  const factor=.63,cx=450,cy=230;
  return <div className="fpn-scene" style={{gap:18}}>
    <div className="fpn-row" style={{height:452,flex:'0 0 452px',gap:30}}>
      <div style={{width:706,display:'flex',flexDirection:'column',gap:16}}>
        <p style={{color:C.muted}}>蓝线：真值；虚线：锚框（方形示意）</p>
        <svg width="706" height="290" viewBox="0 0 900 420" role="img" aria-label={`方形真实框边长${target}像素，中心偏移${offset}像素。选中P${selected+2}的${a}像素方形锚框，IoU为${iou.toFixed(3)}。`} style={{borderRadius:18,background:C.sky}}>
          <g transform="scale(1 .93)"><Street/></g>
          <Person x={cx+offset*factor} y={cy+target*factor/2-8} height={target*factor*.85}/>
          <rect x={cx-a*factor/2} y={cy-a*factor/2} width={a*factor} height={a*factor} fill={color} fillOpacity=".07" stroke={color} strokeWidth="5" strokeDasharray="12 7"/>
          <rect x={cx+(offset-target/2)*factor} y={cy-target*factor/2} width={target*factor} height={target*factor} fill={C.blue} fillOpacity=".12" stroke={C.blue} strokeWidth="5"/>
          <circle cx={cx} cy={cy} r="6" fill={color}/>
          <circle cx={cx+offset*factor} cy={cy} r="6" fill={C.blue}/>
        </svg>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}}>
          <Range label="真值边长 / 像素" value={target} min={16} max={448} step={16} onChange={setTarget}/>
          <Range label="中心横移 / 像素" value={offset} min={-160} max={160} step={8} onChange={setOffset}/>
        </div>
      </div>
      <div style={{width:736,display:'flex',flexDirection:'column',gap:10}}>
        <h3>在各层放置锚框，再按重叠分配标签</h3>
        <div style={{display:'grid',gridTemplateColumns:'80px 148px 130px 1fr',alignItems:'center',gap:12,padding:'2px 14px',color:C.muted}}><span>层</span><span>锚框边长</span><span>IoU</span><span>训练标签</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {anchorSides.map((side,i)=>{
            const tone=labels[i]==='正'?C.green:labels[i]==='负'?C.red:C.orange;
            const isBest=Math.abs(overlaps[i]-best)<1e-12;
            return <button key={side} type="button" aria-label={`查看P${i+2}层锚框：边长${side}，IoU${overlaps[i].toFixed(3)}，${labels[i]}样本`} aria-pressed={selected===i} onClick={()=>setSelected(i)} style={{display:'grid',gridTemplateColumns:'80px 148px 130px 1fr',alignItems:'center',gap:12,width:'100%',height:46,padding:'2px 14px',font:'inherit',fontSize:28,lineHeight:1.2,textAlign:'left',color:C.ink,border:`2px solid ${selected===i?C.blue:C.line}`,borderRadius:10,background:selected===i?'#edf2f8':'white',cursor:'pointer'}}>
              <strong>P{i+2}</strong><span>{side} px</span><span style={{fontVariantNumeric:'tabular-nums'}}>{overlaps[i].toFixed(3)}</span><strong style={{color:tone}}>{labels[i]}{isBest?'（最高）':''}</strong>
            </button>;
          })}
        </div>
        <p style={{color:C.muted}}>原方法含三种宽高比，各层共享预测头。</p>
      </div>
    </div>
    <Feedback tone={labels[selected]==='正'?'green':labels[selected]==='负'?'red':'orange'}>
      当前有{positives}个正样本：每个真值的最高 <SymbolHint meaning="IoU：锚框与真实框的交集面积除以并集面积；不是模型置信度。">IoU</SymbolHint> 锚框或 IoU＞0.7 为正；其余 IoU＜0.3 为负，中间忽略。并非先给目标指定唯一层。
    </Feedback>
  </div>;
}
