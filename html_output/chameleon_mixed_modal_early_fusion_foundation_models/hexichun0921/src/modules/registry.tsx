import React from 'react'

export interface WidgetProps {
  chapterId: string
  moduleId: string
}

const StructuralWidget: React.FC<WidgetProps> = () => null
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {}
widgetRegistry['fusion-map'] = StructuralWidget
widgetRegistry['thesis-card'] = StructuralWidget
widgetRegistry['tokenizer-lab'] = StructuralWidget
widgetRegistry['sequence-lab'] = StructuralWidget
widgetRegistry['stability-lab'] = StructuralWidget
widgetRegistry['scale-lab'] = StructuralWidget
widgetRegistry['alignment-lab'] = StructuralWidget
widgetRegistry['evidence-lab'] = StructuralWidget
widgetRegistry['lineage-lab'] = StructuralWidget
widgetRegistry['limits-audit'] = StructuralWidget
widgetRegistry['quiz-lab'] = StructuralWidget
