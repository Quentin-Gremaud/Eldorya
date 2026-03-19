// WebSocket event type constants — will be expanded per story

// Client → Server (kebab-case verb-object)
export const WS_COMMANDS = {
  joinSession: 'join-session',
  pingPlayer: 'ping-player',
  proposeAction: 'propose-action',
  validateAction: 'validate-action',
  rejectAction: 'reject-action',
  reorderActionQueue: 'reorder-action-queue',
  cancelAction: 'cancel-action',
  togglePipelineMode: 'toggle-pipeline-mode',
} as const;

// Server → Client (PascalCase past tense)
export const WS_EVENTS = {
  FogZoneRevealed: 'FogZoneRevealed',
  FogZoneHidden: 'FogZoneHidden',
  SessionModeLive: 'SessionModeLive',
  SessionModePreparation: 'SessionModePreparation',
  PlayerPinged: 'PlayerPinged',
  PlayerPingedGm: 'PlayerPingedGm',
  ActionProposed: 'ActionProposed',
  ActionProposedConfirmation: 'ActionProposedConfirmation',
  ActionValidated: 'ActionValidated',
  ActionRejected: 'ActionRejected',
  ActionQueueReordered: 'ActionQueueReordered',
  ActionCancelled: 'ActionCancelled',
  ActionCancelledConfirmation: 'ActionCancelledConfirmation',
  PipelineModeChanged: 'PipelineModeChanged',
} as const;
