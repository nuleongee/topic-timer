# 토픽 타이머 PWA — 설계

## 기술 스택과 근거

| 선택 | 근거 |
|------|------|
| Vite 7 + React 19 | 단일 화면 클라이언트 전용 앱에 최경량. Vercel zero-config 지원 |
| TypeScript | 사용자 결정. 컴포넌트를 .tsx로 변환 |
| vite-plugin-pwa | manifest·서비스 워커(Workbox) 자동 생성. registerType: autoUpdate |
| sharp + png-to-ico | scripts/generate-icons.mjs로 SVG 2종에서 아이콘 세트 생성 (--no-save 설치) |

## 프로젝트 구조

    /
    ├── specs/               # SDD 문서 (이 문서들)
    ├── artifact/            # 원본 아티팩트 (보존, 수정 금지)
    ├── public/              # icon.svg + 생성된 아이콘들
    ├── src/
    │   ├── main.tsx         # 엔트리 + registerSW({ immediate: true })
    │   ├── TopicTimer.tsx   # artifact/topic-timer.jsx 이식 (로직 동일)
    │   └── vite-env.d.ts
    ├── index.html           # lang=ko, theme-color, apple-touch-icon
    ├── vite.config.ts       # react + VitePWA 플러그인
    └── tsconfig.json

## PWA 설정 (vite.config.ts)

- registerType: 'autoUpdate' — 새 버전 자동 적용
- manifest: name/short_name '토픽 타이머', lang 'ko', display 'standalone',
  orientation 'portrait', theme_color/background_color '#2A1E05'(앰버 deep),
  icons 64/192/512 + 512(maskable)
- workbox.globPatterns: ['**/*.{js,css,html,ico,png,svg}'] — 앱 셸 프리캐시
- ReloadPrompt UI는 만들지 않음 (autoUpdate로 충분, 단순성 우선)

## TopicTimer.tsx 변환 방침

- 로직·스타일·UX 무변경. 타입 주석만 추가:
  - useRef 제네릭(number|null, AudioContext|null), 이벤트 파라미터 타입
  - webkitAudioContext 접근 시 타입 캐스트 1곳
- 원본 artifact/topic-timer.jsx는 참조용으로 보존

## 작은 창 대응 (설치형 PWA 창 리사이즈)

- index.html에 `box-sizing: border-box` 전역 리셋 — content-box에서는
  `minHeight: 100vh` + 상하 패딩 64px가 뷰포트 밖으로 더해져 상시 스크롤 발생
- 축소 우선순위: 링이 주인공 — 작은 창에서는 헤더·버튼·gap·패딩이 먼저
  vh 기반 clamp()로 줄고, 링은 남는 높이를 차지
  (`clamp(180px, min(90vw, 100vh - 250px), 320px)`, 250px = 비링 요소 최소 높이 합)
- SVG는 viewBox 스케일링, 시간·안내 폰트는 컨테이너 쿼리 단위(cqw)로 링에 비례
- 링 스트로크 14 → 20px (사용자 피드백: 원형 선이 얇음)

## 아이콘 전략 (T10)

- `icon.svg` — 투명 여백 + 스쿼클(라운드 사각형). macOS 독·파비콘·pwa-*.png용.
  Chrome이 macOS 앱 아이콘 생성 시 여백 없는 아이콘을 흰 컨테이너에 얹는
  문제(하얀 테두리)를 회피
- `icon-square.svg` — 풀블리드. iOS apple-touch-icon(iOS가 자체 라운딩)과
  maskable(콘텐츠는 중앙 80% 안전영역)용
- 디자인: 라디얼 그라데이션 배경 + 앰버 그라데이션 아크 + 글로우
- 재생성: `npm i --no-save sharp png-to-ico && node scripts/generate-icons.mjs`

## 진행 모드·통계 (T13)

- 상태: `mode`("auto"|"manual", 기본 "manual" — T19), `records`({sec, target}[]), `showStats`,
  `overtimeNotifiedRef`(초과 알림 1회 보장)
- tick 분기: auto — 기존 wrap+advance. manual — elapsed 계속 증가,
  intervalSec 최초 통과 시 beep+flash 1회만
- 토픽 완료 경로(터치/자동/스킵) 공통으로 records에 {sec: 소요, target: 당시 인터벌} 추가
- 수동 초과 표시: displayTime을 elapsed 카운트업(mm:ss)으로 전환, 텍스트 색 accent
- 수동 랩 링(T15): 설정 시간마다 링이 다시 돌며 한 단계 진한 색
  (color-mix로 22%씩, 4단계 순환이라 몇 바퀴든 이전 랩과 구분),
  직전 랩은 풀링으로 아래 깔림. 알림음+플래시는 매 배수(1x, 2x…)마다 발생
- 통계: 완료 수, 세션 총 시간(total), 평균(sum(sec)/n), 목표 내 완료(sec<=target)
- UI: 컨트롤 줄에 모드 토글 버튼("자동 넘김"/"터치 넘김")과 종료 버튼 추가,
  통계는 전체 화면 오버레이

## 모바일 설치형 앱 대응 (T12)

- 줌 방지: viewport 메타 `maximum-scale=1, user-scalable=no`
  (설치형 standalone 앱에서는 iOS도 존중)
- 스크롤 잠금(T14): html/body `height:100%; overflow:hidden;
  overscroll-behavior:none` — 콘텐츠는 반응형 축소로 항상 화면 안에 들어오므로
  빈 스크롤·iOS 고무줄 바운스를 문서 레벨에서 차단
- 하단 갈색 고정 영역 수정(T16): 컨테이너를 100vh 대신 html→body→#root→컨테이너
  height:100% 체인으로 뷰포트에 정확히 맞추고, html/body 배경·theme-color를
  현재 토픽 deep 색과 useEffect로 동기화 — 틈이 노출돼도 첫 색으로 고정되지 않음
- iOS 상태 바 흰색 문제: 기본 status-bar-style이 흰 배경이라 발생 →
  `apple-mobile-web-app-status-bar-style: black-translucent`로 투명화하고
  `viewport-fit=cover` + 컨테이너 safe-area-inset 패딩으로 앱 배경이
  상태 바 뒤까지 깔리게 처리. html 요소 배경도 다크로 지정

## 플랫폼별 안내 문구

- `(hover: hover)` 미디어 쿼리로 판별: 터치 전용 기기는 "터치하면 시작",
  마우스/키보드 기기는 "터치 또는 Space로 시작"
- Space 키 동작(T19): 링 터치와 동일 분기 — 시작 전엔 시작, 실행 중엔
  skipToNext(). 일시정지는 버튼 전용. keydown 리스너는 deps 없는 useEffect로
  매 렌더 재등록해 항상 최신 running/skipToNext를 참조

## Vercel

- 프레임워크 자동 감지(Vite): build `vite build`, output `dist/`
- SPA 라우팅 없음 → vercel.json 불필요
