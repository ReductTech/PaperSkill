import {useState} from 'react';
import {Scene,Choices,Feedback,KV,C,clearScene,round,label} from './llava-kit';
const strategies=['仅测试加工具','Fly','Fly去掉thoughts','All Tools'];
const benchmarks=['COCO相对分','Wild相对分','SEED准确率'];
const base=[81.2,57.1,44.45];
const scores:(number|null)[][]=[[59.1,80.4,79.4,83.9],[47.5,59.1,48.7,69.5],[51.54,53.25,null,55.01]];
export function AblationLab(){
 const [benchmark,setBenchmark]=useState(0),[strategy,setStrategy]=useState(0),[resetNotice,setResetNotice]=useState(false);
 const baseline=strategy===2?scores[benchmark][1] as number:base[benchmark];
 const score=scores[benchmark][strategy] as number,delta=score-baseline,unit=benchmark===2?'个百分点':'分';
 const baselineName=strategy===2?'LLaVA-Plus (Fly)':'LLaVA';
 const selectedName=['LLaVA (Tools in Test)','LLaVA-Plus (Fly)','Fly (no thoughts)','LLaVA-Plus (All Tools)'][strategy];
 const decimals=benchmark===2?2:1;
 let interpretation='All Tools提供更多上下文；不能凭分数杜撰耗时或把额外上下文说成无成本。';
 if(strategy===0)interpretation=benchmark===2?'SEED平均准确率提高，因此不能说测试时加工具总会变差。':'只在测试时加入工具并不保证变好。';
 if(strategy===1)interpretation=benchmark===0?'Fly的COCO汇总低于LLaVA，不能把总趋势写成所有设置提升。':'Fly的收益取决于具体评测协议。';
 if(strategy===2)interpretation='去掉thoughts后分数下降；这是该协议下的消融证据，不能证明内部推理可信。';
 function chooseBenchmark(i:number){setBenchmark(i);const reset=i===2&&strategy===2;setResetNotice(reset);if(reset)setStrategy(0);}
 return <div>
  <Scene label="同一评测的基线与策略分数" draw={(ctx,w,h)=>{clearScene(ctx,w,h);ctx.strokeStyle=C.border;ctx.lineWidth=2;for(let i=0;i<=10;i++){ctx.beginPath();ctx.moveTo(75+i*90,45);ctx.lineTo(75+i*90,245);ctx.stroke();}ctx.strokeStyle=C.text;ctx.beginPath();ctx.moveTo(75,40);ctx.lineTo(75,250);ctx.lineTo(975,250);ctx.stroke();round(ctx,75,70,baseline*9,55,'#aab3bf',undefined,4);round(ctx,75,164,score*9,55,delta>=0?C.green:C.red,undefined,4);label(ctx,baseline.toFixed(decimals),Math.min(1000,90+baseline*9),107,26,C.text);label(ctx,score.toFixed(decimals),Math.min(1000,90+score*9),201,26,delta>=0?C.green:C.red);}}/>
  <Choices items={benchmarks} value={benchmark} onChange={chooseBenchmark} label="选择同一评测协议"/>
  <Choices items={strategies} value={strategy} onChange={i=>{setStrategy(i);setResetNotice(false);}} disabled={benchmark===2?[2]:[]} label="选择比较策略"/>
  <KV items={[{label:'上条：比较基线',value:`${baselineName}：${baseline.toFixed(decimals)}${benchmark===2?'%':''}`},{label:'下条：当前策略',value:`${selectedName}：${score.toFixed(decimals)}${benchmark===2?'%':''}`},{label:'差值',value:`${delta>=0?'+':''}${delta.toFixed(decimals)} ${unit}`},{label:'指标与范围',value:benchmark===2?'平均准确率；固定0–100%轴':'GPT-4相对得分；固定0–100轴，非准确率'},{label:'报告边界',value:benchmark===2?(resetNotice?'未报告此组合；已将策略切换为仅测试加工具。':'SEED未报告Fly去掉thoughts，已禁用。'):'COCO与Wild均使用汇总列；去掉thoughts时与Fly比较。'}]}/>
  <Feedback tone={delta>=0?'green':'red'}>{baselineName} {baseline.toFixed(decimals)}{benchmark===2?'%':''} → {selectedName} {score.toFixed(decimals)}{benchmark===2?'%':''}。{interpretation} 来源：第11页表4{benchmark===2?'b':'a'}。</Feedback>
 </div>;
}
