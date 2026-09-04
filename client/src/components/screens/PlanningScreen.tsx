import { ACTIVITIES, ACTIVITY_LIST } from "../../data/activities";
import { MATERIAL_LABELS, RECIPE_DEFINITIONS } from "../../data/crafting";
import { TOWNSPEOPLE } from "../../data/townspeople";
import { RARITY_LABELS } from "../../data/rarity";
import type { ActivityDefinition, GearSlot, MaterialId, RecipeId, RiskBand, VendorId } from "../../data/types";
import { CATEGORY_LABELS, SLOT_LABELS } from "../../data/labels";
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
  quartermaster: "군수관",
  artisan: "장인",
  broker: "중개상",
  raid_provisioner: "레이드 보급병",
};

type ForgeTier = "green" | "blue" | "purple";

const FORGE_TIERS: ForgeTier[] = ["green", "blue", "purple"];

const FORGE_TIER_LABELS: Record<ForgeTier, string> = {
  green: `${RARITY_LABELS.green} 제련`,
  blue: `${RARITY_LABELS.blue} 제작`,
  purple: `${RARITY_LABELS.purple} 강화`,
};

const FORGE_SLOT_ORDER: GearSlot[] = ["head", "chest", "legs", "mainhand", "offhand"];

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

const TRIANGLE_LABEL_KR: Record<string, string> = {
  war: "전쟁",
  wit: "지혜",
  wealth: "부",
};

const BOSS_LABEL_KR: Record<string, string> = {
  molten_fury: "잿불격노",
  eternal_throne: "영원의 왕좌",
};

function formatDetailTooltip(def: ActivityDefinition, includeCoreStats: boolean): string | null {
  const detailLines: string[] = [];
  if (includeCoreStats && def.effects.triangle !== undefined) {
    for (const [k, v] of Object.entries(def.effects.triangle)) {
      if (v !== 0) {
        detailLines.push(`${v > 0 ? "+" : ""}${v} ${TRIANGLE_LABEL_KR[k] ?? k}`);
      }
    }
  }
  if (def.effects.renown !== undefined && def.effects.renown !== 0) {
    detailLines.push(`명성 ${def.effects.renown > 0 ? "+" : ""}${def.effects.renown}`);
  }
  if (def.effects.daring !== undefined && def.effects.daring !== 0) {
    detailLines.push(`대담함 ${def.effects.daring > 0 ? "+" : ""}${def.effects.daring}`);
  }
  if (def.effects.bossReadiness !== undefined) {
    for (const [k, v] of Object.entries(def.effects.bossReadiness)) {
      if (v !== 0) {
        detailLines.push(`${BOSS_LABEL_KR[k] ?? k} 준비도 ${v > 0 ? "+" : ""}${String(v)}%`);
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
        <span className={`text-xs px-1.5 py-0.5 rounded ${badge}`}>{CATEGORY_LABELS[def.category] ?? def.category}</span>
        {def.deathRisk > 0 ? (
          <span className={`text-xs ${RISK_STYLES[riskBand]}`}>
            {isLethal ? "☠️" : ""} {Math.round(effectiveDeathRisk * 100)}% {isLethal ? `사망` : "실패"}
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
          <p className="text-red-300 text-[10px] mt-2">필요: {blockedReasons.join(", ")}</p>
        )}
        {def.deathRisk > 0 && riskHints.length > 0 && (
          <p className="text-gray-400 text-[10px] mt-2">{riskHints.join(" • ")}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 text-xs text-gray-400">
          <span className="text-yellow-400 font-bold">⚡{def.energyCost}</span>
          {(def.goldCost ?? 0) > 0 && <span className="text-red-300 font-bold">-◈{def.goldCost}g</span>}
          <span>⏱{def.durationHours}시간</span>
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
    ? "리롤 (AP 업그레이드 필요)"
    : rerollsRemaining <= 0
      ? "오늘 리롤 사용 완료"
      : goldRemaining < 10
        ? "리롤에 10g 필요"
        : "현재 상인 리롤 (10g)";

  return (
    <div className="min-h-screen p-4 space-y-4 max-w-2xl mx-auto">
      {/* 진화 추천 - 페이지 상단 */}
      {townspersonRecommendations.length > 0 && (
        <div className="bg-gray-800/80 border border-cyan-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-cyan-200 text-xs font-bold uppercase tracking-widest">전초기지 목표</h3>
            <button
              className="text-gray-400 hover:text-gray-200 text-sm"
              onClick={() => { goTo("collection"); }}
            >
              🏠 전초기지
            </button>
          </div>
          <p className="text-gray-400 text-xs mb-3">이번 모험에서 노려볼 역할</p>
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

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-yellow-400 font-bold text-lg">{hero.inGameDay}일 차 계획</h2>
        {townspersonRecommendations.length === 0 && (
          <button
            className="text-gray-400 hover:text-gray-200 text-sm"
            onClick={() => { goTo("collection"); }}
          >
            🏠 전초기지
          </button>
        )}
      </div>

      {/* 영웅 상태 */}
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
          상인 방문
        </button>
        <button
          className={`flex-1 font-bold py-2 rounded text-sm border ${vendorsForgeTab === "forge" ? "bg-gray-700 border-gray-500 text-white" : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200"}`}
          onClick={() => { setVendorsForgeTab((prev) => (prev === "forge" ? null : "forge")); }}
        >
          제련 / 강화
        </button>
      </div>

      {vendorsForgeTab === "vendors" ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">상인</h3>
            <span className="text-xs text-gray-400">리롤: {rerollsRemaining}</span>
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
            {vendorOffers.length === 0 && <div className="text-xs text-gray-500">이 상인에게 아직 해금된 거래가 없습니다.</div>}
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
                    비용: {goldCost}g{materialCostParts.length > 0 ? ` + ${materialCostParts.join(", ")}` : ""}
                  </div>
                  <button
                    className="mt-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black text-xs font-bold px-2 py-1 rounded"
                    disabled={!canBuy}
                    onClick={() => { buyVendorOffer(offer); }}
                    type="button"
                  >
                    {canBuy ? "구매" : "골드 부족"}
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
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">제련 / 강화</h3>
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
                    <span className="text-sm font-bold text-gray-100">{(SLOT_LABELS as Record<string, string>)[slot] ?? slot}</span>
                    {slotKnown ? (
                      <span className={`text-[10px] font-bold ${slotCanCraft ? "text-green-400" : "text-gray-400"}`}>{slotCanCraft ? "준비됨" : "불가"}</span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-400">잠김</span>
                    )}
                  </div>
                  {!slotKnown ? (
                    <div className="text-[11px] text-orange-300 mt-1">레시피 미습득 · 장인 상인</div>
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
              {(SLOT_LABELS as Record<string, string>)[selectedForgeSlot] ?? selectedForgeSlot} · {FORGE_TIER_LABELS[forgeTier]}
            </div>
            <div className="text-xs text-gray-400">레시피: {selectedRecipe}</div>

            {!hasKnownRecipe ? (
              <div className="space-y-2">
                <div className="text-xs text-orange-300">
                  레시피를 아직 배우지 않았습니다. 장인 상인을 방문해 청사진을 먼저 구매하세요.
                </div>
                <button
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 text-xs font-bold px-2 py-1 rounded"
                  onClick={() => {
                    setVendorsForgeTab("vendors");
                    setVendorTab("artisan");
                  }}
                  type="button"
                >
                  장인 상인 열기
                </button>
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-300">
                  에너지 {recipe.energyCost} · 골드 {discountedRecipeGold} · 재료 {materialChecks.map(({ id, required }) => `${required} ${MATERIAL_LABELS[id]}`).join(", ")}
                </div>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div className={energyRemaining >= recipe.energyCost ? "text-green-400" : "text-red-300"}>
                    에너지: {energyRemaining}/{recipe.energyCost}
                  </div>
                  <div className={goldRemaining >= discountedRecipeGold ? "text-green-400" : "text-red-300"}>
                    골드: {goldRemaining}/{discountedRecipeGold}
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
                  {canCraftRecipe ? "제작 확정" : "요구 사항 부족"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* 가능한 활동 */}
      <div className="space-y-2">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">가능한 활동</h3>
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
                ? "계획"
                : "+ 계획";

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

      {/* 계획 큐 */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">계획된 활동</h3>
          {plannedActivities.length > 0 && (
            <button
              className="text-xs text-gray-400 hover:text-gray-200"
              onClick={clearPlan}
            >
              계획 비우기
            </button>
          )}
        </div>
        {plannedActivities.length === 0 ? (
          <p className="text-gray-500 text-sm">아직 계획된 활동이 없습니다.</p>
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
                    제거
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 일차 제어 */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">현재 일차</h3>
          <span className={`font-bold text-sm ${energyRemaining > 0 ? "text-yellow-400" : "text-red-400"}`}>
            ⚡ {energyRemaining} 남음
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          계획된 행동: {plannedActivities.length}
        </div>

        {hero.inGameDay >= 10 && (
          <div className="text-orange-400 text-xs text-center">
            ⚠ {hero.inGameDay}일 차: 노년이 다가옵니다. 매일 사망 위험이 증가합니다.
          </div>
        )}

        <div className="border-t border-gray-700 pt-3 flex gap-2">
          <button
            className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded transition-colors"
            onClick={endDay}
          >
            일차 종료 / 계획 실행
          </button>
        </div>
      </div>
    </div>
  );
}