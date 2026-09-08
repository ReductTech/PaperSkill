import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

export const SkillEvolutionAnalogy: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    const play = () => {
      setStage(0);
      timers.push(window.setTimeout(() => setStage(1), 650));
      timers.push(window.setTimeout(() => setStage(2), 1650));
    };
    play();
    const loop = window.setInterval(play, 4800);
    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
      window.clearInterval(loop);
    };
  }, []);

  return <div className={`skill-evolution-analogy stage-${stage}`} aria-label="循环播放：S3 生成的 Skill v1 在调用中暴露错误，进入版本生命周期">
    <div className="evolution-skill-mini">
      <span>PERSON-GROUNDED SKILL</span>
      <b>S = (A, M, L)</b>
      <small>✓ Skill generated · Version v1</small>
    </div>
    <div className="evolution-use-mini">
      <span>USER</span><p>“这个 API 可以直接上线吗？”</p>
      <span>AI · Skill v1</span><b>“Looks fine. Ship it.”</b>
    </div>
    <div className="evolution-warning-mini"><strong>⚠</strong><span>Something feels wrong.</span></div>
  </div>;
};

export default SkillEvolutionAnalogy;
