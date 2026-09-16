import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Limitations + summary widget for chap-7

interface Limitation {
  emoji: string;
  title: string;
  problem: string;
  detail: string;
  paperRef: string;
}

const LIMITATIONS: Limitation[] = [
  {
    emoji: '🎯',
    title: 'IDC 仅覆盖 2 款游戏',
    problem: 'IDC 只在 LastStand (Solo) 与 SharedFloor (Coop) 上跑过，无法证明 IDC 对其他 10 款游戏同样有效。',
    detail: '论文 10 个反思轮 × 5 episode × 4 智能体的实验量已很重，但游戏覆盖仍有限——IDC 的"中段峰值"是否在其他游戏成立，尚待验证。',
    paperRef: 'Limitations §1',
  },
  {
    emoji: '🤖',
    title: '仅 4 款前沿 VLM',
    problem: '主实验仅覆盖 Claude Opus 4.6 / 4.7、GPT-5.5、Gemini 3.1 Pro——开源/小尺寸 VLM 未充分参与 IDC 循环。',
    detail: 'Qwen3.5-397B / 122B 只在冷启动中测试，未跑 IDC——它们的"反思能力"是否随模型缩小而退化，目前未知。',
    paperRef: 'Limitations §2',
  },
  {
    emoji: '📜',
    title: '单条 skill 设计',
    problem: 'IDC 的 m_r 是单条 prompt，不支持多 skill 组合 / 层次化 skill 库。',
    detail: '1200 token 的单条 prompt 容纳策略但装不下"分场景的多个 skill"——若未来需要更复杂的多步策略，单条结构可能成为瓶颈。',
    paperRef: 'Limitations §3',
  },
  {
    emoji: '🔗',
    title: 'player 与 reflector 共模型',
    problem: '论文让同一个 LLM 既当 player 又当 reflector，未对比"用更强模型当 reflector"的效果。',
    detail: '若 reflector 用 GPT-5.5 而 player 用 Opus 4.6，IDC 增益是否更大？这是被现有实验排除的问题。',
    paperRef: 'Limitations §4',
  },
  {
    emoji: '🖼️',
    title: '固定分辨率 / 视点',
    problem: '12 款 UE5 游戏都使用固定分辨率与固定相机视角。',
    detail: '未来开放世界 / 第一人称动态视点评测，IDC 是否仍适用——本文未给出证据。',
    paperRef: 'Limitations §5',
  },
  {
    emoji: '🧠',
    title: '能力维度未覆盖长程记忆',
    problem: '7 维度（VP / SN / RT / MEM / PLN / ADV / COOP）中没有显式"跨多局记忆 / 经验迁移"。',
    detail: 'IDC 的核心就是"跨多轮记忆"，但游戏层面的能力评分并未把它单列——评测的"能力维度"和 IDC 的"方法目标"存在错位。',
    paperRef: 'Limitations §6',
  },
];

export const Limitations: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="lim-root">
      <div className="lim-intro">
        <div className="lim-intro-icon">⚠️</div>
        <div>
          <div className="lim-intro-title">诚实的自我审视</div>
          <div className="lim-intro-desc">
            OmniGameArena + IDC 是一个有意义的早期工作，但作者在论文 Limitations 部分明确承认六类尚未解决的问题——下面点击任一项展开论文原文摘要与作者建议。
          </div>
        </div>
      </div>

      <div className="lim-grid">
        {LIMITATIONS.map((l, i) => {
          const isOpen = expanded === i;
          return (
            <div key={l.title} className={`lim-card ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="lim-card-head"
                onClick={() => setExpanded(isOpen ? null : i)}
              >
                <div className="lim-card-emoji">{l.emoji}</div>
                <div className="lim-card-title">{l.title}</div>
                <div className="lim-card-arrow">{isOpen ? '−' : '+'}</div>
              </button>
              {isOpen && (
                <div className="lim-card-body">
                  <div className="lim-card-problem">
                    <span className="lim-tag tag-prob">问题</span>
                    {l.problem}
                  </div>
                  <div className="lim-card-detail">
                    <span className="lim-tag tag-detail">论文观点</span>
                    {l.detail}
                  </div>
                  <div className="lim-card-ref">📑 论文 {l.paperRef}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="lim-summary">
        <div className="lim-summary-head">
          <div className="lim-summary-icon">🎁</div>
          <div className="lim-summary-title">小结：贡献与未竟之业</div>
        </div>
        <div className="lim-summary-grid">
          <div className="lim-summary-block lim-summary-contrib">
            <div className="lim-summary-block-title">✓ 两件套核心贡献</div>
            <ul>
              <li><strong>OmniGameArena</strong>：12 款 UE5 游戏 + 9 智能体 + 7 能力维度 + 0.0% 污染率 = 干净评测场</li>
              <li><strong>IDC</strong>：4 阶段反思 + 6 工具面 + α=0.5 回滚 = 可观测的"成长曲线"</li>
            </ul>
          </div>
          <div className="lim-summary-block lim-summary-todo">
            <div className="lim-summary-block-title">→ 未来工作</div>
            <ul>
              <li>把 IDC 扩展到全部 12 款游戏（而非仅 2 款）</li>
              <li>引入"player / reflector 分模型"消融</li>
              <li>探索多 skill 库 / 层次化 skill</li>
              <li>开放世界与动态视点的评测适配</li>
            </ul>
          </div>
        </div>
        <div className="lim-summary-quote">
          「一个诚实的 Limitations 列表，是这篇论文对自己最负责的部分。」
        </div>
      </div>
    </div>
  );
};