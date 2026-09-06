/** 02A：两份契约的数据流动画 —— 纯 CSS 无限循环，切节重挂载即从头重播
 *  观测流入 → 骨干脉动 → hidden states 依次流过对内契约 → 动作头脉动 → 动作块蹦出
 *  （无限循环里的交错节奏靠「负 animation-delay」实现：正延迟只在第一轮有效）
 */
export default function ContractFlow() {
  return (
    <div className="cflow">
      <span className="sim-badge cflow-badge">机制示意 · 自动循环播放</span>

      {/* 输入：部署现场的原始观测 */}
      <div className="cflow-row">
        <span className="cflow-pkt obs">原始图像</span>
        <span className="cflow-pkt obs d2">语言指令</span>
      </div>
      <div className="cflow-wire" />

      {/* 骨干 */}
      <div
        className="stage-brick cflow-backbone"
        style={{ ["--bc" as string]: "var(--blue)", height: 62 }}
      >
        视觉-语言骨干 <small>预训练知识原样保留</small>
      </div>

      {/* 对内契约：hidden states 依次流过 */}
      <div className="cflow-lane">
        <span className="cflow-lane-tag">对内契约 · 标准化 hidden states</span>
        <div className="cflow-hstream">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="cflow-h" style={{ animationDelay: `${-i * 0.22}s` }}>
              h<sub>{i + 1}</sub>
            </span>
          ))}
        </div>
      </div>

      {/* 动作头 */}
      <div
        className="stage-brick cflow-head"
        style={{ ["--bc" as string]: "var(--purple)", width: "min(320px, 68vw)", height: 56 }}
      >
        动作头 <small>可插拔 · 四种任选</small>
      </div>
      <div className="cflow-wire" />

      {/* 输出：动作块 */}
      <div className="cflow-row">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span key={i} className="cflow-pkt act" style={{ animationDelay: `${-i * 0.12}s` }}>
            a<sub>{i}</sub>
          </span>
        ))}
      </div>
      <div className="cflow-out-tag">输出：未来 8 步动作块 a<sub>t:t+8</sub></div>
    </div>
  );
}
