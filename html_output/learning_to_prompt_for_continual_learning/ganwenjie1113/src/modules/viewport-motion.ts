import { useEffect, useRef, useState } from "react";

/** The drawing, not the surrounding prose, determines the start position. */
export function useViewportMotion(secondAt: number, thirdAt: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(-1);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    let started = false;
    const timers: number[] = [];

    function check() {
      frame = 0;
      if (!element || started) return;
      const rect = element.getBoundingClientRect();
      const height = window.innerHeight;
      if (Math.abs(rect.top + rect.height / 2 - height / 2) > height * .06) return;

      started = true;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setPhase(2);
        return;
      }
      setPhase(0);
      timers.push(window.setTimeout(() => setPhase(1), secondAt));
      timers.push(window.setTimeout(() => setPhase(2), thirdAt));
    }

    function schedule() {
      if (!frame && !started) frame = requestAnimationFrame(check);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [secondAt, thirdAt]);
  return { ref, phase };
}
