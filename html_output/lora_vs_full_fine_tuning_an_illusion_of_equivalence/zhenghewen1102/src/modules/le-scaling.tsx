import { useState, type ReactNode } from 'react';
import { S, Slider, Mixer, Feedback, fmt } from './le-kit';
import './le.css';
import './middle.css';

function NumberMatrix({ values, label }: { values: number[][]; label: ReactNode }) {
  return <div className="le-middle-matrix-group">
    {label && <div className="le-middle-matrix-name">{label}</div>}
    <div className="le-middle-matrix" style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}>
      {values.flatMap((row, i) => row.map((v, j) => <span key={`${i}-${j}`}>{fmt(Math.abs(v) < .000001 ? 0 : v, 2)}</span>))}
    </div>
  </div>;
}

function AngleKnob({ theta }: { theta: number }) {
  return <svg className="le-middle-knob" viewBox="0 0 150 150" aria-hidden="true">
    <circle cx="75" cy="75" r="61" fill="#e4ded3" stroke="#b99c79" strokeWidth="9" />
    <circle cx="75" cy="75" r="44" fill="#faf8f3" stroke="#27446e" strokeWidth="4" />
    <g style={{ transform: `rotate(${theta - 45}deg)`, transformOrigin: '75px 75px', transition: 'transform 180ms ease' }}>
      <path d="M75 75V42" stroke="#f07e47" strokeWidth="10" strokeLinecap="round" />
    </g>
    <circle cx="75" cy="75" r="10" fill="#27446e" />
  </svg>;
}

export function LeGradient() {
  const [theta, setTheta] = useState(0);
  const angle = theta * Math.PI / 180;
  const c = Math.cos(angle), d = Math.sin(angle);
  const full = [[-.1, 0], [0, -.1]];
  const low = [[-.1 * c * c, -.1 * c * d], [-.1 * c * d, -.1 * d * d]];
  const deltaY = low.map(row => row[0] + row[1]);
  return <div className="le-page le-middle-gradient">
    <div className="le-middle-context">二维教学计算：普通梯度下降，初始 <S meaning="B₀：初始的 2×1 适配器矩阵，全为零。">B₀ = 0</S>，<S meaning="G：损失对合并权重的梯度；本例为 2×2 单位矩阵。">G = I₂</S>，<S meaning="η：本例的梯度步长，设为 0.1。">η = 0.1</S>，<S meaning="s：适配分支缩放 α/r；本例固定为 1。">s = 1</S>。</div>
    <div className="le-middle-comparison">
      <section className="le-middle-method">
        <h3>全参数微调</h3>
        <div className="le-middle-equation"><S meaning="ΔW全参：首次梯度更新产生的 2×2 权重变化。">ΔW全参</S> = −<S meaning="η：梯度步长，本例 0.1。">η</S><S meaning="G：本例取单位矩阵的权重梯度。">G</S></div>
        <div className="le-middle-matrix-comparison">
          <NumberMatrix values={full} label={null} />
          <div className="le-middle-output"><span>输入 [1, 1]ᵀ</span><strong>输出变化</strong><b>[−0.10, −0.10]ᵀ</b></div>
        </div>
        <p>两个坐标方向都沿原始梯度更新。</p>
      </section>
      <section className="le-middle-method le-middle-lora">
        <h3>低秩适配 · 秩 1</h3>
        <div className="le-middle-equation"><S meaning="ΔW低秩：计入分支缩放之后，首次低秩适配的有效权重变化。">ΔW低秩</S> = −<S meaning="η：梯度步长，本例 0.1。">η</S><S meaning="s²：适配分支缩放 α/r 的平方，本例为 1。">s²</S><S meaning="G：与左侧完全相同的 2×2 权重梯度。">G</S><S meaning="AᵀA：由 1×2 的初始 A 构成的 2×2 矩阵。本例 A 为单位行向量，AᵀA 投影到其方向。">AᵀA</S></div>
        <div className="le-middle-matrix-comparison">
          <NumberMatrix values={low} label={null} />
          <div className="le-middle-output"><span>输入 [1, 1]ᵀ</span><strong>输出变化</strong><b data-value="gradient-output">[{fmt(deltaY[0])}, {fmt(deltaY[1])}]ᵀ</b></div>
        </div>
        <p><S meaning="A：1×2 初始适配器矩阵；本例 [cosθ, sinθ]。">A</S> = [{fmt(c)}, {fmt(d)}]，它决定保留的更新方向。</p>
      </section>
    </div>
    <div className="le-middle-direction">
      <AngleKnob theta={theta} />
      <div className="le-middle-direction-control"><Slider label="适配器方向 θ" value={theta} min={0} max={90} step={1} unit="°" onChange={setTheta} /></div>
      <button className="le-btn" onClick={() => setTheta(0)}>重置</button>
    </div>
    <Feedback tone="blue">{theta === 45 ? '45° 时，这一个输入的输出变化恰好相同，两个更新矩阵仍不同。' : `方向 ${theta}°：低秩更新保留这个方向上的梯度分量。`} 初始 B 为零，A 的第一步梯度也为零。</Feedback>
  </div>;
}

const ranks = [1, 2, 4, 8, 16, 64];
function scalar(n: number) { return Number(n.toFixed(10)).toString(); }

export function LeScaling() {
  const [rank, setRank] = useState(8);
  const [mode, setMode] = useState<'scaled' | 'fixed'>('scaled');
  const alpha = mode === 'scaled' ? 2 * rank : 8;
  const eta = .0024 / alpha;
  const scale = alpha / rank;
  const coefficient = eta * scale * scale;
  return <div className="le-page le-middle-scaling">
    <section className="le-middle-rank-desk">
      <h3>适配器的通道数</h3>
      <div className="le-middle-rank-choices" role="group" aria-label="选择适配秩">
        {ranks.map(r => <button key={r} className={`le-btn ${rank === r ? 'is-selected' : ''}`} aria-pressed={rank === r} onClick={() => setRank(r)}>{r}</button>)}
      </div>
      <div className="le-middle-mixer-art"><Mixer levels={[6 * rank / 64, 6 * alpha / 128, 6 * scale / 8]} active={2} /></div>
      <div className="le-middle-mixer-labels"><span><S meaning="r：适配矩阵的秩，决定可训练通道数。">r</S> = {rank}</span><span><S meaning="α：分支缩放超参数。">α</S> = {alpha}</span><span><S meaning="s：实际乘在 BA 前面的分支缩放，s=α/r。">s</S> = {fmt(scale)}</span></div>
      <p>通道数和增益同步更新。</p>
    </section>
    <section className="le-middle-linked-settings">
      <div className="le-middle-mode" role="group" aria-label="选择缩放规则">
        <button className={`le-btn ${mode === 'scaled' ? 'is-selected' : ''}`} aria-pressed={mode === 'scaled'} onClick={() => setMode('scaled')}>α 随秩增长：2r</button>
        <button className={`le-btn ${mode === 'fixed' ? 'is-selected' : ''}`} aria-pressed={mode === 'fixed'} onClick={() => setMode('fixed')}>α 固定为 8</button>
        <button className="le-btn" onClick={() => { setRank(8); setMode('scaled'); }}>重置</button>
      </div>
      <p>保持 <S meaning="αη：缩放超参数与学习率的乘积；论文主实验以 0.0024 固定该乘积，本页据此比较两种联动。">αη = 0.0024</S> 的教学联动：</p>
      <div className="le-middle-setting-line"><span>分支缩放</span><strong><S meaning="s：作用在 BA 前的缩放系数。">s</S> = <S meaning="α：当前缩放超参数。">α</S> / <S meaning="r：当前适配秩。">r</S> = {fmt(scale)}</strong></div>
      <div className="le-middle-setting-line"><span>学习率</span><strong><S meaning="η：依据固定乘积 αη=0.0024 得到的学习率。">η</S> = 0.0024 / {alpha} = {scalar(eta)}</strong></div>
      <div className="le-middle-coefficient"><span>第一步更新前的系数</span><strong><S meaning="ηs²：首次有效更新 −ηs²GAᵀA 前的系数；本页只计算该标量。">ηs²</S> = <b data-value="first-step-coefficient">{scalar(coefficient)}</b></strong></div>
      <p>同一秩下，缩放设置会改变有效更新。论文中随秩设定 α 的模型更充分地利用高秩容量。</p>
    </section>
    <div className="le-middle-scaling-feedback"><Feedback tone="blue">{mode === 'scaled' ? `α = 2r 使分支缩放始终为 2；当前学习率为 ${scalar(eta)}。` : `固定 α = 8 后，分支缩放随秩增加而减小；当前为 ${fmt(scale)}。`} 任务表现和遗忘还要结合训练结果判断。</Feedback></div>
  </div>;
}

const H = [[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1], [1, -1, -1, 1]].map(row => row.map(v => v / 2));
export function LeIntervene() {
  const [lambda, setLambda] = useState(1);
  const spectrum = [4 * lambda, 3, 2, 1];
  const matrix = H.map(row => H.map(other => row.reduce((sum, v, k) => sum + v * spectrum[k] * other[k], 0)));
  const y = matrix.map(row => [row[0]]);
  return <div className="le-page le-middle-intervene">
    <section className="le-middle-fader-section">
      <h3>只调低选中的奇异项</h3>
      <div className="le-middle-fader-art"><Mixer levels={spectrum} active={0} /></div>
      <div className="le-middle-spectrum-values">{spectrum.map((n, i) => <span className={i === 0 ? 'is-active' : ''} key={i}>{fmt(n)}</span>)}</div>
      <Slider label="入侵项缩放 λ" value={lambda} min={0} max={1.5} step={.05} onChange={setLambda} />
      <button className="le-btn" onClick={() => setLambda(1)}>恢复原强度</button>
    </section>
    <section className="le-middle-reconstruction">
      <div className="le-middle-intervene-equation"><S meaning="Wλ：干预后 4×4 权重矩阵。">Wλ</S> = <S meaning="W_t：微调后已合并的完整权重矩阵，本例为 H diag(4,3,2,1) Hᵀ。">W_t</S> + (<S meaning="λ：所选项的缩放倍数，0 删除该项，1 保持原值。">λ</S> − 1)<S meaning="σ₁：干预前所选入侵项的奇异值，本例为 4。">σ₁</S><S meaning="u₁v₁ᵀ：所选左、右奇异向量的外积，形状 4×4；本例每个元素为 1/4。">u₁v₁ᵀ</S></div>
      <div className="le-middle-reconstruct-row">
        <NumberMatrix values={matrix} label={<S meaning="Wλ：H diag(4λ,3,2,1) Hᵀ；H 是四维归一化 Hadamard 正交矩阵。">Wλ（4×4）</S>} />
        <span className="le-middle-math-op">×</span>
        <NumberMatrix values={[[1], [0], [0], [0]]} label={<S meaning="x：固定的 4×1 输入向量 [1,0,0,0]ᵀ。">x</S>} />
        <span className="le-middle-math-op">=</span>
        <div data-value="intervention-output"><NumberMatrix values={y} label={<S meaning="y：4×1 输出，等于干预后矩阵的第一列。">y</S>} /></div>
      </div>
      <p>四维教学例：所选项的每个元素贡献由 1 变成 {fmt(lambda)}；其余三个分量保持原强度。</p>
      <p>论文在每个含入侵维度的权重矩阵中，只缩放其中奇异值最大的那一项。</p>
    </section>
    <div className="le-middle-intervene-feedback"><Feedback tone={lambda < 1 ? 'green' : lambda > 1 ? 'orange' : 'blue'}>{lambda === 0 ? 'λ = 0：移除所选项，保留其余微调后分量。' : lambda === 1 ? 'λ = 1：权重保持不变，输出为 [2.50, 0.50, 1.00, 0.00]ᵀ。' : `λ = ${fmt(lambda)}：所选项的强度从 4 变为 ${fmt(spectrum[0])}，输出也随之改变。`} 这个计算展示权重操作，下一页核对实际遗忘变化。</Feedback></div>
  </div>;
}
