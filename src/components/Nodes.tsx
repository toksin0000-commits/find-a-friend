"use client";

const NODES_DELAYS = ['0s', '0.4s', '0.9s', '1.3s', '1.8s', '2.2s', '2.6s', '3s'];

export default function Nodes() {
  return (
    <>
      <div
        className="absolute w-4 h-4 bg-blue-400/90 rounded-full shadow-xl animate-ping"
        style={{
          top: '12%',
          left: '25%',
          animationDelay: NODES_DELAYS[0],
          filter: "blur(1px) drop-shadow(0 0 6px #60a5fa)"
        }}
      />

      <div
        className="absolute w-3 h-3 bg-purple-400/90 rounded-full shadow-xl animate-pulse"
        style={{
          top: '20%',
          right: '10%',
          animationDelay: NODES_DELAYS[1],
          filter: "blur(1px) drop-shadow(0 0 6px #c084fc)"
        }}
      />

      <div
        className="absolute w-5 h-5 bg-emerald-400/90 rounded-full shadow-xl animate-pulse"
        style={{
          top: '20%',
          left: '12%',
          animationDelay: NODES_DELAYS[2],
          filter: "blur(1px) drop-shadow(0 0 6px #34d399)"
        }}
      />

      <div
        className="absolute w-3 h-3 bg-orange-400/90 rounded-full shadow-xl animate-ping"
        style={{
          top: '24%',
          right: '15%',
          animationDelay: NODES_DELAYS[3],
          filter: "blur(1px) drop-shadow(0 0 6px #fb923c)"
        }}
      />

      <div
        className="absolute w-2 h-2 bg-indigo-400/90 rounded-full shadow-xl animate-pulse"
        style={{
          top: '15.3%',
          left: '45%',
          animationDelay: NODES_DELAYS[4],
          filter: "blur(1px) drop-shadow(0 0 6px #818cf8)"
        }}
      />

      <div
        className="absolute w-3 h-3 bg-cyan-400/90 rounded-full shadow-xl animate-ping"
        style={{
          top: '25%',
          left: '30%',
          animationDelay: NODES_DELAYS[5],
          filter: "blur(1px) drop-shadow(0 0 6px #22d3ee)"
        }}
      />

      <div
        className="absolute w-4 h-4 bg-pink-400/90 rounded-full shadow-xl animate-ping"
        style={{
          top: '13%',
          right: '26%',
          animationDelay: NODES_DELAYS[6],
          filter: "blur(1px) drop-shadow(0 0 6px #f472b6)"
        }}
      />

      <div
        className="absolute w-3 h-3 bg-lime-400/90 rounded-full shadow-xl animate-pulse"
        style={{
          top: '25%',
          left: '55%',
          animationDelay: NODES_DELAYS[7],
          filter: "blur(1px) drop-shadow(0 0 6px #a3e635)"
        }}
      />
    </>
  );
}
