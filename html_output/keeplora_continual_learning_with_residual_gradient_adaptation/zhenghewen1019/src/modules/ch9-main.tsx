import { useState } from 'react';
import { StudyCanvas,palette,drawPaper,drawMask,drawLabel } from './studio-kit';

export function Ch9Main(){
  const [strong,setStrong]=useState(false),[stage,setStage]=useState(0);
  const task=stage===4?(strong?3:6):stage, k=Math.min(8,2+task*(strong?2:1)), remaining=8-k;
  return <div>
    <div className="ctrl"><button className={`chip ${!strong?'selected':''}`} aria-pressed={!strong} onClick={()=>setStrong(false)}>弱保护：每任务 +1 维</button><button className={`chip ${strong?'selected':''}`} aria-pressed={strong} onClick={()=>setStrong(true)}>强保护：每任务 +2 维</button><button className="tiny ghost" onClick={()=>{setStrong(false);setStage(0);}}>重置</button></div>
    <div className="chip-row">{['预训练','任务 1','任务 2','任务 3','容量耗尽'].map((label,i)=><button className={`chip ${stage===i?'selected':''}`} aria-pressed={stage===i} onClick={()=>setStage(i)} key={label}>{label}</button>)}</div>
    <StudyCanvas ariaLabel={`八维教学空间，预训练保护两维，当前保护 ${k} 维，剩余 ${remaining} 维`} draw={c=>{
      drawPaper(c,32,28,448,224);for(let i=0;i<8;i++){const x=63+i*48;c.strokeStyle=i<k?palette.blue:palette.green;c.lineWidth=3;c.beginPath();c.moveTo(x,201);c.lineTo(x+20,76);c.stroke();if(i<k)drawMask(c,x-7,59,39,161);}
      drawLabel(c,'已保护轮廓',66,48);drawLabel(c,'可用方向',574,48);
      for(let i=0;i<8;i++){c.fillStyle=i<k?palette.blue:palette.green;c.globalAlpha=i<k?.24:1;c.beginPath();c.roundRect(578+i*56,81,39,132,5);c.fill();c.globalAlpha=1;c.strokeStyle=i<k?palette.blue:palette.green;c.lineWidth=2;c.stroke();}
    }}/>
    <div className="metrics"><div className="metric"><div className="l">保护维数 k</div><div className="v">{k} / 8</div></div><div className="metric"><div className="l">基矩阵标量数 8k</div><div className="v">{8*k}</div></div><div className="metric"><div className="l">剩余可更新维数</div><div className="v">{remaining}</div></div></div>
    <div className={`feedback ${remaining?'good':'bad'}`} role="status">当前为{task===0?'预训练起点':`第 ${task} 个任务之后`}：2 + {task} × {strong?2:1} = {k} 个受保护方向。{remaining===0?'八个方向全部受保护，可行的更新只剩零向量。':`还剩 ${remaining} 个方向可以学习。`}</div>
    <p>这是 d = 8 的容量教学例子，弱保护每任务增加 1 维，强保护增加 2 维。对应的满容量时点分别是任务 6 和任务 3。论文实际新增维数由当前任务特征的残差能量决定；每层方向矩阵大小为 d × k，k ≤ d。</p>
    <details><summary>为什么先减去已有方向？</summary><p>对特征矩阵 X 计算 (I − QQᵀ)X，保留已有保护基没有覆盖的部分；再取残差的左奇异向量补充基。已覆盖能量与新增方向捕获的能量共同达到特征阈值 ε_f。来源：§3.2，公式 3–4；作者原版 prin_subspace.py。</p></details>
  </div>;
}
