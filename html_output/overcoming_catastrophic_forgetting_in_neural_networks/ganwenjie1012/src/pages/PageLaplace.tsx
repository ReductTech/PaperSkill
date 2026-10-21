import { useState } from "react";
import { ReferenceTrigger } from "../shared/reference/ReferenceTrigger";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import { MathFormula } from "../shared/teaching/Math";

type Direction = "wide" | "narrow";

function PosteriorZoom() {
  return (
    <div className="p04-zoom-visual">
      <div className="p04-zoom-panel">
        <div className="p04-zoom-panel__heading"><span>BEFORE · FULL POSTERIOR</span><b>Task A 的复杂 Posterior</b></div>
        <svg viewBox="0 0 360 210" role="img" aria-labelledby="p04-global-title p04-global-desc">
          <title id="p04-global-title">Task A 的完整参数 Posterior 示意</title>
          <desc id="p04-global-desc">多个不规则等高线围绕 Task A 学到的参数位置；虚线框标出后续放大的局部区域。这是高维参数空间的二维示意切片。</desc>
          <path className="p04-contour p04-contour--outer" d="M45 110 C35 72 67 38 111 42 C145 18 201 41 211 69 C256 73 279 100 261 130 C267 159 222 179 184 163 C147 188 94 166 88 147 C57 152 33 135 45 110Z" />
          <path className="p04-contour p04-contour--middle" d="M76 108 C70 80 94 59 124 61 C151 41 190 55 199 81 C229 82 246 101 235 124 C232 146 199 158 174 146 C148 166 112 148 108 132 C87 137 68 124 76 108Z" />
          <path className="p04-contour p04-contour--inner" d="M103 108 C100 89 117 75 137 78 C155 63 183 71 189 91 C208 92 220 104 212 120 C207 136 184 142 166 132 C151 145 127 133 125 120 C111 124 98 117 103 108Z" />
          <circle className="p04-zoom-star" cx="157" cy="108" r="5" />
          <text className="p04-svg-label" x="166" y="103">θ<tspan baselineShift="sub">A</tspan>*</text>
          <rect className="p04-focus-box" x="132" y="87" width="50" height="43" rx="5" />
          <text className="p04-svg-note" x="22" y="194">参数空间整体 · 结构复杂</text>
        </svg>
        <p><ReferenceTrigger id="task_a_posterior">p(θ | D<sub>A</sub>)</ReferenceTrigger>：Task A 数据对整组参数配置形成的后验约束。</p>
      </div>

      <div className="p04-zoom-link" aria-label="从 Task A 的已学习参数位置，放大到附近区域">
        <span>聚焦局部</span><i aria-hidden="true" />
      </div>

      <div className="p04-zoom-panel p04-zoom-panel--local">
        <div className="p04-zoom-panel__heading"><span>AFTER · LOCAL APPROXIMATION</span><b>θ<sub>A</sub>* 附近的 Gaussian</b></div>
        <svg viewBox="0 0 360 210" role="img" aria-labelledby="p04-local-title p04-local-desc">
          <title id="p04-local-title">Task A 解附近的局部 Gaussian 示意</title>
          <desc id="p04-local-desc">一组同中心的椭圆等高线表示以 Task A 参数位置为中心的局部 Gaussian 近似。</desc>
          <ellipse className="p04-gaussian p04-gaussian--outer" cx="180" cy="105" rx="124" ry="69" />
          <ellipse className="p04-gaussian p04-gaussian--middle" cx="180" cy="105" rx="88" ry="49" />
          <ellipse className="p04-gaussian p04-gaussian--inner" cx="180" cy="105" rx="52" ry="29" />
          <circle className="p04-zoom-star" cx="180" cy="105" r="5" />
          <text className="p04-svg-label" x="191" y="100">θ<tspan baselineShift="sub">A</tspan>*</text>
          <text className="p04-svg-note" x="22" y="194">仅近似局部 · 未画出完整参数维度</text>
        </svg>
        <p><ReferenceTrigger id="laplace_approximation">Laplace approximation</ReferenceTrigger>：保留解附近的局部形状，便于表达哪些方向更受约束。</p>
      </div>
    </div>
  );
}

function LaplaceEquation({ direction, precision, cost }: { direction: Direction; precision: number; cost: number }) {
  return (
    <section className="p04-section p04-laplace" id="laplace-local-view" aria-labelledby="p04-laplace-title">
      <div className="p04-section-heading">
        <div><span className="p04-overline">LOCAL QUADRATIC · GAUSSIAN VIEW</span><h2 id="p04-laplace-title">在 Task A 解附近，用曲率描述 Posterior</h2></div>
        <p>先以 <ReferenceTrigger id="theta_a_star">θ<sub>A</sub>*</ReferenceTrigger> 为近似局部 MAP 中心。我们要计算的不是中心高度，而是偏离中心之后负对数密度增加多少。</p>
      </div>

      <div className="p04-equation-card" role="group" aria-label="局部曲率将参数偏移转换为负对数 Posterior 代价">
        <div className="p04-equation-row p04-equation-row--result" role="math" aria-label="相对参数偏移的局部代价约等于二分之一乘偏移转置、曲率矩阵和偏移">
          <span className="p04-equation-label">相同距离的偏移，沿曲率更大的方向代价更高</span>
          <MathFormula block tex={String.raw`\Delta\Phi\approx\tfrac12\Delta\theta^\mathsf{T}H_A\Delta\theta`} />
          <p className="p04-live-cost" aria-live="polite">当前沿{direction === "wide" ? "宽" : "窄"}方向：d = 0.5，局部精度 h = {precision.toFixed(2)}，代价约为 {cost.toFixed(4)}。</p>
        </div>
      </div>
      <details className="p04-derivation">
        <summary>展开 Laplace 数学推导与适用条件</summary>
        <div>
          <p>令负对数 Posterior 为 <MathFormula tex={String.raw`\Phi(\theta)=-\log p(\theta\mid D_A)`} />。在局部 MAP 点 θ<sub>A</sub>* 附近，一阶项因驻点条件消失，H<sub>A</sub> 是该点的局部 Hessian：</p>
          <MathFormula block tex={String.raw`\nabla\Phi(\theta_A^*)=0,\qquad H_A=\nabla^2\Phi(\theta_A^*)`} />
          <MathFormula block tex={String.raw`\Phi(\theta_A^*+\Delta\theta)-\Phi(\theta_A^*)\approx\tfrac12\Delta\theta^\mathsf{T}H_A\Delta\theta`} />
          <p>取负号并指数化，得到局部密度比；当 H<sub>A</sub> 正定时，对应 Gaussian 的精度是 H<sub>A</sub>、协方差是 H<sub>A</sub><sup>−1</sup>：</p>
          <MathFormula block tex={String.raw`\frac{q(\theta_A^*+\Delta\theta\mid D_A)}{q(\theta_A^*\mid D_A)}\approx\exp\!\left(-\tfrac12\Delta\theta^\mathsf{T}H_A\Delta\theta\right),\qquad q(\theta\mid D_A)\approx\mathcal{N}(\theta_A^*,H_A^{-1})`} />
          <p>由 Bayes，<MathFormula tex={String.raw`\Phi=-\log p(D_A\mid\theta)-\log p(\theta)+C`} />，因此局部精度也可能包含 Prior 曲率，不能无条件等同于旧数据 Loss 的 Hessian。实际训练得到的 θ<sub>A</sub>* 只是局部 MAP 的近似；零或负曲率需适当正则化。论文以对角 Fisher 近似局部精度，并未计算或保存这里的完整 Hessian。</p>
        </div>
      </details>
    </section>
  );
}

function DirectionalPrecision({ direction, onDirectionChange }: { direction: Direction; onDirectionChange: (direction: Direction) => void }) {
  const explanation = direction === "wide"
    ? "沿宽方向移动相同距离，仍留在靠近中心的高密度区域；旧信息对这类偏移相对宽松。"
    : "沿窄方向移动相同距离，跨过更多等密度线；密度下降更快，保持旧信息允许的偏移更小。";

  return (
    <section className="p04-section p04-directions" id="narrow-wide-directions" aria-labelledby="p04-directions-title">
      <div className="p04-section-heading">
        <div><span className="p04-overline">SAME DISTANCE · DIFFERENT LOCAL CHANGE</span><h2 id="p04-directions-title">同样移动一段距离，Posterior 的变化可以不同</h2></div>
        <p>把高维参数空间压成一个明确标注的二维示意切片，比较局部 Gaussian 的两个方向。</p>
      </div>

      <div className="p04-contour-card">
        <div className="p04-contour-meta"><span>ILLUSTRATIVE 2D PARAMETER SLICE</span><span>同一中心 θ<sub>A</sub>* · 同一坐标尺度</span></div>
        <svg className="p04-contour-chart" viewBox="0 0 680 310" role="img" aria-labelledby="p04-contour-title p04-contour-desc">
          <title id="p04-contour-title">同等长度位移在宽方向和窄方向造成不同的局部变化</title>
          <desc id="p04-contour-desc">一组椭圆 Gaussian 等高线以 theta A 星为中心。沿水平宽方向和竖直窄方向各画出长度相同的位移 d；窄方向的椭圆半轴更短，代表更高的局部精度。</desc>
          <defs>
            <marker id="p04-arrow-wide" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8" /></marker>
            <marker id="p04-arrow-narrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8" /></marker>
          </defs>
          <line className="p04-axis" x1="104" y1="164" x2="575" y2="164" />
          <line className="p04-axis" x1="340" y1="32" x2="340" y2="278" />
          <ellipse className="p04-chart-contour p04-chart-contour--outer" cx="340" cy="164" rx="190" ry="91" />
          <ellipse className="p04-chart-contour p04-chart-contour--middle" cx="340" cy="164" rx="135" ry="64.65" />
          <ellipse className="p04-chart-contour p04-chart-contour--inner" cx="340" cy="164" rx="80" ry="38.31" />
          <line className={`p04-displacement p04-displacement--wide ${direction === "wide" ? "is-selected" : ""}`} x1="340" y1="164" x2="408" y2="164" markerEnd="url(#p04-arrow-wide)" />
          <line className={`p04-displacement p04-displacement--narrow ${direction === "narrow" ? "is-selected" : ""}`} x1="340" y1="164" x2="340" y2="96" markerEnd="url(#p04-arrow-narrow)" />
          <circle className="p04-center-dot" cx="340" cy="164" r="5" />
          <circle className="p04-wide-dot" cx="408" cy="164" r="6" />
          <circle className="p04-narrow-dot" cx="340" cy="96" r="6" />
          <text className="p04-chart-label" x="348" y="184">θ<tspan baselineShift="sub">A</tspan>*</text>
          <text className="p04-chart-label p04-chart-label--wide" x="423" y="151">宽方向</text>
          <text className="p04-chart-label p04-chart-label--narrow" x="352" y="90">窄方向</text>
          <text className="p04-chart-distance" x="371" y="151">d</text>
          <text className="p04-chart-distance" x="350" y="131">d</text>
          <text className="p04-chart-axis-label" x="584" y="170">参数方向 1</text>
          <text className="p04-chart-axis-label" x="348" y="29">参数方向 2</text>
        </svg>

        <div className="p04-direction-controls" role="group" aria-label="查看等长移动在不同方向上的局部变化">
          <button type="button" aria-pressed={direction === "wide"} className={direction === "wide" ? "is-active" : ""} onClick={() => onDirectionChange("wide")}>沿宽方向移动 d</button>
          <button type="button" aria-pressed={direction === "narrow"} className={direction === "narrow" ? "is-active" : ""} onClick={() => onDirectionChange("narrow")}>沿窄方向移动 d</button>
        </div>
        <p className="p04-direction-explanation" aria-live="polite">{explanation}</p>
        <div className="p04-direction-legend"><span className="p04-legend-item p04-legend-item--wide"><i /> 宽方向：局部精度较低</span><span className="p04-legend-item p04-legend-item--narrow"><i /> 窄方向：局部精度较高</span></div>
      </div>
      <p className="p04-boundary-note">二维等高线为概念示意，非实测参数切片；两方向移动距离均为 d=0.5。</p>
    </section>
  );
}

export function PageLaplace() {
  const api = useReferenceApi();
  const [direction, setDirection] = useState<Direction>("wide");
  const precision = direction === "wide" ? 0.5 : 2.18;
  const cost = 0.5 * precision * 0.5 ** 2;

  return (
    <article className="ewc-page p04-page" aria-labelledby="p04-title">
      <header className="ewc-page-header p04-header">
        <div className="ewc-page-header__kicker"><span>04</span> FROM GLOBAL POSTERIOR TO LOCAL GAUSSIAN</div>
        <h1 id="p04-title">在 Task A 解附近保留局部约束</h1>
        <p className="ewc-page-header__dek">P3 已说明旧数据会改变参数支持度；只保存最高点的位置，仍不知道离开它一点会损害多少。完整高维 Posterior 又难以保存。因此先看旧解附近的宽窄，再用局部二阶近似留下中心与偏移代价。</p>
      </header>

      <section className="p04-section p04-global-local" id="posterior-global-to-local" aria-labelledby="p04-global-local-title">
        <div className="p04-section-heading">
          <div><span className="p04-overline">A LOCAL VIEW OF TASK A</span><h2 id="p04-global-local-title">从复杂的完整 Posterior，聚焦到已学到的参数位置</h2></div>
          <p>Task A 结束时，普通训练已经给出一个参数解；这里从它周围取局部视图。</p>
        </div>
        <PosteriorZoom />
        <p className="p04-visual-boundary">这是帮助理解数学近似关系的概念图：完整 Posterior 与局部 Gaussian 都不是教程声称实际分配、保存的网络对象。</p>
      </section>

      <DirectionalPrecision direction={direction} onDirectionChange={setDirection} />
      <LaplaceEquation direction={direction} precision={precision} cost={cost} />

      <section className="p04-handoff" id="fisher-handoff" aria-labelledby="p04-handoff-title">
        <div><span className="p04-overline">NEXT · A COMPUTABLE LOCAL PRECISION</span><h2 id="p04-handoff-title">论文用对角 Fisher 近似局部精度</h2>
          <p>现在得到旧中心与局部曲率，但 P 个参数需要一个 P × P 的 Hessian，难存也难算。能否从网络预测得到每个坐标的近似权重？下一页解释 <ReferenceTrigger id="fisher_information">Fisher Information</ReferenceTrigger> 与局部预测变化的关系，以及只保留对角项的代价。</p>
        </div>
        <button type="button" onClick={() => api.navigatePage("page-05-fisher")}>继续到 Page 5 · Fisher <span aria-hidden="true">→</span></button>
      </section>

      <nav className="p04-page-nav" aria-label="学习页面导航">
        <button type="button" onClick={() => api.navigatePage("page-03-bayes")}>← Page 3 · Prior 与 Posterior</button>
        <button type="button" onClick={() => api.navigatePage("page-05-fisher")}>Page 5 · Fisher →</button>
      </nav>
    </article>
  );
}
