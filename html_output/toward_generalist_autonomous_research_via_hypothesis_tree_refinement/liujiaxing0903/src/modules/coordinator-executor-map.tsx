import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const ROLES = [
  {
    key: 'coordinator',
    label: '协调器',
    en: 'Coordinator',
    owns: 'Tree Store · Mbest 引用 · 前沿与洞见',
    allow: '选择固定假设、更新共享树、派发执行任务',
    forbid: '直接编辑候选制品',
  },
  {
    key: 'executor',
    label: '执行器',
    en: 'Executor',
    owns: '固定假设 · Mbest 快照 · Edev · 新隔离 worktree',
    allow: '实现假设、反复调用 Edev、返回结构化证据',
    forbid: '修改共享树、读取兄弟分支状态或调用 Etest',
  },
  {
    key: 'gate',
    label: '留出门',
    en: 'Held-out Gate',
    owns: "Etest · 候选 M' · 当前 Mbest",
    allow: '仅在 Decide 比较留出目标值并决定是否替换 Mbest',
    forbid: '向 Explore 返回搜索提示',
  },
] as const;

export const CoordinatorExecutorMap: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const role = ROLES[active];

  return (
    <div className="role-boundary-lab">
      <div className="role-boundary-heading">
        <strong>两类智能体与一个门控组件，权限严格分开</strong>
        <span>资源归属示意，不表示组件按一条严格线性流水线依次运行。</span>
      </div>

      <div className="role-map-grid" role="group" aria-label="选择系统组件">
        {ROLES.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 ? <span className="role-map-arrow" aria-hidden="true">→</span> : null}
            <button
              type="button"
              className={`role-map-card role-${item.key} ${active === index ? 'is-active' : ''}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              <span className="role-map-title">{item.label}</span>
              <span className="role-map-en">{item.en}</span>
              <span className="role-map-owner">{item.owns}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className={`role-permission-panel role-${role.key}`} aria-live="polite">
        <strong>{role.label}</strong>
        <span className="role-permission-allow">允许：{role.allow}</span>
        <span className="role-permission-forbid">禁止：{role.forbid}</span>
      </div>

      <p className="role-worktree-rule">
        <strong>论文不变量：</strong>每个执行器接收一条固定假设，并从当前 Mbest 创建新的隔离 git worktree；执行器不能修改共享树，也不能调用 Etest。
      </p>
    </div>
  );
};

export default CoordinatorExecutorMap;
