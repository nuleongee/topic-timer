# 토픽 타이머 PWA — 설계

## 기술 스택과 근거

| 선택 | 근거 |
|------|------|
| Vite 7 + React 19 | 단일 화면 클라이언트 전용 앱에 최경량. Vercel zero-config 지원 |
| TypeScript | 사용자 결정. 컴포넌트를 .tsx로 변환 |
| vite-plugin-pwa | manifest·서비스 워커(Workbox) 자동 생성. registerType: autoUpdate |
| @vite-pwa/assets-generator | icon.svg 하나에서 전체 아이콘 세트 생성 (일회성 npx) |

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

## Vercel

- 프레임워크 자동 감지(Vite): build `vite build`, output `dist/`
- SPA 라우팅 없음 → vercel.json 불필요
