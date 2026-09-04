import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActivityId,
  BossId,
  DayResult,
  EconomyTransaction,
  FilledTownsperson,
  GameScreen,
  Hero,
  HeroClass,
  MaterialId,
  MetaProgression,
  PendingDailyEvent,
  RecipeId,
  RiskBand,
  ResolvedActivity,
  ResolvedDailyEvent,
  TownspersonRoleId,
  VendorId,
  VendorOffer,
} from "../data/types";
import { DAILY_EVENTS, DAILY_EVENT_LIST } from "../data/nurture";
import { getActivityUnlockGaps as getUnlockGapsForActivity, isActivityUnlocked, resolveActivity } from "../game/activityResolver";
import { checkTownspersonOnDeath, stackTownspersonBonuses } from "../game/townspersonChecker";
import { applyXp, createHero } from "../game/heroFactory";
import { AP_UPGRADES } from "../data/townspeople";
import { ACTIVITIES } from "../data/activities";
import { RECIPE_DEFINITIONS, baseVendorTierUnlocks, defaultKnownRecipes, listVendorOffers } from "../data/crafting";
import { GEAR_ITEMS } from "../data/gear";
import { randomHeroName } from "../data/nurture";
import { applyReadinessGain, normalizeBossReadinessBank } from "../game/bossReadiness";
import { generateGear, sumGearStats } from "../game/gearGenerator";
import { bossForRaidActivity, isLethalActivity } from "../game/activityMeta";
import {
  RARITY_KR,
  SLOT_SHORT_KR,
  TX_BUY_OFFER,
  TX_CRAFT,
  TX_REROLL_VENDOR,
  VENDOR_LABEL,
} from "../data/labels";

const BASE_ENERGY = 50;
const AP_PER_RUN = 25;
const OLD_AGE_START_DAY = 10;
const OLD_AGE_DEATH_CHANCE_PER_DAY = 0.12;
const TRACKED_BOSSES: BossId[] = ["molten_fury", "eternal_throne"];

function addMaterials(
  source: Partial<Record<MaterialId, number>>,
  delta: Partial<Record<MaterialId, number>>,
): Partial<Record<MaterialId, number>> {
  const next: Partial<Record<MaterialId, number>> = { ...source };
  for (const [id, amount] of Object.entries(delta)) {
    const materialId = id as MaterialId;
    const current = next[materialId] ?? 0;
    const value = current + amount;
    if (value <= 0) {
      delete next[materialId];
      continue;
    }
    next[materialId] = value;
  }
  return next;
}

function canAffordMaterials(
  owned: Partial<Record<MaterialId, number>>,
  costs: Partial<Record<MaterialId, number>> | undefined,
): boolean {
  if (costs === undefined) {
    return true;
  }
  return Object.entries(costs).every(([id, amount]) => (owned[id as MaterialId] ?? 0) >= amount);
}

function applyDiscount(base: number, pct: number): number {
  return Math.max(0, Math.round(base * (1 - Math.min(0.45, Math.max(0, pct)))));
}

function clampVendorTier(value: number): 1 | 2 | 3 {
  if (value >= 3) {
    return 3;
  }
  if (value >= 2) {
    return 2;
  }
  return 1;
}

export interface DeathSummary {
  heroName: string;
  level: number;
  inGameDay: number;
  gold: number;
  cause: "combat" | "old_age";
  totalXpGained: number;
  townspersonUnlocked: TownspersonRoleId | null;
  heroSurvived: boolean;
  whyUnlocked: string | null;
  almostUnlocked: TownspersonRoleId | null;
  almostReason: string | null;
  energyBonusGranted: number;
  apGranted: number;
  triangleSnapshot: Hero["triangle"];
  renownSnapshot: number;
  daringSnapshot: number;
  bossReadinessSnapshot: Hero["bossReadiness"];
  defeatedRaids: BossId[];
  fatalActivityId: ActivityId | null;
  fatalActivityRisk: number | null;
  fatalRiskBand: RiskBand | null;
  fatalRiskHints: string[];
}

interface GameState {
  screen: GameScreen;
  hero: Hero | null;
  meta: MetaProgression;
  energyUsedToday: number;
  plannedActivities: ActivityId[];
  currentDayActivities: ResolvedActivity[];
  currentDayEvents: ResolvedDailyEvent[];
  pendingEvent: PendingDailyEvent | null;
  lastDayResults: DayResult | null;
  deathSummary: DeathSummary | null;
  runXpTotal: number;
  defeatedRaidsThisRun: BossId[];
  directEnergySpentToday: number;
  todayTransactions: EconomyTransaction[];
  vendorRerollsUsedToday: number;

  // Navigation
  goTo: (screen: GameScreen) => void;

  // Hero creation
  startHeroCreation: () => void;
  createHero: (name: string) => void;
  renameHero: (name: string) => void;
  changeHeroClass: (heroClass: HeroClass) => void;

  // Day loop
  planActivity: (activityId: ActivityId) => void;
  unplanActivity: (index: number) => void;
  clearPlan: () => void;
  resolvePendingEvent: (choiceId: string) => void;
  endDay: () => void;
  dismissPendingEvent: () => void;

  // Helpers
  getActivityUnlockGaps: (activityId: ActivityId) => string[];
  getVendorOffers: (vendorId: VendorId) => VendorOffer[];
  buyVendorOffer: (offer: VendorOffer) => boolean;
  craftRecipe: (recipeId: RecipeId) => boolean;
  getDailyRerollsRemaining: () => number;
  rerollVendor: (vendorId: VendorId) => boolean;

  // Meta
  spendAP: (upgradeId: string) => void;
  resetRun: () => void;
}

function buildInitialMeta(): MetaProgression {
  return {
    totalRuns: 0,
    raidDeaths: 0,
    maxEnergy: BASE_ENERGY,
    achievementPoints: 0,
    townspeople: [],
    townspersonBonuses: {
      energyBonus: 0,
      startGold: 0,
      combatBonus: 0,
      bossReadinessBonus: 0,
      knowledgeTransferMultiplier: 1,
      vendorDiscountPct: 0,
      recipeDiscountPct: 0,
      purpleCraftStatBonusPct: 0,
      brokerTierStart: 1,
      raidProvisionerUnlocked: false,
    },
    bossReadinessBank: {},
    vendorTiersUnlocked: baseVendorTierUnlocks(),
    knownRecipes: defaultKnownRecipes(),
    craftingEfficiency: 0,
    salvageYieldBonus: 0,
    apUpgrades: [],
  };
}

function applyEventEffects(hero: Hero, effects: NonNullable<ResolvedDailyEvent["appliedEffects"]>): Hero {
  const updated: Hero = {
    ...hero,
    triangle: { ...hero.triangle },
    bossReadiness: { ...hero.bossReadiness },
  };

  if (effects.triangle !== undefined) {
    for (const [key, value] of Object.entries(effects.triangle)) {
      updated.triangle[key as keyof Hero["triangle"]] += value;
    }
  }
  if (effects.renown !== undefined) {
    updated.renown = Math.max(0, Math.min(100, updated.renown + effects.renown));
  }
  if (effects.daring !== undefined) {
    updated.daring = Math.max(0, Math.min(100, updated.daring + effects.daring));
  }
  if (effects.bossReadiness !== undefined) {
    for (const [key, value] of Object.entries(effects.bossReadiness)) {
      const boss = key as BossId;
      updated.bossReadiness[boss] = applyReadinessGain(updated.bossReadiness[boss], value);
    }
  }

  return updated;
}

function shouldTriggerEvent(energySpent: number, maxEnergy: number): boolean {
  const energyRatio = maxEnergy > 0 ? Math.min(1, energySpent / maxEnergy) : 0;
  const chance = 0.05 + 0.15 * energyRatio;
  return Math.random() < chance;
}

function rollDailyEvent(day: number): PendingDailyEvent | null {
  const candidates = DAILY_EVENT_LIST.filter((event) => day >= event.minDay && (event.maxDay === undefined || day <= event.maxDay));
  if (candidates[0] === undefined) {
    return null;
  }
  const totalWeight = candidates.reduce((sum, event) => sum + event.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of candidates) {
    roll -= event.weight;
    if (roll <= 0) {
      return { eventId: event.id };
    }
  }
  return { eventId: candidates[0].id };
}

const GAMESTORE_VERSION = 5;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      screen: "main_menu",
      hero: null,
      meta: buildInitialMeta(),
      energyUsedToday: 0,
      plannedActivities: [],
      currentDayActivities: [],
      currentDayEvents: [],
      pendingEvent: null,
      lastDayResults: null,
      deathSummary: null,
      runXpTotal: 0,
      defeatedRaidsThisRun: [],
      directEnergySpentToday: 0,
      todayTransactions: [],
      vendorRerollsUsedToday: 0,

      goTo: (screen) => set({ screen }),

      startHeroCreation: () => {
        const { meta } = get();
        const hero = createHero(randomHeroName(), meta);
        set({
          hero,
          screen: "planning",
          energyUsedToday: 0,
          plannedActivities: [],
          currentDayActivities: [],
          currentDayEvents: [],
          pendingEvent: null,
          runXpTotal: 0,
          defeatedRaidsThisRun: [],
          directEnergySpentToday: 0,
          todayTransactions: [],
          vendorRerollsUsedToday: 0,
        });
      },

      createHero: (name) => {
        const { meta } = get();
        const hero = createHero(name, meta);
        set({
          hero,
          screen: "planning",
          energyUsedToday: 0,
          plannedActivities: [],
          currentDayActivities: [],
          currentDayEvents: [],
          pendingEvent: null,
          runXpTotal: 0,
          defeatedRaidsThisRun: [],
          directEnergySpentToday: 0,
          todayTransactions: [],
          vendorRerollsUsedToday: 0,
        });
      },

      renameHero: (name) => {
        const { hero } = get();
        if (hero === null || name.trim().length === 0) {
          return;
        }
        if (hero.inGameDay > 1) {
          return;
        }
        set({ hero: { ...hero, name: name.trim() } });
      },

      changeHeroClass: (heroClass) => {
        const { hero } = get();
        if (hero === null) {
          return;
        }
        if (hero.inGameDay > 1) {
          return;
        }
        const emptyGear = { head: null, chest: null, legs: null, mainhand: null, offhand: null };
        const startingGear = {
          head: generateGear(heroClass, "head", "gray", hero.level, emptyGear),
          chest: generateGear(heroClass, "chest", "gray", hero.level, emptyGear),
          legs: generateGear(heroClass, "legs", "gray", hero.level, emptyGear),
          mainhand: generateGear(heroClass, "mainhand", "gray", hero.level, emptyGear),
          offhand: generateGear(heroClass, "offhand", "gray", hero.level, emptyGear),
        };
        set({ hero: { ...hero, heroClass, gear: startingGear } });
      },

      planActivity: (activityId) => {
        const { hero, meta, plannedActivities, directEnergySpentToday } = get();
        if (hero === null) {
          return;
        }

        const def = ACTIVITIES[activityId];
        if (!isActivityUnlocked(hero, def, meta)) {
          return;
        }
        // Enforce optional per-activity daily caps, counting both completed and planned instances.
        if (def.maxDailyUses !== undefined) {
          const completedCount = hero.completedActivitiesToday.filter((id) => id === activityId).length;
          const plannedCount = plannedActivities.filter((id) => id === activityId).length;
          if (completedCount + plannedCount >= def.maxDailyUses) {
            return;
          }
        }
        const plannedEnergy = plannedActivities.reduce((sum, id) => sum + ACTIVITIES[id].energyCost, 0);
        if (plannedEnergy + directEnergySpentToday + def.energyCost > meta.maxEnergy) {
          return;
        }

        const plannedGoldSpend = plannedActivities.reduce((sum, id) => sum + (ACTIVITIES[id].goldCost ?? 0), 0);
        if (plannedGoldSpend + (def.goldCost ?? 0) > hero.gold) {
          return;
        }

        const nextPlan = [...plannedActivities, activityId];
        const nextEnergy = nextPlan.reduce((sum, id) => sum + ACTIVITIES[id].energyCost, 0);
        set({
          plannedActivities: nextPlan,
          energyUsedToday: nextEnergy,
        });
      },

      unplanActivity: (index) => {
        const { plannedActivities } = get();
        if (index < 0 || index >= plannedActivities.length) {
          return;
        }

        const nextPlan = plannedActivities.filter((_, i) => i !== index);
        const nextEnergy = nextPlan.reduce((sum, id) => sum + ACTIVITIES[id].energyCost, 0);
        set({
          plannedActivities: nextPlan,
          energyUsedToday: nextEnergy,
        });
      },

      clearPlan: () => set({ plannedActivities: [], energyUsedToday: 0 }),

      resolvePendingEvent: (choiceId) => {
        const { hero, pendingEvent, currentDayEvents, runXpTotal, lastDayResults } = get();
        if (hero === null || pendingEvent === null) {
          return;
        }

        const def = DAILY_EVENTS[pendingEvent.eventId];
        const choice = def.choices.find((item) => item.id === choiceId);
        if (choice === undefined) {
          return;
        }

        const heroAfterEffects = applyEventEffects(hero, choice.effects);
        const xpGained = choice.xpGain ?? 0;
        const goldGained = choice.goldGain ?? 0;
        const heroAfterXp = applyXp(
          {
            ...heroAfterEffects,
            gold: heroAfterEffects.gold + goldGained,
          },
          xpGained,
        );

        const resolvedEvent: ResolvedDailyEvent = {
          eventId: pendingEvent.eventId,
          choiceId: choice.id,
          xpGained,
          goldGained,
          appliedEffects: choice.effects,
        };

        const updatedDayResult = lastDayResults !== null
          ? {
              ...lastDayResults,
              eventsResolved: [...lastDayResults.eventsResolved, resolvedEvent],
              totalXp: lastDayResults.totalXp + xpGained,
              totalGold: lastDayResults.totalGold + goldGained,
            }
          : null;

        set({
          hero: heroAfterXp,
          pendingEvent: null,
          currentDayEvents: [...currentDayEvents, resolvedEvent],
          lastDayResults: updatedDayResult,
          runXpTotal: runXpTotal + xpGained,
          screen: "day_results",
        });
      },

      dismissPendingEvent: () => {
        set({ pendingEvent: null, screen: "day_results" });
      },

      endDay: () => {
        const { hero, meta, plannedActivities, runXpTotal, defeatedRaidsThisRun, directEnergySpentToday, todayTransactions } = get();
        if (hero === null) {
          return;
        }

        let currentHero = hero;
        let nextRunXp = runXpTotal;
        let nextDefeatedRaids = defeatedRaidsThisRun;
        const resolvedActivities: ResolvedActivity[] = [];

        for (const activityId of plannedActivities) {
          const def = ACTIVITIES[activityId];
          if (!isActivityUnlocked(currentHero, def, meta)) {
            continue;
          }
          if (currentHero.gold < (def.goldCost ?? 0)) {
            continue;
          }

          const { resolved, updatedHero } = resolveActivity(currentHero, activityId, meta);
          const leveledHero = applyXp(updatedHero, resolved.xpGained);
          resolvedActivities.push(resolved);
          nextRunXp += resolved.xpGained;
          const defeatedBoss = !resolved.died ? bossForRaidActivity(activityId) : null;
          if (defeatedBoss !== null && !nextDefeatedRaids.includes(defeatedBoss)) {
            nextDefeatedRaids = [...nextDefeatedRaids, defeatedBoss];
          }

          if (resolved.died) {
            const dayResult: DayResult = {
              day: hero.inGameDay,
              activitiesResolved: resolvedActivities,
              eventsResolved: [],
              totalXp: resolvedActivities.reduce((sum, item) => sum + item.xpGained, 0),
              totalGold: resolvedActivities.reduce((sum, item) => sum + item.goldGained - item.goldSpent, 0),
              totalGoldSpent: resolvedActivities.reduce((sum, item) => sum + item.goldSpent, 0),
              lootObtained: resolvedActivities.flatMap((item) => item.lootDropped),
              heroSurvived: false,
              deathCause: "combat",
              triangleSnapshot: leveledHero.triangle,
              renownSnapshot: leveledHero.renown,
              transactions: todayTransactions,
            };
            finalizeDeath("combat", leveledHero, nextRunXp, nextDefeatedRaids, dayResult, set, get, resolved);
            return;
          }

          currentHero = {
            ...leveledHero,
            completedActivitiesToday: [...currentHero.completedActivitiesToday, activityId],
          };
        }

        let deathCause: "combat" | "old_age" | null = null;
        if (currentHero.inGameDay >= OLD_AGE_START_DAY) {
          const oldAgeChance = OLD_AGE_DEATH_CHANCE_PER_DAY * (currentHero.inGameDay - OLD_AGE_START_DAY + 1);
          if (Math.random() < oldAgeChance) {
            deathCause = "old_age";
          }
        }

        const dayResult: DayResult = {
          day: currentHero.inGameDay,
          activitiesResolved: resolvedActivities,
          eventsResolved: [],
          totalXp: resolvedActivities.reduce((sum, item) => sum + item.xpGained, 0),
          totalGold: resolvedActivities.reduce((sum, item) => sum + item.goldGained - item.goldSpent, 0),
          totalGoldSpent: resolvedActivities.reduce((sum, item) => sum + item.goldSpent, 0),
          lootObtained: resolvedActivities.flatMap((item) => item.lootDropped),
          heroSurvived: deathCause === null,
          ...(deathCause !== null ? { deathCause } : {}),
          triangleSnapshot: currentHero.triangle,
          renownSnapshot: currentHero.renown,
          transactions: todayTransactions,
        };

        if (deathCause !== null) {
          finalizeDeath(deathCause, currentHero, nextRunXp, nextDefeatedRaids, dayResult, set, get);
          return;
        }

        const totalEnergySpent = plannedActivities.reduce((sum, id) => sum + ACTIVITIES[id].energyCost, 0) + directEnergySpentToday;
        const eventTriggered = shouldTriggerEvent(totalEnergySpent, meta.maxEnergy);
        const pendingEvent = eventTriggered ? rollDailyEvent(currentHero.inGameDay) : null;

        set({
          hero: {
            ...currentHero,
            inGameDay: currentHero.inGameDay + 1,
            completedActivitiesToday: [],
          },
          lastDayResults: dayResult,
          screen: pendingEvent !== null ? "daily_event" : "day_results",
          energyUsedToday: 0,
          directEnergySpentToday: 0,
          plannedActivities: [],
          currentDayActivities: pendingEvent !== null ? resolvedActivities : [],
          currentDayEvents: [],
          pendingEvent,
          todayTransactions: [],
          vendorRerollsUsedToday: 0,
          runXpTotal: nextRunXp,
          defeatedRaidsThisRun: nextDefeatedRaids,
        });
      },

      getActivityUnlockGaps: (activityId) => {
        const { hero } = get();
        const def = ACTIVITIES[activityId];
        if (hero === null || isActivityUnlocked(hero, def, get().meta)) {
          return [];
        }
        return getUnlockGapsForActivity(hero, def, get().meta);
      },

      getVendorOffers: (vendorId) => {
        const { hero, meta, vendorRerollsUsedToday } = get();
        if (hero === null) {
          return [];
        }
        const unlockedTier = meta.vendorTiersUnlocked[vendorId] ?? 0;
        return listVendorOffers(vendorId, hero.inGameDay + vendorRerollsUsedToday).filter((offer) => offer.tier <= unlockedTier);
      },

      getDailyRerollsRemaining: () => {
        const { meta, vendorRerollsUsedToday } = get();
        const allowance = meta.apUpgrades.includes("vendor_reroll_1") ? 1 : 0;
        return Math.max(0, allowance - vendorRerollsUsedToday);
      },

      rerollVendor: (vendorId) => {
        const { hero, vendorRerollsUsedToday } = get();
        if (hero === null) {
          return false;
        }
        if (get().getDailyRerollsRemaining() <= 0) {
          return false;
        }
        if (hero.gold < 10) {
          return false;
        }
        const nextHero = { ...hero, gold: hero.gold - 10 };
        set({
          hero: nextHero,
          vendorRerollsUsedToday: vendorRerollsUsedToday + 1,
          todayTransactions: [
            ...get().todayTransactions,
            { kind: "vendor_purchase", label: TX_REROLL_VENDOR(VENDOR_LABEL[vendorId]), goldSpent: 10 },
          ],
        });
        return true;
      },

      buyVendorOffer: (offer) => {
        const { hero, meta, directEnergySpentToday, todayTransactions } = get();
        if (hero === null) {
          return false;
        }
        const discountPct = meta.townspersonBonuses.vendorDiscountPct ?? 0;
        const goldCost = applyDiscount(offer.costs.gold ?? 0, discountPct);
        const materialCosts = offer.costs.materials ?? {};
        if (hero.gold < goldCost || !canAffordMaterials(hero.materials, materialCosts)) {
          return false;
        }
        if (offer.rewards.recipeUnlocks !== undefined) {
          const allKnown = offer.rewards.recipeUnlocks.every((id) => hero.knownRecipes.includes(id));
          if (allKnown) {
            return false;
          }
        }
        if (directEnergySpentToday + 1 > meta.maxEnergy) {
          return false;
        }
        let nextHero: Hero = {
          ...hero,
          gold: hero.gold - goldCost,
          materials: addMaterials(hero.materials, {}),
          knownRecipes: [...hero.knownRecipes],
        };
        if (Object.keys(materialCosts).length > 0) {
          const spend = Object.entries(materialCosts).reduce<Partial<Record<MaterialId, number>>>((acc, [id, amount]) => {
            acc[id as MaterialId] = -amount;
            return acc;
          }, {});
          nextHero = { ...nextHero, materials: addMaterials(nextHero.materials, spend) };
        }
        if (offer.rewards.materials !== undefined) {
          nextHero = { ...nextHero, materials: addMaterials(nextHero.materials, offer.rewards.materials) };
        }
        if (offer.rewards.recipeUnlocks !== undefined) {
          nextHero = { ...nextHero, knownRecipes: [...new Set([...nextHero.knownRecipes, ...offer.rewards.recipeUnlocks])] };
        }
        if (offer.rewards.fixedItemId !== undefined) {
          const fixedItem = GEAR_ITEMS[offer.rewards.fixedItemId];
          if (fixedItem !== undefined) {
            const current = nextHero.gear[fixedItem.slot];
            if (current === null || sumGearStats(fixedItem) > sumGearStats(current)) {
              nextHero = { ...nextHero, gear: { ...nextHero.gear, [fixedItem.slot]: fixedItem } };
            }
          }
        }
        set({
          hero: nextHero,
          directEnergySpentToday: directEnergySpentToday + 1,
          todayTransactions: [
            ...todayTransactions,
            {
              kind: "vendor_purchase",
              label: TX_BUY_OFFER(offer.name),
              energySpent: 1,
              goldSpent: goldCost,
              materialsDelta: {
                ...Object.entries(materialCosts).reduce<Partial<Record<MaterialId, number>>>((acc, [id, amount]) => {
                  acc[id as MaterialId] = -amount;
                  return acc;
                }, {}),
                ...(offer.rewards.materials ?? {}),
              },
            },
          ],
        });
        return true;
      },

      craftRecipe: (recipeId) => {
        const { hero, meta, directEnergySpentToday, todayTransactions } = get();
        if (hero === null) {
          return false;
        }
        const recipe = RECIPE_DEFINITIONS[recipeId];
        if (recipe.requiresKnownRecipe === true && !hero.knownRecipes.includes(recipeId)) {
          return false;
        }
        const goldCost = applyDiscount(recipe.goldCost, (meta.townspersonBonuses.recipeDiscountPct ?? 0) + meta.craftingEfficiency);
        if (hero.gold < goldCost) {
          return false;
        }
        if (!canAffordMaterials(hero.materials, recipe.materialsCost)) {
          return false;
        }
        if (directEnergySpentToday + recipe.energyCost > meta.maxEnergy) {
          return false;
        }
        const costDelta = Object.entries(recipe.materialsCost).reduce<Partial<Record<MaterialId, number>>>((acc, [id, amount]) => {
          acc[id as MaterialId] = -amount;
          return acc;
        }, {});
        const currentInSlot = hero.gear[recipe.slot];
        const generated = generateGear(hero.heroClass, recipe.slot, recipe.rarity, hero.level, hero.gear);
        const bonusPct = meta.townspersonBonuses.purpleCraftStatBonusPct ?? 0;
        let upgradedItem = generated;
        if (recipe.rarity === "purple" && bonusPct > 0) {
          upgradedItem = { ...generated, power: Math.round(generated.power * (1 + bonusPct)) };
        }
        const shouldEquip = currentInSlot === null || sumGearStats(upgradedItem) > sumGearStats(currentInSlot);
        set({
          hero: {
            ...hero,
            gold: hero.gold - goldCost,
            materials: addMaterials(hero.materials, costDelta),
            gear: shouldEquip ? { ...hero.gear, [recipe.slot]: upgradedItem } : hero.gear,
          },
          directEnergySpentToday: directEnergySpentToday + recipe.energyCost,
          todayTransactions: [
            ...todayTransactions,
            {
              kind: "craft",
              label: TX_CRAFT(RARITY_KR[recipe.rarity], SLOT_SHORT_KR[recipe.slot]),
              energySpent: recipe.energyCost,
              goldSpent: goldCost,
              materialsDelta: costDelta,
            },
          ],
        });
        return true;
      },

      spendAP: (upgradeId) => {
        const { meta } = get();
        const upgrade = AP_UPGRADES.find((u) => u.id === upgradeId);
        if (upgrade === undefined) {
          return;
        }
        const purchaseCount = meta.apUpgrades.filter((id) => id === upgradeId).length;
        if (purchaseCount >= upgrade.maxPurchases) {
          return;
        }
        if (meta.achievementPoints < upgrade.cost) {
          return;
        }

        const newUpgrades = [...meta.apUpgrades, upgradeId as MetaProgression["apUpgrades"][number]];
        const energyBonus = newUpgrades.filter((id) => id === "energy_10").length * 10;
        const stackedBonuses = stackTownspersonBonuses(meta.townspeople);
        const newMaxEnergy = BASE_ENERGY + stackedBonuses.energyBonus + energyBonus;

        set({
          meta: {
            ...meta,
            achievementPoints: meta.achievementPoints - upgrade.cost,
            apUpgrades: newUpgrades,
            maxEnergy: newMaxEnergy,
          },
        });
      },

      resetRun: () => {
        set({
          screen: "main_menu",
          hero: null,
          energyUsedToday: 0,
          directEnergySpentToday: 0,
          plannedActivities: [],
          currentDayActivities: [],
          currentDayEvents: [],
          pendingEvent: null,
          lastDayResults: null,
          deathSummary: null,
          defeatedRaidsThisRun: [],
          todayTransactions: [],
          vendorRerollsUsedToday: 0,
        });
      },
    }),
    {
      name: "nanoraider-save",
      version: GAMESTORE_VERSION,
      partialize: (state) => ({ meta: state.meta }),
      migrate: (persistedState, version) => {
        if (version < GAMESTORE_VERSION) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("nanoraider-save");
          }
          return { meta: buildInitialMeta() };
        }
        const state = persistedState as { meta?: MetaProgression };
        if (state.meta === undefined) {
          return state;
        }
        const normalizedBank = normalizeBossReadinessBank(state.meta.bossReadinessBank, TRACKED_BOSSES);
        return {
          ...state,
          meta: {
            ...buildInitialMeta(),
            ...state.meta,
            bossReadinessBank: normalizedBank,
            vendorTiersUnlocked: {
              ...baseVendorTierUnlocks(),
              ...state.meta.vendorTiersUnlocked,
            },
            knownRecipes: Array.from(new Set([...state.meta.knownRecipes, ...defaultKnownRecipes()])),
            craftingEfficiency: state.meta.craftingEfficiency,
            salvageYieldBonus: state.meta.salvageYieldBonus,
          },
        };
      },
    },
  ),
);

function finalizeDeath(
  cause: "combat" | "old_age",
  hero: Hero,
  runXpTotal: number,
  defeatedRaids: BossId[],
  dayResult: DayResult,
  set: (state: Partial<GameState>) => void,
  get: () => GameState,
  fatalActivity?: ResolvedActivity,
) {
  const { meta } = get();
  const { unlocked, whyUnlocked, almostUnlocked, almostReason } = checkTownspersonOnDeath(hero, meta, defeatedRaids);

  const apGained = AP_PER_RUN + Math.floor(hero.level / 5) * 10;

  const heroSnapshot: FilledTownsperson["hero"] = {
    heroName: hero.name,
    triangle: hero.triangle,
    renown: hero.renown,
    daring: hero.daring,
    level: hero.level,
    defeatedRaids,
    dayReached: hero.inGameDay,
  };

  const newTownspeople: FilledTownsperson[] =
    unlocked !== null
      ? [
          ...meta.townspeople,
          { roleId: unlocked, hero: heroSnapshot, unlockedAtRun: meta.totalRuns + 1 },
        ]
      : meta.townspeople;

  const stackedBonuses = stackTownspersonBonuses(newTownspeople);
  const apEnergyBonus = meta.apUpgrades.filter((id) => id === "energy_10").length * 10;
  const newMaxEnergy = BASE_ENERGY + stackedBonuses.energyBonus + apEnergyBonus;

  const normalizedReadinessBank = normalizeBossReadinessBank(meta.bossReadinessBank, TRACKED_BOSSES);
  const updatedReadinessBank: MetaProgression["bossReadinessBank"] = { ...normalizedReadinessBank };
  for (const [boss, value] of Object.entries(hero.bossReadiness)) {
    const bossId = boss as BossId;
    const previous = updatedReadinessBank[bossId] ?? 0;
    updatedReadinessBank[bossId] = Math.max(previous, value);
  }

  const newMeta: MetaProgression = {
    ...meta,
    totalRuns: meta.totalRuns + 1,
    raidDeaths:
      meta.raidDeaths
      + (cause === "combat" && fatalActivity !== undefined && isLethalActivity(fatalActivity.activityId) ? 1 : 0),
    maxEnergy: newMaxEnergy,
    achievementPoints: meta.achievementPoints + apGained,
    townspeople: newTownspeople,
    townspersonBonuses: stackedBonuses,
    bossReadinessBank: updatedReadinessBank,
    knownRecipes: Array.from(new Set([...meta.knownRecipes, ...hero.knownRecipes])),
    vendorTiersUnlocked: {
      ...meta.vendorTiersUnlocked,
      quartermaster: clampVendorTier(Math.max(1, meta.vendorTiersUnlocked.quartermaster ?? 1)),
      artisan: clampVendorTier(Math.max(1, meta.vendorTiersUnlocked.artisan ?? 1)),
      broker: clampVendorTier(Math.max(meta.vendorTiersUnlocked.broker ?? 1, stackedBonuses.brokerTierStart)),
      ...(stackedBonuses.raidProvisionerUnlocked ? { raid_provisioner: 1 as const } : {}),
    },
    craftingEfficiency: Math.min(0.2, Math.max(meta.craftingEfficiency, stackedBonuses.recipeDiscountPct)),
    salvageYieldBonus: Math.min(2, Math.max(meta.salvageYieldBonus, stackedBonuses.vendorDiscountPct * 10)),
  };

  const deathSummary: DeathSummary = {
    heroName: hero.name,
    level: hero.level,
    inGameDay: hero.inGameDay,
    gold: hero.gold,
    cause,
    totalXpGained: runXpTotal,
    townspersonUnlocked: unlocked,
    heroSurvived: unlocked !== null,
    whyUnlocked,
    almostUnlocked,
    almostReason,
    energyBonusGranted: 0,
    apGranted: apGained,
    triangleSnapshot: hero.triangle,
    renownSnapshot: hero.renown,
    daringSnapshot: hero.daring,
    bossReadinessSnapshot: hero.bossReadiness,
    defeatedRaids,
    fatalActivityId: cause === "combat" ? (fatalActivity?.activityId ?? null) : null,
    fatalActivityRisk: cause === "combat" ? (fatalActivity?.effectiveDeathRisk ?? null) : null,
    fatalRiskBand: cause === "combat" ? (fatalActivity?.riskBand ?? null) : null,
    fatalRiskHints: cause === "combat" ? (fatalActivity?.riskHints ?? []) : [],
  };

  set({
    hero: null,
    meta: newMeta,
    lastDayResults: dayResult,
    deathSummary,
    screen: "death",
    energyUsedToday: 0,
    directEnergySpentToday: 0,
    plannedActivities: [],
    currentDayActivities: [],
    currentDayEvents: [],
    pendingEvent: null,
    defeatedRaidsThisRun: defeatedRaids,
    todayTransactions: [],
    vendorRerollsUsedToday: 0,
  });
}
