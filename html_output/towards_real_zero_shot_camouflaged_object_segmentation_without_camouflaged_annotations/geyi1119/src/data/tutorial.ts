import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Towards Real Zero-Shot Camouflaged Object Segmentation without Camouflaged Annotations",
    "titleZh": "无伪装标注的零样本伪装目标分割",
    "venue": "IEEE TPAMI 2025 · arXiv v2",
    "authors": "Cheng Lei · Jie Fan · Xinran Li · Tian-zhu Xiang · Ao Li · Ce Zhu · Le Zhang",
    "affiliation": "UESTC · Space42",
    "domain": "计算机视觉 · 零样本分割",
    "coreProblem": "没有伪装目标标注，如何同时保留局部细节并学到可迁移语义？",
    "coreInsight": "CaMF 保留局部表示，用多尺度跨模态对齐学习语义，再用码本替代推理时的大模型。",
    "keywords": [
      "COS",
      "SOS",
      "PEFT",
      "MFA",
      "codebook"
    ]
  },
  "hero": {
    "oldMethod": {
      "title": "SOS 语义偏置",
      "desc": "整体语义不足以解释所有局部细节；速写类比。",
      "componentId": "camf-cover"
    },
    "newMethod": {
      "title": "CaMF",
      "desc": "保留局部表示，并补充跨模态语义；速写类比。",
      "componentId": "camf-cover"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "零样本的边界是训练数据",
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "零样本的边界是训练数据",
          "desc": "核对标注从哪里来，而不是只看零样本这个名字。",
          "componentId": "camf-protocol"
        }
      ],
      "scenes": [
        {
          "id": "protocol",
          "title": "零样本的边界是训练数据",
          "goal": "核对标注从哪里来，而不是只看零样本这个名字。",
          "summary": "用DUTS显著性监督迁移，不使用COS标注。",
          "interaction": "切换训练来源，判断是否符合论文协议。",
          "next": "冻结主干，学习并联修正",
          "notes": "Fig.3；IV-A。DUTS训练20 epochs，预训练模型并未消失。",
          "componentId": "camf-protocol",
          "moduleId": "1.1",
          "thumbnail": "./thumbnails/protocol.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "冻结主干，学习并联修正",
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "冻结主干，学习并联修正",
          "desc": "改变修正强度，观察冻结输出与可训练分支。",
          "componentId": "camf-adapter"
        }
      ],
      "scenes": [
        {
          "id": "adapter",
          "title": "冻结主干，学习并联修正",
          "goal": "改变修正强度，观察冻结输出与可训练分支。",
          "summary": "并联低秩分支修改特征，不替换冻结主干。",
          "interaction": "调节分支缩放，计算向量相加。",
          "next": "多尺度改变空间粒度",
          "notes": "III-B Eq.3-4；Fig.4。合成二维向量不等于真实网络推理；Adapter无额外LN、带偏置。",
          "componentId": "camf-adapter",
          "moduleId": "2.1",
          "thumbnail": "./thumbnails/adapter.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "多尺度改变空间粒度",
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "多尺度改变空间粒度",
          "desc": "同一幅图像，如何产生不同尺度的视觉token？",
          "componentId": "camf-scales"
        }
      ],
      "scenes": [
        {
          "id": "scales",
          "title": "多尺度改变空间粒度",
          "goal": "同一幅图像，如何产生不同尺度的视觉token？",
          "summary": "不同空间粒度进入共享投影器。",
          "interaction": "选择下采样尺度，核对位置数与共享投影。",
          "next": "训练描述扩大语义提示",
          "notes": "III-B Multi-scale Transform；III-D Eq.6-9。最后特征经SFP生成四尺度。图示网格简化。",
          "componentId": "camf-scales",
          "moduleId": "3.1",
          "thumbnail": "./thumbnails/scales.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "训练描述扩大语义提示",
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "训练描述扩大语义提示",
          "desc": "区分训练提示消融与推理时问答。",
          "componentId": "camf-captions"
        }
      ],
      "scenes": [
        {
          "id": "captions",
          "title": "训练描述扩大语义提示",
          "goal": "区分训练提示消融与推理时问答。",
          "summary": "描述在训练期提供语义，推理时不需要prompt。",
          "interaction": "选择训练提示，比较固定的实测分数。",
          "next": "置零分数，不等于删除概率",
          "notes": "Table IV SOS部分，DUTS零样本，CAMO/COD10K Fw越大越好；BLIP2-opt离线。",
          "componentId": "camf-captions",
          "moduleId": "4.1",
          "thumbnail": "./thumbnails/captions.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "置零分数，不等于删除概率",
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "置零分数，不等于删除概率",
          "desc": "从原始分数走到权重，检查每一步。",
          "componentId": "camf-token-match"
        }
      ],
      "scenes": [
        {
          "id": "token-match",
          "title": "置零分数，不等于删除概率",
          "goal": "从原始分数走到权重，检查每一步。",
          "summary": "稀疏化分数之后，零值仍贡献exp(0)。",
          "interaction": "改变一项分数和视觉位置数，重算softmax。",
          "next": "码本学习方向，推理移除 M-LLM",
          "notes": "III-D Eq.10-12。按行min-max，低于1/Lv置零，之后softmax。非负无穷硬mask。",
          "componentId": "camf-token-match",
          "moduleId": "5.1",
          "thumbnail": "./thumbnails/token-match.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "码本学习方向，推理移除 M-LLM",
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "码本学习方向，推理移除 M-LLM",
          "desc": "把描述方向与query对齐，观察余弦损失。",
          "componentId": "camf-codebook"
        }
      ],
      "scenes": [
        {
          "id": "codebook",
          "title": "码本学习方向，推理移除 M-LLM",
          "goal": "把描述方向与query对齐，观察余弦损失。",
          "summary": "训练对齐I与Q，推理使用学习到的query。",
          "interaction": "改变查询角度，切换训练与推理路径。",
          "next": "同主干比较：完整方法的增益",
          "notes": "III-F；III-G Eq.17-19。论文四尺度平均。零样本不含UAL。图为非零单位向量单尺度示意。",
          "componentId": "camf-codebook",
          "moduleId": "6.1",
          "thumbnail": "./thumbnails/codebook.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "同主干比较：完整方法的增益",
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "同主干比较：完整方法的增益",
          "desc": "控制backbone与训练协议，再解释指标差值。",
          "componentId": "camf-results"
        }
      ],
      "scenes": [
        {
          "id": "results",
          "title": "同主干比较：完整方法的增益",
          "goal": "控制backbone与训练协议，再解释指标差值。",
          "summary": "同主干DUTS协议下有增益，不外推所有指标全面领先。",
          "interaction": "选择指标和数据集，计算绝对与相对变化。",
          "next": "更大不一定更好",
          "notes": "Table II；IV-B。EVP-EVA02-L与CaMF同主干及相同超参数。Fw↑，MAE↓。无显著性结论。",
          "componentId": "camf-results",
          "moduleId": "7.1",
          "thumbnail": "./thumbnails/results.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "更大不一定更好",
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "更大不一定更好",
          "desc": "检查MFA通道、码本与推理开销的真实条件。",
          "componentId": "camf-ablations"
        }
      ],
      "scenes": [
        {
          "id": "ablations",
          "title": "更大不一定更好",
          "goal": "检查MFA通道、码本与推理开销的真实条件。",
          "summary": "更大通道并不保证更好，速度依赖设备和测量协议。",
          "interaction": "选择通道数和推理语义来源。",
          "next": "迁移结论必须带上模型来源",
          "notes": "Table III零样本CAMO Fw；Table I 4060Ti .055s。IV-E18.1FPS、332M与监督CAMO .887不混入零样本比较。",
          "componentId": "camf-ablations",
          "moduleId": "8.1",
          "thumbnail": "./thumbnails/ablations.png"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "迁移结论必须带上模型来源",
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "迁移结论必须带上模型来源",
          "desc": "修正错配的训练来源，再回看码本对齐。",
          "componentId": "camf-boundaries"
        }
      ],
      "scenes": [
        {
          "id": "boundaries",
          "title": "迁移结论必须带上模型来源",
          "goal": "修正错配的训练来源，再回看码本对齐。",
          "summary": "零样本是相对于任务定义的，不是没有任何监督。",
          "interaction": "为目标选择来源，调整独立合成query角度。",
          "next": "回到机制，检查证据边界。",
          "notes": "V Tables V-VII；polyp来自COS预训练，水下来自DUTS；OVCamo仅二值mask。角度不控制benchmark。",
          "componentId": "camf-boundaries",
          "moduleId": "9.1",
          "thumbnail": "./thumbnails/boundaries.png"
        }
      ]
    }
  ]
};
