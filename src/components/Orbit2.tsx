"use client";

import { useRef, useEffect } from "react";

export default function Orbit2({ onStopSearch }: { onStopSearch: () => void }) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orbit2SoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    orbit2SoundRef.current = new Audio("/sounds/orbit2.mp3");
    orbit2SoundRef.current.load();
  }, []);

  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(200);
    }, 500);
  };

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleClick = () => {
    // 🔥 1) ZASTAVIT HLEDÁNÍ + ZVUK HLEDÁNÍ
    onStopSearch();

    // 🔊 2) PŘEHRÁT ZVUK ORBIT2
    const s = orbit2SoundRef.current;
    if (s) {
      s.currentTime = 0;
      s.play().catch(() => {});
    }

    const el = document.getElementById("orbit2");
    if (!el) return;

    el.classList.add("haptic", "orbit2-active");

    if (navigator.vibrate) navigator.vibrate(80);

    setTimeout(() => {
      el.classList.remove("haptic", "orbit2-active");

      // 🔥 OPRAVA: žádné nové okno
      window.location.href = "/me";
    }, 150);
  };

  return (
    <div
      id="orbit2"
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className="
        absolute -top-25 -left-10 w-20 h-20 
        bg-linear-to-b from-darkblue-400/60 via-blue-400/60 to-darkblue-400/60 
        rounded-full opacity-70 shadow-xl z-5 flex items-center justify-center
        orbit2-move cursor-pointer
        transition-all duration-150
      "
    >
      <span className="text-[22px] font-[250] tracking-[2px] text-white select-none pointer-events-none">
        ME
      </span>
    </div>
  );
}
