import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Image Super-Resolution Using Deep Convolutional Networks",
    "titleZh": "基于深度卷积网络的图像超分辨率",
    "venue": "arXiv:1501.00092v3 · 2015",
    "authors": "Chao Dong · Chen Change Loy · Kaiming He · Xiaoou Tang",
    "affiliation": "香港中文大学 · 微软亚洲研究院",
    "domain": "计算机视觉 · 单图像超分辨率",
    "coreProblem": "一张低分辨率图像无法唯一确定原有细节，双三次插值只能补足像素，难以恢复清晰边缘。",
    "coreInsight": "先双三次放大，再让三层卷积网络联合学习局部特征、非线性映射与图像重建。",
    "keywords": [
      "SRCNN",
      "图像超分辨率",
      "端到端学习"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "双三次插值把像素网格放大，虽然确实提高了原画面的整体分辨率大小，却不能保证补回真实细节。（本图仅供参考，非论文样本）",
      "componentId": "photo-scene"
    },
    "newMethod": {
      "desc": "SRCNN 在插值图上学习重建映射；论文在同协议的多个测试集上报告了 PSNR 提升。（图片仅供参考）",
      "componentId": "photo-scene"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "放大，为什么仍然模糊",
      "badge": "inf",
      "badgeLabel": "入门 · 问题",
      "bridge": "从一张放大的照片开始：像素增加了，轮廓却没有跟着变清晰。我们需要先根据体验这个缺口，再看本篇论文所构造的卷积神经网络要在此基础上解决什么问题，以实现图像分辨率的提升。",
      "analogy": {
        "title": "放大不等于看清",
        "text": "照片被放大后，轮廓占了更多像素，但缺失的细节并不会在放大图片的过程中自动回来，我们仍需要通过图像处理得到预测的超分辨率图像。",
        "componentId": "photo-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "放大倍率与细节缺口",
          "desc": "就像在电脑的照片预览软件中不断放大一样，我们可以切换目标倍率，观察插值后像素变密与边缘仍然模糊之间的区别。画面仅供参考，非实际 SRCNN 推理。",
          "componentId": "lesson-widget"
        }
      ],
      "insight": "低分辨率图像可能对应不止一种高分辨率细节，同样的低分辨率轮廓可能是由捕捉到的不同的原始实物光影压缩形成的，因此我们的恢复工作需要从训练数据中学习图像先验。",
      "takeaways": [
        {
          "icon": "▣",
          "title": "像素变多",
          "desc": "通过双三次插值，先把图像放到目标尺寸，再进行下一步的精细化预测处理。"
        },
        {
          "icon": "◎",
          "title": "信息仍缺",
          "desc": "单图像超分辨率不是唯一可逆的操作，实际上相同或相似的轮廓可能来源于不同的原始实物形象。"
        },
        {
          "icon": "✦",
          "title": "学习映射",
          "desc": "SRCNN 利用成对样本学习重建规律。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "网络接收怎样的输入",
      "badge": "inf",
      "badgeLabel": "入门 · 输入",
      "bridge": "既然插值无法凭空恢复细节，网络究竟从哪里开始？让我们先看看论文对输入 Y 的定义。",
      "analogy": {
        "title": "同尺寸，不同清晰度",
        "text": "取景框里的照片已经放大到目标尺寸，但它与真值仍在实际的边缘和纹理上存在差异。",
        "componentId": "photo-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "选择一块放大区域",
          "desc": "选择照片的局部区域，比较已插值输入与目标图像的同尺寸像素表示。",
          "componentId": "lesson-widget"
        }
      ],
      "insight": "论文把双三次插值后的图像叫作低分辨率输入 Y，尽管它在空间尺寸上已与真值 X 相同。",
      "formula": {
        "lead": "训练样本的输入由高分辨率子图合成，下面只表示论文的训练构造。",
        "unicode": "Y = Bicubic(Downsample(Blur(X)))",
        "symbols": [
          {
            "sym": "X",
            "desc": "高分辨率真值图像或训练子图。"
          },
          {
            "sym": "Y",
            "desc": "模糊、降采样后再双三次插值得到的网络输入；分辨率大小与目标对齐。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "□",
          "title": "先插值",
          "desc": "网络处理已放到目标尺寸的输入。"
        },
        {
          "icon": "◫",
          "title": "尺寸相同",
          "desc": "相同宽高不代表相同细节。"
        },
        {
          "icon": "◉",
          "title": "成对训练",
          "desc": "Y 与 X 对齐后才能比较重建误差。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "三层网络怎样重建",
      "badge": "both",
      "badgeLabel": "核心 · 前向过程",
      "bridge": "在前两步的工作后，经过预处理的图像输入已经就位。接下来需要逐层观察特征从哪里来、怎样变换，又如何回到图像。",
      "analogy": {
        "title": "让轮廓重新清楚",
        "text": "让我们把镜头对准一处山脊，只有当局部线索被辨认后，画面才有条件重建清晰边缘。",
        "componentId": "photo-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "逐层观察 SRCNN",
          "desc": "按阶段切换特征提取、非线性映射和重建，在此过程中，图中的节点、通道数和照片边缘将会同步变化。",
          "componentId": "lesson-widget"
        }
      ],
      "insight": "论文的基础网络不是简单地把三套工具拼接起来，而是把各层参数一起优化。",
      "formula": {
        "lead": "基础 SRCNN 的前两层带 ReLU，输出层是线性卷积。",
        "unicode": "F₁(Y)=max(0,W₁∗Y+B₁); F₂(Y)=max(0,W₂∗F₁(Y)+B₂); F(Y)=W₃∗F₂(Y)+B₃",
        "symbols": [
          {
            "sym": "F₁",
            "desc": "第一层特征图，基础亮度网络有 64 个通道。"
          },
          {
            "sym": "F₂",
            "desc": "第二层映射后的特征图，基础亮度网络有 32 个通道。"
          },
          {
            "sym": "W₁, W₂, W₃",
            "desc": "分别对应 9×9、1×1、5×5 的卷积核；宽度分别由输入和输出通道确定。"
          },
          {
            "sym": "∗",
            "desc": "卷积；论文训练时不做填充，输出中心区域变小。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "⌗",
          "title": "提取特征",
          "desc": "第一层识别局部边缘和纹理线索"
        },
        {
          "icon": "◇",
          "title": "非线性映射",
          "desc": "第二层将特征变为重建所需的表示"
        },
        {
          "icon": "▤",
          "title": "线性重建",
          "desc": "第三层聚合表示，输出图像"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "网络如何学会重建",
      "badge": "trn",
      "badgeLabel": "训练 · 目标",
      "bridge": "上一章的三层结构定义了我们的模型将怎样计算，而训练样本与损失函数决定它学到什么。",
      "analogy": {
        "title": "照猫画虎——用清晰样张校准",
        "text": "焦点误差需要存在可比较的目标对象才可以实现优化，因此，我们需要利用清晰样张与模糊拍摄结果相对照。",
        "componentId": "photo-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "训练目标与对齐区域",
          "desc": "切换输入和真值，查看训练对如何构造，以及无填充卷积为何只比较中心区域。",
          "componentId": "lesson-widget"
        }
      ],
      "insight": "均方误差使预测逼近真值，也与论文采用的 PSNR 评价方向相符；它并不等于完整的主观感知质量。",
      "formula": {
        "lead": "训练最小化成对样本的平方重建误差，计算时需对齐有效输出区域。",
        "unicode": "L(Θ)=1/n Σᵢ ‖F(Yᵢ;Θ)−Xᵢ‖²",
        "symbols": [
          {
            "sym": "Θ",
            "desc": "三层卷积权重与偏置的集合。"
          },
          {
            "sym": "n",
            "desc": "训练样本数，是正的归一化因子。"
          },
          {
            "sym": "F(Yᵢ;Θ)",
            "desc": "网络对第 i 个输入的重建，形状对应 Xᵢ 的有效中心区域。"
          },
          {
            "sym": "L",
            "desc": "非负平方误差，训练时最小化。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "◧",
          "title": "合成训练对",
          "desc": "真值图经模糊、降采样、插值生成输入"
        },
        {
          "icon": "⊙",
          "title": "中心对齐",
          "desc": "无填充卷积使输出区域小于输入"
        },
        {
          "icon": "▥",
          "title": "最小化 MSE",
          "desc": "目标偏向提高 PSNR，但不是全部视觉质量"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "更大的网络一定更好吗",
      "badge": "trn",
      "badgeLabel": "训练 · 结构取舍",
      "bridge": "天下没有免费的午餐，所有的收益都将带来对应的代价。了解训练目标后，可以检验结构改变带来的画质收益是否值得额外计算。",
      "analogy": {
        "title": "当我们追求更优质的镜头画面时，往往会落入边际成本激增的陷阱之中",
        "text": "更宽的取景范围能纳入邻域线索，但镜头与处理成本也随之增加，正因此，我们需要权衡轻重，选择：轻量化-低成本-普通效果/超限制-高投入-优质画面。",
        "componentId": "photo-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "点选卷积层",
          "desc": "先点选三个卷积节点，查看基础亮度网络中各层的核、通道和激活方式。",
          "componentId": "lesson-widget"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "比较映射核",
          "desc": "切换 ImageNet 训练的三个配置，比较论文所报的卷积权重数与 Set5 三倍放大亮度 PSNR。画面清晰度是教学示意，并非各配置的实际重建图。",
          "componentId": "lesson-widget"
        }
      ],
      "insight": "较大的映射核在该实验中提高 PSNR，但计算量与权重数增加；论文测试的更深结构也没有稳定优于三层。",
      "takeaways": [
        {
          "icon": "⌘",
          "title": "各层职责不同",
          "desc": "9-1-5 表示三层卷积核尺寸，不是放大倍率"
        },
        {
          "icon": "◈",
          "title": "邻域有代价",
          "desc": "更大的映射核带来收益，也增加权重数与推理耗时"
        },
        {
          "icon": "↗",
          "title": "深度非保证",
          "desc": "论文的更深结构存在训练困难"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "结果的比较",
      "badge": "both",
      "badgeLabel": "结果 · 证据与边界",
      "bridge": "最后把方法放回论文的评测条件中：同一倍率、同一通道、同一指标，成绩才可并排比较。",
      "analogy": {
        "title": "把照片放在同一标尺下",
        "text": "同一张照片要用同样的放大倍率和评分方式检查，才看得出方法差异。",
        "componentId": "photo-scene"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "同协议结果对照",
          "desc": "选数据集并启动对照：双三次插值、A+ 与 ImageNet 训练的 9-5-5 SRCNN 的三倍放大亮度通道 PSNR 来自论文表 2 至表 4。",
          "componentId": "lesson-widget"
        }
      ],
      "insight": "SRCNN 在这些 PSNR 对照中领先，但并非所有指标都第一：Set14 三倍放大的 IFC 是 4.26，低于 A+ 的 4.45。",
      "takeaways": [
        {
          "icon": "≋",
          "title": "协议先行",
          "desc": "表中均为三倍放大、亮度通道 PSNR，越高越好"
        },
        {
          "icon": "▥",
          "title": "彩色另算",
          "desc": "彩色实验使用另一套训练与评分条件，不能混到同一坐标轴"
        },
        {
          "icon": "◉",
          "title": "保留边界",
          "desc": "指标、训练数据与推理成本共同决定结论适用范围"
        }
      ]
    }
  ]
};
