import type { GearItem } from "./types";

export const GEAR_ITEMS: Record<string, GearItem> = {
  // 레이드 드롭 (영웅 등급)
  eternal_helm: {
    id: "eternal_helm",
    name: "영원의 투구",
    slot: "head",
    rarity: "purple",
    power: 100,
  },
  infernal_greatblade: {
    id: "infernal_greatblade",
    name: "지옥불 대검",
    slot: "mainhand",
    rarity: "purple",
    power: 100,
  },
  ember_aegis: {
    id: "ember_aegis",
    name: "잿불 방패",
    slot: "offhand",
    rarity: "purple",
    power: 100,
  },
  pyrebound_legs: {
    id: "pyrebound_legs",
    name: "잿불연 갑각",
    slot: "legs",
    rarity: "purple",
    power: 100,
  },
  throneguard_chest: {
    id: "throneguard_chest",
    name: "왕좌수호 흉갑",
    slot: "chest",
    rarity: "purple",
    power: 100,
  },
  crown_of_ashes: {
    id: "crown_of_ashes",
    name: "재의 왕관",
    slot: "head",
    rarity: "purple",
    power: 100,
  },

  // 의뢰 강화 (골드 싱크)
  enchanters_focus: {
    id: "enchanters_focus",
    name: "마법사 집중구",
    slot: "offhand",
    rarity: "blue",
    power: 60,
  },
  runed_warblade: {
    id: "runed_warblade",
    name: "룬 전쟁도",
    slot: "mainhand",
    rarity: "blue",
    power: 60,
  },
  gilded_bulwark: {
    id: "gilded_bulwark",
    name: "금박 강철벽",
    slot: "offhand",
    rarity: "blue",
    power: 60,
  },
} satisfies Record<string, GearItem>;