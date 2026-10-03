import { panel, words, flow } from './original-visuals';
import { useState } from 'react';
import { C, CanvasScene, Controls, Chip, Feedback, drawCard, circle, line, label } from './scene-kit';

export function TrainingModes() {
  const [mode, setMode] = useState<'prompt' | 'finetune'>('prompt');
  const [size, setSize] = useState<'8B' | '62B'>('8B');
  const tuning = mode === 'finetune';
  return <div>
    <CanvasScene key={`${mode}-${size}`} label={tuning ? `轨迹微调：PaLM-${size} 参数更新` : '少样本提示：上下文变化，PaLM-540B 参数冻结'} draw={(ctx, _w, _h, time) => {

      const phase=(time%5000)/5000;
      drawCard(ctx,190,55,250,170,C.blue);
      words(ctx,['示范：查出生地点','思考：先查作者','行动：检索设备','观察：圣埃克苏佩里'],210,86,17,C.blue,36);
      flow(ctx,465,140,690,140,Math.min(1,phase*2),tuning?C.purple:C.blue);
      label(ctx,tuning?'监督训练':'输入示例',500,115,tuning?C.purple:C.blue,18);
      ctx.strokeStyle=tuning?C.purple:C.contour;ctx.lineWidth=tuning?4:2;ctx.beginPath();ctx.arc(800,140,83,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<8;i++){const a=i*Math.PI/4;const r=tuning&&phase>.5?6+4*Math.sin((phase-.5)*Math.PI):6;circle(ctx,800+Math.cos(a)*49,140+Math.sin(a)*49,r,tuning&&phase>.5?C.purple:C.light);}
      label(ctx,tuning?size:'540B',778,147,tuning?C.purple:C.blue,16);
      label(ctx,tuning?'答案正确的完整轨迹':'上下文示例',203,255,C.blue,20);
      label(ctx,tuning?'训练更新参数':'参数始终冻结',735,255,tuning?C.purple:C.muted,20);

    }} />
    <Controls><Chip active={!tuning} onClick={() => setMode('prompt')}>少样本提示</Chip><Chip active={tuning} onClick={() => setMode('finetune')}>轨迹微调</Chip>
      {tuning && <><Chip active={size === '8B'} onClick={() => setSize('8B')}>PaLM-8B</Chip><Chip active={size === '62B'} onClick={() => setSize('62B')}>PaLM-62B</Chip></>}
    </Controls>
    <div style={{ minHeight: 88 }} aria-live="polite">
      {tuning ? <p><strong>PaLM-{size} · 参数更新。</strong>在 HotpotQA 上，使用 3,000 条最终答案正确的模型生成轨迹，学习解码完整轨迹；批量大小 64，ReAct 训练 4,000 步。</p> : <p><strong>PaLM-540B · 参数冻结。</strong>主要实验通过人工编写的少样本轨迹提供示范，改变输入上下文，无需更新参数。</p>}
    </div>
    <Feedback>{tuning ? '微调属于监督式轨迹学习，不是在线强化学习。在 HotpotQA 上，小模型直接提示 ReAct 较难；微调后，ReAct 在比较的四种格式中表现最好。这不代表所有任务上的排序。' : '少样本提示改变模型本次可参考的示例；冻结参数也能运行 ReAct。切换到微调可查看小模型设置。'}</Feedback>
  </div>;
}
