import { useGameStore } from "../../store/gameStore";
import { TOWNSPERSON_LIST } from "../../data/townspeople";

export function MainMenu() {
  const { meta, hero, goTo, startHeroCreation } = useGameStore();
  const unlockedCount = meta.townspeople.length;
  const totalTownspeople = TOWNSPERSON_LIST.length;
  const resetGame = () => {
    const confirmed = window.confirm("모든 진행 상황을 초기화하시겠습니까? 브라우저의 저장 데이터가 모두 삭제됩니다.");
    if (!confirmed) {
      return;
    }
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      {/* 타이틀 */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold text-yellow-400 tracking-widest">나노레이더</h1>
        <p className="text-gray-400 text-sm">생존하라. 전초기지를 구축하라. 모두 모아 영웅이 되라.</p>
      </div>

      {/* 메타 진행 통계 */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-yellow-400 font-bold text-2xl">{meta.maxEnergy}</div>
          <div className="text-gray-400 text-xs">최대 에너지</div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-yellow-400 font-bold text-2xl">{unlockedCount}/{totalTownspeople}</div>
          <div className="text-gray-400 text-xs">전초기지 주민</div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-blue-400 font-bold text-2xl">{meta.totalRuns}</div>
          <div className="text-gray-400 text-xs">총 모험 횟수</div>
        </div>
      </div>

      {/* 활성화된 보너스 */}
      {unlockedCount > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-md">
          <h3 className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-2">활성 전초기지 보너스</h3>
          <div className="space-y-1 text-sm">
            {(meta.townspersonBonuses.combatBonus ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">전투 보너스</span>
                <span className="text-green-400 font-bold">+{Math.round((meta.townspersonBonuses.combatBonus ?? 0) * 100)}%</span>
              </div>
            )}
            {(meta.townspersonBonuses.startGold ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">시작 골드</span>
                <span className="text-yellow-400 font-bold">+{meta.townspersonBonuses.startGold}g</span>
              </div>
            )}
            {(meta.townspersonBonuses.knowledgeTransferMultiplier ?? 1) > 1 && (
              <div className="flex justify-between">
                <span className="text-gray-400">연구 배율</span>
                <span className="text-cyan-400 font-bold">{meta.townspersonBonuses.knowledgeTransferMultiplier}x</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {hero !== null && (
          <button
            className="bg-green-700 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors border border-green-500"
            onClick={() => { goTo("planning"); }}
          >
            ▶ 계속하기 — {hero.name} ({hero.inGameDay}일 차)
          </button>
        )}
        <button
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg text-lg transition-colors"
          onClick={startHeroCreation}
        >
          ⚔ 새로운 영웅
        </button>
        <button
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg transition-colors border border-gray-600"
          onClick={() => { goTo("collection"); }}
        >
          🏠 전초기지 ({unlockedCount}/{totalTownspeople})
        </button>
        <button
          className="bg-red-900 hover:bg-red-800 text-red-100 font-bold py-3 px-6 rounded-lg transition-colors border border-red-700"
          onClick={resetGame}
        >
          진행 초기화
        </button>
      </div>

      <p className="text-gray-600 text-xs text-center">
        진행 상황은 브라우저에 자동으로 저장됩니다.
      </p>
    </div>
  );
}