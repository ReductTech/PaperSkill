export const PAGE_IDS = [
  "page-01-problem",
  "page-02-probability",
  "page-03-bayes",
  "page-04-laplace",
  "page-05-fisher",
  "page-06-ewc-objective",
  "page-07-lifecycle",
  "page-08-mnist",
  "page-09-atari",
  "page-10-grand-animation",
] as const;
export type PageId = (typeof PAGE_IDS)[number];

export const SECTION_ANCHORS = [
  "problem-context", "parameter-conflict", "ewc-motivation",
  "forward-probability", "likelihood-origin", "likelihood-comparison", "loss-and-update", "probability-source-table",
  "prior-likelihood-posterior", "parameter-belief-update", "sequential-update",
  "posterior-global-to-local", "laplace-local-view", "narrow-wide-directions", "fisher-handoff",
  "fisher-estimation", "score-gradient", "square-and-aggregate", "training-vs-estimation", "fisher-role",
  "ewc-objective", "penalty-components", "gradient-junction",
  "training-modes", "task-boundary", "active-state-table", "task-a-to-b-to-c",
  "permuted-mnist-task", "protocol-before-results", "forgetting-and-plasticity", "fisher-overlap",
  "atari-rl-loop", "system-responsibilities", "replay-timescale", "atari-evidence-limits",
  "grand-animation", "full-execution-replay",
] as const;
export type AnchorId = (typeof SECTION_ANCHORS)[number];

export const CANONICAL_REFERENCE_IDS = [
  "continual_learning", "catastrophic_forgetting", "parameter_interference", "ewc", "normal_training",
  "likelihood", "negative_log_likelihood", "prior", "posterior", "sequential_bayes", "laplace_approximation",
  "local_precision", "fisher_information", "fisher_estimation", "consolidation", "task_boundary", "optimizer_step",
  "neural_network", "p_theta_y_given_x", "p_D_given_theta", "p_theta", "p_theta_given_D", "task_a_posterior",
  "task_b_posterior", "task_a_data", "task_b_data", "task_a_loss", "theta", "theta_a_star", "fisher_a",
  "fisher_a_i", "lambda_ewc", "task_a_gradient", "task_b_loss", "ewc_penalty", "ewc_objective",
  "task_b_gradient", "ewc_gradient", "total_gradient", "permuted_mnist", "atari", "replay", "task_recognition",
  "task_specific_modulation", "fisher_perturbation", "grand_animation", "empirical_fisher_estimator_background",
  "diagonal_fisher_limit", "task_state_mapping", "extended_bayes_laplace_notation",
] as const;
export type CanonicalReferenceId = (typeof CANONICAL_REFERENCE_IDS)[number];

export const RUNTIME_OBJECT_IDS = [
  "task-a-data", "task-a-batch", "neural-network", "model-logits", "prediction-probabilities", "task-a-loss",
  "task-a-gradient", "optimizer", "current-parameters", "task-a-anchor", "task-a-fisher", "fisher-estimator",
  "persistent-memory", "task-state-a", "task-state-b", "task-b-data", "task-c-data", "task-b-loss", "ewc-penalty", "task-b-gradient",
  "ewc-gradient", "total-gradient", "replay-buffer", "task-recognition", "task-specific-modulation",
] as const;
export type RuntimeObjectId = (typeof RUNTIME_OBJECT_IDS)[number];

export const GRAND_ANIMATION_STATE_IDS = [
  "overview", "task-a-data", "first-forward", "probability-loss", "backward", "optimizer-update",
  "task-a-compression", "task-a-boundary", "posterior-view", "laplace-view", "return-runtime", "save-anchor",
  "fisher-estimation", "task-a-consolidated", "task-b-arrives", "ewc-objective", "combined-gradient", "continual-loop",
] as const;
export type GrandAnimationStateId = (typeof GRAND_ANIMATION_STATE_IDS)[number];

export type PageTarget = { pageId: PageId; anchorId?: AnchorId };
export type OpenReferenceTarget = {
  referenceId?: CanonicalReferenceId;
  pageId?: PageId;
  anchorId?: AnchorId;
  animationStateId?: GrandAnimationStateId;
};
