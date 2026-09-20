import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetProps } from './registry';
import { unlockSpace } from './spaceSystem';

type Stage = 'question' | 'flow' | 'basics' | 'frozen' | 'features' | 'handoff';
const flow = [
  { name: 'Image', note: '一张图像', icon: '▧' },
  { name: 'Patches', note: '切成小块', icon: '▦' },
  { name: 'Embeddings', note: '变成数字向量', icon: '≋' },
  { name: 'Transformer', note: '让 token 互相参考', icon: '◎' },
  { name: 'Visual Features', note: '视觉特征序列', icon: '✦' },
];

export const VisionAtrium: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState<Stage>('question');
  const [guess, setGuess] = useState<'cat' | 'signals' | null>(null);
  const [flowStep, setFlowStep] = useState(0);
  const [attention, setAttention] = useState(false);
  const [basicsOpen, setBasicsOpen] = useState(false);
  const [handoff, setHandoff] = useState<'all' | 'select' | null>(null);
  const chooseGuess = (value: 'cat' | 'signals') => { setGuess(value); setStage('flow'); };
  const advanceFlow = () => setFlowStep((current) => Math.min(current + 1, flow.length - 1));
  const completedFlow = flowStep === flow.length - 1;

  return <motion.section className="vision-atrium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }} aria-label="VisionAtrium 视觉温室">
    <div className="atrium-mist" aria-hidden="true"><span /><span /><span /></div>
    <div className="atrium-label">COGNITIVE GREENHOUSE / 02</div>
    <motion.div className="atrium-image-frame" animate={{ y: [0, -5, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}><img src="/images/npc.jpg" alt="漂浮在视觉温室中央的像素猫图像" /><span>INPUT IMAGE / UNKNOWN</span></motion.div>
    <div className="atrium-console">
      <AnimatePresence mode="wait">
        {stage === 'question' && <motion.div key="question" className="atrium-question" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><p>图像被送入温室。它看起来像一只猫，但机器人还没有“理解”这个词。</p><h2>模型看到的是一只猫，还是一组需要被理解的视觉信号？</h2><div className="atrium-options"><button onClick={() => chooseGuess('cat')}>一只猫</button><button onClick={() => chooseGuess('signals')}>一组视觉信号</button></div></motion.div>}
        {stage === 'flow' && <motion.div key="flow" className="atrium-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>{guess === 'cat' ? '“猫”是人类的解释；模型先接触的是像素和数字。' : '这个判断更接近机器内部：先有视觉信号，意义需要一步步形成。'}</p><h2>点击每个节点，观察一张图怎样变成 Visual Features。</h2><div className="vit-flow-visual">{flow.map((item, index) => <React.Fragment key={item.name}><motion.div className={`vit-card ${index <= flowStep ? 'active' : ''}`} animate={{ opacity: index <= flowStep ? 1 : .42, y: index <= flowStep ? 0 : 5 }}><div className="vit-card-icon">{item.icon}</div><strong>{item.name}</strong><small>{item.note}</small>{item.name === 'Image' && <img src="/images/npc.jpg" alt="Image 节点缩略图" />}{item.name === 'Patches' && <div className="patch-grid">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</div>}{item.name === 'Embeddings' && <div className="embedding-bars"><i /><i /><i /><i /></div>}{item.name === 'Transformer' && <div className="mini-nodes"><i /><i /><i /></div>}{item.name === 'Visual Features' && <div className="feature-pips"><i /><i /><i /><i /><i /></div>}</motion.div>{index < flow.length - 1 && <span className={index < flowStep ? 'flow-arrow active' : 'flow-arrow'}>→</span>}</React.Fragment>)}</div><button className="atrium-primary" onClick={completedFlow ? () => setStage('basics') : advanceFlow}>{completedFlow ? '打开基础知识补给站' : `点亮下一步：${flow[Math.min(flowStep + 1, flow.length - 1)].name}`}</button></motion.div>}
        {stage === 'basics' && <motion.div key="basics" className="atrium-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>每个 token 都像一个同学，手里只有一小块线索。</p><h2>基础知识补给站：它应该重点参考谁？</h2><div className={`attention-demo ${attention ? 'is-on' : ''}`}><span className="student s1">颜色</span><span className="student s2">形状</span><span className="student s3">位置</span><i className="attention-line l1" /><i className="attention-line l2" /><i className="attention-line l3" /></div><p className="attention-caption">连线表示：一个 token 正在参考另一个 token 的信息。</p><button className="atrium-primary" onClick={() => setAttention(true)}>{attention ? '连线已建立：token 正在互相参考' : '让每位同学决定应该重点参考谁'}</button><button className="tech-drawer-toggle" onClick={() => setBasicsOpen(!basicsOpen)}>{basicsOpen ? '收起基础知识抽屉' : '打开基础知识抽屉'}</button>{basicsOpen && <motion.div className="basics-drawer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}><strong>Level 3 / 技术细节</strong><p><b>Token：</b>图像被切成 patch 后，每个 patch 会变成一个向量 token。</p><p><b>Self-Attention：</b>每个 token 计算自己与其他 token 的相关性，再加权汇总信息；这就是“同学决定重点参考谁”的数学版本。</p><p><b>Transformer：</b>由 self-attention 和前馈网络等组件堆叠而成，帮助视觉 token 形成上下文表示。</p></motion.div>}<button className="tech-drawer-toggle" onClick={() => setStage('frozen')}>补给完成，继续观察冻结编码器 →</button></motion.div>}
        {stage === 'frozen' && <motion.div key="frozen" className="atrium-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>Transformer 已把 patch token 汇成视觉表示。现在给这座已经训练好的视觉温室加上冻结符号。</p><h2>BLIP-2 会重新学习视觉吗？</h2><div className="frozen-encoder"><span>IMAGE ENCODER</span><b>❄</b><small>forward：继续提供视觉表示 / update：关闭</small></div><button className="atrium-primary" onClick={() => setStage('features')}>锁定冻结参数，释放 Visual Features</button></motion.div>}
        {stage === 'features' && <motion.div key="features" className="atrium-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>冻结的编码器开始运行，视觉特征像雾中碎片一样涌出。</p><div className="feature-stream">{Array.from({ length: 18 }, (_, index) => <motion.span key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .045 }}>{['v₁','v₂','v₃','v₄','v₅'][index % 5]}</motion.span>)}</div><h2>我们真的应该把这么多视觉信息全部交给语言模型吗？</h2><div className="atrium-options"><button className={handoff === 'all' ? 'selected' : ''} onClick={() => setHandoff('all')}>全部交给 LLM</button><button className={handoff === 'select' ? 'selected' : ''} onClick={() => setHandoff('select')}>先挑出关键线索</button></div>{handoff && <p className="atrium-feedback">{handoff === 'all' ? '信息太多，语言模型会被无关视觉细节淹没。' : '你发现了下一扇门：需要一个会提问、会筛选的 Q-Former。'}</p>}{handoff === 'select' && <button className="atrium-primary" onClick={() => setStage('handoff')}>追踪蓝色查询信号 →</button>}</motion.div>}
        {stage === 'handoff' && <motion.div key="handoff" className="atrium-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>Visual Features 仍在涌出，但温室尽头出现了一个更小、更精准的入口。</p><h2>下一空间：Query Hub / Q-Former</h2><div className="atrium-fragment">SYSTEM FRAGMENT / VISUAL FEATURES</div><button className="atrium-primary" onClick={() => unlockSpace('chap-4')}>进入 Query Hub →</button></motion.div>}
      </AnimatePresence>
    </div>
  </motion.section>;
};
