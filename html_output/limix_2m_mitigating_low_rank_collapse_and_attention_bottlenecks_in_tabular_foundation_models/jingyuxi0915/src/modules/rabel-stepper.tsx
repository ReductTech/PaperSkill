import { useMemo, useState } from 'react';
import { Canvas, Controls, Button, Chips, Feedback, Source, MatrixTable, Metric, Detail, WidgetFrame, fmt, palette, drawMatrix, drawPhotoCue } from './shared';
import { X0, RBF_C, RBF_W, rabel, gate } from './math';

const STAGES = ['原始列', '列 z-score', 'RBF 展开', '共享投影', '每 token LayerNorm'];
const FORMULAS = [
  'X₀ = [−2, −1, 0, 1, 2]ᵀ',
  'x̃ = (x − μ列) / (s列 + 10⁻⁶)，s列² = Σ(xᵢ − μ列)² / (5 − 1)',
  'φⱼ(x̃) = exp[−(x̃ − cⱼ)² / (2σ²)]，c = [−1, 0, 1]，σ = 1',
  'u = Wφ + b，W ∈ ℝ⁴ˣ³，b = 0 ∈ ℝ⁴',
  'z = (u − μ通道) / √(var通道 + 10⁻⁵)，gain = 1，bias = 0',
];
const EXPLANATIONS = [
  '这是同一数值列的 5 条教学样本。先观察跨样本的列统计，再观察每个 token 的坐标。当前追踪第 3 行 x = 0。',
  '列标准化沿样本行处理同一列：减去列均值，再除以样本标准差加 ε。它还没有产生 RBF 响应。',
  '每个标准化数值同时激活 3 个高斯核，形成 3 维 φ。局部响应展开只是 RaBEL 的一个步骤。',
  '共享 W 将 3 维响应投影到 4 维。这个 W 跨数值列共享，并非每列各配一个独立 W。',
  '现在沿当前 token 的 4 个通道做 LayerNorm。归一化轴与列 z-score 不同；有 ε 时输出方差接近 1，不必严格等于 1。',
];

export function RabelStepper() {
  const [step, setStep] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateInput, setGateInput] = useState('1');
  const data = useMemo(() => rabel([...X0]), []);
  const gated = useMemo(() => gate(Number(gateInput)), [gateInput]);
  const matrices = [X0.map(x => [x]), data.standardized.map(x => [x]), data.phi, data.projected, data.normalized];
  const current = matrices[step];
  const tracked = current[2];
  const reset = () => { setStep(0); setGateOpen(false); setGateInput('1'); };
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, w, h);
    const third = (w - 64) / 3;
    drawPhotoCue(ctx, 24, h - 46, 34, step / 4);
    drawMatrix(ctx, matrices[0], 24, 34, third * .62, h - 100, palette.blue);
    drawMatrix(ctx, current, third + 36, 34, third, h - 76, palette.green);
    drawMatrix(ctx, [tracked], third * 2 + 48, 98, third - 12, 58, palette.orange);
    ctx.strokeStyle = palette.orange; ctx.lineWidth = 3;
    const rowH = (h - 76) / 5;
    ctx.strokeRect(third + 33, 34 + rowH * 2 - 2, third + 6, rowH + 4);
    ctx.fillStyle = palette.ink; ctx.font = '600 14px sans-serif';
    ctx.fillText('原始列', 24, 21); ctx.fillText('当前量', third + 36, 21);
  };
  return <WidgetFrame id="rabel-stepper-lab">
    <Source kind="P · I · T" loc="p4 式(1)–(4)">方法步骤来自固定 v2；小矩阵参数为手工教学值，数值由公式计算。</Source>
    <p>按顺序推进，追踪同一个 <strong>x = 0</strong>：列统计 → 局部响应 → 共享投影 → 通道统计。</p>
    <Controls>
      <Button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>上一步</Button>
      <strong aria-live="polite">第 {step + 1} / 5 步：{STAGES[step]}</strong>
      <Button onClick={() => setStep(s => Math.min(4, s + 1))} disabled={step === 4}>下一步</Button>
      <Button onClick={reset}>重置本模块</Button>
    </Controls>
    <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', paddingLeft: 24 }}>
      {STAGES.map((name, i) => <li key={name} aria-current={i === step ? 'step' : undefined} style={{ color: i === step ? palette.green : palette.muted, fontWeight: i === step ? 700 : 400 }}>{name}</li>)}
    </ol>
    <Canvas label={`RaBEL 第 ${step + 1} 步：左侧原始列，中间${STAGES[step]}矩阵，右侧追踪第3行`} draw={draw} height={260} />
    <p style={{ fontSize: '.9rem', color: palette.muted }}>左：原始 5×1 列；中：当前 5×{current[0].length} 矩阵；右：第 3 行当前向量。橙框锁定同一行，角落相机只作校准类比。</p>
    <p aria-live="polite"><mark style={{ background: '#e8f2e8', color: palette.ink, padding: '4px 8px', boxDecorationBreak: 'clone' }}>{FORMULAS[step]}</mark></p>
    <Feedback>{EXPLANATIONS[step]}</Feedback>
    <Controls>
      <Metric label="列均值 μ" value={fmt(data.mean)} />
      <Metric label="样本标准差 s" value={fmt(data.std, 6)} />
      <Metric label="当前矩阵形状" value={`5 × ${current[0].length}`} />
    </Controls>
    <MatrixTable label={`第 ${step + 1} 步：${STAGES[step]}（第3行被追踪）`} matrix={current} />
    <p><strong>x = 0 的当前向量：</strong>[{tracked.map(v => fmt(v, 8)).join(', ')}]</p>
    <Detail title="固定参数、归一化轴与核对数值">
      <p>列 z-score：N = 5，μ = 0，样本标准差 √2.5，分母为 s + 10⁻⁶；本例统计仅由教学上下文拟合。这是教学约定，论文未完整给出推理时的统计范围。</p>
      <MatrixTable label="共享投影 W（4×3；未训练）" matrix={RBF_W} />
      <p>投影偏置 b = [0, 0, 0, 0]；中心 c = [{RBF_C.join(', ')}]，σ = 1。LN 的 gain = [1, 1, 1, 1]，bias = [0, 0, 0, 0]，方差分母为通道数 4。</p>
      <MatrixTable label="x=0 的 RBF 响应 φ（1×3）" matrix={[data.phi[2]]} />
      <MatrixTable label="x=0 的投影 u（1×4）" matrix={[data.projected[2]]} />
      <MatrixTable label="x=0 的 LN 输出（1×4）" matrix={[data.normalized[2]]} />
      <p>类别列在论文中走 entity lookup + LN；不强行进入数值 RBF。本节聚焦完整数值单元格；论文未详细说明的缺失值策略不在算例中展开。方法段的可学习参数描述与消融的固定 σ / 均匀中心设置应分开理解。</p>
    </Detail>
    <div style={{ marginTop: 20, borderTop: `1px solid ${palette.line}`, paddingTop: 16 }}>
      <button type="button" aria-expanded={gateOpen} aria-controls="rabel-gate-details" onClick={() => { setGateOpen(!gateOpen); if (!gateOpen) setGateInput('1'); }} style={{ border: `1px solid ${palette.line}`, borderRadius: 8, background: '#fff', color: palette.ink, padding: '10px 14px', font: 'inherit', cursor: 'pointer' }}>{gateOpen ? '收起指数门控' : '展开指数门控（选读）'}</button>
      {gateOpen && <div id="rabel-gate-details">
        <Source kind="P · I · T" loc="pp4–5 式(5)–(10)">可选扩展；这里只用人工门控权重演示计算，不是作者训练权重。</Source>
        <p><strong>门控原始值示意：</strong>独立原始 x = {gateInput}，不取上方标准化后的 x，不改变上方基础流程。</p>
        <Chips label="门控原始数值" value={gateInput} onChange={setGateInput} options={[{ value: '0.01', label: '数量级 x = 0.01' }, { value: '1', label: '数量级 x = 1' }, { value: '100', label: '数量级 x = 100' }]} />
        <Controls>
          <Metric label="log₂(|x| + 10⁻⁶)" value={fmt(gated.logMagnitude, 5)} />
          <Metric label="中心门 γc" value={fmt(gated.gammaC, 6)} />
          <Metric label="带宽门 γσ" value={fmt(gated.gammaSigma, 6)} />
        </Controls>
        <p>两个正门分别共享缩放<strong>全部 3 个中心</strong>和<strong>全部 3 个带宽</strong>。中心变成 [{RBF_C.map(c => fmt(c * gated.gammaC, 5)).join(', ')}]，共同 σ = {fmt(gated.gammaSigma, 5)}。</p>
        <p>φⱼ = exp[−(x − γc cⱼ)² / (2(γσ σ)²)] → 同一个 W → 每 token LN。</p>
        <MatrixTable label="门控 RBF 响应（独立原始 x）" matrix={[gated.phi]} />
        <MatrixTable label="门控后的 LN 输出" matrix={[gated.normalized]} />
        <Feedback>这里没有额外幅值门。有限指数 bins、ε 和任意 MLP 不构成严格尺度等变的保证；原始数值远离调节后的核中心时，响应可能极小甚至数值下溢为 0。</Feedback>
        {Math.abs(gated.logMagnitude) > 8 && <Feedback tone="bad">当前数量级超出主要覆盖范围 [−8, 8]；不可把边界覆盖解释成严格等变。</Feedback>}
        <Detail title="指数软分配与人工 MLP 的完整计算约定">
          <p>β = 2，τ = 10⁻⁶，T = 1，b ∈ {'{−8, …, 8}'}；ℓ = log₂(|x| + τ)，π(b) = exp[−(ℓ−b)²/T] / Σᵦ′ exp[−(ℓ−b′)²/T]。计算减去最大 logit 保持稳定。</p>
          <p>人工指数 embedding uᵦ = b/8，z_exp = Σπ(b)uᵦ；符号 embedding = sign(x)。两层人工 MLP：h = tanh([z_exp, sign(x)])；[γc, γσ] = Softplus([h₁ + 0.1h₂, 0.5h₁ − 0.1h₂])。</p>
          <MatrixTable label="指数 bin 与软分配 π" matrix={gated.bins.map((b, i) => [b, gated.pi[i]])} headers={['bin b', 'π(b)']} />
          <p>这组人工参数只是复算门控关系，不是论文模型配置，也不输出 AUC。收起此区即可完整学习基础 RaBEL。</p>
        </Detail>
      </div>}
    </div>
  </WidgetFrame>;
}
