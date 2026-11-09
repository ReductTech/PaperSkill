import { useCoverPlayback } from '../components/CoverPlayback';
import { Kitchen } from './palm-kit';

export function PalmCoverSeen() {
  const { progress } = useCoverPlayback();
  const moved = progress > .40;
  return <div className="pk-cover-art">
    <Kitchen opening={Math.min(1, progress * 3)} sponge={progress > .82 ? 2 : moved ? 1 : 0}
      arm={moved ? 515 : 280} camera={moved} spill label="打开抽屉后，相机提供海绵的新位置" />
  </div>;
}
