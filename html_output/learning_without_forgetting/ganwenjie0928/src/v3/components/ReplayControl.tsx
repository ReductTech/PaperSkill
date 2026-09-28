import { useEffect, useRef, useState } from "react";
import { trainingSteps } from "../data/process";

export function ReplayControl({ onSelectStep }: { onSelectStep: (stepId: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const replay = () => {
    if (playing) {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      setPlaying(false);
      setStatus("回放已停止。");
      return;
    }
    setPlaying(true);
    setStatus("正在回放完整训练周期。");
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 260 : 760;
    const advance = (index: number) => {
      onSelectStep(trainingSteps[index].id);
      if (index === trainingSteps.length - 1) {
        timer.current = window.setTimeout(() => {
          setPlaying(false);
          setStatus("Student updated。参数在 Optimizer Step 后更新。");
          timer.current = null;
        }, delay);
        return;
      }
      timer.current = window.setTimeout(() => advance(index + 1), delay);
    };
    advance(0);
  };

  return <div className="v3-replay-control">
    <button type="button" onClick={replay} aria-pressed={playing}>{playing ? "■ Stop replay" : "▶ Replay training cycle"}</button>
    <span>6 steps · ~5s</span>
    <span className="v3-sr-status" role="status" aria-live="polite">{status}</span>
  </div>;
}
