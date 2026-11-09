import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './obrKit';
import { SymbolHint } from '../components/SymbolHint';

// ch8：总结。Optimal Brain 血脉收口：OBD → OBS → OBQ → GPTQ/SparseGPT → OBR。
const NODES: { id: string; label: string; compensate: string; desc: string; tone: 'purple' | 'blue' | 'orange' | 'green' }[] = [
  { id: 'obd', label: 'OBD', compensate: '剪枝', desc: '最优脑损伤：用二阶信息（对角 Hessian）剪掉单个权重。', tone: 'purple' },
  { id: 'obs', label: 'OBS', compensate: '剪枝', desc: '最优脑手术：剪枝后重算剩余权重，一次性补偿。', tone: 'purple' },
  { id: 'obq', label: 'OBQ', compensate: '剪枝', desc: '逐权重贪心重建，把 OBS 变成逐行可算的工程算法。', tone: 'purple' },
  { id: 'gptq', label: 'GPTQ', compensate: '量化', desc: '只补偿量化误差：把 OBQ 用于低比特量化。', tone: 'blue' },
  { id: 'sparsegpt', label: 'SparseGPT', compensate: '剪枝', desc: '只补偿剪枝误差：大规模剪枝补偿。', tone: 'orange' },
  { id: 'obr', label: 'OBR', compensate: '量化+剪枝', desc: '联合补偿：一个通用误差扰动框架，同时兜住剪枝与量化。', tone: 'green' },
];

export function Summary(_props: WidgetProps) {
  const [sel, setSel] = useState('obr');
  const active = NODES.find((n) => n.id === sel)!;
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel obr-chart-panel">
        <div className="obr-heading">Optimal Brain 家族：一路走到联合补偿</div>
        <div className="obr-lineage" role="tablist" aria-label="Optimal Brain 家族演进">
          {NODES.map((n, i) => (
            <React.Fragment key={n.id}>
              <button type="button" role="tab" aria-selected={sel === n.id}
                className={`obr-node ${sel === n.id ? 'is-active' : ''} tone-${n.tone}`}
                onClick={() => setSel(n.id)}>
                <b>{n.label}</b>
                <span>补偿 {n.compensate}</span>
              </button>
              {i < NODES.length - 1 && <span className="obr-node-arrow" aria-hidden="true">→</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="obr-note">OBR 是家族里第一个同时处理「量化 + 剪枝」的成员；点击节点查看各自补偿对象。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">{active.label}：补偿什么？</div>
        <div className={`obr-node-desc tone-${active.tone}`}>{active.desc}</div>
        <Feedback tone={active.tone === 'green' ? 'green' : 'blue'}>
          {active.tone === 'green'
            ? 'OBR 用「通用误差扰动」统一了 GPTQ（只量化）与 SparseGPT（只剪枝），收口整条血脉。'
            : `${active.label} 只补偿${active.compensate}，尚未联合量化与剪枝。`}
        </Feedback>
        <p className="obr-body muted">
          主线从 <SymbolHint meaning="GPTQ：纯量化补偿。">GPTQ</SymbolHint> 起步，绕一圈回到同一条血脉，终点升级成
          <SymbolHint meaning="OBR：联合量化 + 剪枝补偿。">OBR</SymbolHint> 的「联合压缩」。
        </p>
      </div>
    </div>
  );
}
