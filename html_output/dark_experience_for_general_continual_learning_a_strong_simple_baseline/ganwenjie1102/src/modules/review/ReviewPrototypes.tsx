import { ReferenceProvider, ReferenceButton } from "../Reference";
import ResponseComparison from "../MechanismScenes";
import SampleLifecyclePrototype from "./SampleLifecyclePrototype";
import "./review.css";
export default function ReviewPrototypes() {
  return <ReferenceProvider><header className="site-header"><div className="site-header-inner"><a className="site-brand" href="./">DER · 阅读正文</a><nav aria-label="场景导航"><a href="#review-lifecycle">样本生命周期</a><a href="#review-comparison">概率与 logits</a></nav><ReferenceButton>参考资料</ReferenceButton></div></header><main className="reading-layout review-page"><SampleLifecyclePrototype /><div id="review-comparison"><ResponseComparison /></div></main></ReferenceProvider>;
}
