import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "SeeSR: Towards Semantics-Aware Real-World Image Super-Resolution",
    "titleZh": "SeeSR：面向语义感知的真实世界图像超分辨率",
    "venue": "CVPR 2024",
    "authors": "Rongyuan Wu, Tao Yang, Lingchen Sun, Zhengqiang Zhang, Shuai Li, Lei Zhang",
    "affiliation": "香港理工大学 · OPPO 研究院 · 字节跳动",
    "domain": "计算机视觉 / 图像超分辨率 / 扩散模型",
    "coreProblem": "真实退化会先把局部结构毁掉，语义随之含糊；生成式超分照着糊图补细节，就可能补出错误的物体。",
    "coreInsight": "先用退化感知的提示提取器（DAPE）从糊图里恢复可靠的物体清单与语义表示，再让硬提示、软提示和 LR 图像一起控制冻结的扩散模型，并用 LRE 修正采样起点。",
    "keywords": [
      "真实世界图像超分",
      "语义提示",
      "DAPE",
      "硬提示 / 软提示",
      "ControlNet",
      "表示交叉注意力",
      "LRE"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "仅图像条件的 Real-ISR（StableSR / DiffBIR 式）",
      "desc": "只看糊图，不认物：残卷上的船被补成了说不清的东西。",
      "componentId": "seesr-cover"
    },
    "newMethod": {
      "title": "SeeSR：鉴定清单 + 软提示",
      "desc": "先写清画的是什么，再按清单补出船体、窗与栏杆。",
      "componentId": "seesr-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "第一章 · 语义先于细节",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "退化如何把语义变成多选题",
          "desc": "拖动退化强度，观察船与鸟两个候选如何同时成立。",
          "componentId": "seesr-ambiguity"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "提示词风格与补绘内容",
          "desc": "五种提示词选择，对应同一处残卷的不同补绘结果。",
          "componentId": "seesr-prompt-styles"
        }
      ],
      "scenes": [
        {
          "id": "semantic-gap",
          "title": "退化最先毁掉的是语义",
          "goal": "为什么糊图上的“这是什么”会变成多选题？",
          "summary": "残卷上的船形色块随退化加重，从清晰轮廓退化成两个都说得通的候选。",
          "interaction": "拖动“退化强度”，看船与鸟的置信度如何靠拢、歧义度如何上升。",
          "next": "看不出来时，提示词决定了补绘成什么。",
          "notes": "论文主张：真实 LR 的严重退化破坏局部结构，导致语义含糊，生成结果可能出现语义错误（p.1 Abstract；p.1–2 第 1 节）。两处置信度与歧义度是本讲解自建的示意模型，论文没有给出船/鸟的置信度曲线；它只用来复现“退化让两种解释都成立”这一现象。教学判断：像素证据不足时，“画什么”必须由语义决定。",
          "componentId": "seesr-ambiguity",
          "moduleId": "1.1"
        },
        {
          "id": "prompt-styles",
          "title": "提示词风格决定补绘内容",
          "goal": "分类式、描述式、标签式提示，各自把同一处残卷带向哪里？",
          "summary": "同一块糊掉的船形区域，被空提示、分类式、描述式、LR 标签、HR 标签分别补成不同对象。",
          "interaction": "点选五种提示词纸条，比较右侧残卷的补绘结果；选中“标签式·来自 LR”时出现论文原图对照。",
          "next": "既然标签也会错，就要训练一只退化感知的眼睛。",
          "notes": "论文 p.3 图 1 与 p.4 表 1：分类式只给整图一个类别、缺局部语义；描述式含冗余虚词且易被退化带偏（示例把船生成为鸟）；标签式覆盖多物体但同样对退化敏感（示例把船生成为飞机）。右栏在“标签式·来自 LR”时展示图 1(d) 原图裁剪（论文模型输出，非本次绘制）。中间残卷是按论文示例自行绘制的示意，不冒充模型结果。“标签式·来自 HR”只是参考条件，推理时拿不到 HR 图像。",
          "componentId": "seesr-prompt-styles",
          "moduleId": "1.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "第二章 · 退化感知提示提取器",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "对齐两项锚点：DAPE 的训练目标",
          "desc": "调整 λ 与训练进度，观察两项误差与清单的联动。",
          "componentId": "seesr-dape-train"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "退化下的标签排序",
          "desc": "同一残卷，原始标签模型与 DAPE 的置信度对比。",
          "componentId": "seesr-degrade-tag"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "阈值与软提示的补偿",
          "desc": "拖动阈值，看命中、误检与局部细节如何一起变化。",
          "componentId": "seesr-threshold-soft"
        }
      ],
      "scenes": [
        {
          "id": "dape-align",
          "title": "用干净摹本校准眼力",
          "goal": "DAPE 训练时对齐了哪两个量？λ 在权衡什么？",
          "summary": "干净摹本给出表示嵌入与分类输出嵌入两个锚点，LR 分支同时向它们靠拢。",
          "interaction": "拖动 λ 与训练进度，观察 L_r、L_l 的分解与标签清单如何一起变化。",
          "next": "对齐之后，退化加剧时清单还稳吗？",
          "notes": "论文式 (1)：L_DAPE = L_r(f_y^rep, f_x^rep) + λ·L_l(f_y^logits, f_x^logits)，HR 分支经冻结标签模型（RAM）提供锚点（p.4 第 3.2 节；p.5 图 2(a)）；实现中 λ=1（p.6 第 4.1 节）。本页的误差曲线与标签分数是按该式构造的示意模型，不是论文报告的曲线；λ≥2.5 时“表示变差、软提示信息变少”是讲解推论，须保留“示意”措辞。教学判断：DAPE 同时学特征对齐与标签对齐，λ 是二者权重。",
          "componentId": "seesr-dape-train",
          "moduleId": "2.1"
        },
        {
          "id": "degrade-tag",
          "title": "退化先把标签排序改写",
          "goal": "把标签模型直接用在 LR 上，退化会把哪个词抬上来？DAPE 改变了什么？",
          "summary": "退化 85% 时，原始标签模型把船压到阈值以下、把鸟抬到阈值以上，补绘对象随之改变。",
          "interaction": "拖退化强度、切换“原始标签模型 / DAPE”，看六条置信度与补绘对象。",
          "next": "阈值能把这些错误筛掉吗？",
          "notes": "论文 p.3 图 1(d) 与第 3.1 节：标签模型对退化敏感，错误标签导致语义扭曲（示例中船被画成飞机）。本页置信度表是讲解用的示意数值，论文没有报告逐标签曲线或失败率。切换到 DAPE 后排序稳定，对应 p.4 第 3.2 节的对齐训练；DAPE 并非免疫退化，重退化下仍可能错判（p.8 第 5 节）。",
          "componentId": "seesr-degrade-tag",
          "moduleId": "2.2"
        },
        {
          "id": "threshold-soft",
          "title": "阈值救不了错误的排序",
          "goal": "提高阈值能去掉错误标签吗？为什么还需要软提示？",
          "summary": "阈值升高会同时筛掉鸟与船；想补回信息，只能靠不受阈值影响的软提示。",
          "interaction": "拖动标签阈值，看清单命中数、误检数与残卷上补出的局部细节。",
          "next": "两种提示分别接到扩散模型的什么位置？",
          "notes": "论文 p.4 第 3.2 节：阈值偏高提高类别准确率但降低召回率，偏低则相反；软提示不受阈值影响，并避免 one-hot 造成的低信息熵。页面固定“退化 85% + 原始标签模型”以便只观察阈值这一个变量；命中/误检计数只针对本页自建的六个候选标签，不是论文指标。",
          "componentId": "seesr-threshold-soft",
          "moduleId": "2.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "第三章 · 双提示驱动受控扩散模型",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "三条条件与 TCA/RCA 的接线",
          "desc": "开关文本、表示、图像分支，观察条件进入 Unet 的位置与后果。",
          "componentId": "seesr-dual-branch"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "LRE：采样起点的修正",
          "desc": "调整起点中残卷的比例，观察平滑区域的虚假细节。",
          "componentId": "seesr-lre"
        }
      ],
      "scenes": [
        {
          "id": "dual-branch",
          "title": "三条条件各接到哪里",
          "goal": "文本、表示、图像三条分支分别进入 Unet 的什么位置？少一条会怎样？",
          "summary": "硬提示经 TCA、软提示经 RCA（位于 TCA 之后）、LR 经 ControlNet，共同控制冻结的扩散主干。",
          "interaction": "点击左侧三个分支卡片开关条件，观察活跃路径、条件数与结果判断。",
          "next": "条件都接好了，采样起点还差一步。",
          "notes": "论文 p.4 第 3.3 节与 p.5 图 2(c)：克隆 SD Unet 编码器作为可训练 ControlNet，LR 经可训练图像编码器得到 latent 送入 ControlNet；RCA 模块加在 TCA 之后学习软提示的语义引导。图像分支在论文中始终存在，因此本页锁定为开启。把“仅图像”对应 StableSR/DiffBIR、“图像+文本”对应 PASD 是论文第 1 节对基线的描述，不是说这些方法的实现等同于该子集；语义控制力是本页自建的示意权重，不是测量量。",
          "componentId": "seesr-dual-branch",
          "moduleId": "3.1"
        },
        {
          "id": "lre-start",
          "title": "起点不是白纸，而是残卷的底稿",
          "goal": "采样起点若用纯噪声，模型会把退化当成待增强的内容吗？",
          "summary": "纯噪声起点会在平滑天空里长出虚假细节；把 LR latent 嵌入起点后，这些细节基本消失。",
          "interaction": "拖动“起点中来自残卷的比例 w”，观察起点像素场与天空笔触同步变化。",
          "next": "这些机制换来了什么数字？",
          "notes": "论文 p.5 第 3.4 节与图 3：预训练 T2I 训练时并未把图像完全变成随机噪声，而多数 SD 类 Real-ISR 推理时从纯高斯噪声起步，造成训练-推理不一致；LRE 按训练噪声调度器把 LR latent 嵌入初始噪声，论文报告虚假细节（尤其天空）明显减少，并默认在所有 SeeSR 实验中使用 LRE。本页 w 是在“纯噪声起点”与“论文 LRE 起点”之间的教学插值，天空笔触为示意绘制，不是模型输出；论文的支撑证据是定性对比，不是笔触计数。",
          "componentId": "seesr-lre",
          "moduleId": "3.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "第四章 · 证据",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "感知与无参考指标",
          "desc": "在三个基准上切换，读 FID、CLIPIQA、MUSIQ 的实测值。",
          "componentId": "seesr-metric-bars"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "下游任务验证语义保真",
          "desc": "切换四项下游指标，读 SeeSR 与 GT、Zoomed LR 的差距。",
          "componentId": "seesr-semantic-table"
        },
        {
          "kind": "module",
          "id": "4.3",
          "title": "定性结果与用户研究",
          "desc": "点击每一列，看该方法的定性结果与用户研究数字。",
          "componentId": "seesr-qualitative"
        }
      ],
      "scenes": [
        {
          "id": "metric-bars",
          "title": "三个基准上的感知指标",
          "goal": "在合成与真实基准上，FID、CLIPIQA、MUSIQ 谁领先？",
          "summary": "表 2 中 SeeSR 在三套数据集的 FID、CLIPIQA、MUSIQ 上均为最佳。",
          "interaction": "切换 DIV2K-Val / RealSR / DrealSR，比较五个方法的条形长度与数值。",
          "next": "语义保真能不能被下游任务量化？",
          "notes": "数据取自论文表 2（p.6）。DIV2K-Val 为 3K 张 512×512 patch，退化管线与训练一致；RealSR、DRealSR 按 StableSR 测试集配置中心裁剪 LR 到 128×128。FID 越低越好，CLIPIQA、MUSIQ 越高越好；均为单次评测，论文未报告误差棒，因此不画误差棒、不做显著性推断。此处省略 BSRGAN 是为了在页面上留出可读字号，它出现在最后一页的保真-感知散点中。",
          "componentId": "seesr-metric-bars",
          "moduleId": "4.1"
        },
        {
          "id": "semantic-metrics",
          "title": "下游模型还能认出这些物体吗",
          "goal": "超分结果保留了多少可被检测/分割模型识别的语义？",
          "summary": "在 COCO-Val 上用 OpenSeeD 评测，SeeSR 的四项指标全面领先，相对 Zoomed LR 提升约 3–4 倍。",
          "interaction": "切换全景分割、目标检测、实例分割、语义分割四项指标。",
          "next": "定性上看，语义错误长什么样？",
          "notes": "数据取自论文表 3（p.8）：COCO-Val 5K 图像缩放到 512×512 作为 GT，再按训练退化生成 LR，OpenSeeD 作为统一检测/分割器。四项指标都是越高越好；GT 行是在真值图像上测得的上限参考，不是方法。“3–4 倍”指相对 Zoomed LR 的提升幅度，不是相对其他 Real-ISR 方法。",
          "componentId": "seesr-semantic-table",
          "moduleId": "4.2"
        },
        {
          "id": "qualitative",
          "title": "同一艘船，各方法画成了什么",
          "goal": "定性结果里，语义错误是什么样子？用户更认哪一个？",
          "summary": "同一处船只细节：Real-ESRGAN 画成军舰、DiffBIR 画成鱼、PASD 画成鸟，SeeSR 保留船体。",
          "interaction": "点击任意一列，查看该方法的定性判断与用户研究中的混淆率/最佳率。",
          "next": "它会在什么情况下失败？",
          "notes": "图像来自论文图 4 第一例的放大行裁剪（p.7），是论文自己发布的定性对比；每列判断只描述该裁剪中可见的内容，不是普遍结论。用户研究数字取自表 4（p.8）：20 名参与者、6 个方法、16 组合成数据（混淆率）与 16 组真实数据（最佳率）。混淆率高说明结果更难与 GT 区分，不等于保真更高。",
          "componentId": "seesr-qualitative",
          "moduleId": "4.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "第五章 · 边界与取舍",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "错误标签的代价",
          "desc": "增删标签，观察补绘对象与细节如何被带偏。",
          "componentId": "seesr-wrong-tag"
        }
      ],
      "scenes": [
        {
          "id": "wrong-tag",
          "title": "标签错一个字，画就错一个物体",
          "goal": "论文自述的失败模式，在实际操作中是什么样子？",
          "summary": "把“鸟”或“飞机”放进清单、或把“船”拿掉，残卷上的补绘对象立刻改变。",
          "interaction": "点击六个标签增删清单，观察残卷补绘结果与返工原因。",
          "next": "那什么时候该用它、代价是什么？",
          "notes": "对应论文第 5 节局限（p.8）：重退化下 DAPE 仍可能预测错误标签，导致物体被错误重建；标签与区域的对应也可能不准，作者提出引入额外 mask 可缓解，但未给出定量验证；此外小尺度场景文字难以重建。本页标签集合与绘制是教学用的示意，论文没有给出失败率数字，不能把这里的操作读成论文测得的错误率。",
          "componentId": "seesr-wrong-tag",
          "moduleId": "5.1"
        },
        {
          "id": "boundary",
          "title": "保真与感知的交换",
          "goal": "什么时候值得用 SeeSR？它牺牲了什么？",
          "summary": "同一协议下，扩散类方法用更低的 PSNR 换更高的 CLIPIQA；SeeSR 站在感知一侧。",
          "interaction": "点击散点上的方法，读取它的 PSNR 与 CLIPIQA 位置。",
          "next": "回到开头：残卷上的那一笔，先有名字再落笔。",
          "notes": "数据取自论文表 2 的 DIV2K-Val 行（p.6）：PSNR 越高保真越好，CLIPIQA 越高感知越好；11 个方法中只标出 6 个代表点以免重叠，完整数值见论文。论文第 4.2 节解释：扩散类方法生成更真实的细节，因而在保真指标上不占优。适用条件按论文的实验范围给出，不推广到未验证的任务或缩放因子。",
          "componentId": "seesr-boundary"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.png",
    "semantic-gap": "./thumbnails/semantic-gap.png",
    "prompt-styles": "./thumbnails/prompt-styles.png",
    "dape-align": "./thumbnails/dape-align.png",
    "degrade-tag": "./thumbnails/degrade-tag.png",
    "threshold-soft": "./thumbnails/threshold-soft.png",
    "dual-branch": "./thumbnails/dual-branch.png",
    "lre-start": "./thumbnails/lre-start.png",
    "metric-bars": "./thumbnails/metric-bars.png",
    "semantic-metrics": "./thumbnails/semantic-metrics.png",
    "qualitative": "./thumbnails/qualitative.png",
    "wrong-tag": "./thumbnails/wrong-tag.png",
    "boundary": "./thumbnails/boundary.png"
  }
};
