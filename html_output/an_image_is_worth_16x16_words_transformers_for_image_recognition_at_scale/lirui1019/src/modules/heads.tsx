import React, {useState} from 'react';
import {C,Stage,Feedback,clearScene,drawPhoto,line,pill} from './BirdKit';

const names=['翅膀','鸟嘴','叶片','树枝'];
const X=[[1,.1,1,0],[.1,1,0,1],[.8,.1,-1,0],[.1,.8,0,-1]];
const V=X.map(x=>[x[2],x[3]]);
const vec=(v:number[])=>`[${v.map(x=>x.toFixed(3)).join('，')}]`;
function head(t:number){
  const scores=X.map(x=>9*((1-t)*x[0]+t*x[1])/Math.sqrt(2));
  const exp=scores.map(s=>Math.exp(s-Math.max(...scores))),sum=exp.reduce((a,b)=>a+b,0);
  const a=exp.map(e=>e/sum);
  return {scores,a,out:[0,1].map(d=>a.reduce((s,w,j)=>s+w*V[j][d],0))};
}
const note:React.CSSProperties={fontSize:16,lineHeight:1.7,color:C.muted};
export function Heads(){
 const [mix,setMix]=useState(1),A=head(0),B=head(mix);
 const merged=[...A.out,...B.out];
 const projected=[(merged[0]+merged[2])/2,(merged[1]+merged[3])/2,(merged[0]-merged[2])/2,(merged[1]-merged[3])/2];
 return <div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>固定翅膀查询，让头 B 从复制头 A，变成另一套匹配。</p>
  <div className="ctrl" style={{flexWrap:'wrap'}}>
   <label htmlFor="head-projection">头 B 的投影方向</label>
   <input id="head-projection" type="range" min={0} max={1} step={.05} value={mix}
    onChange={e=>setMix(Number(e.target.value))} onKeyDown={e=>e.stopPropagation()}/>
   <output htmlFor="head-projection" className="val">t = {mix.toFixed(2)}</output>
   <button className="tiny ghost" onClick={()=>setMix(0)}>复制头 A</button>
   <button className="tiny" onClick={()=>setMix(1)}>尝试另一方向</button>
  </div>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>左端偏向 x₁，右端偏向 x₂；仅改变头 B 的 K 投影。</p>
  <Stage height={390} label={`同一张照片、同一翅膀查询。头 A 权重 ${vec(A.a)}，头 B 权重 ${vec(B.a)}。线粗表示参考比例，下面两套结果同时保留。`}
   render={(c,w,h)=>{
    clearScene(c,w,h);
    [{x:20,data:A,title:'头 A：投影固定',color:C.blue},{x:562,data:B,title:`头 B：t = ${mix.toFixed(2)}`,color:C.purple}].forEach(p=>{
      c.fillStyle=p.color;c.font='600 23px sans-serif';c.fillText(p.title,p.x+10,34);
      drawPhoto(c,p.x+12,63,230);
      const pts=[[100,133],[193,94],[32,80],[170,169]].map(([x,y])=>[p.x+12+x/224*230,63+y/224*230]);
      pts.forEach(([x,y],i)=>{
        c.save();c.globalAlpha=.15+p.data.a[i]*.85;
        line(c,pts[0][0],pts[0][1],x,y,p.color,1+p.data.a[i]*12);c.restore();
        c.strokeStyle=i===0?C.orange:p.color;c.lineWidth=i===0?4:2;c.strokeRect(x-14,y-14,28,28);
      });
      names.forEach((name,i)=>{const y=84+i*55;
        c.fillStyle=C.ink;c.font='18px sans-serif';c.fillText(name,p.x+260,y);
        pill(c,p.x+260,y+10,170,13,'#e0e8d8');pill(c,p.x+260,y+10,Math.max(1,170*p.data.a[i]),13,p.color);
        c.fillStyle=p.color;c.font='600 17px sans-serif';c.fillText(`${(p.data.a[i]*100).toFixed(1)}%`,p.x+443,y+23);
      });
      c.fillStyle=C.support;c.font='17px sans-serif';c.fillText('橙框始终是同一块翅膀',p.x+12,322);
      c.fillStyle=p.color;c.font='600 21px sans-serif';c.fillText(`独立输出 O = ${vec(p.data.out)}`,p.x+12,366);
    });
    line(c,540,20,540,375,C.line,1);
   }}/>
  <div aria-live="polite"><Feedback tone={mix===0?"orange":"green"}>{mix===0?"两头投影相同，权重与输出重复。增加头数未必增加新信息。":<>头 A 参考翅膀 {(A.a[0]*100).toFixed(1)}%、叶片 {(A.a[2]*100).toFixed(1)}%；头 B 参考鸟嘴 {(B.a[1]*100).toFixed(1)}%、树枝 {(B.a[3]*100).toFixed(1)}%。投影改变了相似性判断。</>}</Feedback></div>
  <details><summary>展开计算：改变投影，怎样改变参考关系？</summary>
   <p style={note}>每行 X = [x₁,x₂,x₃,x₄]。固定翅膀查询 Q = [3x₁,0] = [3,0]；头 A 的 K = [3x₁,x₃]；头 B 的 K = [3((1−t)x₁+tx₂),x₃]；两头均用 V = [x₃,x₄]。这些都是线性投影，改变 t 等于改变 Wᴷ 中的系数。</p>
   <table style={{width:'100%',fontSize:15,textAlign:'left'}}><thead><tr><th>来源 X</th><th>头 A 分数 / 权重</th><th>头 B 分数 / 权重</th><th>V</th></tr></thead>
    <tbody>{names.map((name,i)=><tr key={name}><td style={{padding:'10px 0'}}>{name} {vec(X[i])}</td><td>{A.scores[i].toFixed(3)} / {(A.a[i]*100).toFixed(1)}%</td><td>{B.scores[i].toFixed(3)} / {(B.a[i]*100).toFixed(1)}%</td><td>{vec(V[i])}</td></tr>)}</tbody></table>
   <p style={note}>分数 = QKᵀ/√2；权重 = softmax(分数)；O = ΣαⱼVⱼ。头 B 的分数变化会连续改变权重，再改变每项 V 的贡献。</p>
  </details>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}><b>先拼接两份输出，再投影融合。</b></p>
  <p style={note}>拼接 [Oᴬ ∥ Oᴮ] = <strong style={{color:C.ink}}>{vec(merged)}</strong>（4 维）</p>
  <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>融合后：<strong>{vec(projected)}</strong>（4 维）</p><details><summary>查看输出投影计算</summary><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>设拼接结果为 [a,b,c,d]，投影为 [(a+c)/2,(b+d)/2,(a−c)/2,(b−d)/2]。</p></details></>
  <><p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>真实头的分工由训练形成，可能重叠；这里是手工数值示例。</p><details><summary>多头的尺寸与示例边界</summary><p style={note}>本例 X 与投影均为手工数值，不是实测注意力；坐标不等于实际模型中命名好的鸟类属性。真实每个头分别学习 Wᑫ、Wᴷ、Wⱽ，拼接后学习 Wᴼ；头的职责可能重叠，更多头并不保证更好。ViT-B 的 D=768、h=12，每头 64 维；“观察角度”指特征子空间，与拍摄视角无关。依据：附录 A 式（5–8）、表 1。</p></details></>
 </div>;
}
