import type { DailyEventDefinition, DailyEventId } from "./types";

export const DAILY_EVENTS: Record<DailyEventId, DailyEventDefinition> = {
  militia_training: {
    id: "militia_training",
    title: "광장에서의 민병대 훈련",
    description: "다가오는 포위전에 대비해 지역 민병대가 결단의 훈련을 이끌 자를 요청합니다.",
    minDay: 1,
    maxDay: 6,
    weight: 3,
    choices: [
      {
        id: "sparring",
        label: "실전 격려 훈련에 합류",
        description: "잔인한 실전 훈련에서 지휘를 맡아 향후 레이드를 위한 강철 의지를 단련합니다.",
        effects: {
          triangle: { war: 10, wit: -2, wealth: -1 },
          daring: 8,
        },
        xpGain: 240,
      },
      {
        id: "observe",
        label: "전술을 관찰·분석",
        description: "모든 실수를 연구해 정밀한 실행에 기반한 전투 계획을 재설계합니다.",
        effects: {
          triangle: { wit: 8, war: -2 },
          bossReadiness: { molten_fury: 10 },
          daring: -2,
        },
        xpGain: 210,
      },
      {
        id: "broker_supplies",
        label: "보급 계약 중재",
        description: "새벽 전 누구에게 철강과 식량이 갈지를 결정하는 긴급 전쟁 계약을 협상합니다.",
        effects: {
          triangle: { wealth: 8, wit: 2 },
          renown: 10,
        },
        xpGain: 170,
        goldGain: 130,
      },
    ],
  },
  traveling_merchant: {
    id: "traveling_merchant",
    title: "순회 상인 행렬",
    description: "무장 호위대가 유물 화물과 함께 도착해 단 한 번의 결단적 거래를 제안합니다.",
    minDay: 1,
    maxDay: 10,
    weight: 2,
    choices: [
      {
        id: "haggle",
        label: "더 좋은 마진을 위해 협상",
        description: "성공 시 며칠간 모험을 자금을 마련할 수 있는 가혹한 협상을 주도합니다.",
        effects: {
          triangle: { wealth: 10, wit: 1 },
          renown: 2,
          daring: 3,
        },
        xpGain: 160,
        goldGain: 200,
      },
      {
        id: "escort",
        label: "행렬을 안전하게 호위",
        description: "매복이 빈번한 도로를 호위하며 길 위 모든 길드의 신뢰를 얻습니다.",
        effects: {
          triangle: { war: 5, wit: 1, wealth: 1 },
          renown: 8,
          daring: 2,
        },
        xpGain: 250,
        goldGain: 100,
      },
    ],
  },
  scholar_lecture: {
    id: "scholar_lecture",
    title: "스콜로맨스의 금강 강의",
    description: "은둔한 학자가 한 명의 신뢰할 수 있는 청중에게만 금지된 레이드 교리를 공개합니다.",
    minDay: 2,
    maxDay: 12,
    weight: 2,
    choices: [
      {
        id: "attend",
        label: "강의에 참석해 노트",
        description: "강의 전체에 집중해 대부분의 영웅이 결코 보지 못하는 위험한 지식을 얻습니다.",
        effects: {
          triangle: { wit: 10, war: -2 },
          bossReadiness: { molten_fury: 20 },
          renown: 4,
          daring: -2,
        },
        xpGain: 280,
      },
      {
        id: "skip_for_contract",
        label: "유료 계약을 위해 강의 불참",
        description: "강의장을 빠져나가 유리한 사적 계약을 체결해 영향력을 곧바로 현금으로 전환합니다.",
        effects: {
          triangle: { wealth: 9, wit: -2 },
          renown: 2,
          daring: 4,
        },
        xpGain: 130,
        goldGain: 180,
      },
    ],
  },
  guild_conflict: {
    id: "guild_conflict",
    title: "길드 회의의 분쟁",
    description: "고위험 길드 분열이 폭발하며 양측 모두 당신의 공개적 지지를 요구합니다.",
    minDay: 3,
    maxDay: 18,
    weight: 1,
    choices: [
      {
        id: "mediate",
        label: "중재해 평화를 유지",
        description: "취약한 휴전을 중재해 양측이 의지하는 인물이 됩니다.",
        effects: {
          triangle: { wit: 4, wealth: 3 },
          renown: 12,
          daring: -1,
        },
        xpGain: 220,
        goldGain: 90,
      },
      {
        id: "take_risky_side",
        label: "사적 이득을 위해 한 편을 선택",
        description: "한 장군을 공개 지지해 즉시 호의를 받지만 정치적 여파를 떠안습니다.",
        effects: {
          triangle: { war: 6, wealth: 3, wit: -2 },
          renown: -4,
          daring: 10,
        },
        xpGain: 180,
        goldGain: 190,
      },
    ],
  },
};

export const DAILY_EVENT_LIST = Object.values(DAILY_EVENTS);

const RANDOM_NAMES = [
  "알드릭", "브린", "카엘룸", "다벤", "엘라라", "펜윅", "그웬", "홀트",
  "이솔데", "자린", "케사", "론", "미라", "네븐", "오린", "페트라",
  "퀸", "라엘", "소바", "손", "울릭", "베스퍼", "렌", "잔더",
  "야엘", "조라", "아샤", "보웬", "코라", "다크", "에본", "피라",
  "가운트", "헤사", "이드리스", "조릭", "코바", "리사", "마렌", "닉스",
];

export function randomHeroName(): string {
  const i = Math.floor(Math.random() * RANDOM_NAMES.length);
  return RANDOM_NAMES[i] ?? "알드릭";
}