import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Non-local Sparse Models for Image Restoration",
    "titleZh": "非局部稀疏模型与 RAW 图像恢复",
    "venue": "ICCV 2009",
    "authors": "Julien Mairal、Francis Bach、Jean Ponce、Guillermo Sapiro、Andrew Zisserman",
    "affiliation": "INRIA · ENS · University of Minnesota · University of Oxford",
    "domain": "计算摄影与图像恢复",
    "coreProblem": "从含噪的 Bayer 传感器读数中保留纹理，并恢复每个位置缺失的颜色。",
    "coreInsight": "让相似图块共用一组字典原子，各自估计系数，再融合重叠位置的恢复结果。",
    "paperSource": "https://www.di.ens.fr/~fbach/iccv09_mairal.pdf",
    "keywords": [
      "Bayer RAW",
      "图块自相似",
      "联合稀疏编码",
      "去马赛克"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "看两块本应相似的瓷砖分别选印模。噪声会改变各块所选的纹样，修补后可能出现形状差异。",
      "componentId": "paper-canvas"
    },
    "newMethod": {
      "desc": "看同一种印模怎样保住两块砖的共有纹样。联合编码共享用于恢复的原子，每块仍可保留自己的纹样深浅。",
      "componentId": "hero-joint"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "route": "bayer-raw",
      "title": "RAW 图像恢复要解决什么",
      "badge": "inf",
      "badgeLabel": "输入",
      "bridge": "相机拍到的 Bayer RAW 有两道待解的问题。怎样从带噪读数中保住真实细纹，又怎样补出每个位置缺失的两种颜色分量？",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "平滑会留下多少纹理",
          "tabLabel": "平滑与纹理",
          "desc": "<strong>为什么平滑会抹掉细节？</strong> 在没有噪声时，砖纹本身就有明暗交界。局部平均用当前格和左右邻格的平均值替代当前读数。在平坦区域，平均能减弱随机起伏。一旦邻域跨过明暗交界，暗格会被拉亮，亮格会被压暗，原有的纹理边缘也会变钝。<br><br><strong>在图上怎么判断？</strong> 左边是含噪读数，右边是处理预览，虚线是加噪前的灰度。点击「应用局部平均」，先看宽条纹内部的波动，再看细条纹还能否分辨。",
          "componentId": "raw-motivation",
          "evidence": "demo"
        },
        {
          "kind": "module",
          "id": "1.2",
          "title": "Bayer 只测一个颜色分量",
          "tabLabel": "Bayer 采样",
          "desc": "<strong>一个 Bayer 采样点测到了什么？</strong> 每个感光点前面只有红、绿、蓝中的一种滤色片。以演示的左上角为例，它只测到绿色，红色和蓝色都留待估计。如果绿色读数带噪，<strong>去噪</strong>要把这一个已测值估得更准。<strong>去马赛克</strong>再用周围的采样值估计缺失的红色和蓝色，从而得到完整 RGB。<br><br><strong>在图上怎么判断？</strong> 点击「下一步」，先看第一行的采样分布，再看整块。右侧的斜线表示缺测。4 × 4 的 16 个位置只提供 16 个读数，另外 32 个颜色分量需要补出。",
          "componentId": "bayer-mask",
          "evidence": "demo"
        }
      ],
      "insight": "论文的实拍流程先在 Bayer RAW 上去噪，再去马赛克。",
      "transition": "局部平均会跨过明暗边界。图像里还有哪些位置能为保留这段纹样提供线索？",
      "takeaways": [
        {
          "icon": "🔍",
          "title": "含噪观测",
          "desc": "RAW 保留传感器读到的值，低光下仍可能有明显噪声。"
        },
        {
          "icon": "🧩",
          "title": "每点一色",
          "desc": "二值掩码记录像素位置实际测到的颜色通道。"
        },
        {
          "icon": "🧱",
          "title": "纹理保留",
          "desc": "局部平均能减弱噪声，也可能压弱细纹。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "route": "patch-matching",
      "title": "为什么要找相似图块",
      "badge": "inf",
      "badgeLabel": "分组",
      "bridge": "相邻像素可能分属不同纹样，局部平均会模糊它们的边界。同一纹样也会在较远的位置重复，把这些块放在一起，可以用多份观测来判断哪些结构值得保留。",
      "analogy": {
        "title": "用一块砖比对纹样",
        "text": "参照砖滑向有相同纹样的一块。观察两块砖的图案怎样对齐，就能理解算法为什么在搜索窗口内按纹样找伙伴。",
        "componentId": "tile-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "选出能入组的图像块",
          "desc": "两块是否相似，要逐个比较对应位置的读数。点选近处横纹、中间弱纹和远处竖纹，查看平方距离条是否越过蓝色阈值线。位置最远的候选也可能最符合参照纹样。",
          "componentId": "patch-match",
          "evidence": "demo"
        }
      ],
      "transition": "有了相似块，还要决定每块保留哪些结构。怎样用少量纹样重建一个带噪图块？",
      "equations": [
        1,
        6
      ],
      "takeaways": [
        {
          "icon": "📐",
          "title": "按块比对",
          "desc": "计算对应像素的平方距离。"
        },
        {
          "icon": "🔎",
          "title": "阈值入组",
          "desc": "窗口限制搜索范围，距离阈值决定是否入组。"
        },
        {
          "icon": "🧱",
          "title": "少匹配也可恢复",
          "desc": "相似邻居不足时，单块仍可用稀疏表示重建。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "route": "sparse-coding",
      "title": "怎样用少量原子重建图块",
      "badge": "both",
      "badgeLabel": "稀疏表示",
      "bridge": "相似块提供了参照。要让它们一起恢复，先把单块写成几种基本纹样的叠加，并衡量这份重建与观测相差多少。",
      "analogy": {
        "title": "用模板补上刻纹",
        "text": "看印模怎样把一种基本纹样补回瓷砖。印模对应字典原子，被印出的深浅对应这个原子在图块里的系数。",
        "componentId": "tile-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "componentId": "atom-coding",
          "title": "两种纹样够用吗",
          "desc": "原子选得太少，可能缺掉原有纹样。点选左侧的模板，观察重建块和含噪块的差异，再看平方残差。试着在本例的容差 0.05 内，用尽可能少的原子完成重建。",
          "evidence": "demo"
        }
      ],
      "insight": "约束内的稀疏解使用较少非零系数，残差容差可以随噪声水平设定。",
      "transition": "每块都能单独选原子。遇到本应相似却各带噪声的一组块，让它们一起选会怎样？",
      "equations": [
        2,
        3
      ],
      "takeaways": [
        {
          "icon": "◈",
          "title": "原子",
          "desc": "字典的每一列是一种可叠加的基本纹样。"
        },
        {
          "icon": "⊕",
          "title": "系数",
          "desc": "系数控制一种纹样在图块里的强度和正负。"
        },
        {
          "icon": "✓",
          "title": "误差预算",
          "desc": "先满足残差容差，再比较各方案用了多少原子。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "route": "joint-sparsity",
      "title": "联合编码与字典学习",
      "badge": "both",
      "badgeLabel": "选原子与学原子",
      "bridge": "上一节已经把相似图块分到同一组。接下来要做两件事。联合编码决定这组图块一起用哪些原子，再给每块估计各自的系数。字典学习则用当前图像的图块调整原子本身，让字典更容易表示这张图反复出现的结构。",
      "analogy": {
        "title": "同一枚印模可以印出不同深浅",
        "text": "看同一枚印模怎样在两块砖上留下深浅不同的纹样。印模的形状对应原子，纹样的深浅对应各块的系数。联合编码让相似块一起挑印模，字典学习会调整印模的形状。",
        "componentId": "tile-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "componentId": "shared-coding",
          "title": "固定字典后，相似块怎样共同选原子",
          "tabLabel": "联合编码",
          "desc": "<strong>两边都用同一套字典处理同样的三个含噪图块。</strong> 三块都有左亮右暗的纹样，各自混进了不同干扰。独立编码让每块根据自己的残差给原子打分。联合编码把三块对同一原子的分数相加，一起选得分最高的原子，再给每块估计各自的系数。分数越高，原子越能解释剩下还没重建的纹样。<br><br>点击「第 1 轮」，看两边框出了哪些原子行。每行是一个原子，每列是一个图块。彩条的长度表示系数大小，左右方向表示正负。干净块误差衡量还原程度，含噪块残差衡量对观测的拟合程度。",
          "evidence": "demo"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "字典学习怎样改变原子本身",
          "tabLabel": "字典学习",
          "desc": "<strong>字典学习用当前图块调整原子的纹样。</strong> 离线原子上亮下暗，三个当前图块都偏向左亮右暗。点 LSC，观察原子怎样随图块更新。再点 LSSC，对照相似组在哪些步骤起作用。<br><br>演示按固定系数将三个图块加权，只更新一枚原子。论文用当前图像同时学习一套字典和各组的系数。",
          "componentId": "dictionary-learn",
          "evidence": "demo"
        }
      ],
      "insight": "式（5）用系数矩阵的行表示共享原子。式（7）给定字典 D，求一组相似块的系数 Aᵢ。式（8）把 D 也纳入求解，让所有图块组共同适配一套字典。",
      "transition": "联合编码给出了各块的重建。把它们拼回整图时，同一个像素收到几份不同估计，要怎样合并？",
      "equations": [
        5,
        7,
        8
      ],
      "takeaways": [
        {
          "icon": "🔗",
          "title": "联合编码选原子",
          "desc": "相似块共用一组原子，每块为它们估计各自的系数。"
        },
        {
          "icon": "◈",
          "title": "字典学习调整原子",
          "desc": "以离线字典为起点，用当前观测中的图块更新各原子的纹样。"
        },
        {
          "icon": "🧱",
          "title": "LSSC 的恢复顺序",
          "desc": "用相似组适配字典，再固定学到的字典做联合编码，得到各块的恢复结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "route": "merge-patches",
      "title": "怎样把图块拼回整图",
      "badge": "inf",
      "badgeLabel": "融合",
      "bridge": "联合编码恢复的是图块，整图需要逐像素重建。把每块放回原位后，重叠处的同一像素会收到多份估计。",
      "analogy": {
        "title": "对齐几片补砖",
        "text": "看两片补砖叠在一起时高亮的交叠区域。图块回填时，每一份覆盖该区域的估计都会参与计算。",
        "componentId": "tile-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "componentId": "overlap-merge",
          "title": "一个像素收到几份估计",
          "desc": "每个像素收到的估计份数由覆盖它的图块决定。拖动左侧定位框或点击方向键，比较只被一块覆盖的位置和重叠区。右侧把覆盖当前点的估计列出来，相加后除以实际份数。",
          "evidence": "demo"
        }
      ],
      "insight": "每个像素按自己收到的估计份数做平均。",
      "transition": "回填可以融合已有估计。遇到 Bayer RAW 每个位置缺少的两个颜色分量，还需要怎样恢复？",
      "equations": [
        4,
        9
      ],
      "takeaways": [
        {
          "icon": "◈",
          "title": "原位回填",
          "desc": "每块按自己的索引放回整图。"
        },
        {
          "icon": "＋",
          "title": "计数累加",
          "desc": "每覆盖一个已估计像素，就累加一次读数与计数。"
        },
        {
          "icon": "✓",
          "title": "逐点平均",
          "desc": "除以覆盖次数，避免重叠多的区域因求和而变亮。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "route": "real-raw",
      "title": "怎样从 Bayer RAW 得到全彩图",
      "badge": "both",
      "badgeLabel": "成像流程",
      "bridge": "重叠图块可以合成整图，但 Bayer 马赛克每个位置仍只有一个实测颜色分量。论文的实拍流程先在马赛克上去噪，再保留已知分量作为补色约束。",
      "analogy": {
        "title": "揭开遮纸查看砖纹",
        "text": "遮纸隔开已知纹样和待恢复的部分。看揭纸后露出的图案，它对应去马赛克时用来约束重建的已测颜色分量。",
        "componentId": "tile-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "放大原论文的实拍效果",
          "tabLabel": "实拍对照",
          "desc": "同一场景经不同流程处理后，残噪、伪色和细节有何差别？切换夜景、郁金香或雕塑，在同一裁块比较两种结果。重点看夜景暗部、花瓣边缘和雕塑背景。这组图适合做视觉判断。",
          "componentId": "real-effects",
          "evidence": "paper"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "用掩码检验补色候选",
          "tabLabel": "Bayer 补色",
          "desc": "一份全彩图怎样通过 Bayer 观测的检验？点「下一步」比较两个补色候选，观察已测位置的红框和观测残差平方和。残差归零表示已测值吻合，缺失值仍由字典和相似块约束。论文图 3 给出了栅栏上的补色伪影对照。",
          "componentId": "masked-rebuild",
          "evidence": "demo",
          "figure": {
            "src": "./images/fig-3.png",
            "alt": "栅栏裁块的两种去马赛克结果",
            "caption": "论文图 3 · 左侧 LSC 结果在栅栏处出现黄蓝伪色，右侧为同一裁块的 LSSC 重建。",
            "page": 6
          }
        },
        {
          "kind": "module",
          "id": "6.3",
          "title": "处理顺序从 RAW 到全彩",
          "tabLabel": "处理流程",
          "desc": "去噪和补色分别改变什么？点「下一步」查看含噪马赛克、同色去噪和简化插值补色。前两步每个位置都只有一个颜色分量，可以对照采样位 RMSE。最后一步才显示完整 RGB。",
          "componentId": "raw-pipeline",
          "evidence": "demo"
        }
      ],
      "insight": "比较实拍结果时，留意噪声、伪色和纹理；这些局部图没有无噪声真值。",
      "transition": "观察实拍细节可以发现差异。要检验算法的效果，论文分别在什么条件下做比较？",
      "equations": [
        10
      ],
      "takeaways": [
        {
          "icon": "📷",
          "title": "实拍输入",
          "desc": "三张 RAW 来自同一台 Canon PowerShot G9，ISO 1600。"
        },
        {
          "icon": "🎛",
          "title": "先去噪再补色",
          "desc": "去噪后再完成颜色估计与白平衡、色域转换等显影步骤。"
        },
        {
          "icon": "🔎",
          "title": "视觉比较",
          "desc": "局部裁块展示可见残噪和伪色，定量结论需看对应协议。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "route": "experiments",
      "title": "怎样判断去噪有没有效果",
      "badge": "both",
      "badgeLabel": "实验",
      "bridge": "实拍裁块让我们看到了噪声和细节的变化。定量比较还需要对齐输入和评价条件，因此要分开看论文的合成去噪、Kodak 去马赛克和实拍 RAW 三组结果。",
      "analogy": {
        "title": "对齐修补区再验收",
        "text": "看尺子依次对准两片砖的同一段接缝。图像实验也要对齐输入、评价区域和指标，才知道表中的数值能比较什么。",
        "componentId": "tile-analogy"
      },
      "insight": "固定样本和原子支撑，才可以用误差变化检验拟合权重的影响。",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "按实验协议读 PSNR",
          "tabLabel": "论文数据",
          "desc": "比较前先确认两种方法做的是同一项任务。切换「合成去噪」，在相同的噪声强度下读平均 PSNR。切换「Kodak 去马赛克」，查看 24 张图像的重建结果。「实拍 RAW」对应论文的定性裁块对照。",
          "componentId": "results-compare",
          "evidence": "paper",
          "figure": {
            "src": "./images/fig-2.png",
            "alt": "两组含噪输入与对应的局部恢复示例",
            "caption": "论文图 2 · 左列为合成噪声输入，右列为作者方法恢复后的局部。",
            "page": 6
          }
        },
        {
          "kind": "module",
          "id": "7.2",
          "title": "用模拟 RAW 检验等方差假设",
          "tabLabel": "教学实验",
          "desc": "真实 RAW 的噪声强度可能随亮度变化，按方差加权能否改善拟合？这个教学实验固定 Bayer 图块匹配和原子支撑。拖动光子数，再切换暗部或亮部，比较等权拟合与方差加权的 RMSE。表中同时列出含噪输入的误差作为基准。",
          "componentId": "raw-test",
          "evidence": "extension"
        }
      ],
      "transition": "指标只回答实验条件下的问题。当纹样难匹配、噪声不均或算力有限时，应该怎样看待这套方法？",
      "equations": [
        "psnr"
      ],
      "takeaways": [
        {
          "icon": "📐",
          "title": "同协议比较",
          "desc": "表 2 评价去噪，表 3 评价去马赛克。"
        },
        {
          "icon": "🌗",
          "title": "检查暗部和亮部",
          "desc": "模拟噪声方差随线性亮度改变，分区域可能得到不同结论。"
        },
        {
          "icon": "🧪",
          "title": "限定结论范围",
          "desc": "教学实验回答的是权重在这组模拟条件下的影响。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "route": "critical-thinking",
      "title": "批判性思考",
      "badge": "both",
      "badgeLabel": "评价",
      "bridge": "先评估 LSSC 的实验依据、适用边界和计算代价，再想想它给我带来的三点启发，从组合技术的思路到今天的 RAW 恢复。",
      "stackModules": true,
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "什么时候值得用 LSSC",
          "desc": "把前三个问题带进方法比较。先看原文在什么条件下得到结果，再看 BM3D、ELD 和后续 GroupSC 分别解决了什么问题。最后可以展开讨论题，设计验证方法。",
          "componentId": "critical-review"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "对我的启发",
          "desc": "这篇论文让我想到三个问题。两种方法怎样互补？今天拍 RAW 还需要补色吗？噪声模型简化之后，算法为什么还能起作用？",
          "componentId": "critical-reflections"
        }
      ],
      "takeaways": []
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1tE411A7RC",
      "title": "稀疏表示",
      "reason": "论文合作者 Guillermo Sapiro 的课程，第 4、5 集涉及字典学习与图像恢复。",
      "cover": "https://i1.hdslb.com/bfs/archive/6a1ca47ddafe3369045c5613a14154cdf4181525.jpg",
      "views": "2.2万播放"
    },
    {
      "bvid": "BV19d4y1q7wz",
      "title": "ISP 算法 · 图像去马赛克",
      "reason": "用插值实例理解如何从 Bayer 采样补齐颜色。",
      "cover": "https://i0.hdslb.com/bfs/archive/a1ba4f3f8e0dd98bf1d9b0d2423090aaf94c83a5.jpg",
      "views": "7009播放"
    },
    {
      "bvid": "BV1p34y197pE",
      "title": "CFA 图像传感器的降噪",
      "reason": "扩展材料，了解在马赛克上直接去噪的另一种方案。",
      "cover": "https://i0.hdslb.com/bfs/archive/86250ed3efa7d832aea98556bea20ad38db4f119.jpg",
      "views": "4638播放"
    }
  ]
};
