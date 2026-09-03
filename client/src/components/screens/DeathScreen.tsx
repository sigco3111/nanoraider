import { useState } from "react";
import { TOWNSPERSON_LIST, TOWNSPEOPLE } from "../../data/townspeople";
import type { TownspersonBonuses } from "../../data/types";
import { ACTIVITIES } from "../../data/activities";
import { useGameStore } from "../../store/gameStore";

const CAUSE_LABELS = {
  combat: { label: "전투로 쓰러짐", icon: "⚔", color: "text-red-400" },
  old_age: { label: "노환으로 사망", icon: "🕯", color: "text-gray-400" },
};

const RAID_GATE_VETERAN: Record<string, string> = {
  none: "전초기지 주민",
  molten_fury: "잿불격노 생존자",
  eternal_throne: "영원의 왕좌 정복자",
};

export function DeathScreen() {
  const { deathSummary, meta, goTo, startHeroCreation } = useGameStore();
  const [phase, setPhase] = useState<"stats" | "outpost" | "bonuses">("stats");

  if (deathSummary === null) {
    goTo("main_menu");
    return null;
  }

  const summary = deathSummary;
  const causeInfo = CAUSE_LABELS[summary.cause];
  const fatalActivityName = summary.fatalActivityId !== null ? ACTIVITIES[summary.fatalActivityId].name : null;
  const moltenReadiness = summary.bossReadinessSnapshot["molten_fury"];

  const townspersonDef = summary.townspersonUnlocked !== null ? TOWNSPEOPLE[summary.townspersonUnlocked] : null;
  const almostDef = summary.almostUnlocked !== null ? TOWNSPEOPLE[summary.almostUnlocked] : null;

  return (
    <div className="min-h-screen p-4 max-w-xl mx-auto space-y-4">
      {/* 사망 / 생존 헤더 */}
      <div className="text-center py-6 space-y-2">
        {summary.heroSurvived ? (
          <>
            <div className="text-4xl text-yellow-400">🏠</div>
            <h2 className="text-3xl font-bold text-yellow-300">{summary.heroName} (이)가 살아남았습니다!</h2>
            <div className="text-yellow-400 font-bold">{townspersonDef?.name ?? "주민"} (으)로 전초기지에 합류</div>
          </>
        ) : (
          <>
            <div className={`text-4xl ${causeInfo.color}`}>{causeInfo.icon}</div>
            <h2 className="text-3xl font-bold text-white">{summary.heroName} (이)가 쓰러졌습니다</h2>
            <div className={`font-bold ${causeInfo.color}`}>{causeInfo.label} · {summary.inGameDay}일 차</div>
          </>
        )}
      </div>

      {/* 단계 탭 */}
      <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        {(["stats", "outpost", "bonuses"] as const).map((p) => (
          <button
            className={`flex-1 py-2 text-sm font-bold transition-colors ${phase === p ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
            key={p}
            onClick={() => { setPhase(p); }}
          >
            {p === "stats" ? "유산" : p === "outpost" ? "전초기지" : "보상"}
          </button>
        ))}
      </div>

      {/* 단계: 통계 */}
      {phase === "stats" && (
        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
            <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">모험 통계</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="도달 레벨" value={`${summary.level}`} />
              <Stat label="게임 내 일차" value={`${summary.inGameDay} / 12`} />
              <Stat label="사망 시 골드" value={`${summary.gold}g`} />
              <Stat label="총 획득 경험치" value={`${summary.totalXpGained}`} />
              <Stat label="레이드 처치" value={summary.defeatedRaids.length > 0 ? "예 ✓" : "아니오"} />
              <Stat label="보스 준비도" value={`${Math.round(moltenReadiness)}%`} />
            </div>
          </div>

          {summary.cause === "combat" && summary.fatalActivityRisk !== null && summary.fatalRiskBand !== null && (
            <div className="bg-gray-900 border border-red-900 rounded-lg p-4 space-y-2">
              <h3 className="text-red-300 text-xs font-bold uppercase tracking-widest">최후의 조우</h3>
              <p className="text-sm text-gray-300">
                {fatalActivityName ?? "전투 활동"}의 사망 위험은{" "}
                <span className="text-red-400 font-bold">{Math.round(summary.fatalActivityRisk * 100)}%</span> ({summary.fatalRiskBand})였습니다.
              </p>
              {summary.fatalRiskHints.length > 0 && (
                <ul className="text-xs text-gray-400 space-y-1">
                  {summary.fatalRiskHints.map((hint) => (
                    <li key={hint}>• {hint}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 대담함 공개 */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
            <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">대담함 공개</h3>
            <p className="text-gray-400 text-xs">모험 중에는 숨겨져 있었습니다 — 이제 당신의 위험 성향이 드러납니다.</p>
            <PersonalityBar stat="daring" value={summary.daringSnapshot} />
            <div className="text-xs text-gray-300">
              사망 시 트라이앵글: 전쟁 {summary.triangleSnapshot.war}% · 지혜 {summary.triangleSnapshot.wit}% · 부 {summary.triangleSnapshot.wealth}% · 명성 {summary.renownSnapshot}
            </div>
          </div>
        </div>
      )}

      {/* 단계: 전초기지 */}
      {phase === "outpost" && (
        <div className="space-y-3">
          {townspersonDef !== null ? (
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-5 space-y-4">
              <div className="text-center space-y-1">
                <div className="text-xs text-yellow-400 uppercase tracking-widest font-bold">영웅 생존!</div>
                <div className="text-3xl font-bold text-white">{summary.heroName}</div>
                <div className="text-yellow-300 text-lg font-bold">{townspersonDef.name}</div>
                <div className="text-yellow-400 text-sm">{RAID_GATE_VETERAN[townspersonDef.raidGate] ?? townspersonDef.raidGate}</div>
              </div>
              <p className="text-gray-300 text-sm text-center italic">{townspersonDef.lore}</p>
              {summary.whyUnlocked !== null && (
                <div className="bg-gray-800 rounded p-3 text-sm text-gray-300">
                  <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">살아남은 이유</span>
                  {summary.whyUnlocked}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 space-y-3 text-center">
              <div className="text-gray-400 text-4xl">⚰</div>
              <div className="text-gray-300 font-bold">영웅은 묘비로 떨어졌습니다</div>
              <p className="text-gray-500 text-sm">
                모든 영웅이 이야기를 남기는 것은 아닙니다. 그럼에도 각 모험은 다음 모험자를 만듭니다.
              </p>
            </div>
          )}

          {/* 거의 해금 힌트 */}
          {almostDef !== null && summary.almostReason !== null && (
            <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 space-y-2">
              <div className="text-orange-400 text-xs uppercase tracking-widest font-bold">거의 다 왔습니다!</div>
              <div className="text-white font-bold">{almostDef.name}</div>
              <p className="text-gray-400 text-sm">{summary.almostReason}</p>
            </div>
          )}

          {/* 전초기지 진행도 */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">전초기지 주민</span>
              <span className="text-yellow-400 font-bold">{meta.townspeople.length} / {TOWNSPERSON_LIST.length}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-yellow-500"
                style={{ width: `${(meta.townspeople.length / TOWNSPERSON_LIST.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 단계: 보상 */}
      {phase === "bonuses" && (
        <div className="space-y-3">
          <div className="bg-gray-900 border border-green-800 rounded-lg p-4 space-y-3">
            <h3 className="text-green-400 text-xs font-bold uppercase tracking-widest">영구 보상</h3>
            <div className="space-y-2">
              {summary.energyBonusGranted > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">최대 에너지</span>
                  <span className="text-yellow-400 font-bold">+{summary.energyBonusGranted} → 총 {meta.maxEnergy}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">업적 점수</span>
                <span className="text-blue-400 font-bold">+{summary.apGranted} → 총 {meta.achievementPoints}</span>
              </div>
              {summary.townspersonUnlocked !== null && townspersonDef !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">{townspersonDef.name} 보너스 에너지</span>
                  <span className="text-yellow-400 font-bold">+{townspersonDef.bonuses.energyBonus}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2">
            <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">모든 활성 보너스</h3>
            {meta.townspeople.length === 0 ? (
              <p className="text-gray-600 text-sm">주민을 영입해 영구 보너스를 얻으세요.</p>
            ) : (
              meta.townspeople.map((filled) => {
                const role = TOWNSPEOPLE[filled.roleId];
                return (
                  <div className="text-sm" key={filled.roleId}>
                    <span className="text-yellow-400 font-bold">{role.name}</span>
                    <span className="text-gray-500 text-xs"> ({filled.hero.heroName})</span>
                    {": "}
                    <span className="text-gray-400">{formatBonuses(role.bonuses)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CTA 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors"
          onClick={startHeroCreation}
        >
          ↺ 새로운 영웅
        </button>
        <button
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 rounded-lg border border-gray-600 transition-colors"
          onClick={() => { goTo("collection"); }}
        >
          🏠 전초기지
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded p-2">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-white font-bold">{value}</div>
    </div>
  );
}

function PersonalityBar({ stat, value }: { stat: string; value: number }) {
  const MAX = 80;
  const pct = Math.min(1, value / MAX);
  const colors: Record<string, string> = {
    daring: "bg-purple-500",
  };
  const barColor = colors[stat] ?? "bg-gray-500";
  const label: Record<string, string> = {
    daring: "대담함",
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-400 w-24 shrink-0">{label[stat] ?? stat}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-white text-xs w-8 text-right">{value}</span>
    </div>
  );
}

function formatBonuses(bonuses: TownspersonBonuses): string {
  const parts: string[] = [];
  if (bonuses.energyBonus > 0) {
    parts.push(`최대 에너지 +${bonuses.energyBonus}`);
  }
  if ((bonuses.startGold ?? 0) > 0) {
    parts.push(`시작 골드 +${bonuses.startGold ?? 0}g`);
  }
  if ((bonuses.combatBonus ?? 0) > 0) {
    parts.push(`전투 +${Math.round((bonuses.combatBonus ?? 0) * 100)}%`);
  }
  if ((bonuses.bossReadinessBonus ?? 0) > 0) {
    parts.push(`보스 준비도 +${Math.round((bonuses.bossReadinessBonus ?? 0) * 100)}%`);
  }
  if ((bonuses.knowledgeTransferMultiplier ?? 1) > 1) {
    parts.push(`연구 효과 ${bonuses.knowledgeTransferMultiplier ?? 1}배`);
  }
  if ((bonuses.vendorDiscountPct ?? 0) > 0) {
    parts.push(`상인 할인 ${Math.round((bonuses.vendorDiscountPct ?? 0) * 100)}%`);
  }
  if ((bonuses.recipeDiscountPct ?? 0) > 0) {
    parts.push(`레시피 할인 ${Math.round((bonuses.recipeDiscountPct ?? 0) * 100)}%`);
  }
  if ((bonuses.purpleCraftStatBonusPct ?? 0) > 0) {
    parts.push(`영웅 제작 +${Math.round((bonuses.purpleCraftStatBonusPct ?? 0) * 100)}%`);
  }
  if ((bonuses.brokerTierStart ?? 1) > 1) {
    parts.push(`중개상 시작 등급 ${bonuses.brokerTierStart ?? 1}`);
  }
  if (bonuses.raidProvisionerUnlocked === true) {
    parts.push("레이드 보급병 해금");
  }
  return parts.join(", ");
}