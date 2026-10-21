import {useState} from 'react';
import {Scene,Choices,Feedback,KV,C,clearScene,round,arrow,label,drawHand,drawTool,drawPhoto} from './llava-kit';
export function CapabilityLab(){
 const [useTools,setUseTools]=useState(false);
 return <div><Scene label="同一张照片的文字回答与分割输出教学对照" draw={(ctx,w,h,t)=>{
  clearScene(ctx,w,h); drawPhoto(ctx,'girl-input',40,35,300,225); label(ctx,'输入照片',40,25);
  arrow(ctx,370,150,560,150,useTools?C.green:C.blue);
  drawTool(ctx,useTools?'pen':'card',445,205,1,true); drawHand(ctx,420+Math.sin(t*2)*8,205,-.4);
  if(useTools){drawPhoto(ctx,'girl-output',640,35,300,225); ctx.strokeStyle=C.green;ctx.lineWidth=3;[[.35,.37,.66,.97],[0,.57,.69,1]].forEach(b=>ctx.strokeRect(640+b[0]*300,35+b[1]*225,(b[2]-b[0])*300,(b[3]-b[1])*225));label(ctx,'分割回传',640,25);}
  else{round(ctx,620,45,360,205,'#ffffff',C.red);ctx.strokeStyle=C.blue;ctx.lineWidth=5;[95,123,151].forEach((y,i)=>{ctx.beginPath();ctx.moveTo(660,y);ctx.lineTo(940-i*32,y);ctx.stroke();});label(ctx,'仅有文字',640,25);}
 }}/><Choices label="选择回答方式" items={['只做文字回答','使用分割工具']} value={useTools?1:0} onChange={i=>setUseTools(i===1)}/><KV items={[{label:'动作',value:useTools?'grounding_dino+sam（caption: little girl and cart .）':'actions: []'},{label:'输出',value:useTools?'论文预设的女孩与推车区域；框 logits 为0.58 / 0.41':'文字描述；像素分割结果尚不可用'}]}/><Feedback tone={useTools?'green':'red'}>{useTools?'工具回传女孩与推车的区域，助手再组织回答；这是论文表1的预设重放。':'文字能够描述对象，但这里还没有分割输出；这是能力边界的教学对照。'} 来源：p5 表1；p4–5 §2.2。</Feedback></div>;
}
