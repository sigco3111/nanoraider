// 중앙화된 한국어 라벨 매핑
// 식별자(영문)는 그대로 두고 표시 텍스트만 한국어로 매핑합니다.

import type { GameScreen } from "./types";

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

export const SLOT_LABELS: Record<string, string> = {
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