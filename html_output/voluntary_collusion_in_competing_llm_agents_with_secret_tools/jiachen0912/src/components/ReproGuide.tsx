import React from 'react';

// 第⑥部分：项目复现指南与避坑要点。论文代码尚未公开，故以「基于本实验的注意事项」呈现。

export function ReproGuide() {
  return (
    <section className="repro-guide">
      <h2 className="repro-title">项目复现指南与避坑要点</h2>
      <p className="repro-sub">
        论文代码尚未公开，本节是基于本实验思路整理的<b>复现与扩展注意事项</b>，帮助你少踩坑。
      </p>

      <div className="repro-original">
        <b>论文原始设置（供参考）：</b> 12 个模型（4×7B、4×70B、4 个闭源），6 种提示变体 V0–V5；
        开放权重经 HuggingFace transformers 加载（do_sample=True，temperature 0.70–0.80，top-p
        0.90–0.95）；7B 各 500 次提议、70B/闭源各 100 次，各 5 批；对局用 3 个随机种子（1、2、3）；
        开放权重跑在单张 NVIDIA H100 上，闭源 API 版本固定。
      </div>

      <h3 className="repro-h3">6.1 环境搭建与智能体构建</h3>
      <ul className="repro-list">
        <li>
          <b>选择仿真平台：</b>推荐使用 PettingZoo 或 Gymnasium 的多智能体扩展来构建自定义环境。它们
          提供了清晰的接口和并行执行支持。
        </li>
        <li>
          <b>LLM 集成：</b>使用 LangChain 或 LlamaIndex 来构建智能体的记忆、工具调用和提示词管理模块。
          为每个智能体维护独立的对话历史。
        </li>
        <li>
          <b>RL 框架选择：</b>RLlib 或 Stable-Baselines3 支持多智能体训练。你需要自定义策略模型，将
          LLM 的输出作为策略网络的一部分输入。
        </li>
        <li>
          <b>秘密工具实现：</b>从最简单的「行动值低位嵌入信息」开始。确保你的环境可以访问到行动的
          完整精度数据，以便接收方解码。
        </li>
      </ul>

      <h3 className="repro-h3">6.2 常见问题与排查</h3>

      <div className="repro-problem">
        <div className="repro-q">问题 1：LLM 智能体行动不一致，波动剧烈。</div>
        <div className="repro-cause">原因：LLM 的生成具有随机性，直接输出数值不稳定。</div>
        <div className="repro-fix">
          解决：采用「LLM 生成策略描述 → 小型神经网络映射为动作」的两阶段法。对 LLM 的输出进行温度设置
          （较低的温度如 0.2）以减少随机性。
        </div>
      </div>

      <div className="repro-problem">
        <div className="repro-q">问题 2：共谋无法形成，智能体始终选择背叛。</div>
        <div className="repro-cause">原因：环境奖励设计可能过于短期化，或者智能体缺乏建立信任的机制。</div>
        <div className="repro-fix">
          解决：引入「信誉」作为附加状态。智能体可以观察对方的历史合作率。在提示词中强调长期关系和信誉的
          价值。也可以从简单的、共谋收益明显的环境（如囚徒困境的收益矩阵调整）开始实验。
        </div>
      </div>

      <div className="repro-problem">
        <div className="repro-q">问题 3：隐蔽信道误码率高，消息无法解码。</div>
        <div className="repro-cause">原因：模拟环境的时间精度不足，或编码方案对噪声太敏感。</div>
        <div className="repro-fix">
          解决：使用纠错编码（如汉明码）。或者放弃时间信道，采用更鲁棒的方法，如利用行动向量的多个维度，
          在量化后留出特定比特位用于编码。
        </div>
      </div>

      <div className="repro-problem">
        <div className="repro-q">问题 4：训练成本极高。</div>
        <div className="repro-cause">原因：每步都调用 LLM（如 GPT-4）费用和耗时无法承受。</div>
        <div className="repro-fix">
          解决：a) 使用小型开源 LLM（如 Llama 3 8B）进行微调，专门用于策略生成。b) 采用课程学习：先在
          简单环境中用 RL 训练一个基础策略，然后用 LLM 对这个策略进行「润色」和「解释」，再在复杂环境中
          微调。c) 将 LLM 作为「顾问」，只在关键决策点（如检测到共谋信号时）调用，平时使用轻量级策略网络。
        </div>
      </div>

      <h3 className="repro-h3">6.3 伦理与安全自查清单</h3>
      <p className="repro-check-intro">在运行任何实验前，请务必确认：</p>
      <ul className="repro-check">
        <li>实验完全在封闭的模拟环境中进行，无任何连接外部真实系统或网络的接口。</li>
        <li>所有「秘密工具」的代码实现均已添加了安全开关，可一键禁用。</li>
        <li>实验目的明确为研究、理解和增强多智能体系统安全性，并在项目文档中明确说明。</li>
        <li>已考虑实验结果的发布可能带来的潜在影响，并准备负责任的披露方式。</li>
      </ul>
    </section>
  );
}
