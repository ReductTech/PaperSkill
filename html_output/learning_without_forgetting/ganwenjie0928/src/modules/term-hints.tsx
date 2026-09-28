import React, { useEffect, useRef, useState } from 'react';

type TermHint = { term: string; explanation: string };

const chapterTerms: Record<string, TermHint[]> = {
  'chap-1': [
    { term: 'CNN', explanation: '卷积神经网络：从图像中提取特征，再用输出层完成分类。' },
    { term: '共享参数', explanation: '多个任务共同使用的一组网络权重；更新它会同时影响这些任务。' },
    { term: '灾难性遗忘', explanation: '模型学习新任务后，旧任务表现明显下降的现象。' },
  ],
  'chap-2': [
    { term: '特征提取', explanation: '固定已有网络的共享表示，只训练新任务的输出部分。' },
    { term: '微调', explanation: '继续用新任务数据更新预训练网络的部分或全部参数。' },
    { term: '联合训练', explanation: '把多个任务的数据一起用于训练，通常需要同时访问旧数据。' },
  ],
  'chap-3': [
    { term: 'logit', explanation: 'softmax 之前的原始类别分数；它还不是概率。' },
    { term: '概率分布', explanation: '各类别概率组成的一组数，总和为 1。' },
    { term: '知识蒸馏', explanation: '用教师模型的输出作为软目标，指导当前模型学习。' },
  ],
  'chap-4': [
    { term: '共享层', explanation: '多个任务共用的特征提取参数，记作 θ_s。' },
    { term: '任务头', explanation: '把共享表示映射为某个任务类别输出的专属层。' },
    { term: 'Warm-up', explanation: '先只训练新任务头的阶段；本文在此冻结共享层与旧任务头。' },
  ],
  'chap-5': [
    { term: 'Softmax', explanation: '把一组类别分数转换成总和为 1 的概率分布。' },
    { term: '温度 T', explanation: '缩放 logits 的参数；T 较大时 softmax 分布更平滑。' },
    { term: '软目标', explanation: '保留多个类别相对概率的监督信号，而非只有一个硬标签。' },
  ],
  'chap-6': [
    { term: '交叉熵', explanation: '衡量预测分布与目标分布差异的常用损失函数。' },
    { term: '正则化', explanation: '在训练目标中加入约束，避免参数走向不希望的区域。' },
    { term: 'Weight decay', explanation: '惩罚较大的权重参数；在本文中是常规正则项 R。' },
  ],
  'chap-7': [
    { term: '损失权重', explanation: '控制一个损失项在总训练目标中所占的相对系数。' },
    { term: 'λ_o', explanation: '旧响应损失 L_old 的系数；改变它不等于直接改变准确率。' },
    { term: '权衡', explanation: '不同训练目标可能相互竞争，参数需在目标之间取舍。' },
  ],
  'chap-8': [
    { term: '表示', explanation: '网络中间层把输入编码成后续分类器可使用的特征。' },
    { term: '分类头', explanation: '读取网络表示并输出各类别分数的任务专属部分。' },
    { term: '消融实验', explanation: '改变某个设计因素并比较结果，以检查它的作用。' },
  ],
  'chap-9': [
    { term: '数据分布', explanation: '样本及其标签在输入空间中出现的规律。' },
    { term: '代表性', explanation: '当前可见样本是否覆盖了想要保留能力的相关输入。' },
    { term: '域差异', explanation: '新旧任务输入分布不一致的程度；此处不由示意坐标定量。' },
  ],
  'chap-10': [
    { term: 'Accuracy', explanation: '分类正确样本占比；数值越高表示该评测集上分类越准确。' },
    { term: 'Validation', explanation: '用于验证的划分；本表中 ImageNet 使用 validation。' },
    { term: 'Test', explanation: '用于最终评测的划分；本表中 CUB 使用 test。' },
  ],
};

export function TermHints({ chapterId }: { chapterId: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const terms = chapterTerms[chapterId];

  useEffect(() => {
    if (!active && !hovered) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setActive(null);
        setHovered(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActive(null);
        setHovered(null);
      }
    };
    const closeOnScroll = () => {
      setActive(null);
      setHovered(null);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [active, hovered]);
  if (!terms?.length) return null;
  const openTerm = active || hovered;
  const openHint = terms.find(({ term }) => term === openTerm);

  return (
    <div
      ref={root}
      className="lwf-term-hints"
      role="group"
      aria-label="本章前置知识"
      onPointerOver={(event) => {
        const target = event.target as HTMLElement;
        const hint = target.closest<HTMLButtonElement>('[data-term]');
        if (hint?.dataset.term) setHovered(hint.dataset.term);
        else if (!target.closest('.lwf-term-tooltip')) setHovered(null);
      }}
      onPointerLeave={() => setHovered(null)}
      onFocusCapture={(event) => {
        const hint = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-term]');
        if (hint?.dataset.term) setHovered(hint.dataset.term);
      }}
      onBlurCapture={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node | null)) setHovered(null);
      }}
    >
      <span className="lwf-term-hints-title">前置知识 · 悬停或点击查看</span>
      {terms.map(({ term, explanation }) => (
        <button
          key={term}
          className={'lwf-term-hint' + (openTerm === term ? ' is-open' : '')}
          type="button"
          aria-label={term + '：' + explanation}
          aria-expanded={openTerm === term}
          aria-describedby={openTerm === term ? 'lwf-term-tooltip' : undefined}
          data-term={term}
          onClick={() => setActive((current) => (current === term ? null : term))}
        >
          {term}
        </button>
      ))}
      {openHint && (
        <div className="lwf-term-tooltip" id="lwf-term-tooltip" role="tooltip">
          <strong>{openHint.term}</strong>
          <span>{openHint.explanation}</span>
        </div>
      )}
    </div>
  );
}
