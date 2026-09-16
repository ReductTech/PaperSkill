import React from 'react';
import type { WidgetProps } from './registry';

// Contamination-analysis widget for chap-3 (创新点二).
// Renders three avoidance-strategy cards, two experiment-test cards,
// a beautified Table 2 with built-in bar visualisation, and a summary block.

interface Strategy {
  icon: string;
  title: string;
  body: string;
}

const STRATEGIES: Strategy[] = [
  {
    icon: '🔍',
    title: '① Web 曝光审计（pre-release）',
    body: '在论文公开发布前，用爬虫检索游戏名、任务短语、规则描述、计分事件等关键字符串，若发现已在互联网流传，立即从基准中剔除该元素。',
  },
  {
    icon: '🛠️',
    title: '② UE5 全新搭建（construction）',
    body: '不依赖任何已发布的商业游戏或开源引擎复刻；12 款游戏全部用 UE5 从关卡脚本到 UI 重新实现，从源头切断"训练集见过"的可能。',
  },
  {
    icon: '🧩',
    title: '③ 组合级独特性（combination）',
    body: '视觉资源是 UE5 市场素材的"定制组合"；关卡几何、脚本执行顺序、胜负判据全部为本基准独家设计——单一资产可能出现过，但组合从未出现。',
  },
];

interface Test {
  icon: string;
  title: string;
  body: string;
}

const TESTS: Test[] = [
  {
    icon: '🖼️',
    title: 'Test A — 视觉新颖度 (Visual Novelty)',
    body: '把基准游戏的代表性截图喂给代表性多模态模型（如 Gemini），询问它能否直接说出游戏名字。若模型"一眼认出" → 视觉新颖度不足。',
  },
  {
    icon: '📜',
    title: 'Test B — 规则泄漏 (Mechanics Leakage)',
    body: '同样仅凭视觉输入，要求模型描述游戏的底层玩法机制（计分规则、胜负条件、关键事件）。若能描述清楚 → 规则已泄漏到预训练数据。',
  },
];

interface Bench {
  name: string;
  games: number;
  recognition: number; // %
  mechanics: number;   // %
  note: string;
  highlight?: boolean;
}

const BENCHMARKS: Bench[] = [
  { name: 'BALROG',         games: 6,  recognition: 66.7, mechanics: 100.0, note: '基于经典 RL 游戏的 VLM 评测' },
  { name: 'LMGame-Bench',   games: 6,  recognition: 100.0, mechanics: 100.0, note: '模块化多游戏通用框架' },
  { name: 'ORAK',           games: 12, recognition: 100.0, mechanics: 100.0, note: 'MCP 接口 12 款游戏' },
  { name: 'OmniGameArena',  games: 12, recognition: 0.0,  mechanics: 50.0,  note: '本文 · UE5 全新搭建 12 款', highlight: true },
];

export const ContaminationAnalysis: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  return (
    <div className="ca-wrap">
      {/* ---- 1. Avoidance strategies ---- */}
      <section className="ca-section">
        <header className="ca-section-head">
          <span className="ca-section-num">1</span>
          <div>
            <div className="ca-section-title">🛡️ 规避策略（pre-release 设计阶段）</div>
            <div className="ca-section-sub">论文 §3.2 · 三层防御，从源头到组合全链路降低污染风险</div>
          </div>
        </header>
        <div className="ca-strat-grid">
          {STRATEGIES.map((s) => (
            <div className="ca-strat-card" key={s.title}>
              <div className="ca-strat-icon">{s.icon}</div>
              <div className="ca-strat-title">{s.title}</div>
              <div className="ca-strat-body">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- 2. Experiment design ---- */}
      <section className="ca-section">
        <header className="ca-section-head">
          <span className="ca-section-num">2</span>
          <div>
            <div className="ca-section-title">🧪 实证实验（contamination analysis）</div>
            <div className="ca-section-sub">论文 §3.2 · 仅用视觉输入，对代表性 VLM 提问两项指标</div>
          </div>
        </header>
        <div className="ca-test-grid">
          {TESTS.map((t) => (
            <div className="ca-test-card" key={t.title}>
              <div className="ca-test-icon">{t.icon}</div>
              <div>
                <div className="ca-test-title">{t.title}</div>
                <div className="ca-test-body">{t.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- 3. Table 2 ---- */}
      <section className="ca-section">
        <header className="ca-section-head">
          <span className="ca-section-num">3</span>
          <div>
            <div className="ca-section-title">📊 Table 2 · 污染分析结果</div>
            <div className="ca-section-sub">四类基准在两个测试上的得分（百分比越低越干净）</div>
          </div>
        </header>

        <div className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th className="ca-th-name">基准 Benchmark</th>
                <th className="ca-th-num">游戏数 (#)</th>
                <th className="ca-th-bar">
                  <div>视觉识别率</div>
                  <div className="ca-th-en">Recognition (%)</div>
                </th>
                <th className="ca-th-bar">
                  <div>机制泄漏率</div>
                  <div className="ca-th-en">Mechanics (%)</div>
                </th>
                <th className="ca-th-note">说明</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARKS.map((b) => (
                <tr
                  key={b.name}
                  className={b.highlight ? 'highlight' : ''}
                >
                  <td className="ca-td-name">
                    <span className="ca-td-name-text">{b.name}</span>
                    {b.highlight ? <span className="ca-ours-tag">本文</span> : null}
                  </td>
                  <td className="ca-td-num">{b.games}</td>
                  <td className="ca-td-bar">
                    <div className="ca-bar-wrap">
                      <div
                        className={`ca-bar ${b.highlight ? 'ca-bar-good' : 'ca-bar-bad'}`}
                        style={{ width: `${b.recognition}%` }}
                      />
                      <span className="ca-bar-text">{b.recognition.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="ca-td-bar">
                    <div className="ca-bar-wrap">
                      <div
                        className={`ca-bar ${b.highlight ? 'ca-bar-mid' : 'ca-bar-bad'}`}
                        style={{ width: `${b.mechanics}%` }}
                      />
                      <span className="ca-bar-text">{b.mechanics.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="ca-td-note">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ca-legend">
          <span className="ca-legend-item">
            <span className="ca-legend-dot ca-bar-good" />干净（低风险）
          </span>
          <span className="ca-legend-item">
            <span className="ca-legend-dot ca-bar-mid" />部分泄漏
          </span>
          <span className="ca-legend-item">
            <span className="ca-legend-dot ca-bar-bad" />完全污染
          </span>
        </div>
      </section>

      {/* ---- 4. Conclusion ---- */}
      <section className="ca-section ca-section-conclusion">
        <header className="ca-section-head">
          <span className="ca-section-num ca-section-num-end">✓</span>
          <div>
            <div className="ca-section-title">结论 · 规避策略有效</div>
            <div className="ca-section-sub">为什么 0.0% / 50.0% 比"全部 100%"更可信</div>
          </div>
        </header>
        <ul className="ca-conclusion-list">
          <li>
            <span className="ca-bullet">①</span>
            既有三个基准在 Test B 上都达到 100%——模型凭视觉就能写出完整玩法，说明这些游戏的玩法机制已经"被预训练记住"，评测分数无法反映真实能力。
          </li>
          <li>
            <span className="ca-bullet">②</span>
            OmniGameArena 在 Test A 上做到 0.0%，意味着 12 款游戏的视觉外观对代表性 VLM 完全陌生——视觉新颖度满足设计目标。
          </li>
          <li>
            <span className="ca-bullet">③</span>
            Test B 的 50.0% 不是失败，而是真实反映"部分机制可被推测"——若声称 0% 反而不自然；论文以 50% 作为合理边界，体现"避免完美数据的同时承认可推测的合理上限"。
          </li>
          <li>
            <span className="ca-bullet">④</span>
            该分析是把"基准是否被污染"从直觉判断变为可测量的实证指标，是 OmniGameArena 第二个核心创新的可证伪验证。
          </li>
        </ul>
      </section>
    </div>
  );
};