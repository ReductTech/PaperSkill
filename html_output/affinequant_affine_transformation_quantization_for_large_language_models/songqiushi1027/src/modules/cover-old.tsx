import type { WidgetProps } from './registry';
import { useCoverPlayback } from '../components/CoverPlayback';
import { CameraScene } from './aqKit';

export function CoverOld(_props: WidgetProps) {
  const { progress } = useCoverPlayback();
  return <CameraScene op="old" progress={progress} />;
}