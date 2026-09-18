import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Comparison-tables widget: renders two stacked tables (OmniGameArena issues
// + IDC issues). Each row contrasts "传统方法（问题）" with "本文方案（解决）".
// Click a row to expand its "论文依据" citation (paper section / table / figure).
// Header cells are colored red (problem) and green (solution) for visual scan.

interface Row {
  problem: string;
  solution: string;
  citation: string; // paper section / table / figure reference
  tag?: string; // optional short label (e.g., "§1 / Table 1")
}
interface Table {
  title: string;
  subtitle: string;
  problemHeader: string;
  solutionHeader: string;
  rows: Row[];
}

const TABLES: Table[] = [
  {
    title: '🎮 OmniGameArena 解决的问题',
    subtitle: '🏟️ 平台层面的三项核心改进 · 点击行展开论文依据',
    problemHeader: '❌ 传统方法（问题）',
    solutionHeader: '✅ OmniGameArena（解决）',
    rows: [
      {
        problem: '单智能体单人模式',
        solution: '多模式多智能体：Solo / PvP / Coop 全覆盖（7+3+2=12 款）',
        citation:
          '论文 §1 引言明确指出"prior benchmarks typically feature a single agent in single-player mode"，因此本工作新建 12 款 UE5 游戏覆盖三种交互模式（Solo 7 / PvP 3 / Coop 2，详见 Table 1）。',
        tag: '§1 / Table 1',
      },
      {
        problem: '缺乏统一的评估协议，难以在同一标准下比较不同类型智能体',
        solution: '统一接口（键盘 / 鼠标 / 手柄 adapter）+ 科学合理的评估规则与协议',
        citation:
          '论文 §4 / Figure 1 设计了 keyboard / mouse / gamepad adapter，把不同智能体的输出归一到统一动作空间；§5.1 给出 PDQ（决策时间不计）与 LCRT（服务器推理延迟计入）两套评估协议。',
        tag: '§4 / Figure 1',
      },
      {
        problem: '预测试泄露（训练数据已见过现有游戏）',
        solution: '12 款游戏为基准实验专门设计 · 严格保密 · 公平公正',
        citation:
          '论文 §3.2 / Table 2 显示 OmniGameArena 0.0% recognition rate 与 50.0% mechanism leakage，显著低于 BALROG / LMGame-Bench / ORAK 三类基准。',
        tag: '§3.2 / Table 2',
      },
    ],
  },
  {
    title: '📈 IDC 解决的问题',
    subtitle: '🧪 评测方法层面的核心改进 · 点击行展开论文依据',
    problemHeader: '❌ 传统评估（问题）',
    solutionHeader: '✅ IDC（解决）',
    rows: [
      {
        problem: '单次得分"冷启动排行榜"',
        solution:
          '两项额外的可观测指标：① 得分随反思轮次的变化趋势（IDC 成长曲线）；② 所习得技能在变体任务上的表现（迁移 ΔS）',
        citation:
          '论文 §4.2 提出"Improvement Dynamics Curve (IDC)"框架：每 R 轮反思-改进循环记录 S_r，并在 §5.3.2 Table 5 报告了 4 个智能体 × 4 个 held-out 变体的迁移 ΔS。',
        tag: '§4.2 + §5.3 / Table 5',
      },
    ],
  },
];

export const ComparisonTables: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  // openRow key = `${tableIndex}-${rowIndex}`
  const [openRow, setOpenRow] = useState<string | null>(null);
  const toggleRow = (key: string) => {
    setOpenRow((cur) => (cur === key ? null : key));
  };
  return (
    <div className="ct-wrap">
      {TABLES.map((t, ti) => (
        <div className="ct-table" key={ti}>
          <div className="ct-head">
            <span className="ct-title">{t.title}</span>
            <span className="ct-subtitle">{t.subtitle}</span>
          </div>
          <table className="ct-grid">
            <thead>
              <tr>
                <th className="ct-th-problem">{t.problemHeader}</th>
                <th className="ct-th-arrow" aria-hidden="true">→</th>
                <th className="ct-th-solution">{t.solutionHeader}</th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r, ri) => {
                const key = `${ti}-${ri}`;
                const isOpen = openRow === key;
                return (
                  <React.Fragment key={key}>
                    <tr
                      className={`ct-row ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleRow(key)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isOpen}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleRow(key);
                        }
                      }}
                    >
                      <td className="ct-cell-problem">
                        <span className="ct-cell-text">{r.problem}</span>
                        <span className="ct-toggle" aria-hidden="true">
                          {isOpen ? '−' : '+'}
                        </span>
                      </td>
                      <td className="ct-cell-arrow" aria-hidden="true">→</td>
                      <td className="ct-cell-solution">
                        <span className="ct-cell-text">{r.solution}</span>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="ct-citation-row">
                        <td colSpan={3} className="ct-citation-cell">
                          <div className="ct-citation-inner">
                            <span className="ct-citation-tag">
                              📑 论文依据 · {r.tag}
                            </span>
                            <span className="ct-citation-text">{r.citation}</span>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};