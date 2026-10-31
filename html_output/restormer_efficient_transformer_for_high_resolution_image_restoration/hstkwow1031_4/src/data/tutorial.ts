import type { TutorialData } from '../types';
export const tutorial:TutorialData = {
  "meta": {
    "titleEn": "Restormer: Efficient Transformer for High-Resolution Image Restoration",
    "titleZh": "Restormer：高分辨率图像复原的高效 Transformer",
    "venue": "CVPR 2022",
    "authors": "Syed Waqas Zamir, Aditya Arora, Salman Khan, Munawar Hayat, Fahad Shahbaz Khan, Ming-Hsuan Yang",
    "affiliation": "IIAI · MBZUAI · Monash · Linköping · UC Merced · Yonsei · Google Research",
    "domain": "计算机视觉 · 图像复原",
    "coreProblem": "高分辨率图像复原 · 从空间注意力到通道注意力",
    "coreInsight": "先聚合局部上下文，再用通道关系建模全局信息；MDTA 与 GDFN 共同服务高分辨率复原。",
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
      "desc": "空间位置两两配对",
      "componentId": "rest-cover"
    },
    "newMethod": {
      "title": "MDTA 转置注意力",
      "desc": "通道之间建立关联",
      "componentId": "rest-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "复原问题与计算瓶颈",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "高分辨率复原为什么需要高效注意力",
          "desc": "固定通道时，MDTA避免HW×HW矩阵。",
          "componentId": "rest-complexity"
        }
      ],
      "scenes": [
        {
          "id": "complexity",
          "title": "高分辨率复原为什么需要高效注意力",
          "goal": "空间配对 N² vs. 通道配对 C²",
          "summary": "固定通道时，MDTA避免HW×HW矩阵。",
          "interaction": "选择边长，比较空间关系矩阵和固定通道矩阵。",
          "next": "整体网络：从退化图像到复原图像",
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
      "title": "整体网络与基本块",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "整体网络：从退化图像到复原图像",
          "desc": "各尺度重复Transformer Block，末端预测残差图像。",
          "componentId": "rest-network"
        },
        {
          "kind": "module",
          "id": "2.2",
          "title": "基本块：先 MDTA，再 GDFN",
          "desc": "两个子模块各有层归一化与特征残差连接。",
          "componentId": "rest-block"
        }
      ],
      "scenes": [
        {
          "id": "scale",
          "title": "整体网络：从退化图像到复原图像",
          "goal": "四层编码—解码 · 同尺度跳接 · 图像残差",
          "summary": "各尺度重复Transformer Block，末端预测残差图像。",
          "interaction": "选择一个尺度，对照编码形状与解码处理。",
          "next": "基本块：先 MDTA，再 GDFN",
          "notes": "p3 Fig2与Overall Pipeline；p5 Implementation Details。编码通道48/96/192/384、头1/2/4/8、块4/6/6/8；顶层解码为2C。；总览自行绘制，不使用笔记或论文图片。中间解码层拼接后1×1降维，顶层保留2C，Refinement后输出残差。",
          "componentId": "rest-network",
          "thumbnail": "./thumbnails/scale.jpg",
          "moduleId": "2.1"
        },
        {
          "id": "block",
          "title": "基本块：先 MDTA，再 GDFN",
          "goal": "各尺度重复使用同一种基本块",
          "summary": "两个子模块各有层归一化与特征残差连接。",
          "interaction": "选择MDTA或GDFN，查看对应内部顺序和残差公式。",
          "next": "MDTA：先生成 Q、K、V",
          "notes": "p4 Fig2, Eq1–2。MDTA和GDFN在每个Transformer Block中依次执行，前置LayerNorm，各自加残差。公式中MDTA/GDFN符号仅指不包含外部LN及残差加法的分支运算。特征残差与末端图像残差I+R不同。",
          "componentId": "rest-block",
          "thumbnail": "./thumbnails/block.jpg",
          "moduleId": "2.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "展开 MDTA：局部投影到通道注意力",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "MDTA：先生成 Q、K、V",
          "desc": "局部空间混合与通道混合承担不同角色。",
          "componentId": "rest-local"
        },
        {
          "kind": "module",
          "id": "3.2",
          "title": "MDTA：通道注意力与特征混合",
          "desc": "Q为N×C、K为C×N，得到C×C关系。",
          "componentId": "rest-channel"
        },
        {
          "kind": "module",
          "id": "3.3",
          "title": "MDTA · 缩放参数怎样影响权重",
          "desc": "缩放改变归一化分布，不能独立保证质量。",
          "componentId": "rest-alpha"
        }
      ],
      "scenes": [
        {
          "id": "local",
          "title": "MDTA：先生成 Q、K、V",
          "goal": "1 × 1 混合通道 → 3 × 3 引入邻域",
          "summary": "局部空间混合与通道混合承担不同角色。",
          "interaction": "点选网格位置，切换是否加入3×3卷积。",
          "next": "MDTA：通道注意力与特征混合",
          "notes": "p4 §3.1。1×1使用固定权重[0.55,0.30,0.15]，再加入3×3均值逐通道卷积，边界零填充。均值核非训练权重。中心值仅投影0.7225，加入邻域后0.5791667。",
          "componentId": "rest-local",
          "thumbnail": "./thumbnails/local.jpg",
          "moduleId": "3.1"
        },
        {
          "id": "channel",
          "title": "MDTA：通道注意力与特征混合",
          "goal": "Q/K → 通道权重 → 混合 V",
          "summary": "Q为N×C、K为C×N，得到C×C关系。",
          "interaction": "调整通道模式、选择注意力列，再选择输出位置，对照同一位置的V混合。",
          "next": "MDTA · 缩放参数怎样影响权重",
          "notes": "p4 Eq(1)。本例N=6、C=3、K=Q转置，通道先作单位范数归一化；K为3×6、Q为6×3，α=1，Softmax按列归一。输出通道j为本地V=[0.2,0.8,0.5]与A第j列的内积。特征不是RGB或训练模型激活。本版补充3×6的V示例：三通道各为[0.2,0.4,0.6,0.8,0.3,0.5]、[0.8,0.6,0.2,0.4,0.9,0.1]、[0.5,0.2,0.8,0.3,0.4,0.7]。各空间位置共享同一通道权重矩阵；第一位置V与原单位置示例一致。V与Q/K采用独立教学数值，不是模型激活。",
          "componentId": "rest-channel",
          "thumbnail": "./thumbnails/channel.jpg",
          "moduleId": "3.2"
        },
        {
          "id": "alpha",
          "title": "MDTA · 缩放参数怎样影响权重",
          "goal": "固定关联分数，只改变 α",
          "summary": "缩放改变归一化分布，不能独立保证质量。",
          "interaction": "调节α，比较权重与加权输出。",
          "next": "GDFN：在 MDTA 之后做局部门控",
          "notes": "p4 Eq(1)。沿用mdtaToy(0.15,α,false)，分数固定只变α，V固定[0.2,0.8,0.5]；输出列权重和为1。手动控制用于说明可学习缩放，不把分布尖锐度等同于质量。",
          "componentId": "rest-alpha",
          "thumbnail": "./thumbnails/alpha.jpg",
          "moduleId": "3.3"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "展开 GDFN：局部变换与门控",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "GDFN：在 MDTA 之后做局部门控",
          "desc": "两路特征逐元素相乘，调节幅度与符号。",
          "componentId": "rest-gdfn"
        }
      ],
      "scenes": [
        {
          "id": "gdfn",
          "title": "GDFN：在 MDTA 之后做局部门控",
          "goal": "两路特征 → GELU 与逐元素乘法",
          "summary": "两路特征逐元素相乘，调节幅度与符号。",
          "interaction": "选择特征图同一位置，调整a或b，观察该位置乘积同步变化。",
          "next": "网络输出：预测残差图像，再加回输入",
          "notes": "p4 Eq2。展示4×4的两路卷积后合成特征，a、b分别逐位置编辑，输出为GELU(a)⊙b，GELU用tanh近似。a∈[-3,3]、b∈[-1,1]，不是训练模型激活。只有同位置的乘积改变；随后输出投影及残差在本页只表示其位置，不执行该部分计算。扩展比2.66。",
          "componentId": "rest-gdfn",
          "thumbnail": "./thumbnails/gdfn.jpg",
          "moduleId": "4.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "回到图像输出与训练",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "网络输出：预测残差图像，再加回输入",
          "desc": "输出为输入与预测残差相加。",
          "componentId": "rest-residual"
        },
        {
          "kind": "module",
          "id": "5.2",
          "title": "渐进训练：从小裁块到大上下文",
          "desc": "训练逐步扩大裁块，推理无需重复该课程。",
          "componentId": "rest-training"
        }
      ],
      "scenes": [
        {
          "id": "residual",
          "title": "网络输出：预测残差图像，再加回输入",
          "goal": "输入 I + 预测残差 R = 输出",
          "summary": "输出为输入与预测残差相加。",
          "interaction": "点选像素位置，对照输入、残差与输出的相加关系。",
          "next": "渐进训练：从小裁块到大上下文",
          "notes": "p3 Overall Pipeline：输出为I+R，无额外手动缩放系数。本页12个输入与残差值是人工设置的合成教学数值，仅演示逐位置相加；没有运行模型，不提供目标或误差评价。",
          "componentId": "rest-residual",
          "thumbnail": "./thumbnails/residual.jpg",
          "moduleId": "5.1"
        },
        {
          "id": "training",
          "title": "渐进训练：从小裁块到大上下文",
          "goal": "裁块增大，batch 减小",
          "summary": "训练逐步扩大裁块，推理无需重复该课程。",
          "interaction": "选择阶段，联动裁框、batch和起始迭代。",
          "next": "运动去模糊：在同协议下比较",
          "notes": "p4 §3.3、p5 Implementation Details；128/64起步，92K160/40、156K192/32、204K256/16、240K320/8、276K384/8；AdamW L1 300K；任务分别训练。 表9是另一个100K次消融：固定128²为29.71dB/22.5h，渐进为29.78dB/23.1h；不与上方300K默认课程混同，不插值阶段分数。",
          "componentId": "rest-training",
          "thumbnail": "./thumbnails/training.jpg",
          "moduleId": "5.2"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "实验证据与取舍",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "运动去模糊：在同协议下比较",
          "desc": "GoPro训练后直接测试其他三个数据集。",
          "componentId": "rest-motion"
        },
        {
          "kind": "module",
          "id": "6.2",
          "title": "三类复原任务，各自怎样比较",
          "desc": "任务条件与输入模态决定比较是否有效。",
          "componentId": "rest-tasks"
        },
        {
          "kind": "module",
          "id": "6.3",
          "title": "模块消融：质量增益从哪里来",
          "desc": "更准确、FLOPs更低和推理更快不是同一个结论。",
          "componentId": "rest-ablations"
        },
        {
          "kind": "module",
          "id": "6.4",
          "title": "深度与宽度：准确率和速度的取舍",
          "desc": "窄深更准、宽浅更快，依据论文消融和计时条件。",
          "componentId": "rest-tradeoff"
        }
      ],
      "scenes": [
        {
          "id": "motion",
          "title": "运动去模糊：在同协议下比较",
          "goal": "同一协议下比较 PSNR",
          "summary": "GoPro训练后直接测试其他三个数据集。",
          "interaction": "选择数据集行，查看测试条件。",
          "next": "三类复原任务，各自怎样比较",
          "notes": "p5 Table2、p6 §4.2。MPRNet32.66/30.96/35.99/28.70，Restormer32.92/31.22/36.19/28.96；PSNR dB↑，分组点图不暗示误差条。",
          "componentId": "rest-motion",
          "thumbnail": "./thumbnails/motion.jpg",
          "moduleId": "6.1"
        },
        {
          "id": "tasks",
          "title": "三类复原任务，各自怎样比较",
          "goal": "按任务与输入条件分组比较",
          "summary": "任务条件与输入模态决定比较是否有效。",
          "interaction": "阅读三组独立协议的结果。",
          "next": "模块消融：质量增益从哪里来",
          "notes": "p5 Table1去雨五数据集Y通道平均；p6 Table3 DPDD combined S单图/D双像素；p7 Table6 SIDD训练DND直测。对照分别SPAIR32.91、Uformer39.77/39.96、IFAN25.37/25.99，Restormer33.96/40.02/40.03/25.98/26.66，PSNR dB↑。",
          "componentId": "rest-tasks",
          "thumbnail": "./thumbnails/tasks.jpg",
          "moduleId": "6.2"
        },
        {
          "id": "ablations",
          "title": "模块消融：质量增益从哪里来",
          "goal": "对照质量、参数量与计算量",
          "summary": "更准确、FLOPs更低和推理更快不是同一个结论。",
          "interaction": "点选配置，读取PSNR、FLOPs和参数。",
          "next": "深度与宽度：准确率和速度的取舍",
          "notes": "p8 Table7(a)(b)(c)(f)(g)、Table8。Urban100彩噪σ50，128裁块100K，FLOPs用256²计量，B/G均为十亿次。PSNR=[29.11,29.28,29.43,29.54,29.62,29.66,29.71]，FLOPs=[83.4,83.7,85.3,86.2,87.7,110,141]G，参数=[24.53,24.84,25.02,25.12,25.31,25.65,26.12]M。Table8的+Concat是保留顶层拼接后的2C，去掉后续1×1降维；不是首次增加跳接。点图不连接无序配置。Table7d的σ50异常单元格未用。",
          "componentId": "rest-ablations",
          "thumbnail": "./thumbnails/ablations.jpg",
          "moduleId": "6.3"
        },
        {
          "id": "tradeoff",
          "title": "深度与宽度：准确率和速度的取舍",
          "goal": "宽度看通道，深度看重复块",
          "summary": "窄深更准、宽浅更快，依据论文消融和计时条件。",
          "interaction": "选择C=48、64或80，联动结构示意与质量、延迟结果。",
          "next": "",
          "notes": "p8 Table10、§4.5。调整块数保持参数与FLOPs相近。宽48/64/80：PSNR29.71/29.63/29.56dB，训练22.5/15.5/13.5h，推理0.115/0.080/0.069s；256×256图像。不得外推为任意硬件性能，不添加不存在的误差条。结构图只定性表示通道与块数多寡，线条和方块不对应实际数量；原论文该表未列三种配置的完整块数，不据此给出具体深度。",
          "componentId": "rest-tradeoff",
          "moduleId": "6.4",
          "thumbnail": "./thumbnails/tradeoff.jpg"
        }
      ]
    }
  ],
  "thumbnails": {
    "cover": "./thumbnails/cover.jpg"
  }
};
