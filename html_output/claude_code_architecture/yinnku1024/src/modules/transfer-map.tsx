import React, { useState } from 'react';
import { Feedback, RW } from './kit';

type Group = 'now' | 'conditional' | 'no';

const ITEMS: { id: string; group: Group; name: string; premise: string; risk: string; check: string }[] = [
  {
    id: 'tools', group: 'now', name: '工具四件套',
    premise: '每个工具自带 schema、权限、执行与渲染。',
    risk: '四件都写会很啰嗦，小团队容易只写执行。',
    check: '先给两个工具补齐四件，看新增工具是否变快。',
  },
  {
    id: 'selector', group: 'now', name: '选择器 + 观察者',
    premise: '一个可变 AppState，加派生选择器和变更副作用。',
    risk: '选择器写错会静默漏更新，需要测试兜底。',
    check: '把全局广播换成一个字段的选择器，数重渲染次数。',
  },
  {
    id: 'lazy', group: 'now', name: '重依赖惰性加载',
    premise: '只把首屏不需要的大模块推到首次使用。',
    risk: '推到首用会把延迟挪到用户最专注的时刻。',
    check: '先只挪一个 ≥400KB 的依赖，测首用路径。',
  },
  {
    id: 'binary', group: 'conditional', name: '单二进制',
    premise: '需要 Bun 生态与可接受的平台矩阵。',
    risk: '换运行时意味着原生扩展、签名、分发都要重做。',
    check: '先在 CI 里产出一个平台的可运行二进制。',
  },
  {
    id: 'ink', group: 'conditional', name: 'React + Ink',
    premise: '团队熟悉 React，且终端界面确实是产品主体。',
    risk: '组件数会迅速膨胀，调试成本高于普通 CLI。',
    check: '用 Ink 重写一个子命令，比较开发与排错时间。',
  },
  {
    id: 'monofile', group: 'no', name: '六件事塞进一个文件',
    premise: '只有在引擎有独立 owner 与完整测试时才成立。',
    risk: '46K 行单文件，合并冲突与新人都被卡住。',
    check: '先按职责拆成六个模块，再决定要不要合并回去。',
  },
  {
    id: 'flags', group: 'no', name: '九组特性开关',
    premise: '需要构建矩阵与发布流程配合。',
    risk: '没有 CI 组合测试，开关会变成“永远关着”的死代码。',
    check: '先做两个开关 × 两种组合的最小矩阵。',
  },
];

const GROUPS: { id: Group; title: string; tone: string; hint: string }[] = [
  { id: 'now', title: '直接可抄', tone: RW.green, hint: '不换栈就能做' },
  { id: 'conditional', title: '有条件可抄', tone: RW.orange, hint: '先付迁移成本' },
  { id: 'no', title: '不建议照搬', tone: RW.red, hint: '收益依赖团队规模' },
];

/* 我的思考：把文档里的架构拆成“能不能搬到自己项目”的三堆，
   每一条都写清前提、风险和最小验证。 */
export function TransferMap() {
  const [active, setActive] = useState('tools');
  const item = ITEMS.find(entry => entry.id === active)!;

  return (
    <div className="rw" style={{ gridTemplateRows: 'minmax(0, 1fr) auto', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, minHeight: 0 }}>
        {GROUPS.map(group => (
          <div key={group.id} className="rw-card" style={{ borderLeftColor: group.tone, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <p className="rw-h" style={{ color: group.tone }}>{group.title}</p>
              <p className="rw-t rw-muted" style={{ fontSize: 26 }}>{group.hint}</p>
            </div>
            {ITEMS.filter(entry => entry.group === group.id).map(entry => (
              <button key={entry.id} type="button" className="rw-btn"
                aria-pressed={active === entry.id} onClick={() => setActive(entry.id)}
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}>
                {entry.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="rw-card rw-card--plain" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr 1fr', gap: 16 }}>
        <div>
          <p className="rw-t rw-muted">前提</p>
          <p className="rw-t rw-t--tight">{item.premise}</p>
        </div>
        <div>
          <p className="rw-t rw-muted">风险</p>
          <p className="rw-t rw-t--tight">{item.risk}</p>
        </div>
        <div>
          <p className="rw-t rw-muted">最小验证</p>
          <p className="rw-t rw-t--tight">{item.check}</p>
        </div>
      </div>
    </div>
  );
}
