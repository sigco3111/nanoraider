import { useCallback, useEffect, useRef, useState } from "react";
import type { GearSlot, Hero, MaterialId } from "../data/types";
import { EnergyBar } from "./EnergyBar";
import { MATERIAL_LABELS } from "../data/crafting";
import { RARITY_LABELS } from "../data/rarity";
import { formatGearStats, getGearPower } from "../game/gearGenerator";
import { getAgePhase } from "../game/character";


interface HeroStatusProps {
  hero: Hero;
  maxEnergy: number;
  energyUsedToday: number;
  onRename?: (name: string) => void;
}

const RARITY_COLOR: Record<string, string> = {
  gray: "text-white",
  green: "text-green-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
};

const SLOT_LABELS: Record<GearSlot, string> = {
  head: "머리",
  chest: "가슴",
  legs: "다리",
  mainhand: "주무기",
  offhand: "보조",
};

export function HeroStatus({ hero, maxEnergy, energyUsedToday, onRename }: HeroStatusProps) {
  const canChangeCharacter = hero.inGameDay === 1;
  const [selectedSlot, setSelectedSlot] = useState<GearSlot>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(hero.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const toggleSelectedSlot = useCallback((slot: GearSlot) => {
    setSelectedSlot((prev) => prev !== slot ? slot : undefined);
  }, []);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const startEditName = useCallback(() => {
    if (!canChangeCharacter || onRename === undefined) {
      return;
    }
    setEditNameValue(hero.name);
    setIsEditingName(true);
  }, [canChangeCharacter, hero.name, onRename]);

  const commitNameEdit = useCallback(() => {
    if (!onRename) {
      return;
    }
    const trimmed = editNameValue.trim();
    if (trimmed.length > 0) {
      onRename(trimmed);
    }
    setIsEditingName(false);
  }, [editNameValue, onRename]);

  const cancelNameEdit = useCallback(() => {
    setEditNameValue(hero.name);
    setIsEditingName(false);
  }, [hero.name]);

  const energyRemaining = maxEnergy - energyUsedToday;
  const selectedItem = selectedSlot !== undefined ? hero.gear[selectedSlot] : null;
  const gearPower = getGearPower(hero);

  const agePhase = (() => {
    switch (getAgePhase(hero.inGameDay)) {
      case "healthy":
        return { label: "건강", color: "text-green-400" };
      case "aging":
        return { label: "노화", color: "text-orange-400" };
      case "elderly":
        return { label: "노령", color: "text-red-400" };
    }
  })();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          {canChangeCharacter && onRename !== undefined ? (
            isEditingName ? (
              <input
                className="bg-gray-800 border border-yellow-500 rounded px-1 text-white font-bold text-lg w-40 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                onBlur={commitNameEdit}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitNameEdit();
                  }
                  if (e.key === "Escape") {
                    cancelNameEdit();
                  }
                }}
                ref={nameInputRef}
                type="text"
                value={editNameValue}
              />
            ) : (
              <button
                className="text-white font-bold text-lg hover:text-yellow-300 transition-colors text-left"
                onClick={startEditName}
                type="button"
              >
                {hero.name}
              </button>
            )
          ) : (
            <span className="text-white font-bold text-lg">{hero.name}</span>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-gray-500 text-xs">Lv.{hero.level}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-sm ${agePhase.color}`}>{agePhase.label}</div>
          <div className="text-gray-400 text-xs">{hero.inGameDay} / 12일 차</div>
        </div>
      </div>

      {/* 에너지 */}
      <EnergyBar current={energyRemaining} max={maxEnergy} />

      {/* 경험치 바 */}
      <div className="flex items-center gap-3">
        <span className="text-blue-400 font-bold text-sm tracking-widest">✦ 경험치</span>
        <div className="flex-1 h-2 bg-gray-800 rounded border border-gray-700 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(1, hero.xp / hero.xpToNextLevel) * 100}%` }}
          />
        </div>
        <span className="text-gray-400 text-xs w-24 text-right">{hero.xp} / {hero.xpToNextLevel}</span>
      </div>

      {/* 명성 바 */}
      <div className="flex items-center gap-3">
        <span className="text-green-400 font-bold text-sm tracking-widest">✦ 명성</span>
        <div className="flex-1 h-2 bg-gray-800 rounded border border-gray-700 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${Math.min(100, hero.renown)}%` }}
          />
        </div>
        <span className="text-gray-400 text-xs w-24 text-right">{hero.renown}</span>
      </div>

      {/* 트라이앵글 (전쟁 / 부 / 지혜 — 합계 100%) */}
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-6 bg-gray-800 rounded border border-gray-700 overflow-hidden flex">
            <div
              className="h-full bg-red-500 transition-all shrink-0 flex items-center justify-center"
              style={{ width: `${hero.triangle.war}%`, }}
              title={`전쟁 ${hero.triangle.war}%`}
            >
              전쟁 {hero.triangle.war}%
            </div>
            <div
              className="h-full bg-blue-500 transition-all shrink-0 flex items-center justify-center"
              style={{ width: `${hero.triangle.wit}%` }}
              title={`지혜 ${hero.triangle.wit}%`}
            >
              지혜 {hero.triangle.wit}%
            </div>
            <div
              className="h-full bg-yellow-400 text-black transition-all shrink-0 flex items-center justify-center"
              style={{ width: `${hero.triangle.wealth}%` }}
              title={`부 ${hero.triangle.wealth}%`}
            >
              부 {hero.triangle.wealth}%
            </div>

          </div>
        </div>
        <div className="text-gray-500 text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-yellow-400">◈</span>
          <span className="text-white font-bold">{hero.gold}g</span>
          <span className="text-gray-600">|</span>
          <span>
            {Object.keys(hero.materials).length === 0
              ? "제작 재료 없음"
              : (Object.keys(hero.materials) as MaterialId[])
                .map((id) => {
                  const amt = hero.materials[id];
                  return `${MATERIAL_LABELS[id]}: ${String(typeof amt === "number" ? amt : 0)}`;
                })
                .join(" · ")}
          </span>
        </div>
      </div>

      {/* 장비 슬롯 */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">장착 장비</span>
        <span className="text-purple-300 font-bold text-sm">장비 점수 {gearPower}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {(Object.entries(SLOT_LABELS) as [GearSlot, string][]).map(([slot, label]) => {
          const item = hero.gear[slot];
          const isSelected = slot === selectedSlot;
          return (
            <button
              className={`bg-gray-800 border rounded p-1 text-center transition-colors ${
                isSelected ? "border-yellow-500" : "border-gray-700 hover:border-gray-500"
              }`}
              key={slot}
              onClick={() => toggleSelectedSlot(slot)}
              title={item !== null ? `${item.name} (${RARITY_LABELS[item.rarity]}) · ${formatGearStats(item.power) || "—"}` : "비어 있음"}
              type="button"
            >
              <div className="text-gray-500 text-xs">{label}</div>
              {item !== null ? (
                <div className={`text-xs font-bold truncate ${RARITY_COLOR[item.rarity] ?? "text-gray-400"}`}>
                  {item.name}
                </div>
              ) : (
                <div className="text-gray-700 text-xs">—</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedSlot != null ? <div className="bg-gray-800 border border-gray-700 rounded p-2">
        {selectedItem !== null ? (
          <div className="mt-1 space-y-1">
            <div className={`text-sm font-bold ${RARITY_COLOR[selectedItem.rarity] ?? "text-gray-400"}`}>
              {selectedItem.name}
            </div>
            <div className="text-gray-300 text-xs">
              {RARITY_LABELS[selectedItem.rarity]}
              {formatGearStats(selectedItem.power) ? ` · ${formatGearStats(selectedItem.power)}` : ""}
            </div>
          </div>
        ) : (
          <div className="mt-1 text-gray-500 text-xs">장착된 장비가 없습니다.</div>
        )}
      </div> : null}
    </div>
  );
}