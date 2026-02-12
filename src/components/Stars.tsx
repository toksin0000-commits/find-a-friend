"use client";

type Star = {
  size: number;
  top: number;
  left: number;
  opacity: number;
};

// ⭐ Statické hvězdy – žádné random, žádné hooky, žádné chyby
const STARS: Star[] = [
  
  { size: 1.4, top: 72.7, left: 23.4, opacity: 0.31 },
  { size: 2.6, top: 51.5, left: 31.4, opacity: 0.52 },
  { size: 2.3, top: 69.8, left: 94.0, opacity: 0.67 },
  { size: 1.7, top: 59.4, left: 45.9, opacity: 0.91 },
  { size: 2.5, top: 55.3, left: 69.7, opacity: 0.49 },
  { size: 1.6, top: 27.1, left: 9.7, opacity: 0.56 },
  { size: 2.6, top: 61.6, left: 4.8, opacity: 0.46 },
  { size: 1.8, top: 23.4, left: 74.0, opacity: 0.88 },
  { size: 2.0, top: 22.4, left: 25.6, opacity: 0.94 },
  { size: 2.9, top: 28.6, left: 23.5, opacity: 0.36 },

  { size: 1.3, top: 12.4, left: 64.1, opacity: 0.42 },
  { size: 2.1, top: 44.7, left: 18.3, opacity: 0.77 },
  { size: 1.9, top: 83.2, left: 52.9, opacity: 0.58 },
  { size: 2.4, top: 66.1, left: 11.7, opacity: 0.63 },
  { size: 1.2, top: 33.8, left: 87.4, opacity: 0.29 },
  { size: 2.7, top: 14.9, left: 42.3, opacity: 0.71 },
  { size: 1.5, top: 91.2, left: 7.4, opacity: 0.54 },
  { size: 2.8, top: 48.6, left: 79.1, opacity: 0.82 },
  { size: 1.1, top: 36.4, left: 56.2, opacity: 0.33 },
  { size: 2.2, top: 73.5, left: 28.9, opacity: 0.68 },

  { size: 1.6, top: 19.7, left: 14.8, opacity: 0.47 },
  { size: 2.3, top: 62.1, left: 91.3, opacity: 0.59 },
  { size: 1.8, top: 87.4, left: 33.1, opacity: 0.74 },
  { size: 2.9, top: 41.2, left: 68.4, opacity: 0.81 },
  { size: 1.7, top: 53.9, left: 4.2, opacity: 0.39 },
  { size: 2.4, top: 27.3, left: 59.7, opacity: 0.66 },
  { size: 1.3, top: 11.8, left: 22.9, opacity: 0.44 },
  { size: 2.5, top: 95.1, left: 48.3, opacity: 0.79 },
  { size: 1.9, top: 63.4, left: 72.8, opacity: 0.51 },
  { size: 2.6, top: 38.7, left: 16.4, opacity: 0.83 },

  { size: 1.4, top: 29.1, left: 81.2, opacity: 0.37 },
  { size: 2.2, top: 76.8, left: 54.9, opacity: 0.62 },
  { size: 1.5, top: 47.3, left: 9.1, opacity: 0.48 },
  { size: 2.7, top: 58.6, left: 39.4, opacity: 0.85 },
  { size: 1.8, top: 34.2, left: 67.1, opacity: 0.53 },
  { size: 2.9, top: 82.4, left: 12.7, opacity: 0.91 },
  { size: 1.2, top: 17.6, left: 49.8, opacity: 0.41 },
  { size: 2.3, top: 69.9, left: 26.4, opacity: 0.72 },
  { size: 1.7, top: 55.1, left: 93.7, opacity: 0.58 },
  { size: 2.8, top: 24.3, left: 36.1, opacity: 0.87 },

  { size: 1.3, top: 88.2, left: 61.4, opacity: 0.46 },
  { size: 2.1, top: 43.7, left: 75.9, opacity: 0.69 },
  { size: 1.9, top: 31.4, left: 5.8, opacity: 0.52 },
  { size: 2.4, top: 97.1, left: 29.3, opacity: 0.81 },
  { size: 1.6, top: 63.8, left: 84.2, opacity: 0.49 },
  { size: 2.7, top: 12.9, left: 57.6, opacity: 0.78 },
  { size: 1.4, top: 46.1, left: 18.7, opacity: 0.43 },
  { size: 2.5, top: 79.4, left: 92.1, opacity: 0.73 },
  { size: 1.8, top: 28.7, left: 33.9, opacity: 0.57 },
  { size: 2.9, top: 67.2, left: 47.5, opacity: 0.89 },
];

  // … pokud chceš, vygeneruju ti všech 60


export default function Stars() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-0">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-fade"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.opacity,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes starFade {
          0% {
            opacity: 1;
          }
          20% {
            opacity: 0.2;
          }
          100% {
            opacity: 1;
          }
        }

        .star-fade {
          animation: starFade 18s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
