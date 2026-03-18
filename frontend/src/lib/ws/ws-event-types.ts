// WebSocket event type constants — will be expanded per story

// Client → Server (kebab-case verb-object)
export const WS_COMMANDS = {
  joinSession: 'join-session',
  pingPlayer: 'ping-player',
  proposeAction: 'propose-action',
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
} as const;
