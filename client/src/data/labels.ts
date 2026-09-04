// 중앙화된 한국어 라벨 매핑
// 식별자(영문)는 그대로 두고 표시 텍스트만 한국어로 매핑합니다.

import type { ActivityId, BossId, DailyEventId, GameScreen, GearRarity, GearSlot, MaterialId, RecipeId, TownspersonRoleId, VendorId } from "./types";

export const SCREEN_LABELS: Record<GameScreen, string> = {
  main_menu: "메인 메뉴",
  hero_creation: "영웅 생성",
  planning: "일과 계획",
  daily_event: "무작위 이벤트",
  day_results: "하루 결과",
  death: "영웅의 최후",
  collection: "전초기지",
  upgrades: "업그레이드",
};

export const TRIANGLE_LABEL: Record<"war" | "wit" | "wealth", string> = {
  war: "전쟁",
  wit: "지혜",
  wealth: "부",
};

export const AGE_PHASE_LABEL: Record<"healthy" | "aging" | "elderly", string> = {
  healthy: "건강",
  aging: "노화",
  elderly: "노령",
};

export const SLOT_LABELS: Record<GearSlot, string> = {
  head: "머리",
  chest: "가슴",
  legs: "다리",
  mainhand: "주무기",
  offhand: "보조",
};

export const CATEGORY_LABELS: Record<string, string> = {
  combat: "전투",
  economic: "경제",
  knowledge: "지식",
  social: "사회",
  general: "일반",
};

export const RISK_BAND_LABELS: Record<string, string> = {
  safe: "안전",
  manageable: "관리 가능",
  dangerous: "위험",
  lethal: "치명적",
};

export const BOSS_LABEL: Record<BossId, string> = {
  molten_fury: "잿불격노",
  eternal_throne: "영원의 왕좌",
};

export const RARITY_KR: Record<GearRarity, string> = {
  gray: "일반",
  green: "고급",
  blue: "희귀",
  purple: "영웅",
};

export const RARITY_SHORT_KR: Record<GearRarity, string> = {
  gray: "일반",
  green: "고급",
  blue: "희귀",
  purple: "영웅",
};

// ─── 일차 차단 사유 / 잠금 안내 (한국어) ───────────────────────────────────
export const BLOCK_REASON_ENERGY = (have: number, need: number): string => `에너지 ${have}/${need}`;
export const BLOCK_REASON_GOLD = (have: number, need: number): string => `골드 ${have}/${need}개`;
export const BLOCK_REASON_LEVEL = (need: number): string => `레벨 ${need}`;
export const BLOCK_REASON_RENOWN = (have: number, need: number): string => `명성 ${have}/${need}`;
export const BLOCK_REASON_DARING = (have: number, need: number): string => `대담함 ${have}/${need}`;
export const BLOCK_REASON_DARING_MAX = (have: number, max: number): string => `대담함 ${have}/${max} 이하`;
export const BLOCK_REASON_RAID_DEATH = "레이드에서 한 번 죽어야 함";
export const BLOCK_REASON_DAILY_LIMIT = (have: number, max: number): string => `일일 한도 ${have}/${max}`;
export const BLOCK_REASON_TRIANGLE_MIN = (axis: string, have: number, need: number): string => {
  const label = (TRIANGLE_LABEL as Record<string, string>)[axis] ?? axis;
  return `${label} ${have}/${need}`;
};
export const BLOCK_REASON_TRIANGLE_MAX = (axis: string, have: number, max: number): string => {
  const label = (TRIANGLE_LABEL as Record<string, string>)[axis] ?? axis;
  return `${label} ${have} 이하 (${max})`;
};
export const BLOCK_REASON_BOSS_READINESS = (bossId: string, have: number, need: number): string => {
  const label = (BOSS_LABEL as Record<string, string>)[bossId] ?? bossId;
  return `${label} 준비도 ${have}/${need}`;
};
export const BLOCK_REASON_GEAR_GREEN = (have: number, need: number): string => `고급+ 장비 ${have}/${need}슬롯`;
export const BLOCK_REASON_GEAR_BLUE = (have: number, need: number): string => `희귀+ 장비 ${have}/${need}슬롯`;
export const BLOCK_REASON_GEAR_PURPLE = (have: number, need: number): string => `영웅 장비 ${have}/${need}슬롯`;

// ─── 리스크 힌트 ────────────────────────────────────────────────────────────
export const RISK_HINT_NO_LETHAL = "치명적 위험 없음";
export const RISK_HINT_GEAR_FLOOR = "장비 부족으로 사망 확률 보장됨";
export const RISK_HINT_UNDER_LEVELED = "레벨 부족";
export const RISK_HINT_OVER_LEVELED = "레벨 여유";
export const RISK_HINT_GOOD_GEAR = "장비 양호";
export const RISK_HINT_WELL_PREPARED = "준비 양호";
export const RISK_HINT_LEGACY_BONUS = "유산 보너스";
export const RISK_HINT_ELDERLY = "노령";
export const RISK_HINT_HIGH_STATS = "스탯 충분";

// 장비 준비 라벨 (resolveReadinessFloor)
export const READINESS_LABEL_NOT_FULL_GREEN = "고급 장비도 풀이 아님";
export const READINESS_LABEL_GEAR_SHORT_GREEN = "장비 부족 (고급+ 슬롯 부족)";
export const READINESS_LABEL_GEAR_SHORT_BLUE = "장비 부족 (희귀+ 슬롯 부족)";
export const READINESS_LABEL_GEAR_SHORT_PURPLE = "장비 부족 (영웅 슬롯 부족)";
export const READINESS_LABEL_PREP_INCOMPLETE = "준비 부족";
export const READINESS_LABEL_READY = "준비 완료";

export const READINESS_METRIC_KR: Record<"greenPlusSlots" | "bluePlusSlots" | "purpleSlots", string> = {
  greenPlusSlots: "고급+ 슬롯",
  bluePlusSlots: "희귀+ 슬롯",
  purpleSlots: "영웅 슬롯",
};

// ─── 거래 라벨 (gameStore 거래 내역) ──────────────────────────────────────
export const TX_REROLL_VENDOR = (vendorKr: string): string => `${vendorKr} 진열 리롤`;
export const TX_BUY_OFFER = (offerName: string): string => `${offerName} 구매`;
export const TX_CRAFT = (rarityKr: string, slotKr: string): string => `${rarityKr} ${slotKr} 제작`;

// ─── 상인 한국어 라벨 ──────────────────────────────────────────────────────
export const VENDOR_LABEL: Record<VendorId, string> = {
  quartermaster: "군수관",
  artisan: "장인",
  broker: "중개상",
  raid_provisioner: "레이드 보급병",
};

// ─── 활동 한국어 라벨 (영문 식별자 → 한국어) ───────────────────────────────
export const ACTIVITY_KR: Record<ActivityId, string> = {
  quest: "퀘스트 수행",
  dungeon_irondeep: "철심광산 던전",
  dungeon_whispering_crypts: "속삭이는 지하묘지",
  dungeon_scholomance: "스콜로맨스",
  dungeon_blackrock: "검은바위 던전",
  farm_gold: "골드 파밍",
  study_boss: "보스 연구",
  analyze_logs: "전투 로그 분석",
  training_dummy: "훈련 인형 세션",
  raid_rehearsal: "레이드 리허설",
  raid_molten_fury: "레이드: 잿불격노",
  raid_eternal_throne: "최종 레이드: 영원의 왕좌",
  host_guild_meeting: "길드 회의 주최",
  black_market_trading: "암거래상 거래",
  buy_raid_supplies: "레이드 보급 구매",
  commission_enchant: "마법부여 의뢰",
};

// ─── 일간 이벤트 한국어 라벨 ───────────────────────────────────────────────
export const EVENT_LABEL_KR: Record<DailyEventId, string> = {
  militia_training: "광장에서의 민병대 훈련",
  traveling_merchant: "순회 상인 행렬",
  scholar_lecture: "스콜로맨스의 금강 강의",
  guild_conflict: "길드 회의의 분쟁",
};

// ─── 주민 한국어 이름(전초기지 recommendation/거의-힌트) ─────────────────
export const TOWNSPERSON_KR: Record<TownspersonRoleId, string> = {
  battlemaster: "전투대장",
  quartermaster: "군수관",
  lorekeeper: "지식의 관리인",
  trailblazer: "개척자",
  herald: "전령관",
  forgemaster: "대장장이",
  warchief: "전장대장",
  siegebreaker: "공성파괴자",
};

// ─── 트라이앵글 축 키 한국어 ────────────────────────────────────────────────
export const TRIANGLE_AXIS_KR: Record<"war" | "wit" | "wealth", string> = {
  war: "전쟁",
  wit: "지혜",
  wealth: "부",
};

// ─── 전초기지 추천 "살아남은 이유" 메시지 ─────────────────────────────────
export const WHY_UNLOCKED_BATTLEMASTER = (war: number, daring: number): string => `전쟁 쪽으로 성장한 영웅(전쟁 ${war}%)이었고 대담함도 ${daring}에 달했습니다.`;
export const WHY_UNLOCKED_LOREKEEPER = (wit: number, readiness: number): string => `지식에 투자하고 보스를 정밀히 준비한 학자형 영웅이었습니다(지혜 ${wit}%, 잿불격노 준비도 ${readiness}%).`;
export const WHY_UNLOCKED_QUARTERMASTER = (wealth: number, gold: number): string => `경제적 성장을 우선시했고(부 ${wealth}%) 생을 마감할 때 ${gold}골드를 쥐고 있었습니다.`;
export const WHY_UNLOCKED_TRAILBLAZER = (daring: number, war: number): string => `위험을 향해 돌진했습니다(대담함 ${daring}, 전쟁 ${war}%) — 모든 흉터가 이야기가 되었습니다.`;
export const WHY_UNLOCKED_HERALD = (renown: number, wealth: number): string => `사회적 명성을 쌓았습니다(명성 ${renown})와 부의 뒷받침(부 ${wealth}%).`;
export const WHY_UNLOCKED_FORGEMASTER = (wit: number, war: number): string => `균형 잡힌 지혜/전쟁(지혜 ${wit}%, 전쟁 ${war}%)으로 잿불격노를 제련해냈습니다.`;
export const WHY_UNLOCKED_WARCHIEF = (war: number, daring: number, renown: number): string => `압도적인 전쟁(${war}%), 대담함(${daring}), 명성(${renown})으로 잿불격노를 정복했습니다.`;
export const WHY_UNLOCKED_SIEGEBREAKER = (war: number, wit: number, wealth: number, daring: number): string => `모든 차원에서 완벽했습니다 — 전쟁 ${war}%, 지혜 ${wit}%, 부 ${wealth}%, 대담함 ${daring}.`;

// ─── 전초기지 거의-힌트 메시지 토큰 ───────────────────────────────────────
export const NEAR_MISS_MORE_TRIANGLE = (axis: string, delta: number): string => {
  const label = (TRIANGLE_AXIS_KR as Record<string, string>)[axis] ?? axis;
  return `${label} ${delta} 더 필요`;
};
export const NEAR_MISS_LESS_TRIANGLE = (axis: string, delta: number): string => {
  const label = (TRIANGLE_AXIS_KR as Record<string, string>)[axis] ?? axis;
  return `${label} ${delta} 줄여야 함`;
};
export const NEAR_MISS_MORE_RENOWN = (delta: number): string => `명성 ${delta} 더 필요`;
export const NEAR_MISS_MORE_DARING = (delta: number): string => `대담함 ${delta} 더 필요`;
export const NEAR_MISS_LESS_DARING = (delta: number): string => `대담함 ${delta} 줄여야 함`;
export const NEAR_MISS_MORE_GOLD = (delta: number): string => `골드 ${delta}개 더 필요`;
export const NEAR_MISS_MORE_READINESS = (bossKr: string, delta: number): string => `${bossKr} 준비도 ${delta}% 더 필요`;
export const NEAR_MISS_DEFEAT_RAID = (bossKr: string): string => `${bossKr} 처치 필요`;

// ─── 장비 점수 포맷 ──────────────────────────────────────────────────────
export const formatGearPower = (power: number): string => `전투력 ${power}`;

// ─── 도메인 슬롯/소재 매핑(편의용) ────────────────────────────────────────
export const SLOT_KR: Record<GearSlot, string> = SLOT_LABELS;
export const MATERIAL_KR: Record<MaterialId, string> = {
  iron_shards: "철 조각",
  arcane_essence: "비전 정수",
  ember_core: "잿불 핵",
  vault_relic: "금고 유물",
};

// ─── 장비 슬롯 약어(트랜잭션 로그용) ──────────────────────────────────────
export const SLOT_SHORT_KR: Record<GearSlot, string> = {
  head: "머리",
  chest: "가슴",
  legs: "다리",
  mainhand: "주무기",
  offhand: "보조무기",
};

// ─── 일간 이벤트 ID 표시용(보조) ──────────────────────────────────────────
export const EVENT_ID_LABEL_KR: Record<string, string> = {
  militia_training: "광장 민병대 훈련",
  traveling_merchant: "순회 상인 행렬",
  scholar_lecture: "학자의 금강 강의",
  guild_conflict: "길드 분쟁",
};

// 타입 보강용 (RecipeId는 거래 표기에는 사용되지 않으므로 제외)
export type _RecipeIdUnused = RecipeId;
