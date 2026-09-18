import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Fairness-design widget for chap-4: "如何保证评估公正性？"
// Renders two panels: agent coverage + protocol design.

interface Agent {
  name: string;
  vendor: string;
  label: string;          // badge e.g. "商用 / 开源 / 专用"
  category: 'commercial' | 'opensource' | 'specialized';
  emoji: string;
  note: string;
  paperRole: string;       // what it represents in the paper
}

const AGENTS: Agent[] = [
  // ---- 商用闭源多模态大模型 ----
  {
    name: 'GPT-5.5',
    vendor: 'OpenAI',
    label: '商用',
    category: 'commercial',
    emoji: '🤖',
    note: '闭源 · 商用旗舰多模态大模型',
    paperRole: '商用 SOTA，代表 2026 年商用闭源能力上限',
  },
  {
    name: 'Claude Opus 4.6',
    vendor: 'Anthropic',
    label: '商用',
    category: 'commercial',
    emoji: '🧠',
    note: '闭源 · 商用旗舰多模态大模型',
    paperRole: '商用 SOTA，作为主要对照智能体',
  },
  {
    name: 'Claude Opus 4.7',
    vendor: 'Anthropic',
    label: '商用',
    category: 'commercial',
    emoji: '🧠',
    note: '闭源 · 商用旗舰多模态大模型（更新版）',
    paperRole: '与 4.6 对照，看"模型升级 vs IDC 改进"的边际',
  },
  {
    name: 'Gemini 3.1 Pro',
    vendor: 'Google',
    label: '商用',
    category: 'commercial',
    emoji: '✨',
    note: '闭源 · 商用旗舰多模态大模型',
    paperRole: '商用 SOTA，验证多供应商结论一致性',
  },

  // ---- 开源权重多模态大模型 ----
  {
    name: 'Qwen3.5-397B-A17B',
    vendor: '阿里',
    label: '开源',
    category: 'opensource',
    emoji: '🐉',
    note: '开源 · MoE 397B 总参 / 17B 激活',
    paperRole: '开源 SOTA 上限，验证 IDC 在开源旗舰同样有效',
  },
  {
    name: 'Qwen3.5-122B-A10B',
    vendor: '阿里',
    label: '开源',
    category: 'opensource',
    emoji: '🐉',
    note: '开源 · MoE 122B 总参 / 10B 激活',
    paperRole: '开源中段型号，看 IDC 对模型规模是否鲁棒',
  },

  // ---- 专用游戏策略 / 传统 baseline ----
  {
    name: 'PPO + R2I',
    vendor: 'RL baseline',
    label: '专用',
    category: 'specialized',
    emoji: '🎮',
    note: '专用 · 经典 RL 智能体（PPO 训练 + R2I 特征）',
    paperRole: '专用 RL 基线，对照"经典 RL 在通用任务上的天花板"',
  },
  {
    name: 'Random',
    vendor: 'baseline',
    label: '专用',
    category: 'specialized',
    emoji: '🎲',
    note: '专用 · 随机动作基线',
    paperRole: '随机基线，作为分数地板',
  },
  {
    name: 'Human',
    vendor: '人类玩家',
    label: '专用',
    category: 'specialized',
    emoji: '🧑‍💻',
    note: '专用 · 人类玩家（论文招募 20 名有 UE 经验的志愿者）',
    paperRole: '人类天花板，量化"人 - VLM"的真实差距',
  },
];

const CATEGORY_META = {
  commercial: { label: '商用闭源多模态大模型', color: 'var(--blue)', emoji: '🤖', desc: '代表能力上限 · 不可微调 · 黑盒 API 调用' },
  opensource:{ label: '开源权重多模态大模型', color: 'var(--orange)', emoji: '🐉', desc: '代表开源 SOTA · 可访问参数 · 可复现' },
  specialized:{label: '专用游戏策略 / 基线',     color: '#1f7a4a',   emoji: '🎮', desc: '代表 RL/随机/人类 · 提供分数地板与天花板' },
};

interface Protocol {
  name: string;
  fullName: string;
  emoji: string;
  decision: string;
  inference: string;
  pro: string;
  con: string;
  useWhen: string;
}

const PROTOCOLS: Protocol[] = [
  {
    name: 'PDQ',
    fullName: 'Paused Decision Quality',
    emoji: '⏸️',
    decision: '冻结环境，决策时间不计入成本',
    inference: '不计入延迟',
    pro: '隔离纯决策质量（去掉"快慢"的混淆）',
    con: '低估真实部署成本（速度也是能力一部分）',
    useWhen: '关注"应该做什么"——决策质量',
  },
  {
    name: 'LCRT',
    fullName: 'Latency-Controlled Real-Time',
    emoji: '⏱️',
    decision: '环境按真实时间步进',
    inference: '按服务器上报推理时间等待',
    pro: '真实部署视角，速度慢的模型会被自然惩罚',
    con: '混入了基础设施噪声（不同 API 的延迟差异）',
    useWhen: '关注"能不能跑起来"——真实时延',
  },
];

export const FairnessDesign: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [activeCategory, setActiveCategory] = useState<'commercial' | 'opensource' | 'specialized'>('commercial');

  const counts = {
    commercial: AGENTS.filter((a) => a.category === 'commercial').length,
    opensource: AGENTS.filter((a) => a.category === 'opensource').length,
    specialized: AGENTS.filter((a) => a.category === 'specialized').length,
  };

  return (
    <div className="fd-wrap">

      {/* ============= ① Agent coverage ============= */}
      <section className="fd-section">
        <header className="fd-section-head">
          <span className="fd-section-num">1</span>
          <div>
            <div className="fd-section-title">🤖 ① 实验智能体类型全面</div>
            <div className="fd-section-sub">12 款游戏 × 9 类智能体（4 商用 + 2 开源 + 3 专用基线）</div>
          </div>
        </header>

        {/* category pills */}
        <div className="fd-cat-tabs">
          {(['commercial', 'opensource', 'specialized'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`fd-cat-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              style={
                activeCategory === cat
                  ? { borderColor: CATEGORY_META[cat].color, color: CATEGORY_META[cat].color, background: '#fff' }
                  : undefined
              }
            >
              <span className="fd-cat-tab-emoji">{CATEGORY_META[cat].emoji}</span>
              <span className="fd-cat-tab-label">{CATEGORY_META[cat].label}</span>
              <span className="fd-cat-tab-count">{counts[cat]}</span>
            </button>
          ))}
        </div>

        <div className="fd-cat-desc" style={{ borderLeftColor: CATEGORY_META[activeCategory].color }}>
          {CATEGORY_META[activeCategory].desc}
        </div>

        <div className="fd-agent-grid">
          {AGENTS.filter((a) => a.category === activeCategory).map((a) => (
            <div className="fd-agent-card" key={a.name} style={{ borderTopColor: CATEGORY_META[a.category].color }}>
              <div className="fd-agent-card-head">
                <span className="fd-agent-emoji">{a.emoji}</span>
                <span className="fd-agent-label" style={{ background: CATEGORY_META[a.category].color }}>{a.label}</span>
              </div>
              <div className="fd-agent-name">{a.name}</div>
              <div className="fd-agent-vendor">{a.vendor}</div>
              <div className="fd-agent-note">{a.note}</div>
              <div className="fd-agent-role">
                <span className="fd-agent-role-tag">论文角色</span>
                <span>{a.paperRole}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============= ② Protocol & rules ============= */}
      <section className="fd-section">
        <header className="fd-section-head">
          <span className="fd-section-num">2</span>
          <div>
            <div className="fd-section-title">📐 ② 评估协议与规则制定</div>
            <div className="fd-section-sub">同一套动作接口，两种时间视角，避免"快/慢"混淆</div>
          </div>
        </header>

        <div className="fd-proto-grid">
          {PROTOCOLS.map((p) => (
            <div className="fd-proto-card" key={p.name}>
              <div className="fd-proto-head">
                <span className="fd-proto-emoji">{p.emoji}</span>
                <div>
                  <div className="fd-proto-name">{p.name}</div>
                  <div className="fd-proto-full">{p.fullName}</div>
                </div>
              </div>

              <div className="fd-proto-row">
                <span className="fd-proto-key">决策时间</span>
                <span className="fd-proto-val">{p.decision}</span>
              </div>
              <div className="fd-proto-row">
                <span className="fd-proto-key">推理延迟</span>
                <span className="fd-proto-val">{p.inference}</span>
              </div>

              <div className="fd-proto-procon">
                <div className="fd-proto-pro">
                  <span className="fd-proto-icon">✓</span>
                  <span>{p.pro}</span>
                </div>
                <div className="fd-proto-con">
                  <span className="fd-proto-icon">⚠</span>
                  <span>{p.con}</span>
                </div>
              </div>

              <div className="fd-proto-when">
                <span className="fd-proto-key">适用场景</span>
                <span className="fd-proto-val">{p.useWhen}</span>
              </div>
            </div>
          ))}
        </div>

        {/* key concept callout */}
        <div className="fd-callout">
          <span className="fd-callout-icon">💡</span>
          <div>
            <div className="fd-callout-title">关键概念 · 评估的"两个轴"</div>
            <ul>
              <li>
                <b>接口轴</b>：键盘 / 鼠标 / 手柄统一 adapter，保证不同 VLM 输出的动作在同一空间对齐。
              </li>
              <li>
                <b>时间轴</b>：PDQ 测"应该做什么"、LCRT 测"能不能跑起来"——两条曲线分别给出，互为补充。
              </li>
              <li>
                <b>规则轴</b>：每款游戏单独定义 success metric（如 LastStand 的 t_survive / T_max、ObstacleRun 的位移比例），不混用单一分数。
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};