import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'HiDream-O1-Image',
    titleZh: '像素级统一Transformer的原生统一图像生成基础模型',
    venue: 'arXiv 2026',
    authors:
      'Qi Cai, Jingwen Chen, Chengmin Gao, Zijian Gong, Yehao Li, Yingwei Pan, Yi Peng, Zhaofan Qiu, Kai Yu, Yiheng Zhang, Hao Ai, Siying Bai, Yang Chen, Zhihui Chen, Fengbin Gao, Ying Guo, Dong Li, Zhen Shen, Leilei Shi, Jing Wang, Siyu Wang, Yimeng Wang, Rui Zheng, Ting Yao, Tao Mei',
    affiliation: 'HiDream.ai',
    domain: '统一图像生成 / 多任务基础模型',
    coreProblem:
      '传统LDM依赖VAE压缩和分离文本编码器，图像细节会被瓶颈吞掉，文本与图像的语义也常常对不齐。',
    coreInsight:
      'HiDream-O1-Image把文本、条件图像和待生成图像都映射到同一个Token空间，让统一Transformer像理解语言一样理解图像生成、编辑与推理。',
    keywords: ['统一Token空间', '像素空间扩散', '混合统一注意力', 'Prompt Agent', '2048×2048']
  },
  hero: {
    oldMethod: {
      desc: '先压缩再生成，信息在搬运里慢慢丢。',
      componentId: 'ldm-pipeline-animation'
    },
    newMethod: {
      desc: '不压缩，直接在统一Token空间里生成。',
      componentId: 'hidream-unified-animation'
    }
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '统一架构：先看 HiDream 把什么放进了同一个空间',
      badge: 'inf',
      badgeLabel: '总览',
      bridge: '先抓住一件事：这篇论文不是把旧路线修修补补，而是直接换成统一Token空间。',
      analogy: {
        title: '先统一，再处理',
        text: '如果所有输入都先翻译成同一种数学语言，Transformer 就能同时读懂文字、条件图像和待生成图像。',
        componentId: 'hidream-architecture-flow'
      },
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '模型整体架构图',
          desc: '直接用架构图看三种输入如何汇入共享空间，以及统一Transformer如何输出高保真图像。',
          componentId: 'hidream-architecture-flow'
        }
      ],
      takeaways: [
        { icon: '1', title: '统一空间', desc: '三种输入先翻译成同一种Token。' },
        { icon: '2', title: '一个主干', desc: '统一Transformer负责理解与生成。' },
        { icon: '3', title: '直接像素', desc: '不再依赖先压缩后还原的旧管道。' }
      ]
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '数据获取与去重：先把训练语料洗干净',
      badge: 'trn',
      badgeLabel: '数据',
      bridge: '这一步的核心不是“多拿数据”，而是先看清六大来源，再把重复与近重复清掉。',
      analogy: {
        title: '先筛干净，再喂模型',
        text: '大模型吃进去的数据如果重复太多，会把记忆当能力；先去重，模型才会学得更稳。',
        componentId: 'washing-veggies-canvas'
      },
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '构建通才模型的数据底座',
          desc: '先用六类来源看数据是从哪里来的，再用 SSCD 做语义去重，借 Faiss 把相似样本快速找出来。',
          componentId: 'data-sources-dedup'
        }
      ],
      takeaways: [
        { icon: 'A', title: '六源汇总', desc: '来源先分清，数据结构才不乱。' },
        { icon: 'B', title: '语义去重', desc: '不是只删文件名重复，而是删语义重复。' },
        { icon: 'C', title: '样本质量', desc: '留下更稀疏、更有信息量的训练集。' }
      ]
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '数据质量过滤：让样本先过六道关',
      badge: 'both',
      badgeLabel: '质检',
      bridge: '去重之后还不够，图像还得过安全、审美和一致性这些关卡。',
      analogy: {
        title: '层层筛选，才敢训练',
        text: '一张图不仅要“能看”，还要“安全”“好看”“说得对”；这些条件叠起来，训练集才真的可用。',
        componentId: 'conveyor-sort-canvas'
      },
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '六维质检流水线',
          desc: '把安全、审美和图文一致性串成一条过滤链，逐层筛掉不适合进入训练集的样本。',
          componentId: 'quality-filter-challenge'
        }
      ],
      takeaways: [
        { icon: '1', title: '先安全', desc: 'NSFW 等明显风险先挡掉。' },
        { icon: '2', title: '再审美', desc: '清晰、完整、构图稳的样本优先。' },
        { icon: '3', title: '再一致', desc: '图和文得说同一件事。' }
      ]
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '提示词构建：Qwen3-VL 不是在“描述图”',
      badge: 'trn',
      badgeLabel: '标注',
      bridge: '自动标注不是一份通用说明书，而是按任务类型生成不同格式的训练提示。',
      analogy: {
        title: '按任务出题，而不是只看图说话',
        text: '同样是一张图，生成、编辑、理解任务要的提示格式不同，Qwen3-VL 负责把这件事拆开。',
        componentId: 'mold-cut-canvas'
      },
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: 'Qwen3-VL 智能标注工坊',
          desc: '根据生成、编辑和多模态理解等任务，自动产出不同格式的训练提示。',
          componentId: 'prompt-construction-workshop'
        }
      ],
      takeaways: [
        { icon: 'T', title: '任务识别', desc: '先判断这张图该做什么任务。' },
        { icon: 'V', title: '格式生成', desc: '不同任务输出不同训练提示。' },
        { icon: 'L', title: '自动标注', desc: '减少人工整理，也减少格式不一致。' }
      ]
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '三阶段训练：从基础关联到高保真',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '先在低分辨率上学会基础关联，再逐步抬升分辨率和推理难度。',
      analogy: {
        title: '阶梯式爬坡',
        text: '分辨率从 512 到 2048，一层层把任务、上下文和细节能力堆起来。像小火慢炖到中火翻炒，再到大火收汁，能力是一层层练出来的。',
        componentId: 's5-cooking-canvas'
      },
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '三阶段训练进度条',
          desc: '按 Stage I、II、III 逐步抬升分辨率和任务难度，先学关联，再学推理，最后学高保真。',
          componentId: 's5-stage-progress'
        },
        {
          kind: 'module',
          id: '5.2',
          title: '后训练精修：SFT + RLHF',
          desc: '三阶段训练之后再做后训练：SFT 打磨美学与真实感，RLHF（GRPO）用奖励信号对齐指令与推理质量，让模型不只会做，还做得好看、做得对。',
          componentId: 's5-post-training'
        }
      ],
      takeaways: [
        { icon: 'I', title: 'Stage I', desc: '512×512，学基础关联。' },
        { icon: 'II', title: 'Stage II', desc: '1024×1024，学上下文推理。' },
        { icon: 'III', title: 'Stage III', desc: '2048×2048，学高保真精炼。' }
      ]
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '快速推理：28 步蒸馏加速',
      badge: 'both',
      badgeLabel: '推理',
      bridge: '训练好高质量教师模型之后，还要把采样步数压下来，让统一模型真正跑得快。',
      analogy: {
        title: '把慢炖浓汤压缩成快手菜谱',
        text: '完整版像慢火细炖，约 50 步一步步去噪；蒸馏版把教师模型的动态学下来，用 28 步尽量复现同样的生成轨迹。',
        componentId: 's6-quick-recipe-canvas'
      },
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '28 步蒸馏采样模板',
          desc: '完整版约 50 步去噪，质量高但速度慢；HiDream-O1-Image-Dev 通过 28 步采样显著加快生成，同时用 DMD 和 GAN 判别器增强保持感知保真度。',
          componentId: 's6-distill-canvas'
        },
        {
          kind: 'module',
          id: '6.2',
          title: '蒸馏损失函数拆解',
          desc: '快速版把分布匹配蒸馏、扩散监督和对抗增强合在一起，让学生模型既学教师生成动态，也保留视觉质量。',
          componentId: 's6-loss-formula'
        }
      ],
      formula: {
        lead: '快速版本把分布匹配蒸馏、扩散监督和对抗增强合在一起，让学生模型既学教师生成动态，也保留视觉质量。',
        unicode: 'L_fast = L_DMD + L_diff + L_adv',
        symbols: [
          { sym: 'L_DMD', desc: '分布匹配蒸馏，让 28 步采样贴近教师模型的生成分布' },
          { sym: 'L_diff', desc: '扩散监督，保留逐步去噪过程中的稳定性' },
          { sym: 'L_adv', desc: 'GAN 判别器增强，提升感知保真度与细节真实感' }
        ]
      },
      takeaways: [
        { icon: '50', title: '完整版', desc: '约 50 步去噪，质量高但速度慢。' },
        { icon: '28', title: '蒸馏版', desc: 'HiDream-O1-Image-Dev 28 步采样，生成显著加快。' },
        { icon: 'D', title: '保真加速', desc: 'DMD + GAN 判别器增强，保留教师模型生成动态。' }
      ]
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '性能对比：8B 为什么能打过更大模型',
      badge: 'both',
      badgeLabel: '结果',
      bridge: '这部分要看的不是单个数字，而是“参数效率”这条故事线。',
      analogy: {
        title: '不是更大，而是更会用',
        text: '8B 能赢 27B，不是靠堆参数，而是靠统一表示、像素建模和训练策略把每个参数都榨出价值。',
        componentId: 's7-efficiency-canvas'
      },
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: 'GenEval 雷达图',
          desc: '对比 HiDream-O1-Image、HiDream-O1-Image-Pro、Qwen-Image 和 FLUX.2 [Dev] 的各维度结果。',
          componentId: 's7-geneval-radar'
        },
        {
          kind: 'module',
          id: '7.2',
          title: '目标函数堆叠',
          desc: '把 L_total = L_DMD + λ_diff·L_diff + λ_adv·L_adv 拆成蒸馏、扩散和对抗三部分。',
          componentId: 's7-objective-stack'
        }
      ],
      formula: {
        lead: '总体目标函数由蒸馏、扩散和对抗三部分组成，分别负责效率、去噪和视觉质量。',
        unicode: 'L_total = L_DMD + λ_diff · L_diff + λ_adv · L_adv',
        symbols: [
          { sym: 'L_total', desc: '总体训练目标' },
          { sym: 'L_DMD', desc: 'DMD 蒸馏损失' },
          { sym: 'L_diff', desc: '标准扩散损失' },
          { sym: 'L_adv', desc: '对抗损失' }
        ]
      },
      takeaways: [
        { icon: '8B', title: '参数效率', desc: '8B 也能打出高分。' },
        { icon: '27B', title: '对比基线', desc: 'Qwen-Image 27B 作为强基线。' },
        { icon: '56B', title: '更大不必更强', desc: '更大的模型不一定更优。' }
      ]
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '应用与总结：统一架构到底能做什么',
      badge: 'both',
      badgeLabel: '总结',
      bridge: '最后把电影镜头、故事板、电商编辑和头像生成串成一条完整的能力链。',
      analogy: {
        title: '回看整条路',
        text: '从数据到训练，再到推理与应用，HiDream 的主线始终是统一Token空间和原生像素保真。',
        componentId: 's8-journey-canvas'
      },
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '应用场景补充',
          desc: '电影镜头控制、多面板故事板、电商产品图编辑和个性化头像生成等任务一起看。',
          componentId: 's8-application-gallery'
        },
        {
          kind: 'module',
          id: '8.2',
          title: 'Prompt Agent 思考链',
          desc: '把复杂提示拆成主体、属性、场景和空间关系，再生成更精炼的指令。',
          componentId: 's8-prompt-agent-canvas'
        },
        {
          kind: 'module',
          id: '8.3',
          title: '核心洞察回顾',
          desc: '用一句话和三个关键词，把整篇论文再收束一遍。',
          componentId: 's8-insight-canvas'
        },
        {
          kind: 'module',
          id: '8.4',
          title: '三个关键词主轴',
          desc: 'Native Unification、In-Context Reasoning、Scaling Law 三个关键词几乎就是整篇论文的主轴。',
          componentId: 's8-keyword-formula'
        }
      ],
      insight:
        '一句话：HiDream-O1-Image把所有信息放到同一个Token空间，让Transformer像理解语言一样理解图像生成。',
      formula: {
        lead: '记住三个关键词，它们几乎就是这篇论文的主轴。',
        unicode: 'Native Unification + In-Context Reasoning + Scaling Law',
        symbols: [
          { sym: 'Native Unification', desc: '原生统一' },
          { sym: 'In-Context Reasoning', desc: '上下文推理' },
          { sym: 'Scaling Law', desc: '缩放定律' }
        ]
      },
      takeaways: [
        { icon: 'N', title: 'Native Unification', desc: '原生统一是方法主线。' },
        { icon: 'R', title: 'In-Context Reasoning', desc: '上下文推理让复杂任务更自然。' },
        { icon: 'S', title: 'Scaling Law', desc: '缩放定律解释训练与效果提升。' }
      ]
    }
  ]
};
