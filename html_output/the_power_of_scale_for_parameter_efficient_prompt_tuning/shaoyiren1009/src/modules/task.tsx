import {SpeechScene} from './VisualLessons';
import { useState } from 'react'
import { SceneCanvas, drawGarden, drawRobot, drawPrompt, drawTarget, C } from './GardenKit'

export function TaskWidget() {
  const [task, setTask] = useState(0)
  const [guided, setGuided] = useState(false)
  const choose = (value: number) => { setTask(value); setGuided(false) }
  const input = task === 0 ? '今天终于看到花开了。' : '甲：桃花开了。乙：桃树开出了花。'
  const output = guided ? (task === 0 ? '正面' : '同义') : (task === 0 ? '这句话表达了等待之后的喜悦。' : '两句话都在描述桃花开放。')
  return <div className="experiment">
    <SpeechScene title={task===0?"当前任务：判断情绪":"当前任务：判断同义"} input={input} output={output} guided={guided} prompt={guided?(task===0?"只输出正面或负面":"只输出同义或不同义"):"尚未交付标签约定"}/>
    <div className="trainer-controls" aria-label="选择任务">{['判断情绪','判断同义'].map((label,i)=><button key={label} className={'trainer-button '+(task===i?'is-selected':'')} aria-pressed={task===i} onClick={()=>choose(i)}>{label}</button>)}</div>
    <p className="trainer-output">输入：{input}</p>
    <div className="trainer-controls"><button className="trainer-button" onClick={()=>setGuided(true)}>交付任务约定</button><button className="trainer-button" onClick={()=>setGuided(false)}>移除任务约定</button></div>
    <p className="trainer-feedback" role="status">{guided?'任务明确后，同一个语言底座可以朝不同输出约定工作。':'我能谈论这句话，但尚不知道要输出哪类标签。'}</p>
    <p className="trainer-output">机器人示例回答：<strong>{output}</strong></p>
    <p className="evidence-note">脚本化教学示例，未调用真实语言模型。任务约定不改变基础能力；真实效果仍需实验验证。论文 §1，pp.1–2。</p>
  </div>
}
