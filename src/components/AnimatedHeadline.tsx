"use client";

import { useEffect, useState } from "react";

export default function AnimatedHeadline() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = [
      () => setStep(1), // show "real"
      () => setStep(2), // show "human"
      () => setStep(3), // show "connection"
      () => setStep(4), // fade out
      () => setStep(0), // reset
    ];

    let i = 0;

    const run = () => {
      sequence[i]();
      i = (i + 1) % sequence.length;
    };

    run(); // start immediately
    const interval = setInterval(run, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-lg font-medium text-slate-400 tracking-wider uppercase mt-6 flex gap-3">
      <span
        className={`transition-opacity duration-1000 ${
          step >= 1 && step < 4 ? "opacity-100" : "opacity-0"
        }`}
      >
        real
      </span>

      <span
        className={`transition-opacity duration-1000 ${
          step >= 2 && step < 4 ? "opacity-100" : "opacity-0"
        }`}
      >
        human
      </span>

      <span
        className={`transition-opacity duration-1000 ${
          step >= 3 && step < 4 ? "opacity-100" : "opacity-0"
        }`}
      >
        connection
      </span>
    </p>
  );
}
