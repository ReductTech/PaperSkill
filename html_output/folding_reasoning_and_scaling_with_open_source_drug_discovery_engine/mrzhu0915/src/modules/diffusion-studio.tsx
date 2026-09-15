import React, { useState } from 'react';
import { C, Choices, Feedback, Scene } from './shared-visual';

const known: [number, number][] = [[66,158],[110,112],[156,145],[205,96],[247,139],[292,103],[337,151],[116,205],[191,210],[276,204]];
const knownEdges = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[1,7],[7,8],[8,4],[4,9],[9,6]];
const target: [number, number][] = [[542,153],[590,111],[640,145],[689,95],[740,135],[791,88],[840,127],[893,91],[941,137],[642,207],[742,211],[844,204]];
const targetEdges = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[2,9],[9,10],[10,4],[6,11],[11,8]];
const atomColors = ['#e07a45','#3f6f9e','#d95f59','#7c3aed','#e0a047','#3f6f9e','#d95f59','#7c3aed','#e07a45','#228d5c','#e0a047','#228d5c'];
const elements = ['C','N','O','S'];

const trainStages = [
  { name: '① 干净真值 X₀', purpose: '先准备可用于监督的正确答案', action: '读取实验解析的完整全原子坐标 X₀', output: '干净目标结构' },
  { name: '② 划分掩码', purpose: '区分哪些结构固定、哪些需要生成', action: '用 m_known 标出已知原子，用 m_target 标出目标原子', output: '同一体系的条件区与目标区' },
  { name: '③ 加入噪声', purpose: '制造不同难度、且答案已知的恢复任务', action: '仅向目标坐标加入 σₜε，已知坐标保持不动', output: '带噪训练样本 Xₜ' },
  { name: '④ 预测恢复', purpose: '学习怎样利用分子条件纠正受损坐标', action: 'Dθ 读取 Xₜ、t、Sˢ、Zˢ 与已知结构，预测干净目标', output: '预测坐标 X̂₀' },
  { name: '⑤ 比较并学习', purpose: '把恢复错误转成参数更新信号', action: '主要在目标原子上比较 X̂₀ 与 X₀，并反向传播', output: '学会去噪的模型参数 θ' },
];

function line(c: CanvasRenderingContext2D, x1:number, y1:number, x2:number, y2:number, color:string, width=2, dash:number[]=[]){
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.strokeStyle=color; c.lineWidth=width; c.setLineDash(dash); c.lineCap='round'; c.stroke(); c.setLineDash([]);
}
function arrow(c: CanvasRenderingContext2D, x1:number, y1:number, x2:number, y2:number, color:string, width=3){
  line(c,x1,y1,x2,y2,color,width); const a=Math.atan2(y2-y1,x2-x1),r=9+width;
  c.beginPath(); c.moveTo(x2,y2); c.lineTo(x2-Math.cos(a-.48)*r,y2-Math.sin(a-.48)*r); c.lineTo(x2-Math.cos(a+.48)*r,y2-Math.sin(a+.48)*r); c.closePath(); c.fillStyle=color; c.fill();
}
function dot(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,stroke=C.white){
  c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=color; c.fill(); c.strokeStyle=stroke; c.lineWidth=1.5; c.stroke();
  c.beginPath(); c.arc(x-r*.3,y-r*.35,r*.22,0,Math.PI*2); c.fillStyle='rgba(255,255,255,.5)'; c.fill();
}
function label(c:CanvasRenderingContext2D,s:string,x:number,y:number,color=C.ink,size=14){
  c.fillStyle=color; c.font=`600 ${size}px "Segoe UI","Microsoft YaHei",sans-serif`; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,x,y);
}
function panel(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill='rgba(255,255,255,.84)'){
  c.fillStyle=fill; c.beginPath(); c.roundRect(x,y,w,h,14); c.fill(); c.strokeStyle=C.line; c.lineWidth=1.5; c.stroke();
}
function seeded(i:number){ return Math.sin(i*91.7)*.5+.5; }
function noisyPoint(i:number, strength:number):[number,number]{
  const x=target[i][0]+(seeded(i+2)-.5)*330*strength;
  const y=target[i][1]+(seeded(i+17)-.5)*235*strength;
  return [Math.max(482,Math.min(1024,x)),Math.max(98,Math.min(226,y))];
}
function drawKnown(c:CanvasRenderingContext2D){
  panel(c,24,50,382,218,'rgba(255,255,255,.86)');
  label(c,'已知结构条件｜m_known = 1',215,73,C.blue,16);
  knownEdges.forEach(([a,b])=>line(c,known[a][0],known[a][1],known[b][0],known[b][1],a>5?C.green:C.blue,a>5?4:7));
  known.forEach((q,i)=>{dot(c,q[0],q[1],i<7?11:9,i%4===0?C.purple:i>6?C.green:C.blue); if(i<7)label(c,['N','C','C','O','C','N','C'][i],q[0],q[1],C.white,8);});
  label(c,'固定不动，只提供结构上下文',215,247,C.muted,12);
}
function drawTarget(c:CanvasRenderingContext2D, pts:[number,number][], bonds:number, showElements:boolean, ghost=false){
  targetEdges.forEach(([a,b],i)=>{ if(bonds<=0)return; const opacity=Math.max(0,Math.min(1,bonds-(i>7?.22:0))); line(c,pts[a][0],pts[a][1],pts[b][0],pts[b][1],`rgba(${i<8?'76,92,112':'34,141,92'},${opacity})`,i<8?5:3); });
  pts.forEach((q,i)=>{dot(c,q[0],q[1],showElements?11:8,ghost?'rgba(104,119,143,.22)':atomColors[i],ghost?C.muted:C.white); if(showElements&&!ghost)label(c,elements[i%4],q[0],q[1],C.white,7);});
}
function LogicStrip({purpose,action,output}:{purpose:string;action:string;output:string}){
  return <div className="logic-strip"><div><b>为什么做</b><span>{purpose}</span></div><div><b>怎么做</b><span>{action}</span></div><div><b>得到什么</b><span>{output}</span></div></div>;
}

export function DiffusionStudioWidget(){
  const [mode,setMode]=useState(0);
  const [trainStep,setTrainStep]=useState(0);
  const [sampleStep,setSampleStep]=useState(0);
  const train=trainStages[trainStep];
  const p=sampleStep/20;
  const samplePhase=sampleStep===0?'随机噪声初始化':sampleStep<7?'校正整体位置':sampleStep<14?'形成主链与局部框架':sampleStep<20?'细化侧链与界面':'全原子候选完成';
  const samplePurpose=sampleStep===0?'在没有真实目标坐标时建立生成起点':sampleStep<20?'逐步降低坐标混乱并满足学到的关系约束':'得到可参与后续排序的完整结构';
  const sampleAction=sampleStep===0?'按随机seed初始化目标原子点云':`运行第 ${sampleStep} / 20 个去噪步骤；已知区保持固定`;
  const sampleOutput=sampleStep===0?'无化学键的随机目标点云':sampleStep<20?'更有结构、但仍在调整的中间坐标':'含主链、侧链和界面接触的候选';
  return <div>
    <Choices label="先选择要理解的过程" options={['训练：先加噪再学恢复','生成：从噪声逐步出结构']} value={mode} onChange={value=>{setMode(value);setTrainStep(0);setSampleStep(0);}} />
    <Scene label={mode===0?`扩散训练第${trainStep+1}步：${train.name}`:`扩散生成第${sampleStep}步：${samplePhase}`} draw={(c,w,h)=>{
      const bg=c.createLinearGradient(0,0,w,h); bg.addColorStop(0,'#edf4f6'); bg.addColorStop(.55,'#f7f3ec'); bg.addColorStop(1,'#f1eef8'); c.fillStyle=bg; c.fillRect(0,0,w,h);
      drawKnown(c); line(c,432,54,432,266,C.line,2,[6,7]); panel(c,452,50,604,218,'rgba(255,255,255,.74)');
      if(mode===0){
        label(c,'训练：答案已知，主动破坏后练习恢复',754,26,C.orange,16);
        if(trainStep===0){ drawTarget(c,target,1,true); label(c,'目标真值 X₀｜m_target = 1',752,74,C.green,15); label(c,'这里是实验结构提供的“正确答案”',752,245,C.muted,12); }
        if(trainStep===1){ drawTarget(c,target,1,true); label(c,'划分同一复合体中的已知区与目标区',752,74,C.blue,15); line(c,466,91,1038,91,C.orange,3,[6,6]); label(c,'左侧不加噪  ← 掩码边界 →  右侧需要学习生成',752,245,C.orange,12); }
        if(trainStep===2){
          const noisy=target.map((_,i)=>noisyPoint(i,1)); drawTarget(c,target,0,false,true); drawTarget(c,noisy,0,false);
          target.forEach((q,i)=>arrow(c,q[0],q[1],noisy[i][0],noisy[i][1],'rgba(240,126,71,.55)',2));
          label(c,'X₀ + σₜε  →  带噪坐标 Xₜ',752,74,C.orange,16); label(c,'灰色是原位置；彩色点是加噪后的目标原子',752,245,C.muted,12);
        }
        if(trainStep===3){
          const noisy=target.map((_,i)=>noisyPoint(i,1)); const pred=target.map((q,i):[number,number]=>[q[0]+(noisy[i][0]-q[0])*.28,q[1]+(noisy[i][1]-q[1])*.28]); drawTarget(c,noisy,0,false,true); drawTarget(c,pred,.45,false);
          noisy.forEach((q,i)=>arrow(c,q[0],q[1],pred[i][0],pred[i][1],C.orange,2)); panel(c,658,104,188,58,'rgba(39,68,110,.08)'); label(c,'去噪器 Dθ',752,123,C.blue,15); label(c,'读取 Xₜ、t、Sˢ、Zˢ',752,145,C.muted,11); label(c,'预测 X̂₀：坐标已向合理结构收敛',752,245,C.blue,12);
        }
        if(trainStep===4){
          const pred=target.map((q,i):[number,number]=>[q[0]+(seeded(i+22)-.5)*18,q[1]+(seeded(i+40)-.5)*15]); drawTarget(c,target,1,false,true); drawTarget(c,pred,1,true); pred.forEach((q,i)=>line(c,q[0],q[1],target[i][0],target[i][1],C.red,1.5,[3,3])); label(c,'比较 X̂₀ 与 X₀，只对目标区计算主要去噪损失',752,74,C.green,14); label(c,'红色短线是剩余误差；反向传播更新参数 θ',752,245,C.muted,12);
        }
        panel(c,112,284,856,42,'rgba(255,255,255,.88)'); trainStages.forEach((stage,i)=>{const x=188+i*177;if(i)line(c,x-135,305,x-32,305,i<=trainStep?C.green:C.line,4);dot(c,x,305,9,i<trainStep?C.green:i===trainStep?C.orange:C.light);label(c,stage.name.slice(2),x,325,i===trainStep?C.orange:C.muted,9);});
      }else{
        label(c,'推理：没有真实 X₀，直接从随机目标点云开始',754,26,C.blue,16);
        const current=target.map((_,i)=>noisyPoint(i,1-p));
        drawTarget(c,current,Math.max(0,(p-.28)*1.5),sampleStep>=14);
        if(sampleStep>0&&sampleStep<20){ current.forEach((q,i)=>{const previous=noisyPoint(i,Math.min(1,1-p+.05)); line(c,previous[0],previous[1],q[0],q[1],'rgba(240,126,71,.48)',2);}); }
        if(sampleStep>=14){ for(let i=0;i<3;i++){const a=current[[0,9,11][i]],anchor=known[[6,9,8][i]];line(c,anchor[0],anchor[1],a[0],a[1],sampleStep===20?C.green:'rgba(240,126,71,.6)',sampleStep===20?4:2,[5,5]);} }
        label(c,sampleStep===0?'随机seed决定初始点云':samplePhase,752,74,sampleStep===20?C.green:C.orange,16);
        label(c,sampleStep===20?'形成一个候选；更换seed可再采样':'每一步都读取学到的 Sˢ、Zˢ 与已知结构条件',752,245,sampleStep===20?C.green:C.muted,12);
        panel(c,492,284,524,42,'rgba(255,255,255,.88)'); ['噪声','整体','主链','侧链','完成'].forEach((name,i)=>{const x=548+i*103;if(i)line(c,x-72,305,x-30,305,p>=i/4?C.green:C.line,4);dot(c,x,305,9,p>=i/4?C.green:C.light);label(c,name,x,325,i===Math.min(4,Math.floor(p*4+.01))?C.orange:C.muted,9);});
      }
    }} />
    {mode===0 ? <>
      <Choices label="训练流程" options={trainStages.map(stage=>stage.name)} value={trainStep} onChange={setTrainStep}/>
      <div className="ctrl"><button type="button" onClick={()=>setTrainStep(s=>Math.min(4,s+1))} disabled={trainStep===4}>下一步</button><button type="button" onClick={()=>setTrainStep(0)}>从头开始</button><span>{trainStep+1} / 5 · 这一流程只在训练时拥有真实 X₀</span></div>
      <LogicStrip purpose={train.purpose} action={train.action} output={train.output}/>
      <Feedback tone={trainStep===4?'good':'neutral'}>{trainStep===0?'训练从真实结构开始，因此模型知道恢复目标是什么。':trainStep===1?'known与target掩码决定噪声和损失施加在哪些原子上。':trainStep===2?'现在才真正执行“增加噪声”：只有target坐标被破坏，known坐标完全保留。':trainStep===3?'模型练习利用时间、关系表示和已知结构恢复干净目标。':'预测与真值的差产生训练信号；大量样本反复训练后，模型才具备推理时的去噪能力。'}</Feedback>
    </> : <>
      <div className="ctrl"><label htmlFor="diff-step-v3">生成去噪步数 {sampleStep}</label><input id="diff-step-v3" type="range" min="0" max="20" value={sampleStep} onChange={e=>setSampleStep(Number(e.target.value))}/><button type="button" onClick={()=>setSampleStep(s=>Math.min(20,s+1))} disabled={sampleStep===20}>下一步</button><button type="button" onClick={()=>setSampleStep(0)}>重置</button></div>
      <LogicStrip purpose={samplePurpose} action={sampleAction} output={sampleOutput}/>
      <Feedback tone={sampleStep===20?'good':'neutral'}><strong>{samplePhase}：</strong>{sampleStep===0?'推理时没有干净目标可供加噪，因此直接初始化随机坐标。':sampleStep<7?'点云先调整到与已知骨架和全局关系相容的大致区域。':sampleStep<14?'主链和局部框架逐渐出现，分支仍在调整。':sampleStep<20?'侧链、原子类型和跨界面接触继续细化。':'去噪降低了坐标混乱并形成一个全原子候选；论文默认20步、每个条件采样5个候选。'}</Feedback>
    </>}
  </div>;
}
