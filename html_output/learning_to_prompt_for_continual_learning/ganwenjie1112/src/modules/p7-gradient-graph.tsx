import "./p7-gradient-graph.css";

export function P7GradientGraph() {
  return <figure className="p7-gradient-graph" aria-label="有向梯度路径图：分类损失更新 Prompt 和分类器，匹配损失直接更新已选 Key，硬 Top-N 只传递索引">
    <div className="p7-gradient-graph__legend" aria-hidden="true">
      <span><i className="p7-legend-gradient" />损失梯度方向</span>
      <span><i className="p7-legend-selection" />前向检索与离散选集</span>
      <span><i className="p7-legend-frozen" />冻结计算仍传递输入梯度</span>
    </div>
    <div className="p7-gradient-graph__scroll" role="region" tabIndex={0} aria-label="P7 梯度节点图，可横向滚动查看">
      <svg viewBox="0 0 1200 440" role="img" aria-labelledby="p7-gradient-title p7-gradient-description">
        <title id="p7-gradient-title">分类损失与匹配损失的不同梯度去向</title>
        <desc id="p7-gradient-description">分类梯度由损失回到分类器和选中的 Prompt，并穿过冻结 Transformer 的输入计算；硬 Top-N 只输出整数索引。匹配损失沿余弦距离直接更新选中的 Key。</desc>
        <path className="p7-graph-rule" d="M25 245H1175" />

        <text x="38" y="29" className="p7-graph-lane p7-graph-lane--cls">分类梯度 · ∇Lcls</text>
        <g className="p7-graph-node p7-graph-node--loss">
          <rect x="38" y="57" width="138" height="62" rx="8" />
          <text x="107" y="80" className="p7-graph-node__main" textAnchor="middle"><tspan className="p7-graph-math">L</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">cls</tspan></text>
          <text x="107" y="103" className="p7-graph-node__note" textAnchor="middle">分类误差</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--cls" d="M177 83H248m-7-5 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--classifier">
          <rect x="250" y="57" width="154" height="62" rx="8" />
          <text x="327" y="80" className="p7-graph-node__main" textAnchor="middle">分类器 <tspan className="p7-graph-math">g</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">φ</tspan></text>
          <text x="327" y="103" className="p7-graph-node__note" textAnchor="middle">参数 φ 可训练</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--cls" d="M405 83H476m-7-5 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--compute">
          <rect x="478" y="57" width="150" height="62" rx="8" />
          <text x="553" y="80" className="p7-graph-node__main" textAnchor="middle">池化特征 <tspan className="p7-graph-math">h</tspan></text>
          <text x="553" y="103" className="p7-graph-node__note" textAnchor="middle">Prompt 输出均值</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--cls" d="M629 83H700m-7-5 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--frozen">
          <rect x="702" y="57" width="202" height="62" rx="8" />
          <text x="803" y="80" className="p7-graph-node__main" textAnchor="middle">冻结 Transformer <tspan className="p7-graph-math">f</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">r</tspan></text>
          <text x="803" y="103" className="p7-graph-node__note" textAnchor="middle">输入梯度通过 · 权重不更新</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--cls" d="M905 83H976m-7-5 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--prompt">
          <rect x="978" y="57" width="187" height="62" rx="8" />
          <text x="1071.5" y="80" className="p7-graph-node__main" textAnchor="middle">已选 Prompt <tspan className="p7-graph-math">P</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">s</tspan></text>
          <text x="1071.5" y="103" className="p7-graph-node__note" textAnchor="middle">向量值可训练</text>
        </g>

        <text x="38" y="151" className="p7-graph-lane p7-graph-lane--select">前向寻址 · 非梯度路径</text>
        <g className="p7-graph-node p7-graph-node--pool">
          <rect x="38" y="166" width="190" height="54" rx="5" />
          <text x="133" y="187" className="p7-graph-node__main" textAnchor="middle">Query <tspan className="p7-graph-math">q(x)</tspan> + Key 池</text>
          <text x="133" y="207" className="p7-graph-node__note" textAnchor="middle">逐一比较当前 Key</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--select" d="M229 193H321" />
        <path className="p7-graph-arrowhead p7-graph-arrowhead--select" d="m314 188 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--gate">
          <rect x="323" y="166" width="156" height="54" rx="5" />
          <text x="401" y="187" className="p7-graph-node__main" textAnchor="middle">硬 Top-N</text>
          <text x="401" y="207" className="p7-graph-node__note" textAnchor="middle">只输出离散索引</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--select" d="M480 193H568" />
        <path className="p7-graph-arrowhead p7-graph-arrowhead--select" d="m561 188 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--gate">
          <rect x="570" y="166" width="178" height="54" rx="5" />
          <text x="659" y="187" className="p7-graph-node__main" textAnchor="middle"><tspan className="p7-graph-math">S(x)</tspan>：整数索引集合</text>
          <text x="659" y="207" className="p7-graph-node__note" textAnchor="middle">选择配对 Prompt</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--select" d="M749 193H855V141H1072V121" />
        <path className="p7-graph-arrowhead p7-graph-arrowhead--select" d="m1067 128 5-7 5 7" />
        <text x="963" y="136" className="p7-graph-edge-note" textAnchor="middle">前向读取</text>
        <text x="825" y="234" className="p7-graph-boundary" textAnchor="middle"><tspan className="p7-graph-math">L</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">cls</tspan> 不穿过离散索引给 Key 排名传连续梯度</text>

        <text x="38" y="279" className="p7-graph-lane p7-graph-lane--match">Key 匹配梯度 · ∇Lmatch</text>
        <g className="p7-graph-node p7-graph-node--loss p7-graph-node--loss-match">
          <rect x="38" y="294" width="162" height="58" rx="8" />
          <text x="119" y="316" className="p7-graph-node__main" textAnchor="middle"><tspan className="p7-graph-math">L</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">match</tspan></text>
          <text x="119" y="338" className="p7-graph-node__note" textAnchor="middle">距离损失</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--match" d="M201 323H378m-7-5 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--compute p7-graph-node--distance">
          <rect x="380" y="294" width="190" height="58" rx="6" />
          <text x="475" y="316" className="p7-graph-node__main" textAnchor="middle">余弦距离 <tspan className="p7-graph-math">γ(q, k</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">j</tspan><tspan className="p7-graph-math">)</tspan></text>
          <text x="475" y="338" className="p7-graph-node__note" textAnchor="middle">对 q 与 kⱼ 连续变化</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--match" d="M571 323H748m-7-5 7 5-7 5" />
        <g className="p7-graph-node p7-graph-node--key">
          <rect x="750" y="294" width="190" height="58" rx="8" />
          <text x="845" y="316" className="p7-graph-node__main" textAnchor="middle">已选 Key <tspan className="p7-graph-math">k</tspan><tspan className="p7-graph-math" fontSize=".72em" baselineShift="sub">j</tspan></text>
          <text x="845" y="338" className="p7-graph-node__note" textAnchor="middle">匹配梯度直接更新</text>
        </g>
        <g className="p7-graph-node p7-graph-node--fixed-query">
          <rect x="380" y="378" width="190" height="44" rx="8" />
          <text x="475" y="396" className="p7-graph-node__main" textAnchor="middle">Query <tspan className="p7-graph-math">q(x)</tspan></text>
          <text x="475" y="414" className="p7-graph-node__note" textAnchor="middle">冻结提取 · 固定输入</text>
        </g>
        <path className="p7-graph-edge p7-graph-edge--query" d="M475 376V354" />
        <path className="p7-graph-arrowhead p7-graph-arrowhead--query" d="m470 361 5-7 5 7" />
      </svg>
    </div>
    <p className="p7-gradient-graph__hint">窄屏可横向滑动查看完整节点路径</p>
    <figcaption>两种信号各有目标：分类误差训练分类器与已选 Prompt；匹配损失直接作用于已选 Key。箭头表示训练路径，不表示梯度大小。</figcaption>
  </figure>;
}
