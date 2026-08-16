import React, { useState } from 'react';
import changelog from '../../TUTORIAL_CHANGELOG.md?raw';
import type { WidgetProps } from './registry';

const releases = [
  {
    id: 'v058',
    version: 'V0.58',
    alias: '启程星册·首章导览姬',
    focus: '速览从封面归位第一章',
    modules: ['1.0 全文速览', '首章专家导航入口', 'Hero 封面减负', 'quick-overview 锚点迁移', '组件职责拆分'],
    note: '把全文概述和快速展示入口从 Hero 移到第一章最前端，封面恢复为纯粹的论文定位与新旧方法对照；Quick Read 固定导航仍保留完整八站论证链。',
  },
  {
    id: 'v057',
    version: 'V0.57',
    alias: '一屏星图·极速讲解姬',
    focus: '全文总览与完整专家论证链',
    modules: ['Hero 全文最快概述', '五组件系统链', 'Quick Read 总览首站', '八个论证落点', '组件与证据提示'],
    note: '新增一屏论文总览，用问题、路线、产物和五组件链直接解释整篇工作；重排专家导航为“总览、生成、一致性、训练、重建、资产、证据、边界”，每个落点同时显示对应组件或表格。',
  },
  {
    id: 'v056',
    version: 'V0.56',
    alias: '破幻星钥·诚实接口姬',
    focus: '删除无结果差异的先验开关',
    modules: ['5.2 Pose/K/Depth 静态接口', '5.2 单一共享前向', 'Table 11 双端点边界', '无效状态清理', '输入规则响应式布局'],
    note: '确认旧版 Pose、K、Depth 选择只改变高亮路径，不改变五头随机结果后，删除三个点击开关及其状态；可选先验改为静态接口说明，模块只保留共享前向与输出巡检这一项有意义的主操作。',
  },
] as const;

export const HyUpdateLog: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState<(typeof releases)[number]['id']>('v058');
  const selected = releases.find((release) => release.id === selectedId) ?? releases[0];

  return <div className="update-log-lab">
    <div className="learning-contract">
      <div><span>为什么展示</span><p>说明每轮修改解决了什么问题。</p></div>
      <div><span>本次操作</span><p>切换最近版本；需要时展开完整日志。</p></div>
      <div><span>应得判断</span><p>版本号对应可复查的模块变化。</p></div>
    </div>

    <section className="update-log-stage">
      <header><div><span>版本星轨</span><strong>最近三次大型更新</strong></div><small>点击版本卡切换演示重点</small></header>
      <div className="update-log-track" role="tablist" aria-label="选择教程版本">
        {releases.map((release, index) => <React.Fragment key={release.id}>
          <button type="button" role="tab" aria-selected={selected.id === release.id} className={selected.id === release.id ? 'selected' : ''} onClick={() => setSelectedId(release.id)}>
            <span>{release.version}</span><strong>{release.alias}</strong><small>{release.focus}</small>
          </button>
          {index < releases.length - 1 ? <i aria-hidden="true">←</i> : null}
        </React.Fragment>)}
      </div>
      <article className="update-log-focus" aria-live="polite">
        <header><div><span>{selected.version}</span><h5>{selected.alias}</h5></div><strong>{selected.focus}</strong></header>
        <p>{selected.note}</p>
        <div>{selected.modules.map((module) => <span key={module}>{module}</span>)}</div>
      </article>
    </section>

    <details className="update-log-full">
      <summary><div><strong>展开完整 TUTORIAL_CHANGELOG.md</strong><small>灰色提示：点击后可查看从 V0.1 至今的逐模块修改、验证结果与审查重点</small></div><b>完整记录</b></summary>
      <pre>{changelog}</pre>
    </details>
  </div>;
};

export default HyUpdateLog;
