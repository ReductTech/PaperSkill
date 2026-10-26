import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks",
    "titleZh": "更快的 R-CNN：用区域提议网络做实时目标检测",
    "venue": "arXiv:1506.01497v3，2016；会议初稿 NIPS 2015",
    "authors": "Shaoqing Ren, Kaiming He, Ross Girshick, Jian Sun",
    "affiliation": "任少卿（中国科学技术大学，工作完成于微软研究院实习）；何恺明、孙剑（微软研究院）；Ross Girshick（Facebook AI Research，主体工作完成于微软研究院）",
    "domain": "视觉 · 目标检测",
    "coreProblem": "Fast R-CNN 把检测网络加快之后，区域提案本身成了测试时间的瓶颈。",
    "coreInsight": "让一个全卷积的区域提议网络和检测器共享整图卷积，在每个位置相对锚框预测物体性和矩形框，检测器就知道该往哪里看。",
    "keywords": [
      "目标检测",
      "RPN",
      "锚框",
      "共享卷积",
      "Fast R-CNN"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "Selective Search 在 CPU 上大约每张图 2 秒，和检测网络分开计算。EdgeBoxes 大约 0.2 秒，提案时间仍然和检测网络相当。",
      "componentId": "hero-old"
    },
    "newMethod": {
      "desc": "RPN 与检测器共享卷积。表 5 中 VGG 在 K40 上的提案额外约 10 毫秒，整套系统约 198 毫秒（5 fps）。",
      "componentId": "hero-new"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "提案为什么成了瓶颈",
      "badge": "inf",
      "badgeLabel": "先建立直觉",
      "bridge": "检测网络本身已经很快，真正拖时间的是“先猜物体可能在哪”。这一节先把旧的提案和新的共享提案放在同一张时间表上。",
      "analogy": {
        "title": "望远镜来回扫",
        "text": "观鸟的人如果把整片芦苇都扫一遍，鸟还没认出来，时间先花掉了。Faster R-CNN 要解决的就是这种<b>先找位置</b>的开销。",
        "componentId": "ana-1"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "三种找位置的代价",
          "desc": "点选一种提案方法。左边是同一次观鸟，右边的横条用论文里的时间，单位是毫秒。硬件不一样的数字不会被说成同一次测量。",
          "componentId": "mod-1-1"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "整套系统差在哪一段",
          "desc": "按下开始后，两套 VGG 系统各自画出卷积、提案、区域三支耗时，再汇总成总时间。红色是旧系统，绿色是带 RPN 的系统。",
          "componentId": "mod-1-2"
        }
      ],
      "takeaways": [
        {
          "icon": "⏱",
          "title": "瓶颈换了位置",
          "desc": "Fast R-CNN 在不算提案时已经接近实时，测试时间转到了区域提案。"
        },
        {
          "icon": "🖥",
          "title": "先看清硬件",
          "desc": "Selective Search 约 2 秒是 CPU；RPN 的 10 毫秒是共享卷积之后、在 K40 上的额外开销。"
        },
        {
          "icon": "👁",
          "title": "少而准的框",
          "desc": "表 5 里区域分支变短，也因为测试提案从大约 2000 个降到最多 300 个。"
        }
      ],
      "insight": "检测器已经会共享卷积，提案却还在图像外面单独跑。要让提案几乎不再另算一遍特征。"
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "同一张特征图",
      "badge": "inf",
      "badgeLabel": "先建立直觉",
      "bridge": "上一节看到提案很贵。这一节看它为什么可以变得便宜：检测器本来就要算整图卷积。",
      "analogy": {
        "title": "记住这一眼",
        "text": "同一副望远镜里的画面被记住，后面不必为每只可能的鸟重新对焦。<b>共享特征图</b>就是这一眼。",
        "componentId": "ana-2"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "滑窗走到哪，权重不变",
          "desc": "在格子上拖动，或用左右按钮移动。橙色框是 3×3 滑窗，它在每个位置做同一件事。",
          "componentId": "mod-2-1"
        }
      ],
      "takeaways": [
        {
          "icon": "🗺",
          "title": "一张图就够",
          "desc": "区域检测用的卷积特征，也可以用来产生区域提案。"
        },
        {
          "icon": "↔",
          "title": "平移仍用同一函数",
          "desc": "锚框和相对锚框的预测是平移不变的，只受到网络总步长的限制。"
        },
        {
          "icon": "📐",
          "title": "感受野很大",
          "desc": "n=3 的小窗口，在原图上 ZF 大约看见 171 像素，VGG 大约 228 像素。"
        }
      ],
      "insight": "RPN 不是另一张图像上的另一个网络，它就建在 Fast R-CNN 已经算出的卷积特征上。"
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "先告诉网络往哪看",
      "badge": "inf",
      "badgeLabel": "先建立直觉",
      "bridge": "特征可以共享之后，还要决定谁先说话。RPN 先指出像物体的地方，检测器再去认是什么。",
      "analogy": {
        "title": "先标一个可疑的点",
        "text": "观鸟时先用一个点标出“这里像有鸟”，而不是一开始就喊出种类。<b>物体性</b>就是这个点。",
        "componentId": "ana-3"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "五步看完一次检测",
          "desc": "用下一步走完：整图、共享特征、RPN、筛选提案、Fast R-CNN。每一步只多一个可见变化。",
          "componentId": "mod-3-1"
        }
      ],
      "takeaways": [
        {
          "icon": "☝",
          "title": "先位置，后类别",
          "desc": "论文用注意力这个说法形容 RPN：它告诉统一网络往哪看。"
        },
        {
          "icon": "▣",
          "title": "只考虑矩形",
          "desc": "文中的区域就是矩形框，物体性只区分物体和背景。"
        },
        {
          "icon": "🔗",
          "title": "一个网络",
          "desc": "图 2 里卷积、RPN、RoI 池化和分类器连成同一个检测系统。"
        }
      ],
      "insight": "RPN 不报告类别。它用类别无关的分数告诉 Fast R-CNN 应该往哪里看。"
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "锚框：一组回归参考",
      "badge": "both",
      "badgeLabel": "公式与判断",
      "bridge": "知道要在特征图上找位置之后，下一个问题是：鸟有大有小、有胖有瘦，难道要准备很多张图像或很多套滤波器？",
      "analogy": {
        "title": "换一只取景框",
        "text": "同一只鸟，取景框可以又宽又扁，也可以又高又窄。锚框就是这些<b>事先放好的参考框</b>。",
        "componentId": "ana-4"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "尺度和长宽比怎么配",
          "desc": "点一种锚框设置。左边框的形状跟着变，右边是表 8 在同一协议下的 mAP。",
          "componentId": "mod-4-1"
        }
      ],
      "takeaways": [
        {
          "icon": "▦",
          "title": "默认九个参考",
          "desc": "3 个面积（128²、256²、512²）乘 3 种长宽比（1:1、1:2、2:1），所以 k=9。"
        },
        {
          "icon": "📉",
          "title": "少一个就掉点",
          "desc": "表 8 里每个位置只有一个锚框时，mAP 比 69.9% 低大约 3 到 4 个点。"
        },
        {
          "icon": "⚖",
          "title": "两个维度没拆开",
          "desc": "在 VOC 2007 上，3 尺度配 1 种长宽比已经是 69.8%。论文仍保留两种变化，为的是更灵活。"
        }
      ],
      "insight": "不必做图像金字塔或滤波器金字塔。用一组参考框做回归，单尺度图像和单一大小的滑窗就够了。",
      "formula": {
        "lead": "预测框和真值框都相对同一锚框参数化：中心偏移除以锚框宽高，宽高取对数比。带 * 的是真值。",
        "unicode": "tx=(x−xa)/wa  ty=(y−ya)/ha  tw=log(w/wa)  th=log(h/ha)<br/>t*x=(x*−xa)/wa  t*y=(y*−ya)/ha  t*w=log(w*/wa)  t*h=log(h*/ha)",
        "symbols": [
          {
            "sym": "tx",
            "desc": "预测框中心 x 相对锚框中心的偏移，再用锚框宽度归一。"
          },
          {
            "sym": "ty",
            "desc": "预测框中心 y 的归一化偏移，分母是锚框高度。"
          },
          {
            "sym": "tw",
            "desc": "预测宽度与锚框宽度之比的对数。"
          },
          {
            "sym": "th",
            "desc": "预测高度与锚框高度之比的对数。"
          },
          {
            "sym": "t*x",
            "desc": "真值框中心相对锚框的归一化 x 偏移；把预测里的 x 换成真值 x*。"
          },
          {
            "sym": "t*y",
            "desc": "真值框中心相对锚框的归一化 y 偏移。"
          },
          {
            "sym": "t*w",
            "desc": "真值宽度与锚框宽度之比的对数。"
          },
          {
            "sym": "t*h",
            "desc": "真值高度与锚框高度之比的对数。"
          },
          {
            "sym": "xa",
            "desc": "锚框中心的 x。ya、wa、ha 分别是锚框的中心 y、宽和高。"
          },
          {
            "sym": "wa",
            "desc": "锚框宽度，用来归一化水平偏移，也是对数宽度的分母。"
          },
          {
            "sym": "ya",
            "desc": "锚框中心的 y。"
          },
          {
            "sym": "ha",
            "desc": "锚框高度。"
          },
          {
            "sym": "x*",
            "desc": "真值框中心的 x；y*、w*、h* 同理。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "谁该被拉向真值",
      "badge": "both",
      "badgeLabel": "公式与判断",
      "bridge": "有了参考框，还要决定哪些框该去拟合真值，哪些只是背景。回归不能对所有锚框一视同仁。",
      "analogy": {
        "title": "把名牌钉准",
        "text": "名牌要钉在鸟身上，而不是钉在空芦苇上。只有足够重叠的参考框才去<b>修正位置</b>。",
        "componentId": "ana-5"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "用 IoU 决定进不进损失",
          "desc": "先选规则①（最高 IoU）或规则②（0.7/0.3 阈值），再拖动重叠程度。绿色是正样本，红色是负样本，蓝色是被忽略的中间样本。",
          "componentId": "mod-5-1"
        }
      ],
      "takeaways": [
        {
          "icon": "✅",
          "title": "两条正样本规则",
          "desc": "和某个真值 IoU 最高，或者 IoU 高于 0.7。一个真值可以对应多个正锚框。"
        },
        {
          "icon": "🚫",
          "title": "低于 0.3 才算负",
          "desc": "中间地带不进损失。若没有锚框超过 0.7，仍保留 IoU 最高的那个为正样本。"
        },
        {
          "icon": "🎯",
          "title": "λ 不敏感",
          "desc": "表 9：λ=0.1 时 mAP 为 67.2%；在 1 到 100 这个约两个数量级内，mAP 在 68.9%–69.9% 之间，大约只差 1 个点。"
        }
      ],
      "insight": "分类看每个锚框像不像物体；框回归只对正样本打开，避免背景框把坐标学乱。",
      "formula": {
        "lead": "一张图的损失是分类对数损失，加上只在正样本上生效的 smooth L1。两项先各自归一，再用 λ 拉到差不多的重量。",
        "unicode": "L = (1/Ncls) Σ Lcls(pi, p*i) + λ (1/Nreg) Σ p*i Lreg(ti, t*i)",
        "symbols": [
          {
            "sym": "Ncls",
            "desc": "分类项的归一化常数。实现里等于小批量大小 256。"
          },
          {
            "sym": "Nreg",
            "desc": "回归项的归一化常数。实现里大约是锚框位置数 2400。"
          },
          {
            "sym": "Lcls",
            "desc": "物体与背景两类的对数损失。"
          },
          {
            "sym": "Lreg",
            "desc": "smooth L1，作用在四个相对坐标的差上。"
          },
          {
            "sym": "p*i",
            "desc": "锚框 i 的真值标签。正样本为 1，负样本为 0。乘在回归项上，所以负样本不算回归。"
          },
          {
            "sym": "t*i",
            "desc": "正样本对应真值框的四个参数化坐标。"
          },
          {
            "sym": "pi",
            "desc": "锚框 i 被预测为物体的概率。"
          },
          {
            "sym": "ti",
            "desc": "预测框相对锚框的四个坐标。"
          },
          {
            "sym": "λ",
            "desc": "平衡系数。默认 10，让归一化之后的两项大致同量级。"
          }
        ]
      }
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "一次前向怎么出框",
      "badge": "inf",
      "badgeLabel": "先建立直觉",
      "bridge": "训练标签已经清楚了。测试时网络只看一张缩放后的图，就要交出一小批矩形提案。",
      "analogy": {
        "title": "把圈子收紧",
        "text": "圈子从整片芦苇收到鸟身上。推理就是这一次<b>收紧</b>，而不是换一张新地图。",
        "componentId": "ana-6"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "从 600 像素到 300 个框",
          "desc": "按步骤看缩放、锚框、NMS、越界框和最后的 top-N。数字都来自实现细节和表 2 的一致协议。",
          "componentId": "mod-6-1"
        }
      ],
      "takeaways": [
        {
          "icon": "📏",
          "title": "单尺度短边 600",
          "desc": "多尺度特征也许更准，但论文沿用 Fast R-CNN 的判断：速度和精度的折中不好。"
        },
        {
          "icon": "✂",
          "title": "NMS 固定 0.7",
          "desc": "按分类分数抑制重叠框，大约留下 2000 个，训练检测器时就用这 2000 个。"
        },
        {
          "icon": "300",
          "title": "测试可以更少",
          "desc": "共享的 ZF 系统测试最多 300 个提案，VOC 2007 上是 59.9% mAP，高于 2000 个 Selective Search 的 58.7%。"
        }
      ],
      "insight": "共享特征之后，提案只是特征图上多出来的几层卷积，再靠分数把框减到检测器吃得下的数量。"
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "四步把两套卷积拧成一套",
      "badge": "trn",
      "badgeLabel": "训练与实现",
      "bridge": "RPN 和 Fast R-CNN 如果各训各的，会把共享卷积拉向不同方向。这一节看论文实际用来做完全部实验的训练顺序。",
      "analogy": {
        "title": "两套练习共用一副望远镜",
        "text": "先单独练找位置，再单独练认种类；随后把同一副望远镜固定下来，只改各自多出来的配件。这对应<b>四步交替训练</b>。",
        "componentId": "ana-7"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "交替训练的四步",
          "desc": "一步步看谁在更新。后两步里，那条木栏表示共享卷积被冻住。",
          "componentId": "mod-7-1"
        }
      ],
      "takeaways": [
        {
          "icon": "1️⃣",
          "title": "实验用的是交替训练",
          "desc": "四步方案用于文中全部实验。近似联合训练更快，但不回传框坐标的梯度。"
        },
        {
          "icon": "🎲",
          "title": "256 个锚框",
          "desc": "每张图抽样 256 个，正负最多 1 比 1；正样本不足 128 个就用负样本补齐。"
        },
        {
          "icon": "🌡",
          "title": "VOC 的学习率",
          "desc": "0.001 走 6 万个小批量，再以 0.0001 走 2 万个。动量 0.9，权重衰减 0.0005。"
        }
      ],
      "insight": "先让两个任务各自学会，再冻住已经共享的卷积，只微调各自多出来的层。"
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "一个网络里的两条头",
      "badge": "trn",
      "badgeLabel": "训练与实现",
      "bridge": "训练顺序定了之后，把结构摊开：同一套卷积上面，一条头负责提案，一条头负责认类别。",
      "analogy": {
        "title": "把望远镜放上栏杆",
        "text": "望远镜被放到栏杆上，和记录本待在同一处。结构模块要看的是<b>哪些层真正连在一起</b>。",
        "componentId": "ana-8"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点开统一网络的一块",
          "desc": "点一个部件。反馈只讲这一块的输入输出，以及它在 ZF 和 VGG 上分别是什么尺寸。",
          "componentId": "mod-8-1",
          "figure": "./images/fig2-system.png"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "两阶段和一步滑窗",
          "desc": "在表 10 的三个设置之间切换。它们都用 ZF，都在 VOC 2007 测试集上，mAP 越高越好。",
          "componentId": "mod-8-2"
        }
      ],
      "takeaways": [
        {
          "icon": "🧱",
          "title": "两条输出",
          "desc": "cls 是 2k 个分数，reg 是 4k 个坐标。k 个回归器不共享权重。"
        },
        {
          "icon": "🧪",
          "title": "一步法低 4.8 个点",
          "desc": "表 10 里不共享特征的两阶段是 58.7%，约 2 万个滑窗的一步法是 53.8% 或 53.9%。"
        },
        {
          "icon": "📌",
          "title": "对照有边界",
          "desc": "这是 ZF、且 RPN 不共享特征时的仿真，不能直接写成所有一步检测器都更差。"
        }
      ],
      "insight": "类别无关的提案先把框收准，类别相关的检测头再在这些框上池化特征。一步法在这篇对照里要处理的窗口多得多。"
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "重叠框和越界框",
      "badge": "trn",
      "badgeLabel": "训练与实现",
      "bridge": "结构能出很多框，但重复的框和跑到图像外的框会把后面的检测拖慢，甚至让训练散掉。",
      "analogy": {
        "title": "放下一只重复的框",
        "text": "同一只鸟上有两只取景框。第二只被放下，表示<b>非极大值抑制</b>去掉重复。",
        "componentId": "ana-9"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "重叠到 0.7 就抑制",
          "desc": "拖动第二只框，或用按钮改变重叠。IoU 到达 0.7 时，得分较低的框变淡。",
          "componentId": "mod-9-1"
        }
      ],
      "takeaways": [
        {
          "icon": "0.7",
          "title": "阈值不随数据集改",
          "desc": "NMS 的 IoU 固定为 0.7，大约留下 2000 个提案。文中的消融说它没有损害最终检测 mAP。"
        },
        {
          "icon": "🚫",
          "title": "训练丢掉越界框",
          "desc": "1000×600 的图约有 2 万个锚框，忽略越界后约剩 6000 个。不忽略则训练不收敛。"
        },
        {
          "icon": "✂",
          "title": "测试改为裁剪",
          "desc": "测试仍然在全图上做卷积，只是把越出边界的提案裁回图像里面。"
        }
      ],
      "insight": "NMS 用固定阈值去掉重复提案；训练则直接忽略越界锚框，否则大误差会让优化不收敛。"
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "先对齐协议，再看谁更高",
      "badge": "both",
      "badgeLabel": "公式与判断",
      "bridge": "前面的机制都齐了。最后看论文报告的精度和速度，但只在同一数据集、同一训练划分、同一种 mAP 里面比较。",
      "analogy": {
        "title": "升起当天的记录",
        "text": "芦苇边的记录页被翻开，一面小旗升起来。比的是<b>同一份记录</b>，不是把不同比赛的分数加在一起。",
        "componentId": "ana-10"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "选一份协议再开跑",
          "desc": "先选测试集和指标，再按开始比较。横条只在当前协议内部生长，表里写着每个数字的训练数据。",
          "componentId": "mod-10-1"
        }
      ],
      "takeaways": [
        {
          "icon": "📊",
          "title": "VOC 上的公平对照",
          "desc": "VGG、VOC 2007、只用 07 训练时，共享 RPN 是 69.9%，文中引用的 Selective Search 是 66.9%（仓库复现 68.1%）。"
        },
        {
          "icon": "🌐",
          "title": "COCO 用两把尺子",
          "desc": "test-dev 上，COCO train 的 Faster R-CNN 是 42.1% 的 mAP@0.5 和 21.5% 的 mAP@[.5,.95]，对照的是本文自己的 Fast R-CNN（39.3%/19.3%）。COCO 上还加了 64² 锚框，并把检测负样本 IoU 改成 [0, 0.5)。"
        },
        {
          "icon": "⚠",
          "title": "额外数据与竞赛边界",
          "desc": "COCO→VOC 的 78.8% 含更多数据。只用 ResNet-101 替换 VGG，COCO val 可到 48.4%/27.2%；竞赛里的 55.7%/34.9% 等还包含与 Faster R-CNN 正交的改进，不能算成本文系统单独成绩。"
        }
      ],
      "insight": "共享 RPN 在论文自己的对照里用更少的框达到了不弱于 Selective Search 的 mAP，同时把 VGG 系统拉到大约 5 fps。换了数据或换了指标，就要重新对齐再比较。"
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1NLRFByEzi",
      "title": "六大目标检测算法中的 Faster R-CNN 与 RPN",
      "reason": "课程里有单独几集讲 Faster R-CNN 的网络步骤和 RPN 原理，适合作为方法导览。"
    },
    {
      "bvid": "BV12zBpBBEr4",
      "title": "Faster R-CNN 论文解读：结构、RPN 与损失",
      "reason": "选集中包含 Faster R-CNN 论文解读、RPN 结构和损失函数，对应本文的方法部分。"
    },
    {
      "bvid": "BV1of4y1m7nj",
      "title": "Faster R-CNN 的 PyTorch 源码解析",
      "reason": "从训练入口走到 RPN、正负样本和损失，适合对照实现细节。播放量未做 API 核验，故不写死数字。"
    },
    {
      "bvid": "BV1z34y1W7vC",
      "title": "目标检测算法总结：R-CNN 到 Faster R-CNN",
      "reason": "概述两阶段检测，并含 Faster R-CNN 系列与训练测试实操，适合看它在检测发展里的位置。"
    }
  ]
};
