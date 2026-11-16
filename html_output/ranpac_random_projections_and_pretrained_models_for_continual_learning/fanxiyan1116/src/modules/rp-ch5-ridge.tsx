import React, { useMemo } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const eigenvalues = [0.08, 0.6, 1.4, 5.0];
const classOne = [0.55, 0.42, -0.28, 0.36];
const classTwo = [0.12, 0.7, 0.31, -0.22];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function logTick(exponent: number) {
  return exponent % 2 === 0 ? `10${exponent < 0 ? '⁻' : ''}${Math.abs(exponent)}` : '';
}

export function RpCh5Ridge() {
  const [exponent, setExponent] = React.useState(-1);
  const lambda = 10 ** exponent;
  const data = useMemo(() => {
    const gains = eigenvalues.map((eigenvalue) => 1 / (eigenvalue + lambda));
    const weightsOne = gains.map((gain, index) => gain * classOne[index]);
    const weightsTwo = gains.map((gain, index) => gain * classTwo[index]);
    const marginRaw = weightsOne.reduce((sum, value) => sum + value, 0)
      - weightsTwo.reduce((sum, value) => sum + value, 0);
    return {
      gains,
      weightsOne,
      weightsTwo,
      marginRaw,
      margin: Math.tanh(marginRaw * 0.35),
      minGain: Math.min(...gains),
      maxGain: Math.max(...gains),
      condition: Math.max(...gains) / Math.min(...gains),
    };
  }, [lambda]);
  const curve = Array.from({ length: 33 }, (_, index) => {
    const x = -8 + index * 0.5;
    const localLambda = 10 ** x;
    const localGains = eigenvalues.map((eigenvalue) => 1 / (eigenvalue + localLambda));
    const raw = localGains.reduce((sum, gain, i) => sum + gain * (classOne[i] - classTwo[i]), 0);
    return { x, y: Math.tanh(raw * 0.35) };
  });
  const feedback = exponent < -2
    ? 'λ 过小：最小方向被强烈放大，类别对比容易被不稳定纹理主导。'
    : exponent > 2
      ? 'λ 过大：所有方向被同等压住，类别证据也被过度平滑。'
      : 'λ 处于教学平衡区：不稳定方向被压住，类别差异仍保留。';

  return (
    <div className="rp-widget rp-two-col rp-ridge-widget">
      <section className="rp-panel rp-canvas-panel">
        <div className="rp-context-block">
          <h3>闭式解：完全避免SGD</h3>
          <p>
            <strong>RanPAC的核心创新：</strong>在Phase 2阶段，模型只累积统计量，
            用<strong>闭式解（closed-form solution）</strong>计算分类器权重，
            完全绕过 SGD 更新，从根源上避免灾难性遗忘。
          </p>
          <p>
            <strong>累积的统计量</strong>（论文第5页公式4-5）：<br/>
            • Gram矩阵：<strong>G = Σ h h^T</strong> （M×M，投影特征的二阶统计）<br/>
            • 类原型矩阵：<strong>C = Σ h y^T</strong> （M×K，投影特征与one-hot标签的外积和）
          </p>
          <p>
            <strong>闭式输出权重</strong>（论文第5页公式6）：<br/>
            <strong>W_o = (G + λI)^(-1) C</strong>
          </p>
          <p>
            其中 λI 是<strong>岭正则化项</strong>（Ridge regularization），
            使 G 的逆更稳定。没有偏置项。
          </p>
        </div>
        <div className="rp-panel-heading">
          <span>固定教学特征值</span>
          <strong>{`条件比 ${data.condition.toFixed(1)}`}</strong>
        </div>
        <div className="rp-eigen-grid">
          {eigenvalues.map((eigenvalue, index) => {
            const gain = data.gains[index];
            const height = clamp(Math.log10(gain + 1) / 3, 0.08, 1) * 100;
            return (
              <div className="rp-eigen-column" key={eigenvalue}>
                <div className="rp-eigen-track">
                  <i
                    className={eigenvalue < 0.2 ? 'is-unstable' : ''}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <strong>{eigenvalue.toFixed(2)}</strong>
                <span>{`×${gain.toFixed(gain >= 100 ? 0 : 2)}`}</span>
              </div>
            );
          })}
        </div>
        <div className="rp-teaching-note" style={{ marginTop: '12px' }}>
          <strong>特征值与逆增益：</strong>
          四个固定教学特征值模拟 G 在主方向上的强弱。
          最小特征值（0.08）对应最不稳定的方向，
          λ 过小时该方向的逆增益可达数百倍，放大噪声。
        </div>
        <div className="rp-contrast-chart" aria-label="岭参数与类别对比的教学曲线">
          <svg viewBox="0 0 620 168" role="img" aria-label="类别对比随 lambda 变化的曲线">
            <line x1="22" y1="84" x2="596" y2="84" className="rp-chart-axis" />
            <polyline
              className="rp-chart-line"
              points={curve.map((point) => `${22 + (point.x + 8) / 16 * 574},${84 - point.y * 65}`).join(' ')}
            />
            <line
              x1={22 + (exponent + 8) / 16 * 574}
              y1="16"
              x2={22 + (exponent + 8) / 16 * 574}
              y2="152"
              className="rp-chart-cursor"
            />
          </svg>
          <span>类别对比曲线（教学构造）</span>
        </div>
      </section>

      <section className="rp-panel rp-controls-panel">
        <div className="rp-context-block">
          <p>
            <strong>λ 的作用：</strong>
            岭参数 λ 通过在 G 的对角线上加一个常数项，
            使矩阵的最小特征值不至于太小，从而稳定逆矩阵。
            λ 越大，逆增益越接近 1/λ，所有方向被均匀压制。
          </p>
          <p>
            <strong>λ 如何选择？</strong>（论文第6页§4.1）<br/>
            在<strong>当前任务</strong>的 80:20 训练/验证划分上，
            从 10^(-8) 到 10^8 之间网格搜索最优值。
            <strong>不回放旧任务数据</strong>来选 λ。
          </p>
          <p>
            <strong>警告：</strong>λ 不是"准确率旋钮"。
            过小的 λ 放大不稳定方向，过大的 λ 连类别证据也压平。
            最优 λ 取决于 G 的条件数和当前任务的数据分布。
          </p>
        </div>
        <label className="rp-range-label" htmlFor="rp-lambda-range">
          <span>岭参数 <SymbolHint meaning="岭校准强度，用于稳定 Gram 矩阵的逆">λ</SymbolHint></span>
          <strong>{formatLambda(exponent)}</strong>
        </label>
        <input
          id="rp-lambda-range"
          type="range"
          min="-8"
          max="8"
          step="0.05"
          value={exponent}
          onChange={(event) => setExponent(Number(event.target.value))}
        />
        <div className="rp-log-axis" aria-label="lambda 对数刻度">
          {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((tick) => (
            <span key={tick}>{logTick(tick)}</span>
          ))}
        </div>
        <div className="rp-segmented rp-three">
          <button type="button" onClick={() => setExponent(-5)}>弱压力</button>
          <button type="button" onClick={() => setExponent(-1)}>平衡</button>
          <button type="button" onClick={() => setExponent(5)}>强压力</button>
        </div>
        <div className="rp-weight-bars" aria-label="两个类别的输出权重">
          <div>
            <span>类别 A 输出权重</span>
            <i style={{ width: `${clamp(Math.abs(data.weightsOne.reduce((a, b) => a + b, 0)) * 32, 3, 100)}%` }} />
          </div>
          <div>
            <span>类别 B 输出权重</span>
            <i style={{ width: `${clamp(Math.abs(data.weightsTwo.reduce((a, b) => a + b, 0)) * 32, 3, 100)}%` }} />
          </div>
          <strong>{`教学分数余量 ${data.margin.toFixed(2)}`}</strong>
        </div>
        <div className="rp-formula-strip">
          <SymbolHint meaning="输出权重由累计统计经岭校准闭式求出">Wₒ=(G+λI)⁻¹C</SymbolHint>
          <span>{` 最小方向 ×${data.minGain.toFixed(2)}，最大方向 ×${data.maxGain.toFixed(2)}`}</span>
        </div>
        <div className="rp-feedback">
          <strong>{formatLambda(exponent)}</strong>
          <span>{feedback} λ 由当前任务 80:20 划分选择，不回放旧任务，也不是通用准确率旋钮。</span>
        </div>
        <div className="rp-context-block" style={{ marginTop: '16px' }}>
          <p>
            <strong>总结：</strong>
            RanPAC通过冻结参数+累积统计+岭校准闭式解，
            实现了完全无遗忘的持续学习。Phase 2 没有任何 SGD 更新。
            下一章展示 Phase 2 的完整数据流。
          </p>
        </div>
      </section>
    </div>
  );
}

function formatLambda(exponent: number) {
  const rounded = Math.round(exponent * 100) / 100;
  return `λ = 10^${rounded.toFixed(2)}`;
}
