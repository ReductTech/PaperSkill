import {useEffect,useState} from 'react';
import {Scene,Steps,Feedback,KV,C,clearScene,round,arrow,label,drawHand,drawPhoto} from './llava-kit';

const names=['用户图文请求','助手技能请求','外部工具回传','助手最终回答'];
const feedback=[
  '用户提供照片和请求，工具尚未运行。',
  '助手选择grounding_dino+sam，并填入little girl and cart .参数。',
  '工具回传两个区域；坐标与logits是表1记录，不能当总体准确率。',
  '助手整合结果形成回答，actions=[]表示这一轮不再调用工具。',
];
const toolRequest={
  thoughts:'需要定位并分割小女孩和推车。',
  actions:[{API_name:'grounding_dino+sam',API_params:{caption:'little girl and cart .'}}],
  value:'我会调用分割工具处理女孩和推车。',
};
const toolResult={boxes:[[0.35,0.37,0.66,0.97],[0.0,0.57,0.69,1.0]],logits:[0.58,0.41],phrases:['小女孩','推车']};
const answer={thoughts:'结合照片与回传的区域形成回答。',actions:[],value:'照片中，一个小女孩正在推着推车。'};
const json=(data:unknown)=><pre style={{margin:0,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(data,null,2)}</pre>;

export function DialogueLab(){
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false);
  useEffect(()=>{if(!playing)return;if(step===3){setPlaying(false);return;}const timer=window.setTimeout(()=>setStep(s=>Math.min(3,s+1)),1200);return()=>clearTimeout(timer);},[playing,step]);
  return <div>
    <Scene label={`工具对话第${step+1}步：${names[step]}`} draw={(ctx,w,h,time)=>{
      clearScene(ctx,w,h);
      round(ctx,48,30,335,245,'#ffffff',C.border);
      drawPhoto(ctx,'girl-input',65,42,300,225);
      arrow(ctx,410,150,505,150,step>=2?C.green:C.blue);
      round(ctx,536,30,490,245,'#ffffff',step>=2?C.green:C.blue);
      label(ctx,'原图',65,26,18,C.muted);
      label(ctx,step>=2?'已返回':'待返回',555,26,18,step>=2?C.green:C.blue);
      if(step===0){
        round(ctx,600,75,310,120,C.bg,C.border);
        for(let i=0;i<3;i++)round(ctx,633,103+i*24,230-i*28,5,C.light);
        ctx.strokeStyle=C.border;ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.strokeRect(582,210,365,29);ctx.setLineDash([]);
      }else if(step===1){
        for(let i=0;i<3;i++)round(ctx,577,63+i*57,365,42,i===1?'#edf2fa':C.bg,i===1?C.blue:C.border);
        for(let i=0;i<3;i++)round(ctx,596,80+i*57,i===1?318:235,6,i===1?C.blue:C.light);
        arrow(ctx,940,145,995,145,C.blue);
      }else{
        drawPhoto(ctx,'girl-output',578,42,300,225);
        toolResult.boxes.forEach((box,index)=>{
          const [x1,y1,x2,y2]=box;
          ctx.strokeStyle=index===0?C.blue:C.orange;ctx.lineWidth=3;
          ctx.strokeRect(578+x1*300,42+y1*225,(x2-x1)*300,(y2-y1)*225);
        });
        if(step===3){
          ctx.strokeStyle=C.green;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(920,143);ctx.lineTo(941,164);ctx.lineTo(984,111);ctx.stroke();
        }
      }
      const drift=Math.sin(time*2*Math.PI/3)*7;
      drawHand(ctx,step>=2?886:984,step>=2?240+drift:226+drift,-0.3,step>=2?C.green:C.blue);
    }}/>
    <div className="ll-controls"><button className="ll-chip" type="button" onClick={()=>{if(playing)setPlaying(false);else{if(step===3)setStep(0);setPlaying(true);}}}>{playing?'暂停重放':step===3?'从头自动重放':'自动重放'}</button><span className="ll-step">{playing?'自动前进中；可暂停逐步查看':'每步约1.2秒，仅为教学展示节奏'}</span></div>
    <Steps value={step} max={3} onChange={s=>{setPlaying(false);setStep(s);}} label="逐步重放表1的工具对话"/>
    <KV items={[
      {label:'当前步骤',value:`${step+1} / 4 · ${names[step]}`},
      {label:'本步状态',value:step===0?'等待助手生成工具请求':step===1?'已形成调用，等待工具执行':step===2?'结果已回传，等待助手整合':'已形成最终回答，本轮不再调用工具'},
      {label:'原图与问题',value:'照片持续参与上下文；目标是分割女孩和推车'},
    ]}/>
    <div style={{margin:'20px 0'}}>
      <div style={{fontSize:18,fontWeight:650,marginBottom:10}}>{names[step]} · 当前记录</div>
      {step===0?<p style={{fontSize:18,lineHeight:1.7}}>用户提供原始照片，并要求分割小女孩和推车。工具名、区域框与最终回答均尚未生成。</p>:<div className="ll-code">{json(step===1?toolRequest:step===2?toolResult:answer)}</div>}
    </div>
    {step>=2&&<details className="ll-source"><summary>展开已经发生的记录</summary><p>助手技能请求</p><div className="ll-code">{json(toolRequest)}</div>{step===3&&<><p>外部工具回传</p><div className="ll-code">{json(toolResult)}</div></>}</details>}
    <Feedback tone={step>=2?'green':'blue'}>{feedback[step]} 依据：第5页表1、第4–5页图2与式2；中文说明为教学转述，数值保留原文。</Feedback>
  </div>;
}
