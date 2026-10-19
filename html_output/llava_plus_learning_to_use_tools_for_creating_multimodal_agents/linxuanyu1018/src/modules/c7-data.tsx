import {useState} from 'react';
import {Scene,Choices,Feedback,KV,C,clearScene,round,label,drawHand,drawTool} from './llava-kit';
const rows:[string,string,string,number][]=[['检测/定位','Grounding DINO','COCO',13783],['语义分割','OpenSeeD','COCO',5989],['实例分割','Grounding DINO+SAM','COCO',5228],['描述+定位','BLIP2+Grounding DINO','COCO',4037],['标签+定位','RAM+Grounding DINO','COCO',4439],['图像描述','BLIP2','COCO',4064],['标签','RAM','COCO',6045],['OCR文字识别','EasyOCR','HierText',6528],['外部知识检索','CLIP Retrieval','InfoSeek',4087],['图像生成','Stable Diffusion','JourneyDB',4694],['图像编辑','Instruct P2P','Instruct P2P',6981],['交互分割','SAM','COCO',5601],['多粒度分割','Semantic SAM','COCO',5601],['示例分割','SEEM','COCO',5601],['理解技能组合','G-DINO/SAM/BLIP2/RAM','COCO',37431],['交互分割+补绘','SAM+Stable Diffusion','COCO',3063],['语义分割+生成','OpenSeeD+ControlNet','COCO',5989],['生成+社交文案','Stable Diffusion','JourneyDB',4694],['编辑+社交文案','Instruct P2P','Instruct P2P',5924]];
export function DataRecipeLab(){
 const [recipe,setRecipe]=useState(0);
 return <div>
  <Scene height={240} label="定量与演示数据配方" draw={(ctx,w,h,time)=>{clearScene(ctx,w,h);for(let i=2;i>=0;i--){round(ctx,100+i*7,50-i*7,260,145,'#fff',C.border);round(ctx,560+i*7,50-i*7,350,145,recipe===0?'#e6f0e3':'#e9eef7',recipe===0?C.green:C.blue);}label(ctx,'158K',180,130,34,C.text);if(recipe===0)label(ctx,'81K',680,130,34,C.green);else{['lens','brush','card','pen','scissors'].forEach((kind,i)=>drawTool(ctx,kind as 'lens'|'brush'|'card'|'pen'|'scissors',610+i*58,113,.65,true));}drawHand(ctx,700+Math.sin(time*2)*25,184,0,C.blue);}}/>
  <Choices items={['定量报告','完整演示']} value={recipe} onChange={setRecipe} label="选择数据配方"/>
  <KV items={[{label:'共同基础',value:'LLaVA-158K，转换为统一格式'},{label:'工具数据',value:recipe===0?'81K 理解指令':'完整工具数据；不推算独立图像总数'},{label:'启用范围',value:recipe===0?'理解任务':'理解、生成、检索、交互与组合'}]}/>
  <details style={{margin:'18px 0'}}><summary>展开原表2的19行样本计数</summary><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><thead><tr>{['技能','工具','数据来源','样本数'].map(x=><th key={x} style={{padding:'10px 12px'}}>{x}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row[0]}>{row.map((x,i)=><td key={i} style={{padding:'9px 12px',borderTop:`1px solid ${C.border}`}}>{typeof x==='number'?x.toLocaleString('en-US'):x}</td>)}</tr>)}</tbody></table></div></details>
  <Feedback tone={recipe===0?'green':'blue'}>{recipe===0?'定量模型使用81K理解指令；还混合转换为统一格式的LLaVA-158K。':'演示系统使用完整工具数据；原文没有在此给出统一的独立图像总量。'} 表2包含组合技能，行计数之和不能当作独立图像数或单工具覆盖率。来源：第7页表2；第8–9页第2.4节。</Feedback>
 </div>;
}
