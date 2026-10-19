import {useState} from 'react';
import {Scene,Choices,Feedback,KV,C,clearScene,round,arrow,label,drawPhoto} from './llava-kit';
const names=['用户图文','多模态规划器','技能库','工具回传','最终回答'];
const records=[
 {input:'原图 I_q 与用户指令 X_q',output:'保留图像的多模态请求',keys:'I_q、X_q',feedback:'图像与文字共同构成请求，而不是只留下图片描述。'},
 {input:'I_q、X_q 与对话历史',output:'助手技能请求 X_skill_use',keys:'thoughts、actions、API_name、API_params',feedback:'多模态模型选择工具并填写参数，不替工具完成所有计算。'},
 {input:'图像与匹配工具的调用参数',output:'专用模型执行后返回检测、分割等结果',keys:'grounding_dino+sam；caption: little girl and cart .',feedback:'技能库装载预训练专长模型；不同工具有不同输入输出。'},
 {input:'工具执行得到的结构化结果',output:'技能结果 X_skill_result 回到多模态规划器',keys:'boxes: [0.35,0.37,0.66,0.97]、[0.0,0.57,0.69,1.0]；logits: 0.58、0.41',feedback:'结构化工具结果返回后，助手还要结合原图与历史。'},
 {input:'原图、用户问题、调用历史与工具结果',output:'面向用户的最终回答 X_answer',keys:'value；actions: [] 表示没有后续调用',feedback:'最终回答面向用户，内部技能对话可在服务时隐藏。'}
];
const nodes=[[110,90],[405,90],[790,90],[790,235],[405,235]];
export function SystemArchitectureLab(){
 const [node,setNode]=useState(0),r=records[node];
 return <div>
 <Scene height={320} label="选择结构角色追踪图像、调用和回传" onPoint={(x,y)=>{const found=nodes.findIndex(([nx,ny])=>Math.abs(x-nx)<95&&Math.abs(y-ny)<48);if(found>=0)setNode(found);}} draw={(ctx,w,h)=>{
  clearScene(ctx,w,h);
  const edges:[number,number][]=[[0,1],[1,2],[2,3],[3,1],[1,4]];
  edges.forEach(([a,b])=>{const [ax,ay]=nodes[a],[bx,by]=nodes[b];const active=a===node||b===node;const dx=Math.sign(bx-ax),dy=Math.sign(by-ay);arrow(ctx,ax+dx*94,ay+dy*46,bx-dx*94,by-dy*46,active?C.blue:C.border,active?4:2);});
  ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(110,40);ctx.lineTo(405,40);ctx.lineTo(405,46);ctx.stroke();ctx.beginPath();ctx.moveTo(110,140);ctx.lineTo(110,235);ctx.lineTo(305,235);ctx.stroke();ctx.setLineDash([]);arrow(ctx,305,235,310,235,C.green,3);
  nodes.forEach(([x,y],i)=>{round(ctx,x-92,y-44,184,88,i===node?'#e4ecf7':'#fff',i===node?C.blue:C.border,12);if(i===node){ctx.strokeStyle=C.blue;ctx.lineWidth=3;ctx.strokeRect(x-87,y-39,174,78);}});
  drawPhoto(ctx,'girl-input',33,56,72,58);ctx.strokeStyle=C.muted;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(120,70+i*15);ctx.lineTo(180,70+i*15);ctx.stroke();}
  label(ctx,'LMM',405,97,26,C.blue,'center');label(ctx,'工具库',790,97,24,C.text,'center');
  round(ctx,730,210,45,46,'#e6f0e3',C.green,4);round(ctx,780,217,55,30,'#fff',C.green,4);ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.strokeRect(738,218,25,30);
  drawPhoto(ctx,'girl-output',335,207,68,56);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(416,218+i*15);ctx.lineTo(470,218+i*15);ctx.stroke();}
 }}/>
 <Choices items={names} value={node} onChange={setNode} label="选择系统角色"/>
 <KV items={[{label:'当前角色',value:names[node]},{label:'当前路径',value:['原图与指令 → 规划器','规划器 → 技能库','技能库 → 工具回传','工具回传 → 规划器','规划器 → 最终回答'][node]},{label:'输入',value:r.input},{label:'输出',value:r.output},{label:'原文中的字段与示例',value:r.keys}]}/>
 <details style={{margin:'18px 0'}}><summary>查看服务组成与报告配置</summary><p>FastChat由网页服务器、控制器与模型工作进程组成。论文报告7B模型与工具可在一张80G显卡上服务；这是报告配置，不能据此推定通用硬件最低要求。</p></details>
 <Feedback tone="blue">{r.feedback} 绿色虚线保留原图通往回答的路径。来源：第4–5页图2、公式2和表1；第9页第2.4节。</Feedback>
 </div>;
}
