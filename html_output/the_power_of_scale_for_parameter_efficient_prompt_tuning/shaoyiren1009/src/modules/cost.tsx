import {CostScene} from './VisualLessons';
import { useState } from 'react'
import { SceneCanvas, drawGarden, drawRobot, drawPrompt, C } from './GardenKit'

const format=(n:number)=>n.toLocaleString('en-US')
export function CostWidget() {
  const [tasks,setTasks]=useState(1)
  const [shared,setShared]=useState(false)
  const base=11_000_000_000, perPrompt=5*4096
  const full=tasks*base, prompts=tasks*perPrompt
  const total=shared?base+prompts:full
  return <div className="experiment">
    <CostScene tasks={tasks} shared={shared}/>
    <div className="trainer-controls" aria-label="任务数量">{[1,5,20].map(n=><button key={n} className={'trainer-button '+(tasks===n?'is-selected':'')} aria-pressed={tasks===n} onClick={()=>setTasks(n)}>{n}个任务</button>)}</div>
    <div className="trainer-controls" aria-label="参数保存方案"><button className={'trainer-button '+(!shared?'is-selected':'')} aria-pressed={!shared} onClick={()=>setShared(false)}>完整模型副本</button><button className={'trainer-button '+(shared?'is-selected':'')} aria-pressed={shared} onClick={()=>setShared(true)}>共享底座＋软提示</button><button className="trainer-button" onClick={()=>{setTasks(1);setShared(false)}}>重置比较</button></div>
    <p className="trainer-feedback" role="status">{shared?'共享底座，任务提示各存20,480参数；这是假定提示长5、维度4,096的参数比较。':'完整模型调优会为每个任务保留一份专用权重。'}</p>
    <p className="metric-line">每任务：{shared?'5 × 4,096 = 20,480':'约 11,000,000,000'} 参数</p>
    <p className="trainer-output">{shared?`共享底座约 ${format(base)} ＋ ${tasks} 份提示 ${format(prompts)}`:`${tasks} 份完整权重 × 约 ${format(base)}`} = <strong>约 {format(total)} 参数</strong></p>
    <p className="evidence-note">参数计数示意：XXL 底座按约 11B 计算，提示参数数为精确乘积。仅比较保存的参数，不代表内存字节数、训练时间或推理速度；仍需存储并运行底座。论文 Figure 2、Table 4。</p>
  </div>
}
