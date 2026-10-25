import { useState } from 'react';
import { StudyCanvas, palette, drawPaper, drawPencil, drawArrow, drawTarget, drawLabel } from './studio-kit';

export function Ch5Main(){
  const [rank,setRank]=useState(1),[angle,setAngle]=useState(0);
  const radians=angle*Math.PI/180,captured=rank===2?17:16*Math.cos(radians)**2+Math.sin(radians)**2;
  const percent=captured/17*100;
  const reset=()=>{setRank(1);setAngle(0);};
  return <>
    <div className="chip-row" role="group" aria-label="低秩支路选择方向数">{[1,2].map(n=><button key={n} className={`chip ${rank===n?'selected':''}`} aria-pressed={rank===n} onClick={()=>setRank(n)}>{n} 个方向</button>)}</div>
    <StudyCanvas ariaLabel={`选取${rank}个方向，捕获梯度能量${captured.toFixed(2)}，占残差总能量的${percent.toFixed(2)}%。`} draw={c=>{
      drawPaper(c,24,20,480,240);drawPaper(c,536,20,520,240);
      drawLabel(c,'选定方向',48,48);drawLabel(c,'捕获能量',562,48);
      const x=182,y=214;c.strokeStyle=palette.border;c.lineWidth=1;c.beginPath();c.moveTo(x,65);c.lineTo(x,y);c.lineTo(440,y);c.stroke();
      drawArrow(c,x,y,x+208,y,palette.blue,7);drawArrow(c,x,y,x,y-52,palette.blue,4);
      if(rank===2){drawArrow(c,x,y,x+166,y,palette.green,4);drawArrow(c,x,y,x,y-128,palette.green,4);drawTarget(c,x+166,y);drawTarget(c,x,y-128);drawPencil(c,x+180,y,-.6,palette.green);}
      else{const px=x+150*Math.cos(radians),py=y-150*Math.sin(radians);drawArrow(c,x,y,px,py,palette.green,5);drawTarget(c,px,py);drawPencil(c,px+12,py,py<110?.5:-.5,palette.green);}
      const bx=576,bw=434;c.fillStyle=palette.border;c.fillRect(bx,91,bw,44);c.fillStyle=palette.blue;c.fillRect(bx,91,bw,44);c.fillStyle='#d7deea66';c.fillRect(bx,169,bw,44);c.fillStyle=palette.green;c.fillRect(bx,169,bw*captured/17,44);
    }}/>
    <div className="ctrl"><label htmlFor="ch5-angle">偏转角 θ</label><input id="ch5-angle" aria-label="偏转角，度" type="range" min={0} max={90} step={1} value={angle} disabled={rank===2} onChange={event=>setAngle(Number(event.target.value))}/><output className="val" htmlFor="ch5-angle">{angle}°</output><button className="tiny ghost" onClick={reset}>重置方向</button></div>
    <div className="chip-row" role="group" aria-label="角度示例">{[0,45,90].map(n=><button key={n} className={`chip ${rank===1&&angle===n?'selected':''}`} disabled={rank===2} onClick={()=>setAngle(n)}>{n}°</button>)}</div>
    <p>教学残差梯度的两项幅值为 4 和 1，总能量为 4²+1²=17。</p>
    <div className="ctrl"><span>蓝色：全部残差　绿色：选定空间保留的部分</span></div>
    <div className="metrics"><div className="metric"><div className="l">捕获能量</div><div className="v">{captured.toFixed(2)} / 17</div></div><div className="metric"><div className="l">捕获比例</div><div className="v">{percent.toFixed(2)}%</div></div><div className="metric"><div className="l">残差未捕获能量</div><div className="v">{(17-captured).toFixed(2)}</div></div></div>
    <div className="feedback good" aria-live="polite">{rank===2?'两个方向已覆盖整个残差平面，角度控制停用。A=[e₃,e₄]，捕获能量为 17，比例为 100%。':`a=cos(${angle}°)e₃+sin(${angle}°)e₄。捕获能量为 16cos²(${angle}°)+sin²(${angle}°)=${captured.toFixed(2)}。`}</div>
    <p>当只能选 1 个方向时，0° 对应最大奇异方向，保留 16/17≈94.12% 的残差能量。45° 为 50%，90° 为 5.88%。先投影确定可行空间，再由梯度强弱决定优先方向。论文 §3.2，式 (6) 与命题 3.2。</p>
  </>;
}
