import React, { useState } from 'react';
import changelog from '../../TUTORIAL_CHANGELOG.md?raw';
import type { WidgetProps } from './registry';

const releases = [
  {
    id: 'v055',
    version: 'V0.55',
    alias: '星屑退潮·轻卷萤火姬',
    focus: '烟花消散与主线文本减负',
    modules: ['5.2 烟花生命周期', '5.2 先验扩展资料', '7.1 证据边界折叠', '模块入口短文案', '完整审查信息保留'],
    note: '修复提前重跑后烟花最后一帧残留的问题，让庆祝效果爆发后自然衰减并彻底清空；同时压缩主界面重复说明，把先验解释、教学边界和创新证据移入本节扩展资料。',
  },
  {
    id: 'v054',
    version: 'V0.54',
    alias: '归航星带·无刻领航姬',
    focus: '无时间导航与居中展示布局',
    modules: ['Quick Read 顶部导览条', '八章无时间索引', '正文居中恢复', '目标滚动安全区', '窄屏折叠导航'],
    note: '删除每章时间和总时长提示，把右侧浮动面板重构为顶部横向导览条；正文恢复完整居中宽度，导航只占纵向空间，不再把章节整体向左推移。',
  },
  {
    id: 'v053',
    version: 'V0.53',
    alias: '四分钟星门·演示领航姬',
    focus: 'Quick Read、叙事融入与投屏字号',
    modules: ['Hero 四分钟入口', '八章关键锚点', '1.1 世界状态压力测试', 'Canvas 标签字号', '全教程演示字体'],
    note: '新增可分享的四分钟专家展示模式，每章只链接一个关键落点；移除独立四问罗盘，让问题、意义、作者工作与结果沿系统故事自然出现，并系统提高投屏可读性。',
  },
] as const;

export const HyUpdateLog: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState<(typeof releases)[number]['id']>('v055');
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
