import { useState } from 'react';
import { C, Scene, photo, bird, frame, Chips, Feedback } from './gd-kit';

function arrow(ctx:CanvasRenderingContext2D,x:number,y:number,angle:number,color:string) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-8,-4);ctx.lineTo(-8,4);ctx.closePath();ctx.fill();ctx.restore();
}
export function Fusion() {
  const [mode,setMode]=useState(0);
  const fused=mode===1;
  const values=fused?[[.8,.2],[.3,.7]]:[[.4,.4],[.4,.4]];
  return <div>
    <Chips items={['各自编码','双向融合']} value={mode} onChange={setMode} label="特征增强方式" />
    <Scene label={`特征增强教学示意：${fused?'双向融合':'各自编码'}，右侧数字为人工分数矩阵`} draw={ctx=>{
      photo(ctx,20,30,430,220);
      frame(ctx,107,89,84,70,C.orange);
      frame(ctx,245,79,84,70,C.orange);
      ctx.save();ctx.fillStyle=C.muted;ctx.font='600 16px sans-serif';ctx.textAlign='center';ctx.fillText('区域',520,34);ctx.fillText('词语',730,34);ctx.restore();
      for(let i=0;i<2;i++)for(let j=0;j<2;j++){
        const y1=90+i*110,y2=90+j*110,v=values[i][j];
        ctx.save();ctx.strokeStyle=fused?(i===j?C.green:C.blue):C.border;ctx.lineWidth=fused?1+v*4:2;
        if(!fused)ctx.setLineDash([4,5]);
        ctx.beginPath();ctx.moveTo(551,y1);ctx.bezierCurveTo(611,y1,639,y2,699,y2);ctx.stroke();ctx.restore();
        if(fused){arrow(ctx,699,y2,0,i===j?C.green:C.blue);arrow(ctx,551,y1,Math.PI,i===j?C.green:C.blue);}
      }
      [C.red,C.blue].forEach((color,i)=>{
        const y=90+i*110;
        ctx.save();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(520,y,31,0,Math.PI*2);ctx.fill();ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.stroke();ctx.restore();
        bird(ctx,520,y,17,color);
        ctx.save();ctx.fillStyle=fused?'#e5edf7':'#f0f2f5';ctx.fillRect(700,y-24,60,48);ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.strokeRect(700,y-24,60,48);ctx.fillStyle=C.blue;ctx.textAlign='center';ctx.font='700 22px sans-serif';ctx.fillText(String(i+1),730,y+8);ctx.restore();
      });
      ctx.save();ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(798,45);ctx.lineTo(798,248);ctx.stroke();
      for(let i=0;i<2;i++)for(let j=0;j<2;j++){
        const v=values[i][j],x=867+j*112,y=90+i*110;
        ctx.fillStyle=fused&&i===j?'#d9eee2':'#e6ecf4';
        ctx.beginPath();ctx.arc(x,y,15+v*26,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=fused&&i===j?C.green:C.blue;ctx.lineWidth=fused&&i===j?3:1;ctx.stroke();
        ctx.fillStyle=C.text;ctx.font='600 22px sans-serif';ctx.textAlign='center';ctx.fillText(v.toFixed(1),x,y+8);
      }ctx.restore();
    }} />
    <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:13,color:C.muted,margin:'6px 0 12px'}}>
      <span>词语 ① red bird　② blue bird</span><span>矩阵行：红鸟区域 / 蓝鸟区域；列：词语① / ②</span>
    </div>
    <Feedback tone="info">{fused?'双向箭头表示图像与文本互相读取信息；线宽和人工矩阵只表达对应关系的变化，不是模型测得的权重或准确率。':'两个编码器各自处理输入。此时本模块尚未交换跨模态信息；四个 0.4 是人为设置的对照值，不代表真实编码器的分数。'}</Feedback>
  </div>;
}
