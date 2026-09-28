import React from 'react';
import type { WidgetProps } from './registry';

// 第四章：为什么二阶 Hessian 信息对量化至关重要。
// 对标参考范例的多 section 叙事：先看例子 → 因果链 → 一阶/二阶对比卡片 → 结论。
export const Ch4Hessian: React.FC<WidgetProps> = () => {
  return (
    <section className="ch4-page" data-testid="ch4-hessian">
      <header className="ch4-heading">
        <div>
          <small>先看一个直观例子</small>
          <strong>同样的量化误差，落在不同权重方向上，损失变化为什么差那么多？</strong>
        </div>
      </header>

      <section className="ch4-visual" aria-labelledby="ch4-visual-title">
        <h5 id="ch4-visual-title">不同权重方向的敏感度对比</h5>
        <svg className="ch4-svg" viewBox="0 0 1060 300" role="img" aria-label="损失曲面上两个方向的敏感度对比">
          <defs>
            <marker id="ch4ArrowRed" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="#c43f52" />
            </marker>
          </defs>

          {/* 左：低敏感方向（平坦） */}
          <text x="305" y="40" textAnchor="middle" className="ch4-dir-title">低敏感方向 w₁（平坦）</text>
          <path d="M130 176 Q305 194 480 176" className="ch4-curve-flat" />
          <circle cx="305" cy="185" r="8" className="ch4-t-mark" />
          <circle cx="355" cy="184.4" r="8" className="ch4-q-mark" />
          <line x1="305" y1="212" x2="355" y2="212" className="ch4-dw-line" />
          <text x="330" y="230" textAnchor="middle" className="ch4-dw-label">量化误差 Δw</text>
          <line x1="355" y1="184.4" x2="355" y2="185" className="ch4-dl-flat" />
          <text x="372" y="189" className="ch4-dl-flat-label">ΔL 很小</text>

          {/* 右：高敏感方向（陡峭） */}
          <text x="755" y="40" textAnchor="middle" className="ch4-dir-title">高敏感方向 w₂（陡峭）</text>
          <path d="M580 84 Q755 194 930 84" className="ch4-curve-steep" />
          <circle cx="755" cy="139" r="8" className="ch4-t-mark" />
          <circle cx="805" cy="149" r="8" className="ch4-q-mark" />
          <line x1="755" y1="212" x2="805" y2="212" className="ch4-dw-line" />
          <text x="780" y="230" textAnchor="middle" className="ch4-dw-label">量化误差 Δw</text>
          <line x1="805" y1="149" x2="805" y2="139" className="ch4-dl-steep" />
          <text x="822" y="140" className="ch4-dl-steep-label">ΔL 大</text>
        </svg>
        <p>同样的误差 Δw，在平坦方向损失几乎不变，在陡峭方向损失显著上升。</p>
        <small className="ch4-boundary">机制示意，非论文定量实验数据。</small>
      </section>

      <section className="ch4-causal" aria-labelledby="ch4-chain-title">
        <div className="ch4-section-title">
          <span>为什么需要二阶信息？</span>
          <strong id="ch4-chain-title">因为一阶梯度只知道方向，不知道「曲率」。</strong>
        </div>
        <div className="ch4-causal-line" aria-label="二阶信息决定补偿方向的因果链">
          <div><strong>量化权重 w</strong><small>引入误差 Δw</small></div>
          <b>→</b>
          <div><strong>损失变化</strong><small>ΔL ≈ ½ΔwᵀHΔw</small></div>
          <b>→</b>
          <div><strong>H 对角元</strong><small>各方向敏感度</small></div>
          <b>→</b>
          <div><strong>优先补偿</strong><small>敏感方向不偏移</small></div>
        </div>
      </section>

      <section className="ch4-compare" aria-labelledby="ch4-compare-title">
        <div className="ch4-section-title">
          <span>根本差别在哪里？</span>
          <strong id="ch4-compare-title">一阶信息与二阶信息回答不同的问题。</strong>
        </div>
        <div className="ch4-compare-cards">
          <article className="first-order">
            <header><span>一阶梯度</span><strong>只知道方向</strong></header>
            <p>梯度 g 指示损失上升最快的方向，但不含「该方向有多敏感」的信息，无法用于误差补偿的定向分配。</p>
          </article>
          <article className="second-order">
            <header><span>二阶 Hessian</span><strong>知道曲率（敏感度）</strong></header>
            <p>H = 2XXᵀ 刻画各权重方向的曲率，敏感度决定补偿的方向与幅度，是误差补偿成立的关键。</p>
          </article>
        </div>
        <div className="ch4-gap-summary">
          <strong>一阶只知道方向，二阶才知道敏感度，</strong>
          <span>而误差补偿恰恰需要按敏感度定向分配。</span>
        </div>
      </section>
    </section>
  );
};

export default Ch4Hessian;
