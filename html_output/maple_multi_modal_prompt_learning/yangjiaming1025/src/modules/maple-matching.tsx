import React,{useRef,useState} from 'react';
import {Lab,Stage,Chips,Notice,Stat,Legend,C,changingPhoto,photo,box,line,arrow,label} from './maple-kit';
export function MapleMatching(){const cardMotion=useRef({kind:0,previous:0,at:-10});const angles=useRef([Math.atan2(.6,.8),0]);const [input,setInput]=useState(0),[category,setCategory]=useState(0);const v=input===0?[.8,.6]:[.2,Math.sqrt(.96)];const ts=[[1,0],[0,1],[-.6,.8]],tc=ts[category];const scores=ts.map(a=>v[0]*a[0]+v[1]*a[1]);const score=scores[category],best=scores.indexOf(Math.max(...scores));return <Lab><div className="maple-tag">二维数学示例 · 不是 CLIP 的真实特征或预测</div><p>两种输入分别编码：左侧是图片与类别卡，右侧是它们在共同坐标中的特征。</p><Chips items={['叶片照片','小鸟照片']} value={input} onChange={setInput} label="图像输入"/><Chips items={['叶片','小鸟','花朵']} value={category} onChange={setCategory} label="检查候选"/><Stage height={330} label="图片和类别名分别编码成单位向量后比较方向" draw={(c,w,h,t)=>{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target=[Math.atan2(v[1],v[0]),Math.atan2(tc[1],tc[0])];angles.current=angles.current.map((a,i)=>a+(target[i]-a)*(reduce?1:.16));
  const av=angles.current[0],at=angles.current[1],vx=Math.cos(av),vy=Math.sin(av),tx=Math.cos(at),ty=Math.sin(at),projection=vx*tx+vy*ty;
  box(c,27,27,422,276,'#fff',C.border,22);box(c,476,27,577,276,'#fff',C.border,22);
  label(c,'两种输入',51,54,13,C.muted);label(c,'共同特征空间',504,54,13,C.muted);
  changingPhoto(c,63,85,138,151,input,cardMotion.current,t);box(c,249,111,159,103,'#fff5f8',C.border,15);label(c,['叶片','小鸟','花朵'][category],329,150,25,C.green,'center');line(c,275,181,383,181,C.light,3);
  box(c,71,250,122,28,'#fff5f8',undefined,14);box(c,260,250,138,28,'#fff5f8',undefined,14);label(c,'图像编码 → v',132,264,12,C.blue,'center');label(c,'文字编码 → t',329,264,12,C.green,'center');
  const x=788,y=191,s=101;
  line(c,x-157,y,x+157,y,C.border,1);line(c,x,y-119,x,y+93,C.border,1);
  c.beginPath();c.arc(x,y,s,0,Math.PI*2);c.strokeStyle=C.border;c.setLineDash([3,5]);c.stroke();c.setLineDash([]);
  ts.forEach((a,i)=>{c.save();c.globalAlpha=i===category?.7:.3;line(c,x,y,x+a[0]*s,y-a[1]*s,C.green,1,[2,5]);c.beginPath();c.arc(x+a[0]*s,y-a[1]*s,4,0,Math.PI*2);c.fillStyle=C.green;c.fill();c.restore();});
  const low=Math.min(av,at),high=Math.max(av,at);c.beginPath();c.moveTo(x,y);c.arc(x,y,37,-high,-low);c.closePath();c.fillStyle='#f8e8ef';c.fill();
  line(c,x+vx*s,y-vy*s,x+projection*tx*s,y-projection*ty*s,C.orange,2,[4,5]);
  arrow(c,x,y,x+vx*s,y-vy*s,C.blue,4);arrow(c,x,y,x+tx*s,y-ty*s,C.green,4);
  box(c,x+vx*s-5,y-vy*s-5,10,10,C.blue,undefined,5);box(c,x+tx*s-5,y-ty*s-5,10,10,C.green,undefined,5);
  label(c,'v',x+vx*s+14,y-vy*s+5,17,C.blue);label(c,'t',x+tx*s+12,y-ty*s-9,17,C.green);
  label(c,'夹角 '+(Math.acos(Math.max(-1,Math.min(1,projection)))*180/Math.PI).toFixed(1)+'°',513,276,14,C.muted);label(c,'点积 '+projection.toFixed(3),1023,276,14,C.blue,'right');
  c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fillStyle=C.ink;c.fill();
}}/><Legend items={[{label:'图像特征 v',color:C.blue},{label:'类别特征 t',color:C.green},{label:'投影关系',color:C.orange}]}/><div className="maple-candidate-grid" role="group" aria-label="三个候选的实际比较">{scores.map((s,i)=><button type="button" key={i} aria-label={'候选'+['叶片','小鸟','花朵'][i]} aria-pressed={category===i} onClick={()=>setCategory(i)}><span className={i===best?'candidate-best':'candidate-tag'}>{i===best?'✓ 当前最高分':'候选类别'}</span>{['叶片','小鸟','花朵'][i]}<b>{s.toFixed(3)}</b><div className="candidate-track"><i style={{width:((s+1)*50)+'%'}}/></div><small>−1 至 1 · 余弦相似度</small></button>)}</div><Notice>编码器把不同形式的输入放进<b>同一个特征空间</b>。当前点积 {score.toFixed(3)} 表示方向的接近程度；它本身不是概率。真正预测时，要比较所有候选类别。</Notice><details><summary>数学坐标与论文里的维度</summary><p>示例 v = ({v.map(n=>n.toFixed(3)).join(', ')})；t = ({tc.map(n=>n.toFixed(3)).join(', ')})，两者长度都是 1。用两个分量只是为了画出方向。</p><p>论文采用的 CLIP ViT-B/16 中，文字层内部宽度为 512，视觉层内部宽度为 768；经过各自的最终投影，两种输出都进入 512 维空间。这与后面用于提示耦合的映射 F 是两件事。</p></details></Lab>}
