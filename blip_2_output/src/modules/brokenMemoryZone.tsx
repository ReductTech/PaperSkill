import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WidgetProps } from './registry';
import { unlockSpace } from './spaceSystem';

type Stage = 'context' | 'mirror' | 'puzzle' | 'questions' | 'restored';
type Piece = 'encoder' | 'qformer' | 'projection' | 'llm';
const pieces: { id: Piece; label: string }[] = [
  { id: 'encoder', label: 'Frozen Image Encoder' },
  { id: 'qformer', label: 'Q-Former' },
  { id: 'projection', label: 'Projection' },
  { id: 'llm', label: 'Frozen LLM' },
];
const slots: { id: Piece; label: string }[] = [
  { id: 'encoder', label: '视觉输入' },
  { id: 'qformer', label: '视觉查询' },
  { id: 'projection', label: '维度接口' },
  { id: 'llm', label: '语言生成' },
];

export const BrokenMemoryZone: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState<Stage>('context');
  const [contextGuess, setContextGuess] = useState<string | null>(null);
  const [mirrorSeen, setMirrorSeen] = useState<string[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [placed, setPlaced] = useState<Partial<Record<Piece, Piece>>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionChoice, setQuestionChoice] = useState<string | null>(null);
  const [memory, setMemory] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [bright, setBright] = useState(false);
  const contextCorrect = contextGuess === 'no';
  const allPlaced = useMemo(() => slots.every(slot => placed[slot.id] === slot.id), [placed]);
  const questions = [
    { text: '为什么要 freeze 两端？', options: ['保留已有单模态能力，并减少训练成本。', '让模型永远不能更新任何信息。'], answer: '保留已有单模态能力，并减少训练成本。', fragment: 'FROZEN BASES' },
    { text: '为什么需要 Q-Former？', options: ['把所有像素原样复制给 LLM。', '学习一个轻量的跨模态接口，筛选语言需要的视觉信息。'], answer: '学习一个轻量的跨模态接口，筛选语言需要的视觉信息。', fragment: 'LEARNED BRIDGE' },
    { text: '为什么采用 two-stage pre-training？', options: ['先学视觉—语言表示对齐，再把稳定接口接入生成。', '因为一次训练永远不能生成文字。'], answer: '先学视觉—语言表示对齐，再把稳定接口接入生成。', fragment: 'TWO-STAGE ALIGNMENT' },
  ];
  const currentQuestion = questions[questionIndex];

  const chooseContext = (value: string) => { setContextGuess(value); if (value === 'no') setStage('mirror'); };
  const placePiece = (slot: Piece) => {
    if (!selectedPiece) return;
    if (selectedPiece !== slot) { setError('接口顺序不对：再观察视觉信息如何逐步变成语言可读的输入。'); return; }
    setPlaced(current => ({ ...current, [slot]: selectedPiece })); setSelectedPiece(null); setError('');
  };
  const answerQuestion = (value: string) => {
    setQuestionChoice(value);
    if (value !== currentQuestion.answer) { setError('这块碎片还没有对准论文逻辑，再回忆前面的空间。'); return; }
    setMemory(current => [...current, currentQuestion.fragment]); setError('');
    if (questionIndex < questions.length - 1) { setQuestionIndex(index => index + 1); setQuestionChoice(null); }
    else { setBright(true); setStage('restored'); }
  };

  return <motion.section className={`broken-memory-zone ${bright ? 'is-restored' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }} aria-label="BrokenMemoryZone 与 ThresholdGate 最终空间">
    <div className="memory-glitch" aria-hidden="true"><span>ALIGNMENT ERROR</span><span>ALIGNMENT ERROR</span><span>ALIGNMENT ERROR</span></div>
    <header className="memory-header"><span>BROKEN MEMORY ZONE / LIMITATIONS</span><b>{stage === 'restored' ? 'EXIT SIGNAL FOUND' : 'SYSTEM MEMORY UNSTABLE'}</b></header>
    <div className="memory-console"><AnimatePresence mode="wait">
      {stage === 'context' && <motion.div className="memory-scene" key="context" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><p>你来到一间记忆正在重影的房间。先做一个小实验：如果给 BLIP-2 更多 VQA 示例，它会更会回答当前问题吗？</p><h2>你的预测是？</h2><div className="memory-options"><button onClick={() => chooseContext('yes')}>会，示例越多越好</button><button onClick={() => chooseContext('no')}>不一定，可能没有明显改善</button></div>{contextGuess === 'yes' && <p className="memory-feedback">先把预测记在墙上。论文的实验并没有观察到明显改善，继续寻找原因。</p>}{contextGuess === 'no' && <div className="memory-reveal"><strong>REVEAL / IN-CONTEXT LEARNING</strong><p>论文报告：增加 VQA demonstration 并没有带来明显改善。作者将其与预训练使用的单个 image-text pair 联系起来：模型的视觉—语言接口并不是在大量同图多问答中学成的。</p><button className="memory-primary" onClick={() => setStage('mirror')}>进入错误记忆镜面 →</button></div>}</motion.div>}
      {stage === 'mirror' && <motion.div className="memory-scene" key="mirror" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><p>镜面里出现三种可能的失真。点击每一面，观察它与 frozen LLM 风险的关系。</p><h2>强大的系统，也会把旧记忆带进新任务。</h2><div className="mirror-grid">{[{id:'facts',title:'不准确知识',desc:'语言模型的旧知识可能与图像证据冲突。'},{id:'reasoning',title:'错误推理',desc:'视觉线索不足时，生成会看似合理却不受图像支持。'},{id:'inherit',title:'继承 frozen LLM 风险',desc:'冻结保留能力，也保留偏差、过时知识与表达习惯。'}].map(item => <button key={item.id} className={mirrorSeen.includes(item.id) ? 'seen' : ''} onClick={() => setMirrorSeen(current => current.includes(item.id) ? current : [...current, item.id])}><strong>{item.title}</strong><span>{mirrorSeen.includes(item.id) ? item.desc : '点击观察记忆裂纹'}</span></button>)}</div><p className="memory-feedback">{mirrorSeen.length < 3 ? `已观察 ${mirrorSeen.length} / 3 面镜子` : '限制不是失败宣判，而是边界提示：强大模型仍需要被验证。'}</p><button className="memory-primary" disabled={mirrorSeen.length < 3} onClick={() => setStage('puzzle')}>拼回最终结构 →</button></motion.div>}
      {stage === 'puzzle' && <motion.div className="memory-scene" key="puzzle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><p>把四块系统碎片拖回正确位置。也可以先点击碎片，再点击目标槽位。</p><h2>ThresholdGate / 最终结构拼图</h2><div className="puzzle-pieces">{pieces.filter(piece => !Object.values(placed).includes(piece.id)).map(piece => <button draggable onDragStart={() => setSelectedPiece(piece.id)} className={selectedPiece === piece.id ? 'selected' : ''} key={piece.id} onClick={() => setSelectedPiece(piece.id)}>{piece.label}</button>)}</div><div className="puzzle-slots">{slots.map(slot => <div key={slot.id} className={placed[slot.id] ? 'filled' : ''} onDragOver={event => event.preventDefault()} onDrop={() => { setSelectedPiece(selectedPiece); placePiece(slot.id); }} onClick={() => placePiece(slot.id)}><span>{slot.label}</span><strong>{placed[slot.id] ? pieces.find(piece => piece.id === placed[slot.id])?.label : 'DROP HERE'}</strong></div>)}</div>{error && <p className="memory-error">{error}</p>}{allPlaced && <button className="memory-primary" onClick={() => setStage('questions')}>结构连接完成，回答最后三问 →</button>}</motion.div>}
      {stage === 'questions' && <motion.div className="memory-scene" key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><p>系统碎片：{memory.join(' · ') || '等待第一块碎片'}</p><h2>{currentQuestion.text}</h2><div className="memory-options">{currentQuestion.options.map(option => <button key={option} className={questionChoice === option ? 'selected' : ''} onClick={() => answerQuestion(option)}>{option}</button>)}</div>{error && <p className="memory-error">{error}</p>}</motion.div>}
      {stage === 'restored' && <motion.div className="memory-scene restored-scene" key="restored" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.8 }}><div className="alignment-signal">SYSTEM ALIGNMENT RESTORED</div><p>不必重新训练两个巨人。</p><p>有时候真正需要学习的，是他们之间如何交流。</p><button className="memory-primary" onClick={() => unlockSpace('chap-8')}>打开出口阈限 →</button><div className="paper-fade">BLIP-2<br/><small>Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models</small></div></motion.div>}
    </AnimatePresence></div>
  </motion.section>;
};

export const ThresholdGate = BrokenMemoryZone;
