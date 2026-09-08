import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MiniFile, StateBadge } from './colleague-ui';

type Route = 'local' | 'host' | 'gallery';
const counters = [
  ['GitHub stars', '~18.5k'], ['forks', '~1.8k'], ['commits', '104'], ['gallery skills', '215'], ['meta-skills', '55'], ['contributors', '165'], ['cumulative gallery stars', '>100k'],
];

export const DeploymentClaims: React.FC<WidgetProps> = () => {
  const [route, setRoute] = useState<Route>('local');
  const [rights, setRights] = useState(false);
  const [review, setReview] = useState(false);
  const [metadata, setMetadata] = useState(true);
  const [disclaimer, setDisclaimer] = useState(false);
  const [showCounters, setShowCounters] = useState(false);
  const galleryReady = rights && review && metadata && disclaimer;
  const blocked = route === 'gallery' && !galleryReady;
  const routeText = route === 'local' ? '本地保存：私有、可编辑、可删除。' : route === 'host' ? '安装到兼容 Agent Host；入口由 manifest 描述。' : galleryReady ? 'Gallery 条件已满足，可以进入人工发布流程。' : 'Gallery 发布被阻止：仍有前置条件未满足。';
  return <div className="paper-widget deployment-claims">
    <div className="deployment-route">
      <div className="generated-skill"><MiniFile name="Generated Skill" active tone="green" /></div>
      <div className="route-options" role="group" aria-label="部署路线">
        <button className={route === 'local' ? 'active' : ''} onClick={() => setRoute('local')}><span aria-hidden="true">⌂</span><b>留在本地</b><small>私有 · 可删</small></button>
        <button className={route === 'host' ? 'active' : ''} onClick={() => setRoute('host')}><span aria-hidden="true">◇</span><b>安装到 Host</b><small>manifest → install</small></button>
        <button className={`${route === 'gallery' ? 'active' : ''}${blocked ? ' blocked' : ''}`} onClick={() => setRoute('gallery')}><span aria-hidden="true">▦</span><b>提交 Gallery</b><small>opt-in · review</small></button>
      </div>
    </div>
    {route === 'gallery' && <div className="gallery-gates"><b>发布前检查</b>{[
      ['来源/发布权利', rights, setRights], ['人工审核', review, setReview], ['元数据完整', metadata, setMetadata], ['边界免责声明', disclaimer, setDisclaimer],
    ].map(([label, value, setter]) => <label key={label as string}><input type="checkbox" checked={value as boolean} onChange={e => (setter as React.Dispatch<React.SetStateAction<boolean>>)(e.target.checked)} /><span>{label as string}</span><b>{value ? '✓' : '待确认'}</b></label>)}</div>}
    <div className={`route-verdict ${blocked ? 'blocked' : ''}`}><StateBadge tone={blocked ? 'bad' : 'good'}>{blocked ? 'Blocked' : 'Ready'}</StateBadge><b>{routeText}</b></div>
    <div className="counter-disclosure"><button className="chip" onClick={() => setShowCounters(!showCounters)}>{showCounters ? '收起公开计数' : '查看 2026-05-28 公开计数'}</button><strong>分发信号 ≠ 任务性能 ≠ 行为保真</strong></div>
    {showCounters && <div className="counter-grid">{counters.map(([label, value]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>}
    <div className={`feedback ${blocked ? 'bad' : 'good'}`}>{blocked ? '公开分发需要额外权利、审核、元数据和免责声明；生成成功不等于允许发布。' : showCounters ? '这些数字只说明仓库、Gallery 与社区的公开分发表面，论文明确不把它们当作效果证据。' : '一个技能可以留在本地、安装到宿主，或在权利允许时进入可控分发。'}</div>
  </div>;
};

export default DeploymentClaims;
