import { useState } from 'react';
import { StudyCanvas, palette, drawArrow, drawLabel } from './studio-kit';

const nodes = ['图像侧','文本侧','低秩支路','相似度'];
const descriptions = [
  '图像编码器有 12 层，隐藏表示为 768 维。注意力的 q、k、v、o 投影均加入适配支路，最终映射到共同的 512 维图文空间。',
  '文本编码器有 12 层，隐藏表示为 512 维。当前任务的类别名称形成文本候选，文本侧的 q、k、v、o 投影同样适配。',
  '每条支路固定 A、只训练 B；秩为 16。两侧合计训练 B 的参数数目为 12 × 4 × (16 × 768 + 16 × 512) = 983,040，约 0.98M。',
  '图像与类别文本进入共同的 512 维空间，计算类别评分。基础版结束任务后把低秩更新合并进权重；增强版再结合类别原型评分。'
];
export function Ch8Main() {
  const [node,setNode]=useState(0), [plus,setPlus]=useState(false);
  const scores=plus?[1,2.5]:[2,1];
  return <div>
    <div className="chip-row" aria-label="模型节点">{nodes.map((n,i)=><button key={n} className={`chip ${node===i?'selected':''}`} aria-pressed={node===i} onClick={()=>setNode(i)}>{n}</button>)}</div>
    <div className="ctrl"><button className={`chip ${!plus?'selected':''}`} aria-pressed={!plus} onClick={()=>setPlus(false)}>KeepLoRA</button><button className={`chip ${plus?'selected':''}`} aria-pressed={plus} onClick={()=>setPlus(true)}>KeepLoRA+</button><button className="tiny ghost" onClick={()=>{setNode(0);setPlus(false);}}>重置</button></div>
    <StudyCanvas ariaLabel="图像和文本分别经过编码器进入共同空间，低秩支路附着在两侧编码器，增强版另有类别原型路径" draw={c=>{
      const box=(x:number,y:number,w:number,h:number,active:boolean,color:string)=>{c.fillStyle=active?`${color}22`:'#ffffff';c.strokeStyle=active?color:palette.border;c.lineWidth=active?3:1.5;c.beginPath();c.roundRect(x,y,w,h,10);c.fill();c.stroke();};
      box(60,49,110,70,node===0,palette.blue);box(60,164,110,70,node===1,palette.green);
      c.strokeStyle=palette.blue;c.lineWidth=3;c.beginPath();c.moveTo(82,101);c.lineTo(110,68);c.lineTo(150,101);c.closePath();c.stroke();
      c.strokeStyle=palette.green;[185,199,213].forEach((y,i)=>{c.beginPath();c.moveTo(83,y);c.lineTo(i===2?131:149,y);c.stroke();});
      box(269,49,207,70,node===0||node===2,palette.blue);box(269,164,207,70,node===1||node===2,palette.green);
      drawLabel(c,'图像编码',318,90,palette.blue);drawLabel(c,'文本编码',318,205,palette.green);
      for(let i=0;i<3;i++){c.fillStyle=palette.border;c.fillRect(286+i*7,62,3,41);c.fillRect(286+i*7,177,3,41);}
      drawArrow(c,177,84,259,84,node===0?palette.blue:palette.border);drawArrow(c,177,199,259,199,node===1?palette.green:palette.border);
      if(node===2){[62,177].forEach(y=>{c.fillStyle=palette.orange;c.fillRect(412,y,18,12);c.fillRect(435,y,18,12);});}
      drawArrow(c,486,84,638,131,node===0||node===3?palette.blue:palette.border);drawArrow(c,486,199,638,151,node===1||node===3?palette.green:palette.border);
      box(652,101,107,80,node===3,palette.orange);c.strokeStyle=palette.orange;c.lineWidth=3;c.beginPath();c.moveTo(674,161);c.lineTo(674,143);c.moveTo(700,161);c.lineTo(700,119);c.moveTo(726,161);c.lineTo(726,133);c.stroke();
      drawArrow(c,768,141,876,141,palette.blue);box(890,88,126,109,true,plus?palette.purple:palette.blue);
      scores.forEach((v,i)=>{c.fillStyle=i===(plus?1:0)?palette.orange:palette.light;c.fillRect(912+i*43,177-v*26,25,v*26);});
      if(plus){box(573,211,102,39,true,palette.purple);c.fillStyle=palette.purple;[597,624,651].forEach(x=>{c.beginPath();c.arc(x,230,6,0,Math.PI*2);c.fill();});drawArrow(c,683,230,901,191,palette.purple,2);}
    }}/>
    <div className="feedback good" role="status"><strong>{nodes[node]}：</strong>{descriptions[node]}</div>
    <div className="metrics"><div className="metric"><div className="l">共同图文空间</div><div className="v">512 维</div></div><div className="metric"><div className="l">基础版训练参数</div><div className="v">983,040</div></div><div className="metric"><div className="l">教学评分预测</div><div className="v">类别{plus?'乙':'甲'}</div></div></div>
    <p>两类教学评分：文本为 [2, 1]，原型为 [0, 4]。{plus?'增强版取平均得到 [1, 2.5]，选择类别乙。':'基础版使用文本评分 [2, 1]，选择类别甲。'}这些数值用于演示评分融合。</p>
    <details><summary>类别原型怎样得到？</summary><p>KeepLoRA+ 以每个类别的视觉特征均值初始化原型，再联合训练。推理时保留原型，并将原型评分与文本评分平均。分类候选使用当前任务的类别词表。来源：§3.1、附录 B.3、原版实现配置。</p></details>
  </div>;
}
