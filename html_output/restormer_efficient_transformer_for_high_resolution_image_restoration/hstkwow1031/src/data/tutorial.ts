import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Restormer: Efficient Transformer for High-Resolution Image Restoration",
    "titleZh": "Restormer：高分辨率图像复原的高效 Transformer",
    "venue": "CVPR 2022",
    "authors": "Syed Waqas Zamir, Aditya Arora, Salman Khan, Munawar Hayat, Fahad Shahbaz Khan, Ming-Hsuan Yang",
    "affiliation": "IIAI · MBZUAI · Monash · Linköping · UC Merced · Yonsei · Google Research",
    "domain": "计算机视觉 · 图像复原",
    "coreProblem": "高分辨率图像需要长程上下文，但逐像素空间自注意力的开销随像素数平方增长。",
    "coreInsight": "Restormer 先注入局部上下文，再用 MDTA 计算通道关系，配合 GDFN 门控与多尺度结构复原图像。",
    "keywords": [
      "MDTA",
      "GDFN",
      "图像复原",
      "通道注意力"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "空间自注意力",
      "desc": "逐像素配对，关系数按平方增长。",
      "componentId": "rest-cover"
    },
    "newMethod": {
      "title": "MDTA 转置注意力",
      "desc": "全幅统计通道关系，再混合特征。",
      "componentId": "rest-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "高分辨率复原的代价",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "空间自注意力的分辨率瓶颈",
          "desc": "固定通道时，MDTA避免HW×HW矩阵。",
          "componentId": "rest-complexity"
        }
      ],
      "scenes": [
        {
          "id": "complexity",
          "title": "空间自注意力的分辨率瓶颈",
          "goal": "扩大图像，观察两种关系矩阵怎样增长。",
          "summary": "固定通道时，MDTA避免HW×HW矩阵。",
          "interaction": "调整边长，比较矩阵元素数。",
          "next": "局部上下文：1×1 与逐通道卷积",
          "notes": "p3 §3.1；固定通道与头数，只比较矩阵大小，不等于网络显存或耗时。",
          "componentId": "rest-complexity",
          "thumbnail": "./thumbnails/complexity.jpg",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "MDTA：局部与全局",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "局部上下文：1×1 与逐通道卷积",
          "desc": "局部空间混合与通道混合承担不同角色。",
          "componentId": "rest-local"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "MDTA：把关系矩阵转到通道维",
          "desc": "Q为N×C、K为C×N，得到C×C关系。",
          "componentId": "rest-channel"
        },
        {
          "kind": "module",
          "id": "2.3",
          "title": "可学习缩放与通道聚合",
          "desc": "缩放改变归一化分布，不能独立保证质量。",
          "componentId": "rest-alpha"
        }
      ],
      "scenes": [
        {
          "id": "local",
          "title": "局部上下文：1×1 与逐通道卷积",
          "goal": "移动放大镜，观察邻域进入特征的方式。",
          "summary": "局部空间混合与通道混合承担不同角色。",
          "interaction": "点击网格位置。",
          "next": "MDTA：把关系矩阵转到通道维",
          "notes": "p4 §3.1；均值核和零填充是教学示意，非训练核。",
          "componentId": "rest-local",
          "thumbnail": "./thumbnails/local.jpg",
          "moduleId": "2.1"
        },
        {
          "id": "channel",
          "title": "MDTA：把关系矩阵转到通道维",
          "goal": "改变分色片模式，计算通道之间的关联。",
          "summary": "Q为N×C、K为C×N，得到C×C关系。",
          "interaction": "调整第二张分色片。",
          "next": "可学习缩放与通道聚合",
          "notes": "p4 Eq(1)；N=HW。示意KQ先除2，α=1，softmax沿输出列归一；这不是经过训练的QKV。",
          "componentId": "rest-channel",
          "thumbnail": "./thumbnails/channel.jpg",
          "moduleId": "2.2"
        },
        {
          "id": "alpha",
          "title": "可学习缩放与通道聚合",
          "goal": "调节 α，观察权重与加权输出同步变化。",
          "summary": "缩放改变归一化分布，不能独立保证质量。",
          "interaction": "调整缩放参数。",
          "next": "GDFN：门控的特征变换",
          "notes": "p4 Eq(1)；分数[1,0]、V[0.2,0.8]，softmax=[exp(1/α),1]/总和；单位置两通道示意。",
          "componentId": "rest-alpha",
          "thumbnail": "./thumbnails/alpha.jpg",
          "moduleId": "2.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "GDFN 与多尺度复原",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "GDFN：门控的特征变换",
          "desc": "GELU不是概率门，输出可负或大于1。",
          "componentId": "rest-gdfn"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "四层编码解码与高分辨率细节",
          "desc": "多尺度压缩空间、扩展通道，跳接辅助恢复细节。",
          "componentId": "rest-scale"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "残差预测：在输入上学习修正",
          "desc": "输出为输入与预测残差相加。",
          "componentId": "rest-residual"
        }
      ],
      "scenes": [
        {
          "id": "gdfn",
          "title": "GDFN：门控的特征变换",
          "goal": "操控遮片，观察 GELU 分支乘积的幅度和符号。",
          "summary": "GELU不是概率门，输出可负或大于1。",
          "interaction": "调整实数门控分支。",
          "next": "四层编码解码与高分辨率细节",
          "notes": "p4 Eq(2)；GELU tanh近似，b固定0.8；实际两路均包含1×1和3×3逐通道卷积。扩展比2.66。",
          "componentId": "rest-gdfn",
          "thumbnail": "./thumbnails/gdfn.jpg",
          "moduleId": "3.1"
        },
        {
          "id": "scale",
          "title": "四层编码解码与高分辨率细节",
          "goal": "更换观察倍率，检查特征形状与头数。",
          "summary": "多尺度压缩空间、扩展通道，跳接辅助恢复细节。",
          "interaction": "点击四个编码层。",
          "next": "残差预测：在输入上学习修正",
          "notes": "p3 Fig2与Overall Pipeline；p5 Implementation Details。编码通道48/96/192/384、头1/2/4/8、块4/6/6/8；顶层解码为2C。",
          "componentId": "rest-scale",
          "thumbnail": "./thumbnails/scale.jpg",
          "moduleId": "3.2"
        },
        {
          "id": "residual",
          "title": "残差预测：在输入上学习修正",
          "goal": "移动修补笔，找到接近目标亮度的修正量。",
          "summary": "输出为输入与预测残差相加。",
          "interaction": "调整残差 R。",
          "next": "渐进学习：扩大训练上下文",
          "notes": "p3 Overall Pipeline；单像素标量示意，误差只作教学反馈，不是论文测试结果。",
          "componentId": "rest-residual",
          "thumbnail": "./thumbnails/residual.jpg",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "训练策略",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "渐进学习：扩大训练上下文",
          "desc": "训练逐步扩大裁块，推理无需重复该课程。",
          "componentId": "rest-training"
        }
      ],
      "scenes": [
        {
          "id": "training",
          "title": "渐进学习：扩大训练上下文",
          "goal": "选择裁片尺寸，观察 batch 与训练阶段的变化。",
          "summary": "训练逐步扩大裁块，推理无需重复该课程。",
          "interaction": "选择六种训练裁块。",
          "next": "运动去模糊：同协议与跨数据集测试",
          "notes": "p4 §3.3、p5 Implementation Details；128/64起步，92K160/40、156K192/32、204K256/16、240K320/8、276K384/8；AdamW L1 300K；任务分别训练。",
          "componentId": "rest-training",
          "thumbnail": "./thumbnails/training.jpg",
          "moduleId": "4.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "实验证据",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "运动去模糊：同协议与跨数据集测试",
          "desc": "GoPro训练后直接测试其他三个数据集。",
          "componentId": "rest-motion"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "消融：准确率、训练时间与延迟",
          "desc": "更准确、FLOPs更低和推理更快不是同一个结论。",
          "componentId": "rest-ablations"
        }
      ],
      "scenes": [
        {
          "id": "motion",
          "title": "运动去模糊：同协议与跨数据集测试",
          "goal": "逐行检片，区分训练域与直接迁移测试。",
          "summary": "GoPro训练后直接测试其他三个数据集。",
          "interaction": "选择数据集读取提升。",
          "next": "去雨、散焦与真实去噪的证据",
          "notes": "p5 Table2、p6 §4.2。MPRNet32.66/30.96/35.99/28.70，Restormer32.92/31.22/36.19/28.96；PSNR dB↑，分组点图不暗示误差条。",
          "componentId": "rest-motion",
          "thumbnail": "./thumbnails/motion.jpg",
          "moduleId": "5.1"
        },
        {
          "id": "tasks",
          "title": "去雨、散焦与真实去噪的证据",
          "goal": "只比较同一行，避免把不同任务当作同一种评测。",
          "summary": "任务条件与输入模态决定比较是否有效。",
          "interaction": "阅读各任务的配对点图。",
          "next": "消融：准确率、训练时间与延迟",
          "notes": "p5 Table1去雨五数据集Y通道平均；p6 Table3 DPDD combined S单图/D双像素；p7 Table6 SIDD训练DND直测。对照分别SPAIR32.91、Uformer39.77/39.96、IFAN25.37/25.99，Restormer33.96/40.02/40.03/25.98/26.66，PSNR dB↑。",
          "componentId": "rest-tasks",
          "thumbnail": "./thumbnails/tasks.jpg"
        },
        {
          "id": "ablations",
          "title": "消融：准确率、训练时间与延迟",
          "goal": "切换实验组，检查每种改进付出了什么代价。",
          "summary": "更准确、FLOPs更低和推理更快不是同一个结论。",
          "interaction": "选择模块、训练或宽度实验。",
          "next": "适用边界：全局统计如何影响本地",
          "notes": "p8 §4.5 Table7–10：Urban100彩色高斯σ50，128裁块100K；FLOPs/延迟256×256。Table7d的σ50值32.40与正文不一致，未使用。模块表对应(a)(b)(c)(f)(g)，接续Table8；Table9固定29.71/22.5h、渐进29.78/23.1h；Table10宽48/64/80，PSNR29.71/29.63/29.56、延迟0.115/0.080/0.069s，调整块数保持相近参数FLOPs。",
          "componentId": "rest-ablations",
          "thumbnail": "./thumbnails/ablations.jpg",
          "moduleId": "5.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "机制边界",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "适用边界：全局统计如何影响本地",
          "desc": "远处影响通道统计，不代表任意退化都有解。",
          "componentId": "rest-boundary"
        }
      ],
      "scenes": [
        {
          "id": "boundary",
          "title": "适用边界：全局统计如何影响本地",
          "goal": "保持近处不动，只改变远处特征，再算一次。",
          "summary": "远处影响通道统计，不代表任意退化都有解。",
          "interaction": "点击远处区域或下方按钮。",
          "next": "返回核心机制，结合原论文完成人工准确性核验。",
          "notes": "p4 Eq1与p4实验范围、p8 §4.5。变化为第4位置第2通道t→1，本地V=[1,.8,0]不变。教学归纳：四类任务证据不保证未知退化、所有硬件或跨域泛化。",
          "componentId": "rest-boundary",
          "thumbnail": "./thumbnails/boundary.jpg",
          "moduleId": "6.1"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg"
  }
};
