import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "RUN: Reversible Unfolding Network for Concealed Object Segmentation",
    "titleZh": "RUN：面向隐蔽目标分割的可逆展开网络",
    "venue": "ICML 2025 · Proceedings of Machine Learning Research 267:22853–22864",
    "authors": "Chunming He, Rihan Zhang, Fengyang Xiao, Chengyu Fang, Longxiang Tang, Yulun Zhang, Linghe Kong, Deng-Ping Fan, Kai Li, Sina Farsiu",
    "affiliation": "Duke University; Tsinghua University SIGS; Shanghai Jiao Tong University; Nankai Institute of Advanced Research; Meta",
    "domain": "Computer vision · Concealed object segmentation · Deep unfolding",
    "coreProblem": "隐蔽目标与背景在纹理和颜色上相似，单靠掩码域判断容易把不确定区域分错。",
    "coreInsight": "RUN 将掩码估计与 RGB 背景重建放进同一展开过程，用重建冲突共同校正分割。",
    "keywords": [
      "隐蔽目标分割",
      "前景背景分离",
      "深度展开",
      "SOFS",
      "ROBE",
      "残差稀疏"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "掩码域可逆分割",
      "desc": "只看前景边界，难以发现背景与前景判断冲突。",
      "componentId": "cover-mask"
    },
    "newMethod": {
      "title": "RUN：掩码与 RGB 联合建模",
      "desc": "分割与背景重建共同检查同一处不确定区域。",
      "componentId": "cover-run"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "隐蔽目标分割中的双域歧义",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "掩码与重建冲突",
          "desc": "改变前景判断，观察背景解释与 RGB 重建误差如何联动。",
          "componentId": "domain-conflict-scene"
        }
      ],
      "scenes": [
        {
          "id": "domain-conflict",
          "title": "掩码歧义如何变成 RGB 重建冲突",
          "goal": "比较同一像素的前景掩码判断与 RGB 背景解释。",
          "summary": "用前景、背景和残差把问题动机与分离模型连起来。",
          "interaction": "选取 5×5 区域中的像素并改变掩码值，观察前景、背景与重建残差。",
          "next": "稀疏规则进一步降低不确定像素对分离的干扰。",
          "notes": "问题动机见 PDF p. 2 Sec. 1；Fig. 2, PDF p. 3。分离模型见 PDF p. 3 Sec. 3.1 Eqs. (1)-(4)。面板使用归一化合成数值，不复现论文图像。",
          "componentId": "domain-conflict-scene",
          "moduleId": "1.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "前景—背景分离与残差稀疏",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "COS 分离模型",
          "desc": "调节掩码与背景，检查重组残差和不确定性惩罚。",
          "componentId": "sparsity-scene"
        }
      ],
      "scenes": [
        {
          "id": "separation-model",
          "title": "分离模型与不确定像素的稀疏权重",
          "goal": "读懂前景、背景和残差，并理解不确定掩码为何不受稀疏惩罚。",
          "summary": "观察单像素重组残差；讲稿补充论文对 M̃ 与 w 的阈值规则。",
          "interaction": "调节 M 和 B，数值、分解条与残差即时更新；按讲稿判断阈值映射和权重。",
          "next": "把交替优化更新展开为有限阶段网络。",
          "notes": "分离模型见 PDF p. 3 Sec. 3.1 Eqs. (1)-(4)，使用归一化灰度单像素例 C=0.8。稀疏规则见 PDF p. 4 Sec. 3.1 Eq. (5)：[0.1,0.4) 映射到 0.1，(0.6,0.9] 映射到 0.9；[0.4,0.6] 时 w=0，其余 w=1。边界包含关系严格按论文；交互不是论文数据。",
          "componentId": "separation-scene",
          "moduleId": "2.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "交替近端更新与深度展开",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "掩码与背景的交替更新",
          "desc": "用一轮可计算的近端更新观察两个变量如何互相依赖。",
          "componentId": "unfold-scene"
        }
      ],
      "scenes": [
        {
          "id": "unfolding-structure",
          "title": "从 M/B 交替更新到 K 阶展开网络",
          "goal": "理解 M 与 B 的交替优化如何映射到 RUN 阶段结构。",
          "summary": "讲稿说明交替更新关系；画面逐阶段查看 SOFS 与 ROBE 的职责。",
          "interaction": "选择阶段 K 并点选 SOFS/ROBE，显示该阶段输入、输出与更新职责。",
          "next": "进入 SOFS 的双感受野掩码细化。",
          "notes": "交替更新见 PDF pp. 4-5 Sec. 3.2.1 Eqs. (6)-(17)：先更新 M，再以新 M 和旧 B 更新背景；背景子问题可闭式求解，掩码侧不伪造完整网络结果。展开结构见 Sec. 3.2.2 Fig. 3 Eqs. (18)-(21)。论文实验默认 K=4，见 PDF p. 6 implementation details；不宣称 K=4 对所有场景最优。",
          "componentId": "unfold-scene",
          "moduleId": "3.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "SOFS 与 RSS 的双感受野细化",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "局部边界与全局漏分",
          "desc": "操作两个感受野分支，观察它们对掩码响应的不同影响。",
          "componentId": "sofs-scene"
        }
      ],
      "scenes": [
        {
          "id": "sofs-rss",
          "title": "SOFS 如何兼顾边缘和漏分区域",
          "goal": "区分局部感受野与大感受野在 RSS 中的职责。",
          "summary": "操作输入特征和局部/广域分支权重，检查输出掩码与边缘响应。",
          "interaction": "选择 5×5 特征位置并调节两分支贡献，输出格图实时更新。",
          "next": "查看 ROBE 如何在 RGB 域更新背景并重建图像。",
          "notes": "PDF p. 5 Sec. 3.2.2 Eqs. (18)-(19), Fig. 3。小感受野用于边缘附近局部细化，大感受野用于补足漏分区域；玩具网格不等价于真实 VSS/RSS 网络。",
          "componentId": "sofs-scene",
          "moduleId": "4.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "ROBE 背景更新与图像重建",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "背景融合与冲突重建",
          "desc": "调节前阶段背景与当前反向前景，观察代数更新和重建残差。",
          "componentId": "loss-scene"
        }
      ],
      "scenes": [
        {
          "id": "reconstruction-loss",
          "title": "ROBE 背景更新与联合重建监督",
          "goal": "理解背景闭式更新，并区分掩码、边缘与重建损失。",
          "summary": "讲稿给出 ROBE 更新关系；交互切换各损失项的监督对象。",
          "interaction": "开关 BCE、IoU、Dice、重建 MSE，观察对应掩码、边缘和重建约束。",
          "next": "检查这些机制在 COD 协议下的实验结果。",
          "notes": "ROBE 更新见 PDF p. 5 Sec. 3.2.1 Eq. (17)：B̂ₖ=(λBₖ₋₁+C−C·M)/(1+λ)，真实 RUN 还用学习网络细化背景。联合损失见 Sec. 3.2.2 Eq. (22)。交互说明监督对象，不模拟训练精度或伪造消融数值。",
          "componentId": "loss-scene",
          "moduleId": "5.1"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "COD 基准结果与模块消融",
      "modules": [],
      "scenes": [
        {
          "id": "cod-results",
          "title": "RUN 在 COD10K 同设置下的结果",
          "goal": "在统一骨干和评测设置内比较主要指标，不跨协议拼接结论。",
          "summary": "聚焦 Table 1 的 ResNet50 common setting，比较 COD10K 的 Fβ、MAE、Eφ、Sα。",
          "interaction": "选择指标和 FEDER/FocusDiff 基线，联动查看四指标矩阵、局部数轴和绝对/相对差值；不改变论文测量结果。",
          "next": "不同 COS 子任务采用不同数据与指标协议。",
          "notes": "PDF p. 6 Table 1，ResNet50 common setting, single input scale/single stage：COD10K RUN Fβ=0.747, MAE=0.030, Eφ=0.903, Sα=0.827；FocusDiff Fβ=0.730, MAE=0.031, Eφ=0.897, Sα=0.820。Fβ/Eφ/Sα 越高越好，MAE 越低越好。",
          "componentId": "results-scene"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "跨任务结果与评测协议",
      "modules": [],
      "scenes": [
        {
          "id": "transfer-protocols",
          "title": "PIS、MTOS 与 TOD 不能合并排行",
          "goal": "按任务核对数据集、指标方向和训练划分。",
          "summary": "逐个查看跨任务评测协议，区分可以比较与不应合并的指标。",
          "interaction": "选择 PIS、MTOS 或 TOD，匹配数据集与指标组合并核对答案，反馈解释协议错配的原因。",
          "next": "最后核对 RUN+ 扩展和论文明确的适用边界。",
          "notes": "PDF pp. 7-8 Tables 2-4，Appendix A.1 p. 12。PIS: mDice/mIoU/Sα；MTOS: mDice/AUC/SEN；TOD: mIoU/Fβmax/MAE。数据划分与骨干不同，不跨任务比数值。",
          "componentId": "transfer-scene"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "退化鲁棒性与适用边界",
      "modules": [],
      "scenes": [
        {
          "id": "run-plus",
          "title": "RUN+ 的雾化鲁棒性来自额外重建器",
          "goal": "分清 RUN 主方法与加入预训练去雾模型的扩展。",
          "summary": "对照论文报告的 RUN/RUN+ 结构差别及雾化实验范围。",
          "interaction": "调节真实透射率、空气光与估计透射率，联动观察合成参考图、雾化输入、解析恢复和强度 MAE。",
          "next": "回顾双域联合建模解决的问题与仍未解决的边界。",
          "notes": "PDF p. 8 Fig. 5 Sec. 4.3；Appendix B p. 13。雾化在 COD10K 模拟，RUN 仍退化，RUN+ 使用额外预训练去雾模型。页面另用教学合成模型 I=tJ+(1−t)A 与解析逆变换说明估计误差；非 RUN/RUN+ 推理，强度 MAE 不等于论文分割 MAE。",
          "componentId": "runplus-scene"
        },
        {
          "id": "limitations",
          "title": "复杂退化、资源开销与分辨率仍有限制",
          "goal": "识别论文作者明确列出的未来工作方向。",
          "summary": "检查低层视觉模型整合成本和 352×352 输入设置对应的限制。",
          "interaction": "逐项判断同协议结果、混合退化、高分辨率和资源开销四个结论，查看证据解释并汇总判断结果。",
          "next": "结束教程。",
          "notes": "Appendix B p. 13；训练测试缩放到 352×352 见 Sec. 4 p. 5。低照度、模糊、噪声仅作为作者提及的方向，不写成已经测得的结果。",
          "componentId": "limits-scene"
        }
      ]
    }
  ]
};
