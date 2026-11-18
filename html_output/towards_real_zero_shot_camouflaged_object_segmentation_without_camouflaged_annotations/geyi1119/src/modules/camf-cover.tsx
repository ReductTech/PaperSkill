import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { Sheet } from './camf-kit';
export function CamfCover({moduleId}:WidgetProps) {
  const {progress}=useCoverPlayback();
  const improved=moduleId==='newMethod';
  return <div className="camf-cover"><Sheet detail={improved?1:.12} progress={Math.min(1,progress*1.5)}/><p>{improved?'保留局部笔触，再补充语义线索':'只有整体轮廓，细节线索不足'}</p></div>;
}
