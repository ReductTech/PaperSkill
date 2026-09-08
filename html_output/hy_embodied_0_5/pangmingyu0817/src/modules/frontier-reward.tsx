import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 920, H = 420;
const colors = { bg:'#f5f8f0', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', purple:'#7c3aed', text:'#21324a', muted:'#68778f', line:'#d7deea' };
type ScenarioKey = 'easyBox'|'frontierPoint'|'frontierTrajectory'|'frontierRegression'|'frontierFixed'|'frontierOpen'|'impossibleMaze';
type Scenario = { key: ScenarioKey; label: string; successes: number; output: string; reward: string; why: string };
const scenarios: Scenario[] = [
  { key:'easyBox', label:'全对·框', successes:8, output:'几何框', reward:'IoU / 匹配后 IoU', why:'本轮移除：已经饱和；奖励规则仍可预览。' },
  { key:'frontierPoint', label:'边界·点', successes:5, output:'定位点', reward:'归一化点距离', why:'保留：部分成功，位于当前能力边界。' },
  { key:'frontierTrajectory', label:'边界·轨迹', successes:6, output:'连续轨迹', reward:'DTW / Fréchet，可结合终点一致性', why:'保留：路径奖励区分部分正确与完全失败。' },
  { key:'frontierRegression', label:'边界·数值', successes:4, output:'连续数值', reward:'随相对误差平滑衰减', why:'保留：连续反馈比硬阈值更有信息。' },
  { key:'frontierFixed', label:'边界·固定答案', successes:3, output:'固定答案/离散序列', reward:'精确或混合匹配；序列相似度给部分分', why:'保留：答案结构明确，优先确定性评分。' },
  { key:'frontierOpen', label:'边界·开放题', successes:2, output:'开放式推理', reward:'规则不足，才使用 J(q,y,y*)', why:'保留：这是 LLM 裁判的兜底场景。' },
  { key:'impossibleMaze', label:'全错·迷宫', successes:0, output:'轨迹规划', reward:'DTW / Fréchet', why:'本轮移除：当前过难；奖励规则仍可预览。' }
];

function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r=12) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
}
function drawRewardExample(ctx: CanvasRenderingContext2D, s: Scenario) {
  const x=510,y=250,w=370,h=120; ctx.fillStyle='#fff'; roundRect(ctx,x,y,w,h); ctx.fill(); ctx.strokeStyle=colors.line; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=colors.text; ctx.font='700 16px system-ui'; ctx.fillText(`输出：${s.output}`,x+18,y+26);
  ctx.font='14px system-ui'; ctx.fillStyle=colors.muted; ctx.fillText(s.reward,x+18,y+50);
  if (s.key.includes('Trajectory') || s.key==='impossibleMaze') {
    ctx.strokeStyle=colors.muted; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.moveTo(x+25,y+96); ctx.bezierCurveTo(x+110,y+58,x+210,y+114,x+330,y+72); ctx.stroke();
    ctx.strokeStyle=colors.green; ctx.lineWidth=3; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(x+25,y+94); ctx.bezierCurveTo(x+120,y+70,x+224,y+102,x+330,y+68); ctx.stroke();
  } else if (s.key==='frontierOpen') {
    ctx.strokeStyle=colors.purple; ctx.lineWidth=2; roundRect(ctx,x+35,y+68,120,32,10); ctx.stroke(); roundRect(ctx,x+190,y+68,135,32,10); ctx.stroke();
  } else {
    ctx.fillStyle=colors.blue; ctx.fillRect(x+34,y+76,270,12); ctx.fillStyle=colors.orange; ctx.fillRect(x+34+270*s.successes/8-4,y+68,8,28);
  }
}
function draw(ctx: CanvasRenderingContext2D, s: Scenario) {
  ctx.clearRect(0,0,W,H); ctx.fillStyle=colors.bg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=colors.text; ctx.font='800 20px system-ui'; ctx.fillText('8 次候选尝试',30,38);
  for(let i=0;i<8;i++) { const ok=i<s.successes, x=54+i*52, y=88; ctx.beginPath(); ctx.arc(x,y,17,0,Math.PI*2); ctx.fillStyle=ok?'#e2f6ea':'#fde8ec'; ctx.fill(); ctx.strokeStyle=ok?colors.green:colors.red; ctx.lineWidth=3; ctx.stroke(); ctx.fillStyle=ok?colors.green:colors.red; ctx.font='800 16px system-ui'; ctx.textAlign='center'; ctx.fillText(ok?'✓':'×',x,y+6); }
  ctx.textAlign='left'; ctx.font='700 17px system-ui'; ctx.fillStyle=colors.text; ctx.fillText(`${s.successes}/8 成功`,480,94);
  const bandX=30, bandY=154, bandW=850, seg=bandW/3; const labels=['已掌握：全对','当前能力边界：部分成功','暂不可达：全错']; const fills=['#eaf0f7','#e2f6ea','#fde8ec'];
  labels.forEach((v,i)=>{ctx.fillStyle=fills[i];ctx.fillRect(bandX+i*seg,bandY,seg,64);ctx.strokeStyle=colors.line;ctx.strokeRect(bandX+i*seg,bandY,seg,64);ctx.fillStyle=colors.text;ctx.font='700 14px system-ui';ctx.fillText(v,bandX+i*seg+15,bandY+36);});
  const zone=s.successes===8?0:s.successes===0?2:1; const pointer=bandX+zone*seg+seg/2; ctx.fillStyle=colors.orange; ctx.beginPath();ctx.moveTo(pointer-10,bandY-13);ctx.lineTo(pointer+10,bandY-13);ctx.lineTo(pointer,bandY-2);ctx.closePath();ctx.fill();
  ctx.strokeStyle=colors.orange;ctx.lineWidth=4;ctx.strokeRect(bandX+zone*seg+2,bandY+2,seg-4,60);
  ctx.fillStyle='#fff';roundRect(ctx,30,250,440,120);ctx.fill();ctx.strokeStyle=colors.line;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=colors.text;ctx.font='800 18px system-ui';ctx.fillText(s.successes===8?'移除：已经饱和':s.successes===0?'移除：当前过难':'保留：当前能力边界',50,282);ctx.font='15px system-ui';ctx.fillStyle=colors.muted;ctx.fillText('每个 RL 阶段刷新 50K 条，并平衡能力维度。',50,314);ctx.fillText(s.successes===0||s.successes===8?'本轮不进入 RL 数据。':'部分成功提供组内相对信号。',50,344);
  drawRewardExample(ctx,s); ctx.fillStyle=colors.muted;ctx.font='13px system-ui';ctx.fillText('教学示意：一次点击不代表实际训练结果',30,405);
}

export const FrontierReward: React.FC<WidgetProps> = ({chapterId,moduleId}) => {
  const ref=useRef<HTMLCanvasElement>(null); const [selectedScenario,setSelectedScenario]=useState<ScenarioKey>('frontierTrajectory');
  const current=scenarios.find(s=>s.key===selectedScenario)!;
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,W,H);canvas.style.width='100%';canvas.style.height='auto';}catch{return;}let raf=0;const render=()=>{draw(ctx,current);canvas.classList.add('is-ready');};const start=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;render();});};const stop=()=>{cancelAnimationFrame(raf);raf=0;};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect();};},[current]);
  const onCanvas=(e:React.MouseEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect();const x=(e.clientX-rect.left)*W/rect.width;if(x<30||x>890)return;const i=Math.max(0,Math.min(6,Math.floor((x-30)/123)));setSelectedScenario(scenarios[i].key);};
  return <div>
    <div className="chip-row" role="group" aria-label="选择候选任务">{scenarios.map(s=><button key={s.key} className={`chip ${s.key===selectedScenario?'selected':''}`} aria-pressed={s.key===selectedScenario} onClick={()=>setSelectedScenario(s.key)}>{s.label}</button>)}</div>
    <canvas ref={ref} id={`cv-${chapterId}-${moduleId}`} width={W} height={H} onClick={onCanvas} role="img" aria-label={`8 次尝试成功 ${current.successes} 次；${current.why} 奖励为 ${current.reward}。`} />
    <div className={`feedback ${current.successes>0&&current.successes<8?'good':'bad'}`} aria-live="polite"><b>{current.why}</b> 奖励：{current.reward}</div>
    <div className="metrics"><div className="metric"><div className="l">样本筛选</div><div className="v">{current.successes===8?'全对':current.successes===0?'全错':'部分成功'}</div></div><div className="metric"><div className="l">输出结构</div><div className="v" style={{fontSize:18}}>{current.output}</div></div><div className="metric"><div className="l">论文设置</div><div className="v" style={{fontSize:18}}>G=16 · 5 epoch</div></div></div>
    <p style={{fontSize:14,color:colors.muted}}>可解析任务不启用 LLM 裁判，因为论文优先使用确定性奖励；开放题无法可靠规则化时，才使用裁判兜底。有效非对称裁剪范围为 [0.8,1.35]。</p>
  </div>;
};
export default FrontierReward;
