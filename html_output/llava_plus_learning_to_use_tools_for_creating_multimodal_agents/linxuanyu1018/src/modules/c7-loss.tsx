import {useState} from 'react';
import {Scene,Choices,Feedback,KV,C,clearScene,round,label,drawHand} from './llava-kit';
export function LossMaskLab(){
 const [assistantOnly,setAssistantOnly]=useState(true),[probability,setProbability]=useState(.8);
 const count=assistantOnly?6:10;
 const loss=assistantOnly?-Math.log(probability):-(6*Math.log(probability)+4*Math.log(.2))/10;
 const assistants=[false,false,true,true,true,false,false,true,true,true];
 return <div>
  <Scene label="监督范围与教学交叉熵" draw={(ctx,w,h,time)=>{
   clearScene(ctx,w,h); round(ctx,45,50,310,190,'#fff',C.border);
   for(let i=0;i<5;i++){const active=i===1||i===3; const color=active?C.green:assistantOnly?C.border:C.red;ctx.strokeStyle=color;ctx.lineWidth=active?5:3;ctx.beginPath();ctx.moveTo(80,80+i*30);ctx.lineTo(310,80+i*30);ctx.stroke();}
   drawHand(ctx,165+Math.sin(time*2)*45,143,0,assistantOnly?C.green:C.red);
   assistants.forEach((a,i)=>{const selected=a||!assistantOnly;round(ctx,400+i*61,105,48,64,selected?(a?C.green:C.red):'#e5e9e1',selected?(a?C.green:C.red):C.border,6);});
   label(ctx,'助手',425,220,21,C.green);label(ctx,'上下文',655,220,21,assistantOnly?C.muted:C.red);
  }}/>
  <Choices items={['只监督助手输出','错误示意：监督全部']} value={assistantOnly?0:1} onChange={i=>setAssistantOnly(i===0)} label="选择监督范围"/>
  <label style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',margin:'16px 0'}}>教学正确词概率 {probability.toFixed(2)}<input aria-label="教学正确词概率" type="range" min="0.05" max="0.95" step="0.05" value={probability} onChange={e=>setProbability(Math.max(.05,Math.min(.95,Number(e.target.value))))}/></label>
  <KV items={[{label:'参与监督的词',value:`${count} / 10（助手 6 个，含停止词）`},{label:'教学平均损失',value:loss.toFixed(4)},{label:'教学计算',value:assistantOnly?'−ln(p)':'−(6 ln(p) + 4 ln(0.2)) / 10'}]}/>
  <Feedback tone={assistantOnly?'green':'red'}>{assistantOnly?'只监督助手技能请求与最终回答，用户输入和工具回传只作为上下文。':'把上下文也当生成目标改变了训练任务；红色范围是错误监督的教学对照。'} 概率与损失均为教学值，不能代表总体能力或训练曲线。来源：第5页公式2；第8–9页第2.4节。</Feedback>
 </div>;
}
