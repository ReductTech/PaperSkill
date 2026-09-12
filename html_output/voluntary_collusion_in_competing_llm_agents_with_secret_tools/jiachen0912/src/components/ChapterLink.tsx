import React from 'react';

// 章末硬核要点（提升知识密度）。「下一问」已移至 ChapterTransition 过渡带。

interface LinkData {
  facts: string[];
}

const LINKS: Record<string, LinkData> = {
  'chap-1': {
    facts: ['12 个模型 · 6 种提示 · 2 件工具 · 2 个环境', '7B 模型接受率 100%（500/500 提议）', '核心悖论：认账之后仍行动'],
  },
  'chap-2': {
    facts: ['Liar’s Bar＝不完全信息 + 验证不对称', 'Cleanup＝公地/社会困境', '4 名玩家、固定牌堆 / 网格'],
  },
  'chap-3': {
    facts: ['Claude 87.5% vs GPT-4.1 90% 都标注「不公平」', '40 条推理轨迹，决策完全相反', '结论：差距在「权衡」，不在「识别」'],
  },
  'chap-4': {
    facts: ['弱合谋＝C∩V=∅，且合谋者效用↑、受害者效用↓', '论文不主张强合谋（不假设纳什）', 'Mike/Luke 效用 10.33 → 31.80'],
  },
  'chap-5': {
    facts: ['秘密通信通道＝私聊', '秘密策略提示＝独占最优策略', '需「接受 + 提名同伙 + 互惠回应」才算合谋'],
  },
  'chap-6': {
    facts: ['决策链：接受/拒绝 → 选定同伙 → 邀请 → 对方回应', '7B 接受并回应所有邀请（100%）', 'LLaMA 模型互相优先选择（100%）'],
  },
  'chap-7': {
    facts: ['Cleanup 只给采苹果 +1，奖励稀疏', 'V̂ = w₁φ_imm + w₂φ_env + w₃φ_str', '合谋靠抬高 φ_str、压低对手 φ_imm 起作用'],
  },
  'chap-8': {
    facts: ['12 模型 × 6 提示 × 2 工具 × 2 环境', '7B 各 500 次提议、70B/闭源各 100 次，各 5 批', '度量：接受率 / 伙伴选择 / 对局行为 / 公平性 E'],
  },
  'chap-9': {
    facts: ['V1 中性措辞让 Claude 从 0% → 100%', '良性工具对照排除「默认服从」', 'V4/V5 加伦理对已有警示无新增效果'],
  },
  'chap-10': {
    facts: ['挑战率 0.976 → 0.307（通信）', '非挑战协定占密信 73.7%', '公平性 E：0.74 / 0.70 / 0.60'],
  },
};

export function ChapterLink({ chapterId }: { chapterId: string }) {
  const d = LINKS[chapterId];
  if (!d) return null;
  return (
    <div className="chapter-link">
      <div className="cl-facts">
        <div className="cl-label">📌 硬核要点</div>
        <ul>
          {d.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
