import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 5.2 — Compatibility Preflight。
// 配置 Policy 需求与 Target 能力，编译会话契约：三行契约全 PASS 才会产出
// AdapterPlan 与 TargetToolManifest；任何一行 FAIL 都意味着会话在获得
// 目标端访问权之前被拒绝——物理世界零成本。

type Obs = 'rgb' | 'rgbd';
type Action = 'cartesian' | 'joint';
type Freq = 5 | 10;

interface ContractRow {
  name: string;
  pass: boolean;
  detail: string;
  hint: string;
}

function ChipGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="lab-choice-group">
      <span className="lab-choice-label">{label}</span>
      {options.map((o) => (
        <button
          type="button"
          key={String(o.v)}
          className={`lab-chip ${value === o.v ? 'is-active' : ''}`}
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const PreflightLab: React.FC<WidgetProps> = () => {
  const [pObs, setPObs] = useState<Obs>('rgbd');
  const [pAction, setPAction] = useState<Action>('cartesian');
  const [pFreq, setPFreq] = useState<Freq>(10);
  const [tObs, setTObs] = useState<Obs>('rgb');
  const [tAction, setTAction] = useState<Action>('joint');
  const [tFreq, setTFreq] = useState<Freq>(5);
  const [ikAvailable, setIkAvailable] = useState(true);
  const [compiled, setCompiled] = useState(false);

  const obsOk = pObs === 'rgb' || tObs === 'rgbd';
  const actionMatch = pAction === tAction;
  const needsBridge = !actionMatch;
  const actionOk = actionMatch || ikAvailable;
  const freqOk = pFreq <= tFreq;
  const allOk = obsOk && actionOk && freqOk;

  const rows: ContractRow[] = [
    {
      name: 'Observation Contract',
      pass: obsOk,
      detail:
        pObs === 'rgbd' && tObs === 'rgb'
          ? 'policy requires [rgb, depth]，target provides [rgb] —— 深度观测无来源'
          : pObs === 'rgbd'
            ? 'policy requires [rgb, depth]，target provides [rgb, depth] ✓'
            : 'policy requires [rgb]，target 提供 rgb ✓',
      hint: '把策略观测需求降为 RGB，或给目标端配置 RGB-D 相机。',
    },
    {
      name: 'Action Semantics',
      pass: actionOk,
      detail: actionMatch
        ? `双方均使用 ${pAction === 'cartesian' ? 'Cartesian Delta' : 'Joint Position'} ✓`
        : needsBridge && ikAvailable
          ? `cartesian → joint 需 IK ActionBridge（可用 ✓）`
          : 'cartesian → joint 需要 IK ActionBridge，但该桥不可用',
      hint: actionMatch ? '' : '选择可用的 IK ActionBridge，或把策略输出切换为 Joint Position。',
    },
    {
      name: 'Control Frequency',
      pass: freqOk,
      detail: freqOk
        ? `policy ${pFreq}Hz ≤ target ${tFreq}Hz ✓`
        : `policy 要求 ${pFreq}Hz，目标接口只能稳定支持 ${tFreq}Hz`,
      hint: '降低策略控制频率至目标端可稳定支持的水平。',
    },
  ];

  const compiled_rows = compiled;
  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg = '配置左右两侧，然后「编译会话契约」。试着先保持默认错配——看看拒绝发生在哪里。';
  if (compiled_rows) {
    if (allOk) {
      tone = 'good';
      msg = needsBridge
        ? '契约成立：预检产出 AdapterPlan（含 IK ActionBridge）与 TargetToolManifest，会话允许进入目标端。'
        : '契约成立：预检产出 AdapterPlan 与 TargetToolManifest，会话允许进入目标端。';
    } else {
      tone = 'bad';
      msg = 'Session rejected before target access —— 拒绝发生在任何电机命令产生之前，这次拒绝本身就是一条可审计记录，物理世界零成本。按提示修复后重新编译。';
    }
  }

  return (
    <div className="lab pf-lab">
      <div className="pf-config">
        <div className="pf-config-col">
          <div className="pf-config-title">Policy 需求（SKILLRUNTIME.md）</div>
          <ChipGroup
            label="观测"
            value={pObs}
            options={[
              { v: 'rgbd' as Obs, label: 'RGB-D' },
              { v: 'rgb' as Obs, label: 'RGB' },
            ]}
            onChange={setPObs}
          />
          <ChipGroup
            label="动作"
            value={pAction}
            options={[
              { v: 'cartesian' as Action, label: 'Cartesian Delta' },
              { v: 'joint' as Action, label: 'Joint Position' },
            ]}
            onChange={setPAction}
          />
          <ChipGroup
            label="频率"
            value={pFreq}
            options={[
              { v: 10 as Freq, label: '10 Hz' },
              { v: 5 as Freq, label: '5 Hz' },
            ]}
            onChange={setPFreq}
          />
        </div>
        <div className="pf-config-col">
          <div className="pf-config-title">Target 能力（TARGETS.md）</div>
          <ChipGroup
            label="观测"
            value={tObs}
            options={[
              { v: 'rgb' as Obs, label: 'RGB' },
              { v: 'rgbd' as Obs, label: 'RGB-D' },
            ]}
            onChange={setTObs}
          />
          <ChipGroup
            label="动作"
            value={tAction}
            options={[
              { v: 'joint' as Action, label: 'Joint Position' },
              { v: 'cartesian' as Action, label: 'Cartesian' },
            ]}
            onChange={setTAction}
          />
          <ChipGroup
            label="频率"
            value={tFreq}
            options={[
              { v: 5 as Freq, label: '5 Hz' },
              { v: 10 as Freq, label: '10 Hz' },
            ]}
            onChange={setTFreq}
          />
        </div>
        <div className="pf-config-col">
          <div className="pf-config-title">Adapter 可用性</div>
          <ChipGroup
            label="IK Bridge"
            value={ikAvailable ? 'yes' : 'no'}
            options={[
              { v: 'yes', label: '可用' },
              { v: 'no', label: '不可用' },
            ]}
            onChange={(v) => setIkAvailable(v === 'yes')}
          />
        </div>
      </div>

      <div className="lab-controls">
        <button type="button" className="lab-btn lab-btn-primary" onClick={() => setCompiled(true)}>
          编译会话契约
        </button>
        <button
          type="button"
          className="lab-btn lab-btn-ghost"
          onClick={() => {
            setPObs('rgbd');
            setPAction('cartesian');
            setPFreq(10);
            setTObs('rgb');
            setTAction('joint');
            setTFreq(5);
            setIkAvailable(true);
            setCompiled(false);
          }}
        >
          恢复默认错配
        </button>
      </div>

      {compiled ? (
        <div className="pf-result" key={`${compiled}-${allOk}`}>
          <div className="pf-rows">
            {rows.map((r) => (
              <div className={`pf-row ${r.pass ? 'is-pass' : 'is-fail'}`} key={r.name}>
                <span className="pf-row-badge">{r.pass ? 'PASS' : 'FAIL'}</span>
                <span className="pf-row-name">{r.name}</span>
                <span className="pf-row-detail">{r.detail}</span>
              </div>
            ))}
          </div>
          {allOk ? (
            <div className="runtime-console pf-console">
              <div className="pf-console-line is-ok">AdapterPlan created</div>
              <div className="pf-console-line">policy_adapter: {pObs === 'rgbd' ? 'rgbd→model_input' : 'rgb→model_input'}</div>
              {needsBridge ? <div className="pf-console-line">action_bridge: cartesian→joint (IK) · workspace clamp</div> : <div className="pf-console-line">action_bridge: unit / dim normalization</div>}
              <div className="pf-console-line">target_adapter: franka SDK (rtde)</div>
              <div className="pf-console-line is-ok">TargetToolManifest generated → [observe, step]</div>
              <div className="pf-console-line is-ok">Session claim allowed</div>
            </div>
          ) : (
            <div className="lab-reject-banner">
              <span className="lab-reject-icon" aria-hidden>
                ⛔
              </span>
              Session rejected before target access —— 目标端未被触碰
              <div className="pf-hints">
                {rows
                  .filter((r) => !r.pass && r.hint)
                  .map((r) => (
                    <span key={r.name}>
                      <b>{r.name}</b>：{r.hint}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default PreflightLab;
