import React from 'react';
import { ComicTemplate, ComicPanel } from './comic-template';

// ========== 第 2 章：整体框架概览 ==========
export const Ch2Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 冻结图像编码器',
      emoji: '🖼️',
      text: '一位图像专家，已经看过亿万张图，学会了"看图说话"的基本功。全程冻结不动，只负责输出图像特征。',
      caption: 'ViT-G：最强图像编码器，参数完全冻结',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      title: '② Q-Former 翻译官',
      emoji: '🤖',
      text: '一位聪明的翻译官，学会了看懂图像专家的"图纸"，再把关键信息翻译成语言专家能理解的格式。唯一可训练的部分。',
      caption: '188M 可训练参数，轻量但高效',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '③ 冻结大语言模型',
      emoji: '🧠',
      text: '一位语言大师，读过海量书籍，精通语法、知识和推理。全程冻结不动，只负责根据视觉前缀生成回答。',
      caption: 'FlanT5-XXL：最强 LLM，参数完全冻结',
      bg: '#faf5ff',
      border: '#c4b5fd',
    },
    {
      title: '④ 两阶段引导策略',
      emoji: '📈',
      text: '先让翻译官学会"看懂图"（表示学习），再学会"对接语言大师"（生成引导）。两步走，稳扎稳打。',
      caption: '第一阶段对齐表示 → 第二阶段引导生成',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="BLIP-2 整体框架 · 三模块拼图" panels={panels} />;
};

// ========== 第 3 章：Q-Former 桥接器 ==========
export const Ch3Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 32 个可学习查询',
      emoji: '❓',
      text: '翻译官手里有 32 个"专业问题"，每个问题专门关注一类视觉信息：颜色、形状、位置、物体类别……',
      caption: '32 queries，可学习参数，主动提问',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      title: '② 自注意力：问题交流',
      emoji: '💬',
      text: '32 个问题之间先互相交流，避免重复提问，分工协作。就像一个调查组，成员先开会对齐思路。',
      caption: 'Self-Attention：查询之间互相交流',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '③ 交叉注意力：提取答案',
      emoji: '🔍',
      text: '每个问题通过交叉注意力，从冻结的图像特征图中"提取"最相关的答案。不是被动接收全部信息，而是主动筛选。',
      caption: 'Cross-Attention：从图像特征中主动提取',
      bg: '#faf5ff',
      border: '#c4b5fd',
    },
    {
      title: '④ 信息瓶颈压缩',
      emoji: '✂️',
      text: '把 257×1024 的高维图像特征，压缩成 32×768 的紧凑表示。只保留对语言有用的关键信息，大幅缩小模态鸿沟。',
      caption: '257×1024 → 32×768，信息瓶颈设计',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="Q-Former 桥接器 · 翻译官的工作流程" panels={panels} />;
};

// ========== 第 4 章：第一阶段三大训练目标 ==========
export const Ch4Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① ITC 对比学习',
      emoji: '⚖️',
      text: '"图文配对考试"：给一对图文，判断它们是不是真的匹配。学会把匹配的图文拉得近，不匹配的推得远。',
      caption: 'Image-Text Contrastive：全局对齐',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      title: '② ITM 匹配判断',
      emoji: '✅',
      text: '"二分类判断题"：仔细看这张图和这句话到底配不配？判断对了算对，判断错了扣分。细粒度对齐。',
      caption: 'Image-Text Matching：细粒度判断',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '③ ITG 生成训练',
      emoji: '✍️',
      text: '"看图写作文"：给一张图，写一句准确的描述。学会把视觉信息转化为语言描述，为后续对接 LLM 打基础。',
      caption: 'Image-Grounded Text Generation：生成能力',
      bg: '#faf5ff',
      border: '#c4b5fd',
    },
    {
      title: '④ 三种掩码策略',
      emoji: '🎭',
      text: '不同任务用不同的"看问题方式"：对比学习时图文不能互相看；匹配时可以互相看；生成时图可以看文，文不能看图。',
      caption: 'Bi-directional / Multi-modal Causal / Uni-modal Mask',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="第一阶段 · 三大训练目标" panels={panels} />;
};

// ========== 第 5 章：第二阶段生成式引导 ==========
export const Ch5Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 为什么需要第二阶段？',
      emoji: '🤔',
      text: '第一阶段学会了"对齐表示"，但还没学会"对接 LLM"。直接把视觉特征塞给 LLM，它看不懂——维度不对，语义空间也不对。',
      caption: '表示对齐 ≠ 生成引导，需要进阶训练',
      bg: '#fef2f2',
      border: '#fca5a5',
    },
    {
      title: '② 全连接投影层',
      emoji: '🔌',
      text: '加一个全连接层（FC），把 Q-Former 输出投影到 LLM 的词嵌入空间。就像翻译官学会了语言大师的"说话方式"。',
      caption: 'Z_proj = W·Z，维度匹配 LLM 词嵌入',
      bg: '#fffbeb',
      border: '#fcd34d',
    },
    {
      title: '③ 多模态因果学习',
      emoji: '🎯',
      text: '用"多模态因果学习"目标训练：让 LLM 看到视觉前缀后，能顺着思路生成正确的回答。图可以看文，文只能从前往后看图。',
      caption: 'Multimodal Causal Learning：视觉前缀引导生成',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '④ LLM 完全冻结',
      emoji: '🧊',
      text: '整个过程中 LLM 完全冻结不动！只训练 Q-Former 和投影层。既保留了 LLM 的全部知识，又学会了视觉对话。',
      caption: '冻结 LLM + 轻量训练 = 高效融合',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="第二阶段 · 生成式引导进阶" panels={panels} />;
};

// ========== 第 6 章：软提示接入冻结 LLM ==========
export const Ch6Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 视觉软提示',
      emoji: '📝',
      text: '把视觉特征经过投影后，"伪装"成一段文本前缀。语言大师看到这段前缀，以为它只是普通文字的开头，就顺着往下回答。',
      caption: 'Soft Prompt：视觉特征伪装成文本前缀',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      title: '② 为什么用软提示？',
      emoji: '💡',
      text: '如果直接修改 LLM 参数，会破坏它已有的知识。用软提示的方式，不碰 LLM 一根手指头，就能引导它生成视觉相关的回答。',
      caption: '不修改 LLM，只加前缀，知识零遗忘',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '③ 零样本涌现能力',
      emoji: '✨',
      text: '一旦学会了软提示引导，LLM 的各种能力都自然涌现：视觉对话、知识推理、指令跟随……就像打通了任督二脉。',
      caption: 'Emergent Abilities：零样本指令跟随、视觉对话',
      bg: '#faf5ff',
      border: '#c4b5fd',
    },
    {
      title: '④ 通用桥接范式',
      emoji: '🌉',
      text: '这个方法非常通用：换一个更强的图像编码器，换一个更强的 LLM，效果都会提升。它不是绑定特定模型，而是一种通用的桥接范式。',
      caption: 'Generic Method：可替换任意冻结单模态模型',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="软提示接入 · 引导冻结 LLM" panels={panels} />;
};

// ========== 第 7 章：零样本 VQA 实验 ==========
export const Ch7Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 裸考规则',
      emoji: '📋',
      text: '"零样本"就是裸考：考前一道 VQA 题都没做过，直接上考场。考的是真本事，不是刷题刷出来的。',
      caption: 'Zero-shot：不看任何 VQA 训练数据',
      bg: '#fef2f2',
      border: '#fca5a5',
    },
    {
      title: '② 选手对比',
      emoji: '🏃',
      text: 'Flamingo80B 带了 80B 参数的"知识储备"来考试；BLIP-2 只带了 188M 可训练参数，其他全是冻结的预训练知识。',
      caption: 'Flamingo80B vs BLIP-2：参数少 54 倍',
      bg: '#fffbeb',
      border: '#fcd34d',
    },
    {
      title: '③ 考试成绩',
      emoji: '🏆',
      text: '结果出人意料：BLIP-2 不仅赢了，还大幅领先！VQAv2 上 65.0% vs 56.3%，OK-VQA 上也超越了对手。',
      caption: 'SOTA 零样本性能，参数效率提升 54 倍',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '④ 为什么能赢？',
      emoji: '🔬',
      text: '因为 BLIP-2 选了两个最强的"预训练大脑"：最大的图像编码器 ViT-g + 最强的 LLM FlanT5-XXL，再用聪明的翻译官把它们高效连接。',
      caption: '更强的编码器 + 更强的 LLM = 更好的效果',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="零样本 VQA · 裸考奇迹" panels={panels} />;
};

// ========== 第 8 章：图像描述与检索 ==========
export const Ch8Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 看图写作文',
      emoji: '✍️',
      text: '图像描述任务：给一张图，写一段流畅准确的描述。考的是"从视觉到语言的完整生成能力"。NoCaps 数据集上零样本达到 SOTA。',
      caption: 'Captioning：开放域图像描述能力',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      title: '② 图文找朋友',
      emoji: '🔍',
      text: '检索任务：给一句话，从一堆图里找出最匹配的那张，反过来也一样。考的是"细粒度跨模态对齐能力"。COCO 和 Flickr30K 上大幅领先。',
      caption: 'Retrieval：图文配对检索能力',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '③ ITC + ITM 的作用',
      emoji: '🎯',
      text: '检索为什么提升这么大？因为第一阶段的对比学习（ITC）和匹配判断（ITM）就是专门训练图文对齐的，检索能力自然就强。',
      caption: 'ITC + ITM = 检索核心，对齐质量高',
      bg: '#faf5ff',
      border: '#c4b5fd',
    },
    {
      title: '④ ITG 也能提升检索？',
      emoji: '🤯',
      text: '一个意外发现：图像生成（ITG）损失不仅提升了描述质量，还反过来提升了检索性能！说明"理解"和"生成"是互相促进的。',
      caption: 'Ablation Finding：ITG 也能提升检索性能',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="描述与检索 · 综合大考" panels={panels} />;
};

// ========== 第 9 章：消融分析 ==========
export const Ch9Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 实验组 A：完整两阶段',
      emoji: '✅',
      text: 'A 组学徒完整训练了第一阶段基本功（表示学习），然后再进入第二阶段对接 LLM。成绩优秀，VQA 准确率 65.0%。',
      caption: 'w/ Representation Learning：完整两阶段',
      bg: '#f0fdf4',
      border: '#86efac',
    },
    {
      title: '② 实验组 B：跳过基本功',
      emoji: '❌',
      text: 'B 组学徒直接跳过基本功，上来就学习对接冻结的 LLM。成绩一落千丈——不仅远不如 A 组，甚至出现了严重的"灾难性遗忘"。',
      caption: 'w/o Representation Learning：直接第二阶段',
      bg: '#fef2f2',
      border: '#fca5a5',
    },
    {
      title: '③ 为什么会这样？',
      emoji: '💔',
      text: '跨模态鸿沟太大了，直接硬桥接只会把两边都搞乱。就像学写字得先练笔画，不能直接上来就写整篇文章。',
      caption: '模态鸿沟太大，需要先对齐表示再桥接',
      bg: '#fffbeb',
      border: '#fcd34d',
    },
    {
      title: '④ 结论：两阶段是刚需',
      emoji: '🔑',
      text: '实验证明：先让 Q-Former 学会"理解"图像（表示对齐），再慢慢引导它去连接 LLM。两步走，是不可或缺的。',
      caption: 'Conclusion：两阶段设计是经过验证的必要路径',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
  ];
  return <ComicTemplate title="消融实验 · 基本功到底有多重要" panels={panels} />;
};

// ========== 第 10 章：总结与启示 ==========
export const Ch10Comic: React.FC = () => {
  const panels: ComicPanel[] = [
    {
      title: '① 方法论的胜利',
      emoji: '🏆',
      text: 'BLIP-2 最伟大的贡献不是又一个更大的模型，而是一种全新的方法论：不需要从头训练大模型，找对桥接方法就能拼接最强系统。',
      caption: 'Methodology Victory：站在巨人肩膀上',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      title: '② 冻结 + 轻量桥接',
      emoji: '🧊',
      text: '冻结两个最强单模态模型，只训练一个轻量级桥接器（Q-Former）。用 1/54 的可训练参数，达到甚至超越端到端大模型的效果。',
      caption: 'Frozen + Lightweight Bridge = Efficient VLP',
      bg: '#f0f9ff',
      border: '#7dd3fc',
    },
    {
      title: '③ 可替换的通用范式',
      emoji: '🔄',
      text: '这个范式非常通用：换一个更强的图像编码器，效果更好；换一个更强的 LLM，效果也更好。它不是绑定特定模型，而是一种通用的桥接范式。',
      caption: 'Generic Paradigm：可替换任意冻结模型',
      bg: '#faf5ff',
      border: '#c4b5fd',
    },
    {
      title: '④ 局限与未来',
      emoji: '🚀',
      text: '当然也有局限：上下文学习能力有限，继承了 LLM 的固有缺陷（幻觉、信息泄露等）。但它为整个多模态 AI 领域指明了一条高效发展的道路。',
      caption: 'Limitations & Future：更高效、更通用的多模态',
      bg: '#f0fdf4',
      border: '#86efac',
    },
  ];
  return <ComicTemplate title="总结 · 站在巨人肩膀上" panels={panels} />;
};
