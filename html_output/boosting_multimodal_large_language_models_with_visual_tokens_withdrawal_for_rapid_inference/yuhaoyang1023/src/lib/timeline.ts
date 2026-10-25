// 可控时间轴：主要动画都由进度 p ∈ [0,1] 决定画面（画面是 p 的函数），因此可以暂停、重播、拖动。
// - 推进由舞台的 rAF 循环调用 tick(dt) 完成（只在画布可见、允许动画时运行），不额外开循环。
// - 减少动态效果：p 固定为 1（完整终态），不自动播放；仍可拖动查看各阶段。
// - 首次进入视口时才自动播放；离屏时画的是终态，缩略图与后台标签页不会停在半成品上。
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useReducedMotion } from './hooks';

export interface Timeline {
  /** 当前进度（每帧读取） */
  pRef: MutableRefObject<number>;
  /** 供界面显示的进度（节流更新） */
  p: number;
  playing: boolean;
  reduced: boolean;
  /** 由舞台循环调用；返回是否仍在播放 */
  tick: (dt: number) => boolean;
  play: () => void;
  pause: () => void;
  replay: () => void;
  scrub: (v: number) => void;
  /** 舞台首次进入可见区时调用 */
  onVisible: (visible: boolean) => void;
}

export function useTimeline(duration: number, opts: { autoplay?: boolean; loop?: boolean } = {}): Timeline {
  const reduced = useReducedMotion();
  const pRef = useRef(1);
  const [p, setP] = useState(1);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  playingRef.current = playing;
  const started = useRef(false);
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
      let np = pRef.current + dt / duration;
      if (np >= 1) {
        if (opts.loop) np = np % 1;
        else {
          np = 1;
          setPlay(false);
        }
      }
      pRef.current = np;
      const now = performance.now();
      if (now - lastUi.current > 90 || np === 1) {
        lastUi.current = now;
        setP(np);
      }
      return np < 1 || !!opts.loop;
    },
    [duration, opts.loop, setPlay]
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
      // 读者一旦手动操作，首次进入视口的自动播放就不再触发
      started.current = true;
      setPlay(false);
      pRef.current = Math.max(0, Math.min(1, v));
      setP(pRef.current);
    },
    [setPlay]
  );
  const onVisible = useCallback(
    (visible: boolean) => {
      if (!visible || started.current || reduced || opts.autoplay === false) return;
      started.current = true;
      pRef.current = 0;
      setP(0);
      setPlay(true);
    },
    [reduced, opts.autoplay, setPlay]
  );

  return { pRef, p, playing, reduced, tick, play, pause, replay, scrub, onVisible };
}
