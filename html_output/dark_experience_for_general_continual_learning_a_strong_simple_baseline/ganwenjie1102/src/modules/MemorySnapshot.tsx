import SampleLifecyclePrototype from './review/SampleLifecyclePrototype';
import { ReferenceButton } from './Reference';
import { SnapshotOrigin } from './MemoryPrelude';
import './der-redesign.css';
export default function MemorySnapshot() {
    return <div className="der-memory-chapter" data-core-items="I05"><div className="der-redesign der-u3"><section className="der-freeze-intro"><div><h3>留下数值副本，<br />模型继续向前。</h3><p>我们已经选定用 logits 匹配历史响应。现在还缺一个时间上的答案：<strong>这份历史分数，在什么时候产生？</strong></p></div><div><p>蒸馏用旧输出为当前模型提供软监督。DER 沿学习轨迹保留有限输入及其当时的输出，无须长期持有完整的旧教师。</p><p>在<strong>参数更新前</strong>取得输出，复制成冻结目标 z；模型可以继续学习，这份数值副本不再重算。</p></div></section><SnapshotOrigin />
 <section className="der-round-guide" aria-labelledby="two-rounds-title"><div className="der-question"><h3 id="two-rounds-title">先理清两轮的区别，<br />再进入完整生命周期。</h3><p>两项损失在同一组更新前参数上计算，合并后只更新一次。候选生成与最终入池，是两个不同事件。</p></div><div className="der-round-table"><div className="der-round-row"><div><h4>第一轮</h4><span>θ₀ · M = ∅</span></div><div><strong>当前 (x₁,y₁)</strong><p>只有当前分类 CE；更新前复制并冻结 z₁。</p></div><div><strong>一次更新 θ₀ → θ₁</strong><p>更新后，空槽接收记录 (x₁,z₁)。</p></div></div><div className="der-round-row"><div><h4>第二轮</h4><span>θ₁ · M 有旧记录</span></div><div><strong>当前 CE ＋ 历史匹配</strong><p>读取旧 (x₁,z₁)，与当前 (x₂,y₂) 在同一 θ₁ 下计算。</p></div><div><strong>一次更新 θ₁ → θ₂</strong><p>本轮 z₂ 也先冻结；更新后再参与选留。</p></div></div></div><details className="der-numerical-note"><summary>核对本段与前两章的教学数值</summary><p>D1 是给定数值的合成演示：后续回放响应 aⱼ=(1,2,0)，与 z₁=(2,1,0) 的平方差为 2。它区别于 U1/U2 比较时刻的 a=(2,0,1)。x₂ 的冻结目标 z₂ 用符号表示，动画不运行真实优化器。</p></details></section>
 <div className="der-d1-intro"><h3>沿同一份 x₁ 和 z₁，看完两轮。</h3><p>播放时观察三个交接：更新前复制冻结 → 参数改变、旧目标不变 → 读取旧记录，与新数据共同监督一次更新。</p></div></div>
 <SampleLifecyclePrototype />
 <div className="der-redesign der-after-d1"><p>留下的是一份有时间来源的记录 (x,z)。但当记忆装满，谁还能继续留下？下一章把容量 K 和在线选留接进这个过程。</p><ReferenceButton term="z">冻结时序与原文出处</ReferenceButton></div></div>;
}
