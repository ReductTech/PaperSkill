import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const stages = ['Literature', 'Ideation', 'Experiment', 'Writing', 'Rebuttal'];
const stageInfo = [
  '写入外部知识到长期记忆', '读取长期记忆，写入 Idea', '读取选中想法，写入带证据的 Experiment',
  '读取证据链，写入 Manuscript', '读取手稿、评审与旧经验，写入 Review'
];
const copy: Record<string, { label: string; intro: string }> = {
  'chap-1': { label: '会话保留度', intro: '移动滑杆，比较一次性上下文与可恢复工件的差别。' },
  'chap-2': { label: '记忆归类', intro: '点击卡片，判断它应放入长期知识页还是活跃项目页。' },
  'chap-3': { label: '关系热点', intro: '选择一种实体，查看它在研究页中可承担的关系。' },
  'chap-4': { label: '回流步进器', intro: '逐步翻页，观察知识如何激活项目、再由项目巩固回去。' },
  'chap-5': { label: 'Trust Guard 状态', intro: '切换写入状态，读懂门禁意味着什么。' },
  'chap-6': { label: '生命周期选择器', intro: '选择一个阶段，查看它与 SciMem 的明确读写交接。' },
  'chap-7': { label: '恢复控制台', intro: '选择恢复点，确认状态在瞬时对话之外保存。' },
  'chap-8': { label: 'DAG 操作图', intro: '选择对当前节点的动作；图并非固定链路。' },
  'chap-9': { label: '演化信号', intro: '选择信号来源，查看它进入哪一层的版本化改进。' }
};

export const AutoSciLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [value, setValue] = useState(42);
  const [choice, setChoice] = useState('Paper');
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('PASS');
  const [stage, setStage] = useState(0);
  const [action, setAction] = useState('继续');
  const conf = copy[chapterId] || copy['chap-1'];
  const output = useMemo(() => {
    if (chapterId === 'chap-1') return value < 45 ? '保留度低：会话关闭后只剩孤立片段。' : '保留度高：工件可被下一阶段定位并复用。';
    if (chapterId === 'chap-2') return ['Paper', 'Concept'].includes(choice) ? `${choice} → Long-Term Knowledge Memory` : `${choice} → Active Research Memory`;
    if (chapterId === 'chap-3') return `${choice} 可作为类型化实体，与主题、论文、方法或证据建立可查询关系。`;
    if (chapterId === 'chap-4') return ['长期聚合：来源材料提炼为主题/概念。', '激活：长期知识支撑项目 Idea。', '巩固：终态项目工件回写可复用痕迹。', '跨周期：评审与反驳教训服务后续项目。'][step];
    if (chapterId === 'chap-5') return status === 'PASS' ? 'PASS：通过形式与内容检查后进入可用图。' : status === 'ARN' ? 'ARN：保留注意标记，后续使用时需审慎。' : 'BLOCK：候选工件隔离，直到问题解决。';
    if (chapterId === 'chap-6') return `${stages[stage]}：${stageInfo[stage]}。${stage === 4 ? '案例研究未评测此阶段。' : ''}`;
    if (chapterId === 'chap-7') return step === 0 ? '暂停：记录当前阶段状态、链接与项目进度。' : '恢复：只编译该技能所需的证据、先前失败或教训。';
    if (chapterId === 'chap-8') return `${action}：操作图可据中间质量、成本与收敛信号调整，结果仍返回同一工件契约。`;
    return choice === '用户' ? '用户纠正 → 可审计信号 → 可能修订记忆组织或协议。' : choice === '任务' ? '任务失败/证据 → /forge 可提议强化技能检查。' : '新论文、代码与会场要求 → 信号仓库检测重复模式后再更新。';
  }, [action, chapterId, choice, stage, status, step, value]);
  const buttons = (items: string[], current: string, select: (x: string) => void) => <div className="lab-chips">{items.map(item => <button key={item} className={current === item ? 'selected' : ''} onClick={() => select(item)}>{item}</button>)}</div>;
  return <div className="autosci-lab" data-module={moduleId}><div className="lab-label">{conf.label}</div><p>{conf.intro}</p>
    {chapterId === 'chap-1' ? <><input aria-label="会话保留度" type="range" min="0" max="100" value={value} onChange={e => setValue(Number(e.target.value))}/><span className="lab-value">{value}%</span></> : null}
    {chapterId === 'chap-2' ? buttons(['Paper', 'Concept', 'Idea', 'Experiment'], choice, setChoice) : null}
    {chapterId === 'chap-3' ? buttons(['Topic', 'Paper', 'Method', 'Idea'], choice, setChoice) : null}
    {chapterId === 'chap-4' ? <div className="lab-step"><button onClick={() => setStep(Math.max(0, step - 1))}>← 上一步</button><strong>{step + 1} / 4</strong><button onClick={() => setStep(Math.min(3, step + 1))}>下一步 →</button></div> : null}
    {chapterId === 'chap-5' ? buttons(['PASS', 'ARN', 'BLOCK'], status, setStatus) : null}
    {chapterId === 'chap-6' ? buttons(stages, stages[stage], x => setStage(stages.indexOf(x))) : null}
    {chapterId === 'chap-7' ? <div className="lab-step"><button onClick={() => setStep(0)}>暂停并记录</button><button onClick={() => setStep(1)}>从阶段恢复</button></div> : null}
    {chapterId === 'chap-8' ? buttons(['继续', '重试', '停止'], action, setAction) : null}
    {chapterId === 'chap-9' ? buttons(['用户', '任务', '开放环境'], choice, setChoice) : null}
    <div className={`feedback ${status === 'BLOCK' ? 'bad' : status === 'PASS' ? 'good' : ''}`}>{output}</div>
  </div>;
};
