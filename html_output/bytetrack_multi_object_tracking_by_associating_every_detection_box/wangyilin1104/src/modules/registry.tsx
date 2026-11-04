import {PipelineLab, AssignmentLab, LifecycleLab, AblationLab, ThresholdLab} from './ByteExtension';
import type {ComponentType} from 'react';
import { Cover, DetectionLab, PredictionLab, MatchingLab, TimelineLab, BufferLab, FailureLab, EvidenceLab, HandoffLab } from './ByteGuide';
export interface WidgetProps {chapterId:string;moduleId:string}
export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
widgetRegistry['bt-cover'] = Cover;
widgetRegistry['bt-detections'] = DetectionLab;
widgetRegistry['bt-motion'] = PredictionLab;
widgetRegistry['bt-matching'] = MatchingLab;
widgetRegistry['bt-timeline'] = TimelineLab;
widgetRegistry['bt-buffer'] = BufferLab;
widgetRegistry['bt-failure'] = FailureLab;
widgetRegistry['bt-evidence'] = EvidenceLab;
widgetRegistry['bt-handoff'] = HandoffLab;
widgetRegistry['bt-pipeline'] = PipelineLab;
widgetRegistry['bt-assignment'] = AssignmentLab;
widgetRegistry['bt-lifecycle'] = LifecycleLab;
widgetRegistry['bt-ablation'] = AblationLab;
widgetRegistry['bt-threshold'] = ThresholdLab;
