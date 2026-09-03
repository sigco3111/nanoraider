import { useState } from "react";
import { randomHeroName } from "../../data/nurture";
import { useGameStore } from "../../store/gameStore";

export function HeroCreation() {
  const { createHero, goTo } = useGameStore();
  const [name, setName] = useState(() => randomHeroName());

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-yellow-400">백지 영웅</h2>
          <p className="text-gray-500 text-sm mt-1">고정된 직업은 없습니다. 초기 선택이 당신의 원형을 결정합니다.</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-gray-500 text-xs uppercase tracking-widest block">영웅 이름</label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                maxLength={20}
                onChange={(e) => { setName(e.target.value); }}
                type="text"
                value={name}
              />
              <button
                className="text-gray-500 hover:text-gray-300 text-xs px-3 py-2 border border-gray-700 rounded transition-colors"
                onClick={() => { setName(randomHeroName()); }}
                title="이름 무작위 생성"
              >
                ↻
              </button>
            </div>
          </div>

          <div className="text-gray-500 text-xs border-t border-gray-800 pt-3">
            1~3일 차에는 추가 무작위 이벤트가 발생합니다. 그 선택이 전쟁·지혜·부 트라이앵글과 명성을 결정합니다.
          </div>

          <button
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-3 rounded-lg transition-colors text-base"
            disabled={name.trim().length === 0}
            onClick={() => { createHero(name.trim()); }}
          >
            모험 시작
          </button>
        </div>

        <button
          className="w-full text-gray-600 hover:text-gray-400 text-sm transition-colors"
          onClick={() => { goTo("main_menu"); }}
        >
          ← 메뉴로 돌아가기
        </button>
      </div>
    </div>
  );
}