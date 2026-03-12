import { ACTIVITIES, ACTIVITY_LIST } from "../../data/activities";
import { MATERIAL_LABELS, RECIPE_DEFINITIONS } from "../../data/crafting";
import { TOWNSPEOPLE } from "../../data/townspeople";
import { RARITY_LABELS } from "../../data/rarity";
import type { ActivityDefinition, GearSlot, MaterialId, RecipeId, RiskBand, VendorId } from "../../data/types";
import { useGameStore } from "../../store/gameStore";
import { buildActivityBlockedReasons, buildRiskHints, computeActivityRisk, isActivityUnlocked } from "../../game/activityResolver";
import { getTopTownspersonRecommendations } from "../../game/townspersonChecker";
import { isLethalActivity } from "../../game/activityMeta";
import { HeroStatus } from "../HeroStatus";
import { useMemo, useState } from "react";

const CATEGORY_COLORS: Record<ActivityDefinition["category"], string> = {
  combat: "border-red-800 bg-red-950",
  economic: "border-yellow-800 bg-yellow-950",
  knowledge: "border-blue-800 bg-blue-950",
  social: "border-indigo-800 bg-indigo-950",
  general: "border-gray-700 bg-gray-900",
};

const CATEGORY_BADGE: Record<ActivityDefinition["category"], string> = {
  combat: "bg-red-800 text-red-200",
  economic: "bg-yellow-800 text-yellow-200",
  knowledge: "bg-blue-800 text-blue-200",
  social: "bg-indigo-800 text-indigo-200",
  general: "bg-gray-700 text-gray-300",
};

const RISK_STYLES: Record<RiskBand, string> = {
  safe: "text-green-400",
  manageable: "text-yellow-400",
  dangerous: "text-orange-400",
  lethal: "text-red-400",
};

const VENDOR_LABELS: Record<VendorId, string> = {
  quartermaster: "Quartermaster",
  artisan: "Artisan",
  broker: "Broker",
  raid_provisioner: "Raid Provisioner",
};

type ForgeTier = "green" | "blue" | "purple";

const FORGE_TIERS: ForgeTier[] = ["green", "blue", "purple"];

const FORGE_TIER_LABELS: Record<ForgeTier, string> = {
  green: `${RARITY_LABELS.green} Forge`,
  blue: `${RARITY_LABELS.blue} Forge`,
  purple: `${RARITY_LABELS.purple} Forge`,
};

const FORGE_SLOT_ORDER: GearSlot[] = ["head", "chest", "legs", "mainhand", "offhand"];

const FORGE_SLOT_LABELS: Record<GearSlot, string> = {
  head: "Head",
  chest: "Chest",
  legs: "Legs",
  mainhand: "Main Hand",
  offhand: "Off-hand",
};

const FORGE_RECIPES_BY_TIER: Record<ForgeTier, Record<GearSlot, RecipeId>> = {
  green: {
    head: "reforge_green_head",
    chest: "reforge_green_chest",
    legs: "reforge_green_legs",
    mainhand: "reforge_green_mainhand",
    offhand: "reforge_green_offhand",
  },
  blue: {
    head: "craft_blue_head",
    chest: "craft_blue_chest",
    legs: "craft_blue_legs",
    mainhand: "craft_blue_mainhand",
    offhand: "craft_blue_offhand",
  },
  purple: {
    head: "upgrade_purple_head",
    chest: "upgrade_purple_chest",
    legs: "upgrade_purple_legs",
    mainhand: "upgrade_purple_mainhand",
    offhand: "upgrade_purple_offhand",
  },
};

function formatDetailTooltip(def: ActivityDefinition, includeCoreStats: boolean): string | null {
  const detailLines: string[] = [];
  if (includeCoreStats && def.effects.triangle !== undefined) {
    for (const [k, v] of Object.entries(def.effects.triangle)) {
      if (v !== 0) {
        detailLines.push(`${v > 0 ? "+" : ""}${v} ${k}`);
      }
    }
  }
  if (def.effects.renown !== undefined && def.effects.renown !== 0) {
    detailLines.push(`renown ${def.effects.renown > 0 ? "+" : ""}${def.effects.renown}`);
  }
  if (def.effects.daring !== undefined && def.effects.daring !== 0) {
    detailLines.push(`daring ${def.effects.daring > 0 ? "+" : ""}${def.effects.daring}`);
  }
  if (def.effects.bossReadiness !== undefined) {
    for (const [k, v] of Object.entries(def.effects.bossReadiness)) {
      if (v !== 0) {
        detailLines.push(`${k} readiness ${v > 0 ? "+" : ""}${String(v)}%`);
      }
    }
  }
  return detailLines.length > 0 ? detailLines.join("\n") : null;
}

function ActivityCard({
  def,
  canUse,
  blockedReasons,
  planLabel,
  effectiveDeathRisk,
  riskBand,
  riskHints,
  onExecute,
}: {
  def: ActivityDefinition;
  canUse: boolean;
  blockedReasons: string[];
  planLabel: string;
  effectiveDeathRisk: number;
  riskBand: RiskBand;
  riskHints: string[];
  onExecute: () => void;
}) {
  const colorBorder = CATEGORY_COLORS[def.category];
  const badge = CATEGORY_BADGE[def.category];
  const isDungeon = def.id.startsWith("dungeon_");
  const isLethal = isLethalActivity(def.id);
  const detailTooltip = formatDetailTooltip(def, true);

  return (
    <div className={`border rounded-lg p-3 flex flex-col gap-2 ${colorBorder} ${!canUse ? "opacity-55" : ""}`}>
      <div className="flex items-start justify-between gap-1">
        <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${badge}`}>{def.category}</span>
        {def.deathRisk > 0 ? (
          <span className={`text-xs ${RISK_STYLES[riskBand]}`}>
            {isLethal ? "☠️" : ""} {Math.round(effectiveDeathRisk * 100)}% {isLethal ? `death` : "failure"}
          </span>
        ) : null}
      </div>
      <div className="flex-1">
        <div className="text-white font-bold text-sm leading-tight">{def.name}</div>
        <p className="text-gray-500 text-xs mt-0.5 leading-tight mb-4">{def.description} {detailTooltip !== null && (
            <span
              className="text-[10px] py-0.5 rounded border border-gray-700 text-gray-400 cursor-help"
              title={detailTooltip}
            >
              (i)
            </span>
          )}</p>
        {isDungeon && def.levelRange !== undefined ? (
          <p className="text-[10px] text-gray-400 mt-1">Lv {def.levelRange.min}-{def.levelRange.max}</p>
        ) : null}
        {!canUse && blockedReasons.length > 0 && (
          <p className="text-red-300 text-[10px] mt-2">Needs: {blockedReasons.join(", ")}</p>
        )}
        {def.deathRisk > 0 && riskHints.length > 0 && (
          <p className="text-gray-400 text-[10px] mt-2">{riskHints.join(" • ")}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 text-xs text-gray-400">
          <span className="text-yellow-400 font-bold">⚡{def.energyCost}</span>
          {(def.goldCost ?? 0) > 0 && <span className="text-red-300 font-bold">-◈{def.goldCost}g</span>}
          <span>⏱{def.durationHours}h</span>
        </div>
        <button
          className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-xs px-2.5 py-1 rounded transition-colors shrink-0"
          disabled={!canUse}
          onClick={onExecute}
        >
          {planLabel}
        </button>
      </div>
    </div>
  );
}

export function PlanningScreen() {
  const {
    hero,
    meta,
    energyUsedToday,
    plannedActivities,
    planActivity,
    unplanActivity,
    clearPlan,
    endDay,
    goTo,
    renameHero,
    directEnergySpentToday,
    getVendorOffers,
    buyVendorOffer,
    craftRecipe,
    rerollVendor,
    getDailyRerollsRemaining,
  } = useGameStore();
  const [vendorTab, setVendorTab] = useState<VendorId>("quartermaster");
  type VendorsForgeTab = "vendors" | "forge";
  const [vendorsForgeTab, setVendorsForgeTab] = useState<VendorsForgeTab | null>(null);
  const [forgeTier, setForgeTier] = useState<ForgeTier>("green");
  const [selectedForgeSlot, setSelectedForgeSlot] = useState<GearSlot>("head");
  const availableActivities = useMemo(
    () => hero !== null ? ACTIVITY_LIST.filter((def) => isActivityUnlocked(hero, def, meta)) : null,
    [hero, meta],
  );
  const townspersonRecommendations = useMemo(
    () => (hero !== null ? getTopTownspersonRecommendations(hero, meta, [], 3) : []),
    [hero, meta],
  );

  if (availableActivities === null || hero === null) {
    return null;
  }

  const plannedGoldSpend = plannedActivities.reduce((sum, id) => sum + (ACTIVITIES[id].goldCost ?? 0), 0);
  const goldRemaining = hero.gold - plannedGoldSpend;
  const totalEnergyUsed = energyUsedToday + directEnergySpentToday;
  const energyRemaining = meta.maxEnergy - totalEnergyUsed;
  const selectedRecipe = FORGE_RECIPES_BY_TIER[forgeTier][selectedForgeSlot];
  const recipe = RECIPE_DEFINITIONS[selectedRecipe];
  const vendorOffers = getVendorOffers(vendorTab);
  const rerollsRemaining = getDailyRerollsRemaining();
  const discountedRecipeGold = Math.max(0, Math.round(recipe.goldCost * (1 - (meta.townspersonBonuses.recipeDiscountPct ?? 0) - meta.craftingEfficiency)));
  const hasKnownRecipe = recipe.requiresKnownRecipe !== true || hero.knownRecipes.includes(selectedRecipe);
  const materialChecks = (Object.keys(recipe.materialsCost) as MaterialId[]).map((id) => {
    const required = recipe.materialsCost[id] ?? 0;
    const owned = hero.materials[id] ?? 0;
    return { id, required, owned, hasEnough: owned >= required };
  });
  const canCraftRecipe = hasKnownRecipe
    && energyRemaining >= recipe.energyCost
    && goldRemaining >= discountedRecipeGold
    && materialChecks.every(({ hasEnough }) => hasEnough);
  const hasRerollUpgrade = meta.apUpgrades.includes("vendor_reroll_1");
  const canUseReroll = hasRerollUpgrade && rerollsRemaining > 0 && goldRemaining >= 10;
  const rerollLabel = !hasRerollUpgrade
    ? "Reroll (requires AP upgrade)"
    : rerollsRemaining <= 0
      ? "Reroll used today"
      : goldRemaining < 10
        ? "Need 10g to reroll"
        : "Reroll Current Vendor (10g)";

  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto">
      {/* Evolution recommendations - top of page */}
      {townspersonRecommendations.length > 0 && (
        <div className="bg-gray-800/80 border border-cyan-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-cyan-200 text-xs font-bold uppercase tracking-widest">Outpost Targets</h3>
            <button
              className="text-gray-400 hover:text-gray-200 text-sm"
              onClick={() => { goTo("collection"); }}
            >
              🏠 Outpost
            </button>
          </div>
          <p className="text-gray-400 text-xs mb-3">Roles to aim for this run</p>
          <div className="flex gap-3 flex-wrap">
            {townspersonRecommendations.map((rec) => {
              const role = TOWNSPEOPLE[rec.roleId];
              return (
                <div className="bg-gray-900 border border-gray-600 rounded p-3 text-sm flex-1 min-w-[180px] min-h-[80px]" key={rec.roleId}>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">{role.name}</span>
                  </div>
                  <p className="text-gray-300 text-xs mt-2 leading-relaxed">{rec.gapSummary}</p>
                  <p className="text-amber-400/90 text-xs mt-1 italic leading-relaxed">{rec.hint}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-yellow-400 font-bold text-lg">Day {hero.inGameDay} Planning</h2>
        {townspersonRecommendations.length === 0 && (
          <button
            className="text-gray-400 hover:text-gray-200 text-sm"
            onClick={() => { goTo("collection"); }}
          >
            🏠 Outpost
          </button>
        )}
      </div>

      {/* Hero status */}
      <HeroStatus
        energyUsedToday={totalEnergyUsed}
        hero={hero}
        maxEnergy={meta.maxEnergy}
        onRename={renameHero}
      />

      <div className="flex gap-2">
        <button
          className={`flex-1 font-bold py-2 rounded text-sm border ${vendorsForgeTab === "vendors" ? "bg-gray-700 border-gray-500 text-white" : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200"}`}
          onClick={() => { setVendorsForgeTab((prev) => (prev === "vendors" ? null : "vendors")); }}
        >
          Visit Vendors
        </button>
        <button
          className={`flex-1 font-bold py-2 rounded text-sm border ${vendorsForgeTab === "forge" ? "bg-gray-700 border-gray-500 text-white" : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200"}`}
          onClick={() => { setVendorsForgeTab((prev) => (prev === "forge" ? null : "forge")); }}
        >
          Forge / Upgrade
        </button>
      </div>

      {vendorsForgeTab === "vendors" ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">Vendors</h3>
            <span className="text-xs text-gray-400">Rerolls: {rerollsRemaining}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(VENDOR_LABELS) as VendorId[]).map((id) => (
              <button
                className={`text-xs px-2 py-1 rounded border ${vendorTab === id ? "bg-gray-700 border-gray-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}
                key={id}
                onClick={() => { setVendorTab(id); }}
                type="button"
              >
                {VENDOR_LABELS[id]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {vendorOffers.length === 0 && <div className="text-xs text-gray-500">No offers unlocked for this vendor yet.</div>}
            {vendorOffers.map((offer) => {
              const goldCost = Math.max(0, Math.round((offer.costs.gold ?? 0) * (1 - (meta.townspersonBonuses.vendorDiscountPct ?? 0))));
              const materialCostParts = Object.entries(offer.costs.materials ?? {}).map(([id, amount]) => `${amount} ${MATERIAL_LABELS[id as keyof typeof MATERIAL_LABELS]}`);
              const hasMaterials = Object.entries(offer.costs.materials ?? {}).every(([id, amount]) => (hero.materials[id as keyof typeof hero.materials] ?? 0) >= amount);
              const canBuy = goldRemaining >= goldCost && hasMaterials && energyRemaining >= 1;
              return (
                <div className="bg-gray-800 border border-gray-700 rounded p-2" key={offer.id}>
                  <div className="text-sm text-white font-bold">{offer.name}</div>
                  <div className="text-xs text-gray-400">{offer.description}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    Cost: {goldCost}g{materialCostParts.length > 0 ? ` + ${materialCostParts.join(", ")}` : ""}
                  </div>
                  <button
                    className="mt-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black text-xs font-bold px-2 py-1 rounded"
                    disabled={!canBuy}
                    onClick={() => { buyVendorOffer(offer); }}
                    type="button"
                  >
                    {canBuy ? "Buy" : "Need more gold"}
                  </button>
                </div>
              );
            })}
          </div>
          <button
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded disabled:text-gray-600"
            disabled={!canUseReroll}
            onClick={() => { rerollVendor(vendorTab); }}
            type="button"
          >
            {rerollLabel}
          </button>
        </div>
      ) : null}

      {vendorsForgeTab === "forge" ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">Forge / Upgrade</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FORGE_TIERS.map((tier) => (
              <button
                className={`text-xs px-2 py-1 rounded border ${forgeTier === tier ? "bg-gray-700 border-gray-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}
                key={tier}
                onClick={() => { setForgeTier(tier); }}
                type="button"
              >
                {FORGE_TIER_LABELS[tier]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FORGE_SLOT_ORDER.map((slot) => {
              const slotRecipeId = FORGE_RECIPES_BY_TIER[forgeTier][slot];
              const slotRecipe = RECIPE_DEFINITIONS[slotRecipeId];
              const slotGold = Math.max(0, Math.round(slotRecipe.goldCost * (1 - (meta.townspersonBonuses.recipeDiscountPct ?? 0) - meta.craftingEfficiency)));
              const slotKnown = slotRecipe.requiresKnownRecipe !== true || hero.knownRecipes.includes(slotRecipeId);
              const slotMaterialChecks = (Object.keys(slotRecipe.materialsCost) as MaterialId[]).map((id) => ({
                id,
                required: slotRecipe.materialsCost[id] ?? 0,
                owned: hero.materials[id] ?? 0,
              }));
              const slotCanCraft = slotKnown
                && energyRemaining >= slotRecipe.energyCost
                && goldRemaining >= slotGold
                && slotMaterialChecks.every(({ required, owned }) => owned >= required);
              return (
                <button
                  className={`rounded border p-2 text-left ${selectedForgeSlot === slot ? "border-yellow-500 bg-gray-800" : "border-gray-700 bg-gray-900 hover:bg-gray-800"}`}
                  key={slot}
                  onClick={() => { setSelectedForgeSlot(slot); }}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-100">{FORGE_SLOT_LABELS[slot]}</span>
                    {slotKnown ? (
                      <span className={`text-[10px] font-bold ${slotCanCraft ? "text-green-400" : "text-gray-400"}`}>{slotCanCraft ? "Ready" : "Blocked"}</span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-400">Locked</span>
                    )}
                  </div>
                  {!slotKnown ? (
                    <div className="text-[11px] text-orange-300 mt-1">Recipe unknown · Artisan vendor</div>
                  ) : (
                    <>
                      <div className="text-[11px] text-gray-300 mt-1">⚡{slotRecipe.energyCost} · {slotGold}g</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {slotMaterialChecks.map(({ id, required }) => `${required} ${MATERIAL_LABELS[id]}`).join(", ")}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
            <div className="text-sm font-bold text-gray-100">
              {FORGE_SLOT_LABELS[selectedForgeSlot]} · {FORGE_TIER_LABELS[forgeTier]}
            </div>
            <div className="text-xs text-gray-400">Recipe: {selectedRecipe}</div>

            {!hasKnownRecipe ? (
              <div className="space-y-2">
                <div className="text-xs text-orange-300">
                  Recipe not learned. Visit the Artisan vendor to purchase the blueprint first.
                </div>
                <button
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 text-xs font-bold px-2 py-1 rounded"
                  onClick={() => {
                    setVendorsForgeTab("vendors");
                    setVendorTab("artisan");
                  }}
                  type="button"
                >
                  Open Artisan Vendor
                </button>
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-300">
                  Energy {recipe.energyCost} · Gold {discountedRecipeGold} · Materials {materialChecks.map(({ id, required }) => `${required} ${MATERIAL_LABELS[id]}`).join(", ")}
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div className={energyRemaining >= recipe.energyCost ? "text-green-400" : "text-red-300"}>
                    Energy: {energyRemaining}/{recipe.energyCost}
                  </div>
                  <div className={goldRemaining >= discountedRecipeGold ? "text-green-400" : "text-red-300"}>
                    Gold: {goldRemaining}/{discountedRecipeGold}
                  </div>
                  {materialChecks.map(({ id, required, owned, hasEnough }) => (
                    <div className={hasEnough ? "text-green-400" : "text-red-300"} key={id}>
                      {MATERIAL_LABELS[id]}: {owned}/{required}
                    </div>
                  ))}
                </div>
                <button
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black text-xs font-bold px-2 py-1 rounded"
                  disabled={!canCraftRecipe}
                  onClick={() => { craftRecipe(selectedRecipe); }}
                  type="button"
                >
                  {canCraftRecipe ? "Confirm Craft" : "Missing requirements"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Available activities */}
      <div className="space-y-2">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Available Activities</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {availableActivities.map((def) => {
            const previewRisk = computeActivityRisk(hero, def.id, meta);
            const completedCount = hero.completedActivitiesToday.filter((id) => id === def.id).length;
            const plannedCount = plannedActivities.filter((id) => id === def.id).length;
            const totalCount = completedCount + plannedCount;
            const hasDailyCap = typeof def.maxDailyUses === "number";
            const maxDailyUses = def.maxDailyUses ?? Number.POSITIVE_INFINITY;
            const withinDailyLimit = totalCount < maxDailyUses;
            const dailyLimitLabel = hasDailyCap && totalCount > 0 && def.maxDailyUses !== undefined
              ? `${Math.min(totalCount, maxDailyUses)}/${def.maxDailyUses}`
              : hasDailyCap
                ? "Plan"
                : "+ Plan";

            const canUse =
              energyRemaining >= def.energyCost
              && goldRemaining >= (def.goldCost ?? 0)
              && isActivityUnlocked(hero, def, meta)
              && withinDailyLimit;

            const blockedReasons = buildActivityBlockedReasons(
              hero,
              def,
              meta,
              energyRemaining,
              goldRemaining,
              totalCount,
            );

            return (
              <ActivityCard
                blockedReasons={blockedReasons}
                canUse={canUse}
                def={def}
                effectiveDeathRisk={previewRisk.finalRisk}
                key={def.id}
                onExecute={() => { planActivity(def.id); }}
                planLabel={dailyLimitLabel}
                riskBand={previewRisk.riskBand}
                riskHints={buildRiskHints(def, previewRisk)}
              />
            );
          })}
        </div>
      </div>

      {/* Planned queue */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Planned Activities</h3>
          {plannedActivities.length > 0 && (
            <button
              className="text-xs text-gray-400 hover:text-gray-200"
              onClick={clearPlan}
            >
              Clear plan
            </button>
          )}
        </div>
        {plannedActivities.length === 0 ? (
          <p className="text-gray-500 text-sm">No activities planned yet.</p>
        ) : (
          <div className="space-y-2">
            {plannedActivities.map((activityId, index) => {
              const def = ACTIVITIES[activityId];
              return (
                <div className="flex items-center justify-between bg-gray-800 rounded p-2" key={`${activityId}-${index}`}>
                  <div>
                    <div className="text-sm text-gray-200">{index + 1}. {def.name}</div>
                    <div className="text-[11px] text-gray-400">
                      ⚡{def.energyCost}{" "}
                      {(def.goldCost ?? 0) > 0 ? <span className="text-red-300">· -◈{def.goldCost}g</span> : ""}
                    </div>
                  </div>
                  <button
                    className="text-xs text-red-300 hover:text-red-200"
                    onClick={() => { unplanActivity(index); }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day controls */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Current Day</h3>
          <span className={`font-bold text-sm ${energyRemaining > 0 ? "text-yellow-400" : "text-red-400"}`}>
            ⚡ {energyRemaining} remaining
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          Planned actions: {plannedActivities.length}
        </div>

        {hero.inGameDay >= 10 && (
          <div className="text-orange-400 text-xs text-center">
            ⚠ Day {hero.inGameDay}: Old age approaches. Death risk rises each day.
          </div>
        )}

        <div className="border-t border-gray-700 pt-3 flex gap-2">
          <button
            className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded transition-colors"
            onClick={endDay}
          >
            End Day / Resolve Plan
          </button>
        </div>
      </div>
    </div>
  );
}
