import { useState } from 'react';
import { EvidenceBars, MetricGuide, Controls, Button, Chips, Feedback, Source, Detail, WidgetFrame, palette } from './shared';

const CLS = [
  { name: 'LimiX-16M', AUC: .871, Acc: .804, F1: .731 },
  { name: 'LimiX-2M', AUC: .858, Acc: .787, F1: .701 },
  { name: 'TabPFN-v2', AUC: .843, Acc: .772, F1: .679 },
  { name: 'TabICL', AUC: .847, Acc: .768, F1: .672 },
];
const REG = [
  { name: 'LimiX-16M', R2: .794, RMSE: .386, rankR2: 3.860, rankRMSE: 4.700 },
  { name: 'LimiX-2M', R2: .785, RMSE: .392, rankR2: 6.580, rankRMSE: 6.460 },
  { name: 'TabPFN-v2', R2: .772, RMSE: .404, rankR2: 6.440, rankRMSE: 6.340 },
  { name: 'AutoGluon', R2: .781, RMSE: .398, rankR2: 5.140, rankRMSE: 5.120 },
];
const COST = [
  { name: 'LimiX-2M', params: 1.92, cpu: 17257.34, gpu: 171.40 },
  { name: 'TabPFN-v2', params: 7.24, cpu: 51950.08, gpu: 352.60 },
  { name: 'TabICL', params: 27.10, cpu: 22161.85, gpu: 1749.61 },
  { name: 'LimiX-16M', params: 16.52, cpu: 68447.99, gpu: 368.08 },
  { name: 'Mitra', params: 75.67, cpu: 124453.05, gpu: 5766.25 },
];
const CELL = { padding: '8px 10px', textAlign: 'left' as const, borderBottom: '1px solid ' + palette.line, whiteSpace: 'nowrap' as const, fontVariantNumeric: 'tabular-nums' as const };

export function ResultsBoundaryExplorer() {
  const [scene, setScene] = useState('cls');
  const [metric, setMetric] = useState('AUC');
  const selectScene = (value: string) => { setScene(value); setMetric(value === 'cls' ? 'AUC' : value === 'reg' ? 'R2' : value === 'latency' ? 'gpu' : 'params'); };
  let rows: { name: string; value: number }[] = [], label = '', source = '', condition = '', interpretation = '', boundary = '';
  let highIsBetter = false, decimals = 3;
  if (scene === 'cls') {
    rows = CLS.map(row => ({ name: row.name, value: row[metric as 'AUC' | 'Acc' | 'F1'] }));
    label = 'BCCO 分类 · ' + (metric === 'Acc' ? '准确率' : metric); source = 'p20 · Table 15'; highIsBetter = true;
    condition = 'BCCO-CLS 套件级均值，当前展示四个 TFM；指标原值。';
    interpretation = 'LimiX-2M 在这里的所选均值高于 TabPFN-v2 和 TabICL，低于 LimiX-16M。它有竞争力，但不是本表最高。';
    boundary = '本页只是已报告结果的一部分；这不是论文仅与 TabPFN 的对决，也不能推广成全面取代树模型或所有任务获胜。';
  } else if (scene === 'reg') {
    rows = REG.map(row => ({ name: row.name, value: row[metric as 'R2' | 'RMSE' | 'rankR2' | 'rankRMSE'] }));
    label = 'BCCO 回归 · ' + ({ R2: '平均 R²', RMSE: '平均 RMSE', rankR2: 'R² 平均排名', rankRMSE: 'RMSE 平均排名' } as Record<string, string>)[metric];
    highIsBetter = metric === 'R2'; source = 'p21 · Table 16';
    condition = '套件级 Mean/Rank 是两种汇总量；当前为 LimiX-16M、LimiX-2M、TabPFN-v2、AutoGluon。';
    interpretation = metric.startsWith('rank') ? '平均排名越低越好。LimiX-2M 在这里反而落后于 TabPFN-v2 与 AutoGluon；它们的平均分比较并非这个排序。' : 'LimiX-2M 的平均分好于 TabPFN-v2 和 AutoGluon。切换平均排名会看到不同排序：先平均分与先排名后平均不是一件事。';
    boundary = '平均排名来自原表全部参评方法，不是本页四项排序。本文所评估的 TabICL 版本在该回归表中没有结果，原表记为不适用；缺项不代表 0 分。';
  } else {
    const field = scene === 'params' ? 'params' : metric as 'cpu' | 'gpu';
    rows = COST.slice(0, 4).map(row => ({ name: row.name, value: row[field] }));
    label = scene === 'params' ? '参数量 · 百万（M）' : metric === 'gpu' ? '推理耗时 · GPU RTX 4090 · ms' : '推理耗时 · CPU EPYC 9354 · ms';
    source = scene === 'params' ? 'p7 · Table 6；各主结果表的模型参数标注' : 'p18 C.6；p30 · Table 26'; decimals = 2;
    condition = scene === 'params' ? '模型参数规模；1.92M 约为 192 万参数。当前图选四个模型，Mitra 可在完整来源表查阅。' : '900 样本 × 60 特征的合成分类任务；3 次运行均值；CPU 为 AMD EPYC 9354 32 核，GPU 为 RTX 4090。';
    const ratio = scene === 'params' ? 7.24 / 1.92 : metric === 'gpu' ? 352.60 / 171.40 : 51950.08 / 17257.34;
    interpretation = scene === 'params' ? 'TabPFN-v2 参数量约为 LimiX-2M 的 ' + ratio.toFixed(2) + ' 倍。参数量说明模型规模，不能直接推导准确率或耗时。' : '在这个测量条件下，TabPFN-v2 的' + (metric === 'gpu' ? ' GPU ' : ' CPU ') + '耗时约为 LimiX-2M 的 ' + ratio.toFixed(2) + ' 倍。该比值由表中毫秒数计算。';
    boundary = scene === 'params' ? '小模型不等于每项指标最好；此处没有训练时长或复杂度的测量证据。' : '不是训练耗时或全任务速度承诺。计时是否含加载、warmup、缓存等细节未充分给出；原表未提供误差区间，因此条形只显示报告的均值。';
  }
  const reference = rows.find(row => row.name === 'LimiX-2M')!.value;
  const costView = scene === 'params' || scene === 'latency';
  const sorted = [...rows].sort((a, b) => highIsBetter ? b.value - a.value : a.value - b.value);
  const rank = (value: number) => 1 + rows.filter(row => highIsBetter ? row.value > value : row.value < value).length;
  return <WidgetFrame id="M10-results-boundary">
    <Chips label="比较场景" value={scene} onChange={selectScene} options={[{ value: 'cls', label: 'BCCO分类' }, { value: 'reg', label: 'BCCO回归' }, { value: 'latency', label: '推理耗时' }, { value: 'params', label: '参数量' }]} />
    {scene === 'cls' && <Chips label="分类指标" value={metric} onChange={setMetric} options={[{ value: 'AUC', label: 'AUC ↑' }, { value: 'Acc', label: '准确率 ↑' }, { value: 'F1', label: 'F1 ↑' }]} />}
    {scene === 'reg' && <Chips label="回归汇总量" value={metric} onChange={setMetric} options={[{ value: 'R2', label: '平均 R² ↑' }, { value: 'RMSE', label: '平均 RMSE ↓' }, { value: 'rankR2', label: 'R² 平均排名 ↓' }, { value: 'rankRMSE', label: 'RMSE 平均排名 ↓' }]} />}
    {scene === 'latency' && <Chips label="测量硬件" value={metric} onChange={setMetric} options={[{ value: 'gpu', label: 'GPU RTX4090' }, { value: 'cpu', label: 'CPU EPYC9354' }]} />}
    <Source kind="P / I" loc={source}>分数与耗时来自论文记录；比值和差值由这些原值直接计算。</Source>
    <div aria-live="polite">
      <h4>{label} · {scene==='params'?'数值越小，参数越少 ↓':highIsBetter ? '越高越好 ↑' : '越低越好 ↓'}</h4>
      <p>{condition}</p>
      {(scene==='cls'||scene==='reg')&&<MetricGuide metric={metric} benchmark/>}
      <EvidenceBars label={label+' / '+(scene==='params'?'数值越小，参数越少 ↓':highIsBetter?'越高越好 ↑':'越低越好 ↓')} decimals={decimals} rows={rows.map(row=>({...row,focus:row.name==='LimiX-2M'}))}/>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <caption style={{ textAlign: 'left', padding: '8px 0' }}>精确数值与比较；“本页四项排序”和原论文平均排名分别计算。</caption>
        <thead><tr><th style={CELL}>模型</th><th style={CELL}>原值</th><th style={CELL}>本页四项排序</th><th style={CELL}>{costView ? '相对 2M 比值' : '本值 − 2M'}</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.name}><th scope="row" style={CELL}>{row.name}</th><td style={CELL}>{row.value.toFixed(decimals)}</td><td style={CELL}>{rank(row.value)}</td><td style={CELL}>{costView ? (row.value / reference).toFixed(2) + '×' : ((row.value - reference) > 0 ? '+' : '') + (row.value - reference).toFixed(decimals)}</td></tr>)}</tbody>
      </table></div>
      <p><strong>当前指标由优到劣：</strong>{sorted.map(row => row.name).join(' → ')}。</p>
      <Feedback tone="good">{interpretation}</Feedback><Feedback><strong>结论边界：</strong>{boundary}</Feedback>
    </div>
    <Controls><Button onClick={() => selectScene('cls')}>重置本模块</Button></Controls>
    {(scene === 'latency' || scene === 'params') && <Detail title="完整来源表：5 个模型的参数量与指定条件耗时">
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={CELL}>模型</th><th style={CELL}>参数 M</th><th style={CELL}>CPU ms</th><th style={CELL}>GPU ms</th></tr></thead><tbody>{COST.map(row => <tr key={row.name}><th scope="row" style={CELL}>{row.name}</th><td style={CELL}>{row.params.toFixed(2)}</td><td style={CELL}>{row.cpu.toFixed(2)}</td><td style={CELL}>{row.gpu.toFixed(2)}</td></tr>)}</tbody></table></div>
      <p>CPU/GPU 两列各自比较；不能把毫秒、参数量与准确性混成一个量。表中数值不是这张网页画柱子所用的时间。</p>
    </Detail>}
    <Detail title="评估协议、平均排名与覆盖范围">
      <p>作者在 C.1 报告 64/16/20 划分、每方法/数据集 100 次 Optuna 搜索、15 个 seeds 均值及方法特定搜索空间，并声明统一预处理与 ensemble 设置；具体 ensemble 数与完整等预算情况未充分给出。</p>
      <p>平均分先对指标取平均；平均排名先在各数据集的参评方法中排名，再取平均。Table 16 的平均排名与本页四个模型的即时排序必须分开。原文只给套件汇总，没有逐数据集原始分数，不能独立重算显著性。</p>
      <p>论文覆盖 6 个分类、5 个回归套件；不同套件可能重叠，不能把各套件数直接相加称为独立数据集总数。本页只挑选能讲清结论和例外的记录。</p>
      <p>模型小、均值好、平均排名好、指定环境快，是四类不同主张；每一种都需要对应证据。</p>
    </Detail>
  </WidgetFrame>;
}
