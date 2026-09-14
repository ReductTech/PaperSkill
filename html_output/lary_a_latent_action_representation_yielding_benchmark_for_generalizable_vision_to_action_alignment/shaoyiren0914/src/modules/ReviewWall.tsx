import React, { useMemo, useState } from 'react';
import { Character } from '../components/Character';

const STORAGE_KEY='lary-case-state-v2';

const chain=[
  {text:'线索01：画面变化 ≠ 动作理解',question:'监控只给出前后画面。要防止机器人因“看起来会”就脱嫌，先钉上哪条警告？'},
  {text:'线索02：潜在动作是表示，不是真实动作标签',question:'动作标签缺席，中间发生了什么仍要留下证物。哪张卡接住了这段空白？'},
  {text:'线索03：双轨任务拆开“做什么”与“怎么做”',question:'要正式审机器人，不能只问一句。哪张卡把“做什么”和“怎么做”拆成两道审讯？'},
  {text:'线索04：统一 attentive probe 受控读取动作语义',question:'嫌疑模型背景各不相同，怎样用同一把尺读取它们藏着的动作语义？'},
  {text:'线索05：回归检验表示是否保留连续控制',question:'机器人若说得出动作名称，却做不出轨迹，仍不能结案。下一张应该是哪类证据？'},
  {text:'线索06：通用视觉先验仍会经过量化瓶颈',question:'追查表示的来路时，哪张卡提醒我们：丰富先验进入离散瓶颈后也可能丢信息？'},
  {text:'线索07：本基准中通用视觉编码器意外领先',question:'排行榜揭晓，哪条证据让“机器人专科生必胜”的直觉当场改口？'},
  {text:'线索08：部分 LAM 跨 stride 较稳，但绝对误差仍需比较',question:'专科生真的毫无价值吗？哪张卡记录了它在长时间跨度上的另一种表现？'},
  {text:'线索09：容量、利用率与性能并非单调',question:'继续检查量化瓶颈，哪张卡否定了“词典越厚、动作就懂得越多”？'},
  {text:'线索10：会模仿，不代表真的理解',question:'最后回到糯糯与机器人：哪条边界提醒我们，模仿动作不能直接写成真正理解？'}
];

const caseBeats=[
  {label:'案发现场',text:'糯糯倒在房间里，空瓶子躺在一旁。'},
  {label:'监控疑点',text:'机器人观察糯糯倒水，随后模仿“倒入某种东西”。'},
  {label:'问题转向',text:'它复制的是画面变化，还是读懂了人的动作？'}
];

const shuffleOrder=[6,1,8,3,0,9,4,2,7,5];

function getGathered():string[]{
  try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');const aliases:Record<string,string>={'线索04：统一 Probe 控制读出能力，隔离表示质量':'线索04：统一 attentive probe 受控读取动作语义','线索08：latent 更稳，但 Heatmap 只是诊断线索':'线索08：部分 LAM 跨 stride 较稳，但绝对误差仍需比较'};return Array.isArray(value.clues)?value.clues.map((clue:string)=>aliases[clue]||clue):[]}
  catch{return[]}
}

export function ReviewWall(){
  const [placed,setPlaced]=useState<string[]>([]);
  const [feedback,setFeedback]=useState('');
  const gathered=useMemo(()=>getGathered(),[]);
  const available=useMemo(()=>shuffleOrder.map(i=>chain[i]).filter(item=>gathered.includes(item.text)),[gathered]);
  const missing=chain.filter(item=>!gathered.includes(item.text));
  const next=chain.find(item=>gathered.includes(item.text)&&!placed.includes(item.text));
  const complete=missing.length===0&&placed.length===chain.length;
  const choose=(text:string)=>{
    if(!next||placed.includes(text))return;
    if(text===next.text){setPlaced(old=>[...old,text]);setFeedback('证物归位。案件与论文之间的路又接通了一段。');window.dispatchEvent(new CustomEvent('lary-paper-place'))}
    else setFeedback('这条线索会在后面派上用场。先找能直接回答当前问题的那一张。');
  };

  return <section className="review-page">
    <aside className="review-story-prologue"><Character name="phebe-investigate" alt="菲比重新打开案件卷宗"/><div><small>菲比 · 重开卷宗</small><p>“先从那晚说起。手电筒照到糯糯和空瓶时，我们以为只是在查一桩‘下药案’。”</p><p>可监控里的机器人，把案件推向了更难的问题：<b>它观察人类后，究竟学会了动作，还是只记住了画面变化？</b></p></div></aside>
    <div className="review-story-ribbon" aria-label="案件经过">{caseBeats.map((beat,index)=><article key={beat.label}><span>{index+1}</span><div><small>{beat.label}</small><p>{beat.text}</p></div></article>)}</div>
    <header className="review-head"><div><small>CASE × PAPER REVIEW · 联合复盘</small><h2>把案件与论文证据拼成一条逻辑链</h2><p>案件先提出“机器人为什么会读懂人类动作”，论文再把这份怀疑变成可检验的证据链。现在由你把它们接起来。</p></div><span>{placed.length} / 10 已归位</span></header>

    <div className="review-board" aria-label="案件与论文逻辑链黑板">
      <div className="board-rail"/>
      {chain.map((item,index)=>{
        const value=placed.includes(item.text);
        return <div className={`board-slot ${value?'filled':''}`} key={item.text}><span>{String(index+1).padStart(2,'0')}</span>{value?<p>{item.text.replace(/^线索\d+：/,'')}</p>:<em>{item.text===next?.text?'等待当前线索':'· · ·'}</em>}</div>
      })}
    </div>

    {!complete&&<div className="review-workbench">
      <aside className="review-phebe"><Character name="phebe-investigate" alt="菲比在黑板旁引导复盘"/><div><small>菲比 · 复盘搭档</small><p>{next?next.question:'档案墙里还没有可以排列的线索。先回到前面的谜题收集证据吧。'}</p>{feedback&&<b>{feedback}</b>}</div></aside>
      {missing.length>0&&<div className="review-missing">档案墙还缺 {missing.length} 条线索。可以先排列已有证据；要完成整条逻辑链，需要回到对应谜题收集。</div>}
      <div className="review-clue-pool" aria-label="乱序线索池">{available.map(item=><button key={item.text} disabled={placed.includes(item.text)} onClick={()=>choose(item.text)}><span>档案卡</span>{item.text.replace(/^线索\d+：/,'')}</button>)}</div>
    </div>}

    {complete&&<div className="review-final"><Character name="phebe-snacks" alt="菲比完成最终复盘"/><div><small>菲比 · 最终总结</small><h3>案件与论文，在同一条证据链上结案。</h3><p>那晚，糯糯倒在空瓶旁；监控里的机器人观察倒水后，又模仿了“倒入某种东西”的动作。于是案件真正要问的，不再是谁碰过瓶子，而是：<b>机器人观察人类后究竟学到了什么？</b></p><p>没有动作标签的视频促使研究者学习潜在动作表示，但会重建画面不能替表示自证。LARYBench 因此用 attentive probe 检查“做什么”的语义分类，再用 MLP Action Expert 检查“怎么做”的连续控制。结果显示，通用视觉编码器在本基准的分类与平均回归上领先，部分 LAM 则呈现跨 stride 稳定性；量化容量、利用率与性能也并非单调。</p><p>最后，小瓶被确认只是虚构昏睡剂，糯糯醒了，机器人也不能仅凭一段像样的模仿就被判定“真正理解”。这就是整份卷宗留下的边界：<b>机器人会模仿，不代表机器人真的理解。</b>这里的“懂”，只指在既定评测协议下能够被解码出的动作信息。</p><button onClick={()=>window.dispatchEvent(new CustomEvent('lary-next-slide'))}>查看延伸材料 →</button></div></div>}
  </section>;
}
