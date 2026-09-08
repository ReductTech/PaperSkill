import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type CapabilityId = 'subagent' | 'reflect' | 'watchdog' | 'scheduled';
const CAPABILITIES: Record<CapabilityId, { name: string; level: string; trigger: string; path: string[]; point: string }> = {
  subagent: {
    name: 'Subagent Dispatch', level: 'COMPOSITIONAL CAPABILITY', trigger: '父 Agent 发出普通 CLI 命令',
    path: ['启动多个独立 GA 进程', '每个进程维护独立内存与会话', '父进程合并结果'],
    point: '子智能体不是特殊对象，也不需要专用 manager；标准进程天然带来上下文隔离，并形成 map–reduce。',
  },
  reflect: {
    name: 'Reflect Mode', level: 'COMPOSITIONAL CAPABILITY', trigger: '外部 callback 周期检查条件',
    path: ['条件返回非空字符串', '字符串作为普通任务注入', '稳定 Agent Loop 执行'],
    point: '外部脚本决定“何时创建工作”，GA 核心只负责“如何执行”，触发逻辑与执行逻辑严格分离。',
  },
  watchdog: {
    name: 'Watchdog', level: 'REFLECT APPLICATION', trigger: '检测文件、环境或错误日志变化',
    path: ['变化发生', 'Watchdog 规则命中', '立即提交 GA 任务'],
    point: 'Watchdog 是 Reflect Mode 的事件触发实例，不是新的执行器或核心架构层。',
  },
  scheduled: {
    name: 'Scheduled Task', level: 'REFLECT APPLICATION', trigger: '时间规则达到指定间隔或时刻',
    path: ['时间条件满足', '定时脚本生成任务', '提交同一个 GA CLI'],
    point: '它与 Watchdog 共享同一机制，只是外部 trigger rule 从环境变化换成了时间。',
  },
};

export const ModCapabilities: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<CapabilityId>('subagent');
  const current = CAPABILITIES[selected];
  return (
    <div className="capability-explorer">
      <div className="capability-levels">
        <div><span>2 个高层能力</span><b>Subagent Dispatch · Reflect Mode</b></div>
        <i>→</i>
        <div><span>Reflect 的 2 个应用</span><b>Watchdog · Scheduled Task</b></div>
      </div>
      <div className="capability-tabs">
        {(Object.keys(CAPABILITIES) as CapabilityId[]).map((id) => (
          <button key={id} className={selected === id ? 'active' : ''} onClick={() => setSelected(id)}>
            <small>{CAPABILITIES[id].level}</small><b>{CAPABILITIES[id].name}</b>
          </button>
        ))}
      </div>
      <section className="capability-detail" aria-live="polite">
        <header><div><small>{current.level}</small><h4>{current.name}</h4></div><span>{current.trigger}</span></header>
        <div className="capability-path">
          {current.path.map((step, index) => <React.Fragment key={step}><b>{step}</b>{index < current.path.length - 1 ? <i>→</i> : null}</React.Fragment>)}
        </div>
        <p>{current.point}</p>
      </section>
      <div className="feedback good">四个条目共用同一个原生 CLI 和 Agent Loop；新增的是组合方式或外部触发规则，不是核心运行时子系统。</div>
    </div>
  );
};
