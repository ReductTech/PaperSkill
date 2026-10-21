import {useState} from 'react';
import {Scene,Choices,Feedback,KV,C,clearScene,round,arrow,label,drawHand,drawPhoto} from './llava-kit';

const stages = ['原始照片','语义布局','条件生成'];
const pictures = ['bike-input','bike-mask','bike-underwater'];
const comments = [
  '只有原图，还没有提供可约束生成的语义布局。',
  'OpenSeeD给出语义区域，布局成为后续条件的一部分。',
  'ControlNet结合布局与“under sea”条件生成场景；这是图3展示的单例。',
];

export function CompositionLab() {
  const [stage,setStage]=useState(0);
  return <div>
    <Scene label="自行车原图与当前组合阶段的图3图像对比" draw={(ctx,w,h,time)=>{
      clearScene(ctx,w,h);
      round(ctx,48,38,365,235,'#ffffff',C.border);
      round(ctx,595,38,365,235,'#ffffff',stage===0?C.blue:C.green);
      drawPhoto(ctx,'bike-input',58,48,345,215);
      drawPhoto(ctx,pictures[stage],605,48,345,215);
      label(ctx,'原图',60,27,20,C.muted);
      label(ctx,'当前阶段',605,27,20,stage===0?C.blue:C.green);
      arrow(ctx,447,155,560,155,stage===0?C.blue:C.green);
      const cycle=(Math.sin(time*2*Math.PI/3)+1)/2;
      const x=stage===1?720+cycle*75:935;
      const y=stage===1?180-cycle*45:238;
      drawHand(ctx,x,y,-0.35,stage===0?C.blue:C.green);
    }}/>
    <Choices label="重放论文图3的组合阶段" items={stages} value={stage} onChange={setStage}/>
    <KV items={[
      {label:'当前记录',value:`${stage+1} / 3 · ${stages[stage]}（论文图像重放）`},
      {label:'当前输入',value:stage===2?'语义布局 + 场景条件 under sea':'自行车原始照片'},
      {label:'当前技能',value:stage===0?'尚未使用工具':stage===1?'OpenSeeD：语义分割':'ControlNet：受布局约束的生成'},
      {label:'语义布局',value:stage===0?'待提取':stage===1?'已提取，作为后续生成条件':'已传入生成阶段'},
      {label:'条件生成图',value:stage===2?'展示图3海底场景示例；本页没有运行模型':'待进入条件生成阶段'},
    ]}/>
    <Feedback tone={stage===0?'blue':'green'}>{comments[stage]} 依据：第13页图3、第14页§4.3；未测量成功率或耗时。</Feedback>
  </div>;
}
