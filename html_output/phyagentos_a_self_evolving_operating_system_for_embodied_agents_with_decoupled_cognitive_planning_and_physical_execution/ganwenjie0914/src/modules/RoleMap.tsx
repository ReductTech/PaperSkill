import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 1.1 — Embodied AI Role Map。
// 点击任务链上的环节，看哪个组件认领它；「验证结果」与「记录经验」
// 两步无人认领，引出论文的核心问题：缺的是系统层，不是第 4 个模型。

type RoleId = 'vla' | 'worldmodel' | 'agent' | 'ros';

interface RoleDef {
  id: RoleId;
  name: string;
  sub: string;
  icon: string;
  can: string;
  not: string;
}

const ROLES: RoleDef[] = [
  {
    id: 'vla',
    name: 'VLA 模型',
    sub: 'Vision-Language-Action',
    icon: '👁️',
    can: '根据视觉与语言直接生成动作：末端位姿、关节量或动作块。',
    not: '不判断任务语义是否达成，不管理经验与权限。',
  },
  {
    id: 'worldmodel',
    name: '世界模型',
    sub: 'World Model',
    icon: '🔮',
    can: '预测「执行某个动作之后世界可能变成什么样」，支持预演与风险评估。',
    not: '不管动作是否有权限执行，也不承担执行契约与验收。',
  },
  {
    id: 'agent',
    name: 'Agent',
    sub: 'Agentic Planner',
    icon: '🧠',
    can: '理解高层任务、分解目标、选择工具、长程规划。',
    not: '不直接驱动机器人：不碰电机级控制，也不验证物理结果。',
  },
  {
    id: 'ros',
    name: 'ROS / 控制器',
    sub: 'Middleware · Control',
    icon: '⚙️',
    can: '节点通信、硬件抽象，忠实执行轨迹并驱动执行器。',
    not: '不知道任务目标是什么：只回答「指令是否被忠实执行」。',
  },
];

interface StepDef {
  label: string;
  icon: string;
  owners: RoleId[];
  note: string;
}

const STEPS: StepDef[] = [
  {
    label: '看见环境',
    icon: '📷',
    owners: ['ros'],
    note: '传感器数据与相机驱动经由 ROS 接口与感知管线进入系统——这一步有人认领。',
  },
  {
    label: '理解任务',
    icon: '💬',
    owners: ['agent'],
    note: '「把杯子放进柜子」由 Agent 解析为目标、约束与接受标准。',
  },
  {
    label: '规划步骤',
    icon: '🗺️',
    owners: ['agent'],
    note: '分解为靠近 → 抓取 → 移动 → 放入等子目标，并选择工具与技能。',
  },
  {
    label: '预测未来',
    icon: '🔮',
    owners: ['worldmodel'],
    note: '世界模型可以预演「这样抓会不会碰倒杯子」——但预测不等于验证。',
  },
  {
    label: '生成动作',
    icon: '🦾',
    owners: ['vla'],
    note: 'VLA 把图像与指令直接映射为动作或动作块。',
  },
  {
    label: '执行动作',
    icon: '🔩',
    owners: ['ros'],
    note: '控制器按指令驱动电机，并报告「轨迹在容差内完成」。',
  },
  {
    label: '验证结果',
    icon: '✅',
    owners: [],
    note: '控制器只知指令执行完毕；Agent 不看物理世界；世界模型只做预测——没有人核对「杯子是否真的被抓住」。',
  },
  {
    label: '记录并复用经验',
    icon: '📚',
    owners: [],
    note: '这次调好的抓取角度存在哪里？下次相似杯子从哪里检索？组件堆叠里同样没有 owner。',
  },
];

export const RoleMap: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<number | null>(null);
  const [visitedUnowned, setVisitedUnowned] = useState(false);
  const step = active === null ? null : STEPS[active];
  const unownedVisited =
    active !== null && STEPS[active].owners.length === 0;
  const revealed = active !== null && STEPS.some((s, i) => s.owners.length === 0 && i === active);

  const pick = (i: number) => {
    setActive(i);
    if (STEPS[i].owners.length === 0) setVisitedUnowned(true);
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '点击左侧任务链上的任意环节：右侧高亮认领它的组件。留意最后两步。';
  if (step) {
    if (step.owners.length > 0) {
      tone = 'good';
      msg = step.note;
    } else {
      tone = 'bad';
      msg = step.note;
    }
  }

  return (
    <div className="lab role-map-lab">
      <div className="role-map">
        <div className="role-map-steps" role="group" aria-label="任务链环节">
          {STEPS.map((s, i) => {
            const owned = s.owners.length > 0;
            const isActive = active === i;
            return (
              <button
                type="button"
                key={s.label}
                className={`role-step ${isActive ? 'is-active' : ''} ${!owned ? 'is-unowned' : ''}`}
                onClick={() => pick(i)}
              >
                <span className="role-step-icon" aria-hidden>{s.icon}</span>
                <span className="role-step-label">{s.label}</span>
                <span className={`role-step-state ${owned ? '' : 'is-missing'}`}>
                  {owned ? '已认领' : 'No owner'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="role-map-roles" role="group" aria-label="系统组件">
          {ROLES.map((r) => {
            const isOwner = step ? step.owners.includes(r.id) : false;
            return (
              <div className={`role-card ${isOwner ? 'is-owner' : ''}`} key={r.id}>
                <div className="role-card-head">
                  <span aria-hidden>{r.icon}</span>
                  <b>{r.name}</b>
                  <span className="role-card-sub">{r.sub}</span>
                  {isOwner ? <span className="role-owner-badge">认领 ✓</span> : null}
                </div>
                <p className="role-card-can">{r.can}</p>
                <p className="role-card-not">{r.not}</p>
              </div>
            );
          })}
          <div className={`role-card role-card-missing ${revealed ? 'is-owner' : ''}`}>
            <div className="role-card-head">
              <span aria-hidden>❓</span>
              <b>??? —— 运行时 / OS 层</b>
              {revealed ? <span className="role-owner-badge is-missing">缺失</span> : null}
            </div>
            <p className="role-card-can">
              {revealed
                ? '本应负责：统一状态、会话调度、语义验证、经验沉淀、安全监督——论文认为缺失的正是这一层。'
                : '当出现「No owner」的环节时，这里会亮起来。'}
            </p>
            <p className="role-card-not">它不产生动作本身：动作仍由 VLA 与控制器给出。</p>
          </div>
        </div>
      </div>

      {visitedUnowned ? (
        <div className="role-map-conclusion">
          两个「No owner」环节指向同一个结论：<b>缺的不是另一个更聪明的模型，而是管理这些模型如何可靠协作的系统层。</b>
        </div>
      ) : null}

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default RoleMap;
