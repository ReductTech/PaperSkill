import { useState } from 'react';
import { C, SceneCanvas, Chips, Feedback, clearScene, drawLeaf, drawSceneLabel } from './kit-anchor';

const facts = [
  '训练 4040 张 = CAMO 1000 + COD10K 3040；COD10K-Test 2026 张独立评估。',
  '错误示例：6066 = 4040 + 2026 张，包含 COD10K 测试样本。',
  '假设主尺度 576×576，对应三输入 288 / 576 / 864。',
  '假设优化器 Adam；论文为 SGD（动量 0.9）。',
];
const feedback = [
  '条件对齐：主尺度 384×384，SGD、初始学习率 0.05。数据划分和预处理仍需在实现中核对。',
  '测试泄漏：训练中见过评估图像，结果不能作为独立测试成绩。应让 2026 张测试图像只用于评估。',
  '这是另一个分辨率实验，不能直接当作论文的 384 主尺度复现；并不保证指标更高。',
  '更换优化器可以做额外实验，但应单独报告，不能把与原设置的差异全部归因于框架。',
];

export function Zoom9() {
  const [scenario,setScenario]=useState(0);
  const tone=scenario===0?'good':scenario===1?'bad':'neutral';
  return <div>
    <SceneCanvas aria-label={`复现实验条件示意。${facts[scenario]}`} draw={ctx=>{
      clearScene(ctx,1080,280);
      const mainColor=scenario===1?C.red:scenario===2?C.orange:scenario===3?C.purple:C.green;
      ctx.lineWidth=2;
      [[80,60,540,170],[720,60,280,170]].forEach(([x,y,w,h],i)=>{
        ctx.fillStyle='#ffffff';ctx.strokeStyle=i===0?mainColor:C.blue;
        ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.fill();ctx.stroke();
      });
      for(let i=0;i<5;i++){
        ctx.fillStyle=i===4?C.bg:'#ffffff';ctx.strokeStyle=mainColor;
        ctx.beginPath();ctx.roundRect(130+i*13,91+i*10,95,95,6);ctx.fill();ctx.stroke();
      }
      drawLeaf(ctx,226,176,.35);
      for(let i=0;i<3;i++){
        ctx.fillStyle='#ffffff';ctx.strokeStyle=C.blue;
        ctx.beginPath();ctx.roundRect(785+i*13,83+i*14,120,115,6);ctx.fill();ctx.stroke();
      }
      drawLeaf(ctx,870,170,.4);
      if(scenario===1){
        ctx.strokeStyle=C.red;ctx.lineWidth=4;ctx.setLineDash([8,7]);
        ctx.beginPath();ctx.moveTo(790,140);ctx.lineTo(485,140);ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.moveTo(495,128);ctx.lineTo(483,140);ctx.lineTo(495,152);ctx.stroke();
        ctx.beginPath();ctx.moveTo(638,108);ctx.lineTo(680,172);ctx.moveTo(680,108);ctx.lineTo(638,172);ctx.stroke();
      }else if(scenario===3){
        ctx.strokeStyle=C.purple;ctx.lineWidth=3;
        ctx.beginPath();ctx.moveTo(365,192);ctx.lineTo(365,95);ctx.moveTo(365,192);ctx.lineTo(565,192);ctx.stroke();
        ctx.beginPath();ctx.moveTo(375,108);ctx.bezierCurveTo(420,110,419,170,455,153);ctx.bezierCurveTo(498,135,510,185,555,180);ctx.stroke();
      }else{
        const n=scenario===2?6:4,cell=100/n;
        ctx.strokeStyle=mainColor;ctx.lineWidth=1.5;
        for(let i=0;i<=n;i++){
          ctx.beginPath();ctx.moveTo(399+i*cell,93);ctx.lineTo(399+i*cell,193);
          ctx.moveTo(399,93+i*cell);ctx.lineTo(499,93+i*cell);ctx.stroke();
        }
      }
      drawSceneLabel(ctx,'训练',350,40,mainColor);drawSceneLabel(ctx,'测试',860,40,C.blue);
    }}/>
    <Chips options={['论文设置','混入测试集','主尺度改为576','改用Adam']} value={scenario} onChange={setScenario}/>
    <div style={{padding:'12px 0',fontWeight:700,color:C.text}} aria-live="polite">{facts[scenario]}</div>
    <Feedback tone={tone}>{feedback[scenario]} <span style={{fontSize:12}}>（假设情境；原设置见§4.1）</span></Feedback>
  </div>;
}
