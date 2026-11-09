// 可控时间轴（取自 VTW v7.3 的 live/timeline.ts；增加讲解速度）：画面是进度 p ∈ [0,1] 的函数，因此可以播放、暂停、重播、拖动。
// - 推进由舞台的 rAF 循环调用 tick(dt) 完成，不另开循环；舞台离屏时循环停止，进度也随之停住。
// - 首次进入视口才自动播放一次；之前（缩略图、后台标签页）显示的是完整终态。
// - 减少动态效果：p 固定为 1，不自动播放；仍可拖动查看各阶段。
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useReducedMotion } from '../modules/sv-kit';

export interface Timeline {
  pRef: MutableRefObject<number>;
  /** 供界面显示的进度（播放时约每 90ms 更新一次） */
  p: number;
  playing: boolean;
  reduced: boolean;
  tick: (dt: number) => boolean;
  play: () => void;
  pause: () => void;
  replay: () => void;
  scrub: (v: number) => void;
  onVisible: (visible: boolean) => void;
}

// 调试参数 ?tl=0.5：所有时间轴从该进度开始、不自动播放（用于检查各阶段的画面）
const TL_PARAM = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('tl') : null;
const TL_INIT = TL_PARAM !== null && Number.isFinite(Number(TL_PARAM)) ? Math.max(0, Math.min(1, Number(TL_PARAM))) : null;

/** duration：中速下播完一遍的秒数；speed 为 0.6 / 1 / 1.7 倍（慢 / 中 / 快）。 */
export function useTimeline(duration: number, speed = 1): Timeline {
  const reduced = useReducedMotion();
  const pRef = useRef(TL_INIT ?? 1);
  const [p, setP] = useState(TL_INIT ?? 1);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const started = useRef(TL_INIT !== null);
  const lastUi = useRef(0);

  const setPlay = useCallback((v: boolean) => {
    playingRef.current = v;
    setPlaying(v);
  }, []);

  useEffect(() => {
    if (reduced) {
      pRef.current = 1;
      setP(1);
      setPlay(false);
    }
  }, [reduced, setPlay]);

  const tick = useCallback(
    (dt: number) => {
      if (!playingRef.current) return false;
      let np = pRef.current + (dt * speed) / duration;
      if (np >= 1) {
        np = 1;
        setPlay(false);
      }
      pRef.current = np;
      const now = performance.now();
      if (now - lastUi.current > 90 || np === 1) {
        lastUi.current = now;
        setP(np);
      }
      return np < 1;
    },
    [duration, speed, setPlay]
  );

  const play = useCallback(() => {
    started.current = true;
    if (reduced) return;
    if (pRef.current >= 1) {
      pRef.current = 0;
      setP(0);
    }
    setPlay(true);
  }, [reduced, setPlay]);
  const pause = useCallback(() => {
    started.current = true;
    setPlay(false);
    setP(pRef.current);
  }, [setPlay]);
  const replay = useCallback(() => {
    started.current = true;
    if (reduced) return;
    pRef.current = 0;
    setP(0);
    setPlay(true);
  }, [reduced, setPlay]);
  const scrub = useCallback(
    (v: number) => {
      started.current = true;
      setPlay(false);
      pRef.current = Math.max(0, Math.min(1, v));
      setP(pRef.current);
    },
    [setPlay]
  );
  const onVisible = useCallback(
    (visible: boolean) => {
      if (!visible || started.current || reduced) return;
      started.current = true;
      pRef.current = 0;
      setP(0);
      setPlay(true);
    },
    [reduced, setPlay]
  );

  return { pRef, p, playing, reduced, tick, play, pause, replay, scrub, onVisible };
}
