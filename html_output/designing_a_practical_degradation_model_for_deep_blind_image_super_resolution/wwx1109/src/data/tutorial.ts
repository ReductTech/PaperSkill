import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Designing a Practical Degradation Model for Deep Blind Image Super-Resolution",
    "titleZh": "面向真实图像盲超分的实用退化模型",
    "venue": "ICCV 2021 · ETH Zurich / KU Leuven",
    "authors": "Kai Zhang, Jingyun Liang, Luc Van Gool, Radu Timofte",
    "affiliation": "Computer Vision Lab, ETH Zurich; KU Leuven",
    "domain": "计算机视觉 · 图像超分辨率 · 退化建模",
    "coreProblem": "传统退化把模糊、下采样、噪声固定成一条链路 y=(x⊗k)↓s+n；本文把三类算子扩成家族并随机打乱顺序，用合成数据训出能应对真实照片的盲超分模型。",
    "coreInsight": "把模糊、下采样、噪声的算子家族扩大，并随机打乱顺序、采样参数，才能合成接近真实照片的 LR/HR 训练对。",
    "keywords": [
      "盲超分",
      "退化模型",
      "随机打乱",
      "BSRGAN",
      "DIV2K4D",
      "RealSRSet"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "固定顺序退化",
      "desc": "模糊→下采样→加噪→JPEG，顺序与强度都固定成一条链路。",
      "componentId": "bsrgan-cover"
    },
    "newMethod": {
      "title": "随机打乱退化",
      "desc": "同一张 HR 抽多份配方：顺序与强度都在变，覆盖真实照片的多种退化。",
      "componentId": "bsrgan-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 退化假设为什么会失效",
      "modules": [
        {
          "kind": "module",
          "id": "failure-chart",
          "title": "双三次训练的掉点",
          "desc": "切换退化类型与指标，比较双三次训练和本文退化训练的模型。",
          "componentId": "ch1-failure-chart"
        },
        {
          "kind": "module",
          "id": "traditional-model",
          "title": "传统退化模型的三个旋钮",
          "desc": "拖动模糊、噪声与缩放，观察 y=(x⊗k)↓s+n 只能产生固定顺序的退化。",
          "componentId": "ch1-traditional-model"
        }
      ],
      "scenes": [
        {
          "id": "ch1-failure",
          "title": "既有问题：双三次训练在非双三次退化上掉点",
          "goal": "切换退化类型与指标：RRDB/ESRGAN 是既有做法，BSRNet/BSRGAN 是本文给出的解决方向。",
          "summary": "既有做法（双三次训练）在 Type I 领先，到了更接近真实的退化类型就掉点；本文用新退化训练解决。",
          "interaction": "点选 Type I–IV，切换 PSNR/LPIPS，观察四条曲线与当前类型的最优方法。",
          "next": "看清传统退化模型能表达什么",
          "notes": "数据取自论文表 1（第 7 页）：DIV2K4D 每类 100 张合成图，PSNR 在 Y 通道计算，LPIPS 越低越好。RRDB 与 ESRGAN 用双三次退化训练，BSRNet 与 BSRGAN 用本文退化训练。Type I 双三次；Type II 各向异性高斯模糊 + 最近邻 ×4；Type III 各向异性模糊 + 最近邻 ×2 + 双三次 ×2 + JPEG；Type IV 本文退化。图表是固定证据记录，交互只切换查看的类型和指标，不改变数值；论文没有报告误差条，因此本页不绘制。",
          "componentId": "ch1-failure-chart",
          "moduleId": "failure-chart"
        },
        {
          "id": "ch1-traditional",
          "title": "传统退化模型：三个旋钮仍是一条固定链路",
          "goal": "拖动模糊、噪声与缩放，看清既有模型 y=(x⊗k)↓s+n 的固定顺序为何覆盖不到真实退化。",
          "summary": "既有模型有模糊、下采样、噪声三个因素，却把顺序固定住了；本文保留三者并打乱顺序。",
          "interaction": "拖动模糊宽度、噪声强度、缩放因子，观察 LR 样张、公式项高亮和链路节点。",
          "next": "把模糊算子家族扩大",
          "notes": "公式见论文第 1 页 Eq. (1)：y=(x⊗k)↓s+n，k 为高斯核，n 为白高斯噪声，s 为尺度。论文指出双三次退化可视为固定核、零噪声的特例。本页的样张由程序化静物图生成，用于演示固定链路的视觉效果，不是论文图。三个旋钮只改变强度，不改变“模糊→下采样→加噪”的顺序；这正是第 5 页随机打乱策略要打破的限制。",
          "componentId": "ch1-traditional-model",
          "moduleId": "traditional-model"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · 把退化空间撑大",
      "modules": [
        {
          "kind": "module",
          "id": "blur",
          "title": "模糊核家族",
          "desc": "切换各向同性与各向异性核，拖动宽度、角度和轴长比。",
          "componentId": "ch2-blur"
        },
        {
          "kind": "module",
          "id": "downsample",
          "title": "四种下采样与对齐",
          "desc": "选择最近邻、双线性、双三次或先下后上，观察像素网格与偏移。",
          "componentId": "ch2-downsample"
        },
        {
          "kind": "module",
          "id": "noise",
          "title": "三类噪声",
          "desc": "切换高斯、JPEG、传感器噪声，观察颗粒、块效应与直方图。",
          "componentId": "ch2-noise"
        },
        {
          "kind": "module",
          "id": "shuffle",
          "title": "随机打乱退化序列",
          "desc": "拖动四张工序卡，比较固定顺序与打乱顺序的 LR 和差异图。",
          "componentId": "ch2-shuffle"
        },
        {
          "kind": "module",
          "id": "sampler",
          "title": "随机配方采样",
          "desc": "重掷一份完整配方，锁定某一类算子，观察 LR 的多样性。",
          "componentId": "ch2-sampler"
        }
      ],
      "scenes": [
        {
          "id": "ch2-blur",
          "title": "模糊：各向同性核与各向异性核",
          "goal": "切换核类型，拖动宽度、角度和轴长比，观察光斑与样张的模糊方向。",
          "summary": "各向同性核均匀抹开边缘；各向异性核沿一个方向拉长，产生方向性拖影。",
          "interaction": "点选各向同性/各向异性，拖动核宽度、旋转角、轴长比，观察核热力图与模糊样张。",
          "next": "看下采样如何改变像素网格",
          "notes": "论文第 4 页 §3.1：模糊由 Biso 与 Baniso 两次高斯卷积组成；核尺寸在 {7×7,…,21×21} 均匀采样；各向同性宽度 s=2 时 [0.1,2.4]、s=4 时 [0.1,2.8]；各向异性旋转角 [0,π]、轴长 [0.5,6] 或 [0.5,8]；反射填充保持尺寸；宽度 0.1 等价于恒等核。本页把离散核尺寸和采样改成连续滑杆，只用于示教，不声称复现训练分布。",
          "componentId": "ch2-blur",
          "moduleId": "blur"
        },
        {
          "id": "ch2-downsample",
          "title": "下采样：四种方式与 0.5(s−1) 的像素偏移",
          "goal": "切换四种下采样方式，观察像素网格、锯齿和左上偏移。",
          "summary": "最近邻保留硬边但会偏移；双线性更平滑；双三次更锐；先下后上引入额外模糊。",
          "interaction": "选择下采样方式，切换 s=2/4，开关最近邻对齐补偿，调先下后上的 a。",
          "next": "看噪声的三种来源",
          "notes": "论文第 4 页 §3.2：在最邻近下采样前，用一个中心 21×21、平移 0.5(s−1) 像素的各向同性高斯核补偿左上偏移，该核宽度在 [0.1,0.6s] 随机采样；双线性/双三次直接下采样；先下后上先按 s/a 下采样再按 a 上采样，a∈[1/2,s]；四种方式等概率。第 5 页 §3.4 补充：s=4 时以 0.25 的概率先在 HR 上做一次双线性或双三次 ×2 下采样，再走 s=2 的退化链。本页测试卡是程序化图像，偏移读数 0.5(s−1) 是几何值，不是论文报告的指标。",
          "componentId": "ch2-downsample",
          "moduleId": "downsample"
        },
        {
          "id": "ch2-noise",
          "title": "噪声：高斯、JPEG 与传感器",
          "goal": "切换噪声类型，拖动强度，观察颗粒、8×8 块和彩色噪点的差别。",
          "summary": "高斯是均匀颗粒；JPEG 在 8×8 块边界产生块效应；传感器噪声更依赖信号强度。",
          "interaction": "选择高斯/JPEG/传感器，拖动 σ、质量因子或 ISO，观察样张、放大细节和直方图。",
          "next": "把这些算子打乱",
          "notes": "论文第 4 页 §3.3：高斯噪声用 3D N(0,Σ)，一般/AWGN/灰度三种形态概率 0.2/0.4/0.4，σ∈{1/255,…,25/255}；JPEG 质量 [30,95]，以 0.75/1 的概率执行两次，最后一次固定在链尾；传感器噪声概率 0.25，使用反向–正向 ISP 与 RAW 噪声模型、五台相机。本页 JPEG 用 8×8 DCT 量化近似，传感器噪声用信号相关噪声近似，均标注为简化示意。",
          "componentId": "ch2-noise",
          "moduleId": "noise"
        },
        {
          "id": "ch2-shuffle",
          "title": "随机打乱：同一组算子，顺序改变结果",
          "goal": "拖动右侧工序卡改变顺序，比较固定链路与打乱链路的样张。",
          "summary": "同样的算子和参数，顺序不同会让噪声被模糊、被下采样放大，或让 JPEG 块被后续模糊抹平。",
          "interaction": "拖动四张算子卡（或按左右方向键）改变顺序，观察右侧 LR、差异图和平均绝对差。",
          "next": "抽一份完整的随机配方",
          "notes": "论文第 5 页 §3.4 与 Fig. 1：退化序列 {Biso,Baniso,Ds,NG,NJPEG,NS} 随机打乱；本页固定模糊 1.2、双三次 ×2、高斯 σ=8、JPEG q=60，只改变四类算子的顺序。左侧固定链路是模糊→下采样→加噪的教学排序（论文 Eq.(1) 的传统模型不含 JPEG，JPEG 是本文额外补充的噪声项）。差异图与平均绝对差是同一张 HR 两条链路的逐像素计算，是教学示例，不是论文指标；论文没有报告这种差值。",
          "componentId": "ch2-shuffle",
          "moduleId": "shuffle"
        },
        {
          "id": "ch2-sampler",
          "title": "随机采样：一份配方覆盖一类退化",
          "goal": "抽一份随机配方，看看同一张 HR 能生成怎样的 LR；锁定某一类算子可单独观察。",
          "summary": "按论文的参数范围随机采样，同一张 HR 会得到模糊、块效应、噪声各不相同的 LR。",
          "interaction": "点“重掷配方”，勾选锁定模糊/下采样/噪声，观察配方卡、LR 与最近三次样张。",
          "next": "看盲超分模型怎么训练",
          "notes": "论文第 4–5 页给出各算子的参数范围；本页的采样器是教学实现，不是原训练代码。模糊宽度、角度、轴长、下采样方式、噪声类型与强度都按范围随机抽取；锁定功能用于做受控对比。注意论文的三类噪声是叠加关系（高斯必加，JPEG 以 0.75/1 的概率两次、传感器噪声 0.25），本页简化为三选一；样张为程序化静物图。",
          "componentId": "ch2-sampler",
          "moduleId": "sampler"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 盲超分模型怎么练",
      "modules": [
        {
          "kind": "module",
          "id": "training",
          "title": "两阶段训练",
          "desc": "切换 BSRNet 与 BSRGAN，观察损失构成与样张倾向。",
          "componentId": "ch3-training"
        },
        {
          "kind": "module",
          "id": "patch",
          "title": "72×72 训练 patch",
          "desc": "拖动裁切框、改变 patch 尺寸，观察一次训练能看到多少纹理与结构。",
          "componentId": "ch3-patch"
        }
      ],
      "scenes": [
        {
          "id": "ch3-training",
          "title": "两阶段训练：BSRNet 保真，BSRGAN 顾感知",
          "goal": "切换训练阶段，观察哪些损失在起作用，以及样张更平滑还是更锐。",
          "summary": "先训 PSNR 导向的 BSRNet，再加感知与对抗损失训 BSRGAN。",
          "interaction": "点选 BSRNet/BSRGAN，查看损失条与示意样张；可切换权重显示。",
          "next": "看训练 patch 为什么更大",
          "notes": "论文第 6 页 §5：先训 PSNR 导向的 BSRNet，再训感知导向的 BSRGAN；两者都用 ESRGAN 网络与本文退化合成的成对数据。损失为 1×L1 + 1×VGG 感知 + 0.1×谱范数最小二乘 PatchGAN；感知损失取 VGG 第 4 个 maxpool 前的第 4 层卷积；Adam 固定 1e-5，batch 48。右侧样张是双三次上采样后加轻微模糊/锐化的示意，用于说明训练目标差异，不是实际训练输出，也不附带指标。",
          "componentId": "ch3-training",
          "moduleId": "training"
        },
        {
          "id": "ch3-patch",
          "title": "72×72 patch：为什么训练块要更大",
          "goal": "拖动裁切框、改 patch 尺寸，观察一次训练能看到多少纹理与结构。",
          "summary": "退化越重，越需要更大的 patch 提供足够的纹理与结构；论文选 72×72。",
          "interaction": "拖动裁切框或按方向键移动，调 patch 尺寸 48–128，观察覆盖比例与配置卡。",
          "next": "先学读表 1",
          "notes": "论文第 6 页 §5：BSRGAN 使用 72×72 的 LR patch，原因是本文退化可能非常严重，更大的块能让模型捕获更多信息。训练数据为 DIV2K、Flickr2K、WED 与 2,000 张 FFHQ 人脸；按拉普拉斯方差去掉模糊图；损失权重 1:1:0.1；Adam 1e-5，batch 48。覆盖百分比是本页按 HR 320×240 计算的几何值，不是论文指标。",
          "componentId": "ch3-patch",
          "moduleId": "patch"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 证据、失效与边界",
      "modules": [
        {
          "kind": "module",
          "id": "read-table",
          "title": "表 1 的读法",
          "desc": "按行、按列、看整体三步读表 1：先看清每格是什么、绿色蓝色标什么，再读出结论。",
          "componentId": "ch4-read-table"
        },
        {
          "kind": "module",
          "id": "div2k4d",
          "title": "DIV2K4D 的九方法对比",
          "desc": "切换退化类型与指标，查看 PSNR/LPIPS 下谁在前。",
          "componentId": "ch4-div2k4d"
        },
        {
          "kind": "module",
          "id": "realsrset",
          "title": "RealSRSet 与无参考指标",
          "desc": "对照论文图 4 与表 2，理解指标与观感的不一致。",
          "componentId": "ch4-realsrset"
        },
        {
          "kind": "module",
          "id": "diagnosis",
          "title": "配方诊断",
          "desc": "为一种新症状勾选退化算子，检查配方是否对症。",
          "componentId": "ch4-diagnosis"
        }
      ],
      "scenes": [
        {
          "id": "ch4-read-table",
          "title": "先学读表 1：行是退化类型，列是方法",
          "goal": "先读懂表 1 的结构（每行一种退化、每列一个方法、每格一对数字），再读出论文的实验结论。",
          "summary": "同一行里比方法、同一列里看一个方法换退化类型会怎么变；最后按列平均看谁能一个模型打四类。",
          "interaction": "点 ①②③ 切换读法，点退化类型的行标题或方法的表头选中，表格即时高亮并给出对应结论。",
          "next": "用完整九方法看趋势",
          "notes": "数据取自论文表 1（第 7 页），本页从 9 个方法中取 5 个（RRDB、ESRGAN、RealSR-DPED、BSRNet、BSRGAN）便于读表，数值未改。每格上行 PSNR 在 Y 通道计算、越高越好，下行 LPIPS 越低越好；论文原表用红/蓝标最优/次优，本教程配色语义中红色表示失败，所以最优点改用绿色、次优点用蓝色。第 3 步的平均值是本页按这 5 个方法现算的，论文只写 best overall，没有给出平均数字，完整 9 方法的平均见下一页的柱状对比。",
          "componentId": "ch4-read-table",
          "moduleId": "read-table"
        },
        {
          "id": "ch4-div2k4d",
          "title": "DIV2K4D：PSNR 与 LPIPS 的分工",
          "goal": "切换退化类型与指标，看看九种方法里谁在前。",
          "summary": "Type I 由双三次训练的 RRDB/ESRGAN 领先；Type II–IV 的 PSNR 最优都是 BSRNet，LPIPS 在 Type III–IV 由 BSRGAN 领先（Type II 的 LPIPS 最优是 RealSR-DPED 0.263，BSRGAN 0.284 第二）。",
          "interaction": "选择 Type I–IV，切换 PSNR/LPIPS，观察九条横向柱条与当前最优方法。",
          "next": "看真实图像上的指标矛盾",
          "notes": "数据取自论文表 1（第 7 页），九种方法：RRDB、IKC、ESRGAN、FSSR-DPED、FSSR-JPEG、RealSR-DPED、RealSR-JPEG、BSRNet、BSRGAN。PSNR 在 Y 通道计算，LPIPS 越低越好；柱条从 0 起，最优绿色、次优蓝色。论文没有报告误差条，本页不绘制。Type I 双三次；Type II 各向异性高斯模糊 + 最近邻 ×4；Type III 各向异性模糊 + 最近邻 ×2 + 双三次 ×2 + JPEG（质量 [41,90]）；Type IV 本文退化。",
          "componentId": "ch4-div2k4d",
          "moduleId": "div2k4d"
        },
        {
          "id": "ch4-realsrset",
          "title": "RealSRSet：无参考指标为什么会看走眼",
          "goal": "对照论文图 4 与表 2：视觉更好的模型，指标一定更好吗？",
          "summary": "BSRGAN 的 NIQE/PI 并不占优，但图 4 中它的建筑与老照片细节更干净。",
          "interaction": "切换 NIQE/NRQM/PI，观察六种方法的柱条与 BSRGAN 的位置；图 4 保持原图对照。",
          "next": "把方法用在一个新症状上",
          "notes": "表 2（第 8 页）与图 4（第 8 页）：RealSRSet 有 20 张真实图、没有 GT；NIQE↓、NRQM↑、PI↓ 都是无参考指标；六种方法使用同一网络结构。数值为数据集级汇总，不含误差条。图 4 为论文原图裁切，保留原有标签与放大框；最后一路是 BSRGAN。论文明确指出无参考 IQA 不总与感知质量一致，并提醒 BSRGAN 仍可能在纹理区产生气泡伪影。",
          "componentId": "ch4-realsrset",
          "moduleId": "realsrset"
        },
        {
          "id": "ch4-diagnosis",
          "title": "配方诊断：把退化模型用在真实症状上",
          "goal": "选一张病征卡，勾选你认为需要覆盖的退化算子，看看配方是否对症。",
          "summary": "把真实症状翻译成算子家族，并记住这套模型是用来合成训练数据的。",
          "interaction": "选择夜景高 ISO、老照片扫描或社交平台压缩，勾选算子，点“检查配方”看覆盖结果。",
          "next": "",
          "notes": "病征→算子的对应关系是本教程的教学诊断规则，不是论文的自动分类器：夜景高 ISO 需要传感器噪声与高斯噪声（JPEG 可选）；老照片扫描需要各向异性模糊与下采样（各向同性可选）；社交平台压缩需要 JPEG 与下采样（高斯可选）。边界来自论文第 5 页 §4：退化模型主要用于合成训练数据，不适合反推某张 LR 的退化参数；第 8 页 §6.4 指出 BSRGAN 在纹理区可能出现气泡伪影。真实训练仍需随机化强度与顺序。",
          "componentId": "ch4-diagnosis",
          "moduleId": "diagnosis"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "ch1-failure": "./thumbnails/ch1-failure.jpg",
    "ch1-traditional": "./thumbnails/ch1-traditional.jpg",
    "ch2-blur": "./thumbnails/ch2-blur.jpg",
    "ch2-downsample": "./thumbnails/ch2-downsample.jpg",
    "ch2-noise": "./thumbnails/ch2-noise.jpg",
    "ch2-shuffle": "./thumbnails/ch2-shuffle.jpg",
    "ch2-sampler": "./thumbnails/ch2-sampler.jpg",
    "ch3-training": "./thumbnails/ch3-training.jpg",
    "ch3-patch": "./thumbnails/ch3-patch.jpg",
    "ch4-read-table": "./thumbnails/ch4-read-table.jpg",
    "ch4-div2k4d": "./thumbnails/ch4-div2k4d.jpg",
    "ch4-realsrset": "./thumbnails/ch4-realsrset.jpg",
    "ch4-diagnosis": "./thumbnails/ch4-diagnosis.jpg"
  }
};
