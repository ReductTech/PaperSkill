const INPUT_NODES = [28, 63, 98];
const HIDDEN_NODES = [17, 39, 61, 83, 105];
const OUTPUT_NODES = [28, 63, 98];

/** The same shared network mark used on Page 1, reused by the Fisher teaching view. */
export function EWCNetworkDiagram({ compact = false, idPrefix }: { compact?: boolean; idPrefix: string }) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  return (
    <svg
      className={`p01-network ${compact ? "p01-network--compact" : ""}`}
      viewBox="0 0 250 122"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>同一个共享参数神经网络</title>
      <desc id={descriptionId}>输入层连接到隐藏层，再连接到输出层；网络参数统一记作 theta。</desc>
      <g className="p01-network__wires" aria-hidden="true">
        {INPUT_NODES.flatMap((inputY, inputIndex) => HIDDEN_NODES.map((hiddenY, hiddenIndex) => (
          <line key={`ih-${inputIndex}-${hiddenIndex}`} x1="24" y1={inputY} x2="123" y2={hiddenY} />
        )))}
        {HIDDEN_NODES.flatMap((hiddenY, hiddenIndex) => OUTPUT_NODES.map((outputY, outputIndex) => (
          <line key={`ho-${hiddenIndex}-${outputIndex}`} x1="127" y1={hiddenY} x2="226" y2={outputY} />
        )))}
      </g>
      <g className="p01-network__nodes p01-network__nodes--input" aria-hidden="true">
        {INPUT_NODES.map((y) => <circle key={`input-${y}`} cx="22" cy={y} r="7" />)}
      </g>
      <g className="p01-network__nodes p01-network__nodes--hidden" aria-hidden="true">
        {HIDDEN_NODES.map((y) => <circle key={`hidden-${y}`} cx="125" cy={y} r="7" />)}
      </g>
      <g className="p01-network__nodes p01-network__nodes--output" aria-hidden="true">
        {OUTPUT_NODES.map((y) => <circle key={`output-${y}`} cx="228" cy={y} r="7" />)}
      </g>
      <text className="p01-network__layer-label" x="22" y="119" textAnchor="middle">输入</text>
      <text className="p01-network__layer-label" x="125" y="119" textAnchor="middle">网络层</text>
      <text className="p01-network__layer-label" x="228" y="119" textAnchor="middle">输出</text>
    </svg>
  );
}
