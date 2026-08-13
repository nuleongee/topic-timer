# 토픽 타이머 PWA — 작업 체크리스트

- [x] T0. specs/ 문서 생성 (requirements, design, tasks)
- [x] T1. 스캐폴딩: package.json, vite.config.ts, tsconfig, index.html,
      .gitignore, src/main.tsx, src/vite-env.d.ts + npm install
- [x] T2. TopicTimer.tsx 이식 (artifact → src, 타입만 추가)
- [x] T3. 아이콘: public/icon.svg 제작 + assets-generator로 세트 생성
- [x] T4. PWA 설정: VitePWA manifest/workbox + registerSW
- [x] T5. 검증: npm run build (manifest.webmanifest·sw.js 확인)
      → npm run preview + agent-browser (렌더·SW 등록·타이머 동작)
- [x] T6. 커밋 (기능별 분리) + Vercel 배포 방법 안내
- [x] T7. 작은 창 스크롤 버그 수정: box-sizing 리셋 + 링/폰트 반응형 축소
      (570×760·500×600·400×520 스크롤 없음, 1280×900 기존 크기 유지 검증)
- [x] T8. 축소 우선순위 변경(링 유지, 텍스트·버튼 축소) + 링 스트로크 20px
      (500×600 링 320 유지, 400×520 링 270·360×450 링 200 스크롤 없음 검증)
- [x] T9. UI 다이어트: "지금 보는 토픽" 라벨·색 순환 도트 제거,
      링 터치를 시작 전엔 시작 / 실행 중엔 다음 토픽으로 분기,
      링 여유값 250→210px (400×520 링 310, 스크롤 없음 검증)
- [x] T10. 아이콘 리디자인(그라데이션+글로우, macOS용 투명 여백 스쿼클로
      독 아이콘 하얀 테두리 제거) + Space 안내 문구 터치 기기에서 숨김
- [x] T11. 총 누적 시간 링 안에 표시 (스킵 후에도 누적 유지·리셋 0 검증)
- [x] T12. 모바일 앱 대응: 핀치 줌 방지 + iOS 상태 바 흰색 문제 수정
      (black-translucent + safe-area 패딩, 데스크톱 스크롤 회귀 없음 검증)
- [x] T13. 자동/수동 모드 토글 + 수동 초과 카운트업 + 토픽별 기록 +
      종료 버튼 → 세션 통계 화면
      (수동: 5초 인터벌 초과 시 카운트업·색 강조·미전환, 터치로 기록,
      통계 2개/총 00:09/평균 00:04/목표 내 1/2 정확성 검증, 자동 모드 회귀 통과.
      setRecords 지연 실행으로 소요 시간이 0으로 기록되던 버그 수정)
- [x] T14. 스크롤 잠금: overflow hidden + overscroll-behavior none
      (강제 scrollTo에도 scrollY 0 고정, 400×520 콘텐츠 전부 표시 검증)
- [x] T15. 수동 모드 랩 링: 설정 시간마다 진한 색으로 링 반복 진행 +
      매 배수마다 플래시·알림음 (랩 1·2·4 색 순환과 구분성 검증)
- [x] T16. 하단 갈색 고정 영역 수정: height 100% 체인 + html/body 배경·
      theme-color 토픽 색 동기화 (컨테이너=뷰포트 일치, 틸 전환 동기화 검증)
- [x] T17. 플래시 오버레이 세이프에어리어까지 확장 + 시작/일시정지 버튼
      폭 8em 고정으로 상태 전환 시 줄바꿈 레이아웃 이동 제거
      (400×700에서 클릭 전후 버튼 좌표 동일 검증)
- [x] T18. 플래시를 html/body 캔버스 배경에도 적용 — env() 미적용 기기에서
      fixed 오버레이가 못 닿는 하단 영역까지 확실히 번쩍이게
      (전환 순간 50% 화이트 혼합, 350ms 페이드 복귀 검증)
- [x] T19. 터치 넘김을 기본 모드로 + Space를 링 터치와 동일 분기로 변경
      (시작 전 Space=시작, 실행 중 Space=다음 토픽, 일시정지는 버튼 전용,
      안내 문구 갱신)
