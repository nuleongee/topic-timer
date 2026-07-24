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
