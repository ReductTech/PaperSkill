import { useState } from 'react';
import { C, Scene, bird, branch, parkBackdrop, frame, line, number, Button, Feedback } from './gd-kit';

const STEPS=['输入查询','自注意力','图像跨注意力','文本跨注意力','FFN / 本层输出'];
const NOTES=[
  '编码器提供候选位置，用于初始化位置部分；查询的内容部分仍是可学习参数。现在还只是一次定位的起点。',
  '查询之间通过自注意力交换信息。图中的弧线只强调相互参照，不代表查询被逐一串行处理。',
  '图像跨注意力让查询访问视觉证据，更新“图像中有什么、在哪里”的表示。',
  '文本跨注意力让查询持续读取描述条件。这是相对 DINO 解码层增加的环节，语言并非只在初始化时使用一次。',
  'FFN 更新查询表示，层输出用于框回归和 token 对齐预测。论文默认堆叠 6 个跨模态解码层；本页拆解的是其中一层。'
];
const FEATURES=[[.32,.30,.26],[.45,.43,.34],[.73,.50,.42],[.79,.83,.57],[.86,.88,.76]];

function parkCrop(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){
  ctx.save();parkBackdrop(ctx,x,y,w,h);
  branch(ctx,x+w*.08,y+h*.59,x+w*.85,y+h*.52,7);
  branch(ctx,x+w*.67,y+h*.53,x+w*.86,y+h*.43,3.5);
  // Dedicated crop aligns the photographed subject with the specified final box.
  bird(ctx,x+w*.44,y+h*.435,25,C.red); bird(ctx,x+w*.79,y+h*.37,17,C.blue);
  ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);ctx.restore();
}

export function DecoderStep(){
  const [step,setStep]=useState(0);
  const draw=(ctx:CanvasRenderingContext2D)=>{
    ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);
    const x=28,y=21,w=650,h=238;
    parkCrop(ctx,x,y,w,h);
    const p=step/4,box=[.18+.14*p,.12+.10*p,.50-.26*p,.65-.22*p];
    frame(ctx,x+w*box[0],y+h*box[1],w*box[2],h*box[3],step===4?C.green:C.orange);
    if(step===2){
      ctx.save();ctx.setLineDash([6,5]);line(ctx,x+w*.44,y+h*.435,748,125,C.blue,2);ctx.restore();
      frame(ctx,x+w*.35,y+h*.27,w*.18,h*.33,C.blue,true);
    }
    line(ctx,711,22,711,256,C.border,1);
    ctx.font='600 15px system-ui';ctx.fillStyle=C.muted;ctx.textAlign='center';ctx.fillText('查询表示',877,35);
    if(step===1){
      ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(880,61,87,14,0,0,Math.PI*2);ctx.stroke();
      [806,954].forEach(xx=>{ctx.fillStyle=C.light;ctx.fillRect(xx-8,54,16,16);});
    }
    FEATURES[step].forEach((v,i)=>{
      const yy=97+i*49;number(ctx,String(i+1),755,yy,C.muted);
      ctx.fillStyle='#e1e6dc';ctx.fillRect(780,yy-11,235,22);
      ctx.fillStyle=step===3?C.blue:step===4?C.green:C.orange;ctx.fillRect(780,yy-11,235*v,22);
    });
    ctx.fillStyle=step===3?'#dce7f3':'#e6ebe0';ctx.fillRect(773,226,251,24);
    if(step===3){ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.strokeRect(773,226,251,24);}
  };
  return <div>
    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:15}}>
      <Button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}>上一步</Button>
      <Button onClick={()=>setStep(s=>Math.min(4,s+1))} disabled={step===4}>下一步</Button>
      <Button onClick={()=>setStep(0)} disabled={step===0}>重置</Button>
      <span aria-live="polite" style={{color:C.text,fontWeight:700,marginLeft:8}}>{step+1} / 5 · {STEPS[step]}</span>
    </div>
    <ol style={{display:'flex',padding:0,listStyle:'none',gap:8,flexWrap:'wrap',margin:'0 0 14px'}}>
      {STEPS.map((name,i)=><li key={name} aria-current={i===step?'step':undefined} style={{padding:'6px 10px',borderRadius:8,fontSize:13,color:i===step?C.blue:C.muted,background:i===step?'#e0eaf4':'#f3f5ef',fontWeight:i===step?700:400}}>{i+1}. {name}</li>)}
    </ol>
    <Scene label={`单个解码层的第${step+1}步：${STEPS[step]}。框与三条特征刻度均为教学示意。`} draw={draw} />
    <div style={{margin:'12px 0',fontSize:14,color:C.muted,display:'flex',gap:22,flexWrap:'wrap'}}>
      <span style={{color:step===3?C.blue:C.muted,fontWeight:step===3?700:400}}>描述条件：红色的鸟</span>
      <span>右侧三条刻度仅示意查询表示变化</span><span>本层顺序固定；默认共 6 层</span>
    </div>
    <Feedback tone={step===4?'good':'info'}>{NOTES[step]}</Feedback>
    <p style={{margin:'12px 0 0',color:C.muted,fontSize:13}}>框逐渐收拢是手工教学动画，不是逐层实测坐标，也不表示每个注意力算子都单独输出一个框。真实预测还可能出现误检或定位偏差。</p>
  </div>;
}
