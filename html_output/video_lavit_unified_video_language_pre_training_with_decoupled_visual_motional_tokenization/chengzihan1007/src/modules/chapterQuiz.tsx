import React, { useState } from 'react';
import { createPortal } from 'react-dom';

type Q={q:string;options:[string,string,string];answer:number;why:string};
const bank:Q[][]=[
 [{q:'同一镜头内相邻帧最大的浪费是什么？',options:['重复外观','文本太长','音频太大'],answer:0,why:'Figure 1 强调时间冗余，许多视觉内容在相邻帧反复出现。'},{q:'论文用什么表示视频随时间变化？',options:['仅 RGB 全帧','motion vector','字幕时间戳'],answer:1,why:'方法把视频分解成 keyframe 与 motion vector。'}],
 [{q:'论文举出的 VideoPoet 例子是？',options:['2.2 秒约 1280 tokens','4 秒约 90 tokens','64 秒约 135 tokens'],answer:0,why:'Introduction 用 2.2 秒、1280 tokens 说明 3D tokenizer 的序列压力。'},{q:'90+135 在本教程中表示什么？',options:['训练步数','约一段视频的 visual 与 motion 内容 tokens','视频帧率'],answer:1,why:'Appendix A.1 报告平均约 90 visual tokens 和 135 motion tokens。'}],
 [{q:'Video-LaVIT 的关键帧来自哪里？',options:['随机抽样','每 16 帧固定抽样','MPEG-4 I-frame'],answer:2,why:'Section 3.1 直接采用压缩视频中的 I-frame。'},{q:'Eq.1 寻找的是什么？',options:['最小块差异的位移','码本编号','文本概率'],answer:0,why:'Eq.1 在相邻帧宏块间搜索差异最小的位置偏移。'}],
 [{q:'视觉 tokenizer 主要继承谁？',options:['SVD','LaVIT','VideoPoet'],answer:1,why:'论文复用 LaVIT 的图像 tokenizer 与视觉先验。'},{q:'16,384 是什么数量？',options:['每帧 token 数','motion codebook 大小','visual codebook 大小'],answer:2,why:'Appendix A.1：视觉码本有 16,384 项，每帧平均约 90 个视觉 token。'}],
 [{q:'motion tokenizer 的编码器和解码器各有几层？',options:['4','8','12'],answer:2,why:'Appendix A.1：二者各 12 个 Transformer blocks。'},{q:'Eq.2 选择 code 的依据是？',options:['随机选取','L2 归一化后的最近邻','重建损失三项之和'],answer:1,why:'Eq.2 明确是归一化 embedding 与码字之间的最近邻量化。'}],
 [{q:'图 2 的视觉和运动如何排列？',options:['单 token 一一交替','成组 segment 交替','分别训练两个 LLM'],answer:1,why:'[IMG]…[/IMG] 与 [MOV]…[/MOV] 包住各自的 token 段。'},{q:'Eq.5 的核心训练任务是什么？',options:['预测下一个 token','计算光流','端到端预测像素'],answer:0,why:'语言模型使用自回归的 next-token 预测。'}],
 [{q:'生成视频前，先恢复什么？',options:['字幕','关键帧','长视频全部帧'],answer:1,why:'Section 3.2 使用顺序解码，先恢复关键帧再以运动条件生成后续帧。'},{q:'EMC 比直接 motion input 多了什么？',options:['音频编码器','运动特征 cross-attention','更大的视觉码本'],answer:1,why:'运动条件编码器提取特征，送入 3D U-Net 的时空 cross-attention。'}],
 [{q:'长视频边界约束的起点是？',options:['前一 clip 的末帧','第一帧的文本','随机裁剪'],answer:0,why:'Eq.4 通过 DDIM 反演前一 clip 末帧得到带噪状态。'},{q:'Figure 5 主要支持什么结论？',options:['训练成本减半','噪声约束改善跨 clip 一致性','tokenizer 无需训练'],answer:1,why:'Figure 5 是有/无噪声约束的定性对照。'}],
 [{q:'30K / 100K / 60K 对应什么？',options:['三个 Stage 的数据比例','LM / Tokenizer / Detokenizer 步数','三个评测集'],answer:1,why:'Table 8 按模块列出 Training Steps。'},{q:'Stage 3 使用哪类数据？',options:['纯视频无文本','图像和视频指令数据','只用 RedPajama'],answer:1,why:'665K 图像文本与 100K 视频文本指令用于微调。'}],
 [{q:'Table 2 的 MSVD-QA 准确率是多少？',options:['73.2','73.5','67.3'],answer:0,why:'Video-LaVIT 在 Table 2 报告 73.2。'},{q:'Table 5 中 Video-LaVIT 哪个指标最好？',options:['FVD','KVD','所有指标'],answer:1,why:'KVD 为 4.94，优于表中其他方法；FVD 不是最低。'}],
 [{q:'Table 6 的 w/ motion FVD 是多少？',options:['274.96','280.57','442.80'],answer:1,why:'280.57 来自 Table 6；274.96 属于 Appendix Table 10 的初始化消融。'},{q:'作者在 Appendix C 写出的局限是？',options:['无法处理图像','受 context window 与短视频数据限制','没有使用运动向量'],answer:1,why:'论文指出 4096 context window 与 WebVid 视频较短，限制很长视频生成。'}]
];

type QuizItem = Q & { id: string };
const chapterGroups: QuizItem[][] = [
  [...bank[0].map((q, index) => ({ ...q, id: '0:' + index })), ...bank[1].map((q, index) => ({ ...q, id: '1:' + index }))],
  ...bank.slice(2).map((questions, chapter) => questions.map((q, index) => ({ ...q, id: (chapter + 2) + ':' + index }))),
];

function loadAnswers(): Record<string, number> {
  try {
    const newer = localStorage.getItem('vl-quiz-v2');
    if (newer) {
      const parsed = JSON.parse(newer);
      if (parsed && typeof parsed === 'object') return parsed;
    }
    const migrated: Record<string, number> = {};
    bank.forEach((questions, chapter) => {
      const old = JSON.parse(localStorage.getItem('vl-quiz-' + chapter) || 'null');
      if (!Array.isArray(old)) return;
      questions.forEach((_, index) => {
        if (Number.isInteger(old[index]) && old[index] >= 0 && old[index] < 3) migrated[chapter + ':' + index] = old[index];
      });
    });
    localStorage.setItem('vl-quiz-v2', JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
}

export function ChapterQuiz({ chapterIndex, open, onOpenChange }: { chapterIndex: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>(loadAnswers);
  const questions = chapterGroups[chapterIndex];
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const answered = questions.filter(q => answers[q.id] !== undefined).length;
  const correct = questions.filter(q => answers[q.id] === q.answer).length;
  const close = React.useCallback(() => {
    onOpenChange(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [onOpenChange]);
  React.useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
  const choose = (id: string, answer: number) => {
    const next = { ...answers, [id]: answer };
    setAnswers(next);
    try { localStorage.setItem('vl-quiz-v2', JSON.stringify(next)); } catch { /* private mode */ }
  };
  return <section className="chapter-quiz">
    <div className="chapter-quiz-copy"><span>第 {chapterIndex + 1} 章 · 小测</span><h3>检查本章理解</h3><p>{questions.length} 道题，点击展开窗口作答；答案只保存在此浏览器。</p></div>
    <div className="chapter-quiz-actions"><strong>{answered}<small> / {questions.length}</small></strong><span>已作答 · 答对 {correct}</span><button type="button" ref={triggerRef} aria-expanded={open} aria-controls="chapter-quiz-window" onClick={() => onOpenChange(true)}>{answered ? '继续本章小测 ↗' : '展开本章小测 ↗'}</button></div>
    {open && createPortal(<div id="chapter-quiz-window" className={'quiz-window chapter-quiz-window ' + (questions.length === 2 ? 'compact' : '')} role="dialog" aria-modal="false" aria-labelledby="quiz-window-title">
      <div className="quiz-window-head"><div><small>Video-LaVIT · 第 {chapterIndex + 1} 章</small><h3 id="quiz-window-title">本章小测</h3></div><button type="button" ref={closeRef} onClick={close} aria-label="收起小测">收起 −</button></div>
      <div className="quiz-window-progress"><span>已作答 {answered}/{questions.length}</span><span>答对 {correct}</span></div>
      <div className="quiz-window-body">{questions.map((question, index) => <div className="vl-question" key={question.id}>
        <b>{index + 1}. {question.q}</b>
        <div className="vl-choices">{question.options.map((option, choice) => <button type="button" key={option} className={answers[question.id] === choice ? choice === question.answer ? 'correct' : 'incorrect' : ''} onClick={() => choose(question.id, choice)}>{option}</button>)}</div>
        {answers[question.id] !== undefined && <p className={answers[question.id] === question.answer ? 'correct-text' : 'incorrect-text'}>{answers[question.id] === question.answer ? '✓ 正确。' : '再想想。'}{question.why}</p>}
      </div>)}</div>
    </div>, document.body)}
  </section>;
}
