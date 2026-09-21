import React from 'react'

export interface WidgetProps {
  chapterId: string
  moduleId: string
}

const StructuralWidget: React.FC<WidgetProps> = () => null
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {}
widgetRegistry['compare-routes'] = StructuralWidget
widgetRegistry['core-claim'] = StructuralWidget
widgetRegistry['prompt-lab'] = StructuralWidget
widgetRegistry['attention-lab'] = StructuralWidget
widgetRegistry['denoise-lab'] = StructuralWidget
widgetRegistry['training-lab'] = StructuralWidget
widgetRegistry['evidence-lab'] = StructuralWidget
widgetRegistry['ablation-lab'] = StructuralWidget
widgetRegistry['ability-map'] = StructuralWidget
widgetRegistry['limit-audit'] = StructuralWidget
widgetRegistry['quiz-lab'] = StructuralWidget
