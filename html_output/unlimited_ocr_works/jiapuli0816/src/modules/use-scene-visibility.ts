import { useEffect, useRef } from 'react';

export function useSceneVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        element.classList.toggle('is-scene-paused', !entry.isIntersecting);
      },
      { threshold: 0.08 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}
