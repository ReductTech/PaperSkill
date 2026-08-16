import React, { useEffect, useState } from 'react';

export function PresentationNav({
  steps,
  onHome,
}: {
  steps: { id: string; label: string }[];
  onHome: () => void;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const elements = steps.map((step) => document.getElementById(step.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = steps.findIndex((step) => step.id === visible.target.id);
      if (index >= 0) setActive(index);
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.15, 0.4] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [steps]);

  const jump = (id: string, index: number) => {
    setActive(index);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="presentation-nav" aria-label="四分钟演示导航">
      <button className="presentation-home" onClick={onHome} aria-label="返回首页">SDAR</button>
      <div className="presentation-nav-steps">
        {steps.map((step, index) => (
          <button key={step.id} className={index === active ? 'is-active' : ''} onClick={() => jump(step.id, index)}>
            <span>{index + 1}</span>{step.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
