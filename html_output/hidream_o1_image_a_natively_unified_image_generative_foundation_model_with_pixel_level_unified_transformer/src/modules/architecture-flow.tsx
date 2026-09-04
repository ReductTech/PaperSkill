import React from 'react';
import { ArchitectureDiagram } from '../components/svg/ArchitectureDiagram';
import type { WidgetProps } from './registry';

export function ArchitectureFlowExplorer(_props: WidgetProps) {
  return (
    <div className="hd-architecture-flow">
      <div className="uit-diagram-shell">
        <div className="uit-diagram-scroll">
          <ArchitectureDiagram />
        </div>
      </div>
    </div>
  );
}
