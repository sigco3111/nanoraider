// ─── Dimensions ────────────────────────────────────────────────────────────────

export type TriangleKey = "war" | "wit" | "wealth";
export type BossId = "molten_fury" | "eternal_throne";

export interface BuildTriangle {
  war: number;
  wit: number;
  wealth: number;
}

export interface DimensionDeltas {
  triangle?: Partial<Record<TriangleKey, number>>;
  renown?: number;
  daring?: number;
  bossReadiness?: Partial<Record<BossId, number>>;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityId =
  | "quest"
  | "dungeon_irondeep"
  | "dungeon_whispering_crypts"
  | "dungeon_scholomance"
  | "dungeon_blackrock"
  | "farm_gold"
  | "study_boss"
  | "analyze_logs"
  | "training_dummy"
  | "raid_rehearsal"
  | "raid_molten_fury"
  | "raid_eternal_throne"
  | "host_guild_meeting"
  | "black_market_trading"
  | "buy_raid_supplies"
  | "commission_enchant";

export type ActivityProgressionTier = "none" | "early_dungeon" | "mid_dungeon" | "entry_raid" | "capstone_raid";
export type DungeonActivityId =
  | "dungeon_irondeep"
  | "dungeon_whispering_crypts"
  | "dungeon_scholomance"
  | "dungeon_blackrock";

export interface UnlockConditions {
  minLevel?: number;
  minTriangle?: Partial<Record<TriangleKey, number>>;
  maxTriangle?: Partial<Record<TriangleKey, number>>;
  minRenown?: number;
  minDaring?: number;
  maxDaring?: number;
  minBossReadiness?: Partial<Record<BossId, number>>;
  minGreenPlusSlots?: number;
  minBluePlusSlots?: number;
  minPurpleSlots?: number;
  requiresRaidDeath?: boolean;
}

export type GearReadinessMetric = "greenPlusSlots" | "bluePlusSlots" | "purpleSlots";

export interface GearReadinessBand {
  min?: number;
  max?: number;
  riskFloor: number;
  label: string;
}

export interface GearReadinessRule {
  metric: GearReadinessMetric;
  bands: GearReadinessBand[];
}

export interface ActivityLevelRange {
  min: number;
  max: number;
}

export interface ActivityDefinition {
  id: ActivityId;
  name: string;
  description: string;
  energyCost: number;
  /**
   * Optional per-activity cap on how many times it can be used in a single in-game day.
   * Counts both already-resolved and currently planned instances.
   * If omitted, the activity has no explicit daily cap beyond the global energy limit.
   */
  maxDailyUses?: number;
  goldCost?: number;
  durationHours: number;
  progressionTier: ActivityProgressionTier;
  levelRange?: ActivityLevelRange;
  category: "combat" | "economic" | "knowledge" | "social" | "general";
  effects: DimensionDeltas;
  outcomes: ActivityOutcomeTable;
  unlockConditions?: UnlockConditions;
  gearReadiness?: GearReadinessRule;
  deathRisk: number; // 0–1
  riskProfile?: {
    gearFactor?: number;
    prepFactor?: number;
    knowledgeFactor?: number;
    minRisk?: number;
    maxRisk?: number;
  };
}

export interface ActivityOutcomeTable {
  xpMin: number;
  xpMax: number;
  goldMin: number;
  goldMax: number;
  lootTable: LootDrop[];
}

export interface LootDrop {
  chance: number; // 0–1
  itemId?: string;
  rarity?: GearRarity;
  slot?: GearSlot;
}

// ─── Daily Events ─────────────────────────────────────────────────────────────

export type DailyEventId =
  | "militia_training"
  | "traveling_merchant"
  | "scholar_lecture"
  | "guild_conflict";

export interface DailyEventChoice {
  id: string;
  label: string;
  description: string;
  effects: DimensionDeltas;
  xpGain?: number;
  goldGain?: number;
}

export interface DailyEventDefinition {
  id: DailyEventId;
  title: string;
  description: string;
  minDay: number;
  maxDay?: number;
  weight: number;
  choices: DailyEventChoice[];
}

export interface PendingDailyEvent {
  eventId: DailyEventId;
}

// ─── Gear ─────────────────────────────────────────────────────────────────────

export type HeroClass = "warrior" | "rogue" | "mage" | "guardian" | "bard";
export type ArmorWeight = "plate" | "cloth" | "leather";
export type GearSlot = "head" | "chest" | "legs" | "mainhand" | "offhand";
export type ArmorSlot = "head" | "chest" | "legs";
export type WeaponSlot = "mainhand" | "offhand";
export type GearRarity = "gray" | "green" | "blue" | "purple";

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  power: number;
}

export type MaterialId = "iron_shards" | "arcane_essence" | "ember_core" | "vault_relic";
export type VendorId = "quartermaster" | "artisan" | "broker" | "raid_provisioner";
export type VendorTier = 1 | 2 | 3;

export interface VendorOffer {
  id: string;
  vendorId: VendorId;
  name: string;
  description: string;
  tier: VendorTier;
  costs: {
    gold?: number;
    materials?: Partial<Record<MaterialId, number>>;
  };
  rewards: {
    materials?: Partial<Record<MaterialId, number>>;
    recipeUnlocks?: RecipeId[];
    fixedItemId?: string;
  };
  rotating?: boolean;
}

export type RecipeId =
  | "reforge_green_head"
  | "reforge_green_chest"
  | "reforge_green_legs"
  | "reforge_green_mainhand"
  | "reforge_green_offhand"
  | "craft_blue_head"
  | "craft_blue_chest"
  | "craft_blue_legs"
  | "craft_blue_mainhand"
  | "craft_blue_offhand"
  | "upgrade_purple_head"
  | "upgrade_purple_chest"
  | "upgrade_purple_legs"
  | "upgrade_purple_mainhand"
  | "upgrade_purple_offhand";

export interface RecipeDefinition {
  id: RecipeId;
  slot: GearSlot;
  rarity: GearRarity;
  energyCost: number;
  goldCost: number;
  materialsCost: Partial<Record<MaterialId, number>>;
  requiresKnownRecipe?: boolean;
}

// ─── Townspeople ─────────────────────────────────────────────────────────────

export type TownspersonRoleId =
  | "battlemaster"
  | "quartermaster"
  | "lorekeeper"
  | "trailblazer"
  | "herald"
  | "forgemaster"
  | "warchief"
  | "siegebreaker";

export type RaidGate = "none" | "molten_fury" | "eternal_throne";

export interface TownspersonUnlockCondition {
  minTriangle?: Partial<Record<TriangleKey, number>>;
  maxTriangle?: Partial<Record<TriangleKey, number>>;
  minRenown?: number;
  minDaring?: number;
  maxDaring?: number;
  minGoldAtDeath?: number;
  minBossReadiness?: Partial<Record<BossId, number>>;
  mustDefeatRaids?: BossId[];
}

export interface TownspersonDefinition {
  id: TownspersonRoleId;
  name: string;
  raidGate: RaidGate;
  description: string;
  lore: string;
  unlockCondition: TownspersonUnlockCondition;
  bonuses: TownspersonBonuses;
  hint: string;
}

export interface TownspersonBonuses {
  energyBonus: number; // permanent max energy increase
  startGold?: number; // gold on new run start
  combatBonus?: number; // % damage increase (0.1 = 10%)
  bossReadinessBonus?: number; // % boss readiness on new hero (0.05 = 5%)
  knowledgeTransferMultiplier?: number; // multiplier on study gains
  vendorDiscountPct?: number; // additive vendor discount
  recipeDiscountPct?: number; // additive recipe crafting discount
  purpleCraftStatBonusPct?: number; // additive output stat bonus for purple crafts
  brokerTierStart?: VendorTier; // starting broker tier access
  raidProvisionerUnlocked?: boolean; // access to raid provisioner vendor
}

export interface TownspersonHeroSnapshot {
  heroName: string;
  triangle: BuildTriangle;
  renown: number;
  daring: number;
  level: number;
  defeatedRaids: BossId[];
  dayReached: number;
}

export interface FilledTownsperson {
  roleId: TownspersonRoleId;
  hero: TownspersonHeroSnapshot;
  unlockedAtRun: number;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export interface GearSlots {
  head: GearItem | null;
  chest: GearItem | null;
  legs: GearItem | null;
  mainhand: GearItem | null;
  offhand: GearItem | null;
}

export interface Hero {
  name: string;
  heroClass: HeroClass;
  level: number;
  xp: number;
  xpToNextLevel: number;
  inGameDay: number; // 1–18+
  gold: number;
  gear: GearSlots;
  triangle: BuildTriangle;
  renown: number; // visible 0-100
  daring: number; // hidden, revealed at death
  bossReadiness: Record<BossId, number>;
  materials: Partial<Record<MaterialId, number>>;
  knownRecipes: RecipeId[];
  completedActivitiesToday: ActivityId[];
  raidLockouts: Partial<Record<BossId, number>>; // bossId -> day attempted
}

// ─── Run State ────────────────────────────────────────────────────────────────

export type GameScreen =
  | "main_menu"
  | "hero_creation"
  | "planning"
  | "daily_event"
  | "day_results"
  | "death"
  | "collection"
  | "upgrades";

export interface DayResult {
  day: number;
  activitiesResolved: ResolvedActivity[];
  eventsResolved: ResolvedDailyEvent[];
  totalXp: number;
  totalGold: number; // net (gained - spent)
  totalGoldSpent: number;
  lootObtained: GearItem[];
  heroSurvived: boolean;
  deathCause?: "combat" | "old_age";
  triangleSnapshot: BuildTriangle;
  renownSnapshot: number;
  transactions: EconomyTransaction[];
}

export interface ResolvedActivity {
  activityId: ActivityId;
  xpGained: number;
  goldGained: number;
  goldSpent: number;
  lootDropped: GearItem[];
  died: boolean;
  failed: boolean;
  appliedEffects: DimensionDeltas;
  effectiveDeathRisk: number;
  riskBand: RiskBand;
  riskBreakdown: ActivityRiskBreakdown | null;
  riskHints: string[];
  materialsGained?: Partial<Record<MaterialId, number>>;
}

export type RiskBand = "safe" | "manageable" | "dangerous" | "lethal";

export interface ActivityRiskBreakdown {
  baseRisk: number;
  levelMitigation: number;
  gearMitigation: number;
  readinessMitigation: number;
  prepMitigation: number;
  knowledgeMitigation: number;
  metaMitigation: number;
  levelPenalty: number;
  agePenalty: number;
  readinessFloor: number;
  readinessLabel: string | null;
  finalRisk: number;
  riskBand: RiskBand;
}

export interface ResolvedDailyEvent {
  eventId: DailyEventId;
  choiceId: string;
  xpGained: number;
  goldGained: number;
  appliedEffects: DimensionDeltas;
}

export interface EconomyTransaction {
  kind: "vendor_purchase" | "craft";
  label: string;
  energySpent?: number;
  goldSpent?: number;
  materialsDelta?: Partial<Record<MaterialId, number>>;
}

// ─── Meta-Progression (persists across runs) ──────────────────────────────────

export interface MetaProgression {
  totalRuns: number;
  raidDeaths: number;
  maxEnergy: number; // starts at 50, grows permanently
  achievementPoints: number;
  townspeople: FilledTownsperson[]; // hero survivors in the outpost
  townspersonBonuses: TownspersonBonuses; // stacked from all filled townsperson roles
  bossReadinessBank: Partial<Record<BossId, number>>; // persists across runs
  vendorTiersUnlocked: Partial<Record<VendorId, VendorTier>>;
  knownRecipes: RecipeId[];
  craftingEfficiency: number;
  salvageYieldBonus: number;
  apUpgrades: APUpgradeId[];
}

export type APUpgradeId = "energy_10" | "start_gold_100" | "vendor_reroll_1";

export interface APUpgrade {
  id: APUpgradeId;
  name: string;
  description: string;
  cost: number;
  maxPurchases: number;
}
