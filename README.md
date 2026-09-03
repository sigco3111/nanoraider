# 나노레이더 (NanoRaider)

> 로그라이크에서 영감을 받은 프로토타입 관리 시뮬레이션 — 당신의 플레이 스타일과 결정이 영웅이 남길 유산의 종류를 결정합니다.

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://sigco3111.github.io/nanoraider/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Language: 한국어](https://img.shields.io/badge/language-한국어-red)](#)

## 🎮 지금 플레이하기

**라이브 데모:** [https://sigco3111.github.io/nanoraider/](https://sigco3111.github.io/nanoraider/)

진행 상황은 브라우저의 로컬 저장소에 자동으로 저장됩니다 — 계정 없이 바로 시작하세요.

---

## 📖 게임 소개

**나노레이더**는 한 모험이 몇 분이면 끝나는 가벼운 로그라이크 관리 시뮬레이션입니다. 영웅이 매일 어떤 행동을 하느냐에 따라 **전쟁·지혜·부** 트라이앵글과 **명성**, 숨겨진 **대담함** 수치가 변합니다. 영웅이 죽거나 은퇴하면, 그들은 전초기지 주민으로 정착해 다음 영웅에게 **영구 보너스**를 남깁니다.

영감 원천:
- **Melvor Idle** — 가벼운 매니지먼트 진행
- **World of Warcraft** — 던전·레이드 메커니즘
- **Slay the Spire** — 매일의 위험한 선택
- **Stardew Valley** — 주민과 유산
- **Reigns** — 좌-우 선택의 흐름

---

## ✨ 핵심 특징

| 특징 | 설명 |
|------|------|
| 🎯 **15가지 활동** | 퀘스트, 4개 던전, 연구/훈련, 레이드(2종), 사회 활동, 경제 활동 |
| ⚔ **치명적인 레이드** | 잿불격노, 영원의 왕좌 — 죽음의 부담이 큰 보스전 |
| 🏰 **전초기지 메타 진행** | 생존한 영웅이 영구 보너스(전투, 연구, 시작 골드 등)를 제공 |
| 📈 **3축 성장 시스템** | 전쟁·지혜·부 트라이앵글과 명성·대담함 |
| 🛡 **장비 등급 시스템** | 일반 → 고급 → 희귀 → 영웅, 슬롯별 청사진 해금 |
| 🤝 **다중 상인** | 군수관, 장인, 중개상, 레이드 보급병 |
| 💾 **자동 저장** | 브라우저 localStorage에 진척 자동 저장 |

---

## 🚀 시작하기

### 온라인으로 플레이 (권장)

[라이브 데모](https://sigco3111.github.io/nanoraider/)를 브라우저에서 여세요. 추가 설치가 필요 없습니다.

### 로컬에서 실행

```bash
git clone https://github.com/sigco3111/nanoraider.git
cd nanoraider/client
npm install
npm run dev
```

Vite가 표시하는 로컬 URL을 브라우저에서 여세요 (보통 `http://localhost:5173`).

### 빌드

```bash
cd client
npm run build       # TypeScript 검사 + Vite 프로덕션 빌드
npm run preview     # 빌드된 결과물을 로컬에서 미리보기
```

빌드 결과물은 `client/dist/`에 생성됩니다. 정적 파일이므로 어떤 정적 호스팅(GitHub Pages, Vercel, Netlify 등)에도 그대로 업로드할 수 있습니다.

---

## 🧭 게임 플레이 안내

### 1단계: 영웅 생성
메인 메뉴에서 **⚔ 새로운 영웅**을 누르고 이름을 정하세요. 1일 차에는 이름을 변경할 수 있습니다.

### 2단계: 하루 계획
- **활동** 카드를 눌러 오늘 할 일을 계획에 추가
- 에너지를 소모해 활동을 수행
- 활동별로 다른 보상과 위험이 따릅니다

### 3단계: 위험 관리
- **안전** / **관리 가능** / **위험** / **치명적** 4단계 위험도
- 장비 등급과 보스 준비도가 위험을 크게 낮춥니다
- 10일 차부터 매일 노화로 인한 사망 위험 증가

### 4단계: 생존과 유산
- 12일 차까지 생존하면 **전초기지 주민**으로 정착
- 활동 통계에 따라 8명의 **전초기지 영웅** 중 한 명이 됨
- 사망/은퇴 시 보너스가 다음 모험에 영구 적용

---

## 📂 프로젝트 구조

```
nanoraider/
├── client/                  # 프론트엔드 앱 (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/      # UI 컴포넌트 (화면 + 위젯)
│   │   │   └── screens/     # 7개 화면 컴포넌트
│   │   ├── data/            # 게임 데이터 (활동, 주민, 장비, 레시피, 이벤트)
│   │   ├── game/            # 게임 로직 (위험 계산, 주민 검사, 장비 생성)
│   │   ├── store/           # Zustand 상태 관리 + 영속화
│   │   ├── App.tsx          # 라우팅 (화면 전환)
│   │   ├── main.tsx         # React 부트스트랩
│   │   └── index.css        # Tailwind 진입점
│   ├── public/              # 정적 자산
│   ├── package.json
│   └── vite.config.ts       # base path 설정 포함
├── design/                  # 게임 디자인 문서 (Markdown)
│   ├── vision.md            # 비전과 영감
│   ├── systems.md           # 핵심 시스템
│   └── townspeople.md       # 전초기지 주민 카탈로그
├── .github/workflows/
│   └── deploy.yml           # main 푸시 시 GitHub Pages 자동 배포
├── README.md
├── LICENSE
├── AGENTS.md                # AI 에이전트 지침 (이 저장소 작업 시)
└── AI_AGENT_RULES.md
```

---

## 🎨 디자인 문서

`design/` 폴더에 게임 디자인 결정의 배경이 정리되어 있습니다:

- [**vision.md**](./design/vision.md) — 게임의 비전과 영감
- [**systems.md**](./design/systems.md) — 트라이앵글, 위험도, 보상 시스템
- [**townspeople.md**](./design/townspeople.md) — 전초기지 주민 설계

---

## 🌐 배포

이 저장소는 **GitHub Actions**로 자동 배포됩니다:

- `main` 브랜치에 푸시하면 `client/**` 변경만 감지
- `npm ci && npm run build`로 빌드
- 빌드 결과물(`client/dist`)을 GitHub Pages에 업로드

자세한 내용: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)

---

## 🛠 기술 스택

| 영역 | 사용 기술 |
|------|----------|
| **프레임워크** | React 19 |
| **언어** | TypeScript 5.8 |
| **빌드 도구** | Vite 6 |
| **상태 관리** | Zustand 5 (localStorage 미들웨어) |
| **스타일** | Tailwind CSS 3.4 |
| **린팅** | ESLint 9 + Prettier 3 |
| **배포** | GitHub Actions → GitHub Pages |

---

## 🤝 기여하기

이 저장소는 프로토타입이지만, 아이디어와 개선 제안은 언제나 환영합니다. PR을 보내기 전 다음을 확인해 주세요:

```bash
cd client
npm run lint        # ESLint 통과 필수
npm run typecheck   # TypeScript 통과 필수
```

`AI_AGENT_RULES.md`에 자동화된 품질 표준이 정리되어 있습니다.

---

## 📜 라이선스

이 프로젝트는 [MIT 라이선스](./LICENSE) 하에 배포됩니다.

원본 프로젝트: [rissole/nanoraider](https://github.com/rissole/nanoraider) — © rissole
한글화 및 한국어 배포: [sigco3111/nanoraider](https://github.com/sigco3111/nanoraider) — © sigco3111