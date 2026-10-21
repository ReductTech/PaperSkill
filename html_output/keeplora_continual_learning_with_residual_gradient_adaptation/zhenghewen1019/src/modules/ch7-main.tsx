import { useState } from 'react';
import { StudyCanvas, palette, drawPaper, drawGuide, drawPencil, drawTarget, drawLabel } from './studio-kit';

export function Ch7Main() {
  const [eta, setEta] = useState(.25);
  const [values, setValues] = useState([0]);
  const b = values[values.length - 1], step = values.length - 1;
  const loss = .5 * (b - 2) ** 2;
  const reset = () => { setEta(.25); setValues([0]); };
  return <div>
    <div className="ctrl"><label htmlFor="ch7-rate">学习率 η</label><input id="ch7-rate" aria-label="学习率" type="range" min=".10" max="1" step=".05" value={eta} onChange={e => { setEta(Number(e.target.value)); setValues([0]); }} /><output className="val">{eta.toFixed(2)}</output><button className="tiny" disabled={step >= 8} onClick={() => setValues(v => [...v, v[v.length - 1] - eta * (v[v.length - 1] - 2)])}>训练一步</button><button className="tiny ghost" onClick={reset}>重置</button></div>
    <StudyCanvas ariaLabel="固定导轨上的笔画长度与平方损失轨迹，左侧笔画接近目标，右侧损失随训练步数下降" draw={c => {
      drawPaper(c,32,30,448,218); drawGuide(c,68,174,366); drawTarget(c,409,151);
      c.strokeStyle=palette.border; c.lineWidth=6; c.beginPath(); c.moveTo(79,151); c.lineTo(409,151); c.stroke();
      c.strokeStyle=palette.green; c.beginPath(); c.moveTo(79,151); c.lineTo(79+b/2*330,151); c.stroke(); drawPencil(c,94+b/2*330,151,-.55);
      drawLabel(c,'固定方向',65,68); drawLabel(c,'平方损失',576,50);
      c.strokeStyle=palette.border; c.lineWidth=1; c.beginPath(); c.moveTo(580,70); c.lineTo(580,230); c.lineTo(1025,230); c.stroke();
      c.strokeStyle=palette.green; c.lineWidth=3; c.beginPath(); values.forEach((v,i) => {const x=580+i/8*445, y=230-(.5*(v-2)**2)/2*155; if(i===0)c.moveTo(x,y); else c.lineTo(x,y);}); c.stroke();
      values.forEach((v,i) => {c.fillStyle=i===step?palette.orange:palette.green; c.beginPath();c.arc(580+i/8*445,230-(.5*(v-2)**2)/2*155,5,0,Math.PI*2);c.fill();});
    }}/>
    <div className="metrics"><div className="metric"><div className="l">训练步数</div><div className="v">{step} / 8</div></div><div className="metric"><div className="l">当前幅度 b</div><div className="v">{b.toFixed(4)}</div></div><div className="metric"><div className="l">平方损失 L</div><div className="v">{loss.toFixed(6)}</div></div></div>
    <div className="feedback good" role="status">固定 A = e₃，受保护的 e₁、e₂ 方向分量始终为 0。{step === 0 ? '初始 b = 0，目标 b = 2，损失为 2。' : `上一步 b = ${values[step-1].toFixed(4)}，梯度为 ${(values[step-1]-2).toFixed(4)}；本步 b = ${b.toFixed(4)}。`}{step === 8 && ' 已完成 8 步，可重置或改变学习率重新运行。'}</div>
    <p>教学例子采用 L = ½(b − 2)²，因此 b ← b − η(b − 2)。学习率越大，每一步走得越远；η = 1 时一步到达目标，后续梯度为 0。改变学习率会从 b = 0 重新开始。</p>
    <details><summary>论文训练与这个例子的对应关系</summary><p>图文分类训练使用交叉熵，作者配置使用 AdamW。命题 3.1 在普通梯度下降下给出投影更新公式。固定 A 使权重变化保留在 A 的列空间内，这是各训练步共有的方向约束。来源：§3.2、命题 3.1、附录 B.4。</p></details>
  </div>;
}
