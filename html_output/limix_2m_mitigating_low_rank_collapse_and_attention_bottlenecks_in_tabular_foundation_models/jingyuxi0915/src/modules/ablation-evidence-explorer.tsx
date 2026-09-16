import { useState } from 'react';
import { EvidenceBars, MetricGuide, Controls, Button, Chips, Feedback, Source, Detail, WidgetFrame, palette } from './shared';

type EvidenceRow = { name: string; value: number; second?: number; change?: string };
const EMBEDDING = {
  cls: { AUC: [83.52, 83.88, 84.66, 85.04], Acc: [76.82, 77.80, 77.68, 77.99], F1: [66.57, 68.65, 67.74, 69.01] },
  reg: { R2: [.7731, .6859, .7410, .7792], RMSE: [.4043, .4321, .4216, .3964] },
};
const MODULES: Record<string, number[]> = { arena: [.8215, .8399, .8301, .8431], zilla: [.9180, .9285, .9293, .9313] };
const ORDERS: Record<string, number[]> = { arena: [.8392, .8397, .8400, .8403, .8431, .8415], zilla: [.9265, .9278, .9246, .9272, .9313, .9324] };
const ORDER_NAMES = ['FSN', 'FNS', 'FNSN', 'SFN', 'SNF', 'SNFN'];
const FULL: Record<string, string> = { F: 'Feature Attention', S: 'Sample Attention', N: 'FFN' };
const TH = { padding: '8px 10px', textAlign: 'left' as const, borderBottom: '1px solid ' + palette.line, whiteSpace: 'nowrap' as const };
const TD = { ...TH, fontVariantNumeric: 'tabular-nums' as const };

export function AblationEvidenceExplorer() {
  const [entry, setEntry] = useState('rank');
  const [dataset, setDataset] = useState('arena');
  const [task, setTask] = useState('cls');
  const [metric, setMetric] = useState('AUC');
  const switchEntry = (next: string) => { setEntry(next); setDataset('arena'); setTask('cls'); setMetric('AUC'); };
  const switchTask = (next: string) => { setTask(next); setMetric(next === 'cls' ? 'AUC' : 'R2'); };
  const reset = () => switchEntry('rank');
  let rows: EvidenceRow[] = [];
  let objects = '', held = '', changed = '', context = '', units = '', source = '', supported = '', unsupported = '', decimals = 4;
  if (entry === 'rank') {
    rows = [{ name: 'Numerical Rank', value: 58.41, second: 78.62, change: '+34.60%' }, { name: 'Rank@99', value: 13.94, second: 25.35, change: '+81.98%' }, { name: 'Rank@95', value: 6.73, second: 12.31, change: '+83.18%' }];
    objects = 'Linear 与 RaBEL'; held = '2M 模型、SNF 结构和训练设置相同'; changed = '数值嵌入方法';
    context = '前三层秩指标汇总；三个指标分别解释'; units = '原表列值（单位、容差未明确）'; source = 'p6 §5.2 · Table 5'; decimals = 2;
    supported = '在这组同结构、同训练设置的比较中，RaBEL 的三个浅层秩指标表列值更高。';
    unsupported = '这些数不是准确率；不能由更高秩推出任意数据集更准确，也不能据此认定所有性能增益只由秩造成。';
  } else if (entry === 'embedding') {
    const vals = task === 'cls' ? EMBEDDING.cls[metric as keyof typeof EMBEDDING.cls] : EMBEDDING.reg[metric as keyof typeof EMBEDDING.reg];
    rows = ['MLP', 'Periodic', 'PLE', 'RaBEL'].map((name, i) => ({ name: 'Transformer+' + name, value: vals[i] }));
    objects = '同类 Transformer 主干 + MLP、Periodic、PLE、RaBEL 四种替代嵌入'; held = '2M 级 Transformer 主干，按 §5.1.2 采用相同训练与评估设置'; changed = '嵌入方法';
    context = task === 'cls' ? 'BCCO-CLS · ' + (metric === 'Acc' ? '准确率' : metric) + ' ↑ 越高越好' : 'BCCO-REG · ' + (metric === 'R2' ? 'R² ↑ 越高越好' : 'RMSE ↓ 越低越好');
    units = task === 'cls' ? '分类指标沿用原表 0–100 量级' : '回归指标原值';
    source = task === 'cls' ? 'p6 · Table 3' : 'p6 · Table 4'; decimals = task === 'cls' ? 2 : 4;
    supported = '当前表内，RaBEL 的所选指标优于列出的三种替代嵌入；这是一项固定配置下的经验比较。';
    unsupported = '不是 Table 5 的 Linear/RaBEL 秩诊断，也不是最终模型主结果。未给完整等参数与误差信息，不能称普适最优或统计显著。';
  } else {
    const isModules = entry === 'modules';
    const names = isModules ? ['Baseline', '+RaBEL', '+RBA', 'LimiX-2M'] : ORDER_NAMES;
    const vals = isModules ? MODULES[dataset] : ORDERS[dataset];
    rows = names.map((name, i) => ({ name, value: vals[i] }));
    objects = isModules ? '基线、单加 RaBEL、单加 RBA、两项合用' : '六种模块次序（含重复 FFN 的结构）';
    held = '图中相同基准与 AUC 指标'; changed = isModules ? 'RaBEL / RBA 的加入组合' : '模块排列与部分结构长度';
    context = (dataset === 'arena' ? 'TabArena' : 'TabZilla') + ' · AUC ↑ 越高越好'; units = 'AUC 原值（0–1）'; source = 'p8 §5.5.1 · Fig.3';
    supported = isModules ? '两项各自加入和合用均比图中基线更高；合用在这四个配置中最高。' : dataset === 'zilla' ? 'TabZilla 上 SNFN=0.9324，高于 SNF=0.9313。次序效果需要连同基准和配置一起看。' : 'TabArena 上，SNF 在图中六种结构里 AUC 最高（0.8431）。';
    unsupported = isModules ? '“+RBA”不是在“+RaBEL”上继续加。图中没有误差区间，也没有完整隔离 pooling 因素，不能把柱差当作充分因果证明。' : '不能说 SNF 在每个基准绝对最高；多一个 FFN 的结构不一定等参数，图中未逐项报告参数预算。';
  }
  return <WidgetFrame id="M09-ablation-evidence">
    <Chips label="证据入口" value={entry} onChange={switchEntry} options={[{ value: 'rank', label: '只换嵌入' }, { value: 'embedding', label: '替代嵌入比较' }, { value: 'modules', label: '两项模块改进' }, { value: 'orders', label: '模块次序' }]} />
    {entry === 'embedding' && <>
      <Chips label="任务" value={task} onChange={switchTask} options={[{ value: 'cls', label: 'BCCO-CLS' }, { value: 'reg', label: 'BCCO-REG' }]} />
      <Chips label="指标" value={metric} onChange={setMetric} options={task === 'cls' ? [{ value: 'AUC', label: 'AUC ↑' }, { value: 'Acc', label: '准确率 ↑' }, { value: 'F1', label: 'F1 ↑' }] : [{ value: 'R2', label: 'R² ↑' }, { value: 'RMSE', label: 'RMSE ↓' }]} />
    </>}
    {(entry === 'modules' || entry === 'orders') && <Chips label="基准" value={dataset} onChange={setDataset} options={[{ value: 'arena', label: 'TabArena' }, { value: 'zilla', label: 'TabZilla' }]} />}
    <Source kind="P" loc={source}>先选择比较对象，再核对数据集和指标。这里显示固定实验记录，教学参数不会改变这些分数。</Source>
    <div aria-live="polite">
      <h4>{context}</h4><p style={{ color: palette.muted }}>{units}。柱从 0 开始，精确值见下表。</p>
      {entry !== 'rank' && <MetricGuide metric={metric} benchmark={entry==='embedding'}/>}
      {entry === 'embedding' && <p><strong>这里比较同类 Transformer 主干中的嵌入替换；Transformer+MLP 中的 MLP 是嵌入模块。</strong></p>}
      <EvidenceBars label={context+' / '+units} decimals={decimals} rows={rows.flatMap(row=>row.second===undefined
        ?[{name:row.name,value:row.value,focus:['Transformer+RaBEL','LimiX-2M','SNF'].includes(row.name)}]
        :[{name:row.name+' / Linear',value:row.value,focus:false},{name:row.name+' / RaBEL',value:row.second,focus:true}])}/>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <caption style={{ textAlign: 'left', margin: '8px 0' }}>{entry==='rank'?'精确原值与原报增幅':'精确原值'}；绿色描边标出本文方案，优劣仍按所选指标判断。</caption>
        <thead><tr><th style={TH}>{entry === 'rank' ? '指标' : '比较对象'}</th><th style={TH}>{entry === 'rank' ? 'Linear 表列值' : '原表值'}</th>{entry === 'rank' && <><th style={TH}>RaBEL 表列值</th><th style={TH}>原报增幅</th></>}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.name}><th scope="row" style={TH}>{row.name}</th><td style={TD}>{row.value.toFixed(decimals)}</td>{row.second !== undefined && <><td style={TD}>{row.second.toFixed(decimals)}</td><td style={TD}>{row.change}</td></>}</tr>)}</tbody>
      </table></div>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: '6px 14px' }}>
        <dt>比较对象</dt><dd style={{ margin: 0 }}>{objects}</dd><dt>保持项</dt><dd style={{ margin: 0 }}>{held}</dd><dt>改变项</dt><dd style={{ margin: 0 }}>{changed}</dd>
      </dl>
      <Feedback tone="good"><strong>支持：</strong>{supported}</Feedback>
      <Feedback><strong>不能推出：</strong>{unsupported}</Feedback>
    </div>
    <Controls><Button onClick={reset}>重置本模块</Button></Controls>
    <Detail title={entry === 'orders' ? '全称、符号冲突与比较边界' : '来源口径与尚未报告的条件'}>
      {entry === 'orders' ? <>
        <p>按正文 §4 定义：F=Feature Attention；S=Sample Attention；N=FFN。这里的 N 不是样本数或归一化。</p>
        <ul>{ORDER_NAMES.map(name => <li key={name}><strong>{name}</strong>：{name.split('').map(letter => FULL[letter]).join(' → ')}</li>)}</ul>
        <p>p8 的 SFN 文字与“FFN 放中间”有冲突，图注的字母展开也与 §4 不一致。本页沿用正文全称与图中柱标签，不把这解释为 QKV 次序改变。</p>
      </> : entry === 'rank' ? <p>Table 5 是前三层的汇总列值；论文没有清楚给出单位、数值秩容差及 Rank@95/99 的能量定义。本页不把原列值补写成百分比或整数维数，也不与教学 k95/k99 的平方能量口径混用。</p> : entry === 'embedding' ? <p>Tables 3/4 的嵌入对照与 Table 15 的最终模型评估配置不同。分类数字保留原表量级，不把 85.04 与最终模型 0.858 拼成同一次评测。</p> : <p>四个配置并非时间序列。RaBEL 与 RBA 各自独立加入基线；合用配置另列。图中未给出置信区间，不能补造统计显著性。</p>}
      <p>附录 C.3 只报告离散超参数配置；本模块不连接连续参数到性能。部分比较的评估集合、预算或误差信息未充分说明。</p>
    </Detail>
  </WidgetFrame>;
}
