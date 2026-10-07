import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "MyVLM: Personalizing VLMs for User-Specific Queries",
    "titleZh": "MyVLM：认识用户特定的视觉概念",
    "venue": "ECCV 2024",
    "authors": "Yuval Alaluf, Elad Richardson, Sergey Tulyakov, Kfir Aberman, Daniel Cohen-Or",
    "affiliation": "Tel Aviv University / Snap Research",
    "domain": "Personalized VLM",
    "coreProblem": "如何让通用 VLM 认识用户自己的那个实例？",
    "coreInsight": "模型认识“狗”，却未认识“你的那只狗”。<br/>MyVLM 用 <b>外部概念识别</b> 与 <b>可学习概念向量</b>，把具体实例带入冻结 VLM 的生成。",
    "keywords": [
      "用户特定概念",
      "识别与表达",
      "冻结 VLM",
      "交互式论文解读"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "认识类别：一只狗坐在沙发上。<br/>教学示意，非论文原实验。",
      "componentId": "hero-scene"
    },
    "newMethod": {
      "desc": "绑定实例：用户指定的 Max 坐在沙发上。<br/>目标是实例识别与表达，不能只替换名称。",
      "componentId": "hero-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "Introduction：从类别到用户特定实例",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "先看普通 VLM 缺少什么，再明确本文要学习的概念。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "认识类别与绑定用户实例是两件事；名称、实例和向量也需要区分。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "一句话理解 MyVLM",
          "desc": "<div class=\"mv-paper-title\">MyVLM: Personalizing VLMs for User-Specific Queries</div><p><b>Yuval Alaluf · Elad Richardson · Sergey Tulyakov · Kfir Aberman · Daniel Cohen-Or</b></p><p>ECCV 2024 · Personalized Vision-Language Models</p><div class=\"mv-cards\"><div class=\"mv-card\"><h5>问题</h5><p>认识“狗”这个类别，还没有认识“用户自己的那只狗”。</p></div><div class=\"mv-card\"><h5>机制</h5><p>Concept head 识别目标；concept embedding 把概念信息送入生成。</p></div><div class=\"mv-card\"><h5>用途</h5><p>在新图片中做 personalized captioning 与 VQA。</p></div></div><div class=\"mv-links\"><a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/html/2028_ECCV_2024_paper.php\" target=\"_blank\" rel=\"noreferrer\">ECCV / ECVA</a><a href=\"https://arxiv.org/abs/2403.14599\" target=\"_blank\" rel=\"noreferrer\">arXiv</a><a href=\"https://github.com/snap-research/MyVLM\" target=\"_blank\" rel=\"noreferrer\">官方代码</a><a href=\"https://snap-research.github.io/MyVLM/\" target=\"_blank\" rel=\"noreferrer\">项目主页</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · 首页；§1、§5</a></div>",
          "componentId": "evidence"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "从类别到用户特定实例",
          "desc": "<p>通用 VLM 已学过 dog、cup、person 等类别知识，却未建立用户给出的 <b>Max</b> 与这只狗外观的对应关系。简单把所有 dog 改成 Max，会误把同类的其他狗也叫作 Max。</p><div class=\"mv-note\">教学示意，非论文原实验。Max 是虚构名称；示意图与两句输出均用于解释类别 / 实例差异。</div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §1–2，pp.1–4</a></div><details class=\"mv-original\"><summary>区分类别、实例、名称与向量</summary><div class=\"mv-expanded-evidence\"><div class=\"mv-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"><table class=\"mv-table\"><thead><tr><th>Generic concept</th><th>User-specific concept</th></tr></thead><tbody><tr><td>dog / 狗</td><td>用户自己的某一只狗</td></tr><tr><td>mug / 杯子</td><td>用户指定的那一只杯子</td></tr><tr><td>person / 人</td><td>某个指定人物的视觉身份</td></tr></tbody></table></div><div class=\"mv-cards\"><div class=\"mv-card\"><h5>实例</h5><p>真实世界中的特定对象。</p></div><div class=\"mv-card\"><h5>名称 S*</h5><p>模型在文本中使用的概念标识。</p></div><div class=\"mv-card\"><h5>向量 e*</h5><p>通过任务监督学习，供 VLM 生成使用。</p></div></div><div class=\"mv-note\">个性化视觉概念并不等于用户偏好、事件记忆或完整个人档案。</div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §1、§3.2</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §2.3，p.3</a></div></div></details>",
          "componentId": "generic-toggle"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "问题",
          "desc": "认识 dog 不等于认识用户指定的 Max。"
        },
        {
          "icon": "02",
          "title": "对象",
          "desc": "个性化概念是具体人物、宠物或物品。"
        },
        {
          "icon": "03",
          "title": "目标",
          "desc": "在新图中识别并谈论该实例。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "MyVLM Overview：识别与表达的整体流程",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "把原来的方法总览、训练 / 推理流程与有证据支持的优势放在一起。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "识别和表达分别建立；推理用识别结果选择已学习的概念向量。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "分别建立，条件注入",
          "desc": "<p>逐用户微调整个 VLM 代价较高，并可能影响已有能力；通用视觉特征也未必能区分相似实例。MyVLM 因而把实例识别交给外部模块，在表达端学习新增概念向量。</p><p>先记住底座的三部分：视觉编码器把图像变成特征，连接模块把信息交给语言模型生成文本。BLIP-2 的 Q-Former 用查询向量读取视觉信息；LLaVA 使用视觉投影。</p><p><b>Recognize → Communicate</b>：外部 head 判断目标是否出现；已优化的 embedding 帮助 VLM 在当前图像语境中使用概念名称。原 VLM 继续读取整张图的场景。</p><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §1，pp.1–3；Fig.2；§3.1–3.2，pp.5–7</a></div><figure class=\"mv-paper-figure\"><img src=\"./images/m-fig2-overview.png\" alt=\"ECCV Fig.2：BLIP-2 版本的概念识别和条件注入总览\"/><figcaption>M Fig.2，p.6 · 原图为 BLIP-2 版本；下方交互区分训练与推理。</figcaption></figure><details class=\"mv-original\"><summary>建立一次，以后怎样复用？</summary><div class=\"mv-expanded-evidence\"><p>Captioning 需要概念示例图、名称及目标描述；VQA 改用问题与目标答案。人物识别保存特征，物品识别训练线性 head，表达分支优化 embedding。</p><div class=\"mv-note\">无概念被识别时不追加向量。在相同输入和生成设置下可沿原模型路径运行；误识别依然可能改变输出。</div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · Fig.2；§3.2–3.4</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §2.2</a></div></div></details><details class=\"mv-original\"><summary>这一设计有哪些证据支持的优势？</summary><div class=\"mv-expanded-evidence\"><div class=\"mv-cards\"><div class=\"mv-card\"><h5>冻结已有底座</h5><p>原视觉编码器、连接模块、LLM 保持不变（M §3）。新增部件仍需建立与训练。</p></div><div class=\"mv-card\"><h5>概念模块化</h5><p>可登记独立 head / 身份记录与向量（M Fig.2；S Table 5）。大规模扩展成本没有系统测量。</p></div><div class=\"mv-card\"><h5>少样本表达学习</h5><p>1/2/4 张 embedding 图像已有比较（M Table 2）。此结果不替代物品 head 的正负例训练。</p></div><div class=\"mv-card\"><h5>已展示的用途</h5><p>Captioning 有定量支持；VQA 有定性实例（M Tables 1–2；Fig.7）。</p></div></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §3；Tables 1–2；Fig.7</a></div></div></details>",
          "componentId": "pipeline"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "两条分支",
          "desc": "head 不直接生成 embedding。"
        },
        {
          "icon": "02",
          "title": "条件注入",
          "desc": "识别到目标才追加其向量。"
        },
        {
          "icon": "03",
          "title": "场景依赖",
          "desc": "新图的原始视觉信息仍然进入 VLM。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "Concept Head：图中是不是这个用户概念？",
      "badge": "inf",
      "badgeLabel": "理解与推理",
      "bridge": "先解决身份判别，再决定是否加入概念信息。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "人物匹配与物品分类有不同输入和建立方式；输出都不是自然语言答案。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "人物匹配与物品分类：识别端并不相同",
          "desc": "<p>先切换概念类型，检查输入、判别模块、训练范围和输出如何改变。原 VLM 的视觉主干与外部识别路径分开；判定结果决定是否追加概念向量。</p><details class=\"mv-original\"><summary>查看论文中的识别配置对照</summary><div class=\"mv-expanded-evidence\"><div class=\"mv-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"><table class=\"mv-table\"><thead><tr><th>识别端</th><th>人物</th><th>物品 / 宠物</th></tr></thead><tbody><tr><td>输入</td><td>新图中检测到的人脸</td><td>外部 DFN5B CLIP ViT-H/14 的 [CLS] 特征</td></tr><tr><td>建立</td><td>保存 1–4 张参考图的人脸特征</td><td>4 张正例 + 150 张同类负例</td></tr><tr><td>训练</td><td>不为每个人重训人脸网络</td><td>冻结 CLIP，训练独立线性层；交叉熵、500 步</td></tr><tr><td>判定</td><td>距离阈值 0.675</td><td>分类阈值 0.5</td></tr></tbody></table></div><div class=\"mv-note\">[CLS] 是整张图像的汇总特征；人脸分支则逐张脸匹配。人物距离计算未在该段完整定义，不把 0.675 改写成余弦相似度阈值。每概念有独立分类器或身份记录，特征提取可以共享。</div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §2.2，p.2</a></div></div></details>",
          "componentId": "head-inspector"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "External",
          "desc": "独立于原 VLM 的视觉主干。"
        },
        {
          "icon": "02",
          "title": "同类负例",
          "desc": "帮助区分“这个实例”与相似对象。"
        },
        {
          "icon": "03",
          "title": "先检测",
          "desc": "每次先运行识别，再决定是否追加向量。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "Concept Embedding：把概念信息送入 VLM",
      "badge": "trn",
      "badgeLabel": "建立与训练",
      "bridge": "识别成功以后，仍需要一个供语言生成使用的表示。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "直接优化每概念的 e*，保持原 VLM 冻结；embedding 不替代 head。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "让模型谈论目标",
          "desc": "<p>给冻结 VLM 加入 e*，以包含概念名称的目标描述监督生成，通过交叉熵优化该向量。它不是参考照片的平均特征，也不是 head 的分类分数。</p><div class=\"mv-cards\"><div class=\"mv-card\"><h5>需要学习</h5><p>每个概念的 embedding；物品识别另训练线性 head。</p></div><div class=\"mv-card\"><h5>保持冻结</h5><p>原图像编码器、Q-Former / 投影，以及语言模型。</p></div><div class=\"mv-card\"><h5>保持看图</h5><p>范数约束与注意力正则减少向量独占注意力；图像扰动与保留名称的 caption 改写缓解过拟合。</p></div></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §3.2，Eq.2–4；§3.3，pp.7–8</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf#page=3\" target=\"_blank\" rel=\"noreferrer\">S · §2.2，p.3</a></div>",
          "componentId": "roles"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "表达作用",
          "desc": "向量帮助 VLM 使用概念信息。"
        },
        {
          "icon": "02",
          "title": "梯度",
          "desc": "冻结权重仍允许梯度通过网络计算。"
        },
        {
          "icon": "03",
          "title": "多概念",
          "desc": "可存储多组 head 与向量；联合生成仍需更多验证。"
        }
      ],
      "formula": {
        "lead": "Captioning 训练目标的教学简写：在训练图文对上求和，优化概念向量。",
        "unicode": "e* = argminₑ Σᵢ CE(yᵢ, VLM(Iᵢ, e))",
        "symbols": [
          {
            "sym": "e",
            "desc": "待优化的单个概念向量；原 VLM 参数冻结。"
          },
          {
            "sym": "Iᵢ",
            "desc": "第 i 张概念训练图像。"
          },
          {
            "sym": "yᵢ",
            "desc": "第 i 张图像对应、包含概念标识的目标描述。"
          },
          {
            "sym": "Σᵢ",
            "desc": "将各训练图文对的损失相加。"
          },
          {
            "sym": "CE",
            "desc": "文本生成的交叉熵损失。固定 caption 指令，省略正则项；来源 M §3.2 Eq.2。VQA 改用问题与目标答案监督。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "Personalized Inference：两种底座与两类任务",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "把接入位置与实际输出联系起来，同时区分 captioning 和 VQA。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "BLIP-2 / LLaVA 的接入不同；Captioning / VQA 的任务与训练监督也不同。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "BLIP-2 / LLaVA：条件注入的位置",
          "desc": "<details class=\"mv-original\"><summary>查看底座、注入空间与正则配置</summary><div class=\"mv-expanded-evidence\"><div class=\"mv-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"><table class=\"mv-table\"><thead><tr><th>项目</th><th>BLIP-2</th><th>LLaVA</th></tr></thead><tbody><tr><td>底座</td><td>FLAN-T5 XL</td><td>LLaVA-1.6 / Vicuna-7B</td></tr><tr><td>追加位置</td><td>视觉编码器输出后，Q-Former 前</td><td>视觉投影输出后，语言模型前</td></tr><tr><td>范数处理</td><td>概念 K/V 对齐原视觉 K/V 平均范数</td><td>概念向量范数对齐视觉 [CLS] 范数</td></tr><tr><td>注意力正则</td><td>32 个 query 对概念的注意力</td><td>其他输入 token 对概念的注意力</td></tr></tbody></table></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §3.1–3.3，pp.5–8</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §2.1，p.2</a></div></div></details><p>切到推理阶段，逐步检查新图、识别、向量追加与生成。两个底座的接入位置分别显示。</p>",
          "componentId": "pipeline"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "真实 Captioning / VQA 示例",
          "desc": "<p>下面切换 M Fig.4 的同图 caption。中文为原输出转述，预先固定；图上目标边框是教学标记。</p><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · Fig.4，p.10，最右列</a></div><details class=\"mv-original\"><summary>查看论文 VQA 原例与训练条件</summary><div class=\"mv-expanded-evidence\"><figure class=\"mv-paper-figure\"><img src=\"./images/m-fig7-vqa.png\" alt=\"M Fig.7，p.14，第二列：参考人物、新图、问题与 MyVLM 回答。\" loading=\"lazy\"/><figcaption>M Fig.7，p.14，第二列：参考人物、新图、问题与 MyVLM 回答。</figcaption></figure><p>问 S* 穿什么，回答棕色毛衣并提到卷发。图中有多人，需区分目标。原图没有普通 VLM 的同题答案，不添加虚构失败对照。</p><p>VQA 每类使用 10 个问题模板，目标答案来自原 LLaVA，可能带入偏差；论文没有系统 VQA accuracy。</p><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §3.4；§4.2；Fig.7</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · Table 1，p.6</a></div></div></details>",
          "componentId": "caption-toggle"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "接入",
          "desc": "BLIP-2 经 Q-Former；LLaVA 在投影后追加。"
        },
        {
          "icon": "02",
          "title": "用途",
          "desc": "Captioning 有定量结果，VQA 有原文示例。"
        },
        {
          "icon": "03",
          "title": "监督边界",
          "desc": "VQA 按问答目标优化向量，不声称任意迁移。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "Experiments：个性化效果提升在哪里？",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "先确认评估设置，再操作结果比较。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "名称 recall 检查是否使用概念名称，不等于识别准确率或 VQA accuracy。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "怎样检验个性化？",
          "desc": "<div class=\"mv-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"><table class=\"mv-table\"><thead><tr><th>项目</th><th>设置</th></tr></thead><tbody><tr><td>概念与图像</td><td>29 物品 + 16 人物 = 45 概念；350 + 330 = 680 张图像</td></tr><tr><td>划分</td><td>每概念 4 张训练图，其余验证；5 次随机划分</td></tr><tr><td>任务</td><td>Captioning 定量；VQA 主要定性</td></tr><tr><td>基线</td><td>Simple Replace；LLM-guided（Mistral-7B 改写）；OpenFlamingo 另作不同底座比较</td></tr><tr><td>训练防泄漏</td><td>物品 head 与 embedding 使用同一组 4 张正例；人物训练选单独出现的图</td></tr></tbody></table></div><div class=\"mv-cards\"><div class=\"mv-card\"><h5>Concept-name recall ↑</h5><p>caption 中至少一次出现名称的比例；不衡量整句正确率，也不单独惩罚负图误提及。</p></div><div class=\"mv-card\"><h5>Image Similarity ↑</h5><p>CLIPScore 图文对齐；评估另用 CLIP ViT-L/14（336×336），先把概念名换回类别。</p></div><div class=\"mv-card\"><h5>Text Similarity ↑</h5><p>与目标描述的 BERT 句向量余弦相似度；同样先把概念名换回类别。</p></div></div><div class=\"mv-note\">两种相似度沿用原表分数尺度，不是回答正确百分比。主文与补充的累计验证记录数冲突，不作为确定数据规模展示。5 次划分的记录也不能当成互不重叠的照片。</div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · §4–4.1，pp.9–13</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §2.1、§2.3，pp.2–5</a></div>",
          "componentId": "evidence"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "切换底座与子集，读懂名称 recall",
          "desc": "<p>先确认底座、任务和数据范围，再比较同一行实验中的基线与 MyVLM。切换 BLIP-2 人物子集，可以看到并非所有条件都领先。</p><details class=\"mv-original\"><summary>查看 OpenFlamingo 的另一组比较与解释边界</summary><div class=\"mv-expanded-evidence\"><h5>BLIP-2 与 OpenFlamingo · 29 物品 captioning</h5><div class=\"mv-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"><table class=\"mv-table\"><thead><tr><th>模型</th><th>Recall ↑</th><th>Text Similarity ↑</th><th>Image Similarity ↑</th></tr></thead><tbody><tr><td>OpenFlamingo</td><td>49.77%</td><td>34.12</td><td>27.65</td></tr><tr><td>MyVLM + BLIP-2</td><td>95.10%</td><td>77.71</td><td>28.12</td></tr></tbody></table></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · Table 2，p.10</a></div><div class=\"mv-note\">4 图训练 embedding、五次划分。相似度沿用原表分数尺度。不同底座的比较：文本对齐提高，图文相似度接近；不能隔离单个模块的因果作用。</div><div class=\"mv-note\"><b>名称 recall 不是 VQA accuracy。</b> BLIP-2 人物子集：Simple Replace 84.33%，MyVLM 79.76%（M Table 1）。并非所有子集都领先。</div></div></details>",
          "componentId": "results-explorer"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "语境",
          "desc": "每组结果都有模型、任务、子集与来源。"
        },
        {
          "icon": "02",
          "title": "效果",
          "desc": "名称召回在代表条件下提高，但并非所有子集领先。"
        },
        {
          "icon": "03",
          "title": "边界",
          "desc": "还需结合语义指标与真实实例判断。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "Ablation & Analysis：设计依据与通用能力",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "用消融解释设计，再检查冻结底座是否意味着所有能力无损。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "正则与增强在对应实验中有效；通用能力仍要按实际评估范围解释。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "正则与增强：少样本学习为何需要泛化措施？",
          "desc": "<p>点击作者实际报告的配置，观察当前 recall、图中高亮和解释同步变化。下面保留识别端分析与训练样本数实验。</p><details class=\"mv-original\"><summary>为什么用专门的 head？</summary><div class=\"mv-expanded-evidence\"><h5>为什么需要专门的 head？</h5><p>作者比较通用 CLIP 近邻与线性 head 排序，检查同类负例能否被区分。</p><figure class=\"mv-paper-figure\"><img src=\"./images/s-fig5-head.png\" alt=\"S Fig.5，p.12，Ceramic Head 示例：上排为 CLIP 近邻，下排为线性 head 高分图；绿色正例，红色负例。\" loading=\"lazy\"/><figcaption>S Fig.5，p.12，Ceramic Head 示例：上排为 CLIP 近邻，下排为线性 head 高分图；绿色正例，红色负例。</figcaption></figure><p>专用 head 的排序更有利于实例判别。这是定性分析，不是完整系统去掉 head 的配对数值消融。</p><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §4.3；Figs.4–5，pp.10–12</a></div></div></details><details class=\"mv-original\"><summary>训练样本数、多身份与消融证据的边界</summary><div class=\"mv-expanded-evidence\"><p>正则与增强均有作用；三行表不能分别隔离 K/V 范数与注意力损失。</p><h5>更多示例有帮助吗？</h5><div class=\"mv-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"><table class=\"mv-table\"><thead><tr><th>Embedding 训练图数</th><th>BLIP-2 recall ↑</th><th>LLaVA recall ↑</th></tr></thead><tbody><tr><td>1</td><td>75.42%</td><td>88.93%</td></tr><tr><td>2</td><td>84.27%</td><td>92.88%</td></tr><tr><td>4</td><td>87.11%</td><td>95.97%</td></tr></tbody></table></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf\" target=\"_blank\" rel=\"noreferrer\">M · Table 2，p.12；45 概念、五次划分</a></div><p>两个底座随示例增多而改善。这只改变 embedding 训练图数，不证明物品 head 也只需一张正例。</p><div class=\"mv-note\">16 人身份库的正确识别率为 96.39%（S Table 5，p.14）；这不是同图多概念联合问答成绩。未报告概念数增长曲线，也未找到仅删除 embedding 的独立数值消融。</div></div></details>",
          "componentId": "ablation-explorer"
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "原有能力是否保持？",
          "desc": "<p>S Table 4 使用全部 45 概念的 captioning 数据，4 图训练、五次划分、每图 5 条参考 caption。不是独立的广泛通用 VLM 基准。</p><div class=\"mv-table-wrap\" tabindex=\"0\" role=\"region\" aria-label=\"可横向滚动的表格\"><table class=\"mv-table\"><thead><tr><th>原模型 → MyVLM</th><th>BLEU-4 ↑</th><th>CIDEr ↑</th></tr></thead><tbody><tr><td>BLIP-2</td><td><span class=\"mv-down\">0.45 → 0.26</span></td><td><span class=\"mv-down\">1.89 → 1.28</span></td></tr><tr><td>LLaVA</td><td><span class=\"mv-up\">0.05 → 0.11</span></td><td><span class=\"mv-up\">0.17 → 0.58</span></td></tr></tbody></table></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §4.4；Table 4，p.13</a></div><p>作者说明参考 caption 最初由 BLIP-2 生成后人工修改，存在评价偏差；这限制解释，但不能抹掉 BLIP-2 的下降。</p><div class=\"mv-note\"><b>权重冻结 ≠ 所有通用任务行为完全无损。</b> 无 head 触发时的原路径、误触发的影响、注入后的能力保持需要分别讨论。</div>",
          "componentId": "evidence"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "泛化措施",
          "desc": "消融支持正则和增强，不隔离所有内部组件。"
        },
        {
          "icon": "02",
          "title": "更多示例",
          "desc": "样本数实验改变 embedding 训练图数。"
        },
        {
          "icon": "03",
          "title": "通用能力",
          "desc": "冻结参数不能证明所有任务行为完全无损。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "Failure Cases & Limitations：方法的边界",
      "badge": "both",
      "badgeLabel": "方法与证据",
      "bridge": "查看真实失败，再区分作者陈述和实验范围观察。",
      "analogy": {
        "title": "这一章抓住什么",
        "text": "失败既可能来自识别，也可能来自背景关联或底座偏见；未验证不等于确定不支持。"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "选择失败案例，定位可能出错的环节",
          "desc": "<div class=\"mv-source\">来源：<a href=\"https://arxiv.org/pdf/2403.14599v1\" target=\"_blank\" rel=\"noreferrer\">A · §5，pp.9–10；Fig.9，p.11</a></div><p>以上为 arXiv v1 原图裁剪。作者还指出 head 的误识别和漏检会导致错误回答；不能把图中每个错误都归因于 head。</p><div class=\"mv-note\">所列失败例用于说明风险，不代表对光照、遮挡、低分辨率等条件的系统定量评估。多人场景也不自动等于多个已学习概念联合生成。</div>",
          "componentId": "failure-explorer"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "哪些问题尚未解决？",
          "desc": "<div class=\"mv-cards\"><div class=\"mv-card\"><h5>【作者明确指出】</h5><p>底座偏见、误识别 / 漏检、背景泄漏、多人 VQA 选错目标；对训练中见过的问题表现更好（A §5）。VQA 伪答案可能带入错误（S p.6）；私人图像及关系信息存在隐私风险（S §1）。</p></div><div class=\"mv-card\"><h5>【根据实验范围观察到】</h5><p>新概念需要示例与 embedding 优化，物品另需负例和 head 训练。未系统验证大规模概念库、长期更新、偏好学习、事件记忆或复杂多轮交互；VQA 缺少系统 accuracy。</p></div></div><div class=\"mv-source\">来源：<a href=\"https://arxiv.org/pdf/2403.14599v1\" target=\"_blank\" rel=\"noreferrer\">A · §5，pp.9–10</a></div><div class=\"mv-source\">来源：<a href=\"https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf\" target=\"_blank\" rel=\"noreferrer\">S · §1，p.1；p.6</a></div><div class=\"mv-note\">“未验证”不等于“确定不能做到”。ECCV 主文没有独立 Limitations 节；arXiv 的失败图与作者陈述明确标注为补充来源。</div>",
          "componentId": "evidence"
        }
      ],
      "takeaways": [
        {
          "icon": "01",
          "title": "作者陈述",
          "desc": "失败图来自 arXiv，隐私及伪答案风险来自补充材料。"
        },
        {
          "icon": "02",
          "title": "范围判断",
          "desc": "大规模概念库、长期更新和复杂多轮未系统验证。"
        },
        {
          "icon": "03",
          "title": "能力定位",
          "desc": "本文学习视觉实例，不是完整个人 Agent。"
        }
      ]
    }
  ]
};
