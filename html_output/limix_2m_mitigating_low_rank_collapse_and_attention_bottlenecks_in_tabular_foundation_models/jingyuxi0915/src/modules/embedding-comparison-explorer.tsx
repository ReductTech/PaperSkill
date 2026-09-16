import { useMemo, useState } from 'react';
import { Canvas, Controls, Button, Chips, Feedback, Source, MatrixTable, Metric, Detail, WidgetFrame, fmt, palette } from './shared';
import { X0, LINEAR_W, LINEAR_B, RBF_W, affine, center, layerNorm, rabel, spectrum, readM02 } from './math';

type Observation = 'projected' | 'centered' | 'ln';
const OBSERVATIONS = [
  { value: 'projected', label: '投影后、LN前' },
  { value: 'centered', label: '投影后、LN前，按样本中心化' },
  { value: 'ln', label: '每token LN后' },
];
const stageNames: Record<Observation, [string, string]> = {
  projected: ['线性编码（含偏置）·LN前', 'RaBEL中间表示·LN前'],
  centered: ['线性编码（含偏置）·LN前·按样本中心化', 'RaBEL中间表示·LN前·按样本中心化'],
  ln: ['线性编码＋LN', '完整RaBEL'],
};
function Stats({ data }: { data: ReturnType<typeof spectrum> }) {
  if (!data.converged) return <Feedback tone="bad">SVD 未收敛；暂不报告秩或谱指标。</Feedback>;
  return <>
    <Controls><Metric label="数值秩" value={String(data.rank)} /><Metric label="熵有效秩" value={data.effective === null ? '未定义（全零）' : fmt(data.effective)} /></Controls>
    <Controls><Metric label="教学 k95 / k99" value={data.k95 === null || data.k99 === null ? '未定义（全零）' : `${data.k95} / ${data.k99}`} /><Metric label="Σs²" value={fmt(data.energy, 6)} /></Controls>
    <p>奇异值 s = [{data.s.map(v => Math.abs(v) < data.threshold ? '0*' : fmt(v, 6)).join(', ')}]</p>
    <p style={{ fontSize: '.86rem', color: palette.muted }}>τ = {data.threshold.toExponential(2)}；0* 只表示小于容差，原始谱可在详情查阅。</p>
    <Detail title="原始谱与累计平方能量">
      <p>未按显示容差归零的奇异值：[{data.s.map(v => v.toExponential(7)).join(', ')}]</p>
      <p>累计平方能量比例：{data.energy === 0 ? '未定义（全零）' : data.cumulative.map(v => `${fmt(v * 100, 3)}%`).join(' → ')}</p>
    </Detail>
  </>;
}

export function EmbeddingComparisonExplorer() {
  const [stage, setStage] = useState<Observation>('centered');
  const [values, setValues] = useState<number[]>(() => [...X0]);
  const [caseName, setCaseName] = useState('default');
  const [inputSource, setInputSource] = useState('本章默认 X₀');
  const [notice, setNotice] = useState('');
  const computed = useMemo(() => {
    const right = rabel(values);
    const leftProjected = affine(right.standardized, true);
    const left = stage === 'centered' ? center(leftProjected) : stage === 'ln' ? leftProjected.map(row => layerNorm(row)) : leftProjected;
    const rightMatrix = stage === 'centered' ? center(right.projected) : stage === 'ln' ? right.normalized : right.projected;
    return { left, right: rightMatrix, leftSpectrum: spectrum(left), rightSpectrum: spectrum(rightMatrix), standardized: right.standardized, mean: right.mean, std: right.std };
  }, [stage, values]);
  const chooseCase = (next: string) => {
    setCaseName(next); setNotice('');
    setValues(next === 'constant' ? [1, 1, 1, 1, 1] : [...X0]);
    setInputSource(next === 'constant' ? '本章常数列案例：5 个 1' : '本章默认 X₀');
  };
  const importM02 = () => {
    const imported = readM02();
    if (!imported || imported.length !== 5 || imported.some(x => !Number.isFinite(x) || x < -3 || x > 3)) {
      setNotice('尚无可用的第2章数值；保留当前输入与共同条件。先在第2章操作，再显式沿用。');
      return;
    }
    setValues([...imported]); setCaseName('imported'); setInputSource('读者沿用的第2章最后有效 5 值'); setNotice('已沿用数值；本模块仍按统一列标准化重算，本模块的观察状态仍独立设置。');
  };
  const reset = () => { setStage('centered'); setValues([...X0]); setCaseName('default'); setInputSource('本章默认 X₀'); setNotice(''); };
  const maxAbs = Math.max(0, ...computed.left.flat().map(Math.abs), ...computed.right.flat().map(Math.abs));
  const maxSingular = Math.max(0, ...computed.leftSpectrum.s, ...computed.rightSpectrum.s);
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, w, h);
    const gap = 32, margin = 18, panel = (w - margin * 2 - gap) / 2;
    const matrices = [computed.left, computed.right], spectra = [computed.leftSpectrum.s, computed.rightSpectrum.s];
    for (let branch = 0; branch < 2; branch++) {
      const x = margin + branch * (panel + gap), y = 35, matrixH = 117, rowH = matrixH / 5, colW = panel / 4;
      const color = branch === 0 ? palette.blue : palette.green;
      ctx.fillStyle = palette.ink; ctx.font = '600 14px sans-serif'; ctx.fillText(branch === 0 ? '线性' : 'RaBEL', x, 20);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
        const value = matrices[branch][i][j];
        ctx.fillStyle = value < 0 ? palette.orange : color;
        ctx.globalAlpha = maxAbs === 0 ? .06 : .08 + .84 * Math.abs(value) / maxAbs;
        ctx.fillRect(x + j * colW + 2, y + i * rowH + 2, colW - 4, rowH - 4); ctx.globalAlpha = 1;
        ctx.strokeStyle = palette.line; ctx.lineWidth = 1;
        ctx.strokeRect(x + j * colW + 2, y + i * rowH + 2, colW - 4, rowH - 4);
      }
      const baseline = h - 18, chartHeight = h - matrixH - 80;
      ctx.strokeStyle = palette.line; ctx.beginPath(); ctx.moveTo(x, baseline); ctx.lineTo(x + panel, baseline); ctx.stroke();
      const barWidth = panel / 4;
      spectra[branch].forEach((value, i) => {
        const bh = maxSingular === 0 ? 0 : value / maxSingular * chartHeight;
        ctx.fillStyle = color; ctx.fillRect(x + i * barWidth + 8, baseline - bh, barWidth - 16, bh);
      });
    }
  };
  const leftLabel = stageNames[stage][0], rightLabel = stageNames[stage][1];
  const bothZero = computed.leftSpectrum.energy === 0 && computed.rightSpectrum.energy === 0;
  const explanation = bothZero
    ? '相同原始数值经相同预处理仍相同。按样本中心化后，两边均为零矩阵；局部展开不能凭空区分完全相同的输入。'
    : stage === 'ln'
      ? '现在比较的是每 token LN 后的完整矩阵，未再做样本中心化。gain 全1、bias 全0使每行通道和约为0，因此 d=4 时两边秩都至多3；这个约束也适用于当前 RaBEL 表示。'
      : stage === 'centered'
        ? '在相同输入与观察条件下，非线性局部响应可以改变采样矩阵的线性张成；中心化的共享仿射分支至多只有1个方向。这里的秩由实际矩阵计算，更高秩不等于更高准确率。'
        : '两边都停在投影后、LN前。含偏置的标量仿射分支秩至多2；右侧仍是 RaBEL 中间表示，尚未完成每 token LN。';
  return <WidgetFrame id="embedding-comparison-lab">
    <Source kind="P · I · T" loc="p4 式(1)–(4)；pp12–13">机制演示：手工未训练参数、实际矩阵和 SVD；不显示模型准确率。</Source>
    <p>先锁定共同条件，再比较左右两条支路。<strong>共同输入、共同预处理、输出宽度 d = 4、共同观察状态</strong>；参数形状不同，不能称等参数量或已训练公平评测。</p>
    <Chips label="共同观察状态" value={stage} onChange={value => setStage(value as Observation)} options={OBSERVATIONS} />
    <Controls><Chips label="输入案例" value={caseName} onChange={chooseCase} options={[{ value: 'default', label: '默认数值' }, { value: 'constant', label: '常数列' }]} /><Button onClick={importM02}>沿用第2章数值</Button><Button onClick={reset}>重置本模块</Button></Controls>
    {notice && <Feedback>{notice}</Feedback>}
    <p aria-live="polite"><strong>来源：</strong>{inputSource}。X = [{values.map(v => fmt(v, 2)).join(', ')}]。</p>
    <p><strong>两侧共同列 z-score：</strong>均值 {fmt(computed.mean)}，样本标准差 {fmt(computed.std, 6)}；x̃ = (x − μ) / (s + 10⁻⁶)。x̃ = [{computed.standardized.map(v => fmt(v, 5)).join(', ')}]。</p>
    <p>左侧投影 <strong>4×1 + 4偏置</strong>；右侧 <strong>3个 RBF → 4×3 + 4偏置</strong>。同宽度不等于同参数量。</p>
    <Canvas label={`${leftLabel}与${rightLabel}的5×4矩阵及实际奇异值，左右共用色标和谱轴`} draw={draw} height={290} />
    <p style={{ fontSize: '.88rem', color: palette.muted }}>上方：5×4 矩阵，橙色为负；蓝/绿为正，深浅表示绝对值，左右共同色标 ±{fmt(maxAbs, 4)}。下方：奇异值，左右共同纵轴 0–{fmt(maxSingular, 4)}。完整数值见表。</p>
    <Feedback>{explanation}</Feedback>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: 20 }}>
      <section aria-label={leftLabel} style={{ minWidth: 0 }}><h4 style={{ color: palette.blue }}>{leftLabel}</h4><MatrixTable matrix={computed.left} label={leftLabel} /><Stats data={computed.leftSpectrum} /></section>
      <section aria-label={rightLabel} style={{ minWidth: 0 }}><h4 style={{ color: palette.green }}>{rightLabel}</h4><MatrixTable matrix={computed.right} label={rightLabel} /><Stats data={computed.rightSpectrum} /></section>
    </div>
    <p><strong>谱口径：</strong>数值秩计 sᵢ &gt; 10⁻¹⁰s_max；教学 k95/k99 使用 Σs²；熵有效秩使用 pᵢ = sᵢ/Σsᵢ。全零谱的能量比例与熵有效秩未定义。</p>
    <Detail title="共同条件、计算公式与结论边界">
      <p>线性编码（含偏置）：Z线性 = x̃wᵀ + 1bᵀ，w = [{LINEAR_W.join(', ')}]，b = [{LINEAR_B.join(', ')}]。这沿用第2章的 w / b，但本模块明确在两支路之前统一增加列标准化。</p>
      <p>RaBEL：中心 c = [−1, 0, 1]，σ = 1，φⱼ = exp[−(x̃−cⱼ)²/2]；u = Wφ，投影偏置全0。</p>
      <MatrixTable label="右侧共享 W（4×3，与分步模块相同）" matrix={RBF_W} />
      <p>“按样本中心化”对每个输出通道跨5行减均值。“每token LN后”对各行4个通道减均值再除以 √(总体方差 + 10⁻⁵)，gain 全1、bias 全0，且不再样本中心化。</p>
      <p>LN 后每行位于通道和为0的三维子空间内，数值秩至多3。常数列在 LN 前中心化时两支路都为零；LN 后两侧各自仍是相同行，秩至多1。具体谱仍由 SVD 计算。</p>
      <p>一维输入的内在自由度与若干采样点矩阵的线性秩不同。这里既不能从二维散点投影判定完整矩阵秩，也不能用秩差计算 AUC。论文性能与消融在第9章按固定记录独立展示。</p>
      <p>论文未明确 Rank@95/99 的全部能量口径和数值秩容差，本模块采用已明示的教学口径，与原图分别解读。SVD 使用直接分解；只有收敛后才显示秩。</p>
    </Detail>
  </WidgetFrame>;
}
