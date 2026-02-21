"use client";

export default function Nebula() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="nebula-layer" />
      <style jsx>{`
        .nebula-layer {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(
              circle at 20% 30%,
              rgba(80, 0, 180, 0.22),
              transparent 65%
            ),
            radial-gradient(
              circle at 80% 40%,
              rgba(0, 120, 180, 0.22),
              transparent 65%
            ),
            radial-gradient(
              circle at 50% 80%,
              rgba(0, 160, 100, 0.18),
              transparent 75%
            );
          filter: blur(70px);
          animation: nebula-fade 8s ease-in-out infinite alternate,
                     nebula-move 22s ease-in-out infinite alternate;
        }

        @keyframes nebula-fade {
          0%   { opacity: 0.55; }
          50%  { opacity: 0.0; }
          100% { opacity: 0.55; }
        }

        @keyframes nebula-move {
          0%   { transform: scale(1) translate(0px, 0px); }
          50%  { transform: scale(1.08) translate(-20px, 10px); }
          100% { transform: scale(1.03) translate(10px, -15px); }
        }
      `}</style>
    </div>
  );
}
