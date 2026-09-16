import { useState } from 'react';
export function RssmCycle() {
  const [step, setStep] = useState(0);
  return (
    <div className="module">
      <button onClick={() => setStep(s => (s + 1) % 5)}>推进 RSSM（第 {step} 轮）</button>
      <p>H_t = H_{'{t-1}'} + G_t ⊙ (候选 − H_{'{t-1}'})</p>
    </div>
  );
}