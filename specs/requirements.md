# 토픽 타이머 PWA — 요구사항

## 개요

발표·스터디에서 토픽을 일정 간격으로 전환하도록 알려주는 인터벌 타이머.
Claude 아티팩트(`artifact/topic-timer.jsx`)로 검증한 UI를 설치 가능한 PWA로
전환하여 Vercel에 배포한다.

## 기능 요구사항

### FR-1. 타이머 (초기 이식은 아티팩트 UX 동일, 이후 사용자 피드백으로 조정)

- 링 프로그레스 + mm:ss 남은 시간 표시, requestAnimationFrame 기반 진행
- 인터벌 프리셋: 30초 / 1분 / 2분 / 3분, 직접 입력(5–3600초)
- 사이클(토픽) 전환 시: 카운터 +1, 6색 순환(앰버→틸→바이올렛→로즈→라임→스카이),
  배경색 전환, 화이트 플래시, 알림음(Web Audio 2음 비프)
- 조작: 시작/일시정지 버튼, Space 키 토글, 리셋, 사운드 on/off 토글
- 링 터치: 시작 전/일시정지 중엔 시작, 실행 중엔 다음 토픽 스킵 (T9)
- 총 누적 시간을 링 안에 작게 표시 — 스킵·인터벌 변경과 무관하게 누적,
  일시정지 시 멈춤, 리셋 시 0, 1시간 이상이면 h:mm:ss (T11)
- ~~"지금 보는 토픽" 라벨, 색 순환 도트~~ — UI 다이어트로 제거 (T9)

### FR-2. PWA

- FR-2.1 설치 가능: Web App Manifest(name/short_name/icons/display: standalone)
- FR-2.2 오프라인 동작: 서비스 워커가 앱 셸(JS/CSS/HTML/아이콘) 프리캐시
- FR-2.3 자동 업데이트: 새 배포 감지 시 사용자 개입 없이 갱신(autoUpdate)
- FR-2.4 아이콘: 192/512 PNG, 512 maskable, apple-touch-icon, favicon

### FR-3. 배포

- 정적 빌드 산출물(`dist/`)로 Vercel zero-config 배포 가능
- 이번 범위는 배포 준비까지 (실제 배포는 사용자가 수행)

## 비기능 요구사항

- TypeScript, Vite + React
- 런타임 외부 의존성 없음 (react, react-dom만)
- 모바일·데스크톱 브라우저 동작 (기존 컴포넌트가 반응형 처리)

## 제외 범위

- 서버 기능, 계정, 데이터 저장(localStorage 등) — 원본에 없는 기능 추가 금지
- 업데이트 알림 UI(ReloadPrompt) — autoUpdate로 대체
