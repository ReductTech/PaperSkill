import React, { useState } from 'react';
import changelog from '../../TUTORIAL_CHANGELOG.md?raw';
import type { WidgetProps } from './registry';

const releases = [
  {
    id: 'v049',
    version: 'V0.49',
    alias: '镜界巡检·星图映写姬',
    focus: '结构图、资产放大镜与演示收束',
    modules: ['1.2/1.3 标签与任务卡', '2.1/2.2/2.3 空间表达', '5.2 多头巡检结构图', '6.1 3DGS 双放大镜', '7.2/7.3 比较视图', '8.2 更新日志'],
    note: '把难以读懂的交互改成能沿着一条视觉路径讲完的演示版本。',
  },
  {
    id: 'v048',
    version: 'V0.48',
    alias: '万象归航·星图验收姬',
    focus: '统一初始状态、二维数据地图与证据资料库',
    modules: ['2.2 数据分布地图', '2.3 WorldNav 规划', '5.2 分阶段重建', '7.3 工程记录', '8.1 结论资料库'],
    note: '建立统一的审查边界，并把全文从十章收束为八章。',
  },
  {
    id: 'v047',
    version: 'V0.47',
    alias: '星轨校准·镜界巡游使',
    focus: '曲线相机、全景故障与跨论文效率调研',
    modules: ['1.2 曲线关键帧', '2.1 全景故障擦除', '2.3 候选淘汰', '3.2 SSM++', '7.3 效率资料'],
    note: '把轨迹、故障症状和工程记录重新绑定到可核查的视觉证据。',
  },
] as const;

export const HyUpdateLog: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState<(typeof releases)[number]['id']>('v049');
  const selected = releases.find((release) => release.id === selectedId) ?? releases[0];

  return <div className="update-log-lab">
    <div className="learning-contract">
      <div><span>为什么展示</span><p>现场演示不只需要最终页面，也需要说明每轮修改具体解决了什么问题。</p></div>
      <div><span>本次操作</span><p>切换最近三个版本，查看别名、重点模块和审查目标；需要追溯时再展开完整日志。</p></div>
      <div><span>应得判断</span><p>版本号对应可复查的模块变化，萌系别名只帮助记忆，不替代事实、验证结果和边界记录。</p></div>
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
