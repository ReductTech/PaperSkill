import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Time-Aware One Step Diffusion Network for Real-World Image Super-Resolution",
    "titleZh": "时间感知的一步扩散真实图像超分网络",
    "venue": "CVPR 2026 · arXiv:2508.16557v3 · Nankai University / vivo",
    "authors": "Tianyi Zhang, Zheng-Peng Duan, Peng-Tao Jiang, Bo Li, Ming-Ming Cheng, Chun-Le Guo, Chongyi Li",
    "affiliation": "VCIP, CS, Nankai University; vivo Mobile Communication Co., Ltd.; NKIARI, Shenzhen Futian",
    "domain": "计算机视觉 · 真实世界图像超分 · 一步扩散",
    "coreProblem": "一步扩散超分常把学生时间步固定，可 SD 在不同时间步提供的生成先验并不一样。",
    "coreInsight": "让编码器随 tₛ 改写 latent，再用 tᵥ=λtₛ+γ 把老师拉到同一档位，一步模型就能连续调节保真与真实感。",
    "keywords": [
      "TADSR",
      "TAE",
      "TAVSD",
      "一步扩散",
      "保真–真实感折中"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "固定时间步的一步 Real-ISR",
      "desc": "学生只在一个档位工作，老师却在随机档位给意见。",
      "componentId": "tadsr-cover"
    },
    "newMethod": {
      "title": "时间感知的一步 Real-ISR",
      "desc": "同一张照片换一个档位，就换一种生成先验。",
      "componentId": "tadsr-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "01 · 固定时间步漏掉了什么",
      "modules": [
        {
          "kind": "module",
          "id": "t-prior",
          "title": "同一张照片，换档位就换先验",
          "desc": "拖动补全档位，观察照片、PSNR 与 QALIGN 一起变化。",
          "componentId": "tadsr-t-prior"
        },
        {
          "kind": "module",
          "id": "fixed-vs-timeaware",
          "title": "固定档位与时间感知档位",
          "desc": "拖动学生档位，比较老师档位随机跳动与跟随映射。",
          "componentId": "tadsr-fixed-vs-timeaware"
        }
      ],
      "scenes": [
        {
          "id": "ch1-t-prior",
          "title": "同一张照片，换档位就换先验",
          "goal": "转动黄铜档位，看同一张低质照片在不同 tₛ 下如何从保真滑向真实感。",
          "summary": "小档位更像原照片，大档位更敢补语义；PSNR 与 QALIGN 同屏读数。",
          "interaction": "拖动补全档位或点四个刻度，观察照片、PSNR 与 QALIGN。",
          "next": "为什么固定档位不够",
          "notes": "Table 3（第 12 页）给出 DrealSR 上 ts=200/400/500/600 的 PSNR 与 QALIGN：29.610/3.4750、29.245/3.5635、28.387/3.7491、28.473/3.7372。趋势是“总体”而非严格单调，ts=400 的 PSNR 实际略高于 300。照片为论文 Fig.8 第一行的人脸裁剪，是定性示例，不是逐点指标。档位旋钮是生活化控制，真实变量是整数时间步。",
          "componentId": "tadsr-t-prior",
          "moduleId": "t-prior"
        },
        {
          "id": "ch1-fixed",
          "title": "为什么固定学生档位不够",
          "goal": "比较“学生固定一个档位、老师随机换灯”和“老师档位跟着学生走”的两种修复台。",
          "summary": "固定档位下老师意见分散；时间感知档位把两盏灯对到同一焦点。",
          "interaction": "拖动学生档位，切换固定/时间感知模式，观察两个刻度与反馈。",
          "next": "TAE 如何改写工作底稿",
          "notes": "第 2 页 §1 指出已有方法通常固定学生时间步（如 999）而随机采样老师时间步；第 5 页 Eq.(5) 给出 tv=λts+γ。左图三个老师标记是“随机采样”的教学示意，不是某次真实运行的采样值；锁住的旋钮表示条件固定，不代表模型停止训练。",
          "componentId": "tadsr-fixed-vs-timeaware",
          "moduleId": "fixed-vs-timeaware"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "02 · TAE 与 TAVSD 怎么接上",
      "modules": [
        {
          "kind": "module",
          "id": "tae",
          "title": "TAE：档位先改工作底稿",
          "desc": "切换普通 VAE 与 TAE，拖动档位，观察 latent 网格与均值/标准差。",
          "componentId": "tadsr-tae"
        },
        {
          "kind": "module",
          "id": "arch",
          "title": "单步结构：一次成片，两路老师给方向",
          "desc": "点击学生、老师、LoRA 与 TAVSD，观察数据流和梯度去向。",
          "componentId": "tadsr-arch"
        },
        {
          "kind": "module",
          "id": "tavsd",
          "title": "TAVSD：把学生档位映射给老师",
          "desc": "联动调整 ts、λ、γ，观察老师档位、噪声强度与指导倾向。",
          "componentId": "tadsr-tavsd"
        },
        {
          "kind": "module",
          "id": "residual",
          "title": "残差：老师比学徒多出的那一层",
          "desc": "选择 tv=100/300/600，观察老师、LoRA 与梯度的差异。",
          "componentId": "tadsr-residual"
        }
      ],
      "scenes": [
        {
          "id": "ch2-tae",
          "title": "TAE：档位先改工作底稿",
          "goal": "拖动档位，比较普通 VAE 与 TAE 写出的工作底稿是否随档位变化。",
          "summary": "普通 VAE 换档位底稿不变；TAE 的 latent 均值/方差随档位变化。",
          "interaction": "拖动档位，切换普通 VAE / TAE，观察 6×6 工作底稿与 Fig.3 的读数。",
          "next": "一次成片的结构里谁在给方向",
          "notes": "第 4 页 §3.3 Eq.(4)：zL=Eθ(xL,ts)。Fig.3 报告 ts=200/400/600 时 latent 的 mean=0.369/0.281/0.153、std=0.554/0.425/0.243，并说明二者随 ts 增大而下降。中间的连续读数是教学插值，不是论文测量点；6×6 网格是示意。",
          "componentId": "tadsr-tae",
          "moduleId": "tae"
        },
        {
          "id": "ch2-arch",
          "title": "单步结构：一次成片，两路老师给方向",
          "goal": "在论文结构图上依次点亮学生、老师、LoRA 与 TAVSD，理解一步推理与训练期指导的区别。",
          "summary": "学生只做一次前向；老师与 LoRA 在训练时提供梯度，不增加推理步数。",
          "interaction": "点击结构图的四个区域或右侧按钮，观察高亮路径、角色说明和 ts 标签。",
          "next": "老师档位怎样和学生档位对齐",
          "notes": "结构图来自第 3 页 Fig.2；第 6 页 Eq.(9)-(10) 说明学生与 LoRA 的损失。图中老师为冻结、LoRA 可训练；不要把它读成“老师也被微调”。页面上的 ts 滑块只移动图中的时间步标签，不执行模型。",
          "componentId": "tadsr-arch",
          "moduleId": "arch"
        },
        {
          "id": "ch2-tavsd",
          "title": "TAVSD：把学生档位映射给老师",
          "goal": "拖动学生档位与 λ、γ，观察老师档位怎样被拉到同一焦点。",
          "summary": "tv=λts+γ 把两个独立时间步变成一条可调的映射。",
          "interaction": "拖动 ts、λ、γ，观察两个刻度、噪声条和“纹理/语义/粗结构”反馈。",
          "next": "老师与学徒的差是什么",
          "notes": "第 5 页 Eq.(5)-(6)：tv=λts+γ，默认 λ=0.5、γ=0；Table 5 显示增大 λ 或 γ 会让参考指标下降、无参考指标上升。噪声条是扩散噪声强度的示意，不是实际噪声张量；λ=0.5 不是普适最优。",
          "componentId": "tadsr-tavsd",
          "moduleId": "tavsd"
        },
        {
          "id": "ch2-residual",
          "title": "残差：老师比学徒多出的那一层",
          "goal": "比较 tv=100/300/600 时老师、LoRA 与 latent 梯度的差异。",
          "summary": "VSD 的指导方向来自两位预测者的残差，而且随 tv 改变。",
          "interaction": "点选三个 tv 列，观察图 4 的高亮、残差强度与反馈。",
          "next": "训练时怎样保住保真",
          "notes": "第 5 页 §3.4 与 Fig.4：小 tv 时老师与 LoRA 接近，主要是纹理；tv=300 时老师给出更多语义；tv=600 时老师只能恢复粗结构和颜色。Fig.4(a) 的均值/标准差上升趋势没有在正文给出逐点数值，因此本页只显示 1/2/3 级定性强度，不编造数字。红框是原图标注。",
          "componentId": "tadsr-residual",
          "moduleId": "residual"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "03 · 训练时怎么保住保真",
      "modules": [
        {
          "kind": "module",
          "id": "blur",
          "title": "模糊 MSE：高档位只监督低频",
          "desc": "拖动档位，观察高斯核、柔焦校样和低频/高频监督的变化。",
          "componentId": "tadsr-blur"
        }
      ],
      "scenes": [
        {
          "id": "ch3-blur",
          "title": "模糊 MSE：高档位只监督低频",
          "goal": "拖动档位，观察高斯核尺寸与柔焦校样怎样随 ts 变化。",
          "summary": "档位越高，像素 MSE 越只看低频；细节交给 TAVSD。",
          "interaction": "拖动 ts，切换“模糊 MSE / 普通 MSE”，观察核网格、校样和频带。",
          "next": "用论文表 1 检查主结果",
          "notes": "第 6 页 Eq.(7) 给出模糊 MSE；第 12 页 Eq.(14) 给出 kts=5+4⌊ts/200⌋（ts=200→9，400→13，500→13，600→17）。Table 4 显示去掉模糊 MSE 会提高 PSNR/SSIM、降低 MUSIQ/QALIGN，说明这是折中而非全面增益。CSS 模糊是视觉近似，真实实现是在图像上做高斯卷积。",
          "componentId": "tadsr-blur",
          "moduleId": "blur"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "04 · 证据与适用边界",
      "modules": [
        {
          "kind": "module",
          "id": "results",
          "title": "主结果：无参考指标领先，PSNR 保持可比",
          "desc": "切换指标与数据集，查看论文表 1 的精确比较。",
          "componentId": "tadsr-results"
        },
        {
          "kind": "module",
          "id": "ablation",
          "title": "消融：TAE 与 TAVSD 都不能少",
          "desc": "切换数据集与指标，比较 baseline、去 TAE、去 TAVSD 与 Full。",
          "componentId": "tadsr-ablation"
        },
        {
          "kind": "module",
          "id": "efficiency",
          "title": "一步与可控性能否同时成立",
          "desc": "点击模型点，查看推理时间、步数、参数量与 RealSR QALIGN。",
          "componentId": "tadsr-efficiency"
        },
        {
          "kind": "module",
          "id": "limit",
          "title": "档位推过头：补全变编造",
          "desc": "把档位推到 500/600，观察花蕊、污渍与指标回落。",
          "componentId": "tadsr-limit"
        }
      ],
      "scenes": [
        {
          "id": "ch4-results",
          "title": "主结果：无参考指标领先，PSNR 保持可比",
          "goal": "切换指标和数据集，逐条核对 TADSR 到底赢在哪里。",
          "summary": "TADSR 在 RealSR 的 QALIGN 最高，但 PSNR 并非第一；必须按指标方向读。",
          "interaction": "点选 QALIGN / PSNR 与 RealSR / DrealSR，观察条形图与 TADSR 读数。",
          "next": "两个部件分别贡献什么",
          "notes": "Table 1（第 7 页）主表用 ts=500。RealSR QALIGN 从高到低为 TADSR 3.9477、AdcSR 3.7749、TSDSR 3.7748、SeeSR 3.7190、OSEDiff 3.6915、S3Diff 3.6638、PisaSR 3.6355、DiffBIR 3.6313、StableSR 3.2767、SinSR 3.1889；RealSR PSNR 最高是 SinSR 28.345，TADSR 25.166。DrealSR QALIGN TADSR 3.7491、TSDSR 3.6928、AdcSR 3.6520；DrealSR PSNR 最高 TADSR 28.387、SinSR 28.345。不要跨数据集比较绝对分数。",
          "componentId": "tadsr-results",
          "moduleId": "results"
        },
        {
          "id": "ch4-ablation",
          "title": "消融：TAE 与 TAVSD 都不能少",
          "goal": "切换数据集与指标，比较去掉 TAE、去掉 TAVSD 与完整模型。",
          "summary": "两个部件都影响保真与真实感，完整模型在 Table 2 的四项指标上最高。",
          "interaction": "点选数据集与指标，观察四组柱子和精确数值。",
          "next": "一步与可控性能否同时成立",
          "notes": "Table 2（第 8 页）RealSR：Baseline 24.39/70.22/.6751/.6391，w/o TAE 24.89/70.08/.6857/.6466，w/o TAVSD 24.84/70.96/.6930/.6553，Full 25.16/71.18/.7283/.7082；DrealSR：27.45/65.90/.6887/.6275，27.95/65.95/.7030/.6396，28.03/66.95/.7015/.6373，28.39/67.02/.7398/.6758（PSNR/MUSIQ/CLIPIQA/TOPIQ）。只在同一数据集、同一指标内比较。",
          "componentId": "tadsr-ablation",
          "moduleId": "ablation"
        },
        {
          "id": "ch4-efficiency",
          "title": "一步与可控性能否同时成立",
          "goal": "把推理时间与 RealSR QALIGN 放在同一张图上看，判断“快”和“可控”是否冲突。",
          "summary": "TADSR 与 OSEDiff 时间/参数量相当，QALIGN 更高；PisaSR 需要两次推理。",
          "interaction": "点击任一模型点，查看步数、时间、参数量与 QALIGN。",
          "next": "把档位推过头会怎样",
          "notes": "Table 7（第 13 页）在单张 3090 24G、128×128 LQ、×4 SR 上测时间；Table 1 给 RealSR QALIGN。TADSR 1 步/0.1465 s/1777 MB/3.9477；OSEDiff 1 步/0.1463 s/1775 MB/3.6915；PisaSR 2 步/0.1675 s/1302 MB/3.6355。横轴用对数尺度以免慢方法挤在一起；点不连线。",
          "componentId": "tadsr-efficiency",
          "moduleId": "efficiency"
        },
        {
          "id": "ch4-limit",
          "title": "档位推过头：补全变编造",
          "goal": "把档位推到 600，观察 LQ 中不存在的花蕊、污渍状纹理与 QALIGN 回落。",
          "summary": "大档位能补语义，也会编造；档位不是“越高越清晰”的滤镜。",
          "interaction": "拖动 ts 200–600，观察人脸主图、图案与花卉缩略图、红笔标记与指标。",
          "next": "结束：按任务选择档位",
          "notes": "第 12 页 §7.1 与 Fig.8：更大 ts 下出现黄色花蕊、看似合理的建筑条纹，阴影图案变成污渍状伪影；第 5 页说很大 t 时老师只能恢复粗结构/颜色。Table 3 的 QALIGN 从 500 的 3.7491 回落到 600 的 3.7372。论文没有报告幻觉率；红笔是检查员的标记，不是模型输出。",
          "componentId": "tadsr-limit",
          "moduleId": "limit"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg",
    "ch1-t-prior": "./thumbnails/ch1-t-prior.jpg",
    "ch1-fixed": "./thumbnails/ch1-fixed.jpg",
    "ch2-tae": "./thumbnails/ch2-tae.jpg",
    "ch2-arch": "./thumbnails/ch2-arch.jpg",
    "ch2-tavsd": "./thumbnails/ch2-tavsd.jpg",
    "ch2-residual": "./thumbnails/ch2-residual.jpg",
    "ch3-blur": "./thumbnails/ch3-blur.jpg",
    "ch4-results": "./thumbnails/ch4-results.jpg",
    "ch4-ablation": "./thumbnails/ch4-ablation.jpg",
    "ch4-efficiency": "./thumbnails/ch4-efficiency.jpg",
    "ch4-limit": "./thumbnails/ch4-limit.jpg"
  }
};
