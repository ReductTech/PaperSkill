import type { ComponentType } from 'react'
import {
  AblationLab,
  ArchitectureRouter,
  BenchmarkExplorer,
  CFGLab,
  ClaimAudit,
  ComputeAudit,
  ConflictLab,
  LossMaskLab,
  TokenWorkbench,
  TrainingConsole,
} from '../components/Interactions'

export const widgetRegistry: Record<string, ComponentType> = {}
widgetRegistry['conflict-lab'] = ConflictLab
widgetRegistry['architecture-router'] = ArchitectureRouter
widgetRegistry['token-workbench'] = TokenWorkbench
widgetRegistry['loss-mask-lab'] = LossMaskLab
widgetRegistry['training-console'] = TrainingConsole
widgetRegistry['cfg-lab'] = CFGLab
widgetRegistry['benchmark-explorer'] = BenchmarkExplorer
widgetRegistry['ablation-lab'] = AblationLab
widgetRegistry['compute-audit'] = ComputeAudit
widgetRegistry['research-map'] = () => null
widgetRegistry['claim-audit'] = ClaimAudit
