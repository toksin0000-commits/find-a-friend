"use client";

import { useRef, useEffect } from "react";

export default function Orbit1({ onStopSearch }: { onStopSearch: () => void }) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orbit1SoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    orbit1SoundRef.current = new Audio("/sounds/orbit1.mp3");
    orbit1SoundRef.current.load();
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

    // 🔊 2) PŘEHRÁT ZVUK ORBIT1
    const s = orbit1SoundRef.current;
    if (s) {
      s.currentTime = 0;
      s.play().catch(() => {});
    }

    const el = document.getElementById("orbit1");
    if (!el) return;

    el.classList.add("haptic", "orbit-active-pink", "orbit-ring");

    if (navigator.vibrate) navigator.vibrate(80);

    setTimeout(() => {
      el.classList.remove("haptic", "orbit-active-pink", "orbit-ring");

      // 🔥 OPRAVA: žádné nové okno
      window.location.href = "/you";
    }, 150);
  };

  return (
    <div
      id="orbit1"
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className="
        absolute -top-25 -right-10 w-20 h-20 
        bg-linear-to-b from-darkgreen-400/60 via-green-400/60 to-darkgreen-400/60
        rounded-full opacity-70 shadow-xl z-5 flex items-center justify-center
        orbit1-move cursor-pointer transition-all duration-150
      "
    >
      <span className="text-[22px] font-[250] tracking-[2px] text-white select-none pointer-events-none">
        YOU
      </span>
    </div>
  );
}
