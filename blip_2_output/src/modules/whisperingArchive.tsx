import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetProps } from './registry';
import { unlockSpace } from './spaceSystem';

type Step = 'library' | 'projection' | 'summary';
type Payload = 'image' | 'query' | 'projected' | null;

export const WhisperingArchive: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState<Step>('library');
  const [dragging, setDragging] = useState<Payload>(null);
  const [rejected, setRejected] = useState<Payload>(null);
  const [projected, setProjected] = useState(false);
  const [decoderOpen, setDecoderOpen] = useState(false);

  const dropToLlm = (payload: Payload) => {
    if (!payload) return;
    setRejected(payload); setDragging(null);
  };
  const choosePayload = (payload: Payload) => { setDragging(payload); setRejected(null); };
  return <motion.section className="whisper-archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }} aria-label="WhisperingArchive 低语档案馆">
    <div className="archive-glow" aria-hidden="true"><span /><span /><span /></div>
    <header className="archive-header"><span>WHISPERING ARCHIVE / FROZEN LANGUAGE MEMORY</span><b>LLM LIBRARY · PARAMETER UPDATE: OFF</b></header>
    <div className="bookshelves" aria-label="冻结语言知识书架"><i>syntax</i><i>world knowledge</i><i>grammar</i><i>style</i><i>facts</i><i>reasoning</i></div>
    <div className="archive-console">
      <AnimatePresence mode="wait">
        {step === 'library' && <motion.div key="library" className="archive-scene" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <p>书架里保存着语言模型已经学会的语法、事实与表达方式。它知道很多，却从未直接看过你手里的这张图。</p>
          <h2>把什么送到这座语言图书馆的入口？</h2>
          <div className="archive-workbench"><div className="payload-tray"><button draggable onDragStart={() => choosePayload('image')} onClick={() => choosePayload('image')} className="payload image-payload">原始图片<br /><small>pixels / RGB</small></button><button draggable onDragStart={() => choosePayload('query')} onClick={() => choosePayload('query')} className="payload query-payload">Q-Former 输出<br /><small>query vectors</small></button></div><div className="llm-gate" onDragOver={e => e.preventDefault()} onDrop={() => dropToLlm(dragging)}><strong>FROZEN LLM</strong><span>拖到这里测试输入</span><b>▣</b></div></div>
          <p className="archive-hint">先拖动，或点击一个输入再点击 LLM 入口。</p>
          {rejected && <motion.div className="archive-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{rejected === 'image' ? 'UNKNOWN INPUT TYPE：LLM 不接受原始像素。' : 'DIMENSION MISMATCH：Q-Former 输出还没有映射到 LLM 的 embedding 空间。'}</motion.div>}
          {rejected === 'query' && <button className="archive-primary" onClick={() => setStep('projection')}>寻找一条维度转换路径 →</button>}
        </motion.div>}
        {step === 'projection' && <motion.div key="projection" className="archive-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <p>两次失败都留下线索：LLM 需要的不是像素，也不是未经转换的 query 向量，而是一组能进入它 embedding 空间的前置输入。</p>
          <h2>修复这条通路：把 Q-Former 输出送入 Fully Connected Projection。</h2>
          <div className="archive-pipeline">{['Image','Frozen Image Encoder','Q-Former','FC Projection','Soft Visual Prompts','Frozen LLM'].map((label, index) => <React.Fragment key={label}><motion.div className={`pipeline-node ${index <= (projected ? 5 : 3) ? 'active' : ''}`} animate={{ opacity: index <= (projected ? 5 : 3) ? 1 : .42 }}>{label}{label === 'Soft Visual Prompts' && <small>一组携带视觉信息的前置输入</small>}</motion.div>{index < 5 && <span>→</span>}</React.Fragment>)}</div>
          <button className="archive-primary" onClick={() => setProjected(true)}>{projected ? '映射完成：soft visual prompts 已进入 LLM' : '运行 FC Projection'}</button>
          {projected && <><p className="archive-feedback">FC Projection 只改变表示的坐标，不重训冻结的 LLM。soft visual prompts 像一组排在文字之前的“视觉前缀”，让语言模型可以用已有语言能力描述当前图像。</p><button className="tech-drawer-toggle" onClick={() => setDecoderOpen(!decoderOpen)}>{decoderOpen ? '收起模型透镜' : '打开模型透镜：OPT 与 FlanT5'}</button>{decoderOpen && <motion.div className="decoder-drawer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}><strong>OPTIONAL MODEL LENS</strong><p><b>OPT：</b>decoder-only，自回归地根据前面的视觉提示和文字逐词生成。</p><p><b>FlanT5：</b>encoder-decoder，先编码输入，再由 decoder 生成输出；两者都保持语言模型参数冻结，只接收投影后的视觉提示。</p></motion.div>}<button className="archive-primary" onClick={() => setStep('summary')}>确认这条接口 →</button></>}
        </motion.div>}
        {step === 'summary' && <motion.div key="summary" className="archive-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="archive-fragment">SYSTEM FRAGMENT / SOFT VISUAL PROMPT INTERFACE</div><h2>既然最终目标是让 LLM 生成文字，为什么不直接跳过第一阶段？</h2><p>这个问题不能靠一句解释解决。下一空间会让你用实验比较：没有第一阶段的视觉—语言对齐，第二阶段到底缺少了什么。</p><button className="archive-primary" onClick={() => unlockSpace('chap-7')}>进入下一空间，用实验验证 →</button></motion.div>}
      </AnimatePresence>
    </div>
  </motion.section>;
};
