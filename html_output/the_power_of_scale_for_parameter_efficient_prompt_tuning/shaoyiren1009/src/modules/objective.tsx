import {ObjectiveScene} from './VisualLessons';
import { useState } from 'react';
import { SceneCanvas, drawGarden, drawRobot, drawPrompt, drawTarget, C } from './GardenKit';

const records = [
  { name: 'Span Corruption', short: '片段补全', output: '可能复制输入或输出空串', description: '原始 T5 习惯补全被遮挡片段，并使用 sentinel。部分中等规模模型在提示调优时出现复制或空输出；这不意味着底座失去语言理解。' },
  { name: '目标加 Sentinel', short: '哨兵目标', output: '目标前加入 sentinel', description: '让下游目标带上 sentinel，尝试贴近既有读写习惯。这是目标格式比较，不能据此保证所有模型或任务都成功。' },
  { name: 'LM Adaptation', short: '语言续写', output: '更贴近自然文本生成', description: '交付之前，研究者用语言模型目标一次性适配底座，再把它冻结供各个任务使用。论文中通常更利于软提示控制；XXL 对设置更加宽容。' },
];

export function ObjectiveWidget() {
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState(100000);
  const record = records[index];
  return <div className="experiment">
    <p>翻阅出厂档案：这些是上游已经准备好的设置。你的机器人核心仍保持只读。</p>
    <div className="trainer-controls" aria-label="比较出厂读写目标">{records.map((r, i) => <button key={r.name} className={`trainer-button ${index === i ? 'is-selected' : ''}`} aria-pressed={index === i} onClick={() => setIndex(i)}>{r.name}</button>)}</div>
    <ObjectiveScene index={index} steps={steps}/>
    <div className="trainer-feedback" role="status">{record.description}</div>
    {index === 2 && <><p>选择论文比较过的上游适配步数，查看它们在流程中的位置：</p><div className="trainer-controls">{[0,10000,50000,100000].map(n => <button key={n} className={`trainer-button ${steps === n ? 'is-selected' : ''}`} aria-pressed={steps === n} onClick={() => setSteps(n)}>{n === 0 ? '0 步' : `${n / 1000}K 步`}</button>)}</div><p className="trainer-output">出厂档案：{steps.toLocaleString()} 步 → 冻结底座 → 只学习下游提示。{steps === 0 ? '0 步表示没有 LM 适配。' : '步数增加需要上游训练成本；这里不展示未列表的精确分数。'}</p></>}
    <p className="evidence-note">论文 p3–6，§2.2 / §3.2，Figure 3(c,d)。以上展示读写习惯与趋势，不是在线 T5 推理或真实训练动画。上游 LM 适配会更新底座；Robot Prompt Trainer 不执行该训练。</p>
  </div>;
}
