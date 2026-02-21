"use client";

import { useRef, CSSProperties, useState } from "react";

const EFFECTS = {
  shake: { enabled: true, intensity: 2, rotation: 2, duration: 250 },
  glow: { enabled: true, size: 35, spread: 12, color: "rgba(0,255,200,0.7)" },
  shortVibration: { enabled: true, strength: 80 },
  longVibration: { enabled: true, strength: 200, delay: 500 },
  breathing: { enabled: true, scale: 1.04, duration: 4000 },
  planetFill: {
    enabled: true,
    base: { from: "white", via: "black", to: "black" },
    active: { from: "black", via: "green", to: "blue" },
  },
};

export default function Globe({
  onClick,
  searching,
}: {
  onClick: () => void;
  searching: boolean;
}) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [clicked, setClicked] = useState(false);

  // 🔒 LOCK proti dvojkliku
  const clickLock = useRef(false);

  const startPress = () => {
    if (EFFECTS.shortVibration.enabled && navigator.vibrate) {
      navigator.vibrate(EFFECTS.shortVibration.strength);
    }

    if (EFFECTS.longVibration.enabled) {
      pressTimer.current = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(EFFECTS.longVibration.strength);
      }, EFFECTS.longVibration.delay);
    }
  };

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const classes = [
    "relative z-20 w-36 h-36 rounded-full flex items-center justify-center",
    "border border-transparent overflow-visible mx-auto",
    "transition-all duration-300",
    "globe-ring-active",
    EFFECTS.breathing.enabled ? "animate-globe-breath" : "",
    EFFECTS.shake.enabled ? "active:animate-globe-shake" : "",
    EFFECTS.glow.enabled
      ? `active:shadow-[0_0_${EFFECTS.glow.size}px_${EFFECTS.glow.spread}px_${EFFECTS.glow.color}]`
      : "",
    EFFECTS.shake.enabled || EFFECTS.glow.enabled ? "active:scale-110" : "",
    EFFECTS.planetFill.enabled ? "planet-fill planet-fill-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
  ["--shake-duration" as any]: `${EFFECTS.shake.duration}ms`,
  ["--breath-scale" as any]: EFFECTS.breathing.scale,
  ["--breath-duration" as any]: `${EFFECTS.breathing.duration}ms`,

  // zachováváš původní proměnné
  ["--planet-from" as any]: EFFECTS.planetFill.base.from,
  ["--planet-via" as any]: EFFECTS.planetFill.base.via,
  ["--planet-to" as any]: EFFECTS.planetFill.base.to,

  ["--planet-active-from" as any]: EFFECTS.planetFill.active.from,
  ["--planet-active-via" as any]: EFFECTS.planetFill.active.via,
  ["--planet-active-to" as any]: EFFECTS.planetFill.active.to,

  // ⭐ TADY SE PŘEPÍNÁ BARVA
  ["--planet-mode" as any]: searching ? "active" : "base",
};

  return (
    <div
      // 🔥 JEDINÝ CLICK HANDLER
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (clickLock.current) return;
        clickLock.current = true;

        setClicked(true);
        onClick();

        // odemkneme po 1s (bezpečné)
        setTimeout(() => {
          clickLock.current = false;
        }, 1000);
      }}
      
      // 🔥 TOUCH → blokujeme default click
      onTouchStart={() => {
  startPress();
}}

onTouchEnd={() => {
  endPress();
}}


      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      className={classes}
      style={style}
    >
      <span className="text-6xl drop-shadow-4xl animate-ping relative z-30">
        🌍
      </span>

      {!clicked && (
        <div className="absolute -bottom-8 flex items-center gap-2 text-white/70 tracking-wide select-none">
          <span className="text-lg opacity-80 relative -top-1.25 blink-left">
            ↑
          </span>
          <span className="text-sm blink-enter">ENTER</span>
          <span className="text-lg opacity-80 relative -top-1.25 blink-right">
            ↑
          </span>
        </div>
      )}
    </div>
  );
}
