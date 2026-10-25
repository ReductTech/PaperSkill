import { useState } from 'react';
import { C, SceneCanvas, Chips, Feedback, clearScene, drawLeaf, drawSceneLabel } from './kit-anchor';

const nodes = ['输入', '共享编码器', 'SIU', 'HMU', '预测头'];
const boxes = [[40,55,165,170],[250,55,165,170],[460,55,165,170],[670,55,165,170],[880,55,165,170]];
const facts = [
  '全图缩放：192×192、384×384、576×576；主尺度为 384×384。',
  '三分支共享 E-Net 与 C-Net 的参数；每个尺度产生五级特征，C-Net 将各级统一为 64 通道。',
  '五个层级分别对齐三尺度分辨率；逐像素权重在三个尺度之间归一化。',
  '五级自顶向下解码；每级进行分组交互与通道调制，论文默认 g=6。',
  '预测头输出单通道 logits，经 sigmoid 得到逐像素前景概率。',
];
const shapes = ['3 个输入 / 1 套编码器参数', '5 级 × 64 通道', '每位置三权重和 = 1', '5 级 / 默认 6 组', '单通道概率图'];

export function Zoom8() {
  const [selected, setSelected] = useState(0);
  return <div>
    <SceneCanvas aria-label={`ZoomNet结构示意，已选择${nodes[selected]}。使用下面按钮可访问全部节点。`}
      style={{cursor:'pointer'}}
      onPointerDown={event => {
        const r = event.currentTarget.getBoundingClientRect();
        const x=(event.clientX-r.left)*1080/r.width, y=(event.clientY-r.top)*280/r.height;
        const idx=boxes.findIndex(([bx,by,bw,bh])=>x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh);
        if(idx>=0) setSelected(idx);
      }}
      draw={ctx => {
        clearScene(ctx,1080,280);
        ctx.lineWidth=2;
        boxes.forEach(([x,y,w,h],i)=>{
          if(i<4){
            ctx.strokeStyle=i>=selected?C.blue:C.border;
            ctx.beginPath();ctx.moveTo(x+w,140);ctx.lineTo(x+w+45,140);ctx.stroke();
            ctx.beginPath();ctx.moveTo(x+w+37,134);ctx.lineTo(x+w+45,140);ctx.lineTo(x+w+37,146);ctx.stroke();
          }
          ctx.fillStyle=i===selected?'#fff8ee':'#ffffff';
          ctx.strokeStyle=i===selected?C.orange:C.border;
          ctx.lineWidth=i===selected?3:2;
          ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.fill();ctx.stroke();
        });
        [90,140,190].forEach((y,i)=>drawLeaf(ctx,120,y,.3+i*.1));
        ctx.strokeStyle=C.blue;ctx.lineWidth=2;
        [100,140,180].forEach(y=>{ctx.beginPath();ctx.moveTo(280,y);ctx.lineTo(315,y);ctx.lineTo(335,140);ctx.lineTo(375,y);ctx.stroke();});
        ctx.fillStyle=C.light;ctx.beginPath();ctx.arc(335,140,16,0,Math.PI*2);ctx.fill();ctx.stroke();
        [100,140,180].forEach(y=>{ctx.strokeStyle=C.dark;ctx.beginPath();ctx.moveTo(485,y);ctx.lineTo(555,140);ctx.lineTo(595,140);ctx.stroke();});
        ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(555,140,13,0,Math.PI*2);ctx.fill();
        for(let j=0;j<5;j++){
          ctx.fillStyle=j%2===0?C.light:C.bg;ctx.strokeStyle=C.dark;
          ctx.beginPath();ctx.roundRect(699+j*5,78+j*23,100-j*10,19,4);ctx.fill();ctx.stroke();
        }
        ctx.fillStyle=C.text;ctx.beginPath();ctx.ellipse(960,140,38,63,.6,0,Math.PI*2);ctx.fill();
        drawSceneLabel(ctx,'三尺度',120,250,C.muted);drawSceneLabel(ctx,'像素概率',960,250,C.muted);
      }}/>
    <Chips options={nodes} value={selected} onChange={setSelected}/>
    <div style={{padding:'12px 0',color:C.text,fontWeight:700}} aria-live="polite">{nodes[selected]} · {shapes[selected]}</div>
    <Feedback tone="neutral">{facts[selected]} <span style={{fontSize:12}}>（图2–4；§3.2–3.4）</span></Feedback>
  </div>;
}
