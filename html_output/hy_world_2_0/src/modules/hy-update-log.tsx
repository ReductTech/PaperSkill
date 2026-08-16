import React, { useState } from 'react';
import changelog from '../../TUTORIAL_CHANGELOG.md?raw';
import type { WidgetProps } from './registry';

const releases = [
  {
    id: 'v053',
    version: 'V0.53',
    alias: '四分钟星门·演示领航姬',
    focus: 'Quick Read、叙事融入与投屏字号',
    modules: ['Hero 四分钟入口', '八章关键锚点', '1.1 世界状态压力测试', 'Canvas 标签字号', '全教程演示字体'],
    note: '新增可分享的四分钟专家展示模式，每章只链接一个关键落点；移除独立四问罗盘，让问题、意义、作者工作与结果沿系统故事自然出现，并系统提高投屏可读性。',
  },
  {
    id: 'v052',
    version: 'V0.52',
    alias: '起源星图·论证导航姬',
    focus: '背景前置、贡献证据与逐篇评论',
    modules: ['1.1 四问阅读罗盘', '八章论证顺序', '7.1 作者工作证据链', '8.1 官方功能展示', '8.1 逐篇第三方评论'],
    note: '把教程从模块百科重排为论文论证：先讲为何重要和作者做了什么，再用方法、实验、官方功能与署名评论逐层验证。',
  },
  {
    id: 'v051',
    version: 'V0.51',
    alias: '轻装星卷·花火终端姬',
    focus: '信息减负、演示字号与五头可视巡检',
    modules: ['全教程信息层级', '本节扩展资料', '演示字体下限', '5.2 五头候选画布', '5.2 全绿烟花预览'],
    note: '把主线压缩为现场能讲清的判断，把证据与术语留在按需展开区，并修复五个输出头和烟花实际绘制却不可见的问题。',
  },
] as const;

export const HyUpdateLog: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState<(typeof releases)[number]['id']>('v053');
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
