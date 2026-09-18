import { useState } from 'react';
import { Scene, Feedback, C, drawDesk, drawPaper, drawPen, drawTarget, drawLabel, line, bar } from './index-kit';
export function IndexLoss() {
 const [p,setP]=useState(.5); const [touched,setTouched]=useState(false);
 const loss=-Math.log(p), color=p<.3?C.red:p<.7?C.blue:C.green;
 const message=`目标概率 ${p.toFixed(2)}，损失 ${loss.toFixed(3)}；${!touched?'还有一半概率分给其他可能。':p<.3?'给目标的概率偏低，惩罚较大。':p<.7?'还有一部分概率分给其他可能。':'目标更被看好，损失更小。'}`;
 return <div onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}>
 <Scene label={`教学示例，目标概率 ${p.toFixed(2)}，负对数损失 ${loss.toFixed(3)}`} draw={(ctx)=>{
 drawDesk(ctx,450,250);drawPaper(ctx,55,80,150,120);ctx.strokeStyle=C.text;ctx.lineWidth=2;ctx.strokeRect(285,100,85,110);bar(ctx,287,208-100*p,81,100*p,color);drawPen(ctx,325,100+40*p,0,C.support);drawTarget(ctx,325,100+40*p,color);
 [540,805].forEach(x=>{line(ctx,x,235,x+180,235);line(ctx,x,65,x,235);[0,.5,1].forEach(q=>line(ctx,x-5,235-170*q,x+5,235-170*q));});
 bar(ctx,575,235-170*p,100,170*p,color);bar(ctx,840,235-170*loss/3,100,170*loss/3,C.blue);drawLabel(ctx,'概率',590,35);drawLabel(ctx,'损失',855,35);
 }}/>
 <div className="metrics"><div className="metric"><div className="l">目标概率 · 0—1</div><output className="v">{p.toFixed(2)}</output></div><div className="metric"><div className="l">负对数损失 · 0—3</div><output className="v">{loss.toFixed(3)}</output></div></div>
 <div className="ctrl"><label htmlFor="index-target-probability">目标概率</label><input id="index-target-probability" type="range" min="0.05" max="0.95" step="0.05" value={p} aria-valuetext={`概率 ${p.toFixed(2)}，损失 ${loss.toFixed(3)}`} onChange={e=>{setP(Math.max(.05,Math.min(.95,Math.round(Number(e.target.value)*20)/20)));setTouched(true);}}/></div>
 <Feedback tone={p<.3?'bad':p<.7?'neutral':'good'}>{message}</Feedback>
 </div>;
}
