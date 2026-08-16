import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Minimality = 'code' | 'interface';

export const ModArch: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<Minimality>('code');
  return (
    <div className="minimal-architecture">
      <div className="minimal-metrics">
        <button className={selected === 'code' ? 'active' : ''} onClick={() => setSelected('code')}><small>GA CORE CODEBASE</small><b>≈ 3,300</b><span>lines of code</span></button>
        <button className={selected === 'code' ? 'active' : ''} onClick={() => setSelected('code')}><small>CENTRAL AGENT LOOP</small><b>92</b><span>lines of code</span></button>
        <button className={selected === 'interface' ? 'active' : ''} onClick={() => setSelected('interface')}><small>NATIVE EXECUTION SURFACE</small><b>CLI</b><span>single interface</span></button>
      </div>
      <div className="minimal-core">
        <section className={selected === 'code' ? 'active' : ''}>
          <span>CODE MINIMALITY</span><h4>核心逻辑足够小</h4>
          <p>约 3,300 行核心代码、92 行中央 Agent Loop；无需重型模块依赖或复杂工具注册基础设施，因此更容易维护、调试和扩展。</p>
        </section>
        <i>+</i>
        <section className={selected === 'interface' ? 'active' : ''}>
          <span>INTERFACE MINIMALITY</span><h4>CLI 就是原生执行界面</h4>
          <p>任务提交、后台运行、进度监控与运行时介入都通过同一个自托管 CLI；不需要 plugin framework、event bus 或专用 orchestration layer。</p>
        </section>
      </div>
      <div className="minimal-emergence"><span>一个稳定原语</span><b>标准进程调用 GA CLI</b><i>→</i><strong>通过组合产生更高层能力</strong></div>
      <div className="feedback">极简不是实验指标上的“越少越好”，而是论文第 3 节解释组合能力为何不需要扩展核心架构的前提。</div>
    </div>
  );
};
