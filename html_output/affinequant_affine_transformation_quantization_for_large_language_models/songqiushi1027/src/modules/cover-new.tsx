import type { WidgetProps } from './registry';
import { useCoverPlayback } from '../components/CoverPlayback';
import { CameraScene } from './aqKit';

export function CoverNew(_props: WidgetProps) {
  const { progress } = useCoverPlayback();
  return <CameraScene op="new" progress={progress} />;
}