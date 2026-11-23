import React, { useState } from 'react';
import { CodeChip, MosaicArtwork, StageBadge, StudioPanel } from './glc-kit';

const rows = [
  { id: 'read', title: '精读正文与补充材料', detail: '核对问题、结构、训练、消融和限制' },
  { id: 'formula', title: '公式与符号审计', detail: '检查式 (1)–(8) 的变量、权重与条件' },
  { id: 'protocol', title: '结果口径核对', detail: '分离 bpp、BD-Rate、FID、DISTS 的方向' },
  { id: 'interaction', title: '交互式机制复现', detail: '实现预算、超先验、码预测与失败边界' },
  { id: 'report', title: '学习报告与批判性分析', detail: '整理复现边界、局限与后续实验方案' },
  { id: 'train', title: '重新训练完整 GLC', detail: '未复现数据准备、三阶段训练和评测' }
];

export function GlcReproduce() {
  const [checked, setChecked] = useState(() => new Set(['read', 'formula', 'protocol', 'interaction', 'report']));
  const toggle = (id: string) => setChecked(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const training = checked.has('train');
  return <div className="glc-scene glc-reproduce-page">
    <StudioPanel className="glc-audit-board" tone="blue">
      <div className="glc-audit-head">
        <div><StageBadge tone="blue">本章工作量</StageBadge><h3>我实际完成了什么</h3></div>
        <CodeChip tone={training ? 'green' : 'orange'}>{checked.size}/6 项</CodeChip>
      </div>
      <div className="glc-audit-list">
        {rows.map(row => <button key={row.id} className={`glc-audit-row ${checked.has(row.id) ? 'is-checked' : ''} ${row.id === 'train' ? 'is-training' : ''}`}
          onClick={() => toggle(row.id)} aria-pressed={checked.has(row.id)}>
          <span className="glc-checkbox" aria-hidden="true">{checked.has(row.id) ? '✓' : ''}</span>
          <span><b>{row.title}</b><small>{row.detail}</small></span>
          <i>{row.id === 'train' ? (checked.has(row.id) ? '声明已做' : '未做') : (checked.has(row.id) ? '完成' : '未勾选')}</i>
        </button>)}
      </div>
    </StudioPanel>
    <aside className="glc-reproduce-side">
      <StudioPanel className="glc-honest-card" tone={training ? 'green' : 'orange'}>
        <div className="glc-card-title"><span>复现边界</span><CodeChip tone={training ? 'green' : 'orange'}>{training ? '已声明训练' : '未训练完整模型'}</CodeChip></div>
        <p>{training
          ? '若声称完成训练，还需给出数据划分、训练日志、随机种子、算力环境和同协议评测。'
          : '本轮没有重新训练 VQ-VAE、潜空间变换编码器或生成解码器，也没有产出新的 benchmark 曲线。'}</p>
        <div className="glc-boundary-list">
          <span>已完成</span><b>论文理解、公式核对、交互机制、结果口径、报告</b>
          <span>未完成</span><b>数据复现、三阶段训练、独立评测</b>
        </div>
      </StudioPanel>
      <StudioPanel className="glc-workload-visual" tone="purple">
        <MosaicArtwork detail={checked.size * 16} mode="latent" generative
          label="已完成工作越多，马赛克结构越完整；训练未完成仍是明确缺口" />
        <p>图只表示工作检查覆盖度，不代表模型质量或论文复现成功。</p>
      </StudioPanel>
      <div className={`glc-feedback is-${training ? 'green' : 'orange'}`} aria-live="polite">
        {training
          ? '你正在声明完整训练；必须补充数据、日志与同协议指标后才能作为证据。'
          : '诚实边界：交互实验复现的是机制关系，不是训练结果。'}
      </div>
    </aside>
  </div>;
}
