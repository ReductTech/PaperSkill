import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning to Prompt for Vision-Language Models",
    "titleZh": "CoOp：让提示学会适应任务",
    "venue": "IJCV 2022 · arXiv v6",
    "authors": "Kaiyang Zhou · Jingkang Yang · Chen Change Loy · Ziwei Liu",
    "affiliation": "S-Lab · 南洋理工大学",
    "domain": "视觉语言模型 · 少样本适配",
    "coreProblem": "人工提示对措辞敏感，换一个任务就要反复试词。能否用少量标注图片，让模型自己学习合适的提示？",
    "coreInsight": "CLIP 已经学过图片与文字的对应关系，可以通过比较文字描述给图片分类。CoOp（Context Optimization，上下文优化）想解决一个问题：换到具体任务时，能否让少量标注图片教会模型使用什么提示？<br/><br/>这 10 章从“只改一个词”开始，逐步说明学什么、怎么学，以及实验支持怎样的结论；公式可以在操作后再看。",
    "keywords": [
      "CLIP",
      "连续提示",
      "上下文优化",
      "少样本学习",
      "冻结权重"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "人工试词：为各个类别写文字描述，再反复选择合适的措辞。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "让提示学习：用少量“图片＋类别标签”调整提示的数字表示，CLIP 原有权重保持不变。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "一句提示，\n为什么改变成绩？",
      "badge": "inf",
      "badgeLabel": "提示与任务",
      "bridge": "CLIP 学过图像与文字的对应关系。给图片分类时，它会把图片和各个类别的描述逐一比较。像“a photo of a cat”这样的描述叫作提示（prompt）。两条提示只差一个 a，准确率会相差多少？",
      "analogy": {
        "title": "改写标签",
        "text": "给同一张图片配不同的标签用语，识别成绩可能不同。人工提示需要试词，CoOp 则让少量标注图片帮助调整上下文。",
        "componentId": "analogy-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "换几个词，看看真实成绩",
          "desc": "先在 Caltech101 中比较第 2、3 条模板，再加入 CoOp 对照。数值来自论文第 2 页图 1，表示整个测试集的分类准确率；照片与标签仅是教学插图。",
          "componentId": "prompt-lab"
        }
      ],
      "insight": "CoOp 把反复人工试词，转变为用少量标注图片学习提示的数字表示。",
      "takeaways": [
        {
          "icon": "🔎",
          "title": "措辞确实重要",
          "desc": "图 1 中，Caltech101 的两条模板只差一个 a，准确率却由 80.81% 变为 86.29%。"
        },
        {
          "icon": "📋",
          "title": "先看监督条件",
          "desc": "零样本指不使用当前任务的标注图片进行适配，并非模型从未训练。这里的 CoOp 使用每类 16 张标注图；两者的下游监督预算不同。"
        },
        {
          "icon": "🧩",
          "title": "从词走向向量",
          "desc": "下一步先看文字如何成为数字，才能弄清“学习提示”究竟更新了什么。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "文字进入模型以后，\n会变成什么？",
      "badge": "inf",
      "badgeLabel": "向量与输入",
      "bridge": "前一章换的是句子中的词。现在把提示拆成“上下文＋类别名称”，看看文字怎样变成数字，以及 CoOp 把哪一部分变成了可学习参数。",
      "analogy": {
        "title": "放大标签",
        "text": "标签上看得懂的文字，进入模型后会成为数字表示。软提示直接从这些数字表示开始学习。",
        "componentId": "analogy-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "拆开提示，找到可学习的部分",
          "desc": "依次看文字、输入数字和可学习输入；每一步留意哪些部分改变、哪些保持固定。依据论文第 4 页 §3.1、第 5 页式（2）；图中维度和数字均为教学示意。",
          "componentId": "embedding-lab"
        }
      ],
      "insight": "CoOp 学习的是输入端的连续上下文向量；它们经过文本编码器后，才成为用于分类的文本特征。",
      "formula": {
        "lead": "以类别名称放在末尾为例，按顺序拼接上下文向量与类别名称。这里省略起止符号和填充位置。",
        "lines": [
          {
            "label": "第 i 类的提示输入",
            "tex": "\\sym{prompt} = [\\sym{first}]\\cdots[\\sym{last}][\\sym{className}]"
          }
        ],
        "symbols": {
          "prompt": {
            "tex": "t_i",
            "name": "提示输入",
            "desc": "第 i 类的完整提示序列，最终会送进文本编码器。"
          },
          "first": {
            "tex": "v_1",
            "name": "第一个上下文向量",
            "desc": "一组可训练的数字。每个向量有 d 个分量。"
          },
          "last": {
            "tex": "v_M",
            "name": "第 M 个上下文向量",
            "desc": "上下文共有 M 个向量。M 只计可学习位置。"
          },
          "className": {
            "tex": "c_i",
            "name": "类别名称",
            "desc": "第 i 类名称的固定词嵌入序列。一个类别名称可能含有多个词元。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "🔢",
          "title": "向量是输入表示",
          "desc": "词嵌入是一组数字；它与编码完成后用于匹配的文本特征不是同一个对象。"
        },
        {
          "icon": "🔒",
          "title": "类别名称保持固定",
          "desc": "式（2）只把上下文变成可学习向量，类别词嵌入及预训练编码器权重固定。"
        },
        {
          "icon": "🪄",
          "title": "不必读成一句话",
          "desc": "软提示不受自然语言词表限制；表 4 的最近词检索也不能将它可靠地翻译成句子。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "输入能变，\n固定模型也能适应",
      "badge": "inf",
      "badgeLabel": "核心洞见",
      "bridge": "文本编码器把输入向量转换为整段文字的特征。保留它原有的权重，只改上一章找到的上下文向量。猫和狗的文本特征会怎样移动？",
      "analogy": {
        "title": "换标签内容",
        "text": "标签夹保持固定，夹住的标签内容仍可以调整。对应到模型：编码器权重固定，输入改变仍能影响输出。",
        "componentId": "analogy-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "只动输入，观察三个类别怎样响应",
          "desc": "先看“同一 V＋不同类别名”三条输入，再拖动 V，比较三个输出的变化。教学模型依据第 5 页式（2）–（3）演示输入与输出的关系，坐标不是 CLIP 的真实表示。",
          "componentId": "context-lab"
        }
      ],
      "insight": "固定的是编码器权重；改变上下文仍会改变输出。共享 V 的各类别保留不同名称，因此完整输入不同。",
      "formula": {
        "lead": "各类共享上下文 V，并分别拼接自己的名称。把冻结的文本编码、投影与归一化合写为 g。",
        "lines": [
          {
            "label": "从提示到文本特征",
            "tex": "\\sym{feature} = \\sym{encoder}\\bigl([\\sym{context},\\,\\sym{className}]\\bigr)"
          }
        ],
        "symbols": {
          "feature": {
            "tex": "w_i",
            "name": "类别文本特征",
            "desc": "第 i 类归一化后的文本特征，用来与图片特征比较。"
          },
          "encoder": {
            "tex": "g",
            "name": "文本编码过程",
            "desc": "固定的计算过程在这里合并了编码、投影和输出归一化。改变它的输入，输出仍可能改变。"
          },
          "context": {
            "tex": "V",
            "name": "共享上下文",
            "desc": "同一任务中各类别共用的可学习上下文。真实方法中它是 M × d 的矩阵，本章用两个数值演示。"
          },
          "className": {
            "tex": "c_i",
            "name": "类别名称",
            "desc": "第 i 类名称对应的固定输入向量序列，用于区分各类提示。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "🔐",
          "title": "固定规则，输入可变",
          "desc": "式（2）–（3）保留预训练模型，只更新上下文；文本特征随输入重新计算。"
        },
        {
          "icon": "🔗",
          "title": "共享并非相同",
          "desc": "共享的是 V，不是整个提示或最终特征；三个类别的输出变化相互关联，却无需一致。"
        },
        {
          "icon": "🎯",
          "title": "接下来比较相似度",
          "desc": "本章只是手动探查输入的影响，还没有自动学习。要让模型知道怎样调得更好，需要把特征比较成概率，再用训练标签产生损失。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "相似度怎样变成\n分类概率？",
      "badge": "both",
      "badgeLabel": "数学机制",
      "bridge": "类别文本特征已经准备好，还要与图片特征比较：特征方向越接近，匹配分数通常越高。现在只调一个候选的分数，观察它怎样影响所有类别的概率，并理解训练时为什么需要“损失”。",
      "analogy": {
        "title": "移动分隔片",
        "text": "把候选类别想成共享一份空间：一个候选更有竞争力，其他候选的份额就可能下降。正文会用 softmax 给出确切计算。",
        "componentId": "analogy-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "猫的分数没变，概率为什么下降？",
          "desc": "点击狗卡上的“＋”，让它的分数追上并超过猫。观察猫的分数没变时，概率份额与损失怎样变化。正确标签在本例中设为猫；数值为教学计算，机制依据论文第 5 页式（1）、式（3）和训练说明。",
          "componentId": "probability-lab"
        }
      ],
      "insight": "分类概率取决于全部候选的相对分数，正确类别的分数不变，损失也可能增大。",
      "formula": {
        "lead": "先把图文相似度换成分类分数，再比较所有类别的分数。训练时，用正确类别得到的概率计算损失。",
        "lines": [
          {
            "label": "相似度 → 分数",
            "tex": "\\sym{score} = \\frac{\\sym{cosine}(\\sym{feature},\\sym{image})}{\\sym{temperature}}"
          },
          {
            "label": "分数 → 概率",
            "tex": "\\sym{prob} = \\frac{\\sym{exp}(\\sym{score})}{\\sym{sum}\\sym{exp}(\\sym{otherScore})}"
          },
          {
            "label": "正确类别的损失",
            "tex": "\\sym{loss} = -\\sym{log}\\sym{truth}"
          }
        ],
        "symbols": {
          "score": {
            "tex": "z_i",
            "name": "分类分数",
            "desc": "第 i 类经温度缩放后的匹配分数。本章可以直接调狗的分数，真实训练则通过改变提示来改变分数。"
          },
          "cosine": {
            "tex": "\\cos",
            "name": "余弦相似度",
            "desc": "比较两个特征的方向。归一化成单位向量后，其点积就等于余弦相似度。"
          },
          "feature": {
            "tex": "w_i",
            "name": "文本特征",
            "desc": "第 i 个候选类别的提示经文本编码生成的特征。"
          },
          "image": {
            "tex": "f",
            "name": "图像特征",
            "desc": "当前图片经图像编码得到的特征。"
          },
          "temperature": {
            "tex": "\\tau",
            "name": "温度",
            "desc": "一个正数，决定相似度转成分数时放大多少。CoOp 沿用 CLIP 的预训练值。"
          },
          "prob": {
            "tex": "p_i",
            "name": "类别概率",
            "desc": "当前图片划入第 i 类的概率。全部候选类别的概率之和为 1。"
          },
          "exp": {
            "tex": "\\exp",
            "name": "指数函数",
            "desc": "把分数 z 转成正权重，即自然常数 e 的 z 次方。"
          },
          "sum": {
            "tex": "\\sum_{j=1}^{K}",
            "name": "对全部类别求和",
            "desc": "K 是候选类别总数。让 j 逐一取 1 到 K，把每类的指数权重都加进分母。"
          },
          "otherScore": {
            "tex": "z_j",
            "name": "分母中的分数",
            "desc": "求和轮到第 j 类时，用这一类的分类分数算它的权重。"
          },
          "loss": {
            "tex": "L",
            "name": "分类损失",
            "desc": "这一张标注图片的交叉熵损失。分给正确类别的概率越高，损失越小。"
          },
          "log": {
            "tex": "\\ln",
            "name": "自然对数",
            "desc": "底数为 e 的对数。概率越接近 1，它的负自然对数越接近 0。"
          },
          "truth": {
            "tex": "p_y",
            "name": "正确类别的概率",
            "desc": "y 是图片的真实类别。若图片标签是猫，这里就取模型分给猫的概率。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "概率来自相对竞争",
          "desc": "论文式（3）的分母包含所有候选；某类概率下降，不等于它的相似度一定下降。"
        },
        {
          "icon": "📉",
          "title": "损失连接预测与监督",
          "desc": "交叉熵使用正确类别标签；这里的模拟概率不是数据集准确率。"
        },
        {
          "icon": "🧩",
          "title": "接下来分配可学习参数",
          "desc": "知道所有类别都参与比较后，还要决定它们共享上下文，还是各自学习一套。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "共享一套，\n还是每类一套？",
      "badge": "both",
      "badgeLabel": "方法设计",
      "bridge": "现在知道每个类别都要参与比较了。CoOp 可以让它们共用一组上下文，也可以让每类各学一组。亲手改一个数值，看看哪些提示会跟着变化，再探索类别名称的位置。",
      "analogy": {
        "title": "共用标签底板",
        "text": "一套可调标签模板能服务多个类别，也可以给每类准备自己的模板。共享的是上下文，不是类别名称。",
        "componentId": "analogy-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "改一处上下文，哪些提示一起变？",
          "desc": "先调整共享上下文中的一个数值，再切到每类一套（CSC，class-specific context）并选择一类单独调整。对照三条提示的响应，理解参数如何共用；依据论文第 5 页式（2）、式（4）。",
          "componentId": "sharing-lab"
        }
      ],
      "insight": "共享方式决定上下文有几套；类别位置决定怎样排列输入，两者可以独立组合。",
      "formula": {
        "lead": "每个向量有 d 个数值，一组上下文有 M 个向量。训练参数的总数取决于要学几组上下文。",
        "lines": [
          {
            "label": "共享上下文",
            "tex": "\\sym{shared} = \\sym{length}\\times\\sym{width}"
          },
          {
            "label": "类别专属上下文",
            "tex": "\\sym{specific} = \\sym{classes}\\times\\sym{length}\\times\\sym{width}"
          }
        ],
        "symbols": {
          "shared": {
            "tex": "N_{\\mathrm{shared}}",
            "name": "共享方案的参数量",
            "desc": "所有类别引用同一组输入向量，只训练这组上下文中的数值。"
          },
          "specific": {
            "tex": "N_{\\mathrm{CSC}}",
            "name": "类别专属方案的参数量",
            "desc": "CSC 为每类单独训练一组上下文，参数总数随类别数增加。"
          },
          "length": {
            "tex": "M",
            "name": "上下文长度",
            "desc": "可学习上下文向量的个数，只计可训练的位置。"
          },
          "width": {
            "tex": "d",
            "name": "向量维度",
            "desc": "一个上下文向量中的数值个数，本章示例取 512。"
          },
          "classes": {
            "tex": "K",
            "name": "类别数",
            "desc": "当前分类任务的候选类别总数。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "🔗",
          "title": "共享发生在一个任务内",
          "desc": "同一组上下文结合不同类别名称，仍会生成不同文本特征；并非所有数据集共用一套训练结果。"
        },
        {
          "icon": "📐",
          "title": "更多参数有条件地有效",
          "desc": "论文第 8 页观察到共享版本平均表现更好，CSC 在部分任务中有优势；参数量不是准确率或运行时间的换算表。"
        },
        {
          "icon": "🖼️",
          "title": "确定结构后再看使用",
          "desc": "无论采用哪种结构，训练结束都会得到固定的提示，下一节用它识别新的图片。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "识别新图片时，\n还要训练吗？",
      "badge": "inf",
      "badgeLabel": "推理流程",
      "bridge": "先假设提示已经训练好，看看它怎样被使用，这叫推理。沿着“图片→图片特征→与固定文本特征比较→预测”走一遍，再换一张图片检查哪些量保持不变。",
      "analogy": {
        "title": "拿标签认新图",
        "text": "训练好的标签用来识别新图片，不必每换一张图就重新制作标签。推理时，已学提示和文本特征保持固定。",
        "componentId": "analogy-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "换图片，检查什么变、什么不变",
          "desc": "选择一张图片，自动看完特征提取、比较与预测，再换图观察变化。固定的二维提示 V＝（0.5，−0.3）只是教学设定，未沿用上一章的手动选择；非真实 CLIP 推理，机制依据第 4–5 页式（1）至式（3）。",
          "componentId": "inference-lab"
        }
      ],
      "insight": "原始 CoOp 在推理时使用静态提示：图片特征和预测可以改变，已经学到的提示保持固定。",
      "formula": {
        "lead": "对同一张图片比较全部候选类别的概率。取概率最高的那个类别，作为预测结果。",
        "lines": [
          {
            "label": "选择预测类别",
            "tex": "\\sym{prediction} = \\sym{maximum}\\,\\sym{prob}"
          }
        ],
        "symbols": {
          "prediction": {
            "tex": "\\hat y",
            "name": "预测类别",
            "desc": "模型为当前图片选出的类别索引。"
          },
          "maximum": {
            "tex": "\\operatorname*{arg\\,max}_{i}",
            "name": "找出最大值的位置",
            "desc": "遍历候选类别 i，返回使概率最大的那个类别索引。"
          },
          "prob": {
            "tex": "p_i",
            "name": "候选概率",
            "desc": "当前图片属于第 i 个候选类别的预测概率。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "📌",
          "title": "提示已在适配阶段学好",
          "desc": "由论文式（2）至式（3）可知，原始 CoOp 的提示不以测试图片为输入，不逐图重新生成。"
        },
        {
          "icon": "🔄",
          "title": "固定网络仍响应新输入",
          "desc": "图片变化会改变图像特征；固定候选列表下的文本特征可以缓存，推理不需要正确标签。"
        },
        {
          "icon": "✏️",
          "title": "下一步追问怎样学好",
          "desc": "推理只使用参数，接下来回到训练，观察分类损失怎样推动上下文向量更新。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "一次错误，\n怎样教会提示？",
      "badge": "trn",
      "badgeLabel": "训练目标",
      "bridge": "刚才我们假设提示已经学好；现在回到它的学习过程。一张标注为“猫”的训练图片提供正确答案，损失衡量模型给猫的概率是否足够高，梯度则告诉我们每个提示数值该往哪个方向调整。",
      "analogy": {
        "title": "修改标签数值",
        "text": "用正确类别检查当前识别结果，再据此调整标签的数字表示。训练实际更新的是上下文向量。",
        "componentId": "analogy-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "亲手完成一次提示更新",
          "desc": "依次计算概率、损失、梯度，最后才执行更新。当前 V 从零开始；数值由同一个小型教学模型计算，学习率 0.15 仅用于演示，不是论文训练设置。方法依据第 5 页 Training。",
          "componentId": "training-lab"
        }
      ],
      "insight": "带标签图片产生分类损失，所有候选类别共同影响梯度；优化器最后只更新上下文 V。",
      "formula": {
        "lead": "先用标注类别的概率计算损失，再沿损失梯度的反方向更新可学习的提示。",
        "lines": [
          {
            "label": "计算损失",
            "tex": "\\sym{loss} = -\\sym{log}\\sym{prob}"
          },
          {
            "label": "一步梯度下降",
            "tex": "\\sym{context} \\leftarrow \\sym{context} - \\sym{rate}\\,\\sym{gradient}"
          }
        ],
        "symbols": {
          "loss": {
            "tex": "L",
            "name": "当前损失",
            "desc": "用当前训练图片的标签计算的交叉熵。"
          },
          "log": {
            "tex": "\\ln",
            "name": "自然对数",
            "desc": "同第 4 章，概率越接近 1，负自然对数越接近 0。"
          },
          "prob": {
            "tex": "p_y",
            "name": "正确类别的概率",
            "desc": "把当前训练图片分到其真实类别 y 的概率。"
          },
          "context": {
            "tex": "V",
            "name": "上下文参数",
            "desc": "箭头右侧读取更新前的 V，左侧接收更新后的 V。教学模型用两个数代表一组上下文向量。"
          },
          "rate": {
            "tex": "\\eta",
            "name": "学习率",
            "desc": "决定这次沿负梯度走多远。本章演示取 0.15。"
          },
          "gradient": {
            "tex": "\\nabla_V L",
            "name": "损失对上下文的梯度",
            "desc": "每个分量描述损失对一个上下文参数的局部变化率。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "🏷️",
          "title": "监督来自类别标签",
          "desc": "CoOp 用图片与类别标签学习上下文，不要求为每张训练图片编写一句描述。（第 5 页 Training）"
        },
        {
          "icon": "↔️",
          "title": "竞争类别也贡献梯度",
          "desc": "softmax 的分母包含所有类别；共享上下文收到各类别路径的梯度贡献，而不只来自正确类别。"
        },
        {
          "icon": "🔎",
          "title": "训练损失不是测试成绩",
          "desc": "单张训练图片的损失下降，只说明当前优化目标的变化。下一章继续检查：冻结的编码器怎样允许这个更新发生？"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "冻结权重，\n不等于切断梯度",
      "badge": "trn",
      "badgeLabel": "对照实验",
      "bridge": "上一步确实只改了上下文，但更新方向是怎样经过固定网络算出来的？前向计算先得到预测，反向传播再沿计算关系追溯各参数对损失的影响；本章把“不更新权重”和“切断这条关系”分开操作。",
      "analogy": {
        "title": "固定标签夹",
        "text": "夹具固定不动，插入的标签仍能调整。固定模型参数，并不阻止计算输入如何影响结果。",
        "componentId": "analogy-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "锁住权重后，学习信号还能通过吗？",
          "desc": "跟着按钮做两次对照：A 冻结编码器但保留梯度，B 冻结编码器并切断梯度。两次从相同数值出发，比较 V 与损失是否变化；方法依据论文第 4 页图 2、第 5 页 Training。",
          "componentId": "gradient-lab"
        }
      ],
      "insight": "冻结文本编码器仍可对输入 V 求导；若断开文本输出的计算关系，分类损失就无法教会提示。",
      "formula": {
        "lead": "把所有类别的文本特征按顺序连成向量 w。链式法则将损失对这些特征的梯度传回上下文 V。",
        "lines": [
          {
            "label": "沿文本分支反向求导",
            "tex": "\\sym{gradient} = \\left(\\sym{jacobian}\\right)^{\\sym{transpose}}\\,\\sym{outputGrad}"
          }
        ],
        "symbols": {
          "gradient": {
            "tex": "\\nabla_V L",
            "name": "上下文梯度",
            "desc": "分类损失 L 对上下文 V 各个数值的梯度。"
          },
          "jacobian": {
            "tex": "\\frac{\\partial w}{\\partial V}",
            "name": "文本特征对输入的导数",
            "desc": "把上下文参数展平来看，这个矩阵记录每个参数如何影响各类文本特征。即使编码器权重固定，它仍可计算。"
          },
          "transpose": {
            "tex": "\\mathsf{T}",
            "name": "转置",
            "desc": "将导数矩阵的行和列互换，从而把输出各分量的梯度汇总回每个输入参数。"
          },
          "outputGrad": {
            "tex": "\\nabla_w L",
            "name": "损失对文本特征的梯度",
            "desc": "从分类损失传来的梯度。它与转置后的导数矩阵相乘，就得到更新上下文需要的梯度。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "🔒",
          "title": "锁住的是参数更新",
          "desc": "CLIP 的图像编码器、文本编码器与类别名称嵌入保持固定；优化器只更新上下文。（第 5 页第 3.2 节）"
        },
        {
          "icon": "🧭",
          "title": "保留的是输入求导",
          "desc": "文本分支要保留从输出到 V 的求导关系。断开之后仍可算分类结果，却不能用该损失学习 V。"
        },
        {
          "icon": "📐",
          "title": "结构正确还要验证泛化",
          "desc": "明白参数怎样学习后，还要检查学到的提示在新图像分布上是否有效。下一章比较上下文长度与迁移表现。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "更长的提示，\n一定更好吗？",
      "badge": "trn",
      "badgeLabel": "选择与泛化",
      "bridge": "知道怎样学习，还不能保证学到的提示在新环境中有效。下面比较两种上下文长度，再区分“同样的类别换一种画风”和“换成未参加适配的类别”这两种挑战。",
      "analogy": {
        "title": "裁剪标签长度",
        "text": "标签更长不一定更好。要检查它在原任务和新图像分布上的表现，不能只看多了多少可调位置。",
        "componentId": "analogy-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "切换长度，同时观察原任务与新分布",
          "desc": "泛化是把学到的东西用于训练之外的数据。本例把在 ImageNet 照片上学到的提示用于 ImageNet-Sketch 素描；选择 M=4 或 M=16，检查两个测试集的成绩是否一起提高。",
          "componentId": "transfer-lab"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "两种“没见过”，有什么不同？",
          "desc": "域泛化关心图像分布的变化；新类别泛化关心类别集合的变化。这里的“适配”指用当前任务的标注图学习提示，先判断各情境到底变了什么。",
          "componentId": "protocol-lab"
        }
      ],
      "insight": "提示长度是需要验证的选择；原任务上更高的准确率，不保证在新分布上也更高。",
      "takeaways": [
        {
          "icon": "📏",
          "title": "长度带来选择",
          "desc": "M 只计算可学习上下文向量。表 1 中 M=16 在 ImageNet 略好，M=4 在 Sketch 更好；没有从这个例子推出通用最优长度。"
        },
        {
          "icon": "🖼️",
          "title": "先问什么变了",
          "desc": "照片变素描是分布变化；猫狗变成未参加适配的马是类别变化。第 4.2 节的域泛化结果不等于对新类别的保证。"
        },
        {
          "icon": "🔎",
          "title": "比较需要相同条件",
          "desc": "骨干、标注量、提示长度和评测集都会影响结果。读实验表时，先核对这些条件，再解释准确率的高低。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "读懂收益，\n也读懂边界",
      "badge": "both",
      "badgeLabel": "结果与总结",
      "bridge": "上一章是在新图像分布上检查泛化；这一章回到 11 个任务各自的测试集，检查少样本适配的整体收益。先读懂一个百分点差值，再找一个反例，最后用一句带条件的话复述论文结论。",
      "analogy": {
        "title": "核验标签效果",
        "text": "把标签拿到不同任务中检验，既要看提升，也要保留退步的反例。论文结论需要和实验条件一起读。",
        "componentId": "analogy-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "看完正负结果，再写一句结论",
          "desc": "本章固定为论文第 7 页图 4 的 RN50、16-shot 条件，与上一章的 ViT-B/16 实验分开阅读。RN50 和 ViT-B/16 是不同的 CLIP 图像编码器配置；每个数据集都在自己的任务上适配后测试。",
          "componentId": "results-lab"
        }
      ],
      "insight": "CoOp 用少量标注数据学习连续提示，在多数任务上有效；它没有消除数据质量、泛化与可解释性的限制。",
      "formula": {
        "lead": "少样本设置按每类的标注张数计数。当每个类别都取相同数量的图片时，任务的标注总量写成下式。",
        "lines": [
          {
            "label": "训练图片总数",
            "tex": "\\sym{total} = \\sym{classes}\\times\\sym{shots}"
          }
        ],
        "symbols": {
          "total": {
            "tex": "N",
            "name": "标注图片总数",
            "desc": "当前适配任务用于训练的全部标注图片数量。"
          },
          "classes": {
            "tex": "K",
            "name": "类别数",
            "desc": "当前适配任务所含的类别总数。"
          },
          "shots": {
            "tex": "s",
            "name": "每类标注张数",
            "desc": "每个类别用于适配的标注图片数量。16-shot 对应每类 16 张。"
          }
        }
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "一句话复述方法",
          "desc": "将人工上下文替换成连续的可学习向量，拼接固定类别名称，通过冻结的 CLIP 编码与分类损失更新提示。推理时复用学好的提示。"
        },
        {
          "icon": "📊",
          "title": "带条件复述结果",
          "desc": "11 个任务图示差值平均约 +14.66 个百分点，但 Food101 为 −2.64。CoOp 使用标注，零样本对照不使用下游标注；比较时要记住这笔预算。"
        },
        {
          "icon": "🧭",
          "title": "留下三个追问",
          "desc": "换域或换类别时还有效吗？标签有噪声时怎么办？软提示为何奏效、能否解释？最近词不能直接还原提示含义，这些都是继续阅读的入口。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1SL4y1s7LQ",
      "title": "CLIP 论文逐段精读",
      "reason": "补齐背景：图像与文字如何进入可比较的表示空间。建议在第 2 章后按需观看。",
      "cover": "https://raw.githubusercontent.com/mli/paper-reading/main/imgs/clip.jpg"
    },
    {
      "bvid": "BV1FV4y1p7Lm",
      "title": "CLIP 改进工作串讲（上）",
      "reason": "把 CoOp 放回 CLIP 适配研究的背景中，适合完成本教程后继续阅读。",
      "cover": "https://raw.githubusercontent.com/mli/paper-reading/main/imgs/clipx-part1.jpg"
    },
    {
      "bvid": "BV1gg411U7n4",
      "title": "CLIP 改进工作串讲（下）",
      "reason": "延伸了解视觉语言模型的后续改进；扩展内容不等同于原始 CoOp 的结论。",
      "cover": "https://raw.githubusercontent.com/mli/paper-reading/main/imgs/clipx-part2.jpg"
    }
  ]
};
