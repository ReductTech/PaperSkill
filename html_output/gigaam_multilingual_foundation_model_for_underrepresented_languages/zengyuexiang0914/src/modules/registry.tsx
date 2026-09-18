import type React from "react";

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

const ExistingPageInteraction: React.FC<WidgetProps> = ({ chapterId, moduleId }) => (
  <div aria-label={`${chapterId} ${moduleId}`}>该交互由主页面对应章节呈现。</div>
);

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['imbalance-comparison'] = ExistingPageInteraction;
widgetRegistry['method-stepper'] = ExistingPageInteraction;
widgetRegistry['language-clusters'] = ExistingPageInteraction;
widgetRegistry['language-data-tabs'] = ExistingPageInteraction;
widgetRegistry['sampling-lab'] = ExistingPageInteraction;
widgetRegistry['wer-comparison'] = ExistingPageInteraction;
widgetRegistry['conclusion-cards'] = ExistingPageInteraction;
widgetRegistry['quiz-feedback'] = ExistingPageInteraction;
