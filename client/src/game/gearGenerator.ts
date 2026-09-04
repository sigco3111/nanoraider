import type {
  ArmorSlot,
  ArmorWeight,
  GearItem,
  GearRarity,
  GearSlot,
  GearSlots,
  Hero,
  HeroClass,
  WeaponSlot,
} from "../data/types";
import { STARTING_GEAR_SPEC } from "./character";
import { formatGearPower } from "../data/labels";

const CLASS_ARMOR_WEIGHT: Record<HeroClass, ArmorWeight> = {
  warrior: "plate",
  rogue: "leather",
  mage: "cloth",
  guardian: "plate",
  bard: "leather",
};

const CLASS_ADJECTIVES: Record<HeroClass, Record<GearRarity, string[]>> = {
  warrior: {
    gray: ["녹슨", "해진", "거친", "손상된", "평범한", "흠집 난", "질긴", "훈련된"],
    green: ["철강의", "단련된", "견고한", "바위결의", "전투의", "강철결의", "끈질긴", "전쟁의"],
    blue: ["선봉의", "방패의", "폭풍의", "용사의", "용맹의", "사자수호의", "공성의", "끝없는"],
    purple: ["운명의", "왕실근위", "거신의", "전장의", "제왕의", "신강철", "세계파괴", "영원의"],
  },
  rogue: {
    gray: ["흐릿한", "해진", "천 조각", "얼룩진", "흐려진", "해어진", "긁힌", "구부러진"],
    green: ["그림자", "고요한", "밤짜임의", "신속한", "속삭임의", "교활한", "황혼의", "장막의"],
    blue: ["유령의", "독니", "달그림자", "기습의", "안개결의", "그늘의", "유령발걸음", "야경의"],
    purple: ["죽음속삭임", "공허의 이빨", "밤군주의", "영혼그림자", "일식의", "암살자의", "끝없는 황혼", "심연의"],
  },
  mage: {
    gray: ["바랜", "찢어진", "해진", "먼지 덮인", "해어진", "초라한", "소박한", "흐릿한"],
    green: ["비전의", "룬의", "빛나는", "마력결의", "신비의", "주문짜임의", "속삭이는", "불꽃의"],
    blue: ["별의", "에테르의", "별결의", "서릿빛인장", "폭풍인장", "공허의", "달빛의", "현자의"],
    purple: ["에테리얼", "우주의", "대마법사의", "저편결의", "현실파열의", "천상의", "무한의", "신화의"],
  },
  guardian: {
    gray: ["흠집 난", "해진", "무거운", "보강된", "평범한", "긁힌", "두꺼운", "거친"],
    green: ["철갑의", "강인한", "방패의", "지속되는", "견고한", "요새의", "단호한", "움직이지 않는"],
    blue: ["이지스의", "요새의", "흔들리지 않는", "강철의", "파수꾼의", "수호인장", "탑의", "무적의"],
    purple: ["거신벽", "주권수호", "영원의방패", "세계방패", "완전무결", "신성방패", "무적의", "무적의"],
  },
  bard: {
    gray: ["해어진", "해진", "바랜", "기워진", "평범한", "흐려진", "먼지 덮인", "초라한"],
    green: ["노래의", "명랑한", "활기찬", "매력적인", "은 tongue의", "매혹적인", "요술적인", "선율의"],
    blue: ["울림의", "화성의", "소야곡의", "술수에 빠지는", "황홀한", "사로잡는", "고무하는", "전설결의"],
    purple: ["교향의", "영원의 발라드", "신화짜임", "세계노래", "예언자의 리라", "공허찬가", "천상의 노래", "초월의"],
  },
};

const ARMOR_TYPES: Record<HeroClass, Record<ArmorSlot, Record<GearRarity, string[]>>> = {
  warrior: {
    head: { gray: ["두건", "코이프"], green: ["투구", "살렛"], blue: ["투구", "면갑"], purple: ["전투투구", "전투왕관"] },
    chest: { gray: ["조끼", "저킨"], green: ["호버크", "큐이라스"], blue: ["흉갑", "가슴갑"], purple: ["전쟁판금", "이지스판금"] },
    legs: { gray: ["바지", "각반"], green: ["다리갑", "털구"], blue: ["다리판금", "다리갑옷"], purple: ["전쟁다리갑", "대각반"] },
  },
  rogue: {
    head: { gray: ["마스크", "후드"], green: ["코울", "머리둘레"], blue: ["바이저", "그림자 가면"], purple: ["밤의 가면", "유령의 후드"] },
    chest: { gray: ["저킨", "조끼"], green: ["가죽코트", "브리건다인"], blue: ["그림자조끼", "밤수호"], purple: ["어스퀴드", "고요의 갑옷"] },
    legs: { gray: ["바지", "긴 바지"], green: ["각반", "스트라이더"], blue: ["밤바지", "미끄럼방지"], purple: ["유령스트라이더", "환영의 보행"] },
  },
  mage: {
    head: { gray: ["후드", "코울"], green: ["서클릿", "디아뎀"], blue: ["티아라", "문장"], purple: ["코로넷", "정신왕관"] },
    chest: { gray: ["튜닉", "외투"], green: ["로브", "제복"], blue: ["예복", "주문로브"], purple: ["레이먼트", "비전로브"] },
    legs: { gray: ["바지", "긴 바지"], green: ["각반", "트라우저"], blue: ["다리감개", "킬트"], purple: ["주문짜임", "비단경비"] },
  },
  guardian: {
    head: { gray: ["두건", "코이프"], green: ["대투구", "바스시네트"], blue: ["면갑", "수호투구"], purple: ["요새투구", "불사의 왕관"] },
    chest: { gray: ["조끼", "호버크"], green: ["큐이라스", "브리건다인"], blue: ["가슴갑", "요새판금"], purple: ["이지스판금", "주권수호"] },
    legs: { gray: ["긴 바지", "각반"], green: ["그리브", "털구"], blue: ["다리갑", "탑의 다리"], purple: ["대각반", "무적의 보행자"] },
  },
  bard: {
    head: { gray: ["두건", "밴드"], green: ["서클릿", "깃털왕관"], blue: ["디아뎀", "요술의 문장"], purple: ["신화짜임 왕관", "천상의 리라 왕관"] },
    chest: { gray: ["튜닉", "조끼"], green: ["더블렛", "공연로브"], blue: ["요술의 조끼", "화성튜닉"], purple: ["교향레이먼트", "전설의 의상"] },
    legs: { gray: ["바지", "긴 바지"], green: ["각반", "스트라이더"], blue: ["공연 바지", "매혹다리감개"], purple: ["발라드 보행자", "영원노래 각반"] },
  },
};

const WEAPON_NAMES: Record<HeroClass, Record<WeaponSlot, Record<GearRarity, string[]>>> = {
  warrior: {
    mainhand: { gray: ["녹슨 검"], green: ["철 도끼", "용병 도끼"], blue: ["전쟁군주", "용암의 칼날"], purple: ["세계파열자", "운명의 검"] },
    offhand: { gray: ["흠집 난 버클러"], green: ["철벽방패", "리벳강방패"], blue: ["요새의 벽", "탑방패"], purple: ["격노의 이지스", "폭풍수호"] },
  },
  rogue: {
    mainhand: { gray: ["무딘 단검"], green: ["빠른 이빨", "뒷골목 비수"], blue: ["밤의 이빨", "유령검"], purple: ["침묵의 검", "환영의 이빨"] },
    offhand: { gray: ["녹슨 비수"], green: ["옆이빨", "숨겨진 단검"], blue: ["속삭임의 비수", "황혼베기"], purple: ["그림자물기", "두번째 침묵"] },
  },
  mage: {
    mainhand: { gray: ["금이 간 지팡이"], green: ["룬나무 지팡이", "주문가지"], blue: ["별의 홀", "마력불 지팡이"], purple: ["별부름 지팡이", "비전 첨탑"] },
    offhand: { gray: ["바랜 오브"], green: ["유리 오브", "소마법서"], blue: ["에테르 오브", "주문서"], purple: ["우주의 유물", "잿불의 고서"] },
  },
  guardian: {
    mainhand: { gray: ["녹슨 철퇴"], green: ["철 철퇴", "수호 망치"], blue: ["요새 철퇴", "탑의 망치"], purple: ["이지스 철퇴", "완전방패 철퇴"] },
    offhand: { gray: ["흠집 난 버클러"], green: ["철벽방패", "리벳강방패"], blue: ["요새의 벽", "탑방패"], purple: ["수호자의 이지스", "부서지지 않는 벽"] },
  },
  bard: {
    mainhand: { gray: ["해진 류트"], green: ["은실 류트", "여행자의 리라"], blue: ["울림의 류트", "요술의 하프"], purple: ["교향 리라", "영원의 발라드"] },
    offhand: { gray: ["주석 휘슬"], green: ["손북", "주머니 피리"], blue: ["화성 종", "주문탬버린"], purple: ["신화짜임 악기", "천상의 방울"] },
  },
};

const STAT_BUDGET_TABLE: Record<GearRarity, { base: number; perLevel: number }> = {
  gray: { base: 5, perLevel: 2 },
  green: { base: 10, perLevel: 3 },
  blue: { base: 15, perLevel: 5 },
  purple: { base: 25, perLevel: 7 },
};

const GEAR_SLOTS: GearSlot[] = ["head", "chest", "legs", "mainhand", "offhand"];
const ARMOR_SLOTS: ArmorSlot[] = ["head", "chest", "legs"];

function randomFrom<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function adjectiveFromName(name: string): string | null {
  const [adjective] = name.split(" ");
  return adjective ?? null;
}

function statBudgetForLevel(rarity: GearRarity, level: number): number {
  const { base, perLevel } = STAT_BUDGET_TABLE[rarity];
  return base + level * perLevel;
}

export function sumGearStats(item: GearItem): number {
  return item.power;
}

function maybeMatchExistingAdjective(heroClass: HeroClass, rarity: GearRarity, level: number, existingGear: GearSlots): string | null {
  const allowedAdjectives = new Set(CLASS_ADJECTIVES[heroClass][rarity]);
  const expectedBudget = statBudgetForLevel(rarity, level);
  const candidates = Object.values(existingGear).filter((item): item is GearItem => item !== null)
    .filter((item) => item.rarity === rarity && Math.abs(sumGearStats(item) - expectedBudget) <= 20)
    .map((item) => adjectiveFromName(item.name))
    .filter((adj): adj is string => adj !== null && allowedAdjectives.has(adj));

  if (candidates.length === 0 || Math.random() > 0.7) {
    return null;
  }
  return randomFrom(candidates);
}

function armorNameFor(heroClass: HeroClass, slot: ArmorSlot, rarity: GearRarity, level: number, existingGear: GearSlots): string {
  const preferred = maybeMatchExistingAdjective(heroClass, rarity, level, existingGear);
  const adjective = preferred ?? randomFrom(CLASS_ADJECTIVES[heroClass][rarity]);
  const clothingType = randomFrom(ARMOR_TYPES[heroClass][slot][rarity]);
  return `${adjective} ${clothingType}`;
}

function weaponNameFor(heroClass: HeroClass, slot: WeaponSlot, rarity: GearRarity): string {
  return randomFrom(WEAPON_NAMES[heroClass][slot][rarity]);
}

function buildGeneratedItemId(heroClass: HeroClass, slot: GearSlot, rarity: GearRarity): string {
  const nonce = Math.random().toString(36).slice(2, 8);
  return `generated_${heroClass}_${slot}_${rarity}_${Date.now()}_${nonce}`;
}

export function getGearPower(hero: Hero): number {
  return Object.values(hero.gear).reduce((sum, item) => sum + (item?.power ?? 0), 0);
}

/** Expected aggregate gear power for a fresh hero (uses characterCreation config). */
export function getExpectedFreshHeroGearPower(_heroClass: HeroClass): number {
  let result = 0;
  const budget = statBudgetForLevel(STARTING_GEAR_SPEC.rarity, STARTING_GEAR_SPEC.level);
  for (const slot of STARTING_GEAR_SPEC.slots) {
    void slot;
    result += budget;
  }
  return result;
}

export function formatGearStats(power: number): string {
  return formatGearPower(power);
}

export function getArmorWeightForClass(heroClass: HeroClass): ArmorWeight {
  return CLASS_ARMOR_WEIGHT[heroClass];
}

export function randomHeroClass(): HeroClass {
  return randomFrom(["warrior", "rogue", "mage", "guardian", "bard"] as const);
}

export function randomGearSlot(): GearSlot {
  return randomFrom(GEAR_SLOTS);
}

export function generateGear(
  heroClass: HeroClass,
  slot: GearSlot,
  rarity: GearRarity,
  level: number,
  existingGear: GearSlots,
): GearItem {
  const name = ARMOR_SLOTS.includes(slot as ArmorSlot)
    ? armorNameFor(heroClass, slot as ArmorSlot, rarity, level, existingGear)
    : weaponNameFor(heroClass, slot as WeaponSlot, rarity);

  const power = statBudgetForLevel(rarity, level);

  return {
    id: buildGeneratedItemId(heroClass, slot, rarity),
    name,
    slot,
    rarity,
    power,
  };
}
