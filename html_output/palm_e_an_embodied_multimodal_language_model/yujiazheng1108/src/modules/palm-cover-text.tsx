import { useCoverPlayback } from '../components/CoverPlayback';
import { Kitchen } from './palm-kit';

export function PalmCoverText() {
  const { progress } = useCoverPlayback();
  return <div className="pk-cover-art">
    <Kitchen opening={Math.min(1, progress * 3)} sponge={progress > .40 ? 1 : 0}
      arm={400 - progress * 122} spill label="海绵移至右侧，文本指令没有提供位置" />
  </div>;
}
