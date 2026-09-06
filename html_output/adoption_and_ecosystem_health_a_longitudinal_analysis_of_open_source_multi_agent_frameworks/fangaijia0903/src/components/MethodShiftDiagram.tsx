export function MethodShiftDiagram() {
  return (
    <div className="method-shift" aria-label="从结果导向转向过程导向的方法图">
      <div className="method-shift-heading">
        <div className="method-shift-title">
          <span>3.1</span>
          <h3>评价视角转变</h3>
        </div>
        <strong>不只看最终结果，而是回到形成结果的过程</strong>
      </div>
      <div className="method-shift-flow">
        <section className="method-shift-stage result-stage">
          <div className="method-shift-index">01</div>
          <h3>结果导向</h3>
          <p>观察累计 Star 与最终排名</p>
          <b>回答：谁排在前面？</b>
        </section>
        <div className="method-shift-arrow" aria-hidden="true">
          <span>转向<br />形成过程</span>
          <i>→</i>
        </div>
        <section className="method-shift-stage process-stage">
          <div className="method-shift-index">02</div>
          <h3>过程导向</h3>
          <div className="method-shift-tags">
            <span>增长轨迹</span>
            <span>贡献深度</span>
            <span>跨生态<br />协作</span>
            <span>贡献者<br />留存</span>
          </div>
        </section>
        <div className="method-shift-arrow" aria-hidden="true">
          <span>用过程证据<br />验证</span>
          <i>→</i>
        </div>
        <section className="method-shift-stage verify-stage">
          <div className="method-shift-index">03</div>
          <h3>从过程中验证</h3>
          <p className="method-shift-questions">
            <span>谁在持续建设？</span>
            <span>框架如何连接？</span>
            <span>贡献者是否回归？</span>
          </p>
          <b>回答：生态是否健康？</b>
        </section>
      </div>
    </div>
  );
}
