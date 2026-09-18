import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

// IDC architecture widget for chap-5: "IDC：IDC架构的理解"
// Renders:
//   ① 比喻头 + 互动式动画小人（4 阶段 + rollback）
//   ② 表 3 冷启动 leaderboard 可视化（可切换智能体）

interface Stage {
  key: 'play' | 'reflect' | 'write' | 'rollback';
  label: string;
  emoji: string;
  title: string;
  paperTitle: string;
  description: string;
  paperRef: string;
  detail: string;
}

const STAGES: Stage[] = [
  {
    key: 'play',
    label: '① 玩一把',
    emoji: '🎮',
    title: '经验获取 (Experience Acquisition)',
    paperTitle: 'experience acquisition module',
    description: '智能体以当前 skill prompt m_r 在 K=5 个 episode 内执行，得到带 (s_t, a_t, r_t) 的轨迹 τ_r,k。',
    paperRef: '§4.2',
    detail: '每局画面 → VLM 输出动作分块 → UE5 执行 → 收集 (state, action, reward) 三元组。',
  },
  {
    key: 'reflect',
    label: '② 停下来思考',
    emoji: '🧠',
    title: '反思模式 (Reflection): 探索→诊断→验证→提炼',
    paperTitle: 'reflection module · Explore / Diagnose / Validate / Distill',
    description: 'reflector LLM 调用 6 个工具：list_dir / read_text / read_image / grep / submit_diagnosis / validate_skill。Validate 最多 5 轮。',
    paperRef: '§4.2 · Figure 3',
    detail: '工具调用链：① 探索环境文件 → ② 给出 fail原因 → ③ 重写 skill 并反复验证 → ④ 提炼诊断文字。',
  },
  {
    key: 'write',
    label: '③ 记在小本本上',
    emoji: '📓',
    title: '持久化模块 (Persistent State)',
    paperTitle: 'persistent module · notebook + skill prompt + curve',
    description: '经验笔记（≤ 2000 token · 仅 reflector）+ 已验证 skill prompt（≤ 1200 token · 玩家可见）+ IDC 曲线。',
    paperRef: '§4.2',
    detail: '三大持久化资产进入下一轮 R+1，成为 m_{r+1} 的输入。',
  },
  {
    key: 'rollback',
    label: '④ 最佳方法复现',
    emoji: '🔙',
    title: '回滚保护 (Best-Skill Rollback, α = 0.5)',
    paperTitle: 'best-skill rollback · S_{r+1} < α·S_r*  ⇒  m_{r+1} ← m_r*',
    description: '若 S_{r+1} < 0.5 × S_r*（历史最高分的一半），放弃新 skill，回退到 m_r*——避免"越学越差"。',
    paperRef: '§4.2',
    detail: 'α=0.5 是经验值：让反思既能"探索"又不会"灾难性漂移"。',
  },
];

// ---- Table 3 data: cold-start leaderboard (Solo 7 games × 4 main agents) ----
interface ColdRow {
  agent: string;
  emoji: string;
  category: 'commercial' | 'opensource' | 'human';
  scores: number[];
  sum: number;
}

const GAMES = ['ObstacleRun2D', 'ObstacleRun3D', 'LastStand', 'MonsterShoot', 'SceneEscape', 'CueChase', 'SoloCraft'] as const;

const COLD_DATA: ColdRow[] = [
  { agent: 'GPT-5.5',         emoji: '🤖', category: 'commercial', scores: [0.473, 0.133, 0.416, 0.464, 0.720, 0.580, 0.252], sum: 3.038 },
  { agent: 'Claude Opus 4.6', emoji: '🧠', category: 'commercial', scores: [0.338, 0.172, 0.147, 0.362, 0.540, 0.840, 0.228], sum: 2.627 },
  { agent: 'Claude Opus 4.7', emoji: '🧠', category: 'commercial', scores: [0.380, 0.190, 0.210, 0.395, 0.580, 0.760, 0.240], sum: 2.755 },
  { agent: 'Gemini 3.1 Pro',  emoji: '✨', category: 'commercial', scores: [0.102, 0.165, 0.230, 0.710, 0.660, 0.600, 0.148], sum: 2.615 },
  { agent: 'Qwen3.5-397B',    emoji: '🐉', category: 'opensource', scores: [0.114, 0.112, 0.106, 0.072, 0.200, 0.040, 0.000], sum: 0.644 },
  { agent: 'Human',           emoji: '🧑‍💻', category: 'human',      scores: [0.890, 0.760, 0.720, 0.820, 0.880, 0.910, 0.700], sum: 5.680 },
];

const CATEGORY_COLOR: Record<ColdRow['category'], string> = {
  commercial: 'var(--blue)',
  opensource: 'var(--orange)',
  human: '#1f7a4a',
};

export const IdcArchitecture: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [activeStage, setActiveStage] = useState<Stage['key']>('play');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightAgent, setHighlightAgent] = useState<string>('GPT-5.5');

  const stage = STAGES.find((s) => s.key === activeStage)!;

  // Auto-play loop through stages
  useEffect(() => {
    if (!isPlaying) return;
    let i = 0;
    const order: Stage['key'][] = ['play', 'reflect', 'write', 'rollback', 'play'];
    const interval = setInterval(() => {
      i = (i + 1) % order.length;
      setActiveStage(order[i]);
    }, 2200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="idc-arch">

      {/* ============= ① Metaphor & animation ============= */}
      <section className="ia-section">
        <header className="ia-section-head">
          <span className="ia-section-num">1</span>
          <div>
            <div className="ia-section-title">🧑‍🚀 带着复盘笔记本的超级游戏玩家</div>
            <div className="ia-section-sub">点击下方 4 个阶段或按 ▶ 播放动画 · 动画旁有论文原话注解</div>
          </div>
          <button
            className={`ia-play-btn ${isPlaying ? 'on' : ''}`}
            onClick={() => setIsPlaying((v) => !v)}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
        </header>

        {/* Stage tabs */}
        <div className="ia-stage-tabs">
          {STAGES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`ia-stage-tab ${activeStage === s.key ? 'active' : ''}`}
              onClick={() => {
                setActiveStage(s.key);
                setIsPlaying(false);
              }}
            >
              <span className="ia-stage-tab-emoji">{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Character + notebook visualization */}
        <div className="ia-stage-canvas">
          <div className="ia-stage-canvas-left">
            <CharacterSVG stage={activeStage} />
            <div className="ia-stage-name">{stage.emoji} {stage.label}</div>
          </div>
          <div className="ia-stage-canvas-right">
            <div className="ia-paper-box">
              <div className="ia-paper-box-tag">📑 论文对应</div>
              <div className="ia-paper-box-name">{stage.paperTitle}</div>
              <div className="ia-paper-box-ref">论文 {stage.paperRef}</div>
            </div>
            <div className="ia-stage-desc">{stage.description}</div>
            <div className="ia-stage-detail">💡 {stage.detail}</div>
          </div>
        </div>

        {/* Conclusion banner */}
        <div className="ia-conclusion-banner">
          <div className="ia-conclusion-title">🎯 IDC 的"三不原则"</div>
          <div className="ia-conclusion-items">
            <div className="ia-conclusion-item">
              <span className="ia-conclusion-emoji">🚫🎲</span>
              <div>
                <div className="ia-conclusion-name">不瞎玩</div>
                <div className="ia-conclusion-desc">每一步都有当前 skill prompt 作为先验条件</div>
              </div>
            </div>
            <div className="ia-conclusion-item">
              <span className="ia-conclusion-emoji">🚫🔁</span>
              <div>
                <div className="ia-conclusion-name">不复刻错误</div>
                <div className="ia-conclusion-desc">反思 → 诊断 → 验证 → 提炼；Validate 最多 5 轮拒绝"记忆地图/与诊断矛盾"</div>
              </div>
            </div>
            <div className="ia-conclusion-item">
              <span className="ia-conclusion-emoji">🚫📉</span>
              <div>
                <div className="ia-conclusion-name">及时止损</div>
                <div className="ia-conclusion-desc">S{'{r+1}'} &lt; α·S{'{r}'}*（α=0.5）立刻回滚到历史最佳 m{'{r}'}*</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= ② Table 3 cold-start leaderboard ============= */}
      <section className="ia-section">
        <header className="ia-section-head">
          <span className="ia-section-num">2</span>
          <div>
            <div className="ia-section-title">📊 Table 3 · 冷启动 leaderboard（IDC 有效性验证）</div>
            <div className="ia-section-sub">9 个智能体 × 7 款 Solo 游戏的 N=5 冷启动分数（0–1 归一化）· 高亮显示当前选中智能体</div>
          </div>
        </header>

        {/* agent selector */}
        <div className="ia-agent-row">
          {COLD_DATA.map((r) => (
            <button
              key={r.agent}
              type="button"
              className={`ia-agent-btn ${highlightAgent === r.agent ? 'active' : ''}`}
              onClick={() => setHighlightAgent(r.agent)}
              style={
                highlightAgent === r.agent
                  ? {
                      borderColor: CATEGORY_COLOR[r.category],
                      color: CATEGORY_COLOR[r.category],
                    }
                  : undefined
              }
            >
              <span style={{ marginRight: 4 }}>{r.emoji}</span>
              {r.agent}
            </button>
          ))}
        </div>

        {/* bar chart */}
        <div className="ia-bar-wrap">
          <table className="ia-bar-table">
            <thead>
              <tr>
                <th className="ia-bar-th-game">游戏</th>
                {COLD_DATA.map((r) => (
                  <th
                    key={r.agent}
                    className={`ia-bar-th-agent ${highlightAgent === r.agent ? 'highlight' : ''}`}
                    style={{ color: highlightAgent === r.agent ? CATEGORY_COLOR[r.category] : undefined }}
                  >
                    <div>{r.emoji} {r.agent}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GAMES.map((g, gi) => (
                <tr key={g}>
                  <td className="ia-bar-td-game">{g}</td>
                  {COLD_DATA.map((r) => {
                    const v = r.scores[gi];
                    const isMax = v === Math.max(...COLD_DATA.map((rr) => rr.scores[gi]));
                    return (
                      <td
                        key={`${g}-${r.agent}`}
                        className={`ia-bar-td ${highlightAgent === r.agent ? 'highlight-col' : ''}`}
                      >
                        <div className="ia-bar-cell">
                          <div
                            className={`ia-bar ${isMax ? 'ia-bar-winner' : ''}`}
                            style={{
                              width: `${v * 100}%`,
                              background: isMax ? CATEGORY_COLOR[r.category] : `${CATEGORY_COLOR[r.category]}aa`,
                              opacity: highlightAgent === r.agent || isMax ? 1 : 0.4,
                            }}
                          />
                          <span className="ia-bar-val">{v.toFixed(3)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="ia-bar-sumrow">
                <td className="ia-bar-td-game">总分 Σ</td>
                {COLD_DATA.map((r) => (
                  <td
                    key={r.agent}
                    className="ia-bar-td-sum"
                    style={{ color: CATEGORY_COLOR[r.category] }}
                  >
                    {r.sum.toFixed(3)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ia-bar-note">
          <span className="ia-legend-item">
            <span className="ia-legend-bar winner" />该列在每一行得最高
          </span>
          <span className="ia-legend-item">
            <span className="ia-legend-bar muted" />非最高分（淡化显示）
          </span>
          · 点击上方智能体按钮聚焦其列；论文结论：GPT-5.5 / Claude Opus 4.6 在大多数 Solo 游戏领先，Human 仍显著领先所有 VLM。
        </div>
      </section>
    </div>
  );
};

// ============= Character scene SVG (4-stage custom scenes) =============
function CharacterSVG({ stage }: { stage: Stage['key'] }) {
  return (
    <svg viewBox="0 0 320 240" width="100%" className="ia-char-svg" preserveAspectRatio="xMidYMid meet">
      {/* ground */}
      <line x1="10" y1="220" x2="310" y2="220" stroke="var(--line)" strokeWidth="2" />
      {/* shadow under character */}
      <ellipse cx="110" cy="220" rx="40" ry="5" fill="var(--line)" opacity="0.4" />

      {/* === scene === */}
      <g className={`ia-scene ia-scene-${stage}`}>

        {/* ---- STAGE 1: PLAY — 小人在玩电脑，旁边有本子 ---- */}
        <g className={`ia-play-scene ia-scene-${stage}`} style={{ display: stage === 'play' ? 'inline' : 'none' }}>
          {/* desk */}
          <rect x="40" y="160" width="180" height="14" fill="#a87a4a" stroke="#5a3e22" strokeWidth="1.6" />
          {/* monitor */}
          <rect x="55" y="80" width="80" height="60" rx="4" fill="#21324a" stroke="#0e1726" strokeWidth="2" />
          <rect x="60" y="85" width="70" height="50" rx="2" fill="#4ea8de" />
          {/* code lines on screen */}
          <line x1="64" y1="92" x2="100" y2="92" stroke="#fff" strokeWidth="1.5" />
          <line x1="64" y1="98" x2="116" y2="98" stroke="#fff" strokeWidth="1.5" />
          <line x1="64" y1="104" x2="92" y2="104" stroke="#fff" strokeWidth="1.5" />
          <line x1="64" y1="110" x2="120" y2="110" stroke="#fff" strokeWidth="1.5" />
          <line x1="64" y1="116" x2="98" y2="116" stroke="#fff" strokeWidth="1.5" />
          <line x1="64" y1="122" x2="110" y2="122" stroke="#fff" strokeWidth="1.5" />
          {/* monitor stand */}
          <rect x="88" y="140" width="14" height="14" fill="#21324a" />
          <rect x="75" y="154" width="40" height="6" rx="2" fill="#21324a" />
          {/* keyboard */}
          <rect x="60" y="160" width="80" height="10" rx="2" fill="#21324a" stroke="#0e1726" strokeWidth="1.2" />
          <line x1="68" y1="164" x2="132" y2="164" stroke="#4ea8de" strokeWidth="1" opacity="0.6" />
          {/* character (sitting at desk) */}
          <g className="ia-play-char">
            {/* head */}
            <circle cx="200" cy="110" r="18" fill="#ffe2b8" stroke="#3a2e1c" strokeWidth="2" />
            {/* focused eyes */}
            <line x1="192" y1="108" x2="196" y2="108" stroke="#3a2e1c" strokeWidth="2" strokeLinecap="round" />
            <line x1="204" y1="108" x2="208" y2="108" stroke="#3a2e1c" strokeWidth="2" strokeLinecap="round" />
            {/* mouth (slight smile / focused) */}
            <line x1="195" y1="118" x2="205" y2="118" stroke="#3a2e1c" strokeWidth="1.8" strokeLinecap="round" />
            {/* body */}
            <rect x="184" y="128" width="32" height="34" rx="5" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
            {/* arms reaching to keyboard */}
            <g className="ia-arm-left">
              <rect x="158" y="140" width="28" height="10" rx="4" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
            </g>
            <g className="ia-arm-right">
              <rect x="156" y="148" width="30" height="10" rx="4" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
            </g>
            {/* legs */}
            <rect x="186" y="162" width="10" height="22" rx="3" fill="#21324a" />
            <rect x="204" y="162" width="10" height="22" rx="3" fill="#21324a" />
            {/* chair hint */}
            <rect x="180" y="180" width="40" height="10" rx="3" fill="#888" stroke="#333" strokeWidth="1.2" />
          </g>
          {/* notebook next to character */}
          <g className="ia-sidebook">
            <rect x="240" y="148" width="44" height="32" rx="3" fill="#fff" stroke="#21324a" strokeWidth="1.6" />
            <line x1="245" y1="156" x2="280" y2="156" stroke="#aaa" strokeWidth="1" />
            <line x1="245" y1="162" x2="278" y2="162" stroke="#aaa" strokeWidth="1" />
            <line x1="245" y1="168" x2="280" y2="168" stroke="#aaa" strokeWidth="1" />
            <line x1="245" y1="174" x2="270" y2="174" stroke="#aaa" strokeWidth="1" />
            <text x="262" y="190" fontSize="10" fontWeight="800" textAnchor="middle" fill="var(--ui-text-muted)">本子</text>
          </g>
        </g>

        {/* ---- STAGE 2: REFLECT — 思考云朵 "刚才为啥输" ---- */}
        <g className={`ia-reflect-scene ia-scene-${stage}`} style={{ display: stage === 'reflect' ? 'inline' : 'none' }}>
          {/* character standing */}
          <g className="ia-reflect-char">
            <circle cx="110" cy="100" r="22" fill="#ffe2b8" stroke="#3a2e1c" strokeWidth="2" />
            {/* thinking eyes (looking up) */}
            <circle cx="102" cy="94" r="2.5" fill="#3a2e1c" />
            <circle cx="118" cy="94" r="2.5" fill="#3a2e1c" />
            {/* frown */}
            <path d="M 102 112 Q 110 108 118 112" stroke="#3a2e1c" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* body */}
            <rect x="90" y="122" width="40" height="50" rx="6" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
            {/* right arm on chin (thinking pose) */}
            <g className="ia-arm-right">
              <rect x="128" y="106" width="14" height="36" rx="4" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
              <circle cx="135" cy="100" r="5" fill="#ffe2b8" stroke="#3a2e1c" strokeWidth="1.6" />
            </g>
            {/* left arm hanging */}
            <rect x="76" y="128" width="14" height="36" rx="4" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
            {/* legs */}
            <rect x="96" y="172" width="10" height="28" rx="3" fill="#21324a" />
            <rect x="114" y="172" width="10" height="28" rx="3" fill="#21324a" />
          </g>
          {/* thought cloud */}
          <g className="ia-thought-cloud">
            <ellipse cx="220" cy="80" rx="78" ry="42" fill="#fff" stroke="#21324a" strokeWidth="2" />
            <ellipse cx="170" cy="100" rx="14" ry="10" fill="#fff" stroke="#21324a" strokeWidth="1.6" />
            <ellipse cx="158" cy="115" rx="9" ry="7" fill="#fff" stroke="#21324a" strokeWidth="1.4" />
            <ellipse cx="150" cy="128" rx="6" ry="5" fill="#fff" stroke="#21324a" strokeWidth="1.2" />
            <text x="220" y="70" fontSize="14" fontWeight="800" textAnchor="middle" fill="var(--ink)">思考中...</text>
            <text x="220" y="92" fontSize="15" fontWeight="800" textAnchor="middle" fill="var(--blue)">"刚才为啥输？"</text>
          </g>
        </g>

        {/* ---- STAGE 3: WRITE — 小人写字，旁边本子 ---- */}
        <g className={`ia-write-scene ia-scene-${stage}`} style={{ display: stage === 'write' ? 'inline' : 'none' }}>
          {/* notebook on ground / table */}
          <rect x="60" y="160" width="120" height="58" rx="4" fill="#fff" stroke="#21324a" strokeWidth="2" />
          {/* notebook spine */}
          <rect x="60" y="160" width="6" height="58" fill="#c89c2d" />
          {/* lines */}
          <line x1="78" y1="172" x2="170" y2="172" stroke="#bbb" strokeWidth="1.2" />
          <line x1="78" y1="182" x2="166" y2="182" stroke="#bbb" strokeWidth="1.2" />
          <line x1="78" y1="192" x2="172" y2="192" stroke="#bbb" strokeWidth="1.2" />
          <line x1="78" y1="202" x2="160" y2="202" stroke="#bbb" strokeWidth="1.2" />
          {/* written text indicator */}
          <text x="100" y="170" fontSize="10" fontWeight="800" fill="var(--blue)">📝 记在小本本上</text>

          {/* character (kneeling / writing) */}
          <g className="ia-write-char">
            <circle cx="220" cy="110" r="20" fill="#ffe2b8" stroke="#3a2e1c" strokeWidth="2" />
            {/* focused eyes */}
            <line x1="212" y1="108" x2="216" y2="108" stroke="#3a2e1c" strokeWidth="2" strokeLinecap="round" />
            <line x1="224" y1="108" x2="228" y2="108" stroke="#3a2e1c" strokeWidth="2" strokeLinecap="round" />
            {/* small smile */}
            <path d="M 214 118 Q 220 122 226 118" stroke="#3a2e1c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* body */}
            <rect x="202" y="130" width="36" height="36" rx="5" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
            {/* right arm holding pencil (extends to notebook) */}
            <g className="ia-arm-right">
              <rect x="178" y="138" width="40" height="8" rx="3" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
              {/* pencil */}
              <line x1="138" y1="142" x2="178" y2="142" stroke="#e0b94a" strokeWidth="4" strokeLinecap="round" />
              <polygon points="138,142 132,138 132,146" fill="#3a2e1c" />
            </g>
            {/* left arm down */}
            <rect x="238" y="140" width="14" height="32" rx="4" fill="var(--blue)" stroke="#21324a" strokeWidth="2" />
            {/* legs (sitting posture) */}
            <rect x="204" y="166" width="12" height="34" rx="4" fill="#21324a" />
            <rect x="226" y="166" width="12" height="34" rx="4" fill="#21324a" />
          </g>
          {/* writing animation effect */}
          <g className="ia-write-sparks">
            <circle cx="148" cy="175" r="2" fill="var(--orange)" />
            <circle cx="158" cy="180" r="2" fill="var(--orange)" />
            <circle cx="140" cy="190" r="2" fill="var(--orange)" />
          </g>
        </g>

        {/* ---- STAGE 4: ROLLBACK — 灯泡 + 跳起 + 时光倒流 ---- */}
        <g className={`ia-rollback-scene ia-scene-${stage}`} style={{ display: stage === 'rollback' ? 'inline' : 'none' }}>
          {/* character jumping up */}
          <g className="ia-rollback-char">
            <circle cx="110" cy="80" r="22" fill="#ffe2b8" stroke="#3a2e1c" strokeWidth="2" />
            {/* surprised eyes (wide circles) */}
            <circle cx="102" cy="76" r="3.5" fill="#fff" stroke="#3a2e1c" strokeWidth="1.6" />
            <circle cx="118" cy="76" r="3.5" fill="#fff" stroke="#3a2e1c" strokeWidth="1.6" />
            <circle cx="102" cy="76" r="1.5" fill="#3a2e1c" />
            <circle cx="118" cy="76" r="1.5" fill="#3a2e1c" />
            {/* open mouth (shocked) */}
            <ellipse cx="110" cy="92" rx="4" ry="5" fill="#3a2e1c" />
            {/* body */}
            <rect x="90" y="102" width="40" height="50" rx="6" fill="var(--orange)" stroke="#21324a" strokeWidth="2" />
            {/* arms raised in surprise */}
            <g className="ia-arm-left">
              <rect x="68" y="86" width="14" height="34" rx="4" fill="var(--orange)" stroke="#21324a" strokeWidth="2" transform="rotate(-30 75 86)" />
            </g>
            <g className="ia-arm-right">
              <rect x="138" y="86" width="14" height="34" rx="4" fill="var(--orange)" stroke="#21324a" strokeWidth="2" transform="rotate(30 145 86)" />
            </g>
            {/* legs bent (jumping) */}
            <rect x="96" y="152" width="12" height="22" rx="3" fill="#21324a" transform="rotate(15 102 152)" />
            <rect x="114" y="152" width="12" height="22" rx="3" fill="#21324a" transform="rotate(-15 120 152)" />
          </g>
          {/* lightbulb above head */}
          <g className="ia-lightbulb">
            <ellipse cx="110" cy="30" rx="16" ry="18" fill="#fff8c8" stroke="#c89c2d" strokeWidth="2" />
            <rect x="100" y="44" width="20" height="6" fill="#888" stroke="#3a2e1c" strokeWidth="1.4" />
            <rect x="102" y="50" width="16" height="3" fill="#666" />
            {/* light rays */}
            <line x1="110" y1="6" x2="110" y2="0" stroke="#e0b94a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="92" y1="14" x2="86" y2="10" stroke="#e0b94a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="128" y1="14" x2="134" y2="10" stroke="#e0b94a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="86" y1="30" x2="80" y2="30" stroke="#e0b94a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="134" y1="30" x2="140" y2="30" stroke="#e0b94a" strokeWidth="2.5" strokeLinecap="round" />
            {/* filament */}
            <path d="M 104 32 L 108 26 L 112 32 L 116 26" stroke="#e0b94a" strokeWidth="1.4" fill="none" />
          </g>
          {/* speech bubble with quote */}
          <g className="ia-speech-bubble">
            <path d="M 170 30 L 300 30 L 300 95 L 220 95 L 200 110 L 210 95 L 170 95 Z" fill="#fff" stroke="var(--orange)" strokeWidth="2" />
            <text x="235" y="55" fontSize="13" fontWeight="800" textAnchor="middle" fill="var(--orange)">坏了！思路越走越偏，</text>
            <text x="235" y="78" fontSize="14" fontWeight="800" textAnchor="middle" fill="var(--orange)">现在我要"时光倒流"！</text>
          </g>
          {/* time-reversal arrows */}
          <g className="ia-rev-arrows">
            <path d="M 50 175 Q 30 175 30 200 Q 30 215 50 215" stroke="var(--orange)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <polygon points="50,215 44,210 44,220" fill="var(--orange)" />
            <text x="15" y="195" fontSize="10" fontWeight="800" fill="var(--orange)">倒流</text>
          </g>
        </g>
      </g>
    </svg>
  );
}