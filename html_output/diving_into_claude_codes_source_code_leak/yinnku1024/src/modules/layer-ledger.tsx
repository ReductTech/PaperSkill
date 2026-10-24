import React, { useState } from 'react';
import { INK, Meter } from './kit';

type Decision = {
  id: string; name: string; layer: string; gain: string; cost: string;
  up: string; effect: string; bypass: number; editable: number;
};

const DECISIONS: Decision[] = [
  {
    id: 'd1', name: '主动性判定', layer: '判定层', gain: '不打扰也能连续工作', cost: '判错时无人当场纠正',
    up: '上移到用户输入', effect: '主动性消失，退回被动响应：判定质量取决于每个用户怎么写提示。',
    bypass: 35, editable: 80,
  },
  {
    id: 'd2', name: '反蒸馏', layer: '采集端', gain: '抄到的是脏样本', cost: '正常用户也收到假工具',
    up: '上移到推理端', effect: '只能在输出之后拦截；采集发生在输出之前，训练样本已经带走了。',
    bypass: 40, editable: 70,
  },
  {
    id: 'd3', name: '记忆', layer: '索引层', gain: '常驻上下文只装指针', cost: '指针过期会指错地方',
    up: '上移到全量上下文', effect: '每轮都带全部历史：成本随会话长度线性增长，噪声一起进来。',
    bypass: 30, editable: 75,
  },
  {
    id: 'd4', name: '缓存', layer: '稳定前缀', gain: '只为新增内容付费', cost: '前缀一改全部失效',
    up: '上移到每轮重算', effect: '缓存收益归零：同样的前缀被重复计费，长会话最先感受到。',
    bypass: 20, editable: 90,
  },
  {
    id: 'd5', name: '安全校验', layer: '原生与编译期', gain: '运行时改不掉', cost: '迭代要重新编译',
    up: '上移到 JS 运行时', effect: '一行 monkey-patch 即可绕过；校验从“结构性”降级成“约定性”。',
    bypass: 5, editable: 40,
  },
];

/* 五条决策并排后能看出同一个方向：越靠下的层越难绕过，也越难改。
   选中一行，右下的账本会给出“如果上移一层”的反事实。 */
export function LayerLedger() {
  const [selected, setSelected] = useState(0);
  const active = DECISIONS[selected];
  return (
    <div className="ps" style={{ gridTemplateRows: 'minmax(0, 1fr) auto' }}>
      <div className="ps-card ps-card--plain" style={{ padding: '6px 10px' }}>
        <table className="ps-table ps-table--fill">
          <colgroup>
            <col style={{ width: '21%' }} /><col style={{ width: '17%' }} />
            <col style={{ width: '29%' }} /><col style={{ width: '33%' }} />
          </colgroup>
          <thead>
            <tr><th>决策</th><th>放在哪一层</th><th>换来的</th><th>付出的</th></tr>
          </thead>
          <tbody>
            {DECISIONS.map((decision, index) => (
              <tr key={decision.id} data-active={index === selected}
                onClick={() => setSelected(index)} style={{ cursor: 'pointer' }}>
                <th scope="row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span aria-hidden="true" style={{
                      width: 12, height: 12, borderRadius: 999,
                      background: index === selected ? INK.blue : 'transparent',
                    }} />
                    {decision.name}
                  </span>
                </th>
                <td style={{ color: INK.blue }}>{decision.layer}</td>
                <td>{decision.gain}</td>
                <td style={{ color: INK.muted }}>{decision.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ps-card ps-card--plain" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 20, alignItems: 'center' }}>
        <div>
          <p className="ps-t" style={{ fontWeight: 700, color: INK.orange }}>如果{active.up}</p>
          <p className="ps-t ps-t--tight">{active.effect}</p>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <Meter label="可绕过性" value={active.bypass} tone="red" readout={`${active.bypass} / 100`} />
          <Meter label="可修改性" value={active.editable} tone="green" readout={`${active.editable} / 100`} />
        </div>
      </div>
    </div>
  );
}
