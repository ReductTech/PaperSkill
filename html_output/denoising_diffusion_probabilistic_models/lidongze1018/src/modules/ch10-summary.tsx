import React from 'react';
import type { WidgetProps } from './registry';

// Module 10.3 — compact core-contribution recap (4 Q&A) used as an in-page study index.
// Each card can jump back to the corresponding chapter (via the existing sidebar nav
// buttons), then scroll to the relevant module. No new navigation system is created.

interface QA {
  q: string;
  a: string;
  src: string;
  go: { chapter: number; module: string; label: string };
}

const QAS: QA[] = [
  {
    q: 'DDPM 与早期扩散模型是什么关系？',
    a: '扩散概率模型由 Sohl-Dickstein 等人于 2015 年提出（论文参考文献 [53]）。DDPM 不是首创——它的贡献是首次展示扩散模型能生成高质量样本（据作者所知），并把 ε 参数化、训练目标与去噪分数匹配/退火 Langevin 动力学联系起来。',
    src: '论文 Introduction；参考文献 [53]',
    go: { chapter: 1, module: '1.2', label: '去第 1 章 · 定位与贡献' },
  },
  {
    q: '论文为什么采用噪声预测参数化？',
    a: '由 Eq. (9)–(11) 的推导：把反向均值 μθ 写成「xₜ 减去对累计等效噪声的估计」时，训练信号自然落在噪声上、实现更简单，并与多噪声尺度的去噪分数匹配建立联系。这是论文采用并验证有效的设计选择——论文也比较了预测 μ̃ 与 x₀（§3.2，Table 2），并非唯一方法。',
    src: '论文 Section 3.2；Eq. (11)；Table 2',
    go: { chapter: 3, module: '3.2', label: '去第 3 章 · 推导链' },
  },
  {
    q: '简化训练目标带来了什么效果？',
    a: 'L_simple 来源于对原始变分目标中噪声预测项的简化与重新加权：它丢弃 Eq. (12) 的权重、相对降权小 t 的简单任务、重视大 t 的困难区段。它保留了与 DDPM 训练密切相关的噪声预测任务，但不能直接等同于原始的严格变分上界目标（论文称其为 a weighted variational bound，且 t=1 项还含近似）。在同一 ε + 固定各向同性方差设定下，FID 从 13.51 降到 3.17（Table 2）。',
    src: '论文 Section 3.4；Eq. (12)(14)；Table 2',
    go: { chapter: 7, module: '7.1', label: '去第 7 章 · 训练目标' },
  },
  {
    q: '2020 年的生成质量实验结果？',
    a: '无条件 CIFAR10：FID 3.17 / IS 9.46（FID 相对训练集；相对测试集为 5.24）；LSUN 256×256 的样本质量接近 ProgressiveGAN。局限：对数似然不具竞争力，采样约需 1000 步。',
    src: '论文 Section 4；Table 1；Table 3',
    go: { chapter: 10, module: '10.1', label: '去第 10 章 · 实验结果' },
  },
];

function jumpTo(go: { chapter: number; module: string }): void {
  const items = document.querySelectorAll<HTMLButtonElement>('.slide-sidebar-item');
  const btn = items[go.chapter];
  if (!btn) return;
  btn.click(); // existing navigation state machine (App.goTo)
  window.setTimeout(() => {
    const mod = Array.from(document.querySelectorAll('.module')).find(
      (m) => (m.querySelector('.num')?.textContent ?? '') === go.module
    );
    if (mod) {
      const y = mod.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: y, behavior: 'instant' });
    }
  }, 380);
}

export const Ch10Summary: React.FC<WidgetProps> = ({ chapterId }) => {
  return (
    <div key={`${chapterId}-summary`}>
      {QAS.map((item) => (
        <div className="derive-card" key={item.q}>
          <div className="derive-head">
            <span className="derive-step-no">Q</span>
            <span className="derive-title">{item.q}</span>
          </div>
          <div className="derive-why">{item.a}</div>
          <div className="derive-source">
            <span className="source-tag">{item.src}</span>
            <button type="button" className="tiny ghost jump-btn" onClick={() => jumpTo(item.go)}>
              {item.go.label}
            </button>
          </div>
        </div>
      ))}
      <div className="source-note">
        本节帮助读者快速回顾论文的研究背景、核心方法、实验结果与局限；点击「去第 N 章」可跳转到对应章节继续深入学习。
      </div>
    </div>
  );
};

export default Ch10Summary;
