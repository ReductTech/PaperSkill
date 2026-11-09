import { useEffect, useId, useRef } from "react";
import "./MethodScene.css";

/** One clock for both SVGs; CSS paints frames without React renders. */
export function useHeroTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const getAnimations = () => root.getAnimations({ subtree: true }).filter(a =>
      (a.effect as KeyframeEffect).target?.closest(".ms-stage, .ms-caption"));
    let elapsed = 0;
    let started: number | null = null;
    let visible = false;
    const sync = () => {
      const now = Number(document.timeline.currentTime ?? 0);
      if (started !== null) elapsed += now - started;
      started = null;
      const playing = visible && !document.hidden && !media.matches;
      for (const animation of getAnimations()) {
        animation.pause();
        animation.currentTime = media.matches ? 7500 : elapsed;
        if (playing) {
          animation.play();
          animation.startTime = now - elapsed;
        }
      }
      if (playing) started = now;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(root);
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      getAnimations().forEach(a => a.pause());
    };
  }, []);
  return ref;
}

function RoadNoise() { return (<g className="ms-noise">
            {Array.from({ length: 65 }, (_, i) => <circle key={i} cx={(i * 37 + 9) % 114 + 1} cy={(i * 23 + 3) % 62 + 1} r={i % 3 === 0 ? .8 : .5} fill={["#e9a0e7", "#8bdfaa", "#cbd1db"][i % 3]} />)}
          </g>); }

/** Same road and noise samples on both sides. No model parameters or detections. */
export function MethodScene({ adaptive = false }: { adaptive?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="ms-stage">
    <svg className="ms-size" viewBox="0 0 280 150" aria-hidden="true" />
    <svg preserveAspectRatio="none" className={`method-scene ${adaptive ? "adaptive" : "fixed"}`} viewBox="0 0 280 150" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>{adaptive ? "AdaptiveISP：不同输入，逐步选择模块与参数" : "固定 ISP：不同输入，保持相同模块顺序与配置"}</title>
      <desc id={`${id}-desc`}>输入已完成基础 RAW 域处理。两侧共享正常光照到低光照的 RGB 道路场景。{adaptive ? "此阶段正常光照选择颜色校正矩阵 CCM，低光照选择 Desaturation 降低饱和度，亮度噪声仍保留。新图像供下一阶段决策。" : "两种光照均沿用相同的颜色校正与饱和度配置。"}</desc>
      <defs>
        <clipPath id={`${id}-wipe`} clipPathUnits="userSpaceOnUse"><rect className="ms-reveal" width="280" height="150" /></clipPath>
        <g id={`${id}-road`}>
          <rect width="116" height="64" fill="#91c8cf" />
          <circle cx="95" cy="12" r="6" fill="#ffe4ab" />
          <path d="M0 31L19 17 34 31 49 20 68 34 90 23 116 33V64H0Z" fill="#699b83" />
          <path d="M43 31H70L106 64H7Z" fill="#657580" />
          <path d="M56 34L53 41M51 45L47 54M45 58L42 64" stroke="#e6e4c9" strokeWidth="2" />
          <path d="M0 42H30M86 41H116" stroke="#c1c8b3" strokeWidth="2" />
          <rect x="12" y="19" width="13" height="18" fill="#d0a183" />
          <rect x="15" y="22" width="4" height="5" fill="#b8e0dc" />
          <path d="M70 42L74 33H88L93 42Z" fill="#db785a" />
          <rect x="68" y="41" width="27" height="13" rx="3" fill="#e28b63" />
          <path d="M76 35H86L89 41H73Z" fill="#b6d5d5" />
          <path d="M71 53V57M91 53V57" stroke="#293b4c" strokeWidth="5" />
          <path d="M71 46H76M87 46H92" stroke="#ffdf9b" strokeWidth="2" />

        </g>
      </defs>
      <g transform="scale(2.414 2.344)">
        <g className="ms-light"><use href={`#${id}-road`} /><RoadNoise /></g>
      </g>
      <g clipPath={`url(#${id}-wipe)`}>
        <g transform="scale(2.414 2.344)"><g className="ms-output"><g className="ms-light"><use href={`#${id}-road`} /><RoadNoise /></g></g></g>
      </g>
      <path className="ms-scan" d="M0 0V150" />
    </svg>
    <div className="ms-overlay" aria-hidden="true">
      <span className="ms-light-label"><span className="ms-day">正常光照</span><span className="ms-night">低光照</span></span>
      <span>处理后</span>
    </div>
    </div>
  );
}

export function MethodLabel({ adaptive = false }: { adaptive?: boolean }) {
  return <span className="ms-caption">{adaptive ? <><span className="ms-day">CCM</span><span className="ms-night">去饱和</span></> : "固定 ISP"}</span>;
}
