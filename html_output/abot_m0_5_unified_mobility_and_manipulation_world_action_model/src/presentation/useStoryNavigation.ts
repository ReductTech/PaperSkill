import { useCallback, useEffect, useState } from "react";

export function useStoryNavigation(total: number) {
  const [active, setActive] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(total - 1, index));
      document.getElementById(`screen-${next + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [total],
  );

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".story-screen"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(Number((visible.target as HTMLElement).dataset.index ?? 0));
      },
      { threshold: [0.45, 0.65] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, button, summary, a")) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        goTo(active + 1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(active - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  return { active, goTo };
}
