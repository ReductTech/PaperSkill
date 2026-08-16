import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type SkillVersion = 'v1' | 'v2';

const readVersion = (): SkillVersion => {
  try { return window.sessionStorage.getItem('colleague-skill:s4-current-version') === 'v2' ? 'v2' : 'v1'; }
  catch { return 'v1'; }
};

export const DeploymentRouteAnalogy: React.FC<WidgetProps> = () => {
  const [version, setVersion] = useState<SkillVersion>(readVersion);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const onVersion = (event: Event) => setVersion((event as CustomEvent<SkillVersion>).detail);
    window.addEventListener('colleague-skill:s4-version', onVersion);
    const timer = window.setInterval(() => setStage(current => (current + 1) % 4), 1000);
    return () => {
      window.removeEventListener('colleague-skill:s4-version', onVersion);
      window.clearInterval(timer);
    };
  }, []);

  return <div className={`paper-widget deployment-route-analogy route-stage-${stage}`} aria-label="Skill 部署路线循环动画">
    <div className="route-skill-mini"><span>Senior Engineer</span><b>Skill {version}</b><small>READY ✓</small></div>
    <i className="route-stem">↓</i>
    <div className="route-branches"><span>💻<small>LOCAL</small></span><span>🤖<small>AGENT</small></span><span>🌐<small>GALLERY</small></span></div>
  </div>;
};

export default DeploymentRouteAnalogy;
