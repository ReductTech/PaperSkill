import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface GuidePage {
  step: string;
  title: string;
  question: string;
  answerLabel: string;
  answer: string;
}

const GUIDE_PAGES: GuidePage[] = [
  {
    step: '学习导览',
    title: '先抓住这篇论文的核心问题',
    question: '一个模型怎样既看懂图像，又生成和编辑图像，同时不让两种能力彼此拖累？',
    answerLabel: '查看学习路线',
    answer: '接下来的六个 Step 会依次回答：为什么要统一、图像怎样离散化、Mask 扩散怎样工作、任务怎样统一、生成怎样加速，以及实验究竟证明了什么。',
  },
  {
    step: 'Step 1 · 问题',
    title: '论文所说的“统一”究竟统一了什么？',
    question: '它是否意味着文字和图像从输入到输出都必须经过完全相同的模块？',
    answerLabel: '查看本节结论',
    answer: '不是。论文统一的是文本与图像的离散表示、共享的 16B MoE dLLM 主干和块级 Mask 预测目标；图像像素重建仍交给专门的 6B Diffusion Decoder。',
  },
  {
    step: 'Step 2 · 表示',
    title: '连续图像怎样变成离散 Token？',
    question: '为什么不能只保留像素细节，而要让图像块先获得可与语言对齐的语义编号？',
    answerLabel: '查看本节结论',
    answer: '图像块先经 SigLIP2-g ViT 编码为 2048 维语义特征，再从 16,384 个码本向量中寻找最近项，输出离散 Token ID。语义更适合理解，像素细节则由后续 Decoder 负责恢复。',
  },
  {
    step: 'Step 3 · 主干',
    title: 'Mask 扩散为什么不是从左到右写答案？',
    question: '当序列中多个位置同时被遮住时，模型如何利用双向上下文逐步恢复它们？',
    answerLabel: '查看本节结论',
    answer: 'dLLM 对被 Mask 的位置进行并行预测，并依据置信度分批接受结果；已恢复的文字与视觉 Token 会继续成为下一轮预测的双向上下文。',
  },
  {
    step: 'Step 4 · 任务',
    title: '四类多模态任务为什么能共用一个主干？',
    question: '图片问答、图像生成、图像编辑和交错生成，看起来完全不同，它们的共同形式是什么？',
    answerLabel: '查看本节结论',
    answer: '它们都被组织为由文本 Token、视觉 Token 和特殊 Token 构成的统一序列。条件位置保留输入，Mask 位置定义待预测输出，任务差异由序列结构而非另一套主干表达。',
  },
  {
    step: 'Step 5 · 加速',
    title: '论文中的加速发生在同一个地方吗？',
    question: 'SPRINT 与 8 步蒸馏分别减少了哪一段计算？为什么不能把两组加速数字混为一谈？',
    answerLabel: '查看本节结论',
    answer: 'SPRINT 针对 dLLM 主干，减少已稳定前缀的重复计算；8 步蒸馏针对 Diffusion Decoder，把图像重建从 50 步压缩到 8 步。二者作用于不同阶段。',
  },
  {
    step: 'Step 6 · 证据',
    title: '“统一模型”是否等于每项指标都第一？',
    question: '应该怎样同时阅读理解、生成、编辑与速度结果，才不会把不同量纲错误地放在一起比较？',
    answerLabel: '查看本节结论',
    answer: '论文的核心证据是一个共享模型同时保持有竞争力的理解、生成与编辑能力，而不是宣称所有单项都领先。不同 benchmark、量纲和测试协议必须分别阅读，OCR、文档与图表理解仍有追赶空间。',
  },
];

function detectActivePage(): number {
  const viewportLine = window.innerHeight * 0.36;
  const hero = document.querySelector('section.hero');
  if (hero && hero.getBoundingClientRect().bottom > viewportLine) return 0;

  let nearest = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let index = 1; index < GUIDE_PAGES.length; index += 1) {
    const section = document.getElementById(`chap-${index}`);
    if (!section) continue;
    const rect = section.getBoundingClientRect();
    if (rect.top <= viewportLine && rect.bottom > viewportLine) return index;
    const distance = Math.abs(rect.top - viewportLine);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = index;
    }
  }
  return nearest;
}

export function LearningGuide() {
  const [activePage, setActivePage] = useState(0);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const seenPages = useRef(new Set<number>([0]));
  const activeRef = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const next = detectActivePage();
        if (next === activeRef.current) return;
        activeRef.current = next;
        setActivePage(next);
        setPage(next);
        setShowAnswer(false);
        if (!seenPages.current.has(next)) {
          seenPages.current.add(next);
          setOpen(true);
        }
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new MutationObserver(update);
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  const current = GUIDE_PAGES[page];
  const move = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(GUIDE_PAGES.length - 1, page + direction));
    setPage(next);
    setShowAnswer(false);
  };

  const reopen = () => {
    setPage(activePage);
    setShowAnswer(false);
    setOpen(true);
  };

  return createPortal(
    <div className="learning-guide-layer">
      {open ? (
        <aside className="learning-guide-card" role="dialog" aria-modal="false" aria-label={`${current.step}学习提示`}>
          <div className="learning-guide-accent" aria-hidden="true" />
          <header>
            <span>{current.step}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭学习提示">×</button>
          </header>
          <div className="learning-guide-content" key={`${page}-${showAnswer ? 'answer' : 'question'}`}>
            <h3>{current.title}</h3>
            {!showAnswer ? (
              <>
                <p>{current.question}</p>
                <button className="learning-guide-reveal" type="button" onClick={() => setShowAnswer(true)}>
                  {current.answerLabel}<span>→</span>
                </button>
              </>
            ) : (
              <div className="learning-guide-answer">
                <b>你应该抓住：</b>
                <p>{current.answer}</p>
                <button type="button" onClick={() => setShowAnswer(false)}>返回问题</button>
              </div>
            )}
          </div>
          <footer>
            <button type="button" onClick={() => move(-1)} disabled={page === 0} aria-label="上一条提示">‹</button>
            <div className="learning-guide-progress" aria-label={`第 ${page + 1} 条，共 ${GUIDE_PAGES.length} 条`}>
              <i><span style={{ width: `${((page + 1) / GUIDE_PAGES.length) * 100}%` }} /></i>
              <b>{page + 1} / {GUIDE_PAGES.length}</b>
            </div>
            <button type="button" onClick={() => move(1)} disabled={page === GUIDE_PAGES.length - 1} aria-label="下一条提示">›</button>
          </footer>
        </aside>
      ) : (
        <button className="learning-guide-launcher" type="button" onClick={reopen} aria-label="打开当前章节学习提示">
          <span>?</span><b>学习提示</b>
        </button>
      )}
    </div>,
    document.body,
  );
}
