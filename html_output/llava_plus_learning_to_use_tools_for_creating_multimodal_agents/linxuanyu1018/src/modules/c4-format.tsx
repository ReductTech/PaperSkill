import {useState} from 'react';
import {Scene,Choices,Feedback,KV,C,clearScene,round,arrow,label,drawTool} from './llava-kit';

type Check='idle'|'wrong-tool'|'missing-caption'|'ready';
export function UnifiedFormatLab(){
 const [needsTool,setNeedsTool]=useState(false),[tool,setTool]=useState(0),[caption,setCaption]=useState(''),[check,setCheck]=useState<Check>('idle');
 const ready=needsTool&&check==='ready';
 const error=check==='wrong-tool'||check==='missing-caption';
 const active=!needsTool?C.blue:ready?C.green:error?C.red:C.orange;
 const output=!needsTool?{thoughts:'直接用文字描述照片，无需调用工具。',actions:[],value:'照片中有一个小女孩和一辆推车。'}:tool===0?{thoughts:'需要分割女孩和推车，选择对应工具并填写目标描述。',actions:[{API_name:'grounding_dino+sam',API_params:{caption:caption.trim()}}],value:'我会调用分割工具处理指定对象。'}:null;
 const messages:Record<Check,string>={idle:'先选能返回像素区域的工具，再填写 caption，检查这份调用草稿。','wrong-tool':'工具能力不匹配：这次要分割对象。OCR返回文字，生成工具返回新图像，都不能替代该分割调用。','missing-caption':'caption 为空：工具还不知道要定位什么。填写目标描述，或载入原文的女孩与推车示例。',ready:'格式检查通过：工具类型匹配，caption 非空。参数有效不保证检测成功；这里没有执行模型，也没有产生新分割结果。'};
 const validate=()=>setCheck(tool!==0?'wrong-tool':caption.trim()===''?'missing-caption':'ready');
 return <div>
 <Scene height={280} label="填写参数并检查统一调用格式，观察直接回答与工具请求分支" draw={(ctx,w,h)=>{
  clearScene(ctx,w,h);round(ctx,35,80,150,120,'white',C.border);
  for(let i=0;i<4;i++)round(ctx,58,103+i*20,95-i*9,4,C.light);
  const route=(y:number,color:string)=>{ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(185,140);ctx.lineTo(230,140);ctx.lineTo(230,y);ctx.lineTo(355,y);ctx.stroke();arrow(ctx,355,y,385,y,color);ctx.beginPath();ctx.moveTo(680,y);ctx.lineTo(800,y);ctx.lineTo(800,140);ctx.lineTo(857,140);ctx.stroke();};
  route(60,needsTool?C.border:C.blue);route(220,needsTool?active:C.border);
  round(ctx,385,25,295,230,'white',active);
  for(let i=0;i<3;i++){const y=44+i*65;round(ctx,403,y,259,49,i===1?'#eef3f8':C.bg,i===1?active:C.border);if(i===0){round(ctx,420,y+14,155,4,C.light);round(ctx,420,y+26,120,4,C.light);}if(i===1){label(ctx,'actions',420,y+31,20,active);ctx.strokeStyle=active;ctx.lineWidth=3;ctx.strokeRect(555,y+13,15,24);ctx.strokeRect(627,y+13,15,24);if(needsTool)round(ctx,580,y+12,36,26,active);}if(i===2){label(ctx,'value',420,y+31,20);round(ctx,505,y+17,135,5,C.light);round(ctx,505,y+29,100,5,C.light);}}
  round(ctx,857,80,180,120,'white',active);
  if(needsTool){drawTool(ctx,['pen','card','brush'][tool],922,134,1.1);if(ready){ctx.strokeStyle=C.green;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(964,151);ctx.lineTo(976,164);ctx.lineTo(1008,124);ctx.stroke();}else if(error){ctx.strokeStyle=C.red;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(975,121);ctx.lineTo(1000,151);ctx.moveTo(1000,121);ctx.lineTo(975,151);ctx.stroke();}}
  else for(let i=0;i<4;i++)round(ctx,879,103+i*20,128-i*13,5,C.blue);
 }}/>
 <Choices label="选择回答是否需要工具" items={['普通描述','需要分割']} value={Number(needsTool)} onChange={i=>{setNeedsTool(i===1);setCheck('idle');}}/>
 {needsTool&&<section aria-label="组装分割调用" style={{margin:'20px 0',padding:'18px 0',borderTop:'1px solid '+C.border,borderBottom:'1px solid '+C.border}}>
  <p style={{margin:'0 0 8px',fontSize:18,fontWeight:650}}>任务：分割照片中的小女孩和推车</p>
  <Choices label="为分割任务选择工具" items={['分割 · Grounding DINO + SAM','文字识别 · EasyOCR','图像生成 · Stable Diffusion']} value={tool} onChange={i=>{setTool(i);setCheck('idle');}}/>
  <label htmlFor="ll-caption" style={{display:'block',fontSize:17,marginBottom:8}}>caption：要定位的对象描述</label>
  <input id="ll-caption" aria-describedby="ll-caption-help" value={caption} maxLength={120} onChange={e=>{setCaption(e.target.value);setCheck('idle');}} placeholder="例如 little girl and cart ." style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',font:'inherit',fontSize:18,border:'1px solid '+C.border,borderRadius:8,color:C.text,background:'white'}}/>
  <p id="ll-caption-help" style={{fontSize:16,color:C.muted,margin:'8px 0'}}>此处只检查工具类型与非空参数，不判断描述是否与图像匹配。</p>
  <div className="ll-controls"><button type="button" className="ll-chip" onClick={validate}>检查调用</button><button type="button" className="ll-chip" onClick={()=>{setTool(0);setCaption('little girl and cart .');setCheck('idle');}}>载入原文参数</button><button type="button" className="ll-chip" onClick={()=>{setCaption('');setCheck('idle');}}>清空参数</button></div>
 </section>}
 <Feedback tone={!needsTool?'blue':error?'red':ready?'green':'orange'}>{needsTool?messages[check]:'actions=[]：这一步没有调用工具，value承担面向用户的文字。'} 依据：第5页表1、第6页统一格式说明。检查规则是教学构造。</Feedback>
 <KV items={[{label:'执行分支',value:!needsTool?'空 actions → 直接呈现 value':ready?'调用格式通过 → 可交给执行器 → 等待真实回传':'调用草稿待检查 → 尚未交给执行器'},{label:'当前结果',value:!needsTool?'文字回答':ready?'已形成工具请求；尚无工具执行结果':error?'检查未通过，按反馈修正':'待选择工具、填写参数并检查'}]}/>
 <div style={{fontSize:17,fontWeight:650,margin:'14px 0 8px'}}>{needsTool?'调用草稿（教学转述）':'统一回答格式（教学转述）'}</div>
 <pre className="ll-code" aria-label="当前统一结构">{output?JSON.stringify(output,null,2):'当前能力不匹配，尚未形成这次分割任务的工具调用。'}</pre>
 </div>;
}
