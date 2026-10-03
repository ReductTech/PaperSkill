import { panel, words, flow } from './original-visuals';
import { useState } from 'react';
import { C, CanvasScene, Controls, Chip, Feedback, drawCard, drawBook, line, label } from './scene-kit';

export function FallbackRule() {
  const [votes, setVotes] = useState(14);
  const retrieve = votes <= 10;
  return <div>
    <CanvasScene key={votes} label={`21 次采样中最多票答案获得 ${votes} 票，${retrieve ? '转向 ReAct 检索' : '保留 CoT-SC 答案'}`} draw={(ctx, _w, _h, time) => {

      for(let i=0;i<21;i++){const x=64+i*45;ctx.fillStyle=i<votes?C.orange:'#fff';ctx.strokeStyle=i<votes?C.support:C.contour;ctx.lineWidth=2;ctx.fillRect(x,43,33,40);ctx.strokeRect(x,43,33,40);label(ctx,i<votes?'A':String(i-votes+1),x+9,69,i<votes?'#fff':C.muted,16);}
      ctx.setLineDash([5,5]);line(ctx,508,26,508,105,C.red,3);ctx.setLineDash([]);label(ctx,'11 票起保留',535,112,C.red,19);
      flow(ctx,535,126,retrieve?285:785,165,(time%3200)/3200,retrieve?C.blue:C.green);
      drawBook(ctx,180,178,.8,retrieve?C.blue:C.contour);words(ctx,['外部','检索'],190,199,13,C.blue,24);words(ctx,['继续','查证'],262,199,13,C.blue,24);
      drawCard(ctx,727,176,161,73,retrieve?C.contour:C.green);words(ctx,['保留答案 A','仍可能出错'],743,202,16,C.green,27);
      label(ctx,retrieve?'当前转向检索':'当前保留多数答案',382,245,retrieve?C.blue:C.green,20);

    }} />
    <Controls>
      <label htmlFor="fallback-votes">最多票答案：<strong>{votes} / 21 票</strong></label>
      <input id="fallback-votes" type="range" min={1} max={21} step={1} value={votes} onChange={event => setVotes(Number(event.target.value))} style={{ width: 280, accentColor: C.orange }} />
      <Chip active={votes === 10} onClick={() => setVotes(10)}>试 10 票</Chip>
      <Chip active={votes === 11} onClick={() => setVotes(11)}>试 11 票</Chip>
    </Controls>
    <div style={{ minHeight: 72 }} aria-live="polite"><p><strong>{retrieve ? '转向 ReAct。' : '保留 CoT-SC。'}</strong>21 次采样中，最多票答案获得 {votes} 票；不足 11 票时转向检索。其余编号表示不同答案。票数是离散计数，不是校准后的正确概率。</p></div>
    <Feedback>{retrieve ? '得票最多的答案不超过 10 票：按此启发式转向 ReAct，补充外部证据。检索仍可能出错。' : '得票最多的答案至少得到 11 票：按此启发式保留 CoT-SC 答案；一致的答案仍可能错误。'}</Feedback>
  </div>;
}
