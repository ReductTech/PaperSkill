import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetProps } from './registry';
import { unlockSpace } from './spaceSystem';

type Room = 'hub' | 'itc' | 'itm' | 'itg' | 'masks' | 'final';
type Task = 'itc' | 'itm' | 'itg';

const roomInfo: Record<Task, { code: string; title: string; desc: string }> = {
  itc: { code: 'ITC', title: '相似性天平', desc: '让正确图文靠近，让错误图文远离' },
  itm: { code: 'ITM', title: '匹配审讯室', desc: '辨认真配对与相似但错误的 hard negative' },
  itg: { code: 'ITG', title: '残句生成空间', desc: '根据视觉线索预测文本的下一部分' },
};

export const TriCalibrationChamber: React.FC<WidgetProps> = () => {
  const [room, setRoom] = useState<Room>('hub');
  const [done, setDone] = useState<Record<Task, boolean>>({ itc: false, itm: false, itg: false });
  const [itcMoves, setItcMoves] = useState<Record<'right' | 'wrong', 'near' | 'far' | null>>({ right: null, wrong: null });
  const [itmTrial, setItmTrial] = useState(0);
  const [itmFeedback, setItmFeedback] = useState('');
  const [itgChoice, setItgChoice] = useState<string | null>(null);
  const [protocolOpen, setProtocolOpen] = useState(false);
  const [finalChoice, setFinalChoice] = useState<string | null>(null);
  const allDone = useMemo(() => Object.values(done).every(Boolean), [done]);

  const finish = (task: Task) => setDone(current => ({ ...current, [task]: true }));
  const updateItc = (pair: 'right' | 'wrong', move: 'near' | 'far') => {
    const next = { ...itcMoves, [pair]: move };
    setItcMoves(next);
    if (next.right === 'near' && next.wrong === 'far') finish('itc');
  };
  const answerItm = (answer: 'match' | 'not') => {
    const correct = itmTrial === 0 ? answer === 'match' : answer === 'not';
    if (!correct) { setItmFeedback(itmTrial === 0 ? '再观察：图像和文本中的主体、动作、地点都一致。' : '它很像正确答案，但“紫色基座”与图像中的“蓝色坐垫”冲突。'); return; }
    if (itmTrial === 0) { setItmTrial(1); setItmFeedback('MATCH。接下来是一条故意挑选的相似错误文本。'); }
    else { finish('itm'); setItmFeedback('NOT MATCH。你识破了 hard negative：整体很像，但关键细节不一致。'); }
  };

  return <motion.section className="tri-chamber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1 }} aria-label="TriCalibrationChamber 三重校准实验舱">
    <div className="tri-fog" aria-hidden="true"><span /><span /><span /></div>
    <header className="tri-status"><span>REPRESENTATION CALIBRATION / STAGE 1</span><b>{Object.values(done).filter(Boolean).length} / 3 CHAMBERS CALIBRATED</b></header>
    <AnimatePresence mode="wait">
      {room === 'hub' && <motion.div className="tri-hub" key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <p>视觉和语言仍在使用不同的表达方式。三座实验舱各自校准一种能力，你可以按任意顺序进入。</p>
        <h2>请选择一座尚未完成的实验舱。</h2>
        <div className="tri-room-grid">{(Object.keys(roomInfo) as Task[]).map(task => <button key={task} className={done[task] ? 'is-done' : ''} onClick={() => setRoom(task)}><i>{done[task] ? '✓' : roomInfo[task].code}</i><strong>{roomInfo[task].title}</strong><small>{roomInfo[task].desc}</small><span>{done[task] ? 'CALIBRATED' : 'ENTER →'}</span></button>)}</div>
        {allDone ? <button className="tri-primary" onClick={() => setRoom('masks')}>三舱已完成：启动 attention mask 可视化 →</button> : <p className="tri-lock">EXIT LOCKED / 三座实验舱完成后才能开启</p>}
      </motion.div>}

      {room === 'itc' && <motion.div className="tri-workroom" key="itc" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
        <div className="room-heading"><span>ITC / IMAGE-TEXT CONTRASTIVE LEARNING</span><h2>图文相似性天平</h2><p>对每组图文选择“靠近”或“推远”。目标不是生成句子，而是先建立语义方向感。</p></div>
        <div className="itc-balance">
          <div className={`pair-scale ${itcMoves.right || ''}`}><div className="mini-image cat-image">猫 · 蓝色坐垫</div><span>↔</span><div className="mini-text">“一只猫坐在蓝色坐垫上”</div><div className="pair-actions"><button onClick={() => updateItc('right', 'near')}>让它们靠近</button><button onClick={() => updateItc('right', 'far')}>把它们推远</button></div></div>
          <div className={`pair-scale ${itcMoves.wrong || ''}`}><div className="mini-image cat-image">猫 · 蓝色坐垫</div><span>↔</span><div className="mini-text">“两辆汽车停在雨中的街道”</div><div className="pair-actions"><button onClick={() => updateItc('wrong', 'near')}>让它们靠近</button><button onClick={() => updateItc('wrong', 'far')}>把它们推远</button></div></div>
        </div>
        <p className="tri-feedback">{done.itc ? '校准完成：匹配图文的表示被拉近，不匹配图文的表示被推远。' : '天平等待两个判断：正确 pair 靠近，错误 pair 推远。'}</p>
        <button className="tri-primary" disabled={!done.itc} onClick={() => setRoom('hub')}>保存 ITC 结果并返回中庭</button>
      </motion.div>}

      {room === 'itm' && <motion.div className="tri-workroom" key="itm" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
        <div className="room-heading"><span>ITM / IMAGE-TEXT MATCHING</span><h2>真假匹配审讯室</h2><p>ITC 只看整体相似度；这里必须核对细节，尤其是“看起来很像”的错误样本。</p></div>
        <div className="interrogation"><div className="evidence-image">图像证物<br/><b>黑猫坐在蓝色坐垫上</b></div><div className="evidence-text"><small>{itmTrial === 1 ? 'HARD NEGATIVE / 高相似干扰项' : 'TEXT EVIDENCE'}</small><strong>{itmTrial === 0 ? '“一只黑猫坐在蓝色坐垫上。”' : '“一只黑猫坐在紫色基座上。”'}</strong></div></div>
        <div className="match-buttons"><button onClick={() => answerItm('match')}>MATCH</button><button onClick={() => answerItm('not')}>NOT MATCH</button></div>
        <p className="tri-feedback">{itmFeedback || '判断这段文字是否与图像在关键细节上真正匹配。'}</p>
        <button className="tri-primary" disabled={!done.itm} onClick={() => setRoom('hub')}>保存 ITM 结果并返回中庭</button>
      </motion.div>}

      {room === 'itg' && <motion.div className="tri-workroom" key="itg" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
        <div className="room-heading"><span>ITG / IMAGE-GROUNDED TEXT GENERATION</span><h2>残句生成空间</h2><p>Queries 带回了“黑猫、蓝色坐垫、坐着”三条线索。请预测文本下一部分。</p></div>
        <div className="generation-room"><div className="query-clues"><span>黑猫</span><span>蓝色坐垫</span><span>坐着</span></div><p>“画面中，一只黑猫……”</p><div className="sentence-options">{['坐在蓝色坐垫上。','正在驾驶一辆汽车。','消失在没有窗户的走廊里。'].map(text => <button key={text} className={itgChoice === text ? 'selected' : ''} onClick={() => { setItgChoice(text); if (text === '坐在蓝色坐垫上。') finish('itg'); }}>{text}</button>)}</div></div>
        <p className="tri-feedback">{!itgChoice ? '根据 query 提取出的视觉信息，选择最有依据的续写。' : done.itg ? '生成校准完成：模型必须保留足够视觉信息，才能逐词预测正确文本。' : '这段续写没有被当前视觉线索支持，请修正判断。'}</p>
        <button className="tri-primary" disabled={!done.itg} onClick={() => setRoom('hub')}>保存 ITG 结果并返回中庭</button>
      </motion.div>}

      {room === 'masks' && <motion.div className="tri-workroom mask-room" key="masks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="room-heading"><span>ATTENTION ACCESS PROTOCOL</span><h2>同一套 Q-Former，三种不同的可见规则</h2><p>发光连线代表“可以看到”；灰色断线代表“被 mask 隔离”。</p></div>
        <div className="mask-grid">
          <div className="mask-card"><strong>ITC</strong><div className="mask-diagram isolated"><div><i>Q</i><i>Q</i></div><span>×</span><div><i>T₁</i><i>T₂</i></div></div><p>query 和 text 隔离，各自形成表示后再比较。</p></div>
          <div className="mask-card"><strong>ITM</strong><div className="mask-diagram bidirectional"><div><i>Q</i><i>Q</i></div><span>↔</span><div><i>T₁</i><i>T₂</i></div></div><p>query–text 双向可见，用联合表示核对细节。</p></div>
          <div className="mask-card"><strong>ITG</strong><div className="mask-diagram causal"><div><i>Q</i></div><span>→</span><div><i>T₁</i><i>T₂</i><i className="future">T₃</i></div></div><p>文本能看 queries 和过去文本，但不能偷看未来。</p></div>
        </div>
        <button className="tech-drawer-toggle" onClick={() => setProtocolOpen(!protocolOpen)}>{protocolOpen ? '收起训练协议' : '查看训练协议'}</button>
        {protocolOpen && <motion.div className="training-protocol" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}><strong>LEVEL 3 / TRAINING PROTOCOL</strong><p><b>ITC：</b>用对比学习提高匹配 image–text 表示的相似度，降低不匹配 pair 的相似度。</p><p><b>ITM：</b>二分类目标，预测一个 image–text pair 是否匹配；hard negative 是相似度高但实际不匹配的干扰样本。</p><p><b>ITG：</b>自回归语言建模目标，L<sub>ITG</sub> = −Σ<sub>t</sub> log P(w<sub>t</sub> | image, w<sub>&lt;t</sub>)。</p><p><b>注意：</b>三种目标使用不同 self-attention masks，让同一个 Q-Former 在对齐、融合和生成模式之间切换。</p></motion.div>}
        <button className="tri-primary" onClick={() => setRoom('final')}>完成协议检查 →</button>
      </motion.div>}

      {room === 'final' && <motion.div className="tri-workroom final-calibration" key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="room-heading"><span>FINAL CALIBRATION</span><h2>为什么需要三个任务？</h2><p>请选择能同时解释三座实验舱分工的总结。</p></div>
        <div className="final-options"><button onClick={() => setFinalChoice('align')}>只需要让图文整体相似</button><button onClick={() => setFinalChoice('generate')}>只需要让模型生成通顺句子</button><button onClick={() => setFinalChoice('all')}>语义对齐 + 精细匹配 + 信息完整的生成能力</button></div>
        {finalChoice && <p className={`tri-feedback ${finalChoice === 'all' ? 'success' : ''}`}>{finalChoice === 'all' ? '正确。ITC 建立全局语义坐标，ITM 检查细粒度对应，ITG 迫使 queries 保留足以生成文本的视觉信息。三者共同完成第一阶段的视觉—语言表示学习。' : '这个答案只覆盖了一座实验舱。第一阶段还必须解决另外两种能力。'}</p>}
        {finalChoice === 'all' && <><div className="tri-fragment">SYSTEM FRAGMENT / STAGE 1 CALIBRATED</div><button className="tri-primary" onClick={() => unlockSpace('chap-5')}>进入下一空间：低语档案馆 →</button></>}
      </motion.div>}
    </AnimatePresence>
  </motion.section>;
};
