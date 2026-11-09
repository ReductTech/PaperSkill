import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "PaLM-E: An Embodied Multimodal Language Model",
    "titleZh": "PaLM-E：具身多模态语言模型",
    "venue": "arXiv v1 · 2023",
    "authors": "Danny Driess、Fei Xia、Mehdi S. M. Sajjadi 等",
    "affiliation": "Robotics at Google · TU Berlin · Google Research",
    "domain": "具身推理与机器人规划",
    "coreProblem": "机器人收到指令后，怎样根据眼前的变化决定下一步？",
    "coreInsight": "把连续观测编码成与词嵌入同宽的向量，与文字交错输入 PaLM。",
    "keywords": [
      "具身推理",
      "多模态前缀",
      "闭环规划"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "仅文本输入",
      "desc": "同一句指令看不到海绵被挪到哪里。",
      "componentId": "palm-cover-text"
    },
    "newMethod": {
      "title": "PaLM-E 多模态输入",
      "desc": "把抽屉的当前图像和任务文字一起交给模型。",
      "componentId": "palm-cover-seen"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "让指令接触现场",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "文本指令看不见抽屉",
          "desc": "打开抽屉或切换视图，比较规划可用的证据。",
          "componentId": "palm-ground"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "把观测插进多模态前缀",
          "desc": "打开第二台相机，观察前缀增加一组观测向量。",
          "componentId": "palm-prefix"
        }
      ],
      "scenes": [
        {
          "id": "ground",
          "title": "文本指令看不见抽屉",
          "goal": "同一句指令，现场变化后还够用吗？",
          "summary": "只给文本会丢失物体位置。把当前观测加入输入，模型才有现场依据。",
          "interaction": "打开抽屉或切换视图，比较规划可用的证据。",
          "componentId": "palm-ground",
          "next": "把观测插进多模态前缀",
          "notes": "第 1 页 §1、图 1；第 4 页 §3。厨房布局与决策为教学演示。论文指出几何信息对具身推理重要，并未报告这项抽屉对照的成功率。",
          "moduleId": "1.1"
        },
        {
          "id": "prefix",
          "title": "把观测插进多模态前缀",
          "goal": "一张照片如何出现在两个文字片段之间？",
          "summary": "连续观测绕过离散词表，经编码器变成同宽向量，与文本嵌入交错排列。",
          "interaction": "打开第二台相机，观察前缀增加一组观测向量。",
          "componentId": "palm-prefix",
          "next": "不同传感器如何对齐嵌入",
          "notes": "第 4 页 §3，式 (3)。一个观测通常产生多个向量。演示的向量个数只为便于阅读。",
          "moduleId": "1.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "表示决定可见信息",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "不同传感器如何对齐嵌入",
          "desc": "选择一种传感器输入，对照其经过的变换和输出形状。",
          "componentId": "palm-encode"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "给同色对象一个可引用的身份",
          "desc": "切换目标海绵，观察同一颜色词与两条对象引用的区别。",
          "componentId": "palm-refer"
        }
      ],
      "scenes": [
        {
          "id": "encode",
          "title": "不同传感器如何对齐嵌入",
          "goal": "状态向量、图像和对象槽用同一种接法吗？",
          "summary": "编码方式可以不同，交给 PaLM 的每个输入向量都要与词嵌入同宽。",
          "interaction": "选择一种传感器输入，对照其经过的变换和输出形状。",
          "componentId": "palm-encode",
          "next": "给同色对象一个可引用的身份",
          "notes": "第 5 页 §4；第 4 页 §3，式 (3)。状态 MLP、ViT 后学习的仿射投影、OSRT 槽后的 MLP 分别为所述配置。图示槽数和向量数仅作演示。",
          "moduleId": "2.1"
        },
        {
          "id": "refer",
          "title": "给同色对象一个可引用的身份",
          "goal": "有两块一样的黄色海绵，语言怎么指对？",
          "summary": "把对象嵌入与对象编号配对，计划就可以引用编号。执行器也必须懂这个编号。",
          "interaction": "切换目标海绵，观察同一颜色词与两条对象引用的区别。",
          "componentId": "palm-refer",
          "next": "文本计划怎样驱动机器人",
          "notes": "第 5 页 §4 Entity referrals。对象编号是当前提示中的引用，要求低层策略支持；它不保证跨帧身份稳定。",
          "moduleId": "2.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "生成、执行与学习",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "文本计划怎样驱动机器人",
          "desc": "逐步执行，观察文本子任务、厨房状态和下一步同步变化。",
          "componentId": "palm-loop"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "训练只给回答部分计损失",
          "desc": "调整目标词元的预测概率，观察平均损失变化。",
          "componentId": "palm-loss"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "冻结 PaLM 与联合微调",
          "desc": "切换训练方式，看哪些部件接受参数更新。",
          "componentId": "palm-freeze"
        }
      ],
      "scenes": [
        {
          "id": "loop",
          "title": "文本计划怎样驱动机器人",
          "goal": "模型输出一句话之后，谁让机械臂动起来？",
          "summary": "PaLM-E 生成文本子任务，低层策略执行。新图像与步骤历史一起参与下一次生成。",
          "interaction": "逐步执行，观察文本子任务、厨房状态和下一步同步变化。",
          "componentId": "palm-loop",
          "next": "训练只给回答部分计损失",
          "notes": "第 4 页 §3 Embodying the output；第 8 页 §6.4。移动操作实验使用 RT-1 作低层控制。演示是规则模拟，没有运行 PaLM-E 或 RT-1。",
          "moduleId": "3.1"
        },
        {
          "id": "loss",
          "title": "训练只给回答部分计损失",
          "goal": "观测在输入里，训练时要预测图像向量吗？",
          "summary": "多模态前缀为条件，交叉熵只对后续目标文本词元取平均。",
          "interaction": "调整目标词元的预测概率，观察平均损失变化。",
          "componentId": "palm-loss",
          "next": "冻结 PaLM 与联合微调",
          "notes": "第 5 页 §5；第 4 页式 (2)。两词元的概率是合成示例；固定另一个词元的概率，用自然对数计算。",
          "moduleId": "3.2"
        },
        {
          "id": "freeze",
          "title": "冻结 PaLM 与联合微调",
          "goal": "两种训练方式改变的是哪一段参数？",
          "summary": "冻结 PaLM 时，编码侧仍可学习如何提供合适的输入；联合微调也更新语言模型。",
          "interaction": "切换训练方式，看哪些部件接受参数更新。",
          "componentId": "palm-freeze",
          "next": "少样本 TAMP 规划的迁移",
          "notes": "第 5–6 页 §5 Variation with Model freezing。这里以可训练视觉编码器加投影器为例。OSRT 配置同时冻结槽表征，只更新小投影器。",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "数据说明了什么",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "用新观测重做一步",
          "desc": "制造干扰，再切换是否读取当前观测，观察下一步选择。",
          "componentId": "palm-repair"
        }
      ],
      "scenes": [
        {
          "id": "tamp",
          "title": "少样本 TAMP 规划的迁移",
          "goal": "同为 PaLM-E-12B，换训练配方后怎样？",
          "summary": "TAMP 的少样本规划中，全混合配方在冻结和微调两种设置下都高于各自单机器人配方。",
          "interaction": "对照同一规划协议下的五组报告值。",
          "componentId": "palm-tamp",
          "next": "少样本桌面推物的训练对比",
          "notes": "第 7 页图 4；第 8 页表 1。3–5 对象；TAMP 只用 1% 任务训练数据，p₁、p₂ 各 320 样本。结果是两任务平均成功率，越高越好。图 4 的 42.9% 属于单机器人、无预训练的对照。"
        },
        {
          "id": "table",
          "title": "少样本桌面推物的训练对比",
          "goal": "只有 10 次示范时，联合训练配方表现如何？",
          "summary": "在这三项仿真推物任务中，预训练加全混合的配方高于从头训练的单机器人配方。",
          "interaction": "在同一示范数下对照三个任务的两组成功率。",
          "componentId": "palm-table",
          "next": "具身模型仍能做通用任务吗",
          "notes": "第 9 页表 2–3，§6.3。同是 PaLM-E-12B、每任务 10 次示范，并都按任务微调。两配方同时改变预训练和数据混合，不能将差异单独归因于 TAMP 或某一来源。"
        },
        {
          "id": "general",
          "title": "具身模型仍能做通用任务吗",
          "goal": "视觉问答成绩与语言能力保留应怎样解读？",
          "summary": "同一 562B 通用检查点完成了多种视觉语言任务。相对原始 PaLM 的 NLG 降幅随比较规模而不同。",
          "interaction": "分开阅读视觉任务指标与 NLG 相对降幅。",
          "componentId": "palm-general",
          "next": "用新观测重做一步",
          "notes": "第 9 页表 5、图 6；第 17 页表 8。OK-VQA 验证集、VQAv2 test-dev 与 COCO Karpathy 指标不可混比。NLG 取相对各自 PaLM 的降幅。562B 的降幅按图 6 和 §6.6 正文取 3.9%，附录表 8 列为 3.8%，保留原文差异。"
        },
        {
          "id": "repair",
          "title": "用新观测重做一步",
          "goal": "东西被放回抽屉后，旧计划还靠谱吗？",
          "summary": "新观测可以暴露旧计划过时。高层可重新安排步骤，实际执行仍受已有低层技能约束。",
          "interaction": "制造干扰，再切换是否读取当前观测，观察下一步选择。",
          "componentId": "palm-repair",
          "next": "回看封面，复述观察、规划与执行的关系。",
          "notes": "第 4 页 §3；第 8 页图 5、§6.4。图 5 记录的是定性真机案例。教学模型预设技能和恢复规则，不代表任意干扰都能恢复。",
          "moduleId": "4.1"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "ground": "./thumbnails/ground.jpg",
    "prefix": "./thumbnails/prefix.jpg",
    "encode": "./thumbnails/encode.jpg",
    "refer": "./thumbnails/refer.jpg",
    "loop": "./thumbnails/loop.jpg",
    "loss": "./thumbnails/loss.jpg",
    "freeze": "./thumbnails/freeze.jpg",
    "tamp": "./thumbnails/tamp.jpg",
    "table": "./thumbnails/table.jpg",
    "general": "./thumbnails/general.jpg",
    "repair": "./thumbnails/repair.jpg"
  }
};
