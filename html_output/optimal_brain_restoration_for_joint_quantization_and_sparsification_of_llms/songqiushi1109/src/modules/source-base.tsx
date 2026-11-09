import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SegButton, Feedback, Slider } from './obrKit';
import { SymbolHint } from '../components/SymbolHint';

// ch6：源码视角。OBR 是叠加在旋转底座之上的可插拔补偿模块，不重新发明旋转。
// 三条旋转底座 + 两个算法版本 + 关键源码参数，均来自官方仓库（csguoh/OBR）README。
type Base = 'quarot' | 'spinquant' | 'flatquant';
const BASES: { id: Base; label: string; matrix: string; difficulty: string }[] = [
  { id: 'quarot', label: 'QuaRot', matrix: 'Hadamard（在线生成）', difficulty: '最省事' },
  { id: 'spinquant', label: 'SpinQuant', matrix: '旋转矩阵（官方）', difficulty: '需下载' },
  { id: 'flatquant', label: 'FlatQuant', matrix: '旋转矩阵（官方）', difficulty: '需下载' },
];

export function SourceBase(_props: WidgetProps) {
  const [base, setBase] = useState<Base>('quarot');
  const [rtn, setRtn] = useState(false);
  const [sparsity, setSparsity] = useState(0.5);
  const active = BASES.find((b) => b.id === base)!;
  const algo = rtn ? 'OBR_RTN' : 'OBR_GPTQ';
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel obr-chart-panel">
        <div className="obr-heading">OBR：叠加在旋转底座上的可插拔模块</div>
        <div className="obr-base-grid">
          {BASES.map((b) => (
            <button key={b.id} type="button" className={`obr-base-card ${base === b.id ? 'is-active' : ''}`}
              onClick={() => setBase(b.id)} aria-pressed={base === b.id}>
              <b>{b.label}</b>
              <span>{b.matrix}</span>
              <em>{b.difficulty}</em>
            </button>
          ))}
        </div>
        <div className="obr-pipeline">
          <div className="obr-pipe-node tone-purple"><b>旋转底座</b><span>{active.label}</span></div>
          <span className="obr-pipe-arrow" aria-hidden="true">→</span>
          <div className="obr-pipe-node tone-red"><b>剪枝</b><span>{(sparsity * 100).toFixed(0)}%</span></div>
          <span className="obr-pipe-arrow" aria-hidden="true">→</span>
          <div className="obr-pipe-node tone-green"><b>+ΔW 补偿</b><span>{algo}</span></div>
          <span className="obr-pipe-arrow" aria-hidden="true">→</span>
          <div className="obr-pipe-node tone-blue"><b>量化</b><span>W4A4KV4</span></div>
        </div>
        <div className="obr-badge-row">
          <span className="obr-badge">输出 W4A4KV4 + S{Math.round(sparsity * 100)}%</span>
          <span className="obr-badge">核心代码 QuaRot/obr_utils.py#L186</span>
        </div>
        <div className="obr-note">OBR 不重新发明旋转，而是复用旋转底座摊平 outlier 后补上「剪枝 + 量化」联合补偿；底座信息来自官方 README。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">关键参数（源码参数名）</div>
        <div className="obr-code">
          <code>obr_rtn = {rtn ? 'True' : 'False'} · obr_alpha = 0.5</code>
          <code>sparsity_ratio = {sparsity.toFixed(2)}</code>
          <code>prune_n / prune_m = 0（非结构化）</code>
        </div>
        <div className="obr-controls">
          <SegButton active={!rtn} onClick={() => setRtn(false)}>OBR_GPTQ（默认）</SegButton>
          <SegButton active={rtn} onClick={() => setRtn(true)}>OBR_RTN（更简）</SegButton>
        </div>
        <Slider label="剪枝率 sparsity_ratio" value={sparsity} min={0.3} max={0.7} step={0.05}
          onChange={setSparsity} format={(v) => (v * 100).toFixed(0) + '%'} />
        <Feedback tone="green">
          {base === 'quarot'
            ? 'QuaRot 路线最省事：Hadamard 在线生成，无需下载旋转矩阵，复现门槛最低。'
            : `${active.label} 需下载官方旋转矩阵；官方已给 HF 校准模型，一行 --load_qmodel_path 即可复现。`}
        </Feedback>
        <p className="obr-body muted">
          <SymbolHint meaning="OBR_GPTQ：复用 GPTQ 补偿机制的默认算法版本。">OBR_GPTQ</SymbolHint>
          {' 默认更完整，'}
          <SymbolHint meaning="OBR_RTN：更简的算法版本。">OBR_RTN</SymbolHint>
          {' 更轻。'}
        </p>
      </div>
    </div>
  );
}
