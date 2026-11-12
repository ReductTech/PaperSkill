import Pipeline from './Pipeline';
import Lab from './Lab';
import Budget from './Budget';
import Results from './Results';
import HighResolution from './HighResolution';
import VideoUnderstanding from './VideoUnderstanding';
import { Compare } from './Closing';

export const widgetRegistry = {
  pipeline: Pipeline,
  lab: Lab,
  budget: Budget,
  results: Results,
  highResolution: HighResolution,
  videoUnderstanding: VideoUnderstanding,
  compare: Compare,
};
