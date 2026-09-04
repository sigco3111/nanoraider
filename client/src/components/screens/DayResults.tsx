import { useGameStore } from "../../store/gameStore";
import { ACTIVITIES } from "../../data/activities";
import { MATERIAL_LABELS } from "../../data/crafting";
import { formatGearStats } from "../../game/gearGenerator";
import { EVENT_LABEL_KR } from "../../data/labels";

const RARITY_COLOR: Record<string, string> = {
  gray: "text-white",
  green: "text-green-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
};

const SLOT_LABEL_KR: Record<string, string> = {
  head: "머리",
  chest: "가슴",
  legs: "다리",
  mainhand: "주무기",
  offhand: "보조",
};

function formatSignedGold(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}g`;
}

export function DayResults() {
  const { hero, lastDayResults, goTo } = useGameStore();

  if (lastDayResults === null || hero === null) {
    goTo("planning");
    return null;
  }

  const results = lastDayResults;

  return (
    <div className="min-h-screen p-4 space-y-4 max-w-xl mx-auto">
      <div className="text-center">
        <h2 className="text-yellow-400 font-bold text-xl">{results.day}일 차 완료</h2>
        <p className="text-gray-400 text-sm">{hero.inGameDay - 1}일 차 → {hero.inGameDay}일 차</p>
      </div>

      {/* 요약 바 */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-blue-400 font-bold text-xl">+{results.totalXp}</div>
          <div className="text-gray-400 text-xs">경험치</div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className={`font-bold text-xl ${results.totalGold >= 0 ? "text-yellow-400" : "text-red-300"}`}>
            {formatSignedGold(results.totalGold)}
          </div>
          <div className="text-gray-400 text-xs">골드 (순)</div>
          {results.totalGoldSpent > 0 && <div className="text-red-300 text-[10px] mt-1">-{results.totalGoldSpent}g 사용</div>}
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-purple-400 font-bold text-xl">{results.lootObtained.length}</div>
          <div className="text-gray-400 text-xs">아이템</div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-indigo-400 font-bold text-xl">{results.eventsResolved.length}</div>
          <div className="text-gray-400 text-xs">이벤트</div>
        </div>
      </div>

      {/* 전리품 */}
      {results.lootObtained.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">획득한 전리품</h3>
          {results.lootObtained.map((item, i) => (
            <div className="flex items-center justify-between" key={`${item.id}-${i}`}>
              <span className={`font-bold text-sm ${RARITY_COLOR[item.rarity] ?? "text-gray-400"}`}>{item.name}</span>
              <span className="text-gray-500 text-xs">{SLOT_LABEL_KR[item.slot] ?? item.slot}{formatGearStats(item.power) ? ` · ${formatGearStats(item.power)}` : ""}</span>
            </div>
          ))}
        </div>
      )}

      {/* 행동 내역 */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2">
        <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest">행동 기록</h3>
        {results.activitiesResolved.map((r, i) => {
          const def = ACTIVITIES[r.activityId];
          return (
            <div className="flex items-center justify-between text-sm" key={i}>
              <span className="text-gray-300">{def.name}</span>
              <div className="flex gap-3 text-xs">
                {r.failed ? <span className="text-orange-300">실패 (보상 없음)</span> : null}
                {r.xpGained > 0 && <span className="text-blue-400">+{r.xpGained} 경험치</span>}
                {r.goldGained > 0 && <span className="text-yellow-400">+{r.goldGained}g</span>}
                {r.goldSpent > 0 && <span className="text-red-300">-{r.goldSpent}g</span>}
                {r.lootDropped.length > 0 && (
                  <span className="text-purple-400">+{r.lootDropped.length}개 아이템</span>
                )}
                {r.materialsGained !== undefined && Object.keys(r.materialsGained).length > 0 && (
                  <span className="text-cyan-300">
                    +{Object.entries(r.materialsGained).map(([id, amount]) => `${amount} ${MATERIAL_LABELS[id as keyof typeof MATERIAL_LABELS]}`).join(", ")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {results.eventsResolved.map((event, i) => (
          <div className="flex items-center justify-between text-sm border-t border-gray-800 pt-2" key={`${event.eventId}-${i}`}>
            <span className="text-indigo-300">이벤트: {(EVENT_LABEL_KR as Record<string, string>)[event.eventId] ?? event.eventId}</span>
            <div className="flex gap-3 text-xs">
              {event.xpGained > 0 && <span className="text-blue-400">+{event.xpGained} 경험치</span>}
              {event.goldGained > 0 && <span className="text-yellow-400">+{event.goldGained}g</span>}
            </div>
          </div>
        ))}
        {results.transactions.map((tx, i) => (
          <div className="flex items-center justify-between text-sm border-t border-gray-800 pt-2" key={`${tx.label}-${i}`}>
            <span className="text-cyan-300">{tx.kind === "craft" ? "제련" : "상인"}: {tx.label}</span>
            <div className="flex gap-3 text-xs">
              {(tx.energySpent ?? 0) > 0 && <span className="text-yellow-400">⚡{tx.energySpent}</span>}
              {(tx.goldSpent ?? 0) > 0 && <span className="text-red-300">-{tx.goldSpent}g</span>}
            </div>
          </div>
        ))}
      </div>

      {/* 트라이앵글 힌트 */}
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-center">
        <TriangleHint renown={results.renownSnapshot} triangle={results.triangleSnapshot} />
      </div>

      <button
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg text-lg transition-colors"
        onClick={() => { goTo("planning"); }}
      >
        {hero.inGameDay}일 차 계획 →
      </button>
    </div>
  );
}

function TriangleHint({
  triangle,
  renown,
}: {
  triangle: { war: number; wit: number; wealth: number };
  renown: number;
}) {
  const entries = Object.entries(triangle).sort(([, a], [, b]) => b - a);
  const dominant = entries[0]?.[0] ?? "war";
  if (entries[0] === undefined) {
    return <p className="text-gray-500 text-xs italic">당신의 영웅은 아직 자신의 길을 찾는 중입니다...</p>;
  }
  const hints: Record<string, string> = {
    war: "이번 모험은 전쟁 쪽으로 기울었습니다.",
    wit: "이번 모험은 지혜 쪽으로 기울었습니다.",
    wealth: "이번 모험은 부 쪽으로 기울었습니다.",
  };
  return <p className="text-gray-400 text-xs italic">{hints[dominant]} 명성은 {renown}에서 마무리되었습니다.</p>;
}