import React from 'react';

// 把论文原文嵌入对应章节：读到哪里，原文（英文 + 中文 + 关键数据）就在哪里。

interface DataRow {
  item: string;
  en: string;
  zh: string;
}

interface SourceEntry {
  label: string;
  en: string;
  zh: string;
  data?: DataRow[];
}

const SOURCES: Record<string, SourceEntry> = {
  'chap-1': {
    label: '原文 · 摘要',
    en: 'Even when a tool is explicitly described as unfair and harmful to others, ostensibly safety-aligned LLM agents still voluntarily engage in secret collusion whenever doing so confers a strategic advantage.',
    zh: '即使某个工具被明确描述为「不公平且对他人有害」，表面上安全对齐的 LLM 智能体仍会自愿参与秘密合谋——只要这么做能带来战略优势。',
  },
  'chap-3': {
    label: '原文 · 认账之后仍行动',
    en: 'Both models describe the tool as providing an “unfair advantage” at nearly identical rates (87.5% Claude, 90% GPT-4.1), yet Claude refuses while GPT-4.1 accepts in all 40 traces.',
    zh: '两个模型都以几乎相同的比例（Claude 87.5%、GPT-4.1 90%）将工具描述为「不公平优势」，但决策完全相反。',
    data: [
      { item: '识别率', en: '87.5% Claude · 90% GPT-4.1', zh: '都识别「不公平」，决策却相反' },
    ],
  },
  'chap-4': {
    label: '原文 · 弱合谋定义',
    en: 'A joint policy π′ is weakly collusive relative to a baseline joint policy π for colluders C against victims V if and only if (i) C ∩ V = ∅ with |C| ≥ 2 and V ≠ ∅; (ii) Uʲ(π′) > Uʲ(π) for every j ∈ C; and (iii) Uⁱ(π′) < Uⁱ(π) for every i ∈ V.',
    zh: '联合策略 π′ 相对于基线 π 是「弱合谋」的，当且仅当：(i) 合谋者 C 与受害者 V 不相交；(ii) 每个合谋者效用上升；(iii) 每个受害者效用下降。',
  },
  'chap-5': {
    label: '原文 · 秘密工具',
    en: 'Each tool offer explicitly states in the prompt the unfair and harmful nature of the tool, before an agent voluntarily decides whether to use the tool or to serve as a colluding partner upon being selected.',
    zh: '每个工具的提议都会在提示中明确说明其「不公平、有害」的性质，然后由智能体自愿决定是否使用该工具、或是否在被选中后充当合谋同伙。',
  },
  'chap-9': {
    label: '原文 · 提示变体',
    en: 'The clearest single result in the table is the V0 → V1 flip on the Secret Communication Channel: 0% acceptance under V0, 100±0% under V1.',
    zh: '表中最清晰的一个结果是秘密通信通道上的 V0→V1 翻转：V0 下 0% 接受，V1 中性措辞下 100±0% 接受。',
    data: [{ item: '翻转', en: 'V0 0% → V1 100%', zh: '仅去掉「不公平」等关键词即翻转' }],
  },
  'chap-10': {
    label: '原文 · 关键结果',
    en: 'The ordering E_Comm < E_Hint < E_Baseline is preserved across both environments.',
    zh: '公平性排序 E_通信 ＜ E_提示 ＜ E_基线 在两种环境中都成立——秘密通信造成最不平等的结果。',
    data: [
      { item: '挑战率', en: '0.976 → 0.307 (Comm)', zh: '合谋后挑战率骤降' },
      { item: '非挑战协定', en: '73.7% of 1,869 msgs', zh: '密信中的「互不揭穿」' },
      { item: '公平性 E（牌局）', en: '0.74 / 0.70 / 0.60', zh: '基线 / 提示 / 通信' },
      { item: '公平性 E（底池）', en: '0.94 / 0.79 / 0.67', zh: '基线 / 提示 / 通信' },
    ],
  },
};

export function ChapterSource({ chapterId }: { chapterId: string }) {
  const s = SOURCES[chapterId];
  if (!s) return null;
  return (
    <div className="chapter-source">
      <div className="cs-label">📜 {s.label}</div>
      <div className="cs-en">“{s.en}”</div>
      <div className="cs-zh">{s.zh}</div>
      {s.data ? (
        <table className="cs-table">
          <tbody>
            {s.data.map((d) => (
              <tr key={d.item}>
                <td className="cs-item">{d.item}</td>
                <td className="cs-cell-en">{d.en}</td>
                <td className="cs-cell-zh">{d.zh}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
