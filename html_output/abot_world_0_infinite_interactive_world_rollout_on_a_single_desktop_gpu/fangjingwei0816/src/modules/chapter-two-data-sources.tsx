import { useState } from 'react';
import type { WidgetProps } from './registry';

type SourceId = 'game' | 'simulation' | 'internet';

const sources: Record<SourceId, {
  name: string;
  keyword: string;
  givesLead: string;
  gives: string;
  lacksLead: string;
  lacks: string;
}> = {
  game: {
    name: '游戏数据',
    keyword: '准',
    givesLead: '原生同步动作真值',
    gives: '运行时 API 直接记录控制信号，并与每一帧视频同步；论文将其视为三源中质量最高的动作监督。',
    lacksLead: '世界与风格覆盖有限',
    lacks: '数据仍受具体游戏作品与视觉风格限制，不能单独覆盖真实世界里的多样动态。',
  },
  simulation: {
    name: '仿真数据',
    keyword: '可控',
    givesLead: '标签确定、轨迹与场景可控',
    gives: '轨迹可按目标设计，环境参数可以控制；动作标签由轨迹确定地导出并逐帧对齐。',
    lacksLead: '仍有合成域差异',
    lacks: '合成环境难以完全复制互联网视频里的真实光照、自然相机动态与域泛化信号。',
  },
  internet: {
    name: '互联网视频',
    keyword: '广',
    givesLead: '真实世界视觉多样性',
    gives: '提供自然相机动态、真实光照变化，以及合成环境难以复现的真实世界分布。',
    lacksLead: '没有原生动作真值',
    lacks: '论文先估计 6-DoF 相机轨迹，再由位移投影与阈值化得到逐帧伪动作标签；这些标签带有估计噪声。',
  },
};

const sourceOrder: SourceId[] = ['game', 'simulation', 'internet'];

export function ChapterTwoDataSources(_props: WidgetProps) {
  const [activeSource, setActiveSource] = useState<SourceId>('game');
  const active = sources[activeSource];

  return (
    <section className="chapter-two-data-sources" aria-label="三源数据互补与统一处理流程">
      <div className="source-switch" role="tablist" aria-label="切换数据来源">
        {sourceOrder.map((id) => {
          const source = sources[id];
          const isActive = id === activeSource;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="source-complement-panel"
              className={isActive ? 'active' : ''}
              onClick={() => setActiveSource(id)}
            >
              <span>{source.name}</span>
              <strong>{source.keyword}</strong>
            </button>
          );
        })}
      </div>

      <div
        id="source-complement-panel"
        className="source-complement-panel"
        role="tabpanel"
        data-active-source={activeSource}
      >
        <header>
          <span>当前来源</span>
          <strong>{active.name}</strong>
          <i>{active.keyword}</i>
        </header>
        <div className="source-complement-grid">
          <div className="source-gives">
            <span>它提供什么</span>
            <strong>{active.givesLead}</strong>
            <p>{active.gives}</p>
          </div>
          <div className="source-lacks">
            <span>它缺少什么</span>
            <strong>{active.lacksLead}</strong>
            <p>{active.lacks}</p>
          </div>
        </div>
      </div>

      <div className="data-unification" aria-label="数据处理流水线">
        <div className="data-pipeline">
          <div className="pipeline-sources">
            {([
              ['game', '游戏'],
              ['simulation', '仿真'],
              ['internet', '互联网视频'],
            ] as const).map(([id, label]) => (
              <span key={id} className={activeSource === id ? 'active' : ''}>{label}</span>
            ))}
          </div>
          <b aria-hidden="true">→</b>
          <div className="pipeline-node">
            <small>表示对齐</small>
            <strong>统一动作 / 标签格式</strong>
            <span>保留原生信号，并映射到共同动作空间</span>
          </div>
          <b aria-hidden="true">→</b>
          <div className="pipeline-node quality">
            <small>质量控制</small>
            <strong>14 项检查 · 6 个质量维度</strong>
            <span>确定性检查 + VLM 语义评估</span>
          </div>
          <b aria-hidden="true">→</b>
          <div className="pipeline-node ready">
            <small>过滤与标注后</small>
            <strong>可训练数据</strong>
            <span>动作、文本与语义标签</span>
          </div>
          <b aria-hidden="true">→</b>
          <div className="pipeline-model">
            <small>训练</small>
            <strong>ABot-World-0</strong>
          </div>
        </div>

        <div className="collection-feedback">
          <span>训练评估</span>
          <b aria-hidden="true">↺</b>
          <strong>发现薄弱的场景—动作分布后，WorldExplorer 定向调整游戏 / 仿真采集</strong>
          <small>论文明确的训练反馈回环；不用于被动的互联网视频采集。</small>
        </div>
      </div>

      <div className="chapter-two-summary">
        <p>“ABot-World-0 不是寻找一种完美数据源，而是让游戏、仿真和互联网视频各自提供最擅长的部分，再统一成可训练的动作条件数据。”</p>
      </div>
    </section>
  );
}
