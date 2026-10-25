import React,{useState} from 'react';
import {C,Stage,clearScene,line,pill,Chips,Feedback} from './BirdKit';
const note:React.CSSProperties={fontSize:16,lineHeight:1.75,color:C.muted};
const td:React.CSSProperties={padding:'11px 12px',borderBottom:`1px solid ${C.line}`,textAlign:'left'};
const paperRows=[['ImageNet · 约130万张',77.91,76.53],['ImageNet-21k · 约1,400万张',83.97,85.15],['JFT · 约3亿张',84.15,87.12]] as const;
export function DataScale(){
 const [evidence,setEvidence]=useState(0);
 const expanded=evidence===2,count=evidence===1?20:expanded?4:2,wrong=expanded?2:0;
 return <div>
  <p style={{fontWeight:650}}>先问“现有照片排除了哪些错误规则？”</p>
  <p style={{fontSize:16,lineHeight:1.7,color:C.muted}}>相册只有“树林长嘴鸟”和“天空圆嘴鸟”。看鸟嘴、看背景，两套规则都能答对。</p>
  <Chips label="改变训练相册提供的证据" value={evidence} onChange={setEvidence} options={[{value:0,label:'只有 2 种搭配'},{value:1,label:'把原照片重复到 20 张'},{value:2,label:'补上 2 种跨背景搭配'}]}/>
  <Stage height={460} label={`${evidence===0?'仅有两种搭配':evidence===1?'同样两张照片各重复10次':'加入长嘴配天空、圆嘴配树林的反例'}。训练照片${count}张。看鸟嘴规则答对${count}/${count}；看背景规则答对${count-wrong}/${count}。${expanded?'新增反例排除了只看背景也能答对训练集的说法。':'两种规则在训练集上均为百分之百，仍无法区分。'}`}
   render={(c,w,h)=>{
    clearScene(c,w,h);c.fillStyle=C.ink;c.font='600 21px sans-serif';c.fillText('先看规则能否解释训练证据，再谈未见照片',24,31);
    for(let i=0;i<4;i++){
     const x=24+i*265,long=i===0||i===2,trees=i===0||i===3,seen=i<2||expanded;
     pill(c,x,57,245,338,seen?'#fffefa':'#edf0f2');
     c.fillStyle=seen?C.blue:C.muted;c.font='600 18px sans-serif';c.fillText(i<2?(evidence===1?'训练中：同一图 ×10':'训练中：原有照片'):(expanded?'训练中：新补的反例':'未提供标签的新搭配'),x+12,84);
     pill(c,x+14,101,217,125,trees?'#d9e5cf':'#dceaf4');
     if(trees){line(c,x+24,220,x+47,110,C.dark,8);line(c,x+47,156,x+85,125,C.dark,5);}
     c.fillStyle=C.blue;c.beginPath();c.ellipse(x+132,171,39,25,-.1,0,Math.PI*2);c.fill();c.beginPath();c.arc(x+164,146,20,0,Math.PI*2);c.fill();
     c.fillStyle=C.orange;c.beginPath();c.moveTo(x+180,142);c.lineTo(x+(long?218:195),148);c.lineTo(x+180,155);c.closePath();c.fill();
     c.fillStyle='white';c.beginPath();c.arc(x+170,140,3,0,Math.PI*2);c.fill();
     c.fillStyle=C.ink;c.font='18px sans-serif';c.fillText(`${long?'长嘴':'圆嘴'} + ${trees?'树林':'天空'}`,x+16,252);
     c.fillStyle=C.blue;c.font='17px sans-serif';c.fillText(`A 看鸟嘴 → ${long?'长嘴':'圆嘴'}`,x+16,288);
     c.fillStyle=i>=2&&expanded?C.red:C.blue;c.fillText(`B 看背景 → ${trees?'长嘴':'圆嘴'}`,x+16,319);
     c.fillStyle=seen?C.green:C.muted;c.fillText(seen?`标签：${long?'长嘴':'圆嘴'} · ${i>=2?'B 的捷径失效':'两者都答对'}`:'标签未用于训练',x+16,368);
    }
    c.fillStyle=expanded?C.green:C.support;c.font='600 20px sans-serif';c.fillText(expanded?'新增搭配提供了原来没有的约束：背景不能稳定代替类别。':evidence===1?'张数变多，但没有新搭配；原来的歧义仍然存在。':'训练集上两者都答对，不能据此判断谁掌握了识鸟规则。',24,434);
   }}/>
  <div style={{display:'flex',gap:24,flexWrap:'wrap',fontSize:19,fontWeight:650,margin:'18px 0'}}><span>训练证据：{count} 张</span><span>A 看鸟嘴：{count}/{count} 正确</span><span style={{color:expanded?C.red:C.ink}}>B 看背景：{count-wrong}/{count} 正确</span></div>
  <Feedback tone={expanded?"green":"orange"}>{expanded?"新增搭配让背景规则错 2 次，形状规则仍全对：新证据排除了捷径。":evidence===1?"重复到 20 张，两规则仍全对；没有新搭配，就没有新约束。":"两规则均为 2/2，暂时无法区分。试试重复照片与补充新搭配。"}</Feedback>
  <p style={{fontWeight:650}}>这怎样解释 ViT 对数据的需求？</p>
  <p style={note}>模型越灵活，越需要多样样本排除捷径。CNN 的局部连接与共享权重提供视觉先验；ViT 的这类先验更少，通常需要更多数据。</p>
  <details><summary>这个相册例子说明什么？</summary><p style={note}>A、B 只是演示“训练证据不足以区分规则”，不是 CNN 与 ViT 的模拟。CNN 也可能用背景，ViT 也能学形状；先验、数据多样性、优化和正则化都会影响结果。</p></details>
  <p style={{fontWeight:650}}>回到论文：容量收益是否随数据条件改变？</p>
  <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:17}}><thead><tr>{['预训练数据','ViT-B/16','ViT-L/16','L − B'].map(s=><th style={td} key={s}>{s}</th>)}</tr></thead><tbody>{paperRows.map(([name,b,l])=><tr key={name}><th style={td}>{name}</th><td style={td}>{b.toFixed(2)}%</td><td style={td}>{l.toFixed(2)}%</td><td style={{...td,color:l>b?C.green:C.red}}>{l>b?'+':''}{(l-b).toFixed(2)} 个百分点</td></tr>)}</tbody></table></div>
  <p style={note}>论文观察：ImageNet 时 L/16 落后 B/16；更大预训练数据后，L/16 反超。容量收益依赖数据与设置。</p>
  <details><summary>展开评估口径</summary><p style={note}>数值来自附录 Table 5：ImageNet 迁移 top-1，下游 384 分辨率微调；未采用 Table 2 的高分辨率与 Polyak 平均。数据集还改变了内容与分布，不能只归因于张数。Figure 4 的冻结特征五样本评估另行阅读。</p></details>
 </div>;
}
