import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetProps } from './registry';
import { unlockSpace } from './spaceSystem';

type Plan = 'end2end' | 'frozen' | 'language';
const planCopy: Record<Plan, { label: string; feedback: string; pressure: number }> = {
  end2end: { label: '全部重新训练', feedback: '资源条几乎立刻冲满：两座已经训练好的房间都要重新装修。', pressure: 94 },
  frozen: { label: '冻结已有模型，只训练桥梁', feedback: '压力明显下降。像已经通过的课程不需要重学，但它们仍会参与 forward computation。', pressure: 28 },
  language: { label: '只训练语言模型', feedback: '语言房间在变亮，但视觉证据没有新的接口，问题仍被留在走廊中央。', pressure: 63 },
};

export const MismatchCorridor: React.FC<WidgetProps> = () => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [powerCut, setPowerCut] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [answer, setAnswer] = useState(false);

  const choose = (next: Plan) => { setPlan(next); setPowerCut(false); setAnswer(false); };
  const frozen = plan === 'frozen';
  return <motion.section className={`mismatch-corridor ${powerCut ? 'is-dark' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} aria-label="MismatchCorridor 失配走廊">
    <div className="corridor-depth" aria-hidden="true"><span /><span /><span /><span /></div>
    <div className="corridor-sign">RESEARCH FACILITY / 01 <b>∞</b></div>
    <div className="model-room vision-room"><strong>VISION MODEL</strong><small>pre-trained / ready</small><i>◌</i></div>
    <div className="model-room language-room"><strong>LANGUAGE MODEL</strong><small>pre-trained / ready</small><i>▤</i></div>
    <div className="corridor-seam"><span>{powerCut ? 'VISION-LANGUAGE ALIGNMENT FAILED' : 'unshared representation space'}</span></div>
    <div className="corridor-panel">
      <AnimatePresence mode="wait">
        {!plan && <motion.div key="choice" className="corridor-question" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}><p>两侧的房间已经训练得很强。你是系统修复者。</p><h2>既然视觉模型和语言模型已经分别很强，你会怎么办？</h2><div className="corridor-options">{(['end2end','frozen','language'] as Plan[]).map((x) => <button key={x} onClick={() => choose(x)}>{planCopy[x].label}</button>)}</div></motion.div>}
        {plan && !powerCut && <motion.div key="plan" className="corridor-question" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><p>你的方案：{planCopy[plan].label}</p><h2>{planCopy[plan].feedback}</h2><div className="resource-readout"><span>COMPUTE PRESSURE</span><strong>{planCopy[plan].pressure}%</strong><div><i style={{ width: `${planCopy[plan].pressure}%` }} /></div></div>{frozen && <p className="corridor-analogy">frozen ≈ 已经通过的课程不需要重新学习；但模型仍在 forward 中提供表示，只是不更新参数。</p>}<button className="tech-drawer-toggle" onClick={() => setShowTech(!showTech)}>{showTech ? '收起技术细节' : '展开技术细节'}</button>{showTech && <div className="corridor-tech">冻结参数意味着反向传播不更新该模块的权重。保留 forward computation 可以继续使用已有能力。另一个风险是 catastrophic forgetting：端到端更新可能让模型为新任务改变原有通用能力。</div>}<button className="corridor-primary" onClick={() => setPowerCut(true)}>继续向走廊深处走</button></motion.div>}
        {plan && powerCut && !answer && <motion.div key="cut" className="corridor-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p className="alarm">SYSTEM POWER EVENT / alignment channel interrupted</p><h2>VISION-LANGUAGE ALIGNMENT FAILED</h2><p>冻结确实降低了资源压力，但它没有自动创造共同语言。</p><h3>既然两边都不能大改，那么谁负责让它们彼此理解？</h3><div className="corridor-options"><button onClick={() => setAnswer(true)}>视觉房间</button><button onClick={() => setAnswer(true)}>语言房间</button><button onClick={() => setAnswer(true)}>中间的桥梁</button></div></motion.div>}
        {answer && <motion.div key="answer" className="corridor-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p className="alarm">ALIGNMENT CHANNEL / waiting for a bridge</p><h2>答案：需要一个轻量、可学习的跨模态桥梁。</h2><p>你获得了下一条线索：Q-Former 不替代两侧，而是负责把视觉证据翻译成语言模型能使用的表示。</p><div className="corridor-fragment">SYSTEM FRAGMENT / BRIDGE NEEDED</div><button className="corridor-primary" onClick={() => unlockSpace('chap-3')}>进入下一空间：查询中庭 →</button></motion.div>}
      </AnimatePresence>
    </div>
  </motion.section>;
};
