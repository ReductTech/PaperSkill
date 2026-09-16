import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 9.1 — Progressive Validation。
// Game → Simulation → Real Robot：受控变量，逐层加回物理真实。
// 切换层级，看每一层隔离了什么、加回了什么、能证明什么、不能证明什么。

interface TierDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  envs: string;
  adds: string;
  factors: { label: string; on: boolean }[];
  validates: string;
  canProve: string;
  cannotProve: string;
}

const TIERS: TierDef[] = [
  {
    id: 'game',
    name: 'Game',
    icon: '🎮',
    color: '#7c3aed',
    envs: 'Minecraft · Stardew Valley · Don’t Starve',
    adds: '尽量去掉执行器误差、传感器噪声、刚体不确定性与物理延迟',
    factors: [
      { label: '认知闭环（规划/记忆/自演化）', on: true },
      { label: '刚体动力学与碰撞', on: false },
      { label: '传感器噪声', on: false },
      { label: '控制延迟', on: false },
      { label: '硬件安全约束', on: false },
    ],
    validates: '在最低物理噪声下，认知闭环能否运转：长程规划、多资源调度、不可逆风险下的经验复用。',
    canProve: 'Memory / Planning / Retry / Self-Evolution 机制本身有效。',
    cannotProve: '不能证明任何关于真实机器人控制与安全的事情。',
  },
  {
    id: 'sim',
    name: 'Simulation',
    icon: '🕹️',
    color: '#27446e',
    envs: 'LIBERO · CALVIN · RoboCasa365（MuJoCo 系）',
    adds: '加回动力学、碰撞检测、持久物理状态与控制延迟',
    factors: [
      { label: '认知闭环（规划/记忆/自演化）', on: true },
      { label: '刚体动力学与碰撞', on: true },
      { label: '传感器噪声', on: false },
      { label: '控制延迟', on: true },
      { label: '硬件安全约束', on: false },
    ],
    validates: '策略执行、失败恢复与语义验证：Final − First 度量验证器能挽救多少原本失败的执行。',
    canProve: '验证 + 恢复对多个 policy backend 都有系统级价值（模型权重未动）。',
    cannotProve: '不能证明硬件噪声下的表现；存在仿真伪影（sim artifact）。',
  },
  {
    id: 'real',
    name: 'Real Robot',
    icon: '🦾',
    color: '#228d5c',
    envs: '工业臂 · 桌面臂 · 双臂 · 四足 · 轮式/双足人形 · 灵巧手（19+ embodiment）',
    adds: '再加硬件噪声、传感器不确定性、通信问题与安全关键约束',
    factors: [
      { label: '认知闭环（规划/记忆/自演化）', on: true },
      { label: '刚体动力学与碰撞', on: true },
      { label: '传感器噪声', on: true },
      { label: '控制延迟', on: true },
      { label: '硬件安全约束', on: true },
    ],
    validates: '协议与适配链能否触达真实硬件；预检拒绝、SafetyGuard 拦截与急停延迟等安全验证。',
    canProve: '同一套协议 + Adapter Chain 可以跨 embodiment 部署；安全机制可以上真机。',
    cannotProve: '当前版本不以大规模任务成功率统计为目标——真机覆盖仍有限。',
  },
];

export const TierLadder: React.FC<WidgetProps> = () => {
  const [tier, setTier] = useState(0);
  const t = TIERS[tier];

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = `当前层级：${t.name}。${t.adds}。`;
  if (tier === 0) {
    tone = '';
    msg = 'Game 层不是「玩具」：它刻意把物理变量隔离掉，让认知闭环成为唯一被研究的对象——这是受控变量实验的起点。';
  } else if (tier === 1) {
    tone = 'info';
    msg = 'Simulation 层加回动力学与延迟：如果 Game 成功而 Sim 失败，问题更可能出在物理执行，而不是高层规划。';
  } else {
    tone = 'good';
    msg = 'Real Robot 层验证集成与安全——但注意：这层的结论是「协议可触达硬件」，不是「大规模任务成功率已验证」。';
  }

  return (
    <div className="lab tl-lab">
      <div className="lab-stage tl-stage">
        <div className="tl-grid">
          {/* 阶梯（从低到高） */}
          <div className="tl-ladder-col" aria-hidden>
            <div className="tl-ladder">
              {TIERS.map((x, i) => (
                <button
                  type="button"
                  key={x.id}
                  className={`tl-ladder-step tl-ladder-step-${i} ${tier === i ? 'is-active' : ''}`}
                  style={{ ['--tier-color' as string]: x.color }}
                  onClick={() => setTier(i)}
                  tabIndex={-1}
                >
                  {x.name}
                </button>
              ))}
            </div>
          </div>

          {/* 层级卡 */}
          <div className="tl-cards">
            {TIERS.map((x, i) => (
              <button
                type="button"
                key={x.id}
                className={`tl-card ${tier === i ? 'is-active' : ''}`}
                style={{ ['--tier-color' as string]: x.color }}
                onClick={() => setTier(i)}
              >
                <span className="tl-tier-icon" aria-hidden>{x.icon}</span>
                <span className="tl-tier-name">{x.name}</span>
                <span className="tl-tier-tag">{x.envs}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 详情 */}
        <div className="tl-detail" key={t.id}>
          <div className="tl-detail-head" style={{ color: t.color }}>
            {t.name} 层 · {t.envs}
          </div>
          <div className="tl-cols">
            <div className="tl-col">
              <div className="tl-col-title">物理因素清单</div>
              {t.factors.map((f) => (
                <div className={`tl-item ${f.on ? 'tone-on' : 'tone-off'}`} key={f.label}>
                  <span aria-hidden>{f.on ? '✓' : '✗'}</span>
                  {f.label}
                </div>
              ))}
            </div>
            <div className="tl-col">
              <div className="tl-col-title">主要检验</div>
              <p className="tl-purpose">{t.validates}</p>
              <div className="tl-where">
                <p>
                  <b className="tone-on">能证明：</b>
                  {t.canProve}
                </p>
                <p>
                  <b className="tone-off">不能证明：</b>
                  {t.cannotProve}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default TierLadder;
