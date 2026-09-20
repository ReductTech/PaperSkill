import React, { useEffect, useReducer, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetProps } from './registry';
import { initialEchoState, reduceEcho, unlockSpace } from './spaceSystem';

const optionText = {
  vision: 'A · 它看不见',
  language: 'B · 它不会说话',
  gap: 'C · 它能看，也能说，但二者无法理解彼此',
};

export const EchoLobby: React.FC<WidgetProps> = () => {
  const [state, dispatch] = useReducer(reduceEcho, initialEchoState);
  const [showHint, setShowHint] = useState(false);
  const [checking, setChecking] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [showTech, setShowTech] = useState(false);

  useEffect(() => {
    if (state.phase !== 'diagnostic' || state.answer === 'gap') return;
    setChecking(true);
    const timer = window.setTimeout(() => {
      dispatch({ type: state.answer === 'vision' ? 'verifyVision' : 'verifyLanguage' });
      setChecking(false);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.answer]);

  const choose = (answer: 'vision' | 'language' | 'gap') => {
    setShowHint(false);
    dispatch({ type: 'choose', answer });
  };

  const bothOnline = state.visionOnline && state.languageOnline;
  return (
    <motion.section className="echo-lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} aria-label="EchoLobby 回声前厅">
      <div className="echo-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <div className="echo-header"><span className="echo-kicker">COGNITIVE SPACE / 00</span><span className="echo-clock">03:17:∞</span></div>
      <motion.div className="echo-visuals echo-visuals-left" animate={{ y: [0, -9, 0], opacity: [0.68, 0.92, 0.68] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} aria-label="漂浮图像碎片">
        <div className="image-fragment fragment-one">◌<small>IMAGE / 01</small></div><div className="image-fragment fragment-two">▧<small>IMAGE / 02</small></div><div className="image-fragment fragment-three">◍<small>IMAGE / 03</small></div>
      </motion.div>
      <motion.div className="echo-visuals echo-visuals-right" animate={{ y: [0, 8, 0], opacity: [0.55, 0.84, 0.55] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} aria-label="漂浮文字 token">
        <span>&lt;sunset&gt;</span><span>▯▯▯</span><span>the / door / waits</span><span>?</span>
      </motion.div>
      <div className="echo-void" aria-label="视觉与语言之间的空白区域"><div className="void-line" /><span>signal cannot cross</span></div>
      <motion.button className={`echo-door ${doorOpen ? 'is-open' : ''}`} onClick={() => setDoorOpen(true)} animate={state.phase === 'repaired' ? { opacity: 1, boxShadow: '0 0 55px rgba(29,74,118,.42)' } : { opacity: 0.62 }} transition={{ duration: 1.4 }}><span>MULTIMODAL EXIT</span><b>— {state.phase === 'repaired' ? 'ONLINE' : 'OFFLINE'}</b>{!doorOpen && <i>↙ 点击门</i>}</motion.button>
      <div className="echo-console">
        <AnimatePresence mode="wait">
          {state.phase === 'discovery' && !doorOpen && <motion.div key="gate" className="echo-question echo-gate-prompt" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}><p>远处的门没有回应。门缝里漏出一条深海宝蓝色的光。</p><h2>先靠近它。点击门，看看里面发生了什么。</h2></motion.div>}
          {state.phase === 'discovery' && doorOpen && <motion.div key="question" className="echo-question" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}><p>门后传来异常记录：图像抵达了，文字也抵达了，但它们没有相遇。</p><h2>你觉得这个机器人哪里坏了？</h2><div className="echo-options">{(['vision','language','gap'] as const).map((x) => <button key={x} onClick={() => choose(x)}>{optionText[x]}</button>)}</div></motion.div>}
          {state.phase === 'diagnostic' && <motion.div key="diagnostic" className="echo-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>{checking ? '正在启动你选择的模块……' : '模块响应正常。注意力开始回到中间的断裂处。'}</p><h2>{state.answer === 'vision' ? '视觉模块真的坏了吗？' : '语言模块真的坏了吗？'}</h2><div className="echo-status-row"><span className={state.visionOnline ? 'online' : ''}>VISION: {state.visionOnline ? 'ONLINE' : 'STANDBY'}</span><span className={state.languageOnline ? 'online' : ''}>LANGUAGE: {state.languageOnline ? 'ONLINE' : 'STANDBY'}</span></div><button className="echo-primary" onClick={() => choose('gap')}>观察中间的断裂连接</button></motion.div>}
          {state.phase === 'reframe' && <motion.div key="reframe" className="echo-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>你的猜测把探照灯转向了通信链路。</p><h2>让我们分别验证两侧：它们是否其实都能工作？</h2><div className="echo-checks"><button onClick={() => dispatch({ type: 'verifyVision' })}>运行视觉回放</button><button onClick={() => dispatch({ type: 'verifyLanguage' })}>运行语言回声</button></div><p className="echo-muted">先做实验，再让系统给出答案。</p></motion.div>}
          {state.phase === 'repaired' && <motion.div key="repaired" className="echo-question" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><p>你没有猜错模块，而是找到了模块之间的异常。</p><div className="echo-final-status"><span>VISION: ONLINE</span><span>LANGUAGE: ONLINE</span><strong>CROSS-MODAL LINK: FAILED</strong></div><div className="echo-fragment">SYSTEM FRAGMENT / {state.fragment}</div><p className="echo-answer">答案：问题不在视觉或语言单体，而在它们之间的 Modality Gap。</p><button className="echo-hint" onClick={() => setShowTech(!showTech)}>{showTech ? '收起技术细节' : '展开技术细节'}</button>{showTech && <div className="echo-tech-drawer">两个冻结的单模态系统各自拥有能力，却没有共享表示空间。BLIP-2 后续用 Q-Former 学习这个跨模态接口，再把视觉提示交给语言模型。</div>}<button className="echo-primary" onClick={() => unlockSpace('chap-2')}>进入下一空间：失配走廊 →</button></motion.div>}
        </AnimatePresence>
        {bothOnline && state.phase !== 'repaired' && <button className="echo-primary echo-gap-button" onClick={() => dispatch({ type: 'focusGap' })}>确认：问题在两种模态之间</button>}
        <button className="echo-hint" onClick={() => setShowHint(!showHint)}>{showHint ? '隐藏提示' : '需要一点回声提示？'}</button>{showHint && <div className="echo-hint-text">不要急着解释论文。先问：如果两侧都能单独工作，为什么中间仍然没有意义？</div>}
      </div>
    </motion.section>
  );
};
