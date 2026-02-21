"use client";

export default function StarDust() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="stardust-layer" />
      <style jsx>{`
        .stardust-layer {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.08), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(180, 120, 255, 0.08), transparent 65%),
            radial-gradient(circle at 40% 75%, rgba(120, 200, 255, 0.07), transparent 70%),
            radial-gradient(circle at 85% 60%, rgba(255, 180, 220, 0.06), transparent 70%);
          filter: blur(35px);
          animation: stardust-fade 4s ease-in-out infinite alternate,
                     stardust-move 26s ease-in-out infinite alternate;
        }

        @keyframes stardust-fade {
          0%   { opacity: 0.55; }
          50%  { opacity: 0.05; }
          100% { opacity: 0.55; }
        }

        @keyframes stardust-move {
          0%   { transform: scale(1) translate(0px, 0px); }
          50%  { transform: scale(1.06) translate(-12px, 8px); }
          100% { transform: scale(1.02) translate(10px, -10px); }
        }
      `}</style>
    </div>
  );
}
