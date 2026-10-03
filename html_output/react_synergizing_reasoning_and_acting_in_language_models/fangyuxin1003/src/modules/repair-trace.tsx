import { panel, words, flow } from './original-visuals';
import { useState } from 'react';
import { C, CanvasScene, Controls, Feedback, drawBook, line, label } from './scene-kit';

const steps = [
 {title:'从作品出发',query:'search[The Little Prince]',result:'先检索作品，确认作者是谁。',feedback:'查询先发出；此时还没有新的返回内容。',color:C.blue},
 {title:'得到作者线索',query:'Observation',result:'作品条目给出作者：圣埃克苏佩里。出生地还需要继续核查。',feedback:'已确认作者，不等于已经知道出生地。',color:C.green},
 {title:'处理未定位的反馈',query:'search[Saint-Exupéry]',result:'本教学情境设置为姓氏未定位，返回候选；需要补全姓名。',feedback:'这次模拟反馈用于演示查询修正，不代表实时检索结果。',color:C.orange},
 {title:'补全姓名再查询',query:'search[Antoine de Saint-Exupéry]',result:'把候选中的完整姓名用于下一次查询。',feedback:'根据返回信息修正动作，等待新的观察。',color:C.blue},
 {title:'得到出生地点',query:'Observation',result:'人物条目给出出生地：法国里昂。',feedback:'先获得出生地信息，再把它与作品作者联系起来。',color:C.green},
 {title:'连接事实并作答',query:'finish[Lyon]',result:'《小王子》的作者出生于里昂。提交答案并结束这条轨迹。',feedback:'答案使用了作品作者与人物出生地两条信息。',color:C.green},
];

export function RepairTrace() {
  const [step, setStep] = useState(0);
  const current = steps[step];
  return <div>
    <CanvasScene key={step} label={`检索轨迹第${step + 1}条，共6条：${current.title}。${current.query}`}
      draw={(ctx, _w, _h, time) => {

      label(ctx,'当前查证内容',64,36,C.text,22);label(ctx,'检索记录',570,36,C.text,22);
      drawBook(ctx,68,66,2,C.contour);
      const left=step===0?['《小王子》','请求已发出','等待返回']:step<=2?['《小王子》','作者是','圣埃克苏佩里']:step===3?['圣埃克苏佩里','补全姓名','等待返回']:['圣埃克苏佩里','人物条目','已返回'];
      const right=step===2?['未找到实体','候选包含','人物条目']:step<4?['出生地点？','尚未获得','答案证据']:['作者出生于','里昂','可据此作答'];
      words(ctx,left,87,105,17,C.blue,46);words(ctx,right,270,105,17,step===2?C.red:C.text,46);
      const short=[['查作品','请求'],['作者','观察'],['姓氏','未定位'],['全名','请求'],['里昂','观察'],['作答','结束']];
      short.forEach((r,i)=>{const x=558+i*80;panel(ctx,x,91,72,114,i===step?current.color:C.border);words(ctx,r,x+7,128,14,i===step?current.color:C.muted,33);label(ctx,String(i+1),x+28,187,C.muted,14);});
      const q=step===0||step===3;if(step===5)flow(ctx,930,234,1013,234,Math.min(1,time/1600),C.blue);else flow(ctx,q?546:447,234,q?447:546,234,(time%2400)/2400,q?C.blue:C.green);
      label(ctx,step===5?'提交答案，不再检索':q?'请求送往环境':'环境返回的信息',579,249,current.color,17);

    }} />
    <Controls>
      <button className="trace-prev" type="button" onClick={() => setStep(value => value - 1)} disabled={step === 0}>上一条</button>
      <button className="trace-next" type="button" onClick={() => setStep(value => value + 1)} disabled={step === steps.length - 1}>下一条</button>
      <button type="button" onClick={() => setStep(0)} disabled={step === 0}>重置</button>
      <span className="trace-counter">第 {step + 1} / {steps.length} 条</span>
    </Controls>
    <div aria-live="polite" style={{ minHeight: 132 }}>
      <p><strong>{current.title}</strong> · <code>{current.query}</code></p>
      <p>{current.result}</p>
    </div>
    <Feedback tone={step === 2 ? 'bad' : step >= 4 ? 'good' : 'neutral'}>{current.feedback}</Feedback>
  </div>;
}
