import { useEffect, useState } from "react";
import { RAID_GATE_LABELS, TOWNSPERSON_LIST, TOWNSPEOPLE, AP_UPGRADES } from "../../data/townspeople";
import type { RaidGate, TownspersonBonuses, TownspersonRoleId } from "../../data/types";
import { useGameStore } from "../../store/gameStore";

const META_EXPANDED_STORAGE_KEY = "nanoraider-collection-meta-expanded";

const RAID_GATE_COLORS: Record<RaidGate, string> = {
  none: "border-green-500 bg-green-900/80",
  molten_fury: "border-orange-500 bg-orange-900/80",
  eternal_throne: "border-purple-500 bg-purple-900/80",
};

const RAID_GATE_BADGE: Record<RaidGate, string> = {
  none: "bg-green-600 text-green-100",
  molten_fury: "bg-orange-600 text-orange-100",
  eternal_throne: "bg-purple-600 text-purple-100",
};

const RAID_GATE_ORDER: RaidGate[] = ["none", "molten_fury", "eternal_throne"];

const BONUS_LABEL: Partial<Record<keyof TownspersonBonuses, string>> = {
  energyBonus: "최대 에너지",
  startGold: "시작 골드",
  combatBonus: "전투 보너스",
  bossReadinessBonus: "보스 준비도 보너스",
  knowledgeTransferMultiplier: "연구 배율",
  vendorDiscountPct: "상인 할인",
  recipeDiscountPct: "레시피 할인",
  purpleCraftStatBonusPct: "영웅 제작 보너스",
  brokerTierStart: "중개상 등급",
  raidProvisionerUnlocked: "레이드 보급병",
};

function formatBonusTeaser(bonuses: TownspersonBonuses): string[] {
  const parts: string[] = [];
  parts.push("최대 에너지");
  for (const key of Object.keys(bonuses) as Array<keyof TownspersonBonuses>) {
    if (key === "energyBonus") {continue;}
    const label = BONUS_LABEL[key];
    if (label === undefined) {continue;}
    if (key === "raidProvisionerUnlocked") {
      if (bonuses.raidProvisionerUnlocked === true) {
        parts.push(label);
      }
      continue;
    }
    if (key === "brokerTierStart") {
      if ((bonuses.brokerTierStart ?? 0) > 1) {
        parts.push(label);
      }
      continue;
    }
    const val = bonuses[key];
    if (typeof val === "number" && val > 0 && val !== 1) {
      parts.push(label);
    }
  }
  return parts;
}

interface TownspersonCardProps {
  roleId: TownspersonRoleId;
  filledHero: { heroName: string; level: number; dayReached: number } | null;
}

function TownspersonCard({ roleId, filledHero }: TownspersonCardProps) {
  const role = TOWNSPEOPLE[roleId];
  const gateBorder = RAID_GATE_COLORS[role.raidGate];
  const gateBadge = RAID_GATE_BADGE[role.raidGate];
  const gateLabel = RAID_GATE_LABELS[role.raidGate];
  const unlocked = filledHero !== null;

  if (!unlocked) {
    return (
      <div className={`border-2 rounded-lg p-4 space-y-2 ${gateBorder} opacity-75`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${gateBadge}`}>{gateLabel}</span>
          <span className="text-gray-400 text-xs font-medium">공석</span>
        </div>
        <div className="text-center py-2">
          <div className="text-4xl text-gray-400">?</div>
          <div className="text-white font-bold mt-1">{role.name}</div>
        </div>
        <p className="text-gray-300 text-sm italic">{role.hint}</p>
        <div className="text-amber-400 text-sm">
          <div className="text-amber-300/80 text-xs font-bold uppercase tracking-widest mb-1">제공 효과</div>
          <ul className="list-disc list-inside space-y-0.5">
            {formatBonusTeaser(role.bonuses).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-lg p-4 space-y-2 ${gateBorder}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded font-bold ${gateBadge}`}>{gateLabel}</span>
        <span className="text-green-300 text-xs font-bold">✓ 주민</span>
      </div>
      <div>
        <h3 className="text-white font-bold text-lg">{role.name}</h3>
        <div className="text-yellow-300 text-sm font-bold">{filledHero.heroName}</div>
        <div className="text-gray-400 text-xs">Lv {filledHero.level} · {filledHero.dayReached}일 차</div>
        <p className="text-gray-200 text-sm mt-1">{role.description}</p>
      </div>
      <p className="text-gray-300 text-sm italic border-t border-gray-600 pt-2">{role.lore}</p>
      <div className="space-y-1 text-sm">
        <div className="text-gray-400 uppercase tracking-widest font-bold">보너스</div>
        <div className="text-green-300">+{role.bonuses.energyBonus} 최대 에너지</div>
        {(role.bonuses.startGold ?? 0) > 0 && <div className="text-yellow-300">+{role.bonuses.startGold}g 시작 골드</div>}
        {(role.bonuses.combatBonus ?? 0) > 0 && <div className="text-red-300">+{Math.round((role.bonuses.combatBonus ?? 0) * 100)}% 전투</div>}
        {(role.bonuses.knowledgeTransferMultiplier ?? 1) > 1 && <div className="text-cyan-300">{role.bonuses.knowledgeTransferMultiplier}배 연구</div>}
        {(role.bonuses.bossReadinessBonus ?? 0) > 0 && <div className="text-blue-300">+{Math.round((role.bonuses.bossReadinessBonus ?? 0) * 100)}% 보스 준비도</div>}
        {(role.bonuses.vendorDiscountPct ?? 0) > 0 && <div className="text-amber-300">+{Math.round((role.bonuses.vendorDiscountPct ?? 0) * 100)}% 상인 할인</div>}
        {(role.bonuses.recipeDiscountPct ?? 0) > 0 && <div className="text-orange-300">+{Math.round((role.bonuses.recipeDiscountPct ?? 0) * 100)}% 레시피 할인</div>}
        {(role.bonuses.purpleCraftStatBonusPct ?? 0) > 0 && <div className="text-purple-300">+{Math.round((role.bonuses.purpleCraftStatBonusPct ?? 0) * 100)}% 영웅 제작</div>}
        {(role.bonuses.brokerTierStart ?? 1) > 1 && <div className="text-sky-300">중개상 시작 등급 {role.bonuses.brokerTierStart}</div>}
        {role.bonuses.raidProvisionerUnlocked === true ? <div className="text-violet-300">레이드 보급병 해금</div> : null}
      </div>
    </div>
  );
}

function getStoredMetaExpanded(): boolean {
  const stored = localStorage.getItem(META_EXPANDED_STORAGE_KEY);
  return stored === null ? false : stored === "true";
}

export function CollectionScreen() {
  const { meta, hero, goTo } = useGameStore();
  const [metaExpanded, setMetaExpanded] = useState(getStoredMetaExpanded);

  useEffect(() => {
    localStorage.setItem(META_EXPANDED_STORAGE_KEY, String(metaExpanded));
  }, [metaExpanded]);

  const toggleMeta = () => {
    setMetaExpanded((prev) => !prev);
  };

  const filledMap = new Map(meta.townspeople.map((t) => [t.roleId, t.hero]));
  const unlockedCount = meta.townspeople.length;
  const totalCount = TOWNSPERSON_LIST.length;

  const apUpgradeCounts = AP_UPGRADES.map((upgrade) => ({
    name: upgrade.name,
    purchased: meta.apUpgrades.filter((id) => id === upgrade.id).length,
    maxPurchases: upgrade.maxPurchases,
  }));
  const bossReadinessRows = Object.entries(meta.bossReadinessBank);

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-yellow-300 font-bold text-xl">전초기지</h2>
          <p className="text-gray-300 text-sm">살아남아 당신의 대열에 합류한 영웅들</p>
        </div>
        <button
          className="text-gray-300 hover:text-white text-sm transition-colors"
          onClick={() => { goTo(hero !== null ? "planning" : "main_menu"); }}
        >
          ← 뒤로
        </button>
      </div>

      {/* 진행도 */}
      <div className="bg-gray-800/80 border border-gray-600 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-200 font-bold">전초기지 진행도</span>
          <span className="text-yellow-300 font-bold">{unlockedCount} / {totalCount} 주민</span>
        </div>
        <div className="h-3 bg-gray-700 rounded overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-400" style={{ width: `${(unlockedCount / totalCount) * 100}%` }} />
        </div>
        <div className="flex gap-4 text-sm text-gray-300">
          {RAID_GATE_ORDER.map((gate) => {
            const rolesInGate = TOWNSPERSON_LIST.filter((r) => r.raidGate === gate);
            const filled = rolesInGate.filter((r) => filledMap.has(r.id)).length;
            const colors: Record<RaidGate, string> = {
              none: "text-green-300",
              molten_fury: "text-orange-300",
              eternal_throne: "text-purple-300",
            };
            return (
              <span className={colors[gate]} key={gate}>
                {filled}/{rolesInGate.length} {RAID_GATE_LABELS[gate]}
              </span>
            );
          })}
        </div>
      </div>

      {/* 메타 진행 */}
      <div className="bg-gray-800/80 border border-cyan-600 rounded-lg overflow-hidden">
        <button
          className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-700/50 transition-colors"
          onClick={toggleMeta}
          type="button"
        >
          <h3 className="text-cyan-200 text-sm font-bold uppercase tracking-widest">메타 진행</h3>
          <span className="text-cyan-300 text-lg">{metaExpanded ? "−" : "+"}</span>
        </button>
        {metaExpanded ? (
          <div className="px-4 pb-4 space-y-4 border-t border-cyan-700/50 pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800 border border-gray-600 rounded p-2">
                <div className="text-gray-400 text-xs">총 모험 횟수</div>
                <div className="text-blue-200 font-bold">{meta.totalRuns}</div>
              </div>
              <div className="bg-gray-800 border border-gray-600 rounded p-2">
                <div className="text-gray-400 text-xs">업적 점수</div>
                <div className="text-yellow-200 font-bold">{meta.achievementPoints}</div>
              </div>
              <div className="bg-gray-800 border border-gray-600 rounded p-2">
                <div className="text-gray-400 text-xs">최대 에너지</div>
                <div className="text-emerald-200 font-bold">{meta.maxEnergy}</div>
              </div>
              <div className="bg-gray-800 border border-gray-600 rounded p-2">
                <div className="text-gray-400 text-xs">전초기지 주민</div>
                <div className="text-yellow-200 font-bold">{meta.townspeople.length}</div>
              </div>
            </div>

            <div className="space-y-1 text-sm border-t border-gray-600 pt-3">
              <div className="text-gray-400 uppercase tracking-widest font-bold">누적 보너스</div>
              <div className="text-green-200">에너지 보너스: +{meta.townspersonBonuses.energyBonus}</div>
              <div className="text-yellow-200">시작 골드: +{meta.townspersonBonuses.startGold ?? 0}g</div>
              <div className="text-red-200">전투 보너스: +{Math.round((meta.townspersonBonuses.combatBonus ?? 0) * 100)}%</div>
              <div className="text-cyan-200">연구 효과: {meta.townspersonBonuses.knowledgeTransferMultiplier ?? 1}배</div>
              <div className="text-blue-200">보스 준비도 보너스: +{Math.round((meta.townspersonBonuses.bossReadinessBonus ?? 0) * 100)}%</div>
            </div>

            <div className="space-y-1 text-sm border-t border-gray-600 pt-3">
              <div className="text-gray-400 uppercase tracking-widest font-bold">AP 업그레이드</div>
              {apUpgradeCounts.map((upgrade) => (
                <div className="flex justify-between" key={upgrade.name}>
                  <span className="text-gray-300">{upgrade.name}</span>
                  <span className="text-blue-200">{upgrade.purchased}/{upgrade.maxPurchases}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm border-t border-gray-600 pt-3">
              <div className="text-gray-400 uppercase tracking-widest font-bold">보스 준비도 저금고</div>
              {bossReadinessRows.length === 0 && <div className="text-gray-400">아직 저장된 보스 준비도가 없습니다.</div>}
              {bossReadinessRows.map(([bossId, readiness]) => {
                const label: Record<string, string> = {
                  molten_fury: "잿불격노",
                  eternal_throne: "영원의 왕좌",
                };
                return (
                  <div className="bg-gray-800 border border-gray-600 rounded p-2" key={bossId}>
                    <div className="flex justify-between">
                      <span className="text-gray-200">{label[bossId] ?? bossId}</span>
                      <span className="text-cyan-200">준비도 {Math.round(readiness)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* 레이드 관문별 주민 */}
      {RAID_GATE_ORDER.map((gate) => {
        const rolesInGate = TOWNSPERSON_LIST.filter((r) => r.raidGate === gate);
        const sectionColors: Record<RaidGate, string> = {
          none: "text-green-300",
          molten_fury: "text-orange-300",
          eternal_throne: "text-purple-300",
        };
        const sectionDesc: Record<RaidGate, string> = {
          none: "모든 모험에서 영입 가능",
          molten_fury: "잿불격노 처치 필요",
          eternal_throne: "영원의 왕좌 처치 필요",
        };

        return (
          <div className="space-y-3" key={gate}>
            <div>
              <h3 className={`${sectionColors[gate]} text-sm font-bold uppercase tracking-widest`}>{RAID_GATE_LABELS[gate]}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{sectionDesc[gate]}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rolesInGate.map((role) => {
                const filled = filledMap.get(role.id) ?? null;
                return (
                  <TownspersonCard
                    filledHero={filled}
                    key={role.id}
                    roleId={role.id}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}