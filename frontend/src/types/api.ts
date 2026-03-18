// API response types — will be expanded per story

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

export interface CampaignSummary {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  role: "gm" | "player";
  playerCount: number;
  lastSessionDate: string | null;
  createdAt: string;
}

export interface PlayerCampaign {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  gmDisplayName: string;
  playerCount: number;
  lastSessionDate: string | null;
  role: "player";
}

export interface PlayerOnboardingItem {
  userId: string;
  displayName: string;
  status: "joined" | "ready";
  joinedAt: string;
}

export interface CampaignPlayersResponse {
  players: PlayerOnboardingItem[];
  hasActiveInvitation: boolean;
  allReady: boolean;
  playerCount: number;
}

export interface CampaignAnnouncement {
  id: string;
  content: string;
  gmDisplayName: string;
  createdAt: string;
}

export interface CampaignAnnouncementsResponse {
  announcements: CampaignAnnouncement[];
  totalCount: number;
}

export interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface ProposedChange {
  current: unknown;
  proposed: unknown;
}

export interface CharacterDetail {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  background: string;
  stats: CharacterStats;
  spells: string[];
  status: "pending" | "approved" | "rejected" | "pending_revalidation";
  rejectionReason: string | null;
  proposedChanges: Record<string, ProposedChange> | null;
  createdAt: string;
}

export interface PendingCharacterDetail {
  id: string;
  userId: string;
  name: string;
  race: string;
  characterClass: string;
  background: string;
  stats: CharacterStats;
  spells: string[];
  status: "pending";
  createdAt: string;
}

export interface CharacterDetailForGm {
  id: string;
  userId: string;
  name: string;
  race: string;
  characterClass: string;
  background: string;
  stats: CharacterStats;
  spells: string[];
  status: string;
  proposedChanges: Record<string, ProposedChange> | null;
  createdAt: string;
}

export interface CharacterSummary {
  id: string;
  userId: string;
  name: string;
  race: string;
  characterClass: string;
  background: string;
  stats: CharacterStats;
  spells: string[];
  status: string;
  proposedChanges: Record<string, ProposedChange> | null;
  createdAt: string;
}

export interface ModifyCharacterByGmPayload {
  name?: string;
  race?: string;
  characterClass?: string;
  background?: string;
  stats?: CharacterStats;
  spells?: string[];
}

export interface CreateCharacterPayload {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  background: string;
  stats: CharacterStats;
  spells: string[];
}

// Inventory types

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  weight: number;
  slotType: string;
  statModifiers: Record<string, number>;
  position: number | null;
  equippedSlot: string | null;
}

export type EquipmentSlotType =
  | "head"
  | "torso"
  | "hands"
  | "legs"
  | "feet"
  | "ring1"
  | "ring2"
  | "weapon_shield";

export interface EquipmentSlot {
  slotType: EquipmentSlotType;
  item: InventoryItem | null;
}

export interface BackpackItem {
  id: string;
  name: string;
  description: string;
  weight: number;
  slotType: string;
  statModifiers: Record<string, number>;
  position: number;
}

export interface WeightInfo {
  currentWeight: number;
  maxCapacity: number;
  isOverencumbered: boolean;
}

export interface Inventory {
  characterId: string;
  campaignId: string;
  equipmentSlots: Record<EquipmentSlotType, InventoryItem | null>;
  backpackItems: BackpackItem[];
  currentWeight: number;
  maxCapacity: number;
  items: InventoryItem[];
}

// Map types

export interface MapLevel {
  id: string;
  campaignId: string;
  name: string;
  parentId: string | null;
  depth: number;
  backgroundImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMapLevelPayload {
  mapLevelId: string;
  name: string;
  parentId?: string;
  commandId: string;
}

export interface RenameMapLevelPayload {
  name: string;
  commandId: string;
}

export interface RequestMapBackgroundUploadPayload {
  contentType: string;
  fileSizeBytes: number;
  commandId: string;
}

export interface MapBackgroundUploadResponse {
  uploadUrl: string;
  publicUrl: string;
}

export interface SetMapBackgroundPayload {
  backgroundImageUrl: string;
  commandId: string;
}

// Token types

export type TokenType = "player" | "npc" | "monster" | "location";

export interface Token {
  id: string;
  campaignId: string;
  mapLevelId: string;
  x: number;
  y: number;
  tokenType: TokenType;
  label: string;
  destinationMapLevelId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceTokenPayload {
  tokenId: string;
  mapLevelId: string;
  x: number;
  y: number;
  tokenType: TokenType;
  label: string;
  commandId: string;
  destinationMapLevelId?: string;
}

export interface LinkLocationTokenPayload {
  destinationMapLevelId: string;
}

export interface MoveTokenPayload {
  x: number;
  y: number;
  commandId: string;
}

export interface RemoveTokenPayload {
  commandId: string;
}

// Fog of War types

export interface RevealFogZonePayload {
  fogZoneId: string;
  playerId: string;
  mapLevelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  commandId: string;
}

export interface RevealFogZoneToAllPayload {
  fogZoneId: string;
  mapLevelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  commandId: string;
}

export interface HideFogZonePayload {
  fogZoneId: string;
  playerId: string;
  commandId: string;
}

export interface HideFogZoneToAllPayload {
  fogZoneId: string;
  commandId: string;
}

export interface FogZone {
  id: string;
  mapLevelId: string;
  playerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  revealed: boolean;
  createdAt: string;
}

// Session types

export interface Session {
  id: string;
  campaignId: string;
  gmUserId: string;
  mode: "preparation" | "live";
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
}

export interface StartSessionPayload {
  sessionId: string;
}

export interface ChangeSessionModePayload {
  mode: "preparation" | "live";
}

// Action Pipeline types
export type ActionType = "move" | "attack" | "interact" | "free-text";

export interface PendingAction {
  id: string;
  sessionId: string;
  campaignId: string;
  playerId: string;
  actionType: ActionType;
  description: string;
  target: string | null;
  status: "pending";
  proposedAt: string;
}

export interface PingStatus {
  playerId: string;
  pingedAt: string;
}

export interface PingPlayerPayload {
  playerId: string;
}

export interface ProposeActionPayload {
  actionId: string;
  actionType: ActionType;
  description: string;
  target?: string;
}

export type ActionStatus = "pending" | "validated" | "rejected";

export interface ValidateActionPayload {
  narrativeNote?: string;
}

export interface RejectActionPayload {
  feedback: string;
}

export interface ReorderActionQueuePayload {
  orderedActionIds: string[];
}

export interface ActionOutcome {
  actionId: string;
  status: ActionStatus;
  narrativeNote?: string | null;
  feedback?: string | null;
  resolvedAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  campaignId: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}
