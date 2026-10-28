import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './clip-storyline.css';

const stages = [
  { title: '图文数据', detail: '预训练从成对的图片与图注开始。' },
  { title: '双编码器', detail: '图片和文字各经一个编码器，分别提取特征。' },
  { title: '向量比较', detail: '特征投影、归一化后，在共同空间中计算图文相似度。' },
  { title: '配对学习', detail: '比较原始配对与批内非配对，用配对损失更新两个编码器。' },
  { title: '文字分类器', detail: '训练完成后，固定模型：把类别描述编码成向量，组成分类器。' },
  { title: '零样本预测', detail: '新图片经过固定的图像编码器，与类别向量比较，选出最高分。' },
  { title: '标签预算', detail: '区分评估协议，先看用了多少目标训练标签。' },
  { title: '结果与边界', detail: '只在同一数据集和明确协议下比较报告值。' },
];

const stageDuration = 3400;

const chapterPositions: { focus: number[]; explanation: string; titles?: Record<number, string>; details?: Record<number, string> }[] = [
  { focus: [], explanation: '先通过图文配对学表示，再用类别文字识别新图片。' },
  { focus: [4, 5], explanation: '用文字指定类别，改变分类依据；模型参数保持固定。' },
  { focus: [1, 2], explanation: '图片与文字分别编码，转换为可以比较的向量。' },
  { focus: [0, 3], titles: { 3: '配对目标' }, details: { 3: '对角线是原始配对；同一批里的其他组合提供需要区分的非配对。' }, explanation: '一批图文提供原始配对，也提供需要区分的非配对。' },
  { focus: [2], explanation: '归一化后比较向量方向，得到图文相似度。' },
  { focus: [4], explanation: '改变类别描述或组合提示模板，会改变分类器中的文字向量。' },
  { focus: [4, 5], explanation: '用类别文字建立分类器，给新图片做零样本预测。' },
  { focus: [3], explanation: '把双向配对任务写成损失，让原始配对在候选中胜出。' },
  { focus: [1, 2], explanation: '图片与文字分别编码、投影、归一化，再汇成图文相似度矩阵。' },
  { focus: [6], explanation: '零样本不使用目标训练图片；4-shot 每类使用 4 张标注图片；全量线性探测使用全部目标训练标签。' },
  { focus: [7], explanation: 'ImageNetV2 上，监督 ResNet-101 为 64.3%，零样本 CLIP 为 70.1%（论文最佳型号，Figure 7）。结论仅限此评估条件。' },
];

function StageArt({ stage }: { stage: number }) {
  return <svg viewBox="0 0 440 184" className="cs-stage-art" aria-hidden="true" focusable="false">
    {stage === 0 && <>
      <rect x="24" y="22" width="122" height="133" rx="14" className="cs-sheet"/>
      <rect x="34" y="32" width="102" height="83" rx="8" className="cs-soft-fill"/>
      <circle cx="111" cy="51" r="9" className="cs-gold-fill"/>
      <path d="M45 102l25-37 24 27 14-17 19 27" pathLength="1" className="cs-ink-path cs-reveal"/>
      <text x="85" y="138" textAnchor="middle" className="cs-label">一张图片</text>
      <path d="M163 89h91m-8-5 8 5-8 5" className="cs-link"/><path d="M163 89h91" pathLength="1" className="cs-flow-line"/>
      <text x="208" y="69" textAnchor="middle" className="cs-small-label">原始配对</text>
      <rect x="270" y="22" width="146" height="133" rx="14" className="cs-sheet"/>
      <text x="289" y="55" className="cs-serif">Aa</text>
      <path d="M289 76h107M289 91h83M289 106h95" pathLength="1" className="cs-text-path cs-reveal-later"/>
      <text x="343" y="138" textAnchor="middle" className="cs-label">一段自然语言</text>
      <path d="M197 113l7 7 13-17" className="cs-ink-path cs-confirm"/>
    </>}
    {stage === 1 && <>
      {[35,111].map(y=><g key={y}><path d={`M73 ${y+20}h67M252 ${y+20}h75`} className="cs-link"/><path d={`M73 ${y+20}h254`} pathLength="1" className="cs-flow-line"/></g>)}
      <rect x="22" y="35" width="53" height="42" rx="8" className="cs-sheet"/><path d="M31 65l12-17 9 12 11-8" className="cs-ink-path"/>
      <rect x="22" y="111" width="53" height="42" rx="8" className="cs-sheet"/><path d="M33 126h29m-29 12h21" className="cs-text-path"/>
      <rect x="141" y="31" width="111" height="49" rx="11" className="cs-encoder"/><text x="196" y="60" textAnchor="middle" className="cs-label cs-image-label">图像编码器</text>
      <rect x="141" y="107" width="111" height="49" rx="11" className="cs-encoder-gold"/><text x="196" y="136" textAnchor="middle" className="cs-label cs-text-label">文本编码器</text>
      {[0,1].map(row=><g key={row}>{[19,35,25,42,30].map((h,i)=><rect key={i} x={326+i*16} y={row*76+76-h} width="9" height={h} rx="3" className={`cs-grow ${row?'cs-gold-fill':'cs-indigo-fill'}`} style={{animationDelay:`${950+i*90}ms`}}/>)}</g>)}
      <text x="366" y="20" textAnchor="middle" className="cs-small-label">可比较的特征</text>
    </>}
    {stage === 2 && <>
      <circle cx="108" cy="91" r="67" className="cs-orbit"/><path d="M26 91h164M108 13v155" className="cs-link"/>
      <path d="M108 91l52-41" pathLength="1" className="cs-ink-path cs-vector-draw"/><path d="M108 91l61-25" pathLength="1" className="cs-text-path cs-vector-draw cs-reveal-later"/>
      <circle cx="160" cy="50" r="5" className="cs-indigo-fill cs-confirm"/><circle cx="169" cy="66" r="5" className="cs-gold-fill cs-confirm"/>
      <circle cx="108" cy="91" r="3.5" className="cs-indigo-fill"/><path d="M131 73q7 4 6 7" className="cs-muted-path"/>
      <text x="108" y="180" textAnchor="middle" className="cs-small-label">长度归一化 · 比较方向</text>
      <path d="M193 91h49m-8-5 8 5-8 5" className="cs-link"/><path d="M193 91h49" pathLength="1" className="cs-flow-line" style={{animationDelay:'600ms'}}/>
      <rect x="260" y="36" width="155" height="114" rx="14" className="cs-sheet"/><text x="279" y="65" className="cs-label">余弦相似度</text>
      {[111,62,25].map((w,i)=><g key={i}><rect x="279" y={79+i*18} width="116" height="7" rx="3.5" className="cs-faint-fill"/><rect x="279" y={79+i*18} width={w} height="7" rx="3.5" className={i?'cs-soft-gold cs-result-grow':'cs-indigo-fill cs-result-grow'} style={{animationDelay:`${1150+i*150}ms`}}/></g>)}
    </>}
    {stage === 3 && <>
      <rect x="25" y="20" width="139" height="139" rx="14" className="cs-sheet"/>
      {[0,1,2].flatMap(row=>[0,1,2].map(col=><rect key={row+'-'+col} x={38+col*39} y={33+row*39} width="34" height="34" rx="8" className={row===col?'cs-pair-cell cs-indigo-fill':'cs-faint-fill'} style={{animationDelay:`${row*300}ms`}}/>))}
      <text x="94" y="180" textAnchor="middle" className="cs-small-label">图像 × 文本</text>
      <path d="M191 53h153q39 0 39 38t-39 38H198" className="cs-loop-base"/><path d="M191 53h153q39 0 39 38t-39 38H198m8-7-8 7 8 7" pathLength="1" className="cs-loop-draw"/>
      <text x="280" y="87" textAnchor="middle" className="cs-label">提高原始配对得分</text><text x="280" y="108" textAnchor="middle" className="cs-small-label">同时区分批内其他组合</text>
    </>}
    {stage === 4 && <>
      {['猫','车','椅子'].map((label,i)=><g key={label}><rect x="20" y={20+i*52} width="108" height="35" rx="8" className="cs-sheet"/><text x="74" y={42+i*52} textAnchor="middle" className="cs-label">{'一张'+label+'的照片'}</text><path d={`M137 ${37+i*52}C158 ${37+i*52} 154 ${72+i*16} 174 ${72+i*16}M278 ${72+i*16}C298 ${72+i*16} 294 ${37+i*52} 315 ${37+i*52}`} className="cs-link"/><path d={`M137 ${37+i*52}C158 ${37+i*52} 154 ${72+i*16} 174 ${72+i*16}M278 ${72+i*16}C298 ${72+i*16} 294 ${37+i*52} 315 ${37+i*52}`} pathLength="1" className="cs-flow-line" style={{animationDelay:`${i*180}ms`}}/>{[14,26,20,31].map((h,j)=><rect key={j} x={333+j*18} y={51+i*52-((h+i*7)%24+9)} width="10" height={(h+i*7)%24+9} rx="3" className="cs-gold-fill cs-grow" style={{animationDelay:`${1000+i*140+j*70}ms`}}/>)}</g>)}
      <rect x="174" y="61" width="104" height="54" rx="11" className="cs-encoder-gold"/><text x="226" y="84" textAnchor="middle" className="cs-label cs-text-label">文本编码器</text><text x="226" y="102" textAnchor="middle" className="cs-small-label">参数固定</text>
      <text x="367" y="180" textAnchor="middle" className="cs-small-label">类别向量</text>
    </>}
    {stage === 5 && <>
      <rect x="22" y="36" width="111" height="111" rx="14" className="cs-sheet"/><rect x="32" y="46" width="91" height="71" rx="8" className="cs-soft-fill"/><circle cx="104" cy="62" r="7" className="cs-gold-fill"/><path d="M41 106l22-33 19 22 15-16 17 27" className="cs-ink-path"/><text x="77" y="135" textAnchor="middle" className="cs-label">新图像</text>
      <path d="M148 91h54m-8-5 8 5-8 5" className="cs-link"/><path d="M148 91h54" pathLength="1" className="cs-flow-line"/>
      <rect x="219" y="20" width="198" height="143" rx="14" className="cs-sheet"/>
      {[['描述 A',128],['描述 B',65],['描述 C',28]].map(([label,w],i)=><g key={label}><text x="234" y={42+i*43} className={i?'cs-small-label':'cs-small-label cs-image-label'}>{label}{i===0?' · 最高分':''}</text><rect x="234" y={51+i*43} width="166" height="8" rx="4" className="cs-faint-fill"/><rect x="234" y={51+i*43} width={Number(w)} height="8" rx="4" className={`cs-result-grow ${i?'cs-soft-gold':'cs-indigo-fill'}`} style={{animationDelay:`${950+i*150}ms`}}/></g>)}
    </>}
    {stage === 6 && <>
      <text x="220" y="17" textAnchor="middle" className="cs-small-label">目标标签预算 · 图像编码器固定</text>
      {[{title:'零样本',budget:'0',unit:'目标训练图片',source:'类别文字构造'},{title:'4-shot',budget:'4',unit:'张标注图片 / 类',source:'拟合线性分类器'},{title:'全量线性探测',budget:'全部',unit:'目标训练标签',source:'拟合线性分类器'}].map((item,i)=><g key={item.title} className="cs-protocol-card" style={{animationDelay:`${i*300}ms`}}>
        <rect x={18+i*139} y="31" width="126" height="132" rx="13" className="cs-sheet"/>
        <text x={81+i*139} y="53" textAnchor="middle" className="cs-label">{item.title}</text>
        <text x={81+i*139} y="94" textAnchor="middle" className="cs-budget-number">{item.budget}</text>
        <text x={81+i*139} y="116" textAnchor="middle" className="cs-small-label">{item.unit}</text>
        <path d={`M${34+i*139} 129h94`} className="cs-link"/>
        <text x={81+i*139} y="149" textAnchor="middle" className={i?'cs-small-label cs-image-label':'cs-small-label cs-text-label'}>{item.source}</text>
      </g>)}
      <text x="220" y="181" textAnchor="middle" className="cs-small-label">零样本也已有图文预训练</text>
    </>}
    {stage === 7 && <>
      <text x="20" y="20" className="cs-label">ImageNetV2 · Top-1 准确率（%）</text>
      {[{label:'监督 ResNet-101',value:64.3},{label:'零样本 CLIP · 论文最佳型号',value:70.1}].map((item,i)=><g key={item.label}>
        <text x="20" y={49+i*54} className="cs-label">{item.label}</text>
        <text x="418" y={49+i*54} textAnchor="end" className="cs-result-number">{item.value.toFixed(1)}</text>
        <rect x="20" y={59+i*54} width="398" height="13" rx="5" className="cs-faint-fill"/>
        <rect x="20" y={59+i*54} width={398*item.value/100} height="13" rx="5" className={`cs-result-grow ${i?'cs-indigo-fill':'cs-benchmark-fill'}`} style={{animationDelay:`${250+i*350}ms`}}/>
      </g>)}
      <text x="20" y="149" className="cs-small-label">0</text><text x="219" y="149" textAnchor="middle" className="cs-small-label">50</text><text x="418" y="149" textAnchor="end" className="cs-small-label">100</text>
      <path d="M20 155h398" className="cs-link"/>
      <text x="220" y="178" textAnchor="middle" className="cs-small-label">Figure 7 · 同一数据集内比较，不能推广到所有任务</text>
    </>}
  </svg>;
}

/** The chapter's mechanism runs on its own, with a complete static alternative. */
export function ClipStoryline({ chapter }: { chapter: number }) {
  const titleId = useId();
  const location = chapterPositions[chapter] ?? chapterPositions[0];
  const visibleStages = location.focus.length ? location.focus : [0,1,2,3,4,5];
  const stageTitle = (index: number) => location.titles?.[index] || stages[index].title;
  const stageDetail = (index: number) => location.details?.[index] || (visibleStages.length === 1 ? location.explanation : stages[index].detail);
  const [step,setStep] = useState(0);
  const [frame,setFrame] = useState(0);
  const [visible,setVisible] = useState(() => !document.hidden);
  const [reduced,setReduced] = useState(true);
  const generation = useRef(0);
  const remaining = useRef(stageDuration);
  const running = visible && !reduced;
  const currentStage = visibleStages[Math.min(step,visibleStages.length-1)];
  const resetFrame = (next:number) => { generation.current += 1; remaining.current=stageDuration; setStep(next); setFrame(generation.current); };
  useEffect(() => {
    const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(preference?.matches??false);
    const visibility=()=>setVisible(!document.hidden);
    update(); visibility(); preference?.addEventListener('change',update); document.addEventListener('visibilitychange',visibility);
    return()=>{preference?.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{resetFrame(0);},[chapter]);
  useEffect(()=>{
    if(!running || frame!==generation.current)return;
    const token=generation.current, started=performance.now(), wait=remaining.current;
    let completed=false;
    const timer=window.setTimeout(()=>{completed=true;resetFrame((step+1)%visibleStages.length);},wait);
    return()=>{window.clearTimeout(timer);if(!completed&&generation.current===token)remaining.current=Math.max(0,wait-(performance.now()-started));};
  },[running,frame,step,visibleStages.length]);
  return <section className={`clip-storyline cs-local${running?' is-running':''}${reduced?' is-static':' has-animation'}`} style={{'--cs-duration':`${stageDuration}ms`} as CSSProperties} aria-labelledby={titleId} data-story-stage={currentStage}>
    <h2 id={titleId} className="cs-visually-hidden">本页动画</h2>
    <div className="cs-illustration"><span className="cs-illustration-index" aria-hidden="true">{String(chapter).padStart(2,'0')} / CLIP</span><StageArt key={frame} stage={currentStage}/></div>
    <div className="cs-story-content">
      <ol className="cs-local-stages" aria-label="本页相关环节">{visibleStages.map((index,i)=><li key={index} className={`cs-stage${currentStage===index?' is-current':''}`} aria-current={currentStage===index?'step':undefined}><span className="cs-stage-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><span className="cs-stage-title">{stageTitle(index)}</span></li>)}</ol>
      <div className="cs-local-explanation cs-detail-stack">{visibleStages.map(index=><p key={index} className="cs-detail-frame" aria-hidden={currentStage!==index}>{reduced?location.explanation:stageDetail(index)}</p>)}</div>
      <div className="cs-time-track" aria-hidden="true"><i key={frame}/></div>
    </div>
  </section>;
}
export default ClipStoryline;
