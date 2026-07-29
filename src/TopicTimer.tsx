import { useState, useRef, useEffect, useCallback } from "react";

// 사이클마다 순환하는 색 — 곁눈질로도 구분되도록 색상환에서 멀리 떨어진 색들
const CYCLE_COLORS = [
  { name: "앰버", accent: "#F5A524", deep: "#2A1E05" },
  { name: "틸", accent: "#17C3B2", deep: "#04211E" },
  { name: "바이올렛", accent: "#9B6DFF", deep: "#160B2E" },
  { name: "로즈", accent: "#FF5D8F", deep: "#2B0714" },
  { name: "라임", accent: "#A8E10C", deep: "#1A2103" },
  { name: "스카이", accent: "#38BDF8", deep: "#06202E" },
];

// 터치 전용 기기(폰·태블릿)에서는 Space 키 안내를 숨김
const HAS_POINTER = window.matchMedia("(hover: hover)").matches;

const PRESETS = [
  { label: "30초", sec: 30 },
  { label: "1분", sec: 60 },
  { label: "2분", sec: 120 },
  { label: "3분", sec: 180 },
];

// 완료한 토픽의 소요 시간과 당시 목표 인터벌
type TopicRecord = { sec: number; target: number };

const pad2 = (n: number) => String(n).padStart(2, "0");

// 초 → mm:ss (1시간 이상이면 h:mm:ss)
const fmtClock = (sec: number) => {
  const t = Math.floor(sec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
};

// 랩(설정 시간 몇 바퀴째)마다 한 단계씩 진한 색 — 4단계 순환이라 몇 바퀴든 이전 랩과 구분됨
const lapColor = (accent: string, lap: number) => {
  const darken = (Math.max(0, lap) % 4) * 22;
  return darken === 0
    ? accent
    : `color-mix(in srgb, ${accent} ${100 - darken}%, black)`;
};

export default function TopicTimer() {
  const [intervalSec, setIntervalSec] = useState(60);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // 현재 사이클 내 경과(초, 소수)
  const [total, setTotal] = useState(0); // 전체 누적 경과(초) — 스킵·인터벌 변경과 무관
  const [cycle, setCycle] = useState(0); // 0-based → 토픽 번호는 +1
  const [soundOn, setSoundOn] = useState(true);
  const [flash, setFlash] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [records, setRecords] = useState<TopicRecord[]>([]);
  const [showStats, setShowStats] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const totalRef = useRef(0);
  const lapNotifiedRef = useRef(0); // 수동 모드에서 마지막으로 알림한 랩 번호
  const audioCtxRef = useRef<AudioContext | null>(null);

  const beep = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AC =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        audioCtxRef.current = new AC!();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime;
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.25, t + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + i * 0.12);
        osc.stop(t + i * 0.12 + 0.3);
      });
    } catch {
      /* 오디오 미지원 시 무시 */
    }
  }, []);

  const tick = useCallback(
    (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      elapsedRef.current += dt;
      totalRef.current += dt;

      if (mode === "auto") {
        if (elapsedRef.current >= intervalSec) {
          elapsedRef.current -= intervalSec;
          setRecords((r) => [...r, { sec: intervalSec, target: intervalSec }]);
          setCycle((c) => c + 1);
          setFlash(true);
          setTimeout(() => setFlash(false), 260);
          if (soundOn) beep();
        }
      } else {
        // 수동 모드: 넘어가지 않고 설정 시간 배수(1x, 2x, 3x…)마다 신호
        const lap = Math.floor(elapsedRef.current / intervalSec);
        if (lap > lapNotifiedRef.current) {
          lapNotifiedRef.current = lap;
          setFlash(true);
          setTimeout(() => setFlash(false), 260);
          if (soundOn) beep();
        }
      }
      setElapsed(elapsedRef.current);
      setTotal(totalRef.current);
      rafRef.current = requestAnimationFrame(tick);
    },
    [intervalSec, soundOn, beep, mode]
  );

  useEffect(() => {
    if (running) {
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, tick]);

  // 스페이스바 = 시작/일시정지
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const skipToNext = () => {
    // setRecords 업데이터는 지연 실행되므로 리셋 전에 값을 캡처
    const sec = elapsedRef.current;
    setRecords((r) => [...r, { sec, target: intervalSec }]);
    elapsedRef.current = 0;
    lapNotifiedRef.current = 0;
    setElapsed(0);
    setCycle((c) => c + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 260);
    if (soundOn) beep();
  };

  const reset = () => {
    setRunning(false);
    elapsedRef.current = 0;
    lapNotifiedRef.current = 0;
    setElapsed(0);
    totalRef.current = 0;
    setTotal(0);
    setCycle(0);
    setRecords([]);
  };

  const endSession = () => {
    setRunning(false);
    setShowStats(true);
  };

  const changeInterval = (sec: number) => {
    setIntervalSec(sec);
    elapsedRef.current = 0;
    lapNotifiedRef.current = 0;
    setElapsed(0);
    setCustomOpen(false);
  };

  const applyCustom = () => {
    const n = parseInt(customVal, 10);
    if (n >= 5 && n <= 3600) changeInterval(n);
  };

  const color = CYCLE_COLORS[cycle % CYCLE_COLORS.length];
  const overtime = mode === "manual" && elapsed >= intervalSec;
  const remaining = Math.max(0, intervalSec - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(Math.ceil(remaining % 60) % 60).padStart(2, "0");
  const displayTime = overtime
    ? fmtClock(elapsed) // 초과 시 카운트업 (01:01, 01:02…)
    : Math.ceil(remaining) === intervalSec && intervalSec >= 60
      ? `${String(Math.floor(intervalSec / 60)).padStart(2, "0")}:${String(intervalSec % 60).padStart(2, "0")}`
      : `${mm}:${ss}`;

  // 수동 모드: 설정 시간을 넘기면 랩이 올라가고 링이 한 단계 진한 색으로 다시 돈다
  const lap = mode === "manual" ? Math.floor(elapsed / intervalSec) : 0;
  const ringProgress =
    mode === "manual"
      ? (elapsed % intervalSec) / intervalSec
      : Math.min(1, elapsed / intervalSec);

  const totalDisplay = fmtClock(total);

  const doneCount = records.length;
  const avgSec = doneCount ? records.reduce((a, r) => a + r.sec, 0) / doneCount : 0;
  const withinCount = records.filter((r) => r.sec <= r.target).length;

  // 링 지오메트리
  const SIZE = 320;
  const STROKE = 20;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  const isCustomActive = !PRESETS.some((p) => p.sec === intervalSec);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(12px, 3.5vh, 28px)",
        padding:
          "max(clamp(14px, 3.5vh, 32px), env(safe-area-inset-top)) 16px max(clamp(14px, 3.5vh, 32px), env(safe-area-inset-bottom))",
        background: color.deep,
        transition: "background 700ms ease",
        fontFamily:
          "'Pretendard', -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        color: "#EDEDEA",
        userSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {/* 사이클 전환 시 은은한 플래시 오버레이 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#FFFFFF",
          opacity: flash ? 0.5 : 0,
          pointerEvents: "none",
          transition: flash ? "opacity 60ms" : "opacity 350ms ease",
        }}
      />

      {/* 상단: 토픽 카운터 */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "clamp(26px, 6vh, 44px)",
            fontWeight: 800,
            lineHeight: 1,
            color: color.accent,
            transition: "color 700ms ease",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          TOPIC {cycle + 1}
        </div>
      </div>

      {/* 링 타이머 — 주변 요소가 먼저 줄고, 링은 남는 높이(비링 최소 약 210px 제외)만큼 유지 */}
      <div
        style={{
          position: "relative",
          width: `clamp(180px, min(90vw, 100vh - 210px), ${SIZE}px)`,
          aspectRatio: "1",
          containerType: "size",
          cursor: "pointer",
        }}
        onClick={() => (running ? skipToNext() : setRunning(true))}
        title={running ? "클릭하면 이 토픽을 끝내고 다음 토픽으로" : "클릭하면 시작"}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width="100%"
          height="100%"
          style={{ transform: "rotate(-90deg)", display: "block" }}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          {/* 직전 랩까지 채워진 링 (수동 모드에서 설정 시간 초과 시) */}
          {lap > 0 && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={lapColor(color.accent, lap - 1)}
              strokeWidth={STROKE}
            />
          )}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={lapColor(color.accent, lap)}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - ringProgress)}
            style={{ transition: "stroke 700ms ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: "clamp(28px, 22.5cqw, 72px)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Mono', monospace",
              lineHeight: 1,
              color: overtime ? color.accent : undefined,
              transition: "color 300ms ease",
            }}
          >
            {displayTime}
          </div>
          <div
            style={{
              fontSize: "clamp(11px, 4.5cqw, 15px)",
              opacity: 0.45,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.05em",
            }}
          >
            총 {totalDisplay}
          </div>
          <div
            style={{
              fontSize: "clamp(10px, 4cqw, 13px)",
              opacity: 0.5,
              letterSpacing: "0.08em",
            }}
          >
            {running
              ? "터치하면 다음 토픽으로"
              : HAS_POINTER
                ? "터치 또는 Space로 시작"
                : "터치하면 시작"}
          </div>
        </div>
      </div>

      {/* 인터벌 선택 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {PRESETS.map((p) => (
          <button
            key={p.sec}
            onClick={() => changeInterval(p.sec)}
            style={{
              padding: "clamp(5px, 1.2vh, 8px) clamp(10px, 2.4vh, 16px)",
              borderRadius: 999,
              border: "1px solid",
              borderColor: intervalSec === p.sec ? color.accent : "rgba(255,255,255,0.18)",
              background: intervalSec === p.sec ? color.accent : "transparent",
              color: intervalSec === p.sec ? color.deep : "#EDEDEA",
              fontWeight: 700,
              fontSize: "clamp(11px, 2.2vh, 14px)",
              cursor: "pointer",
              transition: "all 300ms ease",
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setCustomOpen((o) => !o)}
          style={{
            padding: "clamp(5px, 1.2vh, 8px) clamp(10px, 2.4vh, 16px)",
            borderRadius: 999,
            border: "1px solid",
            borderColor: isCustomActive ? color.accent : "rgba(255,255,255,0.18)",
            background: isCustomActive ? color.accent : "transparent",
            color: isCustomActive ? color.deep : "#EDEDEA",
            fontWeight: 700,
            fontSize: "clamp(11px, 2.2vh, 14px)",
            cursor: "pointer",
          }}
        >
          {isCustomActive ? `${intervalSec}초` : "직접 입력"}
        </button>
      </div>

      {/* 세션 통계 오버레이 */}
      {showStats && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            background: color.deep,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: color.accent }}>
            세션 통계
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto",
              gap: "14px 28px",
              fontSize: 17,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span style={{ opacity: 0.6 }}>완료 토픽</span>
            <span style={{ fontWeight: 700, textAlign: "right" }}>{doneCount}개</span>
            <span style={{ opacity: 0.6 }}>세션 총 시간</span>
            <span style={{ fontWeight: 700, textAlign: "right" }}>{totalDisplay}</span>
            <span style={{ opacity: 0.6 }}>토픽당 평균</span>
            <span style={{ fontWeight: 700, textAlign: "right" }}>
              {doneCount ? fmtClock(avgSec) : "-"}
            </span>
            <span style={{ opacity: 0.6 }}>목표 내 완료</span>
            <span style={{ fontWeight: 700, textAlign: "right" }}>
              {doneCount
                ? `${withinCount}/${doneCount} (${Math.round((withinCount / doneCount) * 100)}%)`
                : "-"}
            </span>
          </div>
          <button
            onClick={() => {
              reset();
              setShowStats(false);
            }}
            style={{
              padding: "12px 32px",
              borderRadius: 12,
              border: "none",
              background: color.accent,
              color: color.deep,
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            새 세션 시작
          </button>
        </div>
      )}

      {customOpen && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            min={5}
            max={3600}
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
            placeholder="초 단위 (예: 90)"
            style={{
              width: 140,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.06)",
              color: "#EDEDEA",
              fontSize: 16,
              outline: "none",
            }}
          />
          <button
            onClick={applyCustom}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: color.accent,
              color: color.deep,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            적용
          </button>
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: "clamp(8px, 1.8vh, 12px) clamp(20px, 5vh, 32px)",
            borderRadius: 12,
            border: "none",
            background: color.accent,
            color: color.deep,
            fontWeight: 800,
            fontSize: "clamp(13px, 2.5vh, 16px)",
            cursor: "pointer",
            transition: "background 700ms ease",
          }}
        >
          {running ? "일시정지" : "시작"}
        </button>
        <button
          onClick={reset}
          style={{
            padding: "clamp(8px, 1.8vh, 12px) clamp(12px, 3vh, 20px)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#EDEDEA",
            fontWeight: 600,
            fontSize: "clamp(12px, 2.3vh, 15px)",
            cursor: "pointer",
          }}
        >
          리셋
        </button>
        <button
          onClick={endSession}
          title="세션을 끝내고 통계 보기"
          style={{
            padding: "clamp(8px, 1.8vh, 12px) clamp(12px, 3vh, 20px)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#EDEDEA",
            fontWeight: 600,
            fontSize: "clamp(12px, 2.3vh, 15px)",
            cursor: "pointer",
          }}
        >
          종료
        </button>
        <button
          onClick={() => {
            lapNotifiedRef.current = 0;
            setMode((m) => (m === "auto" ? "manual" : "auto"));
          }}
          title="시간이 다 되면 자동으로 넘길지, 터치로 넘길지"
          style={{
            padding: "clamp(8px, 1.8vh, 12px) clamp(12px, 3vh, 20px)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: mode === "manual" ? "rgba(255,255,255,0.1)" : "transparent",
            color: "#EDEDEA",
            fontWeight: 600,
            fontSize: "clamp(12px, 2.3vh, 15px)",
            cursor: "pointer",
          }}
        >
          {mode === "auto" ? "자동 넘김" : "터치 넘김"}
        </button>
        <button
          onClick={() => setSoundOn((s) => !s)}
          title="사이클 전환 알림음"
          style={{
            padding: "clamp(8px, 1.8vh, 12px) clamp(10px, 2.5vh, 16px)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: soundOn ? "rgba(255,255,255,0.1)" : "transparent",
            color: "#EDEDEA",
            fontSize: "clamp(12px, 2.3vh, 15px)",
            cursor: "pointer",
          }}
        >
          {soundOn ? "🔔" : "🔕"}
        </button>
      </div>

    </div>
  );
}
