import { useRef, useState } from 'react';
import { Stage, C, box, line, label, photo, book, arrow, Chips, Notice, Stat, Lab, Legend } from './maple-kit';

import {Sequence,ActionCaption} from './maple-sequence';
const protocols = [
  { name: 'Base → New', train: '只用已见类别的图像，每类 16 张', test: '同一数据集的已见类别与新类别', held: '新类别训练图像为 0；预测时仍提供候选类别名称。', recipe: '默认 J=9、b=2；5 epochs；学习率 0.0035。', shortTrain: '已见类别', shortTest: '新类别', steps: ['把类别分为已见与新类别；仅从已见类别抽取训练图像。', '用已见类别的分类监督更新提示 P_i 与耦合映射 F_i，预训练权重 W 始终冻结。', '训练结束，固定学到的提示与映射；准备测试时的候选类别名称。', '分别评估已见与新类别。测试图像只做前向计算，不更新提示。'] },
  { name: '跨数据集', train: 'ImageNet 全部 1000 类，每类 16 张', test: '另外 10 个图像分类数据集', held: '目标数据集不参与提示训练；按目标类别名称构造文字特征。', recipe: '源模型 J=3；2 epochs；学习率 0.0026。', shortTrain: 'ImageNet', shortTest: '其他数据集', steps: ['在 ImageNet 全部 1000 类中准备少样本训练数据。', '只在 ImageNet 上学习提示和耦合映射，不使用目标数据集训练样本。', '固定源模型的提示；将候选类别名称换成目标数据集的类别名称。', '直接测试另外 10 个数据集；不先在目标数据集微调。'] },
  { name: '域变化', train: 'ImageNet 全部 1000 类，每类 16 张', test: 'ImageNetV2、Sketch、A、R', held: '目标图像的来源或风格改变；四个目标数据集均不参与提示训练。', recipe: '与跨数据集实验一样使用 ImageNet 源模型：J=3、2 epochs。', shortTrain: 'ImageNet', shortTest: '域变化', steps: ['在 ImageNet 上准备训练数据，把具有域变化的数据集留作测试。', '在源数据上更新提示与耦合映射，目标图像没有进入优化过程。', '固定学到的参数，使用目标测试任务的候选类别名称。', '直接测试 ImageNet 的四个变体，检查分布变化后的识别表现。'] },
];
const stepNames = ['准备数据', '学习提示', '固定提示', '目标分类'];

export function MapleProtocol() {
  const [mode, setMode] = useState(0);
  const [step, setStep] = useState(0);
  const p = protocols[mode];
  const traveller = useRef(144);
  const focus = useRef([1,0,0,0]);
  return <Lab>
    <Chips items={protocols.map(p => p.name)} value={mode} onChange={i => { setMode(i); setStep(0); }} label="选择泛化评测协议" />
    <Sequence steps={stepNames} value={step} onChange={setStep} caption="从训练到测试 · 每一步使用哪些数据" />
    <Stage width={1080} height={340} label={p.name + '：' + stepNames[step] + '。' + p.steps[step]} draw={(ctx,w,h,t)=>{
      ctx.save();ctx.scale(w/1080,h/340);
      const positions=[144,408,672,936],reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      traveller.current+=(positions[step]-traveller.current)*(reduce?1:.13);
      focus.current=focus.current.map((v,i)=>v+((i===step?1:0)-v)*(reduce?1:.16));
      positions.forEach((x,i)=>{box(ctx,x-111,28,222,232,'#fff',C.border,20);ctx.save();ctx.globalAlpha=focus.current[i];box(ctx,x-111,28,222,232,'#fff5f8',C.blue,20);ctx.restore();box(ctx,x-86,46,27,27,i===step?C.blue:'#f8e8ef',undefined,9);label(ctx,String(i+1),x-72,60,12,i===step?'#fff':C.muted,'center');label(ctx,stepNames[i],x,232,16,i===step?C.ink:C.muted,'center');});
      for(let i=0;i<3;i++)photo(ctx,98+i*19,111-i*7,62,69,mode===2?i:0);
      line(ctx,84,194,202,194,C.dark,3);label(ctx,p.shortTrain,144,206,12,C.muted,'center');
      book(ctx,354,115,108,76);for(let i=0;i<3;i++)box(ctx,367,130+i*15,24+i*5,6,C.green,undefined,3);box(ctx,419,126,24,43,'#faf3fd',C.purple,5);label(ctx,'F',431,148,17,C.purple,'center');
      box(ctx,639,135,66,51,'#f8e8ef',C.dark,11);ctx.beginPath();ctx.arc(672,134,21,Math.PI,0);ctx.strokeStyle=C.dark;ctx.lineWidth=4;ctx.stroke();label(ctx,'P · F',672,160,14,C.ink,'center');
      book(ctx,883,114,106,79);photo(ctx,891,126,38,47,mode===2?2:1);for(let i=0;i<3;i++)line(ctx,944,134+15*i,975,134+15*i,C.blue,3);label(ctx,p.shortTest,936,207,12,C.muted,'center');
      line(ctx,144,299,936,299,C.light,2);line(ctx,144,299,traveller.current,299,C.blue,2);
      positions.forEach(x=>{ctx.beginPath();ctx.arc(x,299,4,0,Math.PI*2);ctx.fillStyle=C.light;ctx.fill();});
      const cx=traveller.current-23,cy=277;
      if(step===0||step===3)photo(ctx,cx,cy,46,43,step===3?1:0);else{box(ctx,cx,cy+4,46,35,'#fff',step===2?C.dark:C.green,8);for(let n=0;n<3;n++)line(ctx,cx+10,cy+13+n*8,cx+37,cy+13+n*8,C.green,3);}
      ctx.restore();
    }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <Stat label="参与学习" value={mode === 0 ? 'Base 图像' : 'ImageNet'} note={p.train} />
      <Stat label="留作检验" value={mode === 0 ? 'New 图像' : '目标数据'} note={p.test} />
      <Stat label="当前阶段" value={stepNames[step]} note={step === 1 ? '只更新 P_i、F_i' : step >= 2 ? 'P_i、F_i 也固定' : '先明确数据边界'} />
    </div>
    <ActionCaption label={'0'+(step+1)} action={stepNames[step]} result={p.steps[step]}/>
    <div className="maple-actions"><button type="button" className="maple-action-button" disabled={step === 0} onClick={() => setStep(s => s - 1)}>← 上一步</button><button type="button" className="maple-action-button maple-primary-action" disabled={step === 3} onClick={() => setStep(s => s + 1)}>下一步 →</button></div>
    {step === 3 && <Notice tone="orange"><strong>同一个分类规则：</strong>目标图像 → 图像特征 v；候选类别名称 → 各类文字特征 t_c；比较所有相似度，再选择最大者。这里展示流程，没有模拟的预测分数。</Notice>}
    <p style={{ margin: 0, lineHeight: 1.7 }}>{p.held}</p>
    <Legend items={[{ label: '参与适配的训练卡片', color: C.blue }, { label: '可学习的提示', color: C.green }, { label: '提示间耦合', color: C.purple }]} />
    <details><summary>查看对应的论文设置</summary><p>{p.recipe} 论文在预训练 CLIP ViT-B/16 上采用 16-shot。这里的四步是解释流程，动画并没有执行训练。来源：§4.1；跨数据集与域变化分别见 Table 4、Table 5。</p></details>
  </Lab>;
}
