"use client";

import { useState, useRef, useEffect } from "react";

export default function GuideButton() {
  const [showGuide, setShowGuide] = useState(false);

  // AUDIO – vytvoří se jednou a je připravené
  const clickSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickSound.current = new Audio("/click.mp3");
    clickSound.current.volume = 0.4;
  }, []);

  const playSound = () => {
    if (clickSound.current) {
      clickSound.current.currentTime = 0;
      clickSound.current.play();
    }
  };

  return (
    <>
      {/* BUTTON */}
      <button
        className="absolute bottom-6 right-6 text-white/70 hover:text-white text-xl z-50 opacity-0 animate-pulse [animation-delay:0.3s]"
        onClick={() => {
          playSound();
          setShowGuide(true);
        }}
      >
        ❔
      </button>

      {/* MODAL */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-xl w-80 shadow-xl">
            <h2 className="text-lg font-bold mb-3">How it works</h2>

            <ul style={{ lineHeight: 1.9 }} className="text-sm">
              <li>Tap the globe to start searching.</li>
              <li>You don’t need a profile to search.</li>
              <li>You don’t need preferences to search.</li>
              <li>When a match is found, chat opens.</li>
              <li>“ME” shows your own profile.</li>
              <li>“YOU” shows the person you're looking for.</li>
              <li>You can change it anytime.</li>
            </ul>

            <button
              className="mt-4 w-full bg-black text-white py-2 rounded-lg"
              onClick={() => {
                playSound();
                setShowGuide(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
