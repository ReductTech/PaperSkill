import Src from "./Src";

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        <div className="hero-meta">
          <span className="m">arXiv 2026 · cs.RO</span>
          <span className="m">StarVLA Community · 港科大冯诺依曼研究院</span>
          <span className="m">开源 · 持续维护</span>
        </div>
        <h1><span className="star">StarVLA</span></h1>
        <div className="subtitle">
          把机器人学习，变成<span className="hl">搭乐高</span>。
        </div>
        <p className="lead">
          这不是又一个大模型，而是一个把「视觉-语言-动作」研究重新拼装起来的开源框架：
          骨干随便换、动作头随便插、五个基准一套接口测。
        </p>
        <div className="hero-cta">
          <button className="btn primary" onClick={onStart}>▶ 开始参观</button>
          <a className="btn ghost" href="https://github.com/starVLA/starVLA" target="_blank" rel="noreferrer">GitHub 仓库 ↗</a>
        </div>
        <div className="hero-stats">
          <div className="stat-card" style={{ ["--sc" as string]: "var(--blue)" }}>
            <div className="num">4 × 2</div>
            <div className="lbl">
              种动作头 × 类骨干，自由拼装
              <Src where="论文 §2.2–2.3（FAST / OFT / π / GR00T × VLM / 世界模型）" cmp="架构能力描述" />
            </div>
          </div>
          <div className="stat-card" style={{ ["--sc" as string]: "var(--green)" }}>
            <div className="num">7</div>
            <div className="lbl">
              个主流基准，一套评测接口
              <Src where="论文 Table 1「接入基准数」列" cmp="框架能力比对，非性能排行" />
            </div>
          </div>
          <div className="stat-card" style={{ ["--sc" as string]: "var(--red)" }}>
            <div className="num">30K 步</div>
            <div className="lbl">
              极简配方复现 SOTA（对照 175K）
              <Src where="论文 Table 2（StarVLA-OFT 30K 步 96.6% vs OpenVLA-OFT 175K 步 97.1%）" cmp="同 LIBERO 基准、各自官方协议" />
            </div>
          </div>
          <div className="stat-card" style={{ ["--sc" as string]: "var(--purple)" }}>
            <div className="num">~80%</div>
            <div className="lbl">
              256 卡近线性扩展效率
              <Src where="论文 Table 11 / §8.2（64–256 卡效率稳定 79–80%）" cmp="StarVLA-GR00T + Qwen3-VL-4B 实测" />
            </div>
          </div>
        </div>
      </div>

      <div className="hero-stage" aria-hidden="true">
        <div className="hero-brick b4">统一评测部署</div>
        <div className="hero-brick b1">骨干：VLM / 世界模型</div>
        <div className="hero-brick b2">动作头 ×4</div>
        <div className="hero-brick b3">混合数据管线</div>
        <div className="hero-brick cap">StarVLA</div>
      </div>

      <div className="hero-scroll-hint">← → 方向键或左侧目录翻页 · 共 12 节</div>
    </header>
  );
}
