import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

// 7 capability dimensions from the paper §3.1 / Figure 2 (each scored 0–3):
//   VP   = Visual Perception
//   SN   = Spatial Navigation
//   RT   = Reaction
//   MEM  = Memory
//   PLN  = Planning
//   ADV  = Adversarial modeling
//   COOP = Cooperation

const DIMS: { key: keyof Capabilities; label: string; full: string }[] = [
  { key: 'VP',  label: 'VP',  full: '视觉感知 (Visual Perception)' },
  { key: 'SN',  label: 'SN',  full: '空间导航 (Spatial Navigation)' },
  { key: 'RT',  label: 'RT',  full: '反应速度 (Reaction)' },
  { key: 'MEM', label: 'MEM', full: '记忆 (Memory)' },
  { key: 'PLN', label: 'PLN', full: '规划 (Planning)' },
  { key: 'ADV', label: 'ADV', full: '对手建模 (Adversarial)' },
  { key: 'COOP',label: 'COOP',full: '队友协作 (Cooperation)' },
];

interface Capabilities {
  VP: number; SN: number; RT: number; MEM: number; PLN: number; ADV: number; COOP: number;
}

interface Game {
  id: string;
  name: string;
  regime: 'Solo' | 'PvP' | 'Coop';
  caps: Capabilities;
  description: string;
  formula: string;
  focuses: string[]; // "重点考察能力" (2-3 个)
}

const GAMES: Game[] = [
  // ---- Solo (7) ----
  {
    id: 'ObstacleRun3D', name: 'ObstacleRun3D', regime: 'Solo',
    caps: { VP: 3, SN: 3, RT: 2, MEM: 1, PLN: 2, ADV: 0, COOP: 0 },
    description: '3D 跑酷：智能体需穿越障碍物到达终点线。',
    formula: '(x_a − x_start) / (x_finish − x_start)',
    focuses: ['深度 3D 视觉感知', '空间路径导航', '跨段落的运动规划'],
  },
  {
    id: 'ObstacleRun2D', name: 'ObstacleRun2D', regime: 'Solo',
    caps: { VP: 2, SN: 2, RT: 2, MEM: 1, PLN: 2, ADV: 0, COOP: 0 },
    description: '2D 横版平台跳跃：智能体在单轴关卡中前进到底。',
    formula: '(x_a − x_start) / (x_finish − x_start)',
    focuses: ['2D 视觉感知', '节奏反应', '局部路径规划'],
  },
  {
    id: 'LastStand', name: 'LastStand', regime: 'Solo',
    caps: { VP: 3, SN: 2, RT: 3, MEM: 1, PLN: 1, ADV: 0, COOP: 0 },
    description: '平台生存：智能体需躲避危险并避免坠落。',
    formula: 't_survive / T_max',
    focuses: ['高速反应 (RT)', '平台跳跃的视觉感知', '短时策略'],
  },
  {
    id: 'MonsterShoot', name: 'MonsterShoot', regime: 'Solo',
    caps: { VP: 3, SN: 1, RT: 3, MEM: 1, PLN: 2, ADV: 0, COOP: 0 },
    description: '生存射击：定位并消灭敌人，同时避免受伤。',
    formula: 'D_e / H_total',
    focuses: ['高速瞄准 (RT+VP)', '目标追踪', '资源管理规划'],
  },
  {
    id: 'SceneEscape', name: 'SceneEscape', regime: 'Solo',
    caps: { VP: 2, SN: 1, RT: 1, MEM: 2, PLN: 3, ADV: 0, COOP: 0 },
    description: '场景解谜：完成 NPC 分配的任务以脱逃。',
    formula: 'n / N',
    focuses: ['长链任务规划', 'NPC 指令记忆', '状态追踪'],
  },
  {
    id: 'CueChase', name: 'CueChase', regime: 'Solo',
    caps: { VP: 2, SN: 3, RT: 1, MEM: 3, PLN: 2, ADV: 0, COOP: 0 },
    description: '第三人称探索：在地图上定位并激活隐藏触发器。',
    formula: 'k / K',
    focuses: ['空间导航', '多触发器记忆', '路径回溯'],
  },
  {
    id: 'SoloCraft', name: 'SoloCraft', regime: 'Solo',
    caps: { VP: 2, SN: 1, RT: 1, MEM: 2, PLN: 3, ADV: 0, COOP: 0 },
    description: '物流收集：采集、加工并交付物品以完成订单。',
    formula: 'v_delivered / V_target',
    focuses: ['多步骤流水线规划', '物品状态记忆', '资源协调'],
  },

  // ---- PvP (3) ----
  {
    id: 'SkyDuel', name: 'SkyDuel', regime: 'PvP',
    caps: { VP: 3, SN: 2, RT: 3, MEM: 1, PLN: 2, ADV: 3, COOP: 0 },
    description: '1v1 空战：智能体需与对手交战并击败对方。',
    formula: 'h_self / H_max',
    focuses: ['对手意图建模 (ADV)', '高速机动反应', '空战空间感知'],
  },
  {
    id: 'CrystalGuard', name: 'CrystalGuard', regime: 'PvP',
    caps: { VP: 2, SN: 2, RT: 2, MEM: 2, PLN: 3, ADV: 3, COOP: 0 },
    description: '攻防对称：摧毁对手水晶核心同时保护己方。',
    formula: 'h_core^own / H_max',
    focuses: ['攻防平衡规划', '对手节奏记忆', '资源线分配'],
  },
  {
    id: 'MidlineClash', name: 'MidlineClash', regime: 'PvP',
    caps: { VP: 2, SN: 2, RT: 2, MEM: 2, PLN: 3, ADV: 2, COOP: 0 },
    description: '竞争物流：两智能体在共享环境中竞争完成订单。',
    formula: 's_a / S_target',
    focuses: ['对手优先级干扰', '资源抢占规划', '节奏控制'],
  },

  // ---- Coop (2) ----
  {
    id: 'SharedFloor', name: 'SharedFloor', regime: 'Coop',
    caps: { VP: 2, SN: 2, RT: 1, MEM: 2, PLN: 3, ADV: 0, COOP: 3 },
    description: '对称协作：两智能体共享空间与能力完成订单。',
    formula: 'v_delivered / V_team',
    focuses: ['队友状态协同 (COOP)', '分工规划', '弱信号通信'],
  },
  {
    id: 'HandoffRun', name: 'HandoffRun', regime: 'Coop',
    caps: { VP: 2, SN: 2, RT: 2, MEM: 2, PLN: 3, ADV: 0, COOP: 3 },
    description: '非对称协作：基于角色分工跨越限制区传递物品。',
    formula: 'v_delivered / V_team',
    focuses: ['角色分工 (COOP)', '交接时机反应', '路径避让规划'],
  },
];

const REGIME_COLOR: Record<Game['regime'], string> = {
  Solo: 'var(--blue)',
  PvP:  '#b8384a',
  Coop: '#1f7a4a',
};

export const CapabilityRadar: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [selectedId, setSelectedId] = useState<string>('LastStand');
  const selected = GAMES.find((g) => g.id === selectedId) ?? GAMES[0];

  const maxScore = 3;
  const radarSize = 380;
  const center = radarSize / 2;
  const radius = 140;

  // compute polygon points
  const polyPoints = useMemo(() => {
    return DIMS.map((d, i) => {
      const value = selected.caps[d.key];
      const angle = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
      const r = (value / maxScore) * radius;
      return {
        x: center + Math.cos(angle) * r,
        y: center + Math.sin(angle) * r,
        labelX: center + Math.cos(angle) * (radius + 26),
        labelY: center + Math.sin(angle) * (radius + 26),
        angle,
        value,
        dim: d,
      };
    });
  }, [selected]);

  return (
    <div className="cr-wrap">
      {/* Left: radar */}
      <div className="cr-radar">
        <svg viewBox={`0 0 ${radarSize} ${radarSize}`} width="100%" preserveAspectRatio="xMidYMid meet">
          {/* concentric grid: 1, 2, 3 */}
          {[1, 2, 3].map((level) => {
            const r = (level / maxScore) * radius;
            const pts = DIMS.map((_, i) => {
              const a = (Math.PI * 2 * i) / DIMS.length - Math.PI / 2;
              return `${center + Math.cos(a) * r},${center + Math.sin(a) * r}`;
            }).join(' ');
            return (
              <polygon
                key={level}
                points={pts}
                fill="none"
                stroke="var(--line)"
                strokeWidth={level === 3 ? 1.4 : 0.7}
                strokeDasharray={level === 3 ? '0' : '3 3'}
              />
            );
          })}

          {/* axes */}
          {polyPoints.map((p, i) => (
            <line
              key={`a-${i}`}
              x1={center}
              y1={center}
              x2={center + Math.cos(p.angle) * radius}
              y2={center + Math.sin(p.angle) * radius}
              stroke="var(--line)"
              strokeWidth={0.6}
            />
          ))}

          {/* filled polygon */}
          <polygon
            points={polyPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={REGIME_COLOR[selected.regime]}
            fillOpacity={0.22}
            stroke={REGIME_COLOR[selected.regime]}
            strokeWidth={2}
          />

          {/* data points */}
          {polyPoints.map((p, i) => (
            <g key={`pt-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill="#fff"
                stroke={REGIME_COLOR[selected.regime]}
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={p.y - 8}
                fontSize={10}
                fontWeight={700}
                fill={REGIME_COLOR[selected.regime]}
                textAnchor="middle"
              >
                {p.value}
              </text>
            </g>
          ))}

          {/* dim labels */}
          {polyPoints.map((p, i) => (
            <g key={`lb-${i}`}>
              <text
                x={p.labelX}
                y={p.labelY}
                fontSize={12}
                fontWeight={700}
                fill="var(--ink)"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {p.dim.label}
              </text>
              <text
                x={p.labelX}
                y={p.labelY + 12}
                fontSize={9}
                fill="var(--ui-text-muted)"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {p.value === 3 ? '★' : p.value === 2 ? '▲' : p.value === 1 ? '▪' : '·'}{' '}
                {p.value}/3
              </text>
            </g>
          ))}
        </svg>
        <div className="cr-radar-cap">
          <span className="cr-radar-cap-regime" style={{ background: REGIME_COLOR[selected.regime] }}>
            {selected.regime}
          </span>
          <span className="cr-radar-cap-name">{selected.name}</span>
          <span className="cr-radar-cap-sum">
            Σ = {Object.values(selected.caps).reduce((a, b) => a + b, 0)} / 21
          </span>
        </div>
      </div>

      {/* Right: detail card */}
      <div className="cr-detail">
        <div className="cr-detail-head">
          <span className="cr-detail-name">{selected.name}</span>
          <span
            className="cr-detail-regime"
            style={{ background: REGIME_COLOR[selected.regime] }}
          >
            {selected.regime}
          </span>
        </div>
        <div className="cr-detail-desc">{selected.description}</div>
        <div className="cr-detail-formula">
          <span className="cr-label">评估公式</span>
          <code>{selected.formula}</code>
        </div>
        <div className="cr-detail-focus">
          <span className="cr-label">🎯 重点考察能力</span>
          <ul>
            {selected.focuses.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom: game list */}
      <div className="cr-games">
        <div className="cr-games-head">🎮 选择游戏（共 12 款）</div>
        <div className="cr-games-rows">
          {(['Solo', 'PvP', 'Coop'] as const).map((reg) => (
            <div className="cr-games-row" key={reg}>
              <div className="cr-games-row-label" style={{ color: REGIME_COLOR[reg] }}>
                {reg}
              </div>
              <div className="cr-games-row-items">
                {GAMES.filter((g) => g.regime === reg).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`cr-game-btn ${g.id === selectedId ? 'active' : ''}`}
                    onClick={() => setSelectedId(g.id)}
                    style={
                      g.id === selectedId
                        ? {
                            borderColor: REGIME_COLOR[g.regime],
                            background: REGIME_COLOR[g.regime],
                            color: '#fff',
                          }
                        : undefined
                    }
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};