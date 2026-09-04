import { ACTIVITIES } from "../data/activities";
import { GEAR_ITEMS } from "../data/gear";
import type {
  ActivityDefinition,
  ActivityId,
  ActivityRiskBreakdown,
  BossId,
  DimensionDeltas,
  GearReadinessBand,
  GearReadinessMetric,
  GearRarity,
  GearItem,
  Hero,
  MaterialId,
  MetaProgression,
  RiskBand,
  ResolvedActivity,
  TriangleKey,
} from "../data/types";
import { applyReadinessGain, getBossReadiness } from "./bossReadiness";
import { generateGear, getExpectedFreshHeroGearPower, getGearPower, randomGearSlot, sumGearStats } from "./gearGenerator";
import { bossForRaidActivity, isLethalActivity } from "./activityMeta";
import { assertExhausted } from "../utils/assert";
import { getAgePhase } from "./character";
import {
  BLOCK_REASON_BOSS_READINESS,
  BLOCK_REASON_DAILY_LIMIT,
  BLOCK_REASON_DARING,
  BLOCK_REASON_DARING_MAX,
  BLOCK_REASON_ENERGY,
  BLOCK_REASON_GOLD,
  BLOCK_REASON_GEAR_BLUE,
  BLOCK_REASON_GEAR_GREEN,
  BLOCK_REASON_GEAR_PURPLE,
  BLOCK_REASON_LEVEL,
  BLOCK_REASON_RAID_DEATH,
  BLOCK_REASON_RENOWN,
  BLOCK_REASON_TRIANGLE_MAX,
  BLOCK_REASON_TRIANGLE_MIN,
  READINESS_LABEL_NOT_FULL_GREEN,
  READINESS_METRIC_KR,
  RISK_HINT_ELDERLY,
  RISK_HINT_GOOD_GEAR,
  RISK_HINT_HIGH_STATS,
  RISK_HINT_LEGACY_BONUS,
  RISK_HINT_NO_LETHAL,
  RISK_HINT_OVER_LEVELED,
  RISK_HINT_UNDER_LEVELED,
  RISK_HINT_WELL_PREPARED,
} from "../data/labels";

function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addMaterials(
  source: Partial<Record<MaterialId, number>>,
  delta: Partial<Record<MaterialId, number>>,
): Partial<Record<MaterialId, number>> {
  const next: Partial<Record<MaterialId, number>> = { ...source };
  for (const [id, amount] of Object.entries(delta)) {
    const materialId = id as MaterialId;
    const current = next[materialId] ?? 0;
    const nextValue = current + amount;
    if (nextValue <= 0) {
      delete next[materialId];
      continue;
    }
    next[materialId] = nextValue;
  }
  return next;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTriangle(raw: Hero["triangle"]): Hero["triangle"] {
  const war = Math.max(0, raw.war);
  const wit = Math.max(0, raw.wit);
  const wealth = Math.max(0, raw.wealth);
  const total = war + wit + wealth;
  if (total <= 0) {
    return { war: 33, wit: 33, wealth: 34 };
  }
  const scaledWar = Math.round((war / total) * 100);
  const scaledWit = Math.round((wit / total) * 100);
  const scaledWealth = 100 - scaledWar - scaledWit;
  return { war: scaledWar, wit: scaledWit, wealth: scaledWealth };
}

function applyDimensionDeltas(hero: Hero, deltas: DimensionDeltas): Hero {
  const next: Hero = {
    ...hero,
    triangle: { ...hero.triangle },
    bossReadiness: { ...hero.bossReadiness },
  };

  if (deltas.triangle !== undefined) {
    for (const [key, value] of Object.entries(deltas.triangle)) {
      const axis = key as TriangleKey;
      next.triangle[axis] += value;
    }
    next.triangle = normalizeTriangle(next.triangle);
  }

  if (deltas.renown !== undefined) {
    next.renown = clamp(next.renown + deltas.renown, 0, 100);
  }

  if (deltas.daring !== undefined) {
    next.daring = clamp(next.daring + deltas.daring, 0, 100);
  }

  if (deltas.bossReadiness !== undefined) {
    for (const [key, value] of Object.entries(deltas.bossReadiness)) {
      const bossId = key as BossId;
      next.bossReadiness[bossId] = applyReadinessGain(next.bossReadiness[bossId], value);
    }
  }

  return next;
}

const DEFAULT_RISK_PROFILE: Record<ActivityDefinition["category"], Required<NonNullable<ActivityDefinition["riskProfile"]>>> = {
  combat: {
    gearFactor: 0.14,
    prepFactor: 0.0015,
    knowledgeFactor: 0.02,
    minRisk: 0.04,
    maxRisk: 0.9,
  },
  knowledge: {
    gearFactor: 0.06,
    prepFactor: 0.0015,
    knowledgeFactor: 0.01,
    minRisk: 0.01,
    maxRisk: 0.8,
  },
  economic: {
    gearFactor: 0.08,
    prepFactor: 0.0012,
    knowledgeFactor: 0.01,
    minRisk: 0.01,
    maxRisk: 0.8,
  },
  social: {
    gearFactor: 0.05,
    prepFactor: 0.0015,
    knowledgeFactor: 0.01,
    minRisk: 0.005,
    maxRisk: 0.75,
  },
  general: {
    gearFactor: 0.08,
    prepFactor: 0.0012,
    knowledgeFactor: 0.01,
    minRisk: 0.01,
    maxRisk: 0.85,
  },
};

function rarityRank(rarity: GearRarity): number {
  switch (rarity) {
    case "gray":
      return 0;
    case "green":
      return 1;
    case "blue":
      return 2;
    case "purple":
      return 3;
  }
}

function countSlotsAtOrAboveRarity(hero: Hero, minRarity: GearRarity): number {
  const minRank = rarityRank(minRarity);
  return Object.values(hero.gear).reduce((count, item) => {
    if (item === null) {
      return count;
    }
    return rarityRank(item.rarity) >= minRank ? count + 1 : count;
  }, 0);
}

function readinessValue(hero: Hero, metric: GearReadinessMetric): number {
  if (metric === "greenPlusSlots") {
    return countSlotsAtOrAboveRarity(hero, "green");
  }
  if (metric === "bluePlusSlots") {
    return countSlotsAtOrAboveRarity(hero, "blue");
  }
  return countSlotsAtOrAboveRarity(hero, "purple");
}

function bandMatches(value: number, band: GearReadinessBand): boolean {
  if (band.min !== undefined && value < band.min) {
    return false;
  }
  if (band.max !== undefined && value > band.max) {
    return false;
  }
  return true;
}

function resolveReadinessFloor(hero: Hero, def: ActivityDefinition): { floor: number; label: string | null } {
  const rule = def.gearReadiness;
  if (rule === undefined) {
    return { floor: 0, label: null };
  }

  if (def.progressionTier === "capstone_raid") {
    const greenPlusSlots = countSlotsAtOrAboveRarity(hero, "green");
    if (greenPlusSlots < 5) {
      return {
        floor: 0.99,
        label: `${READINESS_LABEL_NOT_FULL_GREEN} (${greenPlusSlots}/5 ${READINESS_METRIC_KR.greenPlusSlots})`,
      };
    }
  }

  const value = readinessValue(hero, rule.metric);
  const matchedBand = rule.bands.find((band) => bandMatches(value, band));
  if (matchedBand === undefined || matchedBand.riskFloor <= 0) {
    return { floor: 0, label: null };
  }

  return {
    floor: matchedBand.riskFloor,
    label: `${matchedBand.label} (${value}/5 ${READINESS_METRIC_KR[rule.metric]})`,
  };
}

function computeLevelRiskAdjustment(hero: Hero, def: ActivityDefinition): { levelPenalty: number; levelMitigation: number } {
  const range = def.levelRange;
  if (range === undefined) {
    return { levelPenalty: 0, levelMitigation: 0 };
  }

  if (hero.level < range.min) {
    const levelsBelow = range.min - hero.level;
    return {
      levelPenalty: Math.min(0.45, levelsBelow * 0.08),
      levelMitigation: 0,
    };
  }

  const span = Math.max(1, range.max - range.min);
  const progressToTop = clamp((hero.level - range.min) / span, 0, 1);
  const baseMitigation = progressToTop * 0.18;
  if (hero.level <= range.max) {
    return {
      levelPenalty: 0,
      levelMitigation: baseMitigation,
    };
  }

  const levelsAbove = hero.level - range.max;
  return {
    levelPenalty: 0,
    levelMitigation: Math.min(0.3, baseMitigation + levelsAbove * 0.03),
  };
}

function riskBandFromValue(risk: number): RiskBand {
  if (risk < 0.05) {
    return "safe";
  }
  if (risk < 0.15) {
    return "manageable";
  }
  if (risk < 0.3) {
    return "dangerous";
  }
  return "lethal";
}

function mergeRiskProfile(def: ActivityDefinition): Required<NonNullable<ActivityDefinition["riskProfile"]>> {
  const defaults = DEFAULT_RISK_PROFILE[def.category];
  return {
    gearFactor: def.riskProfile?.gearFactor ?? defaults.gearFactor,
    prepFactor: def.riskProfile?.prepFactor ?? defaults.prepFactor,
    knowledgeFactor: def.riskProfile?.knowledgeFactor ?? defaults.knowledgeFactor,
    minRisk: def.riskProfile?.minRisk ?? defaults.minRisk,
    maxRisk: def.riskProfile?.maxRisk ?? defaults.maxRisk,
  };
}

const WEAK = "✗";  // 패널티: 취약
const STRONG = "✓"; // 경감: 강점

function buildRiskHintRow(label: string, kind: "penalty" | "mitigation"): string {
  const marker = kind === "penalty" ? WEAK : STRONG;
  return `${marker} ${label}`;
}

// 표시에 사용할 한국어 라벨 매핑(영문 키는 내부 식별자)
const READINESS_PENALTY_LABEL = "장비 부족으로 사망 확률 보장됨";

export function buildRiskHints(def: ActivityDefinition, breakdown: ActivityRiskBreakdown): string[] {
  const readinessPenaltyLabel = breakdown.readinessLabel ?? READINESS_PENALTY_LABEL;
  const rows: Array<{ label: string; amount: number; kind: "penalty" | "mitigation" }> = [
    { label: readinessPenaltyLabel, amount: breakdown.readinessFloor, kind: "penalty" },
    { label: RISK_HINT_UNDER_LEVELED, amount: breakdown.levelPenalty, kind: "penalty" },
    { label: RISK_HINT_OVER_LEVELED, amount: breakdown.levelMitigation, kind: "mitigation" },
    { label: RISK_HINT_GOOD_GEAR, amount: breakdown.gearMitigation, kind: "mitigation" },
    { label: RISK_HINT_WELL_PREPARED, amount: breakdown.prepMitigation + breakdown.knowledgeMitigation, kind: "mitigation" },
    { label: RISK_HINT_LEGACY_BONUS, amount: breakdown.metaMitigation, kind: "mitigation" },
    { label: RISK_HINT_ELDERLY, amount: breakdown.agePenalty, kind: "penalty" },
  ];

  if (def.deathRisk <= 0) {
    return [RISK_HINT_NO_LETHAL];
  }

  const filteredRows = rows.filter((row) => row.amount > 0.005);

  // 준비도 패널티가 있으면 "스탯 충분" 경감은 숨김(혼동 방지)
  const hasReadinessPenalty = filteredRows.some((r) => r.label === readinessPenaltyLabel && r.kind === "penalty");

  const finalRows = hasReadinessPenalty
    ? filteredRows.filter((r) => r.label !== RISK_HINT_HIGH_STATS)
    : filteredRows;

  return finalRows
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((row) => buildRiskHintRow(row.label, row.kind));
}

export function computeActivityRisk(hero: Hero, activityId: ActivityId, meta: MetaProgression): ActivityRiskBreakdown {
  const def = ACTIVITIES[activityId];
  if (def.deathRisk <= 0) {
    return {
      baseRisk: 0,
      levelMitigation: 0,
      gearMitigation: 0,
      readinessMitigation: 0,
      prepMitigation: 0,
      knowledgeMitigation: 0,
      metaMitigation: 0,
      levelPenalty: 0,
      agePenalty: 0,
      readinessFloor: 0,
      readinessLabel: null,
      finalRisk: 0,
      riskBand: "safe",
    };
  }

  const profile = mergeRiskProfile(def);
  const currentGearPower = getGearPower(hero);
  const baselineGearPower = getExpectedFreshHeroGearPower(hero.heroClass);
  const gearMitigation = Math.max(0, (currentGearPower - baselineGearPower) * 0.004 * profile.gearFactor);

  const prepMitigation = Math.max(0, hero.renown) * profile.prepFactor;

  let knowledgeMitigation = 0;
  if (def.id === "raid_molten_fury") {
    knowledgeMitigation = (getBossReadiness(hero, "molten_fury") / 100) * 0.28;
  } else if (def.id === "raid_eternal_throne") {
    knowledgeMitigation = (getBossReadiness(hero, "eternal_throne") / 100) * 0.28;
  }

  const metaMitigation = Math.max(0, meta.townspersonBonuses.combatBonus ?? 0) * 0.25;
  const levelAdjustment = computeLevelRiskAdjustment(hero, def);

  let agePenalty = 0;
  const agePhase = getAgePhase(hero.inGameDay);
  switch (agePhase) {
    case "healthy":
      agePenalty = 0;
      break;
    case "aging":
      agePenalty = 0.02;
      break;
    case "elderly":
      agePenalty = 0.05;
      break;
    default:
      assertExhausted(agePhase);
  }

  const unclampedWithoutAge = def.deathRisk
    - gearMitigation
    - prepMitigation
    - knowledgeMitigation
    - metaMitigation
    - levelAdjustment.levelMitigation
    + levelAdjustment.levelPenalty;
  const clampedWithoutAge = clamp(unclampedWithoutAge, profile.minRisk, profile.maxRisk);
  const readiness = resolveReadinessFloor(hero, def);
  const adjustedReadinessFloor = readiness.floor;
  const riskBeforeAge = Math.max(clampedWithoutAge, adjustedReadinessFloor);
  const finalRisk = Math.min(profile.maxRisk, riskBeforeAge + agePenalty);

  return {
    baseRisk: def.deathRisk,
    levelMitigation: levelAdjustment.levelMitigation,
    gearMitigation,
    readinessMitigation: knowledgeMitigation,
    prepMitigation,
    knowledgeMitigation: 0,
    metaMitigation,
    levelPenalty: levelAdjustment.levelPenalty,
    agePenalty,
    readinessFloor: adjustedReadinessFloor,
    readinessLabel: readiness.label,
    finalRisk,
    riskBand: riskBandFromValue(finalRisk),
  };
}

export function resolveActivity(hero: Hero, activityId: ActivityId, meta: MetaProgression): { resolved: ResolvedActivity; updatedHero: Hero } {
  const def = ACTIVITIES[activityId];
  const goldSpent = def.goldCost ?? 0;
  const effectiveEffects: DimensionDeltas = {
    ...def.effects,
    ...(def.effects.bossReadiness !== undefined ? { bossReadiness: { ...def.effects.bossReadiness } } : {}),
  };
  if (def.category === "knowledge") {
    const multiplier = meta.townspersonBonuses.knowledgeTransferMultiplier ?? 1;
    if (effectiveEffects.bossReadiness !== undefined) {
      for (const [bossId, baseGain] of Object.entries(effectiveEffects.bossReadiness)) {
        effectiveEffects.bossReadiness[bossId as BossId] = Math.round(baseGain * multiplier);
      }
    }
  }

  const riskBreakdown = computeActivityRisk(hero, activityId, meta);
  const finalDeathRisk = riskBreakdown.finalRisk;
  const rolledFailure = finalDeathRisk > 0 && Math.random() < finalDeathRisk;
  const died = rolledFailure && isLethalActivity(activityId);
  const failed = rolledFailure && !died;
  const riskHints = buildRiskHints(def, riskBreakdown);

  if (activityId === "raid_molten_fury") {
    const executionGain = died ? 2 : 6;
    const existing = effectiveEffects.bossReadiness ?? {};
    effectiveEffects.bossReadiness = {
      ...existing,
      molten_fury: (existing.molten_fury ?? 0) + executionGain,
    };
  }

  let materialsGained: Partial<Record<MaterialId, number>> = {};
  if (!died && !failed) {
    if (activityId === "dungeon_irondeep" || activityId === "dungeon_whispering_crypts") {
      materialsGained = addMaterials(materialsGained, { iron_shards: 1 });
    }
    if (activityId === "dungeon_scholomance" || activityId === "dungeon_blackrock") {
      materialsGained = addMaterials(materialsGained, { iron_shards: 1, arcane_essence: 1 });
    }
    if (activityId === "raid_molten_fury") {
      materialsGained = addMaterials(materialsGained, { ember_core: 1 });
    }
    if (activityId === "raid_eternal_throne") {
      materialsGained = addMaterials(materialsGained, { ember_core: 2, vault_relic: 1 });
    }
  }

  // Loot drops
  const lootDropped: GearItem[] = [];
  if (!died && !failed) {
    for (const drop of def.outcomes.lootTable) {
      if (Math.random() < drop.chance) {
        if (drop.itemId !== undefined) {
          const item = GEAR_ITEMS[drop.itemId];
          if (item !== undefined) {
            lootDropped.push(item);
          }
          continue;
        }
        if (drop.rarity !== undefined) {
          const slot = drop.slot ?? randomGearSlot();
          const item = generateGear(hero.heroClass, slot, drop.rarity, hero.level, hero.gear);
          lootDropped.push(item);
        }
      }
    }
  }

  const noRewards = died || failed;
  const xpGained = noRewards ? 0 : roll(def.outcomes.xpMin, def.outcomes.xpMax);
  const goldGained = noRewards ? 0 : roll(def.outcomes.goldMin, def.outcomes.goldMax);

  const resolved: ResolvedActivity = {
    activityId,
    xpGained,
    goldGained,
    goldSpent,
    lootDropped,
    died,
    failed,
    appliedEffects: effectiveEffects,
    effectiveDeathRisk: finalDeathRisk,
    riskBand: riskBreakdown.riskBand,
    riskBreakdown,
    riskHints,
    ...(Object.keys(materialsGained).length > 0 ? { materialsGained } : {}),
  };

  // Update hero dimensions and gold
  let updatedHero: Hero = {
    ...applyDimensionDeltas(hero, effectiveEffects),
    gold: hero.gold + goldGained - goldSpent,
    materials: addMaterials(hero.materials, materialsGained),
  };

  // Raid defeat tracking
  const defeatedBoss = !died ? bossForRaidActivity(activityId) : null;
  if (defeatedBoss !== null) {
    updatedHero = {
      ...updatedHero,
      raidLockouts: { ...updatedHero.raidLockouts, [defeatedBoss]: hero.inGameDay },
    };
  }

  // Equip better loot automatically
  for (const item of lootDropped) {
    const currentInSlot = updatedHero.gear[item.slot];
    if (currentInSlot === null || sumGearStats(item) > sumGearStats(currentInSlot)) {
      updatedHero = {
        ...updatedHero,
        gear: { ...updatedHero.gear, [item.slot]: item },
      };
    }
  }

  return { resolved, updatedHero };
}

export function isActivityUnlocked(hero: Hero, def: ActivityDefinition, meta: MetaProgression): boolean {
  const cond = def.unlockConditions;
  if (cond === undefined) {
    return true;
  }
  if (cond.requiresRaidDeath === true && meta.raidDeaths < 1) {
    return false;
  }
  if (cond.minLevel !== undefined && hero.level < cond.minLevel) {
    return false;
  }
  if (cond.minTriangle !== undefined) {
    for (const [key, value] of Object.entries(cond.minTriangle)) {
      if (hero.triangle[key as TriangleKey] < value) {
        return false;
      }
    }
  }
  if (cond.maxTriangle !== undefined) {
    for (const [key, value] of Object.entries(cond.maxTriangle)) {
      if (hero.triangle[key as TriangleKey] > value) {
        return false;
      }
    }
  }
  if (cond.minRenown !== undefined && hero.renown < cond.minRenown) {
    return false;
  }
  if (cond.minDaring !== undefined && hero.daring < cond.minDaring) {
    return false;
  }
  if (cond.maxDaring !== undefined && hero.daring > cond.maxDaring) {
    return false;
  }
  if (cond.minBossReadiness !== undefined) {
    for (const [key, value] of Object.entries(cond.minBossReadiness)) {
      if (getBossReadiness(hero, key as BossId) < value) {
        return false;
      }
    }
  }
  if (cond.minGreenPlusSlots !== undefined && countSlotsAtOrAboveRarity(hero, "green") < cond.minGreenPlusSlots) {
    return false;
  }
  if (cond.minBluePlusSlots !== undefined && countSlotsAtOrAboveRarity(hero, "blue") < cond.minBluePlusSlots) {
    return false;
  }
  if (cond.minPurpleSlots !== undefined && countSlotsAtOrAboveRarity(hero, "purple") < cond.minPurpleSlots) {
    return false;
  }
  return true;
}

export function getActivityUnlockGaps(hero: Hero, def: ActivityDefinition, meta: MetaProgression): string[] {
  const cond = def.unlockConditions;
  if (cond === undefined) {
    return [];
  }

  const gaps: string[] = [];
  if (cond.requiresRaidDeath === true && meta.raidDeaths < 1) {
    gaps.push(BLOCK_REASON_RAID_DEATH);
  }
  if (cond.minLevel !== undefined && hero.level < cond.minLevel) {
    gaps.push(BLOCK_REASON_LEVEL(cond.minLevel));
  }
  if (cond.minTriangle !== undefined) {
    for (const [key, value] of Object.entries(cond.minTriangle)) {
      const need = value;
      const current = hero.triangle[key as TriangleKey];
      if (current < need) {
        gaps.push(BLOCK_REASON_TRIANGLE_MIN(key, current, need));
      }
    }
  }
  if (cond.maxTriangle !== undefined) {
    for (const [key, value] of Object.entries(cond.maxTriangle)) {
      const need = value;
      const current = hero.triangle[key as TriangleKey];
      if (current > need) {
        gaps.push(BLOCK_REASON_TRIANGLE_MAX(key, current, need));
      }
    }
  }
  if (cond.minRenown !== undefined && hero.renown < cond.minRenown) {
    gaps.push(BLOCK_REASON_RENOWN(hero.renown, cond.minRenown));
  }
  if (cond.minDaring !== undefined && hero.daring < cond.minDaring) {
    gaps.push(BLOCK_REASON_DARING(hero.daring, cond.minDaring));
  }
  if (cond.maxDaring !== undefined && hero.daring > cond.maxDaring) {
    gaps.push(BLOCK_REASON_DARING_MAX(hero.daring, cond.maxDaring));
  }
  if (cond.minBossReadiness !== undefined) {
    for (const [key, value] of Object.entries(cond.minBossReadiness)) {
      const need = value;
      const current = getBossReadiness(hero, key as BossId);
      if (current < need) {
        gaps.push(BLOCK_REASON_BOSS_READINESS(key, Math.round(current), need));
      }
    }
  }
  const greenPlus = countSlotsAtOrAboveRarity(hero, "green");
  if (cond.minGreenPlusSlots !== undefined && greenPlus < cond.minGreenPlusSlots) {
    gaps.push(BLOCK_REASON_GEAR_GREEN(greenPlus, cond.minGreenPlusSlots));
  }
  const bluePlus = countSlotsAtOrAboveRarity(hero, "blue");
  if (cond.minBluePlusSlots !== undefined && bluePlus < cond.minBluePlusSlots) {
    gaps.push(BLOCK_REASON_GEAR_BLUE(bluePlus, cond.minBluePlusSlots));
  }
  const purple = countSlotsAtOrAboveRarity(hero, "purple");
  if (cond.minPurpleSlots !== undefined && purple < cond.minPurpleSlots) {
    gaps.push(BLOCK_REASON_GEAR_PURPLE(purple, cond.minPurpleSlots));
  }
  return gaps;
}

/**
 * Build a list of human-readable reasons why an activity cannot currently be planned.
 * Used by the planning UI to surface energy, gold, unlock, and daily limit blockers.
 */
export function buildActivityBlockedReasons(
  hero: Hero,
  def: ActivityDefinition,
  meta: MetaProgression,
  energyRemaining: number,
  goldRemaining: number,
  usesToday: number,
): string[] {
  const reasons: string[] = [];

  if (energyRemaining < def.energyCost) {
    reasons.push(BLOCK_REASON_ENERGY(energyRemaining, def.energyCost));
  }

  const goldCost = def.goldCost ?? 0;
  if (goldRemaining < goldCost) {
    reasons.push(BLOCK_REASON_GOLD(goldRemaining, goldCost));
  }

  reasons.push(...getActivityUnlockGaps(hero, def, meta));

  if (def.maxDailyUses !== undefined && usesToday >= def.maxDailyUses) {
    const safeUses = Math.min(usesToday, def.maxDailyUses);
    reasons.push(BLOCK_REASON_DAILY_LIMIT(safeUses, def.maxDailyUses));
  }

  return reasons;
}

export function canAffordActivities(activities: ActivityId[], maxEnergy: number): boolean {
  const total = activities.reduce((sum, id) => {
    const def = ACTIVITIES[id];
    return sum + def.energyCost;
  }, 0);
  return total <= maxEnergy;
}

export function totalEnergyCost(activities: ActivityId[]): number {
  return activities.reduce((sum, id) => {
    const def = ACTIVITIES[id];
    return sum + def.energyCost;
  }, 0);
}
