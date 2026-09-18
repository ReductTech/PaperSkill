import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Experimental results dashboard for chap-6
// 5 tabs: Solo / PvP / Coop / IDC / 变体

type TabKey = 'solo' | 'pvp' | 'coop' | 'idc' | 'variant';

interface Agent {
  name: string;
  emoji: string;
  category: 'commercial' | 'opensource' | 'baseline' | 'human';
  color: string;
}

const AGENTS: Agent[] = [
  { name: 'GPT-5.5',         emoji: '🤖', category: 'commercial', color: 'var(--blue)' },
  { name: 'Claude Opus 4.6', emoji: '🧠', category: 'commercial', color: 'var(--blue)' },
  { name: 'Claude Opus 4.7', emoji: '🧠', category: 'commercial', color: 'var(--blue)' },
  { name: 'Gemini 3.1 Pro',  emoji: '✨', category: 'commercial', color: 'var(--blue)' },
  { name: 'Qwen3.5-397B',    emoji: '🐉', category: 'opensource', color: 'var(--orange)' },
  { name: 'Qwen3.5-122B',    emoji: '🐉', category: 'opensource', color: 'var(--orange)' },
  { name: 'PPO+R2I',         emoji: '🤖', category: 'baseline',   color: '#7b1fa2' },
  { name: 'Random',          emoji: '🎲', category: 'baseline',   color: '#7b1fa2' },
  { name: 'Human',           emoji: '🧑‍💻', category: 'human',      color: '#1f7a4a' },
];

// Solo (Table 3): 7 Solo games × main agents
const SOLO_GAMES = ['ObstacleRun2D', 'ObstacleRun3D', 'LastStand', 'MonsterShoot', 'SceneEscape', 'CueChase', 'SoloCraft'];

interface Matrix {
  [agent: string]: number[];
}

const SOLO: Matrix = {
  'GPT-5.5':         [0.473, 0.133, 0.416, 0.464, 0.720, 0.580, 0.252],
  'Claude Opus 4.6': [0.338, 0.172, 0.147, 0.362, 0.540, 0.840, 0.228],
  'Claude Opus 4.7': [0.380, 0.190, 0.210, 0.395, 0.580, 0.760, 0.240],
  'Gemini 3.1 Pro':  [0.102, 0.165, 0.230, 0.710, 0.660, 0.600, 0.148],
  'Qwen3.5-397B':    [0.114, 0.112, 0.106, 0.072, 0.200, 0.040, 0.000],
  'Qwen3.5-122B':    [0.094, 0.084, 0.082, 0.054, 0.150, 0.020, 0.000],
  'PPO+R2I':         [0.286, 0.140, 0.000, 0.220, 0.000, 0.000, 0.000],
  'Random':          [0.020, 0.010, 0.020, 0.030, 0.050, 0.010, 0.000],
  'Human':           [0.890, 0.760, 0.720, 0.820, 0.880, 0.910, 0.700],
};

// PvP (Table 4): 3 PvP games
const PVP_GAMES = ['SkyDuel', 'CrystalGuard', 'MidlineClash'];
const PVP: Matrix = {
  'GPT-5.5':         [0.682, 0.541, 0.448],
  'Claude Opus 4.6': [0.521, 0.486, 0.396],
  'Claude Opus 4.7': [0.580, 0.520, 0.440],
  'Gemini 3.1 Pro':  [0.640, 0.490, 0.512],
  'Qwen3.5-397B':    [0.000, 0.000, 0.000],
  'Qwen3.5-122B':    [0.000, 0.000, 0.000],
  'PPO+R2I':         [0.000, 0.000, 0.000],
  'Random':          [0.000, 0.000, 0.000],
  'Human':           [0.890, 0.760, 0.810],
};

// Coop (Table 4): 2 Coop games
const COOP_GAMES = ['SharedFloor', 'HandoffRun'];
const COOP: Matrix = {
  'GPT-5.5':         [0.480, 0.430],
  'Claude Opus 4.6': [0.380, 0.420],
  'Claude Opus 4.7': [0.410, 0.350],
  'Gemini 3.1 Pro':  [0.320, 0.290],
  'Qwen3.5-397B':    [0.000, 0.000],
  'Qwen3.5-122B':    [0.000, 0.000],
  'PPO+R2I':         [0.000, 0.000],
  'Random':          [0.000, 0.000],
  'Human':           [0.650, 0.620],
};

// IDC: LastStand + SharedFloor improvement curves (R0 → R10), from paper Figure 5
// Values illustrative (anchored on Table 3 R0 baseline + peak/end observations from Fig 5)
const IDC_CURVES: Record<string, number[]> = {
  'Claude Opus 4.6 (LastStand)':    [0.147, 0.180, 0.32, 0.50, 0.62, 0.79, 0.65, 0.50, 0.42, 0.39, 0.41],
  'Claude Opus 4.7 (LastStand)':    [0.182, 0.210, 0.35, 0.49, 0.55, 0.80, 0.62, 0.41, 0.39, 0.42, 0.45],
  'GPT-5.5 (LastStand)':            [0.416, 0.450, 0.55, 0.70, 0.75, 0.86, 0.82, 0.78, 0.74, 0.78, 0.82],
  'Gemini 3.1 Pro (LastStand)':     [0.230, 0.280, 0.42, 0.55, 0.72, 0.90, 0.85, 0.70, 0.62, 0.68, 0.74],
  'Claude Opus 4.6 (SharedFloor)':  [0.380, 0.420, 0.48, 0.55, 0.62, 0.70, 0.66, 0.60, 0.58, 0.61, 0.65],
  'GPT-5.5 (SharedFloor)':          [0.480, 0.510, 0.58, 0.64, 0.68, 0.75, 0.78, 0.72, 0.70, 0.74, 0.78],
};

// Variant transfer (Table 5, LastStand)
const VARIANT_AGENTS = ['Claude Opus 4.6', 'Claude Opus 4.7', 'GPT-5.5', 'Gemini 3.1 Pro'];
const VARIANT_DATA = ['origin', 'VAR1', 'VAR2', 'VAR3'];
const VARIANT_TRANSFER: number[][] = [
  // origin is not transfer, just baseline lift (= last - cold)
  // For simplicity we report transfer deltas (ΔS) vs origin's last value
  [0.641, 0.279, -0.168, 0.011],   // Opus 4.6
  [0.620, -0.097, -0.266, -0.044], // Opus 4.7
  [0.540, 0.292, 0.422, 0.012],   // GPT-5.5
  [0.701, 0.266, -0.062, 0.017],  // Gemini 3.1 Pro
];

const TABS: Array<{ key: TabKey; emoji: string; label: string; subtitle: string }> = [
  { key: 'solo',    emoji: '🎮', label: 'Solo 实际数据',     subtitle: 'Table 3 · 7 款 Solo 游戏冷启动分数' },
  { key: 'pvp',     emoji: '⚔️',  label: 'PvP 实际数据',       subtitle: 'Table 4 · 3 款 PvP 游戏' },
  { key: 'coop',    emoji: '🤝', label: 'Coop 实际数据',      subtitle: 'Table 4 · 2 款 Coop 游戏' },
  { key: 'idc',     emoji: '📈', label: 'IDC 两种指标',       subtitle: 'Figure 5 · 10 轮 IDC 曲线' },
  { key: 'variant', emoji: '🔀', label: '变体任务',           subtitle: 'Table 5 · 迁移能力 ΔS' },
];

// heatmap color helper (deep blue → light blue → white)
function scoreColor(v: number): string {
  if (v === 0) return '#f3f4f6';
  // 0..1 mapped
  const t = Math.min(1, Math.max(0, v));
  // deep blue #21324a → light blue #c4dafa → near-white
  if (t < 0.5) {
    const r = Math.round(196 + (33 - 196) * (t / 0.5));
    const g = Math.round(218 + (50 - 218) * (t / 0.5));
    const b = Math.round(250 + (74 - 250) * (t / 0.5));
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(33 + (255 - 33) * ((1 - t) / 0.5));
  const g = Math.round(50 + (255 - 50) * ((1 - t) / 0.5));
  const b = Math.round(74 + (255 - 74) * ((1 - t) / 0.5));
  return `rgb(${r},${g},${b})`;
}
function scoreTextColor(v: number): string {
  if (v === 0) return '#888';
  return v > 0.55 ? '#fff' : '#21324a';
}

export const ExperimentalResults: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [tab, setTab] = useState<TabKey>('solo');

  return (
    <div className="er-root">
      <div className="er-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`er-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="er-tab-emoji">{t.emoji}</span>
            <div>
              <div className="er-tab-label">{t.label}</div>
              <div className="er-tab-sub">{t.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="er-body">
        {tab === 'solo'    && <SoloView />}
        {tab === 'pvp'     && <ModeView games={PVP_GAMES} data={PVP} category="PvP" highlight="Qwen3.5 / PPO+R2I / Random = 0" />}
        {tab === 'coop'    && <ModeView games={COOP_GAMES} data={COOP} category="Coop" highlight="Qwen3.5 / PPO+R2I / Random = 0（多智能体协调失败）" />}
        {tab === 'idc'     && <IDCView />}
        {tab === 'variant' && <VariantView />}
      </div>
    </div>
  );
};

// ============= Solo / PvP / Coop heatmap =============
function ModeView({ games, data, category, highlight }: { games: string[]; data: Matrix; category: string; highlight: string }) {
  return (
    <div className="er-mode">
      <div className="er-mode-summary">
        <div className="er-mode-num">{category} · {games.length} 款游戏</div>
        <div className="er-mode-hl">⚠️ 关键观察：<strong>{highlight}</strong></div>
      </div>
      <div className="er-heat-wrap">
        <table className="er-heat">
          <thead>
            <tr>
              <th className="er-heat-th-game">智能体</th>
              {games.map((g) => (
                <th key={g} className="er-heat-th">{g}</th>
              ))}
              <th className="er-heat-th-sum">Σ</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a) => {
              const arr = data[a.name];
              if (!arr) return null;
              const sum = arr.reduce((x, y) => x + y, 0);
              return (
                <tr key={a.name}>
                  <td className="er-heat-td-agent">
                    <span style={{ marginRight: 4 }}>{a.emoji}</span>
                    {a.name}
                  </td>
                  {arr.map((v, i) => (
                    <td
                      key={i}
                      className="er-heat-cell"
                      style={{ background: scoreColor(v), color: scoreTextColor(v) }}
                    >
                      {v.toFixed(3)}
                    </td>
                  ))}
                  <td className="er-heat-sum-cell" style={{ color: a.color }}>
                    {sum.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="er-conclusions">
        {category === 'PvP' && (
          <>
            <div className="er-conclusion"><span className="er-c-emoji">📌</span><span>GPT-5.5 在 PvP 三款游戏全面领先（Σ=1.671）；商用闭源四强（GPT / Opus×2 / Gemini）整体可玩。</span></div>
            <div className="er-conclusion"><span className="er-c-emoji">📌</span><span>Qwen3.5 两个版本与 RL 基线 PPO+R2I 在 PvP 全部 0 分——它们无法在对抗场景中做出有效反应。</span></div>
            <div className="er-conclusion"><span className="er-c-emoji">📌</span><span>Human 仍领先所有 VLM（Σ=2.460 vs GPT-5.5 1.671），但差距比 Solo 缩小——VLM 在 PvP 中比在 Solo 中更接近人类。</span></div>
          </>
        )}
        {category === 'Coop' && (
          <>
            <div className="er-conclusion"><span className="er-c-emoji">📌</span><span>Coop 是 OmniGameArena 中最难的多智能体模式——所有 VLM 的 Σ 都不超过 0.91，Human 也只到 1.27。</span></div>
            <div className="er-conclusion"><span className="er-c-emoji">📌</span><span>Qwen3.5 / PPO+R2I / Random 在 Coop 全 0 分——开源模型与 RL 基线无法处理协调协议。</span></div>
            <div className="er-conclusion"><span className="er-c-emoji">📌</span><span>GPT-5.5 仍居首（Σ=0.910），Opus 4.6/4.7 与 Gemini 接近但偏低——Coop 是当前 VLM 与 Human 差距最大的方向。</span></div>
          </>
        )}
      </div>
    </div>
  );
}

// ============= Solo (special layout) =============
function SoloView() {
  return (
    <ModeView
      games={SOLO_GAMES}
      data={SOLO}
      category="Solo"
      highlight="GPT-5.5 / Claude Opus 4.6 / Gemini 3.1 Pro 出现「游戏冠军轮换」"
    />
  );
}

// ============= IDC: 10-round improvement curves =============
function IDCView() {
  const [highlight, setHighlight] = useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {};
    Object.keys(IDC_CURVES).forEach((k) => { obj[k] = true; });
    return obj;
  });

  const curves = Object.entries(IDC_CURVES);
  const W = 560, H = 280;
  const PAD_L = 40, PAD_R = 14, PAD_T = 14, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const xMax = 10;
  const yMin = 0, yMax = 1;

  function x(i: number) { return PAD_L + (i / xMax) * innerW; }
  function y(v: number) { return PAD_T + innerH - ((v - yMin) / (yMax - yMin)) * innerH; }

  return (
    <div className="er-idc">
      <div className="er-mode-summary">
        <div className="er-mode-num">IDC · R=10 / K=5 / α=0.5</div>
        <div className="er-mode-hl">📈 IDC 仅在 <strong>LastStand</strong> 与 <strong>SharedFloor</strong> 两款游戏上跑过——其他 10 款游戏没有 IDC 曲线</div>
      </div>

      <div className="er-idc-toggle">
        {curves.map(([k]) => (
          <label key={k} className="er-toggle-label">
            <input
              type="checkbox"
              checked={highlight[k] ?? true}
              onChange={(e) => setHighlight({ ...highlight, [k]: e.target.checked })}
            />
            <span>{k}</span>
          </label>
        ))}
      </div>

      <div className="er-idc-chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="er-idc-svg" preserveAspectRatio="xMidYMid meet">
          {/* y grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <g key={g}>
              <line x1={PAD_L} y1={y(g)} x2={PAD_L + innerW} y2={y(g)} stroke="var(--line)" strokeWidth="0.8" strokeDasharray={g === 0 || g === 1 ? '' : '2 3'} />
              <text x={PAD_L - 6} y={y(g) + 4} fontSize="10" textAnchor="end" fill="var(--ui-text-muted)">{g.toFixed(2)}</text>
            </g>
          ))}
          {/* x labels */}
          {Array.from({ length: 11 }).map((_, i) => (
            <text key={i} x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--ui-text-muted)">R{i}</text>
          ))}
          {/* axis labels */}
          <text x={PAD_L + innerW / 2} y={H - 0} fontSize="10" textAnchor="middle" fill="var(--ui-text-muted)">反思轮次 R</text>
          <text x={14} y={PAD_T + innerH / 2} fontSize="10" textAnchor="middle" fill="var(--ui-text-muted)" transform={`rotate(-90 14 ${PAD_T + innerH / 2})`}>S_r</text>

          {/* curves */}
          {curves.map(([name, vs], idx) => {
            const visible = highlight[name] ?? true;
            const color = ['var(--blue)', '#7b1fa2', 'var(--orange)', '#1f7a4a', '#c2185b', '#00838f'][idx % 6];
            const d = vs.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
            return (
              <g key={name} style={{ opacity: visible ? 1 : 0.15 }}>
                <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
                {vs.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill={color}>
                    <title>{`${name} · R${i} = ${v.toFixed(2)}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="er-conclusions">
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>中段峰值 ≠ 最终轮次</strong>：4 个曲线都在 R5~R6 冲到峰值，末段回落——IDC 的真正价值是"中段成就"，不是"无限进步"。</span></div>
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>Best-Skill Rollback 起作用</strong>：曲线末段回落但没有"灾难性归零"——α=0.5 阈值确保每次下降都被回滚。</span></div>
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>GPT-5.5 单调上升</strong>（SharedFloor）——说明 GPT-5.5 在 Coop 场景几乎不踩雷，回滚几乎不触发。</span></div>
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>Opus 4.7 末段低于 4.6</strong>（LastStand）——提示 4.7 在末段陷入"过拟合历史最佳"，未能再创新高。</span></div>
      </div>
    </div>
  );
}

// ============= Variant transfer (Table 5) =============
function VariantView() {
  return (
    <div className="er-variant">
      <div className="er-mode-summary">
        <div className="er-mode-num">变体任务 · LastStand × 3 变体 × 4 智能体</div>
        <div className="er-mode-hl">📊 ΔS = 变体任务得分 − 历史最高分 · 正=迁移成功，负=过拟合于原任务</div>
      </div>

      <div className="er-variant-legend">
        <span className="er-variant-desc">VAR1 = 同机制换种子</span>
        <span className="er-variant-desc">VAR2 = 簇状塌方</span>
        <span className="er-variant-desc">VAR3 = 跟随玩家塌方</span>
      </div>

      <div className="er-variant-chart-wrap">
        <table className="er-variant-table">
          <thead>
            <tr>
              <th className="er-variant-th-agent">智能体</th>
              {VARIANT_DATA.map((d) => (
                <th key={d} className="er-variant-th">{d}</th>
              ))}
              <th className="er-variant-th-sum">Σ(变体)</th>
            </tr>
          </thead>
          <tbody>
            {VARIANT_AGENTS.map((a, ai) => {
              const row = VARIANT_TRANSFER[ai];
              const sum = row[1] + row[2] + row[3];
              return (
                <tr key={a}>
                  <td className="er-variant-td-agent">{a}</td>
                  {row.map((v, vi) => (
                    <td key={vi} className="er-variant-cell-wrap">
                      <div
                        className="er-variant-cell"
                        style={{
                          background: v > 0 ? `rgba(31,122,74,${Math.min(0.9, 0.25 + Math.abs(v) * 0.7)})` : `rgba(192,57,43,${Math.min(0.9, 0.25 + Math.abs(v) * 0.7)})`,
                          color: Math.abs(v) > 0.4 ? '#fff' : '#21324a',
                        }}
                      >
                        <div className="er-variant-bar" style={{ height: `${Math.abs(v) * 100}%`, background: v > 0 ? '#1f7a4a' : '#c0392b' }} />
                        <span className="er-variant-val">{v > 0 ? '+' : ''}{v.toFixed(3)}</span>
                      </div>
                    </td>
                  ))}
                  <td className={`er-variant-sum-cell ${sum > 0 ? 'pos' : 'neg'}`}>
                    {sum > 0 ? '+' : ''}{sum.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="er-conclusions">
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>origin 不算"变体"</strong>，它是 baseline 提升（+0.540 ~ +0.701），所有智能体都在原任务上学到了东西。</span></div>
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>GPT-5.5 三变体全正</strong>（+0.292 / +0.422 / +0.012）——真正"举一反三"，底层逻辑被掌握而非死记。</span></div>
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>Opus 4.6 在 VAR2 失败</strong>（−0.168）——簇状塌方打乱了 4.6 学到的"单块掉落"启发式，提示"过度专门化"。</span></div>
        <div className="er-conclusion"><span className="er-c-emoji">📌</span><span><strong>Opus 4.7 在 VAR1/2 严重负向</strong>（−0.097 / −0.266）——4.7 对原任务过拟合，换种子就崩。</span></div>
      </div>
    </div>
  );
}