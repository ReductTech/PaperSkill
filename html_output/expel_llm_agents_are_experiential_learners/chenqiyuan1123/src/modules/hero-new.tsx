import React, { useEffect, useRef, useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

type KitchenState = 'ready' | 'cabinet' | 'stove';
const sceneColors = { ink: '#27446e', good: '#228d5c', bad: '#c43f52', warm: '#f07e47' };

function Kitchen({ state, compact = false }: { state: KitchenState; compact?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const formerPosition = useRef(330);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const from = formerPosition.current;
    const target = state === 'cabinet' ? 177 : state === 'stove' ? 477 : 330;
    const start = performance.now();
    let frame = 0;
    const paint = (now: number) => {
      const p = Math.min(1, (now - start) / 370);
      const x = from + (target - from) * (1 - (1 - p) ** 3);
      formerPosition.current = x;
      ctx.clearRect(0, 0, 640, 310);
      function box(x0:number, y:number, w:number, h:number, color:string, radius=0) {
        ctx!.fillStyle = color;
        ctx!.beginPath();
        ctx!.roundRect(x0,y,w,h,radius);
        ctx!.fill();
      }
      function stroke(color:string, width:number, points:[number,number][]) {
        ctx!.beginPath();
        ctx!.strokeStyle=color;
        ctx!.lineWidth=width;
        ctx!.lineCap='round';
        for(const [i,[a,b]] of points.entries()) i ? ctx!.lineTo(a,b) : ctx!.moveTo(a,b);
        ctx!.stroke();
      }
      box(0,0,640,310,'#edf1e8',22);
      for(let i=0;i<640;i+=40) {
        stroke('#e2e8dd',1,[[i,0],[i,225]]);
      }
      for(let i=10;i<230;i+=34) stroke('#e2e8dd',1,[[0,i],[640,i]]);
      box(0,253,640,57,'#d9e1d1');
      box(51,25,153,101,'#becdb8',8);
      box(59,33,137,85,'#dcebe3',4);
      stroke('#a7baa8',4,[[127,35],[127,116]]);
      stroke('#a7baa8',4,[[60,76],[194,76]]);
      box(36,139,568,15,'#815d44',4);
      box(45,154,550,101,'#a9bb9d',5);
      for(const side of [54,143,232,321,410,499]) {
        box(side,160,80,87,'#c2d1b8',5);
        box(side+27,172,26,5,'#678361',3);
      }
      if(state==='cabinet') {
        box(145,160,78,88,'#634e3e',4);
        box(126,160,27,88,'#d0a383',4);
        stroke('#ba9b81',4,[[153,205],[220,205]]);
      }
      box(407,123,157,16,'#68778f',5);
      for(const burner of [427,502]) box(burner,124,46,6,'#c8d2dd',3);
      box(507,96,35,24, state==='stove' ? sceneColors.good : '#76906a',7);
      box(500,95,49,6,'#435966',3);
      box(520,89,10,6,'#435966',3);
      stroke('#697e77',4,[[542,105],[554,105]]);
      if(state==='stove') {
        for(const sh of [512,526,538]) stroke('#87bf9f',3,[[sh,84],[sh-3,77],[sh+3,68]]);
      }
      box(263,115,74,12,'#7d9781',5);
      box(280,91,5,28,'#7d9781',2);
      box(280,89,25,5,'#7d9781',2);
      box(345,117,42,18,'#b87952',4);
      box(351,108,31,10,'#cd9f78',3);
      box(x-19,205,38,52,sceneColors.ink,12);
      box(x-13,183,26,27,'#dcae87',11);
      box(x-16,181,33,11,'#304455',5);
      stroke(sceneColors.ink,8,[[x-9,252],[x-11,280]]);
      stroke(sceneColors.ink,8,[[x+9,252],[x+11,280]]);
      stroke('#dcae87',7,[[x+16,223],[x+30,212],[x+32,state==='ready'?216:201]]);
      if(state !== 'ready') {
        const mx = state==='cabinet' ? 195 : 519;
        box(mx-14, state==='cabinet'?113:37,34,32,state==='cabinet'?sceneColors.bad:sceneColors.good,10);
        ctx.fillStyle='#fff';
        ctx.font='bold 25px sans-serif';
        ctx.textAlign='center';
        ctx.fillText(state==='cabinet'?'×':'✓',mx+3,state==='cabinet'?138:62);
      }
      if(p<1) frame=requestAnimationFrame(paint);
    };
    frame=requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  },[state]);
  const label = state === 'cabinet' ? '打开柜门，没有锅' : state === 'stove' ? '在炉台找到锅' : '站在厨房操作台前';
  return <canvas ref={ref} width={640} height={310} role="img" aria-label={label} className={compact?'expel-kitchen expel-kitchen-compact':'expel-kitchen'}/>;
}

function CoverKitchen({ memory }: { memory: boolean }) {
  const { progress } = useCoverPlayback();
  const state: KitchenState = progress < .28 ? 'ready' : memory ? 'stove' : 'cabinet';
  const caption = state==='ready' ? '同一个新任务：找到锅' : memory ? '读到规则与示范 → 先查炉台' : '参考固定示范 → 先查柜门';
  return <div className="expel-cover-kitchen">
    <Kitchen state={state} compact />
    <p style={{color:state==='ready'?sceneColors.ink:memory?sceneColors.good:sceneColors.bad}}>{caption}</p>
  </div>;
}
export function HeroOld() { return <CoverKitchen memory={false}/>; }
export function HeroNew() { return <CoverKitchen memory/>; }

const memories = [
  {button:'固定示范', headline:'ReAct · 当前上下文', state:'cabinet' as const, text:'依据固定示范和当前观测行动。一次运行中可以边观察边调整。', retained:'任务描述、固定示范、本次的行动与观测'},
  {button:'重试同一题', headline:'Reflexion · 反思', state:'stove' as const, text:'上一轮找锅失败后，把原因写进反思，下一轮重试同一任务。', retained:'额外传入这道题前几轮的反思'},
  {button:'尝试新任务', headline:'ExpeL · 跨任务记忆', state:'stove' as const, text:'下一道厨房任务来到时，先读回可复用的找物规则与相似示范。', retained:'训练任务的归纳规则、相似成功轨迹'},
];

export function Baseline() {
  const [index,setIndex] = useState(0);
  const selected=memories[index];
  return <div className="expel-baseline">
    <div className="expel-control" aria-label="策略选择">{memories.map((m,i)=><button key={m.button} type="button" aria-pressed={index===i} onClick={()=>setIndex(i)}>{m.button}</button>)}</div>
    <div className="expel-baseline-content">
      <Kitchen key={index===2?'new':'same'} state={selected.state}/>
      <div className="expel-notecards">
        <h3>{selected.headline}</h3>
        <p>{selected.text}</p>
        <div className="expel-ledger"><strong>带入执行的上下文</strong><p>{selected.retained}</p></div>
      </div>
    </div>
    <p className="expel-source">厨房情景为机制示意，动作结果由演示设定。</p>
  </div>;
}

const attempts = [
  {state:'ready' as const, title:'待尝试', result:'任务：从厨房找到一口锅。', reflection:'', label:'执行第一次尝试'},
  {state:'cabinet' as const, title:'第 1 次失败', result:'打开柜门 → 无锅。失败轨迹入池。', reflection:'先从锅常用的位置找，例如炉台。', label:'带反思重试'},
  {state:'stove' as const, title:'第 2 次成功', result:'检查炉台 → 找到锅。成功轨迹入池。', reflection:'可把两条轨迹配成同题对照。', label:'重置演示'},
];

export function Gather() {
  const [attempt, setAttempt]=useState(0);
  const current=attempts[attempt];
  return <div className="expel-gather">
    <div className="expel-gather-main">
      <Kitchen state={current.state}/>
      <div className="expel-control">
        <button type="button" onClick={()=>setAttempt((attempt+1)%attempts.length)}>{current.label}</button>
        <span aria-live="polite" style={{color:[sceneColors.ink,sceneColors.bad,sceneColors.good][attempt]}}>{current.title}</span>
      </div>
    </div>
    <div className="expel-notecards">
      <h3>本题经验池 · {attempt} 条</h3>
      <div className="expel-ledger">
        <p aria-live="polite">{current.result}</p>
        {attempt===2 && <p>保留上一条失败轨迹，供后续比较。</p>}
      </div>
      <div className="expel-ledger expel-reflection">
        <strong>{attempt===2?'进入规则提炼':'供本题重试的反思'}</strong>
        <p>{current.reflection || '第一次执行前，反思为空。'}</p>
      </div>
    </div>
  </div>;
}
