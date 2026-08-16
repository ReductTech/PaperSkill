import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MiniFile, StateBadge } from './colleague-ui';

type Storage = 'local' | 'cloud';
type Sharing = 'private' | 'public';
export const PrivacyLab: React.FC<WidgetProps> = () => {
  const [consent, setConsent] = useState(false);
  const [rights, setRights] = useState(false);
  const [storage, setStorage] = useState<Storage>('local');
  const [sharing, setSharing] = useState<Sharing>('private');
  const [retention, setRetention] = useState('30d');
  const [deleted, setDeleted] = useState(false);
  const blocked = sharing === 'public' && (!consent || !rights);
  const setShare = (value: Sharing) => { setSharing(value); setDeleted(false); };
  return <div className="paper-widget privacy-lab">
    <div className={`skill-vault${blocked ? ' blocked' : ''}${deleted ? ' deleted' : ''}`}>
      <header><span aria-hidden="true">{deleted ? '○' : blocked ? '⊘' : '▣'}</span><div><b>Relationship Skill Vault</b><small>{deleted ? '本地工件已删除' : storage === 'local' ? '本地持有' : '云端存储（需额外审查）'}</small></div><StateBadge tone={deleted ? 'bad' : blocked ? 'bad' : 'good'}>{deleted ? '已删除' : blocked ? '发布被阻止' : '受控'}</StateBadge></header>
      {!deleted && <div className="vault-files"><MiniFile name="SKILL.md" active tone="green" /><MiniFile name="private traces" active tone="purple" /><MiniFile name="meta.json" active tone="blue" /></div>}
    </div>
    <div className="governance-controls">
      <label><span>参与与同意</span><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setDeleted(false); }} /><b>{consent ? '已确认' : '未确认'}</b></label>
      <label><span>来源/发布权利</span><input type="checkbox" checked={rights} onChange={e => { setRights(e.target.checked); setDeleted(false); }} /><b>{rights ? '已确认' : '未确认'}</b></label>
      <div><span>存储</span><div role="group"><button className={`chip ${storage === 'local' ? 'active' : ''}`} onClick={() => setStorage('local')}>本地</button><button className={`chip ${storage === 'cloud' ? 'active' : ''}`} onClick={() => setStorage('cloud')}>云端</button></div></div>
      <div><span>分享</span><div role="group"><button className={`chip ${sharing === 'private' ? 'active' : ''}`} onClick={() => setShare('private')}>私有</button><button className={`chip ${sharing === 'public' ? 'active' : ''}`} onClick={() => setShare('public')}>公开</button></div></div>
      <div><span>保留期限</span><div role="group">{['7d', '30d', '1y'].map(value => <button key={value} className={`chip ${retention === value ? 'active' : ''}`} onClick={() => setRetention(value)}>{value}</button>)}</div></div>
    </div>
    <div className="vault-actions"><button className="chip" disabled={deleted}>编辑规则</button><button className="danger-button" onClick={() => setDeleted(true)} disabled={deleted}>删除本地工件</button></div>
    <div className={`feedback ${blocked || deleted ? 'bad' : 'good'}`}>{deleted ? '本地工件已在此演示状态中移除。真实系统还需要依法完成备份、日志与完全删改审查。' : blocked ? 'Publishing blocked：同意或来源权利尚未解决。技术开关不能替代法律与伦理审查。' : sharing === 'private' && storage === 'local' ? 'LOCAL + PRIVATE 是敏感关系预设的默认起点。' : '当前组合可继续评估，但仍需访问控制、留存与非强制使用审查。'}</div>
  </div>;
};

export default PrivacyLab;
