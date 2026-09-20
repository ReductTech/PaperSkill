import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetProps } from './registry';
import { unlockSpace } from './spaceSystem';

type Stage = 'question' | 'collect' | 'mechanism' | 'bottleneck' | 'done';

export const QueryHub: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState<Stage>('question');
  const [choice, setChoice] = useState<'useful' | 'all' | null>(null);
  const [techOpen, setTechOpen] = useState(false);

  const choose = (value: 'useful' | 'all') => { setChoice(value); setStage('collect'); };
  return <motion.section className="query-hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }} aria-label="QueryHub 查询中庭">
    <div className="query-mist" aria-hidden="true"><span /><span /><span /></div>
    <div className="query-label">QUERY ATRIUM / 03</div>
    <div className="query-visual-field" aria-label="漂浮的视觉特征"><span className="feature-orbit orbit-a" /><span className="feature-orbit orbit-b" /><span className="feature-orbit orbit-c" /><span className="query-core">?</span></div>
    <div className="query-console">
      <AnimatePresence mode="wait">
        {stage === 'question' && <motion.div key="question" className="query-scene" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <p>视觉温室里仍有太多碎片。你只能派出少量调查员，不能把整座温室搬走。</p>
          <h2>如果你不能保存整张图，而只能派出少量调查员，你希望他们带回哪些信息？</h2>
          <div className="query-options"><button onClick={() => choose('useful')}>1. 对文本生成有用的信息</button><button onClick={() => choose('all')}>2. 所有信息</button></div>
        </motion.div>}
        {stage === 'collect' && <motion.div key="collect" className="query-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>{choice === 'useful' ? '你让调查员只寻找语言真正需要的线索。' : '你想保留一切，但空间提醒：固定的调查员必须学会筛选。'}</p>
          <h2>Orb 正在穿过视觉特征，带回可用线索……</h2>
          <div className="orb-collection">{Array.from({ length: 12 }, (_, i) => <motion.i key={i} initial={{ opacity: 0, x: (i % 4) * 35 - 50, y: Math.floor(i / 4) * 26 - 24 }} animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0 }} transition={{ duration: 1.8, delay: i * .12, repeat: 1 }} />)}<motion.b initial={{ scale: .7 }} animate={{ scale: [0.7, 1, .9, 1] }} transition={{ delay: 1.4, duration: 1.2 }}>ORB</motion.b></div>
          <p className="query-feedback">它们不是新的图像编码器，而是会学习“该问什么”的调查员：<strong>learnable queries</strong>。</p>
          <button className="query-primary" onClick={() => setStage('mechanism')}>查看调查员如何协作 →</button>
        </motion.div>}
        {stage === 'mechanism' && <motion.div key="mechanism" className="query-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>调查员先彼此交换线索，再回到视觉特征库读取答案。</p><h2>两种不同的注意力动作</h2>
          <div className="attention-panels">
            <div className="attention-panel"><strong>Self-Attention</strong><div className="query-network">{['Q₁','Q₂','Q₃'].map((q, i) => <React.Fragment key={q}><span className={`q-dot q-${i}`}>{q}</span>{i < 2 && <i className="q-link" />}</React.Fragment>)}</div><p>Query 之间交换线索</p></div>
            <div className="attention-panel"><strong>Cross-Attention</strong><div className="cross-network"><div className="cross-queries"><span>Q₁</span><span>Q₂</span><span>Q₃</span></div><div className="cross-features">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>{[0,1,2].map(i => <i className={`cross-link c-${i}`} key={i} />)}</div><p>Query 主动读取视觉编码器产生的特征</p></div>
          </div>
          <button className="query-primary" onClick={() => setStage('bottleneck')}>看见信息瓶颈 →</button>
        </motion.div>}
        {stage === 'bottleneck' && <motion.div key="bottleneck" className="query-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>不是把所有视觉 token 原样交给语言模型，而是把入口固定下来。</p><h2>大量视觉特征 → 固定数量的 query outputs</h2>
          <div className="bottleneck-visual"><div className="many-features">{Array.from({ length: 24 }, (_, i) => <motion.i key={i} animate={{ x: [0, 24, 0], opacity: [.45, 1, .45] }} transition={{ duration: 2.4, delay: i * .025, repeat: Infinity }} />)}</div><span>→</span><div className="fixed-queries">{['q₁','q₂','q₃','q₄'].map(q => <b key={q}>{q}</b>)}</div></div>
          <p className="query-feedback">信息瓶颈让下游语言模型接收稳定、可控的少量视觉提示。</p><button className="tech-drawer-toggle" onClick={() => setTechOpen(!techOpen)}>{techOpen ? '收起技术透镜' : '打开技术透镜'}</button>
          {techOpen && <motion.div className="query-tech" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}><strong>TECH LENS / 论文实现参数</strong><ul><li>32 learnable queries</li><li>query dimension 768</li><li>cross-attention 每隔一个 Transformer block 插入</li><li>Q-Former 由 image transformer 与 text transformer 组成，共享 self-attention</li></ul></motion.div>}
          <button className="query-primary" onClick={() => setStage('done')}>固定接口，继续前进 →</button>
        </motion.div>}
        {stage === 'done' && <motion.div key="done" className="query-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="query-fragment">SYSTEM FRAGMENT / LEARNABLE QUERIES</div><h2>它不是重新看图，而是在已经看懂的图里，寻找语言需要知道的东西。</h2><button className="query-primary" onClick={() => unlockSpace('chap-6')}>进入下一空间：三重校准实验舱 →</button></motion.div>}
      </AnimatePresence>
    </div>
  </motion.section>;
};
