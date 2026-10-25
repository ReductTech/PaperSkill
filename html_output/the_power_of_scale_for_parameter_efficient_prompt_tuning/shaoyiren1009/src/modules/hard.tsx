import {SpeechScene} from './VisualLessons';
import { useState } from 'react'
import { SceneCanvas, drawGarden, drawRobot, drawTarget, C } from './GardenKit'

const choices=['没有任务签','帮我看看','只输出正面或负面']
const outputs=['明天也会有花开吗？','这句话让我感到喜悦。','正面']
export function HardWidget(){
  const [choice,setChoice]=useState(0)
  return <div className="experiment">
    <SpeechScene title="人工设计的文字提示" input="今天终于看到花开了。" output={outputs[choice]} guided={choice===2} prompt={choices[choice]}/>
    <p className="trainer-output">输入：今天终于看到花开了。</p>
    <div className="trainer-controls" aria-label="人工设计文字提示">{choices.map((label,i)=><button key={label} className={'trainer-button '+(choice===i?'is-selected':'')} aria-pressed={choice===i} onClick={()=>setChoice(i)}>{label}</button>)}</div>
    <p className="trainer-feedback" role="status">{choice===2?'输出约定明确时，示例回答是“正面”；真实模型仍可能失败，本文不承诺文字提示始终成功。':choice===1?'“帮我看看”没有限定任务与标签，示例仍给出自由解释。':'“今天终于看到花开了”可以被续写、解释，也可以被分类。'}</p>
    <p className="trainer-output">机器人示例回答：<strong>{outputs[choice]}</strong></p>
    <p className="evidence-note">脚本化教学示例，非真实模型实验。Hard Prompt 从离散词表选择文字；这里不更新词嵌入。论文 §1 讨论人工提示设计的局限，并未证明每个文字提示都不稳定。</p>
  </div>
}
