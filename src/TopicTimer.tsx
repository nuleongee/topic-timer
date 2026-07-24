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

const PRESETS = [
  { label: "30초", sec: 30 },
  { label: "1분", sec: 60 },
  { label: "2분", sec: 120 },
  { label: "3분", sec: 180 },
];

export default function TopicTimer() {
  const [intervalSec, setIntervalSec] = useState(60);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // 현재 사이클 내 경과(초, 소수)
  const [cycle, setCycle] = useState(0); // 0-based → 토픽 번호는 +1
  const [soundOn, setSoundOn] = useState(true);
  const [flash, setFlash] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
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

      if (elapsedRef.current >= intervalSec) {
        elapsedRef.current -= intervalSec;
        setCycle((c) => c + 1);
        setFlash(true);
        setTimeout(() => setFlash(false), 260);
        if (soundOn) beep();
      }
      setElapsed(elapsedRef.current);
      rafRef.current = requestAnimationFrame(tick);
    },
    [intervalSec, soundOn, beep]
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
    elapsedRef.current = 0;
    setElapsed(0);
    setCycle((c) => c + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 260);
    if (soundOn) beep();
  };

  const reset = () => {
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
    setCycle(0);
  };

  const changeInterval = (sec: number) => {
    setIntervalSec(sec);
    elapsedRef.current = 0;
    setElapsed(0);
    setCustomOpen(false);
  };

  const applyCustom = () => {
    const n = parseInt(customVal, 10);
    if (n >= 5 && n <= 3600) changeInterval(n);
  };

  const color = CYCLE_COLORS[cycle % CYCLE_COLORS.length];
  const remaining = Math.max(0, intervalSec - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(Math.ceil(remaining % 60) % 60).padStart(2, "0");
  const displayTime =
    Math.ceil(remaining) === intervalSec && intervalSec >= 60
      ? `${String(Math.floor(intervalSec / 60)).padStart(2, "0")}:${String(intervalSec % 60).padStart(2, "0")}`
      : `${mm}:${ss}`;

  const progress = Math.min(1, elapsed / intervalSec);

  // 링 지오메트리
  const SIZE = 320;
  const STROKE = 14;
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
        gap: 28,
        padding: "32px 16px",
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
            fontSize: 12,
            letterSpacing: "0.25em",
            opacity: 0.55,
            marginBottom: 6,
          }}
        >
          지금 보는 토픽
        </div>
        <div
          style={{
            fontSize: 44,
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

      {/* 링 타이머 — 작은 창에서는 남는 높이(비링 요소 약 340px 제외)에 맞춰 축소 */}
      <div
        style={{
          position: "relative",
          width: `clamp(140px, min(90vw, 100vh - 340px), ${SIZE}px)`,
          aspectRatio: "1",
          containerType: "size",
          cursor: "pointer",
        }}
        onClick={skipToNext}
        title="클릭하면 이 토픽을 끝내고 다음 토픽으로"
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
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color.accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
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
            }}
          >
            {displayTime}
          </div>
          <div
            style={{
              fontSize: "clamp(10px, 4cqw, 13px)",
              opacity: 0.5,
              letterSpacing: "0.08em",
            }}
          >
            {running ? "터치하면 다음 토픽으로" : "Space 또는 시작 버튼으로 시작"}
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
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid",
              borderColor: intervalSec === p.sec ? color.accent : "rgba(255,255,255,0.18)",
              background: intervalSec === p.sec ? color.accent : "transparent",
              color: intervalSec === p.sec ? color.deep : "#EDEDEA",
              fontWeight: 700,
              fontSize: 14,
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
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid",
            borderColor: isCustomActive ? color.accent : "rgba(255,255,255,0.18)",
            background: isCustomActive ? color.accent : "transparent",
            color: isCustomActive ? color.deep : "#EDEDEA",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {isCustomActive ? `${intervalSec}초` : "직접 입력"}
        </button>
      </div>

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
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: "12px 32px",
            borderRadius: 12,
            border: "none",
            background: color.accent,
            color: color.deep,
            fontWeight: 800,
            fontSize: 16,
            cursor: "pointer",
            transition: "background 700ms ease",
          }}
        >
          {running ? "일시정지" : "시작"}
        </button>
        <button
          onClick={reset}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#EDEDEA",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          리셋
        </button>
        <button
          onClick={() => setSoundOn((s) => !s)}
          title="사이클 전환 알림음"
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: soundOn ? "rgba(255,255,255,0.1)" : "transparent",
            color: "#EDEDEA",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          {soundOn ? "🔔" : "🔕"}
        </button>
      </div>

      {/* 다음 색 미리보기 */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", opacity: 0.7 }}>
        <span style={{ fontSize: 12, marginRight: 4 }}>색 순환</span>
        {CYCLE_COLORS.map((c, i) => (
          <span
            key={c.name}
            style={{
              width: i === cycle % CYCLE_COLORS.length ? 14 : 8,
              height: i === cycle % CYCLE_COLORS.length ? 14 : 8,
              borderRadius: "50%",
              background: c.accent,
              transition: "all 300ms ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
