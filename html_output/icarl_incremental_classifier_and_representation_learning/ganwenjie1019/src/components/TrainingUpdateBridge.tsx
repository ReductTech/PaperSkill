import { useEffect, useState } from "react";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

const trainingSteps = [
  { tag: "FORWARD", title: "前向得到逐类响应", equation: "x → φΘ(x) → g(x)", copy: "当前样本先经过共享特征提取器与训练输出层。" },
  { tag: "TARGETS", title: "构造目标并计算损失", equation: "L = Lclass + Ldistill", copy: "新类别使用 hard target；旧类别使用旧模型的 soft target。" },
  { tag: "BACKWARD", title: "误差反向传播", equation: "∇Θ L", copy: "梯度从输出层沿计算图返回共享特征提取器。" },
  { tag: "UPDATE", title: "优化器更新参数", equation: "Θ ← Θ − η∇ΘL", copy: "这一轮更新改变的是模型参数 Θ。" },
  { tag: "RE-ENCODE", title: "用新 Θ 重新计算表示", equation: "z′ = φΘ′(x)", copy: "样本身份与原始输入向量不变，representation 的位置随映射改变。" },
];

export function TrainingUpdateBridge({ onRepresentationUpdated }: { onRepresentationUpdated?: () => void }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (step === trainingSteps.length - 1) {
      setPlaying(false);
      onRepresentationUpdated?.();
      return;
    }
    const timer = window.setTimeout(() => setStep(value => value + 1), 1350);
    return () => window.clearTimeout(timer);
  }, [onRepresentationUpdated, playing, reducedMotion, step]);

  function chooseStep(next: number) {
    setPlaying(false);
    setStep(next);
    if (next === trainingSteps.length - 1) onRepresentationUpdated?.();
  }

  function playCycle() {
    if (reducedMotion) {
      const next = step === trainingSteps.length - 1 ? 0 : step + 1;
      chooseStep(next);
      return;
    }
    if (playing) {
      setPlaying(false);
      return;
    }
    if (step === trainingSteps.length - 1) setStep(0);
    setPlaying(true);
  }

  const current = trainingSteps[step];
  return <section className="p2-training-cycle panel" aria-labelledby="p2-training-cycle-title">
    <div className="p2-panel-heading">
      <div><span className="p2-eyebrow">从前向响应到参数更新</span><h2 id="p2-training-cycle-title">训练还需要损失与反向传播</h2></div>
      <button className="p2-action" type="button" onClick={playCycle}>{reducedMotion ? "下一步 →" : playing ? "暂停" : step === trainingSteps.length - 1 ? "再次播放一轮" : "播放一轮训练"}</button>
    </div>
    <p className="p2-training-cycle__intro">上面的五步只展示前向计算。得到响应后，模型还要比较训练目标、计算损失并反向传播，更新后的 Θ 才会改变样本的 representation。</p>
    <div className="p2-training-cycle__track" role="group" aria-label="一轮训练的五个阶段">
      {trainingSteps.map((item, index) => <button key={item.tag} type="button" className={`${index === step ? "is-active" : ""}${index < step ? " is-complete" : ""}`} aria-pressed={index === step} onClick={() => chooseStep(index)}>
        <span>{String(index + 1).padStart(2, "0")}</span><b>{item.title}</b><small>{item.tag}</small>
      </button>)}
    </div>
    <div className="p2-training-cycle__progress" aria-hidden="true"><span style={{ width: `${(step / (trainingSteps.length - 1)) * 100}%` }} /></div>
    <div className={`p2-training-cycle__explain p2-training-cycle__explain--${step}`} aria-live="polite">
      <span>{current.tag}</span><code>{current.equation}</code><p>{current.copy}</p>
    </div>
    <div className="p2-training-cycle__invariant">
      <div><span>保持不变</span><strong>样本 x 的身份、原始图像内容</strong></div><i aria-hidden="true">→</i><div><span>训练后改变</span><strong>映射 φ<sub>Θ</sub> 与 representation z</strong></div>
    </div>
  </section>;
}
