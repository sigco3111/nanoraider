import type { RaidGate, TownspersonDefinition, TownspersonRoleId } from "./types";

export const RAID_GATE_LABELS: Record<RaidGate, string> = {
  none: "전초기지 주민",
  molten_fury: "잿불격노 생존자",
  eternal_throne: "영원의 왕좌 정복자",
};

export const TOWNSPEOPLE: Record<TownspersonRoleId, TownspersonDefinition> = {
  battlemaster: {
    id: "battlemaster",
    name: "전투대장",
    raidGate: "none",
    description: "전투의 기술을 완전히 익힌 베테랑 전사입니다.",
    lore: "그들은 망설임 없이 싸웠고, 모든 전장을 교훈의 장으로 바꾸었습니다.",
    unlockCondition: {
      minTriangle: { war: 55 },
      minDaring: 30,
    },
    bonuses: {
      energyBonus: 5,
      combatBonus: 0.08,
    },
    hint: "전쟁 수치를 높이고 위험을 기꺼이 감수하세요. 위험한 던전은 전쟁을 빠르게 끌어올립니다.",
  },

  lorekeeper: {
    id: "lorekeeper",
    name: "지식의 관리인",
    raidGate: "none",
    description: "준비에 집착한 학자입니다.",
    lore: "읽은 모든 두루마리, 암기한 모든 전술. 그들의 지식은 전투보다 오래 살아남았습니다.",
    unlockCondition: {
      minTriangle: { wit: 55 },
      minBossReadiness: { molten_fury: 25 },
    },
    bonuses: {
      energyBonus: 5,
      bossReadinessBonus: 0.05,
      knowledgeTransferMultiplier: 1.5,
    },
    hint: "보스를 반복 연구하고 지혜 수치에 크게 투자하세요.",
  },

  quartermaster: {
    id: "quartermaster",
    name: "군수관",
    raidGate: "none",
    description: "돈을 힘으로 바꾼 상인입니다.",
    lore: "골드는 어디에 쓸지 아는 자에게 흘러갑니다. 그들의 부는 모든 다음 모험을 가능케 합니다.",
    unlockCondition: {
      minTriangle: { wealth: 55 },
      minGoldAtDeath: 400,
    },
    bonuses: {
      energyBonus: 5,
      startGold: 40,
      vendorDiscountPct: 0.06,
    },
    hint: "부를 쌓고 죽을 때 골드를 꼭 잡으세요.",
  },

  trailblazer: {
    id: "trailblazer",
    name: "개척자",
    raidGate: "none",
    description: "다른 이들이 위험으로만 본 곳에서 영광을 찾은 무모한 선구자입니다.",
    lore: "그들은 위험을 향해 달려갔습니다. 모든 흉터는 들을 만한 이야기를 품고 있습니다.",
    unlockCondition: {
      minDaring: 55,
      minTriangle: { war: 25 },
    },
    bonuses: {
      energyBonus: 5,
      combatBonus: 0.05,
      recipeDiscountPct: 0.06,
    },
    hint: "위험하게 살아가세요. 대담함은 위험한 선택에서 자라납니다.",
  },

  herald: {
    id: "herald",
    name: "전령관",
    raidGate: "none",
    description: "평판이 모든 문을 열어버린 사회의 거인입니다.",
    lore: "명성 자체가 통화입니다. 그들의 이름만으로 존경을 얻었습니다.",
    unlockCondition: {
      minRenown: 50,
      minTriangle: { wealth: 15 },
    },
    bonuses: {
      energyBonus: 5,
      startGold: 25,
      vendorDiscountPct: 0.04,
    },
    hint: "사회 활동과 길드 회의로 명성을 쌓으세요.",
  },

  forgemaster: {
    id: "forgemaster",
    name: "대장장이",
    raidGate: "molten_fury",
    description: "가장 강력한 장비를 만든 레이드 생존자입니다.",
    lore: "불 속을 걸으며 완벽의 청사진을 가지고 돌아왔습니다.",
    unlockCondition: {
      mustDefeatRaids: ["molten_fury"],
      minBossReadiness: { molten_fury: 60 },
      minTriangle: { wit: 25, war: 25 },
    },
    bonuses: {
      energyBonus: 8,
      purpleCraftStatBonusPct: 0.08,
      recipeDiscountPct: 0.06,
      brokerTierStart: 2,
    },
    hint: "깊은 준비와 균형 잡힌 지혜/전쟁으로 잿불격노를 처치하세요.",
  },

  warchief: {
    id: "warchief",
    name: "전장대장",
    raidGate: "molten_fury",
    description: "전투 숙달을 전설로 만든 레이드 이후의 전장군주입니다.",
    lore: "잿불격노를 처치한 뒤 그들은 막을 수 없게 되었습니다.",
    unlockCondition: {
      mustDefeatRaids: ["molten_fury"],
      minTriangle: { war: 45 },
      minDaring: 45,
      minRenown: 25,
    },
    bonuses: {
      energyBonus: 8,
      combatBonus: 0.12,
      bossReadinessBonus: 0.05,
    },
    hint: "높은 전쟁, 대담함, 명성을 갖춘 채 잿불격노를 처치하세요.",
  },

  siegebreaker: {
    id: "siegebreaker",
    name: "공성파괴자",
    raidGate: "eternal_throne",
    description: "영원의 왕좌 자체를 정복한 궁극의 영웅입니다.",
    lore: "적도, 요새도, 신도 그들을 막을 수 없었습니다. 그들의 전설은 영원히 울립니다.",
    unlockCondition: {
      mustDefeatRaids: ["eternal_throne"],
      minTriangle: { war: 20, wit: 20, wealth: 15 },
      minDaring: 50,
      minRenown: 30,
      minBossReadiness: { eternal_throne: 70 },
    },
    bonuses: {
      energyBonus: 12,
      combatBonus: 0.1,
      bossReadinessBonus: 0.08,
      knowledgeTransferMultiplier: 2.5,
      purpleCraftStatBonusPct: 0.06,
      raidProvisionerUnlocked: true,
    },
    hint: "모든 차원에서 숙달을 갖춘 채 영원의 왕좌를 처치하세요.",
  },
};

export const TOWNSPERSON_LIST = Object.values(TOWNSPEOPLE);

export const AP_UPGRADES = [
  {
    id: "energy_10" as const,
    name: "최대 에너지 +10",
    description: "일일 에너지 한도를 영구히 10 늘립니다.",
    cost: 50,
    maxPurchases: 5,
  },
  {
    id: "start_gold_100" as const,
    name: "100 골드로 시작",
    description: "모든 새로운 영웅이 100 골드로 여정을 시작합니다.",
    cost: 500,
    maxPurchases: 1,
  },
  {
    id: "vendor_reroll_1" as const,
    name: "일일 상인 리롤",
    description: "게임 내 하루마다 수동 상인 리롤을 한 번 얻습니다.",
    cost: 350,
    maxPurchases: 1,
  },
];